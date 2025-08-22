require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateReference() {
  console.log('🔍 Generating Database Reference...\n');

  try {
    // Get all categories
    const { data: categories, error: catError } = await supabase
      .from('category')
      .select('id, name, slug, is_active')
      .order('name');

    if (catError) {
      console.error('Error fetching categories:', catError);
      return;
    }

    console.log('📁 VALID CATEGORY IDs:');
    console.log('='.repeat(50));
    categories.forEach(cat => {
      console.log(`${cat.name.toUpperCase().padEnd(15)} : '${cat.id}'`);
    });

    console.log('\n📝 Frontend Constants (copy-paste ready):');
    console.log('='.repeat(50));
    console.log('const CATEGORY_IDS = {');
    categories.forEach(cat => {
      const key = cat.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      console.log(`  ${key}: '${cat.id}',`);
    });
    console.log('};');

    console.log('\n🔧 API Usage Examples:');
    console.log('='.repeat(50));
    categories.forEach(cat => {
      console.log(`// Create product in ${cat.name} category`);
      console.log(`categoryId: '${cat.id}' // ${cat.name}\n`);
    });

    console.log('✅ Reference generated successfully!');
    console.log('\n💡 Save this output for quick reference when working with APIs.');

  } catch (error) {
    console.error('Error:', error);
  }
}

generateReference();
