import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from '../upload/upload.service';

@Module({
  imports: [JwtModule, ConfigModule],
  controllers: [AdminController],
  providers: [AdminService, UploadService],
  exports: [AdminService],
})
export class AdminModule {}
