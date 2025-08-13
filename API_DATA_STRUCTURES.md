# JJ-ESSENCIAL API Data Structures

This document outlines the data structures expected by each API endpoint in the JJ-ESSENCIAL backend. It includes request payloads, response formats, and field requirements for all modules.

## Table of Contents

- [Authentication](#authentication)
- [Users & Profiles](#users--profiles)
- [Products](#products)
- [Orders](#orders)
- [Payments](#payments)
- [Categories](#categories)
- [Reviews](#reviews)
- [Wishlist](#wishlist)
- [Support Chat](#support-chat)
- [File Uploads](#file-uploads)

---

## Authentication

### Sign Up

**Endpoint:** `POST /api/v1/auth/signup`

**Request:**
```json
{
  "email": "user@example.com",     // Required, valid email format
  "password": "password123",       // Required, minimum 6 characters
  "fullName": "John Doe"           // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "access_token": "jwt-token-here",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400,
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Sign In

**Endpoint:** `POST /api/v1/auth/signin`

**Request:**
```json
{
  "email": "user@example.com",     // Required, valid email format
  "password": "password123"        // Required
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": {
    "access_token": "jwt-token-here",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Admin Sign In

**Endpoint:** `POST /api/v1/auth/admin/signin`

**Request:**
```json
{
  "email": "admin@jjessential.com",  // Required
  "password": "admin123"             // Required
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin signed in successfully",
  "data": {
    "access_token": "jwt-token-here",
    "user": {
      "id": "admin-uuid",
      "email": "admin@jjessential.com",
      "fullName": "Admin User",
      "role": "ADMIN"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Reset Password Request

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request:**
```json
{
  "email": "user@example.com"  // Required, valid email format
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": {
    "message": "If the email exists, a reset link has been sent"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get User Profile

**Endpoint:** `GET /api/v1/auth/profile`

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
    "role": "USER",
    "phone": "1234567890",
    "avatar": "https://example.com/avatar.jpg",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "createdAt": "2025-08-01T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update User Profile

**Endpoint:** `PUT /api/v1/auth/profile`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "fullName": "Updated Name"  // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "Updated Name",
    "role": "USER",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Users & Profiles

### Get User Addresses

**Endpoint:** `GET /api/v1/user/addresses`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "id": "address-uuid",
      "userId": "user-uuid",
      "type": "SHIPPING",
      "firstName": "John",
      "lastName": "Doe",
      "company": "Company Name",
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA",
      "phone": "1234567890",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2025-08-01T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z"
    }
  ],
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Add User Address

**Endpoint:** `POST /api/v1/user/addresses`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "type": "SHIPPING",           // Required: SHIPPING, BILLING, or BOTH
  "firstName": "John",          // Required
  "lastName": "Doe",            // Required
  "company": "Company Name",    // Optional
  "address1": "123 Main St",    // Required
  "address2": "Apt 4B",         // Optional
  "city": "New York",           // Required
  "state": "NY",                // Required
  "postalCode": "10001",        // Required
  "country": "USA",             // Required
  "phone": "1234567890",        // Optional
  "isDefault": true             // Optional, defaults to false
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "id": "address-uuid",
    "userId": "user-uuid",
    "type": "SHIPPING",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Company Name",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "phone": "1234567890",
    "isDefault": true,
    "isActive": true,
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update User Address

**Endpoint:** `PUT /api/v1/user/addresses/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:** (All fields optional)
```json
{
  "type": "BOTH",
  "firstName": "Updated First",
  "lastName": "Updated Last",
  "company": "Updated Company",
  "address1": "456 New St",
  "address2": "Suite 100",
  "city": "Los Angeles",
  "state": "CA",
  "postalCode": "90001",
  "country": "USA",
  "phone": "9876543210",
  "isDefault": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "id": "address-uuid",
    "userId": "user-uuid",
    "type": "BOTH",
    "firstName": "Updated First",
    "lastName": "Updated Last",
    // ... other updated fields
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Products

### Get Products (with pagination)

**Endpoint:** `GET /api/v1/products`

**Query Parameters:**
```
page: 1           (optional, default: 1)
limit: 10         (optional, default: 10)
search: "phone"   (optional)
sortBy: "price"   (optional)
sortOrder: "asc"  (optional, default: "desc")
category: "electronics" (optional)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "product-uuid",
      "name": "Smartphone X",
      "description": "Latest smartphone with amazing features",
      "price": "999.99",
      "stock": 50,
      "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      "category": "Electronics",
      "categoryId": "category-uuid",
      "sku": "PHN-X-001",
      "brand": "BrandName",
      "weight": "0.25",
      "dimensions": "15x7x1 cm",
      "tags": ["smartphone", "electronic", "mobile"],
      "featured": true,
      "avgRating": "4.50",
      "reviewCount": 10,
      "isActive": true,
      "createdAt": "2025-08-01T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z"
    },
    // More products...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get Product Details

**Endpoint:** `GET /api/v1/products/:id`

**Response (Success):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "product-uuid",
    "name": "Smartphone X",
    "description": "Latest smartphone with amazing features",
    "price": "999.99",
    "stock": 50,
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "category": "Electronics",
    "categoryId": "category-uuid",
    "sku": "PHN-X-001",
    "brand": "BrandName",
    "weight": "0.25",
    "dimensions": "15x7x1 cm",
    "tags": ["smartphone", "electronic", "mobile"],
    "featured": true,
    "avgRating": "4.50",
    "reviewCount": 10,
    "isActive": true,
    "createdAt": "2025-08-01T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "reviews": [
      {
        "id": "review-uuid",
        "userId": "user-uuid",
        "rating": 5,
        "title": "Amazing product",
        "comment": "This is the best smartphone I've ever used",
        "createdAt": "2025-08-10T12:00:00.000Z"
      }
      // More reviews...
    ]
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Create Product (Admin Only)

**Endpoint:** `POST /api/v1/products`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "name": "New Product",                 // Required
  "description": "Product description",  // Optional
  "price": 99.99,                        // Required
  "stock": 100,                          // Required
  "images": [                            // Optional
    "https://example.com/image1.jpg", 
    "https://example.com/image2.jpg"
  ],
  "categoryId": "category-uuid",         // Optional
  "sku": "PRD-001",                      // Optional but should be unique
  "brand": "BrandName",                  // Optional
  "weight": 0.5,                         // Optional
  "dimensions": "10x5x2 cm",             // Optional
  "tags": ["tag1", "tag2"],              // Optional
  "featured": false,                     // Optional, defaults to false
  "lowStockThreshold": 10                // Optional, defaults to 10
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "new-product-uuid",
    "name": "New Product",
    // ... all product fields
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update Product (Admin Only)

**Endpoint:** `PUT /api/v1/products/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:** (All fields optional)
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 129.99,
  "stock": 75,
  "images": ["https://example.com/updated-image.jpg"],
  "categoryId": "new-category-uuid",
  "brand": "Updated Brand",
  "featured": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "product-uuid",
    "name": "Updated Product Name",
    // ... all updated product fields
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Orders

### Create Order

**Endpoint:** `POST /api/v1/orders`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "addressId": "address-uuid",          // Optional, user's address ID
  "items": [                            // Required, array of items
    {
      "productId": "product-uuid-1",    // Required
      "quantity": 2                     // Required
    },
    {
      "productId": "product-uuid-2",
      "quantity": 1
    }
  ],
  "deliveryAddress": {                  // Optional, alternative to addressId
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "orderNotes": "Please deliver to front door" // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "addressId": "address-uuid",
    "totalAmount": "299.97",
    "status": "PENDING",
    "paymentRef": null,
    "receiptUrl": null,
    "deliveryPhone": "1234567890",
    "deliveryAddress": "123 Main St",
    "deliveryCity": "New York",
    "deliveryState": "NY",
    "deliveryPostal": "10001",
    "deliveryCountry": "USA",
    "orderNotes": "Please deliver to front door",
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "orderItems": [
      {
        "id": "order-item-uuid-1",
        "productId": "product-uuid-1",
        "quantity": 2,
        "price": "99.99",
        "product": {
          "name": "Product 1",
          "images": ["https://example.com/image1.jpg"]
        }
      },
      {
        "id": "order-item-uuid-2",
        "productId": "product-uuid-2",
        "quantity": 1,
        "price": "99.99",
        "product": {
          "name": "Product 2",
          "images": ["https://example.com/image2.jpg"]
        }
      }
    ],
    "paymentInfo": {
      "id": "payment-uuid",
      "reference": "PAY-REF-12345",
      "amount": "299.97",
      "gateway": "PAYSTACK",
      "status": "PENDING",
      "authorizationUrl": "https://checkout.paystack.com/12345" // For redirect payment
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get User Orders

**Endpoint:** `GET /api/v1/orders`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1           (optional, default: 1)
limit: 10         (optional, default: 10)
status: "PAID"    (optional)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "order-uuid",
      "totalAmount": "299.97",
      "status": "PAID",
      "createdAt": "2025-08-12T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "orderItems": [
        {
          "quantity": 2,
          "price": "99.99",
          "product": {
            "name": "Product 1",
            "images": ["https://example.com/image1.jpg"]
          }
        },
        {
          "quantity": 1,
          "price": "99.99",
          "product": {
            "name": "Product 2",
            "images": ["https://example.com/image2.jpg"]
          }
        }
      ]
    },
    // More orders...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get Order Details

**Endpoint:** `GET /api/v1/orders/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "addressId": "address-uuid",
    "totalAmount": "299.97",
    "status": "PAID",
    "paymentRef": "PAY-REF-12345",
    "receiptUrl": "https://example.com/receipt.pdf",
    "deliveryPhone": "1234567890",
    "deliveryAddress": "123 Main St",
    "deliveryCity": "New York",
    "deliveryState": "NY",
    "deliveryPostal": "10001",
    "deliveryCountry": "USA",
    "orderNotes": "Please deliver to front door",
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "orderItems": [
      // ... order items as above
    ],
    "payments": [
      {
        "id": "payment-uuid",
        "reference": "PAY-REF-12345",
        "amount": "299.97",
        "gateway": "PAYSTACK",
        "status": "PAID",
        "createdAt": "2025-08-12T12:00:00.000Z"
      }
    ],
    "tracking": [
      {
        "id": "tracking-uuid",
        "status": "PAID",
        "location": "Payment Processor",
        "notes": "Payment completed successfully",
        "timestamp": "2025-08-12T12:00:00.000Z"
      }
      // More tracking entries...
    ]
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Payments

### Initialize Payment

**Endpoint:** `POST /api/v1/payments/initialize`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "orderId": "order-uuid",           // Required
  "gateway": "PAYSTACK",             // Required: PAYSTACK, FLUTTERWAVE, BANK_TRANSFER
  "amount": 299.97,                  // Required
  "metadata": {                      // Optional
    "customerId": "user-uuid",
    "customerEmail": "user@example.com"
  },
  "callbackUrl": "https://yourfrontend.com/payment-callback" // Optional
}
```

**Response (Success - for redirect payment):**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "id": "payment-uuid",
    "reference": "PAY-REF-12345",
    "amount": "299.97",
    "gateway": "PAYSTACK",
    "status": "PENDING",
    "gatewayData": {
      "authorization_url": "https://checkout.paystack.com/12345",
      "access_code": "access_code_here",
      "reference": "PAY-REF-12345"
    },
    "authorizationUrl": "https://checkout.paystack.com/12345",
    "createdAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Verify Payment

**Endpoint:** `GET /api/v1/payments/verify/:reference`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "id": "payment-uuid",
    "reference": "PAY-REF-12345",
    "amount": "299.97",
    "gateway": "PAYSTACK",
    "status": "PAID",
    "orderId": "order-uuid",
    "gatewayData": {
      // Gateway-specific response data
    },
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Upload Payment Receipt (For Bank Transfers)

**Endpoint:** `POST /api/v1/payments/receipt`

**Headers:**
```
Authorization: Bearer jwt-token-here
Content-Type: multipart/form-data
```

**Request:**
```
transactionId: "payment-uuid"  // Required
receipt: [File]                // Required, file upload
notes: "Bank transfer receipt" // Optional
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Receipt uploaded successfully",
  "data": {
    "id": "receipt-uuid",
    "transactionId": "payment-uuid",
    "receiptUrl": "https://storage.example.com/receipts/receipt-uuid.jpg",
    "originalName": "receipt.jpg",
    "fileSize": 102400,
    "mimeType": "image/jpeg",
    "uploadedBy": "user-uuid",
    "verificationStatus": "PENDING",
    "createdAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Categories

### Get Categories

**Endpoint:** `GET /api/v1/categories`

**Response (Success):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "category-uuid-1",
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "slug": "electronics",
      "image": "https://example.com/electronics.jpg",
      "parentId": null,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2025-08-01T12:00:00.000Z",
      "updatedAt": "2025-08-01T12:00:00.000Z",
      "children": [
        {
          "id": "category-uuid-2",
          "name": "Smartphones",
          "description": "Mobile phones and accessories",
          "slug": "smartphones",
          "image": "https://example.com/smartphones.jpg",
          "parentId": "category-uuid-1",
          "isActive": true,
          "sortOrder": 1
        }
        // More subcategories...
      ]
    }
    // More categories...
  ],
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Create Category (Admin Only)

**Endpoint:** `POST /api/v1/categories`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "name": "New Category",                  // Required
  "description": "Category description",   // Optional
  "slug": "new-category",                  // Required
  "image": "https://example.com/image.jpg", // Optional
  "parentId": "parent-category-uuid",      // Optional
  "sortOrder": 2                           // Optional, defaults to 0
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "new-category-uuid",
    "name": "New Category",
    "description": "Category description",
    "slug": "new-category",
    "image": "https://example.com/image.jpg",
    "parentId": "parent-category-uuid",
    "isActive": true,
    "sortOrder": 2,
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Reviews

### Create Product Review

**Endpoint:** `POST /api/v1/products/:productId/reviews`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "orderId": "order-uuid",           // Optional but recommended for verified purchase
  "rating": 5,                       // Required, 1-5
  "title": "Great product!",         // Optional
  "comment": "I love this product",  // Optional
  "images": [                        // Optional
    "https://example.com/review-image1.jpg"
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "review-uuid",
    "userId": "user-uuid",
    "productId": "product-uuid",
    "orderId": "order-uuid",
    "rating": 5,
    "title": "Great product!",
    "comment": "I love this product",
    "images": ["https://example.com/review-image1.jpg"],
    "isVerified": true,
    "isVisible": true,
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get Product Reviews

**Endpoint:** `GET /api/v1/products/:productId/reviews`

**Query Parameters:**
```
page: 1           (optional, default: 1)
limit: 10         (optional, default: 10)
sortBy: "createdAt" (optional)
sortOrder: "desc"   (optional, default: "desc")
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": [
    {
      "id": "review-uuid",
      "userId": "user-uuid",
      "rating": 5,
      "title": "Great product!",
      "comment": "I love this product",
      "images": ["https://example.com/review-image1.jpg"],
      "isVerified": true,
      "createdAt": "2025-08-12T12:00:00.000Z",
      "user": {
        "fullName": "John Doe"
      }
    }
    // More reviews...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Wishlist

### Add to Wishlist

**Endpoint:** `POST /api/v1/wishlist`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "productId": "product-uuid"  // Required
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product added to wishlist",
  "data": {
    "id": "wishlist-item-uuid",
    "userId": "user-uuid",
    "productId": "product-uuid",
    "createdAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get Wishlist

**Endpoint:** `GET /api/v1/wishlist`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Wishlist retrieved successfully",
  "data": [
    {
      "id": "wishlist-item-uuid",
      "productId": "product-uuid",
      "createdAt": "2025-08-12T12:00:00.000Z",
      "product": {
        "id": "product-uuid",
        "name": "Product Name",
        "price": "99.99",
        "images": ["https://example.com/image.jpg"],
        "stock": 50,
        "avgRating": "4.50"
      }
    }
    // More wishlist items...
  ],
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Remove from Wishlist

**Endpoint:** `DELETE /api/v1/wishlist/:productId`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product removed from wishlist",
  "data": null,
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Support Chat

### Create Support Chat

**Endpoint:** `POST /api/v1/support`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "subject": "Order Issue",              // Required
  "message": "I have a problem with my order", // Required
  "priority": "MEDIUM"                   // Optional: LOW, MEDIUM, HIGH, URGENT
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Support chat created successfully",
  "data": {
    "id": "chat-uuid",
    "userId": "user-uuid",
    "assignedTo": null,
    "subject": "Order Issue",
    "status": "OPEN",
    "priority": "MEDIUM",
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "messages": [
      {
        "id": "message-uuid",
        "chatId": "chat-uuid",
        "senderId": "user-uuid",
        "message": "I have a problem with my order",
        "isAdmin": false,
        "createdAt": "2025-08-12T12:00:00.000Z"
      }
    ]
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Send Chat Message

**Endpoint:** `POST /api/v1/support/:chatId/messages`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "message": "Is there any update on my issue?"  // Required
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "message-uuid",
    "chatId": "chat-uuid",
    "senderId": "user-uuid",
    "message": "Is there any update on my issue?",
    "isAdmin": false,
    "createdAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get User Support Chats

**Endpoint:** `GET /api/v1/support`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Support chats retrieved successfully",
  "data": [
    {
      "id": "chat-uuid",
      "subject": "Order Issue",
      "status": "OPEN",
      "priority": "MEDIUM",
      "createdAt": "2025-08-12T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "lastMessage": {
        "message": "I have a problem with my order",
        "createdAt": "2025-08-12T12:00:00.000Z",
        "isAdmin": false
      }
    }
    // More support chats...
  ],
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get Chat Messages

**Endpoint:** `GET /api/v1/support/:chatId/messages`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Chat messages retrieved successfully",
  "data": {
    "chat": {
      "id": "chat-uuid",
      "subject": "Order Issue",
      "status": "OPEN",
      "priority": "MEDIUM",
      "createdAt": "2025-08-12T12:00:00.000Z"
    },
    "messages": [
      {
        "id": "message-uuid-1",
        "senderId": "user-uuid",
        "message": "I have a problem with my order",
        "isAdmin": false,
        "createdAt": "2025-08-12T12:00:00.000Z",
        "sender": {
          "fullName": "John Doe"
        }
      },
      {
        "id": "message-uuid-2",
        "senderId": "admin-uuid",
        "message": "Hi John, how can I help you with your order?",
        "isAdmin": true,
        "createdAt": "2025-08-12T12:05:00.000Z",
        "sender": {
          "fullName": "Support Agent"
        }
      }
      // More messages...
    ]
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## File Uploads

### Upload File

**Endpoint:** `POST /api/v1/upload`

**Headers:**
```
Authorization: Bearer jwt-token-here
Content-Type: multipart/form-data
```

**Request:**
```
file: [File]                 // Required
bucket: "profile-images"     // Optional, defaults to "general"
```

**Response (Success):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "file-uuid",
    "originalName": "profile.jpg",
    "fileSize": 102400,
    "mimeType": "image/jpeg",
    "bucket": "profile-images",
    "path": "profile-images/user-uuid/file-uuid.jpg",
    "url": "https://storage.example.com/profile-images/user-uuid/file-uuid.jpg",
    "uploadedBy": "user-uuid",
    "createdAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Error Response Format

All error responses follow this consistent format:

```json
{
  "success": false,
  "message": "Error message explaining what went wrong",
  "error": "Error type (e.g., Bad Request, Unauthorized)",
  "statusCode": 400, // HTTP status code
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

Common error status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (not logged in)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (e.g., email already exists)
- 500: Internal Server Error

---

## Pagination

Many endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search query (optional)
- `sortBy`: Field to sort by (optional)
- `sortOrder`: Sort direction, "asc" or "desc" (default: "desc")

Paginated responses include a pagination object:

```json
"pagination": {
  "page": 1,        // Current page
  "limit": 10,      // Items per page
  "total": 50,      // Total number of items
  "pages": 5,       // Total number of pages
  "hasNext": true,  // Whether there's a next page
  "hasPrev": false  // Whether there's a previous page
}
```
