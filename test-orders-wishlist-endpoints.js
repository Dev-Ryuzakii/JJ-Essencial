const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testOrdersEndpoint() {
  try {
    console.log('🔍 Testing Orders API Endpoints...\n');

    // Test 1: Get user orders (requires authentication)
    console.log('📋 Test 1: GET /orders (User Orders)');
    try {
      const response1 = await axios.get(`${API_BASE_URL}/orders`);
      console.log('✅ Status:', response1.status);
      console.log('Response structure:', JSON.stringify(response1.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
        console.log('Headers needed: Authorization: Bearer <token>');
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data);
      }
    }

    // Test 2: Get order stats
    console.log('\n📋 Test 2: GET /orders/stats');
    try {
      const response2 = await axios.get(`${API_BASE_URL}/orders/stats`);
      console.log('✅ Status:', response2.status);
      console.log('Stats structure:', JSON.stringify(response2.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data);
      }
    }

    // Test 3: Create order (POST)
    console.log('\n📋 Test 3: POST /orders (Create Order)');
    try {
      const orderData = {
        items: [
          {
            productId: "10c8dd30-315f-43a1-910b-1b01b3363484",
            quantity: 2,
            price: 1231
          }
        ],
        shippingAddress: {
          street: "123 Test St",
          city: "Test City", 
          state: "Test State",
          zipCode: "12345",
          country: "Test Country"
        },
        paymentMethod: "card"
      };

      const response3 = await axios.post(`${API_BASE_URL}/orders`, orderData);
      console.log('✅ Status:', response3.status);
      console.log('Created order:', JSON.stringify(response3.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data);
      }
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

async function testWishlistEndpoint() {
  try {
    console.log('\n🛍️ Testing Wishlist API Endpoints...\n');

    // Test 1: Get user wishlist
    console.log('📋 Test 1: GET /wishlist');
    try {
      const response1 = await axios.get(`${API_BASE_URL}/wishlist`);
      console.log('✅ Status:', response1.status);
      console.log('Wishlist structure:', JSON.stringify(response1.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data);
      }
    }

    // Test 2: Add to wishlist
    console.log('\n📋 Test 2: POST /wishlist (Add to Wishlist)');
    try {
      const wishlistData = {
        productId: "10c8dd30-315f-43a1-910b-1b01b3363484"
      };

      const response2 = await axios.post(`${API_BASE_URL}/wishlist`, wishlistData);
      console.log('✅ Status:', response2.status);
      console.log('Add to wishlist response:', JSON.stringify(response2.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data);
      }
    }

    // Test 3: Check if product is in wishlist
    console.log('\n📋 Test 3: GET /wishlist/check/:productId');
    try {
      const response3 = await axios.get(`${API_BASE_URL}/wishlist/check/10c8dd30-315f-43a1-910b-1b01b3363484`);
      console.log('✅ Status:', response3.status);
      console.log('Check wishlist response:', JSON.stringify(response3.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data);
      }
    }

    // Test 4: Get wishlist count
    console.log('\n📋 Test 4: GET /wishlist/count');
    try {
      const response4 = await axios.get(`${API_BASE_URL}/wishlist/count`);
      console.log('✅ Status:', response4.status);
      console.log('Wishlist count response:', JSON.stringify(response4.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data);
      }
    }

    // Test 5: Remove from wishlist
    console.log('\n📋 Test 5: DELETE /wishlist/:productId');
    try {
      const response5 = await axios.delete(`${API_BASE_URL}/wishlist/10c8dd30-315f-43a1-910b-1b01b3363484`);
      console.log('✅ Status:', response5.status);
      console.log('Remove from wishlist response:', JSON.stringify(response5.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Expected: Authentication required (401)');
      } else {
        console.log('❌ Error:', error.response?.status, error.response?.data);
      }
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

async function runAllTests() {
  await testOrdersEndpoint();
  await testWishlistEndpoint();
  
  console.log('\n📊 Test Summary:');
  console.log('- Most endpoints require authentication (JWT token)');
  console.log('- Response structures will be documented in markdown file');
  console.log('- Frontend integration guide will include auth patterns');
}

runAllTests();
