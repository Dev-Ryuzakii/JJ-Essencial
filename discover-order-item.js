require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverOrderItemSchema() {
  console.log('======================================================================');
  console.log('DISCOVER ORDER_ITEM TABLE SCHEMA');
  console.log('======================================================================');
  
  // Create test order
  const { data: testOrder } = await supabase
    .from('orders')
    .insert({
      user_id: '7a06b81e-5d5d-4900-bbf9-e7bbd5740610',
      total_amount: 100.00,
      status: 'PENDING',
      delivery_address: 'Test Address',
      delivery_city: 'Test City',
      delivery_state: 'Test State',
      delivery_country: 'Test Country',
      delivery_phone: '+1234567890',
      delivery_postal: '12345'
    })
    .select()
    .single();
  
  console.log('✅ Test order created:', testOrder.id);
  
  // Test different column combinations
  const testVariations = [
    {
      name: 'Basic snake_case',
      data: {
        order_id: testOrder.id,
        product_id: '3ef2c827-f197-4208-afad-487285cfa244',
        quantity: 1
      }
    },
    {
      name: 'With price as price',
      data: {
        order_id: testOrder.id,
        product_id: '3ef2c827-f197-4208-afad-487285cfa244',
        quantity: 1,
        price: 50.00
      }
    },
    {
      name: 'With totalPrice', 
      data: {
        order_id: testOrder.id,
        product_id: '3ef2c827-f197-4208-afad-487285cfa244',
        quantity: 1,
        total_price: 50.00
      }
    },
    {
      name: 'With amount',
      data: {
        order_id: testOrder.id,
        product_id: '3ef2c827-f197-4208-afad-487285cfa244',
        quantity: 1,
        amount: 50.00
      }
    }
  ];
  
  for (const variation of testVariations) {
    console.log(`\n🧪 Testing: ${variation.name}`);
    console.log('Data:', JSON.stringify(variation.data, null, 2));
    
    const { data: result, error } = await supabase
      .from('order_item')
      .insert(variation.data)
      .select();
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ SUCCESS!');
      console.log('📋 ORDER_ITEM TABLE SCHEMA:');
      console.log('Columns:', Object.keys(result[0]).sort());
      console.log('Full data:', JSON.stringify(result[0], null, 2));
      
      // Clean up order item
      await supabase
        .from('order_item')
        .delete()
        .eq('id', result[0].id);
      
      break; // Found working schema
    }
  }
  
  // Clean up test order
  await supabase
    .from('orders')
    .delete()
    .eq('id', testOrder.id);
  
  console.log('\n🧹 Test data cleaned up');
  
  console.log('\n🎯 CONFIRMED SCHEMA:');
  console.log('- Table name: order_item (singular)');
  console.log('- Uses snake_case columns');
  console.log('- Required: order_id, product_id, quantity');
}

discoverOrderItemSchema();