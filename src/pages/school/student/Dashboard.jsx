import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { motion } from 'framer-motion';
import bgBanner from '@/assets/images/bgbanner4.png';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import { readStudentDashboardCache, writeStudentDashboardCache } from '@/lib/school/student-dashboard-cache';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  FileText,
  Radio,
  Star,
  Target,
  ArrowRight,
  Atom,
  BookText,
  Calculator,
  FlaskConical,
  Leaf,
  Megaphone,
  Pencil,
  Award,
  Video,
  Pi
} from 'lucide-react';
import SmartCalendar from '@/components/school/SmartCalendar';
import './Dashboard.css';

function getSubjectConfig(name) {
  const lower = name.toLowerCase();
  if (lower.includes('physic')) return { Icon: Atom, color: 'text-purple-500', bg: 'bg-purple-50' };
  if (lower.includes('math')) return { Icon: Pi, color: 'text-amber-500', bg: 'bg-amber-50' };
  if (lower.includes('chem')) return { Icon: FlaskConical, color: 'text-blue-500', bg: 'bg-blue-50' };
  if (lower.includes('eng')) return { Icon: BookText, color: 'text-emerald-500', bg: 'bg-emerald-50' };
  if (lower.includes('bio')) return { Icon: Leaf, color: 'text-green-500', bg: 'bg-green-50' };
  return { Icon: BookOpen, color: 'text-slate-500', bg: 'bg-slate-50' };
}

function SectionHeader({ title, action, to, isDropdown }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-bold text-slate-900 text-[15px]">{title}</h3>
      {action && to ? (
        <Link to={to} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          {action} <ArrowRight size={12} />
        </Link>
      ) : action ? (
        <span className="text-[11px] font-bold text-slate-500 cursor-pointer flex items-center gap-1">
          {action} {isDropdown && <ChevronRight size={12} className="rotate-90" />}
        </span>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, bgColor, title, value, link, to, isGrayLink }) {
  return (
    <div className="bg-white rounded-[1.25rem] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col items-start gap-3 h-full">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] flex items-center justify-center ${bgColor} ${iconColor} shadow-sm shrink-0`}>
        <Icon size={20} className="sm:hidden" />
        <Icon size={22} className="hidden sm:block" />
      </div>
      <div className="mt-1">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 mb-1">{title}</p>
        <h3 className="text-xl sm:text-[22px] font-black text-slate-900 leading-none">{value}</h3>
      </div>
      {link && to ? (
        <Link to={to} className="text-[10px] sm:text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-auto pt-2">
          {link} <ArrowRight size={12} />
        </Link>
      ) : link ? (
        <span className={`text-[10px] sm:text-[11px] font-bold mt-auto pt-2 ${isGrayLink ? 'text-slate-400' : 'text-indigo-600'}`}>{link}</span>
      ) : null}
    </div>
  );
}

function NextLiveClassCard({ schedule }) {
  const liveItem = schedule?.find(i => i.type?.toLowerCase() === 'live') || schedule?.[0] || { subject: 'Physics', startTime: '08:45 AM', endTime: '09:30 AM' };

  return (
    <div className="bg-[#f0f4ff] rounded-[1.25rem] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full border border-[#e0e7ff]">
       <div className="flex items-start sm:items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e0e7ff] text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
             <Video size={20} className="sm:hidden" />
             <Video size={24} className="hidden sm:block" />
          </div>
          <div>
             <p className="text-[11px] sm:text-xs font-bold text-slate-800 mb-0.5">Next Live Class</p>
             <p className="text-[14px] sm:text-[15px] font-black text-slate-900 leading-tight">{liveItem.subjectName || liveItem.subject || liveItem.title || 'Class'}</p>
             <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-1">{liveItem.startTime || '00:00'} - {liveItem.endTime || '00:00'}</p>
          </div>
       </div>
       <Link to="/school/student/live-classes" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-bold py-2.5 px-6 rounded-lg transition-colors shrink-0 w-full sm:w-auto text-center shadow-sm">
          Join Now
       </Link>
    </div>
  );
}

function TimelineItem({ item, index, isLast }) {
  const { Icon, color, bg } = getSubjectConfig(item.subjectName || item.subject || item.title || '');

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && <div className="absolute left-[19px] top-[30px] bottom-0 w-[2px] bg-slate-100" />}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 ${bg} ${color} ring-4 ring-white`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 flex flex-col justify-start pt-0.5">
        <div className="flex justify-between items-start gap-2">
           <div className="min-w-0">
             <div className="flex items-center gap-2 mb-0.5">
               <p className="text-[10px] font-bold text-slate-400">{item.startTime || '00:00 AM'} - {item.endTime || '00:00 PM'}</p>
             </div>
             <h4 className="font-bold text-slate-900 text-sm truncate">{item.subjectName || item.subject || item.title || 'Class'}</h4>
             <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">{item.teacherName || 'Teacher'}</p>
           </div>
           {item.type?.toLowerCase() === 'live' ? (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-1 rounded shrink-0">Live Now</span>
           ) : (
              <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-3">Room {item.room || '101'}</span>
           )}
        </div>
      </div>
    </div>
  );
}

function Timeline({ schedule }) {
  const items = schedule?.length > 0 ? schedule : [
    { subject: 'Physics', teacherName: 'Mr. Rakesh Sharma', startTime: '08:45 AM', endTime: '09:30 AM', type: 'Live' },
    { subject: 'English', teacherName: 'Ms. Neha Verma', startTime: '09:45 AM', endTime: '10:30 AM', room: '203' },
    { subject: 'Mathematics', teacherName: 'Mr. Amit Kumar', startTime: '11:00 AM', endTime: '11:45 AM', room: '105' },
    { subject: 'Chemistry', teacherName: 'Ms. Priya Singh', startTime: '01:00 PM', endTime: '01:45 PM', room: '204' }
  ];

  return (
    <div className="mt-2 flex-1">
      {items.map((item, idx) => (
        <TimelineItem key={idx} item={item} index={idx} isLast={idx === items.length - 1} />
      ))}
    </div>
  );
}

function CircularProgress({ value }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative w-[110px] h-[110px] flex items-center justify-center shrink-0">
      <svg className="transform -rotate-90 w-[110px] h-[110px]">
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-indigo-600"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-[28px] font-black text-slate-900">{value}%</span>
        <span className="text-[9px] font-bold text-slate-500 text-center leading-tight mt-0.5">Overall<br/>Progress</span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, displayValue, colorClass }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex justify-between text-[11px] font-bold mb-1.5">
        <span className="text-slate-800">{label}</span>
        <span className="text-slate-500">{displayValue}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProgressCard({ assignments, mockTests }) {
  const assignmentTotal = assignments.length > 0 ? assignments.length : 10;
  const assignmentCompleted = assignments.filter(a => a.status === 'completed' || a.status === 'submitted' || a.status === 'evaluated').length || 7;
  
  const testTotal = mockTests.length > 0 ? mockTests.length : 6;
  const testCompleted = mockTests.filter(t => t.status === 'completed' || t.status === 'evaluated').length || 4;

  const studyHours = '24h 30m';
  const studyHoursPct = 85;

  const overall = Math.round(((assignmentCompleted/assignmentTotal) + (testCompleted/testTotal) + (studyHoursPct/100)) / 3 * 100);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-row items-center gap-6 mb-6 mt-1">
        <CircularProgress value={overall || 78} />
        <div className="flex-1 w-full flex flex-col justify-center">
          <ProgressBar label="Assignments" value={assignmentCompleted} max={assignmentTotal} displayValue={`${assignmentCompleted}/${assignmentTotal}`} colorClass="bg-emerald-500" />
          <ProgressBar label="Tests" value={testCompleted} max={testTotal} displayValue={`${testCompleted}/${testTotal}`} colorClass="bg-indigo-500" />
          <ProgressBar label="Study Hours" value={studyHoursPct} max={100} displayValue={studyHours} colorClass="bg-amber-500" />
        </div>
      </div>
      <div className="mt-auto bg-[#f8eadd]/40 rounded-[1rem] p-4 relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10">
          <p className="text-[11px] font-bold text-slate-800 leading-snug italic mb-1">"The expert in anything<br/>was once a beginner."</p>
          <p className="text-[9px] font-bold text-amber-700/60">- Helen Hayes</p>
        </div>
        <div className="relative z-10 w-12 h-12 flex items-center justify-center bg-amber-100/50 rounded-full text-emerald-600 shrink-0 ml-2">
           <Leaf size={24} />
        </div>
      </div>
    </div>
  );
}

function PendingAssignmentsList({ assignments }) {
  const items = assignments?.length > 0 ? assignments.slice(0, 3) : [
    { title: 'Maths Worksheet', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), priority: 'High', subjectName: 'Mathematics', type: 'worksheet' },
    { title: 'English Essay', dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), priority: 'Medium', subjectName: 'English', type: 'essay' },
    { title: 'Science Lab Report', dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), priority: 'Low', subjectName: 'Physics', type: 'lab' },
  ];

  return (
    <div className="flex flex-col">
      {items.map((item, idx) => {
        let pColor = item.priority === 'High' ? 'text-rose-500 bg-rose-50' : item.priority === 'Medium' ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50';
        if (!item.priority) {
           const daysToDue = item.dueDate ? Math.ceil((new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 5;
           if (daysToDue <= 1) pColor = 'text-rose-500 bg-rose-50';
           else if (daysToDue <= 3) pColor = 'text-amber-500 bg-amber-50';
           else pColor = 'text-emerald-500 bg-emerald-50';
           item.priority = daysToDue <= 1 ? 'High' : daysToDue <= 3 ? 'Medium' : 'Low';
        }

        let Icon = FileText;
        let iconBg = 'bg-violet-50';
        let iconColor = 'text-violet-500';
        
        if (item.type === 'lab' || item.subjectName === 'Physics') {
          Icon = FlaskConical;
          iconBg = 'bg-emerald-50';
          iconColor = 'text-emerald-500';
        } else if (item.type === 'essay' || item.subjectName === 'English') {
          Icon = Pencil;
          iconBg = 'bg-violet-50';
          iconColor = 'text-violet-500';
        } else {
          Icon = FileText;
          iconBg = 'bg-violet-50';
          iconColor = 'text-violet-500';
        }
        
        return (
          <div key={idx} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 last:pb-0">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                <Icon size={18} />
             </div>
             <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 text-[13px] truncate">{item.title}</h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Soon'}</p>
             </div>
             <div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${pColor}`}>{item.priority}</span>
             </div>
          </div>
        );
      })}
    </div>
  );
}

function SubjectPerformance({ courses }) {
  const items = courses?.length > 0 ? courses.slice(0, 5) : [
    { subjectName: 'Physics', percentage: 88, grade: 'A' },
    { subjectName: 'Mathematics', percentage: 76, grade: 'B+' },
    { subjectName: 'Chemistry', percentage: 82, grade: 'A' },
    { subjectName: 'English', percentage: 90, grade: 'A+' },
    { subjectName: 'Biology', percentage: 84, grade: 'A' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-1 custom-scrollbar hide-scrollbar mt-1">
      {items.map((item, idx) => {
        const config = getSubjectConfig(item.subjectName || item.name || '');
        const pct = item.percentage || (80 + (idx * 3) % 15);
        let grade = item.grade || 'A';

        return (
          <div key={idx} className="border border-slate-100 rounded-[1.25rem] p-4 flex flex-col items-center justify-center flex-1 min-w-[120px]">
             <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${config.bg} ${config.color}`}>
                <config.Icon size={20} />
             </div>
             <h4 className="font-bold text-slate-800 text-[11px] mb-2 text-center truncate w-full">{item.subjectName || item.name}</h4>
             <div className="text-xl font-black text-slate-900 mb-1">{pct}%</div>
             <div className={`text-[9px] font-bold ${config.color} uppercase tracking-wider`}>{grade} Grade</div>
          </div>
        );
      })}
    </div>
  );
}

function Announcements({ notices }) {
  const items = notices?.length > 0 ? notices.slice(0, 1) : [
    { 
      title: 'Inter-House Quiz Competition', 
      date: new Date(new Date().setDate(new Date().getDate() + 5)),
      content: 'Get ready for an exciting quiz and represent your house!'
    }
  ];
  
  const notice = items[0];
  if (!notice) return (
     <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
        <Megaphone size={32} className="mb-2 opacity-50" />
        <p className="font-semibold text-sm">No new announcements</p>
     </div>
  );

  return (
    <div className="flex-1 mt-1 bg-[#f8f9ff] rounded-[1.25rem] p-5 flex flex-row items-center justify-between border border-[#e0e7ff] overflow-hidden relative">
       <div className="flex-1 z-10 pr-4">
          <h4 className="font-bold text-slate-900 text-[13px] mb-1">{notice.title}</h4>
          <p className="text-[10px] font-bold text-slate-500 mb-2">{new Date(notice.date || notice.createdAt || new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="text-[11px] font-medium text-slate-600 leading-snug">{notice.content || notice.description}</p>
       </div>
       <div className="w-20 h-20 shrink-0 flex items-center justify-center text-slate-300 relative z-10 mr-[-10px]">
          <Megaphone size={60} className="transform -rotate-12 text-indigo-200 fill-indigo-100" />
       </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const initialCache = readStudentDashboardCache();
  const [loading, setLoading] = useState(!initialCache);
  const [dashboardData, setDashboardData] = useState(initialCache?.dashboardData ?? null);
  const [assignments, setAssignments] = useState(initialCache?.assignments ?? []);
  const [mockTests, setMockTests] = useState(initialCache?.mockTests ?? []);
  const [notices, setNotices] = useState(initialCache?.notices ?? []);
  const [courses, setCourses] = useState(initialCache?.courses ?? []);
  const [weekEvents, setWeekEvents] = useState(initialCache?.weekEvents ?? []);

  const fetchData = async () => {
    try {
      const now = new Date();
      const dayNum = now.getDay();
      const diff = (dayNum + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      const from = new Date(monday);
      const to = new Date(monday);
      to.setDate(monday.getDate() + 6);

      const [dashRes, assignRes, testRes, noticeRes, courseRes, eventRes] = await Promise.allSettled([
        api.get('/students/dashboard'),
        api.get('/assignments'),
        api.get('/assessments/mock-tests?status=published'),
        api.get('/notices'),
        api.get('/students/courses/my'),
        api.get('/events', { params: { from: from.toISOString(), to: to.toISOString() } }),
      ]);

      const nextDashboard = dashRes.status === 'fulfilled' ? unwrapSchoolData(dashRes.value, null) : null;
      const nextAssignments = assignRes.status === 'fulfilled' ? unwrapSchoolList(assignRes.value) : [];
      const nextMockTests = testRes.status === 'fulfilled' ? (testRes.value.data?.data || testRes.value.data || []) : [];
      const nextNoticesRaw = noticeRes.status === 'fulfilled' ? (noticeRes.value.data?.data || noticeRes.value.data || []) : [];
      const nextNotices = Array.isArray(nextNoticesRaw) ? nextNoticesRaw.filter((notice) => String(notice?.category || '').toUpperCase() !== 'MAINTENANCE') : [];
      const nextCourses = courseRes.status === 'fulfilled' && Array.isArray(courseRes.value.data?.data)
        ? courseRes.value.data.data
        : courseRes.status === 'fulfilled' && Array.isArray(courseRes.value.data)
          ? courseRes.value.data
          : [];
      const eventData = eventRes.status === 'fulfilled' ? (eventRes.value.data?.data ?? eventRes.value.data) : [];
      const nextWeekEvents = Array.isArray(eventData) ? eventData : [];

      setDashboardData(nextDashboard);
      setAssignments(nextAssignments);
      setMockTests(nextMockTests);
      setNotices(nextNotices);
      setCourses(nextCourses);
      setWeekEvents(nextWeekEvents);

      writeStudentDashboardCache({
        dashboardData: nextDashboard,
        assignments: nextAssignments,
        mockTests: nextMockTests,
        notices: nextNotices,
        courses: nextCourses,
        weekEvents: nextWeekEvents,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useLiveRefresh(fetchData, [], 20000);

  const todayPlan = dashboardData?.todayPlan || [];
  const attendanceSummary = dashboardData?.attendanceSummary || dashboardData?.attendance || null;
  const totalClasses = attendanceSummary?.total ?? 0;
  const present = attendanceSummary?.present ?? 0;
  const attendancePct = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
  const todayClassesCount = dashboardData?.todayClasses ?? dashboardData?.classesToday ?? todayPlan.length ?? 0;

  const pendingAssignments = assignments.filter(
    (a) => a.status !== 'completed' && a.status !== 'submitted' && a.status !== 'evaluated'
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="student-dashboard space-y-5 pb-12 font-sans bg-[#f8fafc] min-h-screen">
      
      {/* Row 1 & 2: Top Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Column: Banner + Stat Cards */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          {/* Welcome Banner */}
          <div className="relative rounded-[1.5rem] overflow-hidden shadow-sm flex flex-col justify-center min-h-[260px] border border-slate-100">
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url(${bgBanner})` }}
            />
            {/* Subtle gradient to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            
            <div className="relative z-10 p-8 sm:p-10 max-w-lg">
              <h1 className="text-[28px] sm:text-[34px] leading-tight font-bold text-white mb-3">
                Welcome back,<br/>{user?.name?.split(' ')[0] || 'Abhijit'}! 👋
              </h1>
              <p className="text-white/90 text-xs sm:text-[13px] font-medium leading-relaxed tracking-wide max-w-xs">
                Stay curious, stay focused and keep growing every day.
              </p>
            </div>
          </div>
          
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} iconColor="text-white" bgColor="bg-indigo-600" title="Live Classes Today" value={todayClassesCount} link="View Schedule" to="/school/student/live-classes" />
            <StatCard icon={Pencil} iconColor="text-white" bgColor="bg-emerald-500" title="Attendance" value={`${attendancePct}%`} link="View Details" to="/school/student/attendance" />
            <StatCard icon={Star} iconColor="text-white" bgColor="bg-amber-500" title="Pending Assignments" value={pendingAssignments.length} link="View All" to="/school/student/assignments" />
            <StatCard icon={Award} iconColor="text-white" bgColor="bg-blue-500" title="EDVA Points" value={dashboardData?.eddvaCoins || user?.eddvaCoins || 680} link="Top 15% in class" isGrayLink />
          </div>
        </div>
        
        {/* Right Column: Calendar + Next Live Class */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex-1 min-h-[260px]">
            <SmartCalendar />
          </div>
          {/* Fixed height fit the sm:flex-row layout only — below sm the card
              stacks (icon+text, then a full-width button) and needs more
              room, so the height floor is dropped on mobile. */}
          <div className="shrink-0 h-auto sm:h-[104px]">
             <NextLiveClassCard schedule={todayPlan} />
          </div>
        </div>
      </div>

      {/* Row 3: Schedule, Progress, Pending Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col h-full">
          <SectionHeader title="Today's Schedule" action="View full timetable" to="/school/student/timetable" />
          <Timeline schedule={todayPlan} />
        </div>
        <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col h-full">
          <SectionHeader title="Your Progress" action="This Month" isDropdown />
          <ProgressCard assignments={assignments} mockTests={mockTests} />
        </div>
        <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col h-full">
          <SectionHeader title="Pending Assignments" action="View all" to="/school/student/assignments" />
          <PendingAssignmentsList assignments={pendingAssignments} />
        </div>
      </div>

      {/* Row 4: Subject Performance, Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full">
          <SectionHeader title="Subject Performance" action="This Term" isDropdown />
          <SubjectPerformance courses={courses} />
        </div>
        <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col h-full">
          <SectionHeader title="School Announcements" action="View all" to="/school/student/announcements" />
          <Announcements notices={notices} />
        </div>
      </div>

    </div>
  );
}
