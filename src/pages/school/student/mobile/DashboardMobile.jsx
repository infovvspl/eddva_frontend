import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  FileText,
  Radio,
  Target,
  Flame,
  Star,
  UserCheck,
} from 'lucide-react';
import StudentAvatar from '@/assets/images/Student_Avatar.png';

const tones = {
  blue: 'bg-blue-600 text-white shadow-md shadow-blue-500/10',
  emerald: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10',
  amber: 'bg-amber-500 text-white shadow-md shadow-amber-500/10',
  rose: 'bg-rose-600 text-white shadow-md shadow-rose-500/10',
  violet: 'bg-violet-600 text-white shadow-md shadow-violet-500/10',
  slate: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md',
};

export default function DashboardMobile({
  user,
  institute,
  loading,
  refreshing,
  dashboardData,
  assignments,
  mockTests,
  notices,
  courses,
  weekEvents,
  todayPlan,
  attendanceSummary,
  present,
  absent,
  leave,
  totalClasses,
  attendanceRate,
  attendancePct,
  hasAttendance,
  todayClassesCount,
  pendingAssignmentsCount,
  upcomingExamsCount,
  className: studentClass,
  sectionName,
  quickActions,
  fetchData,
}) {
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Greeting & Quick Info Header */}
      <div className="flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
            {institute?.name || 'My School'}
          </span>
          <h1 className="mt-2 truncate text-xl font-black">Hi, {user?.name || 'Student'}!</h1>
          <p className="mt-0.5 text-xs text-blue-100/90 font-medium">
            {studentClass ? `${studentClass} - ${sectionName || ''}` : 'Welcome back to classes'}
          </p>
        </div>
        <div className="relative h-14 w-14 shrink-0 rounded-2xl border border-white/20 bg-white/10 p-0.5 shadow-inner">
          <img src={StudentAvatar} alt="Avatar" className="h-full w-full object-cover rounded-xl" />
        </div>
      </div>

      {/* Main Stats Highlight */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <UserCheck className="h-5 w-5 text-emerald-500 mb-1" />
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Attendance</p>
          <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
            {hasAttendance ? `${attendancePct}%` : 'N/A'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList className="h-5 w-5 text-amber-500 mb-1" />
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Homework</p>
          <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
            {pendingAssignmentsCount} Pending
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Target className="h-5 w-5 text-rose-500 mb-1" />
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Exams</p>
          <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
            {upcomingExamsCount} Upcoming
          </p>
        </div>
      </div>

      {/* Quick Actions Circular Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.slice(0, 4).map((act, index) => {
            const Icon = act.icon;
            const bgClass = tones[act.tone] || tones.slate;
            return (
              <Link
                key={index}
                to={act.to}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 py-3 shadow-xs active:scale-95 transition-transform text-center"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-black leading-tight text-slate-700 dark:text-slate-300 px-1 truncate w-full">
                  {act.label.split(' ').slice(1).join(' ') || act.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Today's Schedule List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Today's Classes</h2>
          <Link to="/school/student/timetable" className="text-xs font-bold text-blue-600">
            View Timetable
          </Link>
        </div>
        {todayPlan.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <Calendar className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No classes scheduled today</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayPlan.map((cls, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${
                      cls.isLive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {cls.isLive ? 'LIVE' : 'OFFLINE'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {cls.startTime || '00:00'} - {cls.endTime || '00:00'}
                    </span>
                  </div>
                  <h3 className="mt-1.5 truncate text-sm font-black text-slate-800 dark:text-white">
                    {cls.subject || 'Period'}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    {cls.teacher || 'Class Teacher'}
                  </p>
                </div>
                {cls.isLive && cls.meetingLink && (
                  <a
                    href={cls.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-[11px] font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 shrink-0"
                  >
                    Join
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcements Carousel / Stack */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Announcements</h2>
          <Link to="/school/student/announcements" className="text-xs font-bold text-blue-600">
            See All
          </Link>
        </div>
        {notices.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No new announcements</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notices.slice(0, 2).map((notice, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border bg-white p-4 shadow-xs dark:bg-slate-900 ${
                  notice.priority === 'HIGH'
                    ? 'border-rose-100 dark:border-rose-950/40 bg-rose-50/20'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                    notice.priority === 'HIGH'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  }`}>
                    {notice.priority || 'NORMAL'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {notice.date ? new Date(notice.date).toLocaleDateString() : ''}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-black text-slate-800 dark:text-white line-clamp-1">
                  {notice.title}
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                  {notice.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
