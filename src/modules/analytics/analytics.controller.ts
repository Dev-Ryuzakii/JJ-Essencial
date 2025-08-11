import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('sales')
  async getSalesAnalytics(@Query('days') days: string = '30') {
    return this.analyticsService.getSalesAnalytics(parseInt(days));
  }

  @Get('customers')
  async getCustomerAnalytics() {
    return this.analyticsService.getCustomerAnalytics();
  }

  @Get('inventory')
  async getInventoryAnalytics() {
    return this.analyticsService.getInventoryAnalytics();
  }

  @Get('orders')
  async getOrderAnalytics() {
    return this.analyticsService.getOrderAnalytics();
  }
}
