import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrderTrackingService } from './order-tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('order-tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderTrackingController {
  constructor(private readonly orderTrackingService: OrderTrackingService) {}

  @Post()
  @Roles('ADMIN')
  async createTrackingEntry(
    @Body()
    createDto: {
      orderId: string;
      status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
      location?: string;
      notes?: string;
    },
  ) {
    return this.orderTrackingService.createTrackingEntry(createDto);
  }

  @Get('order/:orderId')
  async getOrderTracking(@Param('orderId') orderId: string, @Request() req) {
    // Check if user is admin or order owner
    if (req.user.role === 'ADMIN') {
      return this.orderTrackingService.getOrderTracking(orderId);
    } else {
      return this.orderTrackingService.getUserOrderTracking(
        req.user.sub,
        orderId,
      );
    }
  }

  @Get('order-number/:orderNumber')
  async getTrackingByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderTrackingService.getTrackingByOrderNumber(orderNumber);
  }

  @Put('order/:orderId/status')
  @Roles('ADMIN')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body()
    updateDto: {
      status?: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
      location?: string;
      notes?: string;
    },
  ) {
    return this.orderTrackingService.updateOrderStatus(orderId, updateDto);
  }

  @Get('status/:status')
  @Roles('ADMIN')
  async getOrdersByStatus(@Param('status') status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED') {
    return this.orderTrackingService.getOrdersByStatus(status);
  }

  @Get('admin/all')
  @Roles('ADMIN')
  async getAllOrdersTracking(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.orderTrackingService.getAllOrdersTracking(
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('admin/stats')
  @Roles('ADMIN')
  async getTrackingStats() {
    return this.orderTrackingService.getTrackingStats();
  }

  @Get('my-orders')
  async getUserOrders(@Request() req) {
    // Get all user's orders with tracking info
    return this.orderTrackingService.getAllOrdersTracking(1, 50); // This needs to be filtered by user
  }
}
