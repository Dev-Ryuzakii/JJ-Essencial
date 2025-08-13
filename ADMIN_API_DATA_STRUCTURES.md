# JJ-ESSENCIAL Admin API Data Structures

This document outlines the data structures expected by the admin-specific API endpoints in the JJ-ESSENCIAL backend. It includes request payloads, response formats, and field requirements specifically for admin operations.

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Product Management](#product-management)
- [Category Management](#category-management)
- [Order Management](#order-management)
- [Payment Management](#payment-management)
- [Review Management](#review-management)
- [Support Management](#support-management)
- [System Settings](#system-settings)
- [Analytics & Reports](#analytics--reports)

---

## Authentication

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

### Sync Users (Admin Only)

**Endpoint:** `GET /api/v1/auth/admin/sync-users`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
fix: true  // Optional, set to true to fix inconsistencies between Supabase Auth and local database
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User synchronization completed",
  "data": {
    "totalSupabaseUsers": 15,
    "totalDbUsers": 17,
    "onlyInSupabase": ["user1@example.com", "user2@example.com"],
    "onlyInDb": ["user3@example.com", "user4@example.com"]
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## User Management

### Get All Users (Admin Only)

**Endpoint:** `GET /api/v1/admin/users`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1               // Optional, default: 1
limit: 10             // Optional, default: 10
search: "john"        // Optional, search by name or email
sortBy: "createdAt"   // Optional
sortOrder: "desc"     // Optional, default: "desc"
role: "USER"          // Optional, filter by role
isActive: true        // Optional, filter by active status
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER",
      "phone": "1234567890",
      "avatar": "https://example.com/avatar.jpg",
      "isActive": true,
      "createdAt": "2025-08-01T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "orderCount": 5,
      "totalSpent": "1299.95"
    },
    // More users...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update User Profile with Avatar (Admin Only) ⭐ **NEW**

**Endpoint:** `PUT /api/v1/users/profile/avatar`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**File Upload Request:**
```
Content-Type: multipart/form-data

Form Data:
- fullName: "Updated Name"               // Required
- phone: "+1234567890"                   // Optional
- dateOfBirth: "1990-01-01"             // Optional
- avatar: profile.jpg                    // Optional, image file (JPEG, PNG, WebP, etc.)
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
    "phone": "+1234567890",
    "avatar": "https://supabase-storage-url/avatars/images/avatar-uuid.jpg",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get User Details (Admin Only)

**Endpoint:** `GET /api/v1/admin/users/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER",
    "phone": "1234567890",
    "avatar": "https://example.com/avatar.jpg",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2025-08-01T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "addresses": [
      {
        "id": "address-uuid",
        "type": "SHIPPING",
        "firstName": "John",
        "lastName": "Doe",
        "address1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "USA"
      }
      // More addresses...
    ],
    "orders": [
      {
        "id": "order-uuid",
        "totalAmount": "299.97",
        "status": "PAID",
        "createdAt": "2025-08-10T12:00:00.000Z"
      }
      // More orders...
    ],
    "stats": {
      "orderCount": 5,
      "totalSpent": "1299.95",
      "averageOrderValue": "259.99",
      "lastOrderDate": "2025-08-10T12:00:00.000Z"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update User (Admin Only)

**Endpoint:** `PUT /api/v1/admin/users/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:** (All fields optional)
```json
{
  "fullName": "Updated Name",
  "role": "ADMIN",
  "phone": "9876543210",
  "isActive": false
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "Updated Name",
    "role": "ADMIN",
    "phone": "9876543210",
    "isActive": false,
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Delete User (Admin Only)

**Endpoint:** `DELETE /api/v1/admin/users/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
hardDelete: false  // Optional, default: false (soft delete)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null,
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Product Management

### Create Product (Admin Only)

**Endpoint:** `POST /api/v1/products` ⭐ **Updated**

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**JSON Request:**
```json
{
  "name": "New Product",                 // Required
  "description": "Product description",  // Optional
  "price": 99.99,                        // Required
  "stock": 100,                          // Required
  "category": "Electronics",             // Optional
  "images": [                            // Optional
    "https://example.com/image1.jpg", 
    "https://example.com/image2.jpg"
  ],
  "sku": "PRD-001",                      // Optional but should be unique
  "brand": "BrandName",                  // Optional
  "weight": 0.5,                         // Optional
  "dimensions": "10x5x2 cm",             // Optional
  "tags": ["tag1", "tag2"],              // Optional
  "featured": false,                     // Optional, defaults to false
  "lowStockThreshold": 10                // Optional, defaults to 10
}
```

**File Upload Request:** ⭐ **NEW**
```
Content-Type: multipart/form-data

Form Data:
- name: "New Product"                    // Required
- description: "Product description"     // Optional
- price: 99.99                          // Required
- stock: 100                            // Required
- category: "Electronics"               // Optional
- images: [file1.jpg, file2.png, file3.webp] // Max 10 files, supports JPEG, PNG, WebP, GIF, SVG, BMP, TIFF, AVIF
- sku: "PRD-001"                        // Optional
- brand: "BrandName"                    // Optional
- lowStockThreshold: 10                 // Optional
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "new-product-uuid",
    "name": "New Product",
    "description": "Product description",
    "price": "99.99",
    "stock": 100,
    "images": [
      "https://example.com/image1.jpg", 
      "https://example.com/image2.jpg"
    ],
    "categoryId": "category-uuid",
    "sku": "PRD-001",
    "brand": "BrandName",
    "weight": "0.50",
    "dimensions": "10x5x2 cm",
    "tags": ["tag1", "tag2"],
    "featured": false,
    "lowStockThreshold": 10,
    "avgRating": "0.00",
    "reviewCount": 0,
    "isActive": true,
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update Product (Admin Only)

**Endpoint:** `PATCH /api/v1/products/:id` ⭐ **Updated**

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**JSON Request:** (All fields optional)
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 129.99,
  "stock": 75,
  "images": ["https://example.com/updated-image.jpg"],
  "category": "Updated Electronics",
  "brand": "Updated Brand",
  "featured": true,
  "isActive": true
}
```

**File Upload Request:** ⭐ **NEW**
```
Content-Type: multipart/form-data

Form Data:
- name: "Updated Product Name"           // Optional
- description: "Updated description"     // Optional
- price: 129.99                         // Optional
- stock: 75                             // Optional
- category: "Updated Electronics"       // Optional
- images: [newfile1.jpg, newfile2.png]  // Optional, additional images (max 10 files)
- brand: "Updated Brand"                // Optional
- featured: true                        // Optional
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

### Delete Product (Admin Only)

**Endpoint:** `DELETE /api/v1/products/:id` ⭐ **Updated**

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
hardDelete: false  // Optional, default: false (soft delete)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null,
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Bulk Update Products (Admin Only)

**Endpoint:** `PATCH /api/v1/products/bulk` ⭐ **Updated**

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "productIds": ["product-uuid-1", "product-uuid-2", "product-uuid-3"],  // Required
  "updates": {                                                          // Required
    "categoryId": "category-uuid",
    "featured": true,
    "isActive": true
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Products updated successfully",
  "data": {
    "updatedCount": 3
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update Product Stock (Admin Only)

**Endpoint:** `PATCH /api/v1/products/:id/stock` ⭐ **Updated**

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "quantity": 25,                           // Required
  "type": "IN",                            // Required: IN, OUT, ADJUSTMENT, DAMAGED, EXPIRED
  "reason": "Restock from supplier",       // Optional
  "reference": "PO-12345"                  // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "id": "product-uuid",
    "name": "Product Name",
    "previousStock": 50,
    "newStock": 75,
    "stockMovement": {
      "id": "movement-uuid",
      "type": "IN",
      "quantity": 25,
      "reason": "Restock from supplier",
      "reference": "PO-12345",
      "performedBy": "admin-uuid",
      "createdAt": "2025-08-12T12:00:00.000Z"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Category Management

### Get All Categories

**Endpoint:** `GET /api/v1/categories` ⭐ **Updated**

**Headers:** (Authentication optional)
```
Authorization: Bearer jwt-token-here  // Optional for read operations
```

**Query Parameters:**
```
page: 1                  // Optional, default: 1
limit: 10                // Optional, default: 10
includeInactive: false   // Optional, default: false
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "category-uuid",
      "name": "Electronics",
      "description": "Electronic devices and accessories",
      "slug": "electronics",
      "image": "https://example.com/category-image.jpg",
      "parentId": null,
      "isActive": true,
      "sortOrder": 1,
      "productCount": 50,
      "createdAt": "2025-08-01T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "children": [
        {
          "id": "subcategory-uuid",
          "name": "Smartphones",
          "slug": "smartphones",
          "parentId": "category-uuid",
          "productCount": 25
        }
      ]
    }
  ],
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Create Category (Admin Only)

**Endpoint:** `POST /api/v1/categories` ⭐ **Updated**

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

### Update Category (Admin Only)

**Endpoint:** `PUT /api/v1/categories/:id` ⭐ **Updated**

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:** (All fields optional)
```json
{
  "name": "Updated Category",
  "description": "Updated description",
  "slug": "updated-category",
  "image": "https://example.com/updated-image.jpg",
  "parentId": "new-parent-uuid",
  "sortOrder": 3,
  "isActive": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "category-uuid",
    "name": "Updated Category",
    // ... all updated category fields
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Delete Category (Admin Only)

**Endpoint:** `DELETE /api/v1/categories/:id` ⭐ **Updated**

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
moveProductsTo: "other-category-uuid"  // Optional, if provided, products will be moved to this category
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {
    "deletedId": "category-uuid",
    "productsMovedCount": 5
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Reorder Categories (Admin Only)

**Endpoint:** `PATCH /api/v1/categories/reorder` ⭐ **Updated**

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "categoryOrders": [
    {
      "id": "category-uuid-1",
      "sortOrder": 1
    },
    {
      "id": "category-uuid-2",
      "sortOrder": 2
    },
    {
      "id": "category-uuid-3",
      "sortOrder": 3
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Categories reordered successfully",
  "data": {
    "updatedCount": 3
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Order Management

### Get All Orders (Admin Only)

**Endpoint:** `GET /api/v1/orders` ⭐

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                     // Optional, default: 1
limit: 10                   // Optional, default: 10
search: "john"              // Optional, search by customer name, email, or order ID
sortBy: "createdAt"         // Optional
sortOrder: "desc"           // Optional, default: "desc"
status: "PAID"              // Optional, filter by status
startDate: "2025-08-01"     // Optional, filter by date range
endDate: "2025-08-12"       // Optional, filter by date range
minAmount: 100              // Optional, filter by minimum amount
maxAmount: 500              // Optional, filter by maximum amount
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "order-uuid",
      "userId": "user-uuid",
      "totalAmount": "299.97",
      "status": "PAID",
      "createdAt": "2025-08-12T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "user": {
        "fullName": "John Doe",
        "email": "user@example.com"
      },
      "itemCount": 3,
      "paymentMethod": "PAYSTACK"
    },
    // More orders...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "summary": {
    "totalOrders": 150,
    "pendingOrders": 25,
    "paidOrders": 115,
    "cancelledOrders": 10,
    "totalRevenue": "45000.00"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get Order Details (Admin Only)

**Endpoint:** `GET /api/v1/orders/:id` ⭐

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
    "user": {
      "id": "user-uuid",
      "fullName": "John Doe",
      "email": "user@example.com",
      "phone": "1234567890"
    },
    "orderItems": [
      {
        "id": "order-item-uuid-1",
        "productId": "product-uuid-1",
        "quantity": 2,
        "price": "99.99",
        "product": {
          "id": "product-uuid-1",
          "name": "Product 1",
          "sku": "PRD-001",
          "images": ["https://example.com/image1.jpg"]
        }
      },
      {
        "id": "order-item-uuid-2",
        "productId": "product-uuid-2",
        "quantity": 1,
        "price": "99.99",
        "product": {
          "id": "product-uuid-2",
          "name": "Product 2",
          "sku": "PRD-002",
          "images": ["https://example.com/image2.jpg"]
        }
      }
    ],
    "payments": [
      {
        "id": "payment-uuid",
        "reference": "PAY-REF-12345",
        "amount": "299.97",
        "gateway": "PAYSTACK",
        "status": "PAID",
        "gatewayData": {
          // Gateway-specific data
        },
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

### Update Order Status (Admin Only)

**Endpoint:** `PATCH /api/v1/admin/orders/:id/status`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "status": "COMPLETED",                     // Required: PENDING, PAID, COMPLETED, CANCELLED
  "notes": "Order delivered to customer",    // Optional
  "location": "Customer Address"             // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": "order-uuid",
    "status": "COMPLETED",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "tracking": {
      "id": "tracking-uuid",
      "status": "COMPLETED",
      "location": "Customer Address",
      "notes": "Order delivered to customer",
      "timestamp": "2025-08-12T12:00:00.000Z"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Cancel Order (Admin Only)

**Endpoint:** `POST /api/v1/admin/orders/:id/cancel`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "reason": "Customer requested cancellation",   // Required
  "restockItems": true                           // Optional, default: true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "id": "order-uuid",
    "status": "CANCELLED",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "tracking": {
      "id": "tracking-uuid",
      "status": "CANCELLED",
      "notes": "Customer requested cancellation",
      "timestamp": "2025-08-12T12:00:00.000Z"
    },
    "restockedItems": [
      {
        "productId": "product-uuid-1",
        "quantity": 2,
        "previousStock": 50,
        "newStock": 52
      },
      {
        "productId": "product-uuid-2",
        "quantity": 1,
        "previousStock": 25,
        "newStock": 26
      }
    ]
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Payment Management

### Get All Payments (Admin Only)

**Endpoint:** `GET /api/v1/admin/payments`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                     // Optional, default: 1
limit: 10                   // Optional, default: 10
search: "PAY-REF"           // Optional, search by reference or order ID
sortBy: "createdAt"         // Optional
sortOrder: "desc"           // Optional, default: "desc"
status: "PAID"              // Optional, filter by status
gateway: "PAYSTACK"         // Optional, filter by gateway
startDate: "2025-08-01"     // Optional, filter by date range
endDate: "2025-08-12"       // Optional, filter by date range
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": [
    {
      "id": "payment-uuid",
      "orderId": "order-uuid",
      "reference": "PAY-REF-12345",
      "amount": "299.97",
      "gateway": "PAYSTACK",
      "status": "PAID",
      "createdAt": "2025-08-12T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "order": {
        "id": "order-uuid",
        "user": {
          "fullName": "John Doe",
          "email": "user@example.com"
        }
      }
    },
    // More payments...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "summary": {
    "totalTransactions": 150,
    "pendingTransactions": 25,
    "paidTransactions": 115,
    "failedTransactions": 10,
    "totalAmount": "45000.00"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get Payment Details (Admin Only)

**Endpoint:** `GET /api/v1/admin/payments/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment retrieved successfully",
  "data": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "reference": "PAY-REF-12345",
    "amount": "299.97",
    "gateway": "PAYSTACK",
    "status": "PAID",
    "gatewayData": {
      // Full gateway response data
    },
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "order": {
      "id": "order-uuid",
      "totalAmount": "299.97",
      "status": "PAID",
      "user": {
        "id": "user-uuid",
        "fullName": "John Doe",
        "email": "user@example.com"
      }
    },
    "receipts": [
      {
        "id": "receipt-uuid",
        "receiptUrl": "https://example.com/receipt.jpg",
        "originalName": "receipt.jpg",
        "verificationStatus": "APPROVED",
        "uploadedBy": "user-uuid",
        "verifiedBy": "admin-uuid",
        "createdAt": "2025-08-12T12:00:00.000Z"
      }
    ]
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update Payment Status (Admin Only)

**Endpoint:** `PATCH /api/v1/admin/payments/:id/status`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "status": "PAID",                               // Required: PENDING, PAID, FAILED, CANCELLED
  "notes": "Manually verified bank transfer",     // Optional
  "updateOrder": true                            // Optional, default: true (updates order status as well)
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "id": "payment-uuid",
    "reference": "PAY-REF-12345",
    "status": "PAID",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "order": {
      "id": "order-uuid",
      "status": "PAID",
      "updatedAt": "2025-08-12T12:00:00.000Z"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Verify Payment Receipt (Admin Only)

**Endpoint:** `PATCH /api/v1/admin/payments/receipts/:id/verify`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "status": "APPROVED",                      // Required: APPROVED, REJECTED
  "notes": "Receipt matches payment amount", // Optional
  "updatePaymentStatus": true                // Optional, default: true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Receipt verified successfully",
  "data": {
    "id": "receipt-uuid",
    "transactionId": "payment-uuid",
    "verificationStatus": "APPROVED",
    "verificationNotes": "Receipt matches payment amount",
    "verifiedBy": "admin-uuid",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "payment": {
      "id": "payment-uuid",
      "status": "PAID",
      "updatedAt": "2025-08-12T12:00:00.000Z"
    },
    "order": {
      "id": "order-uuid",
      "status": "PAID",
      "updatedAt": "2025-08-12T12:00:00.000Z"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Review Management

### Get All Reviews (Admin Only)

**Endpoint:** `GET /api/v1/reviews` ⭐

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                     // Optional, default: 1
limit: 10                   // Optional, default: 10
search: "great"             // Optional, search by review content
sortBy: "createdAt"         // Optional
sortOrder: "desc"           // Optional, default: "desc"
rating: 5                   // Optional, filter by rating
productId: "product-uuid"   // Optional, filter by product
isVisible: true             // Optional, filter by visibility
isVerified: true            // Optional, filter by verification status
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": [
    {
      "id": "review-uuid",
      "productId": "product-uuid",
      "userId": "user-uuid",
      "orderId": "order-uuid",
      "rating": 5,
      "title": "Great product!",
      "comment": "I love this product",
      "images": ["https://supabase-storage-url/reviews/images/review-uuid-1.jpg"],
      "isVerified": true,
      "isVisible": true,
      "createdAt": "2025-08-12T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "user": {
        "fullName": "John Doe",
        "email": "user@example.com"
      },
      "product": {
        "name": "Product Name",
        "images": ["https://supabase-storage-url/products/images/product-uuid-1.jpg"]
      }
    },
    // More reviews...
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

### Create Review with Images ⭐ **NEW**

**Endpoint:** `POST /api/v1/reviews`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**File Upload Request:**
```
Content-Type: multipart/form-data

Form Data:
- productId: "product-uuid"              // Required
- rating: 5                              // Required (1-5)
- title: "Great product!"                // Required
- comment: "I love this product"         // Required
- images: review1.jpg, review2.png       // Optional, up to 5 images (JPEG, PNG, WebP, etc.)
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

### Update Review Visibility (Admin Only)

**Endpoint:** `PATCH /api/v1/reviews/:id/visibility` ⭐

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "isVisible": false,                     // Required
  "reason": "Contains inappropriate content"  // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Review visibility updated successfully",
  "data": {
    "id": "review-uuid",
    "isVisible": false,
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Delete Review (Admin Only)

**Endpoint:** `DELETE /api/v1/reviews/:id` ⭐

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Review deleted successfully",
  "data": {
    "id": "review-uuid",
    "productId": "product-uuid",
    "previousRating": "4.50",
    "newRating": "4.40",
    "previousReviewCount": 10,
    "newReviewCount": 9
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Support Management

### Get All Support Chats (Admin Only)

**Endpoint:** `GET /api/v1/admin/support`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
page: 1                     // Optional, default: 1
limit: 10                   // Optional, default: 10
search: "order"             // Optional, search by subject or message content
sortBy: "createdAt"         // Optional
sortOrder: "desc"           // Optional, default: "desc"
status: "OPEN"              // Optional, filter by status
priority: "HIGH"            // Optional, filter by priority
assignedTo: "admin-uuid"    // Optional, filter by assigned admin
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Support chats retrieved successfully",
  "data": [
    {
      "id": "chat-uuid",
      "userId": "user-uuid",
      "assignedTo": "admin-uuid",
      "subject": "Order Issue",
      "status": "OPEN",
      "priority": "HIGH",
      "createdAt": "2025-08-12T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "user": {
        "fullName": "John Doe",
        "email": "user@example.com"
      },
      "lastMessage": {
        "message": "I haven't received my order yet",
        "createdAt": "2025-08-12T12:00:00.000Z",
        "isAdmin": false
      },
      "messageCount": 3
    },
    // More chats...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 30,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "summary": {
    "openChats": 15,
    "inProgressChats": 10,
    "resolvedChats": 5,
    "highPriorityChats": 8
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Get Chat Details (Admin Only)

**Endpoint:** `GET /api/v1/admin/support/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Chat retrieved successfully",
  "data": {
    "chat": {
      "id": "chat-uuid",
      "userId": "user-uuid",
      "assignedTo": "admin-uuid",
      "subject": "Order Issue",
      "status": "OPEN",
      "priority": "HIGH",
      "createdAt": "2025-08-12T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "fullName": "John Doe",
        "email": "user@example.com",
        "phone": "1234567890"
      }
    },
    "messages": [
      {
        "id": "message-uuid-1",
        "chatId": "chat-uuid",
        "senderId": "user-uuid",
        "message": "I haven't received my order yet",
        "isAdmin": false,
        "createdAt": "2025-08-12T12:00:00.000Z",
        "sender": {
          "fullName": "John Doe"
        }
      },
      {
        "id": "message-uuid-2",
        "chatId": "chat-uuid",
        "senderId": "admin-uuid",
        "message": "I'll check the status for you",
        "isAdmin": true,
        "createdAt": "2025-08-12T12:05:00.000Z",
        "sender": {
          "fullName": "Admin User"
        }
      }
      // More messages...
    ],
    "relatedOrders": [
      {
        "id": "order-uuid",
        "totalAmount": "299.97",
        "status": "PAID",
        "createdAt": "2025-08-10T12:00:00.000Z"
      }
    ]
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update Chat Status (Admin Only)

**Endpoint:** `PATCH /api/v1/admin/support/:id/status`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "status": "IN_PROGRESS",      // Required: OPEN, IN_PROGRESS, RESOLVED, CLOSED
  "priority": "HIGH",          // Optional: LOW, MEDIUM, HIGH, URGENT
  "assignedTo": "admin-uuid",  // Optional
  "addMessage": "I'll be handling your issue"  // Optional, adds admin message to chat
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Chat status updated successfully",
  "data": {
    "id": "chat-uuid",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "assignedTo": "admin-uuid",
    "updatedAt": "2025-08-12T12:00:00.000Z",
    "message": {
      "id": "message-uuid",
      "message": "I'll be handling your issue",
      "isAdmin": true,
      "createdAt": "2025-08-12T12:00:00.000Z"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Reply to Support Chat (Admin Only)

**Endpoint:** `POST /api/v1/admin/support/:id/reply`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "message": "Your order has been shipped. Here's the tracking number: ABC123",  // Required
  "updateStatus": "IN_PROGRESS"  // Optional: OPEN, IN_PROGRESS, RESOLVED, CLOSED
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Reply sent successfully",
  "data": {
    "id": "message-uuid",
    "chatId": "chat-uuid",
    "senderId": "admin-uuid",
    "message": "Your order has been shipped. Here's the tracking number: ABC123",
    "isAdmin": true,
    "createdAt": "2025-08-12T12:00:00.000Z",
    "chat": {
      "id": "chat-uuid",
      "status": "IN_PROGRESS",
      "updatedAt": "2025-08-12T12:00:00.000Z"
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## System Settings

### Get Bank Accounts (Admin Only)

**Endpoint:** `GET /api/v1/admin/settings/bank-accounts`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Bank accounts retrieved successfully",
  "data": [
    {
      "id": "account-uuid",
      "bankName": "Example Bank",
      "accountName": "JJ Essencial Ltd",
      "accountNumber": "1234567890",
      "sortCode": "123456",
      "swiftCode": "EXMPLUS123",
      "currency": "NGN",
      "isActive": true,
      "createdAt": "2025-08-01T12:00:00.000Z",
      "updatedAt": "2025-08-12T12:00:00.000Z"
    },
    // More bank accounts...
  ],
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Create Bank Account (Admin Only)

**Endpoint:** `POST /api/v1/admin/settings/bank-accounts`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:**
```json
{
  "bankName": "New Bank",           // Required
  "accountName": "JJ Essencial Ltd", // Required
  "accountNumber": "0987654321",    // Required
  "sortCode": "654321",            // Optional
  "swiftCode": "NEWBANK123",       // Optional
  "currency": "USD",               // Optional, defaults to "NGN"
  "isActive": true                 // Optional, defaults to true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Bank account created successfully",
  "data": {
    "id": "new-account-uuid",
    "bankName": "New Bank",
    "accountName": "JJ Essencial Ltd",
    "accountNumber": "0987654321",
    "sortCode": "654321",
    "swiftCode": "NEWBANK123",
    "currency": "USD",
    "isActive": true,
    "createdAt": "2025-08-12T12:00:00.000Z",
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Update Bank Account (Admin Only)

**Endpoint:** `PUT /api/v1/admin/settings/bank-accounts/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Request:** (All fields optional)
```json
{
  "bankName": "Updated Bank",
  "accountName": "JJ Essencial Nigeria Ltd",
  "accountNumber": "5555555555",
  "sortCode": "111222",
  "swiftCode": "UPDBANK123",
  "currency": "NGN",
  "isActive": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Bank account updated successfully",
  "data": {
    "id": "account-uuid",
    "bankName": "Updated Bank",
    // ... all updated fields
    "updatedAt": "2025-08-12T12:00:00.000Z"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Delete Bank Account (Admin Only)

**Endpoint:** `DELETE /api/v1/admin/settings/bank-accounts/:id`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Bank account deleted successfully",
  "data": null,
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## Analytics & Reports

### Get Dashboard Stats (Admin Only)

**Endpoint:** `GET /api/v1/admin/dashboard`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
period: "week"       // Optional: day, week, month, year, all (default: week)
startDate: "2025-08-01"  // Optional, override period with specific date range
endDate: "2025-08-12"    // Optional, override period with specific date range
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "salesSummary": {
      "totalSales": "45000.00",
      "orderCount": 150,
      "averageOrderValue": "300.00",
      "comparisonPeriod": {
        "totalSales": "40000.00",
        "orderCount": 135,
        "percentChange": {
          "totalSales": 12.5,
          "orderCount": 11.1
        }
      }
    },
    "orderStats": {
      "pending": 25,
      "paid": 115,
      "completed": 98,
      "cancelled": 10
    },
    "productStats": {
      "totalProducts": 500,
      "lowStock": 15,
      "outOfStock": 5,
      "topSelling": [
        {
          "id": "product-uuid-1",
          "name": "Popular Product 1",
          "totalSold": 50,
          "revenue": "4999.50"
        },
        // More top-selling products...
      ]
    },
    "userStats": {
      "totalUsers": 350,
      "newUsers": 25,
      "activeUsers": 275
    },
    "recentOrders": [
      {
        "id": "order-uuid",
        "totalAmount": "299.97",
        "status": "PAID",
        "createdAt": "2025-08-12T12:00:00.000Z",
        "user": {
          "fullName": "John Doe"
        }
      },
      // More recent orders...
    ],
    "recentReviews": [
      {
        "id": "review-uuid",
        "rating": 5,
        "title": "Great product!",
        "createdAt": "2025-08-12T12:00:00.000Z",
        "product": {
          "name": "Product Name"
        },
        "user": {
          "fullName": "John Doe"
        }
      },
      // More recent reviews...
    ],
    "salesChart": {
      "labels": ["Aug 1", "Aug 2", "Aug 3", "Aug 4", "Aug 5", "Aug 6", "Aug 7"],
      "data": [1500, 2500, 1800, 3000, 2200, 1900, 2800]
    }
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Generate Sales Report (Admin Only)

**Endpoint:** `GET /api/v1/admin/reports/sales`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
period: "month"      // Optional: day, week, month, year, all (default: month)
startDate: "2025-08-01"  // Optional, override period with specific date range
endDate: "2025-08-12"    // Optional, override period with specific date range
format: "json"       // Optional: json, csv, pdf (default: json)
```

**Response (Success - JSON):**
```json
{
  "success": true,
  "message": "Sales report generated successfully",
  "data": {
    "period": {
      "start": "2025-08-01T00:00:00.000Z",
      "end": "2025-08-31T23:59:59.999Z"
    },
    "summary": {
      "totalSales": "45000.00",
      "orderCount": 150,
      "averageOrderValue": "300.00",
      "totalRefunds": "1500.00",
      "netSales": "43500.00"
    },
    "salesByDay": [
      {
        "date": "2025-08-01",
        "orderCount": 5,
        "totalSales": "1500.00"
      },
      // More days...
    ],
    "salesByCategory": [
      {
        "category": "Electronics",
        "orderCount": 50,
        "totalSales": "25000.00",
        "percentage": 55.6
      },
      // More categories...
    ],
    "salesByPaymentMethod": [
      {
        "gateway": "PAYSTACK",
        "orderCount": 100,
        "totalSales": "30000.00",
        "percentage": 66.7
      },
      // More payment methods...
    ],
    "topProducts": [
      {
        "id": "product-uuid",
        "name": "Popular Product",
        "sku": "PRD-001",
        "quantitySold": 50,
        "totalSales": "4999.50"
      },
      // More products...
    ],
    "topCustomers": [
      {
        "id": "user-uuid",
        "fullName": "John Doe",
        "email": "user@example.com",
        "orderCount": 5,
        "totalSpent": "1500.00"
      },
      // More customers...
    ],
    "downloadUrl": null // For JSON format, no download URL
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

**Response (Success - CSV or PDF):**
```json
{
  "success": true,
  "message": "Sales report generated successfully",
  "data": {
    "period": {
      "start": "2025-08-01T00:00:00.000Z",
      "end": "2025-08-31T23:59:59.999Z"
    },
    "summary": {
      "totalSales": "45000.00",
      "orderCount": 150
    },
    "downloadUrl": "https://example.com/reports/sales-report-2025-08.pdf"
  },
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

### Generate Inventory Report (Admin Only)

**Endpoint:** `GET /api/v1/admin/reports/inventory`

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
```
filterBy: "low_stock"  // Optional: all, low_stock, out_of_stock, high_stock
categoryId: "category-uuid"  // Optional, filter by category
format: "json"  // Optional: json, csv, pdf (default: json)
```

**Response (Success - JSON):**
```json
{
  "success": true,
  "message": "Inventory report generated successfully",
  "data": {
    "summary": {
      "totalProducts": 500,
      "totalStockValue": "75000.00",
      "lowStockCount": 15,
      "outOfStockCount": 5,
      "overStockedCount": 20
    },
    "stockByCategory": [
      {
        "category": "Electronics",
        "productCount": 200,
        "totalStock": 5000,
        "stockValue": "50000.00"
      },
      // More categories...
    ],
    "products": [
      {
        "id": "product-uuid",
        "name": "Product Name",
        "sku": "PRD-001",
        "category": "Electronics",
        "stock": 5,
        "lowStockThreshold": 10,
        "price": "99.99",
        "stockValue": "499.95",
        "status": "LOW_STOCK",
        "lastRestock": "2025-08-01T12:00:00.000Z",
        "avgSalesPerMonth": 15
      },
      // More products...
    ],
    "downloadUrl": null // For JSON format, no download URL
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

Common error status codes for admin endpoints:
- 400: Bad Request (validation errors)
- 401: Unauthorized (not logged in)
- 403: Forbidden (not an admin user)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

---

## 📁 File Upload Capabilities ⭐ **NEW**

### Supported File Formats
The API now supports actual file uploads for images instead of URL-based uploads. The following formats are supported:

**Image Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)
- SVG (.svg)
- BMP (.bmp)
- TIFF (.tiff, .tif)
- AVIF (.avif)

### File Upload Locations

**Products:**
- **Endpoint:** `POST /api/v1/products/with-images`
- **Storage Path:** `products/images/`
- **Max Files:** 10 images per product
- **Max Size:** 5MB per file

**User Avatars:**
- **Endpoint:** `PUT /api/v1/users/profile/avatar`
- **Storage Path:** `avatars/images/`
- **Max Files:** 1 avatar per user
- **Max Size:** 2MB per file

**Review Images:**
- **Endpoint:** `POST /api/v1/reviews`
- **Storage Path:** `reviews/images/`
- **Max Files:** 5 images per review
- **Max Size:** 3MB per file

### File Upload Request Format

All file upload endpoints use `multipart/form-data` content type:

```
Content-Type: multipart/form-data

Form Fields:
- Regular data fields (name, description, etc.)
- File fields (images, avatar, etc.)
```

### File Upload Response

Successful uploads return Supabase storage URLs:

```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "images": [
      "https://supabase-storage-url/products/images/product-uuid-1.jpg",
      "https://supabase-storage-url/products/images/product-uuid-2.png"
    ]
  }
}
```

### File Validation

All uploaded files are validated for:
- **File type:** Must match supported formats
- **File size:** Must not exceed specified limits
- **File count:** Must not exceed specified limits per endpoint
- **File content:** Basic security checks

### Error Handling

File upload errors return detailed information:

```json
{
  "success": false,
  "error": "File validation failed",
  "details": [
    "File 'large-image.jpg' exceeds maximum size of 5MB",
    "File 'document.pdf' is not a supported image format"
  ],
  "statusCode": 400,
  "timestamp": "2025-08-12T12:00:00.000Z"
}
```

---

## 🔄 API Changes Summary ⭐ **MIGRATION NOTES**

### Updated Endpoint Paths
The following endpoints have been updated to remove the `/admin/` prefix:

| Old Endpoint | New Endpoint | Status |
|-------------|-------------|---------|
| `GET /api/v1/admin/products` | `GET /api/v1/products` | ⭐ Updated |
| `POST /api/v1/admin/products` | `POST /api/v1/products/with-images` | ⭐ Updated + File Upload |
| `PUT /api/v1/admin/products/:id` | `PUT /api/v1/products/:id/with-images` | ⭐ Updated + File Upload |
| `GET /api/v1/admin/categories` | `GET /api/v1/categories` | ⭐ Updated |
| `POST /api/v1/admin/categories` | `POST /api/v1/categories` | ⭐ Updated |
| `GET /api/v1/admin/orders` | `GET /api/v1/orders` | ⭐ Updated |
| `GET /api/v1/admin/orders/:id` | `GET /api/v1/orders/:id` | ⭐ Updated |
| `GET /api/v1/admin/reviews` | `GET /api/v1/reviews` | ⭐ Updated |
| `PATCH /api/v1/admin/reviews/:id/visibility` | `PATCH /api/v1/reviews/:id/visibility` | ⭐ Updated |
| `DELETE /api/v1/admin/reviews/:id` | `DELETE /api/v1/reviews/:id` | ⭐ Updated |

### New File Upload Endpoints
The following new endpoints support file uploads:

- `POST /api/v1/products/with-images` - Create product with image files
- `PUT /api/v1/products/:id/with-images` - Update product with image files
- `PUT /api/v1/users/profile/avatar` - Update user profile with avatar file
- `POST /api/v1/reviews` - Create review with image files

### Breaking Changes
1. **Image URLs to File Uploads:** All image fields now require actual file uploads instead of URL strings
2. **Content-Type:** File upload endpoints require `multipart/form-data` instead of `application/json`
3. **Response Format:** Image fields now return Supabase storage URLs instead of external URLs
