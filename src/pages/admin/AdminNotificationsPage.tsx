import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Bell, Phone, Mail, MessageCircle, CheckCheck,
  BookOpen, Loader2, ChevronRight, Filter,
} from "lucide-react";

import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from "@/hooks/use-notifications";
import { Notification } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePhone(body?: string): string | null {
  if (!body) return null;
  const m = body.match(/📞 Phone:\s*(.+)/);
  return m ? m[1].trim() : null;
}

function parseEmail(body?: string): string | null {
  if (!body) return null;
  const m = body.match(/✉️\s*Email:\s*(.+)/);
  return m ? m[1].trim() : null;
}

function formatTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ n }: { n: Notification }) {
  const markRead = useMarkNotificationRead();
  const isLead = n.type === "course_view";
  const phone = parsePhone(n.body ?? n.message);
  const email = parseEmail(n.body ?? n.message);
  const unread = !n.isRead;

  function handleMarkRead() {
    if (!n.isRead) markRead.mutate(n.id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex gap-4 p-5 rounded-2xl border transition-all",
        unread
          ? "bg-indigo-50/60 border-indigo-100"
          : "bg-white border-slate-100 hover:border-slate-200"
      )}
    >
      {/* Unread dot */}
      {unread && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg",
          isLead ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 border border-slate-100"
        )}
      >
        {isLead ? "👁️" : <Bell className="w-5 h-5 text-slate-400" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold mb-0.5", unread ? "text-slate-900" : "text-slate-700")}>
          {n.title}
        </p>

        {(n.body ?? n.message) && (
          <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed mb-2">
            {n.body ?? n.message}
          </p>
        )}

        {/* Lead action buttons */}
        {isLead && (phone || email) && (
          <div className="flex flex-wrap gap-2 mt-1">
            {phone && phone !== "N/A" && (
              <>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="w-3 h-3" /> Call
                </a>
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              </>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Mail className="w-3 h-3" /> Email
              </a>
            )}
          </div>
        )}

        <p className="text-[10px] text-slate-400 mt-2">{formatTime(n.createdAt)}</p>
      </div>

      {/* Mark as read button */}
      {unread && (
        <button
          onClick={handleMarkRead}
          disabled={markRead.isPending}
          title="Mark as read"
          className="self-start mt-1 p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <CheckCheck className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ tab }: { tab: string }) {
  return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        {tab === "leads" ? (
          <BookOpen className="w-7 h-7 text-slate-300" />
        ) : (
          <Bell className="w-7 h-7 text-slate-300" />
        )}
      </div>
      <p className="font-semibold text-slate-600">
        {tab === "leads"
          ? "No course-view leads yet"
          : tab === "unread"
          ? "You're all caught up!"
          : "No notifications yet"}
      </p>
      <p className="text-slate-400 text-sm text-center max-w-xs">
        {tab === "leads"
          ? "When a student views one of your courses without enrolling, a lead will appear here."
          : "Notifications from batches, quizzes, and system events will appear here."}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "all" | "leads" | "unread";

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<Tab>("all");

  const { data, isLoading, refetch } = useNotifications({ limit: 100 });
  const markAll = useMarkAllRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const filtered = notifications.filter((n) => {
    if (tab === "leads") return n.type === "course_view";
    if (tab === "unread") return !n.isRead;
    return true;
  });

  function handleMarkAll() {
    markAll.mutate(undefined, { onSuccess: () => refetch() });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "all",    label: "All" },
    { key: "leads",  label: "Leads" },
    { key: "unread", label: "Unread" },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-6">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-500" /> Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Course-view leads, system alerts, and follow-ups.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markAll.isPending}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
          >
            {markAll.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all read
          </button>
        )}
      </header>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
              tab === t.key
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
            {t.key === "leads" && (
              <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                {notifications.filter((n) => n.type === "course_view").length}
              </span>
            )}
            {t.key === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <Empty tab={tab} />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Subtle "show more" hint */}
      {!isLoading && filtered.length > 0 && notifications.length >= 100 && (
        <p className="text-center text-xs text-slate-400 pt-2 flex items-center justify-center gap-1">
          Showing latest 100 <ChevronRight className="w-3 h-3" />
        </p>
      )}
    </div>
  );
}
