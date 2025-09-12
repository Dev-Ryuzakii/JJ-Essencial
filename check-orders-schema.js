require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersSchema() {
  console.log('======================================================================');
  console.log('ORDERS TABLE SCHEMA CHECK');
  console.log('======================================================================');
  
  try {
    // Try to get a sample order to see the actual columns
    const { data: sampleOrder, error: sampleError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (sampleOrder && sampleOrder.length > 0) {
      console.log('✅ Sample Order Columns:', Object.keys(sampleOrder[0]));
    } else if (sampleError) {
      console.log('❌ Error getting sample order:', sampleError.message);
    } else {
      console.log('⚠️  No orders found in table');
    }
    
    // Check what happens if we try to insert a minimal order
    console.log('\n🧪 Testing order insertion columns...');
    
    const testData = {
      userId: '123e4567-e89b-12d3-a456-426614174000', // fake UUID
      totalAmount: 100.00,
      status: 'pending'
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('orders')
      .insert(testData)
      .select();
      
    if (insertError) {
      console.log('❌ Insert Error (reveals required columns):', insertError.message);
      
      // Try different variations
      const variations = [
        { user_id: testData.userId, total_amount: testData.totalAmount, status: testData.status },
        { userId: testData.userId, totalAmount: testData.totalAmount, status: testData.status, deliveryAddress: 'test' },
        { userId: testData.userId, totalAmount: testData.totalAmount, status: testData.status, address_id: null }
      ];
      
      for (let i = 0; i < variations.length; i++) {
        const { error: varError } = await supabase
          .from('orders')
          .insert(variations[i])
          .select();
        
        if (varError) {
          console.log(`❌ Variation ${i + 1} Error:`, varError.message);
        } else {
          console.log(`✅ Variation ${i + 1} would work!`);
          // Delete the test record
          await supabase
            .from('orders')
            .delete()
            .eq('userId', testData.userId);
          break;
        }
      }
    } else {
      console.log('✅ Insert successful:', insertTest);
      // Clean up test data
      await supabase
        .from('orders')
        .delete()
        .eq('userId', testData.userId);
    }
    
  } catch (error) {
    console.error('🔥 Error:', error.message);
  }
}

checkOrdersSchema();