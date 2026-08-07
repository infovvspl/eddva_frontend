# Eddva School ERP — Reusable Module QA & Refinement Checklist

This document defines the mandatory 10-point Module QA Checklist to be executed for every page and module across the ERP (Teacher, Parent, School Admin, Super Admin).

---

## 📋 Mandatory 10-Point QA Checklist

Every page audit MUST verify and document the following 10 standards:

1. **Layout Architecture Compliance**
   - [ ] Page explicitly registered in `ROUTE_LAYOUT_REGISTRY` (`dashboard`, `workspace`, `content`, `immersive`).
   - [ ] Zero inline `max-w-full` or unstandardized page containers.

2. **Card Action & Grid Equalization**
   - [ ] Cards in multi-column grids use equal height stretch (`align-items: stretch`).
   - [ ] Action buttons pin to bottom using `mt-auto` or `justify-between`.

3. **Typography & Truncation Safety**
   - [ ] Long titles, teacher names, and subject headers use `line-clamp-1` or `truncate` with `min-w-0 flex-1`.
   - [ ] Text containers do not overflow card boundaries on 1366px laptop viewports.

4. **Table & Data Matrix Usability**
   - [ ] Tables use overflow scroll container (`overflow-x-auto`).
   - [ ] Primary identification columns (e.g. Period, Date, Student Name) use sticky positioning (`sticky left-0 z-20 bg-slate-50`).

5. **Modal Dialog Tokenization**
   - [ ] Modal popups use `.erp-modal-container`, `.erp-modal-body`, and `.erp-modal-footer` tokens.
   - [ ] Modal height restricted to 90vh with scrollable internal body.

6. **Feature Workflow & State Testing**
   - [ ] Feature-specific interactions (uploads, timers, filters, pagination, AI triggers) tested end-to-end.
   - [ ] Loading skeletons (`animate-pulse`), empty states (`No data available`), and error toasts tested.

7. **Multi-Resolution & Zoom Testing**
   - [ ] Continuous window resize tested across 1366px, 1440px, 1536px, 1920px, and 2560px.
   - [ ] Browser zoom levels tested (90%, 100%, 110%, 125%, 150%).

8. **Accessibility & Keyboard Navigation**
   - [ ] Interactive elements focusable via `Tab` / `Enter` with visible focus rings.
   - [ ] High contrast text against light (`bg-slate-50`) and dark (`dark:bg-slate-900`) themes.

9. **Regression Safety & Isolation**
   - [ ] Zero changes to shared layout wrappers without cross-module impact analysis.
   - [ ] Zero API payload or routing modifications.

10. **Build & Quality Engineering Standards**
    - [ ] TypeScript type check (`npx tsc --noEmit`) passes with 0 errors.
    - [ ] Production build (`npm run build`) passes cleanly with 0 errors.
