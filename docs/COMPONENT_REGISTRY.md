# Eddva School ERP — Shared Component Registry

This document serves as the single source of truth for all shared UI components across the Eddva ERP modules (Student, Teacher, Parent, School Admin, Super Admin).

---

## 🧩 Shared Component Inventory

| Component Name | File Location | Student | Teacher | Parent | Admin | Shared | Core Responsibilities & Standards Compliance |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`ERPModal`** | `src/components/school/admin/Modal.jsx` | ✅ | ✅ | ✅ | ✅ | Yes | Standardized modal container (`.erp-modal-container`, `.erp-modal-body`, `.erp-modal-footer`). Restricts height to 90vh with scrollable internal body. |
| **`GlassCard`** | `src/components/school/GlassCard.jsx` | ✅ | ✅ | ⬜ | ⬜ | Yes | Translucent backdrop blurred card wrapper with hover border transitions for analytics & dashboard panels. |
| **`Badge`** | `src/components/school/Badge.jsx` | ✅ | ✅ | ⬜ | ✅ | Yes | Categorical status pill badge component (`ACADEMIC`, `EXAM`, `HOLIDAY`, `VACATION`, `LIVE_CLASS`). |
| **`ProfileAvatar`** | `src/components/ui/profile-avatar.tsx` | ✅ | ✅ | ✅ | ✅ | Yes | Avatar image renderer with automated fallback initials generator and relative font sizing (`clamp()`). |
| **`CustomSelect`** | `src/components/ui/CustomSelect.tsx` | ✅ | ✅ | ✅ | ✅ | Yes | High-contrast accessible dropdown select trigger with custom chevron indicators and dark mode support. |
| **`DataTable`** | `src/components/school/DataTable.jsx` | ⬜ | ✅ | ⬜ | ✅ | Yes | Enterprise data table container with horizontal scroll wrapper, sticky headers, and pagination controls. |
| **`TimetableEngine`** | `src/pages/school/admin/Timetable.jsx` | ✅ | ✅ | ⬜ | ✅ | Yes | Unified schedule engine with role-based filtering (`isCurrentTeacherSlot`), sticky day column (`z-20/z-40`), and period matrix. |
| **`AssessmentContentRenderer`** | `src/components/school/AssessmentContentRenderer.jsx` | ✅ | ✅ | ⬜ | ⬜ | Yes | Markdown question paper and solution content renderer with math formula & image scaling. |
| **`MonthlyFeaturedAchievementPanel`** | `src/features/calendar/components` | ✅ | ✅ | ⬜ | ⬜ | Yes | Sticky achievement panel for academic calendar views. |
| **`EventChip` & `EventCard`** | `src/features/calendar/components` | ✅ | ✅ | ⬜ | ⬜ | Yes | Event chip pills & detailed cards with priority-ordered category gradient theme styles. |
| **`StatCard`** | `src/components/school/StatCard.jsx` | ✅ | ✅ | ⬜ | ✅ | Yes | Key KPI performance metric card with icon container and trend percentage pill badges. |

---

## 🎨 Component Reuse Guidelines

1. **Check Registry Before Creating Components:** Always consult this registry before creating a new card, modal, badge, select dropdown, or table layout.
2. **Promote Page-Specific Cards to Shared Components:** If a component is used in 2 or more modules (e.g. Student Dashboard & Teacher Dashboard), move it into `src/components/school/` or `src/components/ui/` and register it here.
3. **Preserve Shared Token Classes:** Ensure all shared components utilize the CSS classes defined in `src/index.css` and `RESPONSIVE_STANDARDS.md`.
