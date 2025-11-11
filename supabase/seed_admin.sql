-- Seed script to create default admin account
-- Email: marwan22@gmail.com
-- Password: zstadmin

-- IMPORTANT: This script assumes you have already created the user in Supabase Auth Dashboard or via signup
-- This script only updates the profile role to 'admin'

-- If the user already exists in auth.users, update their profile to admin
-- You must first create the user via Supabase Auth Dashboard with:
--   Email: marwan22@gmail.com
--   Password: zstadmin
-- Then run this script to promote them to admin

-- Find the user by email and update their role to admin
update public.profiles
set
  role = 'admin',
  business_name = 'ZST Platform Administration',
  is_banned = false
where email = 'marwan22@gmail.com';

-- Verify the admin was created
select
  id,
  email,
  role,
  business_name,
  is_banned,
  created_at
from public.profiles
where email = 'marwan22@gmail.com';

-- If no rows are returned, the user doesn't exist yet
-- Create the user in Supabase Auth Dashboard first, then run this script again
