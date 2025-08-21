import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class AnalyticsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseConfig.getInstance();
  }

  async getDashboardStats() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        totalProducts,
        totalOrders,
        totalUsers,
        todayOrders,
        weeklyOrders,
        monthlyOrders,
        lowStockProducts,
        pendingOrders,
        recentReviews,
      ] = await Promise.all([
        // Total counts
        this.supabase.from('product').select('*', { count: 'exact', head: true }).eq('isActive', true),
        this.supabase.from('orders').select('*', { count: 'exact', head: true }),
        this.supabase.from('profile').select('*', { count: 'exact', head: true }).eq('isActive', true),

        // Today's stats
        this.supabase.from('orders').select('*', { count: 'exact', head: true })
          .gte('createdAt', yesterday.toISOString()),

        // Weekly stats
        this.supabase.from('orders').select('*', { count: 'exact', head: true })
          .gte('createdAt', sevenDaysAgo.toISOString()),

        // Monthly stats
        this.supabase.from('orders').select('*', { count: 'exact', head: true })
          .gte('createdAt', thirtyDaysAgo.toISOString()),

        // Low stock products
        this.supabase.from('product').select('*', { count: 'exact', head: true })
          .eq('isActive', true)
          .lte('stock', 10),

        // Pending orders
        this.supabase.from('orders').select('*', { count: 'exact', head: true })
          .eq('status', 'PENDING'),

        // Recent reviews
        this.supabase.from('productReview').select('*', { count: 'exact', head: true })
          .gte('createdAt', sevenDaysAgo.toISOString()),
      ]);

      // Calculate revenues
      const totalRevenue = await this.getTotalRevenue();
      const todayRevenue = await this.getRevenueByPeriod(yesterday);
      const weeklyRevenue = await this.getRevenueByPeriod(sevenDaysAgo);
      const monthlyRevenue = await this.getRevenueByPeriod(thirtyDaysAgo);

      return {
        overview: {
          totalProducts,
          totalOrders,
          totalUsers,
          totalRevenue,
          lowStockProducts,
          pendingOrders,
          recentReviews,
        },
        daily: {
          orders: todayOrders,
          revenue: todayRevenue,
        },
        weekly: {
          orders: weeklyOrders,
          revenue: weeklyRevenue,
        },
        monthly: {
          orders: monthlyOrders,
          revenue: monthlyRevenue,
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      return {
        overview: {
          totalProducts: 0,
          totalOrders: 0,
          totalUsers: 0,
          totalRevenue: 0,
          lowStockProducts: 0,
          pendingOrders: 0,
          recentReviews: 0,
        },
        daily: {
          orders: 0,
          revenue: 0,
        },
        weekly: {
          orders: 0,
          revenue: 0,
        },
        monthly: {
          orders: 0,
          revenue: 0,
        },
      };
    }
  }

  async getSalesAnalytics(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders } = await this.supabase
        .from('orders')
        .select('*')
        .gte('createdAt', startDate.toISOString())
        .order('createdAt', { ascending: true });

      const dailySalesMap = new Map();
      orders.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        
        if (!dailySalesMap.has(date)) {
          dailySalesMap.set(date, { 
            date, 
            orders: 0, 
            revenue: 0 
          });
        }
        
        const dailyData = dailySalesMap.get(date);
        dailyData.orders += 1;
        dailyData.revenue += Number(order.totalAmount);
        dailySalesMap.set(date, dailyData);
      });

      const dailySales = Array.from(dailySalesMap.values());

      const { data: orderItems } = await this.supabase
        .from('orderItem')
        .select(`
          *,
          product:products (
            id,
            name,
            price,
            images
          )
        `)
        .gte('order.createdAt', startDate.toISOString());

      const productMap = new Map();
      orderItems.forEach(item => {
        if (!productMap.has(item.productId)) {
          productMap.set(item.productId, {
            id: item.product.id,
            name: item.product.name,
            price: Number(item.product.price),
            images: item.product.images,
            total_sold: 0,
            total_revenue: 0,
          });
        }
        
        const productData = productMap.get(item.productId);
        productData.total_sold += item.quantity;
        productData.total_revenue += Number(item.price) * item.quantity;
        productMap.set(item.productId, productData);
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 10);

      const { data: categories } = await this.supabase
        .from('category')
        .select('*')
        .eq('isActive', true);

      const salesByCategory = categories.map(category => ({
        category: category.name,
        orders: 0,
        revenue: 0,
        units_sold: 0,
      }));

      return {
        dailySales,
        topProducts,
        salesByCategory,
        period: {
          start: startDate,
          end: new Date(),
          days,
        },
      };
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      
      return {
        dailySales: [],
        topProducts: [],
        salesByCategory: [],
        period: {
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          end: new Date(),
          days,
        },
      };
    }
  }

  async getCustomerAnalytics() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentProfiles } = await this.supabase
        .from('profile')
        .select('id, createdAt')
        .gte('createdAt', thirtyDaysAgo.toISOString());

      const monthlySignupsMap = new Map();
      recentProfiles.forEach(profile => {
        const month = new Date(profile.createdAt).toISOString().slice(0, 7);
        
        if (!monthlySignupsMap.has(month)) {
          monthlySignupsMap.set(month, { 
            month, 
            new_customers: 0 
          });
        }
        
        const monthData = monthlySignupsMap.get(month);
        monthData.new_customers += 1;
        monthlySignupsMap.set(month, monthData);
      });

      const monthlySignups = Array.from(monthlySignupsMap.values());

      const { data: profiles } = await this.supabase
        .from('profile')
        .select(`
          id,
          fullName,
          email,
          orders (
            id,
            totalAmount,
            createdAt
          )
        `)
        .eq('isActive', true);

      const topCustomers = profiles
        .map(profile => {
          const totalOrders = profile.orders.length;
          const totalSpent = profile.orders.reduce(
            (sum, order) => sum + Number(order.totalAmount), 
            0
          );
          const lastOrderDate = profile.orders.length > 0 
            ? Math.max(...profile.orders.map(o => new Date(o.createdAt).getTime()))
            : null;
          
          return {
            id: profile.id,
            full_name: profile.fullName,
            email: profile.email,
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_date: lastOrderDate ? new Date(lastOrderDate) : null,
          };
        })
        .filter(customer => customer.total_orders > 0)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 20);

      const retentionData = await this.getCustomerRetentionData();

      return {
        monthlySignups,
        topCustomers,
        retention: retentionData,
      };
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      
      return {
        monthlySignups: [],
        topCustomers: [],
        retention: {
          totalCustomers: 0,
          repeatCustomers: 0,
          retentionRate: 0,
        },
      };
    }
  }

  async getInventoryAnalytics() {
    try {
      const { data: products } = await this.supabase
        .from('product')
        .select('id, name, stock, lowStockThreshold, price, isActive')
        .eq('isActive', true)
        .order('stock', { ascending: true });

      const stockLevels = products.map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold || 10,
        price: Number(product.price),
      }));

      const lowStockAlerts = stockLevels.filter(
        (product) => product.stock <= product.lowStockThreshold
      );

      const stockMovements: any[] = [];

      const stockStatusCounts = {
        inStock: stockLevels.filter((p) => p.stock > p.lowStockThreshold).length,
        lowStock: lowStockAlerts.length,
        outOfStock: stockLevels.filter((p) => p.stock === 0).length,
      };

      return {
        stockLevels,
        lowStockAlerts,
        stockMovements,
        stockStatusCounts,
      };
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      
      return {
        stockLevels: [],
        lowStockAlerts: [],
        stockMovements: [],
        stockStatusCounts: {
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
        },
      };
    }
  }

  async getOrderAnalytics() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: statusOrders } = await this.supabase
        .from('orders')
        .select('status')
        .gte('createdAt', thirtyDaysAgo.toISOString());
      
      const statusCount = statusOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const ordersByStatus = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
      }));

      const { data: ordersWithAmount } = await this.supabase
        .from('orders')
        .select('id, totalAmount, createdAt')
        .gte('createdAt', thirtyDaysAgo.toISOString())
        .neq('status', 'CANCELLED')
        .order('createdAt', { ascending: true });

      const avgOrderValue = ordersWithAmount.reduce((sum, order) => 
        sum + Number(order.totalAmount), 0) / (ordersWithAmount.length || 1);

      const dailyOrdersMap = new Map();
      ordersWithAmount.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        
        if (!dailyOrdersMap.has(date)) {
          dailyOrdersMap.set(date, { 
            date, 
            order_count: 0,
            total_amounts: [],
            total_revenue: 0,
          });
        }
        
        const dayData = dailyOrdersMap.get(date);
        dayData.order_count += 1;
        dayData.total_amounts.push(Number(order.totalAmount));
        dayData.total_revenue += Number(order.totalAmount);
        dailyOrdersMap.set(date, dayData);
      });

      const dailyOrders = Array.from(dailyOrdersMap.values()).map(day => ({
        date: day.date,
        order_count: day.order_count,
        avg_value: day.total_amounts.length > 0 
          ? day.total_amounts.reduce((sum, val) => sum + val, 0) / day.total_amounts.length 
          : 0,
        total_revenue: day.total_revenue,
      }));

      return {
        ordersByStatus,
        averageOrderValue: avgOrderValue,
        dailyOrders,
      };
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      
      return {
        ordersByStatus: [],
        averageOrderValue: 0,
        dailyOrders: [],
      };
    }
  }

  private async getCustomerRetentionData() {
    try {
      const { count: totalCustomers } = await this.supabase
        .from('profile')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true);

      const { data: orders } = await this.supabase
        .from('orders')
        .select('userId');

      const userOrderCounts = new Map();
      orders.forEach(order => {
        userOrderCounts.set(order.userId, (userOrderCounts.get(order.userId) || 0) + 1);
      });
      
      const repeatCustomers = Array.from(userOrderCounts.values()).filter(count => count > 1).length;

      const retentionRate = totalCustomers > 0 
        ? (repeatCustomers / totalCustomers) * 100 
        : 0;

      return {
        totalCustomers,
        repeatCustomers,
        retentionRate,
      };
    } catch (error) {
      console.error('Error calculating customer retention data:', error);
      return {
        totalCustomers: 0,
        repeatCustomers: 0,
        retentionRate: 0,
      };
    }
  }

  private async getTotalRevenue(): Promise<number> {
    try {
      const { data: orders } = await this.supabase
        .from('orders')
        .select('totalAmount')
        .in('status', ['PAID', 'COMPLETED']);

      return orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      return 0;
    }
  }

  private async getRevenueByPeriod(startDate: Date): Promise<number> {
    try {
      const { data: orders } = await this.supabase
        .from('orders')
        .select('totalAmount')
        .gte('createdAt', startDate.toISOString())
        .in('status', ['PAID', 'COMPLETED']);

      return orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    } catch (error) {
      console.error('Error calculating revenue by period:', error);
      return 0;
    }
  }
}
