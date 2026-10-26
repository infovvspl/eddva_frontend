import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, FileText, ClipboardList, Clock, MapPin, MessageSquare, CalendarDays,
  ChevronRight, CheckSquare, PlusCircle, Video, TrendingUp, AlertCircle, ArrowUpRight,
  BookOpen, Edit3, UploadCloud, Calendar, ArrowRight, Presentation
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { formatDuration, formatDurationShort } from '@/lib/format';
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
import BgBanner from '@/assets/images/bgbanner3.webp';
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

// Today's Schedule timeline — built from the teacher's real remaining classes
// today (`upcomingClasses`, fetched from /dashboard/stats). The first item is
// treated as "now" (closest upcoming/in-progress class), the rest "Upcoming".
const ScheduleTimeline = ({ classes }: { classes: any[] }) => {
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar size={28} className="text-slate-300" />
        <p className="mt-2 text-sm font-bold text-slate-600">No more classes today</p>
        <p className="mt-1 text-xs font-medium text-slate-400">Your remaining periods for today will appear here.</p>
      </div>
    );
  }
  return (
    <div className="relative space-y-6">
      {classes.map((item, i) => (
        <div className="relative rounded-xl py-1 pl-8 pr-2 transition-colors hover:bg-slate-50/80" key={item.id || i}>
          {/* The line is drawn per item, from this dot down to the next one, so it never overshoots the last dot. */}
          {i < classes.length - 1 && (
            <span className="absolute -bottom-[33px] left-[5px] top-[21px] w-0.5 rounded-full bg-blue-200" aria-hidden="true" />
          )}
          <div
            className="absolute left-0 top-[9px] z-10 size-3 rounded-full shadow-md ring-4 ring-white"
            style={{ background: i === 0 ? '#10B981' : '#3B82F6' }}
          />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold mb-1" style={{ color: i === 0 ? '#1E293B' : '#64748B' }}>{item.time}</p>
              <p className="text-[14px] sm:text-[15px] font-bold text-[#112A46]">{item.subject}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-[#64748B]">{item.class}{item.room ? ` • ${item.room}` : ''}</p>
            </div>
            {i === 0 ? (
              <Badge variant="outline" className="gap-1 text-[9px] sm:text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-1 border-[#D1FAE5]">
                <div className="size-1.5 rounded-full bg-[#10B981] animate-pulse" /> Next
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-1 border-[#DBEAFE]">
                Upcoming
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Score bands for the class-performance donut (same cut-offs the Reports page uses).
const PERFORMANCE_BANDS = [
  { name: 'Excellent', min: 85, color: '#10B981' },
  { name: 'Good', min: 70, color: '#3B82F6' },
  { name: 'Average', min: 40, color: '#F59E0B' },
  { name: 'Needs Help', min: 0, color: '#EF4444' },
];

// The Indian school year runs April-March, so months are ordered from April.
const MONTH_ORDER = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

type PerformanceState = {
  loading: boolean;
  average: number | null;
  delta: number | null;
  trend: { name: string; score: number }[];
  bands: { name: string; value: number; color: string }[];
  totalStudents: number;
  evaluatedStudents: number;
};

const EMPTY_PERFORMANCE: PerformanceState = {
  loading: false, average: null, delta: null, trend: [], bands: [], totalStudents: 0, evaluatedStudents: 0,
};

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

  // ── Student Performance card: real data from the class report ───────────────
  const [perfScopeKey, setPerfScopeKey] = useState<string>('');
  const [performance, setPerformance] = useState<PerformanceState>({ ...EMPTY_PERFORMANCE, loading: true });
  const perfScope = classSectionGroups.find((g) => `${g.classId}__${g.sectionId}` === perfScopeKey) || classSectionGroups[0];

  useEffect(() => {
    if (!perfScope) {
      setPerformance({ ...EMPTY_PERFORMANCE, loading: !stats });
      return;
    }
    let cancelled = false;
    setPerformance((prev) => ({ ...prev, loading: true }));
    api.get('/reports/class', { params: { classId: perfScope.classId, sectionId: perfScope.sectionId } })
      .then((res) => {
        if (cancelled) return;
        const body: any = res.data || {};
        const students: any[] = (Array.isArray(body.students) ? body.students : []).filter(
          (st) =>
            (!st.classId || String(st.classId) === String(perfScope.classId)) &&
            (!st.sectionId || String(st.sectionId) === String(perfScope.sectionId)),
        );
        // Only students with at least one evaluated result count towards the bands.
        const evaluated = students.filter((st) => Number(st.avgScore) > 0);

        const trend = (Array.isArray(body.performance) ? body.performance : [])
          .filter((m: any) => m && m.month && MONTH_ORDER.includes(String(m.month)) && Number(m.avgScore) > 0)
          .map((m: any) => ({ name: String(m.month), score: Math.round(Number(m.avgScore)) }))
          .sort((a: any, b: any) => MONTH_ORDER.indexOf(a.name) - MONTH_ORDER.indexOf(b.name));

        const delta = trend.length >= 2 ? trend[trend.length - 1].score - trend[trend.length - 2].score : null;
        const classAverage = Number(body.summary?.classAverage);
        const average = Number.isFinite(classAverage) && classAverage > 0
          ? Math.round(classAverage)
          : evaluated.length
            ? Math.round(evaluated.reduce((sum, st) => sum + Number(st.avgScore), 0) / evaluated.length)
            : null;

        const bands = PERFORMANCE_BANDS.map((band, i) => {
          const upper = i === 0 ? Infinity : PERFORMANCE_BANDS[i - 1].min;
          return {
            name: band.name,
            color: band.color,
            value: evaluated.filter((st) => Number(st.avgScore) >= band.min && Number(st.avgScore) < upper).length,
          };
        });

        setPerformance({
          loading: false,
          average,
          delta,
          trend,
          bands,
          totalStudents: students.length,
          evaluatedStudents: evaluated.length,
        });
      })
      .catch(() => {
        if (!cancelled) setPerformance({ ...EMPTY_PERFORMANCE });
      });
    return () => { cancelled = true; };
  }, [perfScope?.classId, perfScope?.sectionId, !!stats]);

  // ── Screen Time: the teacher's own active-usage trend ───────────────────────
  const [screenTimeRange, setScreenTimeRange] = useState<'week' | 'month'>('week');
  const [screenTime, setScreenTime] = useState<{
    loading: boolean;
    todaySeconds: number;
    totalSeconds: number;
    days: Array<{ date: string; activeSeconds: number }>;
  }>({ loading: true, todaySeconds: 0, totalSeconds: 0, days: [] });

  useEffect(() => {
    let cancelled = false;
    setScreenTime((prev) => ({ ...prev, loading: true }));
    api.get('/screen-time/me', { params: { range: screenTimeRange } })
      .then((res) => {
        if (cancelled) return;
        const body: any = res.data?.data ?? res.data ?? {};
        setScreenTime({
          loading: false,
          todaySeconds: Number(body.todaySeconds) || 0,
          totalSeconds: Number(body.totalSeconds) || 0,
          days: Array.isArray(body.days) ? body.days : [],
        });
      })
      .catch(() => {
        if (!cancelled) setScreenTime({ loading: false, todaySeconds: 0, totalSeconds: 0, days: [] });
      });
    return () => { cancelled = true; };
  }, [screenTimeRange]);

  const screenTimeChartData = useMemo(
    () => screenTime.days.map((d) => ({
      name: new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined,
        screenTimeRange === 'week' ? { weekday: 'short' } : { day: 'numeric', month: 'short' }),
      seconds: d.activeSeconds,
    })),
    [screenTime.days, screenTimeRange],
  );
  const screenTimeHasActivity = screenTimeChartData.some((d) => d.seconds > 0);

  // ── "Needs your attention": real flags built from the teacher's own data ────────────────
  type AttentionFlags = {
    loaded: boolean;
    pendingSubmissions: number;
    weakStudents: { count: number; where: string };
    lowAttendance: { count: number; where: string };
    delayedTopics: { count: number; subjects: string[] };
    riskSubjects: string[];
  };
  const [flags, setFlags] = useState<AttentionFlags>({
    loaded: false,
    pendingSubmissions: 0,
    weakStudents: { count: 0, where: '' },
    lowAttendance: { count: 0, where: '' },
    delayedTopics: { count: 0, subjects: [] },
    riskSubjects: [],
  });

  useEffect(() => {
    let cancelled = false;
    const classLabel = (st: any) => String(st.class || st.className || '').trim();
    const where = (items: any[]) => {
      const names = Array.from(new Set(items.map(classLabel).filter(Boolean)));
      return names.length === 1 ? names[0] : names.length > 1 ? `${names.length} classes` : '';
    };

    (async () => {
      const [inboxRes, reportRes, planRes] = await Promise.allSettled([
        api.get('/assignments/submissions/inbox'),
        api.get('/reports/class'),
        api.get('/syllabus/teaching-plan'),
      ]);
      if (cancelled) return;

      // 1. assignment submissions nobody has graded yet
      let pendingSubmissions = 0;
      if (inboxRes.status === 'fulfilled') {
        const body: any = inboxRes.value.data;
        const list: any[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        pendingSubmissions = list.filter((x) => String(x.status || '').toLowerCase() !== 'graded').length;
      }

      // 2/3/5. weak students, low attendance, subjects at risk — all from the class report
      let weakStudents = { count: 0, where: '' };
      let lowAttendance = { count: 0, where: '' };
      let riskSubjects: string[] = [];
      if (reportRes.status === 'fulfilled') {
        const body: any = reportRes.value.data || {};
        const students: any[] = Array.isArray(body.students) ? body.students : [];
        const weak = students.filter((st) => Number(st.avgScore) > 0 && Number(st.avgScore) < 40);
        const low = students.filter((st) => Number(st.attendance) > 0 && Number(st.attendance) < 75);
        weakStudents = { count: weak.length, where: where(weak) };
        lowAttendance = { count: low.length, where: where(low) };
        const weaknesses: any[] = Array.isArray(body.weaknesses) ? body.weaknesses : [];
        riskSubjects = Array.from(new Set(
          weaknesses
            .filter((w) => Number(w.avgScore) > 0 && Number(w.avgScore) < 50)
            .map((w) => String(w.topic || '').trim())
            .filter(Boolean),
        ));
      }

      // 4. topics past their plan's target date that are not finished
      let delayedTopics = { count: 0, subjects: [] as string[] };
      if (planRes.status === 'fulfilled') {
        const body: any = planRes.value.data?.data ?? planRes.value.data ?? {};
        const plans: any[] = Array.isArray(body.publishedPlans) ? body.publishedPlans : [];
        const subjects = new Set<string>();
        let count = 0;
        plans.forEach((plan) => {
          const end = plan.planned_completion_date || plan.plannedCompletionDate;
          if (!end || new Date(end).getTime() >= Date.now()) return;
          (Array.isArray(plan.chapter_allocations) ? plan.chapter_allocations : []).forEach((ch: any) => {
            (Array.isArray(ch.topics) ? ch.topics : []).forEach((t: any) => {
              if (t.status !== 'completed' && !(Number(t.progress) >= 100)) {
                count += 1;
                const name = plan.subject_name || plan.subjectName;
                if (name) subjects.add(String(name));
              }
            });
          });
        });
        delayedTopics = { count, subjects: Array.from(subjects) };
      }

      setFlags({ loaded: true, pendingSubmissions, weakStudents, lowAttendance, delayedTopics, riskSubjects });
    })();

    return () => { cancelled = true; };
  }, []);

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const attentionItems = useMemo(() => {
    const items: {
      key: string; icon: React.ReactNode; color: string; bg: string; title: string; desc: string;
      path: string; state?: Record<string, unknown>;
    }[] = [];

    if (pendingDoubts > 0) {
      items.push({
        key: 'doubts', icon: <MessageSquare size={16} />, color: 'text-blue-600', bg: 'bg-blue-50',
        title: 'New Doubts', desc: `${plural(pendingDoubts, 'doubt', 'doubts')} from students waiting for an answer`,
        path: '/school/teacher/doubts',
      });
    }
    if (flags.pendingSubmissions > 0) {
      items.push({
        key: 'submissions', icon: <Clock size={16} />, color: 'text-amber-600', bg: 'bg-amber-50',
        title: 'Pending Evaluations', desc: `${plural(flags.pendingSubmissions, 'assignment submission', 'assignment submissions')} waiting for review`,
        path: '/school/teacher/assignments', state: { mainTab: 'inbox' },
      });
    }
    if (flags.weakStudents.count > 0) {
      items.push({
        key: 'weak', icon: <AlertCircle size={16} />, color: 'text-rose-600', bg: 'bg-rose-50',
        title: 'Weak Students',
        desc: `${plural(flags.weakStudents.count, 'student', 'students')} below 40%${flags.weakStudents.where ? ` in ${flags.weakStudents.where}` : ''}`,
        path: '/school/teacher/reports', state: { reportsTab: 'weakness' },
      });
    }
    if (flags.lowAttendance.count > 0) {
      items.push({
        key: 'attendance', icon: <UserCheck size={16} />, color: 'text-orange-600', bg: 'bg-orange-50',
        title: 'Low Attendance',
        desc: `${plural(flags.lowAttendance.count, 'student', 'students')} below 75%${flags.lowAttendance.where ? ` in ${flags.lowAttendance.where}` : ''}`,
        path: '/school/teacher/reports', state: { reportsTab: 'students' },
      });
    }
    if (flags.delayedTopics.count > 0) {
      const subj = flags.delayedTopics.subjects.slice(0, 2).join(', ');
      items.push({
        key: 'delayed', icon: <BookOpen size={16} />, color: 'text-violet-600', bg: 'bg-violet-50',
        title: 'Delayed Lessons',
        desc: `${plural(flags.delayedTopics.count, 'topic', 'topics')} behind schedule${subj ? ` (${subj}${flags.delayedTopics.subjects.length > 2 ? '…' : ''})` : ''}`,
        path: '/school/teacher/teaching-plan',
      });
    }
    if (flags.riskSubjects.length > 0) {
      const subj = flags.riskSubjects.slice(0, 2).join(', ');
      items.push({
        key: 'risk', icon: <TrendingUp size={16} className="rotate-180" />, color: 'text-red-600', bg: 'bg-red-50',
        title: 'Subjects at Risk',
        desc: `${subj}${flags.riskSubjects.length > 2 ? ` +${flags.riskSubjects.length - 2} more` : ''} - class average below 50%`,
        path: '/school/teacher/reports', state: { reportsTab: 'class' },
      });
    }
    return items;
  }, [flags, pendingDoubts]);

  // ── Recent activity: the teacher's own latest assignments / assessments + their notifications ──
  const [ownWork, setOwnWork] = useState<{ assignments: any[]; assessments: any[]; loaded: boolean }>({
    assignments: [], assessments: [], loaded: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [aRes, tRes] = await Promise.allSettled([api.get('/assignments'), api.get('/assessments')]);
      if (cancelled) return;
      const list = (r: PromiseSettledResult<any>) => {
        if (r.status !== 'fulfilled') return [] as any[];
        const body = r.value.data;
        return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      };
      setOwnWork({ assignments: list(aRes), assessments: list(tRes), loaded: true });
    })();
    return () => { cancelled = true; };
  }, []);

  const timeAgo = (value: any) => {
    const t = new Date(value).getTime();
    if (!Number.isFinite(t)) return '';
    const diff = Date.now() - t;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} ${hr === 1 ? 'hour' : 'hours'} ago`;
    const day = Math.floor(hr / 24);
    if (day === 1) return 'Yesterday';
    if (day < 7) return `${day} days ago`;
    return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  const recentActivity = useMemo(() => {
    type Item = {
      key: string; at: number; icon: React.ReactNode; color: string; bg: string;
      title: string; sub: string; context: string; path: string;
    };
    const items: Item[] = [];
    const push = (it: Omit<Item, 'at'> & { when: any }) => {
      const at = new Date(it.when).getTime();
      if (Number.isFinite(at)) items.push({ ...it, at });
    };

    ownWork.assignments.forEach((a: any) => {
      push({
        key: `as-${a.id}`, when: a.created_at || a.createdAt || a.published_at,
        icon: <FileText size={18} />, color: 'text-purple-600', bg: 'bg-purple-100',
        title: 'Assignment Created', sub: a.title || 'Untitled assignment',
        context: [a.class_name || a.className, a.type && String(a.type).replace(/_/g, ' ')].filter(Boolean).join(' • ') || 'Assignment',
        path: '/school/teacher/assignments',
      });
    });

    ownWork.assessments.forEach((t: any) => {
      const draft = String(t.status || '').toLowerCase() === 'draft';
      push({
        key: `at-${t.id}`, when: t.created_at || t.createdAt,
        icon: <ClipboardList size={18} />, color: 'text-blue-600', bg: 'bg-blue-100',
        title: draft ? 'Assessment Drafted' : 'Assessment Published', sub: t.title || 'Untitled assessment',
        context: [t.class_name || t.className, t.subject_name || t.subjectName].filter(Boolean).join(' • ') || 'Assessment',
        path: '/school/teacher/assessments',
      });
    });

    notifications.forEach((n: any) => {
      push({
        key: `nt-${n.id}`, when: n.createdAt || n.created_at,
        icon: <MessageSquare size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-100',
        title: n.title || 'Notification', sub: n.message || n.body || '',
        context: n.isRead ? 'Read' : 'New',
        path: getTeacherFallbackUrl(n) || '/school/teacher/notifications',
      });
    });

    return items.sort((x, y) => y.at - x.at).slice(0, 4);
  }, [ownWork, notifications]);
  const hiddenGroupCount = Math.max(0, classSectionGroups.length - MAX_CLASS_CARDS_SHOWN);

  // "My Classes" card art/colors cycle through a fixed palette — purely decorative,
  // doesn't depend on real data.
  const CLASS_CARD_STYLES = [
    { imgBg: 'bg-[#E8F4FD]', img: ImgChalkboard, badgeBg: 'bg-blue-100/50', badgeText: 'text-blue-700', badgeBorder: 'border-blue-200/50' },
    { imgBg: 'bg-[#F3E8FF]', img: ImgGlobe, badgeBg: 'bg-purple-100/50', badgeText: 'text-purple-700', badgeBorder: 'border-purple-200/50' },
    { imgBg: 'bg-[#FFF7ED]', img: ImgPencils2, badgeBg: 'bg-orange-100/50', badgeText: 'text-orange-700', badgeBorder: 'border-orange-200/50' },
  ];
  const sectionStudentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    (stats?.teacherData?.sectionStudentCounts || []).forEach((r: any) => map.set(r.sectionId, r.count));
    return map;
  }, [stats]);

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
        <Card className="relative overflow-hidden rounded-[2rem] shadow-xl shadow-blue-900/10 group min-h-[300px] border-0">
          <div className="absolute inset-0 bg-cover bg-[center_top] bg-no-repeat z-0" style={{ backgroundImage: `url(${BgBanner})` }} />
          <div className="absolute inset-y-0 left-0 w-full md:w-[60%] lg:w-[45%] bg-gradient-to-r from-white/95 via-white/70 to-transparent z-10" />
          <div className="pointer-events-none absolute -left-16 -top-16 z-10 size-64 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 z-10 size-64 rounded-full bg-indigo-400/10 blur-3xl" />

          <CardContent className="relative z-20 flex flex-col justify-center max-w-xl p-6 md:p-8 min-h-[300px]">
            <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 shadow-sm ring-1 ring-blue-100 backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#112A46] tracking-tight leading-tight">
              Welcome back, <br /><span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name || 'Teacher'}!</span>
            </h1>
            <div className="my-1.5">
              <p className="text-[15px] font-medium text-slate-700/90 leading-relaxed max-w-md">Here's what's happening with your classes today. You have {upcomingClasses.length} upcoming sessions.</p>
            </div>
          </CardContent>
        </Card>

        {/* Needs Your Attention + Today's Overview — side by side, 50/50 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Needs Your Attention */}
        <Card className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 border-slate-100 flex flex-col">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30">
                <AlertCircle size={22} />
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold leading-tight tracking-tight text-[#112A46]">Needs Your Attention</h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">Tasks and alerts waiting for you</p>
              </div>
            </div>
            {attentionItems.length > 0 && (
              <span className="flex h-8 min-w-[2rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 text-[13px] font-black text-white shadow-md shadow-rose-500/30">
                {attentionItems.length}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {!flags.loaded ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />)
            ) : attentionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-10 text-center ring-1 ring-emerald-100">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                  <CheckSquare size={26} />
                </span>
                <p className="mt-3 text-[15px] font-extrabold text-slate-900 leading-tight">You're all caught up</p>
                <p className="mt-1 text-xs font-medium text-slate-500">No pending reviews, doubts or alerts right now.</p>
              </div>
            ) : (
              attentionItems.map((item) => (
                <div
                  key={item.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(item.path, item.state ? { state: item.state } : undefined)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(item.path, item.state ? { state: item.state } : undefined);
                    }
                  }}
                  className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${item.bg} ${item.color} shadow-sm ring-1 ring-white transition-transform duration-300 group-hover:scale-105`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-extrabold leading-tight text-slate-900">{item.title}</p>
                    <p className="mt-1 break-words text-[12px] font-medium leading-snug text-slate-500">{item.desc}</p>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-100 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600">
                    <ChevronRight size={16} />
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Today's Overview — full width */}
        <Card className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 border-slate-100">
        <div className="flex justify-between items-end mb-6">
          <CardTitle className="text-xl font-extrabold text-[#112A46] tracking-tight leading-normal">Today's Overview</CardTitle>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Students', value: stats?.totalStudents ?? 0, foot: 'Total Assigned', icon: <Users size={24} />, path: '/school/teacher/students', card: 'from-[#F0F7FF] to-[#DCEBFF] border-[#CFE3FB]', tile: 'from-blue-500 to-blue-600 shadow-blue-500/30', dot: 'bg-[#10B981]', footText: 'text-[#059669]' },
            { label: 'Classes Today', value: upcomingClasses.length, foot: 'Remaining', icon: <Presentation size={24} />, path: '/school/teacher/timetable', card: 'from-[#FFF7ED] to-[#FFEAD2] border-[#FFDDB8]', tile: 'from-orange-400 to-orange-600 shadow-orange-500/30', dot: 'bg-[#F97316]', footText: 'text-[#EA580C]' },
            { label: 'Assignments', value: stats?.assignments ?? 0, foot: 'Active', icon: <FileText size={24} />, path: '/school/teacher/assignments', card: 'from-[#F5F3FF] to-[#E7E0FF] border-[#DDD3FB]', tile: 'from-violet-500 to-purple-600 shadow-violet-500/30', dot: 'bg-[#8B5CF6]', footText: 'text-[#7C3AED]' },
            { label: 'Assessments', value: stats?.assessments ?? 0, foot: 'Scheduled', icon: <CheckSquare size={24} />, path: '/school/teacher/assessments', card: 'from-[#FEF2F2] to-[#FFE0E0] border-[#FBCFCF]', tile: 'from-rose-500 to-red-600 shadow-rose-500/30', dot: 'bg-[#3B82F6]', footText: 'text-[#2563EB]' },
          ].map((c) => (
            <Card
              key={c.label}
              className={`group relative overflow-hidden bg-gradient-to-br ${c.card} rounded-[1.5rem] p-5 flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              onClick={() => navigate(c.path)}
            >
              <div className="pointer-events-none absolute -bottom-8 -right-8 size-28 rounded-full bg-white/50 transition-transform duration-500 group-hover:scale-125" />
              <div className="relative flex items-start gap-4">
                <div className={`bg-gradient-to-br ${c.tile} text-white size-14 flex items-center justify-center rounded-2xl shrink-0 shadow-lg`}>{c.icon}</div>
                <div className="flex flex-col min-w-0">
                  <p className="text-4xl font-black text-[#1E293B] leading-none">{c.value}</p>
                  <p className="text-sm font-bold text-[#64748B] mt-1.5 break-words">{c.label}</p>
                </div>
              </div>
              <div className={`relative mt-5 flex items-center gap-1.5 text-[12px] font-bold ${c.footText}`}>
                <div className={`size-2 rounded-full ${c.dot}`}></div>
                {c.foot}
              </div>
            </Card>
          ))}
        </div>
        </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 border-slate-100 mb-6">
        <div className="flex justify-between items-end mb-6">
          <CardTitle className="text-[22px] font-extrabold text-[#112A46] tracking-tight leading-normal">Quick Actions</CardTitle>
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
              className={`relative overflow-hidden flex items-center justify-between p-5 h-auto rounded-2xl ${bg} shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border-0 min-h-[100px] whitespace-normal`}
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

      <div className="dashboard__grid p-2">
        <div className="dashboard__main">

          {/* Performance & Needs Attention Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
            {/* Student Performance */}
            <Card className="bg-white rounded-[1.5rem] p-7 border-slate-100 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30"><TrendingUp size={19} /></span>
                  <div>
                  <CardTitle className="text-lg font-extrabold text-slate-900 tracking-tight leading-normal">Student Performance</CardTitle>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {perfScope ? `${perfScope.className} - ${perfScope.sectionName}` : 'No class assigned'}
                  </p>
                  </div>
                </div>
                {classSectionGroups.length > 0 && (
                  <Select value={perfScope ? `${perfScope.classId}__${perfScope.sectionId}` : ''} onValueChange={setPerfScopeKey}>
                    <SelectTrigger className="w-auto h-8 gap-2 text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 rounded-lg px-3 py-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classSectionGroups.map((g) => (
                        <SelectItem key={`${g.classId}__${g.sectionId}`} value={`${g.classId}__${g.sectionId}`} className="text-xs font-semibold">
                          {g.className} - {g.sectionName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {performance.loading ? (
                <div className="flex flex-col sm:flex-row gap-6 flex-1 items-center">
                  <Skeleton className="h-52 w-full flex-1 rounded-2xl" />
                  <Skeleton className="size-28 rounded-full shrink-0" />
                </div>
              ) : performance.evaluatedStudents === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
                  <TrendingUp size={28} className="text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-600">No evaluated results yet</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {performance.totalStudents > 0
                      ? `${performance.totalStudents} students in this class. Scores appear here once assessments are evaluated.`
                      : 'Scores appear here once assessments are evaluated.'}
                  </p>
                </div>
              ) : (
              <div className="flex flex-col sm:flex-row gap-6 flex-1 items-center">
                <div className="flex-1 w-full relative">
                  <div className="absolute top-0 left-0">
                    <p className="text-xs font-bold text-slate-500">Average Performance</p>
                    <div className="flex items-end gap-2 mt-1">
                      <p className="text-3xl font-black text-slate-900 leading-none">{performance.average ?? '-'}{performance.average != null ? '%' : ''}</p>
                      {performance.delta != null && performance.delta !== 0 && (
                        <Badge
                          variant="secondary"
                          className={`gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded mb-1 border-0 ${
                            performance.delta > 0
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-50'
                              : 'text-rose-600 bg-rose-50 hover:bg-rose-50'
                          }`}
                        >
                          <TrendingUp size={12} className={performance.delta < 0 ? 'rotate-180' : ''} /> {Math.abs(performance.delta)}%
                        </Badge>
                      )}
                    </div>
                    {performance.delta != null && (
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">vs previous month</p>
                    )}
                  </div>
                  <div className="h-40 w-full mt-16">
                    {performance.trend.length > 0 ? (
                      <ChartContainer config={{ score: { label: 'Avg score', color: 'hsl(var(--primary))' } }} className="h-full w-full aspect-auto">
                        <LineChart data={performance.trend} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                          <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
                          <Line dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-score)' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <p className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">No monthly trend yet</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6 w-full sm:w-auto h-full">
                  <div className="relative size-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={performance.bands} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                          {performance.bands.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900 leading-none">{performance.evaluatedStudents}</span>
                      <span className="text-[9px] font-bold text-slate-500 mt-0.5">Students</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {performance.bands.map((item, idx) => (
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
              )}
              {!performance.loading && performance.evaluatedStudents > 0 && performance.totalStudents > performance.evaluatedStudents && (
                <p className="mt-4 text-[11px] font-semibold text-slate-400">
                  {performance.totalStudents - performance.evaluatedStudents} of {performance.totalStudents} students have no evaluated result yet.
                </p>
              )}
            </Card>

            {/* My Classes */}
            <Card className="bg-white rounded-[1.5rem] p-7 border-slate-100 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 flex flex-col">
              <div className="flex justify-between items-end mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30"><BookOpen size={19} /></span>
                  <CardTitle className="text-lg font-extrabold text-slate-900 tracking-tight leading-normal">My Classes</CardTitle>
                </div>
                <Button variant="link" onClick={() => navigate('/school/teacher/classes')} className="h-auto p-0 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:no-underline">View All</Button>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                {/* Class Card 1 */}
                <Card className="bg-[#F8FAFC] rounded-[1.5rem] p-3 border-slate-100 shadow-none flex gap-4 ring-1 ring-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer items-stretch" onClick={() => navigate('/school/teacher/classes')}>
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
                <Card className="bg-[#F8FAFC] rounded-[1.5rem] p-3 border-slate-100 shadow-none flex gap-4 ring-1 ring-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer items-stretch" onClick={() => navigate('/school/teacher/classes')}>
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

          {/* Screen Time */}
          <Card className="bg-white rounded-[1.5rem] p-7 border-slate-100 shadow-sm flex flex-col mt-4">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <CardTitle className="text-lg font-extrabold text-slate-900 tracking-tight leading-normal flex items-center gap-2">
                  <Clock size={18} className="text-indigo-500" /> Screen Time
                </CardTitle>
                <p className="text-xs font-semibold text-slate-500 mt-1">Your active time in EDDVA</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today</p>
                  <p className="text-lg font-black text-slate-900 leading-none mt-0.5">{formatDurationShort(screenTime.todaySeconds)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {screenTimeRange === 'week' ? 'This Week' : 'This Month'}
                  </p>
                  <p className="text-lg font-black text-indigo-600 leading-none mt-0.5">{formatDurationShort(screenTime.totalSeconds)}</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  {(['week', 'month'] as const).map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant="ghost"
                      onClick={() => setScreenTimeRange(r)}
                      className={`h-7 rounded-md px-2.5 text-xs font-bold ${
                        screenTimeRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-transparent'
                      }`}
                    >
                      {r === 'week' ? 'Week' : 'Month'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {screenTime.loading ? (
              <Skeleton className="h-52 w-full rounded-2xl" />
            ) : !screenTimeHasActivity ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
                <Clock size={28} className="text-slate-300" />
                <p className="mt-2 text-sm font-bold text-slate-600">No screen time recorded yet</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Your active usage will appear here as you use EDDVA.</p>
              </div>
            ) : (
              <div className="h-52 w-full">
                <ChartContainer config={{ seconds: { label: 'Active time', color: 'hsl(var(--primary))' } }} className="h-full w-full aspect-auto">
                  <AreaChart data={screenTimeChartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="screenTimeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-seconds)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-seconds)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} interval={screenTimeRange === 'month' ? 4 : 0} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatDurationShort(Number(v))} width={48} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatDuration(Number(v)) ?? '0s'} />} />
                    <Area
                      dataKey="seconds"
                      type="monotone"
                      stroke="var(--color-seconds)"
                      strokeWidth={2.5}
                      fill="url(#screenTimeFill)"
                      dot={{ r: 3, fill: 'var(--color-seconds)' }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <div className="mt-4">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-extrabold text-[#112A46] tracking-tight">Recent Activity</h2>
              <Button
                variant="link"
                onClick={() => navigate('/school/teacher/notifications')}
                className="h-auto p-0 text-[13px] font-bold text-[#1C4ED8] hover:text-[#1E40AF] hover:no-underline gap-1"
              >
                View All <ArrowRight size={16} />
              </Button>
            </div>
            {!ownWork.loaded ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[120px] rounded-3xl" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-slate-200 bg-white p-8 text-center shadow-none">
                <p className="text-sm font-bold text-slate-600">No recent activity yet</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Assignments, assessments and updates will show up here as you create them.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentActivity.map((item) => (
                  <Card
                    key={item.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(item.path)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(item.path); }
                    }}
                    className="bg-white rounded-3xl p-5 border-slate-100 shadow-md ring-1 ring-slate-100 flex flex-col gap-3 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 shadow-sm`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">{item.title}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-2 break-words">{item.sub}</p>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <p className="text-xs font-semibold text-slate-700 truncate">{item.context}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{timeAgo(item.at)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="dashboard__side">
          {/* Today's Schedule */}
          <Card className="rounded-[2rem] border-slate-100 bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 flex flex-col overflow-hidden">
            <CardHeader className="p-5 sm:p-6 flex-row justify-between items-center space-y-0 bg-white">
              <CardTitle className="text-[15px] sm:text-[17px] font-extrabold text-[#112A46] flex items-center gap-2 leading-normal tracking-normal">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30"><Calendar size={17} /></span> Today's Schedule
              </CardTitle>
            </CardHeader>
            <Separator className="bg-slate-100" />
            <CardContent className="p-5 sm:p-6">
              <ScheduleTimeline classes={upcomingClasses} />
            </CardContent>
            <Separator className="bg-slate-100" />
            <CardFooter className="p-4 bg-white">
              <Button variant="link" onClick={() => navigate('/school/teacher/timetable')} className="w-full h-auto rounded-xl py-2.5 text-[12px] sm:text-[13px] font-bold text-[#1C4ED8] hover:bg-blue-50 hover:text-[#1E40AF] hover:no-underline gap-1">
                View Full Calendar <ArrowRight size={16} />
              </Button>
            </CardFooter>
          </Card>

          {/* Quote Card */}
          <Card className="mt-4 bg-gradient-to-br from-[#DBEAFE] via-[#E0E7FF] to-[#F5F3FF] rounded-2xl p-6 border-[#C7D8F8] shadow-lg shadow-blue-200/40 relative overflow-hidden">
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
