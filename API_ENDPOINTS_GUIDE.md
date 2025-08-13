# API Endpoints Guide

This document provides a comprehensive guide to all API endpoints, organized by user type and functionality. It includes detailed information on how to send data to the backend, including file upload requirements.

## Table of Contents

1. [User Endpoints](#user-endpoints)
   - [Authentication](#authentication)
   - [User Profile Management](#user-profile-management)
   - [Product Browsing](#product-browsing)
   - [Shopping Cart](#shopping-cart)
   - [Orders](#orders)
   - [Reviews](#reviews)
   - [Wishlist](#wishlist)
   - [Addresses](#addresses)

2. [Admin Endpoints](#admin-endpoints)
   - [Admin Authentication](#admin-authentication)
   - [Product Management](#product-management)
   - [Category Management](#category-management)
   - [User Management](#user-management-admin)
   - [Order Management](#order-management-admin)
   - [Review Management](#review-management-admin)
   - [Analytics & Reports](#analytics--reports)

---

## User Endpoints

### Authentication

#### Register User
**Endpoint:** `POST /api/v1/auth/register`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    },
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

#### Login User
**Endpoint:** `POST /api/v1/auth/login`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    },
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

#### Refresh Token
**Endpoint:** `POST /api/v1/auth/refresh`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

#### Logout
**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

---

### User Profile Management

#### Get User Profile
**Endpoint:** `GET /api/v1/users/profile`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "avatar": "https://supabase-storage-url/avatars/images/avatar-uuid.jpg",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "role": "USER",
    "createdAt": "2025-08-01T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

#### Update User Profile (with optional avatar)
**Endpoint:** `PUT /api/v1/users/profile`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `multipart/form-data`

**Form Data:**
```
fullName: "John Smith"                    // Required
phone: "+1234567890"                      // Optional
dateOfBirth: "1990-01-01"                 // Optional
avatar: profile-picture.jpg               // Optional file (JPEG, PNG, WebP, etc.)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Smith",
    "phone": "+1234567890",
    "avatar": "https://supabase-storage-url/avatars/images/avatar-uuid.jpg",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

### Product Browsing

#### Get All Products
**Endpoint:** `GET /api/v1/products`

**Query Parameters:**
```
page: 1                          // Optional, default: 1
limit: 12                        // Optional, default: 12
search: "laptop"                 // Optional, search by name or description
categoryId: "category-uuid"      // Optional, filter by category
minPrice: 100                    // Optional, minimum price filter
maxPrice: 1000                   // Optional, maximum price filter
sortBy: "price"                  // Optional: price, name, rating, createdAt
sortOrder: "asc"                 // Optional: asc, desc
featured: true                   // Optional, filter featured products
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "product-uuid",
      "name": "Gaming Laptop",
      "description": "High-performance gaming laptop",
      "price": "1299.99",
      "discountPrice": "1199.99",
      "sku": "GAM-LAP-001",
      "stock": 15,
      "images": [
        "https://supabase-storage-url/products/images/product-uuid-1.jpg",
        "https://supabase-storage-url/products/images/product-uuid-2.jpg"
      ],
      "category": {
        "id": "category-uuid",
        "name": "Electronics",
        "slug": "electronics"
      },
      "rating": 4.5,
      "reviewCount": 23,
      "isActive": true,
      "isFeatured": true,
      "createdAt": "2025-08-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 150,
    "pages": 13,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

#### Get Product by ID
**Endpoint:** `GET /api/v1/products/:id`

**Response (Success):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "product-uuid",
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop with advanced features",
    "price": "1299.99",
    "discountPrice": "1199.99",
    "sku": "GAM-LAP-001",
    "stock": 15,
    "images": [
      "https://supabase-storage-url/products/images/product-uuid-1.jpg",
      "https://supabase-storage-url/products/images/product-uuid-2.jpg"
    ],
    "category": {
      "id": "category-uuid",
      "name": "Electronics",
      "slug": "electronics"
    },
    "specifications": {
      "processor": "Intel i7",
      "ram": "16GB",
      "storage": "512GB SSD"
    },
    "rating": 4.5,
    "reviewCount": 23,
    "isActive": true,
    "isFeatured": true,
    "reviews": [
      {
        "id": "review-uuid",
        "rating": 5,
        "title": "Excellent laptop!",
        "comment": "Great performance for gaming",
        "user": {
          "fullName": "Jane Doe"
        },
        "createdAt": "2025-08-10T12:00:00.000Z"
      }
    ],
    "createdAt": "2025-08-01T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

### Shopping Cart

#### Get Cart Items
**Endpoint:** `GET /api/v1/cart`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "items": [
      {
        "id": "cart-item-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "product": {
          "id": "product-uuid",
          "name": "Gaming Laptop",
          "price": "1299.99",
          "discountPrice": "1199.99",
          "images": ["https://supabase-storage-url/products/images/product-uuid-1.jpg"],
          "stock": 15
        },
        "subtotal": "2399.98"
      }
    ],
    "summary": {
      "itemCount": 2,
      "subtotal": "2399.98",
      "tax": "239.99",
      "total": "2639.97"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

#### Add Item to Cart
**Endpoint:** `POST /api/v1/cart/items`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "productId": "product-uuid",
  "quantity": 2
}
```

#### Update Cart Item
**Endpoint:** `PUT /api/v1/cart/items/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "quantity": 3
}
```

#### Remove Cart Item
**Endpoint:** `DELETE /api/v1/cart/items/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

---

### Orders

#### Create Order
**Endpoint:** `POST /api/v1/orders`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "shippingAddressId": "address-uuid",
  "billingAddressId": "address-uuid",
  "paymentMethod": "PAYSTACK",
  "notes": "Please deliver between 9 AM - 5 PM"
}
```

#### Get User Orders
**Endpoint:** `GET /api/v1/orders`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                          // Optional, default: 1
limit: 10                        // Optional, default: 10
status: "PENDING"                // Optional: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
```

#### Get Order by ID
**Endpoint:** `GET /api/v1/orders/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

---

### Reviews

#### Create Review with Images
**Endpoint:** `POST /api/v1/reviews`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `multipart/form-data`

**Form Data:**
```
productId: "product-uuid"                 // Required
rating: 5                                 // Required (1-5)
title: "Great product!"                   // Required
comment: "I love this product"            // Required
images: review1.jpg, review2.png          // Optional, up to 5 images
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": "review-uuid",
    "productId": "product-uuid",
    "userId": "user-uuid",
    "rating": 5,
    "title": "Great product!",
    "comment": "I love this product",
    "images": [
      "https://supabase-storage-url/reviews/images/review-uuid-1.jpg",
      "https://supabase-storage-url/reviews/images/review-uuid-2.png"
    ],
    "isVerified": false,
    "isVisible": true,
    "createdAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

#### Get Product Reviews
**Endpoint:** `GET /api/v1/reviews/product/:productId`

**Query Parameters:**
```
page: 1                          // Optional, default: 1
limit: 10                        // Optional, default: 10
rating: 5                        // Optional, filter by rating
```

---

### Wishlist

#### Get Wishlist
**Endpoint:** `GET /api/v1/wishlist`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

#### Add to Wishlist
**Endpoint:** `POST /api/v1/wishlist/items`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "productId": "product-uuid"
}
```

#### Remove from Wishlist
**Endpoint:** `DELETE /api/v1/wishlist/items/:productId`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

---

### Addresses

#### Get User Addresses
**Endpoint:** `GET /api/v1/users/addresses`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

#### Create Address
**Endpoint:** `POST /api/v1/users/addresses`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "type": "SHIPPING",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp",
  "address1": "123 Main Street",
  "address2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "United States",
  "phone": "+1234567890",
  "isDefault": true
}
```

---

## Admin Endpoints

### Admin Authentication

#### Admin Login
**Endpoint:** `POST /api/v1/auth/admin/login`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "AdminPass123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": "admin-uuid",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "role": "ADMIN"
    },
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

### Product Management

#### Get All Products (Admin)
**Endpoint:** `GET /api/v1/products`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                          // Optional, default: 1
limit: 20                        // Optional, default: 20
search: "laptop"                 // Optional, search by name or SKU
categoryId: "category-uuid"      // Optional, filter by category
isActive: true                   // Optional, filter by active status
isFeatured: true                 // Optional, filter featured products
sortBy: "createdAt"              // Optional
sortOrder: "desc"                // Optional
```

#### Create Product with Images
**Endpoint:** `POST /api/v1/products/with-images`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `multipart/form-data`

**Form Data:**
```
name: "Gaming Laptop"                     // Required
description: "High-performance laptop"   // Required
price: 1299.99                           // Required
discountPrice: 1199.99                  // Optional
sku: "GAM-LAP-001"                       // Required
stock: 50                                // Required
categoryId: "category-uuid"              // Required
specifications: {"cpu": "Intel i7"}      // Optional JSON string
isFeatured: true                         // Optional boolean
isActive: true                           // Optional boolean
images: image1.jpg, image2.png           // Optional, up to 10 images
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "product-uuid",
    "name": "Gaming Laptop",
    "description": "High-performance laptop",
    "price": "1299.99",
    "discountPrice": "1199.99",
    "sku": "GAM-LAP-001",
    "stock": 50,
    "categoryId": "category-uuid",
    "images": [
      "https://supabase-storage-url/products/images/product-uuid-1.jpg",
      "https://supabase-storage-url/products/images/product-uuid-2.png"
    ],
    "specifications": {
      "cpu": "Intel i7"
    },
    "isFeatured": true,
    "isActive": true,
    "createdAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

#### Update Product with Images
**Endpoint:** `PUT /api/v1/products/:id/with-images`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `multipart/form-data`

**Form Data:**
```
name: "Updated Gaming Laptop"            // Optional
description: "Updated description"       // Optional
price: 1399.99                          // Optional
discountPrice: 1299.99                  // Optional
stock: 45                               // Optional
categoryId: "category-uuid"             // Optional
specifications: {"cpu": "Intel i9"}     // Optional JSON string
isFeatured: false                       // Optional boolean
isActive: true                          // Optional boolean
images: new-image1.jpg, new-image2.png  // Optional, new images to add
```

#### Delete Product
**Endpoint:** `DELETE /api/v1/products/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

---

### Category Management

#### Get All Categories (Admin)
**Endpoint:** `GET /api/v1/categories`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
includeInactive: true            // Optional, include inactive categories
```

#### Create Category with Image
**Endpoint:** `POST /api/v1/categories/with-image`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `multipart/form-data`

**Form Data:**
```
name: "Electronics"                      // Required
description: "Electronic devices"       // Optional
parentId: "parent-category-uuid"         // Optional
sortOrder: 1                            // Optional
image: category-image.jpg               // Optional image file
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "category-uuid",
    "name": "Electronics",
    "description": "Electronic devices",
    "slug": "electronics",
    "image": "https://supabase-storage-url/categories/images/category-uuid.jpg",
    "parentId": null,
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2025-08-12T12:00:00.000Z",
    "productCount": 0
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

#### Update Category with Image
**Endpoint:** `PUT /api/v1/categories/:id/with-image`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `multipart/form-data`

**Form Data:**
```
name: "Updated Electronics"              // Optional
description: "Updated description"       // Optional
parentId: "parent-category-uuid"         // Optional
sortOrder: 2                            // Optional
isActive: true                          // Optional
image: updated-category-image.jpg       // Optional image file
```

#### Delete Category
**Endpoint:** `DELETE /api/v1/categories/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

---

### User Management (Admin)

#### Get All Users
**Endpoint:** `GET /api/v1/admin/users`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                          // Optional, default: 1
limit: 20                        // Optional, default: 20
search: "john"                   // Optional, search by name or email
role: "USER"                     // Optional, filter by role
isActive: true                   // Optional, filter by active status
sortBy: "createdAt"              // Optional
sortOrder: "desc"                // Optional
```

#### Get User Details
**Endpoint:** `GET /api/v1/admin/users/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

#### Update User Status
**Endpoint:** `PATCH /api/v1/admin/users/:id/status`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Account suspended for policy violation"
}
```

---

### Order Management (Admin)

#### Get All Orders
**Endpoint:** `GET /api/v1/orders`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                          // Optional, default: 1
limit: 20                        // Optional, default: 20
status: "PENDING"                // Optional filter by status
userId: "user-uuid"              // Optional filter by user
startDate: "2025-08-01"          // Optional filter by date range
endDate: "2025-08-31"            // Optional filter by date range
sortBy: "createdAt"              // Optional
sortOrder: "desc"                // Optional
```

#### Update Order Status
**Endpoint:** `PATCH /api/v1/orders/:id/status`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "TR123456789",
  "notes": "Package shipped via express delivery"
}
```

---

### Review Management (Admin)

#### Get All Reviews
**Endpoint:** `GET /api/v1/reviews`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                          // Optional, default: 1
limit: 20                        // Optional, default: 20
search: "great"                  // Optional, search by content
rating: 5                        // Optional, filter by rating
productId: "product-uuid"        // Optional, filter by product
isVisible: true                  // Optional, filter by visibility
isVerified: true                 // Optional, filter by verification
```

#### Update Review Visibility
**Endpoint:** `PATCH /api/v1/reviews/:id/visibility`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "isVisible": false,
  "reason": "Contains inappropriate content"
}
```

#### Delete Review
**Endpoint:** `DELETE /api/v1/reviews/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

---

### Analytics & Reports

#### Get Dashboard Analytics
**Endpoint:** `GET /api/v1/admin/analytics/dashboard`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
period: "30days"                 // Optional: 7days, 30days, 90days, 1year
```

#### Generate Sales Report
**Endpoint:** `GET /api/v1/admin/reports/sales`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
startDate: "2025-08-01"          // Required
endDate: "2025-08-31"            // Required
format: "json"                   // Optional: json, csv, pdf
```

---

## File Upload Guidelines

### Supported File Formats
All image upload endpoints support the following formats:
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)
- **GIF** (.gif)
- **SVG** (.svg)
- **BMP** (.bmp)
- **TIFF** (.tiff, .tif)
- **AVIF** (.avif)

### File Size Limits
- **Product Images:** 5MB per file, up to 10 files
- **Category Images:** 3MB per file, 1 file
- **User Avatars:** 2MB per file, 1 file
- **Review Images:** 3MB per file, up to 5 files

### Content-Type Requirements
All file upload endpoints require:
```
Content-Type: multipart/form-data
```

### Error Responses
All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error description",
  "statusCode": 400,
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Authentication Requirements
- **User Endpoints:** Require valid JWT token in Authorization header
- **Admin Endpoints:** Require valid JWT token with ADMIN role
- **Public Endpoints:** No authentication required (product browsing, categories)

This guide provides all the necessary information for frontend developers to integrate with the API effectively.
