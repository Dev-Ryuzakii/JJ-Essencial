# Admin Frontend Integration Steps

1. First, create an admin authentication service:

```typescript
// src/services/admin-auth.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1'; // Development
// const API_URL = 'https://api.jjessential.com/api/v1'; // Production

export interface AdminLoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

class AdminAuthService {
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage if exists
    this.token = localStorage.getItem('admin_token');
  }

  async login(email: string, password: string): Promise<AdminLoginResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/admin/signin`, {
        email,
        password,
      });

      const { access_token, user } = response.data.data;
      
      // Store token and user data
      this.token = access_token;
      localStorage.setItem('admin_token', access_token);
      localStorage.setItem('admin_user', JSON.stringify(user));

      return response.data.data;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  getUser() {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const adminAuth = new AdminAuthService();
```

2. Create an API client for admin operations:

```typescript
// src/services/admin-api.client.ts
import axios from 'axios';
import { adminAuth } from './admin-auth.service';

const API_URL = 'http://localhost:3000/api/v1';

const adminApiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add auth token to requests
adminApiClient.interceptors.request.use((config) => {
  const token = adminAuth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
adminApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      adminAuth.logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default adminApiClient;
```

3. Create admin login component:

```typescript
// src/components/admin/AdminLogin.tsx
import React, { useState } from 'react';
import { adminAuth } from '../../services/admin-auth.service';
import { useNavigate } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminAuth.login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
```

4. Create protected route component:

```typescript
// src/components/admin/ProtectedAdminRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { adminAuth } from '../../services/admin-auth.service';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const isAuthenticated = adminAuth.isAuthenticated();
  const user = adminAuth.getUser();
  const isAdmin = user?.role === 'ADMIN';

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
```

5. Set up admin routes:

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="settings" element={<AdminSettings />} />
              </Routes>
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
```

6. Example admin dashboard component:

```typescript
// src/components/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import adminApiClient from '../../services/admin-api.client';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApiClient.get('/analytics/dashboard');
        setStats(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Orders</h3>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Revenue</h3>
          <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Customers</h3>
          <p className="text-2xl font-bold">{stats.totalCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Products</h3>
          <p className="text-2xl font-bold">{stats.totalProducts}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

To test the admin login:

1. Use these credentials:
   ```
   Email: jadesola0518@gmail.com
   Password: Amoke1805
   ```

2. Test using curl:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/admin/signin \
   -H "Content-Type: application/json" \
   -d '{"email": "jadesola0518@gmail.com", "password": "Amoke1805"}'
   ```

3. Save the returned token and use it for subsequent admin API calls:
   ```bash
   curl -X GET http://localhost:3000/api/v1/admin/dashboard \
   -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

Key features of this integration:
1. Secure admin authentication
2. Protected routes for admin-only access
3. Automatic token handling
4. Error handling and unauthorized redirects
5. Type-safe API client
6. Clean and modular code structure

Next steps:
1. Implement the remaining admin components (Products, Orders, etc.)
2. Add proper error boundaries
3. Implement a token refresh mechanism
4. Add loading states and proper error handling
5. Set up proper environment variables for API URLs
