import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'order-uuid', required: false })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @ApiProperty({ example: 'Great product!', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'I really love this product. Highly recommended!', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ example: ['image1.jpg', 'image2.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiProperty({ example: 'Updated title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ example: ['image1.jpg', 'image2.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ required: false })
  orderId?: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  comment?: string;

  @ApiProperty()
  images: string[];

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isVisible: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  user: {
    id: string;
    fullName: string;
    avatar?: string;
  };
}

export class ProductRatingStatsDto {
  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
