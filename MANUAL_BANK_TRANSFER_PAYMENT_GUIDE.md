# Manual Bank Transfer Payment System - Frontend Integration Guide

## Overview
This guide demonstrates how to implement a complete manual bank transfer payment system for your e-commerce frontend. Users will select bank transfer as payment method, get bank account details, make transfers, and upload proof of payment for verification.

## System Flow

```
User Checkout → Select Bank Transfer → Get Bank Details → Make Transfer → Upload Receipt → Admin Verification → Order Confirmation
```

## Backend APIs Available

### Public Endpoints (No Authentication Required)
```
GET /api/v1/payments/bank-accounts - Get bank accounts for customer checkout
```

### Authenticated Endpoints (Require JWT Token)
```
POST /api/v1/payments/bank-transfer/initiate - Initiate bank transfer payment
POST /api/v1/payments/receipt/upload - Upload payment receipt
```

### Admin Endpoints (Require Admin Role)
```
GET /api/v1/admin/settings/bank-accounts - Admin bank account management
POST /api/v1/admin/settings/bank-accounts - Add new bank account
GET /api/v1/payments/receipts/pending - View pending receipt verifications
PATCH /api/v1/payments/receipt/:receiptId/verify - Verify payment receipts
```

---

## API Integration Details

### 1. Getting Bank Account Information

**Endpoint:** `GET /api/v1/payments/bank-accounts`
**Access:** Public (no authentication required)

```javascript
const getBankAccounts = async () => {
  try {
    const response = await fetch('/api/v1/payments/bank-accounts', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw error;
  }
};
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Bank accounts retrieved successfully",
  "data": [
    {
      "id": "1",
      "bank_name": "First Bank Nigeria",
      "account_name": "JJ Essential Store",
      "account_number": "1234567890",
      "currency": "NGN"
    }
  ],
  "timestamp": "2025-08-24T11:29:41.002Z"
}
```
```

### 2. Initiating Bank Transfer Payment

**Endpoint:** `POST /api/v1/payments/bank-transfer/initiate`
**Access:** Authenticated Users

```javascript
const initiateBankTransfer = async (orderId, token) => {
  try {
    const response = await fetch('/api/v1/payments/bank-transfer/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error initiating bank transfer:', error);
    throw error;
  }
};
```

**Request Body:**
```json
{
  "orderId": "order-uuid"
}
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Bank transfer details provided successfully",
  "data": {
    "reference": "BT_1724516400_ABC123",
    "amount": 25000,
    "orderId": "order-uuid",
    "bankAccounts": [
      {
        "bankName": "First Bank Nigeria",
        "accountName": "Your Company Name",
        "accountNumber": "1234567890",
        "sortCode": "123456",
        "currency": "NGN"
      }
    ],
    "instructions": [
      "Transfer the exact amount: ₦25,000",
      "Use the reference: BT_1724516400_ABC123",
      "Upload a clear screenshot or photo of your payment receipt",
      "Payment will be verified within 24 hours"
    ]
  },
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

### 3. Uploading Payment Receipt

**Endpoint:** `POST /api/v1/payments/receipt/upload`
**Access:** Authenticated Users
**Content-Type:** `multipart/form-data`

```javascript
const uploadPaymentReceipt = async (reference, file, token) => {
  try {
    const formData = new FormData();
    formData.append('reference', reference);
    formData.append('file', file);

    const response = await fetch('/api/v1/payments/receipt/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    throw error;
  }
};
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Receipt uploaded successfully",
  "data": {
    "id": "receipt-uuid",
    "reference": "BT_1724516400_ABC123",
    "userId": "user-uuid",
    "receiptUrl": "uploads/receipts/1724516400_receipt.jpg",
    "status": "PENDING",
    "uploadedAt": "2025-08-24T10:00:00.000Z"
  },
  "timestamp": "2025-08-24T10:00:00.000Z"
}
```

---

## React Components Implementation

### 1. Bank Account Selection Component

```typescript
import React, { useState, useEffect } from 'react';

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
}

interface BankAccountSelectorProps {
  onSelect: (account: BankAccount) => void;
  selectedAccount?: BankAccount;
}

const BankAccountSelector: React.FC<BankAccountSelectorProps> = ({ 
  onSelect, 
  selectedAccount 
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      // Updated to use the new public endpoint
      const response = await fetch('/api/v1/payments/bank-accounts');
      const result = await response.json();

      if (result.success) {
        setBankAccounts(result.data || []);
        
        // Auto-select first account if none selected
        if (result.data.length > 0 && !selectedAccount) {
          onSelect(result.data[0]);
        }
      } else {
        setError('Failed to load bank accounts');
      }
    } catch (err) {
      setError('Error loading bank accounts');
      console.error('Error fetching bank accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading bank accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <div className="text-gray-600 p-4 border border-gray-200 rounded-lg">
        No bank accounts available for transfers.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Select Bank Account for Transfer</h3>
      {bankAccounts.map((account) => (
        <div
          key={account.id}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedAccount?.id === account.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect(account)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{account.bank_name}</h4>
              <p className="text-gray-600">{account.account_name}</p>
              <p className="text-lg font-mono font-bold text-blue-600">
                {account.account_number}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">{account.currency}</span>
              {selectedAccount?.id === account.id && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Selected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BankAccountSelector;
```

### 2. Bank Transfer Payment Component

```typescript
import React, { useState } from 'react';
import BankAccountSelector from './BankAccountSelector';

interface BankTransferData {
  reference: string;
  amount: number;
  orderId: string;
  bankAccounts: Array<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    sortCode?: string;
    currency: string;
  }>;
  instructions: string[];
}

interface BankTransferPaymentProps {
  orderId: string;
  orderAmount: number;
  onPaymentInitiated: (data: BankTransferData) => void;
  onError: (error: string) => void;
}

const BankTransferPayment: React.FC<BankTransferPaymentProps> = ({
  orderId,
  orderAmount,
  onPaymentInitiated,
  onError
}) => {
  const [transferData, setTransferData] = useState<BankTransferData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const initiateBankTransfer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/v1/payments/bank-transfer/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      });

      const result = await response.json();

      if (result.success) {
        setTransferData(result.data);
        onPaymentInitiated(result.data);
      } else {
        onError(result.message || 'Failed to initiate bank transfer');
      }
    } catch (error) {
      onError('Error initiating bank transfer');
      console.error('Bank transfer error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  if (!transferData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Bank Transfer Payment</h3>
          <p className="text-gray-600">
            You will receive bank account details to complete your payment of ₦{orderAmount.toLocaleString()}
          </p>
        </div>

        <BankAccountSelector 
          onSelect={setSelectedAccount}
          selectedAccount={selectedAccount}
        />

        <button
          onClick={initiateBankTransfer}
          disabled={loading || !selectedAccount}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Initiating...' : 'Proceed with Bank Transfer'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Bank Transfer Details
        </h3>
        <p className="text-green-700">
          Please complete the transfer and upload your receipt for verification.
        </p>
      </div>

      {/* Transfer Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount to Transfer</label>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-600">
              ₦{transferData.amount.toLocaleString()}
            </span>
            <button
              onClick={() => copyToClipboard(transferData.amount.toString())}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Copy
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Reference</label>
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg">{transferData.reference}</span>
            <button
              onClick={() => copyToClipboard(transferData.reference)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="space-y-3">
        <h4 className="font-semibold">Transfer to any of these accounts:</h4>
        {transferData.bankAccounts.map((account, index) => (
          <div key={index} className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{account.bank_name}</span>
                  <button
                    onClick={() => copyToClipboard(account.bank_name)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{account.account_name}</span>
                  <button
                    onClick={() => copyToClipboard(account.account_name)}
                    onClick={() => copyToClipboard(account.accountName)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-blue-600">
                    {account.account_number}
                  </span>
                  <button
                    onClick={() => copyToClipboard(account.account_number)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">Important Instructions:</h4>
        <ul className="list-disc list-inside space-y-1 text-yellow-700">
          {transferData.instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BankTransferPayment;
```

### 3. Receipt Upload Component

```typescript
import React, { useState, useRef } from 'react';

interface ReceiptUploadProps {
  paymentReference: string;
  onUploadSuccess: (receiptData: any) => void;
  onError: (error: string) => void;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  paymentReference,
  onUploadSuccess,
  onError
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        onError('Please select a valid image (JPG, PNG) or PDF file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const uploadReceipt = async () => {
    if (!selectedFile) {
      onError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('authToken');
      
      const formData = new FormData();
      formData.append('reference', paymentReference);
      formData.append('file', selectedFile);

      const response = await fetch('/api/v1/payments/receipt/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        onUploadSuccess(result.data);
      } else {
        onError(result.message || 'Failed to upload receipt');
      }
    } catch (error) {
      onError('Error uploading receipt');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Upload Payment Receipt</h4>
        <p className="text-blue-700 text-sm">
          Upload a clear photo or screenshot of your payment receipt for verification.
        </p>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        {!selectedFile ? (
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              <label htmlFor="receipt-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                Click to upload receipt
              </label>
              <span> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, PDF up to 5MB
            </p>
            <input
              ref={fileInputRef}
              id="receipt-upload"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            {preview ? (
              <div className="text-center">
                <img src={preview} alt="Receipt preview" className="max-h-40 mx-auto rounded-lg" />
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              </div>
            )}

            {/* File Info */}
            <div className="text-center text-sm text-gray-600">
              <p>File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={removeFile}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Remove
              </button>
              <button
                onClick={uploadReceipt}
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Receipt'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Additional Instructions */}
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Tips for a clear receipt:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Ensure all text is clearly visible</li>
          <li>Include the payment reference: <span className="font-mono">{paymentReference}</span></li>
          <li>Show the amount transferred</li>
          <li>Include bank name and account details</li>
          <li>Ensure good lighting and minimal shadows</li>
        </ul>
      </div>
    </div>
  );
};

export default ReceiptUpload;
```

### 4. Complete Checkout Integration

```typescript
import React, { useState } from 'react';
import BankTransferPayment from './BankTransferPayment';
import ReceiptUpload from './ReceiptUpload';

interface Order {
  id: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

interface CheckoutProps {
  order: Order;
  onOrderComplete: (paymentData: any) => void;
}

const Checkout: React.FC<CheckoutProps> = ({ order, onOrderComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'card' | null>(null);
  const [transferData, setTransferData] = useState<any>(null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaymentMethodSelect = (method: 'bank_transfer' | 'card') => {
    setPaymentMethod(method);
    setError(null);
  };

  const handleBankTransferInitiated = (data: any) => {
    setTransferData(data);
  };

  const handleReceiptUploaded = (receiptData: any) => {
    setReceiptUploaded(true);
    onOrderComplete({
      type: 'bank_transfer',
      reference: transferData.reference,
      receipt: receiptData,
      status: 'awaiting_verification'
    });
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Order Summary */}
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold mb-4">Complete Your Order</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                ₦{order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-6 pb-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        {!paymentMethod && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
            <div className="space-y-3">
              <button
                onClick={() => handlePaymentMethodSelect('bank_transfer')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Bank Transfer</h4>
                    <p className="text-gray-600">Transfer to our bank account and upload receipt</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handlePaymentMethodSelect('card')}
                disabled
                className="w-full p-4 border-2 border-gray-200 rounded-lg text-left opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-500">Card Payment</h4>
                    <p className="text-gray-400">Coming Soon - Pay with debit/credit card</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Bank Transfer Flow */}
        {paymentMethod === 'bank_transfer' && !receiptUploaded && (
          <div className="p-6">
            {!transferData ? (
              <BankTransferPayment
                orderId={order.id}
                orderAmount={order.totalAmount}
                onPaymentInitiated={handleBankTransferInitiated}
                onError={handleError}
              />
            ) : (
              <ReceiptUpload
                paymentReference={transferData.reference}
                onUploadSuccess={handleReceiptUploaded}
                onError={handleError}
              />
            )}
          </div>
        )}

        {/* Success State */}
        {receiptUploaded && (
          <div className="p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Receipt Uploaded Successfully!</h3>
              <p className="text-gray-600 mb-4">
                Your payment receipt has been uploaded and is being verified. 
                You will receive an email confirmation once your payment is approved.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  <strong>Reference:</strong> {transferData.reference}<br />
                  <strong>Verification Time:</strong> Within 24 hours
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        {paymentMethod && !receiptUploaded && (
          <div className="border-t p-6">
            <button
              onClick={() => {
                setPaymentMethod(null);
                setTransferData(null);
                setError(null);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Payment Methods
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
```

---

## Admin Receipt Verification

For admin users to verify uploaded receipts:

```typescript
import React, { useState, useEffect } from 'react';

interface PaymentReceipt {
  id: string;
  reference: string;
  userId: string;
  receiptUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  user: {
    fullName: string;
    email: string;
  };
  payment: {
    amount: number;
    orderId: string;
  };
}

const AdminReceiptVerification: React.FC = () => {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingReceipts();
  }, []);

  const fetchPendingReceipts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/payments/receipts/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setReceipts(result.data);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyReceipt = async (receiptId: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/payments/receipt/${receiptId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNote: note })
      });

      if (response.ok) {
        // Remove from pending list
        setReceipts(prev => prev.filter(r => r.id !== receiptId));
      }
    } catch (error) {
      console.error('Error verifying receipt:', error);
    }
  };

  if (loading) return <div>Loading receipts...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payment Receipt Verification</h2>
      
      {receipts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No pending receipts to verify
        </div>
      ) : (
        <div className="grid gap-6">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="border rounded-lg p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Payment Details</h3>
                  <div className="space-y-2">
                    <p><strong>Reference:</strong> {receipt.reference}</p>
                    <p><strong>Amount:</strong> ₦{receipt.payment.amount.toLocaleString()}</p>
                    <p><strong>Order ID:</strong> {receipt.payment.orderId}</p>
                    <p><strong>Customer:</strong> {receipt.user.fullName}</p>
                    <p><strong>Email:</strong> {receipt.user.email}</p>
                    <p><strong>Uploaded:</strong> {new Date(receipt.uploadedAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Receipt Image</h4>
                  <img 
                    src={receipt.receiptUrl} 
                    alt="Payment receipt" 
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => verifyReceipt(receipt.id, 'APPROVED')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => verifyReceipt(receipt.id, 'REJECTED', 'Receipt unclear or invalid')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReceiptVerification;
```

---

## Summary

This manual bank transfer payment system provides:

### For Customers:
- ✅ View available bank accounts for transfer
- ✅ Get payment reference and instructions
- ✅ Easy copy-to-clipboard functionality
- ✅ Receipt upload with preview
- ✅ Real-time status updates

### For Admins:
- ✅ Manage bank accounts in settings
- ✅ Verify uploaded receipts
- ✅ Approve/reject payments
- ✅ Email notifications for status changes

### Key Features:
- 🔒 Secure file upload (images and PDFs)
- 📱 Mobile-friendly interface
- 💾 Automatic receipt storage
- 📧 Email notifications
- 🔄 Real-time status updates
- 🎨 Clean, professional UI

This system allows you to accept payments manually while maintaining professional appearance and user experience until you implement automated payment gateways! 🚀
