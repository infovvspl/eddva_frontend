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

import { WatchProgressBar } from "@/components/lecture/WatchProgressBar";
import { RevisionModeBanner } from "@/components/lecture/RevisionModeBanner";
import { SpeedControl } from "@/components/lecture/SpeedControl";
import { FloatingDoubtButton } from "@/components/lecture/FloatingDoubtButton";
import { AskDoubtPanel } from "@/components/lecture/AskDoubtPanel";
import { FormulasTab } from "@/components/lecture/FormulasTab";
import { DownloadNotesButton } from "@/components/lecture/DownloadNotesButton";
import { QuizUnlockButton } from "@/components/lecture/QuizUnlockButton";
import { NextLectureCard } from "@/components/lecture/NextLectureCard";

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
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Question {questionIndex + 1} / {total}
            </span>
            {/* Close button — visible after answering */}
            {state !== "asking" && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                title="Close"
              >
                <XCircle className="w-3.5 h-3.5" /> Close
              </button>
            )}
          </div>
        </div>
        <div className="px-5 pb-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">📚 {question.segmentTitle}</p>
          <p className="text-sm font-semibold text-foreground leading-6 mb-4">{question.questionText}</p>
          <div className="space-y-2">
            {question.options.map((opt) => {
              const isSelected = selected === opt.label;
              const isCorrect = result?.correctOption === opt.label;
              const isWrong = state === "wrong" && isSelected;
              const showResult = state !== "asking";
              return (
                <button key={opt.label} onClick={() => state === "asking" && setSelected(opt.label)}
                  disabled={state !== "asking"}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm transition-all",
                    state === "asking" && !isSelected && "border-border hover:border-primary/50 hover:bg-primary/5",
                    state === "asking" && isSelected && "border-primary bg-primary/10",
                    showResult && isCorrect && "border-emerald-500 bg-emerald-500/10",
                    showResult && isWrong && "border-red-500 bg-red-500/10",
                    showResult && !isCorrect && !isWrong && "border-border opacity-50",
                  )}>
                  <span className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                    state === "asking" && isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                    showResult && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                    showResult && isWrong && "border-red-500 bg-red-500 text-white",
                  )}>
                    {showResult && isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : showResult && isWrong ? <XCircle className="w-3.5 h-3.5" /> : opt.label}
                  </span>
                  <span className={cn("flex-1", showResult && isCorrect && "text-emerald-700 dark:text-emerald-400 font-medium")}>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-5 py-4">
          {state === "asking" ? (
            <Button onClick={handleSubmit} disabled={!selected || isSubmitting} className="w-full gap-2" size="sm">
              Submit Answer <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="space-y-3">
              <div className={cn("flex items-center gap-2.5 rounded-xl px-4 py-3",
                state === "correct" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20")}>
                {state === "correct" ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                <div>
                  <p className={cn("text-sm font-semibold", state === "correct" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                    {state === "correct" ? "Correct! Well done 🎉" : "Not quite right"}
                  </p>
                  {result?.explanation && <p className="text-xs text-muted-foreground mt-0.5 leading-5">{result.explanation}</p>}
                </div>
              </div>
              <Button onClick={onClose} className="w-full gap-2" size="sm">
                <Play className="w-4 h-4" /> Continue Watching
              </Button>
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
      className="relative bg-black rounded-2xl overflow-hidden aspect-video group shadow-2xl"
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
        <video ref={videoRef} src={src} className="w-full h-full"
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
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/10 pointer-events-none">
          <Play className="w-3.5 h-3.5 text-primary" /> {resumeToast}
        </div>
      )}

      {/* Floating doubt button — visible on hover */}
      {!isYouTube && (
        <FloatingDoubtButton
          currentTime={currentTime}
          visible={hovered && !activeQuiz}
          onClick={onDoubtClick}
        />
      )}

      {!isYouTube && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative mb-3">
            <div className="h-1.5 bg-white/20 rounded-full cursor-pointer relative" onClick={seek}>
              <div className="h-full bg-primary rounded-full pointer-events-none" style={{ width: `${progressPct}%` }} />
              {checkpoints.map(cp => (
                <div key={cp.id}
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-amber-400 -translate-x-1/2"
                  style={{ left: `${cp.triggerAtPercent}%` }} title={`Quiz: ${cp.segmentTitle}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={() => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
              className="text-white/70 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-white text-xs font-mono">{fmt(localTime)} / {fmt(duration)}</span>
            <div className="flex-1" />
            <SpeedControl videoRef={videoRef} />
            <button onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
              className="text-white/70 hover:text-white transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; }}
              className="w-16 accent-primary" />
            <button onClick={() => containerRef.current?.requestFullscreen()} className="text-white/70 hover:text-white transition-colors">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {checkpoints.length > 0 && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 bg-black/60 rounded-lg px-2.5 py-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-white text-xs">{checkpoints.length} quiz checkpoint{checkpoints.length > 1 ? "s" : ""}</span>
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
            ))}
          </div>
        </div>
      )}
      {(lecture.aiFormulas?.length ?? 0) > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" /> Formulas
          </p>
          <div className="space-y-2">
            {lecture.aiFormulas!.map((f, i) => (
              <div key={i} className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-2.5 font-mono text-sm text-foreground">{f}</div>
            ))}
          </div>
        </div>
      )}
      {displayNotes ? (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Lecture Notes
          </p>
          <div className="prose prose-sm prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80 prose-code:text-primary max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayNotes}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 opacity-20 mb-3" />
          <p className="text-sm">Notes will appear here once the AI processes the lecture.</p>
        </div>
      )}
    </div>
  );
}

// ─── Transcript Panel ──────────────────────────────────────────────────────

function TranscriptPanel({ transcript }: { transcript: string }) {
  const paragraphs = transcript.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="h-full overflow-y-auto space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" /> Auto-generated transcript
      </p>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-sm text-foreground/80 leading-7">{para}</p>
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
    <div className="space-y-4 overflow-y-auto h-full">
      {answered.length > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
          <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Score: {correct} / {answered.length} correct</p>
            <p className="text-xs text-muted-foreground">{Math.round((correct / answered.length) * 100)}% accuracy</p>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {checkpoints.map((cp, i) => {
          const response = answered.find(r => r.questionId === cp.id);
          return (
            <div key={cp.id} className={cn("rounded-xl border p-3.5 text-sm",
              response?.isCorrect ? "border-emerald-500/20 bg-emerald-500/5" :
              response ? "border-red-500/20 bg-red-500/5" : "border-border bg-secondary/40")}>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-muted-foreground shrink-0 mt-0.5">Q{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{cp.segmentTitle}</p>
                  <p className="text-sm text-foreground leading-5">{cp.questionText}</p>
                  {response ? (
                    <div className="mt-2 flex items-center gap-1.5">
                      {response.isCorrect ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span className="text-xs text-muted-foreground">
                        You chose {response.selectedOption}{!response.isCorrect && ` · Correct: ${cp.correctOption}`}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground italic">Watch the video to reach this checkpoint</p>
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

const StudentLecturePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("notes");

  // Video ref shared with hooks
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video hover state for FloatingDoubtButton
  const [videoHovered, setVideoHovered] = useState(false);

  // Doubt panel state
  const [doubtTimestamp, setDoubtTimestamp] = useState(0);

  // New feature state
  const [topicProgress, setTopicProgress] = useState<TopicProgress | null>(null);
  const [nextLecture, setNextLecture] = useState<Lecture | null>(null);
  const [mockTestId, setMockTestId] = useState<string | null>(null);
  const [completionReward, setCompletionReward] = useState<LectureCompletionReward | null>(null);

  // Real-time watch percentage from RAF loop
  const { watchPct: liveWatchPct, currentTime: liveCurrentTime } = useWatchPercentage(videoRef);

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

  // Fetch topic-level data after lecture loads
  useEffect(() => {
    if (!lecture?.topicId) return;
    const topicId = lecture.topicId;

    getTopicProgress(topicId)
      .then(p => setTopicProgress(p))
      .catch(() => setTopicProgress(null));

    fetchSiblingLectures(topicId).then(siblings => {
      const currentIndex = siblings.findIndex(s => s.id === id);
      if (currentIndex !== -1 && currentIndex < siblings.length - 1) {
        setNextLecture(siblings[currentIndex + 1]);
      }
    });

    fetchMockTestForTopic(topicId).then(mtId => setMockTestId(mtId));
  }, [lecture?.topicId, id]);

  // Completion callback for useLectureProgress
  const handleCompletion = useCallback((reward: LectureCompletionReward) => {
    setCompletionReward(reward);
    toast.success(reward.message, { duration: 4000 });
    qc.invalidateQueries({ queryKey: ["student", "plan"] });
    qc.invalidateQueries({ queryKey: ["student", "me"] });
    if (reward.mockTestId) setMockTestId(reward.mockTestId);
  }, [qc]);

  // Auto-save progress hook
  useLectureProgress(id ?? "", videoRef, handleCompletion);

  if (lectureLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-muted-foreground">
      <AlertCircle className="w-12 h-12 opacity-30" />
      <p>Lecture not found.</p>
      <Button variant="ghost" onClick={() => navigate(-1)}>Go back</Button>
    </div>
  );

  const videoSrc = lecture.videoUrl ?? "";
  // Use live watch pct if playing, else fall back to saved
  const displayWatchPct = liveWatchPct > 0 ? liveWatchPct : (savedProgress?.watchPercentage ?? 0);
  const isLive = lecture.type === "live" || lecture.status === "live";
  const duration = fmtDuration(lecture.videoDurationSeconds);

  // Revision mode: topic already completed before this session
  const isRevisionMode = topicProgress?.status === "completed";
  const bestAccuracy = topicProgress?.bestAccuracy ?? 0;
  const passedDaysAgo = topicProgress
    ? (() => {
        // completedAt not on interface — use a safe fallback
        return 0;
      })()
    : 0;

  // Quiz unlocked when watch >= 90% or reward says so or revision mode
  const quizUnlocked = isRevisionMode || displayWatchPct >= 90 || !!completionReward;

  // Parse aiFormulas into structured objects for FormulasTab
  // The Lecture type has aiFormulas as string[] (raw strings from backend)
  // We'll parse "Name: latex — description" format or just show as raw
  const parsedFormulas = (lecture.aiFormulas ?? []).map((f) => {
    const colonIdx = f.indexOf(":");
    if (colonIdx > -1) {
      return {
        name: f.slice(0, colonIdx).trim(),
        latex: f.slice(colonIdx + 1).trim(),
        description: "",
      };
    }
    return { name: "Formula", latex: f, description: "" };
  });

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "notes", label: "Notes", icon: BookOpen },
    { key: "formulas", label: "Formulas", icon: FlaskConical },
    ...(checkpoints.length > 0 ? [{ key: "quiz" as const, label: `Quiz (${checkpoints.length})`, icon: Sparkles }] : []),
  ];

  const handleDoubtClick = () => {
    setDoubtTimestamp(liveCurrentTime);
    setActiveTab("doubt");
  };

  const handleCloseDoubt = () => {
    setActiveTab("notes");
  };

  const handleTakeQuiz = () => {
    const path = mockTestId
      ? `/student/quiz?mockTestId=${mockTestId}`
      : `/student/quiz?topicId=${lecture.topicId}`;
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground text-sm truncate">{lecture.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {lecture.batch?.name && <span className="text-xs text-muted-foreground">{lecture.batch.name}</span>}
            {lecture.topic?.name && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs text-muted-foreground">{lecture.topic.name}</span>
              </>
            )}
          </div>
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
          </div>
        )}
        {/* ▶ X% watched pill */}
        {displayWatchPct > 0 && !isLive && (
          <div
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              background: isRevisionMode ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
              color: isRevisionMode ? "#22C55E" : "#F97316",
              border: `1px solid ${isRevisionMode ? "rgba(34,197,94,0.2)" : "rgba(249,115,22,0.2)"}`,
            }}
          >
            <Play className="w-3 h-3" />
            {Math.round(displayWatchPct)}% watched
          </div>
        )}
      </div>

      {/* ── Revision Mode Banner ── */}
      {isRevisionMode && (
        <RevisionModeBanner bestAccuracy={bestAccuracy} passedDaysAgo={passedDaysAgo} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Video + Info ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Video */}
          {videoSrc ? (
            <VideoPlayer
              src={videoSrc}
              checkpoints={checkpoints}
              lectureId={id!}
              videoRef={videoRef}
              onDoubtClick={handleDoubtClick}
              onVideoHoverChange={setVideoHovered}
              currentTime={liveCurrentTime}
              resumeAt={savedProgress?.lastPositionSeconds}
            />
          ) : isLive && lecture.liveMeetingUrl ? (
            <div className="aspect-video bg-gradient-to-br from-red-500/10 to-background border border-red-500/20 rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center relative">
                <Radio className="w-8 h-8 text-red-500" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Live Class in Progress</p>
                <p className="text-sm text-muted-foreground mt-1">Click below to join</p>
              </div>
              <a href={lecture.liveMeetingUrl} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 bg-red-500 hover:bg-red-600">
                  <Radio className="w-4 h-4" /> Join Live Class
                </Button>
              </a>
            </div>
          ) : (
            <div className="aspect-video bg-secondary rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Play className="w-12 h-12 opacity-20" />
              <p className="text-sm">Video not available yet</p>
            </div>
          )}

          {/* Watch Progress Bar */}
          {!isLive && videoSrc && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <WatchProgressBar
                watchPct={displayWatchPct}
                isRevisionMode={isRevisionMode}
                mockTestId={mockTestId}
                onTakeQuiz={handleTakeQuiz}
              />
            </div>
          )}

          {/* Quiz Unlock Button */}
          {quizUnlocked && lecture.topicId && !isLive && (
            <QuizUnlockButton
              mockTestId={mockTestId ?? ""}
              topicId={lecture.topicId}
              onNavigate={navigate}
              isRevisionMode={isRevisionMode}
              animate={!!completionReward}
            />
          )}

          {/* Next Lecture Card */}
          {nextLecture && (quizUnlocked || isRevisionMode) && (
            <NextLectureCard
              lecture={nextLecture}
              onWatch={() => navigate(`/student/lectures/${nextLecture.id}`)}
              onQuizFirst={() => {
                const path = mockTestId
                  ? `/student/quiz?mockTestId=${mockTestId}`
                  : lecture.topicId
                  ? `/student/quiz?topicId=${lecture.topicId}`
                  : "/student/learn";
                navigate(path);
              }}
            />
          )}

          {/* Metadata strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: isLive ? Radio : Layers, label: "Type", value: isLive ? "Live Class" : "Recorded", color: isLive ? "text-red-500" : "text-blue-500" },
              ...(duration ? [{ icon: Clock, label: "Duration", value: duration, color: "text-violet-500" }] : []),
              ...(lecture.topic?.name ? [{ icon: Tag, label: "Topic", value: lecture.topic.name, color: "text-emerald-500" }] : []),
              { icon: Calendar, label: "Uploaded", value: fmtDate(lecture.createdAt), color: "text-amber-500" },
            ].map((m, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-start gap-2.5">
                <m.icon className={cn("w-4 h-4 mt-0.5 shrink-0", m.color)} />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{m.label}</p>
                  <p className="text-xs font-semibold text-foreground truncate mt-0.5">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {lecture.description && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> About this lecture
              </p>
              <p className="text-sm text-foreground/80 leading-7">{lecture.description}</p>
            </div>
          )}

          {/* Mobile: tabs panel below video */}
          <div className="lg:hidden">
            <MobileTabsPanel
              lecture={lecture}
              checkpoints={checkpoints}
              savedProgress={savedProgress}
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              parsedFormulas={parsedFormulas}
              doubtProps={
                activeTab === "doubt"
                  ? {
                      lectureId: id!,
                      topicId: lecture.topicId ?? "",
                      topicName: lecture.topic?.name ?? "",
                      lectureTitle: lecture.title,
                      timestampSeconds: doubtTimestamp,
                      onClose: handleCloseDoubt,
                    }
                  : null
              }
            />
          </div>
        </div>

        {/* ── Right: Notes / Transcript / Formulas / Quiz / Doubt ── */}
        <div className="hidden lg:flex lg:col-span-2 flex-col gap-4">
          {/* Tab switcher */}
          <div className="flex bg-secondary rounded-xl p-1 gap-1 flex-wrap">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px]",
                  activeTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </button>
            ))}
            {/* Doubt tab button */}
            <button
              onClick={() => { setDoubtTimestamp(liveCurrentTime); setActiveTab("doubt"); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px]",
                activeTab === "doubt" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <MessageCircle className="w-3.5 h-3.5" />Doubt
            </button>
          </div>

          {/* Panel header actions */}
          {activeTab === "notes" && (
            <div className="flex justify-end px-1">
              <DownloadNotesButton lecture={lecture} />
            </div>
          )}

          {/* Panel body */}
          <div className="bg-card border border-border rounded-2xl p-5 flex-1 overflow-hidden" style={{ maxHeight: "78vh" }}>
            {activeTab === "notes" && <NotesPanel lecture={lecture} />}
            {activeTab === "formulas" && <FormulasTab formulas={parsedFormulas} />}
            {activeTab === "quiz" && <QuizSummaryPanel checkpoints={checkpoints} savedResponses={savedProgress?.quizResponses} />}
            {activeTab === "doubt" && (
              <AskDoubtPanel
                lectureId={id!}
                topicId={lecture.topicId ?? ""}
                topicName={lecture.topic?.name ?? ""}
                lectureTitle={lecture.title}
                timestampSeconds={doubtTimestamp}
                onClose={handleCloseDoubt}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Mobile tabs panel ─────────────────────────────────────────────────────

interface DoubtProps {
  lectureId: string;
  topicId: string;
  topicName: string;
  lectureTitle: string;
  timestampSeconds: number;
  onClose: () => void;
}

function MobileTabsPanel({
  lecture, checkpoints, savedProgress, tabs, activeTab, setActiveTab,
  parsedFormulas, doubtProps,
}: {
  lecture: Lecture;
  checkpoints: QuizCheckpoint[];
  savedProgress: { quizResponses?: { questionId: string; isCorrect: boolean; selectedOption: string }[] } | null | undefined;
  tabs: { key: TabKey; label: string; icon: React.ElementType }[];
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  parsedFormulas: { name: string; latex: string; description: string }[];
  doubtProps: DoubtProps | null;
}) {
  const allTabs = [
    ...tabs,
    { key: "doubt" as const, label: "Doubt", icon: MessageCircle },
  ];

  return (
    <div className="space-y-3">
      <div className="flex bg-secondary rounded-xl p-1 gap-1 flex-wrap">
        {allTabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors min-w-[56px]",
              activeTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>
      {activeTab === "notes" && (
        <div className="flex justify-end">
          <DownloadNotesButton lecture={lecture} />
        </div>
      )}
      <div className="bg-card border border-border rounded-2xl p-5">
        {activeTab === "notes" && <NotesPanel lecture={lecture} />}
        {activeTab === "transcript" && lecture.transcript && <TranscriptPanel transcript={lecture.transcript} />}
        {activeTab === "formulas" && <FormulasTab formulas={parsedFormulas} />}
        {activeTab === "quiz" && <QuizSummaryPanel checkpoints={checkpoints} savedResponses={savedProgress?.quizResponses} />}
        {activeTab === "doubt" && doubtProps && <AskDoubtPanel {...doubtProps} />}
        {activeTab === "doubt" && !doubtProps && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageCircle className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">Pause the video and use the doubt button to ask at a timestamp</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentLecturePage;
