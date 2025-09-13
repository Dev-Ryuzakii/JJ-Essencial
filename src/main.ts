import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cors from 'cors';
import helmet from 'helmet';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';

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
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'https://essentialbyjay-nu.vercel.app',
        'https://jj-essencial.onrender.com', // Deployed backend domain
        'http://localhost:5173', // Development frontend
        'http://localhost:3000', // Alternative development
        'http://localhost:5174', // Alternative Vite dev server
        'http://127.0.0.1:5173', // Alternative localhost format
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []), // Dynamic frontend URL
      ];
      
      // Check for exact match or Vercel app pattern
      const isVercelApp = origin.match(/^https:\/\/.*\.vercel\.app$/);
      const isAllowed = allowedOrigins.includes(origin) || isVercelApp;
      
      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`❌ CORS blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Raw body parser for webhook signature verification
  app.use('/api/v1/payments/webhook', bodyParser.raw({ type: 'application/json' }));

  // Apply CORS configuration
  app.use(cors(corsOptions));
  
  // Log CORS configuration for debugging
  logger.log('✅ CORS Configuration Applied');
  logger.log(`🌍 Allowed origins include: localhost:5173, jj-essencial.onrender.com, *.vercel.app`);
  logger.log(`🔑 Credentials enabled: ${corsOptions.credentials}`);
  logger.log(`📝 Methods: ${corsOptions.methods.join(', ')}`);
  logger.log(`🎯 Headers: ${corsOptions.allowedHeaders.join(', ')}`);
  
  // Additional middleware for CORS debugging
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      logger.log(`📶 CORS Preflight for ${req.get('Origin') || 'unknown origin'} -> ${req.originalUrl}`);
    }
    next();
  });

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
