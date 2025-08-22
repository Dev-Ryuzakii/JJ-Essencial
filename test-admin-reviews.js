require('dotenv').config();
const axios = require('axios');

async function testReviewsEndpoint() {
  console.log('Testing Admin Reviews Endpoint...');
  
  try {
    // 1. Get admin token
    console.log('1. Getting admin token...');
    const authResponse = await axios.post('http://localhost:3000/api/v1/auth/admin/signin', {
      email: 'jadesola0518@gmail.com',
      password: 'Amoke1805'
    });

    const token = authResponse.data.data.access_token;
    console.log('✅ Got admin token');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Test the exact failing request
    console.log('2. Testing the exact failing request...');
    const testUrl = 'http://localhost:3000/api/v1/admin/reviews?page=1&limit=10&sortBy=createdAt&sortOrder=desc';
    console.log('URL:', testUrl);

    const response = await axios.get(testUrl, { headers });
    console.log('✅ Request successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed with details:');
      console.log('Status:', error.response?.status);
      console.log('Status Text:', error.response?.statusText);
      console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error('❌ Request error:', error.message);
    }
  }
}

testReviewsEndpoint();
