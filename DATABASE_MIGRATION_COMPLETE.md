# Database Migration Complete! ✅

The 5-tier hierarchy database schema has been successfully applied to your Supabase project.

## Applied Migrations

### 1. ✅ User Role Enum
- Added `normal_user` role to `user_role` enum
- Enum now includes: `admin`, `importer`, `wholesaler`, `retailer`, `normal_user`

### 2. ✅ Profiles Table Updates
**New Columns:**
- `balance` (DECIMAL) - For account credit system
- `due_amount` (DECIMAL) - For tracking amounts owed
- `is_banned` (BOOLEAN) - For user ban functionality
- Default role changed from `retailer` to `normal_user`

**Indexes:**
- `idx_profiles_is_banned` - For efficient banned user queries

### 3. ✅ Listings Table Updates
**New Columns:**
- `is_bulk_offer` (BOOLEAN) - To distinguish Importer "Offers" from regular products
- `min_order_quantity` (INTEGER) - For bulk order requirements

**Indexes:**
- `idx_listings_is_bulk_offer` - For efficient bulk offer queries

### 4. ✅ Orders B2C Table Updates
**New Columns:**
- `user_id` (UUID, nullable) - Links authenticated users to their orders
- `customer_email` (TEXT) - Stores email for authenticated orders
- `total_amount` (DECIMAL) - Order total
- `updated_at` (TIMESTAMPTZ) - Tracks order updates

**Indexes:**
- `idx_orders_b2c_user_id` - For efficient user order queries

**Triggers:**
- `trg_orders_b2c_updated` - Automatically updates `updated_at` on changes

### 5. ✅ Helper Functions Created

#### `public.get_my_role()` → user_role
Returns the current authenticated user's role (security definer to avoid RLS recursion).

#### `public.is_admin()` → boolean
Checks if the current user is an admin and not banned.

#### `public.validate_listing_target_role()` → trigger
Enforces strict hierarchy rules:
- Importers must set `target_role='wholesaler'`
- Wholesalers must set `target_role='retailer'`
- Retailers must set `target_role='customer'`
- Normal users cannot create listings

#### `public.decrement_stock(listing_id, quantity)` → void
Safely decrements stock quantity for a listing (for order fulfillment).

#### `public.increment_stock(listing_id, quantity)` → void
Safely increments stock quantity for a listing (for order cancellations).

#### `public.handle_new_user()` → trigger
Automatically creates a profile with `normal_user` role when a new user signs up.

### 6. ✅ Updated RLS Policies

#### Profiles Table:
- ✅ Users can only view their own profile if not banned
- ✅ Users can update their own profile but NOT their role or ban status
- ✅ Admins can view/edit all profiles

#### Listings Table:
- ✅ Public B2C listings (`target_role='customer'`) visible to everyone
- ✅ Retailers can ONLY see `target_role='retailer'` listings (from wholesalers)
- ✅ Wholesalers can ONLY see `target_role='wholesaler'` listings (from importers)
- ✅ Strict downstream visibility enforced by RLS

#### Products Table:
- ✅ Only business users (importer, wholesaler, retailer, admin) can create products
- ✅ Banned users cannot create products

#### Orders B2C Table:
- ✅ Authenticated normal users can view their own orders
- ✅ Retailers can view orders containing their listings
- ✅ Retailers can update order status for their orders
- ✅ Admins can view/manage all orders

#### Orders B2B Table:
- ✅ Existing policies maintained for business-to-business transactions

## Database Schema Verification

All changes verified successfully:

- ✅ `user_role` enum includes all 5 roles
- ✅ `profiles` table has all new columns with correct defaults
- ✅ `listings` table has bulk offer columns
- ✅ `orders_b2c` table has user tracking columns
- ✅ All 6 helper functions created and working
- ✅ All RLS policies updated
- ✅ All triggers active

## Next Steps

### 1. Create Admin Account
Follow instructions in `ADMIN_ACCOUNT_SETUP.md`:
1. Go to Supabase Dashboard → Authentication → Users
2. Add user with email `marwan22@gmail.com` and password `zstadmin`
3. Run SQL to promote to admin role

### 2. Frontend Implementation
Refer to `IMPLEMENTATION_GUIDE_5TIER.md` for:
- Importer Portal (`/importer/*`)
- Wholesaler Portal (`/wholesaler/*`)
- Retailer Portal (`/retailer/*`)
- Customer Portal updates (homepage, checkout, my-orders)

### 3. Test the Hierarchy
Create test accounts for each role:
- Admin: `marwan22@gmail.com`
- Importer: Create via business signup
- Wholesaler: Create via business signup
- Retailer: Create via business signup
- Normal User: Create via regular signup

### 4. Verify Visibility Rules
Test that:
- ✅ Importers can only sell to wholesalers
- ✅ Wholesalers can only sell to retailers
- ✅ Retailers can only sell to customers
- ✅ Each tier cannot see listings from other tiers
- ✅ Banned users cannot access the platform

## Migration Files Created

1. `supabase/schema_5tier.sql` - Complete schema (for reference)
2. Applied migrations (via Supabase MCP):
   - `add_normal_user_role`
   - `add_profiles_columns`
   - `add_listings_columns`
   - `add_orders_b2c_columns`
   - `create_helper_functions`
   - `update_rls_policies_profiles`
   - `update_rls_policies_listings`
   - `update_rls_policies_orders_b2c`

## Testing Queries

### Check User Roles
```sql
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;
```

### Check Listings by Target Role
```sql
SELECT target_role, is_bulk_offer, COUNT(*) as count
FROM public.listings
GROUP BY target_role, is_bulk_offer
ORDER BY target_role;
```

### Test RLS for Normal User
```sql
-- Simulate logged in normal user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id-here"}';

SELECT * FROM public.listings; -- Should only see target_role='customer'
```

## Support

If you encounter any issues:
1. Check RLS policies in Supabase Dashboard → Database → Policies
2. Verify functions in Supabase Dashboard → Database → Functions
3. Check triggers in Supabase Dashboard → Database → Triggers
4. Review error logs in Supabase Dashboard → Logs

All migrations have been successfully applied to project: **zst** (ID: ukkgmqvappkeqgdrbsar)
