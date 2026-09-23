import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  PenLine,
  Play,
  Send,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import api, { unwrapSchoolData, unwrapSchoolList } from "@/lib/api/school-client";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { CustomSelect } from "@/components/ui/CustomSelect";
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

interface TutorMessage {
  id: string;
  role: "student" | "tutor";
  content: string;
  sources: TutorSource[];
  images: TutorImage[];
  videos: TutorVideo[];
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

function quickPrompts(c: Conversation | null) {
  const focus = c?.topicName || c?.chapterName || c?.subjectName;
  if (!focus) {
    return [
      { icon: Lightbulb, label: "Explain a topic", text: "Can you explain photosynthesis in simple words?" },
      { icon: PenLine, label: "Solve a doubt", text: "Why does a sharp knife cut better than a blunt one?" },
      { icon: Target, label: "Practice", text: "Give me 5 practice questions on fractions." },
      { icon: Sparkles, label: "Real-life example", text: "Give me a real-life example of Newton's third law." },
    ];
  }
  return [
    { icon: Lightbulb, label: "Explain this topic", text: `Explain ${focus} in simple words.` },
    { icon: Target, label: "Practice questions", text: `Give me 5 practice questions on ${focus}, with answers at the end.` },
    { icon: CheckCircle2, label: "Quiz me", text: `Quiz me on ${focus}. Ask me one question at a time and check my answer.` },
    { icon: Sparkles, label: "Real-life example", text: `Give me a real-life example of ${focus}.` },
  ];
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
        <Globe className="h-3 w-3" /> Images from Google
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
        <Play className="h-3 w-3" /> Videos from YouTube
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {videos.map((v) => (
          <button
            key={v.videoId}
            type="button"
            onClick={() => setPlaying(v)}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-rose-300 dark:border-slate-700 dark:bg-slate-900"
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

function MessageBubble({ message }: { message: TutorMessage }) {
  if (message.role === "student") {
    return (
      <div className="flex justify-end">
        <div className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm",
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
        <Bot className="h-4 w-4" />
      </div>
      <div className="min-w-0 max-w-[92%] flex-1">
        <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
        <ImageStrip images={message.images ?? []} />
        <VideoRow videos={message.videos ?? []} />
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
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
        <Bot className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">Start a new chat</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pick what you're studying so I can answer from your {className || "class"} course, with pictures, videos and Google results. You can also skip this and ask anything.
      </p>
      <div className="mt-5 space-y-3">
        <CustomSelect
          value={subjectId}
          onChange={(v: string) => { setSubjectId(v); setChapterId(""); setTopicId(""); }}
          placeholder="Any subject"
          options={[{ value: "", label: "Any subject" }, ...subjects.map((s) => ({ value: s.id, label: s.name }))]}
          searchable={subjects.length > 8}
        />
        {subject && subject.chapters.length > 0 && (
          <CustomSelect
            value={chapterId}
            onChange={(v: string) => { setChapterId(v); setTopicId(""); }}
            placeholder="Any chapter"
            options={[{ value: "", label: "Any chapter" }, ...subject.chapters.map((c) => ({ value: c.id, label: c.name }))]}
            searchable={subject.chapters.length > 8}
          />
        )}
        {chapter && chapter.topics.length > 0 && (
          <CustomSelect
            value={topicId}
            onChange={(v: string) => setTopicId(v)}
            placeholder="Any topic"
            options={[{ value: "", label: "Any topic" }, ...chapter.topics.map((t) => ({ value: t.id, label: t.name }))]}
            searchable={chapter.topics.length > 8}
          />
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
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60"
      >
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
        Start chat
      </button>
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
          <Clock className="h-4 w-4 text-blue-600" />
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
            <MessageSquarePlus className="h-4 w-4" /> New chat
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

export default function AiTutor() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [className, setClassName] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
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

  // Deep link from a topic/chapter page: /school/student/ai-tutor?topicId=... starts a chat there.
  useEffect(() => {
    const topicId = searchParams.get("topicId") || undefined;
    const chapterId = searchParams.get("chapterId") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;
    if (topicId || chapterId || subjectId) {
      setSearchParams({}, { replace: true });
      startConversation({ subjectId, chapterId, topicId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, sending]);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message || !active || sending) return;
    const tempId = `pending-${Date.now()}`;
    const optimistic: TutorMessage = {
      id: tempId, role: "student", content: message, sources: [], images: [], videos: [],
      syllabusStatus: null, usedWeb: false, createdAt: new Date().toISOString(), pending: true,
    };
    setActive((c) => (c ? { ...c, messages: [...c.messages, optimistic] } : c));
    setInput("");
    setSending(true);
    try {
      const res = await api.post(`/ai-tutor/conversations/${active.id}/messages`, { message });
      const data = unwrapSchoolData<{ studentMessage: TutorMessage; tutorMessage: TutorMessage } | null>(res, null);
      if (!data) throw new Error("Empty response");
      setActive((c) => (c ? {
        ...c,
        messages: [...c.messages.filter((m) => m.id !== tempId), data.studentMessage, data.tutorMessage],
      } : c));
      loadConversations();
    } catch (err) {
      setActive((c) => (c ? { ...c, messages: c.messages.filter((m) => m.id !== tempId) } : c));
      setInput(message);
      toast.error(errorMessage(err, "The AI Tutor could not answer. Please try again."));
    } finally {
      setSending(false);
    }
  }, [active, sending, loadConversations]);

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
    <div className="flex h-full min-h-0 p-3 sm:p-5">
      <section className="relative flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40">
        {/* Header */}
        <header className="flex items-center gap-2 rounded-t-2xl border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-4">
          {active && (
            <button type="button" onClick={newChat} aria-label="Back to new chat" className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-black text-slate-900 dark:text-white">
              {active ? active.title : "AI Tutor"}
            </p>
            <p className="line-clamp-1 text-[11px] font-medium text-slate-500">
              {active
                ? [className, scopeLabel(active)].filter(Boolean).join(" • ") || "Any subject"
                : "Ask anything about your studies"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-label="Chat history"
            title="Chat history"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Clock className="h-5 w-5" />
            <span className="hidden sm:inline">History</span>
          </button>
          {active && (
            <button
              type="button"
              onClick={newChat}
              aria-label="New chat"
              title="New chat"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-2.5 text-sm font-black text-white hover:bg-blue-700"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}
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
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4">
              {active.messages.length === 0 && (
                <div className="mx-auto max-w-xl py-6 text-center">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">What would you like to learn?</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    I answer from your course material and add pictures, YouTube videos and Google results.
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {prompts.map(({ icon: Icon, label, text }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => send(text)}
                        disabled={sending}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-blue-600" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {active.messages.map((m) => <MessageBubble key={m.id} message={m} />)}
              {sending && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                    <Bot className="h-4 w-4" />
                  </div>
                  <Loader2 className="h-4 w-4 animate-spin" /> Tutor is thinking and searching...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="rounded-b-2xl border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                  }}
                  rows={1}
                  placeholder="Ask anything about your studies..."
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">
                AI can make mistakes. Check important answers with your teacher.
              </p>
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
    </div>
  );
}
