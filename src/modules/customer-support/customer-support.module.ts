import { Module } from '@nestjs/common';
import { CustomerSupportController } from './customer-support.controller';
import { CustomerSupportService } from './customer-support.service';

@Module({
  controllers: [CustomerSupportController],
  providers: [CustomerSupportService],
  exports: [CustomerSupportService],
})
export class CustomerSupportModule {}
