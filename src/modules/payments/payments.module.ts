import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BankAccountService } from './bank-account.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ConfigModule, EmailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, BankAccountService],
  exports: [PaymentsService, BankAccountService],
})
export class PaymentsModule {}
