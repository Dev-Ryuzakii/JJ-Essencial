import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../../config/supabase.config';

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
  private supabase;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
  }

  async createTrackingEntry(dto: CreateOrderTrackingDto) {
    const { data: tracking, error } = await this.supabase
      .from('order_tracking')
      .insert([{
        order_id: dto.orderId,
        status: dto.status,
        location: dto.location,
        notes: dto.notes,
      }])
      .select(`
        *,
        order:order_id (
          id,
          status,
          user:user_id (
            id,
            email,
            full_name
          )
        )
      `)
      .single();

    if (error) throw new Error(error.message);
    return tracking;
  }

  async getOrderTracking(orderId: string) {
    const { data: tracking, error } = await this.supabase
      .from('order_tracking')
      .select(`
        *,
        order:order_id (
          id,
          status,
          total_amount,
          created_at,
          user:user_id (
            id,
            email,
            full_name
          )
        )
      `)
      .eq('order_id', orderId)
      .order('timestamp', { ascending: true });

    if (error) throw new Error(error.message);
    if (!tracking?.length) {
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
      const { error: updateError } = await this.supabase
        .from('orders')
        .update({ status: dto.status })
        .eq('id', orderId);

      if (updateError) throw new Error(updateError.message);
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
    const { data: orders, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        user:user_id (
          id,
          email,
          full_name
        ),
        order_items:order_items (
          *,
          product:product_id (
            id,
            name,
            price,
            images
          )
        ),
        tracking:order_tracking (
          *
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return orders;
  }

  async getUserOrderTracking(userId: string, orderId: string) {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select()
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.getOrderTracking(orderId);
  }

  async getAllOrdersTracking(page: number = 1, limit: number = 20) {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: orders, count, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        user:user_id (
          id,
          email,
          full_name
        ),
        tracking:order_tracking (
          *
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    return {
      orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getTrackingStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: orders, error } = await this.supabase
      .from('orders')
      .select('status, created_at');

    if (error) throw new Error(error.message);

    const totalOrders = orders.length;
    const todayOrders = orders.filter(order => new Date(order.created_at) >= todayStart).length;
    const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
    const paidOrders = orders.filter(order => order.status === 'PAID').length;
    const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;

    // Calculate status breakdown
    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      todayOrders,
      pendingOrders,
      paidOrders,
      completedOrders,
      statusBreakdown,
    };
  }
}
