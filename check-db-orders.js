require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseOrders() {
  console.log('🔍 Checking orders in database directly...');
  
  try {
    // Check all orders in the database
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allError) {
      console.log('❌ Error getting orders:', allError.message);
      return;
    }
    
    console.log('📊 Total orders found:', allOrders?.length || 0);
    
    if (allOrders && allOrders.length > 0) {
      console.log('\n📋 Recent orders:');
      allOrders.forEach((order, index) => {
        console.log(`${index + 1}. ID: ${order.id}`);
        console.log(`   User ID: ${order.user_id}`);
        console.log(`   Total: ${order.total_amount}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Created: ${order.created_at}`);
        console.log('   ---');
      });
      
      // Check for orders created in the last hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', oneHourAgo.toISOString());
      
      console.log(`\n🕐 Orders created in last hour: ${recentOrders?.length || 0}`);
      
      if (recentOrders && recentOrders.length > 0) {
        console.log('Recent orders details:');
        recentOrders.forEach(order => {
          console.log(`- Order ${order.id} for user ${order.user_id} - ${order.total_amount}`);
        });
      }
      
    } else {
      console.log('⚠️ No orders found in database');
    }
    
    // Also check order items
    const { data: orderItems } = await supabase
      .from('order_item')
      .select('*')
      .limit(5);
    
    console.log(`\n📦 Order items in database: ${orderItems?.length || 0}`);
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
}

checkDatabaseOrders();