import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';
import { InitiatePaymentDto, VerifyPaymentDto, BankTransferResponseDto, UploadReceiptDto, VerifyReceiptDto, PaymentReceiptDto } from './dto/payment.dto';
import { BankAccountService } from './bank-account.service';
import { EmailService } from '../email/email.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private bankAccountService: BankAccountService,
    private emailService: EmailService,
  ) {
    this.supabase = SupabaseConfig.getInstance();
  }

  async initiatePayment(userId: string, initiatePaymentDto: InitiatePaymentDto) {
    const { orderId, gateway } = initiatePaymentDto;

    // Get order details
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .select('*, user:users(*)')
      .eq('id', orderId)
      .eq('userId', userId)
      .eq('status', 'PENDING')
      .single();

    if (!order || orderError) {
      throw new NotFoundException('Order not found or already processed');
    }

    // Generate unique reference
    const reference = `${gateway.toLowerCase()}_${Date.now()}_${orderId.slice(0, 8)}`;

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await this.supabase
      .from('paymentTransaction')
      .insert([{
        orderId,
        reference,
        amount: order.totalAmount,
        gateway,
        status: gateway === 'BANK_TRANSFER' ? 'AWAITING_VERIFICATION' : 'PENDING',
      }])
      .select()
      .single();

    if (!transaction || transactionError) {
      throw new Error('Failed to create payment transaction');
    }

    let paymentData;
    
    if (gateway === 'PAYSTACK') {
      paymentData = await this.initiatePaystackPayment(order, reference);
    } else if (gateway === 'FLUTTERWAVE') {
      paymentData = await this.initiateFlutterwavePayment(order, reference);
    } else if (gateway === 'BANK_TRANSFER') {
      paymentData = await this.createBankTransferResponse(order, reference);
    } else {
      throw new BadRequestException('Unsupported payment gateway');
    }

    return {
      ...paymentData,
      reference: transaction.reference,
    };
  }

  private async initiatePaystackPayment(order: any, reference: string) {
    const paystackSecretKey = this.configService.get('payment.paystack.secretKey');
    
    if (!paystackSecretKey) {
      throw new BadRequestException('Paystack configuration not found');
    }

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          reference,
          amount: Math.round(parseFloat(order.totalAmount.toString()) * 100), // Convert to kobo
          email: order.user.email,
          currency: 'NGN',
          callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
          metadata: {
            orderId: order.id,
            userId: order.userId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: response.data.data.reference,
      };
    } catch (error) {
      throw new BadRequestException(`Paystack error: ${error.response?.data?.message || error.message}`);
    }
  }

  private async initiateFlutterwavePayment(order: any, reference: string) {
    const flutterwaveSecretKey = this.configService.get('payment.flutterwave.secretKey');
    
    if (!flutterwaveSecretKey) {
      throw new BadRequestException('Flutterwave configuration not found');
    }

    try {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
          tx_ref: reference,
          amount: parseFloat(order.totalAmount.toString()),
          currency: 'NGN',
          redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
          customer: {
            email: order.user.email,
            name: order.user.fullName || order.user.email,
          },
          customizations: {
            title: 'E-commerce Payment',
            description: `Payment for order ${order.id}`,
          },
          meta: {
            orderId: order.id,
            userId: order.userId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${flutterwaveSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        authorization_url: response.data.data.link,
        access_code: response.data.data.access_code || reference,
        reference,
      };
    } catch (error) {
      throw new BadRequestException(`Flutterwave error: ${error.response?.data?.message || error.message}`);
    }
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto) {
    const { reference, gateway } = verifyPaymentDto;

    // Get transaction record
    const { data: transaction, error: transactionError } = await this.supabase
      .from('paymentTransaction')
      .select(`
        *,
        order:orders (
          *,
          user:users (*)
        )
      `)
      .eq('reference', reference)
      .single();

    if (!transaction || transactionError) {
      throw new NotFoundException('Transaction not found');
    }

    let verificationResult;
    
    if (gateway === 'PAYSTACK') {
      verificationResult = await this.verifyPaystackPayment(reference);
    } else {
      verificationResult = await this.verifyFlutterwavePayment(reference);
    }

    if (verificationResult.success) {
      // Update transaction
      const { error: updateTransactionError } = await this.supabase
        .from('paymentTransaction')
        .update({
          status: 'PAID',
          gatewayData: verificationResult.data,
        })
        .eq('reference', reference);

      if (updateTransactionError) {
        throw new Error('Failed to update transaction status');
      }

      // Update order
      const { error: updateOrderError } = await this.supabase
        .from('orders')
        .update({
          status: 'PAID',
          paymentRef: reference,
        })
        .eq('id', transaction.orderId);

      if (updateOrderError) {
        throw new Error('Failed to update order status');
      }
    }

    return verificationResult;
  }

  private async verifyPaystackPayment(reference: string) {
    const paystackSecretKey = this.configService.get('payment.paystack.secretKey');

    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
          },
        },
      );

      const { data } = response.data;
      
      return {
        success: data.status === 'success',
        data,
        amount: data.amount / 100, // Convert from kobo
        currency: data.currency,
        reference: data.reference,
      };
    } catch (error) {
      throw new BadRequestException(`Paystack verification error: ${error.response?.data?.message || error.message}`);
    }
  }

  private async verifyFlutterwavePayment(reference: string) {
    const flutterwaveSecretKey = this.configService.get('payment.flutterwave.secretKey');

    try {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
        {
          headers: {
            Authorization: `Bearer ${flutterwaveSecretKey}`,
          },
        },
      );

      const { data } = response.data;
      
      return {
        success: data.status === 'successful',
        data,
        amount: data.amount,
        currency: data.currency,
        reference: data.tx_ref,
      };
    } catch (error) {
      throw new BadRequestException(`Flutterwave verification error: ${error.response?.data?.message || error.message}`);
    }
  }

  async handlePaystackWebhook(payload: any, signature: string) {
    const paystackSecretKey = this.configService.get('payment.paystack.secretKey');
    
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { event, data } = payload;

    if (event === 'charge.success') {
      await this.processSuccessfulPayment(data.reference, 'PAYSTACK', data);
    }

    return { message: 'Webhook processed successfully' };
  }

  async handleFlutterwaveWebhook(payload: any, signature: string) {
    const flutterwaveSecretKey = this.configService.get('payment.flutterwave.secretKey');
    
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha256', flutterwaveSecretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { event, data } = payload;

    if (event === 'charge.completed' && data.status === 'successful') {
      await this.processSuccessfulPayment(data.tx_ref, 'FLUTTERWAVE', data);
    }

    return { message: 'Webhook processed successfully' };
  }

  private async processSuccessfulPayment(reference: string, gateway: string, gatewayData: any) {
    const { data: transaction, error: transactionError } = await this.supabase
      .from('paymentTransaction')
      .select('*')
      .eq('reference', reference)
      .single();

    if (!transaction || transaction.status === 'PAID' || transactionError) {
      return; // Already processed or error
    }

    // Update transaction
    const { error: updateTransactionError } = await this.supabase
      .from('paymentTransaction')
      .update({
        status: 'PAID',
        gatewayData,
      })
      .eq('reference', reference);

    if (updateTransactionError) {
      throw new Error('Failed to update transaction status');
    }

    // Update order
    const { error: updateOrderError } = await this.supabase
      .from('orders')
      .update({
        status: 'PAID',
        paymentRef: reference,
      })
      .eq('id', transaction.orderId);

    if (updateOrderError) {
      throw new Error('Failed to update order status');
    }
  }

  async getPaymentHistory(userId?: string) {
    let query = this.supabase
      .from('orders')
      .select(`
        id,
        payment_ref,
        total_amount,
        payment_method,
        payment_status,
        status,
        created_at,
        updated_at,
        profile:user_id (
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: orders, error } = await query;

    if (error) {
      this.logger.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }

    return (orders || []).map(order => ({
      id: order.id,
      reference: order.payment_ref,
      amount: parseFloat(order.total_amount?.toString() || '0'),
      gateway: order.payment_method,
      status: order.payment_status,
      orderId: order.id,
      createdAt: order.created_at,
      order: {
        id: order.id,
        status: order.status,
        user: order.profile,
      },
    }));
  }

  // Bank Transfer Methods
  async initiateBankTransfer(userId: string, orderId: string): Promise<BankTransferResponseDto> {
    // Find the order and verify ownership
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('userId', userId)
      .single();

    if (!order || orderError) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in a valid state for payment');
    }

    // Generate reference
    const reference = `BT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return this.createBankTransferResponse(order, reference);
  }

  private async createBankTransferResponse(order: any, reference: string): Promise<BankTransferResponseDto> {
    const bankAccounts = await this.bankAccountService.getActiveBankAccounts();
    
    if (bankAccounts.length === 0) {
      throw new BadRequestException('No bank accounts configured for manual transfers');
    }

    const instructions = [
      'Transfer the exact amount to any of the bank accounts below',
      'Use the reference as your payment description/narration',
      'Upload a clear screenshot or photo of your payment receipt',
      'Your order will be processed once payment is verified by our team',
      'Verification typically takes 1-2 hours during business hours'
    ];

    // Send email with bank details
    try {
      await this.emailService.sendBankTransferInstructions(
        order.user.email,
        order.user.fullName,
        {
          reference,
          amount: parseFloat(order.totalAmount.toString()),
          bankAccounts,
          instructions,
          orderId: order.id,
        }
      );
    } catch (error) {
      console.error('Failed to send bank transfer email:', error);
    }

    return {
      reference,
      orderId: order.id,
      bankAccounts,
      amount: parseFloat(order.totalAmount.toString()),
      instructions,
    };
  }

  async uploadPaymentReceipt(
    userId: string, 
    uploadReceiptDto: UploadReceiptDto, 
    file: Express.Multer.File
  ): Promise<PaymentReceiptDto> {
    const { reference } = uploadReceiptDto;

    // Find the transaction
    const { data: transaction, error: transactionError } = await this.supabase
      .from('paymentTransaction')
      .select(`
        *,
        order:orders (
          *,
          user:users (*)
        )
      `)
      .eq('reference', reference)
      .single();

    if (!transaction || transactionError) {
      throw new NotFoundException('Payment transaction not found');
    }

    if (transaction.order?.userId !== userId) {
      throw new BadRequestException('You can only upload receipts for your own payments');
    }

    if (transaction.gateway !== 'BANK_TRANSFER') {
      throw new BadRequestException('Receipt upload is only available for bank transfers');
    }

    // Here you would integrate with your file upload service
    // For now, we'll simulate the upload
    const receiptUrl = `uploads/receipts/${Date.now()}_${file.originalname}`;

    const { data: receipt, error: receiptError } = await this.supabase
      .from('paymentReceipt')
      .insert([{
        transactionId: transaction.id,
        receiptUrl,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userId,
        verificationStatus: 'PENDING',
      }])
      .select('*, uploader:users(id, fullName, email)')
      .single();

    if (!receipt || receiptError) {
      throw new Error('Failed to create payment receipt');
    }

    // Notify admin
    try {
      await this.emailService.sendReceiptUploadNotification(
        transaction.order!.user.email,
        transaction.order!.user.fullName,
        {
          reference,
          receiptId: receipt.id,
          orderId: transaction.orderId!,
          amount: parseFloat(transaction.amount.toString()),
        }
      );
    } catch (error) {
      console.error('Failed to send receipt upload notification:', error);
    }

    return {
      id: receipt.id,
      receiptUrl: receipt.receiptUrl,
      originalName: receipt.originalName,
      fileSize: receipt.fileSize,
      uploadedBy: receipt.uploadedBy,
      verificationStatus: receipt.verificationStatus as any,
      verificationNotes: receipt.verificationNotes,
      createdAt: receipt.createdAt,
      uploader: receipt.uploader,
    };
  }

  async verifyPaymentReceipt(
    adminId: string,
    verifyReceiptDto: VerifyReceiptDto
  ): Promise<PaymentReceiptDto> {
    const { receiptId, status, notes } = verifyReceiptDto;

    const { data: receipt, error: receiptError } = await this.supabase
      .from('paymentReceipt')
      .select(`
        *,
        transaction:paymentTransaction (
          *,
          order:orders (
            *,
            user:users (*)
          )
        ),
        uploader:users (
          id,
          fullName,
          email
        )
      `)
      .eq('id', receiptId)
      .single();

    if (!receipt || receiptError) {
      throw new NotFoundException('Payment receipt not found');
    }

    if (receipt.verificationStatus !== 'PENDING') {
      throw new BadRequestException('Receipt has already been verified');
    }

    // Update receipt
    const { data: updatedReceipt, error: updateError } = await this.supabase
      .from('paymentReceipt')
      .update({
        verificationStatus: status,
        verifiedBy: adminId,
        verificationNotes: notes,
      })
      .eq('id', receiptId)
      .select('*, uploader:users(id, fullName, email)')
      .single();

    if (!updatedReceipt || updateError) {
      throw new Error('Failed to update receipt');
    }

    // If approved, update transaction and order status
    if (status === 'APPROVED') {
      const { error: transactionError } = await this.supabase
        .from('paymentTransaction')
        .update({ status: 'PAID' })
        .eq('id', receipt.transactionId);

      if (transactionError) {
        throw new Error('Failed to update transaction status');
      }

      const { error: orderError } = await this.supabase
        .from('orders')
        .update({ status: 'PAID' })
        .eq('id', receipt.transaction.orderId);

      if (orderError) {
        throw new Error('Failed to update order status');
      }

      // Send payment confirmation email
      try {
        await this.emailService.sendPaymentSuccessEmail(
          receipt.transaction.order!.user.email,
          receipt.transaction.order!.user.fullName,
          {
            reference: receipt.transaction.reference,
            amount: parseFloat(receipt.transaction.amount.toString()),
            gateway: receipt.transaction.gateway,
            status: 'PAID',
            orderId: receipt.transaction.orderId,
          }
        );
      } catch (error) {
        console.error('Failed to send payment confirmation email:', error);
      }
    } else {
      // Send rejection email
      try {
        await this.emailService.sendPaymentRejectionEmail(
          receipt.transaction.order!.user.email,
          receipt.transaction.order!.user.fullName,
          {
            reference: receipt.transaction.reference,
            reason: notes || 'Payment receipt could not be verified',
            orderId: receipt.transaction.orderId,
          }
        );
      } catch (error) {
        console.error('Failed to send payment rejection email:', error);
      }
    }

    return {
      id: updatedReceipt.id,
      receiptUrl: updatedReceipt.receiptUrl,
      originalName: updatedReceipt.originalName,
      fileSize: updatedReceipt.fileSize,
      uploadedBy: updatedReceipt.uploadedBy,
      verificationStatus: updatedReceipt.verificationStatus as any,
      verificationNotes: updatedReceipt.verificationNotes,
      createdAt: updatedReceipt.createdAt,
      uploader: updatedReceipt.uploader,
    };
  }

  async getPendingReceipts(): Promise<PaymentReceiptDto[]> {
    const { data: receipts, error } = await this.supabase
      .from('paymentReceipt')
      .select(`
        *,
        transaction:paymentTransaction (
          *,
          order:orders (
            *,
            user:users (*)
          )
        ),
        uploader:users (
          id,
          fullName,
          email
        )
      `)
      .eq('verificationStatus', 'PENDING')
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch pending receipts');
    }

    return (receipts || []).map(receipt => ({
      id: receipt.id,
      receiptUrl: receipt.receiptUrl,
      originalName: receipt.originalName,
      fileSize: receipt.fileSize,
      uploadedBy: receipt.uploadedBy,
      verificationStatus: receipt.verificationStatus as any,
      verificationNotes: receipt.verificationNotes,
      createdAt: receipt.createdAt,
      uploader: receipt.uploader,
    }));
  }

  async getReceiptsByTransaction(reference: string): Promise<PaymentReceiptDto[]> {
    // First get the transaction
    const { data: transaction, error: transactionError } = await this.supabase
      .from('paymentTransaction')
      .select('*')
      .eq('reference', reference)
      .single();

    if (!transaction || transactionError) {
      throw new NotFoundException('Transaction not found');
    }

    // Then get all receipts for this transaction
    const { data: receipts, error: receiptsError } = await this.supabase
      .from('paymentReceipt')
      .select('*, uploader:users(id, fullName, email)')
      .eq('transactionId', transaction.id)
      .order('createdAt', { ascending: false });

    if (receiptsError) {
      throw new Error('Failed to fetch receipts');
    }

    return (receipts || []).map(receipt => ({
      id: receipt.id,
      receiptUrl: receipt.receiptUrl,
      originalName: receipt.originalName,
      fileSize: receipt.fileSize,
      uploadedBy: receipt.uploadedBy,
      verificationStatus: receipt.verificationStatus as any,
      verificationNotes: receipt.verificationNotes,
      createdAt: receipt.createdAt,
      uploader: receipt.uploader,
    }));
  }
}
