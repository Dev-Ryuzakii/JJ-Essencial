-- First, clean up any existing user
DELETE FROM public.profile WHERE email = 'jadesola0518@gmail.com';

-- Now create a new admin profile
INSERT INTO public.profile (
    id, -- We'll use a UUID for now, it will be updated when the auth user is created
    email,
    full_name,
    role,
    is_active
) VALUES (
    uuid_generate_v4(),
    'jadesola0518@gmail.com',
    'Admin User',
    'ADMIN',
    true
);

-- Ensure proper indexes and constraints
CREATE INDEX IF NOT EXISTS idx_profile_email ON public.profile(email);
CREATE INDEX IF NOT EXISTS idx_profile_role ON public.profile(role);

-- Notify Supabase to refresh schema
NOTIFY pgrst, 'reload schema';
