import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Brain, BookOpen, MessageSquare,
  FlaskConical, Loader2, CheckCircle, Send, Clock,
  ChevronDown, ChevronUp, Trophy, Lightbulb, AlertTriangle,
  Sigma,
} from "lucide-react";
import {
  useAiStudySession, useStartAiStudy, useAskAiQuestion,
  useCompleteAiStudy, useStudyStatus,
} from "@/hooks/use-student";
import type { AiStudySessionData, AiPracticeQuestion } from "@/lib/api/student";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getStoredLanguage, sarvamTranslate, sarvamTranslateMany } from "@/lib/api/sarvam";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

// ─── Elapsed timer ─────────────────────────────────────────────────────────────

function useElapsedTimer(running: boolean, initialSeconds = 0) {
  const [elapsed, setElapsed] = useState(initialSeconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setElapsed(initialSeconds);
  }, [initialSeconds]);

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

// ─── Markdown styles ────────────────────────────────────────────────────────────

const mdClass = [
  "prose max-w-none",
  // Headings
  "prose-h1:text-2xl prose-h1:font-black prose-h1:text-gray-900 prose-h1:mb-6 prose-h1:mt-0 prose-h1:pb-3 prose-h1:border-b prose-h1:border-gray-100",
  "prose-h2:text-xl prose-h2:font-black prose-h2:text-gray-900 prose-h2:mt-10 prose-h2:mb-4",
  "prose-h3:text-base prose-h3:font-bold prose-h3:text-gray-900 prose-h3:mt-6 prose-h3:mb-3",
  "prose-h4:text-sm prose-h4:font-bold prose-h4:text-gray-700 prose-h4:mt-4 prose-h4:mb-2",
  // Paragraphs
  "prose-p:text-gray-700 prose-p:leading-8 prose-p:mb-5 prose-p:text-[15px] prose-p:font-medium",
  // Bold / Italic
  "prose-strong:text-gray-900 prose-strong:font-black",
  "prose-em:text-violet-700 prose-em:not-italic prose-em:font-bold prose-em:bg-violet-50 prose-em:px-1.5 prose-em:py-0.5 prose-em:rounded",
  // Code
  "prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:text-[13px] prose-code:font-mono prose-code:border prose-code:border-gray-200 prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-2xl prose-pre:p-5",
  // Lists
  "prose-ul:text-gray-700 prose-ul:font-medium prose-ul:space-y-2 prose-ul:my-4 prose-ul:text-[15px]",
  "prose-ol:text-gray-700 prose-ol:font-medium prose-ol:space-y-2 prose-ol:my-4 prose-ol:text-[15px]",
  "prose-li:leading-7 prose-li:pl-1",
  "prose-li:marker:text-blue-500 prose-li:marker:font-black",
  // Blockquote
  "prose-blockquote:border-l-4 prose-blockquote:border-violet-500 prose-blockquote:bg-violet-50 prose-blockquote:rounded-r-xl prose-blockquote:px-5 prose-blockquote:py-4 prose-blockquote:text-gray-700 prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:my-5",
  // Tables
  "prose-table:text-[14px] prose-thead:bg-gray-50 prose-th:text-gray-900 prose-th:font-black prose-th:px-4 prose-th:py-3 prose-th:border-b-2 prose-th:border-gray-200 prose-td:text-gray-700 prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-gray-100 prose-td:font-medium",
  // HR
  "prose-hr:border-gray-100 prose-hr:my-8",
  // Links
  "prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:text-blue-700 hover:prose-a:underline",
].join(" ");

// ─── Practice question card ─────────────────────────────────────────────────────

function PracticeCard({ q, index, onAskAI }: { q: AiPracticeQuestion; index: number; onAskAI: (question: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mt-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ background: BLUE_L, color: BLUE }}>
            Q{index + 1}
          </span>
          <p className="text-sm text-gray-900 font-bold leading-relaxed">{q.question}</p>
        </div>
        <div className="shrink-0 mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-gray-50">
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-4 bg-gray-50/50">
              <div className="pt-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Answer</p>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-sm text-gray-800 font-medium leading-relaxed">{q.answer}</div>
              </div>
              {q.explanation && (
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Explanation</p>
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-sm text-gray-700 font-medium leading-relaxed">{q.explanation}</div>
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onAskAI(q.question); }}
                className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-3 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 text-sm font-bold transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Ask AI to explain in detail
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Tab types ──────────────────────────────────────────────────────────────────

type Tab = "lesson" | "concepts" | "practice" | "ask";

// ─── Main page ──────────────────────────────────────────────────────────────────

export default function StudentAiStudyPage() {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("lesson");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completed, setCompleted] = useState(false);

  // ── Translation ───────────────────────────────────────────────────────────────
  const [lang, setLang] = useState(getStoredLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLesson, setTranslatedLesson] = useState<string | null>(null);
  const [translatedConcepts, setTranslatedConcepts] = useState<string[]>([]);
  const [translatedMistakes, setTranslatedMistakes] = useState<string[]>([]);
  const [translatedQuestions, setTranslatedQuestions] = useState<AiPracticeQuestion[]>([]);

  // ── Data fetching ─────────────────────────────────────────────────────────────
  const { data: status } = useStudyStatus(topicId);
  const { data: session, isLoading: sessionLoading } = useAiStudySession(topicId);

  const startMut = useStartAiStudy();
  const askMut = useAskAiQuestion();
  const completeMut = useCompleteAiStudy();

  const sessionData: AiStudySessionData | undefined = startMut.data ?? session;
  const sessionId = sessionData?.id;
  const timerRunning = !!sessionId && !completed;
  const elapsed = useElapsedTimer(timerRunning, sessionData?.timeSpentSeconds ?? 0);

  useEffect(() => {
    if (!sessionLoading && !session && !startMut.isPending && !startMut.data) {
      startMut.mutate(topicId);
    }
  }, [sessionLoading, session, topicId]);

  useEffect(() => {
    if (sessionData?.isCompleted) setCompleted(true);
  }, [sessionData?.isCompleted]);

  useEffect(() => {
    if (activeTab === "ask") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionData?.conversation, activeTab]);

  // Translate content when language changes or session loads
  useEffect(() => {
    if (!sessionData || lang === "en-IN") {
      setTranslatedLesson(null);
      setTranslatedConcepts([]);
      setTranslatedMistakes([]);
      setTranslatedQuestions([]);
      return;
    }
    let cancelled = false;
    setIsTranslating(true);
    (async () => {
      try {
        const conceptsAndMistakes = [...sessionData.keyConcepts, ...sessionData.commonMistakes];
        const [lesson, cmTranslated] = await Promise.all([
          sessionData.lessonMarkdown
            ? sarvamTranslate(sessionData.lessonMarkdown, lang)
            : Promise.resolve(""),
          sarvamTranslateMany(conceptsAndMistakes, lang),
        ]);
        if (cancelled) return;
        setTranslatedLesson(lesson || null);
        setTranslatedConcepts(cmTranslated.slice(0, sessionData.keyConcepts.length));
        setTranslatedMistakes(cmTranslated.slice(sessionData.keyConcepts.length));

        const qAll = sessionData.practiceQuestions.flatMap(q =>
          q.explanation ? [q.question, q.answer, q.explanation] : [q.question, q.answer]
        );
        const qTranslated = await sarvamTranslateMany(qAll, lang);
        if (cancelled) return;
        let idx = 0;
        setTranslatedQuestions(
          sessionData.practiceQuestions.map(q => {
            const tq = qTranslated[idx++] ?? q.question;
            const ta = qTranslated[idx++] ?? q.answer;
            const te = q.explanation ? (qTranslated[idx++] ?? q.explanation) : q.explanation;
            return { ...q, question: tq, answer: ta, explanation: te };
          })
        );
      } catch {
        setLang("en-IN");
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lang, sessionData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const q = chatInput.trim();
    if (!q || !sessionId || askMut.isPending) return;
    setChatInput("");
    askMut.mutate({ topicId, sessionId, question: q });
  }, [chatInput, sessionId, topicId, askMut]);

  const handleAskAboutQuestion = useCallback((question: string) => {
    const prompt = `Please explain this practice question in detail and walk me through how to solve it step by step:\n\n"${question}"`;
    setChatInput(prompt);
    setActiveTab("ask");
    setTimeout(() => {
      if (sessionId) {
        setChatInput("");
        askMut.mutate({ topicId, sessionId, question: prompt });
      }
    }, 100);
  }, [sessionId, topicId, askMut]);

  const handleComplete = useCallback(() => {
    if (!sessionId) return;
    completeMut.mutate(
      { topicId, sessionId, timeSpentSeconds: elapsed },
      {
        onSuccess: (res) => {
          setCompleted(true);
          setShowComplete(false);
          void res;
        },
      },
    );
  }, [sessionId, topicId, elapsed, completeMut]);

  // ── Loading / starting ───────────────────────────────────────────────────────

  const isStarting = startMut.isPending || (sessionLoading && !session);

  if (isStarting) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-white border border-gray-100 flex items-center justify-center shadow-sm z-10 relative">
            <Sparkles className="w-12 h-12 text-violet-500 animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-violet-100 rounded-3xl animate-ping opacity-50 z-0" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-gray-900">Generating your AI lesson…</h2>
          <p className="text-sm font-medium text-gray-500">Crafting a personalised study session just for you</p>
        </div>
      </div>
    );
  }

  if (startMut.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-2" />
        <p className="text-gray-900 font-black text-xl">Failed to start AI study session</p>
        <p className="text-sm font-medium text-gray-500 max-w-sm">{(startMut.error as any)?.message ?? "Please check your connection and try again"}</p>
        <button
          onClick={() => startMut.mutate(topicId)}
          className="mt-4 px-8 py-3.5 rounded-2xl text-white text-sm font-black transition-all shadow-md"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sessionData) return null;

  const displayLesson = translatedLesson ?? sessionData.lessonMarkdown;
  const displayConcepts = translatedConcepts.length > 0 ? translatedConcepts : sessionData.keyConcepts;
  const displayMistakes = translatedMistakes.length > 0 ? translatedMistakes : sessionData.commonMistakes;
  const displayQuestions = translatedQuestions.length > 0 ? translatedQuestions : sessionData.practiceQuestions;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "lesson",   label: "Lesson",    icon: <BookOpen className="w-4 h-4" /> },
    { id: "concepts", label: "Concepts",  icon: <Brain className="w-4 h-4" /> },
    { id: "practice", label: "Practice",  icon: <FlaskConical className="w-4 h-4" /> },
    { id: "ask",      label: "Ask AI",    icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F7FB" }}>
      {/* ── Top header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center border border-violet-100 shrink-0">
                <Sparkles className="w-4 h-4 text-violet-500" />
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="text-sm font-black text-gray-900 truncate">{sessionData.topicName}</span>
                <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest truncate">AI Study Session</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-mono font-black text-gray-700">{formatTime(elapsed)}</span>
            </div>
            {completed && (
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">Done</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0 pt-1 border-b border-transparent">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-all whitespace-nowrap border-b-2 relative -mb-0.5 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === "ask" && sessionData.conversation.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-black">
                    {Math.ceil(sessionData.conversation.length / 2)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-36">
          <AnimatePresence mode="wait">

            {/* ── LESSON TAB ─────────────────────────────────────────────────────── */}
            {activeTab === "lesson" && (
              <motion.div key="lesson" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {sessionData.lessonMarkdown ? (
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm">
                    {/* Topic hero */}
                    <div className="mb-8 pb-8 border-b border-gray-100">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-100 px-3 py-1 rounded-lg text-[10px] font-black text-violet-600 uppercase tracking-widest">
                          <Sparkles className="w-3 h-3" /> AI-Generated Lesson
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-widest">
                          <BookOpen className="w-3 h-3" /> Comprehensive Material
                        </span>
                      </div>
                      <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">{sessionData.topicName}</h1>
                      <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> ~15–25 min read</span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1.5"><Brain className="w-4 h-4" /> Concepts & Examples</span>
                      </div>
                    </div>

                    <div className={mdClass}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h2: ({ children }) => <h2 className="flex items-center gap-2 text-xl font-black text-gray-900 mt-12 mb-5 pb-3 border-b border-gray-100">{children}</h2>,
                          blockquote: ({ children }) => <blockquote className="my-6 px-5 py-4 bg-violet-50 border-l-4 border-violet-500 rounded-r-2xl font-medium text-gray-800">{children}</blockquote>,
                          code: ({ inline, children, ...props }: any) =>
                            inline ? <code className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-lg text-[13px] font-mono font-bold border border-gray-200 mx-0.5" {...props}>{children}</code>
                                   : <pre className="bg-gray-50 border border-gray-200 rounded-2xl p-5 overflow-x-auto my-6"><code className="text-gray-800 text-[13px] font-mono leading-relaxed font-semibold" {...props}>{children}</code></pre>,
                          strong: ({ children }) => <strong className="font-black text-gray-900 bg-yellow-50 px-1 py-0.5 rounded-md">{children}</strong>,
                          hr: () => <hr className="border-gray-100 my-10" />,
                        }}
                      >
                       {sessionData.lessonMarkdown}
                      </ReactMarkdown>
                    </div>

                    {/* End of lesson CTA */}
                    <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-2 shadow-sm relative">
                        <CheckCircle className="w-8 h-8 text-emerald-500 relative z-10" />
                        <div className="absolute inset-0 bg-emerald-100 rounded-3xl opacity-50 blur-xl" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-gray-900 mb-1">Finished reading?</p>
                        <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">Review key concepts for a quick summary, then test yourself with practice questions.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab("concepts")}
                          className="px-6 py-3.5 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 text-sm font-black hover:border-violet-300 hover:bg-violet-50 transition-all shadow-sm">
                          View Concepts
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab("practice")}
                          className="px-6 py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-600 transition-all shadow-md">
                          Start Practice
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white border border-gray-100 rounded-3xl shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-gray-300" />
                    <p className="font-bold text-sm tracking-wide uppercase">Generating Lesson Content</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── CONCEPTS TAB ───────────────────────────────────────────────────── */}
            {activeTab === "concepts" && (
              <motion.div key="concepts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                 <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                   {/* Key Concepts */}
                   {sessionData.keyConcepts.length > 0 && (
                     <section className="mb-10 last:mb-0">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner">
                           <Lightbulb className="w-5 h-5 text-blue-500" />
                         </div>
                         <h3 className="font-black text-gray-900 text-xl">Key Concepts</h3>
                       </div>
                       <div className="space-y-3">
                         {sessionData.keyConcepts.map((concept, i) => (
                           <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                             className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5 hover:bg-blue-50 hover:border-blue-100 transition-colors group">
                             <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600">
                               <span className="text-xs font-black">{i + 1}</span>
                             </div>
                             <p className="text-sm font-medium text-gray-800 leading-relaxed pt-0.5">{concept}</p>
                           </motion.div>
                         ))}
                       </div>
                     </section>
                   )}

                   {/* Formulas */}
                   {sessionData.formulas.length > 0 && (
                     <section className="mb-10 last:mb-0">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shadow-inner">
                           <Sigma className="w-5 h-5 text-violet-600" />
                         </div>
                         <h3 className="font-black text-gray-900 text-xl">Formulas</h3>
                       </div>
                       <div className="space-y-3">
                         {sessionData.formulas.map((formula, i) => (
                           <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                             className="bg-violet-50 text-violet-700 border border-violet-100 rounded-2xl p-4 sm:p-5 font-mono text-sm font-bold shadow-inner flex items-center gap-3">
                             <FlaskConical className="w-4 h-4 opacity-50 shrink-0" />
                             {formula}
                           </motion.div>
                         ))}
                       </div>
                     </section>
                   )}

                   {/* Common Mistakes */}
                   {sessionData.commonMistakes.length > 0 && (
                     <section>
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-inner">
                           <AlertTriangle className="w-5 h-5 text-amber-500" />
                         </div>
                         <h3 className="font-black text-gray-900 text-xl">Common Mistakes</h3>
                       </div>
                       <div className="space-y-3">
                         {sessionData.commonMistakes.map((mistake, i) => (
                           <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                             className="flex items-start gap-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 sm:p-5">
                             <div className="w-7 h-7 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 shadow-sm text-amber-500">
                               <AlertTriangle className="w-4 h-4" />
                             </div>
                             <p className="text-sm font-medium text-gray-800 leading-relaxed pt-1">{mistake}</p>
                           </motion.div>
                         ))}
                       </div>
                     </section>
                   )}

                   {sessionData.keyConcepts.length === 0 && sessionData.formulas.length === 0 && sessionData.commonMistakes.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                       <Brain className="w-12 h-12 mb-4 opacity-20" />
                       <p className="font-bold text-sm tracking-wide uppercase">No concepts extracted yet</p>
                     </div>
                   )}
                 </div>
              </motion.div>
            )}

            {/* ── PRACTICE TAB ───────────────────────────────────────────────────── */}
            {activeTab === "practice" && (
              <motion.div key="practice" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner">
                    <FlaskConical className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-xl">Practice Questions</h3>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{sessionData.practiceQuestions.length} Questions Available</p>
                  </div>
                </div>

                {sessionData.practiceQuestions.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-3xl flex flex-col items-center justify-center py-24 text-gray-400 shadow-sm">
                    <FlaskConical className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold text-sm tracking-wide uppercase">No practice questions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionData.practiceQuestions.map((q, i) => (
                      <PracticeCard key={i} q={q} index={i} onAskAI={handleAskAboutQuestion} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ASK AI TAB ──────────────────────────────────────────────────────── */}
            {activeTab === "ask" && (
              <motion.div key="ask" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col">
                <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                  <div className="space-y-6 pb-2">
                    {sessionData.conversation.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-6 shadow-inner relative">
                          <MessageSquare className="w-10 h-10 text-violet-500 relative z-10" />
                          <div className="absolute inset-0 bg-violet-200 rounded-3xl blur-xl opacity-40 z-0" />
                        </div>
                        <p className="font-black text-xl text-gray-900 mb-2">Ask your AI tutor anything</p>
                        <p className="text-sm font-medium text-gray-500 max-w-sm">Got questions about this topic or need a concept explained differently? I'm here to help.</p>
                      </div>
                    )}

                     {sessionData.conversation.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className={`flex gap-4 max-w-[90%] ${msg.role === "student" ? "ml-auto flex-row-reverse" : "mr-auto flex-row"}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-xs font-black shadow-sm ${
                          msg.role === "ai" ? "bg-violet-50 border border-violet-200 text-violet-600" : "bg-blue-600 border border-blue-700 text-white"
                        }`}>
                          {msg.role === "ai" ? <Sparkles className="w-5 h-5" /> : "Me"}
                        </div>

                        <div className={`rounded-3xl px-5 py-4 text-sm font-medium leading-relaxed shadow-sm ${
                          msg.role === "student"
                            ? "bg-blue-600 text-white rounded-tr-md shadow-blue-600/20"
                            : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-md"
                        }`}>
                          {msg.role === "ai" ? (
                            <div className={`${mdClass} !prose-sm`}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message}</ReactMarkdown>
                            </div>
                          ) : msg.message}
                        </div>
                      </motion.div>
                    ))}

                    {askMut.isPending && (
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center shadow-sm">
                          <Sparkles className="w-5 h-5 text-violet-500" />
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-3xl rounded-tl-md px-5 py-4 flex items-center gap-2 shadow-sm">
                          {[0, 1, 2].map(i => (
                            <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-violet-400"
                              animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4">
          {activeTab === "ask" ? (
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask your AI tutor a question…" rows={1} disabled={askMut.isPending}
                  className="w-full resize-none bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 pr-12 text-sm text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-bold focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                  style={{ maxHeight: 120 }} />
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={!chatInput.trim() || askMut.isPending}
                className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
                {askMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </motion.button>
            </div>
          ) : completed ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-xl">
                 <CheckCircle className="w-5 h-5" />
                 <span className="text-sm font-black uppercase tracking-widest">Session Completed</span>
              </div>
              {completeMut.data && (
                 <div className="flex items-center gap-2 bg-amber-50 text-amber-600 border border-amber-100 px-4 py-2 rounded-xl">
                   <Trophy className="w-5 h-5" />
                   <span className="text-sm font-black uppercase tracking-widest">+{completeMut.data.xpEarned} XP</span>
                 </div>
              )}
            </div>
          ) : showComplete ? (
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-2 sm:pl-5 shadow-inner">
               <p className="flex-1 text-sm font-black text-gray-700 hidden sm:block">Mark this session as complete?</p>
               <button onClick={() => setShowComplete(false)} className="px-5 py-2.5 rounded-xl text-sm font-black text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors">Cancel</button>
               <button onClick={handleComplete} disabled={completeMut.isPending} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-black shadow-md hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                 {completeMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
               </button>
            </div>
          ) : (
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setShowComplete(true)}
              className="w-full py-4 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all"
              style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}>
              <CheckCircle className="w-5 h-5" /> Mark Session Complete
            </motion.button>
          )}
        </div>
      </div>

      {/* ── XP celebration overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {completed && completeMut.data && completeMut.isSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 30 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
            <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 ring-4 ring-amber-500/20">
              <Trophy className="w-8 h-8 drop-shadow-md" />
              <div>
                <p className="font-black text-lg drop-shadow-sm">+{completeMut.data.xpEarned} XP Earned!</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-90 drop-shadow-sm">Total XP: {completeMut.data.newXpTotal}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
