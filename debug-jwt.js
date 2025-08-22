const axios = require('axios');

async function debugJWT() {
    const baseURL = 'http://localhost:3001/api/v1';
    
    console.log('🔍 Debugging JWT Authentication...\n');
    
    try {
        // 1. Get admin token
        console.log('1️⃣ Getting admin token...');
        const adminResponse = await axios.post(`${baseURL}/auth/admin/signin`, {
            email: 'jadesola0518@gmail.com',
            password: 'Amoke1805'
        });
        
        const token = adminResponse.data.data.access_token;
        console.log('✅ Token obtained');
        
        // Decode JWT payload (without verification for debugging)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('🔑 JWT Payload:', JSON.stringify(payload, null, 2));
        
        // 2. Test with the /auth/me endpoint (should work with any valid JWT)
        console.log('\n2️⃣ Testing /auth/me endpoint...');
        const meResponse = await axios.get(`${baseURL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ /auth/me response:');
        console.log(JSON.stringify(meResponse.data, null, 2));
        
        // 3. Test a simple admin endpoint
        console.log('\n3️⃣ Testing admin endpoint...');
        const adminStatsResponse = await axios.get(`${baseURL}/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Admin stats response:');
        console.log(JSON.stringify(adminStatsResponse.data, null, 2));
        
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
        
        if (error.response?.data) {
            console.log('📋 Full error response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugJWT();
