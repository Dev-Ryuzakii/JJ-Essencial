import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../../config/database.config';
import { PrismaClient } from '@prisma/client';
import { BankAccountDto } from '../payments/dto/payment.dto';

@Injectable()
export class BankAccountService {
  private readonly logger = new Logger(BankAccountService.name);
  private prisma: PrismaClient;

  constructor(private configService: ConfigService) {
    this.prisma = DatabaseConfig.getInstance(this.configService);
  }

  async getActiveBankAccounts(): Promise<BankAccountDto[]> {
    try {
      const accounts = await this.prisma.bankAccount.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      return accounts.map(account => ({
        bankName: account.bankName,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        sortCode: account.sortCode || undefined,
        swiftCode: account.swiftCode || undefined,
        currency: account.currency,
      }));
    } catch (error) {
      this.logger.error('Failed to get bank accounts:', error);
      throw error;
    }
  }

  async createBankAccount(accountData: BankAccountDto): Promise<any> {
    try {
      const account = await this.prisma.bankAccount.create({
        data: {
          bankName: accountData.bankName,
          accountName: accountData.accountName,
          accountNumber: accountData.accountNumber,
          sortCode: accountData.sortCode,
          swiftCode: accountData.swiftCode,
          currency: accountData.currency || 'NGN',
        },
      });

      this.logger.log(`Bank account created: ${account.accountName} - ${account.accountNumber}`);
      return account;
    } catch (error) {
      this.logger.error('Failed to create bank account:', error);
      throw error;
    }
  }

  async updateBankAccount(id: string, accountData: Partial<BankAccountDto>): Promise<any> {
    try {
      const account = await this.prisma.bankAccount.update({
        where: { id },
        data: {
          ...(accountData.bankName && { bankName: accountData.bankName }),
          ...(accountData.accountName && { accountName: accountData.accountName }),
          ...(accountData.accountNumber && { accountNumber: accountData.accountNumber }),
          ...(accountData.sortCode && { sortCode: accountData.sortCode }),
          ...(accountData.swiftCode && { swiftCode: accountData.swiftCode }),
          ...(accountData.currency && { currency: accountData.currency }),
        },
      });

      this.logger.log(`Bank account updated: ${id}`);
      return account;
    } catch (error) {
      this.logger.error('Failed to update bank account:', error);
      throw new NotFoundException('Bank account not found');
    }
  }

  async toggleBankAccountStatus(id: string): Promise<any> {
    try {
      const account = await this.prisma.bankAccount.findUnique({ where: { id } });
      if (!account) {
        throw new NotFoundException('Bank account not found');
      }

      const updatedAccount = await this.prisma.bankAccount.update({
        where: { id },
        data: { isActive: !account.isActive },
      });

      this.logger.log(`Bank account ${id} status changed to: ${updatedAccount.isActive ? 'active' : 'inactive'}`);
      return updatedAccount;
    } catch (error) {
      this.logger.error('Failed to toggle bank account status:', error);
      throw error;
    }
  }

  async getAllBankAccounts(): Promise<any[]> {
    try {
      return await this.prisma.bankAccount.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to get all bank accounts:', error);
      throw error;
    }
  }
}
