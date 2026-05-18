"use client";

import { useState, useMemo } from "react";
import {
  Flame, Target, Zap, Brain, BookOpen, ChevronDown,
  ChevronRight, RefreshCw, AlertTriangle, Clock, Star,
  CheckCircle2, BarChart2, Sparkles, Play,
} from "lucide-react";
import RevisionSessionModal from "./RevisionSessionModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopicReport {
  topicId: string;
  topicName: string;
  bestAccuracy: number;
  completedAt?: string | null;
}

interface ChapterReport {
  chapterId?: string;
  chapterName: string;
  topics: TopicReport[];
}

interface SubjectReport {
  subjectName: string;
  chapters: ChapterReport[];
}

interface ProgressReport {
  subjects: SubjectReport[];
  summary?: { completedTopics: number; totalTopics: number };
}

export interface IntensiveRevisionSectionProps {
  progressReport: ProgressReport | null | undefined;
  days: number | null;
  examTarget?: string;
  chapterWeightMap?: Map<string, number>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

type Phase = "A" | "B" | "C" | "D";
type Tier  = "critical" | "weak" | "moderate" | "strong" | "mastered";
type PLevel = "P1" | "P2" | "P3" | "P4" | "P5";
type ExamWeight = "high" | "medium" | "low";

const PHASE_META: Record<Phase, {
  label: string; sublabel: string;
  color: string; bg: string; border: string;
  allowedPriorities: PLevel[];
  sessionNote: string;
}> = {
  A: {
    label: "Phase A — Deep Revision",
    sublabel: "30+ days · Full syllabus coverage",
    color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200",
    allowedPriorities: ["P1", "P2", "P3", "P4"],
    sessionNote: "All sub-concepts · Derivations included",
  },
  B: {
    label: "Phase B — Focused Drilling",
    sublabel: "15–29 days · Fix weak, reinforce moderate",
    color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200",
    allowedPriorities: ["P1", "P2", "P3"],
    sessionNote: "Application & HOT questions · No long derivations",
  },
  C: {
    label: "Phase C — High Yield Push",
    sublabel: "8–14 days · Maximise exam score",
    color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200",
    allowedPriorities: ["P1", "P2"],
    sessionNote: "Exam-style MCQs only · Speed + accuracy tracked",
  },
  D: {
    label: "Phase D — Survival Mode",
    sublabel: "1–7 days · Protect existing knowledge",
    color: "text-red-700", bg: "bg-red-50", border: "border-red-200",
    allowedPriorities: ["P1"],
    sessionNote: "Max 5 Qs per topic · No new question types",
  },
};

const TIER_META: Record<Tier, {
  label: string; icon: string;
  color: string; bg: string; border: string;
  minAcc: number; maxAcc: number;
}> = {
  critical: { label: "Critical",  icon: "🔴", color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    minAcc: 0,   maxAcc: 39  },
  weak:     { label: "Weak",      icon: "🟠", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", minAcc: 40,  maxAcc: 54  },
  moderate: { label: "Moderate",  icon: "🟡", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  minAcc: 55,  maxAcc: 64  },
  strong:   { label: "Strong",    icon: "🟢", color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-200",   minAcc: 65,  maxAcc: 74  },
  mastered: { label: "Mastered",  icon: "✅", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  minAcc: 75,  maxAcc: 100 },
};

const PRIORITY_META: Record<PLevel, { label: string; color: string; bg: string; border: string }> = {
  P1: { label: "P1 · Urgent",   color: "text-red-700",    bg: "bg-red-50",    border: "border-red-300"    },
  P2: { label: "P2 · High",     color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-300" },
  P3: { label: "P3 · Medium",   color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-300"  },
  P4: { label: "P4 · Flash",    color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-300"   },
  P5: { label: "P5 · Skip",     color: "text-gray-500",   bg: "bg-gray-50",   border: "border-gray-200"   },
};

const EXAM_WEIGHT_META: Record<ExamWeight, { icon: string; label: string; color: string }> = {
  high:   { icon: "⭐⭐", label: "Must-do",   color: "text-amber-700"  },
  medium: { icon: "⭐",   label: "Should-do", color: "text-yellow-600" },
  low:    { icon: "○",    label: "Optional",  color: "text-gray-400"   },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectPhase(days: number | null): Phase {
  if (!days || days >= 30) return "A";
  if (days >= 15) return "B";
  if (days >= 8) return "C";
  return "D";
}

function classifyTier(acc: number): Tier {
  if (acc < 40) return "critical";
  if (acc < 55) return "weak";
  if (acc < 65) return "moderate";
  if (acc < 75) return "strong";
  return "mastered";
}

function classifyExamWeight(w: number | undefined): ExamWeight {
  if (!w || w <= 0) return "medium";
  if (w >= 7)       return "high";
  if (w >= 3)       return "medium";
  return "low";
}

function derivePriority(tier: Tier, examWeight?: ExamWeight): PLevel {
  if (!examWeight) {
    // Accuracy-only fallback (no exam weight data)
    if (tier === "critical") return "P1";
    if (tier === "weak")     return "P2";
    if (tier === "moderate") return "P3";
    if (tier === "strong")   return "P4";
    return "P5";
  }
  // Combined matrix: exam-weight first, accuracy-tier second
  const MATRIX: Record<Tier, Record<ExamWeight, PLevel>> = {
    critical: { high: "P1", medium: "P2", low: "P3" },
    weak:     { high: "P1", medium: "P2", low: "P4" },
    moderate: { high: "P2", medium: "P3", low: "P5" },
    strong:   { high: "P3", medium: "P4", low: "P5" },
    mastered: { high: "P4", medium: "P5", low: "P5" },
  };
  return MATRIX[tier][examWeight];
}

function tierToIntervalDays(tier: Tier): 1 | 3 | 7 | 21 {
  if (tier === "critical") return 1;
  if (tier === "weak")     return 3;
  if (tier === "moderate") return 7;
  return 21;
}

// Survival Mode daily prescriptions
const SURVIVAL_SCHEDULE: Record<number, string> = {
  7: "P1 + P2 rapid blitz",
  6: "Weakest high-yield topics drill",
  5: "Formula + definition rapid fire",
  4: "Full mock — exam conditions",
  3: "Error analysis + concept maps",
  2: "Flash cards + cheat sheets only",
  1: "No questions. Notes only. Rest.",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function PhaseBanner({ phase, days }: { phase: Phase; days: number | null }) {
  const m = PHASE_META[phase];
  return (
    <div className={`rounded-2xl border-2 ${m.border} ${m.bg} p-4`}>
      <div className="flex items-center gap-3">
        <Flame className={`w-5 h-5 shrink-0 ${m.color}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${m.color}`}>{m.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{m.sublabel}</p>
        </div>
        {days !== null && (
          <div className="shrink-0 text-right">
            <p className={`text-2xl font-black ${m.color}`}>{days}</p>
            <p className="text-[10px] font-semibold text-gray-400">days left</p>
          </div>
        )}
      </div>
      <p className="mt-2.5 text-xs text-gray-600 bg-white/70 rounded-lg px-3 py-1.5 border border-white/80">
        <Sparkles className="w-3 h-3 inline mr-1 text-indigo-400" />
        {m.sessionNote}
      </p>
    </div>
  );
}

function SurvivalSchedule({ days }: { days: number }) {
  const clampedDays = Math.min(7, Math.max(1, days));
  return (
    <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <span className="text-sm font-bold text-red-700">Survival Mode Schedule</span>
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 7 }, (_, i) => 7 - i).map(d => (
          <div key={d} className={`flex items-center gap-3 px-4 py-2.5
            ${d === clampedDays ? "bg-red-50" : d < clampedDays ? "opacity-40" : ""}`}>
            <span className={`text-xs font-bold w-12 shrink-0 ${d === clampedDays ? "text-red-600" : "text-gray-400"}`}>
              Day {d}
            </span>
            <span className={`text-xs ${d === clampedDays ? "text-gray-900 font-semibold" : "text-gray-500"}`}>
              {SURVIVAL_SCHEDULE[d]}
            </span>
            {d === clampedDays && <span className="ml-auto text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">TODAY</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditSummary({
  counts, total, onSelectTier, selectedTier,
}: {
  counts: Record<Tier, number>;
  total: number;
  onSelectTier: (t: Tier | null) => void;
  selectedTier: Tier | null;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-bold text-gray-900">Syllabus Audit</span>
        <span className="ml-auto text-xs text-gray-400">{total} topics total</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {(["critical", "weak", "moderate", "strong", "mastered"] as Tier[]).map(tier => {
          const m = TIER_META[tier];
          const active = selectedTier === tier;
          return (
            <button key={tier} onClick={() => onSelectTier(active ? null : tier)}
              className={`rounded-xl border-2 p-2 text-center transition-all
                ${active ? `${m.border} ${m.bg}` : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
              <p className="text-base">{m.icon}</p>
              <p className={`text-lg font-black mt-0.5 ${active ? m.color : "text-gray-700"}`}>{counts[tier]}</p>
              <p className={`text-[9px] font-semibold mt-0.5 ${active ? m.color : "text-gray-400"} truncate`}>{m.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface IntensiveTopic {
  topicId: string;
  topicName: string;
  subjectName: string;
  chapterName: string;
  accuracy: number;
  tier: Tier;
  examWeight?: ExamWeight;
  priority: PLevel;
  intervalDays: 1 | 3 | 7 | 21;
}

function TopicRow({
  topic, onStart,
}: {
  topic: IntensiveTopic;
  onStart: (t: IntensiveTopic) => void;
}) {
  const tm = TIER_META[topic.tier];
  const pm = PRIORITY_META[topic.priority];
  const em = topic.examWeight ? EXAM_WEIGHT_META[topic.examWeight] : null;
  const isFlash = topic.priority === "P4";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">{topic.topicName}</span>
          {em && (
            <span className={`text-[10px] font-semibold ${em.color}`} title={em.label}>
              {em.icon}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] font-semibold text-gray-500">{topic.subjectName}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400 truncate">{topic.chapterName}</span>
        </div>
      </div>
      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tm.bg} ${tm.color} ${tm.border}`}>
        {tm.icon} {topic.accuracy}%
      </span>
      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${pm.bg} ${pm.color} ${pm.border}`}>
        {pm.label}
      </span>
      <button
        onClick={() => onStart(topic)}
        className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors
          ${isFlash
            ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
            : "bg-orange-600 text-white hover:bg-orange-700"}`}
      >
        {isFlash ? <Zap className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
        {isFlash ? "Flash" : "Start"}
      </button>
    </div>
  );
}

function SubjectGroup({
  subjectName, topics, onStart, defaultOpen,
}: {
  subjectName: string;
  topics: IntensiveTopic[];
  onStart: (t: IntensiveTopic) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const p1Count = topics.filter(t => t.priority === "P1").length;
  const p2Count = topics.filter(t => t.priority === "P2").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <Brain className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="font-bold text-sm text-gray-900 flex-1">{subjectName}</span>
        <span className="text-xs text-gray-400">{topics.length} topics</span>
        {p1Count > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">{p1Count} urgent</span>
        )}
        {p2Count > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">{p2Count} high</span>
        )}
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="divide-y divide-gray-50">
          {topics.map(t => <TopicRow key={t.topicId} topic={t} onStart={onStart} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IntensiveRevisionSection({
  progressReport, days, examTarget, chapterWeightMap,
}: IntensiveRevisionSectionProps) {
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [sessionTopic, setSessionTopic] = useState<IntensiveTopic | null>(null);

  const phase = detectPhase(days);
  const phaseMeta = PHASE_META[phase];

  // Build the full classified topic list from progress report
  const allTopics = useMemo<IntensiveTopic[]>(() => {
    const list: IntensiveTopic[] = [];
    progressReport?.subjects.forEach(s =>
      s.chapters.forEach(c => {
        // Look up exam weightage by chapterId first, fall back to chapterName
        const rawWeight = chapterWeightMap?.get(c.chapterId ?? c.chapterName);
        const examWeight = chapterWeightMap ? classifyExamWeight(rawWeight) : undefined;
        c.topics.forEach(t => {
          if (!t.topicId) return;
          const acc  = t.bestAccuracy ?? 0;
          const tier = classifyTier(acc);
          list.push({
            topicId:     t.topicId,
            topicName:   t.topicName,
            subjectName: s.subjectName,
            chapterName: c.chapterName,
            accuracy:    acc,
            tier,
            examWeight,
            priority:    derivePriority(tier, examWeight),
            intervalDays: tierToIntervalDays(tier),
          });
        });
      })
    );
    // Sort: P1 → P2 → P3 → P4 → P5, then by accuracy asc within tier
    return list.sort((a, b) => {
      const po = a.priority.localeCompare(b.priority);
      return po !== 0 ? po : a.accuracy - b.accuracy;
    });
  }, [progressReport, chapterWeightMap]);

  // Filter by phase-allowed priorities
  const phaseTopics = useMemo(() =>
    allTopics.filter(t => phaseMeta.allowedPriorities.includes(t.priority)),
    [allTopics, phaseMeta],
  );

  // Apply tier filter from audit summary
  const visibleTopics = useMemo(() =>
    selectedTier ? phaseTopics.filter(t => t.tier === selectedTier) : phaseTopics,
    [phaseTopics, selectedTier],
  );

  // Counts for audit summary (using all topics, not phase-filtered)
  const tierCounts = useMemo<Record<Tier, number>>(() => {
    const c: Record<Tier, number> = { critical: 0, weak: 0, moderate: 0, strong: 0, mastered: 0 };
    allTopics.forEach(t => c[t.tier]++);
    return c;
  }, [allTopics]);

  // Group by subject for display
  const bySubject = useMemo(() => {
    const map = new Map<string, IntensiveTopic[]>();
    visibleTopics.forEach(t => {
      if (!map.has(t.subjectName)) map.set(t.subjectName, []);
      map.get(t.subjectName)!.push(t);
    });
    return Array.from(map.entries());
  }, [visibleTopics]);

  if (allTopics.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
        <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No topic data available yet</p>
        <p className="text-xs text-gray-400 mt-1">Complete some topics to populate the intensive revision engine.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* Phase banner */}
      <PhaseBanner phase={phase} days={days} />

      {/* Survival mode fixed schedule (Phase D) */}
      {phase === "D" && days !== null && (
        <SurvivalSchedule days={days} />
      )}

      {/* Syllabus audit */}
      <AuditSummary
        counts={tierCounts}
        total={allTopics.length}
        onSelectTier={setSelectedTier}
        selectedTier={selectedTier}
      />

      {/* Phase rules info */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
        <span>
          <strong>{phase === "D" ? "Survival: P1 only." : `Phase ${phase} shows ${phaseMeta.allowedPriorities.join(", ")}.`}</strong>
          {" "}
          {phase === "A" && "Spaced revision continues in parallel — it always takes priority over intensive slots."}
          {phase === "B" && "P4 & P5 topics are skipped — focus on fixing weak areas."}
          {phase === "C" && "Only P1-P2. Everything else is frozen until after the exam."}
          {phase === "D" && "Do not attempt new topics. Protect retention of what you already know."}
        </span>
      </div>

      {/* Topic list grouped by subject */}
      {visibleTopics.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">
            {selectedTier
              ? `No ${TIER_META[selectedTier].label} topics in Phase ${phase}`
              : `No topics to revise in Phase ${phase}`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-gray-500">{visibleTopics.length} topics</span>
            {selectedTier && (
              <button
                onClick={() => setSelectedTier(null)}
                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors"
              >
                ✕ Clear filter
              </button>
            )}
          </div>
          {bySubject.map(([subj, topics], i) => (
            <SubjectGroup
              key={subj}
              subjectName={subj}
              topics={topics}
              onStart={setSessionTopic}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}

      {/* Session modal */}
      {sessionTopic && (
        <RevisionSessionModal
          topic={{
            topicId:     sessionTopic.topicId,
            topicName:   sessionTopic.topicName,
            subjectName: sessionTopic.subjectName,
            accuracy:    sessionTopic.accuracy,
            intervalDays: sessionTopic.intervalDays,
          }}
          onClose={() => setSessionTopic(null)}
        />
      )}
    </div>
  );
}
