const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBasicSchema() {
    try {
        console.log('Creating basic schema for Supabase...');
        
        // Create profiles table
        console.log('Creating profiles table...');
        const { data: profilesTable, error: profilesError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS public.profiles (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    phone VARCHAR(20),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                -- Create index on email for faster lookups
                CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
                CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
            `
        });
        
        if (profilesError) {
            console.log('❌ Failed to create profiles table:', profilesError);
        } else {
            console.log('✅ Profiles table created');
        }
        
        // Create categories table
        console.log('Creating categories table...');
        const { data: categoriesTable, error: categoriesError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS public.categories (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    image_url VARCHAR(500),
                    sort_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
                CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);
            `
        });
        
        if (categoriesError) {
            console.log('❌ Failed to create categories table:', categoriesError);
        } else {
            console.log('✅ Categories table created');
        }
        
        // Create products table
        console.log('Creating products table...');
        const { data: productsTable, error: productsError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS public.products (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    category_id UUID REFERENCES public.categories(id),
                    image_url VARCHAR(500),
                    stock_quantity INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
                CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
                CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
            `
        });
        
        if (productsError) {
            console.log('❌ Failed to create products table:', productsError);
        } else {
            console.log('✅ Products table created');
        }
        
        // Create orders table
        console.log('Creating orders table...');
        const { data: ordersTable, error: ordersError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS public.orders (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    user_id UUID REFERENCES public.profiles(id),
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
                    total_amount DECIMAL(10,2) NOT NULL,
                    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
                    payment_method VARCHAR(50),
                    shipping_address TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
                CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
                CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
            `
        });
        
        if (ordersError) {
            console.log('❌ Failed to create orders table:', ordersError);
        } else {
            console.log('✅ Orders table created');
        }
        
        console.log('\n✅ Basic schema created successfully!');
        
        // Now create admin user
        const adminEmail = process.env.ADMIN_EMAIL;
        console.log('\nCreating admin user:', adminEmail);
        
        const { data: adminUser, error: adminError } = await supabase
            .from('profiles')
            .insert({
                email: adminEmail,
                role: 'admin',
                first_name: 'Admin',
                last_name: 'User',
                is_active: true
            })
            .select()
            .single();
            
        if (adminError) {
            if (adminError.code === '23505') { // Unique constraint violation
                console.log('✅ Admin user already exists');
            } else {
                console.log('❌ Failed to create admin user:', adminError.message);
            }
        } else {
            console.log('✅ Admin user created:', adminUser);
        }
        
    } catch (err) {
        console.log('❌ Schema creation failed:', err.message);
    }
}

createBasicSchema();
