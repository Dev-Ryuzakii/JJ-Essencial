const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductColumns() {
  try {
    console.log('🔍 Checking product table structure...\n');

    // Try to get one product with all columns
    const { data, error } = await supabase
      .from('product')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log('📋 Actual product record structure:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n🔍 Column analysis:');
    Object.keys(data).forEach(key => {
      console.log(`- ${key}: ${typeof data[key]} = ${data[key]}`);
    });

    // Check if is_active column exists
    console.log('\n🔍 Testing is_active filter (API uses this):');
    try {
      const { count, error: activeError } = await supabase
        .from('product')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeError) {
        console.log('❌ is_active filter error:', activeError.message);
        console.log('🔧 This explains why API returns no products!');
      } else {
        console.log(`✅ Products with is_active=true: ${count}`);
      }
    } catch (err) {
      console.log('❌ is_active column test failed:', err.message);
    }

    // Test without filter
    console.log('\n🔍 Testing without is_active filter:');
    const { count: totalCount, error: totalError } = await supabase
      .from('product')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.log('❌ Total count error:', totalError.message);
    } else {
      console.log(`📊 Total products without filter: ${totalCount}`);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkProductColumns();
