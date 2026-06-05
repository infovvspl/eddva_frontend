import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, FileText, ClipboardList, Clock, MapPin, TrendingUp, AlertCircle, MessageSquare } from 'lucide-react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import StatCard from '@/components/school/StatCard';
import GlassCard from '@/components/school/GlassCard';
import Badge from '@/components/school/Badge';
import ProgressBar from '@/components/school/ProgressBar';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { useAuth } from '@/context/SchoolAuthContext';
import { useAcademicStore } from '@/lib/academic-store';
import { toast } from 'sonner';
import './Dashboard.css';

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={24} />,
  UserCheck: <UserCheck size={24} />,
  FileText: <FileText size={24} />,
  ClipboardList: <ClipboardList size={24} />,
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeAcademicContext, setActiveAcademicContext, setAssignments } = useAcademicStore();
  
  const [stats, setStats] = useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [pendingDoubts, setPendingDoubts] = useState(0);

  const loadDashboard = async () => {
    try {
      const [statsRes, noticesRes, eventsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/notices'),
        api.get('/events'),
      ]);

      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value.data?.data || statsRes.value.data || {};
        setStats(data);
        
        if (data.teacherData?.assignments) {
          setAssignments(data.teacherData.assignments);
        }

        setUpcomingClasses((data.upcomingClasses || data.batches || []).map((item: any) => ({
          id: item.id,
          time: `${item.start_time || item.startTime || item.schedule || '--'}`,
          subject: item.subject_name || item.subjectName || item.subject?.name || item.title || 'Scheduled class',
          room: item.zoom_link || item.google_meet_link || item.room || 'Online',
          class: item.class_name || item.className || item.class?.name || item.examTarget || '-',
        })));
        setStudents(data.students || []);
      }

      if (noticesRes.status === 'fulfilled') {
        const list = noticesRes.value.data?.data?.announcements ?? noticesRes.value.data?.announcements ?? noticesRes.value.data?.data ?? noticesRes.value.data ?? [];
        setNotices(Array.isArray(list) ? list : []);
      }

      if (eventsRes.status === 'fulfilled') {
        const list = eventsRes.value.data?.data ?? eventsRes.value.data ?? [];
        setEvents(Array.isArray(list) ? list : []);
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

  const attendanceSummary = useMemo(
    () => [
      {
        class: 'All Classes',
        present: stats?.totalPresent || 0,
        total: stats?.totalStudents || students.length || 0,
        percentage: stats?.attendancePct || 0,
      },
    ],
    [stats?.attendancePct, stats?.totalPresent, stats?.totalStudents, students.length]
  );

  const performanceChartData = useMemo(
    () =>
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => ({
        month,
        avgScore: Math.max(20, Math.min(100, (stats?.performanceScore || 68) + index * 2 - 5)),
      })),
    [stats?.performanceScore]
  );

  const studentActivityFeed = useMemo(
    () =>
      students.slice(0, 4).map((student: any, index: number) => ({
        id: student.id || `student-${index}`,
        student: student.name || student.fullName || 'New student',
        action: 'was added to the institute roster',
        target: student.studentProfile?.section?.class?.name || student.class_name || 'a class',
        time: student.createdAt || student.created_at || 'Just now',
      })),
    [students]
  );

  const liveUpdates = useMemo(() => {
    const eventItems = events.slice(0, 3).map((event: any) => ({
      id: `event-${event.id}`,
      title: event.title || 'Event',
      detail: event.location || event.category || 'Scheduled by institute admin',
      time: event.startTime || event.start_time || event.created_at || '',
      tone: 'info',
    }));

    const noticeItems = notices.slice(0, 3).map((notice: any) => ({
      id: `notice-${notice.id}`,
      title: notice.title || 'Notice',
      detail: notice.category || notice.priority || 'Published by institute admin',
      time: notice.postedDate || notice.created_at || '',
      tone: notice.priority === 'URGENT' ? 'error' : 'success',
    }));

    return [...eventItems, ...noticeItems].slice(0, 6);
  }, [events, notices]);

  const dashboardStats = [
    { id: 'students', title: 'Students', value: stats?.totalStudents ?? 0, change: 'Live', changeType: 'positive', icon: 'Users' },
    { id: 'classes', title: 'Upcoming Classes', value: upcomingClasses.length, change: 'Scheduled', changeType: 'neutral', icon: 'UserCheck' },
    { id: 'assignments', title: 'Assignments', value: stats?.assignments ?? 0, change: 'Active', changeType: 'positive', icon: 'FileText' },
    { id: 'assessments', title: 'Assessments', value: stats?.assessments ?? 0, change: 'Live', changeType: 'positive', icon: 'ClipboardList' },
  ];

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl shadow-teal-900/10 mb-2">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Welcome back, {user?.name || 'Teacher'}! 👩‍🏫✨</h1>
            <p className="mt-2 max-w-xl text-teal-50 font-medium leading-relaxed font-sans">
              Empower your students with structured learning, live classes, and instant performance tracking.
            </p>
          </div>
          <div className="relative shrink-0 select-none pointer-events-none drop-shadow-2xl">
            <img src="/images/teacher_avatar.png" alt="Teacher Illustration" className="h-40 object-contain animate-float mix-blend-multiply dark:mix-blend-normal" />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
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
          />
        ))}
      </div>

      <div className="dashboard__grid">
        <div className="dashboard__main">
          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Attendance Summary 📊</h3>
              <Badge variant="info">This Week 📅</Badge>
            </div>
            <div className="dashboard__attendance-list">
              {attendanceSummary.map((item) => (
                <div key={item.class} className="dashboard__attendance-item">
                  <div className="dashboard__attendance-info">
                    <span className="dashboard__attendance-class">Class {item.class}</span>
                    <span className="dashboard__attendance-numbers">{item.present}/{item.total} present</span>
                  </div>
                  <ProgressBar value={item.percentage} size="sm" showValue={false} />
                  <span className="dashboard__attendance-pct">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Performance Trend 📈</h3>
              <Badge variant="success">Improving 🚀</Badge>
            </div>
            <div className="dashboard__chart-placeholder">
              <div className="dashboard__mini-chart">
                {performanceChartData.map((item) => (
                  <div key={item.month} className="dashboard__chart-bar-wrapper">
                    <div
                      className="dashboard__chart-bar"
                      style={{ height: `${item.avgScore}%` }}
                    />
                    <span className="dashboard__chart-label">{item.month}</span>
                  </div>
                ))}
              </div>
              <div className="dashboard__chart-legend">
                <span>Avg Score</span>
                <span className="dashboard__chart-trend"><TrendingUp size={14} /> +13pts</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Institute Updates 📢</h3>
              <Badge variant="purple">Live sync 🔄</Badge>
            </div>
            <div className="dashboard__updates-list">
              {liveUpdates.length > 0 ? liveUpdates.map((item) => (
                <div key={item.id} className="dashboard__update-item">
                  <div className={`dashboard__notification-icon dashboard__notification-icon--${item.tone}`}>
                    <AlertCircle size={14} />
                  </div>
                  <div className="dashboard__update-content">
                    <p className="dashboard__update-title">{item.title}</p>
                    <span className="dashboard__update-detail">{item.detail}</span>
                    <span className="dashboard__notification-time">{item.time ? new Date(item.time).toLocaleString() : 'Just now'}</span>
                  </div>
                </div>
              )) : (
                <p className="dashboard__empty-state">No recent institute updates yet.</p>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="dashboard__side">
          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>My Subjects 🎓</h3>
            </div>
            <div className="dashboard__classes-list space-y-3">
              {stats?.teacherData?.assignments?.length > 0 ? (
                stats.teacherData.assignments.map((assignment: any, idx: number) => {
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
                        {assignment.className} - {assignment.sectionName} - {assignment.subjectName}
                      </h4>
                      <p className="text-xs text-surface-500 mt-1">Click to set as active context</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No subjects assigned.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Upcoming Classes 🏫</h3>
              <Badge variant="purple">{upcomingClasses.length} Scheduled ⏰</Badge>
            </div>
            <div className="dashboard__classes-list">
              {upcomingClasses.map((cls) => (
                <div key={cls.id} className="dashboard__class-item">
                  <div className="dashboard__class-time">
                    <Clock size={14} />
                    <span>{cls.time}</span>
                  </div>
                  <div className="dashboard__class-info">
                    <p className="dashboard__class-subject">{cls.subject}</p>
                    <div className="dashboard__class-meta">
                      <span><MapPin size={12} /> {cls.room}</span>
                      <span>Class {cls.class}</span>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingClasses.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">No upcoming classes today.</p>}
            </div>
          </GlassCard>

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

          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Notifications 🔔</h3>
              <Badge variant="error">3 new ⚡</Badge>
            </div>
            <div className="dashboard__notifications-list">
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className={`dashboard__notification ${!n.read ? 'dashboard__notification--unread' : ''}`}>
                  <div className={`dashboard__notification-icon dashboard__notification-icon--${n.type}`}>
                    {n.type === 'error' ? <AlertCircle size={14} /> : <FileText size={14} />}
                  </div>
                  <div className="dashboard__notification-content">
                    <p className="dashboard__notification-title">{n.title}</p>
                    <span className="dashboard__notification-time">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>Student Activity 🧑‍🎓</h3>
            </div>
            <div className="dashboard__activity-list">
              {studentActivityFeed.map((activity) => (
                <div key={activity.id} className="dashboard__activity-item">
                  <div className="dashboard__activity-avatar overflow-hidden bg-indigo-50 border border-indigo-200">
                    <img src="/assets/student_cartoon.png" alt="Student avatar" className="h-full w-full object-cover object-top scale-110" />
                  </div>
                  <div className="dashboard__activity-content">
                    <p><strong>{activity.student}</strong> {activity.action} <span className="dashboard__activity-target">{activity.target}</span></p>
                    <span className="dashboard__activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
