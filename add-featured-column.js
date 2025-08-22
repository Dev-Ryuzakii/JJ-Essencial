const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addFeaturedColumn() {
  try {
    console.log('Checking current product table structure...');
    
    // First, let's see what columns exist
    const { data: products, error: selectError } = await supabase
      .from('product')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('Error selecting from product table:', selectError.message);
      return;
    }
    
    console.log('Current product columns:', Object.keys(products[0] || {}));
    
    // Check if featured column exists
    const { data, error } = await supabase
      .from('product')
      .select('featured')
      .limit(1);
    
    if (error && error.message.includes('featured does not exist')) {
      console.log('Featured column does not exist. Need to add it manually via Supabase dashboard or SQL query.');
      console.log('Run this SQL in your Supabase SQL editor:');
      console.log('ALTER TABLE product ADD COLUMN featured BOOLEAN DEFAULT false;');
    } else if (error) {
      console.log('Error checking featured column:', error.message);
    } else {
      console.log('Featured column already exists!');
    }
    
  } catch (err) {
    console.log('Unexpected error:', err.message);
  }
}

addFeaturedColumn();
