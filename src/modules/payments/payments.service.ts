import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { DatabaseConfig } from '../../config/database.config';
import { InitiatePaymentDto, VerifyPaymentDto, BankTransferResponseDto, UploadReceiptDto, VerifyReceiptDto, PaymentReceiptDto } from './dto/payment.dto';
import { BankAccountService } from './bank-account.service';
import { EmailService } from '../email/email.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private prisma: PrismaClient;

  constructor(
    private configService: ConfigService,
    private bankAccountService: BankAccountService,
    private emailService: EmailService,
  ) {
    this.prisma = DatabaseConfig.getInstance();
  }

  async initiatePayment(userId: string, initiatePaymentDto: InitiatePaymentDto) {
    const { orderId, gateway } = initiatePaymentDto;

    // Get order details
    const order = await this.prisma.orders.findFirst({
      where: {
        id: orderId,
        userId,
        status: 'PENDING',
      },
      include: {
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or already processed');
    }

    // Generate unique reference
    const reference = `${gateway.toLowerCase()}_${Date.now()}_${orderId.slice(0, 8)}`;

    // Create payment transaction record
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        orderId,
        reference,
        amount: order.totalAmount,
        gateway,
        status: gateway === 'BANK_TRANSFER' ? 'AWAITING_VERIFICATION' : 'PENDING',
      },
    });

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
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { reference },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    let verificationResult;
    
    if (gateway === 'PAYSTACK') {
      verificationResult = await this.verifyPaystackPayment(reference);
    } else {
      verificationResult = await this.verifyFlutterwavePayment(reference);
    }

    if (verificationResult.success) {
      // Update transaction and order status
      await this.prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { reference },
          data: {
            status: 'PAID',
            gatewayData: verificationResult.data,
          },
        });

        await tx.orders.update({
          where: { id: transaction.orderId },
          data: {
            status: 'PAID',
            paymentRef: reference,
          },
        });
      });
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
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { reference },
    });

    if (!transaction || transaction.status === 'PAID') {
      return; // Already processed
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { reference },
        data: {
          status: 'PAID',
          gatewayData,
        },
      });

      await tx.orders.update({
        where: { id: transaction.orderId },
        data: {
          status: 'PAID',
          paymentRef: reference,
        },
      });
    });
  }

  async getPaymentHistory(userId?: string) {
    const where = userId ? { 
      order: { 
        userId: userId 
      } 
    } : {};

    const transactions = await this.prisma.paymentTransaction.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions.map(transaction => ({
      id: transaction.id,
      reference: transaction.reference,
      amount: parseFloat(transaction.amount.toString()),
      gateway: transaction.gateway,
      status: transaction.status,
      orderId: transaction.orderId,
      createdAt: transaction.createdAt,
      order: transaction.order ? {
        id: transaction.order.id,
        status: transaction.order.status,
        user: transaction.order.user,
      } : null,
    }));
  }

  // Bank Transfer Methods
  async initiateBankTransfer(userId: string, orderId: string): Promise<BankTransferResponseDto> {
    // Find the order and verify ownership
    const order = await this.prisma.orders.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
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
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { reference },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!transaction) {
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

    const receipt = await this.prisma.paymentReceipt.create({
      data: {
        transactionId: transaction.id,
        receiptUrl,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userId,
        verificationStatus: 'PENDING',
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

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

    const receipt = await this.prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: {
        transaction: {
          include: {
            order: {
              include: {
                user: true,
              },
            },
          },
        },
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Payment receipt not found');
    }

    if (receipt.verificationStatus !== 'PENDING') {
      throw new BadRequestException('Receipt has already been verified');
    }

    // Update receipt
    const updatedReceipt = await this.prisma.paymentReceipt.update({
      where: { id: receiptId },
      data: {
        verificationStatus: status,
        verifiedBy: adminId,
        verificationNotes: notes,
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // If approved, update transaction and order status
    if (status === 'APPROVED') {
      await this.prisma.paymentTransaction.update({
        where: { id: receipt.transactionId },
        data: { status: 'PAID' },
      });

      await this.prisma.orders.update({
        where: { id: receipt.transaction.orderId! },
        data: { status: 'PAID' },
      });

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
    const receipts = await this.prisma.paymentReceipt.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        transaction: {
          include: {
            order: {
              include: {
                user: true,
              },
            },
          },
        },
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return receipts.map(receipt => ({
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
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const receipts = await this.prisma.paymentReceipt.findMany({
      where: { transactionId: transaction.id },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return receipts.map(receipt => ({
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
