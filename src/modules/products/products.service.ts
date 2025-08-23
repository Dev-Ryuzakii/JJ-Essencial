import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto/product.dto';
import { PaginationDto } from '../../common/dto/common.dto';
import { UploadService } from '../upload/upload.service';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class ProductsService {
  private supabase;

  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
  }

  async create(createProductDto: CreateProductDto) {
    const { data: product, error } = await this.supabase
      .from('product')
      .insert([{
        ...createProductDto,
        price: createProductDto.price,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.formatProduct(product);
  }

  async createWithImages(createProductDto: CreateProductDto, images?: Express.Multer.File[]) {
    let imageUrls: string[] = [];
    
    // Upload images if provided
    if (images && images.length > 0) {
      const uploadResults = await this.uploadService.uploadMultipleToSupabase(images, 'products');
      imageUrls = uploadResults.map(result => result.url);
    }

    const { data: product, error } = await this.supabase
      .from('product')
      .insert([{
        ...createProductDto,
        price: createProductDto.price,
        images: imageUrls,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.formatProduct(product);
  }

  async findAll(pagination: PaginationDto, filters: ProductFilterDto) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = pagination;
    const { category, minPrice, maxPrice, inStock, featured } = filters;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = this.supabase
      .from('product')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Add search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // Add category filter
    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    // Add price range filter
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    // Add stock filter
    if (inStock !== undefined) {
      if (inStock) {
        query = query.gt('stock', 0);
      } else {
        query = query.eq('stock', 0);
      }
    }

    // Add featured filter (handle missing column gracefully)
    if (featured !== undefined) {
      try {
        query = query.eq('featured', featured);
      } catch (error) {
        // If featured column doesn't exist, skip this filter
        console.warn('Featured column not found, skipping featured filter');
      }
    }

    // Add sorting
    if (sortBy) {
      const orderDirection = sortOrder?.toLowerCase() === 'desc' ? false : true;
      // Map camelCase to snake_case for database columns
      const dbSortBy = sortBy === 'createdAt' ? 'created_at' : 
                       sortBy === 'updatedAt' ? 'updated_at' : sortBy;
      query = query.order(dbSortBy, { ascending: orderDirection });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Add pagination
    query = query.range(start, end);

    const { data: products, count: total, error } = await query;

    if (error) throw new Error(error.message);

    return {
      products: products.map(this.formatProduct),
      total: total || 0,
    };
  }

  async findOne(id: string) {
    const { data: product, error } = await this.supabase
      .from('product')
      .select()
      .eq('id', id)
      .single();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProduct(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { data: existingProduct, error: findError } = await this.supabase
      .from('product')
      .select()
      .eq('id', id)
      .single();

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const { data: product, error: updateError } = await this.supabase
      .from('product')
      .update(updateProductDto)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return this.formatProduct(product);
  }

  async updateWithImages(id: string, updateProductDto: UpdateProductDto, images?: Express.Multer.File[]) {
    const { data: existingProduct, error: findError } = await this.supabase
      .from('product')
      .select()
      .eq('id', id)
      .single();

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    let imageUrls = existingProduct.images || [];
    
    // Upload new images if provided
    if (images && images.length > 0) {
      const uploadResults = await this.uploadService.uploadMultipleToSupabase(images, 'products');
      const newImageUrls = uploadResults.map(result => result.url);
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    const { data: product, error: updateError } = await this.supabase
      .from('product')
      .update({
        ...updateProductDto,
        images: imageUrls,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return this.formatProduct(product);
  }

  async remove(id: string) {
    const { data: existingProduct, error: findError } = await this.supabase
      .from('product')
      .select()
      .eq('id', id)
      .single();

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete by setting is_active to false
    const { data: product, error: updateError } = await this.supabase
      .from('product')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return this.formatProduct(product);
  }

  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' = 'subtract') {
    const { data: product, error: findError } = await this.supabase
      .from('product')
      .select()
      .eq('id', id)
      .single();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let newStock: number;
    if (operation === 'add') {
      newStock = product.stock + quantity;
    } else {
      newStock = product.stock - quantity;
      if (newStock < 0) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    const { data: updatedProduct, error: updateError } = await this.supabase
      .from('product')
      .update({ stock: newStock })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return this.formatProduct(updatedProduct);
  }

  async getCategories() {
    const { data: categories, error } = await this.supabase
      .from('product')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null);

    if (error) throw new Error(error.message);

    const uniqueCategories = [...new Set(categories.map(item => item.category))];
    return uniqueCategories.filter(category => category !== '');
  }

  async getLowStockProducts(threshold: number = 10) {
    try {
      // Get products with their low stock threshold or default threshold
      const { data: products, error } = await this.supabase
        .from('product')
        .select()
        .eq('is_active', true)
        .or(`stock.lte.${threshold},and(stock.lte.low_stock_threshold)`)
        .order('stock', { ascending: true });

      if (error) throw new Error(error.message);
      return products.map(this.formatProduct);
      
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      // Fallback to simpler query
      const { data: products, error: fallbackError } = await this.supabase
        .from('product')
        .select()
        .eq('is_active', true)
        .lte('stock', threshold)
        .order('stock', { ascending: true });

      if (fallbackError) throw new Error(fallbackError.message);
      return products.map(this.formatProduct);
    }
  }

  private formatProduct(product: any) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      stock: product.stock,
      images: product.images,
      category: product.category || null,
      featured: product.featured || false, // Default to false if column doesn't exist
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }
}
