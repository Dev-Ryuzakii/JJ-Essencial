import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderResponseDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { CurrentUser, UserId, UserRole } from '../../common/decorators/user.decorator';
import { SuccessResponseDto, PaginationDto, PaginatedResponseDto } from '../../common/dto/common.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order successfully created',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid products or insufficient stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @UserId() userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<SuccessResponseDto<OrderResponseDto>> {
    const result = await this.ordersService.create(userId, createOrderDto);
    return new SuccessResponseDto(result, 'Order created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get orders (User: own orders, Admin: all orders)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: [OrderResponseDto],
  })
  async findAll(
    @Query() pagination: PaginationDto,
    @UserId() userId: string,
    @UserRole() userRole: string,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const isAdmin = userRole === 'ADMIN';
    const { orders, total } = await this.ordersService.findAll(
      pagination,
      isAdmin,
      isAdmin ? undefined : userId,
    );
    return new PaginatedResponseDto(orders, total, pagination.page, pagination.limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  async getStats(
    @UserId() userId: string,
    @UserRole() userRole: string,
  ): Promise<SuccessResponseDto<any>> {
    const isAdmin = userRole === 'ADMIN';
    const result = await this.ordersService.getOrderStats(isAdmin ? undefined : userId);
    return new SuccessResponseDto(result, 'Order statistics retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @UserId() userId: string,
    @UserRole() userRole: string,
  ): Promise<SuccessResponseDto<OrderResponseDto>> {
    const isAdmin = userRole === 'ADMIN';
    const result = await this.ordersService.findOne(id, isAdmin ? undefined : userId);
    return new SuccessResponseDto(result, 'Order retrieved successfully');
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<SuccessResponseDto<OrderResponseDto>> {
    const result = await this.ordersService.updateStatus(id, updateOrderStatusDto);
    return new SuccessResponseDto(result, 'Order status updated successfully');
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Download order receipt' })
  @ApiResponse({ status: 200, description: 'Receipt downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Order not found or receipt not available' })
  async downloadReceipt(
    @Param('id') id: string,
    @UserId() userId: string,
    @UserRole() userRole: string,
  ) {
    // This will be implemented when we add PDF generation
    // For now, return a message
    return new SuccessResponseDto(
      { message: 'Receipt download will be implemented with PDF generation' },
      'Receipt feature coming soon',
    );
  }
}
