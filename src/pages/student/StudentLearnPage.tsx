import { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronDown, Lock, CheckCircle, BookOpen,
  Play, Clock, Loader2, Search, AlertCircle, Sparkles,
} from "lucide-react";
import { useSubjects, useChapters, useTopics, useProgressOverview, useStudentMe, useTopicProgress, useStudentLectures, useStudyStatus } from "@/hooks/use-student";
import { TopicStatus } from "@/lib/api/student";
import ProgressReportTree from "@/components/shared/ProgressReportTree";

// ─── helpers ─────────────────────────────────────────────────────────────────

const statusMeta: Record<TopicStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  locked:     { icon: <Lock className="w-3.5 h-3.5" />,         label: "Locked",      color: "text-slate-400",  bg: "bg-slate-500/10" },
  unlocked:   { icon: <BookOpen className="w-3.5 h-3.5" />,     label: "Not Started", color: "text-blue-400",   bg: "bg-blue-500/10" },
  in_progress:{ icon: <Play className="w-3.5 h-3.5" />,         label: "In Progress", color: "text-amber-400",  bg: "bg-amber-500/10" },
  completed:  { icon: <CheckCircle className="w-3.5 h-3.5" />,  label: "Passed",      color: "text-emerald-400",bg: "bg-emerald-500/10" },
};

const subjectColors = [
  "#6366f1", "#3b82f6", "#14b8a6", "#10b981",
  "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899",
];

// ─── Topic Row ────────────────────────────────────────────────────────────────

function TopicRow({
  topic,
  status,
  accuracy,
  batchId,
}: {
  topic: { id: string; name: string; estimatedStudyMinutes?: number };
  status: TopicStatus;
  accuracy?: number;
  batchId?: string;
}) {
  const navigate = useNavigate();
  const meta = statusMeta[status];
  const isLocked = status === "locked";

  return (
    <motion.button
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      disabled={isLocked}
      onClick={() => !isLocked && navigate(`/student/learn/topic/${topic.id}`, { state: { batchId } })}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group
        ${isLocked
          ? "border-white/5 opacity-50 cursor-not-allowed bg-card/30"
          : "border-border hover:bg-secondary/40 cursor-pointer bg-card"}`}
    >
      {/* Status icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
        <span className={meta.color}>{meta.icon}</span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
          {topic.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs ${meta.color}`}>{meta.label}</span>
          {topic.estimatedStudyMinutes && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />{topic.estimatedStudyMinutes}m
            </span>
          )}
        </div>
      </div>

      {/* Accuracy */}
      {status === "completed" && accuracy !== undefined && (
        <span className="shrink-0 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {accuracy.toFixed(0)}%
        </span>
      )}

      {!isLocked && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />}
    </motion.button>
  );
}

// ─── Chapter Accordion ────────────────────────────────────────────────────────

function ChapterAccordion({
  chapterId,
  chapterName,
  progressMap,
  batchId,
  defaultOpen = false,
}: {
  chapterId: string;
  chapterName: string;
  progressMap: Record<string, { status: TopicStatus; bestAccuracy: number }>;
  batchId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { data: topics, isLoading } = useTopics(chapterId);

  const passedCount = topics?.filter(t => progressMap[t.id]?.status === "completed").length ?? 0;
  const total = topics?.length ?? 0;

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-card hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary/60" />
          <span className="font-semibold text-sm text-foreground">{chapterName}</span>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{passedCount}/{total} done</span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-1.5 bg-secondary/10">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : topics?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No topics yet</p>
              ) : (
                topics?.map(topic => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    status={progressMap[topic.id]?.status ?? "unlocked"}
                    accuracy={progressMap[topic.id]?.bestAccuracy}
                    batchId={batchId}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subject Detail Panel ─────────────────────────────────────────────────────

function SubjectDetailPanel({
  subject,
  progressMap,
  batchId,
  onBack,
}: {
  subject: { id: string; name: string; colorCode?: string };
  progressMap: Record<string, { status: TopicStatus; bestAccuracy: number }>;
  batchId?: string;
  onBack: () => void;
}) {
  const { data: chapters, isLoading } = useChapters(subject.id);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      {/* Back header */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to subjects
      </button>

      <h2 className="text-xl font-bold text-foreground mb-1">{subject.name}</h2>
      <p className="text-sm text-muted-foreground mb-5">{chapters?.length ?? 0} chapters</p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : chapters?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No chapters available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters?.map((ch, i) => (
            <ChapterAccordion
              key={ch.id}
              chapterId={ch.id}
              chapterName={ch.name}
              progressMap={progressMap}
              batchId={batchId}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentLearnPage() {
  const [view, setView] = useState<"subjects" | "progress">("subjects");
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string; colorCode?: string } | null>(null);
  const [search, setSearch] = useState("");

  const { data: me } = useStudentMe();
  const examTarget = me?.student?.examTarget;
  const batchId = me?.student?.batchId;

  const { data: subjects, isLoading: subjectsLoading } = useSubjects(examTarget);
  const { data: progressList } = useProgressOverview();

  const progressMap = useMemo(() => {
    const m: Record<string, { status: TopicStatus; bestAccuracy: number }> = {};
    (progressList ?? []).forEach(p => {
      m[p.topicId] = { status: p.status, bestAccuracy: p.bestAccuracy };
    });
    return m;
  }, [progressList]);

  const filtered = useMemo(() =>
    (subjects ?? []).filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [subjects, search]
  );

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedSubject ? (
          <motion.div key="subjects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Learn</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {examTarget ? `${examTarget} subjects` : "All subjects"}
                </p>
              </div>
              {/* View toggle */}
              <div className="flex gap-1 bg-secondary/40 border border-border rounded-xl p-1">
                <button
                  onClick={() => setView("subjects")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${view === "subjects" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Subjects
                </button>
                <button
                  onClick={() => setView("progress")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${view === "progress" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Progress
                </button>
              </div>
            </div>

            {view === "progress" && (
              <ProgressReportTree />
            )}

            {view === "subjects" && (<>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search subjects..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {subjectsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No subjects found</p>
                <p className="text-sm mt-1">Your teacher hasn't added content yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((sub, i) => {
                  const color = sub.colorCode ?? subjectColors[i % subjectColors.length];
                  return (
                    <motion.button
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedSubject(sub)}
                      className="bg-card border border-border rounded-2xl p-5 text-left hover:bg-secondary/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: color + "22" }}>
                        <BookOpen className="w-6 h-6" style={{ color }} />
                      </div>
                      <h3 className="font-bold text-foreground text-base">{sub.name}</h3>
                      {sub.examTarget && (
                        <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">{sub.examTarget}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">Tap to explore</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
            </>)}
          </motion.div>
        ) : (
          <motion.div key="subject-detail">
            <SubjectDetailPanel
              subject={selectedSubject}
              progressMap={progressMap}
              batchId={batchId}
              onBack={() => setSelectedSubject(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Topic Detail Page ────────────────────────────────────────────────────────

export function TopicDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId ?? "";
  const location = useLocation();
  const { data: me } = useStudentMe();
  const batchId = (location.state as any)?.batchId ?? me?.student?.batchId ?? "";

  const { data: progress } = useTopicProgress(topicId);
  const { data: lectures, isLoading: lecturesLoading } = useStudentLectures(batchId, topicId);
  const { data: studyStatus } = useStudyStatus(topicId);

  const statusColors: Record<TopicStatus, string> = {
    locked: "border-red-500/30 bg-red-500/5",
    unlocked: "border-blue-500/30 bg-blue-500/5",
    in_progress: "border-amber-500/30 bg-amber-500/5",
    completed: "border-emerald-500/30 bg-emerald-500/5",
  };

  const bannerText: Record<TopicStatus, string> = {
    locked: "🔒 Complete prerequisites first to unlock this topic",
    unlocked: "📖 Score 70%+ on the quiz to unlock the next topic",
    in_progress: "⚡ Keep going! You're making progress",
    completed: `✅ Passed with ${progress?.bestAccuracy?.toFixed(0) ?? 0}% accuracy`,
  };

  const status = progress?.status ?? "unlocked";
  const hasTeacherLecture = (lectures?.length ?? 0) > 0;
  const hasAiSession = studyStatus?.hasActiveAiSession || studyStatus?.isAiSessionCompleted;
  const aiCompleted = studyStatus?.isAiSessionCompleted;

  // Quiz is unlockable when lectures exist OR the AI session is completed
  const canTakeQuiz = hasTeacherLecture || aiCompleted;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>

      {/* Gate banner */}
      <div className={`border rounded-xl px-4 py-3 mb-5 text-sm font-medium ${statusColors[status]}`}>
        {bannerText[status]}
      </div>

      {/* ── Case 1: No teacher lecture → big AI CTA ───────────────────────────── */}
      {!lecturesLoading && !hasTeacherLecture && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950/60 to-slate-900/80 border border-violet-700/40 p-6">
            {/* Glow */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/25 border border-violet-600/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base">No teacher lecture yet</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Your AI tutor can generate a personalised lesson, key concepts, formulas, and practice questions right now.
                </p>
                <button
                  onClick={() => navigate(`/student/ai-study/${topicId}`)}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-900/30"
                >
                  <Sparkles className="w-4 h-4" />
                  {hasAiSession
                    ? (aiCompleted ? "✓ Review AI Lesson" : "Resume AI Study")
                    : "Start AI Study Session"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Teacher lectures list ──────────────────────────────────────────────── */}
      {hasTeacherLecture && (
        <>
          <h2 className="text-xl font-bold text-foreground mb-1">Lectures</h2>
          <p className="text-sm text-muted-foreground mb-4">{lectures?.length ?? 0} available</p>

          <div className="space-y-3">
            {lectures?.map((lec, idx) => {
              const prog = lec.studentProgress;
              const watchPct = prog?.watchPercentage ?? 0;
              const isCompleted = prog?.isCompleted ?? false;
              const lastPos = prog?.lastPositionSeconds ?? 0;
              const isLocked = lec.isLocked ?? false;
              const fmtPos = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
              return (
                <button key={lec.id}
                  disabled={isLocked}
                  onClick={() => !isLocked && navigate(`/student/lectures/${lec.id}`)}
                  className={`w-full border rounded-2xl p-4 text-left transition-all group flex flex-col gap-3
                    ${isLocked
                      ? "bg-card/40 border-white/5 opacity-60 cursor-not-allowed"
                      : isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/25 hover:bg-secondary/30 cursor-pointer"
                        : watchPct > 0
                          ? "bg-primary/5 border-primary/25 hover:bg-secondary/30 cursor-pointer"
                          : "bg-card border-border hover:bg-secondary/30 cursor-pointer"}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                      ${isLocked ? "bg-slate-500/10" : isCompleted ? "bg-emerald-500/15" : watchPct > 0 ? "bg-primary/15" : "bg-primary/10"}`}>
                      {isLocked
                        ? <Lock className="w-5 h-5 text-slate-400" />
                        : isCompleted
                          ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                          : <Play className="w-5 h-5 text-primary" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                        {lec.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground uppercase">{lec.type}</span>
                        {lec.videoDurationSeconds && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{Math.round(lec.videoDurationSeconds / 60)}m
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Complete lecture {idx} to unlock
                          </span>
                        )}
                        {!isLocked && isCompleted && (
                          <span className="text-xs text-emerald-500 font-semibold">Completed</span>
                        )}
                        {!isLocked && !isCompleted && watchPct > 0 && (
                          <span className="text-xs text-primary font-semibold">{Math.round(watchPct)}% watched</span>
                        )}
                        {!isLocked && !isCompleted && lastPos > 10 && (
                          <span className="text-xs text-muted-foreground">· Resume at {fmtPos(lastPos)}</span>
                        )}
                        {!isLocked && watchPct === 0 && !isCompleted && (
                          <span className="text-xs text-muted-foreground">Not started</span>
                        )}
                      </div>
                    </div>

                    {!isLocked && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />}
                    {isLocked && <Lock className="w-4 h-4 text-slate-500 shrink-0" />}
                  </div>

                  {/* Progress bar */}
                  {!isLocked && watchPct > 0 && (
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${Math.min(watchPct, 100)}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* AI as "Need more help?" secondary option */}
          <div className="mt-5 flex items-center gap-3 bg-violet-950/20 border border-violet-800/25 rounded-xl px-4 py-3">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-sm text-slate-400 flex-1">
              {aiCompleted ? "AI lesson completed ✓" : "Need more help with this topic?"}
            </span>
            <button
              onClick={() => navigate(`/student/ai-study/${topicId}`)}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
            >
              {aiCompleted ? "Review" : hasAiSession ? "Resume AI" : "Try AI Study"}
            </button>
          </div>
        </>
      )}

      {/* Loading state */}
      {lecturesLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Take Quiz button */}
      <div className="mt-6">
        <button
          disabled={!canTakeQuiz}
          onClick={() => navigate(`/student/quiz?topicId=${topicId}&batchId=${batchId}`)}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all
            ${canTakeQuiz
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary/50 text-muted-foreground cursor-not-allowed"}`}
        >
          {canTakeQuiz
            ? "🎯 Take Topic Quiz"
            : "Complete a lecture or AI session to unlock the quiz"}
        </button>
      </div>

      {/* PYQ Practice button */}
      <div className="mt-3">
        <button
          onClick={() => navigate(`/student/pyq/${topicId}`)}
          className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2"
        >
          📋 Previous Year Questions
        </button>
      </div>
    </div>
  );
}