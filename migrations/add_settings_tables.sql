-- Add missing tables for admin settings functionality

-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name TEXT NOT NULL DEFAULT 'JJ Essential',
    site_description TEXT DEFAULT 'Your premium e-commerce destination',
    contact_email TEXT DEFAULT 'contact@jjessential.com',
    currency TEXT DEFAULT 'NGN',
    timezone TEXT DEFAULT 'Africa/Lagos',
    maintenance_mode BOOLEAN DEFAULT false,
    allow_registration BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    order_auto_confirm BOOLEAN DEFAULT false,
    low_stock_threshold INTEGER DEFAULT 10,
    tax_rate DECIMAL(5,2) DEFAULT 7.5,
    shipping_fee DECIMAL(10,2) DEFAULT 2000,
    free_shipping_threshold DECIMAL(10,2) DEFAULT 50000,
    default_language TEXT DEFAULT 'en',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT '24h',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create bank_accounts table  
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    currency TEXT DEFAULT 'NGN',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, now())
);

-- Create trigger for timestamp updates on settings
CREATE TRIGGER update_site_settings_timestamp
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bank_accounts_timestamp
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (
    site_name,
    site_description,
    contact_email,
    currency,
    timezone,
    maintenance_mode,
    allow_registration,
    email_notifications,
    sms_notifications,
    order_auto_confirm,
    low_stock_threshold,
    tax_rate,
    shipping_fee,
    free_shipping_threshold,
    default_language,
    date_format,
    time_format
) VALUES (
    'JJ Essential',
    'Your premium e-commerce destination',
    'contact@jjessential.com',
    'NGN',
    'Africa/Lagos',
    false,
    true,
    true,
    false,
    false,
    10,
    7.5,
    2000,
    50000,
    'en',
    'DD/MM/YYYY',
    '24h'
) ON CONFLICT DO NOTHING;

-- Insert sample bank accounts
INSERT INTO public.bank_accounts (
    bank_name,
    account_name,
    account_number,
    currency,
    is_default,
    is_active
) VALUES 
(
    'First Bank Nigeria',
    'JJ Essential Limited',
    '2011234567',
    'NGN',
    true,
    true
),
(
    'Access Bank',
    'JJ Essential Limited',
    '0987654321',
    'NGN',
    false,
    true
) ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON public.site_settings TO anon, authenticated, service_role;
GRANT ALL ON public.bank_accounts TO anon, authenticated, service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON public.bank_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_default ON public.bank_accounts(is_default);
