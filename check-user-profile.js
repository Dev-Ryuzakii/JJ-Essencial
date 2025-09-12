const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificUser() {
  try {
    console.log('🔍 Checking specific user profile...');
    
    // Check the specific user from our order data
    const { data: profile, error } = await supabase
      .from('profile')
      .select('id, email, full_name, created_at')
      .eq('id', '49e58d12-a61a-4fc5-bdba-725253990fb6')
      .single();
      
    if (error) {
      console.error('❌ Error fetching user profile:', error);
    } else {
      console.log('📋 User profile details:');
      console.table([profile]);
      
      if (!profile.full_name) {
        console.log('🔄 Updating user with default name...');
        const { data: updateData, error: updateError } = await supabase
          .from('profile')
          .update({ full_name: 'Customer' })
          .eq('id', profile.id)
          .select();
          
        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
        } else {
          console.log('✅ Profile updated successfully:');
          console.table(updateData);
        }
      }
    }
    
    // Now test the admin orders API to see if it picks up the names
    console.log('🔍 Testing admin orders API response...');
    const { data: orders, error: ordersError } = await supabase
      .from('order')
      .select(`
        id,
        user_id,
        profile:user_id(id, email, full_name)
      `)
      .eq('id', '57a08b11-817c-4f4d-8c60-4fe089e9b3b1')
      .single();
      
    if (ordersError) {
      console.error('❌ Error fetching order:', ordersError);
    } else {
      console.log('📋 Order with profile data:');
      console.log(JSON.stringify(orders, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSpecificUser();