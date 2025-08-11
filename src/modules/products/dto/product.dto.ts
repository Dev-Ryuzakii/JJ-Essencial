import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Latest iPhone with advanced features', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({ example: ['url1.jpg', 'url2.jpg'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ example: 'Electronics', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 899.99, required: false })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 25, required: false })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  stock?: number;

  @ApiProperty({ example: ['url1.jpg', 'url2.jpg'], type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 'Electronics', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  category: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProductFilterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  inStock?: boolean;
}
