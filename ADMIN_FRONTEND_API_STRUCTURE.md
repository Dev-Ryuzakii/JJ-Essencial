# JJ Essential Admin Frontend API Structure

## 📋 Table of Contents
1. [Admin Authentication APIs](#admin-authentication-apis)
2. [Authentication & Setup](#authentication--setup)
3. [Dashboard APIs](#dashboard-apis)
4. [User Management APIs](#user-management-apis)
5. [Order Management APIs](#order-management-apis)
6. [Product Management APIs](#product-management-apis)
7. [Category Management APIs](#category-management-apis)
8. [Inventory Management APIs](#inventory-management-apis)
9. [Analytics APIs](#analytics-apis)
10. [Reports & Export APIs](#reports--export-apis)
11. [Settings APIs](#settings-apis)
12. [Customer Support APIs](#customer-support-apis)
13. [Review Management APIs](#review-management-apis)
14. [Payment Management APIs](#payment-management-apis)
15. [File Upload & Media APIs](#file-upload--media-apis)
16. [Notification APIs](#notification-apis)
17. [Audit Log APIs](#audit-log-apis)
18. [Bulk Operations APIs](#bulk-operations-apis)
19. [Search & Filter APIs](#search--filter-apis)
20. [Admin Profile APIs](#admin-profile-apis)
21. [Frontend Implementation Examples](#frontend-implementation-examples)
22. [Error Handling & Status Codes](#error-handling--status-codes)

---

## 🔐 Admin Authentication APIs

### 1. Admin Login
**Endpoint:** `POST /auth/admin/signin`

**Request Body:**
```json
{
  "email": "admin@jjessential.com",
  "password": "your-admin-password"
}
```

**Frontend Implementation:**
```javascript
const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE}/auth/admin/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      // Store admin token
      localStorage.setItem('adminToken', data.data.access_token);
      localStorage.setItem('adminUser', JSON.stringify(data.data.user));
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    throw new Error('Login failed: ' + error.message);
  }
};

// Login Component
const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await adminLogin(credentials.email, credentials.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Admin Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="email"
          value={credentials.email}
          onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Admin Email"
          required
        />
        
        <input
          type="password"
          value={credentials.password}
          onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
          placeholder="Password"
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
```

**Response:**
```json
{
  "success": true,
  "message": "Admin signed in successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin-uuid",
      "email": "admin@jjessential.com",
      "role": "admin",
      "full_name": "Admin User"
    }
  }
}
```

### 2. Admin Token Validation
**Endpoint:** `GET /auth/admin/validate`

```javascript
const validateAdminToken = async () => {
  const token = localStorage.getItem('adminToken');
  
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/admin/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch {
    return false;
  }
};

// Auth Guard Hook
const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const user = localStorage.getItem('adminUser');

      if (token && user) {
        const isValid = await validateAdminToken();
        
        if (isValid) {
          setIsAuthenticated(true);
          setAdminUser(JSON.parse(user));
        } else {
          // Token expired, clear storage
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  return { isAuthenticated, loading, adminUser, logout };
};
```

### 3. Admin Logout
**Endpoint:** `POST /auth/admin/signout`

```javascript
const adminLogout = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    
    if (token) {
      await fetch(`${API_BASE}/auth/admin/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  }
};

// Logout Component
const AdminLogout = () => {
  const { logout } = useAdminAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await adminLogout();
      logout();
    }
  };

  return (
    <button onClick={handleLogout} className="logout-btn">
      Logout
    </button>
  );
};
```

### 4. Admin Password Change
**Endpoint:** `PUT /auth/admin/change-password`

```javascript
const changeAdminPassword = async (currentPassword, newPassword) => {
  const response = await fetch(`${API_BASE}/auth/admin/change-password`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword,
      newPassword
    })
  });

  return response.json();
};

// Password Change Component
const ChangePasswordForm = () => {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      setMessage('New passwords do not match');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await changeAdminPassword(passwords.current, passwords.new);
      
      if (result.success) {
        setMessage('Password changed successfully');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="password-form">
      <h3>Change Password</h3>
      
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      
      <input
        type="password"
        value={passwords.current}
        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
        placeholder="Current Password"
        required
      />
      
      <input
        type="password"
        value={passwords.new}
        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
        placeholder="New Password"
        required
      />
      
      <input
        type="password"
        value={passwords.confirm}
        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
        placeholder="Confirm New Password"
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
};
```

### 5. Admin Route Protection
```javascript
// Higher-Order Component for Admin Routes
const withAdminAuth = (WrappedComponent) => {
  return (props) => {
    const { isAuthenticated, loading, adminUser } = useAdminAuth();

    if (loading) {
      return <div className="admin-loading">Loading...</div>;
    }

    if (!isAuthenticated) {
      return <Navigate to="/admin/login" replace />;
    }

    if (adminUser?.role !== 'admin') {
      return <div className="access-denied">Access Denied: Admin privileges required</div>;
    }

    return <WrappedComponent {...props} adminUser={adminUser} />;
  };
};

// Usage
const AdminDashboard = withAdminAuth(({ adminUser }) => {
  return (
    <div>
      <h1>Welcome, {adminUser.full_name}</h1>
      {/* Dashboard content */}
    </div>
  );
});
```

---

## 🔐 Authentication & Setup

### Base Configuration
```javascript
const ADMIN_API_BASE = 'https://your-domain.com/admin';
const AUTH_HEADER = {
  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
  'Content-Type': 'application/json'
};
```

### Required Headers for All Requests
```javascript
{
  "Authorization": "Bearer <admin-jwt-token>",
  "Content-Type": "application/json"
}
```

---

## 📊 Dashboard APIs

### 1. Get Dashboard Statistics
**Endpoint:** `GET /admin/dashboard/stats`

**Frontend Usage:**
```javascript
// React Hook
const useDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${ADMIN_API_BASE}/dashboard/stats`, { headers: AUTH_HEADER })
      .then(res => res.json())
      .then(data => {
        setStats(data.data);
        setLoading(false);
      });
  }, []);

  return { stats, loading };
};
```

**Response Structure:**
```typescript
interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  newUsersToday: number;
  ordersToday: number;
  revenueToday: number;
  monthlyGrowth: {
    users: number;
    orders: number;
    revenue: number;
  };
}
```

**Dashboard Component Example:**
```jsx
const AdminDashboard = () => {
  const { stats, loading } = useDashboardStats();

  if (loading) return <Spinner />;

  return (
    <div className="dashboard-grid">
      <StatCard title="Total Users" value={stats.totalUsers} />
      <StatCard title="Total Orders" value={stats.totalOrders} />
      <StatCard title="Revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} />
      <StatCard title="Pending Orders" value={stats.pendingOrders} alert />
    </div>
  );
};
```

---

## 👥 User Management APIs

### 1. Get Users (Paginated)
**Endpoint:** `GET /admin/users`

**Query Parameters:**
```typescript
interface UserQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 10, Max: 100
  search?: string;      // Search by email or name
  role?: 'user' | 'admin';
  isActive?: boolean;
  sortBy?: string;      // Default: 'created_at'
  sortOrder?: 'ASC' | 'DESC'; // Default: 'DESC'
}
```

**Frontend Hook:**
```javascript
const useUsers = (params = {}) => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const queryString = new URLSearchParams(params).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/users?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, pagination, loading, refetch: fetchUsers };
};
```

### 2. Get User by ID
**Endpoint:** `GET /admin/users/{userId}`

```javascript
const getUserById = async (userId) => {
  const response = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
    headers: AUTH_HEADER
  });
  return response.json();
};
```

### 3. Update User Status
**Endpoint:** `PUT /admin/users/{userId}/status`

```javascript
const updateUserStatus = async (userId, isActive) => {
  const response = await fetch(`${ADMIN_API_BASE}/users/${userId}/status`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify({ isActive })
  });
  return response.json();
};

// React Component Usage
const UserStatusToggle = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await updateUserStatus(user.id, !user.is_active);
      onUpdate(); // Refresh parent component
    } catch (error) {
      alert('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggle} 
      disabled={loading}
      className={user.is_active ? 'btn-danger' : 'btn-success'}
    >
      {loading ? 'Updating...' : (user.is_active ? 'Deactivate' : 'Activate')}
    </button>
  );
};
```

### 4. Delete User
**Endpoint:** `DELETE /admin/users/{userId}`

```javascript
const deleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  const response = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: AUTH_HEADER
  });
  return response.json();
};
```

### 5. Bulk Update Users
**Endpoint:** `PUT /admin/users/bulk/status`

```javascript
const bulkUpdateUsers = async (userIds, isActive) => {
  const response = await fetch(`${ADMIN_API_BASE}/users/bulk/status`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify({ ids: userIds, isActive })
  });
  return response.json();
};

// Bulk Selection Component
const UserBulkActions = ({ selectedUsers, onComplete }) => {
  const handleBulkActivate = () => {
    bulkUpdateUsers(selectedUsers, true).then(onComplete);
  };

  const handleBulkDeactivate = () => {
    bulkUpdateUsers(selectedUsers, false).then(onComplete);
  };

  return (
    <div className="bulk-actions">
      <button onClick={handleBulkActivate}>Activate Selected</button>
      <button onClick={handleBulkDeactivate}>Deactivate Selected</button>
    </div>
  );
};
```

---

## 📦 Order Management APIs

### 1. Get Orders (Paginated)
**Endpoint:** `GET /admin/orders`

**Query Parameters:**
```typescript
interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;      // Search by order ID
  status?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  dateFrom?: string;    // ISO date string
  dateTo?: string;      // ISO date string
  userId?: string;      // Filter by user
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

**Frontend Implementation:**
```javascript
const useOrders = (filters = {}) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    const queryString = new URLSearchParams(filters).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/orders?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      
      setOrders(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  return { orders, pagination, loading, refetch: fetchOrders };
};

// Order Filters Component
const OrderFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: ''
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="order-filters">
      <select 
        value={filters.status} 
        onChange={(e) => handleFilterChange('status', e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="PROCESSING">Processing</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <select 
        value={filters.paymentStatus} 
        onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
      >
        <option value="">All Payment Status</option>
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
        <option value="FAILED">Failed</option>
        <option value="REFUNDED">Refunded</option>
      </select>

      <input 
        type="date" 
        value={filters.dateFrom}
        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
        placeholder="From Date"
      />

      <input 
        type="date" 
        value={filters.dateTo}
        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
        placeholder="To Date"
      />
    </div>
  );
};
```

### 2. Get Order by ID
**Endpoint:** `GET /admin/orders/{orderId}`

```javascript
const useOrderDetails = (orderId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch(`${ADMIN_API_BASE}/orders/${orderId}`, { headers: AUTH_HEADER })
      .then(res => res.json())
      .then(data => {
        setOrder(data.data);
        setLoading(false);
      });
  }, [orderId]);

  return { order, loading };
};
```

### 3. Update Order Status
**Endpoint:** `PUT /admin/orders/{orderId}/status`

```javascript
const updateOrderStatus = async (orderId, statusData) => {
  const response = await fetch(`${ADMIN_API_BASE}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify(statusData)
  });
  return response.json();
};

// Order Status Update Component
const OrderStatusUpdate = ({ order, onUpdate }) => {
  const [status, setStatus] = useState(order.status);
  const [notes, setNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateOrderStatus(order.id, {
        status,
        notes,
        trackingNumber: trackingNumber || undefined
      });
      onUpdate();
    } catch (error) {
      alert('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="PROCESSING">Processing</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Status update notes..."
      />

      {status === 'SHIPPED' && (
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Tracking Number"
        />
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Status'}
      </button>
    </form>
  );
};
```

---

## 🛍️ Product Management APIs

### 1. Get Products (Paginated)
**Endpoint:** `GET /admin/products`

**Query Parameters:**
```typescript
interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;      // Search by name, description, SKU
  categoryId?: string;  // Filter by category
  isActive?: boolean;
  lowStock?: boolean;   // Show only low stock products
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

**Frontend Implementation:**
```javascript
const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const queryString = new URLSearchParams(filters).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/products?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  return { products, pagination, loading, refetch: fetchProducts };
};
```

### 2. Create Product
**Endpoint:** `POST /admin/products`

```javascript
const createProduct = async (productData) => {
  const response = await fetch(`${ADMIN_API_BASE}/products`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify(productData)
  });
  return response.json();
};

// Product Form Component
const ProductForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    categoryId: '',
    images: [],
    lowStockThreshold: 10,
    isActive: true,
    ...initialData
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await createProduct(formData);
      onSubmit(result);
    } catch (error) {
      alert('Failed to create product');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Product Name"
        required
      />

      <textarea
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Product Description"
        required
      />

      <input
        type="number"
        value={formData.price}
        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
        placeholder="Price"
        step="0.01"
        min="0"
        required
      />

      <input
        type="number"
        value={formData.stock}
        onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
        placeholder="Stock Quantity"
        min="0"
        required
      />

      <input
        type="text"
        value={formData.sku}
        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
        placeholder="SKU"
        required
      />

      <CategorySelect
        value={formData.categoryId}
        onChange={(categoryId) => setFormData(prev => ({ ...prev, categoryId }))}
      />

      <input
        type="number"
        value={formData.lowStockThreshold}
        onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) }))}
        placeholder="Low Stock Threshold"
        min="0"
      />

      <label>
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
        />
        Active Product
      </label>

      <button type="submit">Create Product</button>
    </form>
  );
};
```

### 3. Update Product
**Endpoint:** `PUT /admin/products/{productId}`

```javascript
const updateProduct = async (productId, productData) => {
  const response = await fetch(`${ADMIN_API_BASE}/products/${productId}`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify(productData)
  });
  return response.json();
};
```

### 4. Delete Product
**Endpoint:** `DELETE /admin/products/{productId}`

```javascript
const deleteProduct = async (productId) => {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  const response = await fetch(`${ADMIN_API_BASE}/products/${productId}`, {
    method: 'DELETE',
    headers: AUTH_HEADER
  });
  return response.json();
};
```

---

## 🏷️ Category Management APIs

### 1. Get Categories
**Endpoint:** `GET /admin/categories`

**Query Parameters:**
```typescript
interface CategoryQueryParams {
  includeInactive?: boolean; // Default: false
  search?: string;           // Search by name or description
  sortBy?: string;          // Default: 'name'
  sortOrder?: 'ASC' | 'DESC'; // Default: 'ASC'
}
```

**Frontend Implementation:**
```javascript
const useCategories = (params = {}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const queryString = new URLSearchParams(params).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/categories?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      setCategories(data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [params]);

  return { categories, loading, refetch: fetchCategories };
};

// Category Select Component
const CategorySelect = ({ value, onChange, placeholder = "Select Category" }) => {
  const { categories, loading } = useCategories();

  if (loading) return <div>Loading categories...</div>;

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {categories.map(category => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
};
```

### 2. Create Category
**Endpoint:** `POST /admin/categories`

```javascript
const createCategory = async (categoryData) => {
  const response = await fetch(`${ADMIN_API_BASE}/categories`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify(categoryData)
  });
  return response.json();
};

// Category Form Component
const CategoryForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: '',
    imageUrl: '',
    sortOrder: 0,
    isActive: true,
    ...initialData
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await createCategory(formData);
      onSubmit(result);
    } catch (error) {
      alert('Failed to create category');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Category Name"
        required
      />

      <textarea
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Category Description"
      />

      <input
        type="text"
        value={formData.slug}
        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
        placeholder="URL Slug (optional)"
      />

      <CategorySelect
        value={formData.parentId}
        onChange={(parentId) => setFormData(prev => ({ ...prev, parentId }))}
        placeholder="Parent Category (optional)"
      />

      <input
        type="url"
        value={formData.imageUrl}
        onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
        placeholder="Category Image URL"
      />

      <input
        type="number"
        value={formData.sortOrder}
        onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
        placeholder="Sort Order"
        min="0"
      />

      <label>
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
        />
        Active Category
      </label>

      <button type="submit">Create Category</button>
    </form>
  );
};
```

---

## � Inventory Management APIs

### 1. Get Inventory Overview
**Endpoint:** `GET /admin/inventory/overview`

```javascript
const useInventoryOverview = () => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${ADMIN_API_BASE}/inventory/overview`, { headers: AUTH_HEADER })
      .then(res => res.json())
      .then(data => {
        setInventory(data.data);
        setLoading(false);
      });
  }, []);

  return { inventory, loading };
};

// Inventory Overview Component
const InventoryOverview = () => {
  const { inventory, loading } = useInventoryOverview();

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div className="inventory-overview">
      <div className="inventory-stats">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p>{inventory.totalProducts}</p>
        </div>
        <div className="stat-card alert">
          <h3>Low Stock</h3>
          <p>{inventory.lowStock}</p>
        </div>
        <div className="stat-card danger">
          <h3>Out of Stock</h3>
          <p>{inventory.outOfStock}</p>
        </div>
        <div className="stat-card">
          <h3>Total Value</h3>
          <p>₦{inventory.totalValue?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};
```

### 2. Get Low Stock Products
**Endpoint:** `GET /admin/inventory/low-stock?threshold=10`

```javascript
const useLowStockProducts = (threshold = 10) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/inventory/low-stock?threshold=${threshold}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      setProducts(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, [threshold]);

  return { products, loading, refetch: fetchLowStock };
};
```

### 3. Update Product Stock
**Endpoint:** `PUT /admin/inventory/{productId}/stock`

```javascript
const updateProductStock = async (productId, stockData) => {
  const response = await fetch(`${ADMIN_API_BASE}/inventory/${productId}/stock`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify(stockData)
  });
  return response.json();
};

// Stock Update Component
const StockUpdateForm = ({ product, onUpdate }) => {
  const [stockData, setStockData] = useState({
    quantity: product.stock,
    operation: 'set', // 'set', 'add', 'subtract'
    reason: '',
    cost: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateProductStock(product.id, stockData);
      onUpdate();
    } catch (error) {
      alert('Failed to update stock');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stock-form">
      <h3>Update Stock: {product.name}</h3>
      <p>Current Stock: {product.stock}</p>
      
      <select value={stockData.operation} onChange={(e) => setStockData(prev => ({ ...prev, operation: e.target.value }))}>
        <option value="set">Set Stock</option>
        <option value="add">Add Stock</option>
        <option value="subtract">Remove Stock</option>
      </select>
      
      <input
        type="number"
        value={stockData.quantity}
        onChange={(e) => setStockData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
        placeholder="Quantity"
        min="0"
        required
      />
      
      <textarea
        value={stockData.reason}
        onChange={(e) => setStockData(prev => ({ ...prev, reason: e.target.value }))}
        placeholder="Reason for stock update"
      />
      
      <button type="submit">Update Stock</button>
    </form>
  );
};
```

### 4. Bulk Stock Update
**Endpoint:** `PUT /admin/inventory/bulk-update`

```javascript
const bulkUpdateStock = async (updates) => {
  const response = await fetch(`${ADMIN_API_BASE}/inventory/bulk-update`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify({ updates })
  });
  return response.json();
};
```

---

## 🎧 Customer Support APIs

### 1. Get Support Tickets
**Endpoint:** `GET /admin/support/tickets`

```javascript
const useSupportTickets = (filters = {}) => {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    const queryString = new URLSearchParams(filters).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/support/tickets?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      
      setTickets(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  return { tickets, pagination, loading, refetch: fetchTickets };
};

// Support Tickets Component
const SupportTickets = () => {
  const [filters, setFilters] = useState({ status: '', priority: '', page: 1 });
  const { tickets, pagination, loading, refetch } = useSupportTickets(filters);

  return (
    <div className="support-tickets">
      <h2>Support Tickets</h2>
      
      <div className="ticket-filters">
        <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        
        <select value={filters.priority} onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }))}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {loading ? (
        <div>Loading tickets...</div>
      ) : (
        <div className="tickets-list">
          {tickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onUpdate={refetch} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### 2. Update Ticket Status
**Endpoint:** `PUT /admin/support/tickets/{ticketId}/status`

```javascript
const updateTicketStatus = async (ticketId, status, response = '') => {
  const result = await fetch(`${ADMIN_API_BASE}/support/tickets/${ticketId}/status`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify({ status, response })
  });
  return result.json();
};
```

### 3. Add Ticket Response
**Endpoint:** `POST /admin/support/tickets/{ticketId}/responses`

```javascript
const addTicketResponse = async (ticketId, message, isInternal = false) => {
  const response = await fetch(`${ADMIN_API_BASE}/support/tickets/${ticketId}/responses`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify({ message, isInternal })
  });
  return response.json();
};
```

---

## ⭐ Review Management APIs

### 1. Get Reviews
**Endpoint:** `GET /admin/reviews`

```javascript
const useReviews = (filters = {}) => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    const queryString = new URLSearchParams(filters).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/reviews?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      
      setReviews(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  return { reviews, pagination, loading, refetch: fetchReviews };
};

// Reviews Management Component
const ReviewsManagement = () => {
  const [filters, setFilters] = useState({ 
    status: '', 
    rating: '', 
    productId: '', 
    page: 1 
  });
  const { reviews, pagination, loading, refetch } = useReviews(filters);

  return (
    <div className="reviews-management">
      <h2>Review Management</h2>
      
      <div className="review-filters">
        <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        
        <select value={filters.rating} onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value, page: 1 }))}>
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {loading ? (
        <div>Loading reviews...</div>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} onUpdate={refetch} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### 2. Moderate Review
**Endpoint:** `PUT /admin/reviews/{reviewId}/moderate`

```javascript
const moderateReview = async (reviewId, action, reason = '') => {
  const response = await fetch(`${ADMIN_API_BASE}/reviews/${reviewId}/moderate`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify({ action, reason }) // action: 'approve', 'reject'
  });
  return response.json();
};

// Review Moderation Component
const ReviewCard = ({ review, onUpdate }) => {
  const [moderating, setModerating] = useState(false);

  const handleModerate = async (action) => {
    setModerating(true);
    
    try {
      await moderateReview(review.id, action);
      onUpdate();
    } catch (error) {
      alert('Failed to moderate review');
    } finally {
      setModerating(false);
    }
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <span className="rating">{'★'.repeat(review.rating)}</span>
        <span className={`status ${review.status}`}>{review.status}</span>
      </div>
      
      <div className="review-content">
        <p>{review.comment}</p>
        <small>By: {review.user?.full_name} | Product: {review.product?.name}</small>
      </div>
      
      {review.status === 'pending' && (
        <div className="review-actions">
          <button 
            onClick={() => handleModerate('approve')} 
            disabled={moderating}
            className="btn-approve"
          >
            Approve
          </button>
          <button 
            onClick={() => handleModerate('reject')} 
            disabled={moderating}
            className="btn-reject"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 💳 Payment Management APIs

### 1. Get Payment Transactions
**Endpoint:** `GET /admin/payments/transactions`

```javascript
const usePaymentTransactions = (filters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    const queryString = new URLSearchParams(filters).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/payments/transactions?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      
      setTransactions(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  return { transactions, pagination, loading, refetch: fetchTransactions };
};
```

### 2. Refund Payment
**Endpoint:** `POST /admin/payments/{transactionId}/refund`

```javascript
const processRefund = async (transactionId, amount, reason) => {
  const response = await fetch(`${ADMIN_API_BASE}/payments/${transactionId}/refund`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify({ amount, reason })
  });
  return response.json();
};
```

### 3. Payment Analytics
**Endpoint:** `GET /admin/payments/analytics`

```javascript
const usePaymentAnalytics = (period = '30d') => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${ADMIN_API_BASE}/payments/analytics?period=${period}`, {
          headers: AUTH_HEADER
        });
        const data = await response.json();
        setAnalytics(data.data);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  return { analytics, loading };
};
```

---

## 📁 File Upload & Media APIs

### 1. Upload Files
**Endpoint:** `POST /admin/upload/files`

```javascript
const uploadFiles = async (files, folder = 'general') => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('folder', folder);

  const response = await fetch(`${ADMIN_API_BASE}/upload/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      // Don't set Content-Type for FormData
    },
    body: formData
  });

  return response.json();
};

// File Upload Component
const FileUploader = ({ onUpload, folder = 'general', multiple = true }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (files) => {
    setUploading(true);
    
    try {
      const result = await uploadFiles(Array.from(files), folder);
      onUpload(result.data.urls);
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div 
      className={`file-uploader ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div>Uploading...</div>
      ) : (
        <>
          <input
            type="file"
            multiple={multiple}
            onChange={(e) => handleFileUpload(e.target.files)}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" className="upload-label">
            Click to upload or drag files here
          </label>
        </>
      )}
    </div>
  );
};
```

### 2. Get Media Library
**Endpoint:** `GET /admin/upload/media`

```javascript
const useMediaLibrary = (folder = '') => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/upload/media?folder=${folder}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      setMedia(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [folder]);

  return { media, loading, refetch: fetchMedia };
};
```

### 3. Delete Media
**Endpoint:** `DELETE /admin/upload/media/{fileId}`

```javascript
const deleteMedia = async (fileId) => {
  const response = await fetch(`${ADMIN_API_BASE}/upload/media/${fileId}`, {
    method: 'DELETE',
    headers: AUTH_HEADER
  });
  return response.json();
};
```

---

## 🔔 Notification APIs

### 1. Get Admin Notifications
**Endpoint:** `GET /admin/notifications`

```javascript
const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/notifications`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      
      setNotifications(data.data);
      setUnreadCount(data.data.filter(n => !n.read).length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return { notifications, unreadCount, loading, refetch: fetchNotifications };
};

// Notification Bell Component
const NotificationBell = () => {
  const { notifications, unreadCount, refetch } = useAdminNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const markAsRead = async (notificationId) => {
    await fetch(`${ADMIN_API_BASE}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: AUTH_HEADER
    });
    refetch();
  };

  return (
    <div className="notification-bell">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="bell-button"
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      
      {showDropdown && (
        <div className="notifications-dropdown">
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <p>{notification.message}</p>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
```

### 2. Send Notification
**Endpoint:** `POST /admin/notifications/send`

```javascript
const sendNotification = async (notificationData) => {
  const response = await fetch(`${ADMIN_API_BASE}/notifications/send`, {
    method: 'POST',
    headers: AUTH_HEADER,
    body: JSON.stringify(notificationData)
  });
  return response.json();
};
```

---

## 📋 Audit Log APIs

### 1. Get Audit Logs
**Endpoint:** `GET /admin/audit-logs`

```javascript
const useAuditLogs = (filters = {}) => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const queryString = new URLSearchParams(filters).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/audit-logs?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      
      setLogs(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  return { logs, pagination, loading, refetch: fetchLogs };
};

// Audit Logs Component
const AuditLogs = () => {
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    entity: '',
    dateFrom: '',
    dateTo: '',
    page: 1
  });
  const { logs, pagination, loading } = useAuditLogs(filters);

  return (
    <div className="audit-logs">
      <h2>Audit Logs</h2>
      
      <div className="audit-filters">
        <select value={filters.action} onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}>
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
        </select>
        
        <select value={filters.entity} onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value, page: 1 }))}>
          <option value="">All Entities</option>
          <option value="user">Users</option>
          <option value="product">Products</option>
          <option value="order">Orders</option>
          <option value="category">Categories</option>
        </select>
        
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
          placeholder="From Date"
        />
        
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
          placeholder="To Date"
        />
      </div>

      {loading ? (
        <div>Loading audit logs...</div>
      ) : (
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.admin?.full_name}</td>
                  <td className={`action ${log.action.toLowerCase()}`}>{log.action}</td>
                  <td>{log.entity_type}</td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

---

## 🔍 Search & Filter APIs

### 1. Global Admin Search
**Endpoint:** `GET /admin/search?q={query}&type={type}`

```javascript
const useGlobalSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (query, type = 'all') => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${ADMIN_API_BASE}/search?q=${encodeURIComponent(query)}&type=${type}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      setResults(data.data);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search };
};

// Global Search Component
const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const { results, loading, search } = useGlobalSearch();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        search(query, searchType);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchType]);

  return (
    <div className="global-search">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, orders, products..."
        />
        
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
          <option value="all">All</option>
          <option value="users">Users</option>
          <option value="orders">Orders</option>
          <option value="products">Products</option>
        </select>
      </div>

      {loading && <div>Searching...</div>}
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map(result => (
            <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 👤 Admin Profile APIs

### 1. Get Admin Profile
**Endpoint:** `GET /admin/profile`

```javascript
const useAdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/profile`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      setProfile(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, loading, refetch: fetchProfile };
};
```

### 2. Update Admin Profile
**Endpoint:** `PUT /admin/profile`

```javascript
const updateAdminProfile = async (profileData) => {
  const response = await fetch(`${ADMIN_API_BASE}/profile`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify(profileData)
  });
  return response.json();
};

// Admin Profile Component
const AdminProfile = () => {
  const { profile, loading, refetch } = useAdminProfile();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateAdminProfile(formData);
      refetch();
      setEditing(false);
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="admin-profile">
      <h2>Admin Profile</h2>
      
      {editing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Full Name"
          />
          
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
          />
          
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone"
          />
          
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Bio"
          />
          
          <div className="form-actions">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-view">
          <p><strong>Name:</strong> {profile.full_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
          <p><strong>Bio:</strong> {profile.bio || 'No bio provided'}</p>
          
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};
```

---

## �📈 Analytics APIs

### 1. Sales Analytics
**Endpoint:** `GET /admin/analytics/sales`

**Query Parameters:**
```typescript
interface AnalyticsQueryParams {
  startDate?: string;   // ISO date string
  endDate?: string;     // ISO date string
  groupBy?: 'daily' | 'weekly' | 'monthly'; // Default: 'daily'
}
```

```javascript
const useSalesAnalytics = (params = {}) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    const queryString = new URLSearchParams(params).toString();
    
    try {
      const response = await fetch(`${ADMIN_API_BASE}/analytics/sales?${queryString}`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Failed to fetch sales analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [params]);

  return { analytics, loading, refetch: fetchAnalytics };
};
```

### 2. User Analytics
**Endpoint:** `GET /admin/analytics/users`

### 3. Inventory Analytics
**Endpoint:** `GET /admin/analytics/inventory`

---

## 📄 Reports & Export APIs

### 1. Generate Reports
**Endpoints:**
- `GET /admin/reports/users?format=csv`
- `GET /admin/reports/sales?format=pdf`
- `GET /admin/reports/inventory?format=excel`

```javascript
const generateReport = async (reportType, format = 'csv', params = {}) => {
  const queryParams = new URLSearchParams({ format, ...params }).toString();
  
  const response = await fetch(`${ADMIN_API_BASE}/reports/${reportType}?${queryParams}`, {
    headers: AUTH_HEADER
  });
  
  const data = await response.json();
  return data.data.reportUrl;
};

// Report Generation Component
const ReportGenerator = () => {
  const [reportType, setReportType] = useState('users');
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      const reportUrl = await generateReport(reportType, format, dateRange);
      
      // Download the report
      const link = document.createElement('a');
      link.href = reportUrl;
      link.download = true;
      link.click();
    } catch (error) {
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-generator">
      <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
        <option value="users">Users Report</option>
        <option value="sales">Sales Report</option>
        <option value="inventory">Inventory Report</option>
      </select>

      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="csv">CSV</option>
        <option value="pdf">PDF</option>
        <option value="excel">Excel</option>
      </select>

      <input
        type="date"
        value={dateRange.startDate}
        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
        placeholder="Start Date"
      />

      <input
        type="date"
        value={dateRange.endDate}
        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
        placeholder="End Date"
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  );
};
```

### 2. Export Data
**Endpoints:**
- `GET /admin/export/users`
- `GET /admin/export/orders`
- `GET /admin/export/products`

```javascript
const exportData = async (dataType, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  
  const response = await fetch(`${ADMIN_API_BASE}/export/${dataType}?${queryString}`, {
    headers: AUTH_HEADER
  });
  
  const data = await response.json();
  return data.data.downloadUrl;
};
```

---

## ⚙️ Settings APIs

### 1. Get Settings
**Endpoint:** `GET /admin/settings`

```javascript
const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${ADMIN_API_BASE}/settings`, {
        headers: AUTH_HEADER
      });
      const data = await response.json();
      setSettings(data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, refetch: fetchSettings };
};
```

### 2. Update Settings
**Endpoint:** `PUT /admin/settings`

```javascript
const updateSettings = async (settingsData) => {
  const response = await fetch(`${ADMIN_API_BASE}/settings`, {
    method: 'PUT',
    headers: AUTH_HEADER,
    body: JSON.stringify(settingsData)
  });
  return response.json();
};

// Settings Form Component
const SettingsForm = () => {
  const { settings, loading, refetch } = useSettings();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettings(formData);
      refetch();
      alert('Settings updated successfully');
    } catch (error) {
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <input
        type="text"
        value={formData.siteName || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, siteName: e.target.value }))}
        placeholder="Site Name"
      />

      <textarea
        value={formData.siteDescription || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, siteDescription: e.target.value }))}
        placeholder="Site Description"
      />

      <input
        type="email"
        value={formData.contactEmail || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
        placeholder="Contact Email"
      />

      <select
        value={formData.currency || 'NGN'}
        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
      >
        <option value="NGN">Nigerian Naira (₦)</option>
        <option value="USD">US Dollar ($)</option>
        <option value="EUR">Euro (€)</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={formData.allowRegistration || false}
          onChange={(e) => setFormData(prev => ({ ...prev, allowRegistration: e.target.checked }))}
        />
        Allow User Registration
      </label>

      <label>
        <input
          type="checkbox"
          checked={formData.requireEmailVerification || false}
          onChange={(e) => setFormData(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
        />
        Require Email Verification
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};
```

---

## 🔄 Bulk Operations APIs

### 1. Bulk Update User Status
**Endpoint:** `PUT /admin/users/bulk/status`

### 2. Bulk Update Product Status
**Endpoint:** `PUT /admin/products/bulk/status`

```javascript
// Generic Bulk Actions Component
const BulkActions = ({ selectedItems, onComplete, entityType }) => {
  const [loading, setLoading] = useState(false);

  const handleBulkAction = async (action, value) => {
    setLoading(true);
    
    try {
      await fetch(`${ADMIN_API_BASE}/${entityType}/bulk/${action}`, {
        method: 'PUT',
        headers: AUTH_HEADER,
        body: JSON.stringify({ ids: selectedItems, ...value })
      });
      
      onComplete();
    } catch (error) {
      alert(`Failed to perform bulk ${action}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-actions">
      <span>{selectedItems.length} items selected</span>
      
      <button 
        onClick={() => handleBulkAction('status', { isActive: true })}
        disabled={loading || selectedItems.length === 0}
      >
        Activate
      </button>
      
      <button 
        onClick={() => handleBulkAction('status', { isActive: false })}
        disabled={loading || selectedItems.length === 0}
      >
        Deactivate
      </button>
    </div>
  );
};
```

---

## 💻 Frontend Implementation Examples

### Complete Admin Service Class
```javascript
// services/AdminService.js
class AdminService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL + '/admin';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expired
      this.handleTokenExpiry();
      throw new Error('Authentication required');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  handleTokenExpiry() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  }

  // Dashboard
  getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Users
  getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users?${queryString}`);
  }

  getUserById(id) {
    return this.request(`/users/${id}`);
  }

  updateUserStatus(id, isActive) {
    return this.request(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  bulkUpdateUsers(ids, isActive) {
    return this.request('/users/bulk/status', {
      method: 'PUT',
      body: JSON.stringify({ ids, isActive }),
    });
  }

  // Orders
  getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/orders?${queryString}`);
  }

  getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  updateOrderStatus(id, statusData) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  // Products
  getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products?${queryString}`);
  }

  createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  deleteProduct(id) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Categories
  getCategories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/categories?${queryString}`);
  }

  createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  updateCategory(id, categoryData) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  deleteCategory(id) {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // Analytics
  getSalesAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/sales?${queryString}`);
  }

  getUserAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/users?${queryString}`);
  }

  getInventoryAnalytics() {
    return this.request('/analytics/inventory');
  }

  // Reports
  generateReport(type, format = 'csv', params = {}) {
    const queryString = new URLSearchParams({ format, ...params }).toString();
    return this.request(`/reports/${type}?${queryString}`);
  }

  exportData(type, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/export/${type}?${queryString}`);
  }

  // Settings
  getSettings() {
    return this.request('/settings');
  }

  updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export default new AdminService();
```

### React Context for Admin State
```javascript
// context/AdminContext.js
import React, { createContext, useContext, useReducer } from 'react';

const AdminContext = createContext();

const adminReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload, loading: false };
    case 'SET_USERS':
      return { ...state, users: action.payload, loading: false };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, loading: false };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, loading: false };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  error: null,
  dashboardStats: null,
  users: { data: [], pagination: null },
  orders: { data: [], pagination: null },
  products: { data: [], pagination: null },
};

export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  return (
    <AdminContext.Provider value={{ state, dispatch }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
};
```

---

## ❌ Error Handling & Status Codes

### Standard Error Response Structure
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
  timestamp: string;
}
```

### HTTP Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (no/invalid token)
- **403** - Forbidden (not admin role)
- **404** - Not Found
- **409** - Conflict (duplicate data)
- **500** - Internal Server Error

### Error Handling Hook
```javascript
const useErrorHandler = () => {
  const [error, setError] = useState(null);

  const handleError = (error) => {
    console.error('API Error:', error);
    
    switch (error.statusCode) {
      case 401:
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        break;
      case 403:
        setError('You do not have permission to perform this action');
        break;
      case 404:
        setError('The requested resource was not found');
        break;
      case 409:
        setError('This item already exists');
        break;
      default:
        setError(error.message || 'An unexpected error occurred');
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};
```

### Global Error Boundary
```jsx
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong in the admin panel</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🔐 Security Best Practices

### 1. Token Management
```javascript
// Secure token storage and refresh
const TokenManager = {
  getToken() {
    return localStorage.getItem('adminToken');
  },

  setToken(token) {
    localStorage.setItem('adminToken', token);
  },

  removeToken() {
    localStorage.removeItem('adminToken');
  },

  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
};
```

### 2. Input Validation
```javascript
const validateInput = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
  
  price: (price) => !isNaN(price) && parseFloat(price) >= 0,
  
  stock: (stock) => Number.isInteger(stock) && stock >= 0,
  
  sku: (sku) => /^[A-Z0-9-]+$/.test(sku)
};
```

### 3. Route Protection
```jsx
const ProtectedRoute = ({ children }) => {
  const token = TokenManager.getToken();
  
  if (!token || TokenManager.isTokenExpired(token)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
```

---

This comprehensive API structure document provides everything needed for frontend developers to integrate with the JJ Essential admin system. All endpoints are fully documented with examples, error handling, and best practices for a production-ready implementation.
