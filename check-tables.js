const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  console.log('Checking available tables...');
  
  // Try to list some common tables to see what exists
  const tables = [
    'payment_transaction', 
    'payment_transactions', 
    'payments', 
    'orders', 
    'order', 
    'order_item',
    'order_items',
    'category', 
    'categories', 
    'product', 
    'products',
    'profile',
    'profiles',
    'bank_account',
    'bank_accounts',
    'payment_receipt',
    'payment_receipts',
    'transaction',
    'transactions'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        console.log('✅ Table exists:', table);
        if (data && data.length > 0) {
          console.log('   Sample fields:', Object.keys(data[0]));
        } else {
          console.log('   Table is empty');
        }
      } else {
        console.log('❌ Table not found:', table, '- Error:', error.message);
      }
    } catch (e) {
      console.log('❌ Error checking table:', table, '- Error:', e.message);
    }
  }
}

checkTables().catch(console.error);
