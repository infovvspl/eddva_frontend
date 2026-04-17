import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronRight, Play, CheckCircle2, Clock,
  Download, ExternalLink, FileText, BookOpen, Trophy,
  ClipboardList, FlaskConical, Youtube, File, Link2,
  Loader2, AlertCircle, Volume2, Maximize2, Lock,
  Radio, Video, Users, Zap, SkipForward,
} from "lucide-react";
import { useCourseTopicDetail } from "@/hooks/use-student";
import type { TopicLecture, TopicResource, TopicDetailWithContent } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();

function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeEmbedUrl(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0&autoplay=1` : url;
}

function formatDuration(secs?: number) {
  if (!secs) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type ResourceTab = "dpp" | "pyq" | "material" | "about";

const RESOURCE_META: Record<string, {
  label: string; icon: React.ReactNode; color: string; bg: string; border: string;
}> = {
  dpp:   { label: "DPP",   icon: <ClipboardList className="w-4 h-4" />, color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200" },
  pyq:   { label: "PYQ",   icon: <Trophy className="w-4 h-4" />,        color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200" },
  pdf:   { label: "PDF",   icon: <File className="w-4 h-4" />,          color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200" },
  notes: { label: "Notes", icon: <FileText className="w-4 h-4" />,      color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200" },
  video: { label: "Video", icon: <Youtube className="w-4 h-4" />,       color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200" },
  link:  { label: "Link",  icon: <Link2 className="w-4 h-4" />,         color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200" },
  quiz:  { label: "Quiz",  icon: <FlaskConical className="w-4 h-4" />,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

// ─── Video Player ─────────────────────────────────────────────────────────────

function VideoPlayer({ lecture }: { lecture: TopicLecture | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!lecture) {
    return (
      <div className="w-full aspect-video bg-slate-900 flex flex-col items-center justify-center rounded-2xl">
        <Video className="w-14 h-14 text-slate-700 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Select a lecture to start watching</p>
      </div>
    );
  }

  const videoUrl = lecture.videoUrl;

  // YouTube embed
  if (videoUrl && isYouTube(videoUrl)) {
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        <iframe
          src={getYouTubeEmbedUrl(videoUrl)}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={lecture.title}
        />
      </div>
    );
  }

  // Uploaded video file
  if (videoUrl) {
    const src = resolveUrl(videoUrl);
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          className="w-full h-full"
          controlsList="nodownload"
        />
      </div>
    );
  }

  // No video URL — placeholder
  return (
    <div className="w-full aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex flex-col items-center justify-center shadow-2xl">
      <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
        <Video className="w-10 h-10 text-slate-500" />
      </div>
      <p className="text-slate-400 font-semibold text-sm">{lecture.title}</p>
      <p className="text-slate-500 text-xs mt-1">Video not available yet</p>
    </div>
  );
}

// ─── Lecture Playlist Item ────────────────────────────────────────────────────

function PlaylistItem({
  lecture, index, isActive, onClick,
}: {
  lecture: TopicLecture; index: number; isActive: boolean; onClick: () => void;
}) {
  const pct = lecture.watchProgress ?? 0;
  const done = !!lecture.isCompleted;
  const thumb = resolveUrl(lecture.thumbnailUrl);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all group",
        isActive
          ? "bg-indigo-50 border border-indigo-200"
          : "hover:bg-slate-50 border border-transparent"
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0">
        {thumb ? (
          <img src={thumb} alt={lecture.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
            <Video className="w-5 h-5 text-slate-500" />
          </div>
        )}
        {done && (
          <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
        )}
        {isActive && !done && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
              <Play className="w-4 h-4 text-slate-900 fill-current ml-0.5" />
            </div>
          </div>
        )}
        {pct > 0 && !done && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700">
            <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] font-black text-slate-400 mt-0.5 shrink-0">{index + 1}</span>
          <p className={cn(
            "text-xs font-semibold leading-snug line-clamp-2",
            isActive ? "text-indigo-700" : "text-slate-700"
          )}>
            {lecture.title}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1.5 ml-4">
          {lecture.duration && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> {formatDuration(lecture.duration)}
            </span>
          )}
          {done && (
            <span className="text-[10px] font-bold text-emerald-600">Completed</span>
          )}
          {pct > 0 && !done && (
            <span className="text-[10px] font-bold text-indigo-500">{pct}% watched</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({ res }: { res: TopicResource }) {
  const meta = RESOURCE_META[res.type] ?? RESOURCE_META.link;
  const url = res.externalUrl || resolveUrl(res.fileUrl);

  const handleOpen = () => {
    if (!url) { toast.error("Resource not available yet"); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleOpen}
      className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
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
        {res.externalUrl ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentCourseTopicPage() {
  const { batchId = "", topicId = "" } = useParams<{ batchId: string; topicId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCourseTopicDetail(batchId, topicId);

  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);
  const [resourceTab, setResourceTab] = useState<ResourceTab>("dpp");

  // Auto-select first in-progress or first lecture
  useEffect(() => {
    if (!data?.lectures?.length) return;
    if (activeLectureId) return;
    const inProgress = data.lectures.find(l => (l.watchProgress ?? 0) > 0 && !l.isCompleted);
    setActiveLectureId(inProgress?.id ?? data.lectures[0].id);
  }, [data, activeLectureId]);

  if (isLoading) return (
    <div className="py-40 flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      <p className="text-sm text-slate-400 font-medium">Loading topic…</p>
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
      <button
        onClick={() => navigate(`/student/courses/${batchId}`)}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Course
      </button>
    </div>
  );

  const { topic, subject, chapter, lectures, resources } = data;

  const activeLecture = lectures.find(l => l.id === activeLectureId) ?? lectures[0] ?? null;

  const dppList      = resources.filter(r => r.type === "dpp");
  const pyqList      = resources.filter(r => r.type === "pyq");
  const materialList = resources.filter(r => ["pdf", "notes", "video", "link"].includes(r.type));

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
    <div className="max-w-7xl mx-auto pb-24">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-5 font-medium flex-wrap">
        <button onClick={() => navigate("/student/courses")} className="hover:text-slate-700 transition-colors">
          My Courses
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <button onClick={() => navigate(`/student/courses/${batchId}`)} className="hover:text-slate-700 transition-colors">
          {subject?.name || "Course"}
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-500">{chapter?.name}</span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-900 font-semibold">{topic.name}</span>
      </div>

      {/* ── Main Layout: Player + Playlist ── */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">

        {/* Left: Video Player */}
        <div className="flex-1 min-w-0">
          <VideoPlayer lecture={activeLecture} />

          {/* Active lecture info */}
          {activeLecture && (
            <div className="mt-4 space-y-2">
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{activeLecture.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium flex-wrap">
                {subject?.name && (
                  <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    {subject.name}
                  </span>
                )}
                <span>{chapter?.name}</span>
                {activeLecture.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(activeLecture.duration)}
                  </span>
                )}
                {activeLecture.isCompleted && (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Next lecture button */}
          {activeLecture && lectures.indexOf(activeLecture) < lectures.length - 1 && (
            <button
              onClick={() => {
                const idx = lectures.indexOf(activeLecture);
                setActiveLectureId(lectures[idx + 1].id);
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              <SkipForward className="w-4 h-4" /> Next Lecture
            </button>
          )}
        </div>

        {/* Right: Playlist */}
        {lectures.length > 0 && (
          <div className="lg:w-80 shrink-0">
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {/* Playlist header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">
                    Lectures
                    <span className="ml-2 text-xs font-semibold text-slate-400">
                      {lectures.filter(l => l.isCompleted).length}/{lectures.length} done
                    </span>
                  </h3>
                  {/* Overall progress */}
                  <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${lectures.length > 0
                          ? Math.round((lectures.filter(l => l.isCompleted).length / lectures.length) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Playlist items */}
              <div className="divide-y divide-slate-50 max-h-[calc(100vh-300px)] overflow-y-auto">
                {lectures.map((lec, idx) => (
                  <PlaylistItem
                    key={lec.id}
                    lecture={lec}
                    index={idx}
                    isActive={lec.id === activeLectureId}
                    onClick={() => setActiveLectureId(lec.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Resource Tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-slate-100 overflow-x-auto">
          {tabConfig.map(tab => (
            <button
              key={tab.id}
              onClick={() => setResourceTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all",
                resourceTab === tab.id
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "text-[10px] font-black px-1.5 py-0.5 rounded-full",
                  resourceTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {resourceTab === "about" ? (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <h3 className="font-bold text-slate-900 text-lg">{topic.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Study Time",    val: topic.estimatedStudyMinutes ? `~${topic.estimatedStudyMinutes}m` : "—", icon: <Clock className="w-4 h-4 text-blue-500" /> },
                    { label: "Lectures",      val: lectures.length,                                                         icon: <Video className="w-4 h-4 text-indigo-500" /> },
                    { label: "Gate Pass",     val: topic.gatePassPercentage ? `${topic.gatePassPercentage}%` : "70%",      icon: <Zap className="w-4 h-4 text-amber-500" /> },
                    { label: "Resources",     val: resources.length,                                                        icon: <BookOpen className="w-4 h-4 text-emerald-500" /> },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span></div>
                      <p className="text-xl font-black text-slate-800">{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-700">
                  Complete {topic.gatePassPercentage ?? 70}% of the quiz to unlock the next topic.
                </div>
              </motion.div>
            ) : activeResources.length === 0 ? (
              <motion.div
                key={`empty-${resourceTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-500 text-sm">
                  No {resourceTab.toUpperCase()} resources yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Your teacher will add them soon.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={resourceTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {activeResources.map(r => (
                  <ResourceCard key={r.id} res={r} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
