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
  MessageCircle, Lock, Loader2,
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
import { useStudentMe } from "@/hooks/use-student";

import { SpeedControl } from "@/components/lecture/SpeedControl";
import { AskDoubtPanel } from "@/components/lecture/AskDoubtPanel";
import { FormulasTab } from "@/components/lecture/FormulasTab";
import { DownloadNotesButton } from "@/components/lecture/DownloadNotesButton";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE          = "#2563EB";
const BLUE_VIBRANT  = "#3B82F6";
const PURPLE        = "#7C3AED";
const PURPLE_GLOW   = "#A855F7";

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
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60"
    >
      <div className="bg-slate-900/90 border border-white/10 rounded-[3rem] w-full max-w-lg shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="px-10 pt-10 pb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Quest {questionIndex + 1} of {total}
            </span>
          </div>
        </div>
        <div className="px-10 pb-8">
          <p className="text-[11px] font-black text-blue-500/60 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {question.segmentTitle}
          </p>
          <p className="text-xl font-black text-white leading-relaxed mb-10">{question.questionText}</p>
          <div className="space-y-4">
            {question.options.map((opt) => {
              const isSelected = selected === opt.label;
              const isCorrect = result?.correctOption === opt.label;
              const isWrong = state === "wrong" && isSelected;
              const showResult = state !== "asking";
              return (
                <button key={opt.label} onClick={() => state === "asking" && setSelected(opt.label)}
                  disabled={state !== "asking"}
                  className={cn(
                    "w-full flex items-center gap-5 px-7 py-5 rounded-[2rem] border-2 text-left text-sm font-bold transition-all",
                    state === "asking" && !isSelected && "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20",
                    state === "asking" && isSelected && "border-blue-500 bg-blue-500/10 text-blue-400",
                    showResult && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-400",
                    showResult && isWrong && "border-red-500 bg-red-500/10 text-red-400",
                    showResult && !isCorrect && !isWrong && "border-white/5 opacity-50 text-white/40",
                  )}>
                  <span className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 transition-all",
                    state === "asking" && isSelected ? "bg-blue-500 text-white shadow-2xl" : "bg-white/10 text-white/50",
                    showResult && isCorrect && "bg-emerald-500 text-white shadow-2xl",
                    showResult && isWrong && "bg-red-500 text-white shadow-2xl",
                  )}>
                    {opt.label}
                  </span>
                  <span className="flex-1 text-white/80">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-10 bg-black/40 border-t border-white/5">
          {state === "asking" ? (
            <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={!selected || isSubmitting}
              className="w-full py-6 rounded-[1.75rem] text-white text-sm font-black flex items-center justify-center gap-4 transition-all disabled:opacity-50 relative group shadow-2xl overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_VIBRANT})` }}>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              Finalize Choice <ChevronRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <div className="space-y-5">
              <div className={cn("flex items-start gap-5 rounded-[2rem] px-7 py-6 border",
                state === "correct" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20")}>
                {state === "correct" ? <CheckCircle className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />}
                <div>
                  <p className={cn("text-lg font-black mb-1", state === "correct" ? "text-emerald-400" : "text-red-400")}>
                    {state === "correct" ? "Neural Link Secured!" : "Synchronization Error"}
                  </p>
                  {result?.explanation && <p className="text-sm font-semibold leading-relaxed text-white/60">{result.explanation}</p>}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
                className="w-full py-6 rounded-[1.75rem] text-white text-sm font-black flex items-center justify-center gap-4 transition-all shadow-xl bg-white/10 hover:bg-white/20 border border-white/5">
                Resume Expedition <Play className="w-4.5 h-4.5 fill-white" />
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
      className="relative bg-[#020617] rounded-[3.5rem] overflow-hidden aspect-video group shadow-[0_32px_120px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cinematic Dynamic Ambient Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-700 opacity-30 group-hover:opacity-100">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full -ml-32 -mt-32" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full -mr-32 -mb-32" />
      </div>

      {isYouTube ? (
        <iframe
          src={`${src.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}?enablejsapi=1`}
          className="w-full h-full relative z-10"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video ref={videoRef} src={src} className="w-full h-full object-contain relative z-10"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v) return;
            setDuration(v.duration ?? 0);
            if (resumeAt && resumeAt > 5) {
              v.currentTime = resumeAt;
              const mins = Math.floor(resumeAt / 60);
              const secs = String(Math.floor(resumeAt % 60)).padStart(2, "0");
              setResumeToast(`Resuming chapter at ${mins}:${secs}`);
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

      {/* Floating Resume toast */}
      <AnimatePresence>
        {resumeToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-white/5 backdrop-blur-3xl text-white text-[12px] font-black px-8 py-4 rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]" /> {resumeToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Doubt Assist */}
      {!isYouTube && (
        <div className="absolute top-8 right-8 z-40 transition-all duration-500 origin-right" style={{ opacity: hovered && !activeQuiz ? 1 : 0, scale: hovered ? 1 : 0.8 }}>
          <button onClick={onDoubtClick} className="flex items-center gap-3 bg-black/40 backdrop-blur-2xl text-white px-7 py-4 rounded-[1.5rem] shadow-2xl border border-white/10 hover:bg-white/10 transition-all group/doubt">
            <MessageCircle className="w-5 h-5 text-blue-400 font-black group-hover/doubt:scale-110 transition-transform" />
            <span className="text-xs font-black tracking-tight">Vocalize Doubt</span>
          </button>
        </div>
      )}

      {!isYouTube && (
        <div className="absolute bottom-10 left-10 right-10 z-40 transition-all duration-500 transform" 
          style={{ 
            opacity: hovered || !playing ? 1 : 0, 
            translateY: hovered || !playing ? "0px" : "20px" 
          }}
        >
          {/* Aero Floating Console */}
          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-10 py-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
            <div className="relative mb-8 group/progress">
              <div className="h-2 bg-white/5 rounded-full cursor-pointer relative hover:h-3 transition-all" onClick={seek}>
                <div className="h-full rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)] relative overflow-hidden" 
                   style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${BLUE} 0%, ${BLUE_VIBRANT} 100%)` }}>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
                </div>
                {checkpoints.map(cp => (
                  <div key={cp.id}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-blue-500 -translate-x-1/2 shadow-2xl cursor-help hover:scale-125 transition-transform"
                    style={{ left: `${cp.triggerAtPercent}%` }} title={cp.segmentTitle} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-8">
              <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-all transform hover:scale-110 active:scale-95">
                {playing ? <Pause className="w-10 h-10 fill-white" /> : <Play className="w-10 h-10 fill-white" />}
              </button>
              
              <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
                className="text-white/40 hover:text-white transition-colors">
                <RotateCcw className="w-7 h-7" />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-white font-mono text-[13px] font-black tracking-widest bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 tabular-nums">
                  {fmt(localTime)} <span className="opacity-20 mx-1">|</span> {fmt(duration)}
                </span>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-6">
                <div className="bg-white/5 px-2 rounded-2xl backdrop-blur-xl border border-white/5 ring-1 ring-white/5">
                  <SpeedControl videoRef={videoRef} />
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-5 py-2.5 backdrop-blur-xl border border-white/5">
                  <button onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
                    className="text-white/40 hover:text-white transition-colors">
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                    onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; }}
                    className="w-16 accent-blue-500 cursor-pointer" />
                </div>

                <button onClick={() => containerRef.current?.requestFullscreen()} 
                  className="text-white/40 hover:text-white transition-all p-3 bg-white/5 rounded-2xl backdrop-blur-xl border border-white/5 hover:scale-105 active:scale-95">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
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
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
          <p className="text-[10px] font-black tracking-[0.25em] text-blue-400 uppercase mb-6 flex items-center gap-4">
             <Tag className="w-4 h-4" /> Core Synthesis
          </p>
          <div className="flex flex-wrap gap-3">
            {lecture.aiKeyConcepts!.map((c, i) => (
<<<<<<< HEAD
              <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ background: BLUE_L, color: BLUE, borderColor: BLUE_M + "30" }}>{c}</span>
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
=======
              <span key={i} className="px-5 py-2.5 rounded-[1.25rem] text-[11px] font-black bg-white/5 text-white/70 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-default">
                {c}
              </span>
>>>>>>> 6001d4f1a65eecb3bf3fd2350afc992db7751fd1
            ))}
          </div>
        </div>
      )}
<<<<<<< HEAD
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
=======
      <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl relative min-h-[400px]">
>>>>>>> 6001d4f1a65eecb3bf3fd2350afc992db7751fd1
        {lecture.aiNotesMarkdown ? (
          <div>
            <p className="text-[10px] font-black tracking-[0.25em] text-emerald-400 uppercase mb-8 flex items-center gap-4">
              <BookOpen className="w-5 h-5" /> Neural Transcription
            </p>
            <div className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-strong:text-blue-400 prose-code:bg-white/5 prose-code:text-emerald-400 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none prose-ul:text-white/60">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lecture.aiNotesMarkdown}</ReactMarkdown>
            </div>
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500/20 mb-6" />
            <p className="font-black text-white uppercase tracking-[0.3em] text-xs">Architecting Insights...</p>
            <p className="text-sm font-medium text-white/30 mt-2">Our AI is processing the neural cache.</p>
          </div>
        )}
      </div>
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
    <div className="space-y-6 overflow-y-auto h-full pr-2 custom-scrollbar">
      {answered.length > 0 && (
        <div className="bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-600/10 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-500/5">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
               <Trophy className="w-9 h-9 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-1">Retrieval Accuracy</p>
              <p className="text-xl font-black text-white">{correct} of {answered.length} Quests <span className="text-blue-400 opacity-60 ml-2">— {Math.round((correct / answered.length) * 100)}%</span></p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-5">
        {checkpoints.map((cp, i) => {
          const response = answered.find(r => r.questionId === cp.id);
          return (
            <div key={cp.id} className={cn("rounded-[2.5rem] border p-8 text-sm shadow-xl transition-all relative overflow-hidden group",
              response?.isCorrect ? "bg-emerald-500/5 border-emerald-500/10" :
              response ? "bg-red-500/5 border-red-500/10" : "bg-white/5 border-white/5 hover:border-white/10")}>
              
              <div className="relative z-10 flex items-start gap-6">
                <span className={cn("w-12 h-12 rounded-[1.25rem] flex items-center justify-center border shadow-2xl text-xs font-black shrink-0",
                  response?.isCorrect ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-400" :
                  response ? "bg-red-500/20 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-white/30")}>
                  Q{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                    <Clock className="w-4 h-4" /> {cp.segmentTitle}
                  </p>
                  <p className="text-lg font-bold text-white/90 leading-relaxed mb-6">{cp.questionText}</p>
                  {response ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-black/30 p-5 rounded-[1.5rem] border border-white/5">
                        <div className={cn("w-2.5 h-2.5 rounded-full", response.isCorrect ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]")} />
                        <span className="text-[11px] font-black text-white/30 uppercase tracking-widest mr-2">Selection:</span>
                        <span className="text-md font-bold text-white">{response.selectedOption}</span>
                      </div>
                      {!response.isCorrect && (
                         <div className="flex items-center gap-4 bg-emerald-500/5 p-5 rounded-[1.5rem] border border-emerald-500/10">
                           <CheckCircle className="w-5 h-5 text-emerald-500" />
                           <span className="text-[11px] font-black text-emerald-500/60 uppercase tracking-widest mr-2">Correction:</span>
                           <span className="text-md font-black text-emerald-400">{cp.correctOption}</span>
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-3 text-[11px] font-black text-white/20 bg-white/5 px-6 py-3 rounded-2xl uppercase tracking-widest border border-white/5">
                      <Lock className="w-4 h-4" /> Locked in Stasis
                    </div>
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
  const { data: me } = useStudentMe();

  // Queries
  const { data: lecture, isLoading: lectureLoading, error: lectureError } = useQuery({
    queryKey: ["student", "lecture", id],
    queryFn: () => fetchLecture(id!),
    enabled: !!id,
    retry: false,
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

  const handleCloseDoubt = () => { setActiveTab("notes"); };

  const handleCompletion = useCallback((reward: LectureCompletionReward) => {
    setCompletionReward(reward);
    toast.success(reward.message, { duration: 4000 });
    qc.invalidateQueries({ queryKey: ["student", "plan"] });
    qc.invalidateQueries({ queryKey: ["student", "me"] });
    if (reward.mockTestId) setMockTestId(reward.mockTestId);
  }, [qc]);

  useLectureProgress(id ?? "", videoRef, handleCompletion);

  if (lectureLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] gap-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-[spin_1.5s_linear_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
            <motion.div animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Sparkles className="w-10 h-10 text-blue-500 drop-shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
            </motion.div>
        </div>
      </div>
      <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.5em] animate-pulse">Initializing Neural Link</p>
    </div>
  );

  const isAccessLocked = (lectureError as any)?.response?.status === 403 || (lectureError as any)?.status === 403;
  if (isAccessLocked) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-center px-10">
      <div className="w-28 h-28 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-3xl mb-10 group hover:border-red-500/20 transition-all duration-500">
        <Lock className="w-14 h-14 text-slate-500 group-hover:text-red-500 transition-colors" />
      </div>
      <div>
        <p className="text-3xl font-black text-white mb-4 italic tracking-tight">Expedition Overridden</p>
        <p className="text-slate-500 font-bold max-w-sm mb-12 uppercase text-[11px] tracking-widest leading-loose">Access depends on chapter finalization (90%+ progress requirement).</p>
      </div>
      <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)} 
        className="px-12 py-6 rounded-[1.75rem] bg-white text-slate-900 font-black text-sm shadow-2xl hover:bg-blue-50 transition-all">
        Reverse Coarse
      </motion.button>
    </div>
  );

  if (!lecture) return null;

  const videoSrc = lecture.videoUrl ?? "";
  const displayWatchPct = liveWatchPct > 0 ? liveWatchPct : (savedProgress?.watchPercentage ?? 0);
  const isLive = lecture.type === "live" || lecture.status === "live";
  const duration = fmtDuration(lecture.videoDurationSeconds);
  const isRevisionMode = topicProgress?.status === "completed";
  const quizUnlocked = isRevisionMode || displayWatchPct >= 90 || !!completionReward;

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "notes", label: "Intel", icon: BookOpen },
    { key: "formulas", label: "Formulae", icon: FlaskConical },
    ...(checkpoints.length > 0 ? [{ key: "quiz" as const, label: "Quests", icon: Sparkles }] : []),
  ];

  const handleDoubtClick = () => { setDoubtTimestamp(liveCurrentTime); setActiveTab("doubt"); };
  const handleTakeQuiz = () => {
    const path = mockTestId ? `/student/quiz?mockTestId=${mockTestId}` : `/student/quiz?topicId=${lecture.topicId}`;
    navigate(path);
  };

  return (
    <div className="min-h-screen relative bg-[#020617] overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200 custom-scrollbar">
      {/* ── Aero Dynamic Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/10 blur-[180px] rounded-full -mr-96 -mt-96 animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-purple-600/10 blur-[180px] rounded-full -ml-96 animate-pulse" style={{ animationDuration: "12s" }} />
      </div>

      {/* ── Modern Top Bar ── */}
      <nav className="sticky top-0 z-50 bg-[#020617]/40 backdrop-blur-3xl border-b border-white/5 px-10 py-8 flex items-center gap-10">
        <motion.button 
          whileHover={{ scale: 1.1, x: -5 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)} 
          className="w-14 h-14 flex items-center justify-center rounded-[1.75rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-2xl"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </motion.button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-5 mb-2">
            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-5 py-2 rounded-2xl uppercase tracking-[0.3em] border border-blue-500/20 shadow-inner">
              {lecture.topic?.name ?? "Segment"}
            </span>
            {isLive && (
              <span className="flex items-center gap-3 bg-red-500/10 text-red-500 text-[10px] font-black px-5 py-2 rounded-2xl uppercase tracking-[0.3em] border border-red-500/20">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_15px_rgba(239,68,68,0.8)]" /> Active Frequency
              </span>
            )}
          </div>
          <h1 className="font-black text-white text-2xl sm:text-3xl truncate tracking-tight italic uppercase">{lecture.title}</h1>
        </div>

        {displayWatchPct > 0 && !isLive && (
          <div className="hidden lg:flex items-center gap-8 px-10 py-5 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl shadow-3xl hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-2">Neural Assimilation</p>
              <div className="flex items-center gap-5">
                 <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${displayWatchPct}%` }} className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                 </div>
                 <span className="text-sm font-black text-white tabular-nums">{Math.round(displayWatchPct)}%</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="relative z-10 max-w-[1800px] mx-auto px-10 py-12 grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* ── Cinematic Arena ── */}
        <div className="xl:col-span-3 space-y-12">
          
          {/* Aero Cinema Video */}
          <div className="relative p-2 rounded-[4rem] bg-white/5 border border-white/5 shadow-3xl">
            <VideoPlayer 
              src={videoSrc} checkpoints={checkpoints} lectureId={id!} videoRef={videoRef} onDoubtClick={handleDoubtClick} 
              onVideoHoverChange={setVideoHovered} currentTime={liveCurrentTime} resumeAt={savedProgress?.lastPositionSeconds} 
            />
          </div>

          {/* Vitals Feed */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-12">
               <div className="flex flex-wrap gap-5">
                  {[
                    { icon: Clock, label: "Duration", value: duration ?? "--", color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/10" },
                    { icon: Layers, label: "Modality", value: isLive ? "Live Sync" : "Neural Cache", color: "text-purple-400", bg: "bg-purple-400/5", border: "border-purple-400/10" },
                    { icon: Calendar, label: "Timestamp", value: fmtDate(lecture.createdAt), color: "text-emerald-400", bg: "bg-emerald-400/5", border: "border-emerald-400/10" },
                    { icon: Trophy, label: "Status", value: isRevisionMode ? "Mastered" : "Initiate", color: "text-amber-400", bg: "bg-amber-400/5", border: "border-amber-400/10" },
                  ].map((stat, i) => (
                    <div key={i} className={cn("flex-1 min-w-[200px] backdrop-blur-3xl rounded-[2.5rem] px-8 py-7 shadow-2xl flex items-center gap-6 border transition-all hover:scale-105 group", stat.bg, stat.border)}>
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 transition-transform">
                        <stat.icon className={cn("w-7 h-7", stat.color)} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-1">{stat.label}</p>
                        <p className="text-md font-black text-white uppercase tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="xl:col-span-12">
              {quizUnlocked && !isLive && (
                <motion.button 
                  whileHover={{ y: -5, scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={handleTakeQuiz}
                  className="w-full relative overflow-hidden p-10 rounded-[3.5rem] border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-transparent backdrop-blur-3xl shadow-3xl group text-left"
                >
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full -mr-96 -mt-96 group-hover:scale-150 transition-transform duration-1000" />
                  <div className="relative flex items-center justify-between gap-10">
                    <div className="flex items-center gap-10">
                      <div className="w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.4)] group-hover:rotate-6 transition-transform">
                        <Sparkles className="w-12 h-12 text-white" />
                      </div>
                      <div>
                        <h4 className="text-3xl font-black text-white italic uppercase tracking-tight">Initiate Topic Quest</h4>
                        <p className="text-lg text-white/40 font-bold mt-2">Validate neural links and acquire bonus EXP for your rank.</p>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:translate-x-3 transition-all">
                       <ChevronRight className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* ── Aero Sidebar ── */}
        <aside className="xl:col-span-1 h-[calc(100vh-14rem)] sticky top-40 flex flex-col gap-10 min-w-0">
          
          {/* Premium High-Contrast Tabs */}
          <div className="bg-white/5 p-2 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl flex gap-1.5 shadow-2xl">
            {[...tabs, { key: "doubt", label: "Query", icon: MessageCircle }].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                className={cn("flex-1 px-3 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.1em] transition-all flex flex-col items-center gap-3",
                  activeTab === t.key ? "bg-white text-slate-900 shadow-2xl shadow-white/10 scale-105" : "text-white/40 hover:text-white/60 hover:bg-white/5")}>
                <t.icon className={cn("w-5 h-5", activeTab === t.key ? "text-slate-900" : "text-white/20")} />
                <span className="hidden lg:block">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 bg-white/2 rounded-[3.5rem] border border-white/5 p-2 shadow-inner group">
            <div className="h-full overflow-hidden">
               <AnimatePresence mode="wait">
                 {activeTab === "notes" && (
                   <motion.div key="notes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                     <NotesPanel lecture={lecture} />
                   </motion.div>
                 )}
                 {activeTab === "formulas" && (
                   <motion.div key="formulas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                     <FormulasTab formulas={lecture.aiFormulas?.map(f => ({ name: "N/A", latex: f, description: "" })) ?? []} />
                   </motion.div>
                 )}
                 {activeTab === "quiz" && (
                   <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                     <QuizSummaryPanel checkpoints={checkpoints} savedResponses={savedProgress?.quizResponses} />
                   </motion.div>
                 )}
                 {activeTab === "doubt" && (
                   <motion.div key="doubt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                     <div className="bg-white/5 border border-white/10 rounded-[3rem] h-full overflow-hidden flex flex-col p-1 shadow-2xl shadow-purple-500/5">
                        <AskDoubtPanel lectureId={id!} topicId={lecture.topicId} topicName={lecture.topic?.name ?? "General"} lectureTitle={lecture.title} timestampSeconds={doubtTimestamp} onClose={handleCloseDoubt} />
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
          
          <div className="mt-auto">
             <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <DownloadNotesButton lecture={lecture} />
             </motion.div>
          </div>
        </aside>
      </main>
    </div>
  );
}
