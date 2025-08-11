import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { 
  StockMovementDto, 
  UpdateStockDto, 
  StockMovementResponseDto, 
  LowStockProductDto 
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { UserId } from '../../common/decorators/user.decorator';
import { SuccessResponseDto, PaginatedResponseDto, PaginationDto } from '../../common/dto/common.dto';

@ApiTags('Inventory Management')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('stock-movement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record stock movement (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Stock movement recorded successfully',
    type: StockMovementResponseDto,
  })
  async recordStockMovement(
    @UserId() adminId: string,
    @Body() stockMovementDto: StockMovementDto,
  ): Promise<SuccessResponseDto<StockMovementResponseDto>> {
    const movement = await this.inventoryService.recordStockMovement(adminId, stockMovementDto);
    return new SuccessResponseDto(movement, 'Stock movement recorded successfully');
  }

  @Put('products/:productId/stock')
  @ApiOperation({ summary: 'Update product stock (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product stock updated successfully',
    type: StockMovementResponseDto,
  })
  async updateProductStock(
    @UserId() adminId: string,
    @Param('productId') productId: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<SuccessResponseDto<StockMovementResponseDto>> {
    const movement = await this.inventoryService.updateProductStock(adminId, productId, updateStockDto);
    return new SuccessResponseDto(movement, 'Product stock updated successfully');
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get stock movements (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Stock movements retrieved successfully',
    type: PaginatedResponseDto<StockMovementResponseDto>,
  })
  async getStockMovements(
    @Query('productId') productId?: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<StockMovementResponseDto>> {
    const { movements, total } = await this.inventoryService.getStockMovements(productId, paginationDto);
    const { page = 1, limit = 20 } = paginationDto || {};
    
    return new PaginatedResponseDto(
      movements,
      total,
      page,
      limit,
      'Stock movements retrieved successfully',
    );
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products (Admin only)' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Low stock products retrieved successfully',
    type: [LowStockProductDto],
  })
  async getLowStockProducts(
    @Query('threshold') threshold?: number,
  ): Promise<SuccessResponseDto<LowStockProductDto[]>> {
    const products = await this.inventoryService.getLowStockProducts(threshold);
    return new SuccessResponseDto(products, 'Low stock products retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get inventory statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Inventory stats retrieved successfully' })
  async getInventoryStats(): Promise<SuccessResponseDto<any>> {
    const stats = await this.inventoryService.getInventoryStats();
    return new SuccessResponseDto(stats, 'Inventory stats retrieved successfully');
  }

  @Get('products/:productId/history')
  @ApiOperation({ summary: 'Get product stock history (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Product stock history retrieved successfully',
    type: PaginatedResponseDto<StockMovementResponseDto>,
  })
  async getProductStockHistory(
    @Param('productId') productId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<StockMovementResponseDto>> {
    const { movements, total } = await this.inventoryService.getProductStockHistory(productId, paginationDto);
    const { page = 1, limit = 20 } = paginationDto;
    
    return new PaginatedResponseDto(
      movements,
      total,
      page,
      limit,
      'Product stock history retrieved successfully',
    );
  }
}
