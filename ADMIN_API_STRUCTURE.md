# Admin API Structure - Complete Reference Guide
*Comprehensive admin-level API endpoints for full e-commerce management*

## 🎯 Overview
This document provides the complete API structure for admin-level operations across all major e-commerce areas. All endpoints require admin authentication.

## 🔐 Authentication
**Base URL**: `http://localhost:3000`
**Admin Credentials**: 
- Email: `jadesola0518@gmail.com`
- Password: `Amoke1805`

**Headers Required for All Admin Endpoints**:
```javascript
{
  "Authorization": "Bearer {admin_token}",
  "Content-Type": "application/json"
}
```

---

## 📂 **1. CATEGORIES MANAGEMENT**

### **Get All Categories**
```http
GET /admin/categories?includeInactive=false&search=&sortBy=name&sortOrder=ASC
```

**Query Parameters:**
- `includeInactive`: boolean (show inactive categories)
- `search`: string (search by name or description)
- `sortBy`: string (name, created_at, sort_order)
- `sortOrder`: ASC | DESC

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "category-uuid",
      "name": "Electronics",
      "description": "Electronic products and gadgets",
      "slug": "electronics",
      "parent_id": null,
      "image_url": "https://example.com/image.jpg",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2025-08-22T10:00:00Z",
      "updated_at": "2025-08-22T10:00:00Z"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

### **Get Category by ID**
```http
GET /admin/categories/{id}
```

### **Create Category**
```http
POST /admin/categories
```

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "slug": "new-category",
  "parentId": null,
  "imageUrl": "https://example.com/image.jpg",
  "sortOrder": 1,
  "isActive": true
}
```

### **Update Category**
```http
PUT /admin/categories/{id}
```

**Request Body:** (same as create, all fields optional)

### **Delete Category**
```http
DELETE /admin/categories/{id}
```

### **Bulk Update Categories Status**
```http
PUT /admin/categories/bulk/status
```

**Request Body:**
```json
{
  "ids": ["category-id-1", "category-id-2"],
  "isActive": false
}
```

---

## 👥 **2. CUSTOMERS MANAGEMENT**

### **Get All Customers**
```http
GET /admin/users?page=1&limit=10&search=&role=&isActive=&sortBy=created_at&sortOrder=DESC
```

**Query Parameters:**
- `page`: number (pagination)
- `limit`: number (items per page)
- `search`: string (search by email or full name)
- `role`: USER | ADMIN
- `isActive`: boolean
- `sortBy`: created_at, email, full_name
- `sortOrder`: ASC | DESC

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "email": "customer@example.com",
      "full_name": "John Doe",
      "avatar_url": null,
      "phone": "+234123456789",
      "role": "USER",
      "is_active": true,
      "last_login": "2025-08-22T10:00:00Z",
      "created_at": "2025-08-22T10:00:00Z",
      "updated_at": "2025-08-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  },
  "message": "Users retrieved successfully"
}
```

### **Get Customer by ID**
```http
GET /admin/users/{id}
```

### **Update Customer Status**
```http
PUT /admin/users/{id}/status
```

**Request Body:**
```json
{
  "isActive": false
}
```

### **Delete Customer**
```http
DELETE /admin/users/{id}
```

### **Bulk Update Customers Status**
```http
PUT /admin/users/bulk/status
```

**Request Body:**
```json
{
  "ids": ["user-id-1", "user-id-2"],
  "isActive": false
}
```

### **Export Customers Data**
```http
GET /admin/export/users?format=csv&startDate=2025-08-01&endDate=2025-08-31
```

---

## 💳 **3. PAYMENTS MANAGEMENT**

### **Get Payment Statistics**
```http
GET /payments/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPayments": 1250,
    "totalRevenue": 125000.50,
    "pendingPayments": 25,
    "failedPayments": 12,
    "successfulPayments": 1213,
    "averageTransactionValue": 100.00,
    "paymentsToday": 15,
    "revenueToday": 1500.00,
    "gatewayBreakdown": {
      "PAYSTACK": 800,
      "FLUTTERWAVE": 350,
      "BANK_TRANSFER": 100
    }
  },
  "message": "Payment statistics retrieved successfully"
}
```

### **Get All Payment History**
```http
GET /payments/history?page=1&limit=10&status=&gateway=&dateFrom=&dateTo=
```

**Query Parameters:**
- `page`: number
- `limit`: number
- `status`: PENDING | PAID | FAILED | REFUNDED
- `gateway`: PAYSTACK | FLUTTERWAVE | BANK_TRANSFER
- `dateFrom`: ISO date string
- `dateTo`: ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-uuid",
      "reference": "PAY_123456789",
      "amount": 500.00,
      "gateway": "PAYSTACK",
      "status": "PAID",
      "orderId": "order-uuid",
      "createdAt": "2025-08-22T10:00:00Z",
      "order": {
        "id": "order-uuid",
        "status": "DELIVERED",
        "user": {
          "email": "customer@example.com",
          "full_name": "John Doe"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1250,
    "pages": 125
  },
  "message": "Payment history retrieved successfully"
}
```

### **Get Pending Receipt Verifications**
```http
GET /payments/receipts/pending
```

### **Verify Payment Receipt**
```http
PATCH /payments/receipt/{receiptId}/verify
```

**Request Body:**
```json
{
  "isApproved": true,
  "notes": "Receipt verified successfully"
}
```

### **Refund Payment**
```http
POST /payments/{paymentId}/refund
```

**Request Body:**
```json
{
  "amount": 500.00,
  "reason": "Customer request",
  "notes": "Full refund processed"
}
```

### **Export Payments Data**
```http
GET /admin/export/payments?format=csv&startDate=2025-08-01&endDate=2025-08-31
```

---

## ⭐ **4. REVIEWS MANAGEMENT**

### **Get All Reviews**
```http
GET /admin/reviews?page=1&limit=10&status=&rating=&productId=&sortBy=created_at&sortOrder=DESC
```

**Query Parameters:**
- `page`: number
- `limit`: number
- `status`: PENDING | APPROVED | REJECTED
- `rating`: 1 | 2 | 3 | 4 | 5
- `productId`: string (filter by product)
- `sortBy`: created_at, rating
- `sortOrder`: ASC | DESC

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "review-uuid",
      "productId": "product-uuid",
      "userId": "user-uuid",
      "rating": 5,
      "comment": "Excellent product!",
      "status": "APPROVED",
      "isVerifiedPurchase": true,
      "created_at": "2025-08-22T10:00:00Z",
      "updated_at": "2025-08-22T10:00:00Z",
      "product": {
        "id": "product-uuid",
        "name": "iPhone 15",
        "sku": "IPHONE15-001"
      },
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 500,
    "pages": 50
  },
  "message": "Reviews retrieved successfully"
}
```

### **Get Review by ID**
```http
GET /admin/reviews/{id}
```

### **Moderate Review**
```http
PUT /admin/reviews/{id}/moderate
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "adminNotes": "Review approved after verification"
}
```

### **Delete Review**
```http
DELETE /admin/reviews/{id}
```

### **Bulk Moderate Reviews**
```http
PUT /admin/reviews/bulk/moderate
```

**Request Body:**
```json
{
  "reviewIds": ["review-id-1", "review-id-2"],
  "status": "APPROVED",
  "adminNotes": "Bulk approval"
}
```

### **Get Reviews Analytics**
```http
GET /admin/reviews/analytics?startDate=2025-08-01&endDate=2025-08-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReviews": 500,
    "averageRating": 4.2,
    "pendingReviews": 25,
    "approvedReviews": 450,
    "rejectedReviews": 25,
    "ratingDistribution": {
      "1": 10,
      "2": 20,
      "3": 50,
      "4": 150,
      "5": 270
    },
    "verifiedPurchasePercentage": 85.6
  },
  "message": "Review analytics retrieved successfully"
}
```

---

## 🎧 **5. SUPPORT MANAGEMENT**

### **Get All Support Chats**
```http
GET /customer-support/admin/chats?page=1&limit=20&status=&priority=&assignedTo=&sortBy=created_at&sortOrder=DESC
```

**Query Parameters:**
- `page`: number
- `limit`: number
- `status`: OPEN | IN_PROGRESS | RESOLVED | CLOSED
- `priority`: LOW | MEDIUM | HIGH | URGENT
- `assignedTo`: string (support agent ID)
- `sortBy`: created_at, updated_at, priority
- `sortOrder`: ASC | DESC

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chat-uuid",
      "userId": "user-uuid",
      "subject": "Order delivery issue",
      "status": "OPEN",
      "priority": "HIGH",
      "category": "ORDER_ISSUE",
      "assignedTo": null,
      "lastMessageAt": "2025-08-22T10:00:00Z",
      "created_at": "2025-08-22T09:00:00Z",
      "updated_at": "2025-08-22T10:00:00Z",
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "messageCount": 5,
      "unreadCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "message": "Support chats retrieved successfully"
}
```

### **Get Support Chat Details**
```http
GET /customer-support/admin/chat/{chatId}/full
```

### **Update Chat Status**
```http
PUT /customer-support/admin/chat/{chatId}/status
```

**Request Body:**
```json
{
  "status": "RESOLVED",
  "notes": "Issue resolved successfully"
}
```

### **Assign Chat to Agent**
```http
PUT /customer-support/admin/chat/{chatId}/assign
```

**Request Body:**
```json
{
  "supportUserId": "agent-uuid",
  "notes": "Assigned to technical support team"
}
```

### **Send Message to Chat**
```http
POST /customer-support/admin/chat/{chatId}/message
```

**Request Body:**
```json
{
  "message": "Hello, I'm here to help you with your order issue.",
  "isInternal": false,
  "attachments": ["file-url-1", "file-url-2"]
}
```

### **Get Support Statistics**
```http
GET /customer-support/admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalChats": 1500,
    "openChats": 45,
    "inProgressChats": 30,
    "resolvedChats": 1400,
    "closedChats": 25,
    "averageResponseTime": "2.5 hours",
    "averageResolutionTime": "1.2 days",
    "customerSatisfactionScore": 4.6,
    "agentPerformance": [
      {
        "agentId": "agent-uuid",
        "agentName": "Support Agent 1",
        "resolvedChats": 150,
        "averageRating": 4.8,
        "responseTime": "1.5 hours"
      }
    ],
    "categoryBreakdown": {
      "ORDER_ISSUE": 450,
      "PAYMENT_ISSUE": 300,
      "PRODUCT_INQUIRY": 200,
      "TECHNICAL_SUPPORT": 350,
      "GENERAL_INQUIRY": 200
    }
  },
  "message": "Support statistics retrieved successfully"
}
```

### **Export Support Data**
```http
GET /admin/export/support?format=csv&startDate=2025-08-01&endDate=2025-08-31
```

---

## 📊 **6. ANALYTICS MANAGEMENT**

### **Get Dashboard Analytics**
```http
GET /admin/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalOrders": 850,
    "totalProducts": 450,
    "totalRevenue": 125000.50,
    "pendingOrders": 25,
    "lowStockProducts": 15,
    "newUsersToday": 12,
    "ordersToday": 8,
    "revenueToday": 1500.00,
    "monthlyGrowth": {
      "users": 15.2,
      "orders": 8.5,
      "revenue": 12.3
    }
  },
  "message": "Dashboard statistics retrieved successfully"
}
```

### **Get Sales Analytics**
```http
GET /admin/analytics/sales?startDate=2025-08-01&endDate=2025-08-31&groupBy=daily
```

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string
- `groupBy`: daily | weekly | monthly

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 125000.50,
    "totalOrders": 850,
    "averageOrderValue": 147.06,
    "salesByPeriod": [
      {
        "period": "2025-08-22",
        "sales": 1500.00,
        "orders": 8,
        "averageOrderValue": 187.50
      }
    ],
    "topProducts": [
      {
        "productId": "product-uuid",
        "productName": "iPhone 15",
        "sales": 15000.00,
        "quantity": 15,
        "revenue_percentage": 12.0
      }
    ],
    "topCategories": [
      {
        "categoryId": "category-uuid",
        "categoryName": "Electronics",
        "sales": 75000.00,
        "orders": 450,
        "revenue_percentage": 60.0
      }
    ]
  },
  "message": "Sales analytics retrieved successfully"
}
```

### **Get User Analytics**
```http
GET /admin/analytics/users?startDate=2025-08-01&endDate=2025-08-31&groupBy=daily
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "newUsers": 125,
    "activeUsers": 850,
    "userRetentionRate": 68.5,
    "usersByPeriod": [
      {
        "period": "2025-08-22",
        "newUsers": 12,
        "activeUsers": 85,
        "retentionRate": 70.2
      }
    ],
    "topLocations": [
      {
        "country": "Nigeria",
        "users": 950,
        "percentage": 76.0
      }
    ],
    "deviceBreakdown": {
      "mobile": 60.5,
      "desktop": 35.2,
      "tablet": 4.3
    }
  },
  "message": "User analytics retrieved successfully"
}
```

### **Get Inventory Analytics**
```http
GET /admin/analytics/inventory
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 450,
    "activeProducts": 425,
    "inactiveProducts": 25,
    "lowStockProducts": 15,
    "outOfStockProducts": 5,
    "totalStockValue": 2500000.00,
    "averageStockLevel": 45.8,
    "topSellingProducts": [
      {
        "productId": "product-uuid",
        "productName": "iPhone 15",
        "stockLevel": 25,
        "soldQuantity": 150,
        "revenue": 150000.00
      }
    ],
    "categoryDistribution": [
      {
        "categoryId": "category-uuid",
        "categoryName": "Electronics",
        "productCount": 180,
        "percentage": 40.0
      }
    ]
  },
  "message": "Inventory analytics retrieved successfully"
}
```

### **Get Financial Analytics**
```http
GET /admin/analytics/financial?startDate=2025-08-01&endDate=2025-08-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 125000.50,
    "totalExpenses": 45000.00,
    "netProfit": 80000.50,
    "profitMargin": 64.0,
    "revenueByGateway": {
      "PAYSTACK": 75000.00,
      "FLUTTERWAVE": 35000.00,
      "BANK_TRANSFER": 15000.50
    },
    "revenueByCategory": [
      {
        "categoryName": "Electronics",
        "revenue": 75000.00,
        "percentage": 60.0
      }
    ],
    "monthlyRevenueTrend": [
      {
        "month": "2025-08",
        "revenue": 125000.50,
        "growth": 15.2
      }
    ]
  },
  "message": "Financial analytics retrieved successfully"
}
```

---

## ⚙️ **7. SETTINGS MANAGEMENT**

### **Get Admin Settings**
```http
GET /admin/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "siteName": "JJ Essential",
    "siteDescription": "Your favorite e-commerce store",
    "contactEmail": "admin@jjessential.com",
    "supportEmail": "support@jjessential.com",
    "currency": "NGN",
    "timezone": "Africa/Lagos",
    "logoUrl": "https://example.com/logo.png",
    "faviconUrl": "https://example.com/favicon.ico",
    "allowRegistration": true,
    "requireEmailVerification": true,
    "defaultUserRole": "USER",
    "maintenanceMode": false,
    "maintenanceMessage": "Site under maintenance",
    "maxOrderItems": 10,
    "minOrderAmount": 100.00,
    "maxOrderAmount": 1000000.00,
    "freeShippingThreshold": 10000.00,
    "taxRate": 7.5,
    "paymentGateways": {
      "paystack": {
        "enabled": true,
        "publicKey": "pk_test_xxxxx",
        "secretKey": "sk_test_xxxxx"
      },
      "flutterwave": {
        "enabled": true,
        "publicKey": "FLWPUBK_TEST_xxxxx",
        "secretKey": "FLWSECK_TEST_xxxxx"
      }
    },
    "emailSettings": {
      "smtpHost": "smtp.gmail.com",
      "smtpPort": 587,
      "smtpUser": "noreply@jjessential.com",
      "enableEmailNotifications": true
    },
    "socialMedia": {
      "facebook": "https://facebook.com/jjessential",
      "twitter": "https://twitter.com/jjessential",
      "instagram": "https://instagram.com/jjessential"
    }
  },
  "message": "Settings retrieved successfully"
}
```

### **Update Admin Settings**
```http
PUT /admin/settings
```

**Request Body:**
```json
{
  "siteName": "JJ Essential Store",
  "siteDescription": "Your premier e-commerce destination",
  "contactEmail": "admin@jjessential.com",
  "currency": "NGN",
  "timezone": "Africa/Lagos",
  "logoUrl": "https://example.com/new-logo.png",
  "allowRegistration": true,
  "requireEmailVerification": true,
  "defaultUserRole": "USER",
  "maintenanceMode": false,
  "freeShippingThreshold": 15000.00,
  "taxRate": 7.5
}
```

### **Update Payment Gateway Settings**
```http
PUT /admin/settings/payment-gateways
```

**Request Body:**
```json
{
  "paystack": {
    "enabled": true,
    "publicKey": "pk_test_xxxxx",
    "secretKey": "sk_test_xxxxx"
  },
  "flutterwave": {
    "enabled": false,
    "publicKey": "",
    "secretKey": ""
  }
}
```

### **Update Email Settings**
```http
PUT /admin/settings/email
```

**Request Body:**
```json
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "noreply@jjessential.com",
  "smtpPassword": "app_password",
  "enableEmailNotifications": true,
  "emailTemplates": {
    "orderConfirmation": true,
    "paymentReceived": true,
    "orderShipped": true,
    "orderDelivered": true
  }
}
```

### **Backup Database**
```http
POST /admin/settings/backup
```

**Response:**
```json
{
  "success": true,
  "data": {
    "backupId": "backup-uuid",
    "fileName": "backup_2025-08-22_12-30-45.sql",
    "fileSize": "2.5 MB",
    "downloadUrl": "/admin/backups/backup-uuid/download",
    "createdAt": "2025-08-22T12:30:45Z"
  },
  "message": "Database backup created successfully"
}
```

### **Get System Information**
```http
GET /admin/settings/system-info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "serverInfo": {
      "nodeVersion": "18.17.0",
      "nestVersion": "10.0.0",
      "platform": "linux",
      "memory": {
        "used": "245 MB",
        "total": "1 GB"
      }
    },
    "databaseInfo": {
      "type": "PostgreSQL",
      "version": "15.3",
      "size": "125 MB",
      "tables": 12,
      "connections": 5
    },
    "storageInfo": {
      "totalSpace": "50 GB",
      "usedSpace": "15 GB",
      "freeSpace": "35 GB"
    },
    "apiInfo": {
      "version": "1.0.0",
      "environment": "development",
      "uptime": "2 days 5 hours"
    }
  },
  "message": "System information retrieved successfully"
}
```

---

## 📋 **Common Response Patterns**

### **Success Response**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully",
  "timestamp": "2025-08-22T10:00:00Z"
}
```

### **Paginated Response**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "message": "Data retrieved successfully",
  "timestamp": "2025-08-22T10:00:00Z"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": "Category with ID 'invalid-id' does not exist"
  },
  "timestamp": "2025-08-22T10:00:00Z"
}
```

---

## 🔄 **Common HTTP Status Codes**

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

---

## 📝 **Notes**

1. **All endpoints require admin authentication**
2. **Pagination is available for list endpoints**
3. **Search and filtering options are provided where applicable**
4. **Bulk operations are available for common actions**
5. **Export functionality is available for major data types**
6. **Real-time updates can be implemented using WebSockets**
7. **Rate limiting is recommended for production**

This API structure provides comprehensive admin-level control over all major e-commerce operations.
