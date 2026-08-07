# Eddva School ERP — Semantic Layout Architecture Guidelines

This document provides guidelines for classifying and configuring page layouts across all Eddva School ERP frontend modules (Student, Teacher, Parent, School Admin, Super Admin).

---

## 🏛️ Layout Categories Reference

| Layout Type | CSS Utility Class | Padding Class | Max-Width Strategy | Target Page Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **`dashboard`** | `.erp-dashboard-container` | `p-3 sm:p-5 lg:p-6` | Enforces generous, readable max-width bounds on ultra-wide displays (`1920px` on 3XL, `2560px` on 4XL). | Home overview dashboards, executive KPI metrics cards, high-density summary panels. |
| **`workspace`** | `.erp-workspace-container` | `p-3 sm:p-5 lg:p-6` | Expands to fill available canvas while preserving readable line lengths (`2000px` on 3XL, `2800px` on 4XL). | AI Study Planner, Study Materials center, Timetable, Academic Calendar, Analytics views. |
| **`content`** | `.erp-container` | `p-3 sm:p-5 lg:p-6` | Standard bounded container (`1800px` on 3XL, `2400px` on 4XL). | Standard forms, data tables, settings, user profiles, announcements, support tickets. |
| **`immersive`** | `w-full h-full overflow-hidden` | `p-0` | Unrestricted 100% viewport. | Video live streaming player, online test engine, real-time chat workspace. |

---

## 🛠️ Registering Layout Types for New Routes

Layout selection is decoupled from URL path string matching. Developers can specify a page layout using two approaches:

### 1. Route Handle Metadata (Recommended for React Router routes)
```tsx
{
  path: "/school/student/planner",
  element: <SchoolStudentStudyPlanner />,
  handle: { layout: "workspace" }
}
```

### 2. Route Layout Registry Fallback
Add the route pattern directly to `ROUTE_LAYOUT_REGISTRY` in [`src/config/layout-system.ts`](file:///d:/Program%20Files/Eddva/eddva_frontend/src/config/layout-system.ts):
```ts
registerRouteLayout('/school/student/planner', 'workspace');
```
