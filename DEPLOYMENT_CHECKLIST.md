# 🚀 Production Deployment Checklist
## ZST Marketplace

Use this checklist before deploying to production. Check off each item as you complete it.

---

## Pre-Deployment (Development)

### Database & Security
- [ ] **Apply Security Migration**
  - Open Supabase Dashboard → SQL Editor
  - Run `supabase/migrations/20251111200000_fix_security_and_performance.sql`
  - Verify no errors in execution

- [ ] **Enable Password Leak Protection**
  - Dashboard → Authentication → Policies
  - Enable "Check for breached passwords"

- [ ] **Verify RLS Policies**
  - Dashboard → Database → Advisors
  - Confirm 0 security warnings
  - Confirm 0 "multiple permissive policies" warnings

### Code Fixes
- [ ] **Fix TypeScript Errors (28 total)**
  - Add null checks for supabase client in:
    - `contexts/OptimizedAuthContext.tsx`
    - `app/importer/offers/page.tsx`
    - `app/importer/orders/page.tsx`
    - `hooks/useListings.ts`
    - `hooks/useOrders.ts`
  - Fix order status enum mismatches in `app/importer/orders/page.tsx`
  - Fix import in `components/ProtectedRoute.tsx`
  - Install Jest types: `npm install --save-dev @types/jest`

- [ ] **Remove Debug Code**
  - Delete `apps/client/src/app/api/debug-profile/route.ts`
  - Review and remove/replace console.log in 22 files (see full list in report)

- [ ] **Add Error Boundaries**
  - Create `apps/client/src/app/error.tsx`
  - Add to critical route segments if needed

- [ ] **Create Environment Template**
  - Create `apps/client/.env.example` with required variables
  - Document all environment variables

### Build & Test
- [ ] **Clean Build**
  ```bash
  cd apps/client
  rm -rf .next
  npm run build
  ```
  - Verify build completes without errors
  - No TypeScript compilation errors
  - No build warnings

- [ ] **Test All User Flows**
  - [ ] Anonymous user browsing and checkout (COD)
  - [ ] Retailer signup and login
  - [ ] Wholesaler signup and login
  - [ ] Importer signup and login
  - [ ] Admin login and user management
  - [ ] Create listing as each business role
  - [ ] Place B2C order
  - [ ] View orders for each role

- [ ] **Test Authentication**
  - [ ] Signup flow
  - [ ] Login flow
  - [ ] Logout flow
  - [ ] Password reset
  - [ ] Profile creation on signup

---

## Deployment Configuration

### Environment Variables
- [ ] **Set Production Environment Variables**
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://ukkgmqvappkeqgdrbsar.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
  REVALIDATION_TOKEN=<generate-strong-token>
  ```
  - Generate secure token: `openssl rand -hex 32`
  - Never commit tokens to git

### Supabase Configuration
- [ ] **Storage Configuration**
  - Verify `product_images` bucket exists
  - Confirm storage policies are correct
  - Test image upload functionality

- [ ] **Auth Configuration**
  - Set site URL to production domain
  - Configure redirect URLs
  - Set JWT expiry settings
  - Enable email confirmations (if needed)

### Hosting Platform (Vercel/Netlify/etc.)
- [ ] **Configure Build Settings**
  - Build command: `npm run build`
  - Output directory: `apps/client/.next`
  - Node version: 20.x or higher

- [ ] **Set Environment Variables**
  - Copy all variables from `.env.local`
  - Verify no typos in variable names

- [ ] **Configure Domain**
  - Set up custom domain
  - Configure SSL/TLS
  - Set up redirects (www → non-www or vice versa)

---

## Post-Deployment Verification

### Immediate Checks (Within 5 minutes)
- [ ] **Homepage Loads**
  - Visit production URL
  - Verify no errors in browser console
  - Check that products/listings load

- [ ] **Authentication Works**
  - Test signup with new email
  - Verify email in Supabase Auth users
  - Test login with created account
  - Verify profile created in profiles table

- [ ] **Database Connections**
  - Check Supabase Dashboard → Logs
  - Verify no connection errors
  - Confirm queries are executing

### Functional Testing (Within 30 minutes)
- [ ] **Customer Flow**
  - Browse products
  - Add to cart
  - Complete checkout (COD)
  - Verify order in database

- [ ] **Business User Flow**
  - Login as retailer/wholesaler/importer
  - View relevant listings
  - Create new listing
  - Upload product image
  - Verify listing appears

- [ ] **Admin Flow**
  - Login as admin
  - View users table
  - Manage orders
  - Update order statuses

### Performance Checks
- [ ] **Page Load Times**
  - Homepage < 2 seconds
  - Product pages < 1.5 seconds
  - Dashboard pages < 2 seconds

- [ ] **ISR Caching**
  - Test revalidation endpoint: `/api/revalidate?secret=<token>&path=/`
  - Verify cache headers
  - Check stale-while-revalidate behavior

- [ ] **Image Loading**
  - Images load from Supabase CDN
  - Next.js Image optimization working
  - No broken image links

### Security Verification
- [ ] **RLS Policies Working**
  - Non-logged users can't access protected data
  - Users can only see their own data
  - Admin can see all data

- [ ] **API Route Protection**
  - Revalidation endpoint requires secret
  - No exposed debug endpoints
  - Proper error handling (no data leaks)

- [ ] **HTTPS Enabled**
  - Force HTTPS redirect
  - Valid SSL certificate
  - No mixed content warnings

---

## Monitoring Setup

### Error Tracking
- [ ] **Set Up Error Monitoring**
  - Install Sentry or similar
  - Configure source maps
  - Test error reporting

### Performance Monitoring
- [ ] **Set Up Performance Tracking**
  - Enable Vercel Analytics (if using Vercel)
  - Or set up Google Analytics
  - Monitor Core Web Vitals

### Database Monitoring
- [ ] **Supabase Monitoring**
  - Check Database Health metrics
  - Set up usage alerts
  - Monitor query performance

### Logging
- [ ] **Application Logs**
  - Replace console.log with proper logger
  - Configure log aggregation
  - Set up log retention policy

---

## Backup & Recovery

### Database Backups
- [ ] **Enable Automatic Backups**
  - Supabase Pro plan includes daily backups
  - Verify backup schedule
  - Test restore process

### Configuration Backups
- [ ] **Document Configuration**
  - Export RLS policies
  - Save Supabase configuration
  - Document environment variables

### Rollback Plan
- [ ] **Create Rollback Procedure**
  - Document steps to revert deployment
  - Keep previous version accessible
  - Test rollback in staging

---

## Communication

### Stakeholders
- [ ] **Notify Team**
  - Share production URL
  - Provide login credentials for testing
  - Share this checklist completion status

### Users (If applicable)
- [ ] **Prepare User Communication**
  - Announcement of launch
  - Known limitations
  - Support contact information

---

## Post-Launch Monitoring (First 24 Hours)

### Hour 1
- [ ] Monitor error rates
- [ ] Check user signups
- [ ] Verify order creation works
- [ ] Watch database metrics

### Hour 6
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify no memory leaks
- [ ] Monitor API response times

### Hour 24
- [ ] Full system health check
- [ ] Review all metrics
- [ ] Address any issues found
- [ ] Plan fixes for next release

---

## Notes

**Deployment Date:** _______________
**Deployed By:** _______________
**Production URL:** _______________
**Issues Found:**
-
-
-

**Rollback Required:** ☐ Yes ☐ No
**Rollback Reason:** _______________

---

## Quick Command Reference

```bash
# Generate secure token
openssl rand -hex 32

# Clean build
cd apps/client
rm -rf .next node_modules
npm install
npm run build

# Test locally
npm run dev

# Check TypeScript
npx tsc --noEmit

# Test database connection
# Use Supabase Dashboard → SQL Editor:
SELECT current_user, current_database();

# Test RLS
# Supabase Dashboard → Database → Advisors
```

---

**✅ All items checked?** You're ready for production!

**⚠️ Any items unchecked?** Review the Production Readiness Report for details on how to complete them.

