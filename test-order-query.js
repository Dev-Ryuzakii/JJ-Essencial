require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderQuery() {
  console.log('🧪 Testing order query directly...');
  
  const orderId = 'cdc60698-d9b9-4282-b8e5-f72144b4db2f';
  const userId = '49e58d12-a61a-4fc5-bdba-725253990fb6';
  
  // Test 1: Basic order query without user filter
  console.log('\n1️⃣ Testing basic order query without user filter...');
  try {
    const { data: order1, error: error1 } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error1) {
      console.log('❌ Error:', error1.message);
    } else {
      console.log('✅ Order found!');
      console.log('User ID from DB:', order1.user_id);
      console.log('User ID we are filtering by:', userId);
      console.log('Match:', order1.user_id === userId);
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
  
  // Test 2: With user filter
  console.log('\n2️⃣ Testing with user filter...');
  try {
    const { data: order2, error: error2 } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (error2) {
      console.log('❌ Error:', error2.message);
    } else {
      console.log('✅ Order found with user filter!');
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
  
  // Test 3: With joins (like in the actual service)
  console.log('\n3️⃣ Testing with joins...');
  try {
    const { data: order3, error: error3 } = await supabase
      .from('orders')
      .select(`
        *,
        order_item (
          *,
          product (
            id,
            name,
            images
          )
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (error3) {
      console.log('❌ Error:', error3.message);
    } else {
      console.log('✅ Order found with joins!');
      console.log('Order items:', order3.order_item?.length || 0);
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

testOrderQuery();