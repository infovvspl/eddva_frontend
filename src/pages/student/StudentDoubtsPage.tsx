import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, ThumbsUp, ThumbsDown, ChevronDown,
  Loader2, Send, AlertCircle, CheckCircle, Clock, X,
  Sparkles, User,
} from "lucide-react";
import {
  useMyDoubts, useCreateDoubt, useMarkDoubtHelpful,
  useSubjects, useChapters, useTopics,
} from "@/hooks/use-student";
import { StudentDoubt, DoubtStatus, ExplanationMode } from "@/lib/api/student";
import { toast } from "sonner";

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<DoubtStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:             { label: "Waiting",           color: "text-amber-400",   bg: "bg-amber-500/10",   icon: <Clock className="w-3 h-3" /> },
  ai_resolved:      { label: "AI Answered",       color: "text-blue-400",    bg: "bg-blue-500/10",    icon: <Sparkles className="w-3 h-3" /> },
  escalated:        { label: "Sent to Teacher",   color: "text-violet-400",  bg: "bg-violet-500/10",  icon: <User className="w-3 h-3" /> },
  teacher_resolved: { label: "Teacher Replied",   color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <CheckCircle className="w-3 h-3" /> },
};

const TABS: { key: string; label: string }[] = [
  { key: "all",             label: "All" },
  { key: "open",            label: "Pending" },
  { key: "ai_resolved",     label: "AI Answered" },
  { key: "escalated",       label: "Sent to Teacher" },
  { key: "teacher_resolved",label: "Answered" },
];

// ─── Doubt Card ───────────────────────────────────────────────────────────────

function DoubtCard({ doubt }: { doubt: StudentDoubt }) {
  const [expanded, setExpanded] = useState(false);
  const markHelpful = useMarkDoubtHelpful();
  const s = statusConfig[doubt.status];

  const subjectName = doubt.topic?.chapter?.subject?.name;
  const topicName   = doubt.topic?.name;

  const handleHelpful = (v: boolean) => {
    markHelpful.mutate({ id: doubt.id, isHelpful: v }, {
      onSuccess: () => toast.success(v ? "Marked as helpful" : "Escalated to teacher — reply expected within 4 hours"),
      onError: () => toast.error("Something went wrong"),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/20 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {doubt.questionText ?? "Image question"}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            {topicName && <span className="text-xs text-muted-foreground">{topicName}</span>}
            {subjectName && <span className="text-xs text-muted-foreground">· {subjectName}</span>}
            <span className="text-xs text-muted-foreground">
              · {new Date(doubt.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
            {s.icon} {s.label}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* AI Explanation */}
              {doubt.aiExplanation && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <p className="text-xs font-semibold text-blue-400">AI Explanation</p>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{doubt.aiExplanation}</p>
                  {doubt.aiConceptLinks && doubt.aiConceptLinks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {doubt.aiConceptLinks.map((c, i) => (
                        <span key={i} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Teacher Response */}
              {doubt.teacherResponse && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-400">Teacher's Answer</p>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{doubt.teacherResponse}</p>
                </div>
              )}

              {/* Rate AI answer */}
              {doubt.status === "ai_resolved" && doubt.isHelpful === undefined && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex-1">Was this helpful?</p>
                  <button
                    onClick={() => handleHelpful(true)}
                    disabled={markHelpful.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" /> Yes
                  </button>
                  <button
                    onClick={() => handleHelpful(false)}
                    disabled={markHelpful.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <ThumbsDown className="w-3 h-3" /> No, escalate
                  </button>
                </div>
              )}

              {doubt.isHelpful === true && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Marked as helpful
                </p>
              )}
              {doubt.isHelpful === false && (
                <p className="text-xs text-violet-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Sent to teacher
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Ask Doubt Form ───────────────────────────────────────────────────────────

function AskDoubtForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"subject" | "chapter" | "topic" | "question">("subject");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<ExplanationMode>("short");
  const [askMode, setAskMode] = useState<"ai" | "teacher">("ai");

  const { data: subjects, isLoading: subLoading } = useSubjects();
  const { data: chapters, isLoading: chLoading } = useChapters(selectedSubjectId);
  const { data: topics, isLoading: topLoading } = useTopics(selectedChapterId);
  const createDoubt = useCreateDoubt();

  const handleSubmit = () => {
    if (!selectedTopicId || !question.trim()) return;
    createDoubt.mutate(
      {
        topicId: selectedTopicId,
        questionText: question.trim(),
        source: "manual",
        explanationMode: mode,
        ...(askMode === "teacher" ? { skipAI: true } : {}),
      },
      {
        onSuccess: () => {
          toast.success(askMode === "teacher"
            ? "Sent to your teacher! They'll reply soon."
            : "Doubt submitted! AI is analyzing...");
          onClose();
        },
        onError: () => toast.error("Failed to submit. Please try again."),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">Ask a Doubt</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Ask mode toggle */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Ask</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAskMode("ai")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2
                  ${askMode === "ai"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/30 text-foreground border-border hover:bg-secondary/60"}`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask AI
              </button>
              <button
                onClick={() => setAskMode("teacher")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2
                  ${askMode === "teacher"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-secondary/30 text-foreground border-border hover:bg-secondary/60"}`}
              >
                <User className="w-3.5 h-3.5" /> Ask Teacher
              </button>
            </div>
            {askMode === "teacher" && (
              <p className="text-xs text-violet-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Your teacher will be notified directly.
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Subject</label>
            {subLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
              <div className="flex flex-wrap gap-2">
                {subjects?.map(s => (
                  <button key={s.id}
                    onClick={() => { setSelectedSubjectId(s.id); setSelectedChapterId(""); setSelectedTopicId(""); setStep("chapter"); }}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors
                      ${selectedSubjectId === s.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/30 text-foreground border-border hover:bg-secondary/60"}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chapter */}
          {selectedSubjectId && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Chapter</label>
              {chLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
                <select
                  value={selectedChapterId}
                  onChange={e => { setSelectedChapterId(e.target.value); setSelectedTopicId(""); }}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select chapter</option>
                  {chapters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Topic */}
          {selectedChapterId && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Topic</label>
              {topLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
                <select
                  value={selectedTopicId}
                  onChange={e => setSelectedTopicId(e.target.value)}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select topic</option>
                  {topics?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Question */}
          {selectedTopicId && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Your Question</label>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. Why is Carnot efficiency always less than 100%?"
                  rows={4}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Mode — only relevant for AI */}
              {askMode === "ai" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Explanation Type</label>
                  <div className="flex gap-2">
                    {(["short", "detailed"] as ExplanationMode[]).map(m => (
                      <button key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
                          ${mode === m
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/30 text-foreground border-border hover:bg-secondary/60"}`}
                      >
                        {m === "short" ? "⚡ Quick" : "📖 Detailed"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!selectedTopicId || !question.trim() || createDoubt.isPending}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {createDoubt.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            ) : askMode === "teacher" ? (
              <><User className="w-4 h-4" /> Send to Teacher</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Ask AI Now</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentDoubtsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const { data: doubts, isLoading } = useMyDoubts(statusFilter);

  const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
    if (tab.key === "all") acc[tab.key] = doubts?.length ?? 0;
    else acc[tab.key] = doubts?.filter(d => d.status === tab.key).length ?? 0;
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doubts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ask AI or your teacher</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ask Doubt
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors
              ${activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-secondary"}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !doubts?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-foreground">No doubts {activeTab !== "all" ? `in "${TABS.find(t => t.key === activeTab)?.label}"` : "yet"}</p>
          <p className="text-sm mt-1">
            {activeTab === "all" ? "Tap \"Ask Doubt\" to get instant AI help" : "Try another filter"}
          </p>
          {activeTab === "all" && (
            <button onClick={() => setShowForm(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
              Ask your first doubt
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map(d => <DoubtCard key={d.id} doubt={d} />)}
        </div>
      )}

      {/* Ask Form Modal */}
      <AnimatePresence>
        {showForm && <AskDoubtForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}