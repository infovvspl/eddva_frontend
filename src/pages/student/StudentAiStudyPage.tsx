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
  Loader2, CheckCircle, Send, Clock,
  ChevronDown, Trophy, Lightbulb, AlertTriangle,
  Sigma, Monitor, Zap, Info, ArrowRight, BrainCircuit, Highlighter, StickyNote,
  X
} from "lucide-react";
import {
  useAiStudySession, useStartAiStudy, useAskAiQuestion,
  useCompleteAiStudy,
} from "@/hooks/use-student";
import type { AiStudySessionData, AiPracticeQuestion } from "@/lib/api/student";
import { CardGlass } from "@/components/shared/CardGlass";
import { useIsCompactLayout } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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


function normalizeLessonMarkdown(md: string): string {
  return String(md || "")
    // Unescape double-escaped backslashes from JSON payloads
    .replace(/\\\\/g, "\\")
    // Convert LaTeX bracket math to markdown math delimiters
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_m, inner) => `\n\n$$${inner}$$\n\n`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_m, inner) => `$${inner}$`)
    // If AI emits "Formula: <latex-like expression>" without delimiters, wrap it
    .replace(
      /(^|\n)\s*(Formula|Equation)\s*:\s*([^\n]+)/gi,
      (_m, prefix, label, expr) => {
        const e = String(expr || "").trim();
        const looksMath = /[=+\-*/^]|\\[a-zA-Z]+|[Δδαβγθλμπσω]/.test(e);
        if (!looksMath) return `${prefix}${label}: ${e}`;
        return `${prefix}${label}: $$${e}$$`;
      },
    )
    // User requested removing "Core Concepts/Cores" section from rendered notes.
    .replace(/\n##\s*.*Core Concepts[\s\S]*?(?=\n##\s+|$)/gi, "\n");
}

function normalizeFormulaForKatex(formula: string): string {
  const raw = String(formula || "")
    .replace(/\u200B/g, "")
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    // Common AI output form: F_action -> F_{action}
    .replace(/([A-Za-z])_([A-Za-z]{2,})\b/g, "$1_{$2}")
    // Keep KaTeX happy when escaped text is emitted without braces.
    .replace(/\\text\s+([A-Za-z]+)/g, "\\text{$1}")
    .replace(/\s+/g, " ")
    .trim();
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

type SavedHighlight = { text: string; color: string };
type InlineComment = { id: string; text: string; quote: string; top: number };

function storageKey(kind: "highlights" | "notes" | "inline-comments", topicId: string): string {
  return `ai-study-${kind}-${topicId}`;
}

function NotesFlashcard({
  question,
  answer,
  explanation,
  flipped,
  onToggle,
}: {
  question: string;
  answer: string;
  explanation?: string;
  flipped: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative min-h-[180px] transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className="absolute inset-0 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 mb-3">Question</p>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">{question}</p>
          <p className="text-[11px] text-slate-500 mt-4">Click to reveal answer</p>
        </div>
        <div
          className="absolute inset-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm overflow-auto"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">Answer</p>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">{answer}</p>
          {explanation && <p className="text-xs text-slate-600 mt-3 leading-relaxed">{explanation}</p>}
          <p className="text-[11px] text-slate-500 mt-3">Click to flip back</p>
        </div>
      </div>
    </button>
  );
}

function StudyMetric({
  icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", accentClass)}>
          {icon}
        </div>
      </div>
    </div>
  );
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

type Tab = "lesson" | "ask";

export default function StudentAiStudyPage() {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("lesson");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [notesZoom, setNotesZoom] = useState<"sm" | "md" | "lg">("md");
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  const [noteDraft, setNoteDraft] = useState("");
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);
  const [activeInlineCommentId, setActiveInlineCommentId] = useState<string | null>(null);
  const [toolPanel, setToolPanel] = useState<"highlights" | "notes" | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [flashcardDoubtInput, setFlashcardDoubtInput] = useState("");
  const notesContentRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const savedTextRef = useRef<string>("");
  const isCompactLayout = useIsCompactLayout();

  const { data: session, isLoading: sessionLoading } = useAiStudySession(topicId);
  const startMut = useStartAiStudy();
  const askMut = useAskAiQuestion();
  const completeMut = useCompleteAiStudy();

  const sessionData: AiStudySessionData | undefined = session ?? startMut.data;
  const sessionId = sessionData?.id;
  const timerRunning = !!sessionId && !completed;
  const elapsed = useElapsedTimer(timerRunning, sessionData?.timeSpentSeconds ?? 0);
  const normalizedLessonMarkdown = useMemo(
    () => normalizeLessonMarkdown(sessionData?.lessonMarkdown ?? ""),
    [sessionData?.lessonMarkdown],
  );
  const mdZoomClass = useMemo(() => {
    if (notesZoom === "sm") return "prose-h2:text-2xl prose-h3:text-base prose-p:text-sm prose-ul:text-sm prose-code:text-[12px]";
    if (notesZoom === "lg") return "prose-h2:text-4xl prose-h3:text-xl prose-p:text-lg prose-ul:text-lg prose-code:text-[15px]";
    return "prose-h2:text-3xl prose-h3:text-lg prose-p:text-base prose-ul:text-base prose-code:text-[13px]";
  }, [notesZoom]);
  const lessonWordCount = useMemo(
    () => normalizedLessonMarkdown.replace(/[#>*_`-]/g, " ").split(/\s+/).filter(Boolean).length,
    [normalizedLessonMarkdown],
  );
  const estimatedLessonMinutes = useMemo(
    () => Math.max(6, Math.round(lessonWordCount / 170) || 0),
    [lessonWordCount],
  );
  const quickAskPrompts = useMemo(() => {
    const prompts = [
      ...(sessionData?.keyConcepts ?? []).slice(0, 2).map((concept) => `Explain ${normalizeReadableText(concept)} in simple words.`),
      ...(sessionData?.commonMistakes ?? []).slice(0, 1).map((mistake) => `Why do students make this mistake: ${normalizeReadableText(mistake)}?`),
      ...(sessionData?.practiceQuestions ?? []).slice(0, 1).map((question) => `Walk me through this practice question step by step: "${question.question}"`),
    ];
    return Array.from(new Set(prompts)).slice(0, isCompactLayout ? 3 : 4);
  }, [isCompactLayout, sessionData?.commonMistakes, sessionData?.keyConcepts, sessionData?.practiceQuestions]);

  useEffect(() => {
    if (!sessionLoading && !session && !startMut.isPending && !startMut.data) {
      startMut.mutate(topicId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, session, topicId]);

  useEffect(() => { if (sessionData?.isCompleted) setCompleted(true); }, [sessionData?.isCompleted]);
  useEffect(() => { if (activeTab === "ask") chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessionData?.conversation, activeTab]);
  useEffect(() => {
    if (!topicId) return;
    try {
      const h = localStorage.getItem(storageKey("highlights", topicId));
      const c = localStorage.getItem(storageKey("inline-comments", topicId));
      setHighlights(h ? JSON.parse(h) : []);
      setInlineComments(c ? JSON.parse(c) : []);
    } catch {
      setHighlights([]);
      setInlineComments([]);
    }
  }, [topicId]);

  useEffect(() => {
    if (!topicId) return;
    localStorage.setItem(storageKey("highlights", topicId), JSON.stringify(highlights));
  }, [topicId, highlights]);

  useEffect(() => {
    if (!topicId) return;
    localStorage.setItem(storageKey("inline-comments", topicId), JSON.stringify(inlineComments));
  }, [topicId, inlineComments]);

  // Track the user's current selection inside the notes so clicking panel buttons
  // doesn't drop it. We save a cloned Range + its text on every valid selectionchange.
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const root = notesContentRef.current;
      if (!root) return;
      const anchor = sel.anchorNode;
      if (!anchor || !root.contains(anchor)) return;
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      savedTextRef.current = sel.toString().trim().replace(/\s+/g, " ");
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  // After markdown + KaTeX finish rendering, re-apply saved highlights once. We skip
  // any text nodes inside KaTeX output so we don't corrupt math rendering.
  useEffect(() => {
    if (activeTab !== "lesson") return;
    const root = notesContentRef.current;
    if (!root || !sessionData?.lessonMarkdown) return;
    const timer = setTimeout(() => {
      highlights.forEach((h) => {
        if (!h.text) return;
        const already = Array.from(root.querySelectorAll("mark[data-user-highlight='1']"));
        if (already.some((el) => (el.textContent || "").includes(h.text))) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            let parent: HTMLElement | null = (node.parentElement as HTMLElement) || null;
            while (parent && parent !== root) {
              if (parent.classList && (parent.classList.contains("katex") || parent.classList.contains("katex-html") || parent.classList.contains("katex-mathml"))) {
                return NodeFilter.FILTER_REJECT;
              }
              if (parent.tagName === "MARK") return NodeFilter.FILTER_REJECT;
              parent = parent.parentElement;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        } as NodeFilter);
        let node = walker.nextNode();
        while (node) {
          const nv = node.nodeValue || "";
          const idx = nv.indexOf(h.text);
          if (idx >= 0) {
            try {
              const range = document.createRange();
              range.setStart(node, idx);
              range.setEnd(node, idx + h.text.length);
              const mark = document.createElement("mark");
              mark.setAttribute("data-user-highlight", "1");
              mark.style.backgroundColor = h.color;
              mark.style.padding = "0 1px";
              range.surroundContents(mark);
            } catch {
              /* boundary-crossing match — skip */
            }
            break;
          }
          node = walker.nextNode();
        }
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [activeTab, sessionData?.lessonMarkdown, highlights]);

  const handleSend = useCallback(() => {
    const q = chatInput.trim();
    if (!q || !sessionId || askMut.isPending) return;
    setChatInput("");
    askMut.mutate({ topicId, sessionId, question: q });
  }, [chatInput, sessionId, topicId, askMut]);

  const handleFlashcardDoubtAsk = useCallback(() => {
    const q = flashcardDoubtInput.trim();
    if (!q || !sessionId || askMut.isPending) return;
    askMut.mutate(
      { topicId, sessionId, question: q },
      { onSuccess: () => setFlashcardDoubtInput("") },
    );
  }, [flashcardDoubtInput, sessionId, askMut, topicId]);

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

  // Get the range/text the user most recently selected inside the notes, falling
  // back to the saved ref when focus has moved to the tool panel (buttons/textarea).
  const getActiveNotesRange = useCallback((): { range: Range; text: string } | null => {
    const notesRoot = notesContentRef.current;
    if (!notesRoot) return null;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const anchor = selection.anchorNode;
      if (anchor && notesRoot.contains(anchor)) {
        const text = selection.toString().trim().replace(/\s+/g, " ");
        if (text) return { range: selection.getRangeAt(0).cloneRange(), text };
      }
    }
    if (savedRangeRef.current && savedTextRef.current) {
      return { range: savedRangeRef.current.cloneRange(), text: savedTextRef.current };
    }
    return null;
  }, []);

  const handleCaptureHighlight = useCallback(() => {
    const active = getActiveNotesRange();
    if (!active) return;
    const { range, text: selectedText } = active;

    const mark = document.createElement("mark");
    mark.setAttribute("data-user-highlight", "1");
    mark.style.backgroundColor = highlightColor;
    mark.style.padding = "0 1px";
    try {
      range.surroundContents(mark);
    } catch {
      try {
        const extracted = range.extractContents();
        mark.appendChild(extracted);
        range.insertNode(mark);
      } catch {
        /* boundary-crossing selection — skip DOM wrap, still save in sidebar */
      }
    }

    setHighlights((prev) => [{ text: selectedText, color: highlightColor }, ...prev].slice(0, 30));
    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    savedTextRef.current = "";
  }, [highlightColor, getActiveNotesRange]);

  const handleAddInlineComment = useCallback(() => {
    const text = noteDraft.trim();
    if (!text) return;
    const active = getActiveNotesRange();
    if (!active) return;
    const { range, text: selectedText } = active;
    const notesRoot = notesContentRef.current;
    if (!notesRoot) return;

    const rect = range.getBoundingClientRect();
    const rootRect = notesRoot.getBoundingClientRect();
    const top = Math.max(0, rect.top - rootRect.top + notesRoot.scrollTop);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setInlineComments((prev) => [{ id, text, quote: selectedText, top }, ...prev].slice(0, 50));
    setActiveInlineCommentId(id);
    setNoteDraft("");
    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    savedTextRef.current = "";
  }, [noteDraft, getActiveNotesRange]);

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
    { id: "lesson",   label: "Notes",    icon: <BookOpen className="w-4 h-4" /> },
    { id: "ask",      label: "Ask AI",     icon: <BrainCircuit className="w-4 h-4" /> },
  ];

  return (
    <div className="relative pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_48%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(255,255,255,0.96)_100%)]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <CardGlass className="overflow-hidden border-slate-200/80 bg-white/90 p-5 shadow-sm sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4 sm:gap-5">
                <button
                  onClick={() => navigate(-1)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Study Session
                    </span>
                    {completed && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-500">Topic Workspace</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                      {sessionData.topicName || "AI Study"}
                    </h1>
                  </div>

                  <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                    Learn from structured notes, save your own highlights and comments, practice key questions,
                    and ask the AI whenever a concept still feels unclear.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
                <StudyMetric
                  label="Time"
                  value={formatTime(elapsed)}
                  icon={<Clock className="h-5 w-5 text-blue-700" />}
                  accentClass="bg-blue-50 text-blue-700"
                />
                <StudyMetric
                  label="Concepts"
                  value={String(sessionData.keyConcepts.length || 0)}
                  icon={<Lightbulb className="h-5 w-5 text-amber-700" />}
                  accentClass="bg-amber-50 text-amber-700"
                />
                <StudyMetric
                  label="Formulas"
                  value={String(sessionData.formulas.length || 0)}
                  icon={<Sigma className="h-5 w-5 text-emerald-700" />}
                  accentClass="bg-emerald-50 text-emerald-700"
                />
                <StudyMetric
                  label="Practice"
                  value={String(sessionData.practiceQuestions.length || 0)}
                  icon={<Brain className="h-5 w-5 text-violet-700" />}
                  accentClass="bg-violet-50 text-violet-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                      activeTab === tab.id
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50",
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.id === "ask" && sessionData.conversation.length > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-bold text-current">
                        {Math.ceil(sessionData.conversation.length / 2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="hidden h-5 w-px bg-slate-200 sm:block" />

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                  Estimated reading time: ~{estimatedLessonMinutes} min
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                  {lessonWordCount.toLocaleString()} words
                </span>
              </div>
            </div>
          </div>
        </CardGlass>

        <AnimatePresence mode="wait">
          {activeTab === "lesson" ? (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
            >
              <div className="space-y-6">
                {normalizedLessonMarkdown ? (
                  <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm sm:p-8">
                    <div className="mb-8 flex flex-col gap-5 border-b border-slate-200/80 pb-6 md:flex-row md:items-end md:justify-between">
                      <div className="space-y-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                          <Monitor className="h-3.5 w-3.5" />
                          Guided Notes
                        </span>
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Study the notes carefully
                          </h2>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            Use zoom controls for comfortable reading, then annotate the parts you want to revise later.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
                          <button
                            onClick={() => setNotesZoom((z) => (z === "lg" ? "md" : z === "md" ? "sm" : "sm"))}
                            className="px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            A-
                          </button>
                          <button
                            onClick={() => setNotesZoom("md")}
                            className="border-x border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                          >
                            100%
                          </button>
                          <button
                            onClick={() => setNotesZoom((z) => (z === "sm" ? "md" : z === "md" ? "lg" : "lg"))}
                            className="px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            A+
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFlashcardIndex(0);
                            setFlashcardFlipped(false);
                            setShowFlashcards(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <Brain className="h-4 w-4" />
                          Flashcards
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      {!isCompactLayout &&
                        inlineComments.map((comment) => (
                          <button
                            key={comment.id}
                            type="button"
                            onClick={() => {
                              setActiveInlineCommentId(comment.id);
                              setToolPanel("notes");
                            }}
                            className={cn(
                              "absolute right-0 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors",
                              activeInlineCommentId === comment.id
                                ? "border-blue-300 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700",
                            )}
                            style={{ top: comment.top }}
                            title={comment.text}
                          >
                            <StickyNote className="h-4 w-4" />
                          </button>
                        ))}

                      <div ref={notesContentRef} className={cn("relative pr-0 lg:pr-12", mdClassBase, mdZoomClass)}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {normalizedLessonMarkdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </CardGlass>
                ) : (
                  <CardGlass className="border-slate-200/80 bg-white/92 p-10 text-center shadow-sm">
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Generating your lesson notes...</p>
                  </CardGlass>
                )}

                {!!sessionData.practiceQuestions.length && (
                  <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Practice questions</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Review worked examples, then ask the AI for a deeper explanation when needed.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("ask")}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
                      >
                        Open AI chat
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4">
                      {sessionData.practiceQuestions.map((question, index) => (
                        <PracticeCard key={`${question.question}-${index}`} q={question} index={index} onAskAI={handleAskAboutQuestion} />
                      ))}
                    </div>
                  </CardGlass>
                )}
              </div>

              <div className="space-y-6 lg:sticky lg:top-24">
                <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Study toolkit</h3>
                      <p className="mt-1 text-sm text-slate-500">Keep your revision notes and highlights beside the lesson.</p>
                    </div>
                    <Info className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setToolPanel((value) => (value === "highlights" ? null : "highlights"))}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors",
                        toolPanel === "highlights"
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50",
                      )}
                    >
                      <Highlighter className="h-4 w-4" />
                      Highlight
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setToolPanel((value) => (value === "notes" ? null : "notes"))}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors",
                        toolPanel === "notes"
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50",
                      )}
                    >
                      <StickyNote className="h-4 w-4" />
                      Comment
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFlashcardIndex(0);
                        setFlashcardFlipped(false);
                        setShowFlashcards(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Brain className="h-4 w-4" />
                      Cards
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {toolPanel === "highlights" && (
                      <motion.div
                        key="highlight-panel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-5 rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-4"
                        onMouseDown={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") e.preventDefault();
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">Highlighter</h4>
                          {savedTextRef.current && <span className="text-[11px] font-medium text-emerald-600">Selection ready</span>}
                        </div>
                        <p className="mt-2 text-[12px] leading-5 text-slate-600">
                          Select any line in the notes, choose a color, then save it as a highlight for later revision.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          {["#fef08a", "#bfdbfe", "#bbf7d0", "#fecaca", "#e9d5ff"].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setHighlightColor(color)}
                              className={cn(
                                "h-8 w-8 rounded-full border-2 transition-transform",
                                highlightColor === color ? "scale-110 border-slate-900" : "border-white",
                              )}
                              style={{ backgroundColor: color }}
                              title="Pick highlight color"
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleCaptureHighlight}
                          className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                        >
                          Save highlight
                        </button>

                        <div className="mt-4 space-y-2">
                          {highlights.length === 0 ? (
                            <p className="text-xs text-slate-400">No highlights yet.</p>
                          ) : (
                            highlights.map((highlight, index) => (
                              <div
                                key={`${highlight.text}-${index}`}
                                className="rounded-xl border px-3 py-2 text-xs font-medium text-slate-700"
                                style={{ backgroundColor: highlight.color, borderColor: highlight.color }}
                              >
                                {highlight.text}
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}

                    {toolPanel === "notes" && (
                      <motion.div
                        key="notes-panel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-5 rounded-[1.5rem] border border-blue-100 bg-blue-50/70 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">Comments</h4>
                          {savedTextRef.current && <span className="text-[11px] font-medium text-emerald-600">Selection ready</span>}
                        </div>
                        <p className="mt-2 text-[12px] leading-5 text-slate-600">
                          Select a line from the notes, add your own reminder, and jump back to it from here later.
                        </p>

                        {savedTextRef.current && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-[11px] italic text-slate-600">
                            "{savedTextRef.current.slice(0, 120)}{savedTextRef.current.length > 120 ? "…" : ""}"
                          </div>
                        )}

                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Write your comment..."
                          rows={3}
                          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleAddInlineComment}
                          disabled={!noteDraft.trim()}
                          className="mt-3 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                        >
                          Add comment
                        </button>

                        <div className="mt-4 space-y-2">
                          {inlineComments.length === 0 ? (
                            <p className="text-xs text-slate-400">No comments yet.</p>
                          ) : (
                            inlineComments.map((comment) => (
                              <button
                                key={comment.id}
                                type="button"
                                onClick={() => setActiveInlineCommentId(comment.id)}
                                className={cn(
                                  "w-full rounded-xl border px-3 py-3 text-left text-xs font-medium transition-colors",
                                  activeInlineCommentId === comment.id
                                    ? "border-blue-200 bg-white text-blue-900"
                                    : "border-slate-200 bg-white/80 text-slate-700 hover:border-blue-100",
                                )}
                              >
                                <p className="truncate font-semibold">{comment.quote}</p>
                                <p className="mt-1 leading-5">{comment.text}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!toolPanel && (
                    <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-500">
                      Your highlights and comments stay on this device, so you can come back to the same notes and pick up where you left off.
                    </div>
                  )}
                </CardGlass>

                {!!sessionData.keyConcepts.length && (
                  <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Key concepts</h3>
                        <p className="text-sm text-slate-500">The most important ideas to remember from this topic.</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {sessionData.keyConcepts.map((concept, index) => (
                        <button
                          key={`${concept}-${index}`}
                          type="button"
                          onClick={() => handleAskAboutQuestion(`Explain this concept clearly with one example: ${normalizeReadableText(concept)}`)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
                        >
                          {normalizeReadableText(concept)}
                        </button>
                      ))}
                    </div>
                  </CardGlass>
                )}

                {!!sessionData.formulas.length && (
                  <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Sigma className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Formula board</h3>
                        <p className="text-sm text-slate-500">Important expressions collected for quick revision.</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {sessionData.formulas.map((formula, index) => (
                        <div key={`${formula}-${index}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <div className={cn(mdClassBase, "prose-p:mb-0 prose-p:text-sm prose-code:text-xs prose-h2:text-xl prose-h3:text-base")}>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {normalizeFormulaForKatex(formula)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardGlass>
                )}

                {!!sessionData.commonMistakes.length && (
                  <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Common mistakes</h3>
                        <p className="text-sm text-slate-500">Watch these while revising and solving questions.</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {sessionData.commonMistakes.map((mistake, index) => (
                        <button
                          key={`${mistake}-${index}`}
                          type="button"
                          onClick={() => handleAskAboutQuestion(`How do I avoid this mistake in exams: ${normalizeReadableText(mistake)}?`)}
                          className="w-full rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-rose-100/70"
                        >
                          {normalizeReadableText(mistake)}
                        </button>
                      ))}
                    </div>
                  </CardGlass>
                )}

                <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Session progress</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {completed
                          ? "This topic is marked complete."
                          : "Finish the topic once you are confident with the notes and practice questions."}
                      </p>
                    </div>
                    <div className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl",
                      completed ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700",
                    )}>
                      {completed ? <CheckCircle className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
                    </div>
                  </div>

                  {completed ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-800">Topic completed successfully</p>
                        <p className="mt-1 text-sm text-emerald-700">
                          {completeMut.data?.xpEarned
                            ? `You just earned +${completeMut.data.xpEarned} XP for this session.`
                            : "Your progress has been saved and synced to your study roadmap."}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(-1)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        Back to previous page
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : showComplete ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">Ready to complete this topic?</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Confirm only after you are comfortable with the concepts, formulas, and practice set.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowComplete(false)}
                          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Not yet
                        </button>
                        <button
                          onClick={handleComplete}
                          disabled={completeMut.isPending}
                          className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {completeMut.isPending ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Confirm complete
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      <button
                        onClick={() => setShowComplete(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        <Trophy className="h-4 w-4" />
                        Mark topic complete
                      </button>
                      <button
                        onClick={() => setActiveTab("ask")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Ask AI before finishing
                      </button>
                    </div>
                  )}
                </CardGlass>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
            >
              <CardGlass className="overflow-hidden border-slate-200/80 bg-white/92 p-0 shadow-sm">
                <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Ask the AI tutor</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Ask for concept clarification, solution steps, shortcuts, or common mistakes for this topic.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                      <BrainCircuit className="h-4 w-4 text-blue-600" />
                      {sessionData.conversation.length ? `${Math.ceil(sessionData.conversation.length / 2)} doubts asked` : "No doubts asked yet"}
                    </div>
                  </div>
                </div>

                <div className="flex min-h-[620px] flex-col">
                  <div className={cn("flex-1 p-4 sm:p-6", sessionData.conversation.length === 0 ? "flex items-center justify-center" : "overflow-y-auto")}>
                    <AnimatePresence mode="popLayout">
                      {sessionData.conversation.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mx-auto max-w-lg text-center"
                        >
                          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-blue-50 text-blue-700 shadow-sm">
                            <BrainCircuit className="h-10 w-10" />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900">Start with your first question</h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            Try asking for a simpler explanation, a worked numerical example, or a quick revision summary.
                          </p>
                        </motion.div>
                      ) : (
                        <div className="space-y-6">
                          {sessionData.conversation.map((msg, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: msg.role === "student" ? 18 : -18 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "flex gap-3 sm:gap-4",
                                msg.role === "student" ? "justify-end" : "justify-start",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex max-w-[92%] gap-3 sm:max-w-[80%]",
                                  msg.role === "student" ? "flex-row-reverse" : "flex-row",
                                )}
                              >
                                <div
                                  className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm",
                                    msg.role === "ai" ? "bg-blue-600" : "bg-slate-900",
                                  )}
                                >
                                  {msg.role === "ai" ? <Sparkles className="h-5 w-5" /> : "ME"}
                                </div>
                                <div
                                  className={cn(
                                    "rounded-[1.75rem] px-4 py-3 shadow-sm sm:px-5 sm:py-4",
                                    msg.role === "student"
                                      ? "rounded-tr-md bg-slate-900 text-white"
                                      : "rounded-tl-md border border-slate-200 bg-white text-slate-800",
                                  )}
                                >
                                  {msg.role === "ai" ? (
                                    <div className={cn(mdClassBase, "prose-h2:text-xl prose-h3:text-base prose-p:text-sm prose-ul:text-sm !prose-p:text-slate-800")}>
                                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {normalizeAiMessage(msg.message)}
                                      </ReactMarkdown>
                                    </div>
                                  ) : (
                                    <p className="text-sm leading-6">{msg.message}</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}

                          {askMut.isPending && (
                            <div className="flex justify-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div className="flex items-center gap-2 rounded-[1.75rem] rounded-tl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="h-2.5 w-2.5 rounded-full bg-blue-500"
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.18 }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/95 p-4 backdrop-blur sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Ask a doubt about this topic..."
                        rows={isCompactLayout ? 3 : 2}
                        disabled={askMut.isPending}
                        className="min-h-[96px] flex-1 resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!chatInput.trim() || askMut.isPending}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40 sm:h-[96px] sm:w-[96px] sm:flex-col"
                      >
                        {askMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardGlass>

              <div className="space-y-6 lg:sticky lg:top-24">
                <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">Suggested prompts</h3>
                  <p className="mt-1 text-sm text-slate-500">Use one of these to start quickly.</p>

                  <div className="mt-4 space-y-2">
                    {quickAskPrompts.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        Ask for summaries, shortcuts, solved examples, or revision help.
                      </p>
                    ) : (
                      quickAskPrompts.map((prompt, index) => (
                        <button
                          key={`${prompt}-${index}`}
                          type="button"
                          onClick={() => setChatInput(prompt)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
                        >
                          {prompt}
                        </button>
                      ))
                    )}
                  </div>
                </CardGlass>

                {!!sessionData.practiceQuestions.length && (
                  <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900">Practice question help</h3>
                    <p className="mt-1 text-sm text-slate-500">Jump from a question directly into an explanation.</p>

                    <div className="mt-4 space-y-2">
                      {sessionData.practiceQuestions.slice(0, 4).map((question, index) => (
                        <button
                          key={`${question.question}-${index}`}
                          type="button"
                          onClick={() => handleAskAboutQuestion(question.question)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Question {index + 1}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {question.question}
                          </p>
                        </button>
                      ))}
                    </div>
                  </CardGlass>
                )}

                <CardGlass className="border-slate-200/80 bg-white/92 p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">Session progress</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {completed ? "This topic is already complete." : "You can still ask a few more doubts before marking it complete."}
                  </p>

                  {completed ? (
                    <div className="mt-5 space-y-3">
                      <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                        Session saved. Revisit the notes anytime for revision.
                      </div>
                      <button
                        onClick={() => navigate(-1)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        Back to previous page
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : showComplete ? (
                    <div className="mt-5 space-y-3">
                      <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                        You are about to finish this session and save your progress.
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowComplete(false)}
                          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleComplete}
                          disabled={completeMut.isPending}
                          className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {completeMut.isPending ? "Saving..." : "Confirm"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      <button
                        onClick={() => setShowComplete(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        <Trophy className="h-4 w-4" />
                        Mark topic complete
                      </button>
                      <button
                        onClick={() => setActiveTab("lesson")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
                      >
                        <BookOpen className="h-4 w-4" />
                        Back to notes
                      </button>
                    </div>
                  )}
                </CardGlass>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFlashcards && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
              onClick={() => setShowFlashcards(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="w-full max-w-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <CardGlass className="relative border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
                  <button
                    type="button"
                    onClick={() => setShowFlashcards(false)}
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Flashcards</h3>
                      <p className="text-sm text-slate-500">Flip through quick revision cards for this topic.</p>
                    </div>
                  </div>

                  {sessionData.practiceQuestions.length === 0 ? (
                    <div className="py-16 text-center text-sm text-slate-500">No flashcards available for this topic yet.</div>
                  ) : (() => {
                    const total = sessionData.practiceQuestions.length;
                    const safeIndex = Math.min(flashcardIndex, total - 1);
                    const card = sessionData.practiceQuestions[safeIndex];
                    return (
                      <div className="mt-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Card {safeIndex + 1} of {total}
                          </span>
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${((safeIndex + 1) / total) * 100}%` }}
                            />
                          </div>
                        </div>

                        <NotesFlashcard
                          question={card.question}
                          answer={card.answer}
                          explanation={card.explanation}
                          flipped={flashcardFlipped}
                          onToggle={() => setFlashcardFlipped((f) => !f)}
                        />

                        <div className="mt-6 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setFlashcardFlipped(false);
                              setFlashcardIndex((index) => (index - 1 + total) % total);
                            }}
                            disabled={total <= 1}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFlashcardFlipped(false);
                              setFlashcardIndex((index) => (index + 1) % total);
                            }}
                            disabled={total <= 1}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
                          >
                            Next
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-5 rounded-[1.5rem] border border-blue-100 bg-blue-50/70 p-4">
                          <div className="mb-2 text-sm font-semibold text-blue-800">Doubt box</div>
                          <div className="mb-3 max-h-32 space-y-2 overflow-y-auto">
                            {sessionData.conversation.length ? (
                              sessionData.conversation.slice(-3).map((msg, index) => (
                                <div
                                  key={`${msg.timestamp}-${index}`}
                                  className={cn(
                                    "rounded-xl px-3 py-2 text-[11px]",
                                    msg.role === "student" ? "bg-white text-slate-700" : "bg-blue-100 text-blue-900",
                                  )}
                                >
                                  {normalizeAiMessage(msg.message)}
                                </div>
                              ))
                            ) : (
                              <p className="text-[11px] text-slate-500">Ask your doubt here while revising flashcards.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={flashcardDoubtInput}
                              onChange={(e) => setFlashcardDoubtInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleFlashcardDoubtAsk();
                                }
                              }}
                              placeholder="Ask your doubt..."
                              className="flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs"
                            />
                            <button
                              type="button"
                              onClick={handleFlashcardDoubtAsk}
                              disabled={!flashcardDoubtInput.trim() || askMut.isPending || !sessionId}
                              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {askMut.isPending ? "Asking..." : "Ask"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardGlass>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {completed && completeMut.data && completeMut.isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="fixed left-1/2 top-24 z-[100] -translate-x-1/2 pointer-events-none"
            >
              <CardGlass className="flex items-center gap-6 border-amber-300 bg-amber-500 px-8 py-5 text-white shadow-[0_32px_80px_-18px_rgba(245,158,11,0.55)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/40 bg-white/20">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight">+{completeMut.data.xpEarned} XP</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">Progress synced</p>
                </div>
              </CardGlass>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
