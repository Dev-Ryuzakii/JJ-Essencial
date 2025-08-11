import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private prisma = new PrismaClient();

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      todayOrders,
      todayRevenue,
      weeklyOrders,
      weeklyRevenue,
      monthlyOrders,
      monthlyRevenue,
      lowStockProducts,
      pendingOrders,
      recentReviews,
    ] = await Promise.all([
      // Total counts
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.orders.count(),
      this.prisma.profile.count({ where: { isActive: true } }),
      this.getTotalRevenue(),

      // Today's stats
      this.prisma.orders.count({
        where: { createdAt: { gte: yesterday } },
      }),
      this.getRevenueByPeriod(yesterday),

      // Weekly stats
      this.prisma.orders.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.getRevenueByPeriod(sevenDaysAgo),

      // Monthly stats
      this.prisma.orders.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.getRevenueByPeriod(thirtyDaysAgo),

      // Low stock products
      this.prisma.product.count({
        where: {
          AND: [
            { stock: { lte: this.prisma.product.fields.lowStockThreshold } },
            { isActive: true },
          ],
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
  }

  async getSalesAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily sales data
    const dailySales = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Top selling products
    const topProducts = await this.prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.images,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= ${startDate} OR o.created_at IS NULL
      GROUP BY p.id, p.name, p.price, p.images
      ORDER BY total_sold DESC
      LIMIT 10
    `;

    // Sales by category
    const salesByCategory = await this.prisma.$queryRaw`
      SELECT 
        c.name as category,
        COALESCE(COUNT(DISTINCT o.id), 0) as orders,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
        COALESCE(SUM(oi.quantity), 0) as units_sold
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      LEFT JOIN products p ON pc.product_id = p.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= ${startDate}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

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
  }

  async getCustomerAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Customer growth
    const monthlySignups = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_customers
      FROM profiles 
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    // Top customers by order value
    const topCustomers = await this.prisma.$queryRaw`
      SELECT 
        p.id,
        p.full_name,
        p.email,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM profiles p
      LEFT JOIN orders o ON p.id = o.user_id
      GROUP BY p.id, p.full_name, p.email
      HAVING COUNT(DISTINCT o.id) > 0
      ORDER BY total_spent DESC
      LIMIT 20
    `;

    // Customer retention metrics
    const retentionData = await this.getCustomerRetentionData();

    return {
      monthlySignups,
      topCustomers,
      retention: retentionData,
    };
  }

  async getInventoryAnalytics() {
    // Stock levels
    const stockLevels = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
        price: true,
      },
      where: { isActive: true },
      orderBy: { stock: 'asc' },
    });

    // Low stock alerts
    const lowStockAlerts = stockLevels.filter(
      (product) => product.stock <= (product.lowStockThreshold || 10),
    );

    // Stock movements summary
    const stockMovements = await this.prisma.stockMovement.groupBy({
      by: ['type'],
      _sum: {
        quantity: true,
      },
      _count: {
        type: true,
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Products by stock status
    const stockStatusCounts = {
      inStock: stockLevels.filter((p) => p.stock > (p.lowStockThreshold || 10)).length,
      lowStock: lowStockAlerts.length,
      outOfStock: stockLevels.filter((p) => p.stock === 0).length,
    };

    return {
      stockLevels,
      lowStockAlerts,
      stockMovements,
      stockStatusCounts,
    };
  }

  async getOrderAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Order status distribution
    const ordersByStatus = await this.prisma.orders.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Average order value
    const avgOrderValue = await this.prisma.orders.aggregate({
      _avg: {
        totalAmount: true,
      },
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'CANCELLED' },
      },
    });

    // Order trends (daily)
    const dailyOrders = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        AVG(total_amount) as avg_value,
        SUM(total_amount) as total_revenue
      FROM orders 
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      ordersByStatus,
      averageOrderValue: Number(avgOrderValue._avg.totalAmount) || 0,
      dailyOrders,
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.prisma.orders.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: { in: ['PAID', 'COMPLETED'] },
      },
    });

    return Number(result._sum.totalAmount) || 0;
  }

  private async getRevenueByPeriod(startDate: Date): Promise<number> {
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
  }

  private async getCustomerRetentionData() {
    // Simplified retention calculation
    // In a real app, you'd want more sophisticated cohort analysis
    const totalCustomers = await this.prisma.profile.count();
    const repeatCustomers = await this.prisma.$queryRaw`
      SELECT COUNT(DISTINCT user_id) as repeat_customers
      FROM (
        SELECT user_id, COUNT(*) as order_count
        FROM orders
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ) repeat_orders
    ` as any[];

    const retentionRate = totalCustomers > 0 
      ? (repeatCustomers[0]?.repeat_customers || 0) / totalCustomers * 100 
      : 0;

    return {
      totalCustomers,
      repeatCustomers: repeatCustomers[0]?.repeat_customers || 0,
      retentionRate,
    };
  }
}
