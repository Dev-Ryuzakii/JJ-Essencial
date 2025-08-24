const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testWithRealProduct() {
  try {
    console.log('Getting list of products to test with real data...');
    
    // First get a list of products
    const productsResponse = await axios.get(`${API_BASE_URL}/products?limit=1`);
    
    if (productsResponse.data.products && productsResponse.data.products.length > 0) {
      const firstProduct = productsResponse.data.products[0];
      console.log(`Found product: ${firstProduct.name} (ID: ${firstProduct.id})`);
      console.log(`Total products in database: ${productsResponse.data.total}`);
      
      // Now test reviews for this product
      const reviewsResponse = await axios.get(
        `${API_BASE_URL}/reviews/product/${firstProduct.id}`,
        {
          params: {
            page: 1,
            limit: 10
          }
        }
      );
      
      console.log('Reviews Response status:', reviewsResponse.status);
      console.log(`✅ Reviews for existing product work: Found ${reviewsResponse.data.data.length} reviews`);
      console.log(`   Total: ${reviewsResponse.data.pagination.total}`);
      
    } else {
      console.log('No products found in database - null safety test is sufficient');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testWithRealProduct();
