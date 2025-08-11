import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
}

export class StockMovementDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'IN', enum: StockMovementType })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 'Restocking from supplier', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 'PO-12345', required: false })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class UpdateStockDto {
  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  lowStockThreshold?: number;

  @ApiProperty({ example: 'Manual stock adjustment', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class StockMovementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ enum: StockMovementType })
  type: StockMovementType;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  previousStock: number;

  @ApiProperty()
  newStock: number;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty({ required: false })
  reference?: string;

  @ApiProperty({ required: false })
  performedBy?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  product: {
    id: string;
    name: string;
    sku?: string;
  };
}

export class LowStockProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku?: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  lowStockThreshold: number;

  @ApiProperty()
  category?: string;

  @ApiProperty()
  price: number;
}
