# Eddva School ERP — Responsive Standards & Best Practices

This document defines project-wide responsive engineering standards across all frontend modules (Student, Teacher, Parent, School Admin, Super Admin). All developers and subagents must adhere to these standards when creating or modifying UI components.

---

## 🏛️ 1. Container Architecture

Containers are categorized semantically using the layout system ([`src/config/layout-system.ts`](file:///d:/Program%20Files/Eddva/eddva_frontend/src/config/layout-system.ts)):

- **`content` (`.erp-container`):** For bounded forms, data tables, settings, profiles.
- **`dashboard` (`.erp-dashboard-container`):** For high-density KPI metrics and overview dashboards.
- **`workspace` (`.erp-workspace-container`):** For interactive tools, AI planners, study materials, timetables, and analytics.
- **`immersive` (`w-full h-full overflow-hidden`):** For full-viewport live players, exam test engines, and chat workspaces.

---

## 📐 2. Grid & Flex Spacing Rules

- **Responsive Grid Gap Scale:** Use `gap-3 sm:gap-4 lg:gap-5` for cards grid layouts.
- **Relative Proportions:** Use `minmax()` and `fr` units rather than fixed pixel widths.
- **Flexbox Min-Width Safety:** Always add `min-w-0` to flex child containers containing text headings to prevent string overflow from breaking flex layout bounds.

---

## 🔤 3. Typography & Text Clamping

- **Avoid Fixed Pixel Font Sizes:** Prefer Tailwind responsive font utilities (`text-xs sm:text-sm md:text-base`).
- **Heading Clamping:** Apply `line-clamp-1` or `line-clamp-2` with `leading-snug` to multi-line titles in grid cards.
- **Truncation:** Use `truncate` on single-line metadata text, badge pills, and breadcrumbs.

---

## 🖼️ 4. Image & Media Scaling

- **Responsive Aspect Ratio:** Use `aspect-video` or `aspect-square` with `w-full h-full object-cover`.
- **Shrink Protection:** Apply `shrink-0` on fixed-dimension thumbnails or icons adjacent to flex text items.
- **Error Fallbacks:** Always handle `onError` image events with neutral SVG icon placeholders.

---

## 🎴 5. Card Component Proportions

- **Equal Height Rows:** Parent grids must use `align-items: stretch`.
- **Bottom-Aligned Action Buttons:** Main card content column must use `flex flex-col justify-between` or `mt-auto pt-3` on action button wrappers.
- **Accent Strips:** Card top/side accent borders should use percentage or absolute inset positioning with `rounded-t-2xl` or `rounded-l-2xl`.

---

## 📊 6. Data Tables & Tables

- **Scroll Wrapper:** Wrap all data tables in `.erp-table-scroll` (`w-full overflow-x-auto custom-scrollbar`).
- **Cell Truncation:** Apply `max-w-[200px] truncate` on text cells to prevent column expansion.
- **Sticky Headers:** Header cells must use `sticky top-0 z-10 bg-slate-50 dark:bg-slate-900`.

---

## 🪟 7. Modals & Dialogs

- **Modal Container:** Wrap modals in `.erp-modal-container` (`w-full max-h-[90vh] flex flex-col`).
- **Modal Body:** Wrap scrollable content in `.erp-modal-body` (`p-6 overflow-y-auto grow custom-scrollbar`).
- **Modal Footer:** Wrap action buttons in `.erp-modal-footer` (`p-4 shrink-0 flex items-center justify-end gap-3`).
