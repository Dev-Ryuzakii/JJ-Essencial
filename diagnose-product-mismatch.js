const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api/v1';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OWU1OGQxMi1hNjFhLTRmYzUtYmRiYS03MjUyNTM5OTBmYjYiLCJlbWFpbCI6ImZhbGFkZXJhc2FxMjJAZ21haWwuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NTc2NTUyMjMsImV4cCI6MTc1ODI2MDAyM30.Jpq8Zj5kVegzURGCniOi5r0NF0NtzzJF3784PAZq4gw';

// Product IDs from the frontend logs
const productIds = [
  '3ef2c827-f197-4208-afad-487285cfa244', // 2 face sandwich maker
  'c0ab9f4b-1d30-4754-af70-257d60f7d361', // Maximus Electric kettle
  'b91e8598-5402-4556-877c-f9a7cb7353b7'  // Kinelco 2.2L
];

async function diagnoseProductValidationMismatch() {
  console.log('🔍 Diagnosing Product Validation Mismatch...\n');
  console.log('Frontend validation passes, but backend order creation fails');
  console.log('Error: "One or more products not found or inactive"\n');

  for (const productId of productIds) {
    console.log('='.repeat(70));
    console.log(`🧪 Testing Product: ${productId}`);
    console.log('='.repeat(70));

    try {
      // 1. Test frontend product API (what frontend uses for validation)
      console.log('📱 Frontend Product API (/products/:id):');
      const frontendResponse = await axios.get(`${API_BASE_URL}/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (frontendResponse.data.success) {
        const product = frontendResponse.data.data;
        console.log('✅ Frontend API Response:');
        console.log(`   - Name: ${product.name}`);
        console.log(`   - ID: ${product.id}`);
        console.log(`   - isActive: ${product.isActive}`);
        console.log(`   - is_active: ${product.is_active}`);
        console.log(`   - Stock: ${product.stockQuantity || 'N/A'}`);
        console.log(`   - Status: ${product.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      }

      // 2. Test order creation with just this product
      console.log('\n🛒 Backend Order Creation Test:');
      const orderData = {
        items: [{
          productId: productId,
          quantity: 1
        }],
        deliveryAddress: {
          phone: "+2348123456789",
          address: "123 Test St",
          city: "Lagos",
          state: "Lagos",
          postalCode: "12345",
          country: "Nigeria"
        },
        orderNotes: `Test order for ${productId}`
      };

      const orderResponse = await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (orderResponse.data.success) {
        console.log('✅ Backend Order Creation: SUCCESS');
        console.log(`   - Order ID: ${orderResponse.data.data.id}`);
      }

    } catch (error) {
      if (error.config && error.config.url.includes('/products/')) {
        // This is a product API error
        console.log('❌ Frontend Product API Error:');
        console.log(`   - Status: ${error.response?.status || 'Unknown'}`);
        console.log(`   - Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 404) {
          console.log('   - Issue: Product not found in database');
        }
      } else if (error.config && error.config.url.includes('/orders')) {
        // This is an order creation error
        console.log('❌ Backend Order Creation: FAILED');
        console.log(`   - Status: ${error.response?.status || 'Unknown'}`);
        console.log(`   - Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.data?.message === 'One or more products not found or inactive') {
          console.log('   - Issue: Backend order service cannot find/validate this product');
        }
      } else {
        console.log('❌ Unknown error:', error.message);
      }
    }

    console.log('\n' + '-'.repeat(50) + '\n');
  }
}

async function checkBackendOrderValidation() {
  console.log('🔍 BACKEND ORDER VALIDATION ANALYSIS:');
  console.log('='.repeat(70));
  
  // Test with all 3 products together (like frontend does)
  const allProductsOrder = {
    items: productIds.map(id => ({
      productId: id,
      quantity: 1
    })),
    deliveryAddress: {
      phone: "+2348123456789",
      address: "123 Test St",
      city: "Lagos",
      state: "Lagos",
      postalCode: "12345",
      country: "Nigeria"
    },
    orderNotes: "Test with all 3 products"
  };

  console.log('📤 Testing complete order payload:');
  console.log(JSON.stringify(allProductsOrder, null, 2));

  try {
    const response = await axios.post(`${API_BASE_URL}/orders`, allProductsOrder, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ All products order: SUCCESS');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('❌ All products order: FAILED');
      console.log(`📋 Status: ${error.response.status}`);
      console.log(`🔥 Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      console.log('\n💡 POSSIBLE CAUSES:');
      console.log('1. Backend order service uses different product validation logic');
      console.log('2. Database query in order creation is different from product API');  
      console.log('3. Race condition: products became inactive between validation and order creation');
      console.log('4. Different database table/view being queried');
      console.log('5. Backend order service has additional stock/availability checks');
    }
  }
}

console.log('='.repeat(70));
console.log('PRODUCT VALIDATION MISMATCH DIAGNOSIS');
console.log('='.repeat(70));

diagnoseProductValidationMismatch()
  .then(() => checkBackendOrderValidation())
  .then(() => {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 DIAGNOSIS COMPLETE');
    console.log('This will reveal why frontend validation passes but backend fails');
    console.log('='.repeat(70));
  })
  .catch(error => {
    console.error('Diagnosis failed:', error);
  });