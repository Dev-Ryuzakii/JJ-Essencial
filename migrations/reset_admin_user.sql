-- Step 1: Clean up any existing admin user
DO $$
DECLARE
    auth_user_id uuid;
BEGIN
    -- Get the auth user ID if exists
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = 'jadesola0518@gmail.com';

    -- Delete from profile if exists
    DELETE FROM public.profile 
    WHERE email = 'jadesola0518@gmail.com';

    -- Delete from auth.users if exists (if you have permission)
    IF auth_user_id IS NOT NULL THEN
        DELETE FROM auth.users 
        WHERE id = auth_user_id;
    END IF;
END
$$;

-- Step 2: Create the user in auth.users (if you have permission)
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
)
VALUES (
    'jadesola0518@gmail.com',
    crypt('Amoke1805', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Admin User"}'::jsonb
)
ON CONFLICT (email) DO UPDATE
SET encrypted_password = crypt('Amoke1805', gen_salt('bf')),
    updated_at = NOW(),
    raw_user_meta_data = '{"full_name": "Admin User"}'::jsonb
RETURNING id;

-- Step 3: Create or update the profile
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the auth user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'jadesola0518@gmail.com';

    -- Create or update profile
    INSERT INTO public.profile (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        'jadesola0518@gmail.com',
        'Admin User',
        'ADMIN',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'ADMIN',
        is_active = true,
        updated_at = NOW();
END
$$;

-- Step 4: Verify the user is set up correctly
SELECT 
    a.id as auth_id,
    a.email as auth_email,
    a.encrypted_password IS NOT NULL as has_password,
    p.id as profile_id,
    p.email as profile_email,
    p.role as profile_role,
    p.is_active
FROM auth.users a
LEFT JOIN public.profile p ON a.id = p.id
WHERE a.email = 'jadesola0518@gmail.com';
