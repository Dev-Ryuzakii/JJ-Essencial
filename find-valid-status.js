require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findValidOrderStatus() {
  console.log('======================================================================');
  console.log('FIND VALID ORDER STATUS AND COMPLETE SCHEMA');
  console.log('======================================================================');
  
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];
  
  for (const status of validStatuses) {
    const orderData = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      total_amount: 100.00,
      status: status,
      delivery_address: 'Test Address',
      delivery_city: 'Test City',
      delivery_state: 'Test State',
      delivery_country: 'Test Country',
      delivery_phone: '+1234567890',
      delivery_postal: '12345'
    };
    
    console.log(`\n🧪 Testing status: ${status}`);
    
    const { data: result, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select();
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Valid status found:', status);
      console.log('Available columns:', Object.keys(result[0]));
      console.log('Full order schema:');
      
      const orderId = result[0].id;
      
      // Print clean schema
      const cleanResult = { ...result[0] };
      Object.keys(cleanResult).forEach(key => {
        if (cleanResult[key] === null) {
          cleanResult[key] = 'NULL';
        }
      });
      console.log(JSON.stringify(cleanResult, null, 2));
      
      // Now test order items
      console.log('\n🔍 Testing order items...');
      const orderItemVariations = [
        {
          table: 'orderItems',
          data: {
            orderId: orderId,
            productId: '3ef2c827-f197-4208-afad-487285cfa244',
            quantity: 1,
            unitPrice: 50.00
          }
        },
        {
          table: 'order_items',  
          data: {
            order_id: orderId,
            product_id: '3ef2c827-f197-4208-afad-487285cfa244',
            quantity: 1,
            unit_price: 50.00
          }
        }
      ];
      
      for (const variation of orderItemVariations) {
        const { data: itemResult, error: itemError } = await supabase
          .from(variation.table)
          .insert(variation.data)
          .select();
        
        if (itemError) {
          console.log(`❌ ${variation.table} error:`, itemError.message);
        } else {
          console.log(`✅ ${variation.table} works!`);
          console.log('Order item columns:', Object.keys(itemResult[0]));
          console.log('Order item data:', JSON.stringify(itemResult[0], null, 2));
          
          // Clean up order item
          await supabase.from(variation.table).delete().eq('order_id', orderId);
        }
      }
      
      // Clean up order
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      console.log('🧹 Test data cleaned up');
      
      break; // We found a working status, no need to continue
    }
  }
}

findValidOrderStatus();