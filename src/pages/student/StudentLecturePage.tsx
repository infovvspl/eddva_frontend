import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, CheckCircle, XCircle, Clock,
  ChevronRight, Sparkles, Play, Pause, Volume2, VolumeX,
  Maximize, RotateCcw, Trophy, Tag, Layers, FlaskConical,
  MessageCircle, Loader2, Lock, Calendar,
} from "lucide-react";
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
import { CardGlass } from "@/components/shared/CardGlass";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const INDIGO = "#4F46E5";
const SLATE_TECH = "#475569";

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
      className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 rounded-[3.5rem]"
    >
      <CardGlass className="border-gray-200 bg-white/95 rounded-[3rem] w-full max-w-lg shadow-3xl overflow-hidden p-0">
        <div className="px-10 pt-10 pb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100">
              Checkpoint {questionIndex + 1} of {total}
            </span>
          </div>
        </div>
        <div className="px-10 pb-8">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> {question.segmentTitle}
          </p>
          <p className="text-xl font-bold text-slate-800 leading-tight mb-10">{question.questionText}</p>
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
                    "w-full flex items-center gap-5 px-6 py-4 rounded-2xl border text-left text-sm font-bold transition-all",
                    state === "asking" && !isSelected && "border-slate-100 bg-white hover:bg-slate-50",
                    state === "asking" && isSelected && "border-indigo-600 bg-indigo-50/30 text-indigo-600",
                    showResult && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm",
                    showResult && isWrong && "border-red-500 bg-red-50 text-red-600 shadow-sm",
                    showResult && !isCorrect && !isWrong && "border-slate-50 opacity-40 grayscale",
                  )}>
                  <span className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 transition-all",
                    state === "asking" && isSelected ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-400 border border-slate-100",
                    showResult && isCorrect ? "bg-emerald-500 text-white shadow-lg" : "",
                    showResult && isWrong ? "bg-red-500 text-white shadow-lg" : "",
                  )}>
                    {opt.label}
                  </span>
                  <span className="flex-1 text-slate-700 font-bold">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-10 bg-slate-50 border-t border-slate-100">
          {state === "asking" ? (
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={!selected || isSubmitting}
              className="w-full py-5 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-indigo-600 transition-all disabled:opacity-50">
              Submit Response <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <div className="space-y-4">
              <div className={cn("flex items-start gap-5 rounded-2xl px-6 py-5 border",
                state === "correct" ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100")}>
                {state === "correct" ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                <div>
                  <p className={cn("text-base font-bold mb-1", state === "correct" ? "text-emerald-600" : "text-red-600")}>
                    {state === "correct" ? "Synchronized Successfully" : "Sync Error Detected"}
                  </p>
                  {result?.explanation && <p className="text-[11px] font-bold leading-relaxed text-slate-400 uppercase tracking-tight">{result.explanation}</p>}
                </div>
              </div>
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onClose}
                className="w-full py-4 rounded-2xl text-slate-800 text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm bg-white border border-slate-100">
                Continue Expedition <Play className="w-3.5 h-3.5 fill-current" />
              </motion.button>
            </div>
          )}
        </div>
      </CardGlass>
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
      className="relative bg-black rounded-3xl overflow-hidden aspect-video group shadow-xl ring-1 ring-slate-100"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
              setResumeToast(`Resuming at ${mins}:${secs}`);
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

      <AnimatePresence>
        {resumeToast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/90 backdrop-blur-xl text-slate-800 text-[8px] font-bold uppercase tracking-widest px-6 py-3 rounded-2xl border border-slate-100 shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> {resumeToast}
          </motion.div>
        )}
      </AnimatePresence>

      {!isYouTube && (
        <div className="absolute top-6 right-6 z-40" style={{ opacity: hovered && !activeQuiz ? 1 : 0 }}>
          <button onClick={onDoubtClick} className="flex items-center gap-2.5 bg-white/80 backdrop-blur-xl text-slate-800 px-5 py-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all">
            <MessageCircle className="w-4 h-4 text-indigo-500" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Vocalize Doubt</span>
          </button>
        </div>
      )}

      {!isYouTube && (
        <div className="absolute bottom-6 left-6 right-6 z-40 transition-all duration-500"
          style={{
            opacity: hovered || !playing ? 1 : 0,
            transform: hovered || !playing ? "translateY(0)" : "translateY(10px)"
          }}
        >
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-5 shadow-xl">
            <div className="relative mb-5">
              <div className="h-1 bg-slate-100 rounded-full cursor-pointer relative" onClick={seek}>
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPct}%` }} />
                {checkpoints.map(cp => (
                  <div key={cp.id}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white bg-indigo-400 -translate-x-1/2"
                    style={{ left: `${cp.triggerAtPercent}%` }} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-slate-800 hover:text-indigo-600 transition-all">
                {playing ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>
              <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
                className="text-slate-300 hover:text-slate-600 transition-colors">
                <RotateCcw className="w-5 h-5" />
              </button>
              <span className="text-slate-400 font-mono text-[9px] font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 tabular-nums">
                {fmt(localTime)} / {fmt(duration)}
              </span>
              <div className="flex-1" />
              <SpeedControl videoRef={videoRef} />
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                <button onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
                  className="text-slate-300 hover:text-slate-600">
                  {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; }}
                  className="w-16 accent-indigo-500 cursor-pointer h-1" />
              </div>
              <button onClick={() => containerRef.current?.requestFullscreen()}
                className="text-slate-300 hover:text-slate-600 p-2 bg-slate-50 rounded-lg border border-slate-100">
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notes Panel ───────────────────────────────────────────────────────────

function NotesPanel({ lecture }: { lecture: Lecture }) {
  return (
    <div className="h-full overflow-y-auto space-y-6 pr-2 scrollbar-none">
      {(lecture.aiKeyConcepts?.length ?? 0) > 0 && (
        <CardGlass className="border-slate-100 bg-white/40 p-6 shadow-sm">
          <p className="text-[8px] font-bold tracking-widest text-indigo-500 uppercase mb-5 flex items-center gap-2.5">
            <Tag className="w-3.5 h-3.5" /> CORE SYNTHESIS
          </p>
          <div className="flex flex-wrap gap-2">
            {lecture.aiKeyConcepts!.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-white text-slate-500 border border-slate-100 uppercase tracking-tight">
                {c}
              </span>
            ))}
          </div>
        </CardGlass>
      )}
      <CardGlass className="border-slate-100 bg-white/40 p-8 shadow-sm min-h-[400px]">
        {lecture.aiNotesMarkdown ? (
          <div>
            <p className="text-[8px] font-bold tracking-widest text-indigo-500 uppercase mb-6 flex items-center gap-2.5">
              <BookOpen className="w-3.5 h-3.5" /> NEURAL TRANSCRIPTION
            </p>
            <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-headings:font-bold prose-headings:tracking-tight prose-p:text-slate-500 prose-p:font-bold prose-p:text-[11px] prose-p:leading-relaxed prose-strong:text-indigo-600 prose-code:bg-slate-50 prose-code:text-emerald-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lecture.aiNotesMarkdown}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-100 mb-5" />
            <p className="font-bold text-slate-300 uppercase tracking-widest text-[8px]">Architecting Insights...</p>
          </div>
        )}
      </CardGlass>
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
    <div className="space-y-6 overflow-y-auto h-full pr-2 scrollbar-none">
      {answered.length > 0 && (
        <CardGlass className="bg-slate-900 rounded-3xl p-6 shadow-xl border-none">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">RETRIEVAL ACCURACY</p>
              <p className="text-base font-bold text-white tracking-tight uppercase leading-none mt-1">
                {correct} of {answered.length} CHECKPOINTS 
                <span className="text-indigo-400 ml-2">{Math.round((correct / Math.max(answered.length, 1)) * 100)}%</span>
              </p>
            </div>
          </div>
        </CardGlass>
      )}
      <div className="space-y-4">
        {checkpoints.map((cp, i) => {
          const response = answered.find(r => r.questionId === cp.id);
          return (
            <CardGlass key={cp.id} className={cn("p-6 rounded-3xl border shadow-xs transition-all relative overflow-hidden",
              response?.isCorrect ? "bg-emerald-50/30 border-emerald-100" :
                response ? "bg-red-50/30 border-red-100" : "bg-white/40 border-slate-100/50")}>
              <div className="flex items-start gap-5">
                <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-bold shrink-0 shadow-xs",
                  response?.isCorrect ? "bg-emerald-500 text-white" :
                    response ? "bg-red-500 text-white" : "bg-slate-50 text-slate-300 border border-slate-100")}>
                  C{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-2.5">{cp.segmentTitle}</p>
                  <p className="text-[13px] font-bold text-slate-700 leading-tight tracking-tight mb-5">{cp.questionText}</p>
                  {response ? (
                    <div className="flex items-center gap-2.5 bg-white border border-slate-100 p-3 rounded-xl shadow-xs">
                       <div className={cn("w-2 h-2 rounded-full", response.isCorrect ? "bg-emerald-500" : "bg-red-500")} />
                       <span className="text-[11px] font-bold text-slate-600">{response.selectedOption}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-[8px] font-bold text-slate-200 uppercase tracking-widest">
                       <Lock className="w-3 h-3" /> Locked in Stasis
                    </div>
                  )}
                </div>
              </div>
            </CardGlass>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type TabKey = "notes" | "formulas" | "quiz" | "doubt";

export default function StudentLecturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("notes");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setVideoHovered] = useState(false);
  const [doubtTimestamp, setDoubtTimestamp] = useState(0);

  const [topicProgress, setTopicProgress] = useState<TopicProgress | null>(null);
  const [mockTestId, setMockTestId] = useState<string | null>(null);
  const [completionReward, setCompletionReward] = useState<LectureCompletionReward | null>(null);

  const { watchPct: liveWatchPct, currentTime: liveCurrentTime } = useWatchPercentage(videoRef);

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
    fetchMockTestForTopic(topicId).then(mtId => setMockTestId(mtId));
  }, [lecture?.topicId, id]);

  const handleCompletion = useCallback((reward: LectureCompletionReward) => {
    setCompletionReward(reward);
    toast.success(reward.message);
    qc.invalidateQueries({ queryKey: ["student", "plan"] });
    qc.invalidateQueries({ queryKey: ["student", "me"] });
  }, [qc]);

  useLectureProgress(id ?? "", videoRef, handleCompletion);

  if (lectureLoading) return (
    <div className="py-40 flex flex-col items-center justify-center gap-8">
      <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
         <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest animate-pulse">Initializing Neural Link...</p>
    </div>
  );

  const isAccessLocked = (lectureError as any)?.response?.status === 403;
  if (isAccessLocked) return (
    <div className="py-40 flex flex-col items-center justify-center text-center px-10">
      <div className="w-20 h-20 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-sm mb-10">
        <Lock className="w-8 h-8 text-slate-200" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight mb-4">Expedition Overridden</h2>
      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest max-w-sm leading-relaxed mb-12">Access depends on chapter finalization (90%+ progress requirement).</p>
      <button onClick={() => navigate(-1)} className="px-12 py-5 rounded-2xl bg-slate-900 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-colors">Reverse Coarse</button>
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
    { key: "doubt", label: "Query", icon: MessageCircle },
  ];

  return (
    <div className="flex flex-col space-y-12 pb-32">
        {/* Status Terminal */}
        <CardGlass className="px-8 py-5 border-white bg-white/40 flex items-center justify-between sticky top-0 z-50 shadow-sm">
           <div className="flex items-center gap-5">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg group hover:bg-indigo-600 transition-all">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="min-w-0">
                 <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/50">{lecture.topic?.name ?? "Segment"}</span>
                    {isLive && <span className="flex items-center gap-2 text-[8px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-lg border border-red-100/50"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live</span>}
                 </div>
                 <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none truncate max-w-[400px] uppercase">{lecture.title}</h1>
              </div>
           </div>

           <div className="flex items-center gap-10">
              {!isLive && (
                 <div className="hidden lg:flex flex-col items-end">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">ABSORPTION RATE</p>
                    <div className="flex items-center gap-4">
                       <div className="w-28 h-1 bg-slate-100/50 rounded-full overflow-hidden border border-slate-100/30">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${displayWatchPct}%` }} className="h-full bg-indigo-600 shadow-xs" />
                       </div>
                       <span className="text-[9px] font-bold text-slate-700 tracking-tighter">{Math.round(displayWatchPct)}%</span>
                    </div>
                 </div>
              )}
           </div>
        </CardGlass>

        {/* Main Arena */}
        <div className="max-w-[1700px] mx-auto w-full grid grid-cols-1 xl:grid-cols-4 gap-12">
           <div className="xl:col-span-3 space-y-12">
              <div className="p-2 rounded-[4rem] bg-white border border-white shadow-3xl">
                 <VideoPlayer
                   src={videoSrc} checkpoints={checkpoints} lectureId={id!} videoRef={videoRef} onDoubtClick={() => { setDoubtTimestamp(liveCurrentTime); setActiveTab("doubt"); }}
                   onVideoHoverChange={setVideoHovered} currentTime={liveCurrentTime} resumeAt={savedProgress?.lastPositionSeconds}
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                   { icon: Clock, label: "Duration", value: duration ?? "--", color: "text-indigo-600", bg: "bg-indigo-50" },
                   { icon: Layers, label: "Type", value: isLive ? "Live" : "Recorded", color: "text-slate-600", bg: "bg-slate-50" },
                   { icon: Calendar, label: "Date", value: fmtDate(lecture.createdAt), color: "text-slate-600", bg: "bg-slate-50" },
                 ].map((stat, i) => (
                   <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                     <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                       <stat.icon className={`w-4 h-4 ${stat.color}`} />
                     </div>
                     <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                       <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                     </div>
                   </div>
                 ))}
              </div>

              {quizUnlocked && !isLive && (
                <motion.button
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(mockTestId ? `/student/quiz?mockTestId=${mockTestId}` : `/student/quiz?topicId=${lecture.topicId}`)}
                  className="w-full flex items-center justify-between px-8 py-6 rounded-2xl bg-slate-900 text-white shadow-xl group transition-all"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg group-hover:rotate-3 transition-transform">
                         <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                         <h4 className="text-base font-bold">Take Quiz</h4>
                         <p className="text-xs text-slate-400 mt-0.5">Test your understanding and earn XP</p>
                      </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </motion.button>
              )}
           </div>

           <aside className="xl:col-span-1 flex flex-col gap-8">
              <div className="flex gap-2 p-2 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                 {tabs.map(t => (
                   <button key={t.key} onClick={() => setActiveTab(t.key)}
                     className={cn("flex-1 py-5 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all",
                       activeTab === t.key ? "bg-slate-900 text-white shadow-xl scale-105" : "text-slate-400 hover:text-slate-900")}>
                      <t.icon className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                   </button>
                 ))}
              </div>

              <div className="flex-1">
                 <AnimatePresence mode="wait">
                    {activeTab === "notes" && (
                      <motion.div key="notes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <NotesPanel lecture={lecture} />
                      </motion.div>
                    )}
                    {activeTab === "formulas" && (
                      <motion.div key="formulas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <FormulasTab formulas={lecture.aiFormulas?.map(f => ({ name: "N/A", latex: f, description: "" })) ?? []} />
                      </motion.div>
                    )}
                    {activeTab === "quiz" && (
                      <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <QuizSummaryPanel checkpoints={checkpoints} savedResponses={savedProgress?.quizResponses} />
                      </motion.div>
                    )}
                    {activeTab === "doubt" && (
                      <motion.div key="doubt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <CardGlass className="p-1 border-white shadow-2xl overflow-hidden bg-white/60">
                          <AskDoubtPanel lectureId={id!} topicId={lecture.topicId} topicName={lecture.topic?.name ?? "General"} lectureTitle={lecture.title} timestampSeconds={doubtTimestamp} onClose={() => setActiveTab("notes")} />
                        </CardGlass>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </aside>
        </div>
    </div>
  );
}
