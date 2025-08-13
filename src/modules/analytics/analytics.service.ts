import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private prisma = new PrismaClient();

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
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.orders.count(),
        this.prisma.profile.count({ where: { isActive: true } }),

        // Today's stats
        this.prisma.orders.count({
          where: { createdAt: { gte: yesterday } },
        }),

        // Weekly stats
        this.prisma.orders.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),

        // Monthly stats
        this.prisma.orders.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),

        // Low stock products
        this.prisma.product.count({
          where: {
            isActive: true,
            stock: { lte: 10 },
          },
        }),

        // Pending orders
        this.prisma.orders.count({
          where: { status: 'PENDING' },
        }),

        // Recent reviews
        this.prisma.productReview.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
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

      const orders = await this.prisma.orders.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

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

      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: startDate },
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
            },
          },
        },
      });

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

      const categories = await this.prisma.category.findMany({
        where: {
          isActive: true,
        },
      });

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

      const recentProfiles = await this.prisma.profile.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          createdAt: true,
        },
      });

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

      const profiles = await this.prisma.profile.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          orders: {
            select: {
              id: true,
              totalAmount: true,
              createdAt: true,
            },
          },
        },
      });

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
      const products = await this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          stock: true,
          lowStockThreshold: true,
          price: true,
          isActive: true,
        },
        where: { isActive: true },
        orderBy: { stock: 'asc' },
      });

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

      const orderStatuses = await this.prisma.orders.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      const ordersByStatus = orderStatuses.map(item => ({
        status: item.status,
        count: item._count.status,
      }));

      const avgOrderValue = await this.prisma.orders.aggregate({
        _avg: {
          totalAmount: true,
        },
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELLED' },
        },
      });

      const orders = await this.prisma.orders.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const dailyOrdersMap = new Map();
      orders.forEach(order => {
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
        averageOrderValue: Number(avgOrderValue._avg.totalAmount) || 0,
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
      const totalCustomers = await this.prisma.profile.count({
        where: { isActive: true },
      });

      const orders = await this.prisma.orders.findMany({
        select: {
          userId: true,
        },
      });

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
      const result = await this.prisma.orders.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: { in: ['PAID', 'COMPLETED'] },
        },
      });

      return Number(result._sum.totalAmount) || 0;
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      return 0;
    }
  }

  private async getRevenueByPeriod(startDate: Date): Promise<number> {
    try {
      const result = await this.prisma.orders.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          createdAt: { gte: startDate },
          status: { in: ['PAID', 'COMPLETED'] },
        },
      });

      return Number(result._sum.totalAmount) || 0;
    } catch (error) {
      console.error('Error calculating revenue by period:', error);
      return 0;
    }
  }
}
