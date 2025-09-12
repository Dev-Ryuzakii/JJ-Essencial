import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsEnum, Min, IsOptional, IsUUID, IsBoolean, IsObject, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentGateway {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  AWAITING_VERIFICATION = 'AWAITING_VERIFICATION',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class BankAccountDto {
  @ApiProperty({ example: 'First Bank Nigeria' })
  bankName: string;

  @ApiProperty({ example: 'Your Company Name' })
  accountName: string;

  @ApiProperty({ example: '1234567890' })
  accountNumber: string;

  @ApiProperty({ example: '123456', required: false })
  sortCode?: string;

  @ApiProperty({ example: 'FIRSTNIG', required: false })
  swiftCode?: string;

  @ApiProperty({ example: 'NGN' })
  currency: string;
}

export class CreateBankAccountDto {
  @ApiProperty({ example: 'First Bank Nigeria' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ example: 'Your Company Name' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  sortCode?: string;

  @ApiProperty({ example: 'FIRSTNIG', required: false })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiProperty({ example: 'NGN', default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  isActive?: boolean;
}

export class InitiatePaymentDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 'PAYSTACK', enum: ['PAYSTACK', 'FLUTTERWAVE', 'BANK_TRANSFER'] })
  @IsEnum(['PAYSTACK', 'FLUTTERWAVE', 'BANK_TRANSFER'])
  gateway: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER';
}

export class InitiateFlutterwaveDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'NGN', default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    example: {
      email: 'customer@example.com',
      name: 'John Doe',
      phone: '+2348123456789'
    }
  })
  @IsObject()
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
}

export class InitiateBankTransferDto {
  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  authorization_url: string;

  @ApiProperty()
  access_code: string;

  @ApiProperty()
  reference: string;
}

export class FlutterwaveInitiateResponseDto {
  @ApiProperty({ example: 'FLWPUBK_TEST-xxx' })
  publicKey: string;

  @ApiProperty({ example: 'tx_12345678' })
  tx_ref: string;

  @ApiProperty({ example: 5000 })
  amount: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty({
    example: {
      email: 'customer@example.com',
      name: 'John Doe',
      phone: '+2348123456789'
    }
  })
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
}

export class FlutterwaveVerifyDto {
  @ApiProperty({ example: 'tx_12345678' })
  @IsOptional()
  @IsString()
  tx_ref?: string;

  @ApiProperty({ example: '12345678' })
  @IsOptional()
  @IsString()
  transaction_id?: string;
}

export class BankTransferResponseDto {
  @ApiProperty()
  reference: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ type: [BankAccountDto] })
  bankAccounts: BankAccountDto[];

  @ApiProperty({ type: [String] })
  instructions: string[];
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'payment-reference' })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty({ example: 'PAYSTACK', enum: ['PAYSTACK', 'FLUTTERWAVE', 'BANK_TRANSFER'] })
  @IsEnum(['PAYSTACK', 'FLUTTERWAVE', 'BANK_TRANSFER'])
  gateway: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER';
}

export class WebhookPayloadDto {
  @ApiProperty()
  event: string;

  @ApiProperty()
  data: any;
}

export class UploadReceiptDto {
  @ApiProperty({ example: 'transaction-reference' })
  @IsString()
  @IsNotEmpty()
  reference: string;
}

export class VerifyReceiptDto {
  @ApiProperty({ example: 'receipt-uuid' })
  @IsUUID()
  receiptId: string;

  @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiProperty({ example: 'Payment verified successfully', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentReceiptDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  receiptUrl: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty()
  verificationStatus: VerificationStatus;

  @ApiProperty({ required: false })
  verificationNotes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  uploader: {
    id: string;
    fullName: string;
    email: string;
  };
}
