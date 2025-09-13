import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsNumber, ValidateNested, Min, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class DeliveryAddressDto {
  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ example: 'Please call before delivery', required: false })
  @IsOptional()
  @IsString()
  orderNotes?: string;

  @ApiProperty({ example: 'address-uuid', required: false })
  @IsOptional()
  @IsUUID()
  savedAddressId?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'PAID', enum: ['PENDING', 'PAID', 'COMPLETED', 'CANCELLED'] })
  @IsString()
  @IsNotEmpty()
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
}

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: '6-digit unique order number', example: '123456' })
  orderNumber: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: ['PENDING', 'PAID', 'COMPLETED', 'CANCELLED'] })
  status: string;

  @ApiProperty()
  paymentRef: string;

  @ApiProperty()
  receiptUrl: string;

  @ApiProperty({ required: false })
  deliveryPhone?: string;

  @ApiProperty({ required: false })
  deliveryAddress?: string;

  @ApiProperty({ required: false })
  deliveryCity?: string;

  @ApiProperty({ required: false })
  deliveryState?: string;

  @ApiProperty({ required: false })
  deliveryPostal?: string;

  @ApiProperty({ required: false })
  deliveryCountry?: string;

  @ApiProperty({ required: false })
  orderNotes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [OrderItemResponseDto] })
  orderItems: OrderItemResponseDto[];

  @ApiProperty()
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}
