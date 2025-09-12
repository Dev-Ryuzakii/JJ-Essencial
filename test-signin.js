require('dotenv').config();
const axios = require('axios');

async function signIn() {
  console.log('🔐 Signing in to get authentication token...');
  
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/signin', {
      email: 'faladerasaq22@gmail.com',
      password: '1234567890'
    });
    
    console.log('✅ Sign in successful!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.access_token) {
      const token = response.data.data.access_token;
      console.log('\n🎫 Access Token:', token);
      
      // Test the token with the order endpoint
      console.log('\n🧪 Testing token with order endpoint...');
      const orderResponse = await axios.get('http://localhost:3000/api/v1/orders/cdc60698-d9b9-4282-b8e5-f72144b4db2f', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Order endpoint test successful!');
      console.log('📋 Order data:', JSON.stringify(orderResponse.data, null, 2));
      
    } else {
      console.log('❌ No access token found in response');
    }
    
  } catch (error) {
    console.log('❌ Sign in failed:', error.response?.data || error.message);
  }
}

signIn();