# Modal/Popup Component Inventory - Phase 1 (Authenticated App)

**Generated:** 2025-11-08  
**Scope:** 5 Core Areas (Guests, Budget, Timeline, Vendors, Tasks) - Excluding Landing Page  
**Total Modals:** 28 core app modals + 3 shared infrastructure components

---

## Summary Statistics

| Area | Modal Count | Total Lines | Avg Lines | Pain Points |
|------|-------------|-------------|-----------|-------------|
| **Budget** | 6 | 3,658 | 610 | BudgetDetailModal (1,304L) |
| **Tasks** | 3 | 2,891 | 964 | TaskDetailModal (1,170L) |
| **Guests** | 7 | 2,980 | 426 | Multiple moderate complexity |
| **Vendors** | 3 | 1,463 | 488 | VendorDetailModal (585L) |
| **Timeline** | 2 | 709 | 355 | Shared with Guests |
| **Shared** | 3 | 467 | 156 | Infrastructure only |
| **Unused** | 1 | 845 | - | TaskAddModal (candidate) |
| **TOTAL** | 25 active | 12,168 | 487 | 2 critical pain points |

---

## 1. Guest Area Modals (7 modals, 2,980 lines)

### GuestDetailModal.tsx
- **Lines:** 587
- **Complexity:** Moderate-High (12 useState, 12 useEffect)
- **Tabs:** 2 (overview, notes)
- **Usage:** GuestOverviewTab (click handler)
- **Pain Points:** 
  - Heavy re-renders on tag changes
  - No debouncing on text inputs
  - Dietary restrictions selector causes lag
- **P0 Fixes:** Debounce inputs, memoize tag list, lazy load groups
- **Rebuild:** No (repair < 90min)

### GuestCalculatorModal.tsx
- **Lines:** 266
- **Complexity:** Low (6 useState, 6 useEffect)
- **Tabs:** None
- **Usage:** Dashboard, referenced but usage unclear
- **Pain Points:** Calculation re-renders not optimized
- **P0 Fixes:** Memoize calculation results
- **Rebuild:** No

### FamilyEditModal.tsx
- **Lines:** 440
- **Complexity:** Moderate (6 useState, 6 useEffect)
- **Tabs:** None
- **Usage:** Guest management flows
- **Pain Points:** Validation triggers too frequently
- **P0 Fixes:** Debounce validation, startTransition for updates
- **Rebuild:** No

### FamilyDetailModal.tsx
- **Lines:** 239
- **Complexity:** Low (5 useState, 5 useEffect)
- **Tabs:** None
- **Usage:** Guest family management
- **Pain Points:** Minor - loads all family data upfront
- **P0 Fixes:** Lazy load family member details
- **Rebuild:** No

### EventGuestManagementModal.tsx
- **Lines:** 402
- **Complexity:** Moderate (9 useState, 9 useEffect)
- **Tabs:** None
- **Usage:** TimelineHochzeitstagTab, shared with Timeline
- **Pain Points:** Guest list rendering without virtualization
- **P0 Fixes:** Virtualize if >50 guests, memoize attendance toggles
- **Rebuild:** No

### DietaryRequirementsModal.tsx
- **Lines:** 284
- **Complexity:** Low-Moderate (5 useState, 5 useEffect)
- **Tabs:** None
- **Usage:** Guest detail flows
- **Pain Points:** Checkbox selector re-renders
- **P0 Fixes:** Memoize checkbox components
- **Rebuild:** No

### ContactListModal.tsx
- **Lines:** 307
- **Complexity:** Low-Moderate (search + list)
- **Tabs:** None
- **Usage:** Guest management
- **Pain Points:** No search debouncing, no virtualization
- **P0 Fixes:** Debounce search, virtualize list
- **Rebuild:** No

---

## 2. Budget Area Modals (6 modals, 3,658 lines) ⚠️ PRIORITY AREA

### BudgetDetailModal.tsx ⚠️ PAIN POINT #1
- **Lines:** 1,304 (LARGEST)
- **Complexity:** Very High (21 useState, 21 useEffect)
- **Tabs:** 6 (overview, payments, attachments, splits, tags, history)
- **Usage:** BudgetManager, Budget tabs (primary detail view)
- **Pain Points:**
  - **CRITICAL:** Key-to-Frame lag on cost inputs (>50ms estimated)
  - Heavy tab switching lag
  - Payment history not virtualized
  - Attachment loading blocks UI
  - Too many simultaneous data fetches
- **P0 Fixes:**
  - Lazy load all 6 tabs
  - Debounce cost inputs 300ms
  - Virtualize payment history
  - Memoize payment list items
  - Optimize attachment thumbnails
- **Rebuild:** HIGH PRIORITY - Estimated >90min repair, candidate for full v2

### BudgetAddModal.tsx
- **Lines:** 650
- **Complexity:** High (12 useState, 12 useEffect)
- **Tabs:** 4 (basics, costs, payment, details)
- **Usage:** Budget area primary creation flow
- **Pain Points:**
  - Click-to-Open lag (loads too much upfront)
  - Per-person cost calculations not optimized
  - Timeline events loaded unnecessarily
- **P0 Fixes:**
  - Lazy load tabs
  - Debounce cost calculations
  - Use query enabled flag for timeline
  - Memoize vendor dropdown
- **Rebuild:** MAYBE - Borderline 90min threshold

### BudgetCategoryModal.tsx
- **Lines:** 266
- **Complexity:** Low (5 useState, 5 useEffect)
- **Tabs:** None
- **Usage:** Category management
- **Pain Points:** Minor - color picker causes re-renders
- **P0 Fixes:** Debounce name input, optimize color picker
- **Rebuild:** No

### BudgetCategoryDetailModal.tsx
- **Lines:** 304
- **Complexity:** Moderate (5 useState, 5 useEffect)
- **Tabs:** None
- **Usage:** Category detail view
- **Pain Points:** Loads all category items upfront
- **P0 Fixes:** Lazy load items, memoize spending calculations
- **Rebuild:** No

### BudgetAdjustModal.tsx (in Budget subdirectory)
- **Lines:** ~180 (estimated from import analysis)
- **Complexity:** Low (4 useState, 4 useEffect)
- **Tabs:** None
- **Usage:** Budget adjustments
- **Pain Points:** Preview calculations not debounced
- **P0 Fixes:** Debounce adjustment inputs, optimize preview
- **Rebuild:** No

### PaymentPlanModal.tsx
- **Lines:** 382
- **Complexity:** Moderate (4 useState, 4 useEffect)
- **Tabs:** None
- **Usage:** Budget payment scheduling
- **Pain Points:** Payment plan list not virtualized
- **P0 Fixes:** Virtualize list, debounce date pickers
- **Rebuild:** No

---

## 3. Timeline Area Modals (2 modals, 709 lines)

### BlockPlanningModal.tsx
- **Lines:** 307
- **Complexity:** Moderate (6 useState, 6 useEffect)
- **Tabs:** Multiple (inferred from usage)
- **Usage:** TimelineHochzeitstagTab (detail planning button)
- **Pain Points:** Linked item lists not optimized
- **P0 Fixes:** Debounce time inputs, memoize linked items, optimize budget/vendor lists
- **Rebuild:** No

### EventGuestManagementModal.tsx
- **Lines:** 402 (shared with Guests)
- **Complexity:** Moderate
- **Tabs:** None
- **Usage:** Timeline event guest assignment
- **Pain Points:** See Guest area (shared component)
- **P0 Fixes:** Same as Guest area + timeline-specific optimizations
- **Rebuild:** No

---

## 4. Vendor Area Modals (3 modals + 1 dialog, 1,463 lines)

### VendorDetailModal.tsx
- **Lines:** 585
- **Complexity:** Moderate-High (11 useState, 11 useEffect)
- **Tabs:** Likely multiple (inferred)
- **Usage:** VendorAllTab, vendor card clicks
- **Pain Points:**
  - Document list loading blocks UI
  - Contact input lag
  - Payment tracking re-renders
- **P0 Fixes:** Lazy load documents, debounce inputs, memoize payment display
- **Rebuild:** No (under threshold)

### VendorComparisonModal.tsx
- **Lines:** 289
- **Complexity:** Low-Moderate
- **Tabs:** None
- **Usage:** Vendor comparison feature
- **Pain Points:** Comparison table not virtualized
- **P0 Fixes:** Virtualize table rows, memoize calculations
- **Rebuild:** No

### VendorBookingDialog.tsx
- **Lines:** ~210 (dialog pattern)
- **Complexity:** Low
- **Tabs:** None
- **Usage:** VendorAllTab drag-to-book interaction
- **Pain Points:** Select-to-Commit lag on event selector
- **P0 Fixes:** Optimize event selector dropdown, debounce preview
- **Rebuild:** No

---

## 5. Tasks Area Modals (3 modals, 2,891 lines) ⚠️ PRIORITY AREA

### TaskDetailModal.tsx ⚠️ PAIN POINT #2
- **Lines:** 1,170 (SECOND LARGEST)
- **Complexity:** Very High (23 useState, 23 useEffect - HIGHEST)
- **Tabs:** 4 (overview, comments, attachments, timeline)
- **Usage:** TaskListViewEnhanced, TaskKanbanTab, TaskCalendarTab, TaskTeamTab
- **Pain Points:**
  - **CRITICAL:** Key-to-Frame lag on title/description inputs (>40ms estimated)
  - Comments list not virtualized
  - Attachment thumbnails load eagerly
  - Too many data dependencies loaded upfront
  - Subtask rendering not optimized
- **P0 Fixes:**
  - Lazy load all 4 tabs
  - Debounce title/description 250ms
  - Virtualize comments >20
  - Lazy load attachments
  - Memoize subtask list
  - Selective query loading
- **Rebuild:** HIGH PRIORITY - Estimated >90min repair, candidate for full v2

### TaskAddModalDirect.tsx ✅ ACTIVELY USED
- **Lines:** 876
- **Complexity:** High (26 useState, 26 useEffect)
- **Tabs:** None (single large form)
- **Usage:** TaskManagerNew, TaskTeamTab
- **Pain Points:**
  - Title input lag
  - Loads timeline/budget/vendors upfront
  - Category selector not optimized
- **P0 Fixes:**
  - Debounce title input
  - Query enabled flags for lazy data
  - Memoize category selector
  - Reduce initial fetching
- **Rebuild:** MAYBE - High complexity but functional

### TaskAddModal.tsx ❌ UNUSED CANDIDATE
- **Lines:** 845
- **Complexity:** High (19 useState, 19 useEffect)
- **Tabs:** None
- **Usage:** 0 direct imports found (only self-reference)
- **Reason:** Replaced by TaskAddModalDirect
- **Action:** REMOVE after final verification
- **Verification Needed:** Check for dynamic imports, router-based loading

---

## 6. Shared Infrastructure Components (3 components, 467 lines)

### StandardModal.tsx
- **Lines:** 194
- **Complexity:** Low (5 useState, 5 useEffect)
- **Usage:** Base component for 20+ modals
- **Role:** Provides modal backdrop, header, footer, animations
- **Pain Points:**
  - 300ms initial delay before ready state
  - backdrop-blur-md is heavy on performance
  - createPortal could be optimized
- **P0 Fixes:**
  - Reduce delay to 100ms
  - Replace blur with opacity fade
  - Optimize scroll lock
- **Rebuild:** No - optimize in place (affects all modals)

### ModalInput.tsx
- **Lines:** ~70 (estimated)
- **Complexity:** Very Low (3 useState, 3 useEffect)
- **Usage:** Simple input dialogs across app
- **Pain Points:** None
- **P0 Fixes:** None needed
- **Rebuild:** No

### ModalConfirm.tsx
- **Lines:** ~80 (estimated)
- **Complexity:** Very Low
- **Usage:** Confirmation dialogs via ModalContext
- **Pain Points:** None
- **P0 Fixes:** None needed
- **Rebuild:** No

---

## 7. Excluded from Phase 1 (Landing Page Modals)

The following 9 modals in `src/components/Modals/` are EXCLUDED from Phase 1 scope:

- FAQModal.tsx (114 lines)
- FeaturesModal.tsx (139 lines)
- HowItWorksModal.tsx (149 lines)
- ImpressumModal.tsx (108 lines)
- LoginModal.tsx (372 lines) - Used for auth, but landing page scope
- PricingModal.tsx (200 lines)
- PrivacyModal.tsx (158 lines)
- StartModal.tsx (139 lines)
- TermsModal.tsx (171 lines)

**Phase 2 Consideration:** These modals are only used on LandingPage.tsx and are not part of the authenticated app's core workflow. They can be optimized in a separate, lighter sprint after Phase 1 is complete and stable.

---

## Priority Matrix

### Immediate Action (P0)
1. **BudgetDetailModal** - 1,304 lines, critical input lag
2. **TaskDetailModal** - 1,170 lines, critical input lag
3. **StandardModal** - Base component optimization affects all modals

### High Priority (P1)
4. BudgetAddModal - 650 lines, Click-to-Open lag
5. TaskAddModalDirect - 876 lines, input lag
6. VendorDetailModal - 585 lines, moderate complexity
7. GuestDetailModal - 587 lines, re-render issues

### Medium Priority (P2)
8-15. All other active modals with identified P0 fixes

### Low Priority (P3)
16. Remove TaskAddModal (unused verification required)

---

## Performance Targets

| Metric | Current (Estimated) | Target | Priority Modals |
|--------|-------------------|--------|-----------------|
| Key-to-Frame | >50ms | ≤16ms | BudgetDetail, TaskDetail |
| Click-to-Open | >300ms | ≤150ms | All modals |
| Select-to-Commit | >200ms | ≤100ms | All dropdowns |

---

## Next Steps

1. ✅ Create feature flag system
2. ⏳ Measure actual baseline metrics for top 2 pain points
3. Implement P0 fixes for StandardModal (affects all)
4. Implement P0 fixes for BudgetDetailModal
5. Implement P0 fixes for TaskDetailModal
6. Consider v2 rebuilds for top 2 if repair >90min
7. Roll out optimizations to remaining modals
8. Verify and remove TaskAddModal
9. Validate performance improvements
10. Document results and create Phase 2 plan

---

**Last Updated:** 2025-11-08  
**Phase:** 1 - Initial Inventory  
**Status:** Setup Complete, Ready for Measurement
