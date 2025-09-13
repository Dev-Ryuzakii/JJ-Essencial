# Frontend Integration Guide: Order Number System

## Overview
The backend now generates unique 6-digit order numbers for every order. This guide helps frontend developers implement the necessary changes to display and use these order numbers throughout the application.

## Backend Changes Summary
- ✅ Each order now has a unique 6-digit `orderNumber` (e.g., "123456")
- ✅ API responses include the new `orderNumber` field
- ✅ Search functionality supports order number lookup
- ✅ Email templates updated to show order numbers

## API Response Changes

### Order Response Format (Updated)
```typescript
interface OrderResponse {
  id: string;                    // UUID (existing)
  orderNumber: string;           // ✅ NEW: 6-digit number (e.g., "123456")
  userId: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID';
  paymentRef?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  // ... other existing fields
  orderItems: OrderItem[];
}
```

### API Endpoints Affected
All order-related endpoints now return the `orderNumber` field:

- `GET /api/orders` - List orders (user/admin)
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status (admin)

## Frontend Implementation Tasks

### 1. Update TypeScript Interfaces

#### Update Order Interface
```typescript
// types/order.ts or interfaces/order.ts
export interface Order {
  id: string;
  orderNumber: string;        // ✅ ADD THIS FIELD
  userId: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID';
  paymentRef?: string;
  receiptUrl?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostal?: string;
  deliveryCountry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}
```

### 2. Update Order Display Components

#### Order List Component
```typescript
// components/OrderList.tsx or similar
interface OrderListProps {
  orders: Order[];
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  return (
    <div className="order-list">
      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            {/* ✅ DISPLAY ORDER NUMBER PROMINENTLY */}
            <h3>Order #{order.orderNumber}</h3>
            <span className="order-status">{order.status}</span>
          </div>
          <div className="order-details">
            <p>Total: ${order.totalAmount}</p>
            <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### Order Details Component
```typescript
// components/OrderDetails.tsx or similar
interface OrderDetailsProps {
  order: Order;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  return (
    <div className="order-details">
      <div className="order-header">
        {/* ✅ PROMINENTLY DISPLAY ORDER NUMBER */}
        <h1>Order #{order.orderNumber}</h1>
        <p className="order-id">ID: {order.id}</p>
      </div>
      
      <div className="order-info">
        <div className="info-row">
          <label>Order Number:</label>
          <span>{order.orderNumber}</span> {/* ✅ EASY TO COPY */}
        </div>
        <div className="info-row">
          <label>Status:</label>
          <span className={`status-${order.status.toLowerCase()}`}>
            {order.status}
          </span>
        </div>
        <div className="info-row">
          <label>Total Amount:</label>
          <span>${order.totalAmount}</span>
        </div>
        <div className="info-row">
          <label>Order Date:</label>
          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      {/* Order items */}
      <div className="order-items">
        {order.orderItems.map((item) => (
          <div key={item.id} className="order-item">
            {/* Existing order item display */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Update Search Functionality

#### Order Search Component
```typescript
// components/OrderSearch.tsx or similar
const OrderSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'orderNumber' | 'orderId' | 'paymentRef'>('orderNumber');

  const handleSearch = async () => {
    try {
      // ✅ BACKEND SUPPORTS SEARCHING BY ORDER NUMBER
      const response = await fetch(`/api/orders?search=${searchTerm}`);
      const data = await response.json();
      // Handle search results
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="order-search">
      <div className="search-controls">
        <select 
          value={searchType} 
          onChange={(e) => setSearchType(e.target.value as any)}
        >
          <option value="orderNumber">Order Number</option>
          <option value="orderId">Order ID</option>
          <option value="paymentRef">Payment Reference</option>
        </select>
        
        <input
          type="text"
          placeholder={
            searchType === 'orderNumber' 
              ? "Enter 6-digit order number (e.g., 123456)"
              : searchType === 'orderId'
              ? "Enter order ID"
              : "Enter payment reference"
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <button onClick={handleSearch}>Search</button>
      </div>
    </div>
  );
};
```

### 4. Update Admin Components

#### Admin Order Table
```typescript
// components/admin/OrderTable.tsx or similar
const AdminOrderTable: React.FC<{ orders: Order[] }> = ({ orders }) => {
  return (
    <table className="admin-order-table">
      <thead>
        <tr>
          <th>Order #</th> {/* ✅ CHANGED FROM "ID" TO "Order #" */}
          <th>Customer</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>
              {/* ✅ DISPLAY ORDER NUMBER INSTEAD OF UUID */}
              <span className="order-number">#{order.orderNumber}</span>
              <small className="order-id">{order.id}</small>
            </td>
            <td>{order.user?.fullName || order.user?.email}</td>
            <td>${order.totalAmount}</td>
            <td>
              <span className={`status-badge status-${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </td>
            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
              <button onClick={() => viewOrder(order.id)}>View</button>
              <button onClick={() => updateStatus(order.id)}>Update</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### 5. Update Customer Order History

#### Customer Order History Component
```typescript
// components/customer/OrderHistory.tsx or similar
const CustomerOrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  return (
    <div className="order-history">
      <h2>Your Orders</h2>
      
      {orders.map((order) => (
        <div key={order.id} className="order-summary">
          <div className="order-header">
            {/* ✅ CUSTOMER-FRIENDLY ORDER NUMBER */}
            <h3>Order #{order.orderNumber}</h3>
            <span className="order-date">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="order-summary-details">
            <p className="order-total">${order.totalAmount}</p>
            <p className="order-status">Status: {order.status}</p>
            <p className="item-count">
              {order.orderItems.length} item(s)
            </p>
          </div>
          
          <div className="order-actions">
            <button onClick={() => viewOrderDetails(order.id)}>
              View Details
            </button>
            {order.status === 'PAID' && (
              <button onClick={() => trackOrder(order.orderNumber)}>
                Track Order
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 6. Update Order Confirmation Page

#### Order Confirmation Component
```typescript
// components/OrderConfirmation.tsx or similar
interface OrderConfirmationProps {
  order: Order;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ order }) => {
  return (
    <div className="order-confirmation">
      <div className="success-header">
        <h1>✅ Order Confirmed!</h1>
        {/* ✅ PROMINENTLY DISPLAY ORDER NUMBER */}
        <div className="order-number-display">
          <h2>Order #{order.orderNumber}</h2>
          <p>Your order number for reference</p>
        </div>
      </div>
      
      <div className="confirmation-details">
        <div className="reference-info">
          <h3>Keep this information:</h3>
          <div className="reference-box">
            <p><strong>Order Number:</strong> {order.orderNumber}</p>
            <p><strong>Order ID:</strong> {order.id}</p>
            <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
          </div>
        </div>
        
        <div className="next-steps">
          <h3>What happens next?</h3>
          <ul>
            <li>You'll receive an email confirmation at your registered email</li>
            <li>Use order number <strong>#{order.orderNumber}</strong> for any inquiries</li>
            <li>Track your order status in your account</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
```

### 7. Update CSS Styles

#### Order Number Styling
```css
/* styles/order.css or similar */

/* Order number display */
.order-number {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 1.2em;
  color: #2196F3;
  background: #f0f8ff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #2196F3;
}

/* Order confirmation page */
.order-number-display {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-radius: 8px;
  margin: 20px 0;
}

.order-number-display h2 {
  font-size: 2.5em;
  margin: 0;
  font-family: 'Courier New', monospace;
}

/* Reference box */
.reference-box {
  background: #f9f9f9;
  border: 2px dashed #ccc;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
}

.reference-box p {
  margin: 5px 0;
  font-family: 'Courier New', monospace;
}

/* Admin table styling */
.admin-order-table .order-number {
  display: block;
  margin-bottom: 4px;
}

.admin-order-table .order-id {
  color: #666;
  font-size: 0.8em;
  font-family: monospace;
}

/* Status badges */
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
  text-transform: uppercase;
}

.status-pending { background: #fff3cd; color: #856404; }
.status-paid { background: #d4edda; color: #155724; }
.status-completed { background: #d1ecf1; color: #0c5460; }
.status-cancelled { background: #f8d7da; color: #721c24; }
```

### 8. Update API Service Functions

#### Order API Service
```typescript
// services/orderService.ts or api/orders.ts
export const orderService = {
  // Get orders (updated response includes orderNumber)
  async getOrders(params?: { 
    page?: number; 
    limit?: number; 
    search?: string;  // ✅ Can search by order number
  }) {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`/api/orders?${query}`);
    return response.json();
  },

  // Get order by ID
  async getOrder(orderId: string) {
    const response = await fetch(`/api/orders/${orderId}`);
    return response.json();
  },

  // ✅ NEW: Search by order number specifically
  async searchByOrderNumber(orderNumber: string) {
    const response = await fetch(`/api/orders?search=${orderNumber}`);
    return response.json();
  },

  // Create order (response includes orderNumber)
  async createOrder(orderData: CreateOrderRequest) {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return response.json();
  }
};
```

## Mobile App Considerations

### React Native Components
```typescript
// components/OrderCard.tsx (React Native)
import { View, Text, StyleSheet } from 'react-native';

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        {/* ✅ MOBILE-FRIENDLY ORDER NUMBER DISPLAY */}
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <Text style={styles.orderStatus}>{order.status}</Text>
      </View>
      <Text style={styles.orderAmount}>${order.totalAmount}</Text>
      <Text style={styles.orderDate}>
        {new Date(order.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    elevation: 2,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    fontFamily: 'monospace',
  },
  // ... other styles
});
```

## Testing Checklist

### Frontend Testing Tasks
- [ ] ✅ Order number displays in order lists
- [ ] ✅ Order number shows in order details
- [ ] ✅ Order number appears in admin tables
- [ ] ✅ Search by order number works
- [ ] ✅ Order confirmation shows order number
- [ ] ✅ Customer order history displays order numbers
- [ ] ✅ Mobile app shows order numbers correctly
- [ ] ✅ Copy order number functionality works
- [ ] ✅ CSS styling looks professional
- [ ] ✅ TypeScript interfaces updated

### User Experience Tests
- [ ] Customer can easily find their order number
- [ ] Order number is copyable for customer service
- [ ] Admin can search orders by 6-digit number
- [ ] Order confirmation email references match UI
- [ ] Mobile experience is user-friendly

## Migration Notes

### Handling Existing Orders
Existing orders in your system won't have order numbers initially. Consider:

1. **Display Logic**: Use fallback to order ID if `orderNumber` is null
```typescript
const displayOrderNumber = order.orderNumber || order.id.slice(-6).toUpperCase();
```

2. **Migration Notice**: Show users when old orders use different numbering
```typescript
{!order.orderNumber && (
  <p className="migration-notice">
    This is an older order. Reference ID: {order.id}
  </p>
)}
```

## Customer Service Guide

### For Customer Support Representatives
- **Primary Reference**: Always use the 6-digit order number (e.g., #123456)
- **Backup Reference**: Use full order ID if order number unavailable
- **Search**: Use order number in admin search for fastest lookup
- **Communication**: Reference order numbers in all customer communications

## Implementation Priority

### Phase 1 (High Priority)
1. Update TypeScript interfaces
2. Update order display components
3. Update order confirmation page
4. Update admin order table

### Phase 2 (Medium Priority)
1. Update search functionality
2. Update customer order history
3. Add CSS styling
4. Update API service functions

### Phase 3 (Enhancement)
1. Mobile app updates
2. Advanced search filters
3. Order number export functionality
4. Customer service tools

This guide ensures the frontend properly displays and utilizes the new 6-digit order number system while maintaining a professional and user-friendly experience.