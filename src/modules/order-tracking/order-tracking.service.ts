import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export interface CreateOrderTrackingDto {
  orderId: string;
  status: OrderStatus;
  location?: string;
  notes?: string;
}

export interface UpdateOrderTrackingDto {
  status?: OrderStatus;
  location?: string;
  notes?: string;
}

@Injectable()
export class OrderTrackingService {
  private prisma = new PrismaClient();

  async createTrackingEntry(dto: CreateOrderTrackingDto) {
    return this.prisma.orderTracking.create({
      data: {
        orderId: dto.orderId,
        status: dto.status,
        location: dto.location,
        notes: dto.notes,
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
  }

  async getOrderTracking(orderId: string) {
    const tracking = await this.prisma.orderTracking.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!tracking.length) {
      throw new NotFoundException('Order tracking not found');
    }

    return tracking;
  }

  async getTrackingByOrderNumber(orderNumber: string) {
    // Since there's no orderNumber in the schema, let's use ID
    return this.getOrderTracking(orderNumber);
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderTrackingDto) {
    // First, update the order status if provided
    if (dto.status) {
      await this.prisma.orders.update({
        where: { id: orderId },
        data: { status: dto.status },
      });
    }

    // Create a new tracking entry
    return this.createTrackingEntry({
      orderId,
      status: dto.status || 'PENDING',
      location: dto.location,
      notes: dto.notes,
    });
  }

  async getOrdersByStatus(status: OrderStatus) {
    return this.prisma.orders.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        orderItems: {
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
        },
        tracking: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserOrderTracking(userId: string, orderId: string) {
    const order = await this.prisma.orders.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.getOrderTracking(orderId);
  }

  async getAllOrdersTracking(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.orders.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          tracking: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orders.count(),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTrackingStats() {
    const statusCounts = await this.prisma.orders.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      paidOrders,
      completedOrders,
    ] = await Promise.all([
      this.prisma.orders.count(),
      this.prisma.orders.count({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
      }),
      this.prisma.orders.count({
        where: {
          status: 'PENDING',
        },
      }),
      this.prisma.orders.count({
        where: {
          status: 'PAID',
        },
      }),
      this.prisma.orders.count({
        where: {
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      totalOrders,
      todayOrders,
      pendingOrders,
      paidOrders,
      completedOrders,
      statusBreakdown: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
