"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  Brain, Target, Calendar, Clock, ChevronRight, ChevronDown,
  CheckCircle2, PlayCircle, BookOpen, Zap, Trophy, Flame,
  RotateCcw, Map, ListTodo, Star, CheckCheck, Rocket,
  ArrowRight, Sparkles, Activity,
} from "lucide-react";
import {
  useTodaysPlan, useWeeklyPlanGrouped, useGeneratePlan, useRegeneratePlan,
  useStudentMe, useCompletePlanItem, useSkipPlanItem, useProgressReport,
  useUpdateStudentProfile,
} from "@/hooks/use-student";
import type { StudyPlanItem } from "@/lib/api/student";

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

interface WizardState { examTarget: string; examYear: number; dailyStudyHours: number; }

function PreferenceWizard({ initial, onComplete }: { initial: Partial<WizardState>; onComplete: (p: WizardState) => void }) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<WizardState>({
    examTarget:      initial.examTarget      ?? "",
    examYear:        initial.examYear        ?? new Date().getFullYear() + 1,
    dailyStudyHours: initial.dailyStudyHours ?? 4,
  });

  const steps = ["Exam Target", "Target Year", "Daily Hours"];
  const canNext = step === 0 ? !!prefs.examTarget : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
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
          {step === 0 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎯</div>
                <h2 className="text-2xl font-bold text-gray-900">What's your target exam?</h2>
                <p className="text-gray-500 mt-1 text-sm">Your AI roadmap and study plan will be built around this</p>
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
                <p className="text-gray-500 mt-1 text-sm">We'll calculate your prep timeline and daily targets</p>
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
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">⏰</div>
                <h2 className="text-2xl font-bold text-gray-900">How many hours per day?</h2>
                <p className="text-gray-500 mt-1 text-sm">Be realistic — consistency beats cramming every time</p>
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
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your AI Plan Will Be Based On</h3>
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
                ? <><Sparkles className="w-4 h-4" /> Generate My Roadmap &amp; Plan</>
                : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">You can change these preferences anytime in your profile</p>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Building your personalized roadmap</h2>
        <p className="text-gray-500 mb-8 text-sm">
          AI is analyzing your exam target, enrolled curriculum, and weak areas to create a custom plan…
        </p>
        <div className="space-y-3">
          {[
            { label: "Scanning your curriculum", icon: "📚" },
            { label: "Identifying weak topics",  icon: "🔍" },
            { label: "Building study schedule",  icon: "📅" },
            { label: "Optimizing for your exam", icon: "🎯" },
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

// ─── Curriculum Roadmap ────────────────────────────────────────────────────────

function TopicPill({ topic }: { topic: any }) {
  const color =
    topic.status === "completed"   ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
    topic.status === "in_progress" ? "bg-amber-50 border-amber-300 text-amber-700" :
    topic.status === "locked"      ? "bg-gray-50 border-gray-200 text-gray-400" :
                                     "bg-blue-50 border-blue-200 text-blue-700";
  const dot =
    topic.status === "completed"   ? "bg-emerald-500" :
    topic.status === "in_progress" ? "bg-amber-400" :
    topic.status === "locked"      ? "bg-gray-300" : "bg-blue-400";
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${color}`}>
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span className="truncate max-w-[120px]">{topic.topicName}</span>
    </div>
  );
}

function ChapterRow({ chapter, cfg }: { chapter: any; cfg: typeof SUBJECT_CFG[string] }) {
  const [open, setOpen] = useState(false);
  const done  = chapter.topics?.filter((t: any) => t.status === "completed").length ?? 0;
  const total = chapter.topicsTotal ?? chapter.topics?.length ?? 0;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        <span className="flex-1 text-sm font-medium text-gray-800 truncate">{chapter.chapterName}</span>
        <span className="text-xs text-gray-400 shrink-0">{done}/{total}</span>
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0">
          <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-3 flex flex-wrap gap-2">
          {(chapter.topics ?? []).map((t: any) => <TopicPill key={t.topicId} topic={t} />)}
        </div>
      )}
    </div>
  );
}

function SubjectCard({ subject }: { subject: any }) {
  const [open, setOpen] = useState(false);
  const cfg = subjectCfg(subject.subjectName);
  const pct = subject.topicsTotal > 0 ? Math.round((subject.topicsCompleted / subject.topicsTotal) * 100) : 0;
  return (
    <div className={`rounded-2xl border-2 ${cfg.border} overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-4 p-4 text-left transition-all ${cfg.bg} hover:brightness-95`}>
        <div className="relative shrink-0">
          <CircleProgress pct={pct} color={cfg.ring} size={52} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">{pct}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-lg ${cfg.color}`}>{subject.subjectName}</div>
          <div className="text-sm text-gray-500">{subject.topicsCompleted}/{subject.topicsTotal} topics · {Math.round(subject.overallAccuracy ?? 0)}% accuracy</div>
          <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div className={`h-full ${cfg.dot} rounded-full`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-white/40 bg-white/70 divide-y divide-gray-100">
          {(subject.chapters ?? []).map((ch: any) => <ChapterRow key={ch.chapterId} chapter={ch} cfg={cfg} />)}
        </div>
      )}
    </div>
  );
}

function CurriculumRoadmap() {
  const { data: report, isLoading } = useProgressReport();
  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!report?.subjects?.length) return (
    <div className="text-center py-16 text-gray-400">
      <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Enroll in a course to see your curriculum roadmap</p>
    </div>
  );
  const { summary } = report;
  const overallPct = summary.totalTopics > 0 ? Math.round((summary.completedTopics / summary.totalTopics) * 100) : 0;
  return (
    <div className="space-y-4">
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
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="font-bold text-lg">{summary.lecturesCompleted}</div>
            <div className="text-indigo-200 text-xs">Lectures Done</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="font-bold text-lg">{Math.round(summary.overallAccuracy ?? 0)}%</div>
            <div className="text-indigo-200 text-xs">Accuracy</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <div className="font-bold text-lg">{summary.totalPYQAttempted}</div>
            <div className="text-indigo-200 text-xs">PYQs Done</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        {[
          { dot: "bg-emerald-500", label: "Completed" },
          { dot: "bg-amber-400",  label: "In Progress" },
          { dot: "bg-blue-400",   label: "Unlocked" },
          { dot: "bg-gray-300",   label: "Locked" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${l.dot}`} />
            {l.label}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {report.subjects.map(s => <SubjectCard key={s.subjectId} subject={s} />)}
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

function PlanItemCard({ item, onComplete, onSkip }: {
  item: StudyPlanItem;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
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
  const [wizardDone,  setWizardDone]  = useState(false);

  const { data: todayItems = [], isLoading: planLoading } = useTodaysPlan();
  const { data: weekData   = {} }                         = useWeeklyPlanGrouped(ws, we);

  const generate      = useGeneratePlan();
  const regenerate    = useRegeneratePlan();
  const complete      = useCompletePlanItem();
  const skip          = useSkipPlanItem();
  const updateProfile = useUpdateStudentProfile();

  const hasPrefs = !!(student?.examTarget && student?.examYear);
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
    try {
      await updateProfile.mutateAsync({
        examTarget:      prefs.examTarget,
        examYear:        prefs.examYear,
        dailyStudyHours: prefs.dailyStudyHours,
      });
      generate.mutate(undefined, {
        onSuccess: () => { toast.success("Your roadmap and study plan are ready!"); setWizardDone(false); },
        onError:   () => { toast.error("Could not generate plan. Please try again."); setWizardDone(false); },
      });
    } catch {
      toast.error("Could not save preferences.");
      setWizardDone(false);
    }
  };

  const handleGenerate = () =>
    generate.mutate(undefined, {
      onSuccess: () => toast.success("Study plan generated!"),
      onError:   () => toast.error("Could not generate plan. Please try again."),
    });

  const handleRegenerate = () =>
    regenerate.mutate(undefined, {
      onSuccess: () => toast.success("Plan regenerated!"),
      onError:   () => toast.error("Could not regenerate. Please try again."),
    });

  if (meLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!hasPrefs && !wizardDone) return (
    <PreferenceWizard
      initial={{ examTarget: student?.examTarget, examYear: student?.examYear, dailyStudyHours: student?.dailyStudyHours ?? 4 }}
      onComplete={handleWizardComplete}
    />
  );

  if (wizardDone || generate.isPending || regenerate.isPending) return <GeneratingView />;

  return (
    <div className="min-h-screen bg-gray-50">
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
              { key: "roadmap" as const, label: "My Roadmap",  icon: <Map      className="w-4 h-4" /> },
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
                    <h3 className="text-lg font-bold text-gray-900">No plan for today yet</h3>
                    <p className="text-gray-500 mt-2 mb-6 text-sm max-w-sm mx-auto">
                      Let AI generate a personalized schedule based on your {fmtExam(student?.examTarget)} curriculum and weak areas
                    </p>
                    <button onClick={handleGenerate}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors mx-auto flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Generate My Study Plan
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
                <p className="text-xs text-gray-500 mb-3">Regenerate based on your latest test scores and weak topics</p>
                <button onClick={handleRegenerate} disabled={regenerate.isPending}
                  className="w-full py-2.5 border border-indigo-300 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                  <RotateCcw className={`w-3.5 h-3.5 ${regenerate.isPending ? "animate-spin" : ""}`} />
                  {regenerate.isPending ? "Regenerating…" : "Regenerate Plan"}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Practice Tests", icon: <Trophy   className="w-4 h-4" />, cls: "text-red-600    bg-red-50    border-red-100" },
                    { label: "AI Self Study",  icon: <Brain    className="w-4 h-4" />, cls: "text-indigo-600 bg-indigo-50 border-indigo-100" },
                    { label: "Battle Arena",   icon: <Zap      className="w-4 h-4" />, cls: "text-orange-600 bg-orange-50 border-orange-100" },
                    { label: "Ask a Doubt",    icon: <BookOpen className="w-4 h-4" />, cls: "text-teal-600   bg-teal-50   border-teal-100" },
                  ].map(a => (
                    <button key={a.label} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-sm font-medium hover:shadow-sm transition-all ${a.cls}`}>
                      {a.icon} {a.label} <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setActiveTab("roadmap")}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Map className="w-4 h-4" /> View My Curriculum Roadmap
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
