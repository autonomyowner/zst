# Codebase Cleanup Report - ZST Marketplace

## Executive Summary

This report identifies all pages, routes, directories, and components that are old, unused, or no longer relevant to the current ZST Marketplace application. The codebase contains remnants from an earlier project iteration (TRAVoices - a voice translation platform) and has some duplicated/unused pages.

---

## 1. MINDMAP & TRAVOICE REFERENCES

No direct mindmap or travoice references found in the **client** codebase. However, the **server** contains extensive legacy code:

### Server Express Backend (apps/server/src/)

**Files with Legacy Voice/AI Code:**
- `apps/server/src/index.ts` - Contains:
  - Real-time voice session endpoints (SSE-based)
  - Mindmap/graph generation for voice transcripts
  - Mock voice-to-map generation logic
  - References to `MapGraphSchema` and `MapNodeSchema` from `@neurocanvas/types`
  - Endpoints for AI-powered reasoning/mapping

- `apps/server/src/ai.ts` - Contains:
  - `generateMapWithAI()` function
  - `transcribeAudio()` function
  - Mock OpenAI/Whisper integration stubs
  - Map generation with emotion/action classification

**Status:** These endpoints are not connected to the ZST Marketplace frontend. The Express server is not used by the application.

---

## 2. EMPTY & UNUSED DIRECTORIES

These directories exist but contain no files:

| Directory | Path | Status |
|-----------|------|--------|
| **onboarding** | `apps/client/src/app/onboarding/` | Empty directory (created Oct 27) |
| **vision** | `apps/client/src/app/vision/` | Empty directory (created Oct 27) |
| **ar/vision** | `apps/client/src/app/ar/vision/` | Empty directory (created Oct 27) |

**Recommendation:** Delete these directories - they're remnants from the TRAVoices project.

---

## 3. PLACEHOLDER/INCOMPLETE PAGES

| Page | Path | Content | Status |
|------|------|---------|--------|
| **Services** | `apps/client/src/app/services/page.tsx` | Placeholder with generic "Service 1, 2, 3" cards | **DELETE** |

---

## 4. LOGIN PAGES ANALYSIS

There are **4 separate login page implementations**:

### Public Login (for customers/general users)
- **File:** `apps/client/src/app/login/page.tsx`
- **Status:** ACTIVE & MAINTAINED
- **Uses:** `OptimizedAuthContext`, email + OAuth (Google/GitHub)

### Business Login (for sellers/businesses)
- **File:** `apps/client/src/app/business/login/page.tsx`
- **Status:** ACTIVE & MAINTAINED
- **Uses:** `OptimizedAuthContext`, basic email/password

### Admin Login
- **File:** `apps/client/src/app/admin/login/page.tsx`
- **Status:** ACTIVE & MAINTAINED
- **Checks:** Verifies `profiles.role === 'admin'` before allowing access

### Arabic Login
- **File:** `apps/client/src/app/ar/login/page.tsx`
- **Status:** ACTIVE & MAINTAINED
- **Content:** Arabic translations with RTL layout

**Assessment:** All 4 login pages are necessary and serve different purposes. No duplicates to remove.

---

## 5. OLD/BACKUP FILES TO DELETE

| File | Path | Reason |
|------|------|--------|
| **AuthContext Backup** | `apps/client/src/contexts/AuthContext.tsx.backup` | Superseded by `OptimizedAuthContext.tsx` |
| **Webpack Cache** | `.next/cache/webpack/client-production/index.pack.old` | Build cache |
| **Webpack Cache** | `.next/cache/webpack/server-production/index.pack.old` | Build cache |

---

## 6. CLEANUP ACTION ITEMS

### IMMEDIATE DELETE

1. **File:** `apps/client/src/app/services/page.tsx`
   - Reason: Placeholder page with no real content
   - Impact: None - page is not linked anywhere

2. **Directory:** `apps/client/src/app/onboarding/`
   - Reason: Empty directory from legacy project
   - Impact: None - no routes defined

3. **Directory:** `apps/client/src/app/vision/`
   - Reason: Empty directory from TRAVoices project
   - Impact: None - no routes defined

4. **Directory:** `apps/client/src/app/ar/vision/`
   - Reason: Empty directory from TRAVoices project
   - Impact: None - no routes defined

5. **File:** `apps/client/src/contexts/AuthContext.tsx.backup`
   - Reason: Old backup file, replaced by OptimizedAuthContext
   - Impact: None - not imported anywhere

### OPTIONAL (if removing Express server)

- `apps/server/src/ai.ts` - All voice/AI code
- Voice endpoints from `apps/server/src/index.ts` (lines 27-400+ estimated)
- `@neurocanvas/types` dependency (if only used by server)

---

## 7. SUMMARY STATISTICS

| Category | Count | Status |
|----------|-------|--------|
| Pages to DELETE | 1 | `services/page.tsx` |
| Empty directories to DELETE | 3 | onboarding, vision, ar/vision |
| Backup files to DELETE | 1 | AuthContext.tsx.backup |
| Login pages (KEEP) | 4 | All active |
| Dashboard pages (KEEP) | 7 | All active |
| Signup pages (KEEP) | 3 | All active |

**Total files/directories to remove: 5**

---

## Files to KEEP

All the following are active and in use:

- All 4 login pages
- All 3 signup pages
- All business components
- All admin pages
- All role-based dashboards (importer, wholesaler, retailer)
- All auth components (ProtectedRoute, AuthLoadingSpinner)
- All contexts (OptimizedAuthContext)
- All hooks (useListings, useOrders)
- API routes (debug-profile, revalidate)
