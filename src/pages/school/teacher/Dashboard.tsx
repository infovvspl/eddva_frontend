import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserCheck, FileText, ClipboardList, Clock, MapPin, MessageSquare, CalendarDays, Sparkles, ChevronRight, CheckSquare, PlusCircle, Video } from 'lucide-react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import StatCard from '@/components/school/StatCard';
import GlassCard from '@/components/school/GlassCard';
import Badge from '@/components/school/Badge';
import ProgressBar from '@/components/school/ProgressBar';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { useAuth } from '@/context/SchoolAuthContext';
import { useAcademicStore } from '@/lib/academic-store';
import { toast } from 'sonner';
import TeacherAvatar from '@/assets/images/Teacher_Avatar.png';
import SmartCalendar from '@/components/school/SmartCalendar';
import './Dashboard.css';

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={24} />,
  UserCheck: <UserCheck size={24} />,
  FileText: <FileText size={24} />,
  ClipboardList: <ClipboardList size={24} />,
};

const getTeacherFallbackUrl = (n: any) => {
  if (n.actionUrl) return n.actionUrl;
  const type = (n.type || '').toLowerCase();
  const title = (n.title || '').toLowerCase();

  if (type.includes('assignment') || type.includes('submission') || title.includes('assignment')) {
    return '/school/teacher/assignments';
  }
  if (type.includes('assessment') || type.includes('result') || title.includes('assessment') || title.includes('test') || title.includes('exam')) {
    return '/school/teacher/assessments';
  }
  if (type.includes('live') || type.includes('class') || title.includes('class') || title.includes('timetable') || title.includes('schedule')) {
    return '/school/teacher/classes';
  }
  if (type.includes('attendance') || title.includes('attendance')) {
    return '/school/teacher/attendance';
  }
  return '/school/teacher';
};

const MAX_SUBJECTS_SHOWN = 4;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeAcademicContext, setActiveAcademicContext, setAssignments } = useAcademicStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingDoubts, setPendingDoubts] = useState(0);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n: any) => !n.isRead).length;
  }, [notifications]);

  const handleNotificationClick = async (n: any) => {
    try {
      if (!n.isRead) {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
      }
      const targetUrl = getTeacherFallbackUrl(n);
      if (targetUrl) {
        navigate(targetUrl);
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };

  const loadDashboard = async () => {
    try {
      const [statsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
      ]);

      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value.data?.data || statsRes.value.data || {};
        setStats(data);

        if (data.teacherData?.assignments) {
          setAssignments(data.teacherData.assignments);
        }

        setUpcomingClasses((data.upcomingClasses || []).map((item: any) => ({
          id: item.id,
          time: `${item.start_time || item.startTime || item.schedule || '--'}`,
          subject: item.subject_name || item.subjectName || item.subject?.name || item.title || 'Scheduled class',
          room: item.room || 'Online',
          class: item.class_name || item.className || item.class?.name || item.examTarget || '-',
          type: item.class_type || item.type || '',
        })));
      }

      try {
        const res = await api.get('/notifications');
        const list = res.data?.data ?? res.data;
        setNotifications(Array.isArray(list) ? list : []);
      } catch {
        setNotifications([]);
      }

      try {
        const doubtRes = await api.get('/doubts');
        const list = unwrapSchoolList(doubtRes);
        setPendingDoubts(
          list.filter((d: { status?: string }) =>
            ['escalated', 'open', 'ai_answered'].includes(d.status || ''),
          ).length,
        );
      } catch {
        setPendingDoubts(0);
      }
    } catch (error) {
      console.error('Failed to load teacher dashboard:', error);
    }
  };

  useLiveRefresh(loadDashboard, [], 20000);

  // Teacher assignments (class-section-subject combos)
  const teacherSubjects = stats?.teacherData?.assignments || [];
  const visibleSubjects = teacherSubjects.slice(0, MAX_SUBJECTS_SHOWN);
  const hiddenSubjectCount = Math.max(0, teacherSubjects.length - MAX_SUBJECTS_SHOWN);

  // Attendance data from backend
  const attendancePresent = stats?.attendancePresent || 0;
  const attendanceAbsent = stats?.attendanceAbsent || 0;
  const attendanceLate = stats?.attendanceLate || 0;
  const attendanceLeave = stats?.attendanceLeave || 0;
  const attendancePercentage = stats?.attendancePercentage || 0;
  const attendanceClassCount = stats?.attendanceClassCount || 0;
  const attendanceClassNames: string[] = stats?.attendanceClassNames || [];
  const attendanceTotal = stats?.attendanceTotal || 0;

  // Build the classes label
  const classesLabel = attendanceClassCount <= 3
    ? (attendanceClassNames.length > 0 ? attendanceClassNames.join(', ') : 'None')
    : `${attendanceClassCount}`;

  const dashboardStats = [
    { id: 'students', title: 'Students', value: stats?.totalStudents ?? 0, change: 'Assigned', changeType: 'positive', icon: 'Users', onClick: () => navigate('/school/teacher/classes') },
    { id: 'classes', title: 'Classes Today', value: upcomingClasses.length, change: 'Remaining', changeType: 'neutral', icon: 'UserCheck', onClick: () => navigate('/school/teacher/timetable') },
    { id: 'assignments', title: 'Assignments', value: stats?.assignments ?? 0, change: 'Created', changeType: 'positive', icon: 'FileText', onClick: () => navigate('/school/teacher/assignments') },
    { id: 'assessments', title: 'Assessments', value: stats?.assessments ?? 0, change: 'Created', changeType: 'positive', icon: 'ClipboardList', onClick: () => navigate('/school/teacher/assessments') },
  ];

  return (
    <div className="dashboard">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {/* Welcome Banner */}
        <div className="lg:col-span-2 xl:col-span-3 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl shadow-teal-900/10">
          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none hidden md:block select-none drop-shadow-2xl z-20">
            <img src={TeacherAvatar} alt="Teacher Illustration" className="w-full h-full object-contain animate-float mix-blend-multiply dark:mix-blend-normal" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:pr-64">
              <div>
                <h1 className="text-3xl font-black tracking-tight">Welcome, {user?.name || 'Teacher'}! 👩‍🏫✨</h1>
                <p className="mt-2 max-w-xl text-teal-50 font-medium leading-relaxed font-sans">
                  Empower your students with structured learning, live classes, and instant performance tracking.
                </p>
              </div>
            </div>
            
            <div className="mt-8 self-start inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-2 backdrop-blur-md border border-white/20 shadow-sm">
              <Sparkles className="h-5 w-5 text-teal-200" />
              <span className="text-base font-semibold tracking-wide text-white">Manage Smarter. Educate Better.</span>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
        </div>

        {/* Smart Calendar */}
        <div className="lg:col-span-1 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <SmartCalendar />
        </div>
      </div>

      <div className="dashboard__stats">
        {dashboardStats.map((stat, idx) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType as any}
            icon={iconMap[stat.icon]}
            className={`stagger-${idx + 1}`}
            onClick={stat.onClick}
          />
        ))}
      </div>

      <div className="dashboard__grid">
        <div className="dashboard__main">
          {/* Attendance Summary — real data */}
          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Attendance Summary 📊</h3>
              <Badge variant="info">
                {attendanceClassCount > 0
                  ? `Classes: ${classesLabel}`
                  : 'No data'}
              </Badge>
            </div>
            {attendanceTotal > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{attendancePresent}</p>
                    <p className="text-xs font-semibold text-emerald-700/70 dark:text-emerald-300/70 mt-1">Present</p>
                  </div>
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center border border-red-100 dark:border-red-800/30">
                    <p className="text-2xl font-black text-red-600 dark:text-red-400">{attendanceAbsent}</p>
                    <p className="text-xs font-semibold text-red-700/70 dark:text-red-300/70 mt-1">Absent</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-center border border-amber-100 dark:border-amber-800/30">
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{attendanceLate}</p>
                    <p className="text-xs font-semibold text-amber-700/70 dark:text-amber-300/70 mt-1">Late</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center border border-blue-100 dark:border-blue-800/30">
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{attendanceLeave}</p>
                    <p className="text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 mt-1">Leave</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attendance Rate</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">{attendancePercentage}%</span>
                  </div>
                  <ProgressBar value={attendancePercentage} size="sm" showValue={false} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No attendance records found. Start marking attendance to see statistics.</p>
            )}
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Quick Actions ⚡</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/school/teacher/attendance')}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                  <CheckSquare size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Take Attendance</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Mark today's roll</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/school/teacher/assignments')}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <PlusCircle size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Create Assignment</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">New homework</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/school/teacher/assessments')}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-colors">
                  <ClipboardList size={20} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Create Assessment</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">New test / exam</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/school/teacher/live')}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-700 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center group-hover:bg-rose-200 dark:group-hover:bg-rose-800/50 transition-colors">
                  <Video size={20} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Start Live Class</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Go live now</p>
                </div>
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="dashboard__side">
          {/* My Subjects — limited to 4 + View All */}
          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>My Subjects 🎓</h3>
              {teacherSubjects.length > MAX_SUBJECTS_SHOWN && (
                <button
                  onClick={() => navigate('/school/teacher/classes')}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All <ChevronRight size={14} />
                </button>
              )}
            </div>
            <div className="dashboard__classes-list space-y-3">
              {visibleSubjects.length > 0 ? (
                <>
                  {visibleSubjects.map((assignment: any, idx: number) => {
                    const isActive = activeAcademicContext?.subjectId === assignment.subjectId && activeAcademicContext?.classId === assignment.classId;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveAcademicContext(assignment);
                          toast.success(`Active context set to ${assignment.className} - ${assignment.sectionName} - ${assignment.subjectName}`);
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${isActive ? 'bg-brand-50 border-brand-500 shadow-sm' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-brand-300'}`}
                      >
                        <h4 className={`text-sm font-bold ${isActive ? 'text-brand-700' : 'text-surface-900 dark:text-white'}`}>
                          {assignment.className} - {assignment.sectionName}
                        </h4>
                        <p className="text-xs text-surface-500 mt-0.5">{assignment.subjectName}</p>
                      </div>
                    );
                  })}
                  {hiddenSubjectCount > 0 && (
                    <button
                      onClick={() => navigate('/school/teacher/classes')}
                      className="w-full p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all text-center"
                    >
                      +{hiddenSubjectCount} More →
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No subjects assigned.</p>
              )}
            </div>
          </GlassCard>

          {/* Upcoming Classes */}
          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Upcoming Classes 🏫</h3>
              <Badge variant="purple">{upcomingClasses.length} Remaining ⏰</Badge>
            </div>
            <div className="dashboard__classes-list">
              {upcomingClasses.map((cls) => (
                <div key={cls.id} className="dashboard__class-item">
                  <div className="dashboard__class-time">
                    <Clock size={14} />
                    <span>{cls.time}</span>
                  </div>
                  <div className="dashboard__class-info flex items-center justify-between w-full">
                    <div>
                      <p className="dashboard__class-subject">{cls.subject}</p>
                      <div className="dashboard__class-meta">
                        <span>Class {cls.class}</span>
                        {(!cls.type || cls.type.toLowerCase() !== 'live') && (
                          <span><MapPin size={12} /> {cls.room}</span>
                        )}
                      </div>
                    </div>
                    {(cls.type && cls.type.toLowerCase() === 'live') && (
                      <Link to="/school/teacher/live" className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700">
                        Join Live
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {upcomingClasses.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">No upcoming classes remaining today.</p>}
            </div>
          </GlassCard>

          {/* Student Doubts */}
          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Student Doubts 💬</h3>
              <Badge variant={pendingDoubts > 0 ? 'error' : 'success'}>
                {pendingDoubts > 0 ? `${pendingDoubts} pending` : 'Clear'}
              </Badge>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Students in your classes can ask AI or escalate to you from Ask a Doubt.
            </p>
            <Link
              to="/school/teacher/doubts"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              <MessageSquare size={18} />
              Open doubt panel
            </Link>
          </GlassCard>

          {/* Notifications */}
          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header flex items-center justify-between">
              <h3>Notifications 🔔</h3>
              <div className="flex items-center gap-2">
                <Badge variant="error">{unreadNotificationsCount} new ⚡</Badge>
                <Link to="/school/teacher/notifications" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold">View all</Link>
              </div>
            </div>
            <div className="dashboard__notifications-list">
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`dashboard__notification ${!n.isRead ? 'dashboard__notification--unread' : ''}`}
                    title="Click to mark as read and view"
                  >
                    <div className={`dashboard__notification-icon dashboard__notification-icon--${n.type}`}>
                      {n.type === 'error' ? <CalendarDays size={14} /> : <FileText size={14} />}
                    </div>
                    <div className="dashboard__notification-content">
                      <p className={`dashboard__notification-title ${!n.isRead ? 'font-bold' : ''}`}>{n.title}</p>
                      <span className="dashboard__notification-time">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No notifications available.</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
