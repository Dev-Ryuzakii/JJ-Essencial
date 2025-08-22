# Admin API Integration Guide

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.jjessential.com/api
```

## Authentication

### Admin Login
```http
POST /auth/admin/signin
```

Request:
```javascript
{
  "email": "Jadesola0518@gmail.com",
  "password": "Amoke1805"
}
```

Response:
```javascript
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "Jadesola0518@gmail.com",
    "fullName": "Admin User",
    "role": "ADMIN"
  }
}
```

## Frontend Integration Example

```typescript
// src/services/adminAuth.ts

interface AdminAuthService {
  login: (credentials: AdminLoginCredentials) => Promise<AdminLoginResponse>;
  logout: () => void;
  getToken: () => string | null;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

interface AdminLoginCredentials {
  email: string;
  password: string;
}

interface AdminLoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

class AdminAuthServiceImpl implements AdminAuthService {
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'admin_token';
  private readonly USER_KEY = 'admin_user';

  async login(credentials: AdminLoginCredentials): Promise<AdminLoginResponse> {
    try {
      const response = await fetch(`${this.API_URL}/auth/admin/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AdminLoginResponse = await response.json();
      
      // Store token and user data
      localStorage.setItem(this.TOKEN_KEY, data.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return false;
    
    try {
      const user = JSON.parse(userStr);
      return user.role === 'ADMIN';
    } catch {
      return false;
    }
  }
}

export const adminAuthService = new AdminAuthServiceImpl();

// Example usage in React component:
// src/components/AdminLogin.tsx

import React, { useState } from 'react';
import { adminAuthService } from '../services/adminAuth';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await adminAuthService.login({ email, password });
      // Handle successful login (e.g., redirect to admin dashboard)
      console.log('Login successful:', response);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Admin Login</h2>
      {error && <div className="error">{error}</div>}
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
};

// Protected Route Component
// src/components/ProtectedAdminRoute.tsx

import { Navigate } from 'react-router-dom';
import { adminAuthService } from '../services/adminAuth';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const isAuthenticated = adminAuthService.isAuthenticated();
  const isAdmin = adminAuthService.isAdmin();

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Example usage in routes:
// src/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
```

## API Client Setup

```typescript
// src/services/apiClient.ts

import axios from 'axios';
import { adminAuthService } from './adminAuth';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = adminAuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      adminAuthService.logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
```

## Protected Admin API Endpoints

All admin endpoints require the JWT token obtained from login:

```http
Headers:
Authorization: Bearer <access_token>
```

### Get Admin Dashboard Stats
```http
GET /admin/dashboard/stats
```

### Manage Products
```http
GET /admin/products
POST /admin/products
PUT /admin/products/:id
DELETE /admin/products/:id
```

### Manage Categories
```http
GET /admin/categories
POST /admin/categories
PUT /admin/categories/:id
DELETE /admin/categories/:id
```

### Manage Orders
```http
GET /admin/orders
PUT /admin/orders/:id/status
```

### Manage Users
```http
GET /admin/users
PUT /admin/users/:id/status
DELETE /admin/users/:id
```

## Error Handling

All endpoints return errors in this format:
```javascript
{
  "statusCode": number,
  "message": string,
  "error": string
}
```

Common status codes:
- 401: Unauthorized (invalid or expired token)
- 403: Forbidden (not an admin)
- 404: Resource not found
- 400: Bad request
- 500: Server error

## Security Best Practices

1. Always use HTTPS in production
2. Store JWT token in secure HTTP-only cookies
3. Implement token refresh mechanism
4. Add rate limiting for login attempts
5. Use proper CORS configuration
6. Implement session timeout
7. Log all admin actions
