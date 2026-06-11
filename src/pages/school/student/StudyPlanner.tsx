"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, subDays, subYears, addDays } from "date-fns";
import { toast } from "sonner";
import { useQueries } from "@tanstack/react-query";
import {
  Brain, Target, Calendar, Clock, ChevronRight, ChevronDown,
  CheckCircle2, PlayCircle, BookOpen, Zap, Trophy, Flame,
  RotateCcw, Map as MapIcon, ListTodo, Star, CheckCheck, Rocket,
  ArrowRight, ArrowLeft, Sparkles, Activity, Trash2, Bell,
  TrendingDown, AlertTriangle, RefreshCw, FileText, ClipboardList,
  BrainCircuit,
} from "lucide-react";
import {
  useTodaysPlan, useWeeklyPlanGrouped, useGeneratePlan, useRegeneratePlan,
  useClearPlan, useStudentMe, useCompletePlanItem, useSkipPlanItem, useProgressReport,
  useMyCourses, useAllBatchLectures, useMockTests, useStudentSessions, useWeeklyActivity,
  useAiStudyHistory, useRevisionSpaced, useRevisionNotes, usePracticeHistory,
  useCourseCurriculum,
} from "@/hooks/use-school-student";
import * as studentApi from "@/lib/api/student";
import type { StudyPlanItem, CourseResource } from "@/lib/api/student";
import type { ProgressReport, SubjectReportEntry, ChapterReportEntry, TopicReportEntry, TestSession, DailyActivity } from "@/lib/api/student";
import RevisionSessionModal from "@/components/school/student/RevisionSessionModal";
import IntensiveRevisionSection from "@/components/school/student/IntensiveRevisionSection";

// ─── Constants ─────────────────────────────────────────────────────────────────

const EXAM_OPTIONS = [
  { key: "jee_mains",    label: "JEE Mains",   icon: "⚛️", desc: "B.Tech admissions (NIT/IIIT)" },
  { key: "jee_advanced", label: "JEE Advanced", icon: "🔬", desc: "IIT admissions" },
  { key: "neet",         label: "NEET",         icon: "🩺", desc: "MBBS/BDS admissions" },
  { key: "foundation",   label: "Foundation",   icon: "📚", desc: "Class 8–10" },
  { key: "other",        label: "Other",        icon: "🎯", desc: "Custom target" },
];

// Only show years whose April exam date is still in the future
const _today = new Date();
const FIRST_FUTURE_EXAM_YEAR = _today.getMonth() >= 3 /* April = 3 */
  ? _today.getFullYear() + 1
  : _today.getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => FIRST_FUTURE_EXAM_YEAR + i);
const HOURS_OPTIONS = [2, 3, 4, 5, 6, 7, 8];
const CLASS_OPTIONS = [
  { key: "9", label: "Class 9" },
  { key: "10", label: "Class 10" },
  { key: "11", label: "Class 11" },
  { key: "12", label: "Class 12" },
  { key: "dropper", label: "Dropper" },
];

const SUBJECT_CFG: Record<string, { color: string; bg: string; border: string; dot: string; ring: string }> = {
  Physics:     { color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200", dot: "bg-indigo-500",  ring: "#6366f1" },
  Chemistry:   { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-500", ring: "#10b981" },
  Mathematics: { color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200", dot: "bg-violet-500",  ring: "#8b5cf6" },
  Math:        { color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200", dot: "bg-violet-500",  ring: "#8b5cf6" },
  Biology:     { color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",   dot: "bg-teal-500",    ring: "#14b8a6" },
  default:     { color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200",  dot: "bg-slate-500",   ring: "#64748b" },
};

function subjectCfg(name: string) {
  for (const key of Object.keys(SUBJECT_CFG)) {
    if (key !== "default" && name?.toLowerCase().includes(key.toLowerCase())) return SUBJECT_CFG[key];
  }
  return SUBJECT_CFG.default;
}

function fmtExam(key?: string) {
  return EXAM_OPTIONS.find(e => e.key === key)?.label ?? key ?? "—";
}

function countdownDays(examYear?: number): number | null {
  if (!examYear) return null;
  return Math.max(0, differenceInDays(new Date(examYear, 3, 15), new Date()));
}

// ─── Priority ──────────────────────────────────────────────────────────────────

type TaskPriority = "high" | "medium" | "low";

function derivePriority(item: StudyPlanItem, weakTopicIds: Set<string>): TaskPriority {
  if (item.type === "mock_test") return "high";
  const topicId = item.content?.topicId;
  if (item.type === "practice" && topicId && weakTopicIds.has(topicId)) return "high";
  if (item.type === "practice" || item.type === "lecture") return "medium";
  return "low";
}

const PRIORITY_CFG: Record<TaskPriority, { label: string; cls: string }> = {
  high:   { label: "HIGH", cls: "bg-red-100 text-red-700 border border-red-200" },
  medium: { label: "MED",  cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  low:    { label: "LOW",  cls: "bg-slate-100 text-slate-500 border border-slate-200" },
};

// Preference Wizard removed for school student study planner

// ─── Generating Animation ──────────────────────────────────────────────────────

function GeneratingView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-10 h-10 text-indigo-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating your study plan</h2>
        <p className="text-gray-500 mb-8 text-sm">
          We are preparing your monthly plan based on your exam and topics...
        </p>
        <div className="space-y-3">
          {[
            { label: "Checking your syllabus", icon: "📚" },
            { label: "Finding important topics",  icon: "🔍" },
            { label: "Making daily schedule",  icon: "📅" },
            { label: "Preparing for your exam", icon: "🎯" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
              <span className="text-lg">{s.icon}</span>
              <span className="text-sm text-gray-700 font-medium">{s.label}</span>
              <div className="ml-auto w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Circular Progress ─────────────────────────────────────────────────────────

function CircleProgress({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
    </svg>
  );
}

// ─── Curriculum Roadmap Tree ──────────────────────────────────────────────────

const TOPIC_STATUS = {
  completed:   { dot: "bg-emerald-500 border-emerald-500", text: "text-emerald-700", badge: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: "✓" },
  in_progress: { dot: "bg-amber-400 border-amber-400",     text: "text-amber-700",   badge: "bg-amber-50 border-amber-200 text-amber-700",       icon: "…" },
  locked:      { dot: "bg-slate-300 border-slate-300",     text: "text-slate-400",   badge: "bg-slate-50 border-slate-200 text-slate-400",        icon: "🔒" },
  default:     { dot: "bg-blue-400 border-blue-400",       text: "text-blue-700",    badge: "bg-blue-50 border-blue-200 text-blue-700",           icon: "○" },
};
function topicStatus(s: string) { return TOPIC_STATUS[s as keyof typeof TOPIC_STATUS] ?? TOPIC_STATUS.default; }

function normalizeText(value?: string | null): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value?: string | null): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

function isLikelySubtopicMatch(taskTopicName: string, roadmapTopicName: string): boolean {
  const task = normalizeText(taskTopicName);
  const roadmap = normalizeText(roadmapTopicName);
  if (!task || !roadmap || task === roadmap) return false;
  if (task.includes(roadmap) || roadmap.includes(task)) return true;

  const taskTokens = tokenize(taskTopicName);
  const roadmapTokens = tokenize(roadmapTopicName);
  if (!taskTokens.length || !roadmapTokens.length) return false;

  const taskSet = new Set(taskTokens);
  const overlap = roadmapTokens.filter((token) => taskSet.has(token)).length;
  const minTokenLen = Math.min(taskTokens.length, roadmapTokens.length);
  return overlap >= 2 || (minTokenLen > 0 && overlap / minTokenLen >= 0.6);
}

const STATUS_RANK: Record<TopicReportEntry["status"], number> = {
  locked: 0,
  unlocked: 1,
  in_progress: 2,
  completed: 3,
};

function maxStatus(
  a: TopicReportEntry["status"],
  b: TopicReportEntry["status"],
): TopicReportEntry["status"] {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

function deriveStatusForTopic(topic: TopicReportEntry, todayItems: StudyPlanItem[]): TopicReportEntry["status"] {
  const topicName = normalizeText(topic.topicName);
  if (!topicName) return topic.status;

  const relatedItems = todayItems.filter((item) => {
    const contentTopic = normalizeText(item.content?.topicName);
    const title = normalizeText(item.title);
    return (
      !!contentTopic && (
        contentTopic === topicName ||
        contentTopic.includes(topicName) ||
        topicName.includes(contentTopic) ||
        isLikelySubtopicMatch(item.content?.topicName ?? "", topic.topicName)
      )
    ) || (!!title && title.includes(topicName));
  });

  const hasAnyDone = relatedItems.some((item) => item.status === "completed");
  const hasAnyPending = relatedItems.some((item) => item.status === "pending");

  if (topic.status === "completed") return "completed";

  if (hasAnyDone || hasAnyPending) {
    const allDone = relatedItems.every(item => item.status === "completed");
    return maxStatus(topic.status, allDone ? "completed" : "in_progress");
  }

  return topic.status || "unlocked";
}

function mergeRoadmapWithTodayPlan(report: ProgressReport, todayItems: StudyPlanItem[]): ProgressReport {
  const subjects = report.subjects.map((subject) => {
    const chapters = subject.chapters.map((chapter) => {
      const topics = chapter.topics.map((topic) => ({
        ...topic,
        status: deriveStatusForTopic(topic, todayItems),
      }));
      const topicsCompleted = topics.filter((topic) => topic.status === "completed").length;
      const topicsInProgress = topics.filter((topic) => topic.status === "in_progress").length;
      const lockedTopics = topics.filter((topic) => topic.status === "locked").length;
      const overallAccuracy = topics.length
        ? Math.round(topics.reduce((sum, topic) => sum + (topic.bestAccuracy ?? 0), 0) / topics.length)
        : 0;
      return {
        ...chapter,
        topics,
        topicsTotal: topics.length,
        topicsCompleted,
        overallAccuracy,
        _derivedInProgressTopics: topicsInProgress,
        _derivedLockedTopics: lockedTopics,
      };
    });

    const topicsTotal = chapters.reduce((sum, chapter) => sum + chapter.topicsTotal, 0);
    const topicsCompleted = chapters.reduce((sum, chapter) => sum + chapter.topicsCompleted, 0);
    const weightedAccuracySum = chapters.reduce((sum, chapter) => sum + chapter.overallAccuracy * chapter.topicsTotal, 0);
    const overallAccuracy = topicsTotal ? Math.round(weightedAccuracySum / topicsTotal) : 0;
    return {
      ...subject,
      chapters,
      topicsTotal,
      topicsCompleted,
      overallAccuracy,
    };
  });

  const totalTopics = subjects.reduce((sum, subject) => sum + subject.topicsTotal, 0);
  const completedTopics = subjects.reduce((sum, subject) => sum + subject.topicsCompleted, 0);
  const inProgressTopics = subjects.reduce(
    (sum, subject) =>
      sum + subject.chapters.reduce((chapterSum, chapter: any) => chapterSum + (chapter._derivedInProgressTopics ?? 0), 0),
    0,
  );
  const lockedTopics = subjects.reduce(
    (sum, subject) =>
      sum + subject.chapters.reduce((chapterSum, chapter: any) => chapterSum + (chapter._derivedLockedTopics ?? 0), 0),
    0,
  );

  return {
    ...report,
    subjects: subjects.map((subject) => ({
      ...subject,
      chapters: subject.chapters.map((chapter: any) => {
        const { _derivedInProgressTopics, _derivedLockedTopics, ...rest } = chapter;
        return rest;
      }),
    })),
    summary: {
      ...report.summary,
      totalTopics,
      completedTopics,
      inProgressTopics,
      lockedTopics,
    },
  };
}

function TopicLeaf({ topic, isLast, lineColor }: { topic: any; isLast: boolean; lineColor: string }) {
  const st = topicStatus(topic.status);

  const lectureDone = topic.lecture?.anyCompleted || (topic.lecture?.avgWatchPct ?? 0) > 80;
  const practiceDone = (topic.pyq?.attempted ?? 0) > 0 && (topic.pyq?.accuracy ?? 0) > 50;
  const aiDone = !!topic.aiSession?.completed;

  return (
    <div className="flex items-start group">
      <div className="relative flex flex-col items-center" style={{ width: 24, minWidth: 24 }}>
        {!isLast && (
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: lineColor, opacity: 0.35 }} />
        )}
        {isLast && (
          <div className="absolute left-1/2 top-0 w-px -translate-x-1/2" style={{ height: "50%", background: lineColor, opacity: 0.35 }} />
        )}
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 h-px" style={{ width: 12, background: lineColor, opacity: 0.35 }} />
      </div>

      <div className={`flex-1 flex items-center gap-3 py-2 px-3 ml-1 rounded-xl transition-all border border-transparent
        ${topic.status === "in_progress" ? "bg-amber-50/50 border-amber-100" : "hover:bg-slate-50"}`}>

        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${st.dot}`}>
          {topic.status === "completed" && <span className="text-[9px] text-white font-black">✓</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-sm font-semibold truncate leading-tight ${st.text}`}>{topic.topicName}</span>
            {topic.status === "in_progress" && (
              <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">Ongoing</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1.5" title="Lectures">
              <PlayCircle className={`w-3 h-3 ${lectureDone ? "text-emerald-500" : "text-slate-300"}`} />
              <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${lectureDone ? "bg-emerald-500" : "bg-blue-400"}`}
                  style={{ width: `${topic.lecture?.avgWatchPct ?? 0}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-1.5" title="Practice">
              <Zap className={`w-3 h-3 ${practiceDone ? "text-emerald-500" : "text-slate-300"}`} />
              <span className="text-[10px] font-medium text-slate-400">
                {topic.pyq?.attempted ?? 0} solved
              </span>
            </div>

            {topic.aiSession && (
              <div className="flex items-center gap-1.5" title="AI Session">
                <Brain className={`w-3 h-3 ${aiDone ? "text-emerald-500" : "text-slate-300"}`} />
              </div>
            )}
          </div>
        </div>

        {topic.bestAccuracy > 0 && (
          <div className="shrink-0 flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-medium">Accuracy</span>
            <span className="text-xs font-bold text-slate-700">{topic.bestAccuracy}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChapterNode({ chapter, cfg, isLast, parentLineColor }: {
  chapter: any;
  cfg: typeof SUBJECT_CFG[string];
  isLast: boolean;
  parentLineColor: string;
}) {
  const [open, setOpen] = useState(false);
  const topics: any[] = chapter.topics ?? [];
  const done  = topics.filter((t: any) => t.status === "completed").length;
  const total = chapter.topicsTotal ?? topics.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;

  return (
    <div className="flex items-start">
      <div className="relative flex flex-col items-center" style={{ width: 28, minWidth: 28 }}>
        {!isLast && (
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: parentLineColor, opacity: 0.3 }} />
        )}
        {isLast && (
          <div className="absolute left-1/2 top-0 w-px -translate-x-1/2" style={{ height: "50%", background: parentLineColor, opacity: 0.3 }} />
        )}
        <div className="absolute top-[18px] left-1/2 h-px -translate-y-1/2" style={{ width: 14, background: parentLineColor, opacity: 0.3 }} />
      </div>

      <div className="flex-1 min-w-0 mb-2">
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all
            ${open ? `${cfg.bg} ${cfg.border}` : "bg-white border-slate-200 hover:border-slate-300"}`}
        >
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${allDone ? "bg-emerald-500" : cfg.dot}`} />
          <span className="flex-1 text-sm font-semibold text-slate-800 truncate">{chapter.chapterName}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-400 font-medium">{done}/{total}</span>
            {total > 0 && (
              <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${allDone ? "bg-emerald-500" : cfg.dot}`} style={{ width: `${pct}%` }} />
              </div>
            )}
            {open
              ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </button>

        {open && topics.length > 0 && (
          <div className="mt-1 ml-5 pl-1 relative">
            <div className="absolute left-0 top-0 bottom-3 w-px" style={{ background: cfg.ring, opacity: 0.25 }} />
            {topics.map((t, idx) => (
              <TopicLeaf key={t.topicId} topic={t} isLast={idx === topics.length - 1} lineColor={cfg.ring} />
            ))}
          </div>
        )}
        {open && topics.length === 0 && (
          <p className="text-xs text-slate-400 pl-8 py-2">No topics available</p>
        )}
      </div>
    </div>
  );
}

function SubjectNode({ subject, index }: { subject: any; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const cfg = subjectCfg(subject.subjectName);
  const pct = subject.topicsTotal > 0 ? Math.round((subject.topicsCompleted / subject.topicsTotal) * 100) : 0;
  const chapters: any[] = subject.chapters ?? [];

  const subjectEmoji: Record<string, string> = {
    physics: "⚛️", chemistry: "🧪", mathematics: "📐", math: "📐", biology: "🌱",
  };
  const emoji = Object.entries(subjectEmoji).find(([k]) => subject.subjectName?.toLowerCase().includes(k))?.[1] ?? "📚";

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all shadow-sm
          ${open ? `${cfg.bg} ${cfg.border} shadow-md` : `bg-white ${cfg.border} hover:${cfg.bg}`}`}
      >
        <div className="relative shrink-0">
          <CircleProgress pct={pct} color={cfg.ring} size={48} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black text-slate-700">{pct}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <span className={`text-base font-black ${cfg.color}`}>{subject.subjectName}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden max-w-[120px]">
              <div className={`h-full ${cfg.dot} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-500">{subject.topicsCompleted}/{subject.topicsTotal} topics</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{chapters.length} chapters</span>
          </div>
        </div>

        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${cfg.bg}`}>
          {open
            ? <ChevronDown className={`w-4 h-4 ${cfg.color}`} />
            : <ChevronRight className={`w-4 h-4 ${cfg.color}`} />}
        </div>
      </button>

      {open && (
        <div className="mt-2 ml-6 pl-2 relative">
          <div className="absolute left-0 top-0 bottom-4 w-px" style={{ background: cfg.ring, opacity: 0.25 }} />
          {chapters.map((ch, idx) => (
            <ChapterNode
              key={ch.chapterId}
              chapter={ch}
              cfg={cfg}
              isLast={idx === chapters.length - 1}
              parentLineColor={cfg.ring}
            />
          ))}
          {chapters.length === 0 && (
            <p className="text-xs text-slate-400 py-3 pl-4">No chapters available</p>
          )}
        </div>
      )}
    </div>
  );
}

function CurriculumRoadmap({ reportOverride }: { reportOverride?: ProgressReport }) {
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const historyStart = format(subYears(new Date(), 5), "yyyy-MM-dd");
  const { data: groupedHistory = {} } = useWeeklyPlanGrouped(historyStart, todayKey);
  const { data: fetchedReport, isLoading, isError, refetch } = useProgressReport();
  const report = (reportOverride?.subjects?.length ?? 0) > 0 ? reportOverride : fetchedReport;
  if (!reportOverride && isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!report?.subjects?.length) return (
    <div className="text-center py-16 text-gray-400">
      <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium text-gray-500">
        {isError ? "Couldn't load your curriculum." : "Syllabus data is being prepared."}
      </p>
      <p className="text-xs text-gray-400 mt-1 mb-4">
        {isError
          ? "Check your connection and try again."
          : "Make sure you are enrolled in a course."}
      </p>
      <button onClick={() => refetch()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-xl border border-indigo-200 transition-colors">
        <RotateCcw className="w-3.5 h-3.5" /> Refresh
      </button>
    </div>
  );
  const datedEntries = Object.entries(groupedHistory)
    .filter(([, items]) => Array.isArray(items) && items.length > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const firstPlanDate = datedEntries[0]?.[0] ?? todayKey;

  const planHistory = Object.entries(groupedHistory)
    .filter(([date]) => date >= firstPlanDate)
    .filter(([date]) => date <= todayKey)
    .flatMap(([, items]) => items ?? []);

  const effectiveReport = mergeRoadmapWithTodayPlan(report, planHistory);
  const { summary } = effectiveReport;
  const overallPct = summary.totalTopics > 0 ? Math.round((summary.completedTopics / summary.totalTopics) * 100) : 0;
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Curriculum Progress</h3>
            <p className="text-indigo-200 text-sm">{summary.completedTopics}/{summary.totalTopics} topics completed</p>
          </div>
          <div className="relative">
            <CircleProgress pct={overallPct} color="rgba(255,255,255,0.9)" size={64} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{overallPct}%</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { val: summary.completedTopics, label: "Completed" },
            { val: summary.inProgressTopics, label: "Ongoing" },
            { val: (summary.unlockedTopics ?? 0) + (summary.lockedTopics ?? 0), label: "To Do" },
            { val: `${summary.overallAccuracy}%`, label: "Accuracy" },
          ].map(({ val, label }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
              <div className="text-white text-lg font-bold">{val}</div>
              <div className="text-indigo-200 text-[10px] uppercase tracking-wider font-semibold">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 px-1 flex-wrap">
        {[
          { dot: "bg-emerald-500", label: "Completed" },
          { dot: "bg-amber-400",   label: "In Progress" },
          { dot: "bg-blue-400",    label: "Unlocked" },
          { dot: "bg-slate-300",   label: "Locked" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
            {l.label}
          </div>
        ))}
      </div>

      <div>
        {effectiveReport.subjects.map((s, i) => (
          <SubjectNode key={s.subjectId} subject={s} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Plan Item Card ────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  lecture:       { icon: <PlayCircle className="w-4 h-4" />, color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  practice:      { icon: <Activity   className="w-4 h-4" />, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  revision:      { icon: <BookOpen   className="w-4 h-4" />, color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
  mock_test:     { icon: <Trophy     className="w-4 h-4" />, color: "text-red-600",    bg: "bg-red-50 border-red-200" },
  battle:        { icon: <Zap        className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  doubt_session: { icon: <Brain      className="w-4 h-4" />, color: "text-teal-600",   bg: "bg-teal-50 border-teal-200" },
};

function PlanItemCard({ item, onComplete, onSkip, onOpen, priority, hideReviewIfDone }: {
  item: StudyPlanItem;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onOpen: (item: StudyPlanItem) => void;
  priority?: TaskPriority;
  hideReviewIfDone?: boolean;
}) {
  const t       = TYPE_CFG[item.type] ?? TYPE_CFG.lecture;
  const isDone  = item.status === "completed";
  const isSkip  = item.status === "skipped";
  const cfg     = item.content?.subjectName ? subjectCfg(item.content.subjectName) : null;
  const pCfg    = priority ? PRIORITY_CFG[priority] : null;

  const showReview = (item.content?.notesUrl || item.content?.videoUrl || item.content?.topicId || item.refId) && (!hideReviewIfDone || (!isDone && !isSkip));

  return (
    <div
      onClick={() => { if (showReview) onOpen(item); }}
      className={`flex gap-2.5 p-2.5 rounded-lg border transition-all ${showReview ? "cursor-pointer" : ""}
      ${isDone ? "opacity-50 bg-gray-50 border-gray-200" : isSkip ? "opacity-35 bg-gray-50 border-gray-200" : "bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm"}`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center
        ${isDone ? "bg-emerald-50 border-emerald-200 text-emerald-600" : `${t.bg} ${t.color}`}`}>
        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : t.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-sm text-gray-900 leading-tight truncate">{item.title}</div>
          <div className="flex items-center gap-1 shrink-0">
            {pCfg && !isDone && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pCfg.cls}`}>{pCfg.label}</span>
            )}
            {item.xpReward && !isDone && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">+{item.xpReward}XP</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {cfg && item.content?.subjectName && (
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium border ${cfg.border}`}>{item.content.subjectName}</span>
          )}
          <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />{item.estimatedMinutes}m
          </span>
          {item.content?.topicName && <span className="text-[11px] text-gray-400 truncate">{item.content.topicName}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {showReview && (
          <button onClick={(e) => { e.stopPropagation(); onOpen(item); }}
            className={`px-2 py-1 rounded-lg transition-colors text-xs font-medium ${isDone || isSkip ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200" : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"}`}>
            {isDone || isSkip ? "Review" : "Open"}
          </button>
        )}
        {!isDone && !isSkip && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onSkip(item.id); }}
              className="px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs">
              Skip
            </button>
            <button onClick={(e) => { e.stopPropagation(); onComplete(item.id); }}
              className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Practice History Review Card ─────────────────────────────────────────────

function PracticeHistoryReviewCard({ session }: { 
  session: studentApi.AiStudySessionData;
}) {
  const [expanded, setExpanded] = useState(false);
  const questions = session.practiceQuestions ?? [];
  const cfg = session.subjectName ? subjectCfg(session.subjectName) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:border-indigo-200">
      <div className="p-3 flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
          <Activity className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">{session.topicName}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
             {cfg && session.subjectName && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium border ${cfg.border}`}>{session.subjectName}</span>
             )}
             <span className="text-[10px] text-gray-400">
               {session.completedAt ? format(new Date(session.completedAt), "MMM d") : "Recent"}
             </span>
          </div>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
        >
          {expanded ? "Hide Details" : "Review Questions"}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">No practice questions saved for this session.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const opts = q.options || q.choices || [];
              return (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3.5 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center border border-indigo-100">Q{idx+1}</span>
                    <p className="text-sm font-semibold text-gray-900 leading-relaxed">{q.question}</p>
                  </div>
                  
                  {opts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
                      {opts.map((opt, oIdx) => {
                         const label = typeof opt === 'string' ? String.fromCharCode(65 + oIdx) : (opt as any).optionLabel || String.fromCharCode(65 + oIdx);
                         const content = typeof opt === 'string' ? opt : (opt as any).content || (opt as any).text || "";
                         return (
                           <div key={oIdx} className="p-2 rounded-lg border border-gray-100 bg-gray-50 text-xs text-gray-700">
                             <span className="font-bold mr-1.5">{label}.</span> {content}
                           </div>
                         );
                      })}
                    </div>
                  )}

                  <div className="ml-9 space-y-2">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Correct Answer</p>
                      <p className="text-xs font-medium text-emerald-900">{q.answer}</p>
                    </div>
                    {q.explanation && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Explanation</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Note History Review Card ─────────────────────────────────────────────────

function NoteHistoryReviewCard({ session, onNavigate }: { 
  session: studentApi.AiStudySessionData;
  onNavigate: (topicId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hlCount = session.highlights?.length ?? 0;
  const cmCount = session.inlineComments?.length ?? 0;
  const dbCount = session.conversation?.filter((m: any) => m.role === 'student').length ?? 0;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:border-indigo-200">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{session.topicName}</p>
            <div className="flex items-center flex-wrap gap-2 mt-0.5">
              <p className="text-[10px] text-gray-400">
                {session.completedAt ? format(new Date(session.completedAt), "MMM d") : "Recent"} · {Math.round((session.timeSpentSeconds || 0) / 60)}m
              </p>
              {(hlCount > 0 || cmCount > 0 || dbCount > 0) && (
                <div className="flex items-center gap-1.5 ml-1">
                  {hlCount > 0 && <span className="text-[9px] font-medium bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" /> {hlCount}</span>}
                  {cmCount > 0 && <span className="text-[9px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" /> {cmCount}</span>}
                  {dbCount > 0 && <span className="text-[9px] font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 flex items-center gap-0.5"><Brain className="w-2.5 h-2.5" /> {dbCount}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           {(hlCount > 0 || cmCount > 0 || dbCount > 0) && (
             <button 
               onClick={() => setExpanded(!expanded)}
               className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-all border border-indigo-100"
             >
               {expanded ? "Hide Details" : "View Details"}
             </button>
           )}
           <button
             onClick={() => onNavigate(session.topicId)}
             className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-all"
           >
             Full Notes
           </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
          {cmCount > 0 && (
            <div className="space-y-2">
               <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1 px-1">Your Comments</p>
               {session.inlineComments?.map((cm, idx) => (
                 <div key={cm.id || idx} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 italic mb-1.5">"{cm.quote}"</p>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">{cm.text}</p>
                 </div>
               ))}
            </div>
          )}
          
          {dbCount > 0 && (
            <div className="space-y-2">
               <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1 px-1">AI Doubts & Chat</p>
               <div className="space-y-2 bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                  {session.conversation?.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[90%] p-2 rounded-lg text-xs ${msg.role === 'student' ? 'bg-purple-50 text-purple-900 border border-purple-100' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                          <p className="leading-relaxed">{msg.message}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {hlCount > 0 && (
             <div className="space-y-2">
                <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-1 px-1">Key Highlights</p>
                <div className="flex flex-wrap gap-2">
                   {session.highlights?.map((hl, idx) => (
                     <div key={idx} className="bg-yellow-100/50 px-3 py-2 rounded-lg border border-yellow-200 text-xs text-gray-800 font-medium shadow-sm">
                        {hl.text}
                     </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Micro Goals Card ──────────────────────────────────────────────────────────

type MicroGoal = { id: string; icon: string; text: string; sub: string; url: string };

function MicroGoalsCard({ weakTopics, revisionTopics, pendingPYQTopics, highNegativeTopics }: {
  weakTopics:         Array<{ topicId: string; topicName: string; subjectName: string; accuracy: number }>;
  revisionTopics:     Array<{ topicId: string; topicName: string; subjectName: string; isOverdue: boolean }>;
  pendingPYQTopics:   Array<{ topicId: string; topicName: string; subjectName: string }>;
  highNegativeTopics: Array<{ topicId: string; topicName: string; subjectName: string; wrong: number; attempted: number }>;
}) {
  const navigate  = useNavigate();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setChecked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const goals: MicroGoal[] = [];

  revisionTopics.filter(t => t.isOverdue).slice(0, 2).forEach(t =>
    goals.push({ id: `rev-${t.topicId}`, icon: "🔁", text: `Revise ${t.topicName}`, sub: `${t.subjectName} · Overdue`, url: "/school/student/study-materials" })
  );
  weakTopics.slice(0, 2).forEach(t =>
    goals.push({ id: `wk-${t.topicId}`, icon: "⚡", text: `Solve 10 ${t.topicName} questions`, sub: `${t.subjectName} · ${t.accuracy}% accuracy`, url: "/school/student/assessments" })
  );
  highNegativeTopics.slice(0, 1).forEach(t =>
    goals.push({ id: `neg-${t.topicId}`, icon: "🎯", text: `Redo ${t.topicName} PYQ`, sub: `${t.subjectName} · ${t.wrong}/${t.attempted} wrong`, url: "/school/student/assessments" })
  );
  pendingPYQTopics.slice(0, 2).forEach(t =>
    goals.push({ id: `pyq-${t.topicId}`, icon: "📋", text: `Attempt ${t.topicName} PYQ`, sub: `${t.subjectName} · Not attempted`, url: "/school/student/assessments" })
  );

  const display   = goals.slice(0, 5);
  const doneCount = display.filter(g => checked.has(g.id)).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-100">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-amber-700 flex-1">Micro Goals</h3>
        {display.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600 font-medium">{doneCount}/{display.length}</span>
            <div className="w-14 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${display.length > 0 ? (doneCount / display.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>
      {display.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <Trophy className="w-7 h-7 text-amber-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Complete more topics to unlock personalised micro goals.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {display.map(g => {
            const done = checked.has(g.id);
            return (
              <div key={g.id} className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${done ? "bg-gray-50" : "hover:bg-amber-50/30"}`}>
                <button onClick={() => toggle(g.id)}
                  className={`shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                    ${done ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-amber-400"}`}>
                  {done && <CheckCheck className="w-2.5 h-2.5 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={() => !done && navigate(g.url)}
                    className={`text-xs font-medium text-left leading-snug ${done ? "line-through text-gray-400" : "text-gray-800 hover:text-indigo-600"}`}>
                    {g.icon} {g.text}
                  </button>
                  <div className="text-[10px] text-gray-400 mt-0.5">{g.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Smart Reminders Card ──────────────────────────────────────────────────────

function SmartRemindersCard({ revisionTopics, weeklyActivity, pendingMockTests, forgottenConcepts, weakTopics, pendingPYQTopics, onTabChange, onBacklogPageChange, selectedCourseId }: {
  revisionTopics:      Array<{ isOverdue: boolean }>;
  weeklyActivity:      DailyActivity[];
  pendingMockTests:    Array<{ id: string; title: string }>;
  forgottenConcepts:   Array<{ topicId: string }>;
  weakTopics:          Array<{ topicId: string }>;
  pendingPYQTopics:    Array<{ topicId: string }>;
  onTabChange:         (tab: ActiveTab) => void;
  onBacklogPageChange: (page: "pyq") => void;
  selectedCourseId:    string | null;
}) {
  const navigate    = useNavigate();
  const overdueCount = revisionTopics.filter(t => t.isOverdue).length;
  const activeDays   = weeklyActivity.filter(d => d.minutesStudied > 0).length;

  type Sev = "high" | "medium" | "info";
  const reminders: Array<{ id: string; icon: string; text: string; sev: Sev; action?: { label: string; fn: () => void } }> = [];

  if (overdueCount > 0)
    reminders.push({ id: "overdue", icon: "⚠️", sev: "high",
      text: `${overdueCount} topic${overdueCount > 1 ? "s" : ""} overdue for revision`,
      action: { label: "Revise now →", fn: () => onTabChange("revision") } });

  if (activeDays < 3)
    reminders.push({ id: "inactive", icon: "📉", sev: activeDays === 0 ? "high" : "medium",
      text: `Only ${activeDays} active day${activeDays !== 1 ? "s" : ""} this week — streak at risk`,
      action: { label: "Study today →", fn: () => onTabChange("today") } });

  if (pendingMockTests.length > 0)
    reminders.push({ id: "mock", icon: "📝", sev: "info",
      text: `${pendingMockTests.length} mock test${pendingMockTests.length > 1 ? "s" : ""} available`,
      action: { label: "Take now →", fn: () => navigate("/school/student/assessments") } });

  if (forgottenConcepts.length > 3)
    reminders.push({ id: "forgotten", icon: "🔁", sev: "medium",
      text: `${forgottenConcepts.length} concepts not revisited in 14+ days`,
      action: { label: "View →", fn: () => onTabChange("revision") } });

  if (weakTopics.length > 5)
    reminders.push({ id: "weak", icon: "⚡", sev: "medium",
      text: `${weakTopics.length} weak topics need practice`,
      action: { label: "Practice →", fn: () => onTabChange("weakness") } });

  if (pendingPYQTopics.length > 0)
    reminders.push({ id: "pyq", icon: "📋", sev: "info",
      text: `${pendingPYQTopics.length} topics with no PYQ attempts yet`,
      action: { label: "Go to Backlogs →", fn: () => { onTabChange("backlogs"); onBacklogPageChange("pyq"); } } });

  const ORDER: Record<Sev, number> = { high: 0, medium: 1, info: 2 };
  reminders.sort((a, b) => ORDER[a.sev] - ORDER[b.sev]);
  const display = reminders.slice(0, 4);

  const urgentCount = display.filter(r => r.sev === "high").length;

  const SEV: Record<Sev, { row: string; text: string }> = {
    high:   { row: "bg-red-50/60",   text: "text-red-700" },
    medium: { row: "bg-amber-50/40", text: "text-amber-700" },
    info:   { row: "",               text: "text-gray-700" },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <Bell className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-indigo-700 flex-1">Smart Reminders</h3>
        {urgentCount > 0 && (
          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full border border-red-200">
            {urgentCount} urgent
          </span>
        )}
      </div>
      {display.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400">All caught up — no urgent reminders!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {display.map(r => (
            <div key={r.id}
              onClick={r.action ? r.action.fn : undefined}
              className={`px-4 py-2.5 ${SEV[r.sev].row} ${r.action ? "cursor-pointer hover:brightness-95 transition-all" : ""}`}>
              <div className="flex items-start gap-2">
                <span className="text-sm shrink-0 mt-px">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium leading-snug block ${SEV[r.sev].text}`}>{r.text}</span>
                  {r.action && (
                    <span className="mt-0.5 text-[11px] font-semibold text-indigo-500 flex items-center gap-0.5">
                      {r.action.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Sarthi Card ────────────────────────────────────────────────────────────

function metricColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}
function metricBg(score: number): string {
  if (score >= 70) return "bg-emerald-50";
  if (score >= 40) return "bg-amber-50";
  return "bg-red-50";
}

function AISarthiCard({ todayItems, streak, xpPoints, progressReport, weeklyActivity, sessions, weakTopicsCount, revisionTopicsCount, forgottenCount }: {
  todayItems:        StudyPlanItem[];
  streak:            number;
  xpPoints:          number;
  progressReport?:   ProgressReport;
  weeklyActivity:    DailyActivity[];
  sessions:          TestSession[];
  weakTopicsCount:   number;
  revisionTopicsCount: number;
  forgottenCount:    number;
}) {
  // ── Syllabus completion ──────────────────────────────────────────────────────
  const syllabusTotal     = progressReport?.summary.totalTopics     ?? 0;
  const syllabusCompleted = progressReport?.summary.completedTopics ?? 0;
  const syllabusPct = syllabusTotal > 0 ? Math.round((syllabusCompleted / syllabusTotal) * 100) : 0;

  // ── Consistency (active days / 7) ────────────────────────────────────────────
  const daysActive        = weeklyActivity.filter(d => d.minutesStudied > 0).length;
  const consistencyScore  = Math.round((daysActive / 7) * 100);

  // ── Test readiness (avg accuracy from last 5 submitted sessions) ─────────────
  const doneSessions = sessions.filter(
    s => ["submitted", "completed", "auto_submitted"].includes(s.status)
      && ((s.correctCount ?? 0) + (s.wrongCount ?? 0)) > 0
  );
  const testReadiness = doneSessions.length > 0
    ? Math.round(
        doneSessions.slice(-5).reduce((sum, s) => {
          const tot = (s.correctCount ?? 0) + (s.wrongCount ?? 0);
          return sum + (tot > 0 ? ((s.correctCount ?? 0) / tot) * 100 : 0);
        }, 0) / Math.min(doneSessions.length, 5)
      )
    : 0;

  // ── Focus hours this week ────────────────────────────────────────────────────
  const focusHours = Math.round(weeklyActivity.reduce((s, d) => s + d.minutesStudied, 0) / 60 * 10) / 10;

  // ── Revision health ──────────────────────────────────────────────────────────
  const overdueCount = revisionTopicsCount + forgottenCount;
  const revisionHealth = syllabusCompleted > 0
    ? Math.max(0, Math.round(100 - (overdueCount / syllabusCompleted) * 100))
    : 100;

  // ── Lecture vs question imbalance ────────────────────────────────────────────
  const allTopics = progressReport?.subjects.flatMap(s => s.chapters.flatMap(c => c.topics)) ?? [];
  const lectureNoQ = allTopics.filter(t => t.lecture?.anyCompleted && (t.pyq?.attempted ?? 0) === 0).length;
  const lectureImbalance = allTopics.length > 0 && lectureNoQ / allTopics.length >= 0.35;

  // ── Consistency trend (first 3 days vs last 4 days of week) ──────────────────
  const firstHalf  = weeklyActivity.slice(0, 3).reduce((s, d) => s + d.minutesStudied, 0);
  const secondHalf = weeklyActivity.slice(3).reduce( (s, d) => s + d.minutesStudied, 0);
  const consistencyDropped = firstHalf > 30 && secondHalf < firstHalf * 0.55;

  // ── Best performance time from session timestamps ────────────────────────────
  let bestTimeInsight: string | null = null;
  if (doneSessions.length >= 3) {
    const byHour: Record<number, { total: number; count: number }> = {};
    doneSessions.forEach(s => {
      const h   = new Date(s.startedAt).getHours();
      const tot = (s.correctCount ?? 0) + (s.wrongCount ?? 0);
      const acc = tot > 0 ? ((s.correctCount ?? 0) / tot) * 100 : 0;
      byHour[h] ??= { total: 0, count: 0 };
      byHour[h].total += acc;
      byHour[h].count += 1;
    });
    let bestH = -1, bestAvg = 0;
    Object.entries(byHour).forEach(([h, { total, count }]) => {
      if (count >= 2 && total / count > bestAvg) { bestAvg = total / count; bestH = +h; }
    });
    if (bestH >= 0) {
      const fmt = (h: number) => h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
      bestTimeInsight = `You perform best between ${fmt(bestH)}–${fmt(bestH + 2)}.`;
    }
  }

  // ── Build personalised insights ───────────────────────────────────────────────
  type InsightSeverity = "warning" | "success" | "info";
  const insights: { icon: string; text: string; sev: InsightSeverity }[] = [];

  if (consistencyDropped)
    insights.push({ icon: "📉", text: "Your consistency dropped this week.", sev: "warning" });
  if (lectureImbalance)
    insights.push({ icon: "📺", text: "You are spending too much time watching lectures vs solving questions.", sev: "warning" });
  if (overdueCount > 5 || (syllabusCompleted > 0 && overdueCount / syllabusCompleted > 0.3))
    insights.push({ icon: "🔁", text: "Your revision gap is too high. Schedule revision sessions.", sev: "warning" });
  if (testReadiness > 0 && testReadiness < 50)
    insights.push({ icon: "📝", text: "Mock test accuracy is below 50%. Increase practice question frequency.", sev: "warning" });
  if (weakTopicsCount >= 5)
    insights.push({ icon: "⚠️", text: `${weakTopicsCount} weak topics need focused practice this week.`, sev: "warning" });
  if (bestTimeInsight)
    insights.push({ icon: "⏰", text: bestTimeInsight, sev: "info" });
  if (streak >= 7)
    insights.push({ icon: "🔥", text: `${streak}-day streak! You're building an unbreakable habit.`, sev: "success" });
  if (syllabusPct >= 80)
    insights.push({ icon: "🚀", text: "Syllabus almost complete — start full-length mock tests now.", sev: "success" });
  if (testReadiness >= 75)
    insights.push({ icon: "💪", text: "Excellent test accuracy — keep the momentum.", sev: "success" });
  if (insights.length === 0 && syllabusPct === 0)
    insights.push({ icon: "✨", text: "Complete more study sessions to unlock personalised insights.", sev: "info" });
  if (insights.length === 0)
    insights.push({ icon: "📚", text: "You're on track. Keep completing tasks consistently.", sev: "info" });

  // Sort: warnings first, then info, then success
  const ORDER: Record<InsightSeverity, number> = { warning: 0, info: 1, success: 2 };
  insights.sort((a, b) => ORDER[a.sev] - ORDER[b.sev]);

  const SEV_STYLE: Record<InsightSeverity, string> = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    info:    "bg-indigo-50 border-indigo-200 text-indigo-800",
  };

  const METRICS = [
    { label: "Syllabus",    value: `${syllabusPct}%`,          score: syllabusPct,      icon: "📚" },
    { label: "Consistency", value: `${streak} day streak`,      score: Math.min(100, streak * 14), icon: "🔥" },
    { label: "Test Ready",  value: doneSessions.length > 0 ? `${testReadiness}%` : "—", score: testReadiness, icon: "📝" },
    { label: "XP Points",   value: xpPoints.toLocaleString(),   score: -1,               icon: "⭐" },
    { label: "Rev. Health", value: `${revisionHealth}%`,        score: revisionHealth,   icon: "🔁" },
    { label: "Weak Topics", value: String(weakTopicsCount),     score: weakTopicsCount === 0 ? 100 : weakTopicsCount > 10 ? 10 : 50, icon: "⚡" },
  ];

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center gap-2">
        <Brain className="w-4 h-4 text-white" />
        <span className="text-sm font-bold text-white">AI Sarthi</span>
        <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
          Personalised
        </span>
      </div>

      {/* 6 metric tiles */}
      <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 border-b border-gray-100">
        {METRICS.map(m => (
          <div key={m.label} className={`px-2 py-2.5 text-center ${m.score >= 0 ? metricBg(m.score) : "bg-slate-50"}`}>
            <div className="text-base mb-0.5">{m.icon}</div>
            <div className={`text-sm font-bold leading-none ${m.score >= 0 ? metricColor(m.score) : "text-slate-600"}`}>
              {m.value}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Personalised insights */}
      <div className="p-3 space-y-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Insights</p>
        {insights.slice(0, 3).map((ins, i) => (
          <div key={i} className={`flex gap-2 items-start text-xs px-2.5 py-2 rounded-lg border ${SEV_STYLE[ins.sev]} leading-snug`}>
            <span className="shrink-0 text-sm">{ins.icon}</span>
            <span className="font-medium">{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Backlog Section Wrapper ───────────────────────────────────────────────────

type AccentColor = "red" | "blue" | "amber" | "violet" | "teal" | "indigo" | "rose";

const ACCENT: Record<AccentColor, { header: string; badge: string; border: string }> = {
  red:    { header: "bg-red-50",    badge: "bg-red-100 text-red-700",       border: "border-red-200"    },
  blue:   { header: "bg-blue-50",   badge: "bg-blue-100 text-blue-700",     border: "border-blue-200"   },
  amber:  { header: "bg-amber-50",  badge: "bg-amber-100 text-amber-700",   border: "border-amber-200"  },
  violet: { header: "bg-violet-50", badge: "bg-violet-100 text-violet-700", border: "border-violet-200" },
  teal:   { header: "bg-teal-50",   badge: "bg-teal-100 text-teal-700",     border: "border-teal-200"   },
  indigo: { header: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-200" },
  rose:   { header: "bg-rose-50",   badge: "bg-rose-100 text-rose-700",     border: "border-rose-200"   },
};

function BacklogSection({ icon, title, count, accentColor, defaultOpen = true, children }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  accentColor: AccentColor;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);
  const ac = ACCENT[accentColor];
  return (
    <div className={`rounded-2xl border-2 ${ac.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${ac.header}`}>
        <span className="text-gray-600">{icon}</span>
        <span className="font-bold text-sm text-gray-900 flex-1">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ac.badge}`}>{count}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="bg-white p-3 space-y-2">{children}</div>}
    </div>
  );
}

// ─── Revision Note Prompts ────────────────────────────────────────────────────

const NOTE_PROMPTS: Record<string, string> = {
  physics:     "Formulas:\n\nUnits & Dimensions:\n\nKey Laws / Concepts:\n\nCommon Mistakes:",
  chemistry:   "Reactions / Equations:\n\nException Cases:\n\nKey Definitions:\n\nMemory Tips:",
  mathematics: "Formulas:\n\nTheorems:\n\nSolving Steps:\n\nCommon Mistakes:",
  biology:     "Key Terms:\n\nDiagrams to Draw:\n\nProcesses / Cycles:\n\nClassifications:",
};
function notePlaceholder(subject: string): string {
  const key = Object.keys(NOTE_PROMPTS).find(k => subject.toLowerCase().includes(k));
  return key ? NOTE_PROMPTS[key] : "Key Concepts:\n\nFormulas / Definitions:\n\nCommon Mistakes:";
}

// ─── Revision Topic Card ──────────────────────────────────────────────────────

type RevisionTopicItem = {
  topicId: string; topicName: string; subjectName: string; chapterName: string;
  accuracy: number; completedAt: string | null; learnedOn: string;
  nextRevisionDate: Date; nextRevisionLabel: string;
  intervalDays: 1 | 3 | 7 | 21; isOverdue: boolean;
};

function RevisionTopicCard({ topic, isNoteOpen, noteText, onToggleNote, onNoteChange, onRevise, onFullNotes }: {
  topic:        RevisionTopicItem;
  isNoteOpen:   boolean;
  noteText:     string;
  onToggleNote: () => void;
  onNoteChange: (v: string) => void;
  onRevise:     () => void;
  onFullNotes:  () => void;
}) {
  const cfg = subjectCfg(topic.subjectName);
  const accColor = topic.accuracy < 40 ? "text-red-600 bg-red-50 border-red-200"
    : topic.accuracy < 55 ? "text-orange-500 bg-orange-50 border-orange-200"
    : topic.accuracy < 65 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-teal-600 bg-teal-50 border-teal-200";

  return (
    <div className={`bg-white rounded-xl border-2 overflow-hidden transition-all
      ${topic.isOverdue ? "border-red-200" : "border-gray-200 hover:border-teal-200"}`}>
      <div className="p-3.5 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 truncate">{topic.topicName}</span>
            {topic.isOverdue && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 shrink-0">
                OVERDUE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap text-xs">
            <span className={`px-1.5 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {topic.subjectName}
            </span>
            <span className="text-gray-400 truncate">{topic.chapterName}</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
            <span>📅 Learned <strong className="text-gray-700">{topic.learnedOn}</strong></span>
            <span className={`font-semibold ${topic.isOverdue ? "text-red-600" : "text-teal-600"}`}>
              → {topic.isOverdue ? "Overdue" : `Revise ${topic.nextRevisionLabel}`}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${accColor}`}>{topic.accuracy}%</span>
          <div className="flex gap-1">
            <button onClick={onRevise}
              className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-semibold hover:bg-teal-700 flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5" /> Revise
            </button>
            <button onClick={onToggleNote}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors
                ${isNoteOpen ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-600"}`}>
              <FileText className="w-2.5 h-2.5" /> Notes
            </button>
          </div>
        </div>
      </div>

      {/* Inline Notes Panel */}
      {isNoteOpen && (
        <div className="border-t border-violet-100 bg-violet-50/60 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3 h-3 text-violet-600" />
            <span className="text-[11px] font-semibold text-violet-700">Revision Notes — {topic.topicName}</span>
          </div>
          <textarea
            value={noteText}
            onChange={e => onNoteChange(e.target.value)}
            placeholder={notePlaceholder(topic.subjectName)}
            rows={5}
            className="w-full text-xs text-gray-700 border border-violet-200 rounded-lg p-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white placeholder:text-gray-400 font-mono leading-relaxed"
          />
          <button onClick={onFullNotes}
            className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 flex items-center justify-center gap-1.5">
            <Brain className="w-3 h-3" /> Generate Full AI Notes
          </button>
        </div>
      )}
    </div>
  );
}

function groupBacklogItems<T>(
  items: T[],
  mapper: (item: T) => { subject: string; chapter: string }
) {
  const grouped: Record<string, Record<string, T[]>> = {};
  items.forEach(item => {
    const { subject, chapter } = mapper(item);
    const subKey = subject || "Other";
    const chapKey = chapter || "General";
    if (!grouped[subKey]) grouped[subKey] = {};
    if (!grouped[subKey][chapKey]) grouped[subKey][chapKey] = [];
    grouped[subKey][chapKey].push(item);
  });
  return grouped;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ActiveTab = "today" | "backlogs" | "weakness" | "revision" | "roadmap";

export default function SchoolStudentStudyPlanner() {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useStudentMe();

  const student = useMemo(() => {
    if (!me) return null;
    return {
      examTarget: me.targetExam,
      examYear: me.examYear,
      dailyStudyHours: 4,
      streakDays: me.currentStreak,
      xpPoints: me.xpTotal,
      currentClass: me.currentClass,
    };
  }, [me]);

  const today     = format(new Date(), "yyyy-MM-dd");
  const backlogStart = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const yesterday  = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const weekEnd    = format(addDays(new Date(), 6), "yyyy-MM-dd");

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("edva_selected_course_id");
    return null;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("edva_active_tab") as ActiveTab) || "today";
    return "today";
  });



  useEffect(() => {
    if (selectedCourseId) localStorage.setItem("edva_selected_course_id", selectedCourseId);
    else localStorage.removeItem("edva_selected_course_id");
  }, [selectedCourseId]);

  useEffect(() => {
    localStorage.setItem("edva_active_tab", activeTab);
  }, [activeTab]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [todayView,       setTodayView]       = useState<"today" | "week">("today");
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>("");
  const [backlogPage, setBacklogPage] = useState<null|"plan"|"lectures"|"notes"|"pyq"|"dpp"|"mindmaps"|"mocktests">(null);
  const [weakPage,    setWeakPage]    = useState<null|"chapters"|"topics"|"forgotten"|"negative">(null);
  const [revisionCategory, setRevisionCategory] = useState<null|"spaced"|"intensive"|"notes"|"practice">(null);
  const [revisionPage, setRevisionPage] = useState<null|"schedule"|"table"|"aiplan">(null);
  const [openNoteIds,     setOpenNoteIds]     = useState<Set<string>>(new Set());
  const [revisionNotes,   setRevisionNotes]   = useState<Record<string, string>>({});
  const [openRevBuckets,  setOpenRevBuckets]  = useState<Set<number>>(new Set([1, 3, 7, 21]));
  const [revisionModal, setRevisionModal] = useState<null | {
    topicId: string; topicName: string; subjectName: string;
    accuracy: number; intervalDays: 1 | 3 | 7 | 21;
  }>(null);

  const toggleNote = (id: string) =>
    setOpenNoteIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleRevBucket = (interval: number) =>
    setOpenRevBuckets(prev => { const n = new Set(prev); n.has(interval) ? n.delete(interval) : n.add(interval); return n; });

  const { data: rawTodayItems = [], isLoading: todayPlanLoading } = useTodaysPlan(selectedCourseId ?? undefined);
  const { data: rawBacklogWeekData = {} }                    = useWeeklyPlanGrouped(backlogStart, yesterday, selectedCourseId ?? undefined);
  const { data: rawWeekPlanData = {} }                       = useWeeklyPlanGrouped(today, weekEnd, selectedCourseId ?? undefined);
  const { data: progressReport }                             = useProgressReport(selectedCourseId ?? undefined);

  // For the full backlogs tab
  const { data: myCourses = [], isLoading: myCoursesLoading } = useMyCourses();

  useEffect(() => {
    if (myCourses.length > 0) {
      if (!selectedCourseId || !myCourses.some(c => c.id === selectedCourseId)) {
        setSelectedCourseId(myCourses[0].id);
      }
    }
  }, [myCourses, selectedCourseId]);
  const { data: allLectures = [] }       = useAllBatchLectures();
  const { data: mockTests = [] }         = useMockTests({ isPublished: true });
  const { data: sessions = [] }          = useStudentSessions();
  const { data: weeklyActivity = [] }    = useWeeklyActivity();
  const { data: aiStudyHistory = [] }     = useAiStudyHistory();
  const { data: spacedRevisionData = [] }   = useRevisionSpaced(selectedCourseId ?? undefined);
  const { data: backendNotes = [] }         = useRevisionNotes(selectedCourseId ?? undefined);
  const { data: backendPractice = [] }      = usePracticeHistory(selectedCourseId ?? undefined);
  const completedHistoryTopicIds = useMemo(() =>
    new Set(aiStudyHistory.filter(s => s.isCompleted).map(s => s.topicId)),
    [aiStudyHistory]
  );

  // Single class curriculum (for school flow)
  const { data: selectedCurriculum, isLoading: isCurriculumLoading } = useCourseCurriculum(selectedCourseId ?? undefined);
  const planLoading = todayPlanLoading || isCurriculumLoading;

  const generate   = useGeneratePlan();
  const regenerate = useRegeneratePlan();
  const clearPlan  = useClearPlan();
  const complete   = useCompletePlanItem(selectedCourseId ?? undefined);
  const skip       = useSkipPlanItem(selectedCourseId ?? undefined);

  const selectedCourse = useMemo(() => myCourses.find(c => c.id === selectedCourseId) ?? null, [myCourses, selectedCourseId]);

  // Exam name pill is fixed to the selected course's exam target/year.
  // "Days left" uses the student profile year so students always see their personal countdown.
  const courseExamTarget = selectedCourse?.examTarget ?? student?.examTarget;
  const courseExamYear   = selectedCourse?.examYear   ?? student?.examYear;
  const days    = countdownDays(student?.examYear);

  // Synthesize a ProgressReport from class curriculum data when the real report has no subjects.
  const effectiveProgressReport = useMemo((): ProgressReport | undefined => {
    if ((progressReport?.subjects?.length ?? 0) > 0) {
      return progressReport;
    }
    if (!selectedCurriculum?.subjects?.length) return progressReport;
    const subjects: SubjectReportEntry[] = selectedCurriculum.subjects.map(s => {
      const chapters: ChapterReportEntry[] = s.chapters.map(ch => {
        const topics: TopicReportEntry[] = ch.topics.map(t => ({
          topicId:            t.id,
          topicName:          t.name,
          status:             t.status,
          bestAccuracy:       t.bestAccuracy ?? 0,
          attemptCount:       0,
          gatePassPercentage: t.gatePassPercentage ?? 70,
          completedAt:        t.completedAt ?? null,
          lecture: t.lectures?.total > 0
            ? { avgWatchPct: (t.lectures.completed / t.lectures.total) * 100, anyCompleted: t.lectures.completed > 0 }
            : null,
          pyq:       null,
          aiSession: null,
        }));
        const completedCount   = topics.filter(t => t.status === "completed").length;
        return {
          chapterId:       ch.id,
          chapterName:     ch.name,
          topicsTotal:     topics.length,
          topicsCompleted: completedCount,
          overallAccuracy: topics.reduce((s, t) => s + t.bestAccuracy, 0) / Math.max(topics.length, 1),
          topics,
        };
      });
      const totalTopics     = chapters.reduce((s, c) => s + c.topicsTotal, 0);
      const completedTopics = chapters.reduce((s, c) => s + c.topicsCompleted, 0);
      return {
        subjectId:       s.id,
        subjectName:     s.name,
        examTarget:      s.examTarget ?? null,
        colorCode:       s.colorCode  ?? null,
        topicsTotal:     totalTopics,
        topicsCompleted: completedTopics,
        overallAccuracy: chapters.reduce((s, c) => s + c.overallAccuracy * c.topicsTotal, 0) / Math.max(totalTopics, 1),
        chapters,
      };
    });
    const totalTopics     = subjects.reduce((s, sub) => s + sub.topicsTotal,     0);
    const completedTopics = subjects.reduce((s, sub) => s + sub.topicsCompleted, 0);
    const allTopics       = subjects.flatMap(sub => sub.chapters.flatMap(c => c.topics));
    return {
      studentId: progressReport?.studentId ?? "",
      subjects,
      summary: {
        totalTopics,
        completedTopics,
        inProgressTopics:    allTopics.filter(t => t.status === "in_progress").length,
        unlockedTopics:      allTopics.filter(t => t.status === "unlocked").length,
        lockedTopics:        allTopics.filter(t => t.status === "locked").length,
        overallAccuracy:     Math.round(allTopics.reduce((s, t) => s + t.bestAccuracy, 0) / Math.max(allTopics.length, 1)),
        totalPYQAttempted:   0,
        pyqAccuracy:         0,
        lecturesCompleted:   allTopics.filter(t => t.lecture?.anyCompleted).length,
      },
    };
  }, [progressReport, selectedCurriculum]);

  const activeCourseTopicIds = useMemo(() => {
    const ids = new Set<string>();
    selectedCurriculum?.subjects?.forEach(s =>
      s.chapters.forEach(c => c.topics.forEach(t => ids.add(t.id)))
    );
    return ids;
  }, [selectedCurriculum]);

  const selectedCourseTopicIds = activeCourseTopicIds;

  const isSyllabusComplete = useMemo(() => {
    const total     = effectiveProgressReport?.summary?.totalTopics ?? 0;
    const completed = effectiveProgressReport?.summary?.completedTopics ?? 0;
    return total > 0 && completed >= total;
  }, [effectiveProgressReport]);

  // Chapter weightage map for intensive revision priority (keyed by chapterId)
  const chapterWeightMap = useMemo(() => {
    const map = new Map<string, number>();
    const target = courseExamTarget?.toLowerCase() ?? "";
    const useJee  = target.includes("jee");
    const useNeet = target.includes("neet");
    if (!useJee && !useNeet) return map;
    selectedCurriculum?.subjects.forEach(s =>
      s.chapters.forEach(ch => {
        const w = useJee ? ch.jeeWeightage : ch.neetWeightage;
        if (w !== undefined) map.set(ch.id, w);
      })
    );
    return map;
  }, [selectedCurriculum, courseExamTarget]);

  const syncStatus = useCallback((items: StudyPlanItem[]) => {
    return items.map(item => {
      // Practice items must be completed explicitly (quiz flow or Done button) — never auto-synced
      // from AI session history, because completing AI notes ≠ completing practice questions.
      if (item.type === "practice") return item;
      const tid = item.content?.topicId || item.refId;
      if (item.status === "pending" && tid && completedHistoryTopicIds.has(tid)) {
        return { ...item, status: "completed" as const };
      }
      return item;
    });
  }, [completedHistoryTopicIds]);

  const allTodayItems = useMemo(() => syncStatus(rawTodayItems), [rawTodayItems, syncStatus]);
  const hasPlan = allTodayItems.length > 0;

  // Today plan is global (not course-scoped) — show all items regardless of selected course
  const todayItems = allTodayItems;

  const backlogWeekData = useMemo(() => {
    const synced: Record<string, StudyPlanItem[]> = {};
    Object.entries(rawBacklogWeekData).forEach(([date, items]) => {
      synced[date] = syncStatus(items);
    });
    return synced;
  }, [rawBacklogWeekData, syncStatus]);

  const weekPlanData = rawWeekPlanData;

  // Derive weak topic IDs from progress report (accuracy < 50, has been attempted)
  const weakTopicIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => {
          if ((t.bestAccuracy ?? 0) > 0 && (t.bestAccuracy ?? 0) < 50) ids.add(t.topicId);
        })
      )
    );
    return ids;
  }, [effectiveProgressReport]);

  // Weak topics list for Weak Topics tab
  const weakTopics = useMemo(() => {
    const list: Array<{ topicId: string; topicName: string; subjectName: string; chapterName: string; accuracy: number }> = [];
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => {
          if (!selectedCourseTopicIds.has(t.topicId)) return;
          if ((t.bestAccuracy ?? 0) > 0 && (t.bestAccuracy ?? 0) < 50) {
            list.push({
              topicId: t.topicId,
              topicName: t.topicName,
              subjectName: s.subjectName,
              chapterName: c.chapterName,
              accuracy: t.bestAccuracy ?? 0,
            });
          }
        })
      )
    );
    return list.sort((a, b) => a.accuracy - b.accuracy);
  }, [effectiveProgressReport, selectedCourseTopicIds]);

  // Weak chapters: chapters with overall accuracy > 0 and < 50% with at least one attempted topic
  const weakChapters = useMemo(() => {
    const list: Array<{ chapterId: string; chapterName: string; subjectName: string; topicsTotal: number; topicsCompleted: number; overallAccuracy: number; attemptedTopics: number }> = [];
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c => {
        const attempted = c.topics.filter(t =>
          selectedCourseTopicIds.has(t.topicId) &&
          (t.attemptCount > 0 || t.status === "completed" || t.status === "in_progress")
        ).length;
        if (attempted > 0 && c.overallAccuracy > 0 && c.overallAccuracy < 50) {
          list.push({
            chapterId: c.chapterId,
            chapterName: c.chapterName,
            subjectName: s.subjectName,
            topicsTotal: c.topicsTotal,
            topicsCompleted: c.topicsCompleted,
            overallAccuracy: Math.round(c.overallAccuracy),
            attemptedTopics: attempted,
          });
        }
      })
    );
    return list.sort((a, b) => a.overallAccuracy - b.overallAccuracy);
  }, [effectiveProgressReport, selectedCourseTopicIds]);

  // Forgotten concepts: completed topics not revisited in 14+ days, or abandoned in-progress (3+ attempts)
  const forgottenConcepts = useMemo(() => {
    const now = new Date();
    const list: Array<{ topicId: string; topicName: string; subjectName: string; chapterName: string; status: string; daysSince: number | null; attemptCount: number; bestAccuracy: number }> = [];
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => {
          if (!selectedCourseTopicIds.has(t.topicId)) return;
          if (t.status === "completed" && t.completedAt) {
            const days = differenceInDays(now, new Date(t.completedAt));
            if (days >= 14) {
              list.push({ topicId: t.topicId, topicName: t.topicName, subjectName: s.subjectName, chapterName: c.chapterName, status: "completed", daysSince: days, attemptCount: t.attemptCount, bestAccuracy: t.bestAccuracy });
            }
          } else if (t.status === "in_progress" && t.attemptCount >= 3) {
            list.push({ topicId: t.topicId, topicName: t.topicName, subjectName: s.subjectName, chapterName: c.chapterName, status: "in_progress", daysSince: null, attemptCount: t.attemptCount, bestAccuracy: t.bestAccuracy });
          }
        })
      )
    );
    return list.sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));
  }, [effectiveProgressReport, selectedCourseTopicIds]);

  // High negative-marking areas: topics where PYQ accuracy < 50% (high wrong-answer rate)
  const highNegativeTopics = useMemo(() => {
    const list: Array<{ topicId: string; topicName: string; subjectName: string; chapterName: string; attempted: number; correct: number; wrong: number; pyqAccuracy: number }> = [];
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => {
          if (!selectedCourseTopicIds.has(t.topicId)) return;
          if (t.pyq && t.pyq.attempted > 0 && t.pyq.accuracy < 50) {
            list.push({
              topicId: t.topicId,
              topicName: t.topicName,
              subjectName: s.subjectName,
              chapterName: c.chapterName,
              attempted: t.pyq.attempted,
              correct: t.pyq.correct,
              wrong: t.pyq.attempted - t.pyq.correct,
              pyqAccuracy: Math.round(t.pyq.accuracy),
            });
          }
        })
      )
    );
    return list.sort((a, b) => a.pyqAccuracy - b.pyqAccuracy);
  }, [effectiveProgressReport, selectedCourseTopicIds]);


  // Spaced revision: always backend-scoped to the selected course. Empty when no course selected.
  const revisionTopics = useMemo(() => {
    if (!selectedCourseId) return [];
    if (!spacedRevisionData.length) return [];
    const now = new Date();
    return spacedRevisionData.map(item => {
      const nextRevisionDate = new Date(item.nextRevisionDate);
      const daysUntil = differenceInDays(nextRevisionDate, now);
      return {
        topicId:           item.topicId,
        topicName:         item.topicName,
        subjectName:       item.subjectName,
        chapterName:       item.chapterName,
        accuracy:          item.accuracy,
        completedAt:       item.lastStudiedAt as string | null,
        learnedOn:         item.lastStudiedAt ? format(new Date(item.lastStudiedAt), "MMM d") : "—",
        nextRevisionDate,
        nextRevisionLabel: item.isOverdue ? "Overdue" : daysUntil === 0 ? "Today" : format(nextRevisionDate, "MMM d"),
        intervalDays:      item.intervalDays,
        isOverdue:         item.isOverdue,
      };
    });
  }, [selectedCourseId, spacedRevisionData]);

  // 7-day AI revision plan: assign each topic to the day it's due (capped 0–6)
  const aiRevisionPlan = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => ({
      date: addDays(now, i),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : format(addDays(now, i), "EEE, MMM d"),
      topics: [] as typeof revisionTopics,
    }));
    const sorted = [...revisionTopics].sort((a, b) =>
      a.isOverdue !== b.isOverdue ? (a.isOverdue ? -1 : 1) : a.accuracy - b.accuracy
    );
    sorted.forEach(topic => {
      const daysUntil = Math.max(0, Math.min(6, differenceInDays(topic.nextRevisionDate, now)));
      for (let d = daysUntil; d < 7; d++) {
        if (days[d].topics.length < 4) { days[d].topics.push(topic); break; }
      }
    });
    return days;
  }, [revisionTopics]);

  // Backlog items: past 7 days study-plan tasks that are NOT completed, scoped to selected course
  const backlogPlanItems = useMemo<Array<StudyPlanItem & { date: string }>>(() => {
    const items: Array<StudyPlanItem & { date: string }> = [];
    Object.entries(backlogWeekData).forEach(([date, dayItems]) => {
      if (date >= today) return;
      dayItems.forEach(item => {
        if (item.status !== "completed") {
          if (!item.content?.topicId || selectedCourseTopicIds.has(item.content.topicId)) {
            items.push({ ...item, date });
          }
        }
      });
    });
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [backlogWeekData, today, selectedCourseTopicIds]);

  // Intensive revision: plan items of type 'revision' from today + past week, course-filtered
  const intensiveRevisionItems = useMemo(() => {
    return [
      ...todayItems,
      ...Object.values(backlogWeekData).flat(),
    ].filter(it => it.type === 'revision' && (!it.content?.topicId || selectedCourseTopicIds.has(it.content.topicId)));
  }, [todayItems, backlogWeekData, selectedCourseTopicIds]);

  // Notes: always backend-scoped to the selected course. Empty when no course selected.
  const completedAiNotes = useMemo(() => {
    if (!selectedCourseId) return [];
    return backendNotes;
  }, [selectedCourseId, backendNotes]);

  // Practice: same — always course-scoped, never global.
  const completedPracticeSessions = useMemo(() => {
    if (!selectedCourseId) return [];
    return backendPractice;
  }, [selectedCourseId, backendPractice]);

  // Pending lectures: not completed, not locked, scoped to selected course
  const pendingLectures = useMemo(() =>
    allLectures.filter(l => !l.isLocked && !l.studentProgress?.isCompleted &&
      (!l.topic?.id || selectedCourseTopicIds.has(l.topic.id))),
    [allLectures, selectedCourseTopicIds]
  );

  // Pending PYQs: topics where no PYQ has been attempted yet
  const pendingPYQTopics = useMemo(() => {
    const list: Array<{ topicId: string; topicName: string; subjectName: string; chapterName: string }> = [];
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => {
          if (t.status !== "locked" && (!t.pyq || t.pyq.attempted === 0) && selectedCourseTopicIds.has(t.topicId)) {
            list.push({ topicId: t.topicId, topicName: t.topicName, subjectName: s.subjectName, chapterName: c.chapterName });
          }
        })
      )
    );
    return list;
  }, [effectiveProgressReport, selectedCourseTopicIds]);

  // Helper: build pending resource list for given types, scoped to selected course
  const buildPendingResources = useCallback((types: string[]) => {
    const completedTopicIds = new Set<string>();
    effectiveProgressReport?.subjects.forEach(s =>
      s.chapters.forEach(c =>
        c.topics.forEach(t => { if (t.status === "completed") completedTopicIds.add(t.topicId); })
      )
    );
    const seen = new Set<string>();
    const list: Array<CourseResource & { topicName: string; subjectName: string; chapterName: string; topicId: string }> = [];
    if (!selectedCurriculum) return list;
    selectedCurriculum.subjects.forEach(subj =>
      subj.chapters.forEach(ch =>
        ch.topics.forEach(topic => {
          if (topic.status === "locked" || completedTopicIds.has(topic.id)) return;
          topic.resources.forEach(r => {
            if (!types.includes(r.type)) return;
            if (seen.has(r.id)) return;
            seen.add(r.id);
            list.push({
              ...r,
              topicName:   r.topicName   ?? topic.name,
              subjectName: r.subjectName ?? subj.name,
              chapterName: r.chapterName ?? ch.name,
              topicId:     r.topicId     ?? topic.id,
            });
          });
        })
      )
    );
    return list;
  }, [selectedCurriculum, effectiveProgressReport]);

  // Pending unread notes resources from selected course
  const pendingNotes = useMemo(
    () => buildPendingResources(["notes"]),
    [buildPendingResources],
  );

  // Pending mindmaps from selected course
  const pendingMindmaps = useMemo(
    () => buildPendingResources(["mindmap"]),
    [buildPendingResources],
  );

  // Pending DPPs & PDFs: resources on non-locked, non-completed topics — scoped to selected course only
  const pendingResources = useMemo(() => buildPendingResources(["pdf", "dpp"]), [buildPendingResources]);



  // Pending mock tests: published, not yet attempted, scoped to selected course
  const pendingMockTests = useMemo(() => {
    const doneIds = new Set(
      sessions
        .filter(s => ["submitted", "auto_submitted", "completed"].includes(s.status))
        .map(s => s.mockTestId)
    );
    return mockTests.filter(t =>
      t.isPublished &&
      !doneIds.has(t.id) &&
      (!selectedCourseId || !t.batchId || t.batchId === selectedCourseId)
    );
  }, [mockTests, sessions, selectedCourseId]);

  const totalBacklogCount =
    backlogPlanItems.length +
    pendingLectures.length +
    pendingPYQTopics.length +
    pendingNotes.length +
    pendingMindmaps.length +
    pendingResources.length +
    pendingMockTests.length;

  // Subject groups for Today tab
  const bySubject = useMemo(() => {
    const map: Record<string, StudyPlanItem[]> = {};
    for (const item of todayItems) {
      const key = item.content?.subjectName ?? "General";
      (map[key] ??= []).push(item);
    }
    return map;
  }, [todayItems]);

  const doneCount    = todayItems.filter(i => i.status === "completed").length;
  const donePct      = todayItems.length > 0 ? Math.round((doneCount / todayItems.length) * 100) : 0;
  const totalMinutes = todayItems.reduce((s, i) => s + i.estimatedMinutes, 0);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(new Date(), i);
      const key  = format(date, "yyyy-MM-dd");
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : format(date, "EEE, MMM d");
      return { key, label, date, items: weekPlanData[key] ?? [] };
    });
  }, [weekPlanData]);

  const handleAutoGenerate = () => {
    generate.mutate({ batchId: selectedCourseId ?? undefined }, {
      onSuccess: () => {
        toast.success("Your roadmap and study plan are ready!");
      },
      onError: () => {
        toast.error("Could not generate plan. Please try again.");
      },
    });
  };

  const handleRegenerate = () =>
    regenerate.mutate(selectedCourseId ?? undefined, {
      onSuccess: () => toast.success("Plan regenerated!"),
      onError:   () => toast.error("Could not regenerate. Please try again."),
    });

  const handleResetConfirmed = () =>
    clearPlan.mutate(selectedCourseId ?? undefined, {
      onSuccess: () => {
        setConfirmReset(false);
        toast.success("Plan cleared!");
      },
      onError: () => toast.error("Could not reset plan. Please try again."),
    });

  const handleOpenPlanItem = (item: StudyPlanItem) => {
    const videoUrl = item.content?.videoUrl?.trim();
    const topicId  = item.content?.topicId || item.refId;
    if (item.type === "practice" && topicId) {
      navigate("/school/student/assessments");
      return;
    }
    if (item.type === "revision" && topicId) {
      navigate("/school/student/study-materials");
      return;
    }
    if ((item.type === "lecture" || item.type === "revision") && videoUrl) {
      navigate("/school/student/recorded-classes");
      return;
    }
    if (topicId) {
      navigate("/school/student/study-materials");
      return;
    }
    toast.error("No study resource is attached to this task yet.");
  };

  if (meLoading || myCoursesLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (myCourses.length === 0) return (
    <div className="px-4 py-16 max-w-md mx-auto text-center bg-white rounded-[2.5rem] border border-dashed border-gray-300 mt-20">
      <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
      <p className="text-gray-400 font-medium">No courses found in your account.</p>
    </div>
  );

  if (!selectedCourseId) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (generate.isPending || regenerate.isPending || clearPlan.isPending) return <GeneratingView />;

  const TABS: Array<{ key: ActiveTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: "today",     label: "Today",       icon: <ListTodo className="w-4 h-4" />,      badge: todayItems.filter(i => i.status !== "completed").length || undefined },
    { key: "backlogs",  label: "Backlogs",    icon: <AlertTriangle className="w-4 h-4" />, badge: totalBacklogCount || undefined },
    { key: "weakness",  label: "Weak Topics", icon: <TrendingDown className="w-4 h-4" />,  badge: (weakTopics.length + weakChapters.length + forgottenConcepts.length + highNegativeTopics.length) || undefined },
    { key: "revision",  label: "Revision",    icon: <RefreshCw className="w-4 h-4" />,     badge: revisionTopics.length || undefined },
    { key: "roadmap",   label: "Roadmap",     icon: <MapIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 -mx-3 -mt-4 sm:-mx-4 lg:-mx-6 lg:-mt-6">

      {/* Direct Study Plan view without selection page */}

      {/* Reset confirmation */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reset Study Plan?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Your current plan and all progress will be deleted. You'll answer a few questions to generate a fresh plan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleResetConfirmed} disabled={clearPlan.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                {clearPlan.isPending ? "Resetting..." : "Yes, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PreferenceWizard removed */}

      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white">
        <div className="px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-indigo-300 text-xs">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
              </p>
              <h1 className="text-xl font-bold mt-0">{me?.fullName?.split(" ")[0]} 👋</h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs">
                  <Target className="w-3 h-3" /> {fmtExam(courseExamTarget)} {courseExamYear}
                </span>
                {days !== null && (
                  <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs">
                    <Calendar className="w-3 h-3" /> {days} days left
                  </span>
                )}
                <span className="flex items-center gap-1 bg-amber-400/20 text-amber-200 px-2.5 py-1 rounded-full text-xs">
                  <Flame className="w-3 h-3 text-amber-300" /> {student?.streakDays ?? 0} day streak
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasPlan && (
                <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                  <div className="relative">
                    <svg width={42} height={42} className="-rotate-90">
                      <circle cx={21} cy={21} r={16} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={4} />
                      <circle cx={21} cy={21} r={16} fill="none" stroke="white" strokeWidth={4}
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 * (1 - donePct / 100)}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold">{donePct}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{doneCount}/{todayItems.length} done</div>
                    <div className="text-indigo-200 text-xs">{totalMinutes} min today</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <div className="flex border-b border-white/20">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setBacklogPage(null); setWeakPage(null); setRevisionPage(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium border-b-2 transition-all
                  ${activeTab === tab.key ? "border-white text-white" : "border-transparent text-indigo-300 hover:text-white"}`}>
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge ? (
                  <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3">

        {/* ══ TODAY TAB ══════════════════════════════════════════════════════════ */}
        {activeTab === "today" && (
          <div className="space-y-4">
            {/* Back to Hub removed */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            <div className="lg:col-span-4 space-y-2">

              {/* Today | This Week toggle */}
              {hasPlan && (
                <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
                  {(["today", "week"] as const).map(v => (
                    <button key={v} onClick={() => setTodayView(v)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        todayView === v
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}>
                      {v === "today" ? "Today" : "This Week"}
                    </button>
                  ))}
                </div>
              )}

              {planLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !hasPlan ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <Rocket className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">No plan created yet</h3>
                  <p className="text-gray-500 mt-2 mb-6 text-sm max-w-sm mx-auto">
                    Click below to create your monthly plan for {fmtExam(student?.examTarget)}
                  </p>
                  <button onClick={handleAutoGenerate}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors mx-auto flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Generate Study Plan
                  </button>
                </div>
              ) : todayView === "week" ? (
                /* ── Week View ── */
                (() => {
                  const activeDay = selectedWeekDay || today;
                  const activeDayData = weekDays.find(d => d.key === activeDay) ?? weekDays[0];
                  const activeDayBySubject: Record<string, StudyPlanItem[]> = {};
                  for (const item of (activeDayData?.items ?? [])) {
                    const key = item.content?.subjectName ?? "General";
                    (activeDayBySubject[key] ??= []).push(item);
                  }
                  return (
                    <div className="space-y-4">
                      {/* Day selector strip */}
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {weekDays.map(({ key, date, items: dayItems }) => {
                          const isActive = activeDay === key;
                          const isToday  = key === today;
                          const hasTasks = dayItems.length > 0;
                          return (
                            <button key={key} onClick={() => setSelectedWeekDay(key)}
                              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all ${
                                isActive
                                  ? "border-indigo-400 bg-indigo-600 text-white"
                                  : isToday
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                              }`}>
                              <span className="text-[10px] font-medium uppercase tracking-wide opacity-75">
                                {format(date, "EEE")}
                              </span>
                              <span className="text-lg font-bold leading-tight">{format(date, "d")}</span>
                              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                hasTasks
                                  ? isActive ? "bg-white" : "bg-indigo-400"
                                  : "bg-transparent"
                              }`} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Plan for selected day */}
                      {activeDayData && activeDayData.items.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm font-medium">No tasks planned for {activeDayData.label}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(activeDayBySubject).map(([subj, items]) => {
                            const cfg      = subjectCfg(subj);
                            const subjDone = items.filter(i => i.status === "completed").length;
                            const subjMins = items.reduce((s, i) => s + i.estimatedMinutes, 0);
                            return (
                              <div key={subj} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
                                <div className={`flex items-center justify-between px-3 py-2 ${cfg.bg}`}>
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                    <span className={`font-semibold text-sm ${cfg.color}`}>{subj}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span>{subjDone}/{items.length} done</span>
                                    <span>·</span>
                                    <Clock className="w-3 h-3" /><span>{subjMins}m</span>
                                  </div>
                                </div>
                                <div className="bg-white p-1.5 space-y-1.5">
                                  {items.map(item => (
                                    <PlanItemCard key={item.id} item={item}
                                      priority={derivePriority(item, weakTopicIds)}
                                      onComplete={id => complete.mutate(id)}
                                      onSkip={id => skip.mutate(id)}
                                      onOpen={handleOpenPlanItem}
                                      hideReviewIfDone={true}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* ── Today View ── */
                <div className="space-y-2">
                  {Object.entries(bySubject).map(([subj, items]) => {
                    const cfg      = subjectCfg(subj);
                    const subjDone = items.filter(i => i.status === "completed").length;
                    const subjMins = items.reduce((s, i) => s + i.estimatedMinutes, 0);
                    return (
                      <div key={subj} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
                        <div className={`flex items-center justify-between px-3 py-2 ${cfg.bg}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className={`font-semibold text-sm ${cfg.color}`}>{subj}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>{subjDone}/{items.length} done</span>
                            <span>·</span>
                            <Clock className="w-3 h-3" /><span>{subjMins}m</span>
                          </div>
                        </div>
                        <div className="bg-white p-1.5 space-y-1.5">
                          {items.map(item => (
                            <PlanItemCard key={item.id} item={item}
                              priority={derivePriority(item, weakTopicIds)}
                              onComplete={id => complete.mutate(id)}
                              onSkip={id => skip.mutate(id)}
                              onOpen={handleOpenPlanItem}
                              hideReviewIfDone={true}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">
              <div className="flex-1 min-w-0 space-y-3">
                <AISarthiCard
                  todayItems={todayItems}
                  streak={student?.streakDays ?? 0}
                  xpPoints={student?.xpPoints ?? 0}
                  progressReport={effectiveProgressReport}
                  weeklyActivity={weeklyActivity}
                  sessions={sessions}
                  weakTopicsCount={weakTopics.length}
                  revisionTopicsCount={revisionTopics.length}
                  forgottenCount={forgottenConcepts.length}
                />
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-700">AI Plan</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Regenerate your monthly plan with next topics</p>
                  <button onClick={handleRegenerate} disabled={regenerate.isPending}
                    className="w-full py-2.5 border border-indigo-300 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                    <RotateCcw className={`w-3.5 h-3.5 ${regenerate.isPending ? "animate-spin" : ""}`} />
                    {regenerate.isPending ? "Creating..." : "Regenerate Plan"}
                  </button>
                  <button onClick={() => setConfirmReset(true)}
                    className="w-full mt-2 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Reset &amp; Start Fresh
                  </button>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <MicroGoalsCard
                  weakTopics={weakTopics}
                  revisionTopics={revisionTopics}
                  pendingPYQTopics={pendingPYQTopics}
                  highNegativeTopics={highNegativeTopics}
                />
                <SmartRemindersCard
                  revisionTopics={revisionTopics}
                  weeklyActivity={weeklyActivity}
                  pendingMockTests={pendingMockTests}
                  forgottenConcepts={forgottenConcepts}
                  weakTopics={weakTopics}
                  pendingPYQTopics={pendingPYQTopics}
                  onTabChange={setActiveTab}
                  onBacklogPageChange={setBacklogPage}
                  selectedCourseId={selectedCourseId}
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ══ BACKLOGS TAB ════════════════════════════════════════════════════════════════════════ */}
        {activeTab === "backlogs" && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            <div className="lg:col-span-4">
              {/* ── Back button ── */}
              {backlogPage && (
                <button
                  onClick={() => setBacklogPage(null)}
                  className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Backlogs
                </button>
              )}

              {/* ── Landing: category cards ── */}
              {!backlogPage && (
                <>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900 font-outfit">Your Backlog Center</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Choose a category to review and clear your backlogs</p>
                  </div>
                  {totalBacklogCount === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-bounce" />
                      <h3 className="text-lg font-black text-gray-900">All caught up!</h3>
                      <p className="text-gray-500 mt-2 text-sm">No pending tasks, lectures, notes, mindmaps, PYQs, DPPs, or mock tests right now. Keep it up!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {([
                        { key: "plan",      icon: <ClipboardList className="w-8 h-8" />, label: "Missed Tasks",    count: backlogPlanItems.length,  desc: "Study plan items you didn't complete",  bg: "bg-red-50",    text: "text-red-600",    border: "border-red-100",    hover: "hover:border-red-300",    bgHover: "group-hover:bg-red-100"    },
                        { key: "lectures",  icon: <PlayCircle    className="w-8 h-8" />, label: "Video Lectures",  count: pendingLectures.length,   desc: "All unwatched lectures from this course", bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100",   hover: "hover:border-blue-300",   bgHover: "group-hover:bg-blue-100"   },
                        { key: "notes",     icon: <BookOpen      className="w-8 h-8" />, label: "Notes",           count: pendingNotes.length,      desc: "Unread notes from this course",          bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100",  hover: "hover:border-amber-300",  bgHover: "group-hover:bg-amber-100"  },
                        { key: "mindmaps",  icon: <BrainCircuit  className="w-8 h-8" />, label: "Mindmaps",        count: pendingMindmaps.length,   desc: "Visual mindmaps not yet reviewed",       bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", hover: "hover:border-indigo-300", bgHover: "group-hover:bg-indigo-100" },
                        { key: "pyq",       icon: <Activity      className="w-8 h-8" />, label: "PYQs Pending",    count: pendingPYQTopics.length,  desc: "Previous year questions not practised",  bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", hover: "hover:border-violet-300", bgHover: "group-hover:bg-violet-100" },
                        { key: "dpp",       icon: <FileText      className="w-8 h-8" />, label: "DPPs & PDFs",     count: pendingResources.length,  desc: "Practice sheets and reading material",   bg: "bg-teal-50",   text: "text-teal-600",   border: "border-teal-100",   hover: "hover:border-teal-300",   bgHover: "group-hover:bg-teal-100"   },
                        { key: "mocktests", icon: <ClipboardList className="w-8 h-8" />, label: "Mock Tests",      count: pendingMockTests.length,  desc: "Published tests not yet attempted",      bg: "bg-rose-50",   text: "text-rose-600",   border: "border-rose-100",   hover: "hover:border-rose-300",   bgHover: "group-hover:bg-rose-100"   },
                      ] as const).map(c => (
                        <div key={c.key}
                          onClick={c.count > 0 ? () => setBacklogPage(c.key) : undefined}
                          className={`group bg-white p-6 rounded-2xl border border-gray-200 transition-all relative overflow-hidden ${c.count > 0 ? `${c.hover} hover:shadow-md cursor-pointer` : "opacity-50 cursor-not-allowed"}`}>
                          <div className={`absolute top-0 right-0 w-24 h-24 ${c.bg} rounded-bl-full -mr-8 -mt-8 ${c.count > 0 ? c.bgHover : ""} transition-colors`} />
                          <div className={`${c.text} mb-4`}>{c.icon}</div>
                          <h3 className="text-lg font-bold text-gray-900">{c.label}</h3>
                          <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
                          <div className="mt-4 flex items-center gap-2">
                            {c.count > 0 ? (
                              <span className={`text-xs font-bold ${c.text} ${c.bg} px-2 py-1 rounded-lg border ${c.border}`}>
                                {c.count} items pending
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> All clear
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Drilldown: Missed Tasks ── */}
              {backlogPage === "plan" && (
                <BacklogSection icon={<ClipboardList className="w-4 h-4" />} title="Missed Study Plan Tasks" count={backlogPlanItems.length} accentColor="red" defaultOpen={backlogPlanItems.length > 0}>
                  {backlogPlanItems.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      No missed tasks! All clear.
                    </div>
                  ) : (() => {
                    const grouped = groupBacklogItems(backlogPlanItems, item => ({
                      subject: item.subjectName || item.content?.subjectName || "General",
                      chapter: item.content?.chapterName || "General Topic"
                    }));
                    return (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([subject, chapters]) => {
                          const cfg = subjectCfg(subject);
                          const count = Object.values(chapters).flat().length;
                          return (
                            <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  {count} pending
                                </span>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(chapters).map(([chapter, items]) => (
                                  <div key={chapter} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                      {chapter}
                                    </div>
                                    <div className="space-y-2">
                                      {items.map(item => (
                                        <PlanItemCard key={item.id} item={item} priority={derivePriority(item, weakTopicIds)}
                                          onComplete={id => complete.mutate(id)} onSkip={id => skip.mutate(id)} onOpen={handleOpenPlanItem}
                                          hideReviewIfDone={true} />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </BacklogSection>
              )}

              {/* ── Drilldown: Pending Lectures ── */}
              {backlogPage === "lectures" && (
                <BacklogSection icon={<PlayCircle className="w-4 h-4" />} title="Pending Lectures" count={pendingLectures.length} accentColor="blue" defaultOpen={pendingLectures.length > 0}>
                  {pendingLectures.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      All lectures watched!
                    </div>
                  ) : (() => {
                    const grouped = groupBacklogItems(pendingLectures, lec => ({
                      subject: lec.topic?.chapter?.subject?.name || lec.subject_name || "General",
                      chapter: lec.topic?.chapter?.name || lec.topic?.name || lec.chapter_name || "General Topic"
                    }));
                    return (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([subject, chapters]) => {
                          const cfg = subjectCfg(subject);
                          const count = Object.values(chapters).flat().length;
                          return (
                            <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  {count} pending
                                </span>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(chapters).map(([chapter, items]) => (
                                  <div key={chapter} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                      {chapter}
                                    </div>
                                    <div className="space-y-2">
                                      {items.map(lec => {
                                        const watchPct = lec.studentProgress?.watchPercentage ?? 0;
                                        return (
                                          <div key={lec.id}
                                            onClick={() => navigate(`/school/student/recorded-classes/${lec.id}`)}
                                            className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                                            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600"><PlayCircle className="w-4 h-4" /></div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-sm text-gray-900 truncate">{lec.title}</div>
                                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {lec.topic?.name && <span className="text-xs text-gray-400 truncate">{lec.topic.name}</span>}
                                                {watchPct > 0 && <span className="text-xs text-amber-600 font-medium">{watchPct}% watched</span>}
                                              </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/school/student/recorded-classes/${lec.id}`); }}
                                              className="shrink-0 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
                                              {watchPct > 0 ? "Resume" : "Watch"}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </BacklogSection>
              )}

              {/* ── Drilldown: Unread Notes ── */}
              {backlogPage === "notes" && (
                <BacklogSection icon={<BookOpen className="w-4 h-4" />} title="Unread Notes" count={pendingNotes.length} accentColor="amber" defaultOpen={pendingNotes.length > 0}>
                  {pendingNotes.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      No unread notes!
                    </div>
                  ) : (() => {
                    const grouped = groupBacklogItems(pendingNotes, r => ({
                      subject: r.subjectName || "General",
                      chapter: r.chapterName || r.topicName || "General Topic"
                    }));
                    return (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([subject, chapters]) => {
                          const cfg = subjectCfg(subject);
                          const count = Object.values(chapters).flat().length;
                          return (
                            <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  {count} pending
                                </span>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(chapters).map(([chapter, items]) => (
                                  <div key={chapter} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                      {chapter}
                                    </div>
                                    <div className="space-y-2">
                                      {items.map(r => {
                                        const url = r.fileUrl ?? r.externalUrl;
                                        return (
                                          <div key={r.id}
                                            onClick={() => navigate(`/school/student/study-materials?openMaterialId=${r.id}`)}
                                            className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer">
                                            <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600"><BookOpen className="w-4 h-4" /></div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-sm text-gray-900 truncate">{r.title}</div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-400 truncate">{r.topicName}</span>
                                              </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/school/student/study-materials?openMaterialId=${r.id}`); }} className="shrink-0 px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition-colors">Read</button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </BacklogSection>
              )}

              {/* ── Drilldown: Mindmaps ── */}
              {backlogPage === "mindmaps" && (
                <BacklogSection icon={<BrainCircuit className="w-4 h-4" />} title="Mindmaps" count={pendingMindmaps.length} accentColor="indigo" defaultOpen={pendingMindmaps.length > 0}>
                  {pendingMindmaps.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      No pending mindmaps!
                    </div>
                  ) : (() => {
                    const grouped = groupBacklogItems(pendingMindmaps, r => ({
                      subject: r.subjectName || "General",
                      chapter: r.chapterName || r.topicName || "General Topic"
                    }));
                    return (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([subject, chapters]) => {
                          const cfg = subjectCfg(subject);
                          const count = Object.values(chapters).flat().length;
                          return (
                            <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  {count} pending
                                </span>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(chapters).map(([chapter, items]) => (
                                  <div key={chapter} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                      {chapter}
                                    </div>
                                    <div className="space-y-2">
                                      {items.map(r => {
                                        const url = r.fileUrl ?? r.externalUrl;
                                        return (
                                          <div key={r.id}
                                            onClick={() => navigate(`/school/student/study-materials?openMaterialId=${r.id}`)}
                                            className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
                                            <div className="shrink-0 w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600"><BrainCircuit className="w-4 h-4" /></div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-sm text-gray-900 truncate">{r.title}</div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-400 truncate">{r.topicName}</span>
                                              </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/school/student/study-materials?openMaterialId=${r.id}`); }} className="shrink-0 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors">View</button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </BacklogSection>
              )}

              {/* ── Drilldown: PYQs ── */}
              {backlogPage === "pyq" && (
                <BacklogSection icon={<Activity className="w-4 h-4" />} title="PYQs Not Attempted" count={pendingPYQTopics.length} accentColor="violet" defaultOpen={pendingPYQTopics.length > 0}>
                  {pendingPYQTopics.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      All PYQs attempted!
                    </div>
                  ) : (() => {
                    const grouped = groupBacklogItems(pendingPYQTopics, t => ({
                      subject: t.subjectName || "General",
                      chapter: t.chapterName || "General Topic"
                    }));
                    return (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([subject, chapters]) => {
                          const cfg = subjectCfg(subject);
                          const count = Object.values(chapters).flat().length;
                          return (
                            <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  {count} pending
                                </span>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(chapters).map(([chapter, items]) => (
                                  <div key={chapter} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                      {chapter}
                                    </div>
                                    <div className="space-y-2">
                                      {items.map(t => (
                                        <div key={t.topicId}
                                          onClick={() => navigate("/school/student/assessments")}
                                          className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer">
                                          <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600"><Activity className="w-4 h-4" /></div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{t.topicName}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs text-gray-400">{t.chapterName}</span>
                                            </div>
                                          </div>
                                          <button onClick={(e) => { e.stopPropagation(); navigate("/school/student/assessments"); }}
                                            className="shrink-0 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-colors">Attempt</button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </BacklogSection>
              )}

              {/* ── Drilldown: DPPs & PDFs ── */}
              {backlogPage === "dpp" && (
                <BacklogSection icon={<FileText className="w-4 h-4" />} title="DPPs & PDFs" count={pendingResources.length} accentColor="teal" defaultOpen={pendingResources.length > 0}>
                  {pendingResources.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      No pending DPPs or PDFs!
                    </div>
                  ) : (() => {
                    const grouped = groupBacklogItems(pendingResources, r => ({
                      subject: r.subjectName || "General",
                      chapter: r.chapterName || r.topicName || "General Topic"
                    }));
                    return (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([subject, chapters]) => {
                          const cfg = subjectCfg(subject);
                          const count = Object.values(chapters).flat().length;
                          return (
                            <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  {count} pending
                                </span>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(chapters).map(([chapter, items]) => (
                                  <div key={chapter} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                      {chapter}
                                    </div>
                                    <div className="space-y-2">
                                      {items.map(r => {
                                        const url = r.fileUrl ?? r.externalUrl;
                                        const typeLabel = r.type === "dpp" ? "DPP" : r.type === "pdf" ? "PDF" : r.type === "mindmap" ? "Mindmap" : "Notes";
                                        const typeBg = r.type === "dpp" ? "bg-teal-50 border-teal-200 text-teal-600" : r.type === "pdf" ? "bg-sky-50 border-sky-200 text-sky-600" : r.type === "mindmap" ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-amber-50 border-amber-200 text-amber-600";
                                        return (
                                          <div key={r.id}
                                            onClick={() => navigate(`/school/student/study-materials?openMaterialId=${r.id}`)}
                                            className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer">
                                            <div className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${typeBg}`}><FileText className="w-4 h-4" /></div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-medium text-sm text-gray-900 truncate">{r.title}</span>
                                                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${typeBg}`}>{typeLabel}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 truncate">{r.topicName}</span>
                                              </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/school/student/study-materials?openMaterialId=${r.id}`); }} className="shrink-0 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors">Open</button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </BacklogSection>
              )}

              {/* ── Drilldown: Mock Tests ── */}
              {backlogPage === "mocktests" && (
                <BacklogSection icon={<ClipboardList className="w-4 h-4" />} title="Mock Tests" count={pendingMockTests.length} accentColor="rose" defaultOpen={pendingMockTests.length > 0}>
                  {pendingMockTests.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      No pending mock tests!
                    </div>
                  ) : (() => {
                    const grouped = groupBacklogItems(pendingMockTests, t => ({
                      subject: t.subjectName || t.subject || "Full Syllabus Mock Tests",
                      chapter: t.chapterName || t.chapter || "All Chapters"
                    }));
                    return (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([subject, chapters]) => {
                          const cfg = subjectCfg(subject);
                          const count = Object.values(chapters).flat().length;
                          return (
                            <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  {count} pending
                                </span>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(chapters).map(([chapter, items]) => (
                                  <div key={chapter} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                      {chapter}
                                    </div>
                                    <div className="space-y-2">
                                      {items.map(t => (
                                        <div key={t.id}
                                          onClick={() => navigate(`/school/student/assessments/${t.id}/take`)}
                                          className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer">
                                          <div className="shrink-0 w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600"><ClipboardList className="w-4 h-4" /></div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{t.title}</div>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                              {t.durationMinutes > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{t.durationMinutes} min</span>}
                                              {t.totalMarks > 0 && <span className="text-xs text-gray-400">{t.totalMarks} marks</span>}
                                            </div>
                                          </div>
                                          <button onClick={(e) => { e.stopPropagation(); navigate(`/school/student/assessments/${t.id}/take`); }}
                                            className="shrink-0 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors">
                                            Start
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </BacklogSection>
              )}
            </div>

            <div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">
                  <div className="flex-1 min-w-0 space-y-3">
                    <AISarthiCard todayItems={todayItems} streak={student?.streakDays ?? 0} xpPoints={student?.xpPoints ?? 0}
                      progressReport={effectiveProgressReport} weeklyActivity={weeklyActivity} sessions={sessions}
                      weakTopicsCount={weakTopics.length} revisionTopicsCount={revisionTopics.length} forgottenCount={forgottenConcepts.length} />
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <div className="font-semibold text-amber-700 text-sm mb-1 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Backlog Tip</div>
                      <p className="text-xs text-amber-700 leading-relaxed">Don't tackle everything at once. Pick 2–3 tasks per day and blend them into today's plan.</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <MicroGoalsCard weakTopics={weakTopics} revisionTopics={revisionTopics} pendingPYQTopics={pendingPYQTopics} highNegativeTopics={highNegativeTopics} />
                    <SmartRemindersCard revisionTopics={revisionTopics} weeklyActivity={weeklyActivity} pendingMockTests={pendingMockTests}
                      forgottenConcepts={forgottenConcepts} weakTopics={weakTopics} pendingPYQTopics={pendingPYQTopics} onTabChange={setActiveTab}
                      onBacklogPageChange={setBacklogPage} selectedCourseId={selectedCourseId} />
                  </div>
                </div>
              </div>
            )}

        {activeTab === "weakness" && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            <div className="lg:col-span-4 flex flex-col">
              {weakPage && (
                <button
                  onClick={() => setWeakPage(null)}
                  className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Weak Areas
                </button>
              )}

              {!weakPage ? (
                <>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900 font-outfit">Weak Areas Analysis</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Select a category to analyse and improve your weak areas</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { key: "chapters",  icon: <BookOpen     className="w-8 h-8" />, label: "Weak Chapters",      count: weakChapters.length,       desc: "Chapters with overall accuracy < 50%",   bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", hover: "hover:border-amber-300", bgHover: "group-hover:bg-amber-100", type: "chapters" },
                      { key: "topics",    icon: <TrendingDown className="w-8 h-8" />, label: "Low Accuracy Topics", count: weakTopics.length,         desc: "Topics where you score below 50%",       bg: "bg-red-50",   text: "text-red-600",   border: "border-red-100",   hover: "hover:border-red-300",   bgHover: "group-hover:bg-red-100",   type: "topics"   },
                      { key: "forgotten", icon: <Brain        className="w-8 h-8" />, label: "Forgotten Concepts",  count: forgottenConcepts.length,  desc: "Completed 14+ days ago without revision", bg: "bg-violet-50",text: "text-violet-600",border: "border-violet-100",hover: "hover:border-violet-300",bgHover: "group-hover:bg-violet-100", type: "concepts" },
                      { key: "negative",  icon: <Target       className="w-8 h-8" />, label: "High Negative-Marking", count: highNegativeTopics.length, desc: "PYQ topics with > 50% wrong answers",    bg: "bg-rose-50",  text: "text-rose-600",  border: "border-rose-100",  hover: "hover:border-rose-300",  bgHover: "group-hover:bg-rose-100",  type: "topics"   },
                    ] as const).map(c => (
                      <div key={c.key} onClick={() => setWeakPage(c.key)}
                        className={`group bg-white p-6 rounded-2xl border border-gray-200 ${c.hover} hover:shadow-md transition-all cursor-pointer relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 ${c.bg} rounded-bl-full -mr-8 -mt-8 ${c.bgHover} transition-colors`} />
                        <div className={`${c.text} mb-4`}>{c.icon}</div>
                        <h3 className="text-lg font-bold text-gray-900">{c.label}</h3>
                        <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className={`text-xs font-bold ${c.text} ${c.bg} px-2 py-1 rounded-lg border ${c.border}`}>
                            {c.count} {c.count === 1 ? (c.key === "chapters" ? "chapter" : "topic") : (c.key === "chapters" ? "chapters" : "topics")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* ── Weak Chapters Card ── */}
                  {weakPage === "chapters" && (
                    <BacklogSection
                      icon={<BookOpen className="w-4 h-4" />}
                      title="Weak Chapters"
                      count={weakChapters.length}
                      accentColor="amber"
                      defaultOpen={weakChapters.length > 0}
                    >
                      {weakChapters.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                          No weak chapters — great chapter-level accuracy!
                        </div>
                      ) : (() => {
                        const grouped = groupBacklogItems(weakChapters, ch => ({
                          subject: ch.subjectName || "General",
                          chapter: "All Chapters"
                        }));
                        return (
                          <div className="space-y-4">
                            {Object.entries(grouped).map(([subject, chapters]) => {
                              const cfg = subjectCfg(subject);
                              const count = Object.values(chapters).flat().length;
                              return (
                                <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                      <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                      {count} pending
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {Object.entries(chapters).map(([chapter, items]) => (
                                      <div key={chapter} className="space-y-2">
                                        <div className="space-y-2">
                                          {items.map(ch => {
                                            const accColor = ch.overallAccuracy < 30 ? "text-red-600 bg-red-50 border-red-200"
                                              : ch.overallAccuracy < 40 ? "text-orange-600 bg-orange-50 border-orange-200"
                                              : "text-amber-600 bg-amber-50 border-amber-200";
                                            const progressPct = ch.topicsTotal > 0 ? Math.round((ch.topicsCompleted / ch.topicsTotal) * 100) : 0;
                                            return (
                                              <div key={ch.chapterId} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-200 hover:shadow-sm transition-all flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-semibold text-sm text-gray-900 truncate">{ch.chapterName}</div>
                                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-xs text-gray-400">{ch.topicsCompleted}/{ch.topicsTotal} topics done</span>
                                                  </div>
                                                  <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progressPct}%` }} />
                                                  </div>
                                                </div>
                                                <span className={`shrink-0 text-sm font-bold px-2.5 py-1 rounded-full border ${accColor}`}>{ch.overallAccuracy}%</span>
                                                <button
                                                  onClick={() => navigate("/school/student/assessments")}
                                                  className="shrink-0 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors flex items-center gap-1">
                                                  <Zap className="w-3 h-3" /> Practice
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </BacklogSection>
                  )}

                  {/* ── Low Accuracy Topics Card ── */}
                  {weakPage === "topics" && (
                    <BacklogSection
                      icon={<TrendingDown className="w-4 h-4" />}
                      title="Low Accuracy Topics"
                      count={weakTopics.length}
                      accentColor="red"
                      defaultOpen={weakTopics.length > 0}
                    >
                      {weakTopics.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                          <Trophy className="w-8 h-8 text-amber-400 mb-2" />
                          No weak topics — accuracy is solid!
                        </div>
                      ) : (() => {
                        const grouped = groupBacklogItems(weakTopics, t => ({
                          subject: t.subjectName || "General",
                          chapter: t.chapterName || "General Topic"
                        }));
                        return (
                          <div className="space-y-4">
                            {Object.entries(grouped).map(([subject, chapters]) => {
                              const cfg = subjectCfg(subject);
                              const count = Object.values(chapters).flat().length;
                              return (
                                <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                      <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                      {count} pending
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {Object.entries(chapters).map(([chapter, items]) => (
                                      <div key={chapter} className="space-y-2">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                          {chapter}
                                        </div>
                                        <div className="space-y-2">
                                          {items.map((topic) => {
                                            const accColor = topic.accuracy < 30 ? "text-red-600 bg-red-50 border-red-200" : topic.accuracy < 40 ? "text-orange-600 bg-orange-50 border-orange-200" : "text-amber-600 bg-amber-50 border-amber-200";
                                            return (
                                              <div key={topic.topicId} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-sm transition-all">
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-semibold text-sm text-gray-900 truncate">{topic.topicName}</div>
                                                </div>
                                                <span className={`shrink-0 text-sm font-bold px-2.5 py-1 rounded-full border ${accColor}`}>{topic.accuracy}%</span>
                                                <button onClick={() => navigate("/school/student/assessments")}
                                                  className="shrink-0 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1">
                                                  <Zap className="w-3 h-3" /> Practice
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </BacklogSection>
                  )}

                  {/* ── Forgotten Concepts Card ── */}
                  {weakPage === "forgotten" && (
                    <BacklogSection
                      icon={<Brain className="w-4 h-4" />}
                      title="Forgotten Concepts"
                      count={forgottenConcepts.length}
                      accentColor="violet"
                      defaultOpen={forgottenConcepts.length > 0}
                    >
                      {forgottenConcepts.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                          No forgotten concepts — you're on top of your material!
                        </div>
                      ) : (() => {
                        const grouped = groupBacklogItems(forgottenConcepts, t => ({
                          subject: t.subjectName || "General",
                          chapter: t.chapterName || "General Topic"
                        }));
                        return (
                          <div className="space-y-4">
                            {Object.entries(grouped).map(([subject, chapters]) => {
                              const cfg = subjectCfg(subject);
                              const count = Object.values(chapters).flat().length;
                              return (
                                <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                      <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                      {count} pending
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {Object.entries(chapters).map(([chapter, items]) => (
                                      <div key={chapter} className="space-y-2">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                          {chapter}
                                        </div>
                                        <div className="space-y-2">
                                          {items.map(t => {
                                            const isAbandoned = t.status === "in_progress";
                                            return (
                                              <div key={t.topicId} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-violet-200 hover:shadow-sm transition-all">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center"><Brain className="w-4 h-4 text-violet-600" /></div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-semibold text-sm text-gray-900 truncate">{t.topicName}</div>
                                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {isAbandoned
                                                      ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-orange-50 text-orange-600 border-orange-200">Abandoned ({t.attemptCount} attempts)</span>
                                                      : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-violet-50 text-violet-600 border-violet-200">{t.daysSince}d ago</span>}
                                                  </div>
                                                </div>
                                                <div className="shrink-0 text-right"><span className="text-sm font-bold text-gray-700">{t.bestAccuracy}%</span><div className="text-[10px] text-gray-400 mt-0.5">accuracy</div></div>
                                                <button onClick={() => navigate("/school/student/study-materials")}
                                                  className="shrink-0 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-colors flex items-center gap-1">
                                                  <RefreshCw className="w-3 h-3" /> Revise
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </BacklogSection>
                  )}

                  {/* ── High Negative-Marking Areas Card ── */}
                  {weakPage === "negative" && (
                    <BacklogSection
                      icon={<Target className="w-4 h-4" />}
                      title="High Negative-Marking Areas"
                      count={highNegativeTopics.length}
                      accentColor="red"
                      defaultOpen={highNegativeTopics.length > 0}
                    >
                      {highNegativeTopics.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm flex flex-col items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                          No high negative-marking areas — your PYQ accuracy is good!
                        </div>
                      ) : (() => {
                        const grouped = groupBacklogItems(highNegativeTopics, t => ({
                          subject: t.subjectName || "General",
                          chapter: t.chapterName || "General Topic"
                        }));
                        return (
                          <div className="space-y-4">
                            {Object.entries(grouped).map(([subject, chapters]) => {
                              const cfg = subjectCfg(subject);
                              const count = Object.values(chapters).flat().length;
                              return (
                                <div key={subject} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                      <h4 className="font-bold text-sm text-slate-800">{subject}</h4>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                      {count} pending
                                    </span>
                                  </div>
                                  <div className="space-y-3">
                                    {Object.entries(chapters).map(([chapter, items]) => (
                                      <div key={chapter} className="space-y-2">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                          {chapter}
                                        </div>
                                        <div className="space-y-2">
                                          {items.map(t => {
                                            const wrongPct = t.attempted > 0 ? Math.round((t.wrong / t.attempted) * 100) : 0;
                                            return (
                                              <div key={t.topicId} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-red-200 hover:shadow-sm transition-all flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-semibold text-sm text-gray-900 truncate">{t.topicName}</div>
                                                  <div className="flex items-center gap-3 mt-2 text-[11px]">
                                                    <span className="text-emerald-600 font-medium">✓ {t.correct} correct</span>
                                                    <span className="text-red-600 font-medium">✗ {t.wrong} wrong</span>
                                                    <span className="text-gray-400">of {t.attempted} PYQs</span>
                                                    <span className="font-bold text-red-600">{wrongPct}% miss rate</span>
                                                  </div>
                                                </div>
                                                <div className="shrink-0 text-right"><span className="text-sm font-bold text-red-600">{t.pyqAccuracy}%</span><div className="text-[10px] text-gray-400 mt-0.5">PYQ acc.</div></div>
                                                <button onClick={() => navigate("/school/student/assessments")}
                                                  className="shrink-0 px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1">
                                                  <Target className="w-3 h-3" /> Retry PYQ
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </BacklogSection>
                  )}
                </div>
              )}
            </div>


            <div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">
              <div className="flex-1 min-w-0 space-y-3">
                <AISarthiCard todayItems={todayItems} streak={student?.streakDays ?? 0} xpPoints={student?.xpPoints ?? 0}
                  progressReport={effectiveProgressReport} weeklyActivity={weeklyActivity} sessions={sessions}
                  weakTopicsCount={weakTopics.length} revisionTopicsCount={revisionTopics.length} forgottenCount={forgottenConcepts.length} />
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <div className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> Weakness Engine</div>
                  <div className="space-y-1.5 text-xs text-red-700">
                    {[["Weak Chapters","Chapter accuracy < 50%"],["Low Accuracy","Topic accuracy < 50%"],["Forgotten","Completed 14+ days ago"],["Negative Marking","PYQ accuracy < 50%"]].map(([label, desc]) => (
                      <div key={label} className="flex justify-between gap-2"><span className="text-red-400 shrink-0">{label}</span><span className="font-medium text-right">{desc}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <MicroGoalsCard weakTopics={weakTopics} revisionTopics={revisionTopics} pendingPYQTopics={pendingPYQTopics} highNegativeTopics={highNegativeTopics} />
                <SmartRemindersCard revisionTopics={revisionTopics} weeklyActivity={weeklyActivity} pendingMockTests={pendingMockTests}
                  forgottenConcepts={forgottenConcepts} weakTopics={weakTopics} pendingPYQTopics={pendingPYQTopics} onTabChange={setActiveTab}
                  onBacklogPageChange={setBacklogPage} selectedCourseId={selectedCourseId} />
              </div>
            </div>
          </div>
        )}

        {/* ══ REVISION TAB ════════════════════════════════════════════════════════ */}
        {activeTab === "revision" && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            <div className="lg:col-span-4">
              {!revisionCategory && (
                <div className="mb-5">
                  {/* Back to Hub removed */}
                  <h2 className="text-xl font-bold text-gray-900">Revision Hub</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Master topics with smart cycles and intensive review</p>
                </div>
              )}

              {revisionCategory && (
                <button
                  onClick={() => setRevisionCategory(null)}
                  className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-sm self-start"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Revision
                </button>
              )}

              {!revisionCategory ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div onClick={() => setRevisionCategory("spaced")}
                    className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-indigo-100 transition-colors" />
                    <RefreshCw className="w-8 h-8 text-indigo-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Spaced Repetition</h3>
                    <p className="text-sm text-gray-500 mt-1">Smart 1, 3, 7, 21 day revision cycles based on your performance.</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                        {revisionTopics.length} topics due
                      </span>
                    </div>
                  </div>

                  <div onClick={() => setRevisionCategory("intensive")}
                    className={`group bg-white p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden
                      ${isSyllabusComplete ? "border-gray-200 hover:border-orange-300 hover:shadow-md" : "border-gray-200 opacity-60"}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-orange-100 transition-colors" />
                    <Flame className={`w-8 h-8 mb-4 ${isSyllabusComplete ? "text-orange-600" : "text-gray-400"}`} />
                    <h3 className="text-lg font-bold text-gray-900">Intensive Revision</h3>
                    <p className="text-sm text-gray-500 mt-1">Focus on high-volume review of recently learned concepts.</p>
                    <div className="mt-4 flex items-center gap-2">
                      {isSyllabusComplete ? (
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                          {intensiveRevisionItems.length} items
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 flex items-center gap-1">
                          🔒 Unlocks at 100% completion
                        </span>
                      )}
                    </div>
                  </div>

                  <div onClick={() => setRevisionCategory("notes")}
                    className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-purple-100 transition-colors" />
                    <BrainCircuit className="w-8 h-8 text-purple-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">AI Revision Notes</h3>
                    <p className="text-sm text-gray-500 mt-1">Review your personalized AI study summaries and highlights.</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                        {completedAiNotes.length} sessions
                      </span>
                    </div>
                  </div>

                  <div onClick={() => setRevisionCategory("practice")}
                    className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-teal-100 transition-colors" />
                    <CheckCheck className="w-8 h-8 text-teal-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Practice History</h3>
                    <p className="text-sm text-gray-500 mt-1">Re-attempt and review past quizzes and practice questions.</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">
                        {completedPracticeSessions.length} completed
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">

                  {/* ── Spaced Repetition ── */}
                  {revisionCategory === "spaced" && (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-bold text-indigo-700">7-Day AI Revision Plan</span>
                        </div>
                        <p className="text-xs text-indigo-600 leading-relaxed">
                          Topics assigned based on next due date and accuracy. Overdue items are prioritised first. Max 4 topics/day to keep revision manageable.
                        </p>
                      </div>
                      {aiRevisionPlan.map((day, di) => {
                        if (day.topics.length === 0) return (
                          <div key={di} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-xs font-semibold text-gray-400 w-24 shrink-0">{day.label}</span>
                            <span className="text-xs text-gray-400 italic">No revision due — rest day 🎉</span>
                          </div>
                        );
                        return (
                          <div key={di} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className={`px-4 py-2.5 flex items-center gap-3 border-b border-gray-100 ${di === 0 ? "bg-indigo-50" : "bg-gray-50"}`}>
                              <Calendar className={`w-4 h-4 ${di === 0 ? "text-indigo-600" : "text-gray-400"}`} />
                              <span className={`text-sm font-bold ${di === 0 ? "text-indigo-700" : "text-gray-700"}`}>{day.label}</span>
                              <span className="ml-auto text-xs text-gray-400">{day.topics.length} topics</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                              {day.topics.map(topic => {
                                const cfg = subjectCfg(topic.subjectName);
                                const accColor = topic.accuracy < 40 ? "text-red-600" : topic.accuracy < 55 ? "text-orange-500" : topic.accuracy < 65 ? "text-amber-600" : "text-teal-600";
                                return (
                                  <div key={topic.topicId} className="px-4 py-3 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-900 truncate">{topic.topicName}</span>
                                        {topic.isOverdue && <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded-full border border-red-200">OVERDUE</span>}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>{topic.subjectName}</span>
                                        <span className="text-[10px] text-gray-400">Learned {topic.learnedOn}</span>
                                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{topic.intervalDays}d cycle</span>
                                      </div>
                                    </div>
                                    <span className={`text-sm font-bold shrink-0 ${accColor}`}>{topic.accuracy}%</span>
                                    <button onClick={() => setRevisionModal({
                                        topicId: topic.topicId,
                                        topicName: topic.topicName,
                                        subjectName: topic.subjectName,
                                        accuracy: topic.accuracy,
                                        intervalDays: topic.intervalDays,
                                      })}
                                      className="shrink-0 px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 flex items-center gap-1">
                                      <RefreshCw className="w-2.5 h-2.5" /> Revise
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Intensive Revision ── */}
                  {revisionCategory === "intensive" && (
                    <div className="space-y-3">
                      {!isSyllabusComplete ? (
                        <div className="bg-white rounded-[2.5rem] border border-gray-200 p-12 text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative">
                            <div className="w-20 h-20 bg-orange-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-100">
                              <Flame className="w-10 h-10 text-orange-600 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Intensive Revision Locked</h3>
                            <p className="text-gray-500 mb-8 text-base max-w-sm mx-auto leading-relaxed">
                              This feature unlocks automatically once you reach <span className="font-bold text-orange-600">100% syllabus completion</span>. Finish your roadmap to start elite revision.
                            </p>
                            <div className="max-w-xs mx-auto mb-8 bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                              <div
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.round((effectiveProgressReport?.summary?.completedTopics ?? 0) / Math.max(effectiveProgressReport?.summary?.totalTopics ?? 1, 1) * 100)}%` }}
                              />
                            </div>
                            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-2xl border border-orange-100 text-sm font-bold">
                              <Target className="w-4 h-4" /> {effectiveProgressReport?.summary?.completedTopics ?? 0}/{effectiveProgressReport?.summary?.totalTopics ?? 0} topics completed
                            </div>
                          </div>
                        </div>
                      ) : (
                        <IntensiveRevisionSection
                          progressReport={effectiveProgressReport}
                          days={days}
                          examTarget={courseExamTarget}
                          chapterWeightMap={chapterWeightMap.size > 0 ? chapterWeightMap : undefined}
                        />
                      )}
                    </div>
                  )}

                  {/* ── AI Revision Notes ── */}
                  {revisionCategory === "notes" && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <h3 className="text-base font-bold text-gray-900">Personalized Study Notes</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Access your past AI study sessions and key concept summaries.</p>
                      </div>
                      {completedAiNotes.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                          <BrainCircuit className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No AI study notes generated yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {completedAiNotes.map((session: studentApi.AiStudySessionData) => (
                            <NoteHistoryReviewCard
                              key={session.id}
                              session={session}
                              onNavigate={(topicId) => navigate("/school/student/study-materials")}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Practice History ── */}
                  {revisionCategory === "practice" && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <h3 className="text-base font-bold text-gray-900">Practice History</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Review and re-attempt past practice questions from your plan.</p>
                      </div>
                      {completedPracticeSessions.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                          <CheckCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No completed practice items found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {completedPracticeSessions.map(session => (
                            <PracticeHistoryReviewCard
                              key={session.id}
                              session={session}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-3 flex gap-3 items-start sticky top-4 self-start">
              <div className="flex-1 min-w-0 space-y-3">
                <AISarthiCard
                  todayItems={todayItems}
                  streak={student?.streakDays ?? 0}
                  xpPoints={student?.xpPoints ?? 0}
                  progressReport={effectiveProgressReport}
                  weeklyActivity={weeklyActivity}
                  sessions={sessions}
                  weakTopicsCount={weakTopics.length}
                  revisionTopicsCount={revisionTopics.length}
                  forgottenCount={forgottenConcepts.length}
                />
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                  <div className="font-semibold text-teal-700 text-sm mb-3 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4" /> Spaced Repetition
                  </div>
                  <div className="space-y-2 text-xs">
                    {([
                      ["1-Day",  "< 40%",   "bg-red-100 text-red-700"],
                      ["3-Day",  "40–54%",  "bg-orange-100 text-orange-700"],
                      ["7-Day",  "55–64%",  "bg-amber-100 text-amber-700"],
                      ["21-Day", "65–74%",  "bg-teal-100 text-teal-700"],
                    ] as const).map(([interval, range, cls]) => (
                      <div key={interval} className="flex items-center gap-2">
                        <span className={`font-bold px-2 py-0.5 rounded-full shrink-0 ${cls}`}>{interval}</span>
                        <span className="text-gray-500">accuracy {range}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-teal-100 text-xs text-teal-600 leading-relaxed">
                    Accuracy improves → interval extends → topic eventually clears the queue.
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <MicroGoalsCard
                  weakTopics={weakTopics}
                  revisionTopics={revisionTopics}
                  pendingPYQTopics={pendingPYQTopics}
                  highNegativeTopics={highNegativeTopics}
                />
                <SmartRemindersCard
                  revisionTopics={revisionTopics}
                  weeklyActivity={weeklyActivity}
                  pendingMockTests={pendingMockTests}
                  forgottenConcepts={forgottenConcepts}
                  weakTopics={weakTopics}
                  pendingPYQTopics={pendingPYQTopics}
                  onTabChange={setActiveTab}
                  onBacklogPageChange={setBacklogPage}
                  selectedCourseId={selectedCourseId}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ ROADMAP TAB ═════════════════════════════════════════════════════════ */}
        {activeTab === "roadmap" && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            <div className="lg:col-span-4">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">My Curriculum Roadmap</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Your complete {fmtExam(student?.examTarget)} syllabus — tap any subject to expand chapters and topics
                </p>
              </div>
              <CurriculumRoadmap reportOverride={effectiveProgressReport} />
            </div>
            <div className="lg:col-span-3 grid grid-cols-2 gap-3 items-start sticky top-4 self-start">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-500" /> Exam Target
                </h3>
                <div className="space-y-2 text-sm">
                  {([
                    ["Exam",        fmtExam(student?.examTarget)],
                    ["Target Year", String(student?.examYear ?? "—")],
                    ["Daily Hours", student?.dailyStudyHours ? `${student.dailyStudyHours}h` : "—"],
                    ["Days Left",   days !== null ? `${days} days` : "—"],
                  ] as [string, string][]).map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-semibold ${label === "Days Left" ? "text-indigo-600" : "text-gray-900"}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <div className="font-semibold text-indigo-700 text-sm mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> How AI uses this
                </div>
                <p className="text-xs text-indigo-600 leading-relaxed">
                  Your study plan is generated from your enrolled curriculum, topic accuracy scores, weak areas, and daily study hours — and improves each time you regenerate.
                </p>
              </div>
              <button onClick={() => setActiveTab("today")}
                className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <ListTodo className="w-4 h-4" /> Go to Today's Plan
              </button>
              <button onClick={handleRegenerate} disabled={regenerate.isPending}
                className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <RotateCcw className={`w-3.5 h-3.5 ${regenerate.isPending ? "animate-spin" : ""}`} />
                Regenerate Plan
              </button>
            </div>
          </div>
        )}
      </div>
    {/* Page content closing */}

      {revisionModal && (
        <RevisionSessionModal
          topic={revisionModal}
          onClose={() => setRevisionModal(null)}
        />
      )}
</div>
  );
}
