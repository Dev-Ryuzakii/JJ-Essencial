import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCategoryDto, CreateCategoryWithImageDto, UpdateCategoryDto, UpdateCategoryWithImageDto, CategoryResponseDto } from './dto/category.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CategoriesService {
  private prisma = new PrismaClient();

  constructor(private readonly uploadService: UploadService) {}

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const { name, description, parentId, sortOrder } = createCategoryDto;

    // Generate slug from name
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Validate parent category if provided
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId, isActive: true },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        description,
        slug,
        parentId,
        sortOrder: sortOrder || 0,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return this.mapToResponseDto(category);
  }

  async createCategoryWithImage(createCategoryDto: CreateCategoryWithImageDto, image?: Express.Multer.File): Promise<CategoryResponseDto> {
    const { name, description, parentId, sortOrder } = createCategoryDto;

    // Generate slug from name
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Validate parent category if provided
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId, isActive: true },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    let imageUrl: string | null = null;
    if (image) {
      const uploadResult = await this.uploadService.uploadToSupabase(image, 'categories/images');
      imageUrl = uploadResult.url;
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        description,
        slug,
        image: imageUrl,
        parentId,
        sortOrder: sortOrder || 0,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return this.mapToResponseDto(category);
  }

  async getAllCategories(includeInactive = false): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return categories.map(category => this.mapToResponseDto(category));
  }

  async getCategoryTree(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { 
        isActive: true,
        parentId: null, // Only root categories
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
            _count: {
              select: {
                products: {
                  where: { isActive: true },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map(category => this.mapToResponseDto(category));
  }

  async getCategoryById(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapToResponseDto(category);
  }

  async getCategoryBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapToResponseDto(category);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    const { name, description, parentId, sortOrder, isActive } = updateCategoryDto;

    let slug = existingCategory.slug;
    
    // Generate new slug if name is being updated
    if (name && name !== existingCategory.name) {
      slug = this.generateSlug(name);
      
      // Check if new slug already exists
      const existingSlug = await this.prisma.category.findUnique({
        where: { 
          slug,
          NOT: { id },
        },
      });

      if (existingSlug) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Validate parent category if provided
    if (parentId && parentId !== existingCategory.parentId) {
      if (parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: parentId, isActive: true },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      // Check for circular dependency
      const wouldCreateCycle = await this.wouldCreateCircularDependency(id, parentId);
      if (wouldCreateCycle) {
        throw new BadRequestException('This would create a circular dependency');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        slug,
        parentId,
        sortOrder,
        isActive,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(updatedCategory);
  }

  async updateCategoryWithImage(id: string, updateCategoryDto: UpdateCategoryWithImageDto, image?: Express.Multer.File): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    const { name, description, parentId, sortOrder, isActive } = updateCategoryDto;

    let slug = existingCategory.slug;
    
    // Generate new slug if name is being updated
    if (name && name !== existingCategory.name) {
      slug = this.generateSlug(name);
      
      // Check if new slug already exists
      const existingSlug = await this.prisma.category.findUnique({
        where: { 
          slug,
          NOT: { id },
        },
      });

      if (existingSlug) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Validate parent category if provided
    if (parentId && parentId !== existingCategory.parentId) {
      if (parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: parentId, isActive: true },
      });

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

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        slug,
        image: imageUrl,
        parentId,
        sortOrder,
        isActive,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(updatedCategory);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    if (category._count.products > 0) {
      throw new BadRequestException('Cannot delete category with products');
    }

    await this.prisma.category.delete({
      where: { id },
    });
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
      
      const parent = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      
      currentId = parent?.parentId || null;
    }
    
    return false;
  }

  private mapToResponseDto(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      image: category.image,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      children: category.children?.map((child: any) => this.mapToResponseDto(child)),
      parent: category.parent,
      productCount: category._count?.products,
    };
  }
}
