import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, ThumbsUp, ThumbsDown, ChevronDown,
  Loader2, AlertCircle, CheckCircle, Clock, X,
  Sparkles, User, Send,
} from "lucide-react";
import {
  useMyDoubts, useCreateDoubt, useMarkDoubtHelpful,
  useSubjects, useChapters, useTopics,
} from "@/hooks/use-student";
import { StudentDoubt, DoubtStatus, ExplanationMode } from "@/lib/api/student";
import { toast } from "sonner";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

// ─── Status Config ─────────────────────────────────────────────────────────────
const statusConfig: Record<DoubtStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:             { label: "Waiting",         color: "#d97706",  bg: "#FFFBEB",  icon: <Clock      className="w-3 h-3" /> },
  ai_resolved:      { label: "AI Answered",     color: BLUE_M,     bg: BLUE_L,    icon: <Sparkles   className="w-3 h-3" /> },
  escalated:        { label: "Sent to Teacher", color: "#7c3aed",  bg: "#F5F3FF",  icon: <User       className="w-3 h-3" /> },
  teacher_resolved: { label: "Teacher Replied", color: "#059669",  bg: "#ECFDF5",  icon: <CheckCircle className="w-3 h-3" /> },
};

const TABS = [
  { key: "all",              label: "All"            },
  { key: "open",             label: "Pending"        },
  { key: "ai_resolved",      label: "AI Answered"    },
  { key: "escalated",        label: "Escalated"      },
  { key: "teacher_resolved", label: "Answered"       },
];

// ─── Doubt Card ────────────────────────────────────────────────────────────────
function DoubtCard({ doubt }: { doubt: StudentDoubt }) {
  const [expanded, setExpanded] = useState(false);
  const markHelpful = useMarkDoubtHelpful();
  const s = statusConfig[doubt.status];
  const subjectName = doubt.topic?.chapter?.subject?.name;
  const topicName   = doubt.topic?.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Status accent bar */}
      <div className="h-1" style={{ background: s.color }} />

      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: s.bg, color: s.color }}
        >
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 text-left">
            {doubt.questionText ?? "Image question"}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            {topicName   && <span className="text-[11px] text-gray-400 font-medium">{topicName}</span>}
            {subjectName && <span className="text-[11px] text-gray-400">· {subjectName}</span>}
            <span className="text-[11px] text-gray-400">
              · {new Date(doubt.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl"
            style={{ color: s.color, background: s.bg }}
          >
            {s.icon} {s.label}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Expanded */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {/* AI Explanation */}
              {doubt.aiExplanation && (
                <div className="rounded-2xl p-4" style={{ background: BLUE_L, border: `1px solid ${BLUE_M}25` }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: BLUE_M }} />
                    <p className="text-xs font-black" style={{ color: BLUE }}>AI Explanation</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{doubt.aiExplanation}</p>
                  {doubt.aiConceptLinks && doubt.aiConceptLinks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {doubt.aiConceptLinks.map((c, i) => (
                        <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-xl" style={{ background: "#fff", color: BLUE }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Teacher Response */}
              {doubt.teacherResponse && (
                <div className="rounded-2xl p-4 bg-green-50 border border-green-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <User className="w-3.5 h-3.5 text-green-600" />
                    <p className="text-xs font-black text-green-700">Teacher's Answer</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{doubt.teacherResponse}</p>
                </div>
              )}

              {/* Rate */}
              {doubt.status === "ai_resolved" && doubt.isHelpful === undefined && (
                <div className="flex items-center gap-3 pt-1">
                  <p className="text-xs text-gray-400 flex-1">Was this helpful?</p>
                  <button
                    onClick={() => markHelpful.mutate({ id: doubt.id, isHelpful: true }, {
                      onSuccess: () => toast.success("Marked as helpful"),
                      onError: () => toast.error("Something went wrong"),
                    })}
                    disabled={markHelpful.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Yes
                  </button>
                  <button
                    onClick={() => markHelpful.mutate({ id: doubt.id, isHelpful: false }, {
                      onSuccess: () => toast.info("Escalated to teacher"),
                      onError: () => toast.error("Something went wrong"),
                    })}
                    disabled={markHelpful.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> No, escalate
                  </button>
                </div>
              )}
              {doubt.isHelpful === true  && <p className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Marked as helpful</p>}
              {doubt.isHelpful === false && <p className="text-xs text-violet-500 font-semibold flex items-center gap-1"><User className="w-3 h-3" /> Sent to teacher</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Ask Doubt Form ────────────────────────────────────────────────────────────
function AskDoubtForm({ onClose }: { onClose: () => void }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedTopicId, setSelectedTopicId]     = useState("");
  const [question, setQuestion]                   = useState("");
  const [mode, setMode]                           = useState<ExplanationMode>("short");
  const [askMode, setAskMode]                     = useState<"ai" | "teacher">("ai");

  const { data: subjects, isLoading: subLoading } = useSubjects();
  const { data: chapters, isLoading: chLoading }  = useChapters(selectedSubjectId);
  const { data: topics, isLoading: topLoading }   = useTopics(selectedChapterId);
  const createDoubt = useCreateDoubt();

  const selClass = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Ask a Doubt</h3>
            <p className="text-xs text-gray-400">Get instant AI help or ask your teacher</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Ask Mode Toggle */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Ask</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "ai"      as const, label: "Ask AI",      icon: <Sparkles className="w-4 h-4" />, activeColor: BLUE },
                { val: "teacher" as const, label: "Ask Teacher",  icon: <User     className="w-4 h-4" />, activeColor: "#7c3aed" },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setAskMode(opt.val)}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border transition-all"
                  style={askMode === opt.val
                    ? { background: opt.activeColor, color: "#fff", borderColor: opt.activeColor, boxShadow: `0 4px 12px ${opt.activeColor}30` }
                    : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
            {askMode === "teacher" && (
              <p className="text-xs text-violet-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Your teacher will be notified directly.
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Subject</label>
            {subLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : (
              <div className="flex flex-wrap gap-2">
                {subjects?.map(s => (
                  <button key={s.id}
                    onClick={() => { setSelectedSubjectId(s.id); setSelectedChapterId(""); setSelectedTopicId(""); }}
                    className="px-3.5 py-2 rounded-xl text-sm font-bold border transition-all"
                    style={selectedSubjectId === s.id
                      ? { background: BLUE, color: "#fff", borderColor: BLUE }
                      : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSubjectId && (
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Chapter</label>
              {chLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : (
                <select value={selectedChapterId}
                  onChange={e => { setSelectedChapterId(e.target.value); setSelectedTopicId(""); }}
                  className={selClass}>
                  <option value="">Select chapter</option>
                  {chapters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
          )}

          {selectedChapterId && (
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Topic</label>
              {topLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : (
                <select value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)} className={selClass}>
                  <option value="">Select topic</option>
                  {topics?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
          )}

          {selectedTopicId && (
            <>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Your Question</label>
                <textarea
                  value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. Why is Carnot efficiency always less than 100%?"
                  rows={4}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>
              {askMode === "ai" && (
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Explanation Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["short", "detailed"] as ExplanationMode[]).map(m => (
                      <button key={m}
                        onClick={() => setMode(m)}
                        className="py-2.5 rounded-xl text-sm font-bold border transition-all"
                        style={mode === m
                          ? { background: BLUE_L, color: BLUE, borderColor: BLUE }
                          : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}
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
        <div className="px-6 py-4 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!selectedTopicId || !question.trim()) return;
              createDoubt.mutate(
                { topicId: selectedTopicId, questionText: question.trim(), source: "manual", explanationMode: mode, ...(askMode === "teacher" ? { skipAI: true } : {}) },
                {
                  onSuccess: () => { toast.success(askMode === "teacher" ? "Sent to your teacher!" : "Doubt submitted! AI is analyzing..."); onClose(); },
                  onError: () => toast.error("Failed to submit. Please try again."),
                }
              );
            }}
            disabled={!selectedTopicId || !question.trim() || createDoubt.isPending}
            className="w-full py-3.5 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: askMode === "ai" ? `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` : "linear-gradient(135deg, #7c3aed, #9333ea)", boxShadow: `0 4px 16px ${askMode === "ai" ? BLUE : "#7c3aed"}30` }}
          >
            {createDoubt.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              : askMode === "teacher"
              ? <><User className="w-4 h-4" /> Send to Teacher</>
              : <><Sparkles className="w-4 h-4" /> Ask AI Now</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentDoubtsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm]   = useState(false);
  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const { data: doubts, isLoading } = useMyDoubts(statusFilter);

  const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
    if (tab.key === "all") acc[tab.key] = doubts?.length ?? 0;
    else acc[tab.key] = doubts?.filter(d => d.status === tab.key).length ?? 0;
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-5 sm:p-6" style={{ background: "#F5F7FB" }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 60%, #0388d1 100%)` }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-5" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-black text-white">Doubts</h1>
              </div>
              <p className="text-white/60 text-sm font-medium">Ask AI or your teacher — get answers fast</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-sm font-black shadow-lg hover:shadow-xl transition-shadow"
              style={{ color: BLUE }}
            >
              <Plus className="w-4 h-4" /> Ask Doubt
            </motion.button>
          </div>
        </motion.div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(tab => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.key)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all"
              style={activeTab === tab.key
                ? { background: BLUE, color: "#fff", boxShadow: `0 4px 12px ${BLUE}30` }
                : { background: "#fff", color: "#9CA3AF", border: "1px solid #E5E7EB" }}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                  style={activeTab === tab.key ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: BLUE_L, color: BLUE }}
                >
                  {counts[tab.key]}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
            <p className="text-sm text-gray-400 font-medium">Loading doubts…</p>
          </div>
        ) : !doubts?.length ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: BLUE_L }}>
              <MessageSquare className="w-8 h-8" style={{ color: BLUE }} />
            </div>
            <p className="font-black text-gray-800 text-base">
              No doubts {activeTab !== "all" ? `in "${TABS.find(t => t.key === activeTab)?.label}"` : "yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === "all" ? "Tap \"Ask Doubt\" to get instant AI help" : "Try another filter"}
            </p>
            {activeTab === "all" && (
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ background: BLUE, boxShadow: `0 4px 16px ${BLUE}30` }}
              >
                <Plus className="w-4 h-4" /> Ask your first doubt
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {doubts.map(d => <DoubtCard key={d.id} doubt={d} />)}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && <AskDoubtForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}