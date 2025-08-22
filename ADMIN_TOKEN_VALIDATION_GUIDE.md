# Admin Token Validation Guide
*Complete guide for validating admin-only authentication tokens*

## 🎯 Overview
This guide covers the specific implementation for validating admin tokens in the frontend. Admin tokens have special characteristics that require specific validation logic to ensure only legitimate admin users can access admin-only features.

## 🔐 Admin Token Characteristics

### JWT Payload Structure
Admin tokens contain a special user ID that identifies them as admin tokens:

```json
{
  "sub": "admin-user",
  "email": "jadesola0518@gmail.com",
  "role": "ADMIN",
  "iat": 1692699558,
  "exp": 1692785958
}
```

**Key Admin Identifiers:**
- `sub`: Always equals `"admin-user"` (hardcoded admin ID)
- `role`: Must be `"ADMIN"`
- `email`: Admin email address

## 🛠️ Client-Side Admin Token Validation

### 1. Admin Token Validator Utility

```javascript
// utils/adminTokenValidator.js
export const validateAdminToken = (token) => {
  if (!token) return { isValid: false, reason: 'No token provided' };
  
  try {
    // Basic JWT structure validation (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, reason: 'Invalid JWT structure' };
    }
    
    // Decode payload (without verification - just for client checks)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check required fields
    if (!payload.sub || !payload.exp) {
      return { isValid: false, reason: 'Missing required JWT fields' };
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { isValid: false, reason: 'Token expired' };
    }
    
    // ADMIN-SPECIFIC: Check if this is an admin token
    if (payload.sub !== 'admin-user') {
      return { isValid: false, reason: 'Not an admin token' };
    }
    
    // Additional admin role verification
    if (payload.role && payload.role !== 'ADMIN') {
      return { isValid: false, reason: 'Invalid admin role' };
    }
    
    return { 
      isValid: true, 
      payload,
      isAdmin: true,
      userId: payload.sub,
      email: payload.email 
    };
  } catch (error) {
    return { isValid: false, reason: 'Token parsing failed' };
  }
};

export const getAdminFromToken = (token) => {
  const validation = validateAdminToken(token);
  if (!validation.isValid) return null;
  
  return {
    id: 'admin-user',
    role: 'ADMIN',
    email: validation.payload.email || 'jadesola0518@gmail.com',
    isAdmin: true
  };
};

export const isTokenExpired = (token) => {
  const validation = validateAdminToken(token);
  return !validation.isValid || validation.reason === 'Token expired';
};
```

### 2. Admin Token Structure Checker

```javascript
// utils/adminTokenChecker.js
export const checkAdminTokenStructure = (token) => {
  const checks = {
    hasToken: !!token,
    hasValidStructure: false,
    isAdminToken: false,
    isExpired: false,
    adminEmail: null
  };
  
  if (!token) return checks;
  
  try {
    const parts = token.split('.');
    checks.hasValidStructure = parts.length === 3;
    
    if (checks.hasValidStructure) {
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if it's an admin token
      checks.isAdminToken = payload.sub === 'admin-user';
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      checks.isExpired = payload.exp < now;
      
      // Get admin email
      checks.adminEmail = payload.email;
    }
  } catch (error) {
    // Token parsing failed
  }
  
  return checks;
};
```

## 🌐 Server-Side Admin Token Validation

### 1. Admin Token Validation Hook

```jsx
// hooks/useAdminTokenValidation.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { validateAdminToken } from '../utils/adminTokenValidator';

const useAdminTokenValidation = (token) => {
  const [isValidAdmin, setIsValidAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:3000';

  const validateAdminTokenOnServer = async () => {
    if (!token) {
      setIsValidAdmin(false);
      setIsLoading(false);
      return;
    }

    // First, do client-side validation
    const clientValidation = validateAdminToken(token);
    if (!clientValidation.isValid) {
      console.log('❌ Client-side admin token validation failed:', clientValidation.reason);
      setIsValidAdmin(false);
      setError(clientValidation.reason);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Validating admin token with server...');
      
      // Use /auth/me endpoint to validate with server
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const user = response.data.data;
      console.log('✅ Server response:', user);
      
      // Verify this is actually an admin user
      if (user.id === 'admin-user' && user.role === 'ADMIN') {
        setAdminUser(user);
        setIsValidAdmin(true);
        console.log('✅ Admin token validation successful');
      } else {
        setIsValidAdmin(false);
        setError('Token is valid but user is not an admin');
        console.log('❌ User is not an admin:', user);
      }
    } catch (error) {
      console.error('❌ Server-side admin token validation failed:', error);
      setIsValidAdmin(false);
      setAdminUser(null);
      setError(error.response?.data?.message || 'Token validation failed');
      
      // Clear invalid token
      localStorage.removeItem('admin_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    validateAdminTokenOnServer();
  }, [token]);

  return { 
    isValidAdmin, 
    isLoading, 
    adminUser, 
    error,
    revalidate: validateAdminTokenOnServer 
  };
};

export default useAdminTokenValidation;
```

### 2. Complete Admin Authentication Hook

```jsx
// hooks/useAdminAuth.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { validateAdminToken } from '../utils/adminTokenValidator';
import useAdminTokenValidation from './useAdminTokenValidation';

const useAdminAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Server-side admin token validation
  const { isValidAdmin, isLoading, adminUser, error, revalidate } = useAdminTokenValidation(token);

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    setIsAuthenticated(isValidAdmin);
    setUser(adminUser);
    setLoading(isLoading);
  }, [isValidAdmin, isLoading, adminUser]);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting admin login...');
      
      const response = await axios.post(`${API_BASE}/auth/admin/signin`, {
        email,
        password
      });

      const { access_token, user: userData } = response.data.data;
      console.log('📥 Received login response:', { access_token: access_token.substring(0, 20) + '...', user: userData });
      
      // Validate this is actually an admin token
      const tokenValidation = validateAdminToken(access_token);
      if (!tokenValidation.isValid) {
        throw new Error(`Invalid admin token: ${tokenValidation.reason}`);
      }
      
      if (!tokenValidation.isAdmin) {
        throw new Error('Token is not for an admin user');
      }

      setToken(access_token);
      localStorage.setItem('admin_token', access_token);
      
      console.log('✅ Admin login successful');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Admin login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Admin login failed' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Admin logging out...');
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Check if user is specifically an admin
  const isAdmin = () => {
    return isAuthenticated && user?.role === 'ADMIN' && user?.id === 'admin-user';
  };

  // Get admin status details
  const getAdminStatus = () => {
    return {
      isAuthenticated,
      isAdmin: isAdmin(),
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      hasValidToken: !!token && validateAdminToken(token).isValid
    };
  };

  return {
    token,
    isAuthenticated,
    loading,
    user,
    error,
    login,
    logout,
    getAuthHeaders,
    isAdmin,
    getAdminStatus,
    refreshValidation: revalidate
  };
};

export default useAdminAuth;
```

## 🛡️ Admin Route Protection

### 1. Admin Route Guard Component

```jsx
// components/AdminRoute.jsx
import React from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user, error, getAdminStatus } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>🔍 Validating admin credentials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>❌ Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Double-check admin status
  const adminStatus = getAdminStatus();
  if (!adminStatus.isAdmin) {
    return (
      <div className="admin-unauthorized">
        <h2>🚫 Unauthorized</h2>
        <p>Admin access required</p>
        <div className="debug-info">
          <h4>Debug Information:</h4>
          <pre>{JSON.stringify(adminStatus, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-header">
        <span>👑 Admin: {user?.email}</span>
      </div>
      {children}
    </div>
  );
};

export default AdminRoute;
```

### 2. Admin Authentication Provider

```jsx
// contexts/AdminAuthContext.js
import React, { createContext, useContext } from 'react';
import useAdminAuth from '../hooks/useAdminAuth';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const auth = useAdminAuth();

  const value = {
    ...auth,
    // Additional admin-specific methods
    requireAdmin: () => {
      if (!auth.isAdmin()) {
        throw new Error('Admin access required');
      }
    },
    
    getAdminInfo: () => ({
      email: 'jadesola0518@gmail.com',
      role: 'ADMIN',
      permissions: ['all']
    })
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuthContext = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuthContext must be used within AdminAuthProvider');
  }
  return context;
};
```

## 🔒 Admin API Client with Token Validation

### Admin-Specific API Client

```jsx
// utils/adminApiClient.js
import axios from 'axios';
import { validateAdminToken } from './adminTokenValidator';

const createAdminApiClient = (getAuthHeaders, logout) => {
  const client = axios.create({
    baseURL: 'http://localhost:3000'
  });

  // Request interceptor with admin validation
  client.interceptors.request.use((config) => {
    const headers = getAuthHeaders();
    
    // Validate admin token before making request
    const token = headers.Authorization?.replace('Bearer ', '');
    if (token) {
      const validation = validateAdminToken(token);
      
      if (!validation.isValid) {
        console.warn('❌ Invalid admin token detected:', validation.reason);
        logout();
        return Promise.reject(new Error(`Invalid admin token: ${validation.reason}`));
      }
      
      if (!validation.isAdmin) {
        console.warn('❌ Token is not for an admin user');
        logout();
        return Promise.reject(new Error('Token is not for an admin user'));
      }
      
      console.log('✅ Admin token validated for API request');
    }
    
    config.headers = { ...config.headers, ...headers };
    return config;
  });

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      console.log('✅ Admin API request successful');
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        console.log('❌ Admin token expired or invalid, logging out...');
        logout();
      } else if (error.response?.status === 403) {
        console.log('❌ Access forbidden - insufficient admin privileges');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export default createAdminApiClient;
```

## 🧪 Admin Token Testing Utilities

### 1. Token Validation Test Function

```javascript
// utils/testAdminToken.js
import { validateAdminToken } from './adminTokenValidator';
import axios from 'axios';

export const testAdminTokenValidation = async () => {
  const token = localStorage.getItem('admin_token');
  
  console.log('🧪 Testing Admin Token Validation');
  console.log('=====================================');
  
  if (!token) {
    console.log('❌ No admin token found in localStorage');
    return false;
  }

  console.log('🔍 Token found, length:', token.length);
  console.log('🔍 Token preview:', token.substring(0, 50) + '...');

  // Client-side validation
  console.log('\n📋 Client-side Validation:');
  const clientValidation = validateAdminToken(token);
  console.log('Result:', clientValidation);

  if (!clientValidation.isValid) {
    console.log('❌ Client-side validation failed:', clientValidation.reason);
    return false;
  }

  console.log('✅ Client-side validation passed');
  console.log('👤 Admin user ID:', clientValidation.userId);
  console.log('📧 Admin email:', clientValidation.email);

  // Server-side validation
  console.log('\n🌐 Server-side Validation:');
  try {
    const response = await axios.get('http://localhost:3000/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const user = response.data.data;
    console.log('Server response:', user);

    if (user.id === 'admin-user' && user.role === 'ADMIN') {
      console.log('✅ Server-side validation passed');
      console.log('👑 Confirmed admin user');
      return true;
    } else {
      console.log('❌ User is not an admin');
      console.log('Expected: id="admin-user", role="ADMIN"');
      console.log('Received:', { id: user.id, role: user.role });
      return false;
    }
  } catch (error) {
    console.log('❌ Server-side validation failed');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
};

// Make available in browser console for testing
if (typeof window !== 'undefined') {
  window.testAdminToken = testAdminTokenValidation;
}
```

### 2. Admin Token Debug Component

```jsx
// components/AdminTokenDebug.jsx
import React, { useState } from 'react';
import { validateAdminToken } from '../utils/adminTokenValidator';
import { testAdminTokenValidation } from '../utils/testAdminToken';

const AdminTokenDebug = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const token = localStorage.getItem('admin_token');

  const analyzeToken = () => {
    if (!token) {
      setDebugInfo({ error: 'No token found' });
      return;
    }

    const validation = validateAdminToken(token);
    const parts = token.split('.');
    
    let header = null;
    let payload = null;
    
    try {
      header = JSON.parse(atob(parts[0]));
      payload = JSON.parse(atob(parts[1]));
    } catch (e) {
      // Ignore parsing errors
    }

    setDebugInfo({
      validation,
      structure: {
        parts: parts.length,
        header,
        payload,
        signature: parts[2]?.substring(0, 20) + '...'
      }
    });
  };

  const runTest = async () => {
    setTestResult('Running...');
    const result = await testAdminTokenValidation();
    setTestResult(result ? 'PASSED' : 'FAILED');
  };

  return (
    <div className="admin-token-debug">
      <h3>🔍 Admin Token Debug</h3>
      
      <div className="debug-actions">
        <button onClick={analyzeToken}>Analyze Token</button>
        <button onClick={runTest}>Run Full Test</button>
      </div>

      {testResult && (
        <div className={`test-result ${testResult.toLowerCase()}`}>
          Test Result: {testResult}
        </div>
      )}

      {debugInfo && (
        <div className="debug-info">
          <h4>Token Analysis:</h4>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AdminTokenDebug;
```

## 📋 Implementation Checklist

### Client-Side Validation
- [ ] Token structure validation (3 parts)
- [ ] JWT payload parsing
- [ ] Admin user ID verification (`sub === 'admin-user'`)
- [ ] Role verification (`role === 'ADMIN'`)
- [ ] Expiration check
- [ ] Error handling for invalid tokens

### Server-Side Validation
- [ ] `/auth/me` endpoint integration
- [ ] Admin user confirmation
- [ ] Token expiration handling
- [ ] Automatic logout on validation failure
- [ ] Error message handling

### Security Features
- [ ] Automatic token clearing on failure
- [ ] Request interceptor validation
- [ ] Response interceptor for 401/403 handling
- [ ] Admin route protection
- [ ] Role-based access control

### Testing & Debugging
- [ ] Token validation test function
- [ ] Debug component for token analysis
- [ ] Console logging for troubleshooting
- [ ] Browser console test function

## 🔧 Production Considerations

1. **Token Storage**: Consider secure storage options for production
2. **Error Handling**: Implement user-friendly error messages
3. **Logging**: Add proper logging for security events
4. **Rate Limiting**: Implement client-side rate limiting for validation requests
5. **Token Refresh**: Consider implementing token refresh mechanism
6. **Security Headers**: Ensure proper CORS and security headers

## 📊 Admin Credentials Reference

**Email:** `jadesola0518@gmail.com`  
**Password:** `Amoke1805`  
**Admin ID:** `admin-user`  
**Role:** `ADMIN`

---

*This guide provides complete implementation for validating admin-only tokens with both client-side and server-side verification strategies.*
