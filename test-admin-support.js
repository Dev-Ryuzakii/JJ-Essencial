const axios = require('axios');

async function testSupportTickets() {
    const baseURL = 'http://localhost:3000/api/v1';
    
    console.log('🧪 Testing Support Tickets API...\n');
    
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
        
        // 2. Test support tickets endpoint
        console.log('\n2️⃣ Testing support tickets endpoint...');
        const ticketsResponse = await axios.get(`${baseURL}/admin/support/tickets`, {
            headers: adminHeaders
        });
        
        console.log('✅ Support tickets endpoint working!');
        console.log('Response:', ticketsResponse.data);
        
        // 3. Test support stats
        console.log('\n3️⃣ Testing support stats endpoint...');
        const statsResponse = await axios.get(`${baseURL}/admin/support/stats`, {
            headers: adminHeaders
        });
        
        console.log('✅ Support stats endpoint working!');
        console.log('Stats:', statsResponse.data);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testSupportTickets();
