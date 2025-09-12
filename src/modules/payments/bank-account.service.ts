import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';
import { BankAccountDto, CreateBankAccountDto } from '../payments/dto/payment.dto';
import { SuccessResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class BankAccountService {
  private readonly logger = new Logger(BankAccountService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
  }

  async getActiveBankAccounts(): Promise<BankAccountDto[]> {
    try {
      const { data: accounts, error } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return accounts.map(account => ({
        bankName: account.bank_name,
        accountName: account.account_name,
        accountNumber: account.account_number,
        sortCode: account.sort_code || undefined,
        swiftCode: account.swift_code || undefined,
        currency: account.currency,
      }));
    } catch (error) {
      this.logger.error('Failed to get bank accounts:', error);
      throw error;
    }
  }

  async createBankAccount(createBankAccountDto: CreateBankAccountDto): Promise<SuccessResponseDto<BankAccountDto>> {
    try {
      const { data: bankAccount, error } = await this.supabase
        .from('bank_accounts')
        .insert({
          bank_name: createBankAccountDto.bankName,
          account_number: createBankAccountDto.accountNumber,
          account_name: createBankAccountDto.accountName,
          is_active: createBankAccountDto.isActive ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      const bankAccountDto: BankAccountDto = {
        bankName: bankAccount.bank_name,
        accountName: bankAccount.account_name,
        accountNumber: bankAccount.account_number,
        sortCode: bankAccount.sort_code || undefined,
        swiftCode: bankAccount.swift_code || undefined,
        currency: bankAccount.currency,
      };

      this.logger.log(`Bank account created: ${bankAccount.id}`);
      return new SuccessResponseDto(bankAccountDto, 'Bank account created successfully');
    } catch (error) {
      this.logger.error('Failed to create bank account:', error);
      throw error;
    }
  }

  async updateBankAccount(id: string, accountData: Partial<BankAccountDto>): Promise<any> {
    try {
      const updateData = {
        ...(accountData.bankName && { bank_name: accountData.bankName }),
        ...(accountData.accountName && { account_name: accountData.accountName }),
        ...(accountData.accountNumber && { account_number: accountData.accountNumber }),
        ...(accountData.sortCode && { sort_code: accountData.sortCode }),
        ...(accountData.swiftCode && { swift_code: accountData.swiftCode }),
        ...(accountData.currency && { currency: accountData.currency }),
      };

      const { data: account, error } = await this.supabase
        .from('bank_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!account) throw new NotFoundException('Bank account not found');

      this.logger.log(`Bank account updated: ${id}`);
      return account;
    } catch (error) {
      this.logger.error('Failed to update bank account:', error);
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException('Bank account not found');
    }
  }

  async toggleBankAccountStatus(id: string): Promise<any> {
    try {
      const { data: account, error: fetchError } = await this.supabase
        .from('bank_accounts')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!account) throw new NotFoundException('Bank account not found');

      const { data: updatedAccount, error: updateError } = await this.supabase
        .from('bank_accounts')
        .update({ is_active: !account.is_active })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      this.logger.log(`Bank account ${id} status changed to: ${updatedAccount.is_active ? 'active' : 'inactive'}`);
      return updatedAccount;
    } catch (error) {
      this.logger.error('Failed to toggle bank account status:', error);
      if (error instanceof NotFoundException) throw error;
      throw new Error('Failed to toggle bank account status');
    }
  }

  async getAllBankAccounts(): Promise<any[]> {
    try {
      const { data: accounts, error } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return accounts;
    } catch (error) {
      this.logger.error('Failed to get all bank accounts:', error);
      throw error;
    }
  }
}
