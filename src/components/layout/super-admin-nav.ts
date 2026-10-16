import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  HardDrive,
  LayoutDashboard,
  Megaphone,
  Radio,
  Server,
  Settings,
  Shield,
  Sparkles,
  Ticket,
  ToggleRight,
  TrendingUp,
  Trophy,
  Users,
  BookOpen,
} from "lucide-react"

import type { TabItem } from "@/components/layout/MobileTabBar"
import type { NavGroup } from "@/components/nav-main"

/** Coaching platform super admin (/super-admin/*). */
export const coachingSuperAdminGroups: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { url: "/super-admin", title: "Dashboard", icon: LayoutDashboard, end: true },
      { url: "/super-admin/tenants", title: "Institutes", icon: Building2 },
    ],
  },
  {
    heading: "Communication",
    items: [
      { url: "/super-admin/communication", title: "Communication", icon: Megaphone },
      { url: "/super-admin/leads", title: "Leads", icon: TrendingUp },
      { url: "/super-admin/complaints", title: "Support Tickets", icon: Ticket },
    ],
  },
  {
    heading: "Insights",
    items: [
      { url: "/super-admin/analytics", title: "Analytics", icon: BarChart3 },
      { url: "/super-admin/ai-usage", title: "AI Usage", icon: Sparkles },
      { url: "/super-admin/live-usage", title: "Live Classes", icon: Radio },
      { url: "/super-admin/revenue", title: "Revenue", icon: TrendingUp },
      { url: "/super-admin/tenant-health", title: "Tenant Health", icon: Activity },
    ],
  },
  {
    heading: "Management",
    items: [
      { url: "/super-admin/billing", title: "Billing", icon: CreditCard },
      { url: "/super-admin/system-health", title: "System Health", icon: Server },
    ],
  },
  {
    heading: "Governance",
    items: [
      { url: "/super-admin/audit-logs", title: "Audit Logs", icon: FileText },
      { url: "/super-admin/security", title: "Security Center", icon: Shield },
      { url: "/super-admin/settings", title: "Settings", icon: Settings },
      { url: "/super-admin/feature-flags", title: "Feature Flags", icon: ToggleRight },
    ],
  },
]

/** Flat list behind the phone bottom bar (primary tabs + "More"), same entries as the old layout. */
export const coachingSuperAdminTabs: TabItem[] = [
  { label: "Dashboard", path: "/super-admin", icon: LayoutDashboard, end: true },
  { label: "Institutes", path: "/super-admin/tenants", icon: Building2 },
  { label: "Leads", path: "/super-admin/leads", icon: TrendingUp },
  { label: "Support Tickets", path: "/super-admin/support-tickets", icon: Ticket },
  { label: "Communication", path: "/super-admin/communication", icon: Megaphone },
  { label: "Analytics", path: "/super-admin/analytics", icon: BarChart3 },
  { label: "AI Usage", path: "/super-admin/ai-usage", icon: Sparkles },
  { label: "Audit Logs", path: "/super-admin/audit-logs", icon: FileText },
  { label: "Security Centre", path: "/super-admin/security", icon: Shield },
  { label: "Settings", path: "/super-admin/settings", icon: Settings },
  { label: "Feature Flags", path: "/super-admin/feature-flags", icon: ToggleRight },
]

export const coachingSuperAdminPrimaryTabs = [
  "/super-admin",
  "/super-admin/tenants",
  "/super-admin/analytics",
]

/** School platform super admin (/school/super-admin/*). */
export const schoolSuperAdminGroups: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { url: "/school/super-admin", title: "Dashboard", icon: LayoutDashboard, end: true },
      { url: "/school/super-admin/institutes", title: "Schools", icon: Building2 },
      { url: "/school/super-admin/users", title: "User Management", icon: Users },
      { url: "/school/super-admin/erp-modules", title: "ERP Modules", icon: BookOpen },
      { url: "/school/super-admin/competitive-prep", title: "Competitive Exam Prep", icon: Trophy },
    ],
  },
  {
    heading: "Communication",
    items: [
      { url: "/school/super-admin/communication", title: "Communication", icon: Megaphone },
      { url: "/school/super-admin/complaints", title: "Support Tickets", icon: Ticket },
    ],
  },
  {
    heading: "Insights",
    items: [
      { url: "/school/super-admin/analytics", title: "Analytics", icon: BarChart3 },
      { url: "/school/super-admin/ai-usage", title: "AI Usage", icon: Sparkles },
      { url: "/school/super-admin/live-usage", title: "Live Classes", icon: Radio },
      { url: "/school/super-admin/storage", title: "Storage Usage", icon: HardDrive },
    ],
  },
  {
    heading: "Governance",
    items: [
      { url: "/school/super-admin/audit-logs", title: "Audit Logs", icon: FileText },
      { url: "/school/super-admin/security", title: "Security Center", icon: Shield },
      { url: "/school/super-admin/feature-flags", title: "Feature Flags", icon: ToggleRight },
    ],
  },
]

/**
 * Pages that lay themselves out edge-to-edge. Kept identical to the lists the
 * old layouts used, so no page changes its padding.
 */
const COACHING_FULL_WIDTH = [
  "/super-admin/feature-flags",
  "/super-admin/live-usage",
  "/super-admin/storage-usage",
  "/super-admin/ai-usage",
  "/super-admin/analytics",
  "/super-admin/audit-logs",
  "/super-admin/communication",
  "/super-admin/tenants",
  "/super-admin/complaints",
  "/super-admin/support-tickets",
  "/super-admin/revenue",
  "/super-admin/tenant-health",
  "/super-admin/billing",
]

const SCHOOL_FULL_WIDTH = [
  "/communication",
  "/communications",
  "/audit-logs",
  "/feature-flags",
  "/users",
  "/complaints",
  "/analytics",
  "/ai-usage",
  "/storage-usage",
  "/storage",
  "/live-usage",
  "/erp-modules",
  "/security",
]

export const isCoachingFullWidthPage = (pathname: string) =>
  pathname.startsWith("/live/") ||
  COACHING_FULL_WIDTH.some((p) => pathname.endsWith(p))

export const isSchoolFullWidthPage = (pathname: string) =>
  pathname.includes("/live/") || SCHOOL_FULL_WIDTH.some((p) => pathname.endsWith(p))
