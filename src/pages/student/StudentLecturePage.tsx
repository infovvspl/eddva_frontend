import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, CheckCircle, XCircle, Clock,
  ChevronRight, Sparkles, Play, Pause, Volume2, VolumeX,
  Maximize, RotateCcw, AlertCircle, Trophy, FileText,
  Radio, Calendar, Tag, Layers, FlaskConical, GraduationCap,
<<<<<<< HEAD
  MessageCircle, Lock, Loader2,
=======
  MessageCircle, LinkIcon, Loader2, Lock,
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
} from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { sarvamTranslate, getStoredLanguage } from "@/lib/api/sarvam";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient, extractData } from "@/lib/api/client";
import {
  getQuizCheckpoints, submitQuizResponse,
  type QuizCheckpoint, type QuizSubmitResult, type Lecture,
  type LectureCompletionReward,
} from "@/lib/api/teacher";
import { getTopicProgress, type TopicProgress } from "@/lib/api/student";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { useWatchPercentage } from "@/hooks/useWatchPercentage";
import { useLectureProgress } from "@/hooks/useLectureProgress";

import { WatchProgressBar } from "@/components/lecture/WatchProgressBar";
import { RevisionModeBanner } from "@/components/lecture/RevisionModeBanner";
import { SpeedControl } from "@/components/lecture/SpeedControl";
import { FloatingDoubtButton } from "@/components/lecture/FloatingDoubtButton";
import { AskDoubtPanel } from "@/components/lecture/AskDoubtPanel";
import { FormulasTab } from "@/components/lecture/FormulasTab";
import { DownloadNotesButton } from "@/components/lecture/DownloadNotesButton";
import { QuizUnlockButton } from "@/components/lecture/QuizUnlockButton";
import { NextLectureCard } from "@/components/lecture/NextLectureCard";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

// ─── Fetch helpers ─────────────────────────────────────────────────────────

async function fetchLecture(id: string): Promise<Lecture> {
  const res = await apiClient.get(`/content/lectures/${id}`);
  return extractData<Lecture>(res);
}

async function fetchProgress(id: string) {
  try {
    const res = await apiClient.get(`/content/lectures/${id}/progress`);
    return extractData<{ lastPositionSeconds: number; watchPercentage: number; quizResponses?: { questionId: string; isCorrect: boolean; selectedOption: string }[] }>(res);
  } catch { return null; }
}

async function fetchSiblingLectures(topicId: string): Promise<Lecture[]> {
  try {
    const res = await apiClient.get(`/content/lectures?topicId=${topicId}&limit=50`);
    const outer = extractData<{ data?: Lecture[] } | Lecture[]>(res);
    if (outer && !Array.isArray(outer) && Array.isArray((outer as { data?: Lecture[] }).data)) {
      return (outer as { data: Lecture[] }).data;
    }
    return Array.isArray(outer) ? outer : [];
  } catch { return []; }
}

async function fetchMockTestForTopic(topicId: string): Promise<string | null> {
  try {
    const res = await apiClient.get(`/assessments/mock-tests?topicId=${topicId}&isPublished=true&limit=1`);
    const outer = extractData<{ data?: { id: string }[] } | { id: string }[]>(res);
    let list: { id: string }[] = [];
    if (outer && !Array.isArray(outer) && Array.isArray((outer as { data?: { id: string }[] }).data)) {
      list = (outer as { data: { id: string }[] }).data;
    } else if (Array.isArray(outer)) {
      list = outer;
    }
    return list.length > 0 ? list[0].id : null;
  } catch { return null; }
}

function fmtDuration(sec?: number) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m} min`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

// ─── Quiz Popup ────────────────────────────────────────────────────────────

type QuizState = "asking" | "correct" | "wrong";

function QuizPopup({
  question, questionIndex, total, onAnswer, onClose,
}: {
  question: QuizCheckpoint; questionIndex: number; total: number;
  onAnswer: (option: string) => Promise<QuizSubmitResult>; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState<QuizState>("asking");
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await onAnswer(selected);
      setResult(res);
      setState(res.isCorrect ? "correct" : "wrong");
    } catch {
      setState("wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-xl" style={{ background: BLUE_L, color: BLUE }}>
              Question {questionIndex + 1} / {total}
            </span>
            {state !== "asking" && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Close
              </button>
            )}
          </div>
        </div>
        <div className="px-6 pb-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> {question.segmentTitle}
          </p>
          <p className="text-base font-bold text-gray-900 leading-relaxed mb-6">{question.questionText}</p>
          <div className="space-y-2.5">
            {question.options.map((opt) => {
              const isSelected = selected === opt.label;
              const isCorrect = result?.correctOption === opt.label;
              const isWrong = state === "wrong" && isSelected;
              const showResult = state !== "asking";
              return (
                <button key={opt.label} onClick={() => state === "asking" && setSelected(opt.label)}
                  disabled={state !== "asking"}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all",
                    state === "asking" && !isSelected && "border-gray-200 hover:border-blue-200",
                    state === "asking" && isSelected && "border-blue-700 bg-blue-50 text-blue-800",
                    showResult && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-800",
                    showResult && isWrong && "border-red-500 bg-red-50 text-red-800",
                    showResult && !isCorrect && !isWrong && "border-gray-200 opacity-50 text-gray-400",
                  )}>
                  <span className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all",
                    state === "asking" && isSelected ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-500",
                    showResult && isCorrect && "bg-emerald-500 text-white",
                    showResult && isWrong && "bg-red-500 text-white",
                  )}>
                    {showResult && isCorrect ? <CheckCircle className="w-4 h-4" /> : showResult && isWrong ? <XCircle className="w-4 h-4" /> : opt.label}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          {state === "asking" ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={!selected || isSubmitting}
              className="w-full py-4 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
              style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}>
              Submit Answer <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <div className="space-y-4">
              <div className={cn("flex items-start gap-4 rounded-2xl px-5 py-4",
                state === "correct" ? "bg-emerald-100 border border-emerald-200" : "bg-red-100 border border-red-200")}>
                {state === "correct" ? <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />}
                <div>
                  <p className={cn("text-base font-black mb-1", state === "correct" ? "text-emerald-800" : "text-red-800")}>
                    {state === "correct" ? "Correct! Well done 🎉" : "Not quite right"}
                  </p>
                  {result?.explanation && <p className="text-sm font-medium leading-relaxed opacity-90" style={{ color: state === "correct" ? "#065f46" : "#7f1d1d" }}>{result.explanation}</p>}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
                className="w-full py-4 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md"
                style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}>
                <Play className="w-4 h-4" /> Continue Watching
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Video Player ──────────────────────────────────────────────────────────

function VideoPlayer({
  src,
  checkpoints,
  lectureId,
  videoRef,
  onDoubtClick,
  onVideoHoverChange,
  currentTime,
  resumeAt,
}: {
  src: string;
  checkpoints: QuizCheckpoint[];
  lectureId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  onDoubtClick: () => void;
  onVideoHoverChange: (hovered: boolean) => void;
  currentTime: number;
  resumeAt?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizCheckpoint | null>(null);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());
  const [quizIndex, setQuizIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [resumeToast, setResumeToast] = useState<string | null>(null);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const pct = (v.currentTime / duration) * 100;
    setLocalTime(v.currentTime);
    for (const cp of checkpoints) {
      if (shownIds.has(cp.id)) continue;
      if (pct >= cp.triggerAtPercent) {
        v.pause();
        setActiveQuiz(cp);
        setShownIds(prev => new Set(prev).add(cp.id));
        setQuizIndex(checkpoints.indexOf(cp));
        break;
      }
    }
  }, [duration, checkpoints, shownIds, videoRef]);

  const handleAnswer = async (option: string) => {
    if (!activeQuiz) throw new Error("no quiz");
    const v = videoRef.current;
    const taken = v ? Math.max(0, 30 - Math.floor((v.currentTime ?? 0) % 30)) : undefined;
    return await submitQuizResponse(lectureId, { questionId: activeQuiz.id, selectedOption: option, timeTakenSeconds: taken });
  };

  const dismissQuiz = () => { setActiveQuiz(null); videoRef.current?.play(); };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const progressPct = duration ? (localTime / duration) * 100 : 0;
  const isYouTube = src.includes("youtube.com") || src.includes("youtu.be");

  const handleMouseEnter = () => { setHovered(true); onVideoHoverChange(true); };
  const handleMouseLeave = () => { setHovered(false); onVideoHoverChange(false); };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-3xl overflow-hidden aspect-video group shadow-xl ring-1 ring-gray-900/10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isYouTube ? (
        <iframe
          src={`${src.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}?enablejsapi=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video ref={videoRef} src={src} className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v) return;
            setDuration(v.duration ?? 0);
            if (resumeAt && resumeAt > 5) {
              v.currentTime = resumeAt;
              const mins = Math.floor(resumeAt / 60);
              const secs = String(Math.floor(resumeAt % 60)).padStart(2, "0");
              setResumeToast(`Resuming from ${mins}:${secs}`);
              setTimeout(() => setResumeToast(null), 3000);
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}

      <AnimatePresence>
        {activeQuiz && (
          <QuizPopup question={activeQuiz} questionIndex={quizIndex} total={checkpoints.length}
            onAnswer={handleAnswer} onClose={dismissQuiz} />
        )}
      </AnimatePresence>

      {/* Resume toast */}
      {resumeToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 pointer-events-none shadow-lg">
          <Play className="w-3.5 h-3.5" style={{ color: BLUE }} /> {resumeToast}
        </div>
      )}

      {/* Floating doubt button — visible on hover */}
      {!isYouTube && (
        <div className="absolute top-4 right-4 z-40 transition-opacity" style={{ opacity: hovered && !activeQuiz ? 1 : 0 }}>
          <button onClick={onDoubtClick} className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100 hover:scale-105 transition-all">
            <MessageCircle className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-black">Ask Doubt</span>
          </button>
        </div>
      )}

      {!isYouTube && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-6 pb-6 pt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative mb-4">
            <div className="h-1.5 bg-white/30 rounded-full cursor-pointer relative hover:scale-y-150 transition-transform" onClick={seek}>
              <div className="h-full rounded-full pointer-events-none shadow-[0_0_10px_rgba(1,56,137,0.8)]" style={{ width: `${progressPct}%`, background: BLUE }} />
              {checkpoints.map(cp => (
                <div key={cp.id}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white bg-amber-400 -translate-x-1/2 shadow-sm"
                  style={{ left: `${cp.triggerAtPercent}%` }} title={`Quiz: ${cp.segmentTitle}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
              className="text-white/80 hover:text-white transition-colors">
              <RotateCcw className="w-5 h-5" />
            </button>
            <span className="text-white font-mono text-sm tracking-wide bg-white/10 px-2 py-1 rounded-lg">{fmt(localTime)} <span className="opacity-50 text-xs">/</span> {fmt(duration)}</span>
            <div className="flex-1" />
            <div className="bg-white/10 rounded-lg backdrop-blur">
              <SpeedControl videoRef={videoRef} />
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1 backdrop-blur">
              <button onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
                className="text-white/80 hover:text-white transition-colors p-1">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; }}
                className="w-16 accent-blue-500" />
            </div>
            <button onClick={() => containerRef.current?.requestFullscreen()} className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 rounded-lg backdrop-blur">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notes Panel ───────────────────────────────────────────────────────────

function NotesPanel({ lecture }: { lecture: Lecture }) {
  const [lang, setLang] = useState<string>(() => getStoredLanguage());
  const [isTranslating, setIsTranslating] = useState(false);
  const [translated, setTranslated] = useState<{
    lang: string;
    concepts: string[];
    notes: string;
  } | null>(null);

  const isEnglish = lang === "en-IN";

  useEffect(() => {
    if (isEnglish) { setTranslated(null); return; }
    if (translated?.lang === lang) return;

    setIsTranslating(true);
    const conceptsText = (lecture.aiKeyConcepts ?? []).join(" | ");
    Promise.all([
      conceptsText ? sarvamTranslate(conceptsText, lang) : Promise.resolve(""),
      lecture.aiNotesMarkdown ? sarvamTranslate(lecture.aiNotesMarkdown, lang) : Promise.resolve(""),
    ]).then(([tc, tn]) => {
      setTranslated({
        lang,
        concepts: tc ? tc.split("|").map((s) => s.trim()).filter(Boolean) : [],
        notes: tn,
      });
    }).catch(() => {
      toast.error("Translation failed. Showing in English.");
      setLang("en-IN");
    }).finally(() => setIsTranslating(false));
  }, [lang, lecture.id]);

  const displayConcepts = !isEnglish && translated?.lang === lang
    ? translated.concepts
    : (lecture.aiKeyConcepts ?? []);
  const displayNotes = !isEnglish && translated?.lang === lang
    ? translated.notes
    : lecture.aiNotesMarkdown;

  return (
<<<<<<< HEAD
    <div className="h-full overflow-y-auto space-y-5">
      {/* Language selector */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Language</p>
        <div className="flex items-center gap-2">
          {isTranslating && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
          <LanguageSelector value={lang} onChange={setLang} />
        </div>
      </div>

      {(displayConcepts.length ?? 0) > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Key Concepts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {displayConcepts.map((c, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">{c}</span>
=======
    <div className="h-full overflow-y-auto space-y-6 pr-2 custom-scrollbar">
      {(lecture.aiKeyConcepts?.length ?? 0) > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4" /> Key Concepts
          </p>
          <div className="flex flex-wrap gap-2">
            {lecture.aiKeyConcepts!.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ background: BLUE_L, color: BLUE, borderColor: BLUE_M + "30" }}>{c}</span>
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
            ))}
          </div>
        </div>
      )}
      {(lecture.aiFormulas?.length ?? 0) > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> Formulas
          </p>
          <div className="space-y-3">
            {lecture.aiFormulas!.map((f, i) => (
              <div key={i} className="bg-violet-50 text-violet-700 border border-violet-100 rounded-xl px-4 py-3 font-mono text-sm shadow-inner">{f}</div>
            ))}
          </div>
        </div>
      )}
<<<<<<< HEAD
      {displayNotes ? (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Lecture Notes
          </p>
          <div className="prose prose-sm prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80 prose-code:text-primary max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayNotes}</ReactMarkdown>
=======
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        {lecture.aiNotesMarkdown ? (
          <div>
            <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> AI Summary Notes
            </p>
            <div className="prose prose-sm prose-gray max-w-none prose-headings:font-black prose-p:font-medium prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lecture.aiNotesMarkdown}</ReactMarkdown>
            </div>
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <p className="font-bold text-gray-900 mb-1">Generating Notes</p>
            <p className="text-sm font-medium text-gray-400">Our AI is processing the lecture to create summary notes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Transcript Panel ──────────────────────────────────────────────────────

function TranscriptPanel({ transcript }: { transcript: string }) {
  const paragraphs = transcript.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="h-full overflow-y-auto space-y-4 pr-2 custom-scrollbar bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2 border-b border-gray-100 pb-4">
        <FileText className="w-4 h-4" /> Auto-generated transcript
      </p>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-sm font-medium text-gray-600 leading-relaxed indent-4">{para}</p>
      ))}
    </div>
  );
}

// ─── Quiz Summary Panel ─────────────────────────────────────────────────────

function QuizSummaryPanel({ checkpoints, savedResponses }: {
  checkpoints: QuizCheckpoint[];
  savedResponses?: { questionId: string; isCorrect: boolean; selectedOption: string }[];
}) {
  const answered = savedResponses ?? [];
  const correct = answered.filter(r => r.isCorrect).length;
  return (
    <div className="space-y-4 overflow-y-auto h-full pr-2 custom-scrollbar">
      {answered.length > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm text-amber-600">
          <Trophy className="w-8 h-8 shrink-0" />
          <div>
            <p className="text-sm font-black uppercase tracking-wider mb-0.5">Score Summary</p>
            <p className="text-base font-bold">{correct} correct out of {answered.length} — {Math.round((correct / answered.length) * 100)}% accuracy</p>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {checkpoints.map((cp, i) => {
          const response = answered.find(r => r.questionId === cp.id);
          return (
            <div key={cp.id} className={cn("rounded-2xl border p-4 text-sm shadow-sm transition-all",
              response?.isCorrect ? "border-emerald-200 bg-emerald-50" :
              response ? "border-red-200 bg-red-50" : "border-gray-100 bg-white")}>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border shadow-sm text-xs font-black shrink-0 mt-0.5"
                  style={{ color: response?.isCorrect ? "#10b981" : response ? "#ef4444" : "#6b7280" }}>
                  Q{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {cp.segmentTitle}</p>
                  <p className="text-sm font-bold text-gray-900 leading-relaxed mb-3">{cp.questionText}</p>
                  {response ? (
                    <div className="flex flex-col gap-1.5 bg-white/60 p-3 rounded-xl border border-white/40">
                      <div className="flex items-center gap-2">
                        {response.isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                        <span className="text-[13px] font-bold text-gray-800">
                          Your Answer: {response.selectedOption}
                        </span>
                      </div>
                      {!response.isCorrect && (
                         <div className="flex items-center gap-2 pt-1.5 border-t border-red-200/50">
                           <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 opacity-50" />
                           <span className="text-[13px] font-bold text-gray-500">
                             Correct Answer: {cp.correctOption}
                           </span>
                         </div>
                      )}
                    </div>
                  ) : (
                    <p className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <Play className="w-3.5 h-3.5" /> Watch video to unlock
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab types ─────────────────────────────────────────────────────────────

type TabKey = "notes" | "formulas" | "quiz" | "doubt";

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function StudentLecturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("notes");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoHovered, setVideoHovered] = useState(false);
  const [doubtTimestamp, setDoubtTimestamp] = useState(0);

  const [topicProgress, setTopicProgress] = useState<TopicProgress | null>(null);
  const [nextLecture, setNextLecture] = useState<Lecture | null>(null);
  const [mockTestId, setMockTestId] = useState<string | null>(null);
  const [completionReward, setCompletionReward] = useState<LectureCompletionReward | null>(null);

  const { watchPct: liveWatchPct, currentTime: liveCurrentTime } = useWatchPercentage(videoRef);

  // Queries
  const { data: lecture, isLoading: lectureLoading } = useQuery({
    queryKey: ["student", "lecture", id],
    queryFn: () => fetchLecture(id!),
    enabled: !!id,
  });

  const { data: savedProgress } = useQuery({
    queryKey: ["student", "lecture-progress", id],
    queryFn: () => fetchProgress(id!),
    enabled: !!id,
  });

  const { data: checkpoints = [] } = useQuery({
    queryKey: ["student", "quiz-checkpoints", id],
    queryFn: () => getQuizCheckpoints(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!lecture?.topicId) return;
    const topicId = lecture.topicId;
    getTopicProgress(topicId).then(p => setTopicProgress(p)).catch(() => setTopicProgress(null));
    fetchSiblingLectures(topicId).then(siblings => {
      const currentIndex = siblings.findIndex(s => s.id === id);
      if (currentIndex !== -1 && currentIndex < siblings.length - 1) setNextLecture(siblings[currentIndex + 1]);
    });
    fetchMockTestForTopic(topicId).then(mtId => setMockTestId(mtId));
  }, [lecture?.topicId, id]);

  const handleCompletion = useCallback((reward: LectureCompletionReward) => {
    setCompletionReward(reward);
    toast.success(reward.message, { duration: 4000 });
    qc.invalidateQueries({ queryKey: ["student", "plan"] });
    qc.invalidateQueries({ queryKey: ["student", "me"] });
    if (reward.mockTestId) setMockTestId(reward.mockTestId);
  }, [qc]);

  useLectureProgress(id ?? "", videoRef, handleCompletion);

  if (lectureLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: BLUE }} />
    </div>
  );

  // 403 = lecture is locked (previous lecture not completed)
  const isAccessLocked = (lectureError as any)?.response?.status === 403 || (lectureError as any)?.status === 403;
  if (isAccessLocked) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
        <Lock className="w-10 h-10 text-slate-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground">Lecture Locked</p>
        <p className="text-sm text-muted-foreground mt-1">Complete the previous lecture (watch 90%+) to unlock this one.</p>
      </div>
      <Button variant="outline" onClick={() => navigate(-1)}>← Go back</Button>
    </div>
  );

  if (!lecture) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-500 gap-4">
      <AlertCircle className="w-12 h-12 opacity-30" />
      <p className="font-bold">Lecture not found.</p>
      <button onClick={() => navigate(-1)} className="text-sm font-bold bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-all">Go back</button>
    </div>
  );

  const videoSrc = lecture.videoUrl ?? "";
  const displayWatchPct = liveWatchPct > 0 ? liveWatchPct : (savedProgress?.watchPercentage ?? 0);
  const isLive = lecture.type === "live" || lecture.status === "live";
  const duration = fmtDuration(lecture.videoDurationSeconds);

  const isRevisionMode = topicProgress?.status === "completed";
  const bestAccuracy = topicProgress?.bestAccuracy ?? 0;
  const passedDaysAgo = 0; // Safest fallback

  const quizUnlocked = isRevisionMode || displayWatchPct >= 90 || !!completionReward;

  const parsedFormulas = (lecture.aiFormulas ?? []).map((f) => {
    const colonIdx = f.indexOf(":");
    if (colonIdx > -1) return { name: f.slice(0, colonIdx).trim(), latex: f.slice(colonIdx + 1).trim(), description: "" };
    return { name: "Formula", latex: f, description: "" };
  });

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "notes", label: "Notes", icon: BookOpen },
    { key: "formulas", label: "Formulas", icon: FlaskConical },
    ...(checkpoints.length > 0 ? [{ key: "quiz" as const, label: `Quiz (${checkpoints.length})`, icon: Sparkles }] : []),
  ];

  const handleDoubtClick = () => { setDoubtTimestamp(liveCurrentTime); setActiveTab("doubt"); };
  const handleCloseDoubt = () => { setActiveTab("notes"); };
  const handleTakeQuiz = () => {
    const path = mockTestId ? `/student/quiz?mockTestId=${mockTestId}` : `/student/quiz?topicId=${lecture.topicId}`;
    navigate(path);
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FB" }}>
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-gray-900 text-lg truncate">{lecture.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {lecture.batch?.name && <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{lecture.batch.name}</span>}
            {lecture.topic?.name && (
              <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{lecture.topic.name}</span>
            )}
          </div>
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live
          </div>
        )}
        {displayWatchPct > 0 && !isLive && (
          <div className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border shadow-sm transition-colors"
            style={isRevisionMode ? { background: "#ECFDF5", color: "#059669", borderColor: "#A7F3D0" } : { background: "#FFFBEB", color: "#D97706", borderColor: "#FDE68A" }}>
            <Play className="w-3 h-3" />
            {Math.round(displayWatchPct)}% watched
          </div>
        )}
      </div>

      {isRevisionMode && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-center gap-2">
           <CheckCircle className="w-4 h-4 text-emerald-600" />
           <span className="text-xs font-bold text-emerald-700">Topic completed! Watching in revision mode.</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Video + Info ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Video */}
          {videoSrc ? (
            <VideoPlayer src={videoSrc} checkpoints={checkpoints} lectureId={id!} videoRef={videoRef} onDoubtClick={handleDoubtClick} onVideoHoverChange={setVideoHovered} currentTime={liveCurrentTime} resumeAt={savedProgress?.lastPositionSeconds} />
          ) : isLive && lecture.liveMeetingUrl ? (
            <div className="aspect-video bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-3xl flex flex-col items-center justify-center gap-6 shadow-sm">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center shadow-inner relative z-10">
                  <Radio className="w-10 h-10 text-red-500" />
                </div>
                <div className="absolute inset-0 bg-red-200 rounded-3xl animate-ping opacity-50 z-0" />
              </div>
              <div className="text-center">
                <p className="font-black text-2xl text-gray-900">Live Class Starting</p>
                <p className="text-sm font-medium text-gray-500 mt-2">Join via external meeting platform</p>
              </div>
              <a href={lecture.liveMeetingUrl} target="_blank" rel="noopener noreferrer">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3.5 rounded-2xl bg-red-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-red-500/30">
                  <LinkIcon className="w-4 h-4" /> Join Meeting
                </motion.button>
              </a>
            </div>
          ) : (
            <div className="aspect-video bg-white border border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-4 text-gray-400 shadow-sm">
              <Play className="w-16 h-16 opacity-30" />
              <p className="text-sm font-bold tracking-wide uppercase">Video not available yet</p>
            </div>
          )}

          {/* Watch Progress & Next Actions */}
          <div className="flex flex-col gap-4">
             {!isLive && videoSrc && (
               <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm p-5">
                 <div className="flex items-center justify-between mb-3">
                   <span className="text-xs font-black text-gray-400 tracking-widest uppercase">Progress</span>
                   <span className="text-xs font-black" style={{ color: BLUE }}>{Math.round(displayWatchPct)}%</span>
                 </div>
                 <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full rounded-full transition-all duration-300" style={{ width: `${displayWatchPct}%`, background: isRevisionMode ? "#10b981" : BLUE }} />
                 </div>
               </div>
             )}

             {quizUnlocked && lecture.topicId && !isLive && (
               <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleTakeQuiz}
                 className="w-full py-5 rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm transition-colors"
                 style={{ borderColor: BLUE_L, background: "#fff" }}>
                 <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Sparkles className="w-6 h-6 mb-2 relative z-10" style={{ color: BLUE }} />
                 <span className="text-base font-black relative z-10 text-gray-900">Topic Quiz Unlocked!</span>
                 <span className="text-xs font-bold text-gray-500 mt-1 relative z-10">Test your knowledge to mark this topic complete.</span>
               </motion.button>
             )}

             {nextLecture && (quizUnlocked || isRevisionMode) && (
               <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: BLUE_L, color: BLUE }}>
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Up Next</p>
                      <p className="font-bold text-gray-900 text-sm truncate max-w-[200px] sm:max-w-[400px]">{nextLecture.title}</p>
                    </div>
                 </div>
                 <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/student/lectures/${nextLecture.id}`)}
                    className="px-5 py-2.5 rounded-xl text-white font-black text-sm shadow-md flex items-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}>
                    Watch <ChevronRight className="w-4 h-4" />
                 </motion.button>
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: isLive ? Radio : Layers, label: "Type", value: isLive ? "Live Class" : "Recorded Audio/Video", color: isLive ? "text-red-500" : "text-blue-500", bg: isLive ? "bg-red-50" : "bg-blue-50" },
              ...(duration ? [{ icon: Clock, label: "Duration", value: duration, color: "text-violet-500", bg: "bg-violet-50" }] : []),
              ...(lecture.topic?.name ? [{ icon: Tag, label: "Topic", value: lecture.topic.name, color: "text-emerald-500", bg: "bg-emerald-50" }] : []),
              { icon: Calendar, label: "Uploaded", value: fmtDate(lecture.createdAt), color: "text-amber-500", bg: "bg-amber-50" },
            ].map((m, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", m.bg)}>
                   <m.icon className={cn("w-4 h-4", m.color)} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase mb-1">{m.label}</p>
                  <p className="text-sm font-black text-gray-900 truncate">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Sidebar Tabs ── */}
        <div className="flex flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden h-[800px] max-h-[85vh]">
          {activeTab === "doubt" ? (
             <div className="h-full flex flex-col relative">
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={handleCloseDoubt} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AskDoubtPanel lectureId={id!} topicId={lecture.topicId ?? ""} timestampSeconds={doubtTimestamp} />
                </div>
             </div>
          ) : (
             <>
                <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-100">
                  {tabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                      className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all",
                        activeTab === t.key ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "text-gray-500 hover:bg-gray-100")}>
                      <t.icon className={cn("w-4 h-4", activeTab === t.key ? "text-blue-600" : "opacity-70")} />
                      {t.label}
                    </button>
                  ))}
                  {lecture.aiNotesMarkdown && activeTab === "notes" && (
                    <DownloadNotesButton lectureId={id!} title={lecture.title} markdown={lecture.aiNotesMarkdown} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden p-6 bg-white shrink">
                  {activeTab === "notes" && <NotesPanel lecture={lecture} />}
                  {activeTab === "formulas" && <FormulasTab formulas={parsedFormulas} />}
                  {activeTab === "quiz" && <QuizSummaryPanel checkpoints={checkpoints} savedResponses={savedProgress?.quizResponses} />}
                </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
}
