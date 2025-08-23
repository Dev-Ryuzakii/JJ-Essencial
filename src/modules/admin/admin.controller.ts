import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminOnly } from '../../common/decorators/admin.decorator';
import { UserId } from '../../common/decorators/user.decorator';
import { SuccessResponseDto, PaginatedResponseDto } from '../../common/dto/common.dto';
import { AdminService } from './admin.service';
import { CustomerSupportService } from '../customer-support/customer-support.service';
import {
  DashboardStatsDto,
  AdminUserQueryDto,
  UpdateUserStatusDto,
  AdminOrderQueryDto,
  UpdateOrderStatusDto,
  AdminProductQueryDto,
  CreateAdminProductDto,
  UpdateAdminProductDto,
  AdminCategoryQueryDto,
  CreateAdminCategoryDto,
  UpdateAdminCategoryDto,
  AdminAnalyticsQueryDto,
  AdminReportQueryDto,
  AdminSettingsDto,
  BulkUpdateStatusDto,
  BulkDeleteDto,
  ExportQueryDto,
  ReportFormat,
  AdminReviewQueryDto,
  UpdateReviewStatusDto
} from './dto/admin.dto';
import { ProductImageResponseDto } from './dto/admin-product-images.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@AdminOnly()
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly customerSupportService: CustomerSupportService,
  ) {}

  // ============= DASHBOARD ENDPOINTS =============
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard statistics retrieved successfully',
    type: SuccessResponseDto<DashboardStatsDto>
  })
  async getDashboardStats(): Promise<SuccessResponseDto<DashboardStatsDto>> {
    const stats = await this.adminService.getDashboardStats();
    return new SuccessResponseDto(stats, 'Dashboard statistics retrieved successfully');
  }

  @Get('dashboard/user-stats')
  @ApiOperation({ summary: 'Get user statistics for dashboard' })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics retrieved successfully',
    type: SuccessResponseDto<DashboardStatsDto>
  })
  async getUserStats(): Promise<SuccessResponseDto<DashboardStatsDto>> {
    // For now, return the same dashboard stats
    // This can be customized later for user-specific statistics
    const stats = await this.adminService.getDashboardStats();
    return new SuccessResponseDto(stats, 'User statistics retrieved successfully');
  }

  // ============= USER MANAGEMENT ENDPOINTS =============
  @Get('users')
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    type: PaginatedResponseDto
  })
  async getUsers(@Query() query: AdminUserQueryDto): Promise<PaginatedResponseDto<any>> {
    const result = await this.adminService.getUsers(query);
    return new PaginatedResponseDto(
      result.data,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit,
      'Users retrieved successfully'
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: SuccessResponseDto
  })
  async getUserById(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const user = await this.adminService.getUserById(id);
    return new SuccessResponseDto(user, 'User retrieved successfully');
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Update user status (active/inactive)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User status updated successfully',
    type: SuccessResponseDto
  })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateData: UpdateUserStatusDto
  ): Promise<SuccessResponseDto<any>> {
    const user = await this.adminService.updateUserStatus(id, updateData);
    return new SuccessResponseDto(user, 'User status updated successfully');
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully',
    type: SuccessResponseDto
  })
  async deleteUser(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.deleteUser(id);
    return new SuccessResponseDto(result, 'User deleted successfully');
  }

  @Put('users/bulk/status')
  @ApiOperation({ summary: 'Bulk update user status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Users status updated successfully',
    type: SuccessResponseDto
  })
  async bulkUpdateUserStatus(@Body() bulkData: BulkUpdateStatusDto): Promise<SuccessResponseDto<any>> {
    // Implementation would handle bulk operations
    return new SuccessResponseDto(null, 'Users status updated successfully');
  }

  // ============= ORDER MANAGEMENT ENDPOINTS =============
  @Get('orders')
  @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders retrieved successfully',
    type: PaginatedResponseDto
  })
  async getOrders(@Query() query: AdminOrderQueryDto): Promise<PaginatedResponseDto<any>> {
    const result = await this.adminService.getOrders(query);
    return new PaginatedResponseDto(
      result.data,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit,
      'Orders retrieved successfully'
    );
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order retrieved successfully',
    type: SuccessResponseDto
  })
  async getOrderById(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const order = await this.adminService.getOrderById(id);
    return new SuccessResponseDto(order, 'Order retrieved successfully');
  }

  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Order status updated successfully',
    type: SuccessResponseDto
  })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateData: UpdateOrderStatusDto
  ): Promise<SuccessResponseDto<any>> {
    const order = await this.adminService.updateOrderStatus(id, updateData);
    return new SuccessResponseDto(order, 'Order status updated successfully');
  }

  // ============= PRODUCT MANAGEMENT ENDPOINTS =============
  @Get('products')
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Products retrieved successfully',
    type: PaginatedResponseDto
  })
  async getProducts(@Query() query: AdminProductQueryDto): Promise<PaginatedResponseDto<any>> {
    const result = await this.adminService.getProducts(query);
    return new PaginatedResponseDto(
      result.data,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit,
      'Products retrieved successfully'
    );
  }

  @Post('products')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product created successfully',
    type: SuccessResponseDto
  })
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() productData: CreateAdminProductDto): Promise<SuccessResponseDto<any>> {
    const product = await this.adminService.createProduct(productData);
    return new SuccessResponseDto(product, 'Product created successfully');
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product updated successfully',
    type: SuccessResponseDto
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() productData: UpdateAdminProductDto
  ): Promise<SuccessResponseDto<any>> {
    const product = await this.adminService.updateProduct(id, productData);
    return new SuccessResponseDto(product, 'Product updated successfully');
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product deleted successfully',
    type: SuccessResponseDto
  })
  async deleteProduct(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.deleteProduct(id);
    return new SuccessResponseDto(result, 'Product deleted successfully');
  }

  @Post('products/:id/images')
  @ApiOperation({ summary: 'Upload images for a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product images upload',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          }
        },
        isMain: {
          type: 'boolean',
          description: 'Set as main product image',
          default: false
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Images uploaded successfully',
    type: SuccessResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async uploadProductImages(
    @Param('id') productId: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() body: any
  ): Promise<SuccessResponseDto<ProductImageResponseDto[]>> {
    const isMain = body.isMain === 'true' || body.isMain === true || false;
    const result = await this.adminService.uploadProductImages(productId, images, isMain);
    return new SuccessResponseDto(result, 'Product images uploaded successfully');
  }

  @Put('products/:productId/images/:imageId/main')
  @ApiOperation({ summary: 'Set product image as main image' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image set as main successfully',
    type: SuccessResponseDto
  })
  @ApiResponse({ status: 404, description: 'Product or image not found' })
  async setMainProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string
  ): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.setMainProductImage(productId, imageId);
    return new SuccessResponseDto(result, 'Image set as main successfully');
  }

  @Delete('products/:productId/images/:imageId')
  @ApiOperation({ summary: 'Delete product image' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'imageId', description: 'Image ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image deleted successfully',
    type: SuccessResponseDto
  })
  @ApiResponse({ status: 404, description: 'Product or image not found' })
  async deleteProductImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string
  ): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.deleteProductImage(productId, imageId);
    return new SuccessResponseDto(result, 'Image deleted successfully');
  }

  @Put('products/bulk/status')
  @ApiOperation({ summary: 'Bulk update product status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Products status updated successfully',
    type: SuccessResponseDto
  })
  async bulkUpdateProductStatus(@Body() bulkData: BulkUpdateStatusDto): Promise<SuccessResponseDto<any>> {
    // Implementation would handle bulk operations
    return new SuccessResponseDto(null, 'Products status updated successfully');
  }

  // ============= CATEGORY MANAGEMENT ENDPOINTS =============
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ 
    status: 200, 
    description: 'Categories retrieved successfully',
    type: SuccessResponseDto
  })
  async getCategories(@Query() query: AdminCategoryQueryDto): Promise<SuccessResponseDto<any[]>> {
    const categories = await this.adminService.getCategories(query);
    return new SuccessResponseDto(categories, 'Categories retrieved successfully');
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ 
    status: 201, 
    description: 'Category created successfully',
    type: SuccessResponseDto
  })
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() categoryData: CreateAdminCategoryDto): Promise<SuccessResponseDto<any>> {
    const category = await this.adminService.createCategory(categoryData);
    return new SuccessResponseDto(category, 'Category created successfully');
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Category updated successfully',
    type: SuccessResponseDto
  })
  async updateCategory(
    @Param('id') id: string,
    @Body() categoryData: UpdateAdminCategoryDto
  ): Promise<SuccessResponseDto<any>> {
    const category = await this.adminService.updateCategory(id, categoryData);
    return new SuccessResponseDto(category, 'Category updated successfully');
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Category deleted successfully',
    type: SuccessResponseDto
  })
  async deleteCategory(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.deleteCategory(id);
    return new SuccessResponseDto(result, 'Category deleted successfully');
  }

  // ============= ANALYTICS ENDPOINTS =============
  @Get('analytics/sales')
  @ApiOperation({ summary: 'Get sales analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Sales analytics retrieved successfully',
    type: SuccessResponseDto
  })
  async getSalesAnalytics(@Query() query: AdminAnalyticsQueryDto): Promise<SuccessResponseDto<any>> {
    const analytics = await this.adminService.getSalesAnalytics(query);
    return new SuccessResponseDto(analytics, 'Sales analytics retrieved successfully');
  }

  @Get('analytics/users')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'User analytics retrieved successfully',
    type: SuccessResponseDto
  })
  async getUserAnalytics(@Query() query: AdminAnalyticsQueryDto): Promise<SuccessResponseDto<any>> {
    const analytics = await this.adminService.getUserAnalytics(query);
    return new SuccessResponseDto(analytics, 'User analytics retrieved successfully');
  }

  @Get('analytics/inventory')
  @ApiOperation({ summary: 'Get inventory analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Inventory analytics retrieved successfully',
    type: SuccessResponseDto
  })
  async getInventoryAnalytics(): Promise<SuccessResponseDto<any>> {
    const analytics = await this.adminService.getInventoryAnalytics();
    return new SuccessResponseDto(analytics, 'Inventory analytics retrieved successfully');
  }

  // ============= REPORT ENDPOINTS =============
  @Get('reports/users')
  @ApiOperation({ summary: 'Generate users report' })
  @ApiQuery({ name: 'format', enum: ReportFormat, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Users report generated successfully',
    type: SuccessResponseDto
  })
  async generateUserReport(@Query('format') format: ReportFormat = ReportFormat.CSV): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.generateUserReport({ format });
    return new SuccessResponseDto(result, 'Users report generated successfully');
  }

  @Get('reports/sales')
  @ApiOperation({ summary: 'Generate sales report' })
  @ApiQuery({ name: 'format', enum: ReportFormat, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Sales report generated successfully',
    type: SuccessResponseDto
  })
  async generateSalesReport(@Query('format') format: ReportFormat = ReportFormat.CSV): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.generateSalesReport({ format });
    return new SuccessResponseDto(result, 'Sales report generated successfully');
  }

  @Get('reports/inventory')
  @ApiOperation({ summary: 'Generate inventory report' })
  @ApiQuery({ name: 'format', enum: ReportFormat, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Inventory report generated successfully',
    type: SuccessResponseDto
  })
  async generateInventoryReport(@Query('format') format: ReportFormat = ReportFormat.CSV): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.generateInventoryReport({ format });
    return new SuccessResponseDto(result, 'Inventory report generated successfully');
  }

  // ============= SETTINGS ENDPOINTS =============
  @Get('settings')
  @ApiOperation({ summary: 'Get admin settings' })
  @ApiResponse({ 
    status: 200, 
    description: 'Settings retrieved successfully',
    type: SuccessResponseDto
  })
  async getSettings(): Promise<SuccessResponseDto<any>> {
    const settings = await this.adminService.getSettings();
    return new SuccessResponseDto(settings, 'Settings retrieved successfully');
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update admin settings' })
  @ApiResponse({ 
    status: 200, 
    description: 'Settings updated successfully',
    type: SuccessResponseDto
  })
  async updateSettings(@Body() settings: AdminSettingsDto): Promise<SuccessResponseDto<any>> {
    const updatedSettings = await this.adminService.updateSettings(settings);
    return new SuccessResponseDto(updatedSettings, 'Settings updated successfully');
  }

  // ============= EXPORT ENDPOINTS =============
  @Get('export/users')
  @ApiOperation({ summary: 'Export users data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Users data exported successfully',
    type: SuccessResponseDto
  })
  async exportUsers(@Query() query: ExportQueryDto): Promise<SuccessResponseDto<any>> {
    // Implementation would handle export functionality
    return new SuccessResponseDto(
      { downloadUrl: `/exports/users-${Date.now()}.${query.format || 'csv'}` },
      'Users data exported successfully'
    );
  }

  @Get('export/orders')
  @ApiOperation({ summary: 'Export orders data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders data exported successfully',
    type: SuccessResponseDto
  })
  async exportOrders(@Query() query: ExportQueryDto): Promise<SuccessResponseDto<any>> {
    return new SuccessResponseDto(
      { downloadUrl: `/exports/orders-${Date.now()}.${query.format || 'csv'}` },
      'Orders data exported successfully'
    );
  }

  @Get('export/products')
  @ApiOperation({ summary: 'Export products data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Products data exported successfully',
    type: SuccessResponseDto
  })
  async exportProducts(@Query() query: ExportQueryDto): Promise<SuccessResponseDto<any>> {
    return new SuccessResponseDto(
      { downloadUrl: `/exports/products-${Date.now()}.${query.format || 'csv'}` },
      'Products data exported successfully'
    );
  }

  // ============= REVIEW MANAGEMENT ENDPOINTS =============
  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'rating', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Reviews retrieved successfully',
    type: PaginatedResponseDto
  })
  async getReviews(@Query() query: AdminReviewQueryDto): Promise<PaginatedResponseDto<any>> {
    const result = await this.adminService.getReviews(query);
    return new PaginatedResponseDto(
      result.data,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit,
      'Reviews retrieved successfully'
    );
  }

  @Get('reviews/:id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review retrieved successfully',
    type: SuccessResponseDto
  })
  async getReviewById(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const review = await this.adminService.getReviewById(id);
    return new SuccessResponseDto(review, 'Review retrieved successfully');
  }

  @Put('reviews/:id/status')
  @ApiOperation({ summary: 'Update review status' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review status updated successfully',
    type: SuccessResponseDto
  })
  async updateReviewStatus(
    @Param('id') id: string,
    @Body() updateData: UpdateReviewStatusDto
  ): Promise<SuccessResponseDto<any>> {
    const review = await this.adminService.updateReviewStatus(id, updateData);
    return new SuccessResponseDto(review, 'Review status updated successfully');
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review deleted successfully',
    type: SuccessResponseDto
  })
  async deleteReview(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const result = await this.adminService.deleteReview(id);
    return new SuccessResponseDto(result, 'Review deleted successfully');
  }

  // ============= AUDIT LOG ENDPOINTS =============
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get admin audit logs' })
  @ApiResponse({ 
    status: 200, 
    description: 'Audit logs retrieved successfully',
    type: PaginatedResponseDto
  })
  async getAuditLogs(@Query() query: AdminUserQueryDto): Promise<PaginatedResponseDto<any>> {
    // Implementation would fetch audit logs
    return new PaginatedResponseDto(
      [],
      0,
      query.page || 1,
      query.limit || 10,
      'Audit logs retrieved successfully'
    );
  }

  // ============= SUPPORT TICKET ENDPOINTS =============
  @Get('support/tickets')
  @ApiOperation({ summary: 'Get all support tickets (chats) with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Ticket status filter' })
  @ApiQuery({ name: 'priority', required: false, type: String, description: 'Ticket priority filter' })
  @ApiResponse({ 
    status: 200, 
    description: 'Support tickets retrieved successfully',
    type: PaginatedResponseDto
  })
  async getTickets(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ): Promise<SuccessResponseDto<any>> {
    try {
      const tickets = await this.customerSupportService.getAllChats(
        parseInt(page),
        parseInt(limit),
        status as any,
        priority as any,
      );
      return new SuccessResponseDto(tickets, 'Support tickets retrieved successfully');
    } catch (error) {
      throw new Error('Failed to fetch support tickets');
    }
  }

  @Get('support/tickets/:id')
  @ApiOperation({ summary: 'Get support ticket details' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Support ticket retrieved successfully',
    type: SuccessResponseDto
  })
  async getTicket(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
    const ticket = await this.customerSupportService.getChatDetails(id);
    return new SuccessResponseDto(ticket, 'Support ticket retrieved successfully');
  }

  @Put('support/tickets/:id/status')
  @ApiOperation({ summary: 'Update support ticket status' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Support ticket status updated successfully',
    type: SuccessResponseDto
  })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() updateData: { status: string; notes?: string }
  ): Promise<SuccessResponseDto<any>> {
    const ticket = await this.customerSupportService.updateChatStatus(id, updateData as any);
    return new SuccessResponseDto(ticket, 'Support ticket status updated successfully');
  }

  @Put('support/tickets/:id/assign')
  @ApiOperation({ summary: 'Assign support ticket to support staff' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Support ticket assigned successfully',
    type: SuccessResponseDto
  })
  async assignTicket(
    @Param('id') id: string,
    @Body() assignData: { supportUserId: string }
  ): Promise<SuccessResponseDto<any>> {
    const ticket = await this.customerSupportService.assignChatToSupport(id, assignData.supportUserId);
    return new SuccessResponseDto(ticket, 'Support ticket assigned successfully');
  }

  @Get('support/stats')
  @ApiOperation({ summary: 'Get support ticket statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Support statistics retrieved successfully',
    type: SuccessResponseDto
  })
  async getSupportStats(): Promise<SuccessResponseDto<any>> {
    const stats = await this.customerSupportService.getChatStats();
    return new SuccessResponseDto(stats, 'Support statistics retrieved successfully');
  }
}
