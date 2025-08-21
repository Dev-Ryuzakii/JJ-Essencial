# JJ Essential API Integration Guide

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.jjessential.com/api
```

## Authentication
All authenticated endpoints require a JWT token in the Authorization header.

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## Error Handling
All endpoints follow a consistent error response format:

```javascript
{
  "statusCode": number,    // HTTP status code
  "message": string,      // Error message
  "error": string        // Error type
}
```

## API Endpoints

### Authentication
#### Sign Up
```http
POST /auth/signup
```
Request:
```javascript
{
  "email": string,
  "password": string,
  "fullName": string
}
```
Response:
```javascript
{
  "access_token": string,
  "user": {
    "id": string,
    "email": string,
    "fullName": string,
    "role": string
  }
}
```

#### Sign In
```http
POST /auth/signin
```
Request:
```javascript
{
  "email": string,
  "password": string
}
```
Response: Same as signup

#### Reset Password
```http
POST /auth/reset-password
```
Request:
```javascript
{
  "email": string
}
```
Response:
```javascript
{
  "message": string
}
```

### Products

#### List Products
```http
GET /products
```
Query Parameters:
- page (number, default: 1)
- limit (number, default: 10)
- category (string, optional)
- search (string, optional)
- sortBy (string, optional: 'price', 'name', 'createdAt')
- order (string, optional: 'asc', 'desc')

Response:
```javascript
{
  "data": [
    {
      "id": string,
      "name": string,
      "description": string,
      "price": number,
      "stock": number,
      "images": string[],
      "category": {
        "id": string,
        "name": string
      }
    }
  ],
  "meta": {
    "total": number,
    "page": number,
    "lastPage": number,
    "hasNextPage": boolean
  }
}
```

#### Get Product Details
```http
GET /products/:id
```
Response:
```javascript
{
  "data": {
    "id": string,
    "name": string,
    "description": string,
    "price": number,
    "stock": number,
    "images": string[],
    "category": {
      "id": string,
      "name": string
    },
    "reviews": [
      {
        "id": string,
        "rating": number,
        "comment": string,
        "user": {
          "id": string,
          "fullName": string
        },
        "createdAt": string
      }
    ]
  }
}
```

### Categories

#### List Categories
```http
GET /categories
```
Response:
```javascript
{
  "data": [
    {
      "id": string,
      "name": string,
      "description": string,
      "image": string,
      "productCount": number
    }
  ]
}
```

### Orders

#### Create Order
```http
POST /orders
```
Request:
```javascript
{
  "items": [
    {
      "productId": string,
      "quantity": number
    }
  ],
  "deliveryAddress": {
    "address": string,
    "city": string,
    "state": string,
    "postalCode": string,
    "country": string,
    "phone": string
  }
}
```
Response:
```javascript
{
  "data": {
    "id": string,
    "totalAmount": number,
    "status": string,
    "items": [
      {
        "product": {
          "id": string,
          "name": string,
          "price": number
        },
        "quantity": number
      }
    ],
    "deliveryAddress": {
      "address": string,
      "city": string,
      "state": string,
      "postalCode": string,
      "country": string,
      "phone": string
    },
    "createdAt": string
  }
}
```

#### List User Orders
```http
GET /orders
```
Query Parameters:
- page (number, default: 1)
- limit (number, default: 10)
- status (string, optional: 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')

Response:
```javascript
{
  "data": [
    {
      "id": string,
      "totalAmount": number,
      "status": string,
      "items": [
        {
          "product": {
            "id": string,
            "name": string,
            "price": number
          },
          "quantity": number
        }
      ],
      "createdAt": string
    }
  ],
  "meta": {
    "total": number,
    "page": number,
    "lastPage": number
  }
}
```

### User Profile

#### Get Profile
```http
GET /users/profile
```
Response:
```javascript
{
  "data": {
    "id": string,
    "email": string,
    "fullName": string,
    "role": string,
    "createdAt": string,
    "updatedAt": string
  }
}
```

#### Update Profile
```http
PATCH /users/profile
```
Request:
```javascript
{
  "fullName": string
}
```
Response:
```javascript
{
  "data": {
    "id": string,
    "email": string,
    "fullName": string,
    "role": string,
    "updatedAt": string
  }
}
```

### Addresses

#### List Addresses
```http
GET /users/addresses
```
Response:
```javascript
{
  "data": [
    {
      "id": string,
      "address": string,
      "city": string,
      "state": string,
      "postalCode": string,
      "country": string,
      "phone": string,
      "isDefault": boolean
    }
  ]
}
```

#### Add Address
```http
POST /users/addresses
```
Request:
```javascript
{
  "address": string,
  "city": string,
  "state": string,
  "postalCode": string,
  "country": string,
  "phone": string,
  "isDefault": boolean
}
```
Response:
```javascript
{
  "data": {
    "id": string,
    "address": string,
    "city": string,
    "state": string,
    "postalCode": string,
    "country": string,
    "phone": string,
    "isDefault": boolean
  }
}
```

### Wishlist

#### Get Wishlist
```http
GET /wishlist
```
Response:
```javascript
{
  "data": [
    {
      "id": string,
      "product": {
        "id": string,
        "name": string,
        "price": number,
        "images": string[]
      }
    }
  ]
}
```

#### Add to Wishlist
```http
POST /wishlist
```
Request:
```javascript
{
  "productId": string
}
```
Response:
```javascript
{
  "message": "Product added to wishlist"
}
```

#### Remove from Wishlist
```http
DELETE /wishlist/:productId
```
Response:
```javascript
{
  "message": "Product removed from wishlist"
}
```

### Reviews

#### Add Review
```http
POST /products/:productId/reviews
```
Request:
```javascript
{
  "rating": number,
  "comment": string,
  "images": string[] // Optional
}
```
Response:
```javascript
{
  "data": {
    "id": string,
    "rating": number,
    "comment": string,
    "images": string[],
    "user": {
      "id": string,
      "fullName": string
    },
    "createdAt": string
  }
}
```

## WebSocket Events

### Real-time Order Updates
```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000');

// Authenticate
socket.emit('authenticate', { token: 'YOUR_JWT_TOKEN' });

// Listen for order updates
socket.on('order:update', (data) => {
  // data: {
  //   orderId: string,
  //   status: string,
  //   timestamp: string
  // }
});
```

## Frontend Integration Example

```typescript
// Example using axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// API methods
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  signin: (data) => api.post('/auth/signin', data),
  resetPassword: (email) => api.post('/auth/reset-password', { email }),
};

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
};

export const ordersApi = {
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
};
```

## Pagination Pattern
All paginated endpoints follow this pattern:

```javascript
{
  "data": T[],
  "meta": {
    "total": number,      // Total number of items
    "page": number,       // Current page
    "lastPage": number,   // Last page number
    "hasNextPage": boolean
  }
}
```

## Rate Limiting
- 100 requests per minute for authenticated endpoints
- 30 requests per minute for unauthenticated endpoints

## File Upload
For endpoints that accept file uploads:
- Use multipart/form-data
- Maximum file size: 5MB
- Supported formats: jpg, jpeg, png, gif
- Files are served from: `/uploads/{file-path}`

## Security Best Practices
1. Always use HTTPS in production
2. Store JWT token securely (HttpOnly cookies recommended)
3. Implement token refresh mechanism
4. Validate all user inputs
5. Handle expired tokens gracefully
