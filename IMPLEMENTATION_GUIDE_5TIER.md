# 5-Tier Hierarchy Implementation Guide

This guide provides step-by-step instructions to implement the strict 5-tier user hierarchy system for the ZST Marketplace.

## Overview

The system enforces a strict downstream flow of products/offers:
- **Tier 0: Admin** - Full platform control
- **Tier 1: Importer** - Creates bulk "Offers" for Wholesalers
- **Tier 2: Wholesaler** - Buys from Importers, sells "Products" to Retailers
- **Tier 3: Retailer** - Buys from Wholesalers, sells "Products" to Customers
- **Tier 4: Normal User** - End consumer, browses and buys via COD

## Phase 1: Database Setup (COMPLETE)

### Step 1.1: Apply New Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/schema_5tier.sql`
3. Run the script
4. Verify all tables, policies, and triggers are created

### Step 1.2: Create Default Admin Account

1. In Supabase Dashboard → Authentication → Users
2. Click "Add user" (email auth)
3. Enter:
   - Email: `marwan22@gmail.com`
   - Password: `zstadmin`
   - Confirm email: Yes (check the box)
4. Click "Create user"
5. Go to SQL Editor
6. Run the contents of `supabase/seed_admin.sql`
7. Verify the admin role was assigned

## Phase 2: Frontend Updates (IN PROGRESS)

### Step 2.1: Core Infrastructure (COMPLETE)

- ✅ Updated TypeScript types (`apps/client/src/types/database.ts`)
- ✅ Created role utility functions (`apps/client/src/lib/role-utils.ts`)
- ✅ Created ProtectedRoute component (`apps/client/src/components/ProtectedRoute.tsx`)
- ✅ Created banned page (`apps/client/src/app/banned/page.tsx`)
- ✅ Updated Admin users page with ban/unban functionality

### Step 2.2: Portal Structure (TODO)

Create the following directory structure:

```
apps/client/src/app/
├── importer/
│   ├── dashboard/
│   │   └── page.tsx          # Importer dashboard
│   ├── offers/
│   │   ├── page.tsx          # List my offers
│   │   ├── create/
│   │   │   └── page.tsx      # Create new offer
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx  # Edit offer
│   └── orders/
│       └── page.tsx          # Orders from wholesalers
├── wholesaler/
│   ├── dashboard/
│   │   └── page.tsx          # Wholesaler dashboard
│   ├── buy/
│   │   └── page.tsx          # Browse offers from importers
│   ├── sell/
│   │   ├── page.tsx          # List my products
│   │   ├── create/
│   │   │   └── page.tsx      # Create new product
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx  # Edit product
│   └── orders/
│       ├── purchases/
│       │   └── page.tsx      # Orders I placed (buying)
│       └── sales/
│           └── page.tsx      # Orders I received (selling)
├── retailer/
│   ├── dashboard/
│   │   └── page.tsx          # Retailer dashboard
│   ├── buy/
│   │   └── page.tsx          # Browse products from wholesalers
│   ├── sell/
│   │   ├── page.tsx          # List my products
│   │   ├── create/
│   │   │   └── page.tsx      # Create new product
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx  # Edit product
│   └── orders/
│       ├── purchases/
│       │   └── page.tsx      # Orders I placed (B2B)
│       └── sales/
│           └── page.tsx      # COD orders from customers
└── my-orders/
    └── page.tsx              # Normal user order history
```

### Step 2.3: Importer Portal

**Files to Create:**

1. `apps/client/src/app/importer/dashboard/page.tsx`
   - Show total offers, total orders, revenue
   - Quick links to create offers, view orders

2. `apps/client/src/app/importer/offers/page.tsx`
   - List all offers with `is_bulk_offer=true`, `target_role='wholesaler'`
   - Show stock, price, min order quantity
   - Actions: Edit, Delete

3. `apps/client/src/app/importer/offers/create/page.tsx`
   - Form to create bulk offer
   - Fields: Product name, description, image, category, price, stock, min order quantity
   - Automatically set `is_bulk_offer=true`, `target_role='wholesaler'`

4. `apps/client/src/app/importer/orders/page.tsx`
   - List B2B orders where seller_id = current user
   - Show buyer info, items, total, status
   - Allow status updates

**Key Logic:**
```typescript
// Creating an offer (Importer)
const { data: listing, error } = await supabase
  .from('listings')
  .insert({
    product_id,
    seller_id: user.id,
    price,
    stock_quantity,
    target_role: 'wholesaler', // Always wholesaler for importers
    is_bulk_offer: true,       // Always true for importers
    min_order_quantity: minQty
  })
```

### Step 2.4: Wholesaler Portal

**Files to Create:**

1. `apps/client/src/app/wholesaler/dashboard/page.tsx`
2. `apps/client/src/app/wholesaler/buy/page.tsx` - Browse offers from importers (`target_role='wholesaler'`)
3. `apps/client/src/app/wholesaler/sell/page.tsx` - Manage products for retailers
4. `apps/client/src/app/wholesaler/sell/create/page.tsx`
5. `apps/client/src/app/wholesaler/orders/purchases/page.tsx` - Orders placed to importers
6. `apps/client/src/app/wholesaler/orders/sales/page.tsx` - Orders received from retailers

**Key Logic:**
```typescript
// Creating a product listing (Wholesaler)
const { data: listing, error } = await supabase
  .from('listings')
  .insert({
    product_id,
    seller_id: user.id,
    price,
    stock_quantity,
    target_role: 'retailer', // Always retailer for wholesalers
    is_bulk_offer: false,    // Not a bulk offer
    min_order_quantity: 1
  })

// Browsing offers (Wholesaler buys from Importers)
const { data: offers } = await supabase
  .from('listings')
  .select('*, product:products(*)')
  .eq('target_role', 'wholesaler') // RLS ensures only wholesalers see this
```

### Step 2.5: Retailer Portal

**Files to Create:**

1. `apps/client/src/app/retailer/dashboard/page.tsx`
2. `apps/client/src/app/retailer/buy/page.tsx` - Browse products from wholesalers (`target_role='retailer'`)
3. `apps/client/src/app/retailer/sell/page.tsx` - Manage products for customers
4. `apps/client/src/app/retailer/sell/create/page.tsx`
5. `apps/client/src/app/retailer/orders/purchases/page.tsx` - Orders placed to wholesalers
6. `apps/client/src/app/retailer/orders/sales/page.tsx` - COD orders from normal users

**Key Logic:**
```typescript
// Creating a product listing (Retailer)
const { data: listing, error } = await supabase
  .from('listings')
  .insert({
    product_id,
    seller_id: user.id,
    price,
    stock_quantity,
    target_role: 'customer', // Always customer for retailers
    is_bulk_offer: false,
    min_order_quantity: 1
  })

// Browsing products (Retailer buys from Wholesalers)
const { data: products } = await supabase
  .from('listings')
  .select('*, product:products(*)')
  .eq('target_role', 'retailer') // RLS ensures only retailers see this
```

### Step 2.6: Normal User (Customer) Portal

**Files to Update/Create:**

1. Update `apps/client/src/app/page.tsx` (Homepage)
   - Fetch listings with `target_role='customer'` (public access via RLS)
   - Show product cards, add to cart functionality

2. Update `apps/client/src/app/checkout/page.tsx`
   - Guest Checkout Flow:
     - Capture: Name, Address, Phone
     - Create order with `user_id=NULL`
   - Authenticated Checkout Flow:
     - Pre-fill: Name, Email from profile
     - Capture: Address, Phone
     - Create order with `user_id=auth.uid()`, `customer_email=profile.email`
   - COD only (no payment gateway)

3. Create `apps/client/src/app/my-orders/page.tsx`
   - Protected route (requires auth + `role='normal_user'`)
   - Fetch orders where `user_id=auth.uid()`
   - Show: Order ID, Date, Status, Items, Total
   - Allow viewing order details

**Key Logic:**
```typescript
// Authenticated COD Checkout
const { data: order, error } = await supabase
  .from('orders_b2c')
  .insert({
    user_id: user.id,
    customer_name: profile.business_name || user.email,
    customer_email: profile.email,
    customer_address: shippingAddress,
    customer_phone: phone,
    total_amount: cartTotal,
    status: 'pending'
  })
  .select()
  .single()

// Create order items
const items = cart.map(item => ({
  order_id: order.id,
  listing_id: item.listing_id,
  quantity: item.quantity,
  price_at_purchase: item.price
}))
await supabase.from('order_items_b2c').insert(items)

// Update stock (use RPC function)
for (const item of cart) {
  await supabase.rpc('decrement_stock', {
    listing_id: item.listing_id,
    quantity: item.quantity
  })
}
```

### Step 2.7: Update Auth Flow

**Files to Update:**

1. `apps/client/src/app/signup/page.tsx`
   - Remove role selection for regular signup
   - Default to `normal_user` (handled by database trigger)

2. `apps/client/src/app/business/signup/page.tsx`
   - Keep role selection for business users
   - Options: Importer, Wholesaler, Retailer
   - Requires business name

3. Update AuthContext to handle banned users
   - Already handled in `ProtectedRoute` component

### Step 2.8: Update Navigation

**Files to Update:**

1. `apps/client/src/components/Header.tsx`
   - Show different navigation based on role:
     - Admin: Link to `/admin/dashboard`
     - Importer: Link to `/importer/dashboard`
     - Wholesaler: Link to `/wholesaler/dashboard`
     - Retailer: Link to `/retailer/dashboard`
     - Normal User: Link to `/my-orders` (after login)

## Phase 3: Testing

### Test Scenarios

1. **Admin Tests**
   - Login as admin (marwan22@gmail.com / zstadmin)
   - View all users
   - Change user roles
   - Ban/unban users
   - Delete users
   - View all orders (B2B and B2C)

2. **Importer Tests**
   - Create bulk offers
   - View orders from wholesalers
   - Update order status

3. **Wholesaler Tests**
   - Browse offers from importers
   - Place B2B order to importer
   - Create products for retailers
   - View orders from retailers

4. **Retailer Tests**
   - Browse products from wholesalers
   - Place B2B order to wholesaler
   - Create products for customers
   - View COD orders from normal users
   - Update order status (shipped, delivered)

5. **Normal User Tests (Guest)**
   - Browse products from retailers
   - Cannot checkout (must login/register)

6. **Normal User Tests (Authenticated)**
   - Browse products from retailers
   - Add to cart
   - Checkout with COD
   - View order history in `/my-orders`

7. **Hierarchy Enforcement Tests**
   - Verify importers cannot see products from wholesalers/retailers
   - Verify wholesalers cannot see offers from other wholesalers
   - Verify retailers cannot see products from other retailers
   - Verify normal users only see products with `target_role='customer'`

## Phase 4: Documentation Updates

Update the following files:
- `README.md` - Update project description
- `CLAUDE.md` - Add 5-tier hierarchy information
- `QUICKSTART.md` - Update setup instructions
- `CONFIGURATION_SUMMARY.md` - Update architecture section

## Key Database Functions

### decrement_stock (Create if not exists)

```sql
create or replace function public.decrement_stock(
  listing_id bigint,
  quantity int
)
returns void as $$
begin
  update public.listings
  set stock_quantity = stock_quantity - quantity
  where id = listing_id;
end;
$$ language plpgsql security definer;
```

### increment_stock (For order cancellations)

```sql
create or replace function public.increment_stock(
  listing_id bigint,
  quantity int
)
returns void as $$
begin
  update public.listings
  set stock_quantity = stock_quantity + quantity
  where id = listing_id;
end;
$$ language plpgsql security definer;
```

## Common Queries

### Get listings visible to current user

```typescript
// Based on user role, automatically filtered by RLS
const { data: listings } = await supabase
  .from('listings')
  .select('*, product:products(*)')
  .order('created_at', { ascending: false })
```

### Create B2B Order

```typescript
const { data: order } = await supabase
  .from('orders_b2b')
  .insert({
    buyer_id: user.id,
    seller_id: listing.seller_id,
    total_price: total,
    status: 'pending'
  })
  .select()
  .single()

// Add items
const items = cart.map(item => ({
  order_id: order.id,
  listing_id: item.listing_id,
  quantity: item.quantity,
  price_at_purchase: item.price
}))
await supabase.from('order_items_b2b').insert(items)
```

## Troubleshooting

### RLS Policy Issues

If users cannot see listings:
1. Check user role in `profiles` table
2. Verify `is_banned=false`
3. Check listing `target_role` matches buyer's tier
4. Test RLS policies in Supabase SQL Editor using `set role authenticated;`

### Infinite Recursion Errors

Always use `public.is_admin()` and `public.get_my_role()` functions in RLS policies, never inline queries.

### Auth State Not Updating

Clear localStorage and refresh auth:
```typescript
localStorage.removeItem('zst-auth-token')
await supabase.auth.signOut()
// Then sign in again
```

## Next Steps

1. Apply database schema (`schema_5tier.sql`)
2. Create default admin account (`seed_admin.sql`)
3. Implement Importer portal
4. Implement Wholesaler portal
5. Implement Retailer portal
6. Update customer checkout flow
7. Create My Orders page
8. Test complete hierarchy
9. Update documentation

## Notes

- The system is designed to be **strict** - users can only see data for their tier and downstream
- Admin has **full visibility** across all tiers
- COD is the **only payment method** for B2C orders
- B2B orders use account credit/balance (future enhancement)
- All role changes must be done by Admin through the user management page
