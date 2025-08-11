import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class SuccessResponseDto<T = any> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: T;

  @ApiProperty()
  timestamp?: string;

  constructor(data?: T, message = 'Operation successful') {
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export class ErrorResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  error?: string;

  @ApiProperty()
  statusCode?: number;

  @ApiProperty()
  timestamp?: string;

  constructor(message: string, error?: string, statusCode?: number) {
    this.success = false;
    this.message = message;
    this.error = error;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

export class PaginationDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({ description: 'Search query', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Sort field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc', required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedResponseDto<T> extends SuccessResponseDto<T[]> {
  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Data retrieved successfully'
  ) {
    super(data, message);
    
    const pages = Math.ceil(total / limit);
    this.pagination = {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  }
}
