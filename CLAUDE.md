# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ZST Marketplace** - A multi-tier B2B/B2C e-commerce platform built with Next.js 15 and Supabase.

**Note**: The README.md mentions "TRAVoices" (voice translation platform), but the actual implemented codebase is the ZST Marketplace. The Express server contains unused voice/AI endpoints from an earlier project iteration.

## Monorepo Structure

This is an npm workspaces monorepo:
- `apps/client/` - Next.js 15 frontend (primary application)
- `apps/server/` - Express backend (minimal usage, contains legacy voice/AI code)
- `packages/types/` - Shared TypeScript types with Zod validation

## Common Commands

### Development
```bash
# Start both client and server
npm run dev

# Start only client (Next.js)
npm run dev:client
# or
cd apps/client && npm run dev

# Start only server (Express)
npm run dev:server
# or
cd apps/server && npm run dev
```

### Building
```bash
# Client
cd apps/client && npm run build

# Server
cd apps/server && npm run build
```

### Testing
```bash
# Run Jest tests (client)
cd apps/client && npm test

# Run linting
cd apps/client && npm run lint
```

### Database
All database changes are made via SQL scripts in the `supabase/` directory:
- Apply schema: Copy `supabase/schema.sql` to Supabase Dashboard → SQL Editor → Run
- Add categories: Copy `supabase/add_categories.sql` → Run
- Storage policies: Copy `supabase/storage_policies.sql` → Run

## Architecture

### Client-Server Communication Pattern

**Critical**: The frontend communicates **directly with Supabase**, not through the Express server. Security is enforced via Row Level Security (RLS) policies in Supabase.

```
Client (Next.js) → Supabase (PostgreSQL + Auth + Storage)
                      ↑
                      └─ RLS Policies enforce authorization
```

The Express server exists but is not used by the ZST Marketplace application.

### Multi-Language Implementation

The app supports English and Arabic without using next-intl (despite it being in package.json):
- **English routes**: `/`, `/login`, `/signup`, `/product/[id]`, etc.
- **Arabic routes**: `/ar/login`, `/ar/signup`, etc. (duplicated pages with RTL and Arabic text)
- **Pattern**: Separate route folders with hardcoded translations, no i18n library

### Role-Based Access Control

**User Roles**: `importer`, `wholesaler`, `retailer`, `admin`

**Hierarchical B2B Model**:
1. Importers create listings targeting wholesalers (`target_role='wholesaler'`)
2. Wholesalers create listings targeting retailers (`target_role='retailer'`)
3. Retailers create listings targeting customers (`target_role='customer'`)

**Authorization Layers**:
- **Database**: RLS policies on all tables
- **Frontend**: Role checks via `useAuth()` hook
- **Admin Functions**: Use `SECURITY DEFINER` to prevent infinite recursion in RLS

### Authentication Architecture

Two Supabase clients exist side-by-side:

**1. Client-Side (`apps/client/src/lib/supabase.ts`)**
```typescript
// For client components and browser usage
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.from('table').select()
```

**2. Server-Side (`apps/client/src/lib/supabase-server.ts`)**
```typescript
// For Server Components only
import { createServerComponentClient } from '@/lib/supabase-server'
const supabase = await createServerComponentClient()
const { data } = await supabase.from('table').select()
```

**Auth State Management**:
- `AuthContext` provides global auth state: `{ user, profile, loading, signOut, refreshProfile }`
- Session stored in localStorage with key `'zst-auth-token'`
- Profile data fetched from `profiles` table on auth state change
- Profile includes `role`, `balance`, `due_amount`, `business_name`

### Page Patterns

**Server Component with ISR** (Homepage pattern):
```typescript
// apps/client/src/app/page.tsx
export const revalidate = 300 // ISR: revalidate every 5 minutes

async function getData() {
  const supabase = await createServerComponentClient()
  const { data } = await supabase.from('listings').select('*, product:products(*)')
  return data
}

export default async function Page() {
  const listings = await getData()
  return <HomePageClient initialData={listings} />
}
```

**Client Component** (Interactive pages):
```typescript
"use client"
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const [listings, setListings] = useState([])

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('listings').select('*')
      setListings(data || [])
    }
    fetchData()
  }, [])

  if (loading) return <AuthLoadingSpinner />
  if (!user || profile?.role !== 'admin') return <div>Access denied</div>

  return <div>...</div>
}
```

### Database Schema Critical Points

**RLS Infinite Recursion Prevention**:
Always use the `public.is_admin()` helper function for admin checks in RLS policies:

```sql
-- CORRECT: Uses security definer function
CREATE POLICY "Admins can do X" ON table_name
  FOR ALL USING (public.is_admin());

-- WRONG: Direct check causes infinite recursion
CREATE POLICY "Admins can do X" ON table_name
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Profile Auto-Creation**:
A database trigger automatically creates a `profiles` record when a user signs up via `auth.users`:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Key Tables**:
- `profiles` - User profiles with roles and business info
- `categories` - Product categories
- `products` - Master product definitions
- `listings` - Products for sale (price, stock, target_role)
- `orders_b2c`, `order_items_b2c` - Customer orders
- `orders_b2b`, `order_items_b2b` - Business orders

### Image Upload Pattern

Images are uploaded to Supabase Storage bucket `product_images`:

```typescript
async function uploadImage(file: File) {
  const ext = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}-${Math.random()}.${ext}`

  const { data, error } = await supabase.storage
    .from('product_images')
    .upload(fileName, file)

  const { data: { publicUrl } } = supabase.storage
    .from('product_images')
    .getPublicUrl(fileName)

  return publicUrl
}
```

**Next.js Image Configuration**:
The `next.config.ts` allows images from Supabase storage:
```typescript
images: {
  remotePatterns: [{
    protocol: 'https',
    hostname: 'ukkgmqvappkeqgdrbsar.supabase.co',
    pathname: '/storage/v1/object/public/**',
  }]
}
```

### Caching Strategy

- **ISR**: Homepage uses `export const revalidate = 300` (5 minutes)
- **On-Demand Revalidation**: `/api/revalidate?secret=TOKEN&path=/` endpoint
- **No force-dynamic**: Removed from pages to enable caching optimizations (see git commits)

## Component Organization

### Header Navigation (Context-Aware)

The `Header.tsx` component conditionally renders based on current route:
- Hides on `/admin/*` routes (admin has its own header)
- Shows business header on `/business/*` routes
- Shows public header elsewhere

```typescript
const pathname = usePathname()
if (pathname.startsWith('/admin')) return null
if (pathname.startsWith('/business')) return <BusinessHeader />
return <PublicHeader />
```

### Business Components

Located in `apps/client/src/components/business/`:
- `Sidebar.tsx` - Navigation with balance/due amounts
- `TopHeader.tsx` - Action buttons (reset functionality)
- `GetStarted.tsx` - Onboarding guide for new sellers
- `OverviewDashboard.tsx` - Charts and metrics

## Key Implementation Patterns

### Role-Based Listing Visibility

```typescript
// Auto-assign target_role based on seller's role
const targetRole = profile.role === 'retailer' ? 'customer'
                 : profile.role === 'wholesaler' ? 'retailer'
                 : 'wholesaler' // importer

// Query with role filtering
const { data } = await supabase
  .from('listings')
  .select('*, product:products(*)')
  .eq('target_role', getMyBuyerRole(profile.role))
```

### Protected Route Pattern

```typescript
const { user, profile, loading } = useAuth()

if (loading) return <AuthLoadingSpinner />
if (!user) {
  redirect('/login')
  return null
}
if (profile?.role !== 'admin') {
  return <div>Access denied</div>
}

// Render protected content
```

### Order Creation (B2C Example)

```typescript
// 1. Create order record
const { data: order } = await supabase
  .from('orders_b2c')
  .insert({
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    total_amount,
    status: 'pending'
  })
  .select()
  .single()

// 2. Create order items
const items = cart.map(item => ({
  order_id: order.id,
  listing_id: item.listing_id,
  quantity: item.quantity,
  price: item.price
}))
await supabase.from('order_items_b2c').insert(items)

// 3. Update listing stock
for (const item of cart) {
  await supabase.rpc('decrement_stock', {
    listing_id: item.listing_id,
    quantity: item.quantity
  })
}
```

## Type System

### Database Types

Two type definition files exist:
- `apps/client/src/lib/database.types.ts` - Supabase-generated types (auto-generated)
- `apps/client/src/types/database.ts` - Application-specific types and interfaces

**Extended Types Pattern**:
```typescript
// Base Supabase type
import { Database } from '@/lib/database.types'
type Listing = Database['public']['Tables']['listings']['Row']

// Extended application type
export interface ListingWithProduct extends Listing {
  product: Product
}

export interface OrderB2CWithItems extends OrderB2C {
  items: (OrderItemB2C & { listing: ListingWithProduct })[]
}
```

### Shared Package Types

The `packages/types` package exports Zod schemas for validation:
```typescript
import { MapGraphSchema, MapNodeSchema } from '@neurocanvas/types'
```

Note: These types are used by the legacy voice/AI server, not the ZST Marketplace.

## Environment Variables

**Client** (`apps/client/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
REVALIDATION_SECRET=your-secret
```

**Server** (`apps/server/.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Documentation Files

- `README.md` - Basic project overview (mentions TRAVoices, outdated)
- `QUICKSTART.md` - 5-minute setup guide for new developers
- `SUPABASE_SETUP.md` - Database configuration instructions
- `CONFIGURATION_SUMMARY.md` - Complete technical documentation
- `docs/coding-standards.md` - TypeScript, naming, and code style rules
- `docs/dod.md` - Definition of Done checklist
- `docs/repo-setup.md` - Repository setup and workflows

## Coding Standards (Summary)

From `docs/coding-standards.md`:
- **TypeScript strict mode** - No `any` except in typed escape hatches
- **Naming**: Functions are verbs (e.g., `handleSubmit`), variables are nouns
- **Control flow**: Prefer early returns and guard clauses over deep nesting
- **Styling**: Tailwind CSS for all styling
- **Accessibility**: ARIA labels, keyboard navigation, focus states
- **Error handling**: Typed errors, actionable messages, no silent failures
- **Security**: Validate inputs with Zod, enforce RLS, never commit secrets

## Common Development Tasks

### Adding a New Feature/Page

1. Create page in `apps/client/src/app/[route]/page.tsx`
2. If interactive, create companion `PageClient.tsx` with `"use client"`
3. Add types to `apps/client/src/types/database.ts` if needed
4. Update database schema in `supabase/schema.sql` if database changes needed
5. Apply schema changes in Supabase Dashboard SQL Editor
6. Update RLS policies to match access requirements
7. Test with different user roles (admin, importer, wholesaler, retailer)

### Adding a New User Role Check

1. Update `UserRole` type in `apps/client/src/types/database.ts`
2. Add helper function in `apps/client/src/lib/auth.ts`
3. Update `is_admin()` or create new security definer function in database
4. Add RLS policies for the new role
5. Update UI components to check the new role

### Modifying RLS Policies

**CRITICAL**: Always use `public.is_admin()` for admin checks to avoid infinite recursion.

1. Edit `supabase/schema.sql`
2. Drop existing policy: `DROP POLICY IF EXISTS "policy_name" ON table_name;`
3. Create new policy with proper `USING` and `WITH CHECK` clauses
4. Run updated schema in Supabase Dashboard SQL Editor

### Testing Authentication Flows

**Create test accounts**:
- **Admin**: Signup normally, then manually update `profiles.role = 'admin'` in Supabase
- **Business**: Use `/business/signup` and select role during registration
- **Customer**: No account needed for B2C browsing/checkout

## Known Issues & Gotchas

1. **Express server exists but is unused** - The server has voice/AI endpoints that are not connected to the ZST Marketplace frontend
2. **README describes wrong project** - Mentions TRAVoices voice translation, but code is ZST Marketplace
3. **next-intl installed but not configured** - Multi-language support is manual (duplicated pages)
4. **No centralized API layer** - All database access is direct from components via Supabase client
5. **RLS infinite recursion** - Always use `public.is_admin()` helper function, never inline admin checks
6. **Image paths must be configured** - Update `next.config.ts` remotePatterns if Supabase URL changes
7. **Profile creation depends on trigger** - Ensure `handle_new_user()` trigger exists before allowing signups

## Git Workflow

Recent commits show focus on:
- Server-side Supabase client error handling
- Removing `force-dynamic` exports for caching optimizations
- Wrapping `useSearchParams` in Suspense boundaries
- ISR with on-demand revalidation

When making changes, follow the pattern of enabling caching where possible and using proper error boundaries for async operations.
