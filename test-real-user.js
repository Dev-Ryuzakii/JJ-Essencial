require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithRealUser() {
  console.log('======================================================================');
  console.log('TEST ORDER SCHEMA WITH REAL USER');
  console.log('======================================================================');
  
  // First get a real user ID
  const { data: users, error: userError } = await supabase
    .from('profile')
    .select('id, email, full_name')
    .limit(1);
  
  if (userError || !users || users.length === 0) {
    console.log('❌ No users found or error:', userError?.message);
    console.log('Creating a test user first...');
    
    // Create a test user in auth.users first
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Error creating auth user:', authError.message);
      return;
    }
    
    console.log('✅ Test user created:', authUser.user.id);
    var userId = authUser.user.id;
  } else {
    console.log('✅ Found existing user:', users[0]);
    var userId = users[0].id;
  }
  
  const orderData = {
    user_id: userId,
    total_amount: 100.00,
    status: 'PENDING',
    delivery_address: 'Test Address',
    delivery_city: 'Test City',
    delivery_state: 'Test State',
    delivery_country: 'Test Country',
    delivery_phone: '+1234567890',
    delivery_postal: '12345'
  };
  
  console.log('\nTesting order creation with real user ID:');
  console.log(JSON.stringify(orderData, null, 2));
  
  const { data: result, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select();
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ SUCCESS! Order created');
    console.log('\n📋 COMPLETE ORDERS TABLE SCHEMA:');
    console.log('Available columns:', Object.keys(result[0]).sort());
    
    const orderId = result[0].id;
    
    // Test order items
    console.log('\n🔍 Testing ORDER_ITEMS...');
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
    } else {
      console.log('✅ Order items created successfully!');
      console.log('📋 ORDER_ITEMS TABLE SCHEMA:');
      console.log('Available columns:', Object.keys(itemResult[0]).sort());
      console.log('\nComplete order item:', JSON.stringify(itemResult[0], null, 2));
    }
    
    // Clean up
    await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    console.log('\n🧹 Test data cleaned up');
    
    console.log('\n🎯 FINAL SCHEMA REQUIREMENTS:');
    console.log('ORDERS TABLE COLUMNS (snake_case):');
    console.log('- user_id (UUID, foreign key)');
    console.log('- total_amount (decimal)');
    console.log('- status (enum: PENDING, PAID, COMPLETED, CANCELLED)');
    console.log('- delivery_address (string)');
    console.log('- delivery_city (string)');
    console.log('- delivery_state (string)');
    console.log('- delivery_country (string)');
    console.log('- delivery_phone (string)');
    console.log('- delivery_postal (string)');
    console.log('- Plus auto fields: id, created_at, updated_at');
    
    console.log('\nORDER_ITEMS TABLE COLUMNS (snake_case):');
    console.log('- order_id (UUID, foreign key)');
    console.log('- product_id (UUID, foreign key)');
    console.log('- quantity (integer)');
    console.log('- unit_price (decimal)');
    console.log('- Plus auto fields: id, created_at, updated_at');
  }
}

testWithRealUser();