# Frontend Correction Guide

This guide provides the correct API integration patterns for the JJ-Essencial e-commerce backend based on the actual working implementation.

## Table of Contents
- [Authentication](#authentication)
- [Order Creation](#order-creation)
- [Order Retrieval](#order-retrieval)
- [Payment Integration](#payment-integration)
- [Common Issues & Solutions](#common-issues--solutions)
- [Complete Frontend Examples](#complete-frontend-examples)

## Authentication

### Sign In API
```typescript
// Correct API call
const signIn = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  // ✅ CORRECT: Token is in data.data.access_token
  const token = data.data.access_token;
  const user = data.data.user;
  
  return { token, user };
};
```

### ❌ Common Frontend Mistake:
```typescript
// WRONG: Looking for token in wrong location
const token = data.token; // This will be undefined
const token = data.data.token; // This will also be undefined
```

### ✅ Correct Response Structure:
```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "49e58d12-a61a-4fc5-bdba-725253990fb6",
      "email": "user@example.com",
      "role": "USER"
    }
  },
  "timestamp": "2025-09-12T10:35:55.419Z"
}
```

## Order Creation

### Correct Order Creation DTO
```typescript
interface CreateOrderDto {
  items: OrderItemDto[];
  deliveryAddress: DeliveryAddressDto;
  orderNotes?: string;
  savedAddressId?: string;
}

interface OrderItemDto {
  productId: string;
  quantity: number;
  // ❌ DO NOT include: price, totalAmount
}

interface DeliveryAddressDto {
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

### ✅ Correct Frontend Implementation:
```typescript
const createOrder = async (orderData: CreateOrderDto, token: string) => {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // ✅ Correct header format
    },
    body: JSON.stringify({
      items: [
        {
          productId: 'c0ab9f4b-1d30-4754-af70-257d60f7d361',
          quantity: 1,
          // ❌ DO NOT include price - backend calculates it
        }
      ],
      deliveryAddress: {
        phone: '+234801234567',
        address: '123 Lagos Street',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '100001',
        country: 'Nigeria'
      },
      orderNotes: 'Please handle with care'
    }),
  });

  const data = await response.json();
  return data.data; // Order object
};
```

### ❌ Common Frontend Mistakes:
```typescript
// WRONG: Including calculated fields
{
  items: [{
    productId: 'abc',
    quantity: 1,
    price: 9000,        // ❌ Backend calculates this
    totalAmount: 9000   // ❌ Backend calculates this
  }],
  totalAmount: 9000     // ❌ Backend calculates this
}

// WRONG: Missing required deliveryAddress
{
  items: [{ productId: 'abc', quantity: 1 }]
  // ❌ Missing deliveryAddress - will cause validation error
}
```

### ✅ Successful Response Structure:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "cdc60698-d9b9-4282-b8e5-f72144b4db2f",
    "userId": "49e58d12-a61a-4fc5-bdba-725253990fb6",
    "totalAmount": 9000,
    "status": "PENDING",
    "paymentRef": null,
    "receiptUrl": null,
    "deliveryPhone": "+234801234567",
    "deliveryAddress": "123 Lagos Street",
    "deliveryCity": "Lagos",
    "deliveryState": "Lagos",
    "deliveryPostal": "100001",
    "deliveryCountry": "Nigeria",
    "orderNotes": "Please handle with care",
    "createdAt": "2025-09-12T06:50:07.958966+00:00",
    "updatedAt": "2025-09-12T06:50:07.958966+00:00",
    "orderItems": [
      {
        "id": "93b20f94-caf3-4bdb-af9c-7e890f172194",
        "productId": "c0ab9f4b-1d30-4754-af70-257d60f7d361",
        "quantity": 1,
        "price": 9000,
        "product": {
          "id": "c0ab9f4b-1d30-4754-af70-257d60f7d361",
          "name": "Maximus Eletric kettle",
          "images": ["{\"id\":\"rtj572nywsr4vhl0v2b47\",\"url\":\"https://...\"}"]
        }
      }
    ]
  }
}
```

## Order Retrieval

### ✅ Correct Order Retrieval:
```typescript
const getOrder = async (orderId: string, token: string) => {
  const response = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.data; // Order with populated orderItems
};

// Usage in React
const [order, setOrder] = useState(null);

useEffect(() => {
  const fetchOrder = async () => {
    try {
      const orderData = await getOrder(orderId, token);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    }
  };

  fetchOrder();
}, [orderId, token]);
```

## Payment Integration

### Bank Transfer Payment
```typescript
const initiateBankTransfer = async (orderId: string, amount: number, token: string) => {
  const response = await fetch(`${API_BASE}/payments/bank-transfer/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId,
      amount,
      provider: 'manual_transfer',
      metadata: {
        customerName: 'Customer Name',
        customerEmail: 'customer@example.com',
        transferMethod: 'bank_transfer'
      }
    }),
  });

  const data = await response.json();
  return data.data; // Payment reference and transfer instructions
};
```

### Get Bank Accounts for Payment
```typescript
const getBankAccounts = async (token: string) => {
  const response = await fetch(`${API_BASE}/payments/bank-accounts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.data; // Array of bank accounts
};
```

## Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Problem**: API returns 401 even with token
```typescript
// ❌ WRONG: Missing Bearer prefix
headers: {
  'Authorization': token
}

// ✅ CORRECT: Include Bearer prefix
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Issue 2: Validation Errors
**Problem**: Getting validation errors for order creation
```typescript
// ❌ WRONG: Including calculated fields
{
  items: [{ 
    productId: 'abc', 
    quantity: 1, 
    price: 9000 // This causes validation error
  }]
}

// ✅ CORRECT: Only required fields
{
  items: [{ 
    productId: 'abc', 
    quantity: 1 
  }]
}
```

### Issue 3: Order Not Found
**Problem**: Created order returns 404 when retrieving
**Solution**: Ensure you're using the correct order ID from creation response
```typescript
// ✅ Correct: Get ID from response
const orderResponse = await createOrder(orderData, token);
const orderId = orderResponse.id; // Use this ID

// Then retrieve
const order = await getOrder(orderId, token);
```

## Complete Frontend Examples

### React Checkout Component
```tsx
import React, { useState } from 'react';

interface CheckoutFormData {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  deliveryAddress: {
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderNotes?: string;
}

const CheckoutForm: React.FC = () => {
  const [formData, setFormData] = useState<CheckoutFormData>({
    items: [{ productId: '', quantity: 1 }],
    deliveryAddress: {
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria'
    }
  });
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token'); // Note: access_token
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const data = await response.json();
      setOrder(data.data);
      
      // Redirect to payment or order confirmation
      // navigate(`/orders/${data.data.id}`);
      
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields for delivery address */}
      <input
        type="tel"
        placeholder="Phone"
        value={formData.deliveryAddress.phone}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          deliveryAddress: { ...prev.deliveryAddress, phone: e.target.value }
        }))}
        required
      />
      {/* More form fields... */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Order...' : 'Place Order'}
      </button>
    </form>
  );
};

export default CheckoutForm;
```

### Order Display Component
```tsx
import React, { useEffect, useState } from 'react';

interface OrderDisplayProps {
  orderId: string;
}

const OrderDisplay: React.FC<OrderDisplayProps> = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.REACT_APP_API_BASE}/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        setOrder(data.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <h2>Order #{order.id}</h2>
      <p>Status: {order.status}</p>
      <p>Total: ₦{order.totalAmount.toLocaleString()}</p>
      
      <h3>Items:</h3>
      {order.orderItems.map((item) => (
        <div key={item.id}>
          <p>{item.product.name}</p>
          <p>Quantity: {item.quantity}</p>
          <p>Price: ₦{item.price.toLocaleString()}</p>
        </div>
      ))}
      
      <h3>Delivery Address:</h3>
      <p>{order.deliveryAddress}, {order.deliveryCity}, {order.deliveryState}</p>
      <p>Phone: {order.deliveryPhone}</p>
    </div>
  );
};

export default OrderDisplay;
```

### Environment Variables
```env
# .env file
REACT_APP_API_BASE=http://localhost:3000/api/v1
```

### API Service Class
```typescript
// api/orderService.ts
class OrderService {
  private baseURL = process.env.REACT_APP_API_BASE;

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async createOrder(orderData: CreateOrderDto) {
    const response = await fetch(`${this.baseURL}/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }

    const data = await response.json();
    return data.data;
  }

  async getOrder(orderId: string) {
    const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch order');
    }

    const data = await response.json();
    return data.data;
  }

  async getBankAccounts() {
    const response = await fetch(`${this.baseURL}/payments/bank-accounts`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bank accounts');
    }

    const data = await response.json();
    return data.data;
  }

  async initiateBankTransfer(orderId: string, amount: number, metadata: any) {
    const response = await fetch(`${this.baseURL}/payments/bank-transfer/initiate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        orderId,
        amount,
        provider: 'manual_transfer',
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate payment');
    }

    const data = await response.json();
    return data.data;
  }
}

export const orderService = new OrderService();
```

## Summary

### Key Corrections for Frontend:
1. **Token Location**: Use `data.data.access_token` not `data.token`
2. **Order Creation**: Don't include `price` or `totalAmount` in request
3. **Required Fields**: Always include `deliveryAddress` object
4. **Authorization Header**: Use `Bearer ${token}` format
5. **Response Structure**: Data is always in `response.data.data`
6. **Error Handling**: Check response status and parse error messages

### Testing Your Integration:
1. Test authentication and token storage
2. Test order creation with minimal required fields
3. Test order retrieval immediately after creation
4. Test error scenarios (invalid product, missing fields)
5. Test payment flow integration

This guide should resolve all common frontend integration issues with the JJ-Essencial backend API.