require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorrectOrderSchema() {
  console.log('======================================================================');
  console.log('TEST CORRECT ORDER SCHEMA WITH UPPERCASE STATUS');
  console.log('======================================================================');
  
  const orderData = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    total_amount: 100.00,
    status: 'PENDING',
    delivery_address: 'Test Address',
    delivery_city: 'Test City',
    delivery_state: 'Test State',
    delivery_country: 'Test Country',
    delivery_phone: '+1234567890',
    delivery_postal: '12345'
  };
  
  console.log('Testing with PENDING status:');
  console.log(JSON.stringify(orderData, null, 2));
  
  const { data: result, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select();
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ SUCCESS! Order created with correct schema');
    console.log('\n📋 ORDERS TABLE SCHEMA:');
    console.log('Columns:', Object.keys(result[0]));
    
    const orderId = result[0].id;
    console.log('\nFull order data:');
    console.log(JSON.stringify(result[0], null, 2));
    
    // Test order items with snake_case
    console.log('\n🔍 Testing ORDER_ITEMS table...');
    const orderItemData = {
      order_id: orderId,
      product_id: '3ef2c827-f197-4208-afad-487285cfa244',
      quantity: 1,
      unit_price: 50.00
    };
    
    const { data: itemResult, error: itemError } = await supabase
      .from('order_items')
      .insert(orderItemData)
      .select();
    
    if (itemError) {
      console.log('❌ Order items error:', itemError.message);
      
      // Try different table name
      const { data: itemResult2, error: itemError2 } = await supabase
        .from('orderItems')
        .insert({
          orderId: orderId,
          productId: '3ef2c827-f197-4208-afad-487285cfa244',
          quantity: 1,
          unitPrice: 50.00
        })
        .select();
      
      if (itemError2) {
        console.log('❌ orderItems error:', itemError2.message);
      } else {
        console.log('✅ orderItems table works!');
        console.log('Order item columns:', Object.keys(itemResult2[0]));
      }
    } else {
      console.log('✅ order_items table works!');
      console.log('\n📋 ORDER_ITEMS TABLE SCHEMA:');
      console.log('Columns:', Object.keys(itemResult[0]));
      console.log('Full order item data:');
      console.log(JSON.stringify(itemResult[0], null, 2));
    }
    
    // Clean up
    await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    console.log('\n🧹 Test data cleaned up');
    
    console.log('\n🎯 SCHEMA SUMMARY:');
    console.log('- Orders table uses snake_case columns');
    console.log('- Status must be uppercase (PENDING, PAID, COMPLETED, CANCELLED)'); 
    console.log('- Required fields: user_id, total_amount, status, delivery_address, delivery_city, delivery_state, delivery_country, delivery_phone, delivery_postal');
    console.log('- Order items table uses snake_case: order_id, product_id, quantity, unit_price');
  }
}

testCorrectOrderSchema();