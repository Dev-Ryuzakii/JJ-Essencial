import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductImageUploadDto {
  @ApiProperty({ 
    description: 'Whether this image should be set as the main product image',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isMain?: boolean;
}

export class ProductImageResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'https://example.com/images/product-image.jpg' })
  url: string;

  @ApiProperty({ example: true })
  isMain: boolean;

  @ApiProperty({ example: 1 })
  sortOrder: number;
}
