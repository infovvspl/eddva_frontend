import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Earth,
  ExternalLink,
  Globe,
  GraduationCap,
  History as HistoryIcon,
  Images,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageCircleQuestion,
  MonitorPlay,
  NotebookPen,
  Play,
  SendHorizontal,
  SquarePen,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import api, { unwrapSchoolData, unwrapSchoolList } from "@/lib/api/school-client";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SyllabusStatus = "in_syllabus" | "supporting" | "beyond_syllabus";

interface TutorSource {
  id: string;
  kind: "course" | "web";
  type?: "textbook" | "lecture";
  title: string;
  label?: string;
  url?: string;
  site?: string;
  excerpt?: string;
}

interface TutorImage {
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  source: string;
  pageUrl: string;
}

interface TutorVideo {
  title: string;
  url: string;
  videoId: string;
  thumbnailUrl: string;
  channel: string;
  duration: string;
}

type TutorMode = "chat" | "quiz" | "practice";

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface QuizResult {
  answers: number[];
  score: number;
  total: number;
  completedAt: string;
}

interface TutorMessage {
  id: string;
  role: "student" | "tutor";
  content: string;
  sources: TutorSource[];
  images: TutorImage[];
  videos: TutorVideo[];
  quiz?: { questions: QuizQuestion[] } | null;
  quizResult?: QuizResult | null;
  /** Pictures/videos are still to be fetched — loaded after the answer is shown. */
  mediaPending?: boolean;
  syllabusStatus: SyllabusStatus | null;
  usedWeb: boolean;
  createdAt: string;
  pending?: boolean;
}

interface ConversationSummary {
  id: string;
  title: string;
  subjectName?: string | null;
  chapterName?: string | null;
  topicName?: string | null;
  updatedAt: string;
}

interface Conversation extends ConversationSummary {
  subjectId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  messages: TutorMessage[];
}

interface Topic { id: string; name: string }
interface Chapter { id: string; name: string; topics: Topic[] }
interface Subject { id: string; name: string; chapters: Chapter[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ApiErrorBody {
  message?: string | { message?: string };
  error?: string | { message?: string };
}

function errorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: ApiErrorBody } })?.response?.data;
  const msg = data?.message ?? (typeof data?.error === "object" ? data.error.message : data?.error);
  if (typeof msg === "string") return msg;
  if (msg && typeof msg.message === "string") return msg.message;
  return fallback;
}

function scopeLabel(c: Pick<ConversationSummary, "subjectName" | "chapterName" | "topicName">): string {
  return [c.subjectName, c.chapterName, c.topicName].filter(Boolean).join(" › ");
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function quickPrompts(c: Conversation | null): Array<{ icon: typeof Lightbulb; label: string; text: string; mode: TutorMode }> {
  const focus = c?.topicName || c?.chapterName || c?.subjectName;
  if (!focus) {
    return [
      { icon: Lightbulb, label: "Explain a topic", text: "Can you explain photosynthesis in simple words?", mode: "chat" },
      { icon: MessageCircleQuestion, label: "Solve a doubt", text: "Why does a sharp knife cut better than a blunt one?", mode: "chat" },
      { icon: NotebookPen, label: "Practice", text: "Give me 5 practice questions on fractions.", mode: "practice" },
      { icon: Earth, label: "Real-life example", text: "Give me a real-life example of Newton's third law.", mode: "chat" },
    ];
  }
  return [
    { icon: Lightbulb, label: "Explain this topic", text: `Explain ${focus} in simple words.`, mode: "chat" },
    { icon: NotebookPen, label: "Practice questions", text: `Give me 5 practice questions on ${focus}, with answers at the end.`, mode: "practice" },
    { icon: ListChecks, label: "Quiz me", text: `Quiz me on ${focus}.`, mode: "quiz" },
    { icon: Earth, label: "Real-life example", text: `Give me a real-life example of ${focus}.`, mode: "chat" },
  ];
}

function truncateTitle(text: string): string {
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

const SYLLABUS_BADGE: Record<SyllabusStatus, { label: string; className: string }> = {
  in_syllabus: {
    label: "In your syllabus",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  supporting: {
    label: "Supporting concept",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  beyond_syllabus: {
    label: "Beyond your syllabus",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
};

// ─── Media ────────────────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ImageStrip({ images }: { images: TutorImage[] }) {
  const [open, setOpen] = useState<TutorImage | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [fullFailed, setFullFailed] = useState(false);
  const visible = images.filter((img) => !hidden.has(img.imageUrl));
  if (!visible.length) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <Images className="h-3 w-3" /> Images from Google
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visible.map((img) => (
          <button
            key={img.imageUrl}
            type="button"
            onClick={() => { setFullFailed(false); setOpen(img); }}
            className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800"
            title={img.title}
          >
            <img
              src={img.thumbnailUrl}
              alt={img.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              onError={() => setHidden((s) => new Set(s).add(img.imageUrl))}
            />
          </button>
        ))}
      </div>
      {open && (
        <Modal onClose={() => setOpen(null)}>
          <img
            src={fullFailed ? open.thumbnailUrl : open.imageUrl}
            alt={open.title}
            referrerPolicy="no-referrer"
            onError={() => setFullFailed(true)}
            className="mx-auto max-h-[75vh] rounded-xl bg-white object-contain"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-white">
            <span className="line-clamp-1 font-bold">{open.title}</span>
            {open.pageUrl && (
              <a
                href={open.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 hover:underline"
              >
                View on {open.source || "source"} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function VideoRow({ videos }: { videos: TutorVideo[] }) {
  const [playing, setPlaying] = useState<TutorVideo | null>(null);
  if (!videos.length) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <MonitorPlay className="h-3 w-3" /> Videos from YouTube
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {videos.map((v) => (
          <button
            key={v.videoId}
            type="button"
            onClick={() => setPlaying(v)}
            className="group w-44 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-rose-300 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="relative aspect-video bg-slate-900">
              <img
                src={v.thumbnailUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg">
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                </span>
              </span>
              {v.duration && (
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {v.duration}
                </span>
              )}
            </div>
            <div className="p-2">
              <p className="line-clamp-2 text-xs font-bold text-slate-800 dark:text-slate-100">{v.title}</p>
              {v.channel && <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{v.channel}</p>}
            </div>
          </button>
        ))}
      </div>
      {playing && (
        <Modal onClose={() => setPlaying(null)}>
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${playing.videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={playing.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-white">
            <span className="line-clamp-1 font-bold">{playing.title}</span>
            <a
              href={playing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 hover:underline"
            >
              Open on YouTube <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function SourceCard({ source }: { source: TutorSource }) {
  const isWeb = source.kind === "web";
  const Icon = isWeb ? Globe : BookOpen;
  const body = (
    <>
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", isWeb ? "text-sky-600" : "text-blue-600")} />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {isWeb ? "From Google" : "From your course"}
        </span>
        <span className="ml-auto text-[10px] font-bold text-slate-400">{source.id}</span>
      </div>
      <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-800 dark:text-slate-100">{source.title}</p>
      <p className="line-clamp-1 text-[11px] text-slate-500">
        {isWeb ? source.site : source.label}
        {isWeb && <ExternalLink className="ml-1 inline h-3 w-3" />}
      </p>
    </>
  );
  const className =
    "block min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition dark:border-slate-700 dark:bg-slate-900";
  return isWeb && source.url ? (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className={cn(className, "hover:border-sky-300")}>
      {body}
    </a>
  ) : (
    <div className={className} title={source.excerpt}>{body}</div>
  );
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

function QuizCard({ conversationId, messageId, questions, savedResult }: {
  conversationId: string;
  messageId: string;
  questions: QuizQuestion[];
  savedResult: QuizResult | null;
}) {
  const [result, setResult] = useState<QuizResult | null>(savedResult);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const finish = async (final: number[]) => {
    setSaving(true);
    const local: QuizResult = {
      answers: final,
      score: final.filter((a, i) => a === questions[i].answerIndex).length,
      total: questions.length,
      completedAt: new Date().toISOString(),
    };
    try {
      const res = await api.post(
        `/ai-tutor/conversations/${conversationId}/messages/${messageId}/quiz-result`,
        { answers: final },
      );
      setResult(unwrapSchoolData<{ quizResult: QuizResult } | null>(res, null)?.quizResult ?? local);
    } catch {
      setResult(local); // still show the score; it just isn't saved to history
    } finally {
      setSaving(false);
    }
  };

  const retake = () => { setResult(null); setIndex(0); setAnswers([]); };

  if (result) {
    const great = result.score / result.total >= 0.8;
    return (
      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quiz complete</p>
            <p className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">
              {result.score} / {result.total}
            </p>
            <p className="text-xs font-medium text-slate-500">
              {great ? "Excellent work!" : result.score / result.total >= 0.5 ? "Good effort — review the ones you missed." : "Keep practising — read the explanations below."}
            </p>
          </div>
          <button
            type="button"
            onClick={retake}
            className="h-9 shrink-0 rounded-xl bg-blue-50 px-3 text-xs font-black text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
          >
            Retake quiz
          </button>
        </div>
        <ol className="mt-4 space-y-3">
          {questions.map((q, i) => {
            const picked = result.answers[i];
            const correct = picked === q.answerIndex;
            return (
              <li key={i} className="rounded-xl border border-slate-100 p-3 text-sm dark:border-slate-800">
                <div className="flex items-start gap-2">
                  {correct
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    : <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />}
                  <div className="min-w-0 flex-1 text-slate-800 dark:text-slate-100">
                    <MarkdownRenderer content={q.question} />
                    {!correct && (
                      <p className="mt-1 text-xs text-slate-500">
                        Your answer: {OPTION_LETTERS[picked]}) {q.options[picked]} · Correct: {OPTION_LETTERS[q.answerIndex]}) {q.options[q.answerIndex]}
                      </p>
                    )}
                    {!correct && q.explanation && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{q.explanation}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const q = questions[index];
  const picked = answers[index];
  const answered = picked !== undefined;
  const last = index === questions.length - 1;

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Question {index + 1} of {questions.length}
        </p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-5 rounded-full",
                i < answers.length
                  ? answers[i] === questions[i].answerIndex ? "bg-emerald-500" : "bg-rose-500"
                  : i === index ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700",
              )}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
        <MarkdownRenderer content={q.question} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {q.options.map((option, i) => {
          const isCorrect = i === q.answerIndex;
          const isPicked = i === picked;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setAnswers((a) => [...a.slice(0, index), i])}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
                !answered && "border-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-blue-950/30",
                answered && isCorrect && "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
                answered && isPicked && !isCorrect && "border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
                answered && !isCorrect && !isPicked && "border-slate-200 opacity-60 dark:border-slate-700",
              )}
            >
              <span className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black",
                answered && isCorrect ? "bg-emerald-600 text-white"
                  : answered && isPicked ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              )}>
                {OPTION_LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1"><MarkdownRenderer content={option} /></span>
              {answered && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
              {answered && isPicked && !isCorrect && <X className="h-4 w-4 shrink-0 text-rose-600" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
          <p className={cn("font-black", picked === q.answerIndex ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
            {picked === q.answerIndex ? "Correct!" : `Not quite — the answer is ${OPTION_LETTERS[q.answerIndex]}.`}
          </p>
          {q.explanation && <p className="mt-1 text-slate-600 dark:text-slate-300">{q.explanation}</p>}
          <button
            type="button"
            disabled={saving}
            onClick={() => (last ? finish(answers) : setIndex((i) => i + 1))}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {last ? "See my score" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}

// Media requests already started, so a remount (or React StrictMode) doesn't fetch twice.
const mediaRequests = new Set<string>();

const WAIT_MESSAGES: Record<TutorMode, string[]> = {
  chat: [
    "Reading your question...",
    "Checking your course material...",
    "Searching Google for more...",
    "Checking the facts...",
    "Writing your answer...",
    "Almost there...",
  ],
  quiz: [
    "Picking the key ideas...",
    "Writing your quiz questions...",
    "Double-checking every answer...",
    "Almost ready...",
  ],
  practice: [
    "Choosing good practice questions...",
    "Working out the answers...",
    "Almost there...",
  ],
};

const MEDIA_WAIT_MESSAGES = [
  "Looking for pictures...",
  "Checking each picture is right for you...",
  "Finding short YouTube videos...",
  "Almost there...",
];

/** Steps through `messages` every few seconds, then stays on the last one. */
function useStepMessage(messages: string[], intervalMs = 2500): string {
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    const id = window.setInterval(() => setStep((i) => Math.min(i + 1, messages.length - 1)), intervalMs);
    return () => window.clearInterval(id);
  }, [messages, intervalMs]);
  return messages[step];
}

function ThinkingIndicator({ mode }: { mode: TutorMode }) {
  const message = useStepMessage(WAIT_MESSAGES[mode]);
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/25">
        <GraduationCap className="h-4 w-4" />
      </div>
      <span className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 font-medium shadow-sm dark:bg-slate-900/80">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> {message}
      </span>
    </div>
  );
}

function MediaLoader({ conversationId, messageId, onLoaded }: {
  conversationId: string;
  messageId: string;
  onLoaded: (messageId: string, media: { images: TutorImage[]; videos: TutorVideo[] }) => void;
}) {
  useEffect(() => {
    if (mediaRequests.has(messageId)) return;
    mediaRequests.add(messageId);
    api.post(`/ai-tutor/conversations/${conversationId}/messages/${messageId}/media`)
      .then((res) => {
        const media = unwrapSchoolData<{ images: TutorImage[]; videos: TutorVideo[] } | null>(res, null);
        onLoaded(messageId, { images: media?.images ?? [], videos: media?.videos ?? [] });
      })
      .catch(() => onLoaded(messageId, { images: [], videos: [] }));
  }, [conversationId, messageId, onLoaded]);
  const message = useStepMessage(MEDIA_WAIT_MESSAGES, 3500);

  return (
    <div className="mt-3" aria-live="polite">
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" /> {message}
      </p>
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-32 shrink-0 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, conversationId, onMediaLoaded }: {
  message: TutorMessage;
  conversationId: string;
  onMediaLoaded: (messageId: string, media: { images: TutorImage[]; videos: TutorVideo[] }) => void;
}) {
  if (message.role === "student") {
    return (
      <div className="flex justify-end">
        <div className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/20",
          message.pending && "opacity-70",
        )}>
          {message.content}
        </div>
      </div>
    );
  }
  const badge = message.syllabusStatus ? SYLLABUS_BADGE[message.syllabusStatus] : null;
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/25">
        <GraduationCap className="h-4 w-4" />
      </div>
      <div className="min-w-0 max-w-[92%] flex-1">
        <div className="rounded-2xl rounded-tl-md border border-blue-100 bg-white px-4 py-3 shadow-lg shadow-blue-900/5 dark:border-slate-700 dark:bg-slate-900">
          {badge && (
            <span className={cn("mb-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black", badge.className)}>
              {message.syllabusStatus === "beyond_syllabus" ? <TriangleAlert className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {badge.label}
            </span>
          )}
          <div className="text-sm text-slate-800 dark:text-slate-100">
            <MarkdownRenderer content={message.content} />
          </div>
        </div>
        {message.quiz?.questions?.length ? (
          <QuizCard
            conversationId={conversationId}
            messageId={message.id}
            questions={message.quiz.questions}
            savedResult={message.quizResult ?? null}
          />
        ) : null}
        {message.mediaPending ? (
          <MediaLoader conversationId={conversationId} messageId={message.id} onLoaded={onMediaLoaded} />
        ) : (
          <>
            <ImageStrip images={message.images ?? []} />
            <VideoRow videos={message.videos ?? []} />
          </>
        )}
        {message.sources.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {message.sources.map((s) => <SourceCard key={s.id} source={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function NewChatPanel({ subjects, className, onStart, starting }: {
  subjects: Subject[];
  className: string;
  onStart: (scope: { subjectId?: string; chapterId?: string; topicId?: string }) => void;
  starting: boolean;
}) {
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const subject = subjects.find((s) => s.id === subjectId);
  const chapter = subject?.chapters.find((c) => c.id === chapterId);

  return (
    // Gradient frame around a white card.
    <div className="mx-auto w-full max-w-xl rounded-[2.25rem] bg-gradient-to-br from-sky-300 via-blue-400 to-violet-400 p-[3px] shadow-2xl shadow-blue-500/20">
      <div className="rounded-[2.1rem] bg-white px-6 py-8 text-center dark:bg-slate-900 sm:px-10 sm:py-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-8 ring-blue-50 dark:ring-slate-800">
          <GraduationCap className="h-10 w-10" />
        </div>
        <h2 className="mt-6 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-sky-300 dark:via-blue-300 dark:to-violet-300">
          Start a new chat
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-slate-600 dark:text-slate-300">
          Pick what you're studying so I can answer from your {className || "class"} course, with pictures, videos and Google results. You can also skip this and ask anything.
        </p>
        <div className="mt-7 space-y-3 text-left">
          <PickerRow step={1} tint={PICKER_TINTS[0]}>
            <CustomSelect
              value={subjectId}
              onChange={(v: string) => { setSubjectId(v); setChapterId(""); setTopicId(""); }}
              placeholder="Any subject"
              options={[{ value: "", label: "Any subject" }, ...subjects.map((s) => ({ value: s.id, label: s.name }))]}
              searchable={subjects.length > 8}
              triggerClassName={PICKER_TRIGGER}
              menuClassName={ALL_BOLD}
            />
          </PickerRow>
          {subject && subject.chapters.length > 0 && (
            <PickerRow step={2} tint={PICKER_TINTS[1]}>
              <CustomSelect
                value={chapterId}
                onChange={(v: string) => { setChapterId(v); setTopicId(""); }}
                placeholder="Any chapter"
                options={[{ value: "", label: "Any chapter" }, ...subject.chapters.map((c) => ({ value: c.id, label: c.name }))]}
                searchable={subject.chapters.length > 8}
                triggerClassName={PICKER_TRIGGER}
                menuClassName={ALL_BOLD}
              />
            </PickerRow>
          )}
          {chapter && chapter.topics.length > 0 && (
            <PickerRow step={3} tint={PICKER_TINTS[2]}>
              <CustomSelect
                value={topicId}
                onChange={(v: string) => setTopicId(v)}
                placeholder="Any topic"
                options={[{ value: "", label: "Any topic" }, ...chapter.topics.map((t) => ({ value: t.id, label: t.name }))]}
                searchable={chapter.topics.length > 8}
                triggerClassName={PICKER_TRIGGER}
                menuClassName={ALL_BOLD}
              />
            </PickerRow>
          )}
        </div>
      <button
        type="button"
        disabled={starting}
        onClick={() => onStart({
          subjectId: subjectId || undefined,
          chapterId: chapterId || undefined,
          topicId: topicId || undefined,
        })}
        className="group mt-7 inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-4 text-base font-black text-white shadow-xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-60"
      >
        {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <SquarePen className="h-5 w-5" />}
        Start chat
        <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
      </button>
      </div>
    </div>
  );
}

// Every piece of text in the AI Tutor is bold (700), including Markdown answers
// and the dropdown menus, which render outside the tutor in a portal.
const ALL_BOLD = "font-bold [&_*]:!font-bold";

// Replaces CustomSelect's default trigger classes entirely, so it repeats the layout ones.
const PICKER_TRIGGER =
  "flex h-14 w-full items-center justify-between gap-2 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 text-base font-semibold text-slate-800 outline-none transition hover:border-blue-200 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

const PICKER_TINTS = [
  "from-amber-400 to-orange-500 shadow-orange-500/30",
  "from-emerald-400 to-teal-500 shadow-teal-500/30",
  "from-violet-500 to-purple-600 shadow-purple-500/30",
];

/** A numbered, colour-coded step beside each picker (subject → chapter → topic). */
function PickerRow({ step, tint, children }: { step: number; tint: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-black text-white shadow-lg", tint)}>
        {step}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function HistoryPanel({ conversations, loading, activeId, onOpen, onDelete, onNew, onClose }: {
  conversations: ConversationSummary[];
  loading: boolean;
  activeId?: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-30 flex justify-end rounded-2xl bg-slate-900/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-sm flex-col rounded-2xl border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
        aria-label="Chat history"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
          <HistoryIcon className="h-4 w-4 text-blue-600" />
          <h2 className="flex-1 text-base font-black text-slate-900 dark:text-white">Chat history</h2>
          <button type="button" onClick={onClose} aria-label="Close history" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3">
          <button
            type="button"
            onClick={onNew}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          >
            <SquarePen className="h-4 w-4" /> New chat
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-slate-500">No chats yet. Your conversations will appear here.</p>
          ) : conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-start gap-2 rounded-xl px-3 py-2.5 transition",
                activeId === c.id ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
              )}
            >
              <button type="button" onClick={() => onOpen(c.id)} className="min-w-0 flex-1 text-left">
                <p className="line-clamp-1 text-sm font-bold text-slate-800 dark:text-slate-100">{c.title}</p>
                <p className="line-clamp-1 text-[11px] text-slate-500">
                  {[formatWhen(c.updatedAt), scopeLabel(c) || "Any subject"].filter(Boolean).join(" • ")}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                aria-label="Delete chat"
                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AiTutorChat({ onClose }: { onClose: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [className, setClassName] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingMode, setSendingMode] = useState<TutorMode>("chat");
  const [input, setInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get("/ai-tutor/conversations");
      setConversations(unwrapSchoolList(res) as ConversationSummary[]);
    } catch (err) {
      toast.error(errorMessage(err, "Could not load your chats."));
    } finally {
      setLoadingList(false);
    }
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setHistoryOpen(false);
    setLoadingChat(true);
    try {
      const res = await api.get(`/ai-tutor/conversations/${id}`);
      setActive(unwrapSchoolData<Conversation | null>(res, null));
    } catch (err) {
      toast.error(errorMessage(err, "Could not open this chat."));
    } finally {
      setLoadingChat(false);
    }
  }, []);

  const startConversation = useCallback(async (scope: { subjectId?: string; chapterId?: string; topicId?: string }) => {
    setStarting(true);
    try {
      const res = await api.post("/ai-tutor/conversations", scope);
      const conv = unwrapSchoolData<Conversation | null>(res, null);
      if (conv) {
        setActive(conv);
        loadConversations();
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not start a new chat."));
    } finally {
      setStarting(false);
    }
  }, [loadConversations]);

  useEffect(() => {
    loadConversations();
    api.get("/ai-tutor/subjects")
      .then((res) => {
        const data = unwrapSchoolData<{ className: string; subjects: Subject[] }>(res, { className: "", subjects: [] });
        setSubjects(data.subjects ?? []);
        setClassName(data.className ?? "");
      })
      .catch(() => { /* the picker simply shows "Any subject" */ });
  }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, sending]);

  const send = useCallback(async (text: string, mode: TutorMode = "chat") => {
    const message = text.trim();
    if (!message || !active || sending) return;
    const tempId = `pending-${Date.now()}`;
    const previousTitle = active.title;
    const optimistic: TutorMessage = {
      id: tempId, role: "student", content: message, sources: [], images: [], videos: [],
      syllabusStatus: null, usedWeb: false, createdAt: new Date().toISOString(), pending: true,
    };
    setActive((c) => (c ? {
      ...c,
      title: c.messages.length === 0 ? truncateTitle(message) : c.title,
      messages: [...c.messages, optimistic],
    } : c));
    setInput("");
    setSendingMode(mode);
    setSending(true);
    try {
      const res = await api.post(`/ai-tutor/conversations/${active.id}/messages`, { message, mode });
      const data = unwrapSchoolData<{ studentMessage: TutorMessage; tutorMessage: TutorMessage } | null>(res, null);
      if (!data) throw new Error("Empty response");
      setActive((c) => (c ? {
        ...c,
        messages: [...c.messages.filter((m) => m.id !== tempId), data.studentMessage, data.tutorMessage],
      } : c));
      loadConversations();
    } catch (err) {
      setActive((c) => (c ? { ...c, title: previousTitle, messages: c.messages.filter((m) => m.id !== tempId) } : c));
      setInput(message);
      toast.error(errorMessage(err, "The AI Tutor could not answer. Please try again."));
    } finally {
      setSending(false);
    }
  }, [active, sending, loadConversations]);

  const applyMedia = useCallback((messageId: string, media: { images: TutorImage[]; videos: TutorVideo[] }) => {
    setActive((c) => (c ? {
      ...c,
      messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...media, mediaPending: false } : m)),
    } : c));
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    if (!window.confirm("Delete this chat? This can't be undone.")) return;
    try {
      await api.delete(`/ai-tutor/conversations/${id}`);
      setConversations((list) => list.filter((c) => c.id !== id));
      if (active?.id === id) setActive(null);
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete this chat."));
    }
  }, [active]);

  const newChat = useCallback(() => {
    setActive(null);
    setHistoryOpen(false);
  }, []);

  const prompts = useMemo(() => quickPrompts(active), [active]);

  return (
    <section className="relative isolate flex h-full min-h-0 flex-col bg-gradient-to-b from-sky-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Faint school doodles behind everything */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-100 dark:opacity-40"
        style={{ backgroundImage: DOODLE_PATTERN, backgroundSize: "140px 140px" }}
      />
      {/* Header */}
      <header className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-3 py-2.5 text-white shadow-md shadow-blue-900/10 sm:px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-black text-white">
            {active ? active.title : "AI Tutor"}
          </p>
          <p className="line-clamp-1 text-[11px] font-medium text-blue-100">
            {active
              ? [className, scopeLabel(active)].filter(Boolean).join(" • ") || "Any subject"
              : "Ask anything about your studies"}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          {active && (
            <button type="button" onClick={newChat} aria-label="New chat" title="New chat" className={HEADER_ICON_BUTTON}>
              <SquarePen className="h-[18px] w-[18px]" />
            </button>
          )}
          <button type="button" onClick={() => setHistoryOpen(true)} aria-label="Chat history" title="Chat history" className={HEADER_ICON_BUTTON}>
            <HistoryIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit AI Tutor"
            className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50"
          >
            <X className="h-4 w-4" /> Exit
          </button>
        </div>
      </header>

      {/* Body */}
      {loadingChat ? (
        <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : !active ? (
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-4">
          <NewChatPanel subjects={subjects} className={className} starting={starting} onStart={startConversation} />
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto w-full max-w-3xl space-y-5">
              {active.messages.length === 0 && (
                <div className="mx-auto max-w-2xl py-8 text-center sm:py-12">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-8 ring-white/70 dark:ring-slate-900/60">
                    <GraduationCap className="h-10 w-10" />
                  </div>
                  <h2 className="mt-6 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl dark:from-sky-300 dark:via-blue-300 dark:to-violet-300">
                    What would you like to learn?
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-base text-slate-600 dark:text-slate-300">
                    I answer from your course material and add pictures, YouTube videos and Google results.
                  </p>
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {prompts.map(({ icon: Icon, label, text, mode }, i) => {
                      const style = PROMPT_STYLES[i % PROMPT_STYLES.length];
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => send(text, mode)}
                          disabled={sending}
                          className={cn(
                            "group flex min-h-[7.5rem] flex-col items-start justify-between gap-4 rounded-3xl border-2 bg-gradient-to-br p-5 text-left shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl disabled:opacity-60",
                            style.card,
                          )}
                        >
                          <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:scale-110 group-hover:rotate-3", style.badge)}>
                            <Icon className="h-6 w-6" />
                          </span>
                          <span className="flex w-full items-center justify-between gap-2 text-lg font-black">
                            {label}
                            <ArrowRight className="h-5 w-5 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {active.messages.map((m) => (
                <MessageBubble key={m.id} message={m} conversationId={active.id} onMediaLoaded={applyMedia} />
              ))}
              {sending && <ThinkingIndicator mode={sendingMode} />}
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="px-4 pb-4 pt-2"
          >
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex items-end gap-2 rounded-2xl border border-blue-100 bg-white p-2 shadow-xl shadow-blue-900/10 dark:border-slate-700 dark:bg-slate-900">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                  }}
                  rows={1}
                  placeholder="Ask anything about your studies..."
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-500 dark:text-slate-400">
                AI can make mistakes. Check important answers with your teacher.
              </p>
            </div>
          </form>
        </>
      )}

      {historyOpen && (
        <HistoryPanel
          conversations={conversations}
          loading={loadingList}
          activeId={active?.id}
          onOpen={openConversation}
          onDelete={deleteConversation}
          onNew={newChat}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </section>
  );
}

const HEADER_ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/15 hover:text-white";

// Stars, pencils, atoms and books in brand blue, tiled at low opacity behind the chat.
const DOODLE_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'>" +
  "<g fill='none' stroke='#2563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.07'>" +
  "<path d='M24 14l3.5 7 7.5 1-5.5 5 1.3 7.5L24 31l-6.8 3.5 1.3-7.5-5.5-5 7.5-1z'/>" +
  "<path d='M92 22l24 24M88 26l4-4 26 26-4 4zM88 26l-3 9 9-3'/>" +
  "<ellipse cx='36' cy='100' rx='16' ry='6'/><ellipse cx='36' cy='100' rx='16' ry='6' transform='rotate(60 36 100)'/>" +
  "<ellipse cx='36' cy='100' rx='16' ry='6' transform='rotate(-60 36 100)'/><circle cx='36' cy='100' r='2'/>" +
  "<path d='M92 94c8-4 16-4 22 0v24c-6-4-14-4-22 0zM92 94c-8-4-16-4-22 0v24c6-4 14-4 22 0z'/>" +
  "<path d='M70 62h8M74 58v8'/><circle cx='122' cy='76' r='3'/>" +
  "</g></svg>",
)}")`;

// Icon badge colours for the quick-start buttons, in order.
const PROMPT_STYLES = [
  {
    card: "border-amber-200 from-amber-50 to-orange-100 text-amber-900 shadow-orange-500/10 hover:border-amber-300 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-100",
    badge: "from-amber-400 to-orange-500 shadow-orange-500/30",
  },
  {
    card: "border-emerald-200 from-emerald-50 to-teal-100 text-emerald-900 shadow-teal-500/10 hover:border-emerald-300 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-teal-500/10 dark:text-emerald-100",
    badge: "from-emerald-400 to-teal-500 shadow-teal-500/30",
  },
  {
    card: "border-violet-200 from-violet-50 to-purple-100 text-violet-900 shadow-purple-500/10 hover:border-violet-300 dark:border-violet-500/30 dark:from-violet-500/10 dark:to-purple-500/10 dark:text-violet-100",
    badge: "from-violet-500 to-purple-600 shadow-purple-500/30",
  },
  {
    card: "border-pink-200 from-pink-50 to-rose-100 text-rose-900 shadow-rose-500/10 hover:border-pink-300 dark:border-pink-500/30 dark:from-pink-500/10 dark:to-rose-500/10 dark:text-rose-100",
    badge: "from-pink-500 to-rose-500 shadow-rose-500/30",
  },
];

/**
 * The AI Tutor as a floating button on every student page. Clicking it opens the
 * chat full screen over the page; Exit returns to the same page. The chat mounts
 * on first open and stays mounted (just hidden) after Exit, so a conversation
 * survives closing it or moving between pages.
 */
export default function AiTutorWidget() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // ?aiTutor=open (e.g. the old /school/student/ai-tutor page link) opens it.
  useEffect(() => {
    if (searchParams.get("aiTutor") !== "open") return;
    setMounted(true);
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("aiTutor");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openTutor = () => {
    setMounted(true);
    setOpen(true);
  };

  // Rendered on <body> through a portal so no layout wrapper (page-transition
  // transforms, blurred or clipped containers) can shift or crop the full screen.
  return createPortal(
    <>
      {mounted && (
        // No CSS transform here: it would trap the image/video viewers (position: fixed) inside.
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI Tutor"
          aria-hidden={!open}
          className={cn(
            "fixed inset-0 z-[70] flex flex-col bg-sky-50 transition-opacity duration-200 dark:bg-slate-950",
            ALL_BOLD,
            open ? "visible opacity-100" : "pointer-events-none invisible opacity-0",
          )}
        >
          <AiTutorChat onClose={() => setOpen(false)} />
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={openTutor}
          aria-label="Open AI Tutor"
          className={cn(
            ALL_BOLD,
            "group fixed z-[70] flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-xl shadow-blue-600/30 ring-4 ring-white transition hover:scale-105 focus:outline-none focus-visible:ring-blue-300 dark:ring-slate-900",
            isMobile ? "bottom-[5.25rem] right-4" : "bottom-6 right-6",
          )}
        >
          <Bot className="h-8 w-8" strokeWidth={2.25} />
          <span className="pointer-events-none absolute right-[4.5rem] hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white opacity-0 shadow transition group-hover:opacity-100 md:block">
            AI Tutor
          </span>
        </button>
      )}
    </>,
    document.body,
  );
}
