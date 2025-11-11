# ZST Marketplace - Quick Start Guide

## Get Up and Running in 5 Minutes

This guide will help you set up the ZST Marketplace development environment quickly.

### Step 1: Apply Database Schema (2 minutes)

1. Go to your Supabase project: https://supabase.com/dashboard/project/wwvqkgnqcplzsxvlthib
2. Click **SQL Editor** in the sidebar
3. Create a new query
4. Copy ALL contents from `supabase/schema.sql`
5. Paste and click **Run**

✅ You should see "Success. No rows returned"

### Step 2: Enable OAuth Providers (Optional - 3 minutes)

**For Email Only:**
Skip this step - email auth is already enabled!

**For Google/GitHub OAuth:**
1. Go to **Authentication > Providers**
2. Enable your desired provider
3. Add OAuth credentials from Google/GitHub Console
4. Save changes

### Step 3: Start Your App (30 seconds)

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Step 4: Test It Out!

**Test B2C Shopping (Public)**:
1. Open http://localhost:3000
2. Browse products on the homepage
3. Click on a product to see details
4. Click **Checkout** and fill in your information
5. Complete a Cash-on-Delivery order

**Test B2B Business Portal**:
1. Navigate to http://localhost:3000/business/signup
2. Create a business account (choose your role: importer, wholesaler, or retailer)
3. Check your email for confirmation link
4. Log in at http://localhost:3000/business/login
5. Go to **My Listings** to create products for sale
6. Go to **Dashboard** to see available products to purchase (based on your role)

**Test Admin Panel**:
1. Sign up normally, then manually update your profile in Supabase:
   - Go to Supabase Dashboard → Table Editor → profiles
   - Find your user and set `role = 'admin'`
2. Visit http://localhost:3000/admin/dashboard
3. Manage users, products, categories, and orders

---

## What You Just Set Up

### Authentication ✅
- Email/password signup and login
- OAuth providers (Google, GitHub - optional)
- Role-based access control (importer, wholesaler, retailer, admin)
- Session persistence with Supabase Auth

### B2C E-commerce ✅
- Public product browsing
- Product detail pages
- Cash-on-Delivery checkout
- Order tracking

### B2B Business Portal ✅
- Hierarchical product visibility (based on user role)
- Create and manage product listings
- Order placement between business tiers
- Business dashboard with analytics

### Admin Panel ✅
- User management (view, edit roles)
- Product and category management
- Order management (B2C and B2B)
- Platform statistics dashboard

---

## Common Commands

```bash
# Start dev server (client + server)
npm run dev

# Start only client
cd apps/client && npm run dev

# Start only server
cd apps/server && npm run dev

# Build for production
npm run build
```

---

## URLs to Bookmark

### Local Development
- **B2C Homepage**: http://localhost:3000
- **Business Signup**: http://localhost:3000/business/signup
- **Business Login**: http://localhost:3000/business/login
- **Business Dashboard**: http://localhost:3000/business/dashboard
- **My Listings**: http://localhost:3000/business/my-listings
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **Arabic Homepage**: http://localhost:3000/ar

### External Services
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ukkgmqvappkeqgdrbsar

---

## Quick Troubleshooting

**Can't sign up?**
- Check that schema was applied correctly
- Look for errors in Supabase dashboard logs

**Not receiving emails?**
- Check spam folder
- Verify email settings in Supabase > Authentication > Email Templates

**Listing creation fails?**
- Make sure you're logged in to a business account
- Check browser console for errors
- Verify schema includes listings and products tables
- Ensure you have a valid role (importer, wholesaler, or retailer)

**Can't see products in dashboard?**
- Check that listings have the correct target_role for your account
- Importers cannot buy (they only sell to wholesalers)
- Wholesalers see products from importers
- Retailers see products from wholesalers

---

## Next Steps

1. **Customize**: Update branding, colors, and text
2. **Integrate**: Connect mindmaps with voice rooms
3. **Deploy**: Push to Vercel or your hosting platform
4. **Scale**: Add more features from CONFIGURATION_SUMMARY.md

---

## Need Help?

Check these files for detailed information:
- `SUPABASE_SETUP.md` - Detailed Supabase configuration
- `CONFIGURATION_SUMMARY.md` - Complete technical documentation
- `README.md` - Project overview

---

## You're All Set! 🎉

Your ZST Marketplace is now configured with:
- ✅ Full authentication system with role-based access
- ✅ B2C e-commerce with COD checkout
- ✅ B2B business portal with hierarchical marketplace
- ✅ Admin panel for platform management
- ✅ Secure database with Row Level Security (RLS)
- ✅ Multi-language support (English/Arabic)

Start selling and trading!

