# JJ Essential Admin API Reference

## Overview
This document provides comprehensive API documentation for frontend integration with the JJ Essential admin system. All admin endpoints require authentication and admin role privileges.

## Authentication
All admin API endpoints require:
- **Bearer Token**: JWT token from admin login
- **Admin Role**: User must have admin privileges
- **Base URL**: `https://your-api-domain.com/admin`

### Headers Required
```javascript
{
  "Authorization": "Bearer <your-jwt-token>",
  "Content-Type": "application/json"
}
```

## API Endpoints Structure

### 🏠 Dashboard & Analytics

#### Get Dashboard Statistics
```http
GET /admin/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totalUsers": 1250,
    "totalOrders": 875,
    "totalProducts": 340,
    "totalRevenue": 125000.50,
    "pendingOrders": 15,
    "lowStockProducts": 8,
    "newUsersToday": 12,
    "ordersToday": 5,
    "revenueToday": 2500.00,
    "monthlyGrowth": {
      "users": 15.2,
      "orders": 8.5,
      "revenue": 12.3
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Get Sales Analytics
```http
GET /admin/analytics/sales?startDate=2024-01-01&endDate=2024-01-31&groupBy=daily
```

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string  
- `groupBy` (optional): 'daily' | 'weekly' | 'monthly'

#### Get User Analytics
```http
GET /admin/analytics/users?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Inventory Analytics
```http
GET /admin/analytics/inventory
```

---

### 👥 User Management

#### Get All Users (Paginated)
```http
GET /admin/users?page=1&limit=10&search=john&role=user&isActive=true&sortBy=created_at&sortOrder=DESC
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by email or full name
- `role` (optional): 'user' | 'admin'
- `isActive` (optional): boolean
- `sortBy` (optional): Field to sort by (default: 'created_at')
- `sortOrder` (optional): 'ASC' | 'DESC' (default: 'DESC')

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid-123",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "last_login": "2024-01-15T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get User By ID
```http
GET /admin/users/{userId}
```

#### Update User Status
```http
PUT /admin/users/{userId}/status
Content-Type: application/json

{
  "isActive": false
}
```

#### Delete User
```http
DELETE /admin/users/{userId}
```

#### Bulk Update User Status
```http
PUT /admin/users/bulk/status
Content-Type: application/json

{
  "ids": ["uuid-1", "uuid-2", "uuid-3"],
  "isActive": false
}
```

---

### 📦 Order Management

#### Get All Orders (Paginated)
```http
GET /admin/orders?page=1&limit=10&status=PENDING&paymentStatus=PAID&dateFrom=2024-01-01&dateTo=2024-01-31
```

**Query Parameters:**
- `page`, `limit`, `sortBy`, `sortOrder`: Same as users
- `search` (optional): Search by order ID
- `status` (optional): 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
- `paymentStatus` (optional): 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string
- `userId` (optional): Filter by specific user

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "order-uuid-123",
      "status": "PENDING",
      "payment_status": "PAID",
      "total_amount": 299.99,
      "created_at": "2024-01-15T10:30:00.000Z",
      "profile": {
        "id": "user-uuid",
        "email": "customer@example.com",
        "full_name": "Jane Smith"
      },
      "order_items": [
        {
          "id": "item-uuid",
          "quantity": 2,
          "price": 149.99,
          "products": {
            "id": "product-uuid",
            "name": "Premium Product",
            "sku": "PRD-001"
          }
        }
      ]
    }
  ],
  "pagination": { /* same structure as users */ }
}
```

#### Get Order By ID
```http
GET /admin/orders/{orderId}
```

#### Update Order Status
```http
PUT /admin/orders/{orderId}/status
Content-Type: application/json

{
  "status": "SHIPPED",
  "notes": "Package dispatched via DHL",
  "trackingNumber": "DHL123456789",
  "location": "Lagos Distribution Center"
}
```

---

### 🛍️ Product Management

#### Get All Products (Paginated)
```http
GET /admin/products?page=1&limit=10&search=phone&categoryId=cat-uuid&isActive=true&lowStock=true
```

**Query Parameters:**
- Standard pagination parameters
- `search` (optional): Search by name, description, or SKU
- `categoryId` (optional): Filter by category
- `isActive` (optional): Filter by active status
- `lowStock` (optional): Show only low stock products

#### Create Product
```http
POST /admin/products
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "price": 299.99,
  "stock": 100,
  "sku": "PRD-002",
  "categoryId": "category-uuid",
  "images": ["https://example.com/image1.jpg"],
  "lowStockThreshold": 10,
  "isActive": true
}
```

#### Update Product
```http
PUT /admin/products/{productId}
Content-Type: application/json

{
  "name": "Updated Product Name",
  "price": 349.99,
  "stock": 75
}
```

#### Delete Product
```http
DELETE /admin/products/{productId}
```

---

### 🏷️ Category Management

#### Get All Categories
```http
GET /admin/categories?includeInactive=false&search=electronics&sortBy=name&sortOrder=ASC
```

#### Create Category
```http
POST /admin/categories
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "slug": "electronics",
  "parentId": null,
  "imageUrl": "https://example.com/category.jpg",
  "sortOrder": 1,
  "isActive": true
}
```

#### Update Category
```http
PUT /admin/categories/{categoryId}
Content-Type: application/json

{
  "name": "Updated Category Name",
  "description": "Updated description",
  "sortOrder": 2
}
```

#### Delete Category
```http
DELETE /admin/categories/{categoryId}
```

---

### 📊 Reports & Export

#### Generate Reports
```http
GET /admin/reports/users?format=csv&startDate=2024-01-01&endDate=2024-01-31
GET /admin/reports/sales?format=pdf
GET /admin/reports/inventory?format=excel
```

**Query Parameters:**
- `format` (optional): 'csv' | 'pdf' | 'excel' (default: 'csv')
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

#### Export Data
```http
GET /admin/export/users?format=csv&fields=email,full_name,created_at
GET /admin/export/orders?format=excel&startDate=2024-01-01
GET /admin/export/products?format=csv
```

---

### ⚙️ Settings Management

#### Get Settings
```http
GET /admin/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "siteName": "JJ Essential",
    "siteDescription": "Your premium e-commerce destination",
    "contactEmail": "contact@jjessential.com",
    "currency": "NGN",
    "timezone": "Africa/Lagos",
    "logoUrl": "https://example.com/logo.png",
    "allowRegistration": true,
    "requireEmailVerification": true,
    "defaultUserRole": "user"
  }
}
```

#### Update Settings
```http
PUT /admin/settings
Content-Type: application/json

{
  "siteName": "JJ Essential Store",
  "contactEmail": "admin@jjessential.com",
  "allowRegistration": false
}
```

---

### 📝 Audit Logs

#### Get Audit Logs
```http
GET /admin/audit-logs?page=1&limit=10&search=user_created&sortBy=created_at&sortOrder=DESC
```

---

## Frontend Integration Examples

### React/Next.js Integration

#### 1. Admin API Service
```javascript
// services/adminApi.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/admin';

class AdminApiService {
  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Users
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users?${queryString}`);
  }

  async updateUserStatus(userId, isActive) {
    return this.request(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  // Orders
  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/orders?${queryString}`);
  }

  async updateOrderStatus(orderId, statusData) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  // Products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId, productData) {
    return this.request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }
}

export default new AdminApiService();
```

#### 2. React Hook for Admin Data
```javascript
// hooks/useAdminData.js
import { useState, useEffect } from 'react';
import adminApi from '../services/adminApi';

export function useAdminUsers(params = {}) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUsers(params);
        setUsers(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [JSON.stringify(params)]);

  return { users, pagination, loading, error, refetch: () => fetchUsers() };
}

export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getDashboardStats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}
```

#### 3. Dashboard Component Example
```jsx
// components/AdminDashboard.jsx
import React from 'react';
import { useDashboardStats } from '../hooks/useAdminData';

export function AdminDashboard() {
  const { stats, loading } = useDashboardStats();

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{stats?.totalUsers || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{stats?.totalOrders || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>₦{stats?.totalRevenue?.toLocaleString() || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>Pending Orders</h3>
          <p>{stats?.pendingOrders || 0}</p>
        </div>
      </div>

      <div className="growth-metrics">
        <h3>Monthly Growth</h3>
        <p>Users: +{stats?.monthlyGrowth?.users || 0}%</p>
        <p>Orders: +{stats?.monthlyGrowth?.orders || 0}%</p>
        <p>Revenue: +{stats?.monthlyGrowth?.revenue || 0}%</p>
      </div>
    </div>
  );
}
```

#### 4. User Management Component
```jsx
// components/UserManagement.jsx
import React, { useState } from 'react';
import { useAdminUsers } from '../hooks/useAdminData';
import adminApi from '../services/adminApi';

export function UserManagement() {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const { users, pagination, loading, error, refetch } = useAdminUsers(filters);

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await adminApi.updateUserStatus(userId, !currentStatus);
      refetch(); // Refresh the list
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  return (
    <div className="user-management">
      <h1>User Management</h1>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Search users..."
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        <select onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading && <div>Loading users...</div>}
      {error && <div>Error: {error}</div>}

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.is_active ? 'Active' : 'Inactive'}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => handleStatusToggle(user.id, user.is_active)}
                  className={user.is_active ? 'btn-deactivate' : 'btn-activate'}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && (
        <div className="pagination">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          
          <span>Page {pagination.page} of {pagination.pages}</span>
          
          <button
            disabled={!pagination.hasNext}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (not admin role)
- `404` - Not Found
- `500` - Internal Server Error

---

## Best Practices

### 1. Token Management
```javascript
// Handle token expiry
const handleApiCall = async (apiFunction) => {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.statusCode === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    throw error;
  }
};
```

### 2. Loading States
Always implement loading states for better UX:
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### 3. Optimistic Updates
For better UX, update UI immediately and rollback if API fails:
```javascript
const handleStatusUpdate = async (userId, newStatus) => {
  // Update UI immediately
  updateUserInState(userId, { is_active: newStatus });
  
  try {
    await adminApi.updateUserStatus(userId, newStatus);
  } catch (error) {
    // Rollback on error
    updateUserInState(userId, { is_active: !newStatus });
    showErrorMessage('Failed to update user status');
  }
};
```

### 4. Data Validation
Always validate data before sending to API:
```javascript
const validateProductData = (data) => {
  const errors = {};
  
  if (!data.name?.trim()) errors.name = 'Name is required';
  if (!data.price || data.price <= 0) errors.price = 'Valid price is required';
  if (!data.stock || data.stock < 0) errors.stock = 'Valid stock quantity is required';
  
  return { isValid: Object.keys(errors).length === 0, errors };
};
```

---

## Security Considerations

1. **Always use HTTPS** in production
2. **Validate admin role** on every request
3. **Implement CSRF protection** for state-changing operations
4. **Rate limiting** is already implemented (check API responses for headers)
5. **Input sanitization** on frontend before sending to API
6. **Secure token storage** (consider httpOnly cookies for enhanced security)

---

This documentation provides a complete reference for integrating with the JJ Essential admin API. All endpoints are fully functional and ready for frontend implementation.
