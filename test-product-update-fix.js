const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

// Get fresh admin token
async function getAdminToken() {
  try {
    const response = await axios.post(`${API_BASE}/auth/admin/signin`, {
      email: 'jadesola0518@gmail.com',
      password: 'Amoke1805'
    });
    return response.data.data.access_token;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.status, error.response?.data?.message || error.message);
    return null;
  }
}

async function testProductUpdate() {
  try {
    console.log('🧪 Testing Product Update API after field mapping fix...\n');

    const adminToken = await getAdminToken();
    if (!adminToken) {
      console.log('❌ Could not get admin token');
      return;
    }

    // First, let's try to get an existing product to update
    console.log('1. Getting existing products...');
    let productId = null;
    try {
      const productsResponse = await axios.get(`${API_BASE}/admin/products`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page: 1, limit: 1 }
      });
      
      if (productsResponse.data.data?.data?.length > 0) {
        productId = productsResponse.data.data.data[0].id;
        console.log('✅ Found existing product:', productId);
      } else {
        console.log('ℹ️ No existing products found, will try to create one first');
      }
    } catch (error) {
      console.log('❌ Error getting products:', error.response?.status, error.response?.data?.message);
    }

    // If no product exists, create one first
    if (!productId) {
      console.log('\\n2. Creating a test product...');
      try {
        const createResponse = await axios.post(`${API_BASE}/admin/products`, {
          name: 'Test Product for Update',
          description: 'Test product for testing update functionality',
          price: 1000,
          stock: 50,
          sku: 'TEST-UPDATE-001',
          categoryId: '7e08474a-7150-4046-be34-3cce5f29605d', // Use valid category ID
          isActive: true
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        productId = createResponse.data.data.id;
        console.log('✅ Created test product:', productId);
      } catch (error) {
        console.log('❌ Error creating product:', error.response?.status, error.response?.data?.message);
        return;
      }
    }

    // Now test the update functionality
    console.log('\\n3. Testing product update with categoryId field...');
    try {
      const updateData = {
        name: 'Updated Test Product',
        description: 'Updated description for testing',
        price: 1500,
        stock: 75,
        categoryId: '7e08474a-7150-4046-be34-3cce5f29605d', // Use valid category ID
        isActive: true
      };

      const updateResponse = await axios.put(`${API_BASE}/admin/products/${productId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Product updated successfully!');
      console.log('Updated product name:', updateResponse.data.data?.name);
      console.log('Updated price:', updateResponse.data.data?.price);
      console.log('Category ID mapping successful:', updateResponse.data.data?.category_id !== undefined ? 'Yes' : 'No');
      
    } catch (error) {
      console.log('❌ Product update error:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('\\n🎉 Product Update test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProductUpdate();
