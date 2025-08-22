-- Check if user exists in auth.users and public.profile
SELECT 
    a.id as auth_id,
    a.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role as profile_role
FROM auth.users a
FULL OUTER JOIN public.profile p ON a.id = p.id
WHERE a.email = 'jadesola0518@gmail.com' OR p.email = 'jadesola0518@gmail.com';
