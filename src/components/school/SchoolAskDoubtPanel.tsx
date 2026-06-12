import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, GraduationCap, Send, ThumbsUp, ThumbsDown,
  Clock, BookOpen, CheckCircle, Loader2, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api, { unwrapSchoolData } from "@/lib/api/school-client";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

interface Props {
  recordingId: string;
  subjectId: string;
  subjectName: string;
  lectureTitle: string;
  timestampSeconds: number;
  onClose: () => void;
}

type Tab = "ai" | "teacher";

interface DoubtResponse {
  id: string;
  aiExplanation: string;
  aiSteps?: string[];
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function SchoolAskDoubtPanel({
  recordingId, subjectId, subjectName, lectureTitle, timestampSeconds, onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("ai");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DoubtResponse | null>(null);
  const [feedback, setFeedback] = useState<"helpful" | "not_helpful" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [teacherSent, setTeacherSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [responseExpanded, setResponseExpanded] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [tab]);

  const resetState = () => {
    setResponse(null);
    setFeedback(null);
    setFeedbackMsg("");
    setTeacherSent(false);
    setErrorMsg("");
    setResponseExpanded(true);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    resetState();
  };

  const handleAsk = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    resetState();
    try {
      const res = await api.post("/doubts", {
        questionText: `${text.trim()} (At segment timestamp: ${fmtTime(timestampSeconds)})`,
        subjectId: subjectId || undefined,
        subjectName: subjectName || undefined,
        recordingId,
        lectureTitle,
        timestampSeconds: Math.round(timestampSeconds || 0),
        askTeacher: false,
      });
      const result = unwrapSchoolData(res, null);
      if (result) {
        setResponse({
          id: result.id,
          aiExplanation: result.aiExplanation || "I couldn't generate a clear explanation.",
          aiSteps: result.aiSteps || [],
        });
      } else {
        throw new Error("No data returned");
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "I couldn't process your doubt right now. Please try again in a moment.");
      setResponse({
        id: "",
        aiExplanation: "I couldn't process your doubt right now. Please try again in a moment.",
        aiSteps: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskTeacher = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      await api.post("/doubts", {
        questionText: `${text.trim()} (At segment timestamp: ${fmtTime(timestampSeconds)})`,
        subjectId: subjectId || undefined,
        subjectName: subjectName || undefined,
        recordingId,
        lectureTitle,
        timestampSeconds: Math.round(timestampSeconds || 0),
        askTeacher: true,
      });
      setTeacherSent(true);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Could not send this doubt to your teacher. Please try again.");
      setTeacherSent(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!response?.id || feedback) return;
    setFeedback(helpful ? "helpful" : "not_helpful");
    try {
      await api.patch(`/doubts/${response.id}/helpful`, { isHelpful: helpful });
    } catch { /* silent */ }
    if (helpful) {
      setFeedbackMsg("Marked as helpful — glad it worked!");
    } else {
      setFeedbackMsg("Forwarding to your teacher for a detailed answer.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      tab === "ai" ? handleAsk() : handleAskTeacher();
    }
  };

  return (
    <div className="flex flex-col gap-0 text-slate-800">

      {/* ── Context Strip ── */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
          <Clock className="w-3 h-3 shrink-0" />
          {fmtTime(timestampSeconds)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full max-w-[180px]">
          <BookOpen className="w-3 h-3 shrink-0" />
          <span className="truncate">{subjectName || "General"}</span>
        </span>
      </div>

      {/* ── Tab Toggle ── */}
      <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-4 gap-1">
        {(["ai", "teacher"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all",
              tab === t
                ? t === "ai"
                  ? "bg-white text-violet-700 shadow-sm border border-violet-100"
                  : "bg-white text-blue-700 shadow-sm border border-blue-100"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t === "ai"
              ? <><Sparkles className="w-3.5 h-3.5" /> Ask AI</>
              : <><GraduationCap className="w-3.5 h-3.5" /> Ask Teacher</>
            }
          </button>
        ))}
      </div>

      {/* ── Textarea ── */}
      <div className="relative mb-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            tab === "ai"
              ? "What part of the lecture isn't clear? Be specific for a better answer…"
              : "Describe your doubt in detail so your teacher can help…"
          }
          rows={4}
          className={cn(
            "w-full resize-none rounded-xl border text-sm p-3 pr-10 leading-relaxed bg-white text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:ring-2",
            tab === "ai"
              ? "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
              : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
          )}
        />
        <span className="absolute bottom-3 right-3 text-[10px] text-slate-300 font-medium select-none pointer-events-none">
          ⌘↵
        </span>
      </div>

      {/* ── Submit Button ── */}
      <button
        onClick={tab === "ai" ? handleAsk : handleAskTeacher}
        disabled={!text.trim() || loading}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all",
          tab === "ai"
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200"
            : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md shadow-blue-200",
          (!text.trim() || loading) && "opacity-50 cursor-not-allowed shadow-none"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {tab === "ai" ? "Thinking…" : "Sending…"}
          </>
        ) : (
          <>
            {tab === "ai" ? <Sparkles className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {tab === "ai" ? "Get AI Answer" : "Send to Teacher"}
          </>
        )}
      </button>

      {errorMsg && (
        <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
          {errorMsg}
        </p>
      )}

      {/* ── AI Response ── */}
      <AnimatePresence>
        {response && tab === "ai" && (
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/60 to-white overflow-hidden"
          >
            {/* Response header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-violet-800">AI Answer</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { resetState(); textareaRef.current?.focus(); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-100 transition-all"
                  title="Ask another question"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setResponseExpanded(v => !v)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                  {responseExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {responseExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Response body */}
                  <div className="px-4 py-4 text-slate-700">
                    <MarkdownRenderer content={response.aiExplanation} className="prose-slate" />

                    {/* Steps list if present */}
                    {Array.isArray(response.aiSteps) && response.aiSteps.length > 0 && (
                      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
                        {response.aiSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* Feedback */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 pt-3 border-t border-violet-100">
                      <span className="text-[11px] text-slate-400 font-medium mr-1">Was this helpful?</span>
                      <button
                        onClick={() => handleFeedback(true)}
                        disabled={!!feedback}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          feedback === "helpful"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300",
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Yes
                      </button>
                      <button
                        onClick={() => handleFeedback(false)}
                        disabled={!!feedback}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                          feedback === "not_helpful"
                            ? "bg-red-500 text-white border-red-500 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300",
                        )}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> No
                      </button>
                      {feedbackMsg && (
                        <span className={cn(
                          "text-[11px] font-semibold ml-1",
                          feedback === "helpful" ? "text-emerald-600" : "text-slate-500",
                        )}>
                          {feedbackMsg}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Teacher Sent Confirmation ── */}
      <AnimatePresence>
        {teacherSent && tab === "teacher" && (
          <motion.div
            key="teacher-sent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-white p-5 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-blue-800 mb-1">Doubt sent successfully!</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your teacher will review and respond soon. You'll get notified in the dashboard when they reply.
            </p>
            <button
              onClick={() => { resetState(); setText(""); textareaRef.current?.focus(); }}
              className="mt-4 w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Ask another doubt
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hint ── */}
      {!response && !teacherSent && !loading && (
        <p className="text-[11px] text-slate-400 text-center mt-3">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-500">⌘</kbd>+<kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-500">↵</kbd> to submit
        </p>
      )}
    </div>
  );
}
