// TeacherTeachingPlan - My Teaching Plan Dashboard & Lesson Execution Portal
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle2, AlertCircle, Plus, Sparkles,
  Layers, BookOpen, Loader2, ArrowRight, Play, Filter, TrendingUp,
  AlertTriangle, Hourglass, ShieldAlert, CheckSquare, CalendarDays,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { toast } from 'sonner';
import LessonPlanFormModal from '@/components/school/teacher/LessonPlanFormModal';
import LessonCompletionModal from '@/components/school/teacher/LessonCompletionModal';
import LessonTemplatesModal from '@/components/school/teacher/LessonTemplatesModal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAGE_SIZE = 6;

// Builds deduped {id, name} filter options from a mixed-source item list. Different
// sources (timetable slots, lesson plans, syllabus plans, teacher assignments) don't all
// carry a real ID for every dimension — this prefers a real ID over a name-fallback ID
// when merging duplicates, regardless of which source happens to be processed last, so a
// class/section/subject that appears in a source lacking its real ID doesn't silently
// clobber a good ID discovered elsewhere.
function buildFilterOptions(items, getName, getId) {
  const map = new Map();
  items.forEach(item => {
    const name = getName(item);
    if (!name) return;
    const key = String(name).toLowerCase();
    const id = getId(item) || name;
    const existing = map.get(key);
    if (!existing || (existing.id === existing.name && id !== name)) {
      map.set(key, { id, name });
    }
  });
  return Array.from(map.values());
}

function PageControls({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const safePage = Math.min(page, totalPages);
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
        disabled={safePage <= 1}
        className="gap-1 rounded-xl font-bold"
      >
        <ChevronLeft size={14} /> Prev
      </Button>
      <span className="text-xs font-bold text-slate-500">Page {safePage} of {totalPages}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        disabled={safePage >= totalPages}
        className="gap-1 rounded-xl font-bold"
      >
        Next <ChevronRight size={14} />
      </Button>
    </div>
  );
}

// Thin wrapper over the shadcn Select for the "ALL | option…" filter dropdowns on this page.
function FilterSelect({ value, onChange, allLabel, options, optionLabel = (o) => o.name, disabled, title, className }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger title={title} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL" className="text-xs font-semibold">{allLabel}</SelectItem>
        {options.map(o => (
          <SelectItem key={o.id} value={String(o.id)} className="text-xs font-semibold">{optionLabel(o)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const FILTER_TRIGGER = 'h-9 w-auto min-w-[140px] rounded-2xl border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-white';
const INLINE_TRIGGER = 'h-8 w-auto min-w-[120px] rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-white';

function LessonPlanCard({ lesson, onMarkComplete }) {
  const navigate = useNavigate();
  const isDone = lesson.status === 'COMPLETED';
  return (
    <Card id={`lesson-${lesson.id}`} className="rounded-2xl border-slate-200 p-5 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 gap-y-3 flex flex-col justify-between scroll-mt-24">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {lesson.class_name} {lesson.section_name ? `(${lesson.section_name})` : ''}
          </span>
          <Badge variant="secondary" className={`px-2 py-0.5 text-[10px] font-black uppercase border-0 ${isDone ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300'}`}>
            {isDone ? 'Completed' : (lesson.status || 'Scheduled')}
          </Badge>
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{lesson.subject_name || 'Subject'}</h4>
        {lesson.chapter_name && (
          <p className="text-xs text-slate-500 font-semibold">Chapter: <strong className="text-slate-800 dark:text-slate-200">{lesson.chapter_name}</strong></p>
        )}
        {lesson.topic_name && (
          <p className="text-xs text-slate-500 font-semibold">Topic: <strong className="text-slate-800 dark:text-slate-200">{lesson.topic_name}</strong></p>
        )}
        <p className="text-[10px] font-bold text-slate-400">{lesson.date ? new Date(lesson.date).toLocaleDateString() : ''}</p>
      </div>

      <CardFooter className="p-0 pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(`/school/teacher/lesson-plans/${lesson.id}`, { state: { subjectName: lesson.subject_name } })}
          className="flex-1 gap-1.5 rounded-xl border-blue-200 text-blue-600 text-xs font-extrabold hover:bg-blue-50 hover:text-blue-600 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
        >
          <Sparkles size={13} /> {lesson.ai_brief ? 'View Brief' : 'View'}
        </Button>
        {!isDone && (
          <Button
            type="button"
            size="sm"
            onClick={() => onMarkComplete(lesson)}
            className="flex-1 gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-extrabold shadow-sm"
          >
            <CheckCircle2 size={13} /> Mark Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function TeacherTeachingPlan() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  const [selectedTimetableSlot, setSelectedTimetableSlot] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedTemplateData, setSelectedTemplateData] = useState(null);

  // Class, Section, Subject, Chapter & Topic Filter States
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedChapter, setSelectedChapter] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL');

  // Per-section pagination
  const [annualPage, setAnnualPage] = useState(1);
  const [lessonPlansPage, setLessonPlansPage] = useState(1);
  const [topicsPage, setTopicsPage] = useState(1);

  // Full curriculum catalog for the selected subject (Chapter/Topic filter options) —
  // NOT derived from syllabus-plan JSON or already-created lessons, since either of
  // those only ever cover a subset of a subject's real chapters/topics.
  const [catalogChapters, setCatalogChapters] = useState([]);
  const [catalogTopics, setCatalogTopics] = useState([]);

  useEffect(() => {
    fetchTeachingPlan();
  }, []);

  useEffect(() => {
    if (selectedSubject === 'ALL') {
      setCatalogChapters([]);
      setCatalogTopics([]);
      return;
    }
    const params = {
      subjectId: selectedSubject,
      classId: selectedClass !== 'ALL' ? selectedClass : undefined,
      sectionId: selectedSection !== 'ALL' ? selectedSection : undefined,
    };
    api.get('/topics/chapters', { params }).then(res => {
      setCatalogChapters(unwrapSchoolList(res));
    }).catch(() => setCatalogChapters([]));
    api.get('/topics', { params: { subjectId: selectedSubject } }).then(res => {
      setCatalogTopics(unwrapSchoolList(res));
    }).catch(() => setCatalogTopics([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedClass, selectedSection]);

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
        <Loader2 className="size-8 animate-spin text-blue-600" />
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

  // Shared "does this item belong to the currently selected class/section?" check, used to
  // progressively narrow Section → Subject option lists. Matches by ID when both sides have
  // one, falling back to a name comparison only when an ID is missing on the item.
  const itemInSelectedClass = (item) => {
    if (selectedClass === 'ALL') return true;
    const cid = item.class_id || item.classId;
    const cname = item.class_name || item.className;
    return cid === selectedClass || cname?.toLowerCase() === selectedClass.toLowerCase();
  };
  const itemInSelectedSection = (item) => {
    if (selectedSection === 'ALL') return true;
    const secId = item.section_id || item.sectionId;
    const secName = item.section_name || item.sectionName;
    return secId === selectedSection || secName?.toLowerCase() === selectedSection.toLowerCase();
  };

  // 1. Available Classes assigned to this teacher
  const availableClasses = buildFilterOptions(
    allItems,
    item => item.class_name || item.className,
    item => item.class_id || item.classId
  ).sort((a, b) => {
    const numA = parseInt((a.name || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b.name || '').replace(/\D/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    return (a.name || '').localeCompare(b.name || '');
  });

  // 2. Available Sections dynamically filtered by selectedClass
  const availableSections = buildFilterOptions(
    allItems.filter(itemInSelectedClass),
    item => item.section_name || item.sectionName,
    item => item.section_id || item.sectionId
  ).sort((a, b) => a.name.localeCompare(b.name));

  // 3. Available Subjects dynamically filtered by selectedClass & selectedSection
  const availableSubjects = buildFilterOptions(
    allItems.filter(item => itemInSelectedClass(item) && itemInSelectedSection(item)),
    item => item.subject_name || item.subjectName,
    item => item.subject_id || item.subjectId
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Generic Filter Matcher. checkTopicDimension additionally constrains by chapter/topic —
  // only meaningful for topic-/lesson-grained items (a whole syllabus plan or a timetable
  // slot doesn't represent a single chapter/topic, so they never pass this option).
  const matchesFilter = (item, { checkTopicDimension = false } = {}) => {
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
    if (checkTopicDimension) {
      const itemChId = item.chapterId || item.chapter_id;
      const itemChName = item.chapterName || item.chapter_name;
      const itemTopId = item.topicId || item.topic_id;
      const itemTopName = item.topicName || item.topic_name || item.name;
      if (selectedChapter !== 'ALL') {
        if (itemChId !== selectedChapter && itemChName?.toLowerCase() !== selectedChapter.toLowerCase()) return false;
      }
      if (selectedTopic !== 'ALL') {
        if (itemTopId !== selectedTopic && itemTopName?.toLowerCase() !== selectedTopic.toLowerCase()) return false;
      }
    }
    return true;
  };

  const filteredPlans = Array.from(new Map(publishedPlans.map(plan => [plan.id, plan])).values()).filter(matchesFilter);
  const filteredLessons = lessons.filter(item => matchesFilter(item, { checkTopicDimension: true }));

  // Flatten all topics from filteredPlans (syllabus plan chapter_allocations)
  const planTopicsList = filteredPlans.flatMap(plan => {
    const allocs = Array.isArray(plan.chapter_allocations) ? plan.chapter_allocations : [];
    return allocs.flatMap(ch => {
      const topics = Array.isArray(ch.topics) && ch.topics.length > 0
        ? ch.topics
        : [{ topicId: `placeholder-${ch.chapterId || ch.chapterName}`, topicName: `All topics in ${ch.chapterName}`, status: 'pending', progress: 0 }];
      return topics.map(t => ({
        ...t,
        planId: plan.id,
        chapterId: ch.chapterId,
        chapterName: ch.chapterName,
        // IDs (not just display names) are required here — matchesFilter compares by ID
        // first and only falls back to a name match when an ID is missing, so without
        // these a topic can silently fail to match a class/section/subject filter even
        // though its own parent plan already matched.
        subject_id: plan.subject_id || plan.subjectId,
        subject_name: plan.subject_name || plan.subjectName,
        class_id: plan.class_id || plan.classId,
        class_name: plan.class_name || plan.className,
        section_id: plan.section_id || plan.sectionId,
        section_name: plan.section_name || plan.sectionName,
      }));
    });
  });

  // Chapter/Topic filter options — sourced from the real curriculum catalog for the
  // selected subject (fetched above), not from syllabus-plan JSON or already-created
  // lessons, either of which only ever covers a subset of a subject's actual chapters/topics.
  const availableChapters = catalogChapters
    .map(ch => ({ id: ch.id, name: ch.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const availableTopics = catalogTopics
    .filter(t => selectedChapter === 'ALL' || String(t.chapter_id) === String(selectedChapter))
    .map(t => ({ id: t.id, name: t.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Syllabus topics narrowed by chapter/topic too (class/section/subject already applied
  // upstream via filteredPlans).
  const filteredPlanTopics = planTopicsList.filter(t => matchesFilter(t, { checkTopicDimension: true }));

  // --- COMPUTE THE DASHBOARD METRIC CARDS DYNAMICALLY FROM SYLLABUS PLAN TOPICS ---
  const todayStr = new Date().toISOString().split('T')[0];

  // Map activeTab to plan topics (chapter/topic-filtered)
  const getDisplayPlanTopics = () => {
    switch (activeTab) {
      case 'TODAY': return filteredPlanTopics.filter(t => t.status === 'in_progress' || t.startDate === todayStr);
      case 'PENDING':   return filteredPlanTopics.filter(t => t.status === 'pending' || !t.status || t.status === 'in_progress');
      case 'COMPLETED': return filteredPlanTopics.filter(t => t.status === 'completed' || t.progress >= 100);
      case 'DELAYED':   return filteredPlanTopics.filter(t => t.delayReason && t.status !== 'completed');
      default:          return filteredPlanTopics;
    }
  };
  const displayPlanTopics = getDisplayPlanTopics();

  // 1. Today's lessons / topics scheduled today or in_progress
  const todaysLessons = filteredPlanTopics.filter(t => t.status === 'in_progress' || t.startDate === todayStr);

  // 2. Pending lessons: count of topics with no updates yet or status = 'pending' or 'in_progress'
  const pendingLessons = filteredPlanTopics.filter(t => !t.status || t.status === 'pending' || t.status === 'in_progress');

  // 3. Completed topics
  const completedLessons = filteredPlanTopics.filter(t => t.status === 'completed' || t.progress >= 100);

  // 4. Delayed topics
  const delayedLessons = filteredPlanTopics.filter(t => t.delayReason && t.status !== 'completed');

  // 5. Syllabus completion %
  const rawTotalTopicsCount = filteredPlanTopics.length;
  const totalTopicsCount = rawTotalTopicsCount || 1;
  const syllabusCompletionPercentage = Math.round((completedLessons.length / totalTopicsCount) * 100);

  // 6. Topics behind schedule
  const topicsBehindScheduleCount = delayedLessons.length;

  // Filter lessons based on selected tab
  const getDisplayLessons = () => {
    switch (activeTab) {
      case 'TODAY': return todaysLessons.length > 0 ? todaysLessons : filteredLessons;
      case 'PENDING': return pendingLessons;
      case 'COMPLETED': return completedLessons;
      case 'DELAYED': return delayedLessons;
      default: return filteredLessons;
    }
  };

  const displayLessonsList = getDisplayLessons();

  // Pagination — clamp against the current filtered length at render time so changing a
  // filter never strands the view on an empty out-of-range page.
  const annualTotalPages = Math.max(1, Math.ceil(filteredPlans.length / PAGE_SIZE));
  const safeAnnualPage = Math.min(annualPage, annualTotalPages);
  const paginatedPlans = filteredPlans.slice((safeAnnualPage - 1) * PAGE_SIZE, safeAnnualPage * PAGE_SIZE);

  const lessonPlansTotalPages = Math.max(1, Math.ceil(filteredLessons.length / PAGE_SIZE));
  const safeLessonPlansPage = Math.min(lessonPlansPage, lessonPlansTotalPages);
  const paginatedLessons = filteredLessons.slice((safeLessonPlansPage - 1) * PAGE_SIZE, safeLessonPlansPage * PAGE_SIZE);

  const topicsTotalPages = Math.max(1, Math.ceil(displayPlanTopics.length / PAGE_SIZE));
  const safeTopicsPage = Math.min(topicsPage, topicsTotalPages);
  const paginatedPlanTopics = displayPlanTopics.slice((safeTopicsPage - 1) * PAGE_SIZE, safeTopicsPage * PAGE_SIZE);

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6 font-poppins">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Teaching Plan</h1>
            <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border-blue-200 dark:border-blue-800">
              Teacher Portal
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">Track today's sessions, lesson progress, remaining topics, and classroom execution.</p>
        </div>
      </div>

      {/* DASHBOARD: METRIC CARDS GRID */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {/* 1. Today's lessons */}
        <Card
          onClick={() => setActiveTab('TODAY')}
          className="cursor-pointer rounded-2xl p-4 transition-colors shadow-xs border-slate-200 bg-white hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">1. Today's Lessons</span>
            <div className="p-1.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40">
              <CalendarDays size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{todaysLessons.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Scheduled for today</p>
        </Card>

        {/* 2. Pending lessons */}
        <Card
          onClick={() => setActiveTab('PENDING')}
          className="cursor-pointer rounded-2xl p-4 transition-colors shadow-xs border-slate-200 bg-white hover:border-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">2. Pending Lessons</span>
            <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40">
              <Hourglass size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">{pendingLessons.length}</p>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1">Awaiting execution</p>
        </Card>

        {/* 3. Completed lessons */}
        <Card
          onClick={() => setActiveTab('COMPLETED')}
          className="cursor-pointer rounded-2xl p-4 transition-colors shadow-xs border-slate-200 bg-white hover:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">3. Completed Lessons</span>
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{completedLessons.length}</p>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">Classroom verified</p>
        </Card>

        {/* 4. Syllabus completion % */}
        <Card className="rounded-2xl border-blue-200 bg-blue-50/40 p-4 shadow-xs transition-colors hover:border-blue-500 dark:border-blue-900/40 dark:bg-blue-950/20 dark:hover:border-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">4. Syllabus Completion %</span>
            <div className="p-1.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">{syllabusCompletionPercentage}%</p>
          <Progress
            value={syllabusCompletionPercentage}
            className="h-2 mt-2 bg-blue-200 dark:bg-blue-900"
            indicatorClassName="bg-blue-600 duration-500"
          />
        </Card>

        {/* 5. Topics behind schedule */}
        <Card
          onClick={() => setActiveTab('DELAYED')}
          className="col-span-2 sm:col-span-1 xl:col-span-1 cursor-pointer rounded-2xl p-4 transition-colors shadow-xs border-rose-200 bg-rose-50/40 hover:border-rose-500 dark:border-rose-900/40 dark:bg-rose-950/20 dark:hover:border-rose-500"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">5. Topics Behind Schedule</span>
            <div className="p-1.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/40">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">{topicsBehindScheduleCount}</p>
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-1">Requires priority coverage</p>
        </Card>
      </div>

      {/* Class, Section, Subject, Chapter & Topic Filter Bar */}
      <Card className="rounded-3xl border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
          <Filter size={16} className="text-blue-600 dark:text-blue-400" /> Filter:
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1">
          <FilterSelect
            value={selectedClass}
            onChange={setSelectedClass}
            allLabel="All Classes"
            options={availableClasses}
            className={FILTER_TRIGGER}
          />

          <FilterSelect
            value={selectedSection}
            onChange={setSelectedSection}
            allLabel="All Sections"
            options={availableSections}
            optionLabel={s => `Section ${s.name}`}
            className={FILTER_TRIGGER}
          />

          <FilterSelect
            value={selectedSubject}
            onChange={(val) => {
              // A chapter/topic picked under a different subject won't exist in the new
              // subject's catalog — reset both rather than silently filtering to nothing.
              setSelectedSubject(val);
              setSelectedChapter('ALL');
              setSelectedTopic('ALL');
            }}
            allLabel="All Subjects"
            options={availableSubjects}
            className={FILTER_TRIGGER}
          />

          <FilterSelect
            value={selectedChapter}
            onChange={(val) => { setSelectedChapter(val); setSelectedTopic('ALL'); }}
            disabled={selectedSubject === 'ALL'}
            title={selectedSubject === 'ALL' ? 'Select a subject first' : undefined}
            allLabel={selectedSubject === 'ALL' ? 'Select subject first' : 'All Chapters'}
            options={availableChapters}
            className={FILTER_TRIGGER}
          />

          <FilterSelect
            value={selectedTopic}
            onChange={setSelectedTopic}
            disabled={selectedSubject === 'ALL'}
            title={selectedSubject === 'ALL' ? 'Select a subject first' : undefined}
            allLabel={selectedSubject === 'ALL' ? 'Select subject first' : 'All Topics'}
            options={availableTopics}
            className={FILTER_TRIGGER}
          />

          {(selectedClass !== 'ALL' || selectedSection !== 'ALL' || selectedSubject !== 'ALL' || selectedChapter !== 'ALL' || selectedTopic !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedClass('ALL');
                setSelectedSection('ALL');
                setSelectedSubject('ALL');
                setSelectedChapter('ALL');
                setSelectedTopic('ALL');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-600 hover:underline"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </Card>

      {/* ANNUAL SYLLABUS TARGET PLAN ASSIGNED BY ADMIN */}
      <Card className="rounded-3xl border-blue-200 bg-blue-50/30 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/20">
        <CardHeader className="p-6 pb-4 flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-blue-100 dark:border-blue-900/40 mx-6 px-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <CardTitle className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-normal">Annual Syllabus Target Plan Assigned by Admin</CardTitle>
              <CardDescription className="text-xs text-slate-500">Official annual subject target roadmap published by academic administration.</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="All Classes"
              options={availableClasses}
              className={INLINE_TRIGGER}
            />
            <FilterSelect
              value={selectedSection}
              onChange={setSelectedSection}
              allLabel="All Sections"
              options={availableSections}
              optionLabel={s => `Section ${s.name}`}
              className={INLINE_TRIGGER}
            />
            <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 text-xs font-black whitespace-nowrap border-0">
              {filteredPlans.length} Annual Targets
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {filteredPlans.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center italic">No published annual target plans assigned for this filter selection.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedPlans.map(plan => (
                <Card
                  key={plan.id}
                  onClick={() => navigate(`/school/teacher/syllabus-planner/${plan.id}`, { state: { subjectName: plan.subject_name || plan.subjectName } })}
                  className="group cursor-pointer rounded-2xl border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                      {plan.class_name || plan.className} {plan.section_name ? `(${plan.section_name})` : ''}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-0">
                      {plan.term || 'Annual Target'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center justify-between">
                      <span>{plan.subject_name || plan.subjectName}</span>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Assigned Target Periods: <strong className="text-slate-800 dark:text-slate-200">{plan.planned_periods || plan.plannedPeriods || 24}</strong></p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/school/teacher/syllabus-planner/${plan.id}`, { state: { subjectName: plan.subject_name || plan.subjectName } });
                      }}
                      className="w-full gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-extrabold shadow-md shadow-blue-600/20"
                    >
                      <CheckSquare size={15} /> Update Progress & Execution Details →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <PageControls page={safeAnnualPage} totalPages={annualTotalPages} onPageChange={setAnnualPage} />
        </CardContent>
      </Card>

      {/* MY LESSON PLANS — actual lesson_plans records you've created (AI brief or manual) */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="p-6 pb-4 flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800 mx-6 px-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
              <Sparkles size={20} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-normal">My Lesson Plans</CardTitle>
              <CardDescription className="text-xs text-slate-500">Lesson plans you've created — AI briefs and manual write-ups.</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setSelectedTimetableSlot(null);
                setCreateModalOpen(true);
              }}
              className="gap-2 rounded-2xl bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus size={15} /> New Lesson
            </Button>
            <Button
              variant="outline"
              onClick={() => setTemplatesModalOpen(true)}
              className="gap-2 rounded-2xl text-xs font-bold shadow-sm"
            >
              <Layers size={15} /> Lesson Templates
            </Button>
            <Badge variant="secondary" className="px-3 py-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-black border-0">
              {filteredLessons.length} Lesson{filteredLessons.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {filteredLessons.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center italic">No lesson plans yet for this filter selection — create one with "+ New Lesson."</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedLessons.map(lesson => (
                <LessonPlanCard
                  key={lesson.id}
                  lesson={lesson}
                  onMarkComplete={(l) => { setSelectedLesson(l); setCompletionModalOpen(true); }}
                />
              ))}
            </div>
          )}
          <PageControls page={safeLessonPlansPage} totalPages={lessonPlansTotalPages} onPageChange={setLessonPlansPage} />
        </CardContent>
      </Card>

      {/* Syllabus Topics — Progress Tracker (sourced from the admin-assigned syllabus plan's topics).
          Read-only status overview — deliberately doesn't link out to the syllabus planner
          (that's what the Annual Target cards above are for); delay reason is shown right
          on the card instead so nothing needs a click-through to be understood. */}
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="p-6 pb-4 flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-slate-100 dark:border-slate-800 mx-6 px-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
              <BookOpen size={20} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-normal">Syllabus Topics — Progress Tracker</CardTitle>
              <CardDescription className="text-xs text-slate-500">Topics from your assigned syllabus plan, with status and delay reason at a glance.</CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="All Classes"
              options={availableClasses}
              className={INLINE_TRIGGER}
            />
            <FilterSelect
              value={selectedSection}
              onChange={setSelectedSection}
              allLabel="All Sections"
              options={availableSections}
              optionLabel={s => `Section ${s.name}`}
              className={INLINE_TRIGGER}
            />
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
                {['ALL', 'TODAY', 'PENDING', 'COMPLETED', 'DELAYED'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xs dark:bg-slate-800 dark:text-slate-300"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {displayPlanTopics.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs text-slate-400 font-semibold">No topics found under this filter.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedPlanTopics.map((topic, idx) => {
                const isDone = topic.status === 'completed' || topic.progress >= 100;
                const isInProgress = topic.status === 'in_progress' && !isDone;
                const hasDelay = !isDone && topic.delayReason;
                return (
                  <Card
                    key={topic.topicId || idx}
                    className="rounded-2xl border-slate-200 p-5 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 gap-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {topic.class_name} {topic.section_name ? `(${topic.section_name})` : ''}
                        </span>
                        <Badge variant="secondary" className={`px-2 py-0.5 text-[10px] font-black uppercase border-0 ${
                          isDone ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                          : isInProgress ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300'
                          : hasDelay ? 'bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {isDone ? 'Completed' : isInProgress ? 'In Progress' : hasDelay ? 'Delayed' : 'Pending'}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {topic.topicName || topic.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        Chapter: <strong className="text-slate-800 dark:text-slate-200">{topic.chapterName}</strong>
                      </p>
                      <p className="text-xs text-slate-500 font-semibold">
                        Subject: <strong className="text-slate-800 dark:text-slate-200">{topic.subject_name}</strong>
                      </p>

                      {/* Progress bar */}
                      {topic.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-500">Progress</span>
                            <span className={isDone ? 'text-emerald-600' : 'text-blue-600'}>{topic.progress ?? (isDone ? 100 : 0)}%</span>
                          </div>
                          <Progress
                            value={topic.progress ?? (isDone ? 100 : 0)}
                            className="h-1.5 bg-slate-100 dark:bg-slate-800"
                            indicatorClassName={`duration-500 ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          />
                        </div>
                      )}

                    </div>

                    <CardFooter className="p-0 pt-2 border-t border-slate-100 dark:border-slate-800 block">
                      {hasDelay ? (
                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertCircle size={12} className="shrink-0" /> {topic.delayReason}
                        </p>
                      ) : (
                        <p className="text-[10px] font-semibold text-slate-400">No delay reported.</p>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
          <PageControls page={safeTopicsPage} totalPages={topicsTotalPages} onPageChange={setTopicsPage} />
        </CardContent>
      </Card>

      {/* Modals */}
      {createModalOpen && (
        <LessonPlanFormModal
          open={createModalOpen}
          onClose={() => { setCreateModalOpen(false); setSelectedTemplateData(null); }}
          onSuccess={fetchTeachingPlan}
          timetableSlot={selectedTimetableSlot}
          publishedPlans={publishedPlans}
          templateData={selectedTemplateData}
          teacherAssignments={teacherAssignments}
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
          onSelectTemplate={(contentJson) => {
            setSelectedTemplateData(contentJson || null);
            setTemplatesModalOpen(false);
            setCreateModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
