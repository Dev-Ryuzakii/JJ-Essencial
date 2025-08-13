# Complete API Endpoints Implementation Documentation

## Overview
This document provides comprehensive coverage of all API endpoints implemented in the JJ-ESSENCIAL e-commerce backend. The API is built with NestJS, TypeScript, Prisma ORM, and Supabase.

## Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://your-domain.com/api/v1`

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Admin Credentials
- **Email**: `admin@jjessencial.com`
- **Password**: `admin123`
- **Role**: `ADMIN`

## Response Format
All successful responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error details",
  "statusCode": 400
}
```

---

## 1. Authentication Endpoints

### 1.1 User Registration
- **Endpoint**: `POST /auth/register`
- **Access**: Public
- **Description**: Register a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    },
    "tokens": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

### 1.2 User Login
- **Endpoint**: `POST /auth/login`
- **Access**: Public
- **Description**: Authenticate user and get access tokens

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**: Same as registration response

### 1.3 Admin Sync Users (Fixed Endpoint)
- **Endpoint**: `POST /auth/admin/sync-users`
- **Access**: Admin Only
- **Description**: Synchronize users between local database and Supabase Auth

**Response**:
```json
{
  "success": true,
  "message": "User synchronization completed",
  "data": {
    "totalSupabaseUsers": 10,
    "totalLocalUsers": 8,
    "syncedUsers": 2,
    "inconsistencies": []
  }
}
```

### 1.4 Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Access**: Authenticated
- **Description**: Refresh access token using refresh token

---

## 2. Products Endpoints

### 2.1 Get All Products
- **Endpoint**: `GET /products`
- **Access**: Public
- **Description**: Get all products with pagination and filters

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `category`: Filter by category
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `inStock`: Filter only in-stock items
- `sortBy`: Sort field (name, price, createdAt)
- `sortOrder`: Sort order (asc, desc)

**Response**:
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "stock": 50,
        "images": ["url1", "url2"],
        "category": "Electronics",
        "isActive": true,
        "createdAt": "2025-08-12T00:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### 2.2 Get Product by ID
- **Endpoint**: `GET /products/:id`
- **Access**: Public
- **Description**: Get a single product by ID

### 2.3 Create Product
- **Endpoint**: `POST /products`
- **Access**: Admin Only
- **Description**: Create a new product

**Request Body**:
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "stock": 100,
  "images": ["image_url"],
  "category": "Electronics",
  "lowStockThreshold": 10
}
```

### 2.4 Update Product
- **Endpoint**: `PATCH /products/:id`
- **Access**: Admin Only
- **Description**: Update an existing product

### 2.5 Delete Product
- **Endpoint**: `DELETE /products/:id`
- **Access**: Admin Only
- **Description**: Soft delete a product (sets isActive to false)

### 2.6 Get Product Categories
- **Endpoint**: `GET /products/categories`
- **Access**: Public
- **Description**: Get all available product categories

### 2.7 Get Low Stock Products (Fixed Endpoint)
- **Endpoint**: `GET /products/low-stock`
- **Access**: Admin Only
- **Description**: Get products with low stock levels

**Query Parameters**:
- `threshold`: Stock threshold (default: 10)

**Response**:
```json
{
  "success": true,
  "message": "Low stock products retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "stock": 5,
      "lowStockThreshold": 10,
      "price": 99.99
    }
  ]
}
```

---

## 3. Orders Endpoints

### 3.1 Create Order
- **Endpoint**: `POST /orders`
- **Access**: Authenticated
- **Description**: Create a new order

**Request Body**:
```json
{
  "items": [
    {
      "productId": "product_uuid",
      "quantity": 2
    }
  ],
  "deliveryAddress": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  },
  "orderNotes": "Special instructions",
  "savedAddressId": "address_uuid"
}
```

### 3.2 Get Orders
- **Endpoint**: `GET /orders`
- **Access**: Authenticated
- **Description**: Get orders (user sees own orders, admin sees all)

**Query Parameters**: Same as products pagination

### 3.3 Get Order by ID
- **Endpoint**: `GET /orders/:id`
- **Access**: Authenticated
- **Description**: Get a specific order

### 3.4 Update Order Status
- **Endpoint**: `PATCH /orders/:id/status`
- **Access**: Admin Only
- **Description**: Update order status

**Request Body**:
```json
{
  "status": "PAID" // PENDING, PAID, COMPLETED, CANCELLED
}
```

### 3.5 Get Order Statistics (Fixed Endpoint)
- **Endpoint**: `GET /orders/stats`
- **Access**: Authenticated
- **Description**: Get order statistics

**Response**:
```json
{
  "success": true,
  "message": "Order statistics retrieved successfully",
  "data": {
    "counts": {
      "total": 150,
      "pending": 10,
      "paid": 100,
      "completed": 35,
      "cancelled": 5
    },
    "totalRevenue": 15000.00,
    "recentOrders": [
      {
        "id": "uuid",
        "totalAmount": 199.99,
        "status": "PAID",
        "createdAt": "2025-08-12T00:00:00.000Z",
        "orderItems": [...]
      }
    ]
  }
}
```

---

## 4. Analytics Endpoints (Fixed)

### 4.1 Get Dashboard Statistics
- **Endpoint**: `GET /analytics/dashboard`
- **Access**: Admin Only
- **Description**: Get comprehensive dashboard statistics

**Response**:
```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "overview": {
      "totalProducts": 100,
      "totalOrders": 500,
      "totalUsers": 200,
      "totalRevenue": 50000.00,
      "lowStockProducts": 5,
      "pendingOrders": 15,
      "recentReviews": 25
    },
    "daily": {
      "orders": 10,
      "revenue": 1500.00
    },
    "weekly": {
      "orders": 75,
      "revenue": 10000.00
    },
    "monthly": {
      "orders": 300,
      "revenue": 45000.00
    }
  }
}
```

### 4.2 Get Sales Analytics
- **Endpoint**: `GET /analytics/sales`
- **Access**: Admin Only
- **Description**: Get detailed sales analytics

**Query Parameters**:
- `days`: Number of days to analyze (default: 30)

**Response**:
```json
{
  "success": true,
  "data": {
    "dailySales": [
      {
        "date": "2025-08-12",
        "orders": 10,
        "revenue": 1500.00
      }
    ],
    "topProducts": [
      {
        "id": "uuid",
        "name": "Product Name",
        "total_sold": 50,
        "total_revenue": 5000.00
      }
    ],
    "salesByCategory": [
      {
        "category": "Electronics",
        "orders": 25,
        "revenue": 7500.00,
        "units_sold": 75
      }
    ],
    "period": {
      "start": "2025-07-13T00:00:00.000Z",
      "end": "2025-08-12T00:00:00.000Z",
      "days": 30
    }
  }
}
```

### 4.3 Get Customer Analytics
- **Endpoint**: `GET /analytics/customers`
- **Access**: Admin Only
- **Description**: Get customer analytics and retention data

### 4.4 Get Inventory Analytics
- **Endpoint**: `GET /analytics/inventory`
- **Access**: Admin Only
- **Description**: Get inventory analytics

### 4.5 Get Order Analytics
- **Endpoint**: `GET /analytics/orders`
- **Access**: Admin Only
- **Description**: Get order analytics and trends

---

## 5. User Management Endpoints

### 5.1 Get User Profile
- **Endpoint**: `GET /users/profile`
- **Access**: Authenticated
- **Description**: Get current user's profile

### 5.2 Update User Profile
- **Endpoint**: `PATCH /users/profile`
- **Access**: Authenticated
- **Description**: Update current user's profile

### 5.3 Get All Users
- **Endpoint**: `GET /users`
- **Access**: Admin Only
- **Description**: Get all users with pagination

### 5.4 Get User by ID
- **Endpoint**: `GET /users/:id`
- **Access**: Admin Only
- **Description**: Get a specific user by ID

### 5.5 Update User
- **Endpoint**: `PATCH /users/:id`
- **Access**: Admin Only
- **Description**: Update a user's information

### 5.6 Delete User
- **Endpoint**: `DELETE /users/:id`
- **Access**: Admin Only
- **Description**: Soft delete a user

---

## 6. Payment Endpoints

### 6.1 Initialize Payment
- **Endpoint**: `POST /payments/initialize`
- **Access**: Authenticated
- **Description**: Initialize payment for an order

**Request Body**:
```json
{
  "orderId": "order_uuid",
  "gateway": "PAYSTACK", // or "FLUTTERWAVE"
  "currency": "NGN"
}
```

### 6.2 Verify Payment
- **Endpoint**: `POST /payments/verify`
- **Access**: Authenticated
- **Description**: Verify payment transaction

### 6.3 Payment Webhook (Paystack)
- **Endpoint**: `POST /payments/webhook/paystack`
- **Access**: Public (with signature verification)
- **Description**: Handle Paystack webhook events

### 6.4 Payment Webhook (Flutterwave)
- **Endpoint**: `POST /payments/webhook/flutterwave`
- **Access**: Public (with signature verification)
- **Description**: Handle Flutterwave webhook events

---

## 7. Categories Endpoints

### 7.1 Get All Categories
- **Endpoint**: `GET /categories`
- **Access**: Public
- **Description**: Get all product categories

### 7.2 Create Category
- **Endpoint**: `POST /categories`
- **Access**: Admin Only
- **Description**: Create a new category

### 7.3 Update Category
- **Endpoint**: `PATCH /categories/:id`
- **Access**: Admin Only
- **Description**: Update a category

### 7.4 Delete Category
- **Endpoint**: `DELETE /categories/:id`
- **Access**: Admin Only
- **Description**: Delete a category

---

## 8. Reviews Endpoints

### 8.1 Get Product Reviews
- **Endpoint**: `GET /reviews/product/:productId`
- **Access**: Public
- **Description**: Get all reviews for a product

### 8.2 Create Review
- **Endpoint**: `POST /reviews`
- **Access**: Authenticated
- **Description**: Create a product review

### 8.3 Update Review
- **Endpoint**: `PATCH /reviews/:id`
- **Access**: Authenticated (own reviews only)
- **Description**: Update a review

### 8.4 Delete Review
- **Endpoint**: `DELETE /reviews/:id`
- **Access**: Authenticated (own reviews) or Admin
- **Description**: Delete a review

---

## 9. Wishlist Endpoints

### 9.1 Get User Wishlist
- **Endpoint**: `GET /wishlist`
- **Access**: Authenticated
- **Description**: Get current user's wishlist

### 9.2 Add to Wishlist
- **Endpoint**: `POST /wishlist`
- **Access**: Authenticated
- **Description**: Add a product to wishlist

### 9.3 Remove from Wishlist
- **Endpoint**: `DELETE /wishlist/:productId`
- **Access**: Authenticated
- **Description**: Remove a product from wishlist

---

## 10. File Upload Endpoints

### 10.1 Upload Images
- **Endpoint**: `POST /upload/images`
- **Access**: Authenticated
- **Description**: Upload product or profile images

### 10.2 Delete Image
- **Endpoint**: `DELETE /upload/images/:filename`
- **Access**: Authenticated
- **Description**: Delete an uploaded image

---

## 11. Search Endpoints

### 11.1 Global Search
- **Endpoint**: `GET /search`
- **Access**: Public
- **Description**: Search across products, categories, and other content

**Query Parameters**:
- `q`: Search query
- `type`: Search type (products, categories, all)

---

## 12. Customer Support Endpoints

### 12.1 Create Support Chat
- **Endpoint**: `POST /customer-support/chats`
- **Access**: Authenticated
- **Description**: Create a new support chat

### 12.2 Get Support Chats
- **Endpoint**: `GET /customer-support/chats`
- **Access**: Authenticated
- **Description**: Get user's support chats

### 12.3 Send Message
- **Endpoint**: `POST /customer-support/chats/:chatId/messages`
- **Access**: Authenticated
- **Description**: Send a message in a support chat

---

## Error Handling

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Validation errors
- `500`: Internal Server Error - Server error

### Validation Errors
Validation errors return detailed field-specific errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be valid"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "statusCode": 422
}
```

## Rate Limiting
- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **File upload endpoints**: 10 requests per 15 minutes

## API Versioning
The API uses URL versioning with `/api/v1/` prefix. Future versions will use `/api/v2/`, etc.

## Swagger Documentation
Interactive API documentation is available at:
- **Development**: `http://localhost:3000/api/docs`
- **Production**: `https://your-domain.com/api/docs`

## Recent Fixes and Improvements

### Fixed Dashboard Endpoints
1. **Products Low Stock** (`GET /products/low-stock`): 
   - Fixed TypeScript compilation errors
   - Added proper error handling
   - Uses product's lowStockThreshold field or falls back to provided threshold

2. **Orders Statistics** (`GET /orders/stats`):
   - Enhanced to include revenue calculations
   - Added recent orders in response
   - Improved error handling

3. **Analytics Endpoints** (`GET /analytics/*`):
   - Replaced problematic raw SQL queries with Prisma standard queries
   - Added comprehensive error handling
   - Fixed type definition issues
   - Removed circular reference errors in groupBy operations

### Performance Optimizations
- Implemented proper database connection management
- Added query optimization for large datasets
- Enhanced error handling to prevent 500 errors

### Security Enhancements
- Role-based access control for all admin endpoints
- JWT token validation on protected routes
- Input validation and sanitization
- Rate limiting implementation

This documentation covers all implemented endpoints in the JJ-ESSENCIAL e-commerce backend API. The endpoints that were previously returning 500 errors have been fixed and are now fully functional.
