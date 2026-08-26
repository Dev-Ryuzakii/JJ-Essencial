import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCategoryDto, CreateCategoryWithImageDto, UpdateCategoryDto, UpdateCategoryWithImageDto, CategoryResponseDto } from './dto/category.dto';
import { UploadService } from '../upload/upload.service';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class CategoriesService {
  private supabase;

  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const { name, description, parentId, sortOrder } = createCategoryDto;

    // Generate slug from name
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const { data: existingCategory, error: slugError } = await this.supabase
      .from('category')
      .select()
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Validate parent category if provided
    if (parentId) {
      const { data: parent, error: parentError } = await this.supabase
        .from('category')
        .select()
        .eq('id', parentId)
        .eq('is_active', true)
        .single();

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    // Create category
    const { data: category, error: createError } = await this.supabase
      .from('category')
      .insert([{
        name,
        description,
        slug,
        parent_id: parentId,
        sort_order: sortOrder || 0,
      }])
      .select(`
        *,
        parent:parent_id (
          id,
          name,
          slug
        ),
        children:category!parent_id (
          *
        )
      `)
      .single();

    if (createError) throw new Error(createError.message);

    // Get product count
    const { count: productCount, error: countError } = await this.supabase
      .from('product')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id);

    if (countError) throw new Error(countError.message);

    return this.mapToResponseDto(category);
  }

  async createCategoryWithImage(createCategoryDto: CreateCategoryWithImageDto, image?: Express.Multer.File): Promise<CategoryResponseDto> {
    const { name, description, parentId, sortOrder } = createCategoryDto;

    // Generate slug from name
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const { data: existingCategory, error: slugError } = await this.supabase
      .from('category')
      .select()
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Validate parent category if provided
    if (parentId) {
      const { data: parent, error: parentError } = await this.supabase
        .from('category')
        .select()
        .eq('id', parentId)
        .eq('is_active', true)
        .single();

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    let imageUrl: string | null = null;
    if (image) {
      const uploadResult = await this.uploadService.uploadToSupabase(image, 'categories/images');
      imageUrl = uploadResult.url;
    }

    // Create category
    const { data: category, error: createError } = await this.supabase
      .from('category')
      .insert([{
        name,
        description,
        slug,
        image: imageUrl,
        parent_id: parentId,
        sort_order: sortOrder || 0,
      }])
      .select(`
        *,
        parent:parent_id (
          id,
          name,
          slug
        ),
        children:category!parent_id (
          *
        ),
        products:product (count)
      `)
      .single();

    if (createError) throw new Error(createError.message);

    return this.mapToResponseDto(category);
  }

  async getAllCategories(includeInactive = false): Promise<CategoryResponseDto[]> {
    const query = this.supabase
      .from('category')
      .select(`
        id,
        name,
        description,
        slug,
        image_url,
        parent_id,
        sort_order,
        is_active,
        created_at,
        updated_at,
        parent:parent_id (
          id,
          name,
          slug
        ),
        children:category!parent_id (
          id,
          name,
          description,
          slug,
          image_url,
          sort_order,
          is_active
        ),
        product_count:product (count)
      `)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) throw new Error(error.message);

    return categories.map(category => this.mapToResponseDto(category));
  }

  async getCategoryTree(): Promise<CategoryResponseDto[]> {
    const { data: categories, error } = await this.supabase
      .from('category')
      .select(`
        *,
        children:category!parent_id (
          *,
          children:category!parent_id (
            *,
            products:product (count)
          ),
          products:product (count)
        ),
        products:product (count)
      `)
      .eq('is_active', true)
      .is('parent_id', null) // Only root categories
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);

    return categories.map(category => this.mapToResponseDto(category));
  }

  async getCategoryById(id: string): Promise<CategoryResponseDto> {
    const { data: category, error } = await this.supabase
      .from('category')
      .select(`
        *,
        parent:parent_id (
          id,
          name,
          slug
        ),
        children:category!parent_id (
          *
        ),
        products:product (count)
      `)
      .eq('id', id)
      .single();

    if (error || !category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapToResponseDto(category);
  }

  async getCategoryBySlug(slug: string): Promise<CategoryResponseDto> {
    const { data: category, error } = await this.supabase
      .from('category')
      .select(`
        *,
        parent:parent_id (
          id,
          name,
          slug
        ),
        children:category!parent_id (
          *
        ),
        products:product (count)
      `)
      .eq('slug', slug)
      .single();

    if (error || !category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapToResponseDto(category);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const { data: existingCategory, error: findError } = await this.supabase
      .from('category')
      .select()
      .eq('id', id)
      .single();

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    const { name, description, parentId, sortOrder, isActive } = updateCategoryDto;

    let slug = existingCategory.slug;
    
    // Generate new slug if name is being updated
    if (name && name !== existingCategory.name) {
      slug = this.generateSlug(name);
      
      // Check if new slug already exists
      const { data: existingSlug, error: slugError } = await this.supabase
        .from('category')
        .select()
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existingSlug) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Validate parent category if provided
    if (parentId && parentId !== existingCategory.parent_id) {
      if (parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const { data: parent, error: parentError } = await this.supabase
        .from('category')
        .select()
        .eq('id', parentId)
        .eq('is_active', true)
        .single();

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      // Check for circular dependency
      const wouldCreateCycle = await this.wouldCreateCircularDependency(id, parentId);
      if (wouldCreateCycle) {
        throw new BadRequestException('This would create a circular dependency');
      }
    }

    const { data: updatedCategory, error: updateError } = await this.supabase
      .from('category')
      .update({
        name,
        description,
        slug,
        parent_id: parentId,
        sort_order: sortOrder,
        is_active: isActive,
      })
      .eq('id', id)
      .select(`
        *,
        parent:parent_id (
          id,
          name,
          slug
        ),
        children:category!parent_id (
          *
        ),
        products:product (count)
      `)
      .single();

    if (updateError) throw new Error(updateError.message);

    return this.mapToResponseDto(updatedCategory);
  }

  async updateCategoryWithImage(id: string, updateCategoryDto: UpdateCategoryWithImageDto, image?: Express.Multer.File): Promise<CategoryResponseDto> {
    const { data: existingCategory, error: findError } = await this.supabase
      .from('category')
      .select()
      .eq('id', id)
      .single();

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    const { name, description, parentId, sortOrder, isActive } = updateCategoryDto;

    let slug = existingCategory.slug;
    
    // Generate new slug if name is being updated
    if (name && name !== existingCategory.name) {
      slug = this.generateSlug(name);
      
      // Check if new slug already exists
      const { data: existingSlug, error: slugError } = await this.supabase
        .from('category')
        .select()
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existingSlug) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Validate parent category if provided
    if (parentId && parentId !== existingCategory.parent_id) {
      if (parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const { data: parent, error: parentError } = await this.supabase
        .from('category')
        .select()
        .eq('id', parentId)
        .eq('is_active', true)
        .single();

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      // Check for circular dependency
      const wouldCreateCycle = await this.wouldCreateCircularDependency(id, parentId);
      if (wouldCreateCycle) {
        throw new BadRequestException('This would create a circular dependency');
      }
    }

    let imageUrl = existingCategory.image;
    if (image) {
      const uploadResult = await this.uploadService.uploadToSupabase(image, 'categories/images');
      imageUrl = uploadResult.url;
    }

    const { data: updatedCategory, error: updateError } = await this.supabase
      .from('category')
      .update({
        name,
        description,
        slug,
        image: imageUrl,
        parent_id: parentId,
        sort_order: sortOrder,
        is_active: isActive,
      })
      .eq('id', id)
      .select(`
        *,
        parent:parent_id (
          id,
          name,
          slug
        ),
        children:category!parent_id (
          *
        ),
        products:product (count)
      `)
      .single();

    if (updateError) throw new Error(updateError.message);

    return this.mapToResponseDto(updatedCategory);
  }

  async deleteCategory(id: string): Promise<void> {
    // Get category with children and product count
    const { data: category, error: findError } = await this.supabase
      .from('category')
      .select(`
        *,
        children:category!parent_id (count),
        products:product (count)
      `)
      .eq('id', id)
      .single();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.children?.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    if (category.products?.length > 0) {
      throw new BadRequestException('Cannot delete category with products');
    }

    const { error: deleteError } = await this.supabase
      .from('category')
      .delete()
      .eq('id', id);

    if (deleteError) throw new Error(deleteError.message);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async wouldCreateCircularDependency(categoryId: string, newParentId: string): Promise<boolean> {
    let currentId = newParentId;
    
    while (currentId) {
      if (currentId === categoryId) {
        return true;
      }
      
      const { data: parent, error } = await this.supabase
        .from('category')
        .select('parent_id')
        .eq('id', currentId)
        .single();
      
      if (error || !parent) break;
      currentId = parent.parent_id;
    }
    
    return false;
  }

  private mapToResponseDto(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      image: category.image_url,
      parentId: category.parent_id,
      isActive: category.is_active,
      sortOrder: category.sort_order,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      children: Array.isArray(category.children) ? category.children : [],
      parent: category.parent || null,
      productCount: category.product_count?.[0]?.count || 0,
    };
  }
}
