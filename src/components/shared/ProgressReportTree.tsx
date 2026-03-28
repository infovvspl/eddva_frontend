import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, BookOpen, Video,
  FileText, Brain, CheckCircle, Lock, Circle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressReport } from "@/hooks/use-student";
import type { SubjectReportEntry, ChapterReportEntry, TopicReportEntry } from "@/lib/api/student";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed:   { label: "Completed",   color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle },
  in_progress: { label: "In Progress", color: "text-blue-500",    bg: "bg-blue-500/10",    icon: Circle },
  unlocked:    { label: "Not Started", color: "text-slate-400",   bg: "bg-slate-500/10",   icon: Circle },
  locked:      { label: "Locked",      color: "text-slate-500",   bg: "bg-slate-500/10",   icon: Lock },
};

function AccBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color ?? (pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400");
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden min-w-[40px]">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center bg-secondary/40 rounded-lg px-2.5 py-1.5 min-w-[56px]">
      <span className={cn("text-sm font-bold leading-none", color ?? "text-foreground")}>{value}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── Topic Row ────────────────────────────────────────────────────────────────

function TopicRow({ topic }: { topic: TopicReportEntry }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[topic.status] ?? STATUS_CONFIG.locked;
  const StatusIcon = cfg.icon;

  return (
    <div className="border-t border-border/60 last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
      >
        <StatusIcon className={cn("w-3.5 h-3.5 shrink-0", cfg.color)} />
        <span className="flex-1 text-sm font-medium text-foreground truncate">{topic.topicName}</span>

        {/* Compact indicators */}
        <div className="hidden sm:flex items-center gap-3 mr-2">
          {topic.bestAccuracy > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <BookOpen className="w-3 h-3 text-muted-foreground" />
              <span className={topic.bestAccuracy >= 70 ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>
                {topic.bestAccuracy}%
              </span>
            </div>
          )}
          {topic.lecture && (
            <div className="flex items-center gap-1 text-xs">
              <Video className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground font-semibold">{topic.lecture.avgWatchPct}%</span>
            </div>
          )}
          {topic.pyq && topic.pyq.attempted > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground font-semibold">{topic.pyq.accuracy}%</span>
            </div>
          )}
          {topic.aiSession?.completed && (
            <Brain className="w-3.5 h-3.5 text-violet-400" title="AI session completed" />
          )}
        </div>

        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0", cfg.bg, cfg.color, "border-current/20")}>
          {cfg.label}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/10">
              {/* Quiz */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <BookOpen className="w-3.5 h-3.5" />
                  Quiz / Gate
                </div>
                {topic.attemptCount > 0 ? (
                  <>
                    <AccBar value={topic.bestAccuracy} />
                    <p className="text-[10px] text-muted-foreground">{topic.attemptCount} attempt{topic.attemptCount !== 1 ? "s" : ""} · need {topic.gatePassPercentage}% to pass</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Not attempted</p>
                )}
              </div>

              {/* Lectures */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Video className="w-3.5 h-3.5" />
                  Lectures
                </div>
                {topic.lecture ? (
                  <>
                    <AccBar value={topic.lecture.avgWatchPct} color="bg-blue-500" />
                    <p className="text-[10px] text-muted-foreground">
                      {topic.lecture.anyCompleted ? "Completed" : "In progress"}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Not watched</p>
                )}
              </div>

              {/* PYQ */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  PYQ
                </div>
                {topic.pyq && topic.pyq.attempted > 0 ? (
                  <>
                    <AccBar value={topic.pyq.accuracy} color="bg-indigo-500" />
                    <p className="text-[10px] text-muted-foreground">{topic.pyq.attempted} attempted · {topic.pyq.correct} correct</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Not attempted</p>
                )}
              </div>

              {/* AI */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Brain className="w-3.5 h-3.5" />
                  AI Study
                </div>
                {topic.aiSession ? (
                  <span className={cn("text-xs font-medium", topic.aiSession.completed ? "text-emerald-500" : "text-blue-400")}>
                    {topic.aiSession.completed ? "Completed" : "In progress"}
                  </span>
                ) : (
                  <p className="text-xs text-muted-foreground">Not started</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Chapter Section ──────────────────────────────────────────────────────────

function ChapterSection({ chapter }: { chapter: ChapterReportEntry }) {
  const [open, setOpen] = useState(true);
  const pct = chapter.topicsTotal > 0 ? Math.round((chapter.topicsCompleted / chapter.topicsTotal) * 100) : 0;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <span className="flex-1 text-sm font-semibold text-foreground">{chapter.chapterName}</span>
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{chapter.topicsCompleted}/{chapter.topicsTotal} topics</span>
          {chapter.overallAccuracy > 0 && (
            <span className={cn("text-xs font-semibold", chapter.overallAccuracy >= 70 ? "text-emerald-500" : "text-amber-500")}>
              {chapter.overallAccuracy}% avg
            </span>
          )}
        </div>
        <div className="w-20 hidden sm:block">
          <AccBar value={pct} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.15 }} className="overflow-hidden"
          >
            {chapter.topics.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">No topics in this chapter.</p>
            ) : (
              chapter.topics.map(t => <TopicRow key={t.topicId} topic={t} />)
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────

function SubjectCard({ subject }: { subject: SubjectReportEntry }) {
  const [open, setOpen] = useState(true);
  const pct = subject.topicsTotal > 0 ? Math.round((subject.topicsCompleted / subject.topicsTotal) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Subject Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground">{subject.subjectName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subject.topicsCompleted} / {subject.topicsTotal} topics completed</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 mr-2">
          <Pill label="Accuracy" value={subject.overallAccuracy > 0 ? `${subject.overallAccuracy}%` : "—"} color={subject.overallAccuracy >= 70 ? "text-emerald-500" : subject.overallAccuracy > 0 ? "text-amber-500" : undefined} />
          <Pill label="Done" value={`${pct}%`} color={pct >= 70 ? "text-emerald-500" : undefined} />
        </div>
        <div className="w-28 hidden md:block">
          <AccBar value={pct} />
        </div>
      </button>

      {/* Chapters */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.15 }} className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 pt-1">
              {subject.chapters.map(c => (
                <ChapterSection key={c.chapterId} chapter={c} />
              ))}
              {subject.chapters.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No chapters yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Summary Bar ─────────────────────────────────────────────────────────────

function SummaryBar({ summary }: { summary: NonNullable<ReturnType<typeof useProgressReport>["data"]>["summary"] }) {
  const stats = [
    { label: "Topics Done",   value: `${summary.completedTopics}/${summary.totalTopics}`, color: "text-emerald-500" },
    { label: "Quiz Accuracy", value: summary.overallAccuracy > 0 ? `${summary.overallAccuracy}%` : "—", color: summary.overallAccuracy >= 70 ? "text-emerald-500" : summary.overallAccuracy > 0 ? "text-amber-500" : undefined },
    { label: "Lectures Done", value: summary.lecturesCompleted, color: "text-blue-500" },
    { label: "PYQ Attempted", value: summary.totalPYQAttempted, color: "text-indigo-500" },
    { label: "PYQ Accuracy",  value: summary.pyqAccuracy > 0 ? `${summary.pyqAccuracy}%` : "—", color: summary.pyqAccuracy >= 60 ? "text-emerald-500" : summary.pyqAccuracy > 0 ? "text-amber-500" : undefined },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
          <p className={cn("text-xl font-bold", s.color ?? "text-foreground")}>{s.value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ProgressReportTree({ studentId }: { studentId?: string }) {
  const { data, isLoading, isError } = useProgressReport(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Could not load progress report.</p>
      </div>
    );
  }

  if (data.subjects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No subjects found for this institute.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SummaryBar summary={data.summary} />
      {data.subjects.map(s => (
        <SubjectCard key={s.subjectId} subject={s} />
      ))}
    </div>
  );
}
