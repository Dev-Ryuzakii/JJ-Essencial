# Manual Bank Transfer Payment Checkout Integration Guide

This guide provides step-by-step instructions for implementing the manual bank transfer payment flow in your checkout process, showing bank account information to users, and allowing them to upload payment receipts.

## Overview of the Bank Transfer Payment Flow

1. User adds products to cart and proceeds to checkout
2. User selects "Bank Transfer" payment method at checkout
3. System displays bank account details and payment instructions
4. User makes the transfer from their bank to the provided account
5. User uploads proof of payment (receipt/screenshot)
6. Admin verifies the payment and updates the order status

## Frontend Implementation Steps

### 1. Add Bank Transfer as a Payment Option

In your checkout payment method selection component:

```jsx
function PaymentMethodSelector({ onSelectMethod }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  const handleMethodSelection = (method) => {
    setSelectedMethod(method);
    onSelectMethod(method);
  };
  
  return (
    <div className="payment-methods">
      <h3>Select Payment Method</h3>
      
      <div className="payment-method-options">
        <div 
          className={`payment-method ${selectedMethod === 'PAYSTACK' ? 'selected' : ''}`}
          onClick={() => handleMethodSelection('PAYSTACK')}
        >
          <img src="/paystack-logo.png" alt="Paystack" />
          <span>Pay with Card (Paystack)</span>
        </div>
        
        <div 
          className={`payment-method ${selectedMethod === 'FLUTTERWAVE' ? 'selected' : ''}`}
          onClick={() => handleMethodSelection('FLUTTERWAVE')}
        >
          <img src="/flutterwave-logo.png" alt="Flutterwave" />
          <span>Pay with Card (Flutterwave)</span>
        </div>
        
        <div 
          className={`payment-method ${selectedMethod === 'BANK_TRANSFER' ? 'selected' : ''}`}
          onClick={() => handleMethodSelection('BANK_TRANSFER')}
        >
          <img src="/bank-transfer-icon.png" alt="Bank Transfer" />
          <span>Bank Transfer</span>
        </div>
      </div>
    </div>
  );
}
```

### 2. Fetch Bank Account Details

Create a service to fetch bank accounts from the API:

```javascript
// paymentService.js
export const getBankAccounts = async () => {
  try {
    const response = await fetch('/api/v1/payments/bank-accounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return data.data; // Bank accounts are in the data property
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw error;
  }
};
```

### 3. Display Bank Account Information After Checkout

After the user initiates a bank transfer payment, display the bank account details and instructions:

```jsx
function BankTransferDetails({ paymentInfo }) {
  const { bankAccounts, amount, reference, instructions } = paymentInfo;
  
  return (
    <div className="bank-transfer-details">
      <h2>Bank Transfer Instructions</h2>
      
      <div className="payment-info">
        <div className="info-row">
          <span className="label">Amount:</span>
          <span className="value">₦{amount.toLocaleString()}</span>
        </div>
        <div className="info-row">
          <span className="label">Reference:</span>
          <span className="value highlight">{reference}</span>
        </div>
        <p className="important-note">
          Use the reference above as your payment description/narration when making the transfer.
        </p>
      </div>
      
      <div className="bank-accounts">
        <h3>Bank Account Options</h3>
        {bankAccounts.map((account, index) => (
          <div key={index} className="bank-account-card">
            <h4>{account.bankName}</h4>
            <div className="account-details">
              <div className="account-row">
                <span className="label">Account Name:</span>
                <span className="value">{account.accountName}</span>
              </div>
              <div className="account-row">
                <span className="label">Account Number:</span>
                <span className="value highlight copyable">{account.accountNumber}</span>
                <button 
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(account.accountNumber)}
                >
                  Copy
                </button>
              </div>
              {account.sortCode && (
                <div className="account-row">
                  <span className="label">Sort Code:</span>
                  <span className="value">{account.sortCode}</span>
                </div>
              )}
              <div className="account-row">
                <span className="label">Currency:</span>
                <span className="value">{account.currency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="instructions">
        <h3>Instructions</h3>
        <ol>
          {instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ol>
      </div>
      
      {/* Add the receipt upload section */}
      <ReceiptUploader reference={reference} />
    </div>
  );
}
```

### 4. Implement Receipt Upload Component

Create a receipt upload component with a file input and preview:

```jsx
function ReceiptUploader({ reference }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('reference', reference);
      
      const response = await fetch('/api/v1/payments/receipt/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload receipt');
      }
      
      setUploadSuccess(true);
      // Reset file after successful upload
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err.message || 'Error uploading receipt');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="receipt-uploader">
      <h3>Upload Payment Receipt</h3>
      <p className="upload-instructions">
        Please upload a clear photo or screenshot of your payment receipt/confirmation
      </p>
      
      <div className="upload-container">
        <div className="file-input-container">
          <input
            type="file"
            id="receipt"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            disabled={uploading || uploadSuccess}
          />
          <label htmlFor="receipt" className="file-input-label">
            {selectedFile ? 'Change File' : 'Select File'}
          </label>
          {selectedFile && (
            <span className="file-name">{selectedFile.name}</span>
          )}
        </div>
        
        {previewUrl && (
          <div className="image-preview">
            {selectedFile.type.includes('image') ? (
              <img src={previewUrl} alt="Receipt preview" />
            ) : (
              <div className="document-preview">Document selected</div>
            )}
          </div>
        )}
        
        <button 
          className="upload-button" 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading || uploadSuccess}
        >
          {uploading ? 'Uploading...' : 'Upload Receipt'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {uploadSuccess && (
        <div className="success-message">
          <p>Receipt uploaded successfully!</p>
          <p>Our team will verify your payment and update your order status.</p>
          <p>You can check your order status in your account dashboard.</p>
        </div>
      )}
    </div>
  );
}
```

### 5. Integrate with Checkout Flow

Update your checkout flow to handle the bank transfer payment option:

```jsx
function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { order } = useOrderContext(); // Get order details from context
  
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setPaymentInfo(null);
  };
  
  const initiatePayment = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          gateway: paymentMethod,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to initiate payment');
      }
      
      if (paymentMethod === 'BANK_TRANSFER') {
        setPaymentInfo(result.data);
      } else {
        // Redirect to payment gateway
        window.location.href = result.data.authorization_url;
      }
    } catch (err) {
      setError(err.message || 'Error initiating payment');
    } finally {
      setLoading(false);
    }
  };
  
  // For bank transfers, let's also have a way to check payment status later
  const checkPaymentStatus = async () => {
    // Implementation for checking payment status
    // ...
  };
  
  return (
    <div className="checkout-container">
      <h2>Complete Your Order</h2>
      
      {/* Order Summary */}
      <OrderSummary order={order} />
      
      {/* Payment Method Selection */}
      <PaymentMethodSelector onSelectMethod={handlePaymentMethodSelect} />
      
      {/* Payment Button */}
      {!paymentInfo && (
        <button 
          className="payment-button" 
          onClick={initiatePayment} 
          disabled={!paymentMethod || loading}
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      )}
      
      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Bank Transfer Details */}
      {paymentMethod === 'BANK_TRANSFER' && paymentInfo && (
        <BankTransferDetails paymentInfo={paymentInfo} />
      )}
    </div>
  );
}
```

### 6. Add Order Status Tracking

After payment is completed, provide a way for users to check their order status:

```jsx
function OrderStatus({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrderStatus = async () => {
      try {
        const response = await fetch(`/api/v1/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch order status');
        }
        
        setOrder(result.data);
      } catch (err) {
        setError(err.message || 'Error fetching order status');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderStatus();
  }, [orderId]);
  
  if (loading) return <div className="loading">Loading order details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!order) return <div className="not-found">Order not found</div>;
  
  return (
    <div className="order-status">
      <h2>Order Status</h2>
      
      <div className="status-card">
        <div className="status-header">
          <span className="order-number">Order #{order.orderNumber}</span>
          <span className={`status-badge ${order.status.toLowerCase()}`}>
            {order.status}
          </span>
        </div>
        
        <div className="status-details">
          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="detail-row">
            <span className="label">Total:</span>
            <span className="value">₦{order.totalAmount.toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="label">Payment Method:</span>
            <span className="value">{order.paymentMethod}</span>
          </div>
          <div className="detail-row">
            <span className="label">Payment Status:</span>
            <span className="value">{order.paymentStatus}</span>
          </div>
        </div>
        
        {order.paymentStatus === 'AWAITING_VERIFICATION' && (
          <div className="verification-pending">
            <p>Your payment is awaiting verification. This usually takes 1-2 hours during business hours.</p>
          </div>
        )}
        
        {/* Order Items */}
        <div className="order-items">
          <h3>Items</h3>
          {order.items.map(item => (
            <div key={item.id} className="order-item">
              <img src={item.product.images[0]} alt={item.product.name} className="item-image" />
              <div className="item-details">
                <h4>{item.product.name}</h4>
                <div className="item-meta">
                  <span className="quantity">Qty: {item.quantity}</span>
                  <span className="price">₦{item.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## CSS Styling

Add these CSS styles to make your manual payment flow look professional:

```css
/* Bank Transfer Styling */
.bank-transfer-details {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.payment-info {
  background-color: #edf7ff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
  width: 120px;
}

.value {
  flex-grow: 1;
}

.value.highlight {
  font-weight: bold;
  color: #0066cc;
}

.important-note {
  color: #d32f2f;
  font-size: 14px;
  font-weight: bold;
  margin-top: 10px;
}

.bank-accounts {
  margin-bottom: 30px;
}

.bank-account-card {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.bank-account-card h4 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.account-details {
  padding-top: 10px;
}

.account-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.value.copyable {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 5px 10px;
  border-radius: 4px;
}

.copy-btn {
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 12px;
}

.copy-btn:hover {
  background-color: #0052a3;
}

.instructions ol {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
  line-height: 1.5;
}

/* Receipt Uploader Styling */
.receipt-uploader {
  margin-top: 30px;
  border-top: 1px solid #ddd;
  padding-top: 20px;
}

.upload-instructions {
  color: #666;
  margin-bottom: 15px;
}

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-input-container {
  display: flex;
  align-items: center;
}

.file-input-container input[type="file"] {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}

.file-input-label {
  background-color: #0066cc;
  color: white;
  display: inline-block;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.file-input-label:hover {
  background-color: #0052a3;
}

.file-name {
  margin-left: 10px;
  font-size: 14px;
  color: #555;
}

.image-preview {
  max-width: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.document-preview {
  background-color: #f5f5f5;
  padding: 20px;
  text-align: center;
  color: #666;
}

.upload-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  width: fit-content;
}

.upload-button:hover {
  background-color: #3e8e41;
}

.upload-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #d32f2f;
  background-color: #ffeaef;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
}

.success-message {
  color: #2e7d32;
  background-color: #e8f5e9;
  padding: 15px;
  border-radius: 4px;
  margin-top: 15px;
}
```

## Backend APIs Used

This implementation utilizes the following backend APIs:

1. **Get Bank Accounts**: `GET /api/v1/payments/bank-accounts`
2. **Initiate Bank Transfer**: `POST /api/v1/payments/bank-transfer/initiate`
3. **Upload Receipt**: `POST /api/v1/payments/receipt/upload`
4. **Check Order Status**: `GET /api/v1/orders/:id`

## Testing the Implementation

1. Make sure all bank accounts are added in the admin panel
2. Test the checkout process and select Bank Transfer
3. Verify that bank account details are displayed correctly
4. Test uploading different file types for receipts
5. Verify the order status changes after admin verification

## Additional Features to Consider

1. **Email Notifications**: Send email to the user when their payment is verified
2. **Receipt Gallery**: Allow users to view previously uploaded receipts
3. **Status Tracking**: Add a visual timeline of order processing stages
4. **Auto-copy**: One-click copy to clipboard for account numbers
5. **QR Codes**: Generate payment QR codes for bank apps that support scanning

---

By following this guide, you will have implemented a complete manual bank transfer payment flow with receipt upload functionality, providing your customers with an alternative payment option when card payments are not preferred.
