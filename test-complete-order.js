require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteOrderSchema() {
  console.log('======================================================================');
  console.log('COMPLETE ORDERS TABLE SCHEMA TEST');
  console.log('======================================================================');
  
  const completeOrderData = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    total_amount: 100.00,
    status: 'pending',
    delivery_address: 'Test Address',
    delivery_city: 'Test City',
    delivery_state: 'Test State',
    delivery_country: 'Test Country',
    delivery_phone: '+1234567890',
    delivery_postal: '12345',
    order_notes: 'Test notes'
  };
  
  console.log('Testing complete order data:');
  console.log(JSON.stringify(completeOrderData, null, 2));
  
  const { data: result, error } = await supabase
    .from('orders')
    .insert(completeOrderData)
    .select();
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Success! Order created:');
    console.log('Columns available:', Object.keys(result[0]));
    console.log('Full result:', JSON.stringify(result[0], null, 2));
    
    // Clean up
    await supabase
      .from('orders')
      .delete()
      .eq('id', result[0].id);
    console.log('🧹 Test order cleaned up');
  }
}

testCompleteOrderSchema();