import React from 'react';
import {
  Users,
  Video,
  ClipboardList,
  MessageSquare,
  Clock,
  MapPin,
  ChevronRight,
  PlusCircle,
  Bell,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboardMobile({
  user,
  stats,
  upcomingClasses,
  notifications,
  pendingDoubts,
  handleNotificationClick,
  unreadNotificationsCount,
}) {
  const statCards = [
    { label: 'Students', value: stats?.summary?.totalStudents || 0, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Classes Today', value: upcomingClasses?.length || 0, icon: Video, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' },
    { label: 'Active Tasks', value: stats?.summary?.activeAssignments || 0, icon: ClipboardList, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Doubts', value: pendingDoubts || 0, icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
  ];

  const quickActions = [
    { label: 'Attendance', to: '/school/teacher/attendance', icon: ClipboardList, desc: 'Mark class attendance' },
    { label: 'Start Live', to: '/school/teacher/live', icon: Video, desc: 'Schedule dynamic session' },
    { label: 'Assignments', to: '/school/teacher/assignments', icon: ClipboardList, desc: 'Manage homework tasks' },
    { label: 'Schedule', to: '/school/teacher/timetable', icon: Clock, desc: 'View complete timetable' },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header and Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white">
            Hello, {user?.name || 'Teacher'}! 👋
          </h1>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
            Teacher Workspace · Live
          </p>
        </div>
      </div>

      {/* Grid Statistics */}
      <div className="grid grid-cols-2 gap-3.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex items-center justify-between"
            >
              <div>
                <p className="text-[9px] font-bold text-slate-400">{card.label}</p>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{card.value}</p>
              </div>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action List */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs dark:border-slate-850 dark:bg-slate-900 active:scale-98 transition-transform"
              >
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Icon size={16} />
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-white mt-3">{action.label}</span>
                <span className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-snug">{action.desc}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Today's Classes */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Classes Today</h2>
        {upcomingClasses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-850 dark:bg-slate-900/50">
            <p className="text-xs font-bold text-slate-500">No classes scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {item.class}
                    </span>
                    <h3 className="text-sm font-black text-slate-850 dark:text-white mt-2 leading-tight">
                      {item.subject}
                    </h3>
                  </div>
                  {item.type && (
                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">
                      {item.type}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {item.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {item.room}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Recent Notifications ({unreadNotificationsCount})
        </h2>
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-850 dark:bg-slate-900/50">
            <p className="text-xs font-bold text-slate-500">No new notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`rounded-2xl border p-4 shadow-xs dark:border-slate-850 cursor-pointer active:scale-98 transition ${
                  !n.isRead
                    ? 'border-blue-150 bg-blue-50/20 dark:bg-blue-950/10'
                    : 'border-slate-100 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className={`text-xs leading-relaxed ${!n.isRead ? 'font-black text-slate-800 dark:text-white' : 'font-semibold text-slate-500'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
