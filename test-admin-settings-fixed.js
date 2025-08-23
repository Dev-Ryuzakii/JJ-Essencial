const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

// Admin credentials from previous tests
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi11c2VyIiwiZW1haWwiOiJqYWRlc29sYTA1MThAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU1OTgzNTI0LCJleHAiOjE3NTY1ODgzMjR9.yViOwJESrBpQmzfm5lasBxQIlY_01LMjiABYKIk3pDM';

async function testAdminSettingsFixed() {
  try {
    console.log('🧪 Testing Fixed Admin Settings API...\n');

    // Test 1: Get Settings
    console.log('1. Testing GET /admin/settings');
    try {
      const settingsResponse = await axios.get(`${API_BASE}/admin/settings`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Settings retrieved successfully');
      console.log('Settings keys:', Object.keys(settingsResponse.data.data || {}));
      console.log('Sample setting:', {
        siteName: settingsResponse.data.data?.siteName,
        currency: settingsResponse.data.data?.currency,
        taxRate: settingsResponse.data.data?.taxRate
      });
    } catch (error) {
      console.log('❌ Settings error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('');

    // Test 2: Get Bank Accounts
    console.log('2. Testing GET /admin/settings/bank-accounts');
    try {
      const bankAccountsResponse = await axios.get(`${API_BASE}/admin/settings/bank-accounts`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Bank accounts retrieved successfully');
      console.log('Number of bank accounts:', bankAccountsResponse.data.data?.length || 0);
      if (bankAccountsResponse.data.data?.length > 0) {
        console.log('First bank account:', {
          bank_name: bankAccountsResponse.data.data[0].bank_name,
          account_number: bankAccountsResponse.data.data[0].account_number,
          is_default: bankAccountsResponse.data.data[0].is_default
        });
      }
    } catch (error) {
      console.log('❌ Bank accounts error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('');

    // Test 3: Add Bank Account
    console.log('3. Testing POST /admin/settings/bank-accounts');
    try {
      const newBankAccount = {
        bank_name: 'UBA Bank',
        account_name: 'JJ Essential Limited',
        account_number: '1234567890',
        currency: 'NGN',
        is_default: false,
        is_active: true
      };

      const addResponse = await axios.post(`${API_BASE}/admin/settings/bank-accounts`, newBankAccount, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Bank account added successfully');
      console.log('New account ID:', addResponse.data.data?.id);
      console.log('Bank name:', addResponse.data.data?.bank_name);
    } catch (error) {
      console.log('❌ Add bank account error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('');

    // Test 4: Update Settings
    console.log('4. Testing PUT /admin/settings');
    try {
      const updatedSettings = {
        siteName: 'JJ Essential Updated',
        taxRate: 8.0,
        shippingFee: 2500,
        maintenanceMode: false
      };

      const updateResponse = await axios.put(`${API_BASE}/admin/settings`, updatedSettings, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Settings updated successfully');
      console.log('Updated site name:', updateResponse.data.data?.siteName || updateResponse.data.data?.site_name);
      console.log('Updated tax rate:', updateResponse.data.data?.taxRate || updateResponse.data.data?.tax_rate);
    } catch (error) {
      console.log('❌ Update settings error:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
        console.log('Validation errors:', error.response.data.message);
      }
    }

    console.log('\n🎉 Admin Settings API Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminSettingsFixed();
