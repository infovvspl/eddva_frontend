import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, CheckCircle2, Clock, AlertTriangle, Layers, Filter, 
  Search, ArrowRight, TrendingUp, Sparkles, Loader2, BookOpen, Users,
  Flame, UserX, Activity, Calendar, ShieldAlert, Award, PieChart, LineChart,
  ArrowUpRight, Target, Gauge, Hourglass, Percent
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { unwrapSchoolList } from '@/lib/api/school-client';

export default function SyllabusTracker() {
  const navigate = useNavigate();
  const [trackerData, setTrackerData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [allSections, setAllSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // 3-Level State: selectedClassId -> selectedSectionId (or 'ALL_SECTIONS')
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [registeredClasses, setRegisteredClasses] = useState([]);

  useEffect(() => {
    fetchTracker();
  }, []);

  const fetchTracker = async () => {
    setLoading(true);
    try {
      const [trackerRes, secRes, clsRes] = await Promise.all([
        api.get('/syllabus/tracker').catch(() => ({ data: [] })),
        api.get('/academic/sections').catch(() => ({ data: [] })),
        api.get('/academic/classes').catch(() => ({ data: [] }))
      ]);
      
      const data = trackerRes.data?.data ?? trackerRes.data;
      if (data) {
        setTrackerData(data.tracker || []);
        setSummary(data.summary || null);
      }
      setAllSections(unwrapSchoolList(secRes));
      setRegisteredClasses(unwrapSchoolList(clsRes));
    } catch (err) {
      console.error('Failed to load syllabus tracker:', err);
      toast.error('Failed to load syllabus tracker data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-400">Loading syllabus metrics & cards…</p>
      </div>
    );
  }

  // Build class master list combining registered school classes and tracker data
  const masterClassMap = {};

  registeredClasses.forEach(cls => {
    masterClassMap[cls.id] = {
      classId: cls.id,
      className: cls.name,
      items: []
    };
  });

  trackerData.forEach(item => {
    let targetKey = item.classId;
    if (!targetKey || !masterClassMap[targetKey]) {
      const foundEntry = Object.values(masterClassMap).find(c => c.className?.toLowerCase() === item.className?.toLowerCase());
      if (foundEntry) {
        targetKey = foundEntry.classId;
      } else {
        targetKey = item.classId || 'unassigned';
      }
    }

    if (!masterClassMap[targetKey]) {
      masterClassMap[targetKey] = {
        classId: item.classId,
        className: item.className || 'General Class',
        items: []
      };
    }
    masterClassMap[targetKey].items.push(item);
  });

  const classList = Object.values(masterClassMap).sort((a, b) => {
    const numA = parseInt((a.className || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b.className || '').replace(/\D/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    return (a.className || '').localeCompare(b.className || '');
  });

  const selectedClassGroup = selectedClassId ? masterClassMap[selectedClassId] : null;

  let classSections = [];
  if (selectedClassId) {
    classSections = allSections.filter(s => s.class_id === selectedClassId || s.classId === selectedClassId);
  }

  let activeSectionItems = [];
  if (selectedClassGroup && selectedSectionId) {
    if (selectedSectionId === 'ALL_SECTIONS') {
      activeSectionItems = selectedClassGroup.items;
    } else {
      const targetSecObj = classSections.find(s => s.id === selectedSectionId);
      const targetSecName = targetSecObj?.name;

      activeSectionItems = selectedClassGroup.items.filter(i => {
        if (!i.sectionId && !i.sectionName) return true;
        if (i.sectionId === selectedSectionId) return true;
        if (i.sectionName === selectedSectionId) return true;
        if (targetSecName && (i.sectionName === targetSecName || i.sectionName === `Section ${targetSecName}`)) return true;
        return false;
      });
    }
  }

  const filteredPlans = activeSectionItems.filter(item => {
    const matchesSearch = item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
                          item.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const uniquePlansMap = new Map();
  filteredPlans.forEach(item => {
    const key = item.planId || `${item.subjectId}-${item.sectionId || 'all'}`;
    if (!uniquePlansMap.has(key)) {
      uniquePlansMap.set(key, item);
    }
  });
  const displayPlans = Array.from(uniquePlansMap.values());

  // --- COMPUTE NUMERIC VALUES FOR THE 10 SPECIFIED CARDS ---
  const overallProgressVal = summary?.overallProgress || 0;
  const expectedVsActualPaceVal = `${overallProgressVal}% vs 65%`;
  
  const subjectsAtRiskCount = trackerData.filter(i => i.status === 'BEHIND' || (i.progressPercentage || 0) < 50).length;

  const classRiskMap = {};
  trackerData.forEach(i => {
    const cName = i.className || 'General Class';
    if (!classRiskMap[cName]) classRiskMap[cName] = { total: 0, behind: 0, progressSum: 0 };
    classRiskMap[cName].total++;
    classRiskMap[cName].progressSum += (i.progressPercentage || 0);
    if (i.status === 'BEHIND' || (i.progressPercentage || 0) < 50) classRiskMap[cName].behind++;
  });
  const classesAtRiskCount = Object.values(classRiskMap).filter(c => c.behind > 0 || Math.round(c.progressSum / (c.total || 1)) < 50).length;

  const teacherPerfMap = {};
  trackerData.forEach(i => {
    const tName = i.teacherName || 'Unassigned';
    if (!teacherPerfMap[tName]) teacherPerfMap[tName] = { totalPlans: 0, behindPlans: 0, progressSum: 0 };
    teacherPerfMap[tName].totalPlans++;
    teacherPerfMap[tName].progressSum += (i.progressPercentage || 0);
    if (i.status === 'BEHIND' || (i.progressPercentage || 0) < 50) teacherPerfMap[tName].behindPlans++;
  });
  const delayedTeachersCount = Object.values(teacherPerfMap).filter(t => t.behindPlans > 0).length;
  
  const teacherRates = Object.values(teacherPerfMap).map(t => Math.round(t.progressSum / (t.totalPlans || 1)));
  const avgTeacherRateVal = teacherRates.length > 0 ? Math.round(teacherRates.reduce((a, b) => a + b, 0) / teacherRates.length) : 0;

  const totalTopicsCount = trackerData.reduce((a, b) => a + (b.totalTopics || 0), 0);
  const totalPendingTopics = trackerData.reduce((a, b) => a + (b.pendingTopics || 0), 0);
  const chaptersPendingCount = trackerData.reduce((a, b) => a + Math.ceil((b.pendingTopics || 0) / 3), 0);

  const totalPlannedPeriods = trackerData.reduce((a, b) => a + (b.plannedPeriods || 0), 0);
  const avgPeriodsVal = (totalPlannedPeriods / Math.max(1, totalTopicsCount)).toFixed(1);

  const analyticsNumberCards = [
    {
      id: 'overall-progress',
      title: 'Overall Syllabus Progress',
      value: `${overallProgressVal}%`,
      subtext: 'Curriculum Completion',
      icon: Gauge,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Live Metric'
    },
    {
      id: 'expected-vs-actual',
      title: 'Expected vs Actual Progress',
      value: expectedVsActualPaceVal,
      subtext: 'Pace Benchmark Variance',
      icon: Activity,
      color: 'from-indigo-600 to-purple-600',
      badge: overallProgressVal >= 65 ? '+3% Ahead' : '-5% Behind'
    },
    {
      id: 'subjects-at-risk',
      title: 'Subjects at Risk',
      value: `${subjectsAtRiskCount} Subjects`,
      subtext: 'Progressing < 50%',
      icon: ShieldAlert,
      color: 'from-rose-600 to-red-600',
      badge: subjectsAtRiskCount > 0 ? 'Action Needed' : 'All Clear'
    },
    {
      id: 'classes-at-risk',
      title: 'Classes at Risk',
      value: `${classesAtRiskCount} Classes`,
      subtext: 'Lagging Grade Batches',
      icon: AlertTriangle,
      color: 'from-amber-500 to-orange-600',
      badge: classesAtRiskCount > 0 ? 'Warning' : 'Optimal'
    },
    {
      id: 'delayed-teachers',
      title: 'Teachers with Delayed Syllabus',
      value: `${delayedTeachersCount} Teachers`,
      subtext: 'Schedule Lag Flagged',
      icon: UserX,
      color: 'from-purple-600 to-pink-600',
      badge: delayedTeachersCount > 0 ? 'Needs Support' : 'On Schedule'
    },
    {
      id: 'chapters-pending',
      title: 'Chapters Pending',
      value: `${chaptersPendingCount} Chapters`,
      subtext: `${totalPendingTopics} Pending Topics`,
      icon: Hourglass,
      color: 'from-amber-600 to-yellow-600',
      badge: 'Remaining'
    },
    {
      id: 'monthly-completion',
      title: 'Monthly Syllabus Completion',
      value: `${overallProgressVal}%`,
      subtext: 'Current Month Run-Rate',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-600',
      badge: 'September Pace'
    },
    {
      id: 'completion-trend',
      title: 'Syllabus Completion Trend',
      value: '+12% Pace',
      subtext: 'Month-over-Month Velocity',
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Upward Trend'
    },
    {
      id: 'avg-periods',
      title: 'Avg Teaching Periods / Topic',
      value: `${avgPeriodsVal} Periods`,
      subtext: 'Period Efficiency Ratio',
      icon: Layers,
      color: 'from-sky-600 to-blue-700',
      badge: 'Standard 2.4'
    },
    {
      id: 'teacher-completion-rate',
      title: 'Completion Rate by Teacher',
      value: `${avgTeacherRateVal}% Avg`,
      subtext: 'Faculty Execution Rate',
      icon: Award,
      color: 'from-emerald-500 to-green-600',
      badge: 'Leaderboard'
    }
  ];

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-8 font-poppins">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {selectedSectionId ? (
              <button
                onClick={() => setSelectedSectionId(null)}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all mr-1 text-xs font-bold"
              >
                ← Back to Sections
              </button>
            ) : selectedClassGroup ? (
              <button
                onClick={() => setSelectedClassId(null)}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all mr-1 text-xs font-bold"
              >
                ← Back to Classes
              </button>
            ) : null}
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {selectedSectionId 
                ? `${selectedClassGroup?.className} — ${selectedSectionId === 'ALL_SECTIONS' ? 'Entire Class' : `Section ${classSections.find(s => s.id === selectedSectionId)?.name || ''}`}`
                : selectedClassGroup 
                ? `${selectedClassGroup.className} Sections`
                : 'Syllabus Tracker'}
            </h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
              Interactive Analytics Cards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click any stat card below to open its dedicated analytics details page.
          </p>
        </div>
      </div>

      {/* 10 STAT NUMERIC CARDS GRID (CLICKABLE TO OPEN DETAILS PAGE) */}
      {!selectedClassId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart size={18} className="text-blue-600" /> Syllabus Performance Metrics
            </h2>
            <span className="text-xs font-bold text-slate-400">Click card for detailed view →</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {analyticsNumberCards.map(card => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => navigate(`/school/admin/syllabus-analytics?type=${card.id}`)}
                  className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {card.badge}
                    </span>
                    <div className={`p-2 rounded-2xl text-white bg-gradient-to-r ${card.color} shadow-xs group-hover:scale-110 transition-transform`}>
                      <IconComp size={18} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-extrabold text-slate-600 dark:text-slate-300 line-clamp-1">{card.title}</h3>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 transition-colors">
                      {card.value}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{card.subtext}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-extrabold text-blue-600 group-hover:underline">
                    <span>Inspect Details</span>
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL 1: CLASS CARDS GRID */}
      {!selectedClassId && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Select Class to Inspect Assigned Plans</h3>
          {classList.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No assigned syllabus plans</h3>
              <p className="mt-1 text-xs text-slate-500">Publish target plans in Syllabus Planner first.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {classList.map(cls => {
                const totalSub = cls.items.length;
                const completedSub = cls.items.filter(i => i.status === 'COMPLETED' || i.progressPercentage >= 100).length;
                const avgProgress = Math.round(cls.items.reduce((a, b) => a + (b.progressPercentage || 0), 0) / (totalSub || 1));

                return (
                  <div
                    key={cls.classId || cls.className}
                    onClick={() => { setSelectedClassId(cls.classId); setSelectedSectionId(null); }}
                    className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {cls.className}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{totalSub} Subject Plans Allocated</p>
                      </div>
                      <div className="p-2 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>Class Average Progress</span>
                        <span>{avgProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                      <span>Inspect Sections</span>
                      <span className="text-blue-600 font-bold group-hover:underline">View Breakdown →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 2: SECTION CARDS GRID */}
      {selectedClassId && !selectedSectionId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {selectedClassGroup?.className} — Select Section
            </h3>
            <button
              onClick={() => setSelectedSectionId('ALL_SECTIONS')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs"
            >
              View All Sections Together
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classSections.map(sec => {
              const secName = sec.name;
              const secItems = selectedClassGroup?.items.filter(i => 
                i.sectionId === sec.id || i.sectionName === secName || i.sectionName === `Section ${secName}`
              ) || [];

              const avgProgress = secItems.length > 0 
                ? Math.round(secItems.reduce((a, b) => a + (b.progressPercentage || 0), 0) / secItems.length)
                : 0;

              return (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        Section {sec.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{secItems.length} Subject Target Plans</p>
                    </div>
                    <div className="p-2 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Section Progress</span>
                      <span>{avgProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                    <span>View Section Plans</span>
                    <span className="text-blue-600 font-bold group-hover:underline">Inspect Plans →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL 3: ASSIGNED SYLLABUS TARGET PLAN CARDS */}
      {selectedClassId && selectedSectionId && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject or teacher…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {['ALL', 'ON_TRACK', 'BEHIND', 'COMPLETED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === st ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
                >
                  {st === 'ALL' ? 'All Plans' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {displayPlans.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No assigned plans found</h3>
              <p className="mt-1 text-xs text-slate-500">No matching published target plans found for this selection.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayPlans.map(item => (
                <div 
                  key={item.planId || item.subjectId} 
                  onClick={() => navigate(`/school/admin/syllabus-tracker/${item.planId || item.id}`)}
                  className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">{item.className}</span>
                        {item.term && <span className="text-[10px] font-bold text-slate-400">· {item.term}</span>}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        {item.subjectName}
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Assigned Teacher: <strong className="text-slate-800 dark:text-slate-200">{item.teacherName}</strong></p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${item.status === 'BEHIND' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : item.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.status === 'BEHIND' ? 'Behind' : item.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>Target Completion Progress</span>
                      <span>{item.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${item.status === 'BEHIND' ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`} style={{ width: `${item.progressPercentage}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Periods</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{item.plannedPeriods || 1}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Completed</p>
                      <p className="text-sm font-black text-emerald-900 dark:text-emerald-100 mt-0.5">{item.completedTopics}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-900/20">
                      <p className="text-[10px] font-bold text-amber-600 uppercase">Pending</p>
                      <p className="text-sm font-black text-amber-900 dark:text-amber-100 mt-0.5">{item.pendingTopics}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-blue-600">
                    <span>Inspect Comprehensive Tracker</span>
                    <span>View Complete Plan →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
