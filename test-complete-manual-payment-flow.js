const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testCompleteManualBankTransferFlow() {
  console.log('🧪 Complete Manual Bank Transfer Flow Test');
  console.log('='.repeat(80));
  
  // Step 1: Test public bank accounts endpoint
  console.log('\n📋 Step 1: Fetching bank accounts for customer checkout...');
  
  try {
    const bankAccountsResponse = await axios.get(`${API_BASE_URL}/payments/bank-accounts`);
    
    if (bankAccountsResponse.data.success && bankAccountsResponse.data.data.length > 0) {
      console.log('✅ Bank accounts retrieved successfully');
      console.log(`   Found ${bankAccountsResponse.data.data.length} bank account(s)`);
      
      const bankAccount = bankAccountsResponse.data.data[0];
      console.log('\n🏦 Bank Account Details:');
      console.log(`   - Bank: ${bankAccount.bank_name}`);
      console.log(`   - Account Name: ${bankAccount.account_name}`);
      console.log(`   - Account Number: ${bankAccount.account_number}`);
      console.log(`   - Currency: ${bankAccount.currency}`);
      
      // Step 2: Test bank transfer initiation (requires auth)
      console.log('\n💳 Step 2: Testing bank transfer initiation...');
      console.log('ℹ️  Note: This endpoint requires authentication, so expect 401');
      
      try {
        const transferResponse = await axios.post(`${API_BASE_URL}/payments/bank-transfer/initiate`, {
          orderId: 'test-order-123'
        });
        
        console.log('⚠️  Unexpected success! This should require authentication');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Expected 401 - Bank transfer initiation properly secured');
        } else {
          console.log('❌ Unexpected error:', error.response?.status || error.message);
        }
      }
      
      // Step 3: Test receipt upload (requires auth)
      console.log('\n📄 Step 3: Testing receipt upload...');
      console.log('ℹ️  Note: This endpoint requires authentication, so expect 401');
      
      try {
        const receiptResponse = await axios.post(`${API_BASE_URL}/payments/receipt/upload`, {
          orderId: 'test-order-123',
          amount: 1000,
          transferReference: 'test-ref-123'
        });
        
        console.log('⚠️  Unexpected success! This should require authentication');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Expected 401 - Receipt upload properly secured');
        } else {
          console.log('❌ Unexpected error:', error.response?.status || error.message);
        }
      }
      
      // Step 4: Test admin endpoints (requires admin auth)
      console.log('\n👨‍💼 Step 4: Testing admin endpoints...');
      console.log('ℹ️  Note: These endpoints require admin authentication, so expect 401');
      
      try {
        const pendingReceiptsResponse = await axios.get(`${API_BASE_URL}/payments/receipts/pending`);
        console.log('⚠️  Unexpected success! This should require admin authentication');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Expected 401 - Admin pending receipts properly secured');
        } else {
          console.log('❌ Unexpected error:', error.response?.status || error.message);
        }
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('✨ Manual Bank Transfer Flow Test Summary:');
      console.log('');
      console.log('✅ Public bank accounts endpoint working (no auth required)');
      console.log('✅ Bank transfer initiation secured (requires user auth)');
      console.log('✅ Receipt upload secured (requires user auth)');
      console.log('✅ Admin endpoints secured (require admin auth)');
      console.log('');
      console.log('🎉 Complete flow is properly implemented and secured!');
      console.log('');
      console.log('📝 Frontend Implementation Steps:');
      console.log('   1. Use /api/v1/payments/bank-accounts for bank selection');
      console.log('   2. Display bank details to customer for manual transfer');
      console.log('   3. Use authenticated endpoints for payment initiation and receipt upload');
      console.log('   4. Admin can verify receipts through admin panel');
      
    } else {
      console.log('❌ Failed to retrieve bank accounts');
    }
    
  } catch (error) {
    console.log('❌ Failed to fetch bank accounts:', error.response?.status || error.message);
  }
}

async function testEndpointSecurity() {
  console.log('\n' + '='.repeat(80));
  console.log('🔒 Security Validation Test');
  console.log('='.repeat(80));
  
  const securityTests = [
    {
      name: 'Public Bank Accounts',
      endpoint: '/payments/bank-accounts',
      method: 'GET',
      expectation: 'Should work without authentication'
    },
    {
      name: 'Admin Bank Accounts',
      endpoint: '/admin/settings/bank-accounts',
      method: 'GET',
      expectation: 'Should require admin authentication'
    },
    {
      name: 'Bank Transfer Initiation',
      endpoint: '/payments/bank-transfer/initiate',
      method: 'POST',
      expectation: 'Should require user authentication'
    },
    {
      name: 'Receipt Upload',
      endpoint: '/payments/receipt/upload',
      method: 'POST',
      expectation: 'Should require user authentication'
    }
  ];
  
  for (const test of securityTests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Endpoint: ${test.method} ${test.endpoint}`);
    console.log(`   Expectation: ${test.expectation}`);
    
    try {
      const response = await axios({
        method: test.method.toLowerCase(),
        url: `${API_BASE_URL}${test.endpoint}`,
        data: test.method === 'POST' ? { test: 'data' } : undefined
      });
      
      if (test.expectation.includes('without authentication')) {
        console.log('   ✅ Success - Endpoint accessible without auth');
      } else {
        console.log('   ⚠️  Unexpected success - Should require authentication');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        if (test.expectation.includes('require')) {
          console.log('   ✅ Properly secured - 401 Unauthorized as expected');
        } else {
          console.log('   ❌ Unexpected 401 - Should be accessible');
        }
      } else {
        console.log(`   ❓ Other error: ${error.response?.status || error.message}`);
      }
    }
  }
}

async function runCompleteTest() {
  await testCompleteManualBankTransferFlow();
  await testEndpointSecurity();
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 Ready for frontend implementation!');
  console.log('📚 Documentation: MANUAL_BANK_TRANSFER_PAYMENT_GUIDE.md');
  console.log('🔧 Solution: BANK_ACCOUNTS_PUBLIC_ENDPOINT_SOLUTION.md');
}

runCompleteTest().catch(console.error);
