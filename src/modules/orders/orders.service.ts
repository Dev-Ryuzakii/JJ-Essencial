import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseConfig } from '../../config/database.config';
import { CreateOrderDto, UpdateOrderStatusDto, OrderItemDto } from './dto/order.dto';
import { PaginationDto } from '../../common/dto/common.dto';

@Injectable()
export class OrdersService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = DatabaseConfig.getInstance();
  }

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items, deliveryAddress, orderNotes, savedAddressId } = createOrderDto;

    // Validate products and check stock
    const productIds = items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found or inactive');
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
      }
    }

    // Validate saved address if provided
    let addressId = null;
    if (savedAddressId) {
      const savedAddress = await this.prisma.userAddress.findFirst({
        where: {
          id: savedAddressId,
          userId,
          isActive: true,
        },
      });
      if (savedAddress) {
        addressId = savedAddressId;
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const itemTotal = parseFloat(product.price.toString()) * item.quantity;
      totalAmount += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(product.price.toString()),
      };
    });

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.orders.create({
        data: {
          userId,
          addressId,
          totalAmount,
          status: 'PENDING',
          deliveryPhone: deliveryAddress.phone,
          deliveryAddress: deliveryAddress.address,
          deliveryCity: deliveryAddress.city,
          deliveryState: deliveryAddress.state,
          deliveryPostal: deliveryAddress.postalCode,
          deliveryCountry: deliveryAddress.country,
          orderNotes,
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          address: true,
        },
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    return this.formatOrder(order);
  }

  async findAll(pagination: PaginationDto, isAdmin: boolean = false, userId?: string) {
    const { page, limit, search, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (!isAdmin && userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { paymentRef: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [orders, total] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.orders.count({ where }),
    ]);

    return {
      orders: orders.map(this.formatOrder),
      total,
    };
  }

  async findOne(id: string, userId?: string, isAdmin: boolean = false) {
    const where: any = { id };
    
    if (!isAdmin && userId) {
      where.userId = userId;
    }

    const order = await this.prisma.orders.findFirst({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order);
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const { status } = updateOrderStatusDto;

    const existingOrder = await this.prisma.orders.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.orders.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return this.formatOrder(order);
  }

  async updatePaymentRef(id: string, paymentRef: string) {
    const order = await this.prisma.orders.update({
      where: { id },
      data: { paymentRef },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return this.formatOrder(order);
  }

  async getOrderStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, pending, paid, completed, cancelled] = await Promise.all([
      this.prisma.orders.count({ where }),
      this.prisma.orders.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.orders.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.orders.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.orders.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    return {
      total,
      pending,
      paid,
      completed,
      cancelled,
    };
  }

  private formatOrder(order: any) {
    return {
      id: order.id,
      userId: order.userId,
      totalAmount: parseFloat(order.totalAmount.toString()),
      status: order.status,
      paymentRef: order.paymentRef,
      receiptUrl: order.receiptUrl,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        product: item.product,
      })),
      user: order.user,
    };
  }
}
