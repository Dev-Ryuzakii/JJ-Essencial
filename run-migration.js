const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('Running product table migration...');
    
    // Read the SQL migration file
    const sql = fs.readFileSync('migrations/add_missing_product_columns.sql', 'utf8');
    
    // Split into individual statements and execute each one
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        
        const { data, error } = await supabase.rpc('exec', {
          sql: statement.trim()
        });
        
        if (error) {
          console.log('Error executing statement:', error.message);
          // Continue with other statements
        } else {
          console.log('Statement executed successfully');
        }
      }
    }
    
    // Verify the columns were added
    console.log('\nVerifying columns...');
    const { data: products, error: selectError } = await supabase
      .from('product')
      .select('id, name, featured, category, brand')
      .limit(1);
    
    if (selectError) {
      console.log('Error verifying columns:', selectError.message);
    } else {
      console.log('Verification successful - columns:', Object.keys(products[0] || {}));
    }
    
  } catch (err) {
    console.log('Migration error:', err.message);
  }
}

runMigration();
