import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, FileText, ClipboardList, Clock, MapPin, MessageSquare, CalendarDays,
  ChevronRight, CheckSquare, PlusCircle, Video, TrendingUp, AlertCircle, ArrowUpRight,
  BookOpen, Edit3, UploadCloud, Calendar, ArrowRight, Presentation
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { useAuth } from '@/context/SchoolAuthContext';
import { useAcademicStore } from '@/lib/academic-store';
import { toast } from 'sonner';
import TeacherAvatar from '@/assets/images/Teacher_Avatar.png';
import BgBanner from '@/assets/images/bgbanner3.png';
import ImgChalkboard from '@/assets/images/10.png';
import ImgGlobe from '@/assets/images/11 (1).png';
import ImgPencils1 from '@/assets/images/3 (1).png';
import ImgPencils2 from '@/assets/images/9.png';
import ImgLaptop from '@/assets/images/4 (2).png';
import ImgGradCap from '@/assets/images/6.png';
import ImgChalkboardAlt from '@/assets/images/8.png';
import MaintenanceBroadcastBanner from '@/components/shared/MaintenanceBroadcastBanner';
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

const MAX_CLASS_CARDS_SHOWN = 4;

// Today's Schedule timeline — shared by the desktop panel (in the banner
// row) and the mobile/tablet panel (stacked below it, since the two never
// show at the same time).
const scheduleItems = [
  { time: '09:00 AM', timeColor: '#1E293B', subject: 'Mathematics', meta: 'Class 10 - Section A', dot: '#10B981',
    badge: (
      <Badge variant="outline" className="gap-1 text-[9px] sm:text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-1 border-[#D1FAE5]">
        <div className="size-1.5 rounded-full bg-[#10B981] animate-pulse" /> Live
      </Badge>
    ) },
  { time: '11:00 AM', timeColor: '#64748B', subject: 'Science', meta: 'Class 9 - Section A', dot: '#3B82F6',
    badge: (
      <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-1 border-[#DBEAFE]">
        Upcoming
      </Badge>
    ) },
  { time: '02:00 PM', timeColor: '#64748B', subject: 'Assignment Review', meta: 'Class 10 - Section A', dot: '#9333EA',
    badge: (
      <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold text-[#9333EA] bg-[#FAF5FF] px-2 py-1 border-[#F3E8FF]">
        Review
      </Badge>
    ) },
];

const ScheduleTimeline = () => (
  <div className="relative pl-6 space-y-8">
    <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-slate-100" />
    {scheduleItems.map((item) => (
      <div className="relative" key={item.subject}>
        <div className="absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-white" style={{ background: item.dot }} />
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold mb-1" style={{ color: item.timeColor }}>{item.time}</p>
            <p className="text-[14px] sm:text-[15px] font-bold text-[#112A46]">{item.subject}</p>
            <p className="text-[10px] sm:text-[11px] font-medium text-[#64748B]">{item.meta}</p>
          </div>
          {item.badge}
        </div>
      </div>
    ))}
  </div>
);

const performanceData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 68 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 78 },
  { name: 'Sat', score: 82 },
];

const donutData = [
  { name: 'Excellent', value: 15, color: '#10B981' },
  { name: 'Good', value: 18, color: '#3B82F6' },
  { name: 'Average', value: 7, color: '#F59E0B' },
  { name: 'Needs Help', value: 2, color: '#EF4444' },
];

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
        api.get('/dashboard/stats', { params: { portal: 'teacher' } }),
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

  // Teacher assignments: group flat list by class+section so each card shows all subjects
  const teacherSubjects: any[] = stats?.teacherData?.assignments || [];
  const classSectionGroups = useMemo(() => {
    const map = new Map<string, { classId: string; className: string; sectionId: string; sectionName: string; isClassTeacher: boolean; subjects: { subjectId: string; subjectName: string }[] }>();
    for (const a of teacherSubjects) {
      const key = `${a.classId}__${a.sectionId}`;
      if (!map.has(key)) {
        map.set(key, { classId: a.classId, className: a.className, sectionId: a.sectionId, sectionName: a.sectionName, isClassTeacher: a.isClassTeacher, subjects: [] });
      }
      if (a.subjectId) {
        map.get(key)!.subjects.push({ subjectId: a.subjectId, subjectName: a.subjectName });
      }
    }
    return Array.from(map.values());
  }, [teacherSubjects]);
  const visibleGroups = classSectionGroups.slice(0, MAX_CLASS_CARDS_SHOWN);
  const hiddenGroupCount = Math.max(0, classSectionGroups.length - MAX_CLASS_CARDS_SHOWN);

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
    { id: 'students', title: 'Students', value: stats?.totalStudents ?? 0, change: 'Assigned', changeType: 'positive', icon: 'Users', onClick: () => navigate('/school/teacher/students') },
    { id: 'classes', title: 'Classes Today', value: upcomingClasses.length, change: 'Remaining', changeType: 'neutral', icon: 'UserCheck', onClick: () => navigate('/school/teacher/timetable') },
    { id: 'assignments', title: 'Assignments', value: stats?.assignments ?? 0, change: 'Created', changeType: 'positive', icon: 'FileText', onClick: () => navigate('/school/teacher/assignments') },
    { id: 'assessments', title: 'Assessments', value: stats?.assessments ?? 0, change: 'Created', changeType: 'positive', icon: 'ClipboardList', onClick: () => navigate('/school/teacher/assessments') },
  ];

  return (
    <div className="dashboard">
      <MaintenanceBroadcastBanner />
      <div className="flex flex-col gap-6 mb-6">
        {/* Welcome Banner — full width */}
        <Card className="relative overflow-hidden rounded-[2rem] shadow-sm group min-h-[300px] border-0">
          <div className="absolute inset-0 bg-cover bg-[center_top] bg-no-repeat z-0" style={{ backgroundImage: `url(${BgBanner})` }} />
          <div className="absolute inset-y-0 left-0 w-full md:w-[60%] lg:w-[45%] bg-gradient-to-r from-white/95 via-white/70 to-transparent z-10" />

          <CardContent className="relative z-20 flex flex-col justify-center max-w-xl p-6 md:p-8 min-h-[300px]">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#112A46] tracking-tight leading-tight">
              Welcome back, <br /><span className="text-blue-600">{user?.name || 'Teacher'}!</span>
            </h1>
            <div className="my-1.5">
              <p className="text-[15px] font-medium text-slate-700/90 leading-relaxed max-w-md">Here's what's happening with your classes today. You have {upcomingClasses.length} upcoming sessions.</p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule + Today's Overview — side by side, 50/50 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm flex flex-col overflow-hidden">
          <CardHeader className="p-5 sm:p-6 flex-row justify-between items-center space-y-0 bg-white">
            <CardTitle className="text-[15px] sm:text-[17px] font-extrabold text-[#112A46] flex items-center gap-2 leading-normal tracking-normal">
              <Calendar size={18} className="text-[#1C4ED8]" /> Today's Schedule
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-auto text-[10px] sm:text-[11px] font-bold text-[#1C4ED8] bg-[#EFF6FF] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full gap-1 hover:bg-blue-100 hover:text-[#1C4ED8]">
              <PlusCircle size={14} /> Add
            </Button>
          </CardHeader>
          <Separator className="bg-slate-100" />
          <CardContent className="p-5 sm:p-6">
            <ScheduleTimeline />
          </CardContent>
          <Separator className="bg-slate-100" />
          <CardFooter className="p-4 bg-white">
            <Button variant="link" onClick={() => navigate('/school/teacher/timetable')} className="w-full h-auto text-[12px] sm:text-[13px] font-bold text-[#1C4ED8] hover:text-[#1E40AF] hover:no-underline gap-1">
              View Full Calendar <ArrowRight size={16} />
            </Button>
          </CardFooter>
        </Card>

        {/* Today's Overview — full width */}
        <Card className="bg-white rounded-[2rem] p-6 shadow-sm border-slate-100">
        <div className="flex justify-between items-end mb-6">
          <CardTitle className="text-xl font-extrabold text-[#112A46] tracking-tight leading-normal">Today's Overview</CardTitle>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Students Card */}
          <Card className="bg-[#F0F7FF] rounded-[1.5rem] p-5 border-[#E0F0FE]/60 flex flex-col hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => navigate('/school/teacher/students')}>
            <div className="flex items-start gap-4">
              <div className="bg-[#E0F0FE] text-[#2563EB] size-14 flex items-center justify-center rounded-full shrink-0 shadow-sm"><Users size={24} /></div>
              <div className="flex flex-col min-w-0">
                <p className="text-3xl font-black text-[#1E293B] leading-none">{stats?.totalStudents ?? 0}</p>
                <p className="text-sm font-semibold text-[#64748B] mt-1 break-words">Students</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-[12px] font-bold text-[#059669]">
              <div className="size-2 rounded-full bg-[#10B981]"></div>
              Total Assigned
            </div>
          </Card>

          {/* Classes Today Card */}
          <Card className="bg-[#FFF7ED] rounded-[1.5rem] p-5 border-[#FFEDD5]/60 flex flex-col hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => navigate('/school/teacher/timetable')}>
            <div className="flex items-start gap-4">
              <div className="bg-[#FFEDD5] text-[#EA580C] size-14 flex items-center justify-center rounded-full shrink-0 shadow-sm"><Presentation size={24} /></div>
              <div className="flex flex-col min-w-0">
                <p className="text-3xl font-black text-[#1E293B] leading-none">{upcomingClasses.length}</p>
                <p className="text-sm font-semibold text-[#64748B] mt-1 break-words">Classes Today</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-[12px] font-bold text-[#EA580C]">
              <div className="size-2 rounded-full bg-[#F97316]"></div>
              Remaining
            </div>
          </Card>

          {/* Assignments Card */}
          <Card className="bg-[#F5F3FF] rounded-[1.5rem] p-5 border-[#EDE9FE]/60 flex flex-col hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => navigate('/school/teacher/assignments')}>
            <div className="flex items-start gap-4">
              <div className="bg-[#EDE9FE] text-[#7C3AED] size-14 flex items-center justify-center rounded-full shrink-0 shadow-sm"><FileText size={24} /></div>
              <div className="flex flex-col min-w-0">
                <p className="text-3xl font-black text-[#1E293B] leading-none">{stats?.assignments ?? 0}</p>
                <p className="text-sm font-semibold text-[#64748B] mt-1 break-words">Assignments</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-[12px] font-bold text-[#7C3AED]">
              <div className="size-2 rounded-full bg-[#8B5CF6]"></div>
              Active
            </div>
          </Card>

          {/* Assessments Card */}
          <Card className="bg-[#FEF2F2] rounded-[1.5rem] p-5 border-[#FEE2E2]/60 flex flex-col hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => navigate('/school/teacher/assessments')}>
            <div className="flex items-start gap-4">
              <div className="bg-[#FEE2E2] text-[#DC2626] size-14 flex items-center justify-center rounded-full shrink-0 shadow-sm"><CheckSquare size={24} /></div>
              <div className="flex flex-col min-w-0">
                <p className="text-3xl font-black text-[#1E293B] leading-none">{stats?.assessments ?? 0}</p>
                <p className="text-sm font-semibold text-[#64748B] mt-1 break-words">Assessments</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-[12px] font-bold text-[#2563EB]">
              <div className="size-2 rounded-full bg-[#3B82F6]"></div>
              Scheduled
            </div>
          </Card>
        </div>
        </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white rounded-[2rem] p-6 shadow-sm border-slate-100 mb-6">
        <div className="flex justify-between items-end mb-6">
          <CardTitle className="text-[22px] font-extrabold text-[#112A46] tracking-tight leading-normal">Quick Actions</CardTitle>
          <Button variant="link" className="h-auto p-0 text-[13px] font-bold text-[#1C4ED8] hover:text-[#1E40AF] hover:no-underline gap-1">View All <ArrowRight size={16} /></Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Take Attendance', desc: "Track student presence", icon: <UserCheck size={20} />, graphic: ImgGradCap, bg: 'bg-[#D1F2EB] hover:bg-[#D1F2EB]', iconBg: 'bg-[#A9DFD1]/40', text: 'text-[#0E6655]', path: '/school/teacher/attendance' },
            { label: 'Create Assignment', desc: 'Set and share tasks', icon: <PlusCircle size={20} />, graphic: ImgPencils1, bg: 'bg-[#E8DAFF] hover:bg-[#E8DAFF]', iconBg: 'bg-[#D2BCF6]/50', text: 'text-[#5B2C6F]', path: '/school/teacher/assignments' },
            { label: 'Create Assessment', desc: 'Test & analyze learning', icon: <ClipboardList size={20} />, graphic: ImgChalkboardAlt, bg: 'bg-[#FDEBD0] hover:bg-[#FDEBD0]', iconBg: 'bg-[#FAD7A1]/50', text: 'text-[#935116]', path: '/school/teacher/assessments' },
            { label: 'Start Live Class', desc: 'Engage students in real time', icon: <Video size={20} />, graphic: ImgLaptop, bg: 'bg-[#FADBD8] hover:bg-[#FADBD8]', iconBg: 'bg-[#F5B7B1]/50', text: 'text-[#78281F]', path: '/school/teacher/classes', state: { scheduleLive: true } },
          ].map(({ label, desc, icon, graphic, bg, iconBg, text, path, state }) => (
            <Button
              key={label}
              variant="ghost"
              onClick={() => navigate(path, { state })}
              className={`relative overflow-hidden flex items-center justify-between p-5 h-auto rounded-2xl ${bg} shadow-sm transition-transform hover:-translate-y-1 group border-0 min-h-[100px] whitespace-normal`}
            >
              <div className="flex items-center gap-3 z-10 w-full pr-[60px]">
                <div className={`size-10 rounded-full ${iconBg} flex items-center justify-center transition-colors ${text} shrink-0`}>
                  {icon}
                </div>
                <div className="flex flex-col items-start text-left min-w-0">
                  <p className={`text-[15px] font-extrabold ${text} leading-tight mb-1 break-words`}>{label}</p>
                  <p className={`text-[11px] font-semibold ${text} opacity-80 leading-tight break-words`}>{desc}</p>
                </div>
              </div>
              {/* 3D Graphic */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <img src={graphic} alt="" className="h-20 w-auto object-contain drop-shadow-md mix-blend-multiply" style={{ mixBlendMode: 'normal' }} />
              </div>
            </Button>
          ))}
        </div>
      </Card>

      <div className="dashboard__grid">
        <div className="dashboard__main">

          {/* Performance & Needs Attention Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
            {/* Student Performance */}
            <Card className="bg-white rounded-[1.5rem] p-7 border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <CardTitle className="text-lg font-extrabold text-slate-900 tracking-tight leading-normal">Student Performance</CardTitle>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Class 10 - Section A</p>
                </div>
                <Select defaultValue="class-10-a">
                  <SelectTrigger className="w-auto h-8 gap-2 text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 rounded-lg px-3 py-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class-10-a" className="text-xs font-semibold">Class 10 - Section A</SelectItem>
                    <SelectItem value="class-9-a" className="text-xs font-semibold">Class 9 - Section A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 flex-1 items-center">
                <div className="flex-1 w-full relative">
                  <div className="absolute top-0 left-0">
                    <p className="text-xs font-bold text-slate-500">Average Performance</p>
                    <div className="flex items-end gap-2 mt-1">
                      <p className="text-3xl font-black text-slate-900 leading-none">78%</p>
                      <Badge variant="secondary" className="gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-50 px-1.5 py-0.5 rounded mb-1 border-0">
                        <TrendingUp size={12} /> 6%
                      </Badge>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">vs last month</p>
                  </div>
                  <div className="h-40 w-full mt-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(val) => `${val}%`} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6 w-full sm:w-auto h-full">
                  <div className="relative size-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900 leading-none">42</span>
                      <span className="text-[9px] font-bold text-slate-500 mt-0.5">Students</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {donutData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-none">{item.value}</p>
                          <p className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-none">{item.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* My Classes */}
            <Card className="bg-white rounded-[1.5rem] p-7 border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-end mb-6">
                <CardTitle className="text-lg font-extrabold text-slate-900 tracking-tight leading-normal">My Classes</CardTitle>
                <Button variant="link" onClick={() => navigate('/school/teacher/classes')} className="h-auto p-0 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:no-underline">View All</Button>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                {/* Class Card 1 */}
                <Card className="bg-[#F8FAFC] rounded-[1.5rem] p-3 border-slate-100 shadow-none flex gap-4 hover:shadow-sm transition-shadow cursor-pointer items-stretch" onClick={() => navigate('/school/teacher/classes')}>
                  {/* Left Image Placeholder */}
                  <div className="w-[110px] bg-[#E8F4FD] rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden">
                    <img src={ImgChalkboard} alt="Classroom" className="absolute inset-0 size-full object-cover scale-110" />
                  </div>
                  
                  {/* Right Content */}
                  <div className="flex flex-col flex-1 min-w-0 py-1 pr-2 justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-[17px] font-extrabold text-[#112A46] leading-tight truncate min-w-0">Class 10 - Section A</h3>
                      <Badge variant="secondary" className="text-[10px] font-bold bg-[#DCFCE7] hover:bg-[#DCFCE7] text-[#059669] px-2.5 py-1 shrink-0 border-0">Class Teacher</Badge>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 my-2">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#475569]">
                        <Users size={14} className="text-[#64748B]"/> 42 Students
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#475569]">
                        <BookOpen size={14} className="text-[#64748B]"/> 6 Subjects
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold px-3 py-1.5 bg-blue-100/50 text-blue-700 border-blue-200/50">Mathematics</Badge>
                      <Badge variant="outline" className="text-[10px] font-bold px-3 py-1.5 bg-blue-100/50 text-blue-700 border-blue-200/50">Science</Badge>
                      <Badge variant="outline" className="text-[10px] font-bold px-3 py-1.5 bg-blue-100/50 text-blue-700 border-blue-200/50">History</Badge>
                      <Badge variant="secondary" className="text-[10px] font-bold px-2 py-1.5 bg-indigo-100/50 hover:bg-indigo-100/50 text-indigo-700 border-0">+2</Badge>
                    </div>
                  </div>
                </Card>

                {/* Class Card 2 */}
                <Card className="bg-[#F8FAFC] rounded-[1.5rem] p-3 border-slate-100 shadow-none flex gap-4 hover:shadow-sm transition-shadow cursor-pointer items-stretch" onClick={() => navigate('/school/teacher/classes')}>
                  {/* Left Image Placeholder */}
                  <div className="w-[110px] bg-[#F3E8FF] rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden">
                    <img src={ImgGlobe} alt="Globe" className="absolute inset-0 size-full object-cover scale-110" />
                  </div>
                  
                  {/* Right Content */}
                  <div className="flex flex-col flex-1 min-w-0 py-1 pr-2 justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-[17px] font-extrabold text-[#112A46] leading-tight truncate min-w-0">Class 9 - Section A</h3>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 my-2">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#475569]">
                        <Users size={14} className="text-[#64748B]"/> 39 Students
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#475569]">
                        <BookOpen size={14} className="text-[#64748B]"/> 7 Subjects
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold px-3 py-1.5 bg-purple-100/50 text-purple-700 border-purple-200/50">Mathematics</Badge>
                      <Badge variant="outline" className="text-[10px] font-bold px-3 py-1.5 bg-purple-100/50 text-purple-700 border-purple-200/50">English</Badge>
                      <Badge variant="outline" className="text-[10px] font-bold px-3 py-1.5 bg-purple-100/50 text-purple-700 border-purple-200/50">Science</Badge>
                      <Badge variant="secondary" className="text-[10px] font-bold px-2 py-1.5 bg-indigo-100/50 hover:bg-indigo-100/50 text-indigo-700 border-0">+2</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="mt-4">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-extrabold text-[#112A46] tracking-tight">Recent Activity</h2>
              <Button variant="link" className="h-auto p-0 text-[13px] font-bold text-[#1C4ED8] hover:text-[#1E40AF] hover:no-underline gap-1">View All <ArrowRight size={16} /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <FileText size={18} />, color: 'text-purple-600', bg: 'bg-purple-100', title: 'Assignment Created', sub: 'Quadratic Equations', context: 'Class 10', time: '2 hours ago' },
                { icon: <ClipboardList size={18} />, color: 'text-blue-600', bg: 'bg-blue-100', title: 'Assessment Published', sub: 'Chapter 3 - Science', context: 'Class 9', time: '4 hours ago' },
                { icon: <Users size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-100', title: 'Attendance Updated', sub: 'Class 9 - Section A', context: '5 students absent', time: 'Yesterday' },
                { icon: <BookOpen size={18} />, color: 'text-amber-600', bg: 'bg-amber-100', title: 'Study Material Added', sub: 'Triangles - Class 9', context: 'Video and PDF', time: 'Yesterday' },
              ].map((item, idx) => (
                <Card key={idx} className="bg-white rounded-3xl p-5 border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900 leading-tight">{item.title}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <p className="text-xs font-semibold text-slate-700">{item.context}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{item.time}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

        </div>

        <div className="dashboard__side">
          {/* Needs Your Attention */}
          <div className="flex flex-col gap-5 mt-2">
            <div className="flex justify-between items-end mb-1">
              <h2 className="text-[20px] font-extrabold text-[#112A46] tracking-tight">Needs Your Attention</h2>
              <Button variant="link" className="h-auto p-0 text-[13px] font-bold text-[#1C4ED8] hover:text-[#1E40AF] hover:no-underline gap-1">See All <ArrowRight size={16}/></Button>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { icon: <AlertCircle size={16}/>, color: 'text-rose-600', bg: 'bg-rose-50', title: 'Low Attendance Alert', desc: '3 students below 75% in Class 10A' },
                { icon: <Clock size={16}/>, color: 'text-amber-600', bg: 'bg-amber-50', title: 'Pending Evaluations', desc: '15 assignments waiting for review' },
                { icon: <MessageSquare size={16}/>, color: 'text-blue-600', bg: 'bg-blue-50', title: 'Unanswered Doubts', desc: '4 new questions from Science batch' },
              ].map((item, idx) => (
                <Card key={idx} className="bg-white rounded-2xl p-4 shadow-sm border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                        {item.icon}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-900 leading-tight">{item.title}</p>
                      <p className="text-[12px] font-medium text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Card>
              ))}
            </div>
          </div>

          {/* Quote Card */}
          <Card className="mt-4 bg-gradient-to-br from-[#E8F4FD] to-[#F1F8FE] rounded-2xl p-6 border-[#D1E9FA] shadow-sm relative overflow-hidden">
            <div className="absolute right-2 bottom-0 size-24 opacity-60">
              {/* Stack of books illustration placeholder */}
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 80 L90 80 L90 90 L10 90 Z" fill="#1C4ED8" />
                <path d="M15 70 L85 70 L85 80 L15 80 Z" fill="#3B82F6" />
                <path d="M20 60 L80 60 L80 70 L20 70 Z" fill="#60A5FA" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-serif text-blue-400 leading-none mb-1">"</div>
              <p className="text-[15px] font-bold text-slate-800 leading-snug pr-8 italic mb-3">
                "Great teachers don't just teach, they inspire."
              </p>
              <p className="text-xs font-semibold text-slate-500">- Unknown</p>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
