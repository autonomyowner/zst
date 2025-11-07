-- ZST Marketplace Database Schema
-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Create custom types (enums) - only if they don't exist
do $$ begin
  create type user_role as enum ('importer', 'wholesaler', 'retailer', 'admin');
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
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text,
  role user_role not null default 'retailer',
  balance decimal(10, 2) default 0,
  due_amount decimal(10, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add balance and due_amount columns if they don't exist (for existing tables)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'balance') then
    alter table public.profiles add column balance decimal(10, 2) default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'due_amount') then
    alter table public.profiles add column due_amount decimal(10, 2) default 0;
  end if;
end $$;

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

-- LISTINGS TABLE (Core table for products being sold)
create table if not exists public.listings (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  price decimal(10, 2) not null,
  stock_quantity int not null default 0,
  target_role target_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDERS_B2C TABLE (For COD customer orders)
create table if not exists public.orders_b2c (
  id bigserial primary key,
  customer_name text not null,
  customer_address text not null,
  customer_phone text not null,
  status order_status_b2c not null default 'pending',
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

-- ORDER_ITEMS_B2B TABLE
create table if not exists public.order_items_b2b (
  id bigserial primary key,
  order_id bigint not null references public.orders_b2b(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete restrict,
  quantity int not null,
  price_at_purchase decimal(10, 2) not null
);

-- Create updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

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

-- Function to validate target_role matches seller's role (hierarchy enforcement)
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

  -- Determine expected target_role based on seller's role
  case seller_role
    when 'retailer' then expected_target_role := 'customer';
    when 'wholesaler' then expected_target_role := 'retailer';
    when 'importer' then expected_target_role := 'wholesaler';
    else raise exception 'Invalid seller role: %', seller_role;
  end case;

  -- Enforce that target_role matches expected value
  if new.target_role != expected_target_role then
    raise exception 'Invalid target_role. % users must create listings with target_role = %. Got: %', 
      seller_role, expected_target_role, new.target_role;
  end if;

  return new;
end;$$;

-- Trigger to enforce target_role validation on listings insert/update
drop trigger if exists trg_listings_validate_target_role on public.listings;
create trigger trg_listings_validate_target_role
  before insert or update on public.listings
  for each row execute function public.validate_listing_target_role();

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.listings enable row level security;
alter table public.orders_b2c enable row level security;
alter table public.order_items_b2c enable row level security;
alter table public.orders_b2b enable row level security;
alter table public.order_items_b2b enable row level security;

-- Function to check if current user is admin (bypasses RLS to avoid infinite recursion)
-- This MUST be defined BEFORE the RLS policies that use it
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- RLS POLICIES FOR PROFILES
-- Users can view and update their own profile
-- Note: auth.uid() returns null if user is not authenticated, so we need to handle that
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() is not null and id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update 
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can perform all actions on profiles
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin());

-- Allow users to insert their own profile (usually via trigger, but explicit policy)
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

-- RLS POLICIES FOR CATEGORIES
-- Anyone can read categories
drop policy if exists categories_select_public on public.categories;
create policy categories_select_public on public.categories
  for select using (true);

-- Only admins can insert/update/delete categories
drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all using (public.is_admin());

-- RLS POLICIES FOR PRODUCTS
-- Anyone can read products
drop policy if exists products_select_public on public.products;
create policy products_select_public on public.products
  for select using (true);

-- Authenticated users can insert products (for creating listings)
drop policy if exists products_insert_authenticated on public.products;
create policy products_insert_authenticated on public.products
  for insert with check (auth.uid() is not null);

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

-- Only admins can delete products
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all using (public.is_admin());

-- RLS POLICIES FOR LISTINGS
-- Public B2C: Anyone (including all business users) can read listings where target_role = 'customer'
-- This allows importers, wholesalers, and retailers to see shopping/customer products
drop policy if exists listings_select_public_b2c on public.listings;
create policy listings_select_public_b2c on public.listings
  for select using (target_role = 'customer');

-- B2B Hierarchy: Authenticated users can read listings based on their role
-- Retailers can see listings where target_role = 'retailer' (from wholesalers)
drop policy if exists listings_select_retailer on public.listings;
create policy listings_select_retailer on public.listings
  for select using (
    target_role = 'retailer' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'retailer'
    )
  );

-- Wholesalers can see listings where target_role = 'wholesaler' (from importers)
-- Only wholesalers can see these, not importers (importers can only see customer listings for shopping)
drop policy if exists listings_select_wholesaler on public.listings;
create policy listings_select_wholesaler on public.listings
  for select using (
    target_role = 'wholesaler' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'wholesaler'
    )
  );

-- Users can manage their own listings (insert/update/delete)
drop policy if exists listings_manage_own on public.listings;
create policy listings_manage_own on public.listings
  for all using (seller_id = auth.uid());

-- Admins can perform all actions on listings
drop policy if exists listings_admin_all on public.listings;
create policy listings_admin_all on public.listings
  for all using (public.is_admin());

-- RLS POLICIES FOR ORDERS_B2C
-- Anyone can insert orders (for anonymous COD checkout)
drop policy if exists orders_b2c_insert_public on public.orders_b2c;
create policy orders_b2c_insert_public on public.orders_b2c
  for insert with check (true);

-- Admins can select/update/delete B2C orders
drop policy if exists orders_b2c_admin_all on public.orders_b2c;
create policy orders_b2c_admin_all on public.orders_b2c
  for select using (public.is_admin());

drop policy if exists orders_b2c_admin_update on public.orders_b2c;
create policy orders_b2c_admin_update on public.orders_b2c
  for update using (public.is_admin());

drop policy if exists orders_b2c_admin_delete on public.orders_b2c;
create policy orders_b2c_admin_delete on public.orders_b2c
  for delete using (public.is_admin());

-- Sellers can select orders that contain their listings
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

-- RLS POLICIES FOR ORDER_ITEMS_B2C
-- Anyone can insert order items
drop policy if exists order_items_b2c_insert_public on public.order_items_b2c;
create policy order_items_b2c_insert_public on public.order_items_b2c
  for insert with check (true);

-- Admins can select/update/delete
drop policy if exists order_items_b2c_admin_all on public.order_items_b2c;
create policy order_items_b2c_admin_all on public.order_items_b2c
  for all using (public.is_admin());

-- Sellers can select order items for listings they own
drop policy if exists order_items_b2c_select_seller on public.order_items_b2c;
create policy order_items_b2c_select_seller on public.order_items_b2c
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = order_items_b2c.listing_id
      and l.seller_id = auth.uid()
    )
  );

-- RLS POLICIES FOR ORDERS_B2B
-- Authenticated users can insert orders where buyer_id = auth.uid()
drop policy if exists orders_b2b_insert_own on public.orders_b2b;
create policy orders_b2b_insert_own on public.orders_b2b
  for insert with check (buyer_id = auth.uid());

-- Users can read orders where they are buyer or seller
drop policy if exists orders_b2b_select_own on public.orders_b2b;
create policy orders_b2b_select_own on public.orders_b2b
  for select using (
    buyer_id = auth.uid() or seller_id = auth.uid()
  );

-- Admins can perform all actions
drop policy if exists orders_b2b_admin_all on public.orders_b2b;
create policy orders_b2b_admin_all on public.orders_b2b
  for all using (public.is_admin());

-- RLS POLICIES FOR ORDER_ITEMS_B2B
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

-- Create helpful indexes
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_listings_product_id on public.listings(product_id);
create index if not exists idx_listings_seller_id on public.listings(seller_id);
create index if not exists idx_listings_target_role on public.listings(target_role);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_order_items_b2c_order_id on public.order_items_b2c(order_id);
create index if not exists idx_order_items_b2c_listing_id on public.order_items_b2c(listing_id);
create index if not exists idx_order_items_b2b_order_id on public.order_items_b2b(order_id);
create index if not exists idx_order_items_b2b_listing_id on public.order_items_b2b(listing_id);
create index if not exists idx_orders_b2b_buyer_id on public.orders_b2b(buyer_id);
create index if not exists idx_orders_b2b_seller_id on public.orders_b2b(seller_id);

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'retailer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile when user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
