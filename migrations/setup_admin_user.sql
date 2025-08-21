-- First, remove any existing admin user with the same email if exists
DO $$ 
BEGIN
    -- Delete from profile table
    DELETE FROM public.profile WHERE email = 'jadesola0518@gmail.com';
    
    -- Note: The auth.users deletion will be handled by Supabase Auth API
END $$;

-- Insert the admin user into profile table
INSERT INTO public.profile (
    email,
    full_name,
    role,
    is_active
) VALUES (
    'jadesola0518@gmail.com',
    'Admin User',
    'ADMIN',
    true
) ON CONFLICT (email) DO UPDATE 
SET role = 'ADMIN',
    is_active = true;
