# 🚀 Quick API Reference Card

## Key Endpoints (Updated Sept 12, 2025)

### 🏪 Products
```
GET /api/v1/products              // List products
GET /api/v1/products/:id          // Get product details
```

### 🛒 Orders  
```
POST /api/v1/orders               // Create order
GET /api/v1/orders                // Get user orders
GET /api/v1/orders/:id            // Get order details
```

### 💳 Payments (Bank Transfer) ✅ FIXED
```
GET /api/v1/payments/bank-transfer/bank-accounts    // Get bank accounts
POST /api/v1/payments/bank-transfer/initiate        // Start bank transfer
POST /api/v1/payments/bank-transfer/upload-receipt  // Upload receipt
```

### 👤 Auth
```
POST /api/v1/auth/login           // Login
POST /api/v1/auth/register        // Register
GET /api/v1/auth/profile          // Get profile
```

## 🔧 Quick Fix Summary
- ✅ **Bank Service**: Fixed `bank_account` → `bank_accounts` table name
- ✅ **Product Props**: Fixed `isActive` property consistency  
- ✅ **DTOs**: Added missing `CreateBankAccountDto`
- ✅ **Responses**: Standardized `SuccessResponseDto` format

## 📱 Frontend Usage
```typescript
// Get bank accounts (now working!)
const response = await fetch('/api/v1/payments/bank-transfer/bank-accounts', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: bankAccounts } = await response.json();

// Create order
const order = await fetch('/api/v1/orders', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});
```

## 🎯 Verified Working
- ✅ Bank accounts display in checkout
- ✅ Order creation with bank transfer
- ✅ Receipt upload functionality
- ✅ Product validation fixed
- ✅ All DTOs properly typed

**Status**: Ready for production ✨