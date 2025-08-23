const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testReviewsEndpoint() {
  try {
    console.log('🧪 Testing Reviews API after null check fix...\n');

    // Test 1: Get product reviews (this should have caused the error)
    console.log('1. Testing GET /reviews/product/:productId');
    try {
      // Use a dummy product ID to test the endpoint
      const response = await axios.get(`${API_BASE}/reviews/product/test-product-id`, {
        params: { page: 1, limit: 10 }
      });
      console.log('✅ Product reviews retrieved successfully');
      console.log('Response structure:', {
        hasReviews: !!response.data.data?.reviews,
        reviewsCount: response.data.data?.reviews?.length || 0,
        total: response.data.data?.total || 0
      });
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Product not found (expected) - but no crash occurred');
      } else {
        console.log('❌ Product reviews error:', error.response?.status, error.response?.data?.message || error.message);
      }
    }

    console.log('');

    // Test 2: Try to get reviews for a non-existent product
    console.log('2. Testing GET /reviews/product/:productId with non-existent product');
    try {
      const response = await axios.get(`${API_BASE}/reviews/product/non-existent-product-12345`, {
        params: { page: 1, limit: 5 }
      });
      console.log('✅ Non-existent product reviews handled gracefully');
      console.log('Response:', {
        reviewsCount: response.data.data?.reviews?.length || 0,
        total: response.data.data?.total || 0
      });
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Non-existent product handled properly (404)');
      } else if (error.response?.status !== 500) {
        console.log('✅ Non-existent product handled without 500 error:', error.response?.status);
      } else {
        console.log('❌ Unexpected 500 error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Reviews API null check test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testReviewsEndpoint();
