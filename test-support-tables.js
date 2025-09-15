require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get the Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || "https://rqvymrvqtkdzkeoaynfr.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET;

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Not found');
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Not found');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

console.log('Connecting to Supabase...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupportTables() {
  console.log('Testing support tables...');
  
  try {
    // Test if support_chat table exists
    const { data: chatTable, error: chatError } = await supabase
      .from('support_chat')
      .select('id')
      .limit(1);
    
    if (chatError) {
      console.log('❌ support_chat table error:', chatError.message);
      if (chatError.message.includes('relation') && chatError.message.includes('does not exist')) {
        console.log('The support_chat table does not exist in the database.');
        console.log('You need to run the SQL migration to create the tables.');
      }
    } else {
      console.log('✅ support_chat table exists');
    }
    
    // Test if chat_message table exists
    const { data: messageTable, error: messageError } = await supabase
      .from('chat_message')
      .select('id')
      .limit(1);
    
    if (messageError) {
      console.log('❌ chat_message table error:', messageError.message);
      if (messageError.message.includes('relation') && messageError.message.includes('does not exist')) {
        console.log('The chat_message table does not exist in the database.');
        console.log('You need to run the SQL migration to create the tables.');
      }
    } else {
      console.log('✅ chat_message table exists');
    }
    
    // List all tables in public schema
    console.log('\nChecking all tables in public schema...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.log('❌ Error listing tables:', tablesError.message);
    } else {
      console.log('Tables in public schema:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testSupportTables();