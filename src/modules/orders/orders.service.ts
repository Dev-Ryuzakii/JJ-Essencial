import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';
import { EmailService } from '../email/email.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderItemDto } from './dto/order.dto';
import { PaginationDto } from '../../common/dto/common.dto';

@Injectable()
export class OrdersService {
  private supabase: SupabaseClient;

  constructor(private emailService: EmailService) {
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
      .eq('is_active', true);  // Fixed: was 'isActive', should be 'is_active'

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
        .eq('is_active', true)  // Fixed: should be 'is_active'
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
        product_id: item.productId,  // Fixed: snake_case
        quantity: item.quantity,
        price: parseFloat(product.price.toString()),  // Fixed: use 'price' not 'unitPrice'
      };
    });

    // Create order directly in the database with correct snake_case schema
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        user_id: userId,                              // Fixed: snake_case
        total_amount: totalAmount,                    // Fixed: snake_case
        status: 'PENDING',                           // Fixed: uppercase status
        payment_status: 'PENDING',                   // Fixed: snake_case & uppercase
        delivery_phone: deliveryAddress.phone,       // Fixed: snake_case
        delivery_address: deliveryAddress.address,   // Fixed: snake_case
        delivery_city: deliveryAddress.city,         // Fixed: snake_case
        delivery_state: deliveryAddress.state,       // Fixed: snake_case
        delivery_postal: deliveryAddress.postalCode, // Fixed: snake_case
        delivery_country: deliveryAddress.country,   // Fixed: snake_case
        notes: orderNotes || null                    // Fixed: use 'notes' field
      })
      .select()
      .single();

    if (orderError) {
      throw new BadRequestException(`Failed to create order: ${orderError.message}`);
    }

    // Create order items with correct table name (singular) and schema
    const orderItemsData = orderItems.map(item => ({
      order_id: order.id,        // Fixed: snake_case
      product_id: item.product_id, // Fixed: snake_case
      quantity: item.quantity,
      price: item.price          // Fixed: use 'price' not 'unit_price'
    }));

    const { error: orderItemsError } = await this.supabase
      .from('order_item')  // Fixed: singular table name
      .insert(orderItemsData);

    if (orderItemsError) {
      // Clean up the order if order items creation fails
      await this.supabase.from('orders').delete().eq('id', order.id);
      throw new BadRequestException(`Failed to create order items: ${orderItemsError.message}`);
    }

    // Get the complete order details with correct table/field names
    const { data: completeOrder } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_item (
          *,
          product (
            id,
            name,
            images
          )
        )
      `)
      .eq('id', order.id)
      .single();

    // Get user details for email notifications
    const { data: userData } = await this.supabase
      .from('profile')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const formattedOrder = this.formatOrder(completeOrder);

    // Send email notifications
    if (userData) {
      try {
        // Send order confirmation email to customer
        await this.emailService.sendOrderConfirmationEmail(
          userData.email,
          userData.full_name || 'Customer',
          {
            id: formattedOrder.id,
            totalAmount: formattedOrder.totalAmount,
            status: formattedOrder.status,
            createdAt: formattedOrder.createdAt,
            orderItems: formattedOrder.orderItems
          }
        );

        // Send admin notification
        await this.emailService.sendAdminOrderNotification({
          id: formattedOrder.id,
          totalAmount: formattedOrder.totalAmount,
          createdAt: formattedOrder.createdAt,
          orderItems: formattedOrder.orderItems,
          user: {
            email: userData.email,
            fullName: userData.full_name || 'Customer'
          }
        });
      } catch (emailError) {
        console.warn('Failed to send order notification emails:', emailError.message);
        // Don't fail the order creation if emails fail
      }
    }

    return formattedOrder;
  }

  async findAll(pagination: PaginationDto, isAdmin: boolean = false, userId?: string) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = pagination;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = this.supabase
      .from('orders')
      .select(`
        *,
        order_item (
          *,
          product (
            id,
            name,
            images
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId);  // Fixed: snake_case
    }

    if (search) {
      query = query.or(`id.ilike.%${search}%,paymentRef.ilike.%${search}%,user.email.ilike.%${search}%`);
    }

    // Apply sorting
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });  // Fixed: snake_case
    }

    // Apply pagination
    query = query.range(start, end);

    const { data: orders, count: total, error } = await query;

    return {
      orders: (orders || []).map(this.formatOrder),
      total,
    };
  }

  async findOne(id: string, userId: string): Promise<any> {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_item (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            images
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
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
      userId: order.user_id,  // Fixed: map snake_case to camelCase
      totalAmount: parseFloat((order.total_amount || 0).toString()), // Fixed: snake_case + null check
      status: order.status,
      paymentStatus: order.payment_status, // Added: payment status mapping
      paymentRef: order.payment_ref,     // Fixed: snake_case
      receiptUrl: order.receipt_url,     // Fixed: snake_case  
      createdAt: order.created_at,       // Fixed: snake_case
      updatedAt: order.updated_at,       // Fixed: snake_case
      
      // Add delivery address fields for frontend compatibility
      deliveryPhone: order.delivery_phone,
      deliveryAddress: order.delivery_address,
      deliveryCity: order.delivery_city,
      deliveryState: order.delivery_state,
      deliveryPostal: order.delivery_postal,
      deliveryCountry: order.delivery_country,
      notes: order.notes,
      
      orderItems: (order.order_item || []).map(item => ({  // Fixed: snake_case table name
        id: item.id,
        productId: item.product_id,      // Fixed: snake_case
        quantity: item.quantity,
        price: parseFloat((item.price || 0).toString()), // Fixed: null check
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          images: item.product.images || []
        } : undefined,
      })),
      user: order.user,
    };
  }
}
