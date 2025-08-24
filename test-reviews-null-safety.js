const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test the reviews endpoint with a product that likely doesn't exist or has no reviews
async function testReviewsNullSafety() {
  try {
    console.log('Testing reviews null safety...');
    
    // Test with a random UUID that likely doesn't exist
    const testProductId = '00000000-0000-0000-0000-000000000001';
    
    const response = await axios.get(
      `${API_BASE_URL}/reviews/product/${testProductId}`,
      {
        params: {
          page: 1,
          limit: 10
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && Array.isArray(response.data.data)) {
      console.log('✅ NULL SAFETY FIX WORKING: Reviews endpoint returns empty array without errors');
      console.log(`   Total reviews: ${response.data.pagination.total}`);
      console.log(`   Reviews array length: ${response.data.data.length}`);
    } else {
      console.log('❌ Unexpected response format');
      console.log('   Expected: response.data.data to be an array');
      console.log('   Actual:', typeof response.data.data, response.data.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else if (error.message.includes('Cannot read properties of null')) {
      console.log('❌ NULL SAFETY ERROR STILL EXISTS:', error.message);
    } else {
      console.log('❌ Network/Other Error:', error.message);
    }
  }
}

// Run the test
testReviewsNullSafety();
