import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../../config/supabase.config';
import { 
  StockMovementDto, 
  UpdateStockDto, 
  StockMovementResponseDto, 
  LowStockProductDto,
  StockMovementType 
} from './dto/inventory.dto';
import { PaginationDto } from '../../common/dto/common.dto';

@Injectable()
export class InventoryService {
  private supabase;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
  }

  async recordStockMovement(
    adminId: string,
    stockMovementDto: StockMovementDto,
  ): Promise<StockMovementResponseDto> {
    const { productId, type, quantity, reason, reference } = stockMovementDto;

    const { data: product, error: productError } = await this.supabase
      .from('product')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const previousStock = product.stock;
    let newStock: number;

    // Calculate new stock based on movement type
    switch (type) {
      case StockMovementType.IN:
      case StockMovementType.RETURN:
        newStock = previousStock + quantity;
        break;
      case StockMovementType.OUT:
      case StockMovementType.SALE:
      case StockMovementType.DAMAGED:
      case StockMovementType.EXPIRED:
        newStock = Math.max(0, previousStock - quantity);
        break;
      case StockMovementType.ADJUSTMENT:
        newStock = quantity; // For adjustments, quantity is the new total
        break;
      default:
        throw new BadRequestException('Invalid movement type');
    }

    // Create stock movement record
    const { data: movement, error: movementError } = await this.supabase
      .from('stock_movement')
      .insert([{
        product_id: productId,
        type,
        quantity: type === StockMovementType.ADJUSTMENT ? quantity - previousStock : quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason,
        reference,
        performed_by: adminId,
      }])
      .select(`
        *,
        product:product_id (
          id,
          name,
          sku
        )
      `)
      .single();

    if (movementError) throw new Error(movementError.message);

    // Update product stock
    const { error: updateError } = await this.supabase
      .from('product')
      .update({ stock: newStock })
      .eq('id', productId);

    if (updateError) throw new Error(updateError.message);

    return this.mapToResponseDto(movement);
  }

  async updateProductStock(
    adminId: string,
    productId: string,
    updateStockDto: UpdateStockDto,
  ): Promise<StockMovementResponseDto> {
    const { stock, lowStockThreshold, reason } = updateStockDto;

    const { data: product, error: productError } = await this.supabase
      .from('product')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update low stock threshold if provided
    if (lowStockThreshold !== undefined) {
      const { error: updateError } = await this.supabase
        .from('product')
        .update({ low_stock_threshold: lowStockThreshold })
        .eq('id', productId);

      if (updateError) throw new Error(updateError.message);
    }

    // Record stock adjustment
    const stockMovementDto: StockMovementDto = {
      productId,
      type: StockMovementType.ADJUSTMENT,
      quantity: stock,
      reason: reason || 'Manual stock adjustment',
    };

    return this.recordStockMovement(adminId, stockMovementDto);
  }

  async getStockMovements(
    productId?: string,
    paginationDto?: PaginationDto,
  ): Promise<{ movements: StockMovementResponseDto[]; total: number }> {
    const { page = 1, limit = 20 } = paginationDto || {};
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = this.supabase
      .from('stock_movement')
      .select(`
        *,
        product:product_id (
          id,
          name,
          sku
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: movements, count, error } = await query;

    return {
      movements: movements.map(movement => this.mapToResponseDto(movement)),
      total: count || 0,
    };
  }

  async getLowStockProducts(threshold?: number): Promise<LowStockProductDto[]> {
    const { data: products, error } = await this.supabase
      .from('product')
      .select(`
        id,
        name,
        sku,
        stock,
        low_stock_threshold,
        category,
        price
      `)
      .eq('is_active', true)
      .order('stock', { ascending: true })
      .order('name', { ascending: true });

    return products
      .filter(product => product.stock <= product.lowStockThreshold)
      .map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        category: product.category,
        price: parseFloat(product.price.toString()),
      }));
  }

  async getInventoryStats(): Promise<any> {
    // Get all active products
    const { data: products, error: productsError } = await this.supabase
      .from('product')
      .select('*')
      .eq('is_active', true);

    if (productsError) throw new Error(productsError.message);

    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.stock <= p.low_stock_threshold).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.stock || 0), 0);

    // Get recent movements
    const { data: recentMovements, error: movementsError } = await this.supabase
      .from('stock_movement')
      .select(`
        *,
        product:product_id (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalStockValue: totalValue._sum.stock || 0,
      recentMovements: recentMovements.map(movement => ({
        id: movement.id,
        productName: movement.product.name,
        type: movement.type,
        quantity: movement.quantity,
        createdAt: movement.createdAt,
      })),
    };
  }

  async getProductStockHistory(
    productId: string,
    paginationDto: PaginationDto,
  ): Promise<{ movements: StockMovementResponseDto[]; total: number }> {
    return this.getStockMovements(productId, paginationDto);
  }

  private mapToResponseDto(movement: any): StockMovementResponseDto {
    return {
      id: movement.id,
      productId: movement.product_id,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previous_stock,
      newStock: movement.new_stock,
      reason: movement.reason,
      reference: movement.reference,
      performedBy: movement.performed_by,
      createdAt: movement.created_at,
      product: {
        id: movement.product.id,
        name: movement.product.name,
        sku: movement.product.sku,
      },
    };
  }
}
