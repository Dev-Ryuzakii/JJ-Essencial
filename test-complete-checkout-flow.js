const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test user credentials
const EMAIL = 'faladerasaq22@gmail.com';
const PASSWORD = '1234567890';

async function testCompleteCheckoutFlow() {
  try {
    console.log('=== Complete Checkout Flow Test ===\n');

    // Step 1: Sign in to get JWT token
    console.log('1. Signing in...');
    const signInResponse = await axios.post(`${BASE_URL}/auth/signin`, {
      email: EMAIL,
      password: PASSWORD
    });

    const token = signInResponse.data.data?.access_token || signInResponse.data.data?.token || signInResponse.data.token;
    console.log('✅ Sign in successful');
    console.log('Token:', token ? token.substring(0, 50) + '...' : 'Token received', '\n');

    // Step 2: Create an order
    console.log('2. Creating order...');
    const orderData = {
      items: [
        {
          productId: 'c0ab9f4b-1d30-4754-af70-257d60f7d361',
          quantity: 1
        }
      ],
      deliveryAddress: {
        phone: '+234801234567',
        address: '123 Lagos Street',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '100001',
        country: 'Nigeria'
      },
      orderNotes: 'Please handle with care'
    };

    const createOrderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const orderId = createOrderResponse.data.data.id;
    console.log('✅ Order created successfully');
    console.log('Order ID:', orderId);
    console.log('Order Total:', createOrderResponse.data.data.totalAmount);
    console.log('Order Status:', createOrderResponse.data.data.status, '\n');

    // Step 3: Retrieve the order
    console.log('3. Retrieving order...');
    const getOrderResponse = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Order retrieved successfully');
    console.log('Order ID:', getOrderResponse.data.data.id);
    console.log('Order Items:', getOrderResponse.data.data.orderItems.length);
    console.log('Product Name:', getOrderResponse.data.data.orderItems[0].product.name, '\n');

    // Step 4: Get available bank accounts
    console.log('4. Getting bank accounts for payment...');
    const bankAccountsResponse = await axios.get(`${BASE_URL}/payments/bank-accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Bank accounts retrieved');
    console.log('Available banks:', bankAccountsResponse.data.data.length);
    if (bankAccountsResponse.data.data.length > 0) {
      console.log('First bank:', bankAccountsResponse.data.data[0].bank_name);
    }
    console.log();

    // Step 5: Initiate bank transfer payment
    console.log('5. Initiating bank transfer payment...');
    const paymentData = {
      orderId: orderId,
      amount: getOrderResponse.data.data.totalAmount,
      provider: 'manual_transfer',
      metadata: {
        customerName: 'Rasaq Falade',
        customerEmail: EMAIL,
        transferMethod: 'bank_transfer'
      }
    };

    const initiatePaymentResponse = await axios.post(`${BASE_URL}/payments/bank-transfer/initiate`, paymentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Bank transfer payment initiated');
    console.log('Payment Reference:', initiatePaymentResponse.data.data.reference);
    console.log('Transfer Instructions:', initiatePaymentResponse.data.data.transferInstructions ? 'Provided' : 'Not provided');
    console.log('Amount to Transfer:', initiatePaymentResponse.data.data.amount);
    console.log();

    console.log('=== Test Summary ===');
    console.log('✅ Sign in: SUCCESS');
    console.log('✅ Order creation: SUCCESS');
    console.log('✅ Order retrieval: SUCCESS');
    console.log('✅ Bank accounts: SUCCESS');
    console.log('✅ Payment initiation: SUCCESS');
    console.log('\n🎉 Complete checkout flow test PASSED!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data?.message || error.message);
    
    if (error.response?.data) {
      console.log('Response data:', error.response.data);
    }
  }
}

testCompleteCheckoutFlow();