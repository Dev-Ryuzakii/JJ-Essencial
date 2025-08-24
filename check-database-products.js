const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database for products...\n');

    // Check all tables that might contain products
    const tables = ['product', 'products'];
    
    for (const tableName of tables) {
      console.log(`📋 Checking table: ${tableName}`);
      
      try {
        // Get count first
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.log(`   ❌ Error accessing ${tableName}:`, countError.message);
          continue;
        }

        console.log(`   📊 Total records in ${tableName}: ${count}`);

        if (count > 0) {
          // Get sample records with basic columns first
          const { data, error } = await supabase
            .from(tableName)
            .select('id, name, price, stock, createdAt')
            .limit(5);

          if (error) {
            console.log(`   ❌ Error fetching data from ${tableName}:`, error.message);
            
            // Try with just basic columns
            const { data: basicData, error: basicError } = await supabase
              .from(tableName)
              .select('id, name')
              .limit(3);
              
            if (!basicError && basicData) {
              console.log(`   📝 Basic records from ${tableName}:`);
              basicData.forEach((record, index) => {
                console.log(`   ${index + 1}. ${record.name} (ID: ${record.id})`);
              });
            }
          } else {
            console.log(`   📝 Sample records from ${tableName}:`);
            data.forEach((record, index) => {
              console.log(`   ${index + 1}. ${record.name} (ID: ${record.id})`);
              console.log(`      Price: ${record.price}, Stock: ${record.stock}`);
            });
          }
        } else {
          console.log(`   ℹ️  No records found in ${tableName}`);
        }
        
        console.log(''); // Empty line for readability
        
      } catch (tableError) {
        console.log(`   ❌ Table ${tableName} might not exist:`, tableError.message);
        console.log('');
      }
    }

    // Also check if there are any categories
    console.log('📋 Checking categories table:');
    try {
      const { count: categoryCount, error: categoryError } = await supabase
        .from('category')
        .select('*', { count: 'exact', head: true });

      if (categoryError) {
        console.log(`   ❌ Error accessing categories:`, categoryError.message);
      } else {
        console.log(`   📊 Total categories: ${categoryCount}`);
        
        if (categoryCount > 0) {
          const { data: categories, error: catError } = await supabase
            .from('category')
            .select('id, name')
            .limit(3);
            
          if (catError) {
            console.log('   ❌ Error fetching categories:', catError.message);
          } else if (categories && categories.length > 0) {
            console.log('   📝 Sample categories:');
            categories.forEach((cat, index) => {
              console.log(`   ${index + 1}. ${cat.name} (ID: ${cat.id})`);
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Categories table error:`, error.message);
    }

    console.log('\n🔍 Summary:');
    console.log('If you see "No records found" for products, then the API response was correct.');
    console.log('If you see product records here, then there might be an issue with the API endpoint.');

  } catch (error) {
    console.log('❌ Database connection error:', error.message);
  }
}

checkDatabase();
