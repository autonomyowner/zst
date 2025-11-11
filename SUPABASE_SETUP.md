# Supabase Setup Instructions

## Configuration Complete

Your ZST Marketplace application has been configured with the following Supabase credentials:

- **Project URL**: `https://wwvqkgnqcplzsxvlthib.supabase.co`
- **Anon Key**: Configured in environment files

## Next Steps

### 1. Apply Database Schema

You need to run the SQL schema in your Supabase project:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/wwvqkgnqcplzsxvlthib
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the contents of `supabase/schema.sql` file
5. Paste it into the SQL editor
6. Click **Run** to execute the schema

This will create the following tables:
- `users` - User profiles linked to auth.users
- `maps` - Mindmap data
- `map_versions` - Version history for maps
- `templates` - Mindmap templates
- `rooms` - Voice collaboration rooms

### 2. Configure Authentication Providers

#### Email Authentication (Magic Link)
Already enabled by default in Supabase.

#### OAuth Providers (Optional)

**For Google OAuth:**
1. Go to **Authentication > Providers** in Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Client Secret)
4. Set redirect URL: `https://wwvqkgnqcplzsxvlthib.supabase.co/auth/v1/callback`

**For GitHub OAuth:**
1. Go to **Authentication > Providers** in Supabase dashboard
2. Enable GitHub provider
3. Add your GitHub OAuth credentials
4. Set redirect URL: `https://wwvqkgnqcplzsxvlthib.supabase.co/auth/v1/callback`

### 3. Configure Email Templates (Optional)

Customize the magic link email template:
1. Go to **Authentication > Email Templates**
2. Edit the "Magic Link" template
3. Add your branding and customize the message

### 4. Environment Files

Your environment files have been configured:

**Client (.env.local):**
```
NEXT_PUBLIC_LIVEKIT_URL=wss://travcoies-9h1ntokz.livekit.cloud
LIVEKIT_API_KEY=APIJ3p9EvfKirbr
LIVEKIT_API_SECRET=VZMtypNewY4UVjb6DWEyqFz3GdDjfzhmVTneLfQcARVA

NEXT_PUBLIC_SUPABASE_URL=https://wwvqkgnqcplzsxvlthib.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Server (.env):**
```
PORT=4000
SUPABASE_URL=https://wwvqkgnqcplzsxvlthib.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
AI_PROVIDER=mock
```

### 5. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. **Test B2C Shopping**:
   - Visit `http://localhost:3000`
   - Browse products on the homepage
   - Test the checkout flow

3. **Test Business Portal**:
   - Navigate to `/business/signup` to create a business account
   - Check your email for the confirmation link
   - After confirming, log in at `/business/login`
   - Visit `/business/my-listings` to create product listings
   - Visit `/business/dashboard` to view available products based on your role

## Features Implemented

### Authentication
- ✅ Email/password authentication
- ✅ OAuth support (Google, GitHub - optional)
- ✅ Role-based access control (importer, wholesaler, retailer, admin)
- ✅ Auth callback handling
- ✅ Session persistence
- ✅ Protected routes

### E-Commerce Features
- ✅ B2C public shopping with COD checkout
- ✅ B2B hierarchical marketplace
- ✅ Product listings with inventory management
- ✅ Image uploads to Supabase Storage
- ✅ Order management (B2C and B2B)
- ✅ Admin panel for platform management

### Database Structure
- ✅ User profiles with roles
- ✅ Products and categories
- ✅ Listings with stock tracking
- ✅ B2C and B2B orders
- ✅ Row Level Security (RLS) policies
- ✅ Security definer functions to prevent infinite recursion

## API Routes

### Next.js API Routes
- `POST /api/revalidate` - On-demand ISR revalidation
- Direct Supabase access from components (no traditional REST API layer)

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access data appropriate to their role
- Admin checks use `public.is_admin()` security definer function to prevent infinite recursion
- Hierarchical access control: Importers → Wholesalers → Retailers → Customers
- Product images stored in public Supabase Storage bucket with upload restrictions

## Troubleshooting

### "Supabase is not configured" Error
- Ensure environment variables are set correctly
- Restart the development server after changing .env files

### Authentication Issues
- Check that the schema has been applied to your Supabase project
- Verify the Supabase URL and anon key are correct
- Check browser console for detailed error messages

### Listing Creation Issues
- Ensure you're logged in to a business account
- Check that the user has a valid role (importer, wholesaler, or retailer)
- Verify the database schema includes the listings and products tables
- Check that storage bucket `product_images` exists for image uploads

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Next.js Documentation](https://nextjs.org/docs)

