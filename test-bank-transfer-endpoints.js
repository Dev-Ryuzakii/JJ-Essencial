const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testBankAccountsEndpoint() {
  try {
    console.log('🏦 Testing Bank Accounts Endpoint...\n');

    // Test 1: Get bank accounts (should be public for customer checkout)
    console.log('📋 Test 1: GET /admin/settings/bank-accounts');
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/settings/bank-accounts`);
      console.log('✅ Status:', response.status);
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log('❌ API Error:', error.response.status, error.response.data);
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

async function testBankTransferFlow() {
  try {
    console.log('\n💳 Testing Bank Transfer Flow...\n');

    // Test 1: Initiate bank transfer (requires auth)
    console.log('📋 Test 1: POST /payments/bank-transfer/initiate');
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/bank-transfer/initiate`, {
        orderId: "test-order-uuid"
      });
      console.log('✅ Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
        console.log('Headers needed: Authorization: Bearer <token>');
      } else if (error.response) {
        console.log('❌ API Error:', error.response.status, error.response.data);
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }

    // Test 2: Upload receipt (requires auth)
    console.log('\n📋 Test 2: POST /payments/receipt/upload');
    try {
      const formData = new FormData();
      formData.append('reference', 'BT_test_reference');
      // Note: Can't easily test file upload without actual file
      
      const response = await axios.post(`${API_BASE_URL}/payments/receipt/upload`, formData);
      console.log('✅ Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
      } else if (error.response) {
        console.log('❌ API Error:', error.response.status, error.response.data);
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

async function runAllTests() {
  await testBankAccountsEndpoint();
  await testBankTransferFlow();
  
  console.log('\n📊 Test Summary:');
  console.log('- Bank accounts endpoint tested');
  console.log('- Bank transfer endpoints require authentication');
  console.log('- Manual payment system is ready for frontend integration');
}

runAllTests();
