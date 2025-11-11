# Performance Enhancement Plan - ZST Marketplace

**Date:** 2025-11-11
**Project:** ZST Phase 1
**Supabase Project ID:** ukkgmqvappkeqgdrbsar

## Executive Summary

Multiple critical performance issues have been identified that are causing slow page loads across the application, particularly on business signup, login, and dashboard pages. The primary issues include:

1. **RLS Performance Issues** - 7 auth re-evaluation warnings affecting profiles, listings, products, and orders
2. **Multiple Permissive RLS Policies** - 72 redundant policies causing unnecessary query overhead
3. **Unused Indexes** - 6 indexes that consume resources but aren't utilized
4. **Complex Auth Flow** - Business signup has excessive retries and 2-second delays
5. **Missing Query Optimization** - No strategic use of React Query's caching capabilities
6. **Context Inconsistencies** - Two auth contexts used inconsistently across pages

---

## Critical Issues Breakdown

### 🔴 **Priority 1: RLS Auth Re-evaluation (CRITICAL)**

**Impact:** Every row access re-evaluates `auth.uid()` causing exponential performance degradation
**Affected Tables:** profiles, products, listings, orders_b2c, order_items_b2c
**Performance Cost:** 10-50ms per query → can become 500ms+ on large datasets

**Current Problem:**
```sql
-- ❌ BAD: Re-evaluates auth.uid() for EVERY row
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());
```

**Solution:**
```sql
-- ✅ GOOD: Evaluates auth.uid() ONCE
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = (SELECT auth.uid()));
```

**Tables Requiring Fixes:**
1. `profiles.profiles_select_own`
2. `profiles.profiles_update_own`
3. `products.products_insert_authenticated`
4. `listings.listings_manage_own`
5. `orders_b2c.orders_b2c_select_own`
6. `orders_b2c.orders_b2c_update_seller`
7. `order_items_b2c.order_items_b2c_select_own`

---

### 🔴 **Priority 2: Multiple Permissive Policies (HIGH)**

**Impact:** Multiple policies for same action = all policies must execute (3-4x query time)
**Affected:** 72 policy combinations across all major tables
**Performance Cost:** +100-300ms per query

**Current Problem:**
```sql
-- ❌ Multiple SELECT policies - ALL execute
CREATE POLICY "listings_manage_own" ON listings FOR SELECT ...
CREATE POLICY "listings_select_policy" ON listings FOR SELECT ...
CREATE POLICY "listings_select_retailer" ON listings FOR SELECT ...
CREATE POLICY "listings_select_wholesaler" ON listings FOR SELECT ...
```

**Solution:** Consolidate into single policies using OR conditions

**Most Critical Tables:**
- `listings` - 4 SELECT policies, 2 UPDATE, 2 INSERT, 2 DELETE
- `orders_b2c` - 4 SELECT policies, 3 UPDATE, 3 INSERT
- `profiles` - 2 SELECT policies, 2 UPDATE policies
- `products` - 2 INSERT policies

---

### 🟡 **Priority 3: Unused Indexes (MEDIUM)**

**Impact:** Storage waste + maintenance overhead on writes
**Affected:** 6 indexes consuming space but never used

**Indexes to Remove:**
1. `idx_listings_is_bulk_offer` on `listings`
2. `idx_orders_b2c_user_id` on `orders_b2c`
3. `idx_profiles_role` on `profiles`
4. `idx_listings_target_role` on `listings`
5. `idx_products_category_id` on `products`
6. `idx_order_items_b2c_order_id` on `order_items_b2c`
7. `idx_order_items_b2b_order_id` on `order_items_b2b`
8. `idx_orders_b2b_buyer_id` on `orders_b2b`

**Note:** Some may be needed if queries change. Recommend analyzing query patterns first.

---

### 🟡 **Priority 4: Business Signup Flow Issues (MEDIUM)**

**Impact:** 2-3 second signup delays + retry loops
**Location:** `apps/client/src/app/business/signup/page.tsx`

**Problems:**
- Hardcoded 2-second delay (`setTimeout(resolve, 2000)`)
- 3-attempt retry loop with 1-second delays
- Complex profile creation/update logic
- Excessive error checking

**Current Flow:**
1. Sign up user (Supabase Auth)
2. Wait 2 seconds for trigger
3. Retry loop (3 attempts x 1 second each)
4. Check profile exists
5. Insert OR update profile
6. Multiple session validations

**Recommended Approach:**
- Use database trigger + RPC function
- Remove artificial delays
- Simplify to single profile check
- Trust Supabase's auth state

---

### 🟡 **Priority 5: Auth Context Inconsistencies (MEDIUM)**

**Impact:** Confusion, inconsistent behavior, potential bugs
**Issue:** Two auth contexts used across app

**Current State:**
- `/business/login` → uses `OptimizedAuthContext`
- `/business/signup` → uses standard `AuthContext`
- `/business/dashboard` → uses `OptimizedAuthContext`

**Files:**
- `apps/client/src/contexts/AuthContext.tsx` (original)
- `apps/client/src/contexts/OptimizedAuthContext.tsx` (optimized with localStorage caching)

**Recommendation:** Standardize on `OptimizedAuthContext` everywhere

---

### 🟢 **Priority 6: Missing Query Optimization (LOW-MEDIUM)**

**Impact:** Unnecessary re-fetches, slower perceived performance
**Current State:** React Query hooks exist but not universally used

**Unused Optimizations:**
- `useMyListings()` hook exists but `my-listings` page uses manual `useEffect`
- `useSellerB2COrders()` available but dashboard uses manual fetch
- No strategic cache invalidation
- Missing real-time subscriptions on critical pages

---

## Implementation Plan

### Phase 1: RLS Optimization (Week 1)

**Estimated Time:** 4-6 hours
**Expected Performance Gain:** 40-60% on all queries

1. Create migration script for auth function optimization
2. Test on development branch
3. Apply to production with monitoring
4. Run performance benchmarks

**Migration Script:** `supabase/migrations/fix_rls_auth_performance.sql`

---

### Phase 2: Consolidate RLS Policies (Week 1-2)

**Estimated Time:** 6-8 hours
**Expected Performance Gain:** 30-50% on complex queries

1. Audit all RLS policies by table
2. Consolidate redundant policies using OR conditions
3. Test authorization logic thoroughly
4. Deploy incrementally (one table at a time)

**Migration Script:** `supabase/migrations/consolidate_rls_policies.sql`

---

### Phase 3: Index Cleanup (Week 2)

**Estimated Time:** 2-3 hours
**Expected Performance Gain:** Minimal runtime, improved write performance

1. Analyze pg_stat_user_indexes for actual usage
2. Remove truly unused indexes
3. Monitor query performance post-removal
4. Re-add if needed

---

### Phase 4: Frontend Optimizations (Week 2-3)

**Estimated Time:** 8-10 hours
**Expected Performance Gain:** 50-70% perceived performance

**Sub-tasks:**
1. Standardize on `OptimizedAuthContext`
2. Replace manual fetches with React Query hooks
3. Simplify business signup flow
4. Add strategic loading skeletons
5. Implement proper error boundaries

---

### Phase 5: Monitoring & Validation (Week 3)

**Estimated Time:** 4 hours
**Tools:** Supabase Dashboard, Vercel Analytics, Chrome DevTools

1. Set up performance monitoring
2. Track Core Web Vitals
3. Measure Time to Interactive (TTI)
4. Run Lighthouse audits
5. User testing on business flows

---

## Success Metrics

### Before Optimization (Baseline)
- Business signup: 4-6 seconds
- Dashboard initial load: 2-3 seconds
- Listings page: 1.5-2.5 seconds
- Database queries: 50-200ms average

### After Optimization (Targets)
- Business signup: **< 2 seconds**
- Dashboard initial load: **< 1 second**
- Listings page: **< 1 second**
- Database queries: **< 50ms average**

---

## Risk Assessment

### High Risk
- **RLS policy changes** - Could break authorization if not tested thoroughly
- **Multiple auth contexts** - Consolidation could introduce bugs

### Medium Risk
- **Index removal** - Could impact specific queries
- **Signup flow changes** - Profile creation could fail

### Low Risk
- **React Query migration** - Backwards compatible
- **Code cleanup** - Non-breaking changes

---

## Testing Strategy

### Unit Tests
- RLS policy tests with different user roles
- Auth context behavior tests
- Query hook tests

### Integration Tests
- Full signup flow (all roles)
- Dashboard data loading
- Profile creation/update

### Performance Tests
- Load testing with 100+ concurrent users
- Query performance benchmarks
- Real-time subscription stability

---

## Rollback Plan

1. **Database migrations** - Keep old policies until verified
2. **Code changes** - Use feature flags for gradual rollout
3. **Monitoring** - Set up alerts for error rate spikes
4. **Backups** - Snapshot database before major changes

---

## Quick Wins (Can Implement Today)

### 1. Fix Auth Re-evaluation (30 min)
```sql
-- Apply the (SELECT auth.uid()) pattern to 7 policies
-- Immediate 40% performance boost
```

### 2. Standardize Auth Context (1 hour)
```typescript
// Replace all imports:
// import { useAuth } from "@/contexts/AuthContext"
// with:
// import { useAuth } from "@/contexts/OptimizedAuthContext"
```

### 3. Use React Query Hooks (2 hours)
```typescript
// Replace manual useEffect + useState
// with existing optimized hooks
const { data: listings } = useMyListings(profile?.id)
```

### 4. Remove Signup Delays (30 min)
```typescript
// Remove: await new Promise(resolve => setTimeout(resolve, 2000))
// Trust the database trigger
```

---

## Long-term Recommendations

1. **Add Database Monitoring**
   - pg_stat_statements extension
   - Query performance tracking
   - Slow query logging

2. **Implement Caching Strategy**
   - Redis for frequently accessed data
   - CDN for static assets
   - Service worker for offline support

3. **Code Splitting**
   - Lazy load dashboard components
   - Dynamic imports for heavy libraries
   - Route-based code splitting

4. **Database Optimization**
   - Analyze query patterns quarterly
   - Regular VACUUM and ANALYZE
   - Connection pooling optimization

---

## Resources

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)

---

## Contact & Support

**Primary Developer:** Claude Code
**Database:** Supabase (Project: zst / ukkgmqvappkeqgdrbsar)
**Deployment:** Vercel (Next.js 15)

For questions or issues during implementation, refer to:
- CLAUDE.md (project guidelines)
- CONFIGURATION_SUMMARY.md (technical details)
- QUICK_PERFORMANCE_REFERENCE.md (optimization guide)
