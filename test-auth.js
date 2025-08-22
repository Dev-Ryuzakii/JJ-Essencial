const axios = require('axios');

async function testAuthentication() {
    const baseURL = 'http://localhost:3001/api/v1';
    
    console.log('Testing authentication endpoints...');
    
    try {
        // Test admin signin
        console.log('\n1. Testing admin signin...');
        const adminResponse = await axios.post(`${baseURL}/auth/admin/signin`, {
            email: 'jadesola0518@gmail.com',
            password: 'Amoke1805'
        });
        
        console.log('✅ Admin signin successful!');
        console.log('Full admin response:', adminResponse.data);
        console.log('Admin token:', adminResponse.data.data.access_token?.substring(0, 50) + '...');
        
        // Test regular signin (this should create a Supabase Auth user first)
        console.log('\n2. Testing regular user signup first...');
        const timestamp = Date.now();
        const testUserEmail = `testuser${timestamp}@example.com`; // Use a unique email with timestamp
        const testPassword = 'TestPassword123';
        
        try {
            const signupResponse = await axios.post(`${baseURL}/auth/signup`, {
                email: testUserEmail,
                password: testPassword,
                fullName: 'Test User'
            });
            console.log('✅ Signup successful:', signupResponse.data);
            
            // Wait a moment for the user to be created
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (signupError) {
            console.log('❌ Signup failed:', signupError.response?.data?.message || signupError.message);
            return; // Exit if signup fails
        }
        
        console.log('\n3. Testing regular user signin...');
        const userResponse = await axios.post(`${baseURL}/auth/signin`, {
            email: testUserEmail,
            password: testPassword
        });
        
        console.log('✅ User signin successful!');
        console.log('User response:', userResponse.data);
        console.log('User token:', userResponse.data.data?.access_token?.substring(0, 50) + '...');
        
    } catch (error) {
        console.log('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\nℹ️  The server might not be running. Please start it with: npm run start:dev');
        }
    }
}

testAuthentication();
