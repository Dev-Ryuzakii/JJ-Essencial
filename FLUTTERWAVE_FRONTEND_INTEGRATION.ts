// Frontend Integration Example for Flutterwave Inline Payment
// This file shows how to integrate with the backend Flutterwave endpoints

interface FlutterwaveInitiateRequest {
  orderId: string;
  amount: number;
  currency?: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
}

interface FlutterwaveInitiateResponse {
  publicKey: string;
  tx_ref: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
}

interface FlutterwaveVerifyRequest {
  transaction_id: string;
  tx_ref?: string;
}

// Declare the Flutterwave global function
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

class FlutterwavePaymentService {
  private baseUrl: string = 'https://jj-essencial.onrender.com/api/v1';

  constructor() {
    // Load Flutterwave script if not already loaded
    this.loadFlutterwaveScript();
  }

  private loadFlutterwaveScript(): void {
    if (document.getElementById('flutterwave-script')) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.id = 'flutterwave-script';
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => {
      console.log('Flutterwave script loaded successfully');
    };
    script.onerror = () => {
      console.error('Failed to load Flutterwave script');
    };
    document.head.appendChild(script);
  }

  private getAuthToken(): string {
    return localStorage.getItem('access_token') || '';
  }

  async initiatePayment(paymentData: FlutterwaveInitiateRequest): Promise<FlutterwaveInitiateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/flutterwave/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to initiate payment');
      }

      return result.data;
    } catch (error) {
      console.error('Payment initiation failed:', error);
      throw error;
    }
  }

  async confirmPayment(verifyData: FlutterwaveVerifyRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/flutterwave/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(verifyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw error;
    }
  }

  async processPayment(paymentRequest: FlutterwaveInitiateRequest, callbacks?: {
    onSuccess?: (transaction: any) => void;
    onError?: (error: any) => void;
    onClose?: () => void;
  }): Promise<void> {
    try {
      // Step 1: Initiate payment with backend
      console.log('🔄 Initiating payment with backend...');
      const initResponse = await this.initiatePayment(paymentRequest);
      console.log('✅ Payment initiated:', initResponse);

      // Step 2: Check if Flutterwave script is loaded
      if (typeof window.FlutterwaveCheckout !== 'function') {
        throw new Error('Flutterwave script not loaded. Please refresh and try again.');
      }

      // Step 3: Open Flutterwave Inline modal
      console.log('💳 Opening Flutterwave checkout modal...');
      window.FlutterwaveCheckout({
        public_key: initResponse.publicKey,
        tx_ref: initResponse.tx_ref,
        amount: initResponse.amount,
        currency: initResponse.currency,
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email: initResponse.customer.email,
          phone_number: initResponse.customer.phone || '',
          name: initResponse.customer.name,
        },
        callback: async (flutterResponse: any) => {
          console.log('📱 Flutterwave callback received:', flutterResponse);
          
          try {
            // Step 4: Verify payment with backend
            console.log('🔄 Verifying payment with backend...');
            const verifyResult = await this.confirmPayment({
              transaction_id: flutterResponse.transaction_id || flutterResponse.id,
              tx_ref: flutterResponse.tx_ref || initResponse.tx_ref,
            });

            console.log('✅ Payment verified:', verifyResult);

            if (verifyResult.success) {
              // Payment successful
              callbacks?.onSuccess?.(verifyResult);
              this.showSuccessMessage('Payment completed successfully!');
            } else {
              // Payment failed
              callbacks?.onError?.(verifyResult);
              this.showErrorMessage(verifyResult.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            callbacks?.onError?.(error);
            this.showErrorMessage('Payment verification failed. Please contact support.');
          }
        },
        onclose: () => {
          console.log('🔴 Payment modal closed by user');
          callbacks?.onClose?.();
        },
        customizations: {
          title: 'JJ Essential Store',
          description: `Payment for order ${paymentRequest.orderId}`,
          logo: 'https://your-logo-url.com/logo.png', // Optional: Add your logo
        },
      });
    } catch (error) {
      console.error('❌ Payment process failed:', error);
      callbacks?.onError?.(error);
      this.showErrorMessage(error instanceof Error ? error.message : 'Payment failed');
    }
  }

  private showSuccessMessage(message: string): void {
    // You can replace this with your preferred notification library
    alert(`✅ ${message}`);
  }

  private showErrorMessage(message: string): void {
    // You can replace this with your preferred notification library
    alert(`❌ ${message}`);
  }
}

// Usage Example
export class PaymentComponent {
  private flutterwaveService: FlutterwavePaymentService;

  constructor() {
    this.flutterwaveService = new FlutterwavePaymentService();
  }

  async handlePayment(orderId: string, amount: number, customer: { email: string; name: string; phone?: string }) {
    try {
      await this.flutterwaveService.processPayment(
        {
          orderId,
          amount,
          currency: 'NGN',
          customer,
        },
        {
          onSuccess: (transaction) => {
            console.log('✅ Payment successful!', transaction);
            // Redirect to success page or update UI
            window.location.href = '/payment/success';
          },
          onError: (error) => {
            console.error('❌ Payment failed:', error);
            // Show error message to user
            this.showPaymentError(error);
          },
          onClose: () => {
            console.log('🔴 Payment modal was closed');
            // Optional: Handle modal close (user cancelled)
          },
        }
      );
    } catch (error) {
      console.error('Failed to start payment process:', error);
      this.showPaymentError(error);
    }
  }

  private showPaymentError(error: any): void {
    // Implement your error handling UI here
    const errorMessage = error?.message || 'Payment failed. Please try again.';
    // For example, show a toast or update an error state
    console.error('Payment error:', errorMessage);
  }
}

// Example usage in a React component (convert to .tsx file to use)
/*
export const PaymentButtonExample = () => {
  const paymentComponent = new PaymentComponent();

  const handlePayClick = () => {
    paymentComponent.handlePayment(
      'order-123', // orderId
      5000, // amount in NGN
      {
        email: 'customer@example.com',
        name: 'John Doe',
        phone: '+2348123456789',
      }
    );
  };

  return (
    <button 
      onClick={handlePayClick}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
    >
      Pay with Flutterwave
    </button>
  );
};
*/

export default FlutterwavePaymentService;