import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, ThumbsUp, ThumbsDown, ChevronDown,
  Loader2, CheckCircle, Clock, X, Sparkles, User,
  Brain, BookOpen, Send,
} from "lucide-react";
import {
  useMyDoubts, useCreateDoubt, useMarkDoubtHelpful,
  useRequestAiForDoubt, useMyCourses, useCourseCurriculum,
} from "@/hooks/use-student";
import { StudentDoubt, DoubtStatus } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<DoubtStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:             { label: "Waiting for Teacher", color: "#f59e0b", bg: "bg-amber-50",   icon: <Clock    className="w-3.5 h-3.5" /> },
  escalated:        { label: "In Teacher Queue",    color: "#6366f1", bg: "bg-indigo-50",  icon: <User     className="w-3.5 h-3.5" /> },
  ai_resolved:      { label: "Answered by AI",      color: "#2563eb", bg: "bg-blue-50",    icon: <Sparkles className="w-3.5 h-3.5" /> },
  teacher_resolved: { label: "Answered by Teacher", color: "#10b981", bg: "bg-emerald-50", icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const TABS = [
  { key: "all",              label: "All" },
  { key: "open",             label: "Waiting" },
  { key: "escalated",        label: "Queued" },
  { key: "ai_resolved",      label: "AI Resolved" },
  { key: "teacher_resolved", label: "Resolved" },
] as const;

// ─── Doubt Card ───────────────────────────────────────────────────────────────

function DoubtCard({ doubt }: { doubt: StudentDoubt }) {
  const [expanded, setExpanded] = useState(false);
  const markHelpful = useMarkDoubtHelpful();
  const requestAi   = useRequestAiForDoubt();

  const s = STATUS[doubt.status];
  const canAskAi = doubt.status === "open" || doubt.status === "escalated";

  return (
    <div className={cn(
      "rounded-2xl border bg-white transition-all",
      expanded ? "border-indigo-200 shadow-md" : "border-slate-100 hover:border-slate-200 shadow-sm"
    )}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-4 p-5 text-left"
      >
        {/* Icon */}
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", s.bg)}>
          <MessageSquare className="w-5 h-5" style={{ color: s.color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full", s.bg)} style={{ color: s.color }}>
              {s.icon} {s.label}
            </span>
            {doubt.topic?.chapter?.subject?.name && (
              <span className="text-[10px] text-slate-400 font-medium">
                {doubt.topic.chapter.subject.name} · {doubt.topic.name}
              </span>
            )}
          </div>
          <p className="font-semibold text-slate-800 text-sm line-clamp-2">
            {doubt.questionText || "No question text"}
          </p>
        </div>

        {/* Expand chevron */}
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="shrink-0 mt-1">
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-slate-50 pt-4">

              {/* Question */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Question</p>
                <p className="text-sm text-slate-800 font-medium leading-relaxed">{doubt.questionText}</p>
              </div>

              {/* Teacher Response */}
              {doubt.teacherResponse && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Teacher's Answer</p>
                  </div>
                  <p className="text-sm text-emerald-900 font-medium leading-relaxed">{doubt.teacherResponse}</p>
                </div>
              )}

              {/* AI Response */}
              {doubt.aiExplanation && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">AI Explanation</p>
                  </div>
                  <p className="text-sm text-blue-900 font-medium leading-relaxed whitespace-pre-line">{doubt.aiExplanation}</p>
                  {doubt.aiConceptLinks && doubt.aiConceptLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {doubt.aiConceptLinks.map((c, i) => (
                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-600">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ask AI button — shown when teacher hasn't answered yet */}
              {canAskAi && !doubt.aiExplanation && (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <Brain className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p className="text-xs text-indigo-700 font-medium flex-1">
                    Teacher hasn't answered yet. Get an instant AI explanation while you wait.
                  </p>
                  <button
                    onClick={() => requestAi.mutate(doubt.id, {
                      onSuccess: () => toast.success("AI is answering your doubt!"),
                      onError:   () => toast.error("AI unavailable right now. Try again later."),
                    })}
                    disabled={requestAi.isPending}
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {requestAi.isPending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Sparkles className="w-3.5 h-3.5" />
                    }
                    Ask AI
                  </button>
                </div>
              )}

              {/* AI helpfulness rating */}
              {doubt.status === "ai_resolved" && doubt.isHelpful === undefined && (
                <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 flex-1">Was this AI explanation helpful?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markHelpful.mutate(
                        { id: doubt.id, isHelpful: true },
                        { onSuccess: () => toast.success("Thanks for the feedback!") }
                      )}
                      disabled={markHelpful.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Yes
                    </button>
                    <button
                      onClick={() => markHelpful.mutate(
                        { id: doubt.id, isHelpful: false },
                        { onSuccess: () => toast.info("Escalated to teacher.") }
                      )}
                      disabled={markHelpful.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> No, ask teacher
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Ask Doubt Form (Modal) ───────────────────────────────────────────────────

function SelectField({ label, value, onChange, disabled, placeholder, children }: {
  label: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; placeholder: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </div>
  );
}

function AskDoubtModal({ onClose }: { onClose: () => void }) {
  const [selectedBatchId,   setSelectedBatchId]   = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedTopicId,   setSelectedTopicId]   = useState("");
  const [question, setQuestion] = useState("");

  const { data: courses = [] } = useMyCourses();
  const { data: curriculum, isLoading: curriculumLoading } = useCourseCurriculum(selectedBatchId);
  const createDoubt = useCreateDoubt();

  // Derive subject/chapter/topic lists from curriculum tree
  const subjects = curriculum?.subjects ?? [];
  const chapters = subjects.find(s => s.id === selectedSubjectId)?.chapters ?? [];
  const topics   = chapters.find(c => c.id === selectedChapterId)?.topics   ?? [];

  const canSubmit = selectedTopicId.length > 0 && question.trim().length >= 10 && !createDoubt.isPending;

  function handleBatchChange(id: string) {
    setSelectedBatchId(id);
    setSelectedSubjectId("");
    setSelectedChapterId("");
    setSelectedTopicId("");
  }
  function handleSubjectChange(id: string) {
    setSelectedSubjectId(id);
    setSelectedChapterId("");
    setSelectedTopicId("");
  }
  function handleChapterChange(id: string) {
    setSelectedChapterId(id);
    setSelectedTopicId("");
  }

  function handleSubmit() {
    if (!canSubmit) return;
    createDoubt.mutate(
      {
        topicId: selectedTopicId,
        questionText: question.trim(),
        source: "manual",
        explanationMode: "short",
        skipAI: true,
      },
      {
        onSuccess: () => {
          toast.success("Doubt sent to your teacher!");
          onClose();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to submit. Please try again.";
          toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
        },
      }
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/30 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Ask a Doubt</h3>
              <p className="text-xs text-slate-400">Your teacher will answer this for you</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* Course */}
          <SelectField
            label="Course *"
            value={selectedBatchId}
            onChange={handleBatchChange}
            placeholder="Select your course"
          >
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>

          {/* Subject */}
          <SelectField
            label="Subject *"
            value={selectedSubjectId}
            onChange={handleSubjectChange}
            disabled={!selectedBatchId || curriculumLoading}
            placeholder={
              !selectedBatchId ? "Select course first"
              : curriculumLoading ? "Loading subjects…"
              : subjects.length === 0 ? "No subjects in this course"
              : "Select subject"
            }
          >
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectField>

          {/* Chapter */}
          <SelectField
            label="Chapter *"
            value={selectedChapterId}
            onChange={handleChapterChange}
            disabled={!selectedSubjectId}
            placeholder={!selectedSubjectId ? "Select subject first" : chapters.length === 0 ? "No chapters found" : "Select chapter"}
          >
            {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>

          {/* Topic */}
          <SelectField
            label="Topic *"
            value={selectedTopicId}
            onChange={setSelectedTopicId}
            disabled={!selectedChapterId}
            placeholder={!selectedChapterId ? "Select chapter first" : topics.length === 0 ? "No topics found" : "Select topic"}
          >
            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </SelectField>

          {/* Question textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Your Question <span className="text-red-400">*</span>
            </label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Describe your doubt clearly. The more detail you provide, the better your teacher can help..."
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all resize-none"
            />
            <p className={cn("text-right text-[10px] mt-1 font-medium", question.length < 10 ? "text-slate-300" : "text-indigo-500")}>
              {question.length} chars {question.length > 0 && question.length < 10 ? "(min 10)" : ""}
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <User className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium">
              Sent directly to your teacher. No AI response until you request it from the doubt card.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          {!selectedTopicId && question.trim().length >= 10 && (
            <p className="text-xs text-red-500 font-medium mb-2 text-center">
              Please select: {!selectedBatchId ? "Course" : !selectedSubjectId ? "Subject" : !selectedChapterId ? "Chapter" : "Topic"}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
          >
            {createDoubt.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            Send to Teacher
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentDoubtsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["key"]>("all");
  const [showForm, setShowForm]   = useState(false);

  const { data: doubts = [], isLoading } = useMyDoubts(
    activeTab === "all" ? undefined : activeTab
  );

  const resolvedCount  = doubts.filter(d => d.status === "teacher_resolved" || d.status === "ai_resolved").length;
  const pendingCount   = doubts.filter(d => d.status === "open" || d.status === "escalated").length;

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-8">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-500" /> My Doubts
          </h1>
          <p className="text-slate-500 text-sm mt-1">Ask your teacher a doubt. AI backup available anytime.</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Ask a Doubt
        </button>
      </header>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-slate-900">{doubts.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">Pending</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-emerald-600">{resolvedCount}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Resolved</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === tab.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Loading your doubts…</p>
        </div>
      ) : doubts.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-600">No doubts yet</p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Click "Ask a Doubt" to send your first question to your teacher.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ask a Doubt
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map(d => <DoubtCard key={d.id} doubt={d} />)}
        </div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {showForm && <AskDoubtModal onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}
