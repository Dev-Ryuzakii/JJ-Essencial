import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddToWishlistDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class WishlistItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    avgRating: number;
    isActive: boolean;
  };
}
