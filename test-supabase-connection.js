const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
    try {
        console.log('Testing Supabase connection...');
        
        // Test basic connection
        const { data, error } = await supabase
            .from('profile')
            .select('*')
            .limit(5);
            
        if (error) {
            console.log('❌ Supabase connection failed:', error.message);
            return;
        }
        
        console.log('✅ Supabase connection successful!');
        console.log('Current profiles:', data);
        
        // Check if admin user exists
        const adminEmail = process.env.ADMIN_EMAIL;
        console.log('\nChecking admin user:', adminEmail);
        
        const { data: adminProfile, error: adminError } = await supabase
            .from('profile')
            .select('*')
            .eq('email', adminEmail)
            .single();
            
        if (adminError) {
            console.log('❌ Admin profile not found:', adminError.message);
            
            // Create admin profile
            console.log('Creating admin profile...');
            const { data: newAdmin, error: createError } = await supabase
                .from('profile')
                .insert({
                    email: adminEmail,
                    role: 'admin',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
                
            if (createError) {
                console.log('❌ Failed to create admin profile:', createError.message);
            } else {
                console.log('✅ Admin profile created:', newAdmin);
            }
        } else {
            console.log('✅ Admin profile exists:', adminProfile);
        }
        
        // List all tables
        console.log('\nListing all tables...');
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_schema_tables');
            
        if (!tablesError && tables) {
            console.log('Available tables:', tables);
        }
        
    } catch (err) {
        console.log('❌ Connection test failed:', err.message);
    }
}

testSupabaseConnection();
