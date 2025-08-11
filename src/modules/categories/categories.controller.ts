import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { SuccessResponseDto } from '../../common/dto/common.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  async getAllCategories(
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<SuccessResponseDto<CategoryResponseDto[]>> {
    const categories = await this.categoriesService.getAllCategories(includeInactive);
    return new SuccessResponseDto(categories, 'Categories retrieved successfully');
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree structure' })
  @ApiResponse({
    status: 200,
    description: 'Category tree retrieved successfully',
    type: [CategoryResponseDto],
  })
  async getCategoryTree(): Promise<SuccessResponseDto<CategoryResponseDto[]>> {
    const tree = await this.categoriesService.getCategoryTree();
    return new SuccessResponseDto(tree, 'Category tree retrieved successfully');
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get category by ID or slug' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  async getCategory(@Param('identifier') identifier: string): Promise<SuccessResponseDto<CategoryResponseDto>> {
    // Try to get by ID first, then by slug
    let category: CategoryResponseDto;
    try {
      category = await this.categoriesService.getCategoryById(identifier);
    } catch {
      category = await this.categoriesService.getCategoryBySlug(identifier);
    }
    
    return new SuccessResponseDto(category, 'Category retrieved successfully');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new category (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<SuccessResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.createCategory(createCategoryDto);
    return new SuccessResponseDto(category, 'Category created successfully');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<SuccessResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.updateCategory(id, updateCategoryDto);
    return new SuccessResponseDto(category, 'Category updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    await this.categoriesService.deleteCategory(id);
  }
}
