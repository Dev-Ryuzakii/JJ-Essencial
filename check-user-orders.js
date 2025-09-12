require('dotenv').config();
const axios = require('axios');

async function checkUserOrders() {
  console.log('🔍 Checking user orders...');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OWU1OGQxMi1hNjFhLTRmYzUtYmRiYS03MjUyNTM5OTBmYjYiLCJlbWFpbCI6ImZhbGFkZXJhc2FxMjJAZ21haWwuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NTc2NjcxNDYsImV4cCI6MTc1ODI3MTk0Nn0.8WL-eBy3LksSuhqcbYoiPQ8HJOtRCttq9riRbuBGgyo';
  
  try {
    // Get all orders for this user
    const response = await axios.get('http://localhost:3000/api/v1/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ User orders retrieved!');
    console.log('📋 Orders:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📊 Order Summary:');
      response.data.data.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order.id}, Status: ${order.status}, Total: ${order.totalAmount}`);
      });
      
      // Test with the most recent order ID
      const mostRecentOrder = response.data.data[0];
      console.log(`\n🧪 Testing with most recent order: ${mostRecentOrder.id}`);
      
      const orderDetailResponse = await axios.get(`http://localhost:3000/api/v1/orders/${mostRecentOrder.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Order detail retrieved!');
      console.log('📋 Order details:', JSON.stringify(orderDetailResponse.data, null, 2));
      
    } else {
      console.log('⚠️ No orders found for this user');
    }
    
  } catch (error) {
    console.log('❌ Failed to get orders:', error.response?.data || error.message);
  }
}

checkUserOrders();