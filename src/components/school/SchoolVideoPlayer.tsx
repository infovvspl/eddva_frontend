import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw,
  CheckCircle, XCircle, ChevronRight, Loader2
} from "lucide-react";
import { SpeedControl } from "@/components/lecture/SpeedControl";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  ensureYouTubeIframeApi,
  extractYouTubeVideoIdFromUrl,
  YT_ENDED,
  YT_PAUSED,
  YT_PLAYING,
  type YTPlayer,
} from "@/lib/youtube-iframe-api";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface QuizOption {
  label: string;
  text: string;
}

export interface QuizCheckpoint {
  id: string;
  questionText: string;
  options: QuizOption[];
  correctOption: string;
  triggerAtPercent: number;
  segmentTitle?: string;
  explanation?: string;
}

export interface QuizSubmitResult {
  isCorrect: boolean;
  correctOption: string;
  explanation: string;
}

type QuizState = "asking" | "correct" | "wrong";

// ─── Quiz Popup Component ──────────────────────────────────────────────────────

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
    } catch { 
      setState("wrong"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 wrongs z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
              Checkpoint {questionIndex + 1} / {total}
            </span>
            {question.segmentTitle && (
              <span className="text-xs font-semibold text-white/60">{question.segmentTitle}</span>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="text-base font-bold text-slate-800 leading-snug mb-6">
            <MarkdownRenderer content={question.questionText} className="prose-p:my-0 text-slate-800 font-bold" />
          </div>
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
                    state === "asking" && isSelected && "border-blue-500 bg-blue-50 text-blue-700",
                    showResult && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                    showResult && isWrong && "border-red-400 bg-red-50 text-red-600",
                    showResult && !isCorrect && !isWrong && "border-slate-100 opacity-40",
                  )}>
                  <span className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                    state === "asking" && isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500",
                    showResult && isCorrect ? "bg-emerald-500 text-white" : "",
                    showResult && isWrong ? "bg-red-500 text-white" : "",
                  )}>
                    {opt.label}
                  </span>
                  <div className="flex-1 text-slate-700 pointer-events-none">
                    <MarkdownRenderer content={opt.text} className="prose-p:my-0 text-slate-700 font-semibold" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6">
          {state === "asking" ? (
            <button onClick={handleSubmit} disabled={!selected || isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-40">
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
                  {result?.explanation && (
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      <MarkdownRenderer content={result.explanation} className="prose-p:my-0 text-slate-500" />
                    </div>
                  )}
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

// ─── Main Video Player Component ──────────────────────────────────────────────

export function SchoolVideoPlayer({
  src,
  checkpoints = [],
  onEnded,
  autoPlay = true,
  onTimeUpdate,
  onAnswerSubmitted,
  resumeAt,
}: {
  src: string;
  checkpoints?: QuizCheckpoint[];
  onEnded?: () => void;
  autoPlay?: boolean;
  onTimeUpdate?: (seconds: number) => void;
  onAnswerSubmitted?: (questionId: string, option: string, isCorrect: boolean) => void;
  resumeAt?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    checkpointsRef.current = checkpoints;
  }, [checkpoints]);

  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  const isYouTube = src.includes("youtube.com") || src.includes("youtu.be");
  const seekedRef = useRef(false);

  useEffect(() => {
    shownIdsRef.current = new Set();
    seekedRef.current = false;
  }, [src]);

  useEffect(() => {
    if (resumeAt && resumeAt > 0 && !seekedRef.current) {
      if (isYouTube) {
        if (ytPlayerRef.current) {
          try {
            ytPlayerRef.current.seekTo(resumeAt, true);
            seekedRef.current = true;
          } catch { /* */ }
        }
      } else {
        const v = videoRef.current;
        if (v && v.readyState >= 1) {
          v.currentTime = resumeAt;
          seekedRef.current = true;
        }
      }
    }
  }, [resumeAt, isYouTube]);

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
    onTimeUpdate?.(v.currentTime);
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
  }, [duration, onTimeUpdate]);

  const handleAnswer = async (option: string): Promise<QuizSubmitResult> => {
    if (!activeQuiz) throw new Error("no active quiz");
    // Client-side validation: return results locally
    const correctOption = activeQuiz.correctOption;
    const isCorrect = option === correctOption;
    onAnswerSubmitted?.(activeQuiz.id, option, isCorrect);
    return {
      isCorrect,
      correctOption,
      explanation: activeQuiz.explanation || "",
    };
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
          autoplay: autoPlay ? 1 : 0,
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
            if (resumeAt && resumeAt > 0 && !seekedRef.current) {
              try {
                p.seekTo(resumeAt, true);
                seekedRef.current = true;
              } catch { /* */ }
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
              onTimeUpdate?.(cur);
              const pct = dur2 > 0 ? (cur / dur2) * 100 : 0;
              const isPlayingNow = st === YT_PLAYING;
              setPlaying(isPlayingNow);
              
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
            if (ev.data === YT_ENDED) {
              setPlaying(false);
              onEnded?.();
            }
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
    };
  }, [isYouTube, src, autoPlay, onEnded]);

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
            if (resumeAt && resumeAt > 0 && !seekedRef.current) {
              v.currentTime = resumeAt;
              seekedRef.current = true;
            }
          }}
          autoPlay={autoPlay}
          onPlay={() => { setPlaying(true); hideTimer.current = setTimeout(() => setControlsVisible(false), 3000); }}
          onPause={() => { setPlaying(false); setControlsVisible(true); clearTimeout(hideTimer.current); }}
          onEnded={() => { setPlaying(false); setControlsVisible(true); onEnded?.(); }}
        />
      )}

      <AnimatePresence>
        {activeQuiz && (
          <QuizPopup question={activeQuiz} questionIndex={quizIndex} total={checkpoints.length}
            onAnswer={handleAnswer} onClose={resumePlaybackAfterQuiz} />
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
              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-4 pointer-events-auto"
                onClick={e => e.stopPropagation()}>
                {/* Seekbar */}
                <div className="mb-3 relative group/seek" onClick={seek}>
                  <div className="h-1 bg-white/20 rounded-full cursor-pointer group-hover/seek:h-2 transition-all relative">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${progressPct}%` }} />
                    {checkpoints.map(cp => (
                      <div key={cp.id} title="Quiz checkpoint"
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400 border border-black/40 -translate-x-1/2"
                        style={{ left: `${cp.triggerAtPercent}%` }} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="text-white hover:text-blue-300 transition-colors">
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
                      {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setVolume(val);
                        setMuted(val === 0);
                        if (videoRef.current) {
                          videoRef.current.volume = val;
                          videoRef.current.muted = val === 0;
                        }
                      }}
                      className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white" />
                  </div>
                  <button onClick={() => {
                    const el = containerRef.current;
                    if (!el) return;
                    if (document.fullscreenElement) document.exitFullscreen();
                    else el.requestFullscreen().catch(() => {});
                  }} className="text-white/60 hover:text-white transition-colors">
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
