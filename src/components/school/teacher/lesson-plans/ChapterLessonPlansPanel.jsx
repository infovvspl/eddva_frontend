// Teacher: "My Lesson Plan", laid out on the admin's annual syllabus plan.
// For the chosen class and subject: Unit → Chapter (planned periods, topics done)
// → topics, and on every chapter its lesson plan (none / generating / draft /
// waiting / approved) with Create or Open and how many periods have been taught.
// Chapters of the subject that the admin's plan does not list are shown after it;
// without an admin plan, every chapter of the subject is listed.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertCircle, BookOpen, CalendarRange, CheckCircle2, ChevronRight, Clock, ListChecks, Loader2, Plus, Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LessonPlanStatusBadge } from '@/components/school/lesson-plans/LessonPlanView';
import CreateLessonPlanDialog, { keyOf } from '@/components/school/teacher/lesson-plans/CreateLessonPlanDialog';
import { apiError, lessonPlans } from '@/lib/api/school-lesson-plans';

const ACTIVE_KEY = 'my-lesson-plan:active-subject';
const WORKING = ['GENERATING', 'DRAFT', 'FAILED', 'PENDING_APPROVAL', 'CHANGES_REQUESTED'];

// The admin plan's unit headings, as on the annual syllabus plan page.
const UNITS = [
  { key: 'unit 1', label: 'Unit 1 (Periodic Test 1)', dot: 'bg-blue-600', text: 'text-blue-700 dark:text-blue-300', pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { key: 'term 1', label: 'Term 1 (Half Yearly / Mid Term)', dot: 'bg-indigo-600', text: 'text-indigo-700 dark:text-indigo-300', pill: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  { key: 'unit 2', label: 'Unit 2 (Periodic Test 2)', dot: 'bg-purple-600', text: 'text-purple-700 dark:text-purple-300', pill: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  { key: 'term 2', label: 'Term 2 (Final Examination)', dot: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
];
const OTHER_UNIT = { key: 'other', label: 'Other chapters in the plan', dot: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-300', pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
const normTerm = (t) => String(t || '').trim().toLowerCase();
const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const chapterPeriods = (c) => Number(c.periods || c.plannedPeriods) || null;
const readActive = () => { try { return localStorage.getItem(ACTIVE_KEY) || ''; } catch { return ''; } };
const writeActive = (k) => { try { localStorage.setItem(ACTIVE_KEY, k); } catch { /* storage blocked */ } };

/** The teacher's lesson plans for one chapter: the one being worked on, and the approved one. */
function plansForChapter(plans, chapterId, chapterName) {
  const mine = plans.filter((p) => (chapterId ? p.chapterId === chapterId : sameName(p.chapterName, chapterName)));
  return { working: mine.find((p) => WORKING.includes(p.status)), approved: mine.find((p) => p.status === 'APPROVED') };
}

function LessonPlanLine({ lp, onCreate, onOpen }) {
  const { working, approved } = lp;
  const main = working || approved;
  if (!main) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <span className="text-xs font-semibold text-slate-500">No lesson plan for this chapter yet.</span>
        <Button size="sm" onClick={onCreate} className="h-7 gap-1 rounded-xl text-xs"><Plus className="size-3.5" /> Create lesson plan</Button>
      </div>
    );
  }
  const taught = approved?.progressTotal ? `${approved.progressDone || 0} of ${approved.progressTotal} periods taught` : null;
  return (
    <button type="button" onClick={() => onOpen(main.id)}
      className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900">
      <span className="text-xs font-black text-slate-700 dark:text-slate-200">Lesson plan</span>
      {main.status === 'GENERATING' && <Loader2 className="size-3.5 animate-spin text-blue-500" aria-label="Generating" />}
      <LessonPlanStatusBadge status={main.status} />
      {main.version > 1 && <span className="text-[11px] font-semibold text-slate-500">v{main.version}</span>}
      {working && approved && <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">· approved version in use</span>}
      {main.status === 'CHANGES_REQUESTED' && main.reviewComment && <span className="truncate text-[11px] text-orange-700 dark:text-orange-300">“{main.reviewComment}”</span>}
      {taught && <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">· {taught}</span>}
      <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-bold text-blue-600">Open <ChevronRight className="size-3.5" /></span>
    </button>
  );
}

function TopicRow({ t, index }) {
  const done = t.status === 'completed' || t.progress >= 100;
  const progress = t.progress ?? (done ? 100 : 0);
  const spent = t.actualPeriods ?? 0;
  const state = done ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'Pending';
  const stateClass = done ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : t.status === 'in_progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2">
        <span className={done ? 'font-bold text-emerald-500' : 'font-bold text-blue-500'}>•</span>
        <span className={done ? 'font-bold text-slate-400 line-through' : 'font-bold text-slate-900 dark:text-white'}>Topic {index + 1}: {t.topicName || t.name}</span>
      </span>
      <span className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-extrabold text-blue-600 dark:text-blue-400">{progress}% Completed</span>
        <span className="font-bold text-slate-500">({spent} Periods Spent)</span>
        <span className={`rounded-lg px-2.5 py-1 font-black ${stateClass}`}>{state}</span>
      </span>
    </div>
  );
}

function ChapterCard({ number, chapter, unit, lp, onCreate, onOpen }) {
  const topics = Array.isArray(chapter.topics) ? chapter.topics : [];
  const topicsDone = topics.filter((t) => t.status === 'completed' || t.progress >= 100).length;
  const periods = chapterPeriods(chapter);
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`size-2.5 shrink-0 rounded-full ${unit.dot}`} />
          <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">Chapter {number}: {chapter.chapterName}</h4>
        </div>
        <div className="flex items-center gap-2">
          {periods && (
            <span className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Clock size={11} /> {periods} Periods
            </span>
          )}
          {topics.length > 0 && (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {topicsDone}/{topics.length} Done
            </span>
          )}
        </div>
      </div>
      <LessonPlanLine lp={lp} onCreate={onCreate} onOpen={onOpen} />
      {topics.length > 0 && (
        <div className="space-y-2 border-l-2 border-slate-200 pl-4 dark:border-slate-800">
          {topics.map((t, i) => <TopicRow key={t.topicId || i} t={t} index={i} />)}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <Card className="rounded-2xl border-slate-200 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500"><Icon className="size-3.5" /> {label}</p>
      <p className={`mt-1 text-lg font-black ${tone}`}>{value}</p>
    </Card>
  );
}

function SubjectPlan({ assignment, annualPlans, plans, chapters, chaptersLoading, onCreate, onOpen }) {
  const navigate = useNavigate();
  // One admin plan per section at most (newest first from the API); a class-wide plan has no section.
  const sectionPlans = useMemo(() => {
    const seen = new Set();
    return annualPlans.filter((p) => { const k = p.section_id || 'all'; if (seen.has(k)) return false; seen.add(k); return true; });
  }, [annualPlans]);
  const [planId, setPlanId] = useState(sectionPlans[0]?.id || '');
  useEffect(() => { if (!sectionPlans.some((p) => p.id === planId)) setPlanId(sectionPlans[0]?.id || ''); }, [sectionPlans, planId]);
  const plan = sectionPlans.find((p) => p.id === planId);
  const allocs = Array.isArray(plan?.chapter_allocations) ? plan.chapter_allocations : [];

  const groups = useMemo(() => {
    const known = UNITS.map((u) => ({ unit: u, chapters: allocs.filter((c) => normTerm(c.term) === u.key) }));
    const other = allocs.filter((c) => !UNITS.some((u) => u.key === normTerm(c.term)));
    return [...known, { unit: OTHER_UNIT, chapters: other }].filter((g) => g.chapters.length);
  }, [allocs]);
  const inPlan = (ch) => allocs.some((c) => (c.chapterId ? c.chapterId === ch.id : sameName(c.chapterName, ch.name)));
  const extraChapters = chapters.filter((ch) => !inPlan(ch));

  const listed = plan ? allocs.map((c) => ({ id: c.chapterId, name: c.chapterName })) : chapters;
  const approvedCount = listed.filter((c) => plansForChapter(plans, c.id, c.name).approved).length;
  const plannedPeriods = allocs.reduce((sum, c) => sum + (chapterPeriods(c) || 0), 0);
  const topicCount = allocs.reduce((sum, c) => sum + (Array.isArray(c.topics) ? c.topics.length : 0), 0);
  const session = plan?.academic_year || null;

  const create = (chapterId, periods) => onCreate({ assignmentKey: keyOf(assignment), chapterIds: chapterId ? [chapterId] : [], periods });

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border-slate-200 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-black uppercase text-white">
              {assignment.className}{plan?.section_name ? ` (${plan.section_name})` : assignment.sectionNames ? ` (${assignment.sectionNames})` : ''}
            </span>
            {session && <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">Session {session}</span>}
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
            {assignment.subjectName} — {plan ? 'Annual Syllabus Plan' : 'Chapters'}
          </h3>
          {!plan && <p className="text-xs text-slate-500">The admin has not published an annual syllabus plan for this subject yet, so every chapter is listed.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sectionPlans.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Section plan">
              {sectionPlans.map((p) => (
                <button key={p.id} type="button" role="tab" aria-selected={p.id === planId} onClick={() => setPlanId(p.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${p.id === planId ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
                  {p.section_name ? `Sec ${p.section_name}` : 'Whole class'}
                </button>
              ))}
            </div>
          )}
          {plan && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/school/teacher/syllabus-planner/${plan.id}`)}
              className="gap-1.5 rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Shield className="size-3.5" /> Official admin plan
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={BookOpen} label="Total chapters" value={`${listed.length} Chapters`} tone="text-slate-900 dark:text-white" />
        <Stat icon={CheckCircle2} label="Lesson plans approved" value={`${approvedCount} of ${listed.length}`} tone="text-emerald-700 dark:text-emerald-300" />
        {plan
          ? <Stat icon={Clock} label="Planned periods" value={`${plannedPeriods || plan.planned_periods || 0} Periods`} tone="text-indigo-700 dark:text-indigo-300" />
          : <Stat icon={ListChecks} label="In progress" value={`${plans.filter((p) => WORKING.includes(p.status)).length} plans`} tone="text-amber-700 dark:text-amber-300" />}
        {plan
          ? <Stat icon={CalendarRange} label="Target schedule" value={`${fmtDate(plan.planned_start_date)} – ${fmtDate(plan.planned_completion_date)}`} tone="text-sm text-slate-800 dark:text-slate-200" />
          : <Stat icon={CheckCircle2} label="Periods taught" value={`${plans.reduce((s, p) => s + (p.status === 'APPROVED' ? p.progressDone || 0 : 0), 0)}`} tone="text-emerald-700 dark:text-emerald-300" />}
      </div>
      {plan && topicCount > 0 && <p className="-mt-2 text-xs text-slate-500">{topicCount} topics across the plan.</p>}

      {groups.map(({ unit, chapters: chs }) => (
        <Card key={unit.key} className="space-y-4 rounded-3xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <h4 className={`flex items-center gap-2 text-sm font-black uppercase ${unit.text}`}><span className={`size-3 rounded-full ${unit.dot}`} /> {unit.label}</h4>
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${unit.pill}`}>{chs.length} Chapter{chs.length > 1 ? 's' : ''} Mapped</span>
          </div>
          <div className="space-y-4">
            {chs.map((c, i) => (
              <ChapterCard key={c.chapterId || `${unit.key}-${i}`} number={i + 1} chapter={c} unit={unit}
                lp={plansForChapter(plans, c.chapterId, c.chapterName)}
                onCreate={() => create(c.chapterId, chapterPeriods(c))} onOpen={onOpen} />
            ))}
          </div>
        </Card>
      ))}

      {(plan ? extraChapters.length > 0 : true) && (
        <Card className="space-y-3 rounded-3xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <h4 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">{plan ? 'Chapters not in the admin plan' : 'Chapters'}</h4>
          {chaptersLoading && <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin" /> Loading chapters…</p>}
          {!chaptersLoading && !(plan ? extraChapters : chapters).length && <p className="text-xs text-slate-500">This subject has no chapters yet.</p>}
          <div className="space-y-3">
            {(plan ? extraChapters : chapters).map((ch, i) => (
              <ChapterCard key={ch.id} number={i + 1} chapter={{ chapterId: ch.id, chapterName: ch.name, topics: [] }} unit={OTHER_UNIT}
                lp={plansForChapter(plans, ch.id, ch.name)} onCreate={() => create(ch.id)} onOpen={onOpen} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ChapterLessonPlansPanel() {
  const navigate = useNavigate();
  const [mine, setMine] = useState({ loading: true, assignments: [], plans: [], minutesPerPeriod: null });
  const [annual, setAnnual] = useState({ loading: true, plans: [] });
  const [chapters, setChapters] = useState({});
  const [active, setActive] = useState(readActive);
  const [dialog, setDialog] = useState({ open: false, preset: null });

  const loadMine = useCallback(() => lessonPlans.mine()
    .then((d) => setMine({ loading: false, assignments: d?.assignments || [], plans: d?.plans || [], minutesPerPeriod: d?.minutesPerPeriod || null }))
    .catch((err) => { setMine((s) => ({ ...s, loading: false })); toast.error(apiError(err, 'Could not load your lesson plans')); }), []);

  useEffect(() => {
    loadMine();
    lessonPlans.annualPlans()
      .then((plans) => setAnnual({ loading: false, plans }))
      .catch(() => setAnnual({ loading: false, plans: [] })); // the chapter list still works without the admin plan
  }, [loadMine]);

  // Refresh while any plan is still being generated.
  const generating = mine.plans.some((p) => p.status === 'GENERATING');
  useEffect(() => {
    if (!generating) return undefined;
    const t = setInterval(loadMine, 5000);
    return () => clearInterval(t);
  }, [generating, loadMine]);

  const assignment = mine.assignments.find((a) => keyOf(a) === active) || mine.assignments[0];
  const activeKey = assignment ? keyOf(assignment) : '';

  useEffect(() => {
    if (!assignment || chapters[activeKey]) return;
    setChapters((c) => ({ ...c, [activeKey]: { loading: true, list: [] } }));
    lessonPlans.chapters(assignment.classId, assignment.subjectId)
      .then((list) => setChapters((c) => ({ ...c, [activeKey]: { loading: false, list } })))
      .catch(() => setChapters((c) => ({ ...c, [activeKey]: { loading: false, list: [] } })));
  }, [activeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (k) => { setActive(k); writeActive(k); };
  const annualFor = (a) => annual.plans.filter((p) => p.class_id === a.classId && p.subject_id === a.subjectId);
  const plansFor = (a) => mine.plans.filter((p) => p.classId === a.classId && p.subjectId === a.subjectId);
  const openPlan = (id) => navigate(`/school/teacher/chapter-lesson-plans/${id}`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">Chapter lesson plans</h2>
          <p className="text-xs text-slate-500">Laid out on the admin's annual syllabus plan. Create a plan for each chapter and send it for approval; approved plans are the ones you teach from.</p>
        </div>
        <Button onClick={() => setDialog({ open: true, preset: assignment ? { assignmentKey: activeKey } : null })} disabled={!mine.assignments.length} className="gap-1.5">
          <Plus className="size-4" /> Create lesson plan
        </Button>
      </div>

      {mine.loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading your lesson plans">
          <div className="h-28 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div>
          <div className="h-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
        </div>
      )}
      {!mine.loading && !mine.assignments.length && (
        <Card className="flex items-center gap-2 rounded-2xl p-5 text-sm text-slate-500 dark:bg-slate-900">
          <AlertCircle className="size-4" /> You have no class and subject assigned yet, so there is nothing to plan. Ask the admin to assign your subjects.
        </Card>
      )}

      {!mine.loading && mine.assignments.length > 6 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Class and subject</span>
          <Select value={activeKey} onValueChange={choose}>
            <SelectTrigger className="h-9 w-auto min-w-[260px] rounded-2xl text-sm font-semibold" aria-label="Class and subject"><SelectValue /></SelectTrigger>
            <SelectContent>
              {mine.assignments.map((a) => {
                const count = plansFor(a).filter((p) => p.status === 'APPROVED').length;
                return (
                  <SelectItem key={keyOf(a)} value={keyOf(a)} className="text-sm">
                    {a.className} · {a.subjectName}{a.sectionNames ? ` (Sec ${a.sectionNames})` : ''}{count ? ` — ${count} approved` : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}
      {!mine.loading && mine.assignments.length > 1 && mine.assignments.length <= 6 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Class and subject">
          {mine.assignments.map((a) => {
            const k = keyOf(a);
            const count = plansFor(a).filter((p) => p.status === 'APPROVED').length;
            return (
              <button key={k} type="button" role="tab" aria-selected={k === activeKey} onClick={() => choose(k)}
                className={`rounded-2xl border px-3.5 py-2 text-left text-xs font-bold transition ${k === activeKey ? 'border-blue-500 bg-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>
                {a.className} · {a.subjectName}
                {count > 0 && <span className={`ml-1.5 ${k === activeKey ? 'text-blue-100' : 'text-emerald-600'}`}>· {count} approved</span>}
              </button>
            );
          })}
        </div>
      )}

      {!mine.loading && assignment && (annual.loading
        ? <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading the annual syllabus plan…</div>
        : (
          <SubjectPlan key={activeKey} assignment={assignment} annualPlans={annualFor(assignment)} plans={plansFor(assignment)}
            chapters={chapters[activeKey]?.list || []} chaptersLoading={!!chapters[activeKey]?.loading}
            onCreate={(preset) => setDialog({ open: true, preset })} onOpen={openPlan} />
        ))}

      <CreateLessonPlanDialog open={dialog.open} preset={dialog.preset} onClose={() => setDialog({ open: false, preset: null })}
        assignments={mine.assignments} onCreated={loadMine} schoolMinutes={mine.minutesPerPeriod} />
    </div>
  );
}
