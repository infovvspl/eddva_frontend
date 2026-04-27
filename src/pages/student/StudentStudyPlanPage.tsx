"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfWeek, differenceInDays, subYears } from "date-fns";
import { toast } from "sonner";
import {
  Brain, Target, Calendar, Clock, ChevronRight, ChevronDown,
  CheckCircle2, PlayCircle, BookOpen, Zap, Trophy, Flame,
  RotateCcw, Map as MapIcon, ListTodo, Star, CheckCheck, Rocket,
  ArrowRight, Sparkles, Activity, Trash2,
} from "lucide-react";
import {
  useTodaysPlan, useWeeklyPlanGrouped, useGeneratePlan, useRegeneratePlan,
  useClearPlan, useStudentMe, useCompletePlanItem, useSkipPlanItem, useProgressReport,
} from "@/hooks/use-student";
import type { StudyPlanItem } from "@/lib/api/student";
import type { ProgressReport, TopicReportEntry } from "@/lib/api/student";

// ─── Constants ─────────────────────────────────────────────────────────────────

const EXAM_OPTIONS = [
  { key: "jee_mains",    label: "JEE Mains",   icon: "⚛️", desc: "B.Tech admissions (NIT/IIIT)" },
  { key: "jee_advanced", label: "JEE Advanced", icon: "🔬", desc: "IIT admissions" },
  { key: "neet",         label: "NEET",         icon: "🩺", desc: "MBBS/BDS admissions" },
  { key: "foundation",   label: "Foundation",   icon: "📚", desc: "Class 8–10" },
  { key: "other",        label: "Other",        icon: "🎯", desc: "Custom target" },
];

const YEAR_OPTIONS = [2025, 2026, 2027, 2028];
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

// ─── Preference Wizard ─────────────────────────────────────────────────────────

interface WizardState { examTarget: string; examYear: number; currentClass: "9" | "10" | "11" | "12" | "dropper"; dailyStudyHours: number; }

function PreferenceWizard({ initial, onComplete, onClose }: { initial: Partial<WizardState>; onComplete: (p: WizardState) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<WizardState>({
    examTarget:      initial.examTarget      ?? "",
    examYear:        initial.examYear        ?? new Date().getFullYear() + 1,
    currentClass:    initial.currentClass    ?? "11",
    dailyStudyHours: initial.dailyStudyHours ?? 4,
  });

  const steps = ["Exam Target", "Target Year", "Current Class", "Daily Hours"];
  const canNext = step === 0 ? !!prefs.examTarget : true;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center mb-3">
            {steps.map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all
                  ${i < step ? "bg-indigo-600 text-white" : i === step ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500" : "bg-gray-100 text-gray-400"}`}>
                  {i < step ? <CheckCheck className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-1 mx-2 rounded-full ${i < step ? "bg-indigo-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">{steps[step]} — Step {step + 1} of {steps.length}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
          </div>
          {step === 0 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎯</div>
                <h2 className="text-2xl font-bold text-gray-900">What's your target exam?</h2>
                <p className="text-gray-500 mt-1 text-sm">Your study plan will be made based on this exam</p>
              </div>
              <div className="space-y-3">
                {EXAM_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => setPrefs(p => ({ ...p, examTarget: opt.key }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                      ${prefs.examTarget === opt.key ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}>
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{opt.label}</div>
                      <div className="text-sm text-gray-500">{opt.desc}</div>
                    </div>
                    {prefs.examTarget === opt.key && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📅</div>
                <h2 className="text-2xl font-bold text-gray-900">Which year are you targeting?</h2>
                <p className="text-gray-500 mt-1 text-sm">This helps us plan your monthly study schedule</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {YEAR_OPTIONS.map(yr => {
                  const days = Math.max(0, differenceInDays(new Date(yr, 3, 15), new Date()));
                  return (
                    <button key={yr} onClick={() => setPrefs(p => ({ ...p, examYear: yr }))}
                      className={`p-5 rounded-xl border-2 text-center transition-all
                        ${prefs.examYear === yr ? "border-violet-500 bg-violet-50 shadow-sm" : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"}`}>
                      <div className="text-2xl font-bold text-gray-900">{yr}</div>
                      <div className="text-sm text-gray-500 mt-1">{days} days left</div>
                      {prefs.examYear === yr && <div className="text-xs text-violet-600 font-medium mt-1">Selected ✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🏫</div>
                <h2 className="text-2xl font-bold text-gray-900">What is your current class?</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CLASS_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => setPrefs(p => ({ ...p, currentClass: opt.key as WizardState["currentClass"] }))}
                    className={`p-4 rounded-xl border-2 text-center transition-all
                      ${prefs.currentClass === opt.key ? "border-sky-500 bg-sky-50 shadow-sm" : "border-gray-200 hover:border-sky-300 hover:bg-gray-50"}`}>
                    <div className="text-base font-semibold text-gray-900">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">⏰</div>
                <h2 className="text-2xl font-bold text-gray-900">How many hours per day?</h2>
                <p className="text-gray-500 mt-1 text-sm">Choose hours you can follow daily</p>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {HOURS_OPTIONS.map(h => (
                  <button key={h} onClick={() => setPrefs(p => ({ ...p, dailyStudyHours: h }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all
                      ${prefs.dailyStudyHours === h ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-gray-200 hover:border-emerald-300"}`}>
                    <div className="text-xl font-bold text-gray-900">{h}h</div>
                  </button>
                ))}
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Plan Will Be Based On</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-base font-bold text-indigo-700">{fmtExam(prefs.examTarget)}</div>
                    <div className="text-xs text-gray-500">Target Exam</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-violet-700">{prefs.examYear}</div>
                    <div className="text-xs text-gray-500">Target Year</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-sky-700">{CLASS_OPTIONS.find(c => c.key === prefs.currentClass)?.label}</div>
                    <div className="text-xs text-gray-500">Current Class</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-700">{prefs.dailyStudyHours}h/day</div>
                    <div className="text-xs text-gray-500">Daily Study</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Back
              </button>
            )}
            <button
              onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onComplete(prefs)}
              disabled={!canNext}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {step === steps.length - 1
                ? <><Sparkles className="w-4 h-4" /> Generate Plan</>
                : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">You can change these later from your profile</p>
      </div>
    </div>
  );
}

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

function isNotesTask(item: StudyPlanItem): boolean {
  const kind = item.content?.taskKind;
  if (kind === "ai_notes") return true;
  if (item.type === "revision") return true;
  if (item.content?.notesUrl) return true;
  const title = normalizeText(item.title);
  return /\bnotes?\b/.test(title);
}

function isPracticeTask(item: StudyPlanItem): boolean {
  const kind = item.content?.taskKind;
  if (kind === "practice") return true;
  if (item.type === "practice") return true;
  const title = normalizeText(item.title);
  return /\bpractice\b|\bpaper\b|\bpyq\b|\bquiz\b|\bdpp\b/.test(title);
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

  if (relatedItems.length === 0) return topic.status;

  const directItems = relatedItems.filter((item) => normalizeText(item.content?.topicName) === topicName);
  if (directItems.length > 0) {
    const notesDone = directItems.some((item) => isNotesTask(item) && item.status === "completed");
    const practiceDone = directItems.some((item) => isPracticeTask(item) && item.status === "completed");
    const hasAnyDone = directItems.some((item) => item.status === "completed");
    const derived: TopicReportEntry["status"] =
      notesDone && practiceDone ? "completed" :
      hasAnyDone ? "in_progress" :
      "unlocked";
    // Never downgrade backend-computed topic status based on pending plan items.
    return maxStatus(topic.status, derived);
  }

  const subtopicItems = relatedItems.filter((item) => {
    const contentTopic = normalizeText(item.content?.topicName);
    return !!contentTopic && contentTopic !== topicName;
  });

  if (subtopicItems.length > 0) {
    const bySubtopic = new Map<string, StudyPlanItem[]>();
    for (const item of subtopicItems) {
      const key = normalizeText(item.content?.topicName);
      if (!key) continue;
      if (!bySubtopic.has(key)) bySubtopic.set(key, []);
      bySubtopic.get(key)!.push(item);
    }

    const hasAnyDone = subtopicItems.some((item) => item.status === "completed");
    const distinctSubtopics = bySubtopic.size;
    const allSubtopicsCompleted =
      distinctSubtopics > 1 &&
      Array.from(bySubtopic.values()).every((items) => {
        const notesDone = items.some((item) => isNotesTask(item) && item.status === "completed");
        const practiceDone = items.some((item) => isPracticeTask(item) && item.status === "completed");
        return notesDone && practiceDone;
      });

    const derived: TopicReportEntry["status"] =
      allSubtopicsCompleted ? "completed" :
      hasAnyDone ? "in_progress" :
      "unlocked";
    return maxStatus(topic.status, derived);
  }

  const hasAnyDone = relatedItems.some((item) => item.status === "completed");
  return maxStatus(topic.status, hasAnyDone ? "in_progress" : "unlocked");
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

// Single topic leaf — shows inside an expanded chapter
function TopicLeaf({ topic, isLast, lineColor }: { topic: any; isLast: boolean; lineColor: string }) {
  const st = topicStatus(topic.status);
  return (
    <div className="flex items-start">
      {/* vertical + elbow lines */}
      <div className="relative flex flex-col items-center" style={{ width: 24, minWidth: 24 }}>
        {/* vertical line from parent — stops halfway for last item */}
        {!isLast && (
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: lineColor, opacity: 0.35 }} />
        )}
        {isLast && (
          <div className="absolute left-1/2 top-0 w-px -translate-x-1/2" style={{ height: "50%", background: lineColor, opacity: 0.35 }} />
        )}
        {/* horizontal elbow */}
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 h-px" style={{ width: 12, background: lineColor, opacity: 0.35 }} />
      </div>
      {/* dot + label */}
      <div className="flex items-center gap-1.5 py-1.5 pl-1 flex-1 min-w-0">
        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${st.dot}`}>
          {topic.status === "completed" && <span className="text-[8px] text-white font-black leading-none">✓</span>}
        </div>
        <span className={`text-xs font-medium truncate leading-tight ${st.text}`}>{topic.topicName}</span>
        {topic.status === "in_progress" && (
          <span className="shrink-0 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">In Progress</span>
        )}
      </div>
    </div>
  );
}

// Chapter node — second level; expands to show topics
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
      {/* vertical line from subject */}
      <div className="relative flex flex-col items-center" style={{ width: 28, minWidth: 28 }}>
        {!isLast && (
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: parentLineColor, opacity: 0.3 }} />
        )}
        {isLast && (
          <div className="absolute left-1/2 top-0 w-px -translate-x-1/2" style={{ height: "50%", background: parentLineColor, opacity: 0.3 }} />
        )}
        <div className="absolute top-[18px] left-1/2 h-px -translate-y-1/2" style={{ width: 14, background: parentLineColor, opacity: 0.3 }} />
      </div>

      {/* Chapter card */}
      <div className="flex-1 min-w-0 mb-2">
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all
            ${open ? `${cfg.bg} ${cfg.border}` : "bg-white border-slate-200 hover:border-slate-300"}`}
        >
          {/* chapter dot */}
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

        {/* Topics subtree */}
        {open && topics.length > 0 && (
          <div className="mt-1 ml-5 pl-1 relative">
            {/* Vertical spine for topics */}
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

// Subject root node — top level; expands to show chapters
function SubjectNode({ subject, index }: { subject: any; index: number }) {
  const [open, setOpen] = useState(index === 0); // first subject open by default
  const cfg = subjectCfg(subject.subjectName);
  const pct = subject.topicsTotal > 0 ? Math.round((subject.topicsCompleted / subject.topicsTotal) * 100) : 0;
  const chapters: any[] = subject.chapters ?? [];

  const subjectEmoji: Record<string, string> = {
    physics: "⚛️", chemistry: "🧪", mathematics: "📐", math: "📐", biology: "🌱",
  };
  const emoji = Object.entries(subjectEmoji).find(([k]) => subject.subjectName?.toLowerCase().includes(k))?.[1] ?? "📚";

  return (
    <div className="mb-4">
      {/* Subject header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all shadow-sm
          ${open ? `${cfg.bg} ${cfg.border} shadow-md` : `bg-white ${cfg.border} hover:${cfg.bg}`}`}
      >
        {/* circle progress */}
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

      {/* Chapters subtree */}
      {open && (
        <div className="mt-2 ml-6 pl-2 relative">
          {/* Spine line from subject down through all chapters */}
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

function CurriculumRoadmap() {
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const historyStart = format(subYears(new Date(), 5), "yyyy-MM-dd");
  const { data: groupedHistory = {} } = useWeeklyPlanGrouped(historyStart, todayKey);
  const { data: report, isLoading } = useProgressReport();
  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!report?.subjects?.length) return (
    <div className="text-center py-16 text-gray-400">
      <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-sm">AI syllabus is being prepared for your target exam. Please refresh in a few seconds.</p>
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
  const completedLectureCount = summary.lecturesCompleted ?? 0;
  const practiceItems = planHistory.filter(isPracticeTask);
  const completedPracticeCount = practiceItems.filter((item) => item.status === "completed").length;
  const derivedAccuracy =
    summary.overallAccuracy && summary.overallAccuracy > 0
      ? Math.round(summary.overallAccuracy)
      : practiceItems.length > 0
        ? Math.round((completedPracticeCount / practiceItems.length) * 100)
        : 0;
  return (
    <div className="space-y-5">
      {/* Summary banner */}
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
        <div className="grid grid-cols-2 gap-3 text-center text-sm">
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="font-bold text-lg">{completedLectureCount}</div>
            <div className="text-indigo-200 text-xs">Lectures Done</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="font-bold text-lg">{derivedAccuracy}%</div>
            <div className="text-indigo-200 text-xs">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Legend */}
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

      {/* Tree */}
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

function PlanItemCard({ item, onComplete, onSkip, onOpen }: {
  item: StudyPlanItem;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onOpen: (item: StudyPlanItem) => void;
}) {
  const t       = TYPE_CFG[item.type] ?? TYPE_CFG.lecture;
  const isDone  = item.status === "completed";
  const isSkip  = item.status === "skipped";
  const cfg     = item.content?.subjectName ? subjectCfg(item.content.subjectName) : null;
  return (
    <div className={`flex gap-3 p-3.5 rounded-xl border transition-all
      ${isDone ? "opacity-50 bg-gray-50 border-gray-200" : isSkip ? "opacity-35 bg-gray-50 border-gray-200" : "bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm"}`}>
      <div className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center
        ${isDone ? "bg-emerald-50 border-emerald-200 text-emerald-600" : `${t.bg} ${t.color}`}`}>
        {isDone ? <CheckCircle2 className="w-4 h-4" /> : t.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-sm text-gray-900 leading-tight line-clamp-2">{item.title}</div>
          {item.xpReward && !isDone && (
            <span className="shrink-0 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">+{item.xpReward}XP</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {cfg && item.content?.subjectName && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium border ${cfg.border}`}>{item.content.subjectName}</span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />{item.estimatedMinutes}m
          </span>
          {item.content?.topicName && <span className="text-xs text-gray-400 truncate">{item.content.topicName}</span>}
        </div>
      </div>
      {!isDone && !isSkip && (
        <div className="flex items-center gap-1 shrink-0">
          {(item.content?.notesUrl || item.content?.videoUrl || item.content?.topicId) && (
            <button onClick={() => onOpen(item)}
              className="px-2 py-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-medium">
              Open
            </button>
          )}
          <button onClick={() => onSkip(item.id)}
            className="px-2 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs">
            Skip
          </button>
          <button onClick={() => onComplete(item.id)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Week Strip ────────────────────────────────────────────────────────────────

function WeekStrip({ weekStart, selectedDate, onSelect, weekData }: {
  weekStart: Date; selectedDate: string; onSelect: (d: string) => void; weekData: Record<string, StudyPlanItem[]>;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {Array.from({ length: 7 }, (_, i) => {
        const d     = addDays(weekStart, i);
        const key   = format(d, "yyyy-MM-dd");
        const items = weekData[key] ?? [];
        const done  = items.filter(x => x.status === "completed").length;
        const isSel = key === selectedDate;
        const isTod = key === today;
        return (
          <button key={key} onClick={() => onSelect(key)}
            className={`flex flex-col items-center py-2 px-3 rounded-xl min-w-[52px] transition-all
              ${isSel ? "bg-indigo-600 text-white shadow-md" : isTod ? "bg-indigo-50 border-2 border-indigo-300 text-indigo-700" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <div className="text-xs font-medium">{format(d, "EEE")}</div>
            <div className={`text-lg font-bold mt-0.5 ${isSel ? "text-white" : isTod ? "text-indigo-700" : "text-gray-800"}`}>{format(d, "d")}</div>
            <div className="flex gap-0.5 mt-1 h-2 items-center">
              {items.slice(0, 3).map((_, j) => (
                <div key={j} className={`w-1.5 h-1.5 rounded-full ${j < done ? (isSel ? "bg-white" : "bg-emerald-400") : (isSel ? "bg-indigo-300" : "bg-gray-200")}`} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ActiveTab = "plan" | "roadmap";
type PlanTab   = "today" | "week";

export default function StudentStudyPlanPage() {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useStudentMe();
  const student = me?.student;

  const today     = format(new Date(), "yyyy-MM-dd");
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd   = addDays(weekStart, 6);
  const ws = format(weekStart, "yyyy-MM-dd");
  const we = format(weekEnd,   "yyyy-MM-dd");

  const [activeTab,   setActiveTab]   = useState<ActiveTab>("plan");
  const [planTab,     setPlanTab]     = useState<PlanTab>("today");
  const [selectedDay, setSelectedDay] = useState(today);
  const [wizardDone,   setWizardDone]   = useState(false);
  const [showWizard,   setShowWizard]   = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const { data: todayItems = [], isLoading: planLoading } = useTodaysPlan();
  const { data: weekData   = {} }                         = useWeeklyPlanGrouped(ws, we);

  const generate      = useGeneratePlan();
  const regenerate    = useRegeneratePlan();
  const clearPlan     = useClearPlan();
  const complete      = useCompletePlanItem();
  const skip          = useSkipPlanItem();

  const hasPlan  = todayItems.length > 0;

  const bySubject = useMemo(() => {
    const map: Record<string, StudyPlanItem[]> = {};
    for (const item of todayItems) {
      const key = item.content?.subjectName ?? "General";
      (map[key] ??= []).push(item);
    }
    return map;
  }, [todayItems]);

  const totalMinutes = todayItems.reduce((s, i) => s + i.estimatedMinutes, 0);
  const doneCount    = todayItems.filter(i => i.status === "completed").length;
  const donePct      = todayItems.length > 0 ? Math.round((doneCount / todayItems.length) * 100) : 0;
  const days         = countdownDays(student?.examYear);

  const handleWizardComplete = async (prefs: WizardState) => {
    setWizardDone(true);
    generate.mutate({
      targetExam: prefs.examTarget,
      examYear: String(prefs.examYear),
      currentClass: prefs.currentClass,
      dailyStudyHours: prefs.dailyStudyHours,
    }, {
      onSuccess: () => {
        toast.success("Your roadmap and study plan are ready!");
        setWizardDone(false);
        setShowWizard(false);
      },
      onError: () => {
        toast.error("Could not generate plan. Please try again.");
        setWizardDone(false);
      },
    });
  };

  const handleGenerate = () => setShowWizard(true);

  const handleRegenerate = () =>
    regenerate.mutate(undefined, {
      onSuccess: () => toast.success("Plan regenerated!"),
      onError:   () => toast.error("Could not regenerate. Please try again."),
    });

  const handleResetConfirmed = () =>
    clearPlan.mutate(undefined, {
      onSuccess: () => {
        setConfirmReset(false);
        setShowWizard(true);
        toast.success("Plan cleared! Set your preferences to generate a new one.");
      },
      onError: () => toast.error("Could not reset plan. Please try again."),
    });

  const handleOpenPlanItem = (item: StudyPlanItem) => {
    const notesUrl = item.content?.notesUrl?.trim();
    const videoUrl = item.content?.videoUrl?.trim();
    const topicId = item.content?.topicId;

    if (item.type === "practice" && topicId) {
      navigate(`/student/quiz?topicId=${topicId}`);
      return;
    }
    // Study-plan notes should always use AI self-study context, not teacher-uploaded notes files.
    if (item.type === "revision" && topicId) {
      navigate(`/student/ai-study/${topicId}`);
      return;
    }
    if ((item.type === "lecture" || item.type === "revision") && videoUrl) {
      window.open(videoUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (topicId) {
      navigate(`/student/ai-study/${topicId}`);
      return;
    }
    toast.error("No study resource is attached to this task yet.");
  };

  if (meLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (wizardDone || generate.isPending || regenerate.isPending || clearPlan.isPending) return <GeneratingView />;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Reset confirmation dialog ─────────────────────────────────────── */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reset Study Plan?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Your current plan and all progress will be deleted. You'll answer a few questions to generate a fresh plan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirmed}
                disabled={clearPlan.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {clearPlan.isPending ? "Resetting..." : "Yes, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWizard && (
        <PreferenceWizard
          initial={{
            examTarget: student?.examTarget,
            examYear: student?.examYear,
            currentClass: (student?.currentClass as WizardState["currentClass"]) ?? "11",
            dailyStudyHours: student?.dailyStudyHours ?? 4,
          }}
          onComplete={handleWizardComplete}
          onClose={() => setShowWizard(false)}
        />
      )}
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-indigo-300 text-sm">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
              </p>
              <h1 className="text-2xl font-bold mt-0.5">{me?.fullName?.split(" ")[0]} 👋</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                  <Target className="w-3.5 h-3.5" /> {fmtExam(student?.examTarget)} {student?.examYear}
                </span>
                {days !== null && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                    <Calendar className="w-3.5 h-3.5" /> {days} days left
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-amber-400/20 text-amber-200 px-3 py-1.5 rounded-full text-sm">
                  <Flame className="w-3.5 h-3.5 text-amber-300" /> {student?.streakDays ?? 0} day streak
                </span>
              </div>
            </div>
            {hasPlan && (
              <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                <div className="relative">
                  <svg width={52} height={52} className="-rotate-90">
                    <circle cx={26} cy={26} r={20} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={5} />
                    <circle cx={26} cy={26} r={20} fill="none" stroke="white" strokeWidth={5}
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={2 * Math.PI * 20 * (1 - donePct / 100)}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{donePct}%</span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold">{doneCount}/{todayItems.length} done</div>
                  <div className="text-indigo-200 text-xs">{totalMinutes} min today</div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 border-b border-white/20">
            {[
              { key: "plan"    as const, label: "Study Plan",  icon: <ListTodo className="w-4 h-4" /> },
              { key: "roadmap" as const, label: "My Roadmap",  icon: <MapIcon className="w-4 h-4" /> },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-all
                  ${activeTab === tab.key ? "border-white text-white" : "border-transparent text-indigo-300 hover:text-white"}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ══ STUDY PLAN ══════════════════════════════════════════════════════ */}
        {activeTab === "plan" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Sub-tabs */}
              <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-200 w-fit">
                {(["today", "week"] as const).map(t => (
                  <button key={t} onClick={() => setPlanTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${planTab === t ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                    {t === "today" ? "Today" : "This Week"}
                  </button>
                ))}
              </div>

              {planTab === "today" ? (
                planLoading ? (
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
                    <button onClick={handleGenerate}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors mx-auto flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Generate Study Plan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(bySubject).map(([subj, items]) => {
                      const cfg      = subjectCfg(subj);
                      const subjDone = items.filter(i => i.status === "completed").length;
                      const subjMins = items.reduce((s, i) => s + i.estimatedMinutes, 0);
                      return (
                        <div key={subj} className={`rounded-2xl border-2 ${cfg.border} overflow-hidden`}>
                          <div className={`flex items-center justify-between px-4 py-3 ${cfg.bg}`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                              <span className={`font-bold ${cfg.color}`}>{subj}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{subjDone}/{items.length} done</span>
                              <span>·</span>
                              <Clock className="w-3 h-3" /><span>{subjMins}m</span>
                            </div>
                          </div>
                          <div className="bg-white p-2 space-y-2">
                            {items.map(item => (
                              <PlanItemCard key={item.id} item={item}
                                onComplete={id => complete.mutate(id)}
                                onSkip={id => skip.mutate(id)}
                                onOpen={handleOpenPlanItem}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <WeekStrip weekStart={weekStart} selectedDate={selectedDay} onSelect={setSelectedDay} weekData={weekData} />
                  {(() => {
                    const dayItems = weekData[selectedDay] ?? [];
                    if (!dayItems.length) return (
                      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No tasks for {format(new Date(selectedDay + "T00:00:00"), "EEEE, MMM d")}</p>
                      </div>
                    );
                    return (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-600">{format(new Date(selectedDay + "T00:00:00"), "EEEE, MMMM d")}</p>
                        {dayItems.map(item => (
                          <PlanItemCard key={item.id} item={item}
                            onComplete={id => complete.mutate(id)}
                            onSkip={id => skip.mutate(id)}
                            onOpen={handleOpenPlanItem}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">{student?.streakDays ?? 0}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-0.5"><Flame className="w-3 h-3 text-amber-500" /> Streak</div>
                  </div>
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-violet-600">{(student?.xpPoints ?? 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-0.5"><Star className="w-3 h-3 text-violet-500" /> XP</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-gray-700">AI Plan</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">Create a fresh monthly plan with the next set of topics</p>
                <button onClick={handleRegenerate} disabled={regenerate.isPending}
                  className="w-full py-2.5 border border-indigo-300 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                  <RotateCcw className={`w-3.5 h-3.5 ${regenerate.isPending ? "animate-spin" : ""}`} />
                  {regenerate.isPending ? "Creating..." : "Regenerate Plan"}
                </button>
                <button onClick={() => setConfirmReset(true)}
                  className="w-full mt-2 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset &amp; Start Fresh
                </button>
              </div>

              <button onClick={() => setActiveTab("roadmap")}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <MapIcon className="w-4 h-4" /> View My Curriculum Roadmap
              </button>
            </div>
          </div>
        )}

        {/* ══ ROADMAP TAB ═════════════════════════════════════════════════════ */}
        {activeTab === "roadmap" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">My Curriculum Roadmap</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Your complete {fmtExam(student?.examTarget)} syllabus — tap any subject to expand chapters and topics
                </p>
              </div>
              <CurriculumRoadmap />
            </div>
            <div className="space-y-4">
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

              <button onClick={() => setActiveTab("plan")}
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
    </div>
  );
}
