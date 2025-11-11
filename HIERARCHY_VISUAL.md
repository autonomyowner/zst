# 5-Tier Hierarchy Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 0: ADMIN                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • Full platform control                              │  │
│  │  • Manage all users (edit roles, ban, delete)         │  │
│  │  • View all orders (B2B and B2C)                      │  │
│  │  • View all listings from all tiers                   │  │
│  │  • Platform oversight and moderation                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ manages
┌─────────────────────────────────────────────────────────────┐
│                  TIER 1: IMPORTER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • Creates BULK OFFERS (is_bulk_offer=true)           │  │
│  │  • Sets minimum order quantities                      │  │
│  │  • Sells to: WHOLESALERS ONLY                         │  │
│  │  • Target Role: 'wholesaler'                          │  │
│  │  • Receives B2B orders from wholesalers               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ sells to
┌─────────────────────────────────────────────────────────────┐
│                TIER 2: WHOLESALER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  BUY SIDE:                                             │  │
│  │  • Browses bulk offers from importers                 │  │
│  │  • Places B2B orders to importers                     │  │
│  │  • Views: target_role='wholesaler' listings           │  │
│  │                                                        │  │
│  │  SELL SIDE:                                            │  │
│  │  • Creates PRODUCTS (is_bulk_offer=false)             │  │
│  │  • Breaks down bulk into smaller quantities           │  │
│  │  • Sells to: RETAILERS ONLY                           │  │
│  │  • Target Role: 'retailer'                            │  │
│  │  • Receives B2B orders from retailers                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ sells to
┌─────────────────────────────────────────────────────────────┐
│                  TIER 3: RETAILER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  BUY SIDE:                                             │  │
│  │  • Browses products from wholesalers                  │  │
│  │  • Places B2B orders to wholesalers                   │  │
│  │  • Views: target_role='retailer' listings             │  │
│  │                                                        │  │
│  │  SELL SIDE:                                            │  │
│  │  • Creates PRODUCTS for public sale                   │  │
│  │  • Sells to: CUSTOMERS (normal users)                 │  │
│  │  • Target Role: 'customer'                            │  │
│  │  • Receives COD orders from normal users              │  │
│  │  • Manages order fulfillment (ship, deliver)          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ sells to
┌─────────────────────────────────────────────────────────────┐
│                TIER 4: NORMAL USER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • Browses public marketplace                         │  │
│  │  • Views: target_role='customer' listings             │  │
│  │  • Can checkout with COD (authenticated)              │  │
│  │  • Views own order history                            │  │
│  │  • CANNOT create listings                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  GUEST USER (Not logged in)                           │  │
│  │  • Can browse public marketplace                      │  │
│  │  • CANNOT checkout (must login/register)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Example: T-Shirt Journey

```
IMPORTER creates offer:
┌─────────────────────────────────┐
│ Bulk T-Shirt Offer              │
│ • Quantity: 1,000 units         │
│ • Price: $2 per unit            │
│ • Min Order: 100 units          │
│ • target_role: 'wholesaler'     │
│ • is_bulk_offer: true           │
└─────────────────────────────────┘
            ↓
  WHOLESALER sees and orders 500 units
            ↓
WHOLESALER creates listing:
┌─────────────────────────────────┐
│ T-Shirt Product                 │
│ • Quantity: 500 units           │
│ • Price: $5 per unit            │
│ • Min Order: 10 units           │
│ • target_role: 'retailer'       │
│ • is_bulk_offer: false          │
└─────────────────────────────────┘
            ↓
  RETAILER sees and orders 100 units
            ↓
RETAILER creates listing:
┌─────────────────────────────────┐
│ T-Shirt Product                 │
│ • Quantity: 100 units           │
│ • Price: $15 per unit           │
│ • Min Order: 1 unit             │
│ • target_role: 'customer'       │
│ • is_bulk_offer: false          │
└─────────────────────────────────┘
            ↓
  NORMAL USER sees and orders 2 units
            ↓
COD Order Created:
┌─────────────────────────────────┐
│ Customer Order #123             │
│ • Customer: John Doe            │
│ • Items: 2x T-Shirt             │
│ • Total: $30                    │
│ • Payment: Cash on Delivery     │
│ • Status: Pending               │
└─────────────────────────────────┘
```

## Visibility Matrix

| User Role     | Can See Importer Offers | Can See Wholesaler Products | Can See Retailer Products |
|---------------|------------------------|-----------------------------|---------------------------|
| Admin         | ✅ YES                  | ✅ YES                       | ✅ YES                     |
| Importer      | ❌ NO                   | ❌ NO                        | ✅ YES (as shopper)        |
| Wholesaler    | ✅ YES                  | ❌ NO                        | ✅ YES (as shopper)        |
| Retailer      | ❌ NO                   | ✅ YES                       | ✅ YES (as shopper)        |
| Normal User   | ❌ NO                   | ❌ NO                        | ✅ YES                     |
| Guest         | ❌ NO                   | ❌ NO                        | ✅ YES                     |

## Permission Matrix

| Action                    | Admin | Importer | Wholesaler | Retailer | Normal User | Guest |
|---------------------------|-------|----------|------------|----------|-------------|-------|
| Create Bulk Offers        | ✅     | ✅        | ❌          | ❌        | ❌           | ❌     |
| Create Products           | ✅     | ❌        | ✅          | ✅        | ❌           | ❌     |
| Place B2B Orders          | ✅     | ❌        | ✅          | ✅        | ❌           | ❌     |
| Place B2C Orders (COD)    | ✅     | ✅        | ✅          | ✅        | ✅           | ❌     |
| View Own Orders           | ✅     | ✅        | ✅          | ✅        | ✅           | ❌     |
| View All Orders           | ✅     | ❌        | ❌          | ❌        | ❌           | ❌     |
| Manage Users              | ✅     | ❌        | ❌          | ❌        | ❌           | ❌     |
| Ban Users                 | ✅     | ❌        | ❌          | ❌        | ❌           | ❌     |
| Change User Roles         | ✅     | ❌        | ❌          | ❌        | ❌           | ❌     |

## Portal Structure

```
/
├── /                          → Public marketplace (Normal Users & Guests)
│   ├── /login                 → Login page
│   ├── /signup                → Normal user signup
│   ├── /checkout              → COD checkout (authenticated only)
│   ├── /my-orders             → Order history (Normal Users only)
│   └── /product/[id]          → Product detail page
│
├── /admin                     → Admin portal
│   ├── /admin/dashboard       → Platform overview
│   ├── /admin/users           → User management (DONE ✅)
│   ├── /admin/orders          → All orders
│   └── /admin/products        → All products/listings
│
├── /importer                  → Importer portal
│   ├── /importer/dashboard    → Importer dashboard
│   ├── /importer/offers       → Manage bulk offers
│   └── /importer/orders       → Orders from wholesalers
│
├── /wholesaler                → Wholesaler portal
│   ├── /wholesaler/dashboard  → Wholesaler dashboard
│   ├── /wholesaler/buy        → Browse importer offers
│   ├── /wholesaler/sell       → Manage products for retailers
│   └── /wholesaler/orders     → Purchase & sales orders
│
├── /retailer                  → Retailer portal
│   ├── /retailer/dashboard    → Retailer dashboard
│   ├── /retailer/buy          → Browse wholesaler products
│   ├── /retailer/sell         → Manage products for customers
│   └── /retailer/orders       → Purchase & COD orders
│
└── /business                  → Business user auth
    ├── /business/signup       → Business signup (role selection)
    └── /business/login        → Business login
```

## Order Flow Types

### B2C Order Flow (COD)
```
Normal User (Authenticated)
    ↓ Adds to cart
Retailer Products
    ↓ Checkout (COD)
Order Created (orders_b2c)
    ↓ Order items linked
Retailer sees order
    ↓ Updates status
Pending → Shipped → Delivered
```

### B2B Order Flow
```
Buyer (Wholesaler/Retailer)
    ↓ Places order
Seller (Importer/Wholesaler)
    ↓ Receives order
Order Created (orders_b2b)
    ↓ Payment/Credit
Pending → Paid → Shipped → Completed
```

## Database Key Concepts

### Target Role Validation
```sql
-- Enforced by trigger: validate_listing_target_role()
Importer      → must use target_role='wholesaler'
Wholesaler    → must use target_role='retailer'
Retailer      → must use target_role='customer'
Normal User   → CANNOT create listings (error)
```

### RLS Policy Logic
```sql
-- Simplified logic:
SELECT * FROM listings WHERE target_role =
  CASE get_my_role()
    WHEN 'wholesaler' THEN 'wholesaler'  -- See importer offers
    WHEN 'retailer'   THEN 'retailer'    -- See wholesaler products
    WHEN 'normal_user' THEN 'customer'   -- See retailer products
    WHEN 'admin'      THEN ANY           -- See everything
  END
```

## Key Database Tables

```
profiles (users)
├── id (UUID)
├── email
├── role (admin/importer/wholesaler/retailer/normal_user)
├── is_banned (boolean)
├── balance
└── due_amount

listings (products/offers)
├── id
├── product_id
├── seller_id
├── target_role (customer/retailer/wholesaler)
├── is_bulk_offer (boolean)
├── min_order_quantity
├── price
└── stock_quantity

orders_b2c (customer orders)
├── id
├── user_id (nullable for guests)
├── customer_name
├── customer_email
├── customer_address
├── customer_phone
├── total_amount
└── status (pending/shipped/delivered/cancelled)

orders_b2b (business orders)
├── id
├── buyer_id
├── seller_id
├── total_price
└── status (pending/paid/shipped/completed)
```

## Success Indicators

Your system is working correctly when:

- ✅ Each role sees ONLY listings targeted at them
- ✅ Attempts to create listings with wrong target_role are REJECTED
- ✅ Normal users CANNOT create listings (error thrown)
- ✅ Banned users cannot access any resources
- ✅ Admin sees EVERYTHING
- ✅ Guest users can browse but not checkout
- ✅ Authenticated normal users can checkout with COD
- ✅ B2B orders link buyer and seller correctly
- ✅ Order visibility follows role-based rules

## Common Testing Scenarios

1. **Create Listing as Wrong Role**
   ```typescript
   // As retailer, try to create listing with target_role='wholesaler'
   // Expected: ERROR (trigger rejects)
   ```

2. **View Listings as Different Roles**
   ```typescript
   // Login as wholesaler
   // Query listings
   // Expected: Only see target_role='wholesaler' (from importers)
   ```

3. **Ban User and Test Access**
   ```typescript
   // Admin bans user
   // User tries to login
   // Expected: Redirect to /banned page
   ```

4. **Guest Checkout Attempt**
   ```typescript
   // Guest tries to checkout
   // Expected: Redirect to /login
   ```

This visual guide should help you understand the complete 5-tier hierarchy system!
