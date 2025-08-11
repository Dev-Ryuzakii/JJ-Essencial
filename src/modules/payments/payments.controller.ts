import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
  RawBody,
  UseInterceptors,
  UploadedFile,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { 
  InitiatePaymentDto, 
  VerifyPaymentDto, 
  PaymentResponseDto, 
  WebhookPayloadDto,
  InitiateBankTransferDto,
  UploadReceiptDto,
  VerifyReceiptDto,
  BankTransferResponseDto,
  PaymentReceiptDto
} from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { UserId, UserRole } from '../../common/decorators/user.decorator';
import { SuccessResponseDto } from '../../common/dto/common.dto';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate payment for an order' })
  @ApiResponse({
    status: 200,
    description: 'Payment initiated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async initiatePayment(
    @UserId() userId: string,
    @Body() initiatePaymentDto: InitiatePaymentDto,
  ): Promise<SuccessResponseDto<PaymentResponseDto>> {
    const result = await this.paymentsService.initiatePayment(userId, initiatePaymentDto);
    return new SuccessResponseDto(result, 'Payment initiated successfully');
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment status' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto): Promise<SuccessResponseDto<any>> {
    const result = await this.paymentsService.verifyPayment(verifyPaymentDto);
    return new SuccessResponseDto(result, 'Payment verified successfully');
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history (User: own payments, Admin: all payments)' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(
    @UserId() userId: string,
    @UserRole() userRole: string,
  ): Promise<SuccessResponseDto<any[]>> {
    const isAdmin = userRole === 'ADMIN';
    const result = await this.paymentsService.getPaymentHistory(isAdmin ? undefined : userId);
    return new SuccessResponseDto(result, 'Payment history retrieved successfully');
  }

  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  @ApiHeader({ name: 'x-paystack-signature', description: 'Paystack signature' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async paystackWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-paystack-signature') signature: string,
  ): Promise<SuccessResponseDto<any>> {
    const result = await this.paymentsService.handlePaystackWebhook(payload, signature);
    return new SuccessResponseDto(result, 'Webhook processed successfully');
  }

  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave webhook endpoint' })
  @ApiHeader({ name: 'verif-hash', description: 'Flutterwave signature' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async flutterwaveWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('verif-hash') signature: string,
  ): Promise<SuccessResponseDto<any>> {
    const result = await this.paymentsService.handleFlutterwaveWebhook(payload, signature);
    return new SuccessResponseDto(result, 'Webhook processed successfully');
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getPaymentStats(): Promise<SuccessResponseDto<any>> {
    // This would typically calculate payment statistics
    // For now, return a placeholder
    const stats = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalAmount: 0,
      paystackTransactions: 0,
      flutterwaveTransactions: 0,
    };
    
    return new SuccessResponseDto(stats, 'Payment statistics retrieved successfully');
  }

  // Bank Transfer Endpoints
  @Post('bank-transfer/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate bank transfer payment' })
  @ApiResponse({
    status: 200,
    description: 'Bank transfer details provided successfully',
    type: BankTransferResponseDto,
  })
  async initiateBankTransfer(
    @UserId() userId: string,
    @Body() initiateBankTransferDto: InitiateBankTransferDto,
  ): Promise<SuccessResponseDto<BankTransferResponseDto>> {
    const result = await this.paymentsService.initiateBankTransfer(userId, initiateBankTransferDto.orderId);
    return new SuccessResponseDto(result, 'Bank transfer details provided successfully');
  }

  @Post('receipt/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload payment receipt' })
  @ApiResponse({ status: 200, description: 'Receipt uploaded successfully' })
  async uploadReceipt(
    @UserId() userId: string,
    @Body() uploadReceiptDto: UploadReceiptDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponseDto<PaymentReceiptDto>> {
    const result = await this.paymentsService.uploadPaymentReceipt(
      userId,
      uploadReceiptDto,
      file,
    );
    return new SuccessResponseDto(result, 'Receipt uploaded successfully');
  }

  @Get('receipts/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending receipt verifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pending receipts retrieved successfully' })
  async getPendingReceipts(): Promise<SuccessResponseDto<PaymentReceiptDto[]>> {
    const result = await this.paymentsService.getPendingReceipts();
    return new SuccessResponseDto(result, 'Pending receipts retrieved successfully');
  }

  @Patch('receipt/:receiptId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment receipt (Admin only)' })
  @ApiResponse({ status: 200, description: 'Receipt verification completed' })
  async verifyReceipt(
    @UserId() adminId: string,
    @Param('receiptId') receiptId: string,
    @Body() verifyReceiptDto: VerifyReceiptDto,
  ): Promise<SuccessResponseDto<any>> {
    // Add the receiptId to the DTO since it comes from the URL parameter
    const updatedDto = { ...verifyReceiptDto, receiptId };
    const result = await this.paymentsService.verifyPaymentReceipt(adminId, updatedDto);
    return new SuccessResponseDto(result, 'Receipt verification completed');
  }
}
