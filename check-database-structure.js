const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking database table structures...');
    
    // Check if paymentTransaction table exists and its structure
    const { data: paymentTransactionColumns, error: ptError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'paymentTransaction');
      
    if (ptError) {
      console.error('❌ Error checking paymentTransaction table:', ptError);
    } else {
      console.log('\n📋 paymentTransaction table columns:');
      console.table(paymentTransactionColumns);
    }
    
    // Check orders table structure
    const { data: ordersColumns, error: ordersError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'orders');
      
    if (ordersError) {
      console.error('❌ Error checking orders table:', ordersError);
    } else {
      console.log('\n📋 orders table columns:');
      console.table(ordersColumns);
    }
    
    // Check if the test order exists
    console.log('\n🔍 Checking test order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, status')
      .eq('id', '57a08b11-817c-4f4d-8c60-4fe089e9b3b1')
      .single();
      
    if (orderError) {
      console.error('❌ Order not found:', orderError);
    } else {
      console.log('✅ Test order found:', order);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkTableStructure();