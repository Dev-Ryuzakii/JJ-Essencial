const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testPublicBankAccountsEndpoint() {
  console.log('Testing public bank accounts endpoint...\n');
  
  try {
    // Test the new public endpoint (no authentication required)
    console.log('🔍 Testing GET /api/v1/payments/bank-accounts (public)');
    const response = await axios.get(`${API_BASE_URL}/payments/bank-accounts`);
    
    console.log('✅ Success! Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    if (response.data.success && Array.isArray(response.data.data)) {
      console.log('\n✅ Response structure is valid');
      console.log(`📊 Found ${response.data.data.length} bank account(s)`);
      
      // Check each bank account has required fields
      response.data.data.forEach((account, index) => {
        console.log(`\n🏦 Bank Account ${index + 1}:`);
        console.log(`   - Bank Name: ${account.bank_name}`);
        console.log(`   - Account Name: ${account.account_name}`);
        console.log(`   - Account Number: ${account.account_number}`);
        console.log(`   - Currency: ${account.currency}`);
        console.log(`   - ID: ${account.id}`);
      });
    } else {
      console.log('❌ Invalid response structure');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status);
      console.log('📋 Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Test comparing with authenticated admin endpoint
async function compareWithAdminEndpoint() {
  console.log('\n' + '='.repeat(60));
  console.log('Comparing with admin endpoint (should fail without auth)...\n');
  
  try {
    console.log('🔍 Testing GET /api/v1/admin/settings/bank-accounts (admin only)');
    const response = await axios.get(`${API_BASE_URL}/admin/settings/bank-accounts`);
    
    console.log('⚠️  Unexpected success! This should require authentication');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Expected 401 Unauthorized - Admin endpoint properly secured');
    } else if (error.response) {
      console.log('❌ Unexpected error:', error.response.status);
      console.log('📋 Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

async function runTests() {
  console.log('🧪 Bank Accounts Public Endpoint Test');
  console.log('='.repeat(60));
  
  await testPublicBankAccountsEndpoint();
  await compareWithAdminEndpoint();
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test completed!');
  console.log('\n📝 Summary:');
  console.log('   1. Public endpoint: /api/v1/payments/bank-accounts (no auth)');
  console.log('   2. Admin endpoint: /api/v1/admin/settings/bank-accounts (requires auth)');
  console.log('   3. Use public endpoint in frontend checkout for bank selection');
}

runTests().catch(console.error);
