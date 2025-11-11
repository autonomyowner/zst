# Admin Account Setup Instructions

## Step 1: Create Admin User in Supabase Auth

Since we cannot create `auth.users` records directly via SQL, you need to create the admin account manually in the Supabase Dashboard:

### Instructions:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ukkgmqvappkeqgdrbsar

2. Navigate to **Authentication** → **Users** (in the left sidebar)

3. Click the **"Add user"** button (top right)

4. Fill in the form:
   - **Email**: `marwan22@gmail.com`
   - **Password**: `zstadmin`
   - **Confirm Password**: `zstadmin`
   - **Auto Confirm User**: ✅ Check this box (important!)

5. Click **"Create user"**

6. Wait for the user to be created (you should see it in the users list)

## Step 2: Promote User to Admin Role

Once the user is created in the Auth dashboard, run the following SQL to promote them to admin:

```sql
-- Update the profile to admin role
UPDATE public.profiles
SET
  role = 'admin',
  business_name = 'ZST Platform Administration',
  is_banned = false
WHERE email = 'marwan22@gmail.com';

-- Verify the admin was created
SELECT id, email, role, business_name, is_banned, created_at
FROM public.profiles
WHERE email = 'marwan22@gmail.com';
```

### Alternative: Run this via Supabase MCP

If you want me to run the SQL for you after you've created the user in the dashboard, just let me know!

## Step 3: Test Admin Login

1. Go to your application's admin login page: `/admin/login`
2. Login with:
   - Email: `marwan22@gmail.com`
   - Password: `zstadmin`
3. You should be redirected to `/admin/dashboard`
4. Test accessing `/admin/users` to manage users

## Database Schema Changes Applied ✅

The following migrations have been successfully applied to your Supabase database:

1. ✅ Added `normal_user` to `user_role` enum
2. ✅ Added `balance`, `due_amount`, `is_banned` columns to `profiles` table
3. ✅ Changed default role to `normal_user`
4. ✅ Added `is_bulk_offer`, `min_order_quantity` to `listings` table
5. ✅ Added `user_id`, `customer_email`, `total_amount`, `updated_at` to `orders_b2c` table
6. ✅ Created helper functions: `get_my_role()`, `is_admin()`, `validate_listing_target_role()`
7. ✅ Created stock management functions: `decrement_stock()`, `increment_stock()`
8. ✅ Updated RLS policies for strict 5-tier hierarchy enforcement
9. ✅ Updated triggers for automatic profile creation with `normal_user` role

## Next Steps

After creating the admin account:

1. Test admin login and user management
2. Create test accounts for each role (Importer, Wholesaler, Retailer, Normal User)
3. Begin implementing the portal pages (Importer, Wholesaler, Retailer)
4. Update customer-facing pages (homepage, checkout, my-orders)

Refer to `IMPLEMENTATION_GUIDE_5TIER.md` for detailed implementation steps.
