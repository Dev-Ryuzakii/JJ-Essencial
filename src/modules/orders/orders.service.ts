import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateOrderDto, UpdateOrderStatusDto, OrderItemDto } from './dto/order.dto';
import { PaginationDto } from '../../common/dto/common.dto';

@Injectable()
export class OrdersService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseConfig.getInstance();
  }

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items, deliveryAddress, orderNotes, savedAddressId } = createOrderDto;

    // Validate products and check stock
    const productIds = items.map(item => item.productId);
    const { data: products } = await this.supabase
      .from('product')
      .select('*')
      .in('id', productIds)
      .eq('isActive', true);

    if (!products || products.length !== productIds.length) {
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
      const { data: savedAddress } = await this.supabase
        .from('userAddress')
        .select('*')
        .eq('id', savedAddressId)
        .eq('userId', userId)
        .eq('isActive', true)
        .single();
      
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

    // Create order and update stock in a transaction
    const { data: order, error } = await this.supabase.rpc('create_order', {
      p_user_id: userId,
      p_address_id: addressId,
      p_total_amount: totalAmount,
      p_delivery_phone: deliveryAddress.phone,
      p_delivery_address: deliveryAddress.address,
      p_delivery_city: deliveryAddress.city,
      p_delivery_state: deliveryAddress.state,
      p_delivery_postal: deliveryAddress.postalCode,
      p_delivery_country: deliveryAddress.country,
      p_order_notes: orderNotes,
      p_order_items: orderItems
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Get the complete order details
    const { data: completeOrder } = await this.supabase
      .from('orders')
      .select(`
        *,
        orderItems (
          *,
          product (
            id,
            name,
            images
          )
        ),
        user (
          id,
          email,
          fullName
        ),
        address (*)
      `)
      .eq('id', order.id)
      .single();

    return this.formatOrder(order);
  }

  async findAll(pagination: PaginationDto, isAdmin: boolean = false, userId?: string) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = pagination;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = this.supabase
      .from('orders')
      .select(`
        *,
        orderItems (
          *,
          product (
            id,
            name,
            images
          )
        ),
        user (
          id,
          email,
          fullName
        )
      `, { count: 'exact' });

    // Apply filters
    if (!isAdmin && userId) {
      query = query.eq('userId', userId);
    }

    if (search) {
      query = query.or(`id.ilike.%${search}%,paymentRef.ilike.%${search}%,user.email.ilike.%${search}%`);
    }

    // Apply sorting
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('createdAt', { ascending: false });
    }

    // Apply pagination
    query = query.range(start, end);

    const { data: orders, count: total, error } = await query;

    return {
      orders: (orders || []).map(this.formatOrder),
      total,
    };
  }

  async findOne(id: string, userId?: string, isAdmin: boolean = false) {
    let query = this.supabase
      .from('orders')
      .select(`
        *,
        orderItems (
          *,
          product (
            id,
            name,
            images
          )
        ),
        user (
          id,
          email,
          fullName
        )
      `)
      .eq('id', id);
    
    if (!isAdmin && userId) {
      query = query.eq('userId', userId);
    }

    const { data: order, error } = await query.single();

    if (!order || error) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order);
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const { status } = updateOrderStatusDto;

    const { data: existingOrder, error: findError } = await this.supabase
      .from('orders')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingOrder || findError) {
      throw new NotFoundException('Order not found');
    }

    const { data: order, error: updateError } = await this.supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        orderItems (
          *,
          product (
            id,
            name,
            images
          )
        ),
        user (
          id,
          email,
          fullName
        )
      `)
      .single();

    return this.formatOrder(order);
  }

  async updatePaymentRef(id: string, paymentRef: string) {
    const { data: order, error } = await this.supabase
      .from('orders')
      .update({ paymentRef })
      .eq('id', id)
      .select(`
        *,
        orderItems (
          *,
          product (
            id,
            name,
            images
          )
        ),
        user (
          id,
          email,
          fullName
        )
      `)
      .single();

    return this.formatOrder(order);
  }

  async getOrderStats(userId?: string) {
    try {
      const baseQuery = this.supabase.from('orders');
      
      // Create filtered base query
      const userFilter = userId ? { userId } : {};

      const [
        totalResult,
        pendingResult,
        paidResult,
        completedResult,
        cancelledResult,
        paidOrdersResult,
        recentOrdersResult
      ] = await Promise.all([
        // Total count
        baseQuery
          .select('*', { count: 'exact', head: true })
          .match(userFilter),
        
        // Status counts
        baseQuery
          .select('*', { count: 'exact', head: true })
          .match({ ...userFilter, status: 'PENDING' }),
        baseQuery
          .select('*', { count: 'exact', head: true })
          .match({ ...userFilter, status: 'PAID' }),
        baseQuery
          .select('*', { count: 'exact', head: true })
          .match({ ...userFilter, status: 'COMPLETED' }),
        baseQuery
          .select('*', { count: 'exact', head: true })
          .match({ ...userFilter, status: 'CANCELLED' }),
        
        // Get paid orders for revenue calculation
        baseQuery
          .select('totalAmount')
          .match(userFilter)
          .in('status', ['PAID', 'COMPLETED']),
        
        // Get recent orders
        baseQuery
          .select(`
            *,
            orderItems (
              *,
              product (
                id,
                name,
                images
              )
            )
          `)
          .match(userFilter)
          .order('createdAt', { ascending: false })
          .limit(5)
      ]);

      const revenue = paidOrdersResult.data?.reduce(
        (sum, order) => sum + Number(order.totalAmount), 
        0
      ) || 0;

      const totalRevenue = paidOrdersResult.data?.reduce(
        (sum, order) => sum + Number(order.totalAmount), 
        0
      ) || 0;

      return {
        counts: {
          total: totalResult.count || 0,
          pending: pendingResult.count || 0,
          paid: paidResult.count || 0,
          completed: completedResult.count || 0,
          cancelled: cancelledResult.count || 0,
        },
        totalRevenue: revenue,
        recentOrders: (recentOrdersResult.data || []).map(this.formatOrder),
      };
    } catch (error) {
      console.error('Error getting order stats:', error);
      // Return default values in case of error
      return {
        counts: {
          total: 0,
          pending: 0,
          paid: 0,
          completed: 0,
          cancelled: 0,
        },
        totalRevenue: 0,
        recentOrders: [],
      };
    }
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
      orderItems: (order.orderItems || []).map(item => ({
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
