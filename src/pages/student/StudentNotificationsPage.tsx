import { motion } from "framer-motion";
import { Bell, BookOpen, Loader2, CheckCheck, Trophy, Video, HelpCircle, Zap, BarChart2, Calendar, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/use-notifications";
import type { Notification } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
  lecture_published:   { bg: "bg-indigo-50",  text: "text-indigo-600",  Icon: Video        },
  lecture_scheduled:   { bg: "bg-blue-50",    text: "text-blue-600",    Icon: Video        },
  live_class_scheduled: { bg: "bg-red-50",     text: "text-red-600",     Icon: Video        },
  calendar_event:      { bg: "bg-sky-50",     text: "text-sky-600",     Icon: Calendar     },
  battle_invite:       { bg: "bg-rose-50",     text: "text-rose-600",    Icon: Trophy       },
  doubt_resolved:      { bg: "bg-emerald-50",  text: "text-emerald-600", Icon: HelpCircle   },
  xp_earned:           { bg: "bg-amber-50",    text: "text-amber-600",   Icon: Zap          },
  streak_milestone:    { bg: "bg-orange-50",   text: "text-orange-600",  Icon: Sparkles     },
  batch_announcement:  { bg: "bg-indigo-50",   text: "text-indigo-600",  Icon: BookOpen     },
  plan_generated:      { bg: "bg-teal-50",     text: "text-teal-600",    Icon: Calendar     },
  mock_test_scheduled: { bg: "bg-violet-50",   text: "text-violet-600",  Icon: BarChart2    },
  mock_test_available: { bg: "bg-violet-50",   text: "text-violet-600",  Icon: BarChart2    },
  rank_change:         { bg: "bg-purple-50",   text: "text-purple-600",  Icon: Trophy       },
  course_view:         { bg: "bg-indigo-50",   text: "text-indigo-600",  Icon: BookOpen     },
  general:             { bg: "bg-slate-50",    text: "text-slate-500",   Icon: Bell         },
  default:             { bg: "bg-slate-50",    text: "text-slate-500",   Icon: Bell         },
};

function getConfig(type?: string, refType?: string) {
  // refType takes precedence — lets backend use GENERAL type while preserving UI semantics
  return TYPE_CONFIG[refType ?? ""] ?? TYPE_CONFIG[type ?? ""] ?? TYPE_CONFIG.default;
}

function NotificationRow({ n, index }: { n: Notification; index: number }) {
  const markRead = useMarkNotificationRead();
  const cfg = getConfig(n.type, n.refType ?? n.data?.refType);
  const { Icon } = cfg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => !n.isRead && markRead.mutate(n.id)}
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm",
        n.isRead ? "bg-white border-slate-100" : "bg-indigo-50/50 border-indigo-100"
      )}
    >
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", cfg.bg, cfg.text)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold leading-snug", n.isRead ? "text-slate-700" : "text-slate-900")}>
          {n.title}
        </p>
        {(n.body ?? n.message) && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body ?? n.message}</p>
        )}
        <p className="text-[11px] text-slate-400 mt-1.5">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
    </motion.div>
  );
}

export default function StudentNotificationsPage() {
  const { data: result, isLoading } = useNotifications();
  const notifications: Notification[] = result?.data ?? [];
  const markAll = useMarkAllRead();
  const unreadCount = result?.unreadCount ?? 0;

  return (
    <div className="max-w-2xl mx-auto p-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
            <Bell className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold">No notifications yet</p>
          <p className="text-xs text-slate-400">You'll see course updates, battle invites, and more here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <NotificationRow key={n.id} n={n} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
