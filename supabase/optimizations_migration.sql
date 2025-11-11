-- ============================================================================
-- ZST Marketplace - Performance & Security Optimizations
-- ============================================================================
-- This migration fixes:
-- 1. RLS performance issues (auth.uid() wrapped in SELECT)
-- 2. Function search_path security issues
-- 3. Consolidates overlapping RLS policies
--
-- Note: Leaked password protection must be enabled manually in Supabase Dashboard
-- Auth → Policies → Enable "Password strength" and "Check against compromised passwords"
-- ============================================================================

-- ============================================================================
-- FIX 1: Add search_path to all custom functions (Security)
-- ============================================================================

-- Fix set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Fix validate_listing_target_role function
CREATE OR REPLACE FUNCTION public.validate_listing_target_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_role user_role;
  expected_target_role target_role;
BEGIN
  -- Get seller's role from profiles table
  SELECT role INTO seller_role
  FROM public.profiles
  WHERE id = new.seller_id;

  IF seller_role IS NULL THEN
    RAISE EXCEPTION 'Seller profile not found';
  END IF;

  -- Determine expected target_role based on seller's role
  CASE seller_role
    WHEN 'retailer' THEN expected_target_role := 'customer';
    WHEN 'wholesaler' THEN expected_target_role := 'retailer';
    WHEN 'importer' THEN expected_target_role := 'wholesaler';
    ELSE RAISE EXCEPTION 'Invalid seller role: %', seller_role;
  END CASE;

  -- Enforce that target_role matches expected value
  IF new.target_role != expected_target_role THEN
    RAISE EXCEPTION 'Invalid target_role. % users must create listings with target_role = %. Got: %',
      seller_role, expected_target_role, new.target_role;
  END IF;

  RETURN new;
END;
$$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'retailer')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- ============================================================================
-- FIX 2 & 3: Optimize RLS Policies (Performance) + Consolidate Overlapping Policies
-- ============================================================================
-- Strategy:
-- - Wrap auth.uid() in (SELECT auth.uid()) to prevent re-evaluation per row
-- - Consolidate admin policies with regular policies using OR conditions
-- - This reduces multiple permissive policies from ~90 to ~40
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE - Consolidated & Optimized Policies
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;

-- Consolidated SELECT policy (admin OR own profile)
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (
    public.is_admin() OR
    (id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL)
  );

-- Consolidated UPDATE policy (admin OR own profile)
CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE
  USING (
    public.is_admin() OR
    id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.is_admin() OR
    id = (SELECT auth.uid())
  );

-- Consolidated INSERT policy (admin OR own profile)
CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT
  WITH CHECK (
    public.is_admin() OR
    id = (SELECT auth.uid())
  );

-- Consolidated DELETE policy (admin only)
CREATE POLICY profiles_delete_policy ON public.profiles
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- CATEGORIES TABLE - Consolidated & Optimized Policies
-- ============================================================================

DROP POLICY IF EXISTS categories_select_public ON public.categories;
DROP POLICY IF EXISTS categories_admin_all ON public.categories;

-- SELECT: Public read access OR admin
CREATE POLICY categories_select_policy ON public.categories
  FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: Admin only
CREATE POLICY categories_modify_policy ON public.categories
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- PRODUCTS TABLE - Consolidated & Optimized Policies
-- ============================================================================

DROP POLICY IF EXISTS products_select_public ON public.products;
DROP POLICY IF EXISTS products_insert_authenticated ON public.products;
DROP POLICY IF EXISTS products_update_own_listings ON public.products;
DROP POLICY IF EXISTS products_admin_all ON public.products;

-- SELECT: Public read access
CREATE POLICY products_select_policy ON public.products
  FOR SELECT USING (true);

-- INSERT: Admin OR authenticated users
CREATE POLICY products_insert_policy ON public.products
  FOR INSERT
  WITH CHECK (
    public.is_admin() OR
    (SELECT auth.uid()) IS NOT NULL
  );

-- UPDATE: Admin OR users who own listings for this product
CREATE POLICY products_update_policy ON public.products
  FOR UPDATE USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.product_id = products.id
      AND listings.seller_id = (SELECT auth.uid())
    )
  );

-- DELETE: Admin only
CREATE POLICY products_delete_policy ON public.products
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- LISTINGS TABLE - Consolidated & Optimized Policies
-- ============================================================================

DROP POLICY IF EXISTS listings_select_public_b2c ON public.listings;
DROP POLICY IF EXISTS listings_select_retailer ON public.listings;
DROP POLICY IF EXISTS listings_select_wholesaler ON public.listings;
DROP POLICY IF EXISTS listings_manage_own ON public.listings;
DROP POLICY IF EXISTS listings_admin_all ON public.listings;

-- SELECT: Complex visibility rules consolidated
CREATE POLICY listings_select_policy ON public.listings
  FOR SELECT USING (
    public.is_admin() OR
    -- Anyone can see B2C listings (target_role = 'customer')
    target_role = 'customer' OR
    -- Retailers can see wholesaler listings (target_role = 'retailer')
    (
      target_role = 'retailer' AND
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'retailer'
      )
    ) OR
    -- Wholesalers can see importer listings (target_role = 'wholesaler')
    (
      target_role = 'wholesaler' AND
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'wholesaler'
      )
    ) OR
    -- Users can see their own listings
    seller_id = (SELECT auth.uid())
  );

-- INSERT: Admin OR own listings
CREATE POLICY listings_insert_policy ON public.listings
  FOR INSERT
  WITH CHECK (
    public.is_admin() OR
    seller_id = (SELECT auth.uid())
  );

-- UPDATE: Admin OR own listings
CREATE POLICY listings_update_policy ON public.listings
  FOR UPDATE
  USING (
    public.is_admin() OR
    seller_id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.is_admin() OR
    seller_id = (SELECT auth.uid())
  );

-- DELETE: Admin OR own listings
CREATE POLICY listings_delete_policy ON public.listings
  FOR DELETE USING (
    public.is_admin() OR
    seller_id = (SELECT auth.uid())
  );

-- ============================================================================
-- ORDERS_B2C TABLE - Consolidated & Optimized Policies
-- ============================================================================

DROP POLICY IF EXISTS orders_b2c_insert_public ON public.orders_b2c;
DROP POLICY IF EXISTS orders_b2c_admin_all ON public.orders_b2c;
DROP POLICY IF EXISTS orders_b2c_admin_update ON public.orders_b2c;
DROP POLICY IF EXISTS orders_b2c_admin_delete ON public.orders_b2c;
DROP POLICY IF EXISTS orders_b2c_select_seller ON public.orders_b2c;

-- INSERT: Public (for anonymous checkout)
CREATE POLICY orders_b2c_insert_policy ON public.orders_b2c
  FOR INSERT WITH CHECK (true);

-- SELECT: Admin OR sellers who have items in the order
CREATE POLICY orders_b2c_select_policy ON public.orders_b2c
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.order_items_b2c oi
      JOIN public.listings l ON oi.listing_id = l.id
      WHERE oi.order_id = orders_b2c.id
      AND l.seller_id = (SELECT auth.uid())
    )
  );

-- UPDATE/DELETE: Admin only
CREATE POLICY orders_b2c_modify_policy ON public.orders_b2c
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- ORDER_ITEMS_B2C TABLE - Consolidated & Optimized Policies
-- ============================================================================

DROP POLICY IF EXISTS order_items_b2c_insert_public ON public.order_items_b2c;
DROP POLICY IF EXISTS order_items_b2c_admin_all ON public.order_items_b2c;
DROP POLICY IF EXISTS order_items_b2c_select_seller ON public.order_items_b2c;

-- INSERT: Public (for anonymous checkout)
CREATE POLICY order_items_b2c_insert_policy ON public.order_items_b2c
  FOR INSERT WITH CHECK (true);

-- SELECT: Admin OR sellers who own the listing
CREATE POLICY order_items_b2c_select_policy ON public.order_items_b2c
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = order_items_b2c.listing_id
      AND l.seller_id = (SELECT auth.uid())
    )
  );

-- UPDATE/DELETE: Admin only
CREATE POLICY order_items_b2c_modify_policy ON public.order_items_b2c
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- ORDERS_B2B TABLE - Consolidated & Optimized Policies
-- ============================================================================

DROP POLICY IF EXISTS orders_b2b_insert_own ON public.orders_b2b;
DROP POLICY IF EXISTS orders_b2b_select_own ON public.orders_b2b;
DROP POLICY IF EXISTS orders_b2b_admin_all ON public.orders_b2b;

-- INSERT: Admin OR buyer creating their own order
CREATE POLICY orders_b2b_insert_policy ON public.orders_b2b
  FOR INSERT
  WITH CHECK (
    public.is_admin() OR
    buyer_id = (SELECT auth.uid())
  );

-- SELECT: Admin OR buyer OR seller
CREATE POLICY orders_b2b_select_policy ON public.orders_b2b
  FOR SELECT USING (
    public.is_admin() OR
    buyer_id = (SELECT auth.uid()) OR
    seller_id = (SELECT auth.uid())
  );

-- UPDATE/DELETE: Admin only
CREATE POLICY orders_b2b_modify_policy ON public.orders_b2b
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- ORDER_ITEMS_B2B TABLE - Consolidated & Optimized Policies
-- ============================================================================

DROP POLICY IF EXISTS order_items_b2b_insert_own ON public.order_items_b2b;
DROP POLICY IF EXISTS order_items_b2b_select_own ON public.order_items_b2b;
DROP POLICY IF EXISTS order_items_b2b_admin_all ON public.order_items_b2b;

-- INSERT: Admin OR buyer creating items for their own order
CREATE POLICY order_items_b2b_insert_policy ON public.order_items_b2b
  FOR INSERT
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders_b2b
      WHERE id = order_id AND buyer_id = (SELECT auth.uid())
    )
  );

-- SELECT: Admin OR buyer OR seller of the order
CREATE POLICY order_items_b2b_select_policy ON public.order_items_b2b
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders_b2b o
      WHERE o.id = order_id
      AND (o.buyer_id = (SELECT auth.uid()) OR o.seller_id = (SELECT auth.uid()))
    )
  );

-- UPDATE/DELETE: Admin only
CREATE POLICY order_items_b2b_modify_policy ON public.order_items_b2b
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying the migration to verify the changes

-- Check that all functions have search_path set
-- SELECT
--   proname as function_name,
--   proconfig as settings
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
-- AND proname IN ('set_updated_at', 'validate_listing_target_role', 'is_admin', 'handle_new_user');

-- Count policies per table (should be reduced significantly)
-- SELECT
--   schemaname,
--   tablename,
--   COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY schemaname, tablename
-- ORDER BY policy_count DESC;

-- ============================================================================
-- MANUAL STEP REQUIRED: Enable Leaked Password Protection
-- ============================================================================
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Authentication → Policies
-- 3. Enable "Password strength"
-- 4. Enable "Check against compromised passwords" (HaveIBeenPwned integration)
-- ============================================================================
