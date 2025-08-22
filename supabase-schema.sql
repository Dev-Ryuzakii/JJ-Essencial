-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS product_review CASCADE;
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS order_item CASCADE;
DROP TABLE IF EXISTS stock_movement CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS wishlist_item CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS user_address CASCADE;
DROP TABLE IF EXISTS customer_support_message CASCADE;
DROP TABLE IF EXISTS customer_support CASCADE;
DROP TABLE IF EXISTS profile CASCADE;

-- Create profile table
CREATE TABLE IF NOT EXISTS public.profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create user_address table
CREATE TABLE public.user_address (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profile(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create category table
CREATE TABLE public.category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    slug TEXT UNIQUE,
    parent_id UUID,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    CONSTRAINT category_parent_id_fkey FOREIGN KEY (parent_id) 
        REFERENCES public.category(id) ON DELETE SET NULL
);

-- Create product table
CREATE TABLE public.product (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INTEGER DEFAULT 10,
    sku TEXT UNIQUE,
    category_id UUID REFERENCES public.category(id) ON DELETE SET NULL,
    images TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create stock_movement table
CREATE TABLE public.stock_movement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.product(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'RETURN', 'DAMAGED', 'EXPIRED')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    reference TEXT,
    performed_by UUID REFERENCES public.profile(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profile(id),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
    payment_ref TEXT,
    payment_status TEXT CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_method TEXT,
    receipt_url TEXT,
    delivery_address TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    delivery_state TEXT NOT NULL,
    delivery_postal TEXT NOT NULL,
    delivery_country TEXT NOT NULL,
    delivery_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create order_item table
CREATE TABLE public.order_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.product(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create order_tracking table
CREATE TABLE public.order_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create product_review table
CREATE TABLE public.product_review (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.product(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profile(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[],
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create wishlist_item table
CREATE TABLE public.wishlist_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profile(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.product(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    UNIQUE(user_id, product_id)
);

-- Create customer_support table
CREATE TABLE public.customer_support (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profile(id),
    agent_id UUID REFERENCES public.profile(id),
    issue_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    subject TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    resolution TEXT,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create customer_support_message table
CREATE TABLE public.customer_support_message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    support_id UUID REFERENCES public.customer_support(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profile(id),
    message TEXT NOT NULL,
    attachments TEXT[],
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profile (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profile_timestamp
    BEFORE UPDATE ON public.profile
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_product_timestamp
    BEFORE UPDATE ON public.product
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_timestamp
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_product_review_timestamp
    BEFORE UPDATE ON public.product_review
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customer_support_timestamp
    BEFORE UPDATE ON public.customer_support
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_profile_email ON public.profile(email);
CREATE INDEX idx_profile_role ON public.profile(role);
CREATE INDEX idx_product_category ON public.product(category_id);
CREATE INDEX idx_product_active ON public.product(is_active);
CREATE INDEX idx_order_user ON public.orders(user_id);
CREATE INDEX idx_order_status ON public.orders(status);
CREATE INDEX idx_order_created ON public.orders(created_at);
CREATE INDEX idx_review_product ON public.product_review(product_id);
CREATE INDEX idx_review_user ON public.product_review(user_id);
CREATE INDEX idx_support_user ON public.customer_support(user_id);
CREATE INDEX idx_support_status ON public.customer_support(status);
CREATE INDEX idx_stock_product ON public.stock_movement(product_id);

-- Create RLS policies
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_address ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support_message ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own profile"
    ON public.profile FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profile FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view their own addresses"
    ON public.user_address FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own addresses"
    ON public.user_address FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items"
    ON public.order_item FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_item.order_id
        AND orders.user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own reviews"
    ON public.product_review FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reviews"
    ON public.product_review FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wishlist"
    ON public.wishlist_item FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlist"
    ON public.wishlist_item FOR ALL
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Insert initial admin user
INSERT INTO public.profile (email, full_name, role)
VALUES ('jadesola0518@gmail.com', 'Admin User', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Insert some initial categories
INSERT INTO public.category (name, description, slug)
VALUES
    ('Electronics', 'Electronic devices and accessories', 'electronics'),
    ('Fashion', 'Clothing and fashion accessories', 'fashion'),
    ('Home & Living', 'Home decor and living essentials', 'home-living')
ON CONFLICT (name) DO NOTHING;
