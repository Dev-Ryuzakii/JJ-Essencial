import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { UploadService } from '../upload/upload.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto, ProductFilterDto, CreateProductWithImagesDto, UpdateProductWithImagesDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { SuccessResponseDto, PaginationDto, PaginatedResponseDto } from '../../common/dto/common.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadService: UploadService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product with file uploads (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product data with images',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'iPhone 15 Pro' },
        description: { type: 'string', example: 'Latest iPhone with advanced features' },
        price: { type: 'number', example: 999.99 },
        stock: { type: 'number', example: 50 },
        category: { type: 'string', example: 'Electronics' },
        lowStockThreshold: { type: 'number', example: 10 },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          }
        }
      },
      required: ['name', 'price', 'stock']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Product successfully created',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images?: Express.Multer.File[]
  ): Promise<SuccessResponseDto<ProductResponseDto>> {
    const result = await this.productsService.createWithImages(createProductDto, images);
    return new SuccessResponseDto(result, 'Product created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: [ProductResponseDto],
  })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filters: ProductFilterDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const { products, total } = await this.productsService.findAll(pagination, filters);
    return new PaginatedResponseDto(products, total, pagination.page, pagination.limit);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(): Promise<SuccessResponseDto<string[]>> {
    const result = await this.productsService.getCategories();
    return new SuccessResponseDto(result as string[], 'Categories retrieved successfully');
  }

  @Get('low-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get products with low stock (Admin only)' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Low stock products retrieved',
    type: [ProductResponseDto],
  })
  async getLowStockProducts(@Query('threshold') threshold?: number): Promise<SuccessResponseDto<ProductResponseDto[]>> {
    const result = await this.productsService.getLowStockProducts(threshold);
    return new SuccessResponseDto(result, 'Low stock products retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<SuccessResponseDto<ProductResponseDto>> {
    const result = await this.productsService.findOne(id);
    return new SuccessResponseDto(result, 'Product retrieved successfully');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product with file uploads (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product update data with optional images',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated iPhone 15 Pro' },
        description: { type: 'string', example: 'Updated description' },
        price: { type: 'number', example: 899.99 },
        stock: { type: 'number', example: 25 },
        category: { type: 'string', example: 'Electronics' },
        lowStockThreshold: { type: 'number', example: 10 },
        isActive: { type: 'boolean', example: true },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() images?: Express.Multer.File[]
  ): Promise<SuccessResponseDto<ProductResponseDto>> {
    const result = await this.productsService.updateWithImages(id, updateProductDto, images);
    return new SuccessResponseDto(result, 'Product updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async remove(@Param('id') id: string): Promise<SuccessResponseDto<ProductResponseDto>> {
    const result = await this.productsService.remove(id);
    return new SuccessResponseDto(result, 'Product deleted successfully');
  }
}
