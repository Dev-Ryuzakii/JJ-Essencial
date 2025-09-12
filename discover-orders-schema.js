require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverOrdersSchema() {
  console.log('======================================================================');
  console.log('ORDERS TABLE SCHEMA DISCOVERY');
  console.log('======================================================================');
  
  // Try to understand the schema by testing different field combinations
  const testCases = [
    // Case 1: Basic snake_case
    {
      name: 'snake_case basic',
      data: {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        total_amount: 100.00,
        status: 'pending',
        delivery_address: 'Test Address',
        delivery_city: 'Test City',
        delivery_state: 'Test State',
        delivery_country: 'Test Country',
        delivery_phone: '+1234567890'
      }
    },
    // Case 2: With order_number and other common fields
    {
      name: 'with order_number',
      data: {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        total_amount: 100.00,
        status: 'pending',
        order_number: 'ORD-TEST-001',
        delivery_address: 'Test Address',
        delivery_city: 'Test City',
        delivery_state: 'Test State',
        delivery_country: 'Test Country',
        delivery_phone: '+1234567890'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('Data:', JSON.stringify(testCase.data, null, 2));
    
    const { data: result, error } = await supabase
      .from('orders')
      .insert(testCase.data)
      .select();
    
    if (error) {
      console.log('❌ Error:', error.message);
      
      // Try to extract column information from error
      if (error.message.includes('Could not find the')) {
        const match = error.message.match(/Could not find the '(.+?)' column/);
        if (match) {
          console.log(`   Missing column: ${match[1]}`);
        }
      } else if (error.message.includes('violates not-null constraint')) {
        const match = error.message.match(/column "(.+?)"/);
        if (match) {
          console.log(`   Required column: ${match[1]}`);
        }
      }
    } else {
      console.log('✅ Success! Inserted:', result);
      console.log('✅ Actual columns in result:', Object.keys(result[0]));
      
      // Clean up
      await supabase
        .from('orders')
        .delete()
        .eq('user_id', testCase.data.user_id);
      
      // This worked, so we found the schema
      break;
    }
  }
  
  // Also try to check if there are existing orders with a different approach
  console.log('\n🔍 Checking existing orders with different select patterns...');
  
  const selectPatterns = [
    '*',
    'id, user_id, total_amount, status',
    'id, userId, totalAmount, status',
    'id, user_id, total_amount, status, delivery_address, delivery_city, delivery_state, delivery_country, delivery_phone'
  ];
  
  for (const pattern of selectPatterns) {
    const { data, error } = await supabase
      .from('orders')
      .select(pattern)
      .limit(1);
    
    if (error) {
      console.log(`❌ Select '${pattern}' failed:`, error.message);
    } else {
      console.log(`✅ Select '${pattern}' worked:`, data.length === 0 ? 'No data but query valid' : Object.keys(data[0] || {}));
    }
  }
}

discoverOrdersSchema();