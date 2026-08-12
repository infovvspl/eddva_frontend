// TeacherTeachingPlan - My Teaching Plan Dashboard & Lesson Execution Portal
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Plus, Sparkles, 
  Layers, BookOpen, Loader2, ArrowRight, Play, Filter, TrendingUp,
  AlertTriangle, Hourglass, ShieldAlert, CheckSquare, CalendarDays
} from 'lucide-react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { toast } from 'sonner';
import LessonPlanFormModal from '@/components/school/teacher/LessonPlanFormModal';
import LessonCompletionModal from '@/components/school/teacher/LessonCompletionModal';
import LessonTemplatesModal from '@/components/school/teacher/LessonTemplatesModal';

export default function TeacherTeachingPlan() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  const [selectedTimetableSlot, setSelectedTimetableSlot] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Class, Section & Subject Filter States
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    fetchTeachingPlan();
  }, []);

  const fetchTeachingPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/syllabus/teaching-plan');
      const resData = res.data?.data ?? res.data;
      if (resData) {
        setData(resData);
      }
    } catch (err) {
      console.error('Failed to load teaching plan:', err);
      toast.error('Failed to load teaching plan data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-400">Loading your teaching plan dashboard…</p>
      </div>
    );
  }

  const timetable = data?.todayTimetable || [];
  const lessons = data?.lessons || [];
  const publishedPlans = data?.publishedPlans || [];
  const teacherAssignments = data?.teacherAssignments || [];

  // Combine items to discover all assigned class/section/subject mappings for teacher
  const allItems = [
    ...teacherAssignments,
    ...publishedPlans,
    ...lessons,
    ...timetable
  ];

  // 1. Available Classes assigned to this teacher
  const availableClasses = Array.from(
    new Map(
      allItems
        .filter(item => item.class_name || item.className)
        .map(item => {
          const name = item.class_name || item.className;
          const id = item.class_id || item.classId || name;
          return [name.toLowerCase(), { id, name }];
        })
    ).values()
  ).sort((a, b) => {
    const numA = parseInt((a.name || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b.name || '').replace(/\D/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    return (a.name || '').localeCompare(b.name || '');
  });

  // 2. Available Sections dynamically filtered by selectedClass
  const availableSections = Array.from(
    new Map(
      allItems
        .filter(item => {
          const name = item.section_name || item.sectionName;
          if (!name) return false;
          if (selectedClass !== 'ALL') {
            const cid = item.class_id || item.classId;
            const cname = item.class_name || item.className;
            if (cid !== selectedClass && cname?.toLowerCase() !== selectedClass.toLowerCase()) return false;
          }
          return true;
        })
        .map(item => {
          const name = item.section_name || item.sectionName;
          const id = item.section_id || item.sectionId || name;
          return [name.toLowerCase(), { id, name }];
        })
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // 3. Available Subjects dynamically filtered by selectedClass & selectedSection
  const availableSubjects = Array.from(
    new Map(
      allItems
        .filter(item => {
          const name = item.subject_name || item.subjectName;
          if (!name) return false;
          if (selectedClass !== 'ALL') {
            const cid = item.class_id || item.classId;
            const cname = item.class_name || item.className;
            if (cid !== selectedClass && cname?.toLowerCase() !== selectedClass.toLowerCase()) return false;
          }
          if (selectedSection !== 'ALL') {
            const secId = item.section_id || item.sectionId;
            const secName = item.section_name || item.sectionName;
            if (secId !== selectedSection && secName?.toLowerCase() !== selectedSection.toLowerCase()) return false;
          }
          return true;
        })
        .map(item => {
          const name = item.subject_name || item.subjectName;
          const id = item.subject_id || item.subjectId || name;
          return [name.toLowerCase(), { id, name }];
        })
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Generic Filter Matcher
  const matchesFilter = (item) => {
    const itemClassId = item.class_id || item.classId;
    const itemClassName = item.class_name || item.className;
    const itemSecId = item.section_id || item.sectionId;
    const itemSecName = item.section_name || item.sectionName;
    const itemSubId = item.subject_id || item.subjectId;
    const itemSubName = item.subject_name || item.subjectName;

    if (selectedClass !== 'ALL') {
      if (itemClassId !== selectedClass && itemClassName?.toLowerCase() !== selectedClass.toLowerCase()) return false;
    }
    if (selectedSection !== 'ALL') {
      if (itemSecId !== selectedSection && itemSecName?.toLowerCase() !== selectedSection.toLowerCase()) return false;
    }
    if (selectedSubject !== 'ALL') {
      if (itemSubId !== selectedSubject && itemSubName?.toLowerCase() !== selectedSubject.toLowerCase()) return false;
    }
    return true;
  };

  const filteredTimetable = timetable.filter(matchesFilter);
  const filteredPlans = Array.from(new Map(publishedPlans.map(plan => [plan.id, plan])).values()).filter(matchesFilter);
  const filteredLessons = lessons.filter(matchesFilter);

  // --- COMPUTE THE 8 REQUIRED ITEMS EXACTLY ---
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Today's lessons
  const todaysLessons = filteredLessons.filter(l => {
    const d = l.date ? new Date(l.date).toISOString().split('T')[0] : '';
    return d === todayStr || l.status === 'TODAY';
  });

  // 2. Upcoming lessons
  const upcomingLessons = filteredLessons.filter(l => {
    const d = l.date ? new Date(l.date).toISOString().split('T')[0] : '';
    return d > todayStr || l.status === 'SCHEDULED' || l.status === 'UPCOMING';
  });

  // 3. Pending lessons
  const pendingLessons = filteredLessons.filter(l => l.status === 'PENDING' || l.status === 'PLANNED' || (!l.status || l.status === 'DRAFT'));

  // 4. Completed lessons
  const completedLessons = filteredLessons.filter(l => l.status === 'COMPLETED' || l.is_completed);

  // 5. Delayed lessons
  const delayedLessons = filteredLessons.filter(l => {
    const d = l.date ? new Date(l.date).toISOString().split('T')[0] : '';
    return l.status === 'DELAYED' || (d && d < todayStr && l.status !== 'COMPLETED');
  });

  // 6. Syllabus completion %
  const totalLessonsCount = filteredLessons.length || 1;
  const syllabusCompletionPercentage = Math.round((completedLessons.length / totalLessonsCount) * 100);

  // 7. Topics remaining
  const topicsRemainingCount = Math.max(0, totalLessonsCount - completedLessons.length);

  // 8. Topics behind schedule
  const topicsBehindScheduleCount = delayedLessons.length;

  // Filter lessons based on selected tab
  const getDisplayLessons = () => {
    switch (activeTab) {
      case 'TODAY': return todaysLessons.length > 0 ? todaysLessons : filteredLessons;
      case 'UPCOMING': return upcomingLessons;
      case 'PENDING': return pendingLessons;
      case 'COMPLETED': return completedLessons;
      case 'DELAYED': return delayedLessons;
      default: return filteredLessons;
    }
  };

  const displayLessonsList = getDisplayLessons();

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6 font-poppins">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Teaching Plan</h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
              Teacher Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Track today's sessions, lesson progress, remaining topics, and classroom execution.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTemplatesModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all"
          >
            <Layers size={15} /> Lesson Templates
          </button>
          <button
            onClick={() => {
              setSelectedTimetableSlot(null);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all"
          >
            <Plus size={15} /> Create Lesson Plan
          </button>
        </div>
      </div>

      {/* DASHBOARD: ALL 8 REQUIRED METRIC CARDS GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Today's lessons */}
        <div 
          onClick={() => setActiveTab('TODAY')}
          className={`cursor-pointer rounded-3xl border p-5 transition-all shadow-xs ${activeTab === 'TODAY' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">1. Today's Lessons</span>
            <div className="p-2 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/40">
              <CalendarDays size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{todaysLessons.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Scheduled for today</p>
        </div>

        {/* 2. Upcoming lessons */}
        <div 
          onClick={() => setActiveTab('UPCOMING')}
          className={`cursor-pointer rounded-3xl border p-5 transition-all shadow-xs ${activeTab === 'UPCOMING' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">2. Upcoming Lessons</span>
            <div className="p-2 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/40">
              <Calendar size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{upcomingLessons.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Scheduled future sessions</p>
        </div>

        {/* 3. Pending lessons */}
        <div 
          onClick={() => setActiveTab('PENDING')}
          className={`cursor-pointer rounded-3xl border p-5 transition-all shadow-xs ${activeTab === 'PENDING' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">3. Pending Lessons</span>
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40">
              <Hourglass size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-2">{pendingLessons.length}</p>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1">Awaiting execution</p>
        </div>

        {/* 4. Completed lessons */}
        <div 
          onClick={() => setActiveTab('COMPLETED')}
          className={`cursor-pointer rounded-3xl border p-5 transition-all shadow-xs ${activeTab === 'COMPLETED' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">4. Completed Lessons</span>
            <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-2">{completedLessons.length}</p>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">Classroom verified</p>
        </div>

        {/* 5. Delayed lessons */}
        <div 
          onClick={() => setActiveTab('DELAYED')}
          className={`cursor-pointer rounded-3xl border p-5 transition-all shadow-xs ${activeTab === 'DELAYED' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">5. Delayed Lessons</span>
            <div className="p-2 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/40">
              <AlertCircle size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-900 dark:text-rose-100 mt-2">{delayedLessons.length}</p>
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-1">Overdue timeline</p>
        </div>

        {/* 6. Syllabus completion % */}
        <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-5 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">6. Syllabus Completion %</span>
            <div className="p-2 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/40">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-900 dark:text-blue-100 mt-2">{syllabusCompletionPercentage}%</p>
          <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${syllabusCompletionPercentage}%` }} />
          </div>
        </div>

        {/* 7. Topics remaining */}
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">7. Topics Remaining</span>
            <div className="p-2 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40">
              <BookOpen size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-indigo-900 dark:text-indigo-100 mt-2">{topicsRemainingCount}</p>
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mt-1">Pending syllabus topics</p>
        </div>

        {/* 8. Topics behind schedule */}
        <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">8. Topics Behind Schedule</span>
            <div className="p-2 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/40">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-900 dark:text-rose-100 mt-2">{topicsBehindScheduleCount}</p>
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-1">Requires priority coverage</p>
        </div>
      </div>

      {/* Class, Section & Subject Filter Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
          <Filter size={16} className="text-blue-600 dark:text-blue-400" /> Filter Class & Subject:
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">All Classes</option>
            {availableClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">All Sections</option>
            {availableSections.map(s => (
              <option key={s.id} value={s.id}>Section {s.name}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">All Subjects</option>
            {availableSubjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>

          {(selectedClass !== 'ALL' || selectedSection !== 'ALL' || selectedSubject !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedClass('ALL');
                setSelectedSection('ALL');
                setSelectedSubject('ALL');
              }}
              className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ANNUAL SYLLABUS TARGET PLAN ASSIGNED BY ADMIN */}
      <div className="rounded-3xl border border-blue-200 bg-blue-50/30 p-6 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Annual Syllabus Target Plan Assigned by Admin</h3>
              <p className="text-xs text-slate-500">Official annual subject target roadmap published by academic administration.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-black">
            {filteredPlans.length} Annual Targets
          </span>
        </div>

        {filteredPlans.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center italic">No published annual target plans assigned for this filter selection.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map(plan => (
              <div 
                key={plan.id}
                onClick={() => navigate(`/school/teacher/syllabus-planner/${plan.id}`)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                    {plan.class_name || plan.className} {plan.section_name ? `(${plan.section_name})` : ''}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {plan.term || 'Annual Target'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center justify-between">
                    <span>{plan.subject_name || plan.subjectName}</span>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Assigned Target Periods: <strong className="text-slate-800 dark:text-slate-200">{plan.planned_periods || plan.plannedPeriods || 24}</strong></p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTimetableSlot({
                        classId: plan.class_id,
                        sectionId: plan.section_id,
                        subjectId: plan.subject_id,
                        className: plan.class_name,
                        sectionName: plan.section_name,
                        subjectName: plan.subject_name
                      });
                      setCreateModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <Plus size={14} /> Add Lesson Plan
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/school/teacher/syllabus-planner/${plan.id}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                  >
                    View Curriculum →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Timetable Sessions */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Today's Scheduled Classes</h3>
              <p className="text-xs text-slate-500">Attach or launch lesson plans for today's timetable slots.</p>
            </div>
          </div>
        </div>

        {filteredTimetable.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No class periods scheduled for the selected filter.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTimetable.map(slot => (
              <div key={slot.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{slot.class_name} ({slot.section_name})</span>
                  <span className="text-[10px] font-bold text-slate-400">{slot.start_time} - {slot.end_time}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{slot.subject_name || 'Subject Period'}</h4>
                <button
                  onClick={() => {
                    setSelectedTimetableSlot(slot);
                    setCreateModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white py-2 text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  <Plus size={14} /> Attach Lesson Plan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Execution & Topic Progress List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Lesson Plans & Topic Execution</h3>
              <p className="text-xs text-slate-500">Log classroom completion, actual periods spent, and topic coverage.</p>
            </div>
          </div>

          <div className="flex gap-2">
            {['ALL', 'TODAY', 'UPCOMING', 'PENDING', 'COMPLETED', 'DELAYED'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {displayLessonsList.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-slate-400 font-semibold">No lesson plans found under this filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayLessonsList.map((lesson, idx) => (
              <div key={lesson.id || idx} className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {lesson.class_name || lesson.className} ({lesson.section_name || lesson.sectionName})
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${lesson.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : lesson.status === 'DELAYED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
                      {lesson.status || 'Planned'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {lesson.topic_name || lesson.topicName || lesson.chapter_name || 'Lesson Session'}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold">Subject: <strong className="text-slate-800 dark:text-slate-200">{lesson.subject_name || lesson.subjectName}</strong></p>

                  {lesson.date && (
                    <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock size={13} /> Date: {new Date(lesson.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Periods: {lesson.periods_allocated || 1}</span>
                  {lesson.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setCompletionModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} /> Mark Complete
                    </button>
                  ) : (
                    <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {createModalOpen && (
        <LessonPlanFormModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={fetchTeachingPlan}
          timetableSlot={selectedTimetableSlot}
          publishedPlans={publishedPlans}
        />
      )}

      {completionModalOpen && selectedLesson && (
        <LessonCompletionModal
          open={completionModalOpen}
          onClose={() => setCompletionModalOpen(false)}
          onSuccess={fetchTeachingPlan}
          lesson={selectedLesson}
        />
      )}

      {templatesModalOpen && (
        <LessonTemplatesModal
          open={templatesModalOpen}
          onClose={() => setTemplatesModalOpen(false)}
          onSelectTemplate={() => {
            setTemplatesModalOpen(false);
            setCreateModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
