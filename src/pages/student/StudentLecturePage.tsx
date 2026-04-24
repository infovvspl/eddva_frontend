import { useState, useRef, useEffect, useCallback, type MutableRefObject } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, CheckCircle, XCircle, Clock,
  ChevronRight, Sparkles, Play, Pause, Volume2, VolumeX,
  Maximize, RotateCcw, Trophy, Tag, FlaskConical,
  MessageCircle, Loader2, Lock, Calendar, FileText,
  X, Layers, ExternalLink, Download,
  ClipboardList, Link2, Youtube, BookMarked, AlertTriangle,
} from "lucide-react";
import { type TopicResource, type TopicResourceType } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { cleanAiNotesContent } from "@/lib/ai-notes";
import { apiClient, extractData } from "@/lib/api/client";
import {
  getQuizCheckpoints, submitQuizResponse, translateTranscriptToHindi, translateNotesToEnglish,
  type QuizCheckpoint, type QuizSubmitResult, type Lecture,
  type LectureCompletionReward,
} from "@/lib/api/teacher";
import { getTopicProgress, generateAiQuiz, completeAiQuiz, type TopicProgress, type AiQuizQuestion } from "@/lib/api/student";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useWatchPercentage } from "@/hooks/useWatchPercentage";
import { useLectureProgress, type ExternalLecturePlayback } from "@/hooks/useLectureProgress";
import { SpeedControl } from "@/components/lecture/SpeedControl";
import { AskDoubtPanel } from "@/components/lecture/AskDoubtPanel";
import { FormulasTab } from "@/components/lecture/FormulasTab";
import { isYouTubeUrl, YOUTUBE_LECTURE_CAPTIONS_HINT } from "@/lib/lecture-source";
import {
  ensureYouTubeIframeApi,
  extractYouTubeVideoIdFromUrl,
  YT_ENDED,
  YT_PAUSED,
  YT_PLAYING,
  type YTPlayer,
} from "@/lib/youtube-iframe-api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function fetchMockTestForTopic(topicId: string): Promise<string | null> {
  try {
    const res = await apiClient.get(`/assessments/mock-tests?topicId=${topicId}&isPublished=true&limit=1`);
    const outer = extractData<{ data?: { id: string }[] } | { id: string }[]>(res);
    let list: { id: string }[] = [];
    if (outer && !Array.isArray(outer) && Array.isArray((outer as any).data)) list = (outer as any).data;
    else if (Array.isArray(outer)) list = outer;
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

async function fetchTopicResources(topicId: string): Promise<TopicResource[]> {
  try {
    const res = await apiClient.get(`/content/topics/${topicId}/resources`);
    return extractData<TopicResource[]>(res) ?? [];
  } catch { return []; }
}

// ─── Resource type config ──────────────────────────────────────────────────────

const RESOURCE_CONFIG: Record<TopicResourceType, {
  label: string; icon: React.ElementType;
  bg: string; text: string; border: string;
}> = {
  pdf:   { label: "PDF",    icon: FileText,     bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
  notes: { label: "Notes",  icon: BookMarked,   bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  dpp:   { label: "DPP",    icon: ClipboardList,bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  pyq:   { label: "PYQ",    icon: Trophy,       bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200"  },
  video: { label: "Video",  icon: Youtube,      bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200"    },
  link:  { label: "Link",   icon: Link2,        bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200"  },
  quiz:  { label: "Quiz",   icon: Sparkles,     bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
};

function youtubeThumb(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

// ─── Materials Section ────────────────────────────────────────────────────────

function MaterialsSection({ lecture, resources }: { lecture: Lecture; resources: TopicResource[] }) {
  const duration = fmtDuration(lecture.videoDurationSeconds);

  const groups = [
    { key: "pyq" as TopicResourceType,   items: resources.filter(r => r.type === "pyq")   },
    { key: "dpp" as TopicResourceType,   items: resources.filter(r => r.type === "dpp")   },
    { key: "pdf" as TopicResourceType,   items: resources.filter(r => r.type === "pdf")   },
    { key: "notes" as TopicResourceType, items: resources.filter(r => r.type === "notes") },
    { key: "video" as TopicResourceType, items: resources.filter(r => r.type === "video") },
    { key: "link" as TopicResourceType,  items: resources.filter(r => r.type === "link")  },
  ].filter(g => g.items.length > 0);

  const ytVideos = resources.filter(
    r => (r.type === "video" || r.type === "link") && r.externalUrl && isYouTubeUrl(r.externalUrl)
  );
  const nonYt = resources.filter(
    r => !((r.type === "video" || r.type === "link") && r.externalUrl && isYouTubeUrl(r.externalUrl ?? ""))
  );

  return (
    <div className="space-y-5">
      {/* ── Lecture meta card ── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-slate-900 mb-2">{lecture.title}</h2>
        {lecture.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-4">{lecture.description}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {duration && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> {duration}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            {lecture.type === "live" ? "Live Class" : "Recorded"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {fmtDate(lecture.createdAt)}
          </span>
          {lecture.topic?.name && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-xl">
              <Tag className="w-3.5 h-3.5" /> {lecture.topic.name}
            </span>
          )}
        </div>
      </div>

      {/* ── YouTube embeds ── */}
      {ytVideos.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" /> Related Videos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ytVideos.map(r => {
              const thumb = youtubeThumb(r.externalUrl ?? "");
              return (
                <a key={r.id} href={r.externalUrl!} target="_blank" rel="noopener noreferrer"
                  className="group relative rounded-xl overflow-hidden border border-slate-100 hover:border-red-300 transition-all hover:shadow-md">
                  {thumb ? (
                    <div className="relative aspect-video bg-slate-100">
                      <img src={thumb} alt={r.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-100 flex items-center justify-center">
                      <Youtube className="w-10 h-10 text-red-400" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-red-600 transition-colors">{r.title}</p>
                    {r.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{r.description}</p>}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Other resources grouped by type ── */}
      {nonYt.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" /> Study Materials
          </p>

          {groups.filter(g => g.items.some(i =>
            !((i.type === "video" || i.type === "link") && i.externalUrl && isYouTubeUrl(i.externalUrl ?? ""))
          )).map(({ key, items }) => {
            const cfg = RESOURCE_CONFIG[key];
            const filteredItems = items.filter(i =>
              !((i.type === "video" || i.type === "link") && i.externalUrl && isYouTubeUrl(i.externalUrl ?? ""))
            );
            if (!filteredItems.length) return null;
            return (
              <div key={key}>
                <div className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg mb-3", cfg.bg, cfg.text)}>
                  <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredItems.map(r => {
                    const href = r.fileUrl || r.externalUrl || "#";
                    const isExternal = !!r.externalUrl && !r.fileUrl;
                    return (
                      <a key={r.id} href={href} target="_blank" rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm group",
                          cfg.bg, cfg.border, "hover:brightness-95"
                        )}>
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/70")}>
                          <cfg.icon className={cn("w-4.5 h-4.5", cfg.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-semibold truncate", cfg.text)}>{r.title}</p>
                          {r.description && <p className="text-xs text-slate-400 truncate mt-0.5">{r.description}</p>}
                          {r.fileSizeKb && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{(r.fileSizeKb / 1024).toFixed(1)} MB</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {isExternal
                            ? <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                            : <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                          }
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resources.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No materials uploaded yet</p>
          <p className="text-xs text-slate-300 mt-1">Your teacher hasn't added study materials for this topic</p>
        </div>
      )}
    </div>
  );
}

// ─── Quiz Popup ────────────────────────────────────────────────────────────────

type QuizState = "asking" | "correct" | "wrong";

function QuizPopup({ question, questionIndex, total, onAnswer, onClose }: {
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
    } catch { setState("wrong"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
              Checkpoint {questionIndex + 1} / {total}
            </span>
            <span className="text-xs font-semibold text-white/60">{question.segmentTitle}</span>
          </div>
        </div>

        <div className="px-6 py-6">
          <p className="text-base font-bold text-slate-800 leading-snug mb-6">{question.questionText}</p>
          <div className="space-y-3">
            {question.options.map((opt) => {
              const isSelected = selected === opt.label;
              const isCorrect = result?.correctOption === opt.label;
              const isWrong = state === "wrong" && isSelected;
              const showResult = state !== "asking";
              return (
                <button key={opt.label} onClick={() => state === "asking" && setSelected(opt.label)}
                  disabled={state !== "asking"}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 text-left text-sm font-semibold transition-all",
                    state === "asking" && !isSelected && "border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200",
                    state === "asking" && isSelected && "border-indigo-500 bg-indigo-50 text-indigo-700",
                    showResult && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                    showResult && isWrong && "border-red-400 bg-red-50 text-red-600",
                    showResult && !isCorrect && !isWrong && "border-slate-100 opacity-40",
                  )}>
                  <span className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                    state === "asking" && isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500",
                    showResult && isCorrect ? "bg-emerald-500 text-white" : "",
                    showResult && isWrong ? "bg-red-500 text-white" : "",
                  )}>
                    {opt.label}
                  </span>
                  <span className="flex-1 text-slate-700">{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6">
          {state === "asking" ? (
            <button onClick={handleSubmit} disabled={!selected || isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-40">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit <ChevronRight className="w-4 h-4" /></>}
            </button>
          ) : (
            <div className="space-y-3">
              <div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 border",
                state === "correct" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200")}>
                {state === "correct"
                  ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                <div>
                  <p className={cn("text-sm font-bold", state === "correct" ? "text-emerald-700" : "text-red-600")}>
                    {state === "correct" ? "Correct!" : "Not quite"}
                  </p>
                  {result?.explanation && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{result.explanation}</p>}
                </div>
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                <Play className="w-3.5 h-3.5 fill-current" /> Continue watching
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Video Player ──────────────────────────────────────────────────────────────

function VideoPlayer({
  src,
  checkpoints,
  lectureId,
  videoRef,
  onDoubtClick,
  resumeAt,
  onEnded,
  externalPlaybackRef,
  onFlushLectureProgress,
  onYouTubeTick,
}: {
  src: string;
  checkpoints: QuizCheckpoint[];
  lectureId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  onDoubtClick: () => void;
  resumeAt?: number;
  onEnded?: () => void;
  externalPlaybackRef?: MutableRefObject<ExternalLecturePlayback | null>;
  onFlushLectureProgress?: () => void | Promise<void>;
  /** Throttled (~3/s) so parent can update progress UI without reading refs during render */
  onYouTubeTick?: (percent: number, seconds: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytTickRef = useRef<ReturnType<typeof setInterval>>();
  const checkpointsRef = useRef(checkpoints);
  const activeQuizRef = useRef<QuizCheckpoint | null>(null);
  const shownIdsRef = useRef<Set<string>>(new Set());

  const [playing, setPlaying] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<QuizCheckpoint | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [resumeToast, setResumeToast] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastUiReport = useRef(0);

  useEffect(() => {
    checkpointsRef.current = checkpoints;
  }, [checkpoints]);

  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  useEffect(() => {
    shownIdsRef.current = new Set();
    lastUiReport.current = 0;
  }, [src]);

  const isYouTube = src.includes("youtube.com") || src.includes("youtu.be");

  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  };

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
    const cps = checkpointsRef.current;
    for (const cp of cps) {
      if (shownIdsRef.current.has(cp.id)) continue;
      if (pct >= cp.triggerAtPercent) {
        v.pause();
        shownIdsRef.current.add(cp.id);
        setActiveQuiz(cp);
        setQuizIndex(cps.indexOf(cp));
        break;
      }
    }
  }, [duration, videoRef]);

  const handleAnswer = async (option: string) => {
    if (!activeQuiz) throw new Error("no quiz");
    const v = videoRef.current;
    const t = isYouTube ? localTime : (v?.currentTime ?? 0);
    const taken = Math.max(0, 30 - Math.floor(t % 30));
    return await submitQuizResponse(lectureId, {
      questionId: activeQuiz.id,
      selectedOption: option,
      timeTakenSeconds: taken,
    });
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  useEffect(() => {
    if (!isYouTube) return;
    const videoId = extractYouTubeVideoIdFromUrl(src);
    if (!videoId || !ytContainerRef.current) return;

    let cancelled = false;

    void (async () => {
      try {
        await ensureYouTubeIframeApi();
      } catch {
        return;
      }
      if (cancelled || !ytContainerRef.current || !window.YT?.Player) return;

      new window.YT.Player(ytContainerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          enablejsapi: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (ev: { target: YTPlayer }) => {
            if (cancelled) return;
            const p = ev.target;
            ytPlayerRef.current = p;
            let dur = 0;
            try {
              dur = p.getDuration();
            } catch { /* */ }
            if (dur > 0) setDuration(dur);
            if (resumeAt && resumeAt > 5) {
              p.seekTo(resumeAt, true);
              const mins = Math.floor(resumeAt / 60);
              const secs = String(Math.floor(resumeAt % 60)).padStart(2, "0");
              setResumeToast(`Resuming at ${mins}:${secs}`);
              setTimeout(() => setResumeToast(null), 3000);
            }

            ytTickRef.current = setInterval(() => {
              const player = ytPlayerRef.current;
              if (!player || cancelled) return;
              let cur = 0;
              let dur2 = 0;
              let st = YT_PAUSED;
              try {
                cur = player.getCurrentTime();
                dur2 = player.getDuration();
                st = player.getPlayerState();
              } catch {
                return;
              }
              if (dur2 > 0) setDuration(dur2);
              setLocalTime(cur);
              const pct = dur2 > 0 ? (cur / dur2) * 100 : 0;
              const isPlayingNow = st === YT_PLAYING;
              setPlaying(isPlayingNow);
              if (externalPlaybackRef) {
                externalPlaybackRef.current = {
                  watchPercentage: pct,
                  lastPositionSeconds: Math.floor(cur),
                  isPlaying: isPlayingNow,
                };
              }
              const now = Date.now();
              if (onYouTubeTick && now - lastUiReport.current >= 320) {
                lastUiReport.current = now;
                onYouTubeTick(pct, Math.floor(cur));
              }
              if (activeQuizRef.current) return;
              const cps = checkpointsRef.current;
              for (const cp of cps) {
                if (shownIdsRef.current.has(cp.id)) continue;
                if (pct >= cp.triggerAtPercent) {
                  try {
                    player.pauseVideo();
                  } catch { /* */ }
                  shownIdsRef.current.add(cp.id);
                  setActiveQuiz(cp);
                  setQuizIndex(cps.indexOf(cp));
                  break;
                }
              }
            }, 250);
          },
          onStateChange: (ev: { data: number; target: YTPlayer }) => {
            if (ev.data !== YT_ENDED) return;
            setPlaying(false);
            setVideoEnded(true);
            const p = ev.target;
            let dur2 = 0;
            try {
              dur2 = p.getDuration();
            } catch { /* */ }
            if (externalPlaybackRef) {
              externalPlaybackRef.current = {
                watchPercentage: 100,
                lastPositionSeconds: Math.floor(dur2),
                isPlaying: false,
              };
            }
            void onFlushLectureProgress?.();
          },
        },
      } as Record<string, unknown>);
    })();

    return () => {
      cancelled = true;
      if (ytTickRef.current) clearInterval(ytTickRef.current);
      try {
        ytPlayerRef.current?.destroy?.();
      } catch { /* */ }
      ytPlayerRef.current = null;
      if (externalPlaybackRef) externalPlaybackRef.current = null;
    };
  }, [isYouTube, src, resumeAt, externalPlaybackRef, onFlushLectureProgress, onYouTubeTick]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const progressPct = duration ? (localTime / duration) * 100 : 0;

  const resumePlaybackAfterQuiz = () => {
    setActiveQuiz(null);
    if (isYouTube) ytPlayerRef.current?.playVideo();
    else void videoRef.current?.play();
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-2xl overflow-hidden aspect-video"
      onMouseMove={showControls} onClick={!isYouTube ? togglePlay : undefined}>
      {isYouTube ? (
        <div ref={ytContainerRef} className="w-full h-full min-h-[200px]" />
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
              setResumeToast(`Resuming at ${mins}:${secs}`);
              setTimeout(() => setResumeToast(null), 3000);
            }
          }}
          onPlay={() => { setPlaying(true); setVideoEnded(false); hideTimer.current = setTimeout(() => setControlsVisible(false), 3000); }}
          onPause={() => { setPlaying(false); setControlsVisible(true); clearTimeout(hideTimer.current); }}
          onEnded={() => { setPlaying(false); setVideoEnded(true); setControlsVisible(true); }}
        />
      )}

      <AnimatePresence>
        {activeQuiz && (
          <QuizPopup question={activeQuiz} questionIndex={quizIndex} total={checkpoints.length}
            onAnswer={handleAnswer} onClose={resumePlaybackAfterQuiz} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resumeToast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> {resumeToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Video End Screen ── */}
      <AnimatePresence>
        {videoEnded && !activeQuiz && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 16 }} animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center gap-5 px-6 text-center max-w-sm"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black text-xl">Lecture Complete!</p>
                <p className="text-white/50 text-sm mt-1">Great job. Now test what you've learned.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => {
                    setVideoEnded(false);
                    if (isYouTube) {
                      ytPlayerRef.current?.seekTo(0, true);
                      ytPlayerRef.current?.playVideo();
                    } else {
                      const v = videoRef.current;
                      if (v) {
                        v.currentTime = 0;
                        void v.play();
                      }
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/20 text-white/80 text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Replay
                </button>
                {onEnded && (
                  <button
                    onClick={() => onEnded()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-900/50"
                  >
                    <Sparkles className="w-4 h-4" /> Take Quiz
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom controls */}
      {!isYouTube && (
        <AnimatePresence>
          {controlsVisible && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              onClick={e => e.stopPropagation()}
            >
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
                <div className="flex items-center justify-end px-4 pt-3">
                  <button onClick={e => { e.stopPropagation(); onDoubtClick(); }}
                    className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all border border-white/20">
                    <MessageCircle className="w-3.5 h-3.5" /> Ask Doubt
                  </button>
                </div>
              </div>

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-4 pointer-events-auto"
                onClick={e => e.stopPropagation()}>
                {/* Seekbar */}
                <div className="mb-3 relative group/seek" onClick={seek}>
                  <div className="h-1 bg-white/20 rounded-full cursor-pointer group-hover/seek:h-2 transition-all relative">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progressPct}%` }} />
                    {checkpoints.map(cp => (
                      <div key={cp.id} title="Quiz checkpoint"
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400 border border-black/40 -translate-x-1/2"
                        style={{ left: `${cp.triggerAtPercent}%` }} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="text-white hover:text-indigo-300 transition-colors">
                    {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
                    className="text-white/60 hover:text-white transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <span className="text-white/70 text-xs font-mono tabular-nums">{fmt(localTime)} / {fmt(duration)}</span>
                  <div className="flex-1" />
                  <SpeedControl videoRef={videoRef} />
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
                      className="text-white/60 hover:text-white transition-colors">
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                      onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; }}
                      className="w-16 accent-indigo-400 cursor-pointer h-1" />
                  </div>
                  <button onClick={() => containerRef.current?.requestFullscreen()} className="text-white/60 hover:text-white transition-colors">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

function NotesPanel({ lecture }: { lecture: Lecture }) {
  const [enMode, setEnMode] = useState(false);
  const [notesEn, setNotesEn] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const youtubeSource = isYouTubeUrl(lecture.videoUrl);
  const ts = lecture.transcriptStatus;

  const handleToggleEnglish = async () => {
    if (enMode) { setEnMode(false); return; }
    if (notesEn) { setEnMode(true); return; }
    setIsTranslating(true);
    setTranslateError(null);
    try {
      const result = await translateNotesToEnglish(lecture.id);
      setNotesEn(result.notesEn);
      setEnMode(true);
    } catch {
      setTranslateError("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const rawNotes = enMode && notesEn ? notesEn : lecture.aiNotesMarkdown;
  const displayNotes = cleanAiNotesContent(rawNotes ?? "");

  return (
    <div className="space-y-4">
      {(lecture.aiKeyConcepts?.length ?? 0) > 0 && (
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Tag className="w-3 h-3" /> Key Concepts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lecture.aiKeyConcepts!.map((c, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white text-indigo-700 border border-indigo-200">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100">
        {displayNotes ? (
          <div className="p-5">
            {/* Header row with title + language toggle */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> AI Notes
              </p>
              <button
                onClick={handleToggleEnglish}
                disabled={isTranslating}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                  enMode
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                )}
              >
                {isTranslating
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Translating…</>
                  : enMode
                    ? "View in Hindi"
                    : "View in English"
                }
              </button>
            </div>

            {translateError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                {translateError}
              </p>
            )}

            <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-headings:font-bold prose-p:text-slate-600 prose-p:text-xs prose-p:leading-relaxed prose-strong:text-indigo-600 prose-code:bg-slate-50 prose-code:text-emerald-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              {displayNotes && /<[a-z][\s\S]*>/i.test(displayNotes) && (displayNotes.includes('<p>') || displayNotes.includes('<h1>') || displayNotes.includes('<ul>')) ? (
                 <div dangerouslySetInnerHTML={{ __html: displayNotes }} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayNotes ?? ""}</ReactMarkdown>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3",
              ts === "failed" ? "bg-amber-50" : "bg-indigo-50",
            )}>
              {ts === "failed" ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500">
              {ts === "failed" ? "AI notes could not be generated" : "AI is generating notes…"}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {ts === "failed"
                ? (youtubeSource ? YOUTUBE_LECTURE_CAPTIONS_HINT : "The lecture could not be processed. Try again later.")
                : ts === "processing" || ts === "pending"
                  ? (youtubeSource ? "Using YouTube captions when available." : "Check back in a moment.")
                  : youtubeSource
                    ? "Notes appear here once captions are processed."
                    : "Check back in a moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quiz Summary Panel ───────────────────────────────────────────────────────

function QuizSummaryPanel({ checkpoints, savedResponses }: {
  checkpoints: QuizCheckpoint[];
  savedResponses?: { questionId: string; isCorrect: boolean; selectedOption: string }[];
}) {
  const answered = savedResponses ?? [];
  const correct = answered.filter(r => r.isCorrect).length;

  return (
    <div className="space-y-3">
      {answered.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</p>
            <p className="text-base font-black text-white">
              {correct}/{answered.length}
              <span className="text-indigo-400 ml-1.5 text-sm">
                {Math.round((correct / Math.max(answered.length, 1)) * 100)}%
              </span>
            </p>
          </div>
        </div>
      )}
      {checkpoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="w-8 h-8 text-slate-200 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No quiz checkpoints yet</p>
        </div>
      ) : checkpoints.map((cp, i) => {
        const response = answered.find(r => r.questionId === cp.id);
        return (
          <div key={cp.id} className={cn("p-4 rounded-2xl border",
            response?.isCorrect ? "bg-emerald-50 border-emerald-200" :
              response ? "bg-red-50 border-red-200" : "bg-white border-slate-100")}>
            <div className="flex items-start gap-3">
              <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                response?.isCorrect ? "bg-emerald-500 text-white" :
                  response ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400")}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 mb-1">{cp.segmentTitle}</p>
                <p className="text-sm font-semibold text-slate-800 leading-snug mb-2">{cp.questionText}</p>
                {response ? (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <div className={cn("w-1.5 h-1.5 rounded-full", response.isCorrect ? "bg-emerald-500" : "bg-red-500")} />
                    <span className={response.isCorrect ? "text-emerald-700" : "text-red-600"}>
                      {response.selectedOption}
                    </span>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-300">
                    <Lock className="w-3 h-3" /> Not answered
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Transcript Panel ─────────────────────────────────────────────────────────

function TranscriptPanel({ lecture }: { lecture: Lecture }) {
  const [hiMode, setHiMode] = useState(false);
  const [transcriptHi, setTranscriptHi] = useState<string | null>(lecture.transcriptHi ?? null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const handleToggleHindi = async () => {
    if (hiMode) { setHiMode(false); return; }
    if (transcriptHi) { setHiMode(true); return; }
    setIsTranslating(true);
    setTranslateError(null);
    try {
      const result = await translateTranscriptToHindi(lecture.id);
      setTranscriptHi(result.transcriptHi);
      setHiMode(true);
    } catch { setTranslateError("Translation failed. Please try again."); }
    finally { setIsTranslating(false); }
  };

  const displayText = hiMode && transcriptHi ? transcriptHi : (lecture.transcript ?? "");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="w-3 h-3" /> Transcript
        </p>
        <button onClick={handleToggleHindi} disabled={isTranslating}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
            hiMode ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600")}>
          {isTranslating ? <><Loader2 className="w-3 h-3 animate-spin" /> Translating…</> : hiMode ? "Switch to English" : "हिंदी में देखें"}
        </button>
      </div>
      {translateError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{translateError}</p>}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">{displayText}</p>
      </div>
    </div>
  );
}

// ─── Videos Panel ─────────────────────────────────────────────────────────────

function VideosPanel({ resources }: { resources: TopicResource[] }) {
  const [active, setActive] = useState<TopicResource>(resources[0]);

  const toEmbedUrl = (url: string) => {
    const m = url.match(/(?:v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`;
    return url;
  };

  return (
    <div className="space-y-3">
      {/* Embedded player */}
      {active?.externalUrl && (
        <div className="rounded-xl overflow-hidden bg-black aspect-video shadow-md">
          <iframe
            key={active.id}
            src={toEmbedUrl(active.externalUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <p className="text-sm font-bold text-slate-800 leading-snug px-0.5">{active?.title}</p>
      {active?.description && (
        <p className="text-xs text-slate-500 leading-relaxed px-0.5">{active.description}</p>
      )}

      {resources.length > 1 && (
        <div className="pt-1 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">More Videos</p>
          {resources.filter(r => r.id !== active?.id).map(r => {
            const thumb = youtubeThumb(r.externalUrl ?? "");
            return (
              <button key={r.id} onClick={() => setActive(r)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50/50 transition-all text-left group">
                <div className="w-20 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 relative">
                  {thumb
                    ? <img src={thumb} alt={r.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Youtube className="w-5 h-5 text-red-400" /></div>
                  }
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 line-clamp-2 group-hover:text-red-700 transition-colors">{r.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Resource List Panel (DPP / PYQ / PDF / Notes / Links) ────────────────────

function ResourceListPanel({ resources, type }: { resources: TopicResource[]; type: TopicResourceType }) {
  const cfg = RESOURCE_CONFIG[type];
  if (!resources.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <cfg.icon className="w-8 h-8 text-slate-200 mb-3" />
      <p className="text-sm font-semibold text-slate-400">No {cfg.label} uploaded yet</p>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {resources.map((r, i) => {
        const href = r.fileUrl || r.externalUrl || "#";
        const isExternal = !!r.externalUrl && !r.fileUrl;
        return (
          <a key={r.id} href={href} target="_blank" rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm group",
              cfg.bg, cfg.border
            )}>
            {/* Index badge */}
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs bg-white/80", cfg.text)}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-bold leading-snug", cfg.text)}>{r.title}</p>
              {r.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.description}</p>
              )}
              {r.fileSizeKb && (
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  {r.fileSizeKb >= 1024
                    ? `${(r.fileSizeKb / 1024).toFixed(1)} MB`
                    : `${r.fileSizeKb} KB`}
                </p>
              )}
            </div>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/60 group-hover:bg-white transition-all", cfg.text)}>
              {isExternal
                ? <ExternalLink className="w-3.5 h-3.5" />
                : <Download className="w-3.5 h-3.5" />
              }
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ─── Lecture Info Card (compact — no duplicate material) ──────────────────────

function LectureInfoCard({ lecture }: { lecture: Lecture }) {
  const duration = fmtDuration(lecture.videoDurationSeconds);
  const isLiveNow = lecture.status === "live";
  const recordingPending = lecture.type === "live" && lecture.status === "ended" && !lecture.videoUrl;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4">
      <h2 className="text-base font-bold text-slate-900 mb-1 leading-snug">{lecture.title}</h2>
      {lecture.description && (
        <p className="text-sm text-slate-500 leading-relaxed mb-3">{lecture.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {duration && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <Clock className="w-3 h-3 text-indigo-500" /> {duration}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
          <Layers className="w-3 h-3 text-slate-400" /> {recordingPending ? "Recording Pending" : isLiveNow ? "Live Class" : "Recorded"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
          <Calendar className="w-3 h-3 text-slate-400" /> {fmtDate(lecture.createdAt)}
        </span>
        {lecture.topic?.name && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
            <Tag className="w-3 h-3" /> {lecture.topic.name}
          </span>
        )}
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

type AiTabKey  = "notes" | "formulas" | "transcript" | "quiz" | "doubt";
type MatTabKey = "all"   | "videos"   | "dpp"        | "pyq"  | "pdf"   | "links";

export default function StudentLecturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const handleBack = () => {
    const from = searchParams.get("from");
    if (from) {
      navigate(from);
    } else {
      // Fallback: Check if we have history, otherwise go to lectures list
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/student/lectures");
      }
    }
  };

  const [activeAiTab,  setActiveAiTab]  = useState<AiTabKey>("notes");
  const [activeMatTab, setActiveMatTab] = useState<MatTabKey>("all");
  const [aiOpen,       setAiOpen]       = useState(true);
  const [mobileAiOpen, setMobileAiOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlaybackRef = useRef<ExternalLecturePlayback | null>(null);
  const [ytDisplay, setYtDisplay] = useState({ pct: 0, sec: 0 });
  const [doubtTimestamp,   setDoubtTimestamp]   = useState(0);
  const [topicProgress,    setTopicProgress]    = useState<TopicProgress | null>(null);
  const [mockTestId,       setMockTestId]       = useState<string | null>(null);
  const [completionReward, setCompletionReward] = useState<LectureCompletionReward | null>(null);
  const [showQuizModal,    setShowQuizModal]    = useState(false);

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

  const { data: topicResources = [] } = useQuery({
    queryKey: ["student", "topic-resources", lecture?.topicId],
    queryFn: () => fetchTopicResources(lecture!.topicId!),
    enabled: !!lecture?.topicId,
  });

  useEffect(() => {
    if (!lecture?.topicId) return;
    getTopicProgress(lecture.topicId).then(p => setTopicProgress(p)).catch(() => {});
    fetchMockTestForTopic(lecture.topicId).then(setMockTestId);
  }, [lecture?.topicId]);

  useEffect(() => {
    ytPlaybackRef.current = null;
    setYtDisplay({ pct: 0, sec: 0 });
  }, [id]);

  const handleCompletion = useCallback((reward: LectureCompletionReward) => {
    setCompletionReward(reward);
    toast.success(reward.message);
    qc.invalidateQueries({ queryKey: ["student", "plan"] });
    qc.invalidateQueries({ queryKey: ["student", "me"] });
  }, [qc]);

  const { flushSave } = useLectureProgress(id ?? "", videoRef, handleCompletion, ytPlaybackRef);

  const flushLectureProgress = useCallback(() => flushSave(), [flushSave]);

  const onYouTubeTick = useCallback((pct: number, sec: number) => {
    setYtDisplay({ pct, sec });
  }, []);

  // ── Loading ──
  if (lectureLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-sm text-slate-400 font-medium animate-pulse">Loading lecture…</p>
    </div>
  );



  if (!lecture) return null;

  const videoSrc        = lecture.videoUrl ?? "";
  const hasPlayableVideo = !!videoSrc;
  const isYtLecture     = isYouTubeUrl(videoSrc);
  const displayWatchPct = isYtLecture
    ? Math.max(savedProgress?.watchPercentage ?? 0, ytDisplay.pct)
    : liveWatchPct > 0
      ? liveWatchPct
      : (savedProgress?.watchPercentage ?? 0);
  const isLiveNow       = lecture.status === "live";
  const isScheduledLive = lecture.type === "live" && lecture.status === "scheduled";
  const recordingPending = lecture.type === "live" && lecture.status === "ended" && !hasPlayableVideo;
  const isLive          = isLiveNow;
  const isPlaybackOnlySource = isYouTubeUrl(videoSrc);

  // ── Resource groups ──────────────────────────────────────────────────────────
  const videoRes = topicResources.filter(r =>
    (r.type === "video" || r.type === "link") && r.externalUrl && isYouTubeUrl(r.externalUrl),
  );
  const dppRes   = topicResources.filter(r => r.type === "dpp");
  const pyqRes   = topicResources.filter(r => r.type === "pyq");
  const pdfRes   = topicResources.filter(r => r.type === "pdf" || r.type === "notes");
  const linkRes  = topicResources.filter(r => r.type === "link" && !isYouTubeUrl(r.externalUrl ?? ""));

  // ── AI tabs ──────────────────────────────────────────────────────────────────
  const aiTabs: { key: AiTabKey; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "notes",    label: "AI Notes",  icon: BookOpen },
    { key: "formulas", label: "Formulas",  icon: FlaskConical },
    ...(lecture.transcript ? [{ key: "transcript" as const, label: "Transcript", icon: FileText }] : []),
    ...(checkpoints.length > 0 ? [{ key: "quiz" as const, label: "Quiz", icon: Sparkles, badge: checkpoints.length }] : []),
    { key: "doubt",    label: "Ask Doubt", icon: MessageCircle },
  ];

  // ── Material tabs (only show tabs that have content) ─────────────────────────
  const matTabs: { key: MatTabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: "all",    label: "All",         icon: Layers,        count: topicResources.length },
    ...(videoRes.length > 0 ? [{ key: "videos" as const, label: "Videos",      icon: Youtube,       count: videoRes.length }] : []),
    ...(dppRes.length   > 0 ? [{ key: "dpp"    as const, label: "DPP",         icon: ClipboardList, count: dppRes.length   }] : []),
    ...(pyqRes.length   > 0 ? [{ key: "pyq"    as const, label: "PYQ",         icon: Trophy,        count: pyqRes.length   }] : []),
    ...(pdfRes.length   > 0 ? [{ key: "pdf"    as const, label: "Notes & PDF", icon: FileText,      count: pdfRes.length   }] : []),
    ...(linkRes.length  > 0 ? [{ key: "links"  as const, label: "Links",       icon: Link2,         count: linkRes.length  }] : []),
  ];

  // ── AI panel content ─────────────────────────────────────────────────────────
  const aiContent = (
    <AnimatePresence mode="wait">
      {activeAiTab === "notes" && (
        <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <NotesPanel lecture={lecture} />
        </motion.div>
      )}
      {activeAiTab === "formulas" && (
        <motion.div key="formulas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <FormulasTab formulas={lecture.aiFormulas?.map(f => ({ name: "N/A", latex: f, description: "" })) ?? []} />
        </motion.div>
      )}
      {activeAiTab === "quiz" && (
        <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <QuizSummaryPanel checkpoints={checkpoints} savedResponses={savedProgress?.quizResponses} />
        </motion.div>
      )}
      {activeAiTab === "transcript" && (
        <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <TranscriptPanel lecture={lecture} />
        </motion.div>
      )}
      {activeAiTab === "doubt" && (
        <motion.div key="doubt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AskDoubtPanel
            lectureId={id!} topicId={lecture.topicId}
            topicName={lecture.topic?.name ?? "General"} lectureTitle={lecture.title}
            timestampSeconds={doubtTimestamp} onClose={() => setMobileAiOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Materials content renderer ───────────────────────────────────────────────
  const renderMaterials = () => {
    if (activeMatTab === "videos") return <VideosPanel resources={videoRes} />;
    if (activeMatTab === "dpp")    return <ResourceListPanel resources={dppRes}  type="dpp"   />;
    if (activeMatTab === "pyq")    return <ResourceListPanel resources={pyqRes}  type="pyq"   />;
    if (activeMatTab === "pdf")    return <ResourceListPanel resources={pdfRes}  type="pdf"   />;
    if (activeMatTab === "links")  return <ResourceListPanel resources={linkRes} type="link"  />;

    // "all" tab — grouped sections
    const sections: { key: MatTabKey; label: string; cfg: typeof RESOURCE_CONFIG[keyof typeof RESOURCE_CONFIG]; items: TopicResource[]; isVideo?: boolean }[] = [
      { key: "videos", label: "Videos",      cfg: RESOURCE_CONFIG["video"], items: videoRes,  isVideo: true },
      { key: "dpp",    label: "DPP",          cfg: RESOURCE_CONFIG["dpp"],  items: dppRes  },
      { key: "pyq",    label: "PYQ",          cfg: RESOURCE_CONFIG["pyq"],  items: pyqRes  },
      { key: "pdf",    label: "Notes & PDF",  cfg: RESOURCE_CONFIG["pdf"],  items: pdfRes  },
      { key: "links",  label: "Links",        cfg: RESOURCE_CONFIG["link"], items: linkRes },
    ].filter(s => s.items.length > 0);

    if (sections.length === 0) return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-400">No materials uploaded yet</p>
        <p className="text-xs text-slate-300 mt-1">Your teacher hasn't added study materials for this topic</p>
      </div>
    );

    return (
      <div className="space-y-6">
        {sections.map(sec => (
          <div key={sec.key}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", sec.cfg.bg)}>
                <sec.cfg.icon className={cn("w-3.5 h-3.5", sec.cfg.text)} />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{sec.label}</p>
              <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-full", sec.cfg.bg, sec.cfg.text)}>
                {sec.items.length}
              </span>
            </div>
            {sec.isVideo
              ? <VideosPanel resources={sec.items} />
              : <ResourceListPanel resources={sec.items} type={sec.items[0]?.type as TopicResourceType} />
            }
          </div>
        ))}
      </div>
    );
  };

  // ── AI tab strip helper ───────────────────────────────────────────────────────
  const AiTabStrip = ({ compact }: { compact?: boolean }) => (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-100">
      {aiTabs.map(t => (
        <button key={t.key} onClick={() => setActiveAiTab(t.key)}
          className={cn(
            "flex items-center gap-1 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0",
            activeAiTab === t.key
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/30"
              : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50",
          )}>
          <t.icon className="w-3.5 h-3.5 shrink-0" />
          {!compact && <span className="ml-1">{t.label}</span>}
          {t.badge && (
            <span className={cn(
              "text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1",
              activeAiTab === t.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500",
            )}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center gap-3">

          <button onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            {lecture.topic?.name && (
              <p className="text-[10px] sm:text-xs text-indigo-600 font-semibold truncate max-w-[160px] sm:max-w-xs leading-none mb-0.5">
                {lecture.topic.name}
              </p>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-800 truncate leading-tight">{lecture.title}</h1>
              {isLiveNow && (
                <span className="shrink-0 flex items-center gap-1 text-red-500 text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
                </span>
              )}
            </div>
          </div>

          {/* Progress — sm+ */}
          {!isLiveNow && hasPlayableVideo && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Progress</p>
                <p className="text-xs font-black text-slate-700">{Math.round(displayWatchPct)}%</p>
              </div>
              <div className="w-20 lg:w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${displayWatchPct}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
              <span className="text-xs font-black text-slate-700 md:hidden">{Math.round(displayWatchPct)}%</span>
            </div>
          )}

          {/* AI Tools toggle — desktop only */}
          <button
            onClick={() => setAiOpen(v => !v)}
            className={cn(
              "hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shrink-0",
              aiOpen
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600",
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tools</span>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className={cn(
          "transition-all duration-300 lg:items-start",
          aiOpen
            ? "lg:grid lg:gap-6 xl:gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]"
            : "max-w-5xl mx-auto",
        )}>

          {/* ── LEFT: video + info + mobile AI + materials + quiz ── */}
          <div className="min-w-0 space-y-3 lg:space-y-4">

            {/* Video player */}
            {hasPlayableVideo ? (
              <VideoPlayer
                src={videoSrc} checkpoints={checkpoints} lectureId={id!}
                videoRef={videoRef}
                onDoubtClick={() => {
                  setDoubtTimestamp(isYtLecture ? ytDisplay.sec : liveCurrentTime);
                  setActiveAiTab("doubt");
                  setAiOpen(true);
                  setMobileAiOpen(true);
                }}
                resumeAt={savedProgress?.lastPositionSeconds}
                onEnded={!isLiveNow && mockTestId ? () => navigate(`/student/quiz?mockTestId=${mockTestId}`) : undefined}
                externalPlaybackRef={ytPlaybackRef}
                onFlushLectureProgress={flushLectureProgress}
                onYouTubeTick={isYtLecture ? onYouTubeTick : undefined}
              />
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 aspect-video flex items-center justify-center">
                <div className="max-w-md px-6 text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center",
                    isLiveNow ? "bg-red-500/20" : recordingPending ? "bg-amber-500/20" : "bg-slate-700/70"
                  )}>
                    <Video className={cn(
                      "w-7 h-7",
                      isLiveNow ? "text-red-300" : recordingPending ? "text-amber-300" : "text-slate-300"
                    )} />
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {isLiveNow
                      ? "Live class is running"
                      : recordingPending
                        ? "Recording is being prepared"
                        : isScheduledLive
                          ? "Class has not started yet"
                          : "Video is not available"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {isLiveNow
                      ? "Join the live room to attend the class in real time."
                      : recordingPending
                        ? "This class has ended. The recording will appear here automatically once processing finishes."
                        : isScheduledLive
                          ? "Come back when the teacher starts the class."
                          : "The teacher has not attached a playable recording yet."}
                  </p>
                  {isLiveNow && (
                    <button
                      onClick={() => navigate(`/live/${id}`)}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current" /> Join Live Class
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mobile progress bar */}
            {!isLiveNow && hasPlayableVideo && (
              <div className="flex items-center gap-3 sm:hidden px-1">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${displayWatchPct}%` }} className="h-full bg-indigo-500 rounded-full" />
                </div>
                <span className="text-xs font-black text-slate-600 shrink-0">{Math.round(displayWatchPct)}%</span>
              </div>
            )}

            {/* Lecture info card */}
            <LectureInfoCard lecture={lecture} />

            {/* ── Mobile AI Study Tools (collapsible) ── */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileAiOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">AI Study Tools</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {!hasPlayableVideo
                        ? recordingPending
                          ? "Recording is being prepared"
                          : isScheduledLive
                            ? "Live class not started"
                            : "Video not available"
                        : lecture.aiNotesMarkdown
                        ? "Notes ready"
                        : isPlaybackOnlySource
                          ? "Upload required for AI notes"
                          : "Notes generating…"}
                      {checkpoints.length > 0 ? ` · ${checkpoints.length} quiz checkpoints` : ""}
                    </p>
                  </div>
                </div>
                <motion.div animate={{ rotate: mobileAiOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </motion.div>
              </button>

              <AnimatePresence>
                {mobileAiOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                      <AiTabStrip />
                      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100">
                        <p className="text-xs font-bold text-indigo-700">
                          {aiTabs.find(t => t.key === activeAiTab)?.label ?? ""}
                        </p>
                      </div>
                      <div className="p-4 max-h-[70vh] overflow-y-auto">{aiContent}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Topic Materials Section ── */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

              {/* Header */}
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                      Topic Materials
                    </p>
                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                      {lecture.topic?.name ?? "Study Resources"}
                    </p>
                  </div>
                </div>
                {topicResources.length > 0 && (
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black">
                    {topicResources.length} items
                  </span>
                )}
              </div>

              {/* Tab strip — only when there are multiple types */}
              {matTabs.length > 1 && (
                <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-100 px-1">
                  {matTabs.map(tab => (
                    <button key={tab.key}
                      onClick={() => setActiveMatTab(tab.key)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0",
                        activeMatTab === tab.key
                          ? "border-indigo-600 text-indigo-700 bg-indigo-50/30"
                          : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                      {tab.key !== "all" && tab.count > 0 && (
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded-full",
                          activeMatTab === tab.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500",
                        )}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Materials content */}
              <div className="p-4 sm:p-5">
                <AnimatePresence mode="wait">
                  <motion.div key={activeMatTab}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}>
                    {renderMaterials()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* ── Topic Quiz CTA — only when teacher has uploaded a quiz ── */}
            {!isLive && mockTestId && (
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/student/quiz?mockTestId=${mockTestId}`)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-lg group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/80 flex items-center justify-center shadow group-hover:rotate-6 transition-transform shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Take Topic Quiz</p>
                    <p className="text-xs text-white/50">AI-generated · Test your knowledge · Earn XP</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </motion.button>
            )}
          </div>

          {/* ── RIGHT: AI Panel (desktop sticky) ── */}
          <aside className={cn("hidden", aiOpen && "lg:block")}>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden sticky top-20">

              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Study Tools</p>
                </div>
                <button onClick={() => setAiOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-100">
                {aiTabs.map(t => (
                  <button key={t.key} onClick={() => setActiveAiTab(t.key)}
                    className={cn(
                      "flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-2.5 text-[11px] xl:text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0",
                      activeAiTab === t.key
                        ? "border-indigo-600 text-indigo-700 bg-indigo-50/30"
                        : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50",
                    )}>
                    <t.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xl:inline ml-1">{t.label}</span>
                    {t.badge && (
                      <span className={cn("text-[9px] font-black px-1 py-0.5 rounded-full ml-1",
                        activeAiTab === t.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500")}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Active tab label (lg only, before xl icons get labels) */}
              <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-50 xl:hidden">
                <p className="text-xs font-bold text-indigo-700">
                  {aiTabs.find(t => t.key === activeAiTab)?.label ?? ""}
                </p>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
                {aiContent}
              </div>
            </div>
          </aside>

        </div>
      </div>

    </div>
  );
}
