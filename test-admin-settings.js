const axios = require('axios');

async function testBankAccountsAPI() {
    const baseURL = 'http://localhost:3000/api/v1';
    
    console.log('🧪 Testing Bank Accounts API...\n');
    
    try {
        // 1. Test admin signin
        console.log('1️⃣ Getting admin token...');
        const adminResponse = await axios.post(`${baseURL}/auth/admin/signin`, {
            email: 'jadesola0518@gmail.com',
            password: 'Amoke1805'
        });
        
        console.log('✅ Admin signin successful!');
        const adminToken = adminResponse.data.data.access_token;
        
        // Create headers for authenticated requests
        const adminHeaders = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };
        
        // 2. Test bank accounts endpoint
        console.log('\n2️⃣ Testing bank accounts endpoint...');
        const bankAccountsResponse = await axios.get(`${baseURL}/admin/settings/bank-accounts`, {
            headers: adminHeaders
        });
        
        console.log('✅ Bank accounts endpoint working!');
        console.log('Response:', JSON.stringify(bankAccountsResponse.data, null, 2));
        
        // 3. Test general settings endpoint
        console.log('\n3️⃣ Testing settings endpoint...');
        const settingsResponse = await axios.get(`${baseURL}/admin/settings`, {
            headers: adminHeaders
        });
        
        console.log('✅ Settings endpoint working!');
        console.log('Settings keys:', Object.keys(settingsResponse.data.data));
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testBankAccountsAPI();
