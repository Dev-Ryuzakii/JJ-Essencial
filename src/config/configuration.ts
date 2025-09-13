export interface AppConfig {
  port: number;
  apiPrefix: string;
  nodeEnv: string;
  allowedOrigins: string[];
  frontendUrl: string;
}

export interface DatabaseConfig {
  url: string;
  directUrl: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export interface PaymentConfig {
  paystack: {
    secretKey: string;
    publicKey: string;
  };
  flutterwave: {
    secretKey: string;
    publicKey: string;
    encryptionKey?: string;
  };
}

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
  adminEmail?: string;
}

export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
}

export interface SecurityConfig {
  bcryptRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || '',
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  } as AppConfig,

  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  } as DatabaseConfig,

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as JwtConfig,

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  } as SupabaseConfig,

  payment: {
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    },
    flutterwave: {
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
    },
  } as PaymentConfig,

  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: {
      email: process.env.FROM_EMAIL,
      name: process.env.FROM_NAME || 'E-commerce Store',
    },
    adminEmail: process.env.ADMIN_EMAIL || process.env.FROM_EMAIL,
  } as EmailConfig,

  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'],
  } as FileUploadConfig,

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  } as SecurityConfig,
});
