import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: new Date().toISOString() })
  timestamp: string;

  constructor(data: T, message: string = 'Operation completed successfully') {
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'An error occurred' })
  message: string;

  @ApiProperty({ example: 'BAD_REQUEST' })
  error: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: new Date().toISOString() })
  timestamp: string;

  constructor(message: string, error: string, statusCode: number) {
    this.success = false;
    this.message = message;
    this.error = error;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

export class PaginatedResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Data retrieved successfully' })
  message: string;

  @ApiProperty()
  data: T[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false
    }
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  @ApiProperty({ example: new Date().toISOString() })
  timestamp: string;

  constructor(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Data retrieved successfully'
  ) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    
    const totalPages = Math.ceil(total / limit);
    this.pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }
}