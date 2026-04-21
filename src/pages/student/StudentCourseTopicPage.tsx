import { useState, useLayoutEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DppContentRenderer from "@/components/DppContentRenderer";
import {
  ArrowLeft, ChevronRight, Play, CheckCircle2, Clock,
  Download, ExternalLink, FileText, BookOpen, Trophy,
  ClipboardList, FlaskConical, Youtube, File, Link2,
  Loader2, AlertCircle, Video, Zap, Lock, Sparkles,
  BarChart2, PlayCircle, X, Printer,
} from "lucide-react";
import { useCourseTopicDetail } from "@/hooks/use-student";
import { getResourceDownloadUrl } from "@/lib/api/student";
import type { TopicLecture, TopicResource } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getApiOrigin } from "@/lib/api-config";

const _API_ORIGIN = getApiOrigin();

function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

function fmtDuration(secs?: number) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
}

type ResourceTab = "dpp" | "pyq" | "material" | "about";

const RESOURCE_META: Record<string, {
  label: string; icon: React.ReactNode; color: string; bg: string; border: string;
}> = {
  dpp:   { label: "DPP",   icon: <ClipboardList className="w-3.5 h-3.5" />, color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200" },
  pyq:   { label: "PYQ",   icon: <Trophy className="w-3.5 h-3.5" />,        color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200" },
  pdf:   { label: "PDF",   icon: <File className="w-3.5 h-3.5" />,          color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200" },
  notes: { label: "Notes", icon: <FileText className="w-3.5 h-3.5" />,      color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200" },
  video: { label: "Video", icon: <Youtube className="w-3.5 h-3.5" />,       color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200" },
  link:  { label: "Link",  icon: <Link2 className="w-3.5 h-3.5" />,         color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200" },
  quiz:  { label: "Quiz",  icon: <FlaskConical className="w-3.5 h-3.5" />,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function getYouTubeThumbnail(url?: string | null) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

// ─── Lecture Card ─────────────────────────────────────────────────────────────

function LectureCard({
  lecture, index, batchId, topicId,
}: {
  lecture: TopicLecture; index: number; batchId: string; topicId: string;
}) {
  const navigate = useNavigate();
  const pct = lecture.watchProgress ?? 0;
  const done = !!lecture.isCompleted;
  const thumb = resolveUrl(lecture.thumbnailUrl) || getYouTubeThumbnail(lecture.videoUrl);
  const dur = fmtDuration(lecture.duration);

  const handleClick = () => {
    // Pass return path so the lecture player can navigate back here
    const returnPath = `/student/courses/${batchId}/topics/${topicId}`;
    navigate(`/student/lectures/${lecture.id}?from=${encodeURIComponent(returnPath)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className="group relative flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg cursor-pointer transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative w-36 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-sm">
        {thumb ? (
          <img src={thumb} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900">
            <Video className="w-6 h-6 text-indigo-400/60" />
          </div>
        )}

        {/* Play overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-200",
          done ? "bg-emerald-900/50" : "bg-black/20 group-hover:bg-black/40"
        )}>
          {done ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-400 drop-shadow" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100">
              <Play className="w-4 h-4 text-slate-900 fill-current ml-0.5" />
            </div>
          )}
        </div>

        {/* Progress bar */}
        {pct > 0 && !done && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/50">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}

        {/* Index badge */}
        <div className="absolute top-2 left-2 w-5 h-5 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <span className="text-[9px] font-black text-white">{index + 1}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className={cn(
          "text-sm font-bold leading-snug line-clamp-2 mb-2 transition-colors",
          done ? "text-emerald-700" : "text-slate-800 group-hover:text-indigo-700"
        )}>
          {lecture.title}
        </h3>

        <div className="flex items-center gap-3 flex-wrap">
          {dur && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <Clock className="w-3 h-3" /> {dur}
            </span>
          )}
          {done && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </span>
          )}
          {pct > 0 && !done && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
              {pct}% watched
            </span>
          )}
          {pct === 0 && !done && (
            <span className="text-[11px] font-semibold text-slate-400">Not started</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex items-center self-center shrink-0">
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-200">
          <PlayCircle className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── AI Content Viewer Modal ──────────────────────────────────────────────────

function AiContentModal({ title, content, type, onClose }: {
  title: string; content: string; type: string; onClose: () => void;
}) {
  const meta = RESOURCE_META[type] ?? RESOURCE_META.dpp;
  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl my-8 overflow-hidden"
      >
        {/* Header */}
        <div className={cn("flex items-center gap-3 px-6 py-4 border-b", meta.bg, meta.border)}>
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", meta.bg, meta.color)}>
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm line-clamp-1">{title}</p>
            <span className={cn("text-[10px] font-black uppercase tracking-wider", meta.color)}>{meta.label}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <DppContentRenderer content={content} />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Resource Card ─────────────────────────────────────────────────────────────

function ResourceCard({ res, topicId }: { res: TopicResource; topicId: string }) {
  const meta = RESOURCE_META[String(res.type ?? "").toLowerCase()] ?? RESOURCE_META.link;
  const [loading, setLoading] = useState(false);
  const [aiModal, setAiModal] = useState<{ content: string } | null>(null);

  const handleOpen = async () => {
    // AI-generated content — description is already in the loaded data, no API call needed
    if (!res.fileUrl && !res.externalUrl) {
      if (res.description) {
        setAiModal({ content: res.description });
      } else {
        toast.error("Resource not available yet — teacher is still preparing it");
      }
      return;
    }

    // External link (YouTube, etc.)
    if (res.externalUrl) {
      window.open(res.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Uploaded S3 file — get presigned URL, fall back to direct URL
    setLoading(true);
    try {
      const result = await getResourceDownloadUrl(topicId, res.id);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        window.open(resolveUrl(res.fileUrl)!, "_blank", "noopener,noreferrer");
      }
    } catch {
      // backend endpoint not deployed yet — try direct S3 URL (works if bucket is public)
      window.open(resolveUrl(res.fileUrl)!, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {aiModal && (
        <AiContentModal
          title={res.title}
          content={aiModal.content}
          type={String(res.type ?? "").toLowerCase()}
          onClose={() => setAiModal(null)}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={loading ? undefined : handleOpen}
        className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
          meta.bg, meta.border, meta.color
        )}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {res.title}
          </p>
          <span className={cn("text-[10px] font-black uppercase tracking-wider", meta.color)}>
            {meta.label}
          </span>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
          "bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white"
        )}>
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : res.externalUrl
              ? <ExternalLink className="w-3.5 h-3.5" />
              : <Download className="w-3.5 h-3.5" />
          }
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentCourseTopicPage() {
  const { batchId = "", topicId = "" } = useParams<{ batchId: string; topicId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading, isError } = useCourseTopicDetail(batchId, topicId);

  const [resourceTab, setResourceTab] = useState<ResourceTab>("dpp");

  const openParam = searchParams.get("open");
  useLayoutEffect(() => {
    if (openParam === "dpp" || openParam === "pyq" || openParam === "material") {
      setResourceTab(openParam);
    } else {
      setResourceTab("dpp");
    }
  }, [openParam, batchId, topicId]);

  if (isLoading) return (
    <div className="py-40 flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      <p className="text-sm text-slate-400 font-medium animate-pulse">Loading topic…</p>
    </div>
  );

  if (isError || !data) return (
    <div className="py-40 flex flex-col items-center text-center max-w-sm mx-auto gap-6">
      <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Topic not found</h3>
        <p className="text-slate-500 text-sm">You may not be enrolled or the topic doesn't exist.</p>
      </div>
      <button onClick={() => navigate(`/student/courses/${batchId}`)}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg">
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </button>
    </div>
  );

  const { topic, subject, chapter } = data;
  const lectures = data.lectures ?? [];
  const resources = data.resources ?? [];

  const completedCount = lectures.filter(l => l.isCompleted).length;
  const progressPct = lectures.length > 0 ? Math.round((completedCount / lectures.length) * 100) : 0;
  const inProgressLecture = lectures.find(l => (l.watchProgress ?? 0) > 0 && !l.isCompleted);
  const nextLecture = inProgressLecture ?? lectures.find(l => !l.isCompleted) ?? lectures[0];

  const resType = (r: TopicResource) => String(r.type ?? "").toLowerCase();
  const dppList      = resources.filter(r => resType(r) === "dpp");
  const pyqList      = resources.filter(r => resType(r) === "pyq");
  const materialList = resources.filter(r => ["pdf", "notes", "video", "link"].includes(resType(r)));

  const tabConfig: { id: ResourceTab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: "dpp",      label: "DPP",           count: dppList.length,      icon: <ClipboardList className="w-4 h-4" /> },
    { id: "pyq",      label: "PYQ",           count: pyqList.length,      icon: <Trophy className="w-4 h-4" /> },
    { id: "material", label: "Study Material", count: materialList.length, icon: <BookOpen className="w-4 h-4" /> },
    { id: "about",    label: "About",         count: 0,                   icon: <FileText className="w-4 h-4" /> },
  ];

  const activeResources =
    resourceTab === "dpp"      ? dppList :
    resourceTab === "pyq"      ? pyqList :
    resourceTab === "material" ? materialList : [];

  return (
    <div className="max-w-5xl mx-auto pb-32 space-y-6">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium flex-wrap pt-1">
        <button onClick={() => navigate("/student/courses")} className="hover:text-indigo-600 transition-colors">
          My Courses
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <button onClick={() => navigate(`/student/courses/${batchId}`)} className="hover:text-indigo-600 transition-colors">
          {subject?.name || "Course"}
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-500">{chapter?.name}</span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-800 font-semibold">{topic.name}</span>
      </div>

      {/* ── Topic Hero ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white overflow-hidden relative">
        {/* background glow */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                {subject?.name}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-[10px] font-semibold text-slate-400">{chapter?.name}</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight leading-tight mb-4">{topic.name}</h1>

            {/* Progress bar */}
            {lectures.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {completedCount} of {lectures.length} lectures completed
                  </span>
                  <span className="font-black text-indigo-300">{progressPct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-3 shrink-0">
            {[
              { icon: <Video className="w-4 h-4" />, val: lectures.length, label: "Lectures" },
              { icon: <BookOpen className="w-4 h-4" />, val: resources.length, label: "Resources" },
              { icon: <Clock className="w-4 h-4" />, val: topic.estimatedStudyMinutes ? `${topic.estimatedStudyMinutes}m` : "—", label: "Study time" },
              { icon: <Zap className="w-4 h-4" />, val: `${topic.gatePassPercentage ?? 70}%`, label: "Gate pass" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-w-[68px]">
                <div className="text-indigo-300 mb-1">{s.icon}</div>
                <p className="text-base font-black">{s.val}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Continue button */}
        {nextLecture && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              const returnPath = `/student/courses/${batchId}/topics/${topicId}`;
              navigate(`/student/lectures/${nextLecture.id}?from=${encodeURIComponent(returnPath)}`);
            }}
            className="relative z-10 mt-6 flex items-center gap-3 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-900/40 group w-fit"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            {inProgressLecture ? "Continue Watching" : completedCount === lectures.length && lectures.length > 0 ? "Rewatch" : "Start Learning"}
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        )}
      </div>

      {/* ── Lectures List ── */}
      {lectures.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-500" />
              Lectures
            </h2>
            {completedCount > 0 && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                {completedCount}/{lectures.length} done
              </span>
            )}
          </div>

          <div className="space-y-2">
            {lectures.map((lec, idx) => (
              <LectureCard
                key={lec.id}
                lecture={lec}
                index={idx}
                batchId={batchId}
                topicId={topicId}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-100 rounded-3xl gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Video className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">No lectures yet</p>
            <p className="text-sm text-slate-400">Your teacher will upload lectures for this topic soon.</p>
          </div>
        </div>
      )}

      {/* ── Resources ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-slate-100 overflow-x-auto">
          {tabConfig.map(tab => (
            <button
              key={tab.id}
              onClick={() => setResourceTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all",
                resourceTab === tab.id
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                  resourceTab === tab.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {resourceTab === "about" ? (
              <motion.div key="about" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{topic.name}</h3>
                  <p className="text-sm text-slate-500">Part of <span className="font-semibold text-slate-700">{chapter?.name}</span> in <span className="font-semibold text-indigo-600">{subject?.name}</span></p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Study Time",  val: topic.estimatedStudyMinutes ? `~${topic.estimatedStudyMinutes}m` : "—", icon: <Clock className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50" },
                    { label: "Lectures",    val: lectures.length,                                                        icon: <Video className="w-4 h-4 text-indigo-500" />, bg: "bg-indigo-50" },
                    { label: "Gate Pass",   val: `${topic.gatePassPercentage ?? 70}%`,                                  icon: <Zap className="w-4 h-4 text-amber-500" />,   bg: "bg-amber-50" },
                    { label: "Resources",   val: resources.length,                                                       icon: <BookOpen className="w-4 h-4 text-emerald-500" />, bg: "bg-emerald-50" },
                  ].map(s => (
                    <div key={s.label} className={cn("rounded-2xl p-4 border border-slate-100", s.bg)}>
                      <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span></div>
                      <p className="text-2xl font-black text-slate-800">{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-700 font-medium">
                    Complete <strong>{topic.gatePassPercentage ?? 70}%</strong> of the quiz to unlock the next topic and earn XP.
                  </p>
                </div>
              </motion.div>
            ) : activeResources.length === 0 ? (
              <motion.div key={`empty-${resourceTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-500 text-sm">No {resourceTab.toUpperCase()} resources yet</p>
                <p className="text-xs text-slate-400 mt-1">Your teacher will add them soon.</p>
              </motion.div>
            ) : (
              <motion.div key={resourceTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeResources.map(r => <ResourceCard key={r.id} res={r} topicId={topicId} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
