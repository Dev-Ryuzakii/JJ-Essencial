const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateCustomerNames() {
  try {
    console.log('🔄 Updating customer names with better defaults...');
    
    // Get all profiles that have null or 'Customer' as full_name
    const { data: profiles, error } = await supabase
      .from('profile')
      .select('id, email, full_name')
      .or('full_name.is.null,full_name.eq.Customer');
      
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    console.log(`📋 Found ${profiles.length} profiles to update`);
    
    for (const profile of profiles) {
      let newName = 'Customer';
      
      // Extract name from email if possible
      if (profile.email) {
        const emailUsername = profile.email.split('@')[0];
        
        // Convert email username to a more readable name
        const cleanName = emailUsername
          .replace(/[0-9]/g, '') // Remove numbers
          .replace(/[._-]/g, ' ') // Replace dots, underscores, hyphens with spaces
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize
          .join(' ')
          .trim();
          
        if (cleanName.length > 2) {
          newName = cleanName;
        }
      }
      
      console.log(`📝 Updating ${profile.email}: "${profile.full_name}" → "${newName}"`);
      
      const { error: updateError } = await supabase
        .from('profile')
        .update({ full_name: newName })
        .eq('id', profile.id);
        
      if (updateError) {
        console.error(`❌ Error updating ${profile.email}:`, updateError);
      } else {
        console.log(`✅ Updated ${profile.email}`);
      }
    }
    
    console.log('🎉 Customer name update completed!');
    
    // Show sample of updated profiles
    console.log('\n📋 Sample of updated profiles:');
    const { data: sampleProfiles, error: sampleError } = await supabase
      .from('profile')
      .select('email, full_name')
      .limit(10);
      
    if (!sampleError) {
      console.table(sampleProfiles);
    }
    
  } catch (error) {
    console.error('❌ Error updating customer names:', error);
  }
}

updateCustomerNames();