# Frontend API Reference

This document provides a comprehensive reference for all API endpoints available for frontend integration, including the latest file upload capabilities.

## Base Configuration

**Base URL:** `http://localhost:3000/api/v1`
**API Documentation:** `http://localhost:3000/api/v1/docs` (Swagger)

### Headers
```javascript
{
  'Content-Type': 'application/json', // For JSON requests
  'Content-Type': 'multipart/form-data', // For file uploads
  'Authorization': 'Bearer <jwt_token>' // For authenticated requests
}
```

## Authentication

### Public Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Protected Endpoints
All endpoints marked with 🔒 require JWT authentication.
All endpoints marked with 👑 require Admin role.

---

## Products

### Get Products
```http
GET /products?page=1&limit=10&search=query&category=Electronics&minPrice=10&maxPrice=1000&sortBy=name&sortOrder=asc&inStock=true
```

### Get Single Product
```http
GET /products/{id}
```

### Create Product 👑
**JSON Version:**
```http
POST /products
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone model",
  "price": 999.99,
  "stock": 50,
  "category": "Electronics",
  "lowStockThreshold": 10,
  "images": ["url1", "url2"] // Optional
}
```

**File Upload Version:** ⭐ NEW
```http
POST /products
Content-Type: multipart/form-data

Form Data:
- name: "iPhone 15 Pro"
- description: "Latest iPhone model"
- price: 999.99
- stock: 50
- category: "Electronics"
- lowStockThreshold: 10
- images: [file1.jpg, file2.png, file3.webp] // Max 10 files
```

### Update Product 👑
**JSON Version:**
```http
PATCH /products/{id}
Content-Type: application/json

{
  "name": "Updated iPhone 15 Pro",
  "price": 899.99
}
```

**File Upload Version:** ⭐ NEW
```http
PATCH /products/{id}
Content-Type: multipart/form-data

Form Data:
- name: "Updated iPhone 15 Pro"
- price: 899.99
- images: [newfile1.jpg, newfile2.png] // Additional images
```

### Delete Product 👑
```http
DELETE /products/{id}
```

### Get Product Categories
```http
GET /products/categories
```

---

## Categories

### Get All Categories
```http
GET /categories?includeInactive=false
```

### Get Category Tree
```http
GET /categories/tree
```

### Get Single Category
```http
GET /categories/{id-or-slug}
```

### Create Category 👑
```http
POST /categories
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "slug": "electronics", // Optional, auto-generated
  "parentId": "parent-category-id", // Optional
  "isActive": true
}
```

### Update Category 👑
```http
PUT /categories/{id}
Content-Type: application/json

{
  "name": "Updated Electronics",
  "description": "Updated description"
}
```

### Delete Category 👑
```http
DELETE /categories/{id}
```

---

## User Management

### Get User Profile 🔒
```http
GET /users/profile
```

### Update Profile 🔒
**JSON Version:**
```http
PUT /users/profile
Content-Type: application/json

{
  "fullName": "John Doe",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg", // Optional
  "dateOfBirth": "1990-01-01"
}
```

**Avatar Upload Version:** ⭐ NEW
```http
PUT /users/profile/avatar
Content-Type: multipart/form-data

Form Data:
- fullName: "John Doe"
- phone: "+1234567890"
- dateOfBirth: "1990-01-01"
- avatar: profile.jpg // Image file
```

### Get Profile Stats 🔒
```http
GET /users/profile/stats
```

### User Addresses 🔒
```http
GET /users/addresses
POST /users/addresses
PUT /users/addresses/{id}
DELETE /users/addresses/{id}
```

---

## Reviews

### Get Product Reviews
```http
GET /reviews/product/{productId}?page=1&limit=10
```

### Get User Reviews 🔒
```http
GET /reviews/user?page=1&limit=10
```

### Create Review 🔒
**JSON Version:**
```http
POST /reviews
Content-Type: application/json

{
  "productId": "product-uuid",
  "orderId": "order-uuid", // Optional
  "rating": 5,
  "title": "Great product!",
  "comment": "I really love this product!",
  "images": ["url1", "url2"] // Optional
}
```

**Image Upload Version:** ⭐ NEW
```http
POST /reviews/with-images
Content-Type: multipart/form-data

Form Data:
- productId: "product-uuid"
- orderId: "order-uuid" // Optional
- rating: 5
- title: "Great product!"
- comment: "I really love this product!"
- images: [review1.jpg, review2.png] // Max 5 files
```

### Update Review 🔒
```http
PUT /reviews/{id}
Content-Type: application/json

{
  "rating": 4,
  "title": "Updated title",
  "comment": "Updated comment"
}
```

### Delete Review 🔒
```http
DELETE /reviews/{id}
```

### Get Product Rating Stats
```http
GET /reviews/product/{productId}/stats
```

---

## Orders

### Get User Orders 🔒
```http
GET /orders?page=1&limit=10&status=PENDING
```

### Get Single Order 🔒
```http
GET /orders/{id}
```

### Create Order 🔒
```http
POST /orders
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "price": 999.99
    }
  ],
  "shippingAddressId": "address-uuid",
  "billingAddressId": "address-uuid",
  "paymentMethod": "PAYSTACK"
}
```

### Cancel Order 🔒
```http
PATCH /orders/{id}/cancel
```

---

## Payments

### Initialize Payment 🔒
```http
POST /payments/initialize
Content-Type: application/json

{
  "orderId": "order-uuid",
  "provider": "PAYSTACK", // or "FLUTTERWAVE"
  "amount": 999.99,
  "currency": "NGN"
}
```

### Verify Payment 🔒
```http
POST /payments/verify
Content-Type: application/json

{
  "reference": "payment-reference",
  "provider": "PAYSTACK"
}
```

---

## Wishlist

### Get User Wishlist 🔒
```http
GET /wishlist?page=1&limit=10
```

### Add to Wishlist 🔒
```http
POST /wishlist
Content-Type: application/json

{
  "productId": "product-uuid"
}
```

### Remove from Wishlist 🔒
```http
DELETE /wishlist/{productId}
```

---

## Search

### Search Products
```http
GET /search?q=query&category=Electronics&minPrice=10&maxPrice=1000&page=1&limit=10
```

### Search Suggestions
```http
GET /search/suggestions?q=partial-query&limit=5
```

---

## File Upload

### Upload Files 🔒
```http
POST /upload
Content-Type: multipart/form-data

Form Data:
- files: [file1.jpg, file2.png] // Max 10 files
- folder: "products" // Optional, default: "uploads"
```

### Upload Single File 🔒
```http
POST /upload/single
Content-Type: multipart/form-data

Form Data:
- file: image.jpg
- folder: "avatars" // Optional
```

---

## File Upload Support

### Supported Formats ⭐ NEW
- **Images:** JPEG, JPG, PNG, WebP, GIF, SVG, BMP, TIFF, AVIF
- **Max Size:** 5MB per file
- **Max Files:** 10 files per request (5 for reviews)

### File Upload Examples

**JavaScript/Fetch:**
```javascript
// Product with images
const formData = new FormData();
formData.append('name', 'iPhone 15 Pro');
formData.append('price', '999.99');
formData.append('images', file1);
formData.append('images', file2);

fetch('/api/v1/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});

// Profile avatar update
const avatarData = new FormData();
avatarData.append('fullName', 'John Doe');
avatarData.append('avatar', avatarFile);

fetch('/api/v1/users/profile/avatar', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: avatarData
});
```

**React Hook Form:**
```javascript
const { register, handleSubmit } = useForm();

const onSubmit = async (data) => {
  const formData = new FormData();
  formData.append('productId', data.productId);
  formData.append('rating', data.rating);
  
  // Add multiple files
  for (let i = 0; i < data.images.length; i++) {
    formData.append('images', data.images[i]);
  }
  
  await fetch('/api/v1/reviews/with-images', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });
};
```

---

## Response Format

### Success Response
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }, // Response data
  "timestamp": "2025-08-12T19:25:00.000Z"
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description",
  "statusCode": 400,
  "timestamp": "2025-08-12T19:25:00.000Z"
}
```

### Paginated Response
```javascript
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...], // Array of items
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-08-12T19:25:00.000Z"
}
```

---

## Admin Endpoints 👑

### Analytics
```http
GET /analytics/dashboard
GET /analytics/sales?startDate=2025-01-01&endDate=2025-12-31
GET /analytics/products/top?limit=10
GET /analytics/users/growth
```

### Inventory Management
```http
GET /inventory/low-stock?threshold=10
POST /inventory/restock
PUT /inventory/{productId}/stock
```

### Order Management
```http
GET /orders/admin?status=PENDING&page=1&limit=10
PATCH /orders/{id}/status
GET /orders/admin/stats
```

---

## Migration Notes ⭐

### Breaking Changes
1. **Categories:** Remove `/admin` from category endpoints
   - ❌ Old: `GET /api/v1/admin/categories`
   - ✅ New: `GET /api/v1/categories`

2. **File Uploads:** Use new multipart endpoints for better performance
   - ✅ Products: Use `POST /products` with `multipart/form-data`
   - ✅ Reviews: Use `POST /reviews/with-images`
   - ✅ Profile: Use `PUT /users/profile/avatar`

### Backwards Compatibility
- All existing JSON endpoints remain functional
- URL-based image uploads still work alongside file uploads
- Admin protection is maintained through decorators, not URL paths

---

## Best Practices

### Error Handling
```javascript
try {
  const response = await fetch('/api/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  return result.data;
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

### File Upload Validation
```javascript
const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  return true;
};
```

### Authentication State Management
```javascript
// Store token securely
localStorage.setItem('auth_token', token);

// Add to all requests
const apiCall = (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  return fetch(`/api/v1${url}`, {
    ...options,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    }
  });
};
```

---

## Support

- **API Documentation:** Visit `/api/v1/docs` for interactive Swagger documentation
- **Error Codes:** Standard HTTP status codes with detailed error messages
- **Rate Limiting:** 100 requests per minute per IP
- **File Storage:** Supabase cloud storage with CDN delivery
