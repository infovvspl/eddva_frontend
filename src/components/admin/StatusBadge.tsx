import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Coaching product only (institute-admin, teacher, student portals) — do not use for school/super-admin pages.
export type StatusBadgeStatus =
  | "active" | "done"
  | "scheduled" | "pending" | "high-priority" | "in_progress" | "waiting"
  | "escalated" | "blocked" | "urgent"
  | "draft" | "neutral" | "closed";

const STATUS_STYLES: Record<StatusBadgeStatus, string> = {
  active: "text-[#166534] bg-[#dcfce7] dark:bg-emerald-500/15 dark:text-emerald-300",
  done: "text-[#166534] bg-[#dcfce7] dark:bg-emerald-500/15 dark:text-emerald-300",
  scheduled: "text-[#92400e] bg-[#fef3c7] dark:bg-amber-500/15 dark:text-amber-300",
  pending: "text-[#92400e] bg-[#fef3c7] dark:bg-amber-500/15 dark:text-amber-300",
  waiting: "text-[#92400e] bg-[#fef3c7] dark:bg-amber-500/15 dark:text-amber-300",
  "high-priority": "text-[#92400e] bg-[#fef3c7] dark:bg-amber-500/15 dark:text-amber-300",
  in_progress: "text-[#92400e] bg-[#fef3c7] dark:bg-amber-500/15 dark:text-amber-300",
  escalated: "text-[#991b1b] bg-[#fee2e2] dark:bg-red-500/15 dark:text-red-300",
  blocked: "text-[#991b1b] bg-[#fee2e2] dark:bg-red-500/15 dark:text-red-300",
  urgent: "text-[#991b1b] bg-[#fee2e2] dark:bg-red-500/15 dark:text-red-300",
  draft: "text-[#475569] bg-[#f1f5f9] dark:bg-slate-500/15 dark:text-slate-300",
  neutral: "text-[#475569] bg-[#f1f5f9] dark:bg-slate-500/15 dark:text-slate-300",
  closed: "text-[#475569] bg-[#f1f5f9] dark:bg-slate-500/15 dark:text-slate-300",
};

/** Maps a free-form backend status/priority string onto the badge's 4 semantic buckets. */
export function toStatusBadgeKey(raw: string | null | undefined): StatusBadgeStatus {
  const s = (raw || "").toLowerCase();
  if (["active", "done", "resolved", "created", "open", "completed", "published", "processed"].includes(s)) return "active";
  if (["escalated", "blocked", "urgent", "live", "suspended"].includes(s)) return "escalated";
  if (["scheduled", "pending", "pending_verification", "high", "high-priority", "in_progress", "waiting_for_user", "medium", "reopened", "skipped", "processing"].includes(s)) return "scheduled";
  return "draft";
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusBadgeStatus;
  label?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full text-xs font-bold leading-none",
        STATUS_STYLES[status] ?? STATUS_STYLES.neutral,
        className,
      )}
      style={{ padding: "5px 12px" }}
    >
      {label ?? status}
    </span>
  );
}
