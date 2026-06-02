import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BookOpen, Calendar, CheckCircle2, DollarSign, MessageCircle, AlertCircle, FileText } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentNotifications() {
  const [filter, setFilter] = useState("All");
  const queryClient = useQueryClient();
  const { activeChildId } = useParentContext();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['parent-notifications', activeChildId, filter],
    queryFn: () => parentClient.getNotifications(filter),
    retry: 1,
  });

  const markReadMutation = useMutation({
    mutationFn: () => parentClient.markNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-notifications'] });
    }
  });

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'attendance_present': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'attendance_absent': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'homework': return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'test_result': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-indigo-500" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'finance': return <DollarSign className="h-4 w-4 text-emerald-600" />;
      default: return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const grouped = notifications?.reduce((acc: any, notif: any) => {
    const g = notif.group || 'Earlier';
    if (!acc[g]) acc[g] = [];
    acc[g].push(notif);
    return acc;
  }, {});

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Alerts</h2>
          <p className="text-sm font-semibold text-slate-500">Stay updated on your child's activities</p>
        </div>
        <button
          onClick={() => markReadMutation.mutate()}
          disabled={markReadMutation.isPending || !notifications?.length}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          {markReadMutation.isPending ? "Marking..." : "Mark all as read"}
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {["All", "Academic", "Attendance", "Finance", "General"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${
              filter === f ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] bg-white p-4 sm:p-6 shadow-sm border border-slate-100 min-h-[400px]">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : notifications?.length > 0 ? (
          <div className="space-y-8">
            {['Today', 'Yesterday', 'Earlier'].map(group => {
              const groupNotifs = grouped?.[group];
              if (!groupNotifs?.length) return null;
              
              return (
                <div key={group}>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{group}</h3>
                  <div className="space-y-3">
                    {groupNotifs.map((n: any, i: number) => (
                      <div key={i} className={`flex items-start gap-4 rounded-2xl border bg-slate-50 p-4 transition-colors ${
                        !n.isRead ? 'border-blue-200 border-l-4 border-l-blue-600' : 'border-slate-100'
                      }`}>
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${!n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{n.title}</p>
                          <p className="text-xs font-medium text-slate-500 mt-1">{n.message}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center opacity-50 py-16">
            <Bell className="h-12 w-12 text-slate-400 mb-3" />
            <p className="text-sm font-bold text-slate-600">No notifications found</p>
          </div>
        )}
      </div>
    </div>
  );
}
