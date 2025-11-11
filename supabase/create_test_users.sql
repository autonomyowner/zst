-- Test Users Creation Script
-- Run these queries AFTER creating the users in Supabase Auth Dashboard

-- IMPORTANT: First create these users in Supabase Dashboard → Authentication → Users
-- Then run the corresponding UPDATE query below to set their roles

-- ==========================================
-- ADMIN USER (Already in system)
-- ==========================================
-- Email: marwan22@gmail.com
-- Password: zstadmin
UPDATE public.profiles
SET
  role = 'admin',
  business_name = 'ZST Platform Administration',
  is_banned = false
WHERE email = 'marwan22@gmail.com';

-- ==========================================
-- IMPORTER TEST USER
-- ==========================================
-- Create in Dashboard:
-- Email: importer@test.com
-- Password: test123
-- Then run:
UPDATE public.profiles
SET
  role = 'importer',
  business_name = 'Global Imports Co.',
  is_banned = false
WHERE email = 'importer@test.com';

-- ==========================================
-- WHOLESALER TEST USER
-- ==========================================
-- Create in Dashboard:
-- Email: wholesaler@test.com
-- Password: test123
-- Then run:
UPDATE public.profiles
SET
  role = 'wholesaler',
  business_name = 'Wholesale Distributors Ltd.',
  is_banned = false
WHERE email = 'wholesaler@test.com';

-- ==========================================
-- RETAILER TEST USER
-- ==========================================
-- Create in Dashboard:
-- Email: retailer@test.com
-- Password: test123
-- Then run:
UPDATE public.profiles
SET
  role = 'retailer',
  business_name = 'Retail Shop Co.',
  is_banned = false
WHERE email = 'retailer@test.com';

-- ==========================================
-- NORMAL USER TEST ACCOUNT
-- ==========================================
-- Create in Dashboard:
-- Email: customer@test.com
-- Password: test123
-- Default role is already 'normal_user', so no UPDATE needed!
-- But you can set a business_name if you want:
UPDATE public.profiles
SET
  business_name = 'John Doe'
WHERE email = 'customer@test.com';

-- ==========================================
-- VERIFY ALL TEST USERS
-- ==========================================
SELECT
  email,
  role,
  business_name,
  is_banned,
  balance,
  due_amount,
  created_at
FROM public.profiles
WHERE email IN (
  'marwan22@gmail.com',
  'importer@test.com',
  'wholesaler@test.com',
  'retailer@test.com',
  'customer@test.com'
)
ORDER BY
  CASE role
    WHEN 'admin' THEN 0
    WHEN 'importer' THEN 1
    WHEN 'wholesaler' THEN 2
    WHEN 'retailer' THEN 3
    WHEN 'normal_user' THEN 4
  END;
