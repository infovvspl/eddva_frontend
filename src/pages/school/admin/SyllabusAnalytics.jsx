import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Sparkles, TrendingUp, AlertTriangle, CheckCircle2, BarChart2, 
  Layers, Loader2, ArrowLeft, ShieldAlert, UserX, Clock, Calendar, 
  Award, Activity, Hourglass, PieChart, LineChart, Gauge
} from 'lucide-react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function SyllabusAnalytics() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedType = searchParams.get('type') || 'overall-progress';

  const [trackerData, setTrackerData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/syllabus/tracker').catch(() => ({ data: [] }));
      const data = res.data?.data ?? res.data;
      if (data) {
        setTrackerData(data.tracker || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Failed to load analytics details:', err);
      toast.error('Failed to load analytics details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-400">Loading dedicated syllabus analytics breakdown…</p>
      </div>
    );
  }

  // Aggregate Data
  const overallProgress = summary?.overallProgress || 0;
  const subjectsAtRisk = trackerData.filter(i => i.status === 'BEHIND' || (i.progressPercentage || 0) < 50);

  const classRiskMap = {};
  trackerData.forEach(i => {
    const cName = i.className || 'General Class';
    if (!classRiskMap[cName]) classRiskMap[cName] = { className: cName, total: 0, behind: 0, progressSum: 0 };
    classRiskMap[cName].total++;
    classRiskMap[cName].progressSum += (i.progressPercentage || 0);
    if (i.status === 'BEHIND' || (i.progressPercentage || 0) < 50) classRiskMap[cName].behind++;
  });
  const classesAtRisk = Object.values(classRiskMap)
    .map(c => ({ ...c, avgProgress: Math.round(c.progressSum / (c.total || 1)) }))
    .filter(c => c.behind > 0 || c.avgProgress < 50);

  const teacherPerfMap = {};
  trackerData.forEach(i => {
    const tName = i.teacherName || 'Unassigned';
    if (!teacherPerfMap[tName]) teacherPerfMap[tName] = { teacherName: tName, totalPlans: 0, behindPlans: 0, progressSum: 0 };
    teacherPerfMap[tName].totalPlans++;
    teacherPerfMap[tName].progressSum += (i.progressPercentage || 0);
    if (i.status === 'BEHIND' || (i.progressPercentage || 0) < 50) teacherPerfMap[tName].behindPlans++;
  });
  const teacherPerformanceList = Object.values(teacherPerfMap).map(t => ({
    ...t,
    completionRate: Math.round(t.progressSum / (t.totalPlans || 1))
  })).sort((a, b) => b.completionRate - a.completionRate);

  const delayedTeachers = teacherPerformanceList.filter(t => t.behindPlans > 0);

  const totalTopicsCount = trackerData.reduce((a, b) => a + (b.totalTopics || 0), 0);
  const totalPendingTopics = trackerData.reduce((a, b) => a + (b.pendingTopics || 0), 0);
  const chaptersPendingCount = trackerData.reduce((a, b) => a + Math.ceil((b.pendingTopics || 0) / 3), 0);
  const totalPlannedPeriods = trackerData.reduce((a, b) => a + (b.plannedPeriods || 0), 0);
  const avgPeriodsVal = (totalPlannedPeriods / Math.max(1, totalTopicsCount)).toFixed(1);

  // Each plan's own time-elapsed-vs-duration benchmark, computed server-side from its
  // real planned dates — the same formula used everywhere else "expected progress"
  // appears, so this stays honest instead of a guessed month-by-month curve.
  const plansWithExpected = trackerData.filter(i => typeof i.expectedProgressPercentage === 'number');
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const viewsList = [
    { id: 'overall-progress', title: 'Overall Syllabus Progress' },
    { id: 'expected-vs-actual', title: 'Expected vs Actual Progress' },
    { id: 'subjects-at-risk', title: 'Subjects at Risk' },
    { id: 'classes-at-risk', title: 'Classes at Risk' },
    { id: 'delayed-teachers', title: 'Teachers with Delayed Syllabus' },
    { id: 'chapters-pending', title: 'Chapters Pending' },
    { id: 'monthly-completion', title: 'Monthly Syllabus Completion' },
    { id: 'avg-periods', title: 'Avg Teaching Periods per Topic' },
    { id: 'teacher-completion-rate', title: 'Completion Rate by Teacher' }
  ];

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6 font-poppins">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/school/admin/syllabus-tracker')}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors mb-1"
          >
            <ArrowLeft size={15} /> Back to Syllabus Tracker
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Syllabus Analytics Details Hub
          </h1>
          <p className="text-xs text-slate-500">Comprehensive breakdown and actionable insights for your selected syllabus metric.</p>
        </div>
      </div>

      {/* VIEW TABS SELECTOR */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {viewsList.map(v => (
          <button
            key={v.id}
            onClick={() => navigate(`/school/admin/syllabus-analytics?type=${v.id}`)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold shrink-0 transition-all ${selectedType === v.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}
          >
            {v.title}
          </button>
        ))}
      </div>

      {/* DYNAMIC METRIC DETAILS CONTENT */}
      {selectedType === 'overall-progress' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-blue-200">Curriculum Metric</span>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black">{overallProgress}%</h2>
                <p className="text-sm font-semibold text-blue-100 mt-1">Overall School Curriculum Completed</p>
              </div>
              <Gauge size={48} className="text-blue-200" />
            </div>
            <div className="w-full bg-blue-900/50 h-3 rounded-full overflow-hidden">
              <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Total Curriculum Scope</h3>
              <p className="text-2xl font-black text-blue-600">{totalTopicsCount} Topics</p>
              <p className="text-xs text-slate-500">Across all classes and subjects in academic session.</p>
            </div>
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Pending Topics</h3>
              <p className="text-2xl font-black text-amber-600">{totalPendingTopics} Topics</p>
              <p className="text-xs text-slate-500">Remaining to be delivered before academic session end.</p>
            </div>
          </div>
        </div>
      )}

      {selectedType === 'expected-vs-actual' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase">Expected vs Actual Progress by Plan</h2>
            <p className="text-xs text-slate-500">Expected % is each plan's elapsed time as a share of its planned start–completion window; Actual % is real topic completion.</p>
          </div>

          {plansWithExpected.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No plans have both a planned start and completion date set, so an expected pace can't be computed yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plansWithExpected.map((p, idx) => (
                <div key={p.planId || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block">{p.className} — {p.subjectName}</span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400">Expected: {p.expectedProgressPercentage}%</span>
                    <span className="font-black text-slate-900 dark:text-white">Actual: {p.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.progressPercentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedType === 'monthly-completion' && (
        <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 p-8 text-white shadow-xl space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-blue-100">{currentMonthName} Run-Rate</span>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-black">{overallProgress}%</h2>
              <p className="text-sm font-semibold text-blue-100 mt-1">Overall Curriculum Completed So Far This Month</p>
            </div>
            <Calendar size={48} className="text-blue-100" />
          </div>
          <div className="w-full bg-blue-900/40 h-3 rounded-full overflow-hidden">
            <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
      )}

      {selectedType === 'subjects-at-risk' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={20} /> Subjects at Risk Breakdown ({subjectsAtRisk.length})
          </h2>
          <p className="text-xs text-slate-500">Subjects progressing under 50% target or marked behind schedule.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {subjectsAtRisk.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-rose-600 uppercase block">{s.className}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.subjectName}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Assigned Teacher: {s.teacherName}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 uppercase">{s.progressPercentage}% Done</span>
                </div>
                <div className="w-full bg-rose-200 dark:bg-rose-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-600 h-full rounded-full" style={{ width: `${s.progressPercentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedType === 'classes-at-risk' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} /> Classes at Risk Breakdown ({classesAtRisk.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {classesAtRisk.map((c, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.className}</h3>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300">{c.avgProgress}% Avg</span>
                </div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">{c.behind} subject plans lagging target schedule.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedType === 'delayed-teachers' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <UserX className="text-purple-500" size={20} /> Teachers with Delayed Syllabus ({delayedTeachers.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {delayedTeachers.map((t, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.teacherName}</h3>
                  <span className="text-xs font-black text-purple-700 dark:text-purple-300">{t.completionRate}% Completion Rate</span>
                </div>
                <p className="text-xs font-semibold text-purple-800 dark:text-purple-200">{t.behindPlans} plans lagging behind schedule.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedType === 'chapters-pending' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Hourglass className="text-amber-500" size={20} /> Chapters & Topics Pending Breakdown
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 space-y-1">
              <span className="text-xs font-bold text-slate-400">Total Pending Chapters</span>
              <p className="text-3xl font-black text-amber-600">{chaptersPendingCount}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 space-y-1">
              <span className="text-xs font-bold text-slate-400">Total Pending Topics</span>
              <p className="text-3xl font-black text-amber-700">{totalPendingTopics}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 space-y-1">
              <span className="text-xs font-bold text-slate-400">Curriculum Scope Total</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{totalTopicsCount}</p>
            </div>
          </div>
        </div>
      )}

      {selectedType === 'avg-periods' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Layers className="text-indigo-600" size={20} /> Average Teaching Periods per Topic Analysis
          </h2>
          <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-2">
            <p className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{avgPeriodsVal} Periods / Topic</p>
            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">Institute-wide average: total planned periods across all plans ÷ total topics.</p>
          </div>
        </div>
      )}

      {selectedType === 'teacher-completion-rate' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Award className="text-emerald-600" size={20} /> Faculty Execution Leaderboard
          </h2>
          <div className="space-y-3">
            {teacherPerformanceList.map((t, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-white">{t.teacherName}</span>
                  <span className="text-emerald-600">{t.completionRate}% Done</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${t.completionRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
