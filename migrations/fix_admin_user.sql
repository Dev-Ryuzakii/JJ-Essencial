-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Clean up existing user
DELETE FROM auth.users WHERE email = 'jadesola0518@gmail.com';
DELETE FROM public.profile WHERE email = 'jadesola0518@gmail.com';

-- Step 2: Create admin user in auth.users with explicit UUID
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin
)
VALUES (
    uuid_generate_v4(), -- Generate UUID for id
    '00000000-0000-0000-0000-000000000000'::uuid, -- default instance_id
    'jadesola0518@gmail.com',
    crypt('Amoke1805', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Admin User"}'::jsonb,
    false
);

-- Step 3: Update the automatically created profile with admin role
UPDATE public.profile 
SET 
    role = 'ADMIN',
    is_active = true
WHERE email = 'jadesola0518@gmail.com';
