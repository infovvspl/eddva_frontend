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
  "prose prose-invert max-w-none",
  // Headings
  "prose-h1:text-2xl prose-h1:font-bold prose-h1:text-white prose-h1:mb-6 prose-h1:mt-0 prose-h1:pb-3 prose-h1:border-b prose-h1:border-violet-800/40",
  "prose-h2:text-xl prose-h2:font-bold prose-h2:text-violet-200 prose-h2:mt-10 prose-h2:mb-4",
  "prose-h3:text-base prose-h3:font-semibold prose-h3:text-violet-300 prose-h3:mt-6 prose-h3:mb-3",
  "prose-h4:text-sm prose-h4:font-semibold prose-h4:text-slate-300 prose-h4:mt-4 prose-h4:mb-2",
  // Paragraphs
  "prose-p:text-slate-300 prose-p:leading-8 prose-p:mb-5 prose-p:text-[15px]",
  // Bold / Italic
  "prose-strong:text-white prose-strong:font-semibold",
  "prose-em:text-violet-200 prose-em:not-italic prose-em:font-medium",
  // Code
  "prose-code:bg-violet-900/50 prose-code:text-violet-200 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:text-[13px] prose-code:font-mono prose-code:border prose-code:border-violet-800/30 prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:bg-violet-950/70 prose-pre:border prose-pre:border-violet-800/40 prose-pre:rounded-2xl prose-pre:p-5",
  // Lists
  "prose-ul:text-slate-300 prose-ul:space-y-2 prose-ul:my-4 prose-ul:text-[15px]",
  "prose-ol:text-slate-300 prose-ol:space-y-2 prose-ol:my-4 prose-ol:text-[15px]",
  "prose-li:text-slate-300 prose-li:leading-7 prose-li:pl-1",
  "prose-li:marker:text-violet-400",
  // Blockquote
  "prose-blockquote:border-l-4 prose-blockquote:border-violet-500 prose-blockquote:bg-violet-950/30 prose-blockquote:rounded-r-xl prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:text-slate-300 prose-blockquote:not-italic prose-blockquote:my-5",
  // Tables
  "prose-table:text-[14px] prose-thead:bg-violet-900/30 prose-th:text-violet-200 prose-th:font-semibold prose-th:px-4 prose-td:text-slate-300 prose-td:px-4",
  // HR
  "prose-hr:border-violet-800/40 prose-hr:my-8",
  // Links
  "prose-a:text-violet-400 prose-a:no-underline hover:prose-a:text-violet-300",
].join(" ");

// ─── Practice question card ─────────────────────────────────────────────────────

function PracticeCard({ q, index, onAskAI }: { q: AiPracticeQuestion; index: number; onAskAI: (question: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-violet-950/30 border border-violet-800/30 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-violet-900/20 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mt-0.5 w-6 h-6 rounded-full bg-violet-700/40 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
            {index + 1}
          </span>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">{q.question}</p>
        </div>
        <div className="shrink-0 mt-0.5">
          {open ? <ChevronUp className="w-4 h-4 text-violet-400" /> : <ChevronDown className="w-4 h-4 text-violet-400" />}
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
            <div className="px-4 pb-4 pt-0 border-t border-violet-800/20 space-y-3">
              <div className="pt-3">
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-1.5">Answer</p>
                <p className="text-sm text-slate-200 leading-relaxed">{q.answer}</p>
              </div>
              {q.explanation && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1.5">Explanation</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{q.explanation}</p>
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onAskAI(q.question); }}
                className="flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
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

  // Derive active session data — use optimistic data from start mutation if available
  const sessionData: AiStudySessionData | undefined = startMut.data ?? session;
  const sessionId = sessionData?.id;
  const timerRunning = !!sessionId && !completed;
  const elapsed = useElapsedTimer(timerRunning, sessionData?.timeSpentSeconds ?? 0);

  // Auto-start if no session yet
  useEffect(() => {
    if (!sessionLoading && !session && !startMut.isPending && !startMut.data) {
      startMut.mutate(topicId);
    }
  }, [sessionLoading, session, topicId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync completed state
  useEffect(() => {
    if (sessionData?.isCompleted) setCompleted(true);
  }, [sessionData?.isCompleted]);

  // Auto-scroll chat
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
    // auto-send after tab switch
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
          // show XP toast handled in UI
          void res;
        },
      },
    );
  }, [sessionId, topicId, elapsed, completeMut]);

  // ── Loading / starting ───────────────────────────────────────────────────────

  const isStarting = startMut.isPending || (sessionLoading && !session);

  if (isStarting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-violet-400 animate-pulse" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-violet-500/20 animate-ping" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Generating your AI lesson…</h2>
          <p className="text-sm text-slate-400">Crafting a personalised study session just for you</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-500"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (startMut.isError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <p className="text-white font-semibold">Failed to start AI study session</p>
        <p className="text-sm text-slate-400 text-center">{(startMut.error as any)?.message ?? "Please try again"}</p>
        <button
          onClick={() => startMut.mutate(topicId)}
          className="mt-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/10 to-slate-950 flex flex-col">
      {/* ── Top header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-violet-900/30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-violet-800/30 flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-600/50 transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-violet-600/30 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">AI Study</span>
            </div>
          </div>

          {/* Language selector */}
          <LanguageSelector value={lang} onChange={setLang} />
          {isTranslating && <Loader2 className="w-4 h-4 animate-spin text-violet-400 shrink-0" />}

          {/* Timer */}
          <div className="flex items-center gap-1.5 bg-violet-900/20 border border-violet-800/30 px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-sm font-mono font-semibold text-violet-300">{formatTime(elapsed)}</span>
          </div>

          {/* Complete badge */}
          {completed && (
            <div className="flex items-center gap-1.5 bg-emerald-900/30 border border-emerald-700/40 px-3 py-1.5 rounded-xl">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Done</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-20 bg-slate-950/80 backdrop-blur border-b border-violet-900/20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === "ask" && sessionData.conversation.length > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-violet-600/40 text-violet-300 text-[10px] flex items-center justify-center">
                    {Math.ceil(sessionData.conversation.length / 2)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 pb-36">
          <AnimatePresence mode="wait">

            {/* ── LESSON TAB ─────────────────────────────────────────────────────── */}
            {activeTab === "lesson" && (
              <motion.div
                key="lesson"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {sessionData.lessonMarkdown ? (
                  <div className="space-y-0">
                    {/* Topic hero */}
                    <div className="mb-8 pb-6 border-b border-violet-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-600/30 px-3 py-1 rounded-full">
                          <Sparkles className="w-3 h-3 text-violet-400" />
                          <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">AI-Generated Lesson</span>
                        </div>
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-1">{sessionData.topicName}</h1>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Comprehensive Study Material</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~15–25 min read</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Concepts + Examples + Exam Tips</span>
                      </div>
                    </div>

                    {/* Lesson content — beautiful reading experience */}
                    <div
                      className={mdClass}
                      style={{
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                        lineHeight: "1.85",
                        letterSpacing: "0.01em",
                      }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // H2 sections get a styled header bar
                          h2: ({ children }) => (
                            <h2 className="flex items-center gap-2 text-xl font-bold text-violet-200 mt-10 mb-4 pb-2 border-b border-violet-800/30">
                              {children}
                            </h2>
                          ),
                          // Blockquote styled as tip box
                          blockquote: ({ children }) => (
                            <blockquote className="my-5 px-5 py-4 bg-violet-950/40 border-l-4 border-violet-500 rounded-r-2xl">
                              {children}
                            </blockquote>
                          ),
                          // Code block
                          code: ({ inline, children, ...props }: any) =>
                            inline ? (
                              <code className="bg-violet-900/50 text-violet-200 px-2 py-0.5 rounded-lg text-[13px] font-mono border border-violet-800/30 mx-0.5" {...props}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-violet-950/70 border border-violet-800/40 rounded-2xl p-5 overflow-x-auto my-5">
                                <code className="text-violet-200 text-[13px] font-mono leading-relaxed" {...props}>{children}</code>
                              </pre>
                            ),
                          // Strong/bold
                          strong: ({ children }) => (
                            <strong className="text-white font-semibold">{children}</strong>
                          ),
                          // Paragraph with proper spacing
                          p: ({ children }) => (
                            <p className="text-slate-300 leading-8 mb-5 text-[15px]">{children}</p>
                          ),
                          // List items
                          li: ({ children }) => (
                            <li className="text-slate-300 leading-7 mb-1.5 text-[15px]">{children}</li>
                          ),
                          // Horizontal rule
                          hr: () => <hr className="border-violet-800/30 my-8" />,
                        }}
                      >
                        {displayLesson}
                      </ReactMarkdown>
                    </div>

                    {/* End of lesson CTA */}
                    <div className="mt-10 pt-6 border-t border-violet-800/30 flex flex-col items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mb-1">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-200">Finished reading?</p>
                      <p className="text-xs text-slate-500 max-w-xs">Check the Concepts tab for a summary, then try Practice questions to test yourself.</p>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setActiveTab("concepts")}
                          className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-600/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-colors"
                        >
                          View Key Concepts →
                        </button>
                        <button
                          onClick={() => setActiveTab("practice")}
                          className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-600/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                        >
                          Practice Questions →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <p>Loading lesson content…</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── CONCEPTS TAB ───────────────────────────────────────────────────── */}
            {activeTab === "concepts" && (
              <motion.div
                key="concepts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* Key Concepts */}
                {displayConcepts.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-blue-400" />
                      </div>
                      <h3 className="font-bold text-white text-base">Key Concepts</h3>
                    </div>
                    <div className="space-y-2">
                      {displayConcepts.map((concept, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 bg-blue-950/20 border border-blue-800/20 rounded-xl px-4 py-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-blue-300">{i + 1}</span>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed">{concept}</p>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Formulas */}
                {sessionData.formulas.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
                        <Sigma className="w-4 h-4 text-violet-400" />
                      </div>
                      <h3 className="font-bold text-white text-base">Formulas</h3>
                    </div>
                    <div className="space-y-2">
                      {sessionData.formulas.map((formula, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-violet-950/40 border border-violet-800/30 rounded-xl px-4 py-3 font-mono text-sm text-violet-200"
                        >
                          {formula}
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Common Mistakes */}
                {displayMistakes.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-amber-600/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      </div>
                      <h3 className="font-bold text-white text-base">Common Mistakes</h3>
                    </div>
                    <div className="space-y-2">
                      {displayMistakes.map((mistake, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 bg-amber-950/20 border border-amber-800/20 rounded-xl px-4 py-3"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-200 leading-relaxed">{mistake}</p>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {displayConcepts.length === 0 && sessionData.formulas.length === 0 && displayMistakes.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Brain className="w-10 h-10 mb-3 opacity-30" />
                    <p>No concepts extracted yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PRACTICE TAB ───────────────────────────────────────────────────── */}
            {activeTab === "practice" && (
              <motion.div
                key="practice"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-white text-base">Practice Questions</h3>
                  <span className="text-xs text-slate-500 ml-1">({displayQuestions.length})</span>
                </div>

                {displayQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <FlaskConical className="w-10 h-10 mb-3 opacity-30" />
                    <p>No practice questions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayQuestions.map((q, i) => (
                      <PracticeCard key={i} q={q} index={i} onAskAI={handleAskAboutQuestion} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ASK AI TAB ──────────────────────────────────────────────────────── */}
            {activeTab === "ask" && (
              <motion.div
                key="ask"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col"
              >
                {/* Conversation */}
                <div className="space-y-4 pb-4">
                  {sessionData.conversation.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                      <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-700/20 flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-violet-500/50" />
                      </div>
                      <p className="font-medium text-slate-400">Ask your AI tutor anything</p>
                      <p className="text-sm mt-1 text-center text-slate-600 max-w-xs">
                        Got questions about this topic? I'm here to help.
                      </p>
                    </div>
                  )}

                  {sessionData.conversation.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.02 }}
                      className={`flex gap-3 ${msg.role === "student" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        msg.role === "ai"
                          ? "bg-violet-600/30 text-violet-300 border border-violet-600/40"
                          : "bg-slate-700 text-slate-300"
                      }`}>
                        {msg.role === "ai" ? <Sparkles className="w-4 h-4" /> : "You"}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "student"
                          ? "bg-violet-600/25 text-slate-100 rounded-tr-sm border border-violet-600/20"
                          : "bg-slate-800/60 text-slate-200 rounded-tl-sm border border-slate-700/40"
                      }`}>
                        {msg.role === "ai" ? (
                          <div className={`${mdClass} !prose-sm`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.message
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {askMut.isPending && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-600/40 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-violet-300" />
                      </div>
                      <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-violet-500"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-violet-900/30">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {activeTab === "ask" ? (
            /* Chat input */
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask your AI tutor…"
                  rows={1}
                  disabled={askMut.isPending}
                  className="w-full resize-none bg-slate-900 border border-violet-800/30 rounded-2xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-600/60 transition-colors leading-relaxed"
                  style={{ maxHeight: 120 }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!chatInput.trim() || askMut.isPending}
                className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                {askMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          ) : completed ? (
            /* Completed state */
            <div className="flex items-center justify-center gap-3 py-1">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Session Completed</span>
              {completeMut.data && (
                <div className="flex items-center gap-1.5 bg-amber-900/30 border border-amber-700/40 px-3 py-1 rounded-xl">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">+{completeMut.data.xpEarned} XP</span>
                </div>
              )}
            </div>
          ) : showComplete ? (
            /* Confirm complete */
            <div className="flex items-center gap-3">
              <p className="flex-1 text-sm text-slate-300">Mark this session as complete?</p>
              <button
                onClick={() => setShowComplete(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={completeMut.isPending}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {completeMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm
              </button>
            </div>
          ) : (
            /* Mark complete button */
            <button
              onClick={() => setShowComplete(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-700 to-violet-600 text-white text-sm font-bold hover:from-violet-600 hover:to-violet-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Session Complete
            </button>
          )}
        </div>
      </div>

      {/* ── XP celebration overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {completed && completeMut.data && completeMut.isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
              <Trophy className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">+{completeMut.data.xpEarned} XP Earned!</p>
                <p className="text-xs opacity-80">Total: {completeMut.data.newXpTotal} XP</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
