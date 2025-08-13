import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseConfig } from '../../config/database.config';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto/product.dto';
import { PaginationDto } from '../../common/dto/common.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ProductsService {
  private prisma: PrismaClient;

  constructor(private readonly uploadService: UploadService) {
    this.prisma = DatabaseConfig.getInstance();
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        price: createProductDto.price,
      },
    });

    return this.formatProduct(product);
  }

  async createWithImages(createProductDto: CreateProductDto, images?: Express.Multer.File[]) {
    let imageUrls: string[] = [];
    
    // Upload images if provided
    if (images && images.length > 0) {
      const uploadResults = await this.uploadService.uploadMultipleToSupabase(images, 'products');
      imageUrls = uploadResults.map(result => result.url);
    }

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        price: createProductDto.price,
        images: imageUrls,
      },
    });

    return this.formatProduct(product);
  }

  async findAll(pagination: PaginationDto, filters: ProductFilterDto) {
    const { page, limit, search, sortBy, sortOrder } = pagination;
    const { category, minPrice, maxPrice, inStock } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map(this.formatProduct),
      total,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProduct(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });

    return this.formatProduct(product);
  }

  async updateWithImages(id: string, updateProductDto: UpdateProductDto, images?: Express.Multer.File[]) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

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

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        images: imageUrls,
      },
    });

    return this.formatProduct(product);
  }

  async remove(id: string) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete by setting isActive to false
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return this.formatProduct(product);
  }

  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' = 'subtract') {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

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

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    return this.formatProduct(updatedProduct);
  }

  async getCategories() {
    const categories = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return categories
      .map(item => item.category)
      .filter(category => category !== null && category !== '');
  }

  async getLowStockProducts(threshold: number = 10) {
    try {
      // Use the product's own lowStockThreshold when available, otherwise use the provided threshold
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            // Either stock is below the product's own threshold
            {
              stock: { lte: this.prisma.product.fields.lowStockThreshold },
            },
            // Or stock is below the provided threshold
            {
              stock: { lte: threshold },
            }
          ],
        },
        orderBy: { stock: 'asc' },
      });

      return products.map(this.formatProduct);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      // Fallback to simpler query if the first one fails
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          stock: { lte: threshold },
        },
        orderBy: { stock: 'asc' },
      });
      
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
      category: product.category,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
