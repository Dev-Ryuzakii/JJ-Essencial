# Frontend Integration Guide - Flutterwave Payment System

## Overview
This guide provides complete integration instructions for implementing Flutterwave payment system in your React/TypeScript frontend. The backend API is already configured and ready to accept payment requests.

---

## 🚀 Prerequisites

### 1. Install Flutterwave React Library
```bash
npm install flutterwave-react-v3
# or
yarn add flutterwave-react-v3
```

### 2. Environment Variables
Add to your `.env` file:
```env
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-0dc49893b9533ea514d77df13b0b1953-X
```

---

## 🎯 API Endpoints

### Backend Endpoints Available:
- **Initiate Payment**: `POST /api/v1/payments/flutterwave/initiate`
- **Confirm Payment**: `POST /api/v1/payments/flutterwave/confirm`
- **Payment History**: `GET /api/v1/payments/history`

---

## 📋 Implementation Steps

### Step 1: Create Payment Service

Create `src/services/paymentService.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface InitiateFlutterwaveDto {
  orderId: string;
  amount: number;
  currency?: string;
  customer: {
    email: string;
    name: string;
    phone: string;
  };
}

export interface FlutterwaveInitiateResponse {
  success: boolean;
  message: string;
  data: {
    publicKey: string;
    tx_ref: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
      name: string;
      phone: string;
    };
  };
}

export interface FlutterwaveConfirmDto {
  transaction_id: string;
}

export class PaymentService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  static async initiateFlutterwavePayment(data: InitiateFlutterwaveDto): Promise<FlutterwaveInitiateResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payments/flutterwave/initiate`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to initiate payment');
    }
  }

  static async confirmFlutterwavePayment(data: FlutterwaveConfirmDto) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/payments/flutterwave/confirm`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to confirm payment');
    }
  }

  static async getPaymentHistory() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payments/history`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  }
}
```

### Step 2: Create Payment Component

Create `src/components/FlutterwavePayment.tsx`:

```typescript
import React, { useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { PaymentService, InitiateFlutterwaveDto } from '../services/paymentService';
import { toast } from 'react-toastify'; // or your preferred notification library

interface FlutterwavePaymentProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  onPaymentSuccess?: (response: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentClose?: () => void;
}

const FlutterwavePayment: React.FC<FlutterwavePaymentProps> = ({
  orderId,
  amount,
  customerEmail,
  customerName,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
  onPaymentClose
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  const handleFlutterwave = useFlutterwave(paymentConfig || {});

  const initiatePayment = async () => {
    setLoading(true);
    try {
      // Step 1: Call backend to initiate payment
      const initiateData: InitiateFlutterwaveDto = {
        orderId,
        amount,
        currency: 'NGN',
        customer: {
          email: customerEmail,
          name: customerName,
          phone: customerPhone
        }
      };

      const response = await PaymentService.initiateFlutterwavePayment(initiateData);
      
      if (response.success) {
        // Step 2: Configure Flutterwave checkout
        const config = {
          public_key: response.data.publicKey,
          tx_ref: response.data.tx_ref,
          amount: response.data.amount,
          currency: response.data.currency,
          payment_options: 'card,banktransfer,ussd',
          customer: {
            email: response.data.customer.email,
            phone_number: response.data.customer.phone,
            name: response.data.customer.name,
          },
          customizations: {
            title: 'Payment for Order',
            description: `Payment for order ${orderId}`,
            logo: 'https://your-logo-url.com/logo.png', // Optional
          },
        };

        setPaymentConfig(config);

        // Step 3: Open Flutterwave checkout
        handleFlutterwave({
          callback: async (response: any) => {
            console.log('Flutterwave Response:', response);
            
            if (response.status === 'successful') {
              try {
                // Step 4: Confirm payment with backend
                const confirmResponse = await PaymentService.confirmFlutterwavePayment({
                  transaction_id: response.transaction_id
                });
                
                if (confirmResponse.success) {
                  toast.success('Payment successful!');
                  onPaymentSuccess?.(confirmResponse);
                } else {
                  toast.error('Payment confirmation failed');
                  onPaymentError?.(confirmResponse);
                }
              } catch (error) {
                console.error('Payment confirmation error:', error);
                toast.error('Payment confirmation failed');
                onPaymentError?.(error);
              }
            } else {
              toast.error('Payment was not successful');
              onPaymentError?.(response);
            }
            
            closePaymentModal(); // Close modal
          },
          onClose: () => {
            console.log('Payment modal closed');
            onPaymentClose?.();
          },
        });
      } else {
        toast.error(response.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={initiatePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      ) : (
        `Pay ₦${amount.toLocaleString()}`
      )}
    </button>
  );
};

export default FlutterwavePayment;
```

### Step 3: Usage Example

In your order/checkout page:

```typescript
import React from 'react';
import FlutterwavePayment from '../components/FlutterwavePayment';
import { useNavigate } from 'react-router-dom';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Your order data
  const orderData = {
    orderId: 'order-uuid-here',
    amount: 17000,
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    customerPhone: '+2349037162097'
  };

  const handlePaymentSuccess = (response: any) => {
    console.log('Payment successful:', response);
    // Redirect to success page or update UI
    navigate('/payment-success');
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    // Handle payment error
  };

  const handlePaymentClose = () => {
    console.log('Payment modal closed');
    // Handle modal close
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      
      {/* Order Summary */}
      <div className="order-summary mb-6">
        <h2>Order Summary</h2>
        <p>Order ID: {orderData.orderId}</p>
        <p>Amount: ₦{orderData.amount.toLocaleString()}</p>
      </div>

      {/* Payment Button */}
      <FlutterwavePayment
        orderId={orderData.orderId}
        amount={orderData.amount}
        customerEmail={orderData.customerEmail}
        customerName={orderData.customerName}
        customerPhone={orderData.customerPhone}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        onPaymentClose={handlePaymentClose}
      />
    </div>
  );
};

export default CheckoutPage;
```

---

## 🔧 Advanced Configuration

### Custom Styling
```typescript
const customStyles = {
  customizations: {
    title: 'Your Store Name',
    description: 'Payment for your order',
    logo: 'https://your-domain.com/logo.png',
  },
  styles: {
    popup: {
      backgroundColor: '#ffffff',
      color: '#333333'
    }
  }
};
```

### Payment Options
```typescript
// Available payment options
payment_options: 'card,banktransfer,ussd,account,mpesa,mobilemoneyrwanda'

// Specific options
payment_options: 'card,banktransfer' // Only cards and bank transfer
```

### Error Handling
```typescript
const handleErrors = (error: any) => {
  switch (error.response?.status) {
    case 401:
      // Redirect to login
      navigate('/login');
      break;
    case 404:
      toast.error('Order not found');
      break;
    case 500:
      toast.error('Server error. Please try again.');
      break;
    default:
      toast.error(error.message || 'An error occurred');
  }
};
```

---

## 🧪 Testing

### Test Data
Use these test cards for development:

**Successful Payment:**
- Card: 5531 8866 5214 2950
- CVV: 564
- Expiry: 09/32
- PIN: 3310
- OTP: 12345

**Failed Payment:**
- Card: 5840 8366 5214 2950
- CVV: 564
- Expiry: 09/32

### Test Environment
```env
# Development
REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-0dc49893b9533ea514d77df13b0b1953-X

# Production (replace with actual production key)
REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-production-key
```

---

## 🚀 Deployment Checklist

### Before Production:
- [ ] Replace test public key with production key
- [ ] Update API base URL to production endpoint
- [ ] Test payment flow with real cards
- [ ] Implement proper error logging
- [ ] Add payment receipt functionality
- [ ] Set up webhook endpoints for payment status updates
- [ ] Implement payment history page

### Security Notes:
- Never expose secret keys in frontend code
- Always validate payments on the backend
- Use HTTPS in production
- Implement proper authentication
- Log all payment attempts for audit

---

## 📞 Support

### Backend Endpoints Status:
- ✅ `/payments/flutterwave/initiate` - Ready
- ✅ `/payments/flutterwave/confirm` - Ready
- ✅ `/payments/history` - Ready

### Troubleshooting:
1. **"Order not found"** - Ensure orderId exists and belongs to authenticated user
2. **"Payment confirmation failed"** - Check transaction_id from Flutterwave callback
3. **"Unauthorized"** - Verify JWT token is included in requests
4. **Network errors** - Check API_BASE_URL and server status

---

## 🎉 Next Steps

1. **Implement the Payment Service** - Copy the service code
2. **Create the Payment Component** - Use the provided component
3. **Test Integration** - Use test cards to verify flow
4. **Add Error Handling** - Implement proper error states
5. **Style the UI** - Customize to match your design
6. **Go Live** - Switch to production keys when ready

The backend is fully configured and waiting for your frontend integration!