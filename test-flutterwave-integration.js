const axios = require('axios');

// Test the new Flutterwave endpoints
const API_BASE_URL = 'http://localhost:3000/api/v1';

// User token (from previous login)
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OWU1OGQxMi1hNjFhLTRmYzUtYmRiYS03MjUyNTM5OTBmYjYiLCJlbWFpbCI6ImZhbGFkZXJhc2FxMjJAZ21haWwuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NTc2OTQ5NjEsImV4cCI6MTc1ODI5OTc2MX0.9KoL06XfG-dYn8KrJ_PxL7XaLjrhxwXZDeiodWHWT88';

async function testFlutterwaveInitiate() {
  try {
    console.log('🧪 Testing Flutterwave Initiate Endpoint...');
    
    const response = await axios.post(
      `${API_BASE_URL}/payments/flutterwave/initiate`,
      {
        orderId: '57a08b11-817c-4f4d-8c60-4fe089e9b3b1',
        amount: 17000,
        currency: 'NGN',
        customer: {
          email: 'faladerasaq22@gmail.com',
          name: 'Faladerasaq Test',
          phone: '+2349037162097'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Flutterwave Initiate Success:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Flutterwave Initiate Failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    throw error;
  }
}

async function testFlutterwaveConfirm(transactionId, txRef) {
  try {
    console.log('🧪 Testing Flutterwave Confirm Endpoint...');
    
    const response = await axios.post(
      `${API_BASE_URL}/payments/flutterwave/confirm`,
      {
        transaction_id: transactionId,
        tx_ref: txRef
      },
      {
        headers: {
          'Authorization': `Bearer ${USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Flutterwave Confirm Success:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Flutterwave Confirm Failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting Flutterwave Integration Tests...\n');
  
  try {
    // Test 1: Initiate Payment
    const initiateResult = await testFlutterwaveInitiate();
    console.log('\n📋 Initiate Result Summary:');
    console.log('- Public Key:', initiateResult.publicKey ? 'Present' : 'Missing');
    console.log('- TX Ref:', initiateResult.tx_ref);
    console.log('- Amount:', initiateResult.amount);
    console.log('- Currency:', initiateResult.currency);
    console.log('- Customer:', initiateResult.customer);
    
    console.log('\n🔗 Frontend Integration Code:');
    console.log('FlutterwaveCheckout({');
    console.log(`  public_key: "${initiateResult.publicKey}",`);
    console.log(`  tx_ref: "${initiateResult.tx_ref}",`);
    console.log(`  amount: ${initiateResult.amount},`);
    console.log(`  currency: "${initiateResult.currency}",`);
    console.log('  payment_options: "card,banktransfer,ussd",');
    console.log('  customer: {');
    console.log(`    email: "${initiateResult.customer.email}",`);
    console.log(`    name: "${initiateResult.customer.name}",`);
    console.log(`    phone_number: "${initiateResult.customer.phone || ''}",`);
    console.log('  },');
    console.log('  callback: (response) => {');
    console.log('    // Send response.transaction_id to /payments/flutterwave/confirm');
    console.log('    console.log("Payment callback:", response);');
    console.log('  }');
    console.log('});');
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Use the FlutterwaveCheckout code above in your frontend');
    console.log('2. In the callback, send transaction_id to /payments/flutterwave/confirm');
    console.log('3. Handle the confirmation response for success/failure');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
}

// Run the tests
runTests();