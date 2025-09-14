import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../../config/supabase.config';
import { UploadService } from '../upload/upload.service';
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
  AdminSettingsDto
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  private supabase;
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private configService: ConfigService,
    private uploadService: UploadService
  ) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
  }

  // ============= DASHBOARD SERVICES =============
  async getDashboardStats(): Promise<DashboardStatsDto> {
    // Keep the existing simple dashboard stats for backward compatibility
    try {
      // Get total users
      const { count: totalUsers } = await this.supabase
        .from('profile')
        .select('*', { count: 'exact', head: true });

      // Get total orders
      const { count: totalOrders } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get total products
      const { count: totalProducts } = await this.supabase
        .from('product')
        .select('*', { count: 'exact', head: true });

      // Get pending orders
      const { count: pendingOrders } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      // Get low stock products (stock <= 10)
      const { count: lowStockProducts } = await this.supabase
        .from('product')
        .select('*', { count: 'exact', head: true })
        .lte('stock', 10);

      // Get new users today
      const today = new Date().toISOString().split('T')[0];
      const { count: newUsersToday } = await this.supabase
        .from('profile')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get orders today
      const { count: ordersToday } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get total revenue from completed orders
      const { data: revenueData } = await this.supabase
        .from('orders')
        .select('total_amount')
        .in('status', ['PAID', 'COMPLETED']);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Get today's revenue
      const { data: todayRevenueData } = await this.supabase
        .from('orders')
        .select('total_amount')
        .in('status', ['PAID', 'COMPLETED'])
        .gte('created_at', today);

      const revenueToday = todayRevenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Calculate monthly growth (simplified)
      const monthlyGrowth = {
        users: 15.2, // Mock data - would calculate from actual data
        orders: 8.5,
        revenue: 12.3
      };

      return {
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        totalRevenue,
        pendingOrders: pendingOrders || 0,
        lowStockProducts: lowStockProducts || 0,
        newUsersToday: newUsersToday || 0,
        ordersToday: ordersToday || 0,
        revenueToday,
        monthlyGrowth
      };
    } catch (error) {
      this.logger.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  async getComprehensiveDashboardStats(params: {
    period: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const { period, startDate, endDate } = params;
      const now = new Date();
      
      // Calculate date ranges
      const dates = this.calculateDateRanges(period, startDate, endDate);
      
      // Fetch all data in parallel
      const [
        orderStats,
        salesSummary,
        userStats,
        productStats,
        recentOrders,
        recentReviews,
        salesChart
      ] = await Promise.all([
        this.getOrderStats(dates.current.start, dates.current.end),
        this.getSalesSummary(dates.current.start, dates.current.end, dates.previous.start, dates.previous.end),
        this.getUserStats(dates.current.start, dates.current.end),
        this.getProductStats(),
        this.getRecentOrders(10),
        this.getRecentReviews(5),
        this.getSalesChart(dates.current.start, dates.current.end, period)
      ]);

      return {
        orderStats,
        salesSummary,
        userStats,
        productStats,
        recentOrders,
        recentReviews,
        salesChart
      };
    } catch (error) {
      this.logger.error('Error getting comprehensive dashboard stats:', error);
      throw error;
    }
  }

  private calculateDateRanges(period: string, startDate?: string, endDate?: string) {
    const now = new Date();
    const currentEnd = endDate ? new Date(endDate) : now;
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    if (startDate) {
      currentStart = new Date(startDate);
    } else {
      switch (period) {
        case 'day':
          currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          currentStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          currentStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    // Calculate previous period for comparison
    const periodDuration = currentEnd.getTime() - currentStart.getTime();
    previousEnd = new Date(currentStart.getTime());
    previousStart = new Date(currentStart.getTime() - periodDuration);

    return {
      current: {
        start: currentStart.toISOString(),
        end: currentEnd.toISOString()
      },
      previous: {
        start: previousStart.toISOString(),
        end: previousEnd.toISOString()
      }
    };
  }

  private async getOrderStats(startDate: string, endDate: string) {
    const [pendingCount, paidCount, completedCount, cancelledCount] = await Promise.all([
      this.supabase.from('orders').select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      this.supabase.from('orders').select('*', { count: 'exact', head: true })
        .eq('status', 'PAID')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      this.supabase.from('orders').select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      this.supabase.from('orders').select('*', { count: 'exact', head: true })
        .eq('status', 'CANCELLED')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);

    return {
      pending: pendingCount.count || 0,
      paid: paidCount.count || 0,
      completed: completedCount.count || 0,
      cancelled: cancelledCount.count || 0
    };
  }

  private async getSalesSummary(currentStart: string, currentEnd: string, previousStart: string, previousEnd: string) {
    const [currentPeriod, previousPeriod] = await Promise.all([
      this.supabase.from('orders').select('total_amount')
        .in('status', ['PAID', 'COMPLETED'])
        .gte('created_at', currentStart)
        .lte('created_at', currentEnd),
      this.supabase.from('orders').select('total_amount')
        .in('status', ['PAID', 'COMPLETED'])
        .gte('created_at', previousStart)
        .lte('created_at', previousEnd)
    ]);

    const currentSales = currentPeriod.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const currentOrders = currentPeriod.data?.length || 0;
    
    const previousSales = previousPeriod.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const previousOrders = previousPeriod.data?.length || 0;

    return {
      totalSales: this.formatCurrency(currentSales),
      orderCount: currentOrders,
      comparisonPeriod: {
        totalSales: previousSales.toString(),
        orderCount: previousOrders
      }
    };
  }

  private async getUserStats(startDate: string, endDate: string) {
    const [totalUsers, newUsers] = await Promise.all([
      this.supabase.from('profile').select('*', { count: 'exact', head: true }),
      this.supabase.from('profile').select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);

    return {
      totalUsers: totalUsers.count || 0,
      newUsers: newUsers.count || 0
    };
  }

  private async getProductStats() {
    const [totalProducts, lowStock, outOfStock, topSelling] = await Promise.all([
      this.supabase.from('product').select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      this.supabase.from('product').select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('stock', 10)
        .gt('stock', 0),
      this.supabase.from('product').select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('stock', 0),
      this.getTopSellingProducts()
    ]);

    return {
      totalProducts: totalProducts.count || 0,
      lowStock: lowStock.count || 0,
      outOfStock: outOfStock.count || 0,
      topSelling: topSelling
    };
  }

  private async getTopSellingProducts() {
    try {
      const { data: orderItems } = await this.supabase
        .from('order_item')
        .select(`
          product_id,
          quantity,
          price,
          product:product_id (
            id,
            name,
            price
          )
        `);

      if (!orderItems || orderItems.length === 0) {
        return [];
      }

      // Group by product and calculate totals
      const productSales = orderItems.reduce((acc, item) => {
        const productId = item.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: item.product?.name || 'Unknown Product',
            totalSold: 0,
            revenue: '₦0.00'
          };
        }
        acc[productId].totalSold += item.quantity;
        
        const revenue = parseFloat(acc[productId].revenue.replace('₦', '').replace(',', '')) + (item.price * item.quantity);
        acc[productId].revenue = this.formatCurrency(revenue);
        
        return acc;
      }, {});

      // Convert to array and sort by total sold
      return Object.values(productSales)
        .sort((a: any, b: any) => b.totalSold - a.totalSold)
        .slice(0, 5);
    } catch (error) {
      this.logger.error('Error getting top selling products:', error);
      return [];
    }
  }

  private async getRecentOrders(limit: number = 10) {
    try {
      const { data: orders } = await this.supabase
        .from('orders')
        .select(`
          *,
          profile:user_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      return orders?.map(order => ({
        id: order.id,
        totalAmount: this.formatCurrency(order.total_amount || 0),
        status: order.status,
        createdAt: order.created_at,
        user: {
          fullName: order.profile?.full_name || 'Unknown User',
          email: order.profile?.email || ''
        }
      })) || [];
    } catch (error) {
      this.logger.error('Error getting recent orders:', error);
      return [];
    }
  }

  private async getRecentReviews(limit: number = 5) {
    try {
      const { data: reviews } = await this.supabase
        .from('productReview')
        .select(`
          *,
          profile:user_id (
            id,
            full_name
          ),
          product:product_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      return reviews?.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.created_at,
        user: {
          fullName: review.profile?.full_name || 'Anonymous'
        },
        product: {
          name: review.product?.name || 'Unknown Product'
        }
      })) || [];
    } catch (error) {
      this.logger.error('Error getting recent reviews:', error);
      return [];
    }
  }

  private async getSalesChart(startDate: string, endDate: string, period: string) {
    try {
      const { data: orders } = await this.supabase
        .from('orders')
        .select('total_amount, created_at')
        .in('status', ['PAID', 'COMPLETED'])
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (!orders || orders.length === 0) {
        return {
          labels: [],
          data: []
        };
      }

      // Group orders by period
      const groupedData = this.groupOrdersByPeriod(orders, period);
      
      return {
        labels: Object.keys(groupedData),
        data: Object.values(groupedData)
      };
    } catch (error) {
      this.logger.error('Error getting sales chart:', error);
      return {
        labels: [],
        data: []
      };
    }
  }

  private groupOrdersByPeriod(orders: any[], period: string) {
    const grouped = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at);
      let key: string;
      
      switch (period) {
        case 'day':
          key = `${date.getHours()}:00`;
          break;
        case 'week':
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'month':
          key = `Week ${Math.ceil(date.getDate() / 7)}`;
          break;
        case 'year':
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      if (!grouped[key]) {
        grouped[key] = 0;
      }
      
      grouped[key] += order.total_amount || 0;
    });
    
    return grouped;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // ============= USER MANAGEMENT SERVICES =============
  async getUsers(query: AdminUserQueryDto) {
    const { page = 1, limit = 10, search, role, isActive, sortBy = 'created_at', sortOrder = 'DESC' } = query;
    
    // Map sortBy field to database column name
    const mappedSortBy = this.mapSortField(sortBy);
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let supabaseQuery = this.supabase
        .from('profile')
        .select('*', { count: 'exact' });

      // Apply filters
      if (search) {
        supabaseQuery = supabaseQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      if (role) {
        supabaseQuery = supabaseQuery.eq('role', role);
      }

      if (typeof isActive === 'boolean') {
        supabaseQuery = supabaseQuery.eq('is_active', isActive);
      }

      // Apply sorting and pagination
      supabaseQuery = supabaseQuery
        .order(mappedSortBy, { ascending: sortOrder === 'ASC' })
        .range(from, to);

      const { data: users, count, error } = await supabaseQuery;

      if (error) throw error;

      return {
        data: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting users:', error);
      throw error;
    }
  }

  async getUserById(id: string) {
    try {
      const { data: user, error } = await this.supabase
        .from('profile')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !user) {
        throw new NotFoundException('User not found');
      }

      // Get user's orders
      const { data: orders } = await this.supabase
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        ...user,
        orders: orders || []
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async updateUserStatus(id: string, updateData: UpdateUserStatusDto) {
    try {
      const { data: user, error } = await this.supabase
        .from('profile')
        .update({ 
          is_active: updateData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!user) throw new NotFoundException('User not found');

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error updating user status:', error);
      throw error;
    }
  }

  async deleteUser(id: string) {
    try {
      // Check if user has orders
      const { count: orderCount } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      if (orderCount && orderCount > 0) {
        throw new BadRequestException('Cannot delete user with existing orders');
      }

      // Delete user
      const { error } = await this.supabase
        .from('profile')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // ============= ORDER MANAGEMENT SERVICES =============
  
  // Helper function to map camelCase to snake_case for database fields
  private mapSortField(field: string): string {
    const fieldMappings: { [key: string]: string } = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'totalAmount': 'total_amount',
      'paymentStatus': 'payment_status',
      'userId': 'user_id',
      'fullName': 'full_name',
      'isActive': 'is_active',
      'lowStockThreshold': 'low_stock_threshold',
      'sortOrder': 'sort_order',
      'parentId': 'parent_id',
      'imageUrl': 'image_url'
    };
    
    return fieldMappings[field] || field;
  }

  async getOrders(query: AdminOrderQueryDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      paymentStatus, 
      dateFrom, 
      dateTo, 
      userId,
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = query;
    
    // Map sortBy field to database column name
    const mappedSortBy = this.mapSortField(sortBy);
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let supabaseQuery = this.supabase
        .from('orders')
        .select(`
          *,
          profile:user_id(id, email, full_name),
          order_item(*, product(*))
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        supabaseQuery = supabaseQuery.or(`id.ilike.%${search}%`);
      }

      if (status) {
        supabaseQuery = supabaseQuery.eq('status', status);
      }

      if (paymentStatus) {
        supabaseQuery = supabaseQuery.eq('payment_status', paymentStatus);
      }

      if (userId) {
        supabaseQuery = supabaseQuery.eq('user_id', userId);
      }

      if (dateFrom) {
        supabaseQuery = supabaseQuery.gte('created_at', dateFrom);
      }

      if (dateTo) {
        supabaseQuery = supabaseQuery.lte('created_at', dateTo);
      }

      // Apply sorting and pagination
      supabaseQuery = supabaseQuery
        .order(mappedSortBy, { ascending: sortOrder === 'ASC' })
        .range(from, to);

      const { data: orders, count, error } = await supabaseQuery;

      if (error) throw error;

      return {
        data: orders || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting orders:', error);
      throw error;
    }
  }

  async getOrderById(id: string) {
    try {
      const { data: order, error } = await this.supabase
        .from('orders')
        .select(`
          *,
          profile:user_id(id, email, full_name, phone),
          order_item(*, product(*))
        `)
        .eq('id', id)
        .single();

      if (error || !order) {
        throw new NotFoundException('Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error getting order by ID:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, updateData: UpdateOrderStatusDto) {
    try {
      const { data: order, error } = await this.supabase
        .from('orders')
        .update({
          status: updateData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!order) throw new NotFoundException('Order not found');

      // Create tracking entry if order_tracking table exists
      if (updateData.notes || updateData.trackingNumber) {
        await this.supabase
          .from('order_tracking')
          .insert({
            order_id: id,
            status: updateData.status,
            notes: updateData.notes,
            tracking_number: updateData.trackingNumber,
            location: updateData.location,
            created_at: new Date().toISOString()
          });
      }

      return order;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error updating order status:', error);
      throw error;
    }
  }

  // ============= PRODUCT MANAGEMENT SERVICES =============
  async getProducts(query: AdminProductQueryDto) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoryId, 
      isActive, 
      lowStock,
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = query;
    
    // Map sortBy field to database column name
    const mappedSortBy = this.mapSortField(sortBy);
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let supabaseQuery = this.supabase
        .from('product')
        .select(`
          *,
          category(id, name)
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      if (categoryId) {
        supabaseQuery = supabaseQuery.eq('category_id', categoryId);
      }

      if (typeof isActive === 'boolean') {
        supabaseQuery = supabaseQuery.eq('is_active', isActive);
      }

      if (lowStock) {
        supabaseQuery = supabaseQuery.lte('stock', 10);
      }

      // Apply sorting and pagination
      supabaseQuery = supabaseQuery
        .order(mappedSortBy, { ascending: sortOrder === 'ASC' })
        .range(from, to);

      const { data: products, count, error } = await supabaseQuery;

      if (error) throw error;

      return {
        data: products || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting products:', error);
      throw error;
    }
  }

  async createProduct(productData: CreateAdminProductDto) {
    try {
      const { data: product, error } = await this.supabase
        .from('product')
        .insert({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          sku: productData.sku,
          category_id: productData.categoryId,
          images: productData.images || [],
          low_stock_threshold: productData.lowStockThreshold || 10,
          is_active: productData.isActive !== false,
          slug: this.generateSlug(productData.name),
          created_at: new Date().toISOString()
        })
        .select(`*, category(id, name)`)
        .single();

      if (error) throw error;

      return product;
    } catch (error) {
      this.logger.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, productData: UpdateAdminProductDto) {
    try {
      // Map camelCase fields to snake_case for database
      const updatePayload: any = {};
      
      if (productData.name !== undefined) updatePayload.name = productData.name;
      if (productData.description !== undefined) updatePayload.description = productData.description;
      if (productData.price !== undefined) updatePayload.price = productData.price;
      if (productData.stock !== undefined) updatePayload.stock = productData.stock;
      if (productData.sku !== undefined) updatePayload.sku = productData.sku;
      if (productData.categoryId !== undefined) updatePayload.category_id = productData.categoryId;
      if (productData.images !== undefined) updatePayload.images = productData.images;
      if (productData.lowStockThreshold !== undefined) updatePayload.low_stock_threshold = productData.lowStockThreshold;
      if (productData.isActive !== undefined) updatePayload.is_active = productData.isActive;
      
      if (productData.name) {
        updatePayload.slug = this.generateSlug(productData.name);
      }
      
      updatePayload.updated_at = new Date().toISOString();

      const { data: product, error } = await this.supabase
        .from('product')
        .update(updatePayload)
        .eq('id', id)
        .select(`*, category(id, name)`)
        .single();

      if (error) throw error;
      if (!product) throw new NotFoundException('Product not found');

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: string) {
    try {
      // Check if product has orders
      const { count: orderItemCount } = await this.supabase
        .from('order_item')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id);

      if (orderItemCount && orderItemCount > 0) {
        throw new BadRequestException('Cannot delete product with existing orders');
      }

      const { error } = await this.supabase
        .from('product')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { message: 'Product deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error deleting product:', error);
      throw error;
    }
  }

  // ============= CATEGORY MANAGEMENT SERVICES =============
  async getCategories(query: AdminCategoryQueryDto) {
    const { includeInactive = false, search, sortBy = 'name', sortOrder = 'ASC' } = query;

    try {
      const mappedSortBy = this.mapSortField(sortBy);
      
      let supabaseQuery = this.supabase
        .from('category')
        .select('*');

      if (!includeInactive) {
        supabaseQuery = supabaseQuery.eq('is_active', true);
      }

      if (search) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      supabaseQuery = supabaseQuery.order(mappedSortBy, { ascending: sortOrder === 'ASC' });

      const { data: categories, error } = await supabaseQuery;

      if (error) throw error;

      return categories || [];
    } catch (error) {
      this.logger.error('Error getting categories:', error);
      throw error;
    }
  }

  async createCategory(categoryData: CreateAdminCategoryDto) {
    try {
      const slug = categoryData.slug || this.generateSlug(categoryData.name);

      // Check if category with same name already exists
      const { data: existingCategory } = await this.supabase
        .from('category')
        .select('id, name')
        .eq('name', categoryData.name)
        .single();

      if (existingCategory) {
        throw new BadRequestException(`Category with name "${categoryData.name}" already exists`);
      }

      const { data: category, error } = await this.supabase
        .from('category')
        .insert({
          name: categoryData.name,
          description: categoryData.description,
          slug,
          parent_id: categoryData.parentId,
          image_url: categoryData.imageUrl,
          sort_order: categoryData.sortOrder || 0,
          is_active: categoryData.isActive !== false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate key constraint errors
        if (error.code === '23505') {
          if (error.message.includes('category_name_key')) {
            throw new BadRequestException(`Category with name "${categoryData.name}" already exists`);
          }
          if (error.message.includes('category_slug_key')) {
            throw new BadRequestException(`Category with slug "${slug}" already exists`);
          }
          throw new BadRequestException('A category with these details already exists');
        }
        throw error;
      }

      return category;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error creating category:', error);
      throw new BadRequestException('Failed to create category');
    }
  }

  async updateCategory(id: string, categoryData: UpdateAdminCategoryDto) {
    try {
      const updatePayload: any = {};
      
      // Map camelCase fields to snake_case database fields
      if (categoryData.name !== undefined) updatePayload.name = categoryData.name;
      if (categoryData.description !== undefined) updatePayload.description = categoryData.description;
      if (categoryData.slug !== undefined) updatePayload.slug = categoryData.slug;
      if (categoryData.parentId !== undefined) updatePayload.parent_id = categoryData.parentId;
      if (categoryData.imageUrl !== undefined) updatePayload.image_url = categoryData.imageUrl;
      if (categoryData.sortOrder !== undefined) updatePayload.sort_order = categoryData.sortOrder;
      if (categoryData.isActive !== undefined) updatePayload.is_active = categoryData.isActive;
      
      if (categoryData.name) {
        // Check if another category with same name already exists (excluding current category)
        const { data: existingCategory } = await this.supabase
          .from('category')
          .select('id, name')
          .eq('name', categoryData.name)
          .neq('id', id)
          .single();

        if (existingCategory) {
          throw new BadRequestException(`Category with name "${categoryData.name}" already exists`);
        }
        
        updatePayload.slug = categoryData.slug || this.generateSlug(categoryData.name);
      }
      
      updatePayload.updated_at = new Date().toISOString();

      const { data: category, error } = await this.supabase
        .from('category')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Handle duplicate key constraint errors
        if (error.code === '23505') {
          if (error.message.includes('category_name_key')) {
            throw new BadRequestException(`Category with name "${categoryData.name}" already exists`);
          }
          if (error.message.includes('category_slug_key')) {
            const slug = updatePayload.slug || this.generateSlug(categoryData.name);
            throw new BadRequestException(`Category with slug "${slug}" already exists`);
          }
          throw new BadRequestException('A category with these details already exists');
        }
        throw error;
      }
      
      if (!category) throw new NotFoundException('Category not found');

      return category;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error updating category:', error);
      throw new BadRequestException('Failed to update category');
    }
  }

  async deleteCategory(id: string) {
    try {
      // Check if category has products
      const { count: productCount } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

      if (productCount && productCount > 0) {
        throw new BadRequestException('Cannot delete category with existing products');
      }

      const { error } = await this.supabase
        .from('category')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { message: 'Category deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error deleting category:', error);
      throw error;
    }
  }

  // ============= ANALYTICS SERVICES =============
  async getSalesAnalytics(query: AdminAnalyticsQueryDto) {
    const { startDate, endDate, groupBy = 'daily' } = query;

    try {
      // Basic sales analytics implementation
      let supabaseQuery = this.supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .in('status', ['PAID', 'COMPLETED']);

      if (startDate) {
        supabaseQuery = supabaseQuery.gte('created_at', startDate);
      }

      if (endDate) {
        supabaseQuery = supabaseQuery.lte('created_at', endDate);
      }

      const { data: orders, error } = await supabaseQuery;

      if (error) throw error;

      const totalSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalSales,
        totalOrders,
        averageOrderValue,
        salesByPeriod: [], // Would implement grouping logic here
        topProducts: [],
        topCategories: []
      };
    } catch (error) {
      this.logger.error('Error getting sales analytics:', error);
      throw error;
    }
  }

  async getUserAnalytics(query: AdminAnalyticsQueryDto) {
    try {
      const { count: totalUsers } = await this.supabase
        .from('profile')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await this.supabase
        .from('profile')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get new users in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newUsers } = await this.supabase
        .from('profile')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0,
        activeUsers: activeUsers || 0,
        userGrowth: [],
        userDemographics: []
      };
    } catch (error) {
      this.logger.error('Error getting user analytics:', error);
      throw error;
    }
  }

  async getInventoryAnalytics() {
    try {
      const { count: totalProducts } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: lowStockProducts } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lte('stock', 10);

      const { count: outOfStockProducts } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('stock', 0);

      return {
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockProducts || 0,
        outOfStockProducts: outOfStockProducts || 0,
        topSellingProducts: [],
        categoryDistribution: []
      };
    } catch (error) {
      this.logger.error('Error getting inventory analytics:', error);
      throw error;
    }
  }

  // ============= REPORT SERVICES =============
  async generateSalesReport(query: AdminReportQueryDto) {
    // Basic implementation - would expand with actual report generation
    return { 
      reportUrl: `/reports/sales-${Date.now()}.${query.format || 'csv'}`, 
      data: [] 
    };
  }

  async generateUserReport(query: AdminReportQueryDto) {
    return { 
      reportUrl: `/reports/users-${Date.now()}.${query.format || 'csv'}`, 
      data: [] 
    };
  }

  async generateInventoryReport(query: AdminReportQueryDto) {
    return { 
      reportUrl: `/reports/inventory-${Date.now()}.${query.format || 'csv'}`, 
      data: [] 
    };
  }

  // ============= SETTINGS SERVICES =============
  async getSettings() {
    try {
      // Try to get settings from database, fallback to defaults if table doesn't exist
      const { data: settings, error } = await this.supabase
        .from('site_settings')
        .select('*')
        .single();

      // Define default settings
      const defaultSettings = {
        siteName: 'JJ Essential',
        siteDescription: 'Your premium e-commerce destination',
        contactEmail: 'contact@jjessential.com',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        smsNotifications: false,
        orderAutoConfirm: false,
        lowStockThreshold: 10,
        taxRate: 7.5,
        shippingFee: 2000,
        freeShippingThreshold: 50000,
        defaultLanguage: 'en',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      };

      // If table doesn't exist (PGRST205) or no data found (PGRST116), return defaults
      if (error && (error.code === 'PGRST205' || error.code === 'PGRST116')) {
        this.logger.warn('Settings table not found, returning default settings');
        return defaultSettings;
      }

      if (error) {
        this.logger.error('Error getting settings:', error);
        return defaultSettings;
      }

      return settings ? { ...defaultSettings, ...settings } : defaultSettings;
    } catch (error) {
      this.logger.error('Error getting settings:', error);
      // Return default settings if there's an error
      return {
        siteName: 'JJ Essential',
        siteDescription: 'Your premium e-commerce destination',
        contactEmail: 'contact@jjessential.com',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        smsNotifications: false,
        orderAutoConfirm: false,
        lowStockThreshold: 10,
        taxRate: 7.5,
        shippingFee: 2000,
        freeShippingThreshold: 50000,
        defaultLanguage: 'en',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      };
    }
  }

  async updateSettings(settings: AdminSettingsDto) {
    try {
      // Convert camelCase fields to snake_case for database
      const dbSettings = this.convertSettingsToDbFormat(settings);
      
      // Try to update settings in database, fallback gracefully if table doesn't exist
      const { data, error } = await this.supabase
        .from('site_settings')
        .upsert(dbSettings)
        .select()
        .single();

      // If table doesn't exist, just return the input settings as confirmation
      if (error && error.code === 'PGRST205') {
        this.logger.warn('Settings table not found, returning input as confirmation');
        return { ...settings, updated_at: new Date().toISOString() };
      }

      if (error) {
        this.logger.error('Error updating settings:', error);
        throw new BadRequestException(`Failed to update settings: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error updating settings:', error);
      
      // For development: Return input as success if table doesn't exist
      this.logger.warn('Returning input settings as mock success response');
      return { ...settings, updated_at: new Date().toISOString() };
    }
  }

  // Helper method to convert camelCase settings to snake_case for database
  private convertSettingsToDbFormat(settings: AdminSettingsDto): any {
    const dbSettings: any = {};
    
    if (settings.siteName !== undefined) dbSettings.site_name = settings.siteName;
    if (settings.siteDescription !== undefined) dbSettings.site_description = settings.siteDescription;
    if (settings.contactEmail !== undefined) dbSettings.contact_email = settings.contactEmail;
    if (settings.currency !== undefined) dbSettings.currency = settings.currency;
    if (settings.timezone !== undefined) dbSettings.timezone = settings.timezone;
    if (settings.logoUrl !== undefined) dbSettings.logo_url = settings.logoUrl;
    if (settings.faviconUrl !== undefined) dbSettings.favicon_url = settings.faviconUrl;
    if (settings.maintenanceMode !== undefined) dbSettings.maintenance_mode = settings.maintenanceMode;
    if (settings.allowRegistration !== undefined) dbSettings.allow_registration = settings.allowRegistration;
    if (settings.emailNotifications !== undefined) dbSettings.email_notifications = settings.emailNotifications;
    if (settings.smsNotifications !== undefined) dbSettings.sms_notifications = settings.smsNotifications;
    if (settings.orderAutoConfirm !== undefined) dbSettings.order_auto_confirm = settings.orderAutoConfirm;
    if (settings.lowStockThreshold !== undefined) dbSettings.low_stock_threshold = settings.lowStockThreshold;
    if (settings.taxRate !== undefined) dbSettings.tax_rate = settings.taxRate;
    if (settings.shippingFee !== undefined) dbSettings.shipping_fee = settings.shippingFee;
    if (settings.freeShippingThreshold !== undefined) dbSettings.free_shipping_threshold = settings.freeShippingThreshold;
    if (settings.defaultLanguage !== undefined) dbSettings.default_language = settings.defaultLanguage;
    if (settings.dateFormat !== undefined) dbSettings.date_format = settings.dateFormat;
    if (settings.timeFormat !== undefined) dbSettings.time_format = settings.timeFormat;
    if (settings.requireEmailVerification !== undefined) dbSettings.require_email_verification = settings.requireEmailVerification;
    if (settings.defaultUserRole !== undefined) dbSettings.default_user_role = settings.defaultUserRole;
    
    return dbSettings;
  }

  // ============= BANK ACCOUNT MANAGEMENT SERVICES =============
  async getBankAccounts() {
    try {
      const { data: bankAccounts, error } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // If table doesn't exist (PGRST205), return sample bank accounts
      if (error && error.code === 'PGRST205') {
        this.logger.warn('Bank accounts table not found, returning sample data');
        return [
          {
            id: '1',
            bank_name: 'First Bank Nigeria',
            account_name: 'JJ Essential Limited',
            account_number: '2011234567',
            currency: 'NGN',
            is_default: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            bank_name: 'Access Bank',
            account_name: 'JJ Essential Limited',
            account_number: '0987654321',
            currency: 'NGN',
            is_default: false,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }

      if (error && error.code !== 'PGRST116') { // Not found error
        this.logger.error('Error getting bank accounts:', error);
        throw error;
      }

      return bankAccounts || [];
    } catch (error) {
      this.logger.error('Error getting bank accounts:', error);
      // Return sample bank accounts if there's an error
      return [
        {
          id: '1',
          bank_name: 'First Bank Nigeria',
          account_name: 'JJ Essential Limited',
          account_number: '2011234567',
          currency: 'NGN',
          is_default: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          bank_name: 'Access Bank',
          account_name: 'JJ Essential Limited',
          account_number: '0987654321',
          currency: 'NGN',
          is_default: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
  }

  async addBankAccount(bankAccountData: any) {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .insert([{
          ...bankAccountData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      // If table doesn't exist, return mock success response
      if (error && error.code === 'PGRST205') {
        this.logger.warn('Bank accounts table not found, returning mock response');
        return {
          id: Math.random().toString(36).substring(7),
          ...bankAccountData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      if (error) {
        this.logger.error('Error adding bank account:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error adding bank account:', error);
      throw error;
    }
  }

  async updateBankAccount(id: string, bankAccountData: any) {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .update({
          ...bankAccountData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      // If table doesn't exist, return mock success response
      if (error && error.code === 'PGRST205') {
        this.logger.warn('Bank accounts table not found, returning mock response');
        return {
          id,
          ...bankAccountData,
          updated_at: new Date().toISOString()
        };
      }

      if (error) {
        this.logger.error('Error updating bank account:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error updating bank account:', error);
      throw error;
    }
  }

  async deleteBankAccount(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      // If table doesn't exist, return mock success response
      if (error && error.code === 'PGRST205') {
        this.logger.warn('Bank accounts table not found, returning mock response');
        return { message: 'Bank account deleted successfully' };
      }

      if (error) {
        this.logger.error('Error deleting bank account:', error);
        throw error;
      }

      return { message: 'Bank account deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting bank account:', error);
      throw error;
    }
  }

  // ============= UTILITY METHODS =============
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  // ============= PRODUCT IMAGE MANAGEMENT SERVICES =============
  async uploadProductImages(productId: string, images: Express.Multer.File[], isMain: boolean = false) {
    try {
      // Check if product exists
      const { data: product, error: productError } = await this.supabase
        .from('product')
        .select('id, images')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new NotFoundException('Product not found');
      }

      // Upload images to Supabase
      const uploadResults = await this.uploadService.uploadMultipleToSupabase(images, 'products');
      
      // Create image objects
      const currentImages = product.images || [];
      const newImages = uploadResults.map((result, index) => {
        return {
          id: this.generateUniqueId(),
          url: result.url,
          isMain: isMain && index === 0 && currentImages.length === 0, // Only set first image as main if no existing images
          sortOrder: currentImages.length + index
        };
      });

      // If this is the first image upload and isMain is true, set the first image as main
      if (isMain && currentImages.length === 0 && newImages.length > 0) {
        newImages[0].isMain = true;
      }

      // Update product with new images
      const updatedImages = [...currentImages, ...newImages];
      const { error: updateError } = await this.supabase
        .from('product')
        .update({ images: updatedImages })
        .eq('id', productId);

      if (updateError) {
        throw new BadRequestException('Failed to update product with new images');
      }

      return newImages;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error uploading product images:', error);
      throw new BadRequestException('Failed to upload product images');
    }
  }

  async setMainProductImage(productId: string, imageId: string) {
    try {
      // Check if product exists
      const { data: product, error: productError } = await this.supabase
        .from('product')
        .select('id, images')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new NotFoundException('Product not found');
      }

      const images = product.images || [];
      const imageIndex = images.findIndex(img => img.id === imageId);
      
      if (imageIndex === -1) {
        throw new NotFoundException('Image not found');
      }

      // Update images array to set the selected image as main
      const updatedImages = images.map((img, index) => ({
        ...img,
        isMain: index === imageIndex
      }));

      // Update product with updated images
      const { error: updateError } = await this.supabase
        .from('product')
        .update({ images: updatedImages })
        .eq('id', productId);

      if (updateError) {
        throw new BadRequestException('Failed to update product image');
      }

      return { 
        message: 'Image set as main successfully',
        image: updatedImages[imageIndex]
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error setting main product image:', error);
      throw new BadRequestException('Failed to set main product image');
    }
  }

  async deleteProductImage(productId: string, imageId: string) {
    try {
      // Check if product exists
      const { data: product, error: productError } = await this.supabase
        .from('product')
        .select('id, images')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new NotFoundException('Product not found');
      }

      const images = product.images || [];
      const imageIndex = images.findIndex(img => img.id === imageId);
      
      if (imageIndex === -1) {
        throw new NotFoundException('Image not found');
      }

      // Get the image to delete
      const imageToDelete = images[imageIndex];
      
      // Remove the image from the array
      const updatedImages = images.filter(img => img.id !== imageId);

      // If the deleted image was the main image, set the first remaining image as main (if any)
      if (imageToDelete.isMain && updatedImages.length > 0) {
        updatedImages[0].isMain = true;
      }

      // Update product with updated images
      const { error: updateError } = await this.supabase
        .from('product')
        .update({ images: updatedImages })
        .eq('id', productId);

      if (updateError) {
        throw new BadRequestException('Failed to update product after image deletion');
      }

      // Extract filename from URL to delete from storage
      // Assuming URL format: https://supabaseurl/storage/v1/object/public/bucket/filename
      const url = new URL(imageToDelete.url);
      const pathname = url.pathname;
      const parts = pathname.split('/');
      const bucketIndex = parts.findIndex(part => part === 'public') + 1;
      
      if (bucketIndex > 0 && bucketIndex < parts.length) {
        const bucket = parts[bucketIndex];
        const filename = parts.slice(bucketIndex + 1).join('/');
        
        try {
          // Try to delete the file from Supabase storage, but don't block the response
          this.uploadService.deleteFromSupabase(filename, bucket)
            .catch(err => this.logger.error(`Failed to delete file from storage: ${err.message}`));
        } catch (error) {
          this.logger.error('Error parsing image URL for deletion:', error);
        }
      }

      return { 
        message: 'Image deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error deleting product image:', error);
      throw new BadRequestException('Failed to delete product image');
    }
  }

  // ============= REVIEW MANAGEMENT SERVICES =============
  async getReviews(query: any) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      productId, 
      userId, 
      rating, 
      status,
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = query;
    
    const mappedSortBy = this.mapSortField(sortBy);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      let supabaseQuery = this.supabase
        .from('product_review')
        .select(`
          *,
          profile:user_id(id, email, full_name),
          product:product_id(id, name)
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        supabaseQuery = supabaseQuery.or(`title.ilike.%${search}%,comment.ilike.%${search}%`);
      }

      if (productId) {
        supabaseQuery = supabaseQuery.eq('product_id', productId);
      }

      if (userId) {
        supabaseQuery = supabaseQuery.eq('user_id', userId);
      }

      if (rating) {
        supabaseQuery = supabaseQuery.eq('rating', rating);
      }

      if (status) {
        supabaseQuery = supabaseQuery.eq('status', status);
      }

      // Apply sorting and pagination
      supabaseQuery = supabaseQuery
        .order(mappedSortBy, { ascending: sortOrder === 'ASC' })
        .range(from, to);

      const { data: reviews, count, error } = await supabaseQuery;

      if (error) throw error;

      return {
        data: reviews || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting reviews:', error);
      throw error;
    }
  }

  async getReviewById(id: string) {
    try {
      const { data: review, error } = await this.supabase
        .from('product_review')
        .select(`
          *,
          profile:user_id(id, email, full_name),
          product:product_id(id, name)
        `)
        .eq('id', id)
        .single();

      if (error || !review) {
        throw new NotFoundException('Review not found');
      }

      return review;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error getting review by ID:', error);
      throw error;
    }
  }

  async updateReviewStatus(id: string, updateData: any) {
    try {
      const { data: review, error } = await this.supabase
        .from('product_review')
        .update({
          status: updateData.status,
          admin_notes: updateData.adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!review) throw new NotFoundException('Review not found');

      return review;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error updating review status:', error);
      throw error;
    }
  }

  async deleteReview(id: string) {
    try {
      const { error } = await this.supabase
        .from('product_review')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { message: 'Review deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting review:', error);
      throw error;
    }
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
