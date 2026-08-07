# **School Admin Module Shared Component Audit**

---

## 🎨 Shared Component Reuse Mapping

| Shared Component | Source Location | Consuming Admin Pages | Reusability Purpose |
| :--- | :--- | :--- | :--- |
| **`Modal`** | `src/components/school/admin/Modal.jsx` | `Exams.tsx`, `Reports.jsx`, `Calendar.jsx`, `FeeStructures.tsx`, `Notices.jsx`, `Academics.jsx` | Provides standardized modal dialog overlays with smooth backdrop blurs. |
| **`DataTablePagination`** | `src/components/ui/data-table-pagination.tsx` | `Students.jsx`, `Teachers.jsx`, `Attendance.jsx`, `Complaints.jsx` | Handles unified server-side table pagination controls (`page`, `limit`, `total`, `totalPages`). |
| **`CustomSelect`** | `src/components/ui/CustomSelect.tsx` | `Attendance.jsx`, `Calendar.jsx`, `Communications.jsx`, `Complaints.jsx`, `Academics.jsx`, `AdminSettings.jsx` | Renders custom accessible dropdown triggers with light/dark theme support. |
| **`useConfirm`** | `src/context/ConfirmContext.tsx` | `Students.jsx`, `Teachers.jsx`, `Exams.tsx`, `Calendar.jsx`, `Communications.jsx`, `Notices.jsx`, `Academics.jsx` | Enforces two-step deletion modal confirmation before destroying records. |
| **`GlassCard` / `KpiCard`** | `src/components/school/GlassCard.jsx` | `AdminDashboard.jsx`, `Reports.jsx`, `Complaints.jsx`, `AdminSettings.jsx` | Displays translucent frosted KPI cards with subtle hover elevation. |
| **`StatusBadge` / `statusColors`** | `src/components/school/admin/Brand.jsx` | `Attendance.jsx`, `Exams.tsx`, `MarksEntry.tsx`, `FeeStructures.tsx`, `Notices.jsx`, `Complaints.jsx` | Standardizes status pills across the application (`ACTIVE`, `PRESENT`, `ABSENT`, `OVERDUE`, `RESOLVED`). |
| **`createChatSocket`** | `src/lib/chat-socket.ts` | `Communications.jsx` | Powers real-time WebSocket messaging and read receipt notifications. |
| **`uploadToS3`** | `src/lib/upload.ts` | `Communications.jsx`, `Notices.jsx` | Handles presigned S3 URL retrieval and cloud attachment uploads. |
