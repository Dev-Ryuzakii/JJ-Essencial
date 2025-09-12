require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrderItemsTable() {
  console.log('======================================================================');
  console.log('FIND ORDER ITEMS TABLE NAME');
  console.log('======================================================================');
  
  const possibleTableNames = [
    'order_items',
    'orderItems', 
    'order_item',
    'orderItem',
    'orders_items',
    'ordersItems'
  ];
  
  for (const tableName of possibleTableNames) {
    console.log(`\n🧪 Testing table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Table exists!');
      console.log('Columns:', data.length > 0 ? Object.keys(data[0]) : 'No data but table exists');
      
      // If table exists but has no data, try to understand its schema by testing insert
      if (data.length === 0) {
        console.log('Testing schema with sample data...');
        
        // Create a test order first
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
        
        if (testOrder) {
          const testOrderItem = {
            order_id: testOrder.id,
            product_id: '3ef2c827-f197-4208-afad-487285cfa244',
            quantity: 1,
            unit_price: 50.00
          };
          
          const { data: itemResult, error: itemError } = await supabase
            .from(tableName)
            .insert(testOrderItem)
            .select();
          
          if (itemError) {
            console.log('❌ Insert failed:', itemError.message);
            
            // Try camelCase
            const camelCaseItem = {
              orderId: testOrder.id,
              productId: '3ef2c827-f197-4208-afad-487285cfa244',
              quantity: 1,
              unitPrice: 50.00
            };
            
            const { data: itemResult2, error: itemError2 } = await supabase
              .from(tableName)
              .insert(camelCaseItem)
              .select();
            
            if (itemError2) {
              console.log('❌ CamelCase insert failed:', itemError2.message);
            } else {
              console.log('✅ CamelCase insert works!');
              console.log('Schema:', Object.keys(itemResult2[0]));
            }
          } else {
            console.log('✅ Snake_case insert works!');
            console.log('Schema:', Object.keys(itemResult[0]));
          }
          
          // Clean up
          await supabase.from('orders').delete().eq('id', testOrder.id);
        }
      }
      
      return; // Found the table, exit loop
    }
  }
  
  console.log('\n❌ No order items table found with any of the tested names');
  console.log('The order items might be stored differently or the table might not exist yet');
}

findOrderItemsTable();