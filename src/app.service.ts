import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'connected', // This would typically check actual DB connection
        supabase: 'connected',  // This would typically check Supabase connection
      },
    };
  }

  getVersion() {
    return {
      version: '1.0.0',
      name: 'E-commerce Backend API',
      description: 'Production-ready e-commerce backend with Supabase, Prisma, and payment gateways',
      author: 'Your Team',
      build: {
        date: new Date().toISOString(),
        node: process.version,
        platform: process.platform,
      },
    };
  }
}
