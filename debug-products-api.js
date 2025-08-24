const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function debugProductsAPI() {
  try {
    console.log('🔍 Testing products API endpoint directly...\n');

    // Test 1: Basic request
    console.log('📋 Test 1: Basic GET /products');
    const response1 = await axios.get(`${API_BASE_URL}/products`);
    console.log('Status:', response1.status);
    console.log('Data count:', response1.data.data ? response1.data.data.length : 'No data array');
    console.log('Response:', JSON.stringify(response1.data, null, 2));
    
    // Test 2: With explicit pagination
    console.log('\n📋 Test 2: With pagination parameters');
    const response2 = await axios.get(`${API_BASE_URL}/products?page=1&limit=10`);
    console.log('Status:', response2.status);
    console.log('Data count:', response2.data.data ? response2.data.data.length : 'No data array');
    
    // Test 3: Without any filters
    console.log('\n📋 Test 3: Check response structure');
    if (response2.data.success) {
      console.log('✅ API responded successfully');
      console.log('Message:', response2.data.message);
      console.log('Has pagination:', !!response2.data.pagination);
      
      if (response2.data.pagination) {
        console.log('Pagination details:', JSON.stringify(response2.data.pagination, null, 2));
      }
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

debugProductsAPI();
