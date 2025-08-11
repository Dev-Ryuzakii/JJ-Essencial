import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber, IsDateString, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  dateOfBirth?: Date;

  @ApiProperty()
  role: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserAddressDto {
  @ApiProperty({ example: 'SHIPPING', enum: ['SHIPPING', 'BILLING', 'BOTH'] })
  @IsString()
  @IsNotEmpty()
  type: 'SHIPPING' | 'BILLING' | 'BOTH';

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Acme Corp', required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  address1: string;

  @ApiProperty({ example: 'Apt 4B', required: false })
  @IsOptional()
  @IsString()
  address2?: string;

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

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateUserAddressDto extends UserAddressDto {}

export class UserAddressResponseDto extends UserAddressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
