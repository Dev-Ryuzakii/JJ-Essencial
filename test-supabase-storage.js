const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Not found');
console.log('Service Key:', supabaseServiceKey ? 'Found (length: ' + supabaseServiceKey.length + ')' : 'Not found');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testSupabaseStorage() {
  try {
    console.log('\n--- Testing Supabase Storage ---');
    
    // List all buckets
    console.log('1. Listing all buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      console.log('Available buckets:', buckets.map(b => `${b.id} (public: ${b.public})`));
    }
    
    // Check if 'products' bucket exists
    const productsBucket = buckets?.find(b => b.id === 'products');
    if (productsBucket) {
      console.log('✅ Products bucket found:', productsBucket);
    } else {
      console.log('❌ Products bucket not found');
      return;
    }
    
    // Try to list files in products bucket
    console.log('\n2. Testing access to products bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('products')
      .list('', { limit: 1 });
    
    if (filesError) {
      console.error('Error accessing products bucket:', filesError);
    } else {
      console.log('✅ Can access products bucket. Files count:', files?.length || 0);
    }
    
    // Try to create a test file
    console.log('\n3. Testing file upload...');
    const testContent = Buffer.from('test file content');
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
    } else {
      console.log('✅ Test file uploaded successfully:', uploadData);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('products')
        .remove([testFileName]);
        
      if (deleteError) {
        console.error('Error deleting test file:', deleteError);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabaseStorage();
