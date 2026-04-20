import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Brain, BookOpen, MessageSquare,
  FlaskConical, Loader2, CheckCircle, Send, Clock,
  ChevronDown, ChevronUp, Trophy, Lightbulb, AlertTriangle,
  Sigma, Target, Layers, Monitor, Zap, Info, ArrowRight, BrainCircuit
} from "lucide-react";
import {
  useAiStudySession, useStartAiStudy, useAskAiQuestion,
  useCompleteAiStudy, useStudyStatus,
} from "@/hooks/use-student";
import type { AiStudySessionData, AiPracticeQuestion } from "@/lib/api/student";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";

// ─── Elapsed timer ─────────────────────────────────────────────────────────────
function useElapsedTimer(running: boolean, initialSeconds = 0) {
  const [elapsed, setElapsed] = useState(initialSeconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setElapsed(initialSeconds); }, [initialSeconds]);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  return elapsed;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Markdown styles (Modernized for Aero) ──────────────────────────────────────
const mdClassBase = [
  "prose max-w-none",
  "prose-h2:font-black prose-h2:text-slate-900 prose-h2:mt-10 prose-h2:mb-5 prose-h2:tracking-tight",
  "prose-h3:font-bold prose-h3:text-slate-800 prose-h3:mt-7 prose-h3:mb-3",
  "prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-5 prose-p:font-medium",
  "prose-strong:text-slate-900 prose-strong:font-black prose-strong:bg-blue-50 prose-strong:px-1.5 prose-strong:py-0.5 prose-strong:rounded-lg",
  "prose-code:bg-slate-100 prose-code:text-blue-600 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:font-mono prose-code:font-black prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:bg-slate-900 prose-pre:text-white prose-pre:rounded-2xl prose-pre:p-6 prose-pre:shadow-xl",
  "prose-ul:text-slate-700 prose-ul:space-y-3 prose-ul:my-5",
  "prose-li:marker:text-blue-500 prose-li:marker:font-black",
  "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:rounded-2xl prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:text-slate-700 prose-blockquote:my-6",
].join(" ");

function normalizeAiMessage(message: unknown): string {
  if (typeof message === "string") {
    const trimmed = message.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return normalizeAiMessage(JSON.parse(trimmed));
      } catch {
        return message;
      }
    }
    return message;
  }
  if (message && typeof message === "object") {
    const m = message as any;
    if (typeof m.response === "string") return m.response;
    if (typeof m.answer === "string") return m.answer;
    if (typeof m.message === "string") return m.message;
    if (Array.isArray(m.hints) && m.hints.length) {
      const hints = m.hints.map((h: unknown) => `- ${String(h)}`).join("\n");
      return `Hints:\n${hints}`;
    }
    return JSON.stringify(message);
  }
  return String(message ?? "");
}

function prettifyFormula(formula: string): string {
  const toSup = (v: string) =>
    v
      .split("")
      .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
      .join("");
  const toSub = (v: string) =>
    v
      .split("")
      .map((ch) => SUBSCRIPT_MAP[ch] ?? ch)
      .join("");

  return String(formula || "")
    .replace(/\$\$/g, "")
    .replace(/\\Rightarrow/g, " ⇒ ")
    .replace(/\\rightarrow/g, " → ")
    .replace(/\\times/g, " × ")
    .replace(/\\cdot/g, " · ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\delta/g, "δ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\theta/g, "θ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\mu/g, "μ")
    .replace(/\\pi/g, "π")
    .replace(/\\sigma/g, "σ")
    .replace(/\\omega/g, "ω")
    .replace(/\^\{([^}]+)\}/g, (_m, g1) => toSup(String(g1)))
    .replace(/\^([A-Za-z0-9+\-()])/g, (_m, g1) => toSup(String(g1)))
    .replace(/_\{([^}]+)\}/g, (_m, g1) => toSub(String(g1)))
    .replace(/_([A-Za-z0-9+\-()])/g, (_m, g1) => toSub(String(g1)))
    .replace(/\\,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  n: "ⁿ", i: "ⁱ",
};

const SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ",
  l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ", r: "ᵣ",
  s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
};

function normalizeLessonMarkdown(md: string): string {
  return String(md || "");
}

function normalizeFormulaForKatex(formula: string): string {
  const raw = String(formula || "").trim();
  if (!raw) return "";
  if (raw.includes("$$") || raw.includes("$")) return raw;
  return `$$${raw}$$`;
}

function normalizeReadableText(text: string): string {
  return String(text || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    // "Cleardefinition" -> "Clear definition"
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // "cell senergy" / "ATP.Circle" -> proper spacing
    .replace(/([A-Za-z])([.:,;!?()])/g, "$1 $2")
    .replace(/([.:,;!?()])([A-Za-z])/g, "$1 $2")
    // keep math minus but add spacing around it for readability
    .replace(/\s*[-−]\s*/g, " − ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSectionMarkdown(markdown: string, headerRegex: RegExp): string {
  const src = String(markdown || "");
  const start = src.search(headerRegex);
  if (start < 0) return "";
  const rest = src.slice(start);
  const nextHeaderMatch = rest.slice(2).match(/\n##\s+/);
  if (!nextHeaderMatch) return rest.trim();
  const endIdx = 2 + (nextHeaderMatch.index ?? rest.length);
  return rest.slice(0, endIdx).trim();
}

function hasCorruptedSpacing(lines: string[]): boolean {
  return lines.some((l) => /[A-Za-z]{18,}/.test(String(l || "")));
}

// ─── Practice Question Card ──────────────────────────────────────────────────
function PracticeCard({ q, index, onAskAI }: { q: AiPracticeQuestion; index: number; onAskAI: (question: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <CardGlass className={cn("p-0 overflow-hidden transition-all duration-300 border-slate-200 bg-white shadow-sm", open ? "shadow-md" : "hover:shadow-md")}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 p-5 text-left transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
           <span className="text-[11px] font-semibold text-slate-500">Q{index + 1}</span>
        </div>
        <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug flex-1 truncate">{q.question}</p>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
           <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 pt-3 border-t border-slate-100 space-y-5">
              <div>
                <p className="text-[11px] font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                   <CheckCircle className="w-4 h-4" /> Solution Core
                </p>
                <div className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">{q.answer}</div>
              </div>
              {q.explanation && (
                <div>
                  <p className="text-[11px] font-semibold text-amber-600 mb-2 flex items-center gap-2">
                     <Lightbulb className="w-4 h-4" /> Logic Synthesis
                  </p>
                  <div className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">{q.explanation}</div>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); onAskAI(q.question); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm"
              >
                <MessageSquare className="w-4 h-4" /> Ask AI for explanation
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CardGlass>
  );
}

type Tab = "lesson" | "concepts" | "practice" | "ask";

export default function StudentAiStudyPage() {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("lesson");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notesZoom, setNotesZoom] = useState<"sm" | "md" | "lg">("md");

  const { data: session, isLoading: sessionLoading } = useAiStudySession(topicId);
  const startMut = useStartAiStudy();
  const askMut = useAskAiQuestion();
  const completeMut = useCompleteAiStudy();

  const sessionData: AiStudySessionData | undefined = session ?? startMut.data;
  const sessionId = sessionData?.id;
  const timerRunning = !!sessionId && !completed;
  const elapsed = useElapsedTimer(timerRunning, sessionData?.timeSpentSeconds ?? 0);
  const mdZoomClass = useMemo(() => {
    if (notesZoom === "sm") return "prose-h2:text-2xl prose-h3:text-base prose-p:text-sm prose-ul:text-sm prose-code:text-[12px]";
    if (notesZoom === "lg") return "prose-h2:text-4xl prose-h3:text-xl prose-p:text-lg prose-ul:text-lg prose-code:text-[15px]";
    return "prose-h2:text-3xl prose-h3:text-lg prose-p:text-base prose-ul:text-base prose-code:text-[13px]";
  }, [notesZoom]);

  useEffect(() => {
    if (!sessionLoading && !session && !startMut.isPending && !startMut.data) {
      startMut.mutate(topicId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, session, topicId]);

  useEffect(() => { if (sessionData?.isCompleted) setCompleted(true); }, [sessionData?.isCompleted]);
  useEffect(() => { if (activeTab === "ask") chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessionData?.conversation, activeTab]);

  const handleSend = useCallback(() => {
    const q = chatInput.trim();
    if (!q || !sessionId || askMut.isPending) return;
    setChatInput("");
    askMut.mutate({ topicId, sessionId, question: q });
  }, [chatInput, sessionId, topicId, askMut]);

  const handleAskAboutQuestion = useCallback((question: string) => {
    const prompt = `Explain this practice question in-depth: "${question}"`;
    setChatInput(prompt);
    setActiveTab("ask");
    setTimeout(() => { if (sessionId) { setChatInput(""); askMut.mutate({ topicId, sessionId, question: prompt }); } }, 100);
  }, [sessionId, topicId, askMut]);

  const handleComplete = useCallback(() => {
    if (!sessionId) return;
    completeMut.mutate({ topicId, sessionId, timeSpentSeconds: elapsed }, {
      onSuccess: () => { setCompleted(true); setShowComplete(false); },
    });
  }, [sessionId, topicId, elapsed, completeMut]);

  if (startMut.isPending || (sessionLoading && !session)) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
         <div className="relative mb-12">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl z-10 relative">
               <Sparkles className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
            <div className="absolute inset-0 bg-blue-100 rounded-[2.5rem] animate-ping opacity-30 z-0" />
         </div>
         <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter text-center">Neural Nexus Initializing</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse text-center">Synthesizing personalized curriculum...</p>
         </div>
      </div>
    );
  }

  if (startMut.isError) {
    return (
      <div className="py-20 flex items-center justify-center text-center">
         <div className="text-center max-w-md px-10">
            <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10 mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Link Override Failure</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">Neural link could not be established. Check sector connection.</p>
            <button onClick={() => startMut.mutate(topicId)} className="w-full py-6 rounded-3xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest">Retry Synchronization</button>
         </div>
      </div>
    );
  }

  if (!sessionData) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "lesson",   label: "Archive",    icon: <BookOpen className="w-4 h-4" /> },
    { id: "concepts", label: "Cores",      icon: <Layers className="w-4 h-4" /> },
    { id: "practice", label: "Practice Questions",  icon: <Target className="w-4 h-4" /> },
    { id: "ask",      label: "Ask AI",     icon: <BrainCircuit className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col space-y-12 pb-32">
        {/* Status Terminal */}
        <CardGlass className="px-4 sm:px-6 py-3 border-slate-200 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
           <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                 <div className="flex items-center gap-3 mb-1">
                   <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><Sparkles className="w-3 h-3" /></div>
                   <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">AI Study</span>
                 </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-none">{sessionData.topicName}</h1>
              </div>
           </div>

           <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                 <Clock className="w-4 h-4 text-slate-400" />
                 <span className="text-xs font-semibold text-slate-900 tabular-nums leading-none">{formatTime(elapsed)}</span>
              </div>
              {completed && (
                 <div className="hidden sm:flex items-center gap-2 bg-emerald-500 text-white border border-emerald-600 px-4 py-2 rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[10px] font-semibold leading-none">Completed</span>
                 </div>
              )}
           </div>
        </CardGlass>

        {/* Tab Console */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
           {tabs.map(tab => (
             <button
               key={tab.id} onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border",
                 activeTab === tab.id ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
               )}
             >
               {tab.icon} {tab.label}
               {tab.id === "ask" && sessionData.conversation.length > 0 && (
                 <span className="ml-1 w-5 h-5 rounded-md bg-blue-500 text-white flex items-center justify-center text-[9px] shadow-sm">
                   {Math.ceil(sessionData.conversation.length / 2)}
                 </span>
               )}
             </button>
           ))}
        </div>

        {/* Main Content Arena */}
        <div className="max-w-5xl mx-auto w-full">
           <AnimatePresence mode="wait">
             {activeTab === "lesson" && (
               <motion.div key="lesson" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
                  {sessionData.lessonMarkdown ? (
                    <CardGlass className="p-6 sm:p-10 border-slate-200 bg-white shadow-sm relative">
                       
                       <div className="mb-10 pb-8 border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-8">
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-100"><Monitor className="w-3.5 h-3.5" /> Study Notes</span>
                             </div>
                             <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{sessionData.topicName}</h1>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                             <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                               <button
                                 onClick={() => setNotesZoom(z => (z === "lg" ? "md" : z === "md" ? "sm" : "sm"))}
                                 className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                               >
                                 A-
                               </button>
                               <button
                                 onClick={() => setNotesZoom("md")}
                                 className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 border-x border-slate-200 hover:bg-slate-50"
                               >
                                 100%
                               </button>
                               <button
                                 onClick={() => setNotesZoom(z => (z === "sm" ? "md" : z === "md" ? "lg" : "lg"))}
                                 className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                               >
                                 A+
                               </button>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Estimated Time</p>
                                <p className="text-sm font-semibold text-slate-900">~20 mins</p>
                             </div>
                             <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center"><Info className="w-5 h-5 text-slate-400" /></div>
                          </div>
                       </div>

                       <div className={cn(mdClassBase, mdZoomClass)}>
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{sessionData.lessonMarkdown}</ReactMarkdown>
                       </div>

                       {!completed && (
                         <div className="mt-14 pt-10 border-t border-slate-100 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mb-6"><CheckCircle className="w-7 h-7" /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Finish this topic?</h3>
                            <p className="text-sm text-slate-500 mb-8">Mark complete to save progress and XP.</p>
                             <motion.button
                              whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                               onClick={() => setShowComplete(true)}
                              className="px-10 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:bg-emerald-600"
                             >
                              Mark Complete
                             </motion.button>
                          </div>
                       )}
                    </CardGlass>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/60 rounded-[3rem]">
                       <Loader2 className="w-12 h-12 animate-spin text-slate-300 mb-6" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Reconstructing Data...</p>
                    </div>
                  )}
               </motion.div>
             )}

             {activeTab === "concepts" && (
              <motion.div key="concepts" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Key Concepts */}
                     {sessionData.keyConcepts.length > 0 && (
                        <CardGlass className="p-6 border-slate-200 h-full bg-white shadow-sm">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Layers className="w-5 h-5" /></div>
                              <h3 className="text-lg font-semibold text-slate-900">Key Concepts</h3>
                           </div>
                           <div className="space-y-3">
                             {sessionData.keyConcepts.map((concept, i) => (
                               <div key={i} className="flex gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-500 shrink-0">{i+1}</div>
                                  <p className="flex-1 text-sm font-medium text-slate-700 leading-relaxed">{concept}</p>
                               </div>
                             ))}
                           </div>
                        </CardGlass>
                     )}

                     {/* Formulas & Mistakes */}
                     <div className="space-y-6">
                        {sessionData.formulas.length > 0 && (
                          <CardGlass className="p-6 border-slate-200 bg-white shadow-sm">
                             <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><Sigma className="w-5 h-5" /></div>
                                <h3 className="text-lg font-semibold text-slate-900">Formulas</h3>
                             </div>
                             <div className="space-y-3">
                               {sessionData.formulas.map((formula, i) => (
                                 <div key={i} className="p-4 rounded-xl bg-indigo-50/60 font-mono text-sm font-semibold text-indigo-700 border border-indigo-100 flex items-center gap-3">
                                    <Zap className="w-4 h-4 opacity-60 shrink-0" /> {formula}
                                 </div>
                               ))}
                             </div>
                          </CardGlass>
                        )}
                        {sessionData.commonMistakes.length > 0 && (
                          <CardGlass className="p-6 border-slate-200 bg-white shadow-sm">
                             <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
                                <h3 className="text-lg font-semibold text-slate-900">Common Mistakes</h3>
                             </div>
                             <div className="space-y-3">
                               {sessionData.commonMistakes.map((mistake, i) => (
                                 <div key={i} className="flex gap-3 p-4 rounded-xl bg-red-50/60 border border-red-100">
                                    <div className="w-7 h-7 rounded-lg bg-white border border-red-100 flex items-center justify-center text-red-500 shrink-0"><AlertTriangle className="w-3.5 h-3.5" /></div>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{mistake}</p>
                                 </div>
                               ))}
                             </div>
                          </CardGlass>
                        )}
                     </div>
                  </div>
               </motion.div>
             )}

             {activeTab === "practice" && (
               <motion.div key="practice" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
                  <div className="flex items-center gap-4 mb-4 px-1">
                     <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                        <Target className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-xl font-semibold text-slate-900">Practice Questions</h2>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{sessionData.practiceQuestions.length} questions loaded</p>
                     </div>
                  </div>
                  <div className="space-y-6">
                    {sessionData.practiceQuestions.map((q, i) => (
                      <PracticeCard key={i} q={q} index={i} onAskAI={handleAskAboutQuestion} />
                    ))}
                  </div>
               </motion.div>
             )}

             {activeTab === "ask" && (
               <motion.div key="ask" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="flex flex-col h-full min-h-[600px]">
                 <CardGlass className={cn("flex-1 p-6 sm:p-8 mb-20 flex flex-col relative bg-white border-slate-200 shadow-sm", sessionData.conversation.length === 0 ? "justify-center items-center text-center" : "")}>
                     <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
                     
                     <AnimatePresence mode="popLayout">
                        {sessionData.conversation.length === 0 ? (
                           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                              <div className="w-32 h-32 rounded-[3.5rem] bg-indigo-600/10 border border-indigo-100 flex items-center justify-center mb-10 relative">
                                 <BrainCircuit className="w-16 h-16 text-indigo-600" />
                                 <div className="absolute inset-0 bg-indigo-200 rounded-[3.5rem] blur-3xl opacity-30" />
                              </div>
                              <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Neural Query Protocol</h2>
                              <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">Ask any doubt about this topic and get AI help.</p>
                           </motion.div>
                        ) : (
                           <div className="space-y-10 pb-20">
                              {sessionData.conversation.map((msg, i) => (
                                 <motion.div key={i} initial={{ opacity: 0, x: msg.role === "student" ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                                    className={cn("flex gap-6 max-w-[85%] group", msg.role === "student" ? "ml-auto flex-row-reverse" : "mr-auto flex-row")}
                                 >
                                    <div className={cn(
                                       "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shrink-0 transition-transform group-hover:scale-110",
                                       msg.role === "ai" ? "bg-indigo-600 text-white" : "bg-slate-900 text-white"
                                    )}>
                                       {msg.role === "ai" ? <Sparkles className="w-6 h-6" /> : "ME"}
                                    </div>
                                    <div className={cn(
                                       "p-5 rounded-2xl text-sm font-medium shadow-sm relative",
                                       msg.role === "student" ? "bg-slate-900 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                                    )}>
                                       {msg.role === "ai" ? (
                                          <div className={cn(mdClassBase, "prose-h2:text-xl prose-h3:text-base prose-p:text-sm prose-ul:text-sm !prose-p:text-slate-800")}>
                                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeAiMessage(msg.message)}</ReactMarkdown>
                                          </div>
                                       ) : msg.message}
                                    </div>
                                 </motion.div>
                              ))}
                              {askMut.isPending && (
                                 <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-pulse"><Sparkles className="w-6 h-6" /></div>
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-5 flex items-center gap-2 shadow-sm">
                                       {[0, 1, 2].map(i => <motion.div key={i} className="w-3 h-3 rounded-full bg-indigo-500" animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />)}
                                    </div>
                                 </div>
                              )}
                              <div ref={chatEndRef} />
                           </div>
                        )}
                     </AnimatePresence>
                  </CardGlass>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Global Action Terminal */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-10">
           <CardGlass className="p-4 sm:p-6 border-white/60 bg-white/80 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)]">
              {activeTab === "ask" ? (
                 <div className="flex items-end gap-5">
                    <textarea
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Ask a doubt..." rows={1} disabled={askMut.isPending}
                      className="flex-1 resize-none bg-white border border-slate-100 rounded-2xl px-8 py-5 text-base font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
                      style={{ maxHeight: 200 }} />
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!chatInput.trim() || askMut.isPending}
                      className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 disabled:opacity-40 transition-all shrink-0">
                      {askMut.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </motion.button>
                 </div>
              ) : completed ? (
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
                    <div className="flex items-center gap-4">
                       <CheckCircle className="w-8 h-8 text-emerald-500" />
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Success</p>
                          <p className="text-lg font-black text-slate-900 uppercase italic">Session Synchronized</p>
                       </div>
                    </div>
                    <button onClick={() => navigate(-1)} className="px-10 py-5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3">Return to Directory <ArrowRight className="w-5 h-5" /></button>
                 </div>
              ) : (
                 <div className={cn("flex items-center gap-4 transition-all duration-500", showComplete ? "flex-row" : "flex-row-reverse")}>
                    {showComplete ? (
                       <>
                          <button onClick={() => setShowComplete(false)} className="px-8 py-4 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Abort</button>
                          <motion.button 
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                            onClick={handleComplete} disabled={completeMut.isPending}
                            className="flex-1 py-5 rounded-[1.5rem] bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3"
                          >
                            {completeMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />} Verify Sector Resolution
                          </motion.button>
                       </>
                    ) : (
                       <motion.button 
                         whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                         onClick={() => setShowComplete(true)}
                         className="w-full py-5 rounded-[1.5rem] bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3"
                       >
                         <Trophy className="w-5 h-5" /> Mark as Complete
                       </motion.button>
                    )}
                 </div>
              )}
           </CardGlass>
        </div>

        {/* XP Celebration */}
        <AnimatePresence>
           {completed && completeMut.data && completeMut.isSuccess && (
             <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }}
               className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
                <CardGlass className="px-12 py-8 bg-amber-500 border-amber-400 text-white flex items-center gap-8 shadow-[0_40px_100px_-10px_rgba(245,158,11,0.5)]">
                   <div className="w-16 h-16 rounded-3xl bg-white/20 border border-white/40 flex items-center justify-center shadow-lg"><Trophy className="w-10 h-10" /></div>
                   <div>
                      <p className="text-4xl font-black italic tracking-tighter">+{completeMut.data.xpEarned} XP</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Rank Propagation Synchronized</p>
                   </div>
                </CardGlass>
             </motion.div>
           )}
        </AnimatePresence>
    </div>
  );
}
