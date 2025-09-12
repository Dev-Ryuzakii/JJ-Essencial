require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findWorkingOrderSchema() {
  console.log('======================================================================');
  console.log('FIND WORKING ORDERS TABLE SCHEMA');
  console.log('======================================================================');
  
  const baseOrderData = {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    total_amount: 100.00,
    status: 'pending',
    delivery_address: 'Test Address',
    delivery_city: 'Test City',
    delivery_state: 'Test State',
    delivery_country: 'Test Country',
    delivery_phone: '+1234567890',
    delivery_postal: '12345'
  };
  
  console.log('Testing minimal order data:');
  console.log(JSON.stringify(baseOrderData, null, 2));
  
  const { data: result, error } = await supabase
    .from('orders')
    .insert(baseOrderData)
    .select();
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Success! Order created:');
    console.log('Available columns:', Object.keys(result[0]));
    console.log('Full order result:', JSON.stringify(result[0], null, 2));
    
    // Now let's check what other tables we might need (orderItems, etc.)
    console.log('\n🔍 Checking related tables...');
    
    const orderId = result[0].id;
    
    // Test orderItems table
    const testOrderItem = {
      order_id: orderId,
      product_id: '3ef2c827-f197-4208-afad-487285cfa244',
      quantity: 1,
      unit_price: 50.00
    };
    
    const { data: itemResult, error: itemError } = await supabase
      .from('orderItems')
      .insert(testOrderItem)
      .select();
    
    if (itemError) {
      console.log('❌ OrderItems table error:', itemError.message);
      
      // Try with different column names
      const testOrderItem2 = {
        orderId: orderId,
        productId: '3ef2c827-f197-4208-afad-487285cfa244',
        quantity: 1,
        unitPrice: 50.00
      };
      
      const { data: itemResult2, error: itemError2 } = await supabase
        .from('order_items')
        .insert(testOrderItem2)
        .select();
      
      if (itemError2) {
        console.log('❌ order_items table error:', itemError2.message);
      } else {
        console.log('✅ order_items table works!');
        console.log('Order item result:', JSON.stringify(itemResult2[0], null, 2));
      }
    } else {
      console.log('✅ OrderItems table works!');
      console.log('Order item result:', JSON.stringify(itemResult[0], null, 2));
    }
    
    // Clean up
    await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    console.log('🧹 Test data cleaned up');
  }
}

findWorkingOrderSchema();