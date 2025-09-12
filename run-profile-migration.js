const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add full_name to profile table');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_full_name_to_profile.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Loaded migration SQL');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // Try alternative approach using direct SQL execution
      console.log('⚠️ RPC method failed, trying direct SQL execution...');
      
      // Split the migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Executing ${statements.length} SQL statements...`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`🔄 Executing: ${statement.substring(0, 50)}...`);
          const result = await supabase.rpc('exec_sql', { sql: statement });
          if (result.error) {
            console.error(`❌ Error in statement: ${statement.substring(0, 50)}...`);
            console.error('Error:', result.error);
          } else {
            console.log(`✅ Statement executed successfully`);
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
      console.log('Result:', data);
    }
    
    // Verify the column was added
    console.log('🔍 Verifying column addition...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'profile')
      .eq('column_name', 'full_name');
      
    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Column full_name successfully added to profile table');
      console.log('Column info:', columns[0]);
    } else {
      console.log('⚠️ Column verification: full_name column not found');
    }
    
    // Update existing profiles with default names
    console.log('🔄 Updating existing profiles with default names...');
    const { data: updateResult, error: updateError } = await supabase
      .from('profile')
      .update({ full_name: 'Customer' })
      .is('full_name', null);
      
    if (updateError) {
      console.error('❌ Error updating existing profiles:', updateError);
    } else {
      console.log('✅ Updated existing profiles with default name');
      console.log('Update result:', updateResult);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative direct approach using individual queries
async function runMigrationDirect() {
  try {
    console.log('🔄 Starting direct migration approach...');
    
    // Step 1: Add the column
    console.log('1️⃣ Adding full_name column...');
    const addColumnResult = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profile ADD COLUMN IF NOT EXISTS full_name TEXT;'
    });
    
    if (addColumnResult.error) {
      console.error('❌ Error adding column:', addColumnResult.error);
    } else {
      console.log('✅ Column added successfully');
    }
    
    // Step 2: Add index
    console.log('2️⃣ Adding index...');
    const addIndexResult = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_profile_full_name ON profile(full_name);'
    });
    
    if (addIndexResult.error) {
      console.error('❌ Error adding index:', addIndexResult.error);
    } else {
      console.log('✅ Index added successfully');
    }
    
    // Step 3: Update existing records
    console.log('3️⃣ Updating existing records...');
    const { data: updateData, error: updateError } = await supabase
      .from('profile')
      .update({ full_name: 'Customer' })
      .is('full_name', null);
      
    if (updateError) {
      console.error('❌ Error updating records:', updateError);
    } else {
      console.log('✅ Records updated successfully');
    }
    
    // Step 4: Verify the change
    console.log('4️⃣ Verifying changes...');
    const { data: profiles, error: fetchError } = await supabase
      .from('profile')
      .select('id, email, full_name')
      .limit(5);
      
    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
    } else {
      console.log('✅ Sample profiles after migration:');
      console.table(profiles);
    }
    
    console.log('🎉 Direct migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Direct migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting profile table migration...');
runMigrationDirect()
  .then(() => {
    console.log('✅ Migration process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  });