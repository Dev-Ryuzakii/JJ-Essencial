import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EmailModule } from './modules/email/email.module';
import { UploadModule } from './modules/upload/upload.module';
import { SearchModule } from './modules/search/search.module';
import { UsersModule } from './modules/users/users.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrderTrackingModule } from './modules/order-tracking/order-tracking.module';
import { CustomerSupportModule } from './modules/customer-support/customer-support.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Controllers and Services
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ]),

    // Business modules
    AuthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    EmailModule,
    UploadModule,
    SearchModule,
    UsersModule,
    WishlistModule,
    ReviewsModule,
    InventoryModule,
    CategoriesModule,
    OrderTrackingModule,
    CustomerSupportModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
