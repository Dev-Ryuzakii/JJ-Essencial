import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Electronic devices and accessories', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'parent-category-uuid', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class CreateCategoryWithImageDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Electronic devices and accessories', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'parent-category-uuid', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateCategoryDto extends CreateCategoryDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCategoryWithImageDto extends CreateCategoryWithImageDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ required: false })
  parentId?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [CategoryResponseDto], required: false })
  children?: CategoryResponseDto[];

  @ApiProperty({ required: false })
  parent?: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty({ required: false })
  productCount?: number;
}
