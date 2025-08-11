import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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
  private prisma = new PrismaClient();

  async recordStockMovement(
    adminId: string,
    stockMovementDto: StockMovementDto,
  ): Promise<StockMovementResponseDto> {
    const { productId, type, quantity, reason, reference } = stockMovementDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

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

    // Record movement and update stock in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity: type === StockMovementType.ADJUSTMENT ? quantity - previousStock : quantity,
          previousStock,
          newStock,
          reason,
          reference,
          performedBy: adminId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      return movement;
    });

    return this.mapToResponseDto(result);
  }

  async updateProductStock(
    adminId: string,
    productId: string,
    updateStockDto: UpdateStockDto,
  ): Promise<StockMovementResponseDto> {
    const { stock, lowStockThreshold, reason } = updateStockDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update low stock threshold if provided
    if (lowStockThreshold !== undefined) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { lowStockThreshold },
      });
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
    const skip = (page - 1) * limit;

    const where = productId ? { productId } : {};

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      movements: movements.map(movement => this.mapToResponseDto(movement)),
      total,
    };
  }

  async getLowStockProducts(threshold?: number): Promise<LowStockProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          lte: threshold ? threshold : { field: 'lowStockThreshold' } as any,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        category: true,
        price: true,
      },
      orderBy: [
        { stock: 'asc' },
        { name: 'asc' },
      ],
    });

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
    const [totalProducts, lowStockCount, outOfStockCount, totalValue] = await Promise.all([
      this.prisma.product.count({
        where: { isActive: true },
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: { field: 'lowStockThreshold' } as any },
        },
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          stock: 0,
        },
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _sum: {
          stock: true,
        },
      }),
    ]);

    // Get recent movements
    const recentMovements = await this.prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

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
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      newStock: movement.newStock,
      reason: movement.reason,
      reference: movement.reference,
      performedBy: movement.performedBy,
      createdAt: movement.createdAt,
      product: {
        id: movement.product.id,
        name: movement.product.name,
        sku: movement.product.sku,
      },
    };
  }
}
