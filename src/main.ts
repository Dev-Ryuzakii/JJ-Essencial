import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cors from 'cors';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Validate Supabase configuration
  const supabaseUrl = configService.get('supabase.url');
  const supabaseKey = configService.get('supabase.serviceRoleKey');
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.');
  }

  logger.log('Supabase configuration:', { 
    url: supabaseUrl ? 'Found' : 'Missing',
    key: supabaseKey ? 'Found' : 'Missing'
  });

  // Use Render's dynamic port or fallback
  const port = process.env.PORT || configService.get('app.port') || 3000;
  const apiPrefix = configService.get('app.apiPrefix') || '';

  // CORS configuration with specific origins
  const corsOptions = {
    origin: [
      'https://essentialbyjay-nu.vercel.app',
      'https://*.vercel.app',  // All Vercel domains
      'http://localhost:5173', // Development
      'http://localhost:3000'  // Alternative development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  };

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Apply CORS configuration
  app.use(cors(corsOptions));

  // Global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('E-commerce Backend API')
    .setDescription('Production-ready e-commerce backend with Supabase and payment gateways')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and profile management')
    .addTag('Products', 'Product management and catalog')
    .addTag('Orders', 'Order management and tracking')
    .addTag('Payments', 'Payment processing with Paystack and Flutterwave')
    .addServer(`/${apiPrefix}`, 'Relative API path')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

 
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 API Documentation available at: http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`🔧 Environment: ${configService.get('app.nodeEnv')}`);
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error, 'Bootstrap');
  process.exit(1);
});
