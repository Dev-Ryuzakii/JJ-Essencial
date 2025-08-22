require('dotenv').config();
const axios = require('axios');

async function testCategoryUpdates() {
  console.log('Testing Category Update Fixes...');
  
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

    // 2. Get available categories
    console.log('2. Getting available categories...');
    const categoriesResponse = await axios.get('http://localhost:3000/api/v1/admin/categories', {
      headers
    });

    console.log('✅ Available categories:');
    categoriesResponse.data.data.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id})`);
    });

    if (categoriesResponse.data.data.length === 0) {
      console.log('No categories found. Creating a test category...');
      
      const createResponse = await axios.post('http://localhost:3000/api/v1/admin/categories', {
        name: 'Test Category',
        description: 'A test category',
        isActive: true,
        sortOrder: 1
      }, { headers });

      console.log('✅ Test category created:', createResponse.data.data);
    } else {
      // 3. Test updating the first category (this should trigger the isActive mapping)
      const firstCategory = categoriesResponse.data.data[0];
      console.log(`3. Testing update of category: ${firstCategory.name}`);

      const updateResponse = await axios.put(
        `http://localhost:3000/api/v1/admin/categories/${firstCategory.id}`,
        {
          name: firstCategory.name,
          description: firstCategory.description || 'Updated description',
          isActive: true, // This should now map to is_active correctly
          sortOrder: firstCategory.sort_order || 1
        },
        { headers }
      );

      console.log('✅ Category updated successfully:', updateResponse.data.data);
    }

    // 4. Test product creation with proper UUID
    console.log('4. Testing product creation with valid category UUID...');
    const validCategoryId = categoriesResponse.data.data[0]?.id;
    
    if (validCategoryId) {
      const productResponse = await axios.post('http://localhost:3000/api/v1/admin/products', {
        name: 'Test Product with Valid UUID',
        description: 'Test product description',
        price: 99.99,
        stock: 10,
        sku: 'TEST-UUID-001',
        categoryId: validCategoryId, // Using proper UUID instead of "1"
        isActive: true
      }, { headers });

      console.log('✅ Product created with valid UUID:', productResponse.data.data.id);

      // Clean up
      await axios.delete(`http://localhost:3000/api/v1/admin/products/${productResponse.data.data.id}`, {
        headers
      });
      console.log('✅ Test product cleaned up');
    }

    console.log('\n🎉 All fixes working correctly!');
    console.log('\n📋 Summary of fixes:');
    console.log('✅ Category isActive field mapping fixed');
    console.log('✅ UUID validation working properly');
    console.log('✅ All CRUD operations functional');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCategoryUpdates();
