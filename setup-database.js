const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    try {
        console.log('Setting up database schema...');
        
        // First, let's create the profile table manually
        console.log('Creating profile table...');
        
        // Test simple connection first
        const { data: testData, error: testError } = await supabase
            .from('profile')
            .select('*')
            .limit(1);
            
        if (testError && testError.code === 'PGRST106') {
            console.log('Profile table does not exist, need to create schema...');
            console.log('Please run the SQL schema manually in Supabase dashboard.');
            console.log('Go to: https://supabase.com/dashboard/project/rqvymrvqtkdzkeoaynfr/sql');
            console.log('Copy and paste the contents of supabase-schema.sql');
            return;
        }
        
        if (testError) {
            console.log('❌ Database error:', testError);
            return;
        }
        
        console.log('✅ Profile table exists');
        console.log('Current profiles:', testData);
        
        // Check if admin user exists
        const adminEmail = process.env.ADMIN_EMAIL;
        console.log('\\nChecking admin user:', adminEmail);
        
        const { data: adminProfile, error: adminError } = await supabase
            .from('profile')
            .select('*')
            .eq('email', adminEmail)
            .single();
            
        if (adminError) {
            if (adminError.code === 'PGRST116') {
                console.log('Admin user not found, creating...');
                
                const { data: newAdmin, error: createError } = await supabase
                    .from('profile')
                    .insert({
                        email: adminEmail,
                        full_name: 'Admin User',
                        role: 'ADMIN',
                        is_active: true
                    })
                    .select()
                    .single();
                    
                if (createError) {
                    console.log('❌ Failed to create admin user:', createError);
                } else {
                    console.log('✅ Admin user created:', newAdmin);
                }
            } else {
                console.log('❌ Error checking admin user:', adminError);
            }
        } else {
            console.log('✅ Admin user exists:', adminProfile);
        }
        
        // Test categories table
        console.log('\\nTesting categories table...');
        const { data: categories, error: catError } = await supabase
            .from('category')
            .select('*')
            .limit(5);
            
        if (catError) {
            console.log('❌ Categories table error:', catError);
        } else {
            console.log('✅ Categories table exists, count:', categories.length);
        }
        
        // Test products table
        console.log('Testing products table...');
        const { data: products, error: prodError } = await supabase
            .from('product')
            .select('*')
            .limit(5);
            
        if (prodError) {
            console.log('❌ Products table error:', prodError);
        } else {
            console.log('✅ Products table exists, count:', products.length);
        }
        
        console.log('\\n✅ Database setup check complete!');
        
    } catch (err) {
        console.log('❌ Setup failed:', err.message);
    }
}

setupDatabase();
