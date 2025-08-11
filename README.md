# E-commerce Backend API

A **production-ready**, **full-scale e-commerce backend** built with **NestJS**, **Supabase**, and **Prisma ORM**. This API supports multi-role authentication, product management, order processing, payment integration, and real-time features.

## 🚀 Features

### Core Features
- ✅ **Authentication & Authorization** (Supabase Auth + JWT)
- ✅ **Multi-role System** (Admin/User with role-based access)
- ✅ **Product Management** (CRUD with categories, stock tracking)
- ✅ **Order Management** (Cart to order flow with status tracking)
- ✅ **Payment Processing** (Paystack & Flutterwave integration)
- ✅ **Real-time Updates** (Supabase Realtime + Socket.IO)
- ✅ **Trade/Resell System** (Users can list purchased products)

### Technical Features
- 🛡️ **Security**: Rate limiting, CORS, Helmet, JWT validation
- 📚 **API Documentation**: Auto-generated Swagger/OpenAPI docs
- 🗄️ **Database**: PostgreSQL with Prisma ORM and migrations
- 🔄 **Real-time**: WebSocket support for live updates
- 📧 **Email**: SMTP integration for notifications
- 📄 **PDF Generation**: Receipt generation for orders
- ⚡ **Performance**: Caching, compression, pagination
- 🧪 **Testing**: E2E and unit tests ready

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **NestJS** | Backend framework with TypeScript |
| **Supabase** | PostgreSQL database with real-time features |
| **Prisma ORM** | Type-safe database access |
| **JWT** | Authentication tokens |
| **Paystack/Flutterwave** | Payment processing |
| **Socket.IO** | Real-time communication |
| **Swagger** | API documentation |
| **Helmet** | Security headers |

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account
- Paystack/Flutterwave accounts (for payments)

### Setup Steps

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd JJ-ESSENCIAL
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your actual values:
   ```env
   # Database (Supabase PostgreSQL)
   DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
   
   # Supabase
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
   
   # Payment Gateways
   PAYSTACK_SECRET_KEY="sk_test_your-paystack-secret-key"
   FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-your-flutterwave-secret"
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Seed database (optional)
   npx prisma db seed
   ```

4. **Start Development Server**
   ```bash
   npm run start:dev
   ```

The API will be running at:
- **Server**: http://localhost:3000/api/v1
- **Documentation**: http://localhost:3000/api/v1/docs

## 📖 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/signup          # Register new user
POST /api/v1/auth/signin          # User login
POST /api/v1/auth/reset-password  # Password reset
GET  /api/v1/auth/profile         # Get user profile
PUT  /api/v1/auth/profile         # Update user profile
```

### Product Endpoints
```
GET    /api/v1/products           # Get all products (with filters)
GET    /api/v1/products/:id       # Get single product
POST   /api/v1/products           # Create product (Admin only)
PATCH  /api/v1/products/:id       # Update product (Admin only)
DELETE /api/v1/products/:id       # Delete product (Admin only)
GET    /api/v1/products/categories # Get categories
```

### Order Endpoints
```
GET  /api/v1/orders               # Get orders (User: own, Admin: all)
POST /api/v1/orders               # Create new order
GET  /api/v1/orders/:id           # Get single order
PATCH /api/v1/orders/:id/status   # Update order status (Admin only)
GET  /api/v1/orders/stats         # Get order statistics
```

### Payment Endpoints
```
POST /api/v1/payments/initiate          # Initiate payment
POST /api/v1/payments/verify            # Verify payment
GET  /api/v1/payments/history           # Payment history
POST /api/v1/payments/webhook/paystack  # Paystack webhook
POST /api/v1/payments/webhook/flutterwave # Flutterwave webhook
```

## 🔐 Authentication

The API uses **JWT tokens** for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer your-jwt-token
```

### User Roles
- **USER**: Can view products, create orders, manage own profile
- **ADMIN**: Full access to all endpoints including user management

## 💳 Payment Integration

### Supported Gateways
1. **Paystack** (Nigeria, Ghana, South Africa)
2. **Flutterwave** (Multiple African countries)

### Payment Flow
1. User creates an order
2. Initiate payment with chosen gateway
3. User completes payment on gateway
4. Webhook confirms payment
5. Order status updated to "PAID"
6. Admin can mark as "COMPLETED"

## 🗄️ Database Schema

### Core Tables
- `profiles` - User profiles linked to Supabase Auth
- `products` - Product catalog with stock tracking
- `orders` - Order records with status tracking
- `order_items` - Individual items in orders
- `trades` - User-to-user product reselling
- `payment_transactions` - Payment tracking

### Relationships
- Users can have multiple orders
- Orders contain multiple order items
- Products can be in multiple orders
- Users can create trades for purchased products

## 🔄 Real-time Features

### Supabase Realtime
- Product updates notify all users
- Order status changes notify admins
- Stock level updates in real-time

### WebSocket Events
```javascript
// Listen for product updates
socket.on('product:updated', (product) => {
  // Update UI
});

// Listen for order notifications
socket.on('order:created', (order) => {
  // Notify admin
});
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
SUPABASE_URL=your-production-supabase-url
# ... other production configs
```

### Deployment Platforms
- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **Heroku**: `git push heroku main`
- **VPS**: Use PM2 for process management

### Production Checklist
- [ ] Set production environment variables
- [ ] Configure database with connection pooling
- [ ] Set up SSL certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting for production traffic

## 📁 Project Structure

```
src/
├── common/           # Shared utilities, guards, decorators
├── config/           # Configuration files
├── modules/
│   ├── auth/         # Authentication module
│   ├── products/     # Product management
│   ├── orders/       # Order processing
│   ├── payments/     # Payment integration
│   └── trades/       # Trade/resell system
├── app.module.ts     # Main application module
└── main.ts          # Application entry point

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or need help:

1. Check the [API Documentation](http://localhost:3000/api/v1/docs)
2. Review the environment configuration
3. Check database connection
4. Verify payment gateway credentials
5. Create an issue in this repository

## 🎯 Next Steps

After setting up the backend, you can:

1. **Frontend Integration**: Connect with React/Vue/Angular frontend
2. **Mobile App**: Use the API with React Native/Flutter
3. **Admin Dashboard**: Build a comprehensive admin panel
4. **Analytics**: Add reporting and analytics features
5. **Email Templates**: Design beautiful email notifications
6. **File Upload**: Add image upload for products
7. **Search**: Implement advanced search with Elasticsearch

---

**Built with ❤️ using NestJS, Supabase, and Prisma**
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
# JJ-Essencial
