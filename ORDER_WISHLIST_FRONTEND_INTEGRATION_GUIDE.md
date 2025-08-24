# Orders & Wishlist Frontend Integration Guide

## Overview
This document provides comprehensive integration guidance for the Orders and Wishlist APIs in the e-commerce backend. Both systems require JWT authentication and follow consistent response patterns.

## Authentication Requirements

All endpoints require JWT authentication:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Orders Management

### API Base URL
```
/api/v1/orders
```

### Available Endpoints

#### 1. Create Order - `POST /orders`

**Request Body:**
```typescript
interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  deliveryAddress: {
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderNotes?: string;
  savedAddressId?: string; // Optional: Use saved address instead
}
```

**Example Request:**
```javascript
const createOrder = async (orderData) => {
  try {
    const response = await fetch('/api/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            productId: "10c8dd30-315f-43a1-910b-1b01b3363484",
            quantity: 2
          }
        ],
        deliveryAddress: {
          phone: "+1234567890",
          address: "123 Main Street",
          city: "New York",
          state: "NY",
          postalCode: "10001",
          country: "United States"
        },
        orderNotes: "Please deliver to front door"
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order-uuid",
    "userId": "user-uuid",
    "totalAmount": 2462,
    "status": "PENDING",
    "paymentRef": "payment-reference",
    "receiptUrl": null,
    "deliveryPhone": "+1234567890",
    "deliveryAddress": "123 Main Street",
    "deliveryCity": "New York",
    "deliveryState": "NY",
    "deliveryPostal": "10001",
    "deliveryCountry": "United States",
    "orderNotes": "Please deliver to front door",
    "createdAt": "2025-08-24T10:00:00.000Z",
    "updatedAt": "2025-08-24T10:00:00.000Z",
    "orderItems": [
      {
        "id": "item-uuid",
        "productId": "product-uuid",
        "quantity": 2,
        "price": 1231,
        "product": {
          "id": "product-uuid",
          "name": "Blender3",
          "price": 1231,
          "images": ["image-url"]
        }
      }
    ]
  },
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

#### 2. Get User Orders - `GET /orders`

**Query Parameters:**
```typescript
interface OrdersQuery {
  page?: number;      // Default: 1
  limit?: number;     // Default: 10
  search?: string;    // Search in order ID, product names
  sortBy?: string;    // Sort field (createdAt, totalAmount, status)
  sortOrder?: 'asc' | 'desc'; // Default: desc
}
```

**Example Request:**
```javascript
const getUserOrders = async (page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const response = await fetch(`/api/v1/orders?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get orders error:', error);
    throw error;
  }
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "order-uuid",
      "userId": "user-uuid",
      "totalAmount": 2462,
      "status": "PENDING",
      "paymentRef": "payment-ref",
      "receiptUrl": null,
      "deliveryAddress": "123 Main Street",
      "deliveryCity": "New York",
      "createdAt": "2025-08-24T10:00:00.000Z",
      "orderItems": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

#### 3. Get Order Details - `GET /orders/:id`

**Example Request:**
```javascript
const getOrderDetails = async (orderId) => {
  try {
    const response = await fetch(`/api/v1/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get order details error:', error);
    throw error;
  }
};
```

#### 4. Get Order Statistics - `GET /orders/stats`

**Example Request:**
```javascript
const getOrderStats = async () => {
  try {
    const response = await fetch('/api/v1/orders/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get order stats error:', error);
    throw error;
  }
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Order statistics retrieved successfully",
  "data": {
    "totalOrders": 25,
    "totalAmount": 125000,
    "pendingOrders": 5,
    "completedOrders": 18,
    "cancelledOrders": 2,
    "averageOrderValue": 5000
  },
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

#### 5. Download Receipt - `GET /orders/:id/receipt`

**Note:** Currently returns a placeholder message. PDF generation will be implemented.

```javascript
const downloadReceipt = async (orderId) => {
  try {
    const response = await fetch(`/api/v1/orders/${orderId}/receipt`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Download receipt error:', error);
    throw error;
  }
};
```

### Order Status Values
- `PENDING` - Order created, awaiting payment
- `PAID` - Payment confirmed
- `COMPLETED` - Order fulfilled and delivered
- `CANCELLED` - Order cancelled

---

## Wishlist Management

### API Base URL
```
/api/v1/wishlist
```

### Available Endpoints

#### 1. Get User Wishlist - `GET /wishlist`

**Example Request:**
```javascript
const getUserWishlist = async () => {
  try {
    const response = await fetch('/api/v1/wishlist', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get wishlist error:', error);
    throw error;
  }
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Wishlist retrieved successfully",
  "data": [
    {
      "id": "wishlist-item-uuid",
      "userId": "user-uuid",
      "productId": "product-uuid",
      "createdAt": "2025-08-24T10:00:00.000Z",
      "product": {
        "id": "product-uuid",
        "name": "Blender3",
        "price": 1231,
        "images": ["image-url"],
        "stock": 4,
        "avgRating": 4.5,
        "isActive": true
      }
    }
  ],
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

#### 2. Add to Wishlist - `POST /wishlist`

**Request Body:**
```typescript
interface AddToWishlistRequest {
  productId: string;
}
```

**Example Request:**
```javascript
const addToWishlist = async (productId) => {
  try {
    const response = await fetch('/api/v1/wishlist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Add to wishlist error:', error);
    throw error;
  }
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Product added to wishlist successfully",
  "data": {
    "id": "wishlist-item-uuid",
    "userId": "user-uuid",
    "productId": "product-uuid",
    "createdAt": "2025-08-24T10:00:00.000Z",
    "product": {
      "id": "product-uuid",
      "name": "Blender3",
      "price": 1231,
      "images": ["image-url"],
      "stock": 4,
      "avgRating": 4.5,
      "isActive": true
    }
  },
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

#### 3. Remove from Wishlist - `DELETE /wishlist/:productId`

**Example Request:**
```javascript
const removeFromWishlist = async (productId) => {
  try {
    const response = await fetch(`/api/v1/wishlist/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Returns 204 No Content on success
    return response.ok;
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    throw error;
  }
};
```

#### 4. Check if Product is in Wishlist - `GET /wishlist/check/:productId`

**Example Request:**
```javascript
const isInWishlist = async (productId) => {
  try {
    const response = await fetch(`/api/v1/wishlist/check/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Check wishlist error:', error);
    throw error;
  }
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Wishlist status checked successfully",
  "data": {
    "inWishlist": true
  },
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

#### 5. Get Wishlist Count - `GET /wishlist/count`

**Example Request:**
```javascript
const getWishlistCount = async () => {
  try {
    const response = await fetch('/api/v1/wishlist/count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get wishlist count error:', error);
    throw error;
  }
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Wishlist count retrieved successfully",
  "data": {
    "count": 5
  },
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

---

## React Component Examples

### Order Management Component

```typescript
import React, { useState, useEffect } from 'react';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      images: string[];
    };
  }>;
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/v1/orders?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();
      setOrders(result.data);
      setTotal(result.pagination.total);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600';
      case 'PAID': return 'text-blue-600';
      case 'COMPLETED': return 'text-green-600';
      case 'CANCELLED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="order-history">
      <h2 className="text-2xl font-bold mb-6">Order History</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₦{order.totalAmount.toLocaleString()}</p>
                  <p className={`text-sm ${getStatusColor(order.status)}`}>
                    {order.status}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-2">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 py-2">
                    {item.product.images[0] && (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × ₦{item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      <div className="mt-6 flex justify-center space-x-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-1">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={orders.length < 10}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default OrderHistory;
```

### Wishlist Component

```typescript
import React, { useState, useEffect } from 'react';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    avgRating: number;
    isActive: boolean;
  };
}

const Wishlist: React.FC = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/v1/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const result = await response.json();
      setWishlist(result.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/v1/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWishlist(prev => prev.filter(item => item.productId !== productId));
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const addToCart = async (productId: string) => {
    // Implement add to cart functionality
    console.log('Add to cart:', productId);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  if (loading) return <div>Loading wishlist...</div>;

  return (
    <div className="wishlist">
      <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
      
      {wishlist.length === 0 ? (
        <div className="text-center py-8">
          <p>Your wishlist is empty.</p>
          <p className="text-sm text-gray-600">Add products you love to see them here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="relative">
                {item.product.images[0] && (
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name}
                    className="w-full h-48 object-cover rounded mb-3"
                  />
                )}
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow"
                >
                  ❤️
                </button>
              </div>
              
              <h3 className="font-semibold mb-2">{item.product.name}</h3>
              <p className="text-lg font-bold text-blue-600 mb-2">
                ₦{item.product.price.toLocaleString()}
              </p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  ⭐ {item.product.avgRating.toFixed(1)}
                </span>
                <span className={`text-sm ${item.product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => addToCart(item.productId)}
                  disabled={item.product.stock === 0}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  className="px-3 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
```

### Wishlist Button Component

```typescript
import React, { useState, useEffect } from 'react';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ productId, className = '' }) => {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch(`/api/v1/wishlist/check/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setInWishlist(result.data.inWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        // Redirect to login or show login modal
        return;
      }

      if (inWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/v1/wishlist/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setInWishlist(false);
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/v1/wishlist', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId })
        });

        if (response.ok) {
          setInWishlist(true);
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkWishlistStatus();
  }, [productId]);

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`p-2 rounded-full transition-colors ${
        inWishlist 
          ? 'text-red-500 bg-red-50 hover:bg-red-100' 
          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
      } ${className}`}
    >
      {inWishlist ? '❤️' : '🤍'}
    </button>
  );
};

export default WishlistButton;
```

---

## Error Handling

Both Orders and Wishlist APIs use consistent error responses:

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "productId",
      "message": "productId should not be empty"
    }
  ],
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Order not found",
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

### Error Handling Utility

```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        break;
      case 400:
        // Show validation errors
        if (data.errors) {
          data.errors.forEach((err: any) => {
            console.error(`${err.field}: ${err.message}`);
          });
        }
        break;
      case 404:
        console.error('Resource not found');
        break;
      default:
        console.error('An error occurred:', data.message);
    }
  } else {
    console.error('Network error:', error.message);
  }
};
```

---

## Admin-Only Features

### Order Status Updates (Admin Only)

Admins can update order status using:

**PATCH /orders/:id/status**

```javascript
const updateOrderStatus = async (orderId, status) => {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status }) // PENDING, PAID, COMPLETED, CANCELLED
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Update order status error:', error);
    throw error;
  }
};
```

---

## Summary

### Orders API Features:
- ✅ Create orders with delivery address
- ✅ View order history with pagination
- ✅ Get order details
- ✅ Order statistics
- ✅ Admin order status management
- 🔄 Receipt download (coming soon)

### Wishlist API Features:
- ✅ Add/remove products from wishlist
- ✅ View full wishlist with product details
- ✅ Check if product is in wishlist
- ✅ Get wishlist count
- ✅ Real-time wishlist status

### Key Implementation Notes:
1. All endpoints require JWT authentication
2. Consistent response format with SuccessResponseDto
3. Proper error handling for all scenarios
4. Admin vs User role-based access control
5. Pagination support for order history
6. Product details included in responses

This guide provides everything needed to implement comprehensive Orders and Wishlist functionality in your React frontend! 🚀
