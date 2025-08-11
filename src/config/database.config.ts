import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

export class DatabaseConfig {
  private static instance: PrismaClient;

  static getInstance(configService?: ConfigService): PrismaClient {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new PrismaClient({
        datasources: {
          db: {
            url: configService?.get('DATABASE_URL') || process.env.DATABASE_URL,
          },
        },
        log: ['query', 'info', 'warn', 'error'],
      });
    }
    return DatabaseConfig.instance;
  }

  static async disconnect(): Promise<void> {
    if (DatabaseConfig.instance) {
      await DatabaseConfig.instance.$disconnect();
    }
  }
}
