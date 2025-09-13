import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('email.smtp.host'),
      port: this.configService.get('email.smtp.port'),
      secure: false,
      auth: {
        user: this.configService.get('email.smtp.user'),
        pass: this.configService.get('email.smtp.pass'),
      },
    });
  }

  async sendEmail(emailData: EmailTemplate): Promise<void> {
    try {
      const mailOptions = {
        from: `${this.configService.get('email.from.name')} <${this.configService.get('email.from.email')}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${emailData.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}:`, error);
      throw error;
    }
  }

  // Welcome Email Template
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const emailTemplate: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to Our E-commerce Store!',
      html: this.getWelcomeEmailTemplate(userName),
      text: `Welcome ${userName}! Thank you for joining our e-commerce platform.`,
    };

    await this.sendEmail(emailTemplate);
  }

  // Order Confirmation Email
  async sendOrderConfirmationEmail(
    userEmail: string,
    userName: string,
    orderDetails: any,
  ): Promise<void> {
    const emailTemplate: EmailTemplate = {
      to: userEmail,
      subject: `Order Confirmation - #${orderDetails.orderNumber || orderDetails.id}`,
      html: this.getOrderConfirmationTemplate(userName, orderDetails),
      text: `Order Confirmed! Your order #${orderDetails.orderNumber || orderDetails.id} has been received.`,
    };

    await this.sendEmail(emailTemplate);
  }

  // Payment Success Email
  async sendPaymentSuccessEmail(
    userEmail: string,
    userName: string,
    paymentDetails: any,
  ): Promise<void> {
    const emailTemplate: EmailTemplate = {
      to: userEmail,
      subject: `Payment Successful - Order #${paymentDetails.orderId}`,
      html: this.getPaymentSuccessTemplate(userName, paymentDetails),
      text: `Payment confirmed for order #${paymentDetails.orderId}`,
    };

    await this.sendEmail(emailTemplate);
  }

  // Password Reset Email
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get('app.frontendUrl')}/reset-password?token=${resetToken}`;
    
    const emailTemplate: EmailTemplate = {
      to: userEmail,
      subject: 'Password Reset Request',
      html: this.getPasswordResetTemplate(userName, resetUrl),
      text: `Reset your password using this link: ${resetUrl}`,
    };

    await this.sendEmail(emailTemplate);
  }

  // Admin Order Notification
  async sendAdminOrderNotification(orderDetails: any): Promise<void> {
    const adminEmail = this.configService.get('email.adminEmail') || this.configService.get('email.from.email');
    
    const emailTemplate: EmailTemplate = {
      to: adminEmail,
      subject: `New Order Received - #${orderDetails.orderNumber || orderDetails.id}`,
      html: this.getAdminOrderNotificationTemplate(orderDetails),
      text: `New order #${orderDetails.orderNumber || orderDetails.id} received from ${orderDetails.user.email}`,
    };

    await this.sendEmail(emailTemplate);
  }

  // Bank Transfer Instructions Email
  async sendBankTransferInstructions(
    userEmail: string,
    userName: string,
    transferDetails: any,
  ): Promise<void> {
    const emailTemplate: EmailTemplate = {
      to: userEmail,
      subject: `Bank Transfer Instructions - Order #${transferDetails.orderId}`,
      html: this.getBankTransferInstructionsTemplate(userName, transferDetails),
      text: `Bank transfer instructions for order #${transferDetails.orderId}. Reference: ${transferDetails.reference}`,
    };

    await this.sendEmail(emailTemplate);
  }

  // Receipt Upload Notification
  async sendReceiptUploadNotification(
    userEmail: string,
    userName: string,
    receiptDetails: any,
  ): Promise<void> {
    const emailTemplate: EmailTemplate = {
      to: userEmail,
      subject: `Receipt Uploaded - Payment #${receiptDetails.reference}`,
      html: this.getReceiptUploadNotificationTemplate(userName, receiptDetails),
      text: `Your payment receipt has been uploaded for verification. Reference: ${receiptDetails.reference}`,
    };

    await this.sendEmail(emailTemplate);
  }

  // Payment Rejection Email
  async sendPaymentRejectionEmail(
    userEmail: string,
    userName: string,
    rejectionDetails: any,
  ): Promise<void> {
    const emailTemplate: EmailTemplate = {
      to: userEmail,
      subject: `Payment Verification Issue - Order #${rejectionDetails.orderId}`,
      html: this.getPaymentRejectionTemplate(userName, rejectionDetails),
      text: `Payment verification issue for order #${rejectionDetails.orderId}. Reason: ${rejectionDetails.reason}`,
    };

    await this.sendEmail(emailTemplate);
  }

  // Email Templates
  private getWelcomeEmailTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; }
            .btn { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Our Store!</h1>
            </div>
            <div class="content">
                <h2>Hi ${userName}!</h2>
                <p>Thank you for joining our e-commerce platform. We're excited to have you as part of our community!</p>
                <p>Here's what you can do now:</p>
                <ul>
                    <li>Browse our extensive product catalog</li>
                    <li>Add items to your wishlist</li>
                    <li>Enjoy secure checkout with multiple payment options</li>
                    <li>Track your orders in real-time</li>
                </ul>
                <p style="text-align: center;">
                    <a href="${this.configService.get('app.frontendUrl')}" class="btn">Start Shopping</a>
                </p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The E-commerce Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getOrderConfirmationTemplate(userName: string, orderDetails: any): string {
    const itemsHtml = orderDetails.orderItems.map(item => `
      <tr>
        <td>${item.product.name}</td>
        <td>${item.quantity}</td>
        <td>$${item.price}</td>
        <td>$${(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .order-table th, .order-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .order-table th { background: #f2f2f2; }
            .total { font-weight: bold; font-size: 18px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Confirmed!</h1>
                <p>Order #${orderDetails.orderNumber || orderDetails.id}</p>
            </div>
            <div class="content">
                <h2>Hi ${userName}!</h2>
                <p>Thank you for your order. We've received your order and are processing it now.</p>
                
                <h3>Order Details:</h3>
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                        <tr class="total">
                            <td colspan="3">Total Amount:</td>
                            <td>$${orderDetails.totalAmount}</td>
                        </tr>
                    </tbody>
                </table>
                
                <p><strong>Order Status:</strong> ${orderDetails.status}</p>
                <p><strong>Order Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
                
                <p>We'll send you another email once your order ships!</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getPaymentSuccessTemplate(userName: string, paymentDetails: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Payment Successful</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Payment Successful!</h1>
            </div>
            <div class="content">
                <div class="success-icon">✅</div>
                <h2>Hi ${userName}!</h2>
                <p>Your payment has been successfully processed!</p>
                
                <h3>Payment Details:</h3>
                <ul>
                    <li><strong>Transaction ID:</strong> ${paymentDetails.reference}</li>
                    <li><strong>Amount:</strong> $${paymentDetails.amount}</li>
                    <li><strong>Payment Method:</strong> ${paymentDetails.gateway}</li>
                    <li><strong>Status:</strong> ${paymentDetails.status}</li>
                </ul>
                
                <p>Your order is now being prepared for shipment. You'll receive a tracking number once it ships.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .btn { display: inline-block; padding: 12px 24px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hi ${userName}!</h2>
                <p>We received a request to reset your password. Click the button below to reset it:</p>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" class="btn">Reset Password</a>
                </p>
                
                <div class="warning">
                    <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all;">${resetUrl}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getAdminOrderNotificationTemplate(orderDetails: any): string {
    const itemsHtml = orderDetails.orderItems.map(item => `
      <li>${item.product.name} - Quantity: ${item.quantity} - $${item.price}</li>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Order Notification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .urgent { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 New Order Alert</h1>
            </div>
            <div class="content">
                <div class="urgent">
                    <strong>Action Required:</strong> A new order has been placed and requires your attention.
                </div>
                
                <h3>Order Details:</h3>
                <ul>
                    <li><strong>Order Number:</strong> ${orderDetails.orderNumber || orderDetails.id}</li>
                    <li><strong>Customer:</strong> ${orderDetails.user.fullName}</li>
                    <li><strong>Email:</strong> ${orderDetails.user.email}</li>
                    <li><strong>Total Amount:</strong> $${orderDetails.totalAmount}</li>
                    <li><strong>Order Date:</strong> ${new Date(orderDetails.createdAt).toLocaleString()}</li>
                </ul>
                
                <h3>Items Ordered:</h3>
                <ul>
                    ${itemsHtml}
                </ul>
                
                <p><strong>Next Steps:</strong> Log into the admin panel to process this order.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getBankTransferInstructionsTemplate(userName: string, transferDetails: any): string {
    const bankAccountsHtml = transferDetails.bankAccounts.map(account => `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h4>${account.bankName}</h4>
        <p><strong>Account Name:</strong> ${account.accountName}</p>
        <p><strong>Account Number:</strong> ${account.accountNumber}</p>
        ${account.sortCode ? `<p><strong>Sort Code:</strong> ${account.sortCode}</p>` : ''}
        <p><strong>Currency:</strong> ${account.currency}</p>
      </div>
    `).join('');

    const instructionsHtml = transferDetails.instructions.map(instruction => `
      <li>${instruction}</li>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Bank Transfer Instructions</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .amount { background: #f0f8ff; border: 2px solid #2196F3; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .reference { background: #fffacd; border: 2px solid #ffd700; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💳 Bank Transfer Instructions</h1>
                <p>Order #${transferDetails.orderId}</p>
            </div>
            <div class="content">
                <h2>Hi ${userName}!</h2>
                <p>Please follow the instructions below to complete your payment via bank transfer.</p>
                
                <div class="amount">
                    <h3>Amount to Transfer</h3>
                    <h2 style="margin: 0; color: #2196F3;">$${transferDetails.amount}</h2>
                </div>
                
                <div class="reference">
                    <h3>Payment Reference (IMPORTANT)</h3>
                    <h2 style="margin: 0; color: #ff8c00;">${transferDetails.reference}</h2>
                    <p><small>Use this as your payment description/narration</small></p>
                </div>
                
                <h3>Bank Account Details:</h3>
                ${bankAccountsHtml}
                
                <h3>Instructions:</h3>
                <ol>
                    ${instructionsHtml}
                </ol>
                
                <div class="warning">
                    <strong>Important:</strong> Make sure to use the reference number exactly as shown above in your payment description. This helps us identify your payment quickly.
                </div>
                
                <p>Once you've made the transfer, please upload your receipt through your account dashboard or reply to this email with the receipt attached.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getReceiptUploadNotificationTemplate(userName: string, receiptDetails: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Receipt Upload Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .info { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📄 Receipt Upload Confirmation</h1>
            </div>
            <div class="content">
                <div class="success-icon">✅</div>
                <h2>Hi ${userName}!</h2>
                <p>Your payment receipt has been successfully uploaded and is now being reviewed by our team.</p>
                
                <h3>Payment Details:</h3>
                <ul>
                    <li><strong>Reference:</strong> ${receiptDetails.reference}</li>
                    <li><strong>Order ID:</strong> ${receiptDetails.orderId}</li>
                    <li><strong>Amount:</strong> $${receiptDetails.amount}</li>
                </ul>
                
                <div class="info">
                    <strong>What happens next?</strong><br>
                    Our team will verify your payment within 1-2 hours during business hours. You'll receive an email once the verification is complete.
                </div>
                
                <p>Thank you for your patience and for choosing our service!</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getPaymentRejectionTemplate(userName: string, rejectionDetails: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Payment Verification Issue</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .warning { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }
            .btn { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Payment Verification Issue</h1>
                <p>Order #${rejectionDetails.orderId}</p>
            </div>
            <div class="content">
                <h2>Hi ${userName}!</h2>
                <p>We've reviewed your payment receipt, but unfortunately, we couldn't verify your payment at this time.</p>
                
                <div class="warning">
                    <strong>Reason:</strong> ${rejectionDetails.reason}
                </div>
                
                <h3>What you can do:</h3>
                <ul>
                    <li>Check if the payment amount matches your order total</li>
                    <li>Ensure the reference number was used correctly</li>
                    <li>Upload a clearer image of your receipt</li>
                    <li>Contact our support team for assistance</li>
                </ul>
                
                <p style="text-align: center; margin: 30px 0;">
                    <a href="mailto:support@yourdomain.com" class="btn">Contact Support</a>
                </p>
                
                <p>We're here to help! Please don't hesitate to reach out if you have any questions.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}
