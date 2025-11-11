-- ZST Marketplace Database Schema - 5-Tier Hierarchy
-- This schema implements a strict 5-tier user hierarchy:
-- Admin (Tier 0) -> Importer (Tier 1) -> Wholesaler (Tier 2) -> Retailer (Tier 3) -> Normal User (Tier 4)

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Create custom types (enums) - only if they don't exist
-- UPDATED: Added 'normal_user' role for tier 4
do $$ begin
  drop type if exists user_role cascade;
  create type user_role as enum ('admin', 'importer', 'wholesaler', 'retailer', 'normal_user');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type target_role as enum ('customer', 'retailer', 'wholesaler');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status_b2c as enum ('pending', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status_b2b as enum ('pending', 'paid', 'shipped', 'completed');
exception when duplicate_object then null;
end $$;

-- PROFILES TABLE
-- UPDATED: Default role changed to 'normal_user', added is_banned field
drop table if exists public.profiles cascade;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text,
  role user_role not null default 'normal_user',
  balance decimal(10, 2) default 0,
  due_amount decimal(10, 2) default 0,
  is_banned boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CATEGORIES TABLE
create table if not exists public.categories (
  id bigserial primary key,
  name text not null unique,
  icon_svg text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRODUCTS TABLE (Master product definition)
create table if not exists public.products (
  id bigserial primary key,
  name text not null,
  description text,
  image_url text,
  category_id bigint references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LISTINGS TABLE (Core table for products/offers being sold)
-- UPDATED: Added is_bulk_offer to distinguish Importer "Offers" from regular "Products"
create table if not exists public.listings (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  price decimal(10, 2) not null,
  stock_quantity int not null default 0,
  target_role target_role not null,
  is_bulk_offer boolean default false, -- true for Importer offers
  min_order_quantity int default 1, -- for bulk offers
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDERS_B2C TABLE (For COD customer orders)
-- UPDATED: Added user_id (nullable for guest checkout) and customer_email
create table if not exists public.orders_b2c (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null, -- NULL for guest checkout
  customer_name text not null,
  customer_email text, -- for authenticated users
  customer_address text not null,
  customer_phone text not null,
  total_amount decimal(10, 2) not null default 0,
  status order_status_b2c not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDER_ITEMS_B2C TABLE
create table if not exists public.order_items_b2c (
  id bigserial primary key,
  order_id bigint not null references public.orders_b2c(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete restrict,
  quantity int not null,
  price_at_purchase decimal(10, 2) not null
);

-- ORDERS_B2B TABLE (For business-to-business orders)
create table if not exists public.orders_b2b (
  id bigserial primary key,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  total_price decimal(10, 2) not null,
  status order_status_b2b not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDER_ITEMS_B2B TABLE
create table if not exists public.order_items_b2b (
  id bigserial primary key,
  order_id bigint not null references public.orders_b2b(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete restrict,
  quantity int not null,
  price_at_purchase decimal(10, 2) not null
);

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Create updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

-- Function to check if current user is admin (security definer to avoid RLS recursion)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_banned = false
  );
end;
$$ language plpgsql security definer;

-- Function to get current user's role
create or replace function public.get_my_role()
returns user_role as $$
declare
  my_role user_role;
begin
  select role into my_role
  from public.profiles
  where id = auth.uid() and is_banned = false;
  return my_role;
end;
$$ language plpgsql security definer stable;

-- Function to validate target_role matches seller's role (strict hierarchy enforcement)
create or replace function public.validate_listing_target_role()
returns trigger language plpgsql as $$
declare
  seller_role user_role;
  expected_target_role target_role;
begin
  -- Get seller's role from profiles table
  select role into seller_role
  from public.profiles
  where id = new.seller_id;

  if seller_role is null then
    raise exception 'Seller profile not found';
  end if;

  -- Determine expected target_role based on seller's role (strict downstream flow)
  case seller_role
    when 'retailer' then expected_target_role := 'customer';
    when 'wholesaler' then expected_target_role := 'retailer';
    when 'importer' then expected_target_role := 'wholesaler';
    when 'admin' then expected_target_role := 'customer'; -- admin can create test listings
    when 'normal_user' then
      raise exception 'Normal users cannot create listings';
    else raise exception 'Invalid seller role: %', seller_role;
  end case;

  -- Enforce that target_role matches expected value
  if new.target_role != expected_target_role then
    raise exception 'Invalid target_role. % users must create listings with target_role = %. Got: %',
      seller_role, expected_target_role, new.target_role;
  end if;

  return new;
end;$$;

-- Function to automatically create profile on user signup
-- UPDATED: Default role is 'normal_user'
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'normal_user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Apply updated_at triggers
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_listings_updated on public.listings;
create trigger trg_listings_updated before update on public.listings
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_b2c_updated on public.orders_b2c;
create trigger trg_orders_b2c_updated before update on public.orders_b2c
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_b2b_updated on public.orders_b2b;
create trigger trg_orders_b2b_updated before update on public.orders_b2b
for each row execute function public.set_updated_at();

-- Trigger to enforce target_role validation on listings insert/update
drop trigger if exists trg_listings_validate_target_role on public.listings;
create trigger trg_listings_validate_target_role
  before insert or update on public.listings
  for each row execute function public.validate_listing_target_role();

-- Trigger to create profile when user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.listings enable row level security;
alter table public.orders_b2c enable row level security;
alter table public.order_items_b2c enable row level security;
alter table public.orders_b2b enable row level security;
alter table public.order_items_b2b enable row level security;

-- ==============================================
-- RLS POLICIES FOR PROFILES
-- ==============================================

-- Users can view their own profile (if not banned)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (
    auth.uid() is not null
    and id = auth.uid()
    and is_banned = false
  );

-- Users can update their own profile (business_name, etc., but not role or is_banned)
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update
  using (id = auth.uid() and is_banned = false)
  with check (
    id = auth.uid()
    and is_banned = false
    -- Prevent users from changing their own role or ban status
    and role = (select role from public.profiles where id = auth.uid())
    and is_banned = (select is_banned from public.profiles where id = auth.uid())
  );

-- Admins can perform all actions on profiles (view all, edit roles, ban users)
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin());

-- Allow users to insert their own profile (during signup)
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

-- ==============================================
-- RLS POLICIES FOR CATEGORIES
-- ==============================================

-- Anyone can read categories
drop policy if exists categories_select_public on public.categories;
create policy categories_select_public on public.categories
  for select using (true);

-- Only admins can insert/update/delete categories
drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all using (public.is_admin());

-- ==============================================
-- RLS POLICIES FOR PRODUCTS
-- ==============================================

-- Anyone can read products
drop policy if exists products_select_public on public.products;
create policy products_select_public on public.products
  for select using (true);

-- Authenticated business users (importer, wholesaler, retailer) can insert products
drop policy if exists products_insert_authenticated on public.products;
create policy products_insert_authenticated on public.products
  for insert with check (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('importer', 'wholesaler', 'retailer', 'admin')
      and is_banned = false
    )
  );

-- Users can update products that are referenced by their own listings
drop policy if exists products_update_own_listings on public.products;
create policy products_update_own_listings on public.products
  for update using (
    exists (
      select 1 from public.listings
      where listings.product_id = products.id
      and listings.seller_id = auth.uid()
    )
  );

-- Admins can perform all actions on products
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all using (public.is_admin());

-- ==============================================
-- RLS POLICIES FOR LISTINGS (STRICT HIERARCHY)
-- ==============================================

-- TIER 4 -> TIER 3: Normal users and guests can see listings from retailers (target_role='customer')
drop policy if exists listings_select_public_b2c on public.listings;
create policy listings_select_public_b2c on public.listings
  for select using (target_role = 'customer');

-- TIER 3 -> TIER 2: Retailers can see listings from wholesalers (target_role='retailer')
drop policy if exists listings_select_retailer on public.listings;
create policy listings_select_retailer on public.listings
  for select using (
    target_role = 'retailer'
    and public.get_my_role() = 'retailer'
  );

-- TIER 2 -> TIER 1: Wholesalers can see listings from importers (target_role='wholesaler')
drop policy if exists listings_select_wholesaler on public.listings;
create policy listings_select_wholesaler on public.listings
  for select using (
    target_role = 'wholesaler'
    and public.get_my_role() = 'wholesaler'
  );

-- Users can manage their own listings (insert/update/delete)
-- Normal users cannot create listings (enforced by validate_listing_target_role trigger)
drop policy if exists listings_manage_own on public.listings;
create policy listings_manage_own on public.listings
  for all using (
    seller_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('importer', 'wholesaler', 'retailer', 'admin')
      and is_banned = false
    )
  );

-- Admins can perform all actions on listings
drop policy if exists listings_admin_all on public.listings;
create policy listings_admin_all on public.listings
  for all using (public.is_admin());

-- ==============================================
-- RLS POLICIES FOR ORDERS_B2C
-- ==============================================

-- Anyone (including guests) can insert B2C orders
drop policy if exists orders_b2c_insert_public on public.orders_b2c;
create policy orders_b2c_insert_public on public.orders_b2c
  for insert with check (true);

-- Authenticated normal users can view their own orders
drop policy if exists orders_b2c_select_own on public.orders_b2c;
create policy orders_b2c_select_own on public.orders_b2c
  for select using (
    user_id is not null
    and user_id = auth.uid()
  );

-- Retailers can view orders that contain their listings
drop policy if exists orders_b2c_select_seller on public.orders_b2c;
create policy orders_b2c_select_seller on public.orders_b2c
  for select using (
    exists (
      select 1 from public.order_items_b2c oi
      join public.listings l on oi.listing_id = l.id
      where oi.order_id = orders_b2c.id
      and l.seller_id = auth.uid()
    )
  );

-- Retailers can update order status for orders containing their listings
drop policy if exists orders_b2c_update_seller on public.orders_b2c;
create policy orders_b2c_update_seller on public.orders_b2c
  for update using (
    exists (
      select 1 from public.order_items_b2c oi
      join public.listings l on oi.listing_id = l.id
      where oi.order_id = orders_b2c.id
      and l.seller_id = auth.uid()
    )
  );

-- Admins can perform all actions on B2C orders
drop policy if exists orders_b2c_admin_all on public.orders_b2c;
create policy orders_b2c_admin_all on public.orders_b2c
  for all using (public.is_admin());

-- ==============================================
-- RLS POLICIES FOR ORDER_ITEMS_B2C
-- ==============================================

-- Anyone can insert order items (for checkout)
drop policy if exists order_items_b2c_insert_public on public.order_items_b2c;
create policy order_items_b2c_insert_public on public.order_items_b2c
  for insert with check (true);

-- Authenticated normal users can view their own order items
drop policy if exists order_items_b2c_select_own on public.order_items_b2c;
create policy order_items_b2c_select_own on public.order_items_b2c
  for select using (
    exists (
      select 1 from public.orders_b2c o
      where o.id = order_items_b2c.order_id
      and o.user_id = auth.uid()
    )
  );

-- Retailers can view order items for listings they own
drop policy if exists order_items_b2c_select_seller on public.order_items_b2c;
create policy order_items_b2c_select_seller on public.order_items_b2c
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = order_items_b2c.listing_id
      and l.seller_id = auth.uid()
    )
  );

-- Admins can perform all actions
drop policy if exists order_items_b2c_admin_all on public.order_items_b2c;
create policy order_items_b2c_admin_all on public.order_items_b2c
  for all using (public.is_admin());

-- ==============================================
-- RLS POLICIES FOR ORDERS_B2B
-- ==============================================

-- Authenticated business users can insert orders where buyer_id = auth.uid()
drop policy if exists orders_b2b_insert_own on public.orders_b2b;
create policy orders_b2b_insert_own on public.orders_b2b
  for insert with check (buyer_id = auth.uid());

-- Users can read orders where they are buyer or seller
drop policy if exists orders_b2b_select_own on public.orders_b2b;
create policy orders_b2b_select_own on public.orders_b2b
  for select using (
    buyer_id = auth.uid() or seller_id = auth.uid()
  );

-- Sellers can update order status
drop policy if exists orders_b2b_update_seller on public.orders_b2b;
create policy orders_b2b_update_seller on public.orders_b2b
  for update using (seller_id = auth.uid());

-- Admins can perform all actions
drop policy if exists orders_b2b_admin_all on public.orders_b2b;
create policy orders_b2b_admin_all on public.orders_b2b
  for all using (public.is_admin());

-- ==============================================
-- RLS POLICIES FOR ORDER_ITEMS_B2B
-- ==============================================

-- Users can insert order items for their own orders
drop policy if exists order_items_b2b_insert_own on public.order_items_b2b;
create policy order_items_b2b_insert_own on public.order_items_b2b
  for insert with check (
    exists (
      select 1 from public.orders_b2b
      where id = order_id and buyer_id = auth.uid()
    )
  );

-- Users can read order items for their own orders (buyer or seller)
drop policy if exists order_items_b2b_select_own on public.order_items_b2b;
create policy order_items_b2b_select_own on public.order_items_b2b
  for select using (
    exists (
      select 1 from public.orders_b2b o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

-- Admins can perform all actions
drop policy if exists order_items_b2b_admin_all on public.order_items_b2b;
create policy order_items_b2b_admin_all on public.order_items_b2b
  for all using (public.is_admin());

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_banned on public.profiles(is_banned);
create index if not exists idx_listings_product_id on public.listings(product_id);
create index if not exists idx_listings_seller_id on public.listings(seller_id);
create index if not exists idx_listings_target_role on public.listings(target_role);
create index if not exists idx_listings_is_bulk_offer on public.listings(is_bulk_offer);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_order_items_b2c_order_id on public.order_items_b2c(order_id);
create index if not exists idx_order_items_b2c_listing_id on public.order_items_b2c(listing_id);
create index if not exists idx_order_items_b2b_order_id on public.order_items_b2b(order_id);
create index if not exists idx_order_items_b2b_listing_id on public.order_items_b2b(listing_id);
create index if not exists idx_orders_b2b_buyer_id on public.orders_b2b(buyer_id);
create index if not exists idx_orders_b2b_seller_id on public.orders_b2b(seller_id);
create index if not exists idx_orders_b2c_user_id on public.orders_b2c(user_id);

-- ==============================================
-- HELPFUL ADMIN VIEWS (Optional)
-- ==============================================

-- View to see the hierarchy of listings
create or replace view public.listings_hierarchy as
select
  l.id,
  l.price,
  l.stock_quantity,
  l.target_role,
  l.is_bulk_offer,
  p.name as product_name,
  seller_profile.role as seller_role,
  seller_profile.business_name as seller_business_name
from public.listings l
join public.products p on l.product_id = p.id
join public.profiles seller_profile on l.seller_id = seller_profile.id;
