# Deployment Guide: ZST Marketplace to Vercel & Supabase

## Prerequisites
- Your GitHub repository is up to date with the latest changes
- You need a Vercel account (sign up at https://vercel.com)
- You need a Supabase account (sign up at https://supabase.com)

**Note**: The Express server in `apps/server/` contains legacy code and is not required for the ZST Marketplace deployment.

---

## Part 1: Supabase Setup

### 1. Create a New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Choose your organization
4. Fill in:
   - **Project Name**: `neurocanvas-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"** (this takes ~2 minutes)

### 2. Set Up the Database Schema
1. Once the project is created, go to **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Copy and paste the entire contents from your local file: `supabase/schema.sql`
4. Click **"Run"** to execute the SQL
5. Verify: Go to **Table Editor** and you should see these tables:
   - `profiles`
   - `categories`
   - `products`
   - `listings`
   - `orders_b2c`, `order_items_b2c`
   - `orders_b2b`, `order_items_b2b`

### 3. Get Your Supabase Credentials
1. Go to **Project Settings** (gear icon at bottom left)
2. Click **API** section
3. Copy these values (you'll need them for Vercel):
   - **Project URL** (e.g., https://xxxxx.supabase.co)
   - **anon public** key (under "Project API keys")
   - **service_role** key (keep this secret!)

### 4. Configure Authentication
1. Go to **Authentication** > **Providers** in the left sidebar
2. Enable **Email** provider (should be enabled by default)
3. Optional: Configure other providers (Google, GitHub, etc.)
4. Go to **Authentication** > **URL Configuration**
5. Add your site URL (you'll update this after Vercel deployment):
   - Site URL: `http://localhost:3000` (temporary)
   - Redirect URLs: `http://localhost:3000/auth/callback` (temporary)

### 5. Set Up Storage (for Product Images)
1. Go to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Create a bucket named: `product_images`
4. Set it as **Public bucket**
5. Apply the storage policies from `supabase/storage_policies.sql` in SQL Editor

---

## Part 2: Vercel Deployment

### 1. Deploy the Client App
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** > **"Project"**
3. Import your GitHub repository
4. Click **"Import"**

### 2. Configure Build Settings
When configuring the project:

**Framework Preset**: Next.js

**Root Directory**: Click **"Edit"** and enter:
```
apps/client
```

**Build Command**: (leave default)
```
npm run build
```

**Output Directory**: (leave default)
```
.next
```

**Install Command**: (leave default)
```
npm install
```

### 3. Add Environment Variables
Click on **"Environment Variables"** and add these:

#### Required Variables:

```bash
# Supabase (from Part 1, Step 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Revalidation (for ISR on-demand revalidation)
REVALIDATION_SECRET=your_random_secret_string
```

**Important Notes:**
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Generate a strong random string for `REVALIDATION_SECRET`
- The Express server is not required for ZST Marketplace

### 4. Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (~2-5 minutes)
3. You'll get a deployment URL like: `https://your-project.vercel.app`

### 5. Update Supabase URLs
1. Go back to your Supabase Dashboard
2. Go to **Authentication** > **URL Configuration**
3. Update:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: Add these (one per line):
     ```
     https://your-project.vercel.app/auth/callback
     https://your-project.vercel.app/login
     https://your-project.vercel.app
     ```

---

## Part 3: Verify Deployment

### Test Core Features:

1. **B2C Homepage**: Visit `https://your-project.vercel.app`
   - Should load with product listings
   - Browse products and categories

2. **B2C Checkout**:
   - Click on a product
   - Add to cart and proceed to checkout
   - Complete a Cash-on-Delivery order

3. **Authentication**:
   - Go to `/business/signup`
   - Create a business account (choose role: importer, wholesaler, or retailer)
   - Verify email authentication works

4. **Business Dashboard**:
   - Login at `/business/login`
   - Check that dashboard shows appropriate products based on role
   - Go to "My Listings" and create a product listing
   - Upload a product image

5. **Admin Panel**:
   - Manually set a user to admin role in Supabase
   - Visit `/admin/dashboard`
   - Test user, product, and order management

6. **Database & Storage**:
   - Go to Supabase Dashboard > Table Editor
   - Check that data is being saved (profiles, listings, orders)
   - Go to Storage and verify product images are uploaded

---

## Part 4: Custom Domain (Optional)

### Add a Custom Domain in Vercel:
1. Go to your project settings in Vercel
2. Click **"Domains"**
3. Add your domain (e.g., `zstmarketplace.com`)
4. Follow DNS configuration instructions
5. Update Supabase redirect URLs with the new domain
6. Update `next.config.ts` if using a different Supabase project URL for images

---

## Troubleshooting

### Build Fails:
- Check build logs in Vercel
- Ensure all environment variables are set
- Verify the root directory is correct: `apps/client`

### Authentication Issues:
- Verify Supabase URL and keys are correct
- Check that redirect URLs are properly configured in Supabase
- Ensure the Site URL matches your deployed domain
- Check that `auth.users` trigger creates profiles automatically

### Image Upload Issues:
- Verify storage bucket `product_images` is created and public
- Check that storage policies allow authenticated uploads
- Ensure `next.config.ts` has correct Supabase hostname in `remotePatterns`
- Check browser console for CORS or upload errors

### Database Connection Issues:
- Check Supabase service status
- Verify the database schema was executed successfully
- Check that Row Level Security (RLS) policies are enabled
- Ensure `public.is_admin()` function exists (prevents RLS infinite recursion)

### Role-Based Access Issues:
- Verify users have correct roles in profiles table
- Check RLS policies allow proper access for each role
- Test with different user roles (importer, wholesaler, retailer, admin)

---

## Post-Deployment Checklist

- [ ] B2C homepage loads with products
- [ ] Product detail pages work
- [ ] Checkout flow completes successfully
- [ ] Business signup/login works
- [ ] Email verification works
- [ ] Business dashboard shows role-appropriate products
- [ ] Can create product listings
- [ ] Image uploads work to Supabase Storage
- [ ] Admin panel accessible (with admin role)
- [ ] Orders are saved to database
- [ ] Data persists in Supabase
- [ ] RLS policies enforce correct access
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up (Vercel Analytics)

---

## Environment Variables Reference

### Client (Vercel - apps/client):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
REVALIDATION_SECRET=your_random_secret
```

**Note**: The Express server in `apps/server/` is not required for ZST Marketplace deployment.

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS Docs**: https://tailwindcss.com/docs

---

## Next Steps After Deployment

1. **Monitor Usage**: Set up Vercel Analytics
2. **Set Up Alerts**: Configure Supabase monitoring for database issues
3. **Backup Database**: Set up automated backups in Supabase
4. **Performance**: Optimize images and enable Next.js Image Optimization
5. **SEO**: Add metadata, Open Graph tags, and sitemap
6. **Testing**: Test all user flows (B2C, B2B, Admin) on production
7. **Documentation**: Update README with live URL
8. **Payment Integration**: Add payment gateway (Stripe/PayPal) beyond COD
9. **Email Notifications**: Set up transactional emails for orders
10. **Analytics**: Add business analytics dashboard

---

**Congratulations! Your ZST Marketplace is now live!** 🎉

