# 🔑 Password Reset - Frontend Integration Guide

## Overview

This guide provides complete frontend integration instructions for the password reset functionality in the JJ-Essential e-commerce backend. The system uses Supabase Auth with custom email templates and provides a secure, user-friendly password reset flow.

## 🔄 Password Reset Flow

### Complete User Journey
1. **User requests password reset** → Frontend sends email to backend
2. **Backend sends reset email** → User receives email with reset link
3. **User clicks reset link** → Frontend captures token from URL
4. **User enters new password** → Frontend submits token + new password
5. **Password is updated** → User can sign in with new password

## 🛠 API Endpoints

### Base URL
```
https://your-api-domain.com/api/v1/auth
```

### 1. Request Password Reset
```http
POST /reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset request processed",
  "data": {
    "message": "If the email exists in our system, a reset link has been sent"
  }
}
```

### 2. Confirm Password Reset
```http
POST /confirm-reset-password
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "new_secure_password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset completed",
  "data": {
    "message": "Password has been reset successfully"
  }
}
```

### 3. Update Password (Authenticated Users)
```http
PUT /update-password
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "password": "new_password123",
  "currentPassword": "old_password123" // Optional but recommended
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "message": "Password has been updated successfully"
  }
}
```

## 💻 Frontend Implementation

### React Implementation

#### 1. Password Reset Request Form

```tsx
// components/PasswordResetRequest.tsx
import React, { useState } from 'react';

interface PasswordResetRequestProps {
  apiBaseUrl: string;
}

const PasswordResetRequest: React.FC<PasswordResetRequestProps> = ({ apiBaseUrl }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.data.message);
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email address"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <a href="/signin" className="text-sm text-blue-600 hover:underline">
          Back to Sign In
        </a>
      </div>
    </div>
  );
};

export default PasswordResetRequest;
```

#### 2. Password Reset Confirmation Form

```tsx
// components/PasswordResetConfirm.tsx
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Next.js 13+
// or import { useHistory, useLocation } from 'react-router-dom'; // React Router

interface PasswordResetConfirmProps {
  apiBaseUrl: string;
}

const PasswordResetConfirm: React.FC<PasswordResetConfirmProps> = ({ apiBaseUrl }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract token from URL parameters
    const urlToken = searchParams.get('token') || searchParams.get('access_token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setMessage('Invalid or missing reset token');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/confirm-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.data.message);
        
        // Redirect to sign in page after 3 seconds
        setTimeout(() => {
          router.push('/signin');
        }, 3000);
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-4">
            This password reset link is invalid or has expired.
          </p>
          <a href="/reset-password" className="text-blue-600 hover:underline">
            Request a new reset link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Set New Password</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
          {isSuccess && (
            <p className="text-sm mt-2">Redirecting to sign in page...</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new password (min 6 characters)"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default PasswordResetConfirm;
```

#### 3. Password Update Form (For Authenticated Users)

```tsx
// components/PasswordUpdateForm.tsx
import React, { useState } from 'react';

interface PasswordUpdateFormProps {
  apiBaseUrl: string;
  accessToken: string;
}

const PasswordUpdateForm: React.FC<PasswordUpdateFormProps> = ({ apiBaseUrl, accessToken }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          password: newPassword,
          currentPassword: currentPassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.data.message);
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to update password');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Update Password</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Current Password (Optional)
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter current password for verification"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new password (min 6 characters)"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default PasswordUpdateForm;
```

### Vanilla JavaScript Implementation

#### Password Reset Request

```javascript
// passwordReset.js
class PasswordReset {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async requestReset(email) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async confirmReset(token, newPassword) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/confirm-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updatePassword(accessToken, password, currentPassword = null) {
    try {
      const body = { password };
      if (currentPassword) {
        body.currentPassword = currentPassword;
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Usage Example
const passwordReset = new PasswordReset('https://your-api-domain.com/api/v1');

// Request password reset
document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  
  const result = await passwordReset.requestReset(email);
  if (result.success) {
    showMessage('Reset email sent!', 'success');
  } else {
    showMessage('Failed to send reset email', 'error');
  }
});
```

## 🔧 Environment Configuration

Add these environment variables to your backend `.env` file:

```env
# Frontend URL for password reset redirect
FRONTEND_URL=http://localhost:3000

# Email configuration for password reset emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@yourstore.com
FROM_NAME=Your Store Name
```

## 🎨 Routing Setup

### Next.js App Router (13+)

```tsx
// app/reset-password/page.tsx
import PasswordResetRequest from '@/components/PasswordResetRequest';

export default function ResetPasswordPage() {
  return (
    <PasswordResetRequest apiBaseUrl={process.env.NEXT_PUBLIC_API_URL} />
  );
}

// app/reset-password/confirm/page.tsx
import PasswordResetConfirm from '@/components/PasswordResetConfirm';

export default function ResetPasswordConfirmPage() {
  return (
    <PasswordResetConfirm apiBaseUrl={process.env.NEXT_PUBLIC_API_URL} />
  );
}
```

### React Router

```tsx
// App.tsx or Router configuration
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PasswordResetRequest from './components/PasswordResetRequest';
import PasswordResetConfirm from './components/PasswordResetConfirm';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/reset-password" 
          element={<PasswordResetRequest apiBaseUrl={process.env.REACT_APP_API_URL} />} 
        />
        <Route 
          path="/reset-password/confirm" 
          element={<PasswordResetConfirm apiBaseUrl={process.env.REACT_APP_API_URL} />} 
        />
      </Routes>
    </Router>
  );
}
```

## 📱 Mobile Integration (React Native)

```typescript
// services/authService.ts
export class AuthService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async requestPasswordReset(email: string) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/confirm-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## 🔐 Security Considerations

### Frontend Security Best Practices

1. **Token Handling**
   ```typescript
   // Always validate token presence
   const token = new URLSearchParams(window.location.search).get('token');
   if (!token || token.length < 10) {
     // Handle invalid token
     return;
   }
   ```

2. **Password Validation**
   ```typescript
   const validatePassword = (password: string) => {
     if (password.length < 6) {
       return 'Password must be at least 6 characters long';
     }
     if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
       return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
     }
     return null;
   };
   ```

3. **Rate Limiting (Frontend)**
   ```typescript
   let lastResetRequest = 0;
   const RESET_COOLDOWN = 60000; // 1 minute

   const canRequestReset = () => {
     return Date.now() - lastResetRequest > RESET_COOLDOWN;
   };
   ```

## 🧪 Testing the Implementation

### 1. Test Password Reset Request
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 2. Test Password Reset Confirmation
```bash
curl -X POST http://localhost:3000/api/v1/auth/confirm-reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"your_reset_token","newPassword":"newpassword123"}'
```

### 3. Test Password Update
```bash
curl -X PUT http://localhost:3000/api/v1/auth/update-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{"password":"newpassword123","currentPassword":"oldpassword123"}'
```

## 🎯 Common Implementation Patterns

### Error Handling

```typescript
const handleApiError = (error: any, fallbackMessage: string) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return fallbackMessage;
};
```

### Loading States

```typescript
const [loadingStates, setLoadingStates] = useState({
  resetRequest: false,
  resetConfirm: false,
  passwordUpdate: false,
});

const setLoading = (action: string, isLoading: boolean) => {
  setLoadingStates(prev => ({
    ...prev,
    [action]: isLoading,
  }));
};
```

### Form Validation

```typescript
interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const validateForm = (data: any): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }
  
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};
```

## 📚 Additional Resources

### TypeScript Interfaces

```typescript
// types/auth.ts
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface PasswordUpdate {
  password: string;
  currentPassword?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}
```

### Custom Hooks (React)

```typescript
// hooks/usePasswordReset.ts
import { useState } from 'react';

export const usePasswordReset = (apiBaseUrl: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { requestReset, loading, error };
};
```

## 🚀 Quick Start Checklist

- [ ] Backend password reset endpoints are running
- [ ] Email service is configured and working
- [ ] Frontend routes are set up (`/reset-password`, `/reset-password/confirm`)
- [ ] Environment variables are configured
- [ ] Test the complete flow:
  - [ ] Request password reset
  - [ ] Check email for reset link
  - [ ] Click link and reset password
  - [ ] Sign in with new password

## 🤝 Support

If you encounter any issues with the password reset implementation:

1. Check the [EMAIL_SYSTEM_GUIDE.md](./EMAIL_SYSTEM_GUIDE.md) for email configuration
2. Verify your environment variables are set correctly
3. Test API endpoints using the provided curl commands
4. Check browser console for any JavaScript errors
5. Review backend logs for any server-side issues

The password reset system is now fully functional and ready for production use!