# ZST Marketplace - Project Summary

## Overview
ZST is a two-sided marketplace platform built with Next.js, Tailwind CSS, and Supabase. The platform consists of three distinct interfaces:
- **B2C Shopping** (Public): E-commerce site for customers to buy products via Cash on Delivery (COD)
- **B2B Business Portal** (Authenticated): Members-only portal for Importers, Wholesalers, and Retailers with hierarchical visibility
- **Admin Panel** (Admin Role): Platform management interface

## Database Architecture

### Supabase Project
- **Project ID**: `ukkgmqvappkeqgdrbsar`
- **URL**: `https://ukkgmqvappkeqgdrbsar.supabase.co`
- **Anon Key**: Stored in `apps/client/.env.local`
- **Service Role Key**: Stored in `apps/client/.next/supabasekeys.md`

### Database Schema (`supabase/schema.sql`)

#### Tables
1. **profiles**
   - `id` (uuid, FK to auth.users.id)
   - `email` (text)
   - `business_name` (text, nullable)
   - `role` (enum: 'importer', 'wholesaler', 'retailer', 'admin')
   - `created_at`, `updated_at`

2. **categories**
   - `id` (bigserial)
   - `name` (text, unique)
   - `icon_svg` (text, nullable)
   - `created_at`, `updated_at`

3. **products** (Master product definitions)
   - `id` (bigserial)
   - `name` (text)
   - `description` (text, nullable)
   - `image_url` (text, nullable)
   - `category_id` (bigint, FK to categories.id)
   - `created_at`, `updated_at`

4. **listings** (Core table for products being sold)
   - `id` (bigserial)
   - `product_id` (bigint, FK to products.id)
   - `seller_id` (uuid, FK to profiles.id)
   - `price` (decimal)
   - `stock_quantity` (int)
   - `target_role` (enum: 'customer', 'retailer', 'wholesaler')
   - `created_at`, `updated_at`

5. **orders_b2c** (Customer COD orders)
   - `id` (bigserial)
   - `customer_name` (text)
   - `customer_address` (text)
   - `customer_phone` (text)
   - `status` (enum: 'pending', 'shipped', 'delivered', 'cancelled')
   - `created_at`

6. **order_items_b2c**
   - `id` (bigserial)
   - `order_id` (bigint, FK to orders_b2c.id)
   - `listing_id` (bigint, FK to listings.id)
   - `quantity` (int)
   - `price_at_purchase` (decimal)

7. **orders_b2b** (Business-to-business orders)
   - `id` (bigserial)
   - `buyer_id` (uuid, FK to profiles.id)
   - `seller_id` (uuid, FK to profiles.id)
   - `total_price` (decimal)
   - `status` (enum: 'pending', 'paid', 'shipped', 'completed')
   - `created_at`

8. **order_items_b2b**
   - `id` (bigserial)
   - `order_id` (bigint, FK to orders_b2b.id)
   - `listing_id` (bigint, FK to listings.id)
   - `quantity` (int)
   - `price_at_purchase` (decimal)

### Row Level Security (RLS) Policies

**Critical Implementation Note**: All admin policies use a `security definer` function `public.is_admin()` to avoid infinite recursion when checking admin status.

#### Profiles
- Users can view/update their own profile
- Users can insert their own profile
- Admins can perform all actions (via `is_admin()` function)

#### Categories
- Public read access
- Admin-only write access (via `is_admin()` function)

#### Products
- Public read access
- Authenticated users can insert products (for creating listings with product info)
- Users can update products referenced by their own listings
- Admins can delete products (via `is_admin()` function)

#### Listings
- **Public B2C**: Anyone can read listings where `target_role = 'customer'`
- **B2B Hierarchy**:
  - Retailers can read listings where `target_role = 'retailer'`
  - Wholesalers can read listings where `target_role = 'wholesaler'`
- Users can manage their own listings (where `seller_id = auth.uid()`)
- Admins can perform all actions (via `is_admin()` function)

#### Orders B2C
- Anyone can insert orders (anonymous COD checkout)
- Admins can select/update/delete (via `is_admin()` function)

#### Orders B2B
- Authenticated users can insert orders where `buyer_id = auth.uid()`
- Users can read orders where they are buyer or seller
- Admins can perform all actions (via `is_admin()` function)

### Database Functions & Triggers

1. **`public.is_admin()`**: Security definer function to check admin role (bypasses RLS to prevent infinite recursion)
2. **`public.handle_new_user()`**: Trigger function that automatically creates a profile when a user signs up
3. **`public.set_updated_at()`**: Trigger function to automatically update `updated_at` timestamps

### Storage
- **Bucket**: `product_images` (public read access)
- **Purpose**: Store product images uploaded by business users
- **File Structure**: `{userId}/{timestamp}-{random}.{extension}`
- **Setup**: See `STORAGE_SETUP.md` for detailed configuration instructions

## Frontend Architecture

### Technology Stack
- **Framework**: Next.js 15.4.6 (App Router)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)

### Project Structure

```
apps/client/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # B2C Home page (public)
│   │   ├── product/[id]/page.tsx       # B2C Product detail
│   │   ├── checkout/page.tsx           # B2C Checkout (COD)
│   │   ├── business/
│   │   │   ├── login/page.tsx         # B2B Login
│   │   │   ├── signup/page.tsx         # B2B Signup
│   │   │   ├── dashboard/page.tsx      # B2B Dashboard (hierarchical products)
│   │   │   └── my-listings/page.tsx    # B2B Listings CRUD
│   │   └── admin/
│   │       ├── login/page.tsx          # Admin Login
│   │       ├── dashboard/page.tsx      # Admin Dashboard (stats)
│   │       ├── users/page.tsx          # User management
│   │       ├── products/page.tsx       # Products & Categories CRUD
│   │       └── orders/page.tsx         # Orders management (B2C/B2B)
│   ├── components/
│   │   ├── Header.tsx                  # Conditional navigation (B2C/B2B/Admin)
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client configuration
│   │   ├── auth.ts                     # Auth helper functions
│   │   ├── storage.ts                  # Storage utility functions (image upload)
│   │   └── database.types.ts          # TypeScript database types
│   ├── contexts/
│   │   └── AuthContext.tsx            # Auth context provider for session persistence
│   └── types/
│       └── database.ts                 # Type definitions for all entities
```

## Key Features Implemented

### B2C Shopping Interface (Public, No Auth Required)

1. **Home Page (`/`)**
   - Displays all listings where `target_role = 'customer'`
   - Search functionality (filters by product name)
   - Product grid with images, names, prices
   - Links to product detail pages

2. **Product Detail Page (`/product/[id]`)**
   - Full product information display
   - Quantity selector
   - "Order Now (Cash on Delivery)" button
   - Redirects to checkout

3. **Checkout Page (`/checkout`)**
   - Form fields: Full Name, Address, Phone Number
   - Order summary display
   - Creates `orders_b2c` and `order_items_b2c` entries
   - Updates stock quantity
   - Shows confirmation message

### B2B Business Interface (Authenticated)

1. **Authentication (`/business/login`, `/business/signup`)**
   - Email/password authentication
   - Signup collects: Email, Password, Business Name, Role (Importer/Wholesaler/Retailer)
   - Automatically creates profile entry
   - Handles email confirmation (if enabled)

2. **Dashboard (`/business/dashboard`)**
   - **Hierarchical Product Display**:
     - Retailers → see listings where `target_role = 'retailer'` (from Wholesalers)
     - Wholesalers → see listings where `target_role = 'wholesaler'` (from Importers)
     - Importers → empty grid (they only sell, don't buy)
   - Quantity selector for each product
   - "Buy Now" button creates B2B orders
   - Shows user business name and role

3. **My Listings (`/business/my-listings`)**
   - CRUD interface for user's own listings
   - **Product Information Per Listing**:
     - Product name input (required)
     - Product description textarea (optional)
     - Category selection from existing categories (optional)
     - Image upload to Supabase Storage (required for new listings)
     - Price and Stock Quantity inputs
   - **Image Upload Features**:
     - File validation (type: jpg, png, webp, gif; size: max 5MB)
     - Image preview before upload
     - Upload progress indicator
     - Images stored in Supabase Storage bucket `product_images`
   - **Automatic target_role assignment**:
     - Retailer → `target_role = 'customer'`
     - Wholesaler → `target_role = 'retailer'`
     - Importer → `target_role = 'wholesaler'`
   - Edit/Delete functionality for existing listings
   - When editing: Can update product name, description, category, and optionally upload new image

### Admin Panel (Admin Role Required)

1. **Admin Login (`/admin/login`)**
   - Role-based access control
   - Verifies user has `role = 'admin'` after authentication

2. **Dashboard (`/admin/dashboard`)**
   - Statistics cards:
     - Total Users
     - Total B2C Orders
     - Total B2B Orders
   - Quick links to management pages

3. **Users Management (`/admin/users`)**
   - Table of all users from profiles
   - Edit user role functionality
   - Displays: Email, Business Name, Role, Created Date

4. **Products Management (`/admin/products`)**
   - Full CRUD for products
   - Full CRUD for categories
   - Side-by-side interface
   - This is where master products are created (used in listings)

5. **Orders Management (`/admin/orders`)**
   - Two tabs: "B2C Orders" and "B2B Orders"
   - Displays all orders with customer/buyer/seller information
   - Update order status functionality
   - Shows order items with quantities and prices

### Navigation & UI Components

1. **Header Component** (`apps/client/src/components/Header.tsx`)
   - Conditional rendering based on route:
     - Public pages: Shows "For Shopping" / "For Business" links
       - If user is logged in: Shows user info and "Sign Out" button
       - If user is not logged in: Shows "Sign up" and "Log in" buttons
     - B2B pages: Shows user info, "My Listings", "Shopping", Sign Out
     - Admin pages: No header (clean interface)
   - Uses `usePathname()` to detect current route
   - Uses Auth Context to show logged-in status on all pages

2. **Layout** (`apps/client/src/app/layout.tsx`)
   - Includes AuthProvider wrapper for session persistence
   - Includes Header and Footer
   - Responsive design with Tailwind CSS

3. **Auth Context** (`apps/client/src/contexts/AuthContext.tsx`)
   - Provides authentication state across the entire application
   - Maintains user session and profile data
   - Listens to Supabase auth state changes
   - Ensures users stay logged in when navigating between pages
   - Provides `useAuth()` hook for components to access auth state

## TypeScript Types

All database types are defined in:
- `apps/client/src/types/database.ts` - Main type definitions
- `apps/client/src/lib/database.types.ts` - Supabase-generated types

Key types:
- `UserRole`: 'importer' | 'wholesaler' | 'retailer' | 'admin'
- `TargetRole`: 'customer' | 'retailer' | 'wholesaler'
- `OrderStatusB2C`: 'pending' | 'shipped' | 'delivered' | 'cancelled'
- `OrderStatusB2B`: 'pending' | 'paid' | 'shipped' | 'completed'
- Interfaces for all tables with relationships (e.g., `ListingWithProduct`)

## Authentication & Authorization

### Supabase Auth Configuration
- Session storage: `localStorage` with key `'zst-auth-token'`
- Auto-refresh tokens enabled
- Session detection in URL enabled

### Auth Helper Functions (`apps/client/src/lib/auth.ts`)
- `getCurrentUserProfile()`: Gets authenticated user's profile
- `hasRole(role)`: Checks if user has specific role
- `isAdmin()`: Checks if user is admin
- `getCurrentUser()`: Gets current auth user
- `signOut()`: Signs out user

### Storage Helper Functions (`apps/client/src/lib/storage.ts`)
- `uploadProductImage(file, userId)`: Uploads product image to Supabase Storage
  - Validates file type (jpg, png, webp, gif)
  - Validates file size (max 5MB)
  - Generates unique filename with user ID and timestamp
  - Returns public URL of uploaded image
- `deleteProductImage(imageUrl)`: Deletes product image from storage (optional cleanup)

### Profile Creation Flow
1. User signs up via Supabase Auth
2. Database trigger `handle_new_user()` automatically creates profile entry
3. Frontend updates profile with business information (business_name, role)
4. If profile doesn't exist, frontend creates it as fallback

## Important Implementation Notes

### 1. Infinite Recursion Fix
**Critical**: All admin RLS policies use `public.is_admin()` function with `security definer` to prevent infinite recursion. Direct queries to `profiles` table in RLS policies would cause infinite loops.

### 2. Email Confirmation
- Currently disabled for development (can be enabled in Supabase Dashboard)
- Code handles both cases (with/without email confirmation)
- If enabled, users must confirm email before accessing dashboard

### 3. Hierarchical Product Visibility
The B2B hierarchy is enforced at the database level via RLS:
- Retailers can only see products from Wholesalers
- Wholesalers can only see products from Importers
- Importers don't buy (only sell)

### 4. Target Role Auto-Assignment
When creating listings, `target_role` is automatically set based on user role:
- Retailer creates listings for → Customers
- Wholesaler creates listings for → Retailers
- Importer creates listings for → Wholesalers

### 5. Stock Management
- Stock quantity decreases when orders are placed
- Stock is checked before allowing orders
- Stock updates happen in checkout/order creation flows

## Environment Configuration

### Client Environment (`apps/client/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://ukkgmqvappkeqgdrbsar.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

### Supabase Keys (Reference)
Stored in `apps/client/.next/supabasekeys.md`:
- Project ID: `ukkgmqvappkeqgdrbsar`
- Anon Public Key: (see file)
- Service Role Key: (see file)

## Setup Instructions

### 1. Database Setup
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste entire contents of `supabase/schema.sql`
3. Run the SQL script
4. This creates all tables, enums, indexes, RLS policies, functions, and triggers

### 2. Storage Setup
1. Go to Supabase Dashboard → Storage
2. Create bucket named `product_images`
3. Set bucket to public (read access)
4. Configure storage policies (see `STORAGE_SETUP.md` for detailed instructions)
5. Alternatively, run the storage policies SQL from `STORAGE_SETUP.md` in the SQL Editor

### 3. Authentication Setup
1. Go to Supabase Dashboard → Authentication → Settings
2. Configure email templates (optional)
3. Enable/disable email confirmation as needed
4. Configure any OAuth providers (optional)

### 4. Storage Setup (Required for Image Uploads)
1. Go to Supabase Dashboard → Storage
2. Create bucket named `product_images`
3. Enable "Public bucket" option
4. Go to Storage → Policies → product_images
5. Create storage policies via Dashboard UI (see `STORAGE_SETUP.md` for detailed instructions)
   - **Note**: Storage policies cannot be created via SQL - must use Dashboard UI
   - Minimum required: Public read access + Authenticated upload access

### 5. Next.js Image Configuration
1. The `next.config.ts` file is already configured with Supabase storage hostname
2. Images from `ukkgmqvappkeqgdrbsar.supabase.co` are allowed
3. No additional configuration needed

### 6. Environment Variables
1. Copy `.env.local` template or create from `.env.example`
2. Add Supabase URL and anon key
3. Restart dev server

## Known Issues & Solutions

### Issue: "Infinite recursion detected in policy"
**Solution**: All admin policies use `public.is_admin()` function which bypasses RLS using `security definer`.

### Issue: "Profile not found" or "Account created but failed to save business information"
**Solution**: 
- Profile creation uses retry logic with session verification
- Trigger automatically creates profile, frontend updates it
- If trigger fails, frontend creates profile as fallback

### Issue: 500 errors on profile queries
**Solution**: 
- RLS policies updated to check `auth.uid() is not null` before comparing
- Use `maybeSingle()` instead of `single()` for queries that might return no results
- Session verification before profile operations

### Issue: "Bucket not found" when uploading images
**Solution**: 
- Create the `product_images` bucket in Supabase Dashboard → Storage
- Enable "Public bucket" option
- Set up storage policies via Dashboard UI (see `STORAGE_SETUP.md`)

### Issue: "type already exists" when running schema.sql
**Solution**: 
- Schema uses `DO $$ BEGIN ... EXCEPTION` blocks to handle existing types gracefully
- Types will be created only if they don't exist

### Issue: "must be owner of table objects" when creating storage policies
**Solution**: 
- Storage policies cannot be created via SQL
- Must use Supabase Dashboard → Storage → Policies → product_images
- See `STORAGE_SETUP.md` for step-by-step instructions

### Issue: Next.js Image "hostname not configured" error
**Solution**: 
- `next.config.ts` is configured with Supabase storage hostname
- Restart dev server after configuration changes

## Testing Checklist

- [ ] B2C: Browse products without login
- [ ] B2C: Search products
- [ ] B2C: View product details
- [ ] B2C: Complete COD checkout
- [ ] B2B: Sign up as Retailer
- [ ] B2B: Sign up as Wholesaler
- [ ] B2B: Sign up as Importer
- [ ] B2B: Login and access dashboard
- [ ] B2B: See appropriate products based on role
- [ ] B2B: Create listing with product name, category, and image upload
- [ ] B2B: Upload product image (verify file validation and preview)
- [ ] B2B: Edit listing and update product information
- [ ] B2B: Edit listing and upload new image
- [ ] B2B: Delete own listings
- [ ] B2B: Place B2B order
- [ ] Admin: Login with admin account
- [ ] Admin: View dashboard statistics
- [ ] Admin: Manage users (edit roles)
- [ ] Admin: Create/edit products and categories
- [ ] Admin: View and update orders (B2C and B2B)

## Future Enhancements (Not Implemented)

- Shopping cart functionality
- Wishlist feature
- Payment integration (currently COD only)
- Email notifications for orders
- Order tracking for customers
- Advanced search and filters
- Product reviews and ratings
- Inventory management alerts
- Bulk order operations

## File Structure Summary

```
zst phase 1/
├── apps/
│   ├── client/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/              # Next.js app router pages
│   │   │   ├── components/       # React components
│   │   │   ├── lib/              # Utilities and Supabase client
│   │   │   └── types/            # TypeScript definitions
│   │   └── .env.local            # Environment variables
│   └── server/                   # (Not used in this project)
├── supabase/
│   ├── schema.sql                # Complete database schema
│   └── storage_policies.sql      # Storage policy reference (use Dashboard UI)
├── STORAGE_SETUP.md              # Storage bucket setup instructions
└── PROJECT_SUMMARY.md            # This file
```

## Key Technical Decisions

1. **RLS for Security**: All tables use Row Level Security for fine-grained access control
2. **Security Definer Functions**: Used for admin checks to avoid infinite recursion
3. **Automatic Profile Creation**: Database trigger creates profile on user signup
4. **Hierarchical Access**: B2B product visibility enforced at database level via RLS
5. **Type Safety**: Full TypeScript coverage with generated and manual types
6. **Retry Logic**: Profile operations include retry logic for reliability
7. **Conditional Navigation**: Header component adapts based on user context
8. **Auth Context Provider**: Global auth state management for session persistence across page navigations
9. **Product Info Per Listing**: Each listing has its own product (name, description, category, image) rather than referencing shared master products
10. **Image Upload to Storage**: Product images stored in Supabase Storage with user-organized folder structure
11. **Type Safety for Enums**: Database enums handled gracefully in schema to prevent "already exists" errors

## API Endpoints

All data operations go through Supabase client directly:
- No custom API routes for data (uses Supabase RLS)
- Supabase handles all CRUD operations
- Authentication handled by Supabase Auth

## Development Notes

- Email confirmation is currently disabled for easier development
- All console errors are logged for debugging
- Session verification happens before profile operations
- Profile creation includes fallback mechanisms
- Stock updates happen automatically on order creation
- Auth state persists across page navigations via AuthContext
- Image uploads include validation (type and size) before upload
- Product images are stored with user ID in path for organization
- Next.js Image component configured for Supabase storage domain
- Storage policies must be created via Dashboard UI (cannot use SQL)

