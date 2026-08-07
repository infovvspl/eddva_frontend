# Parent Module — Shared Component Audit & Inventory

## 1. Shared Component Reuse Inventory

| Component Name | Source Location | Pages Reusing Component | Purpose & Benefit |
| :--- | :--- | :--- | :--- |
| **`CustomSelect`** | `src/components/ui/CustomSelect.tsx` | Dashboard, Meetings, Grievances | Custom styled select dropdown with built-in chevron icon. |
| **`SmartCalendar`** | `src/components/school/SmartCalendar.jsx` | Dashboard | Interactive academic calendar widget displaying school events. |
| **`MaintenanceBroadcastBanner`** | `src/components/shared/MaintenanceBroadcastBanner.jsx` | Dashboard | Global system maintenance banner. |
| **`GlassCard`** | `src/components/school/GlassCard.jsx` | Child Overview, Report Cards | Translucent card container with hover elevation effect. |
| **`StudentReportCard`** | `src/pages/school/admin/StudentReportCard.tsx` | Child Report Card | Unified CBSE & State Board official A4 report card renderer. |
| **`NotificationCenterContent`** | `src/components/school/NotificationCenterContent.tsx` | Notifications | Real-time notification list, filtering, and preferences engine. |
| **`Announcements`** | `src/pages/school/student/Announcements.jsx` | Announcements | Public notice reader with attachment preview lightbox. |
| **`createChatSocket`** | `src/lib/chat-socket.ts` | Communications | Real-time WebSocket connection for direct parent-teacher messaging. |
| **`uploadToS3`** | `src/lib/upload.ts` | Communications, Profile | S3 cloud uploader for chat media attachments and avatar photos. |
| **`ProfileAvatar`** | `src/components/ui/profile-avatar.tsx` | Profile | User avatar component with fallback initials renderer. |
| **`useParentContext`** | `src/components/school/parent/ParentAuthGuard.tsx` | Dashboard, Child, Profile | Shared parent context supplying active child ID and children array. |

---

## 2. Maintenance & Architectural Strategy

By standardizing shared component primitives across Admin, Teacher, Student, and Parent portals:
- **Design System Consistency:** Guarantees uniform typography, colors, animations, and status pills across all roles.
- **Maintenance Reduction:** A single update to `StudentReportCard` or `NotificationCenterContent` enhances all 4 portals simultaneously.
- **Zero Duplication:** Eliminates redundant API calls and duplicated markup across parent workflows.
