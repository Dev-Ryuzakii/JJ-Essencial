const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanupAuthUsers() {
  try {
    console.log('🔍 Checking Supabase Auth users...');
    
    // List all auth users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Error listing users:', listError.message);
      return;
    }
    
    console.log(`✅ Found ${users.length} users in Auth:`);
    users.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));
    
    // Check corresponding profiles
    console.log('\n🔍 Checking corresponding profiles...');
    for (const user of users) {
      const { data: profile, error: profileError } = await supabase
        .from('profile')
        .select('*')
        .eq('email', user.email)
        .single();
        
      if (profileError && profileError.code === 'PGRST116') {
        console.log(`❌ No profile found for ${user.email} - Auth user exists but no profile`);
        
        // Option: Delete the orphaned auth user
        console.log(`🗑️  Deleting orphaned auth user: ${user.email}`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.log(`❌ Failed to delete ${user.email}:`, deleteError.message);
        } else {
          console.log(`✅ Deleted orphaned auth user: ${user.email}`);
        }
      } else if (profileError) {
        console.log(`❌ Error checking profile for ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Profile exists for ${user.email}`);
      }
    }
    
    console.log('\n✅ Cleanup complete! You can now test signup with fresh emails.');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

cleanupAuthUsers();
