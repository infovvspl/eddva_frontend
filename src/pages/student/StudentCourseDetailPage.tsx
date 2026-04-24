import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, BookOpen, Video, CheckCircle2, Lock,
  Clock, ArrowLeft, Download, ExternalLink, Play, FileText,
  Users, BarChart3, Trophy, Loader2, Search, Filter,
  GraduationCap, Layers, Zap, Star, Circle, AlertCircle,
  Youtube, File, ClipboardList, FlaskConical,
} from "lucide-react";
import { useCourseCurriculum, useBatchPreview, useEnrollInBatch, useAllBatchLectures, useMyCourses, useMockTests, useStudentSessions, studentKeys } from "@/hooks/use-student";
import type { CourseSubject, CourseChapter, CourseTopic, CourseResource, BatchPreview, PreviewSubject, StudentLecture, MockTestListItem, TestSession } from "@/lib/api/student";
import { isSessionCompleted } from "@/lib/api/student";
import { apiClient, extractData } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getApiOrigin } from "@/lib/api-config";

const _API_ORIGIN = getApiOrigin();

function resolveUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

function isYoutubeLectureUrl(url?: string | null) {
  if (!url) return false;
  const u = url.startsWith("http") ? url : `${_API_ORIGIN}${url}`;
  return u.includes("youtube.com") || u.includes("youtu.be");
}

/** Prefer live / scheduled / published for default play target */
function primaryLectureForTopic(lectures: StudentLecture[]): StudentLecture | null {
  if (!lectures.length) return null;
  const rank = (s: string) =>
    s === "live" ? 0 : s === "scheduled" ? 1 : s === "published" ? 2 : s === "ended" ? 3 : 9;
  return [...lectures].sort((a, b) => rank(a.status) - rank(b.status))[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "curriculum" | "dpp" | "pyq" | "material";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, { bg: string; text: string; light: string; ring: string }> = {
  physics:     { bg: "#3B82F6", text: "#fff", light: "bg-blue-50",   ring: "ring-blue-200" },
  chemistry:   { bg: "#10B981", text: "#fff", light: "bg-emerald-50", ring: "ring-emerald-200" },
  mathematics: { bg: "#F59E0B", text: "#fff", light: "bg-amber-50",   ring: "ring-amber-200" },
  biology:     { bg: "#8B5CF6", text: "#fff", light: "bg-violet-50",  ring: "ring-violet-200" },
  maths:       { bg: "#F59E0B", text: "#fff", light: "bg-amber-50",   ring: "ring-amber-200" },
  default:     { bg: "#6366F1", text: "#fff", light: "bg-indigo-50",  ring: "ring-indigo-200" },
};

function subjectColor(name?: string) {
  const key = name?.toLowerCase() ?? "";
  return (
    Object.entries(SUBJECT_COLORS).find(([k]) => key.includes(k))?.[1] ??
    SUBJECT_COLORS.default
  );
}

const RESOURCE_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  dpp:   { label: "DPP",   icon: <ClipboardList className="w-4 h-4" />, color: "text-orange-600",  bg: "bg-orange-50 border-orange-200" },
  pyq:   { label: "PYQ",   icon: <Trophy className="w-4 h-4" />,        color: "text-violet-600",  bg: "bg-violet-50 border-violet-200" },
  pdf:   { label: "PDF",   icon: <File className="w-4 h-4" />,          color: "text-red-600",     bg: "bg-red-50 border-red-200" },
  notes: { label: "Notes", icon: <FileText className="w-4 h-4" />,      color: "text-blue-600",    bg: "bg-blue-50 border-blue-200" },
  video: { label: "Video", icon: <Youtube className="w-4 h-4" />,       color: "text-red-600",     bg: "bg-red-50 border-red-200" },
  link:  { label: "Link",  icon: <ExternalLink className="w-4 h-4" />,  color: "text-teal-600",    bg: "bg-teal-50 border-teal-200" },
  quiz:  { label: "Quiz",  icon: <FlaskConical className="w-4 h-4" />,  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectResources(subjects: CourseSubject[], types?: string[]): CourseResource[] {
  const out: CourseResource[] = [];
  for (const s of subjects) {
    for (const c of s.chapters) {
      for (const t of c.topics) {
        for (const r of t.resources) {
          if (!types || types.includes(r.type)) {
            out.push({ ...r, topicId: t.id, topicName: t.name, subjectName: s.name, chapterName: c.name });
          }
        }
      }
    }
  }
  return out;
}

// ─── Resource Card ────────────────────────────────────────────────────────────

function ResourceCard({ res, isLocked }: { res: CourseResource; isLocked: boolean }) {
  const meta = RESOURCE_META[res.type] ?? RESOURCE_META.link;
  const url = res.externalUrl || resolveUrl(res.fileUrl);

  const handleOpen = () => {
    if (isLocked) { toast.error("Unlock this course to access materials"); return; }
    if (!url) { toast.error("Resource not available"); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border bg-white hover:shadow-md transition-all group cursor-pointer",
        isLocked && "opacity-60 cursor-not-allowed"
      )}
      onClick={handleOpen}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", meta.bg, meta.color)}>
        {isLocked ? <Lock className="w-4 h-4 text-slate-400" /> : meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">{res.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
          <span className={cn("font-bold uppercase", meta.color)}>{meta.label}</span>
          {res.chapterName && <><span>·</span><span className="line-clamp-1">{res.chapterName}</span></>}
          {res.fileSizeKb && <><span>·</span><span>{(res.fileSizeKb / 1024).toFixed(1)} MB</span></>}
        </div>
      </div>
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
        isLocked
          ? "bg-slate-100 text-slate-300"
          : "bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white"
      )}>
        {res.externalUrl ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
      </div>
    </div>
  );
}

// ─── Flat Resource List (DPP / PYQ / Material tabs) ──────────────────────────

function ResourceTab({
  resources, isLocked, emptyLabel,
}: { resources: CourseResource[]; isLocked: boolean; emptyLabel: string }) {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const subjects = useMemo(() => [...new Set(resources.map(r => r.subjectName).filter(Boolean))], [resources]);

  const filtered = resources.filter(r => {
    if (subjectFilter !== "all" && r.subjectName !== subjectFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by chapter
  const groups = useMemo(() => {
    const map = new Map<string, CourseResource[]>();
    for (const r of filtered) {
      const key = `${r.subjectName} › ${r.chapterName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [filtered]);

  if (resources.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-7 h-7 text-slate-300" />
        </div>
        <p className="font-semibold text-slate-500">{emptyLabel}</p>
        <p className="text-sm text-slate-400 mt-1">Resources will appear here once added by your teacher.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>
        {subjects.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {["all", ...subjects].map(s => (
              <button
                key={s}
                onClick={() => setSubjectFilter(s as string)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                  subjectFilter === s
                    ? "bg-indigo-600 text-white border-transparent"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                )}
              >
                {s === "all" ? "All Subjects" : s}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 font-medium">
        {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grouped list */}
      {Array.from(groups.entries()).map(([groupKey, items]) => (
        <div key={groupKey}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{groupKey}</p>
          <div className="space-y-2">
            {items.map(r => <ResourceCard key={r.id} res={r} isLocked={isLocked} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Topic Row ────────────────────────────────────────────────────────────────

function TopicRow({
  topic, batchId, isLocked, topicLectures = [],
}: { topic: CourseTopic; batchId: string; isLocked: boolean; topicLectures?: StudentLecture[] }) {
  const navigate = useNavigate();
  const isComplete = topic.status === "completed";
  const isInProgress = topic.status === "in_progress";
  const locked = false;

  // Prefer the pre-computed counts from the API; fall back to counting resources array
  const resourceCounts = useMemo(() => {
    if (topic.resourceCounts && Object.keys(topic.resourceCounts).length > 0) {
      return topic.resourceCounts;
    }
    const counts: Record<string, number> = {};
    for (const r of topic.resources) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
    return counts;
  }, [topic.resourceCounts, topic.resources]);

  const goTopicResourceTab = (e: React.MouseEvent, open: "dpp" | "pyq" | "material") => {
    e.stopPropagation();
    if (locked) { toast.error("Unlock this course to access materials"); return; }
    navigate(`/student/courses/${batchId}/topics/${topic.id}?open=${open}`);
  };

  const handleClick = () => {
    if (locked) { toast.error("Complete previous topics to unlock this one"); return; }
    const primary = primaryLectureForTopic(topicLectures);
    if (primary) navigate(`/student/lectures/${primary.id}`);
    else navigate(`/student/courses/${batchId}/topics/${topic.id}`);
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all overflow-hidden",
        isComplete
          ? "bg-emerald-50/60 border-emerald-100"
          : isInProgress
            ? "bg-blue-50/60 border-blue-100"
            : locked
              ? "bg-slate-50 border-slate-100 opacity-70"
              : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
        className={cn(
          "flex items-center gap-4 px-5 py-4 cursor-pointer transition-all group",
          locked ? "cursor-not-allowed" : ""
        )}
      >
        {/* Status icon */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          isComplete  ? "bg-emerald-100" :
          isInProgress ? "bg-blue-100" :
          locked       ? "bg-slate-100" : "bg-slate-100 group-hover:bg-indigo-100"
        )}>
          {isComplete  ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> :
           isInProgress ? <Play className="w-5 h-5 text-blue-600" /> :
           locked       ? <Lock className="w-4 h-4 text-slate-400" /> :
                          <Circle className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold text-sm truncate",
            isComplete ? "text-slate-500 line-through" : "text-slate-800"
          )}>
            {topic.name}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {topic.estimatedStudyMinutes && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Clock className="w-3 h-3" /> {topic.estimatedStudyMinutes}m
              </span>
            )}
            {(topic.lectureCount ?? topic.lectures.total) > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Video className="w-3 h-3" />
                {topic.lectures.completed}/{topic.lectureCount ?? topic.lectures.total} lectures
              </span>
            )}
            {/* Resource badges — open topic page on the right tab */}
            {Object.entries(resourceCounts).map(([type, count]) => {
              const meta = RESOURCE_META[type];
              if (!meta || !count) return null;
              const open: "dpp" | "pyq" | "material" =
                type === "dpp" ? "dpp" : type === "pyq" ? "pyq" : "material";
              return (
                <button
                  key={type}
                  type="button"
                  onClick={e => goTopicResourceTab(e, open)}
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-transform hover:scale-[1.02]",
                    meta.bg, meta.color,
                    locked && "opacity-50 pointer-events-none"
                  )}
                >
                  {meta.icon} {count} {meta.label}
                </button>
              );
            })}
            {isInProgress && topic.bestAccuracy != null && topic.bestAccuracy > 0 && (
              <span className="text-[11px] font-bold text-blue-600">{topic.bestAccuracy}% accuracy</span>
            )}
          </div>
        </div>

        <ChevronRight className={cn(
          "w-4 h-4 shrink-0 transition-colors",
          locked ? "text-slate-200" : "text-slate-300 group-hover:text-indigo-500"
        )} />
      </div>
    </div>
  );
}

// ─── Chapter Accordion ────────────────────────────────────────────────────────

function ChapterAccordion({
  chapter, batchId, subjectId, isLocked, defaultOpen, lecturesByTopicId,
  onSelectChapter,
}: {
  chapter: CourseChapter;
  batchId: string;
  subjectId: string;
  isLocked: boolean;
  defaultOpen?: boolean;
  lecturesByTopicId: Map<string, StudentLecture[]>;
  onSelectChapter?: (subjectId: string, chapterId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const completedCount = chapter.topics.filter(t => t.status === "completed").length;
  const allDone = completedCount === chapter.topics.length && chapter.topics.length > 0;
  // Use pre-computed counts where available, fall back to derived values
  const totalLectures = chapter.topics.reduce((s, t) => s + (t.lectureCount ?? t.lectures.total), 0);
  const totalResources = chapter.topics.reduce((s, t) => {
    if (t.resourceCounts) return s + Object.values(t.resourceCounts).reduce((a, b) => a + b, 0);
    return s + t.resources.length;
  }, 0);

  return (
    <div
      id={`chapter-block-${chapter.id}`}
      className={cn(
        "rounded-2xl overflow-hidden border transition-all scroll-mt-28",
        open ? "border-slate-200 shadow-sm" : "border-slate-100"
      )}
    >
      <div className="flex items-stretch bg-white">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => {
            onSelectChapter?.(subjectId, chapter.id);
            setOpen(true);
          }}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            allDone ? "bg-emerald-100" : open ? "bg-slate-900" : "bg-slate-100"
          )}>
            {allDone
              ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              : <BookOpen className={cn("w-5 h-5", open ? "text-white" : "text-slate-400")} />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm line-clamp-1">{chapter.name}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">{completedCount}/{chapter.topics.length} topics</span>
              {totalLectures > 0 && <span className="text-[11px] text-slate-400 font-medium">· {totalLectures} lectures</span>}
              {totalResources > 0 && <span className="text-[11px] text-slate-400 font-medium">· {totalResources} resources</span>}
              {(chapter.jeeWeightage ?? 0) > 0 && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                  JEE {chapter.jeeWeightage}%
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0 pr-2">
            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${chapter.topics.length > 0 ? Math.round((completedCount / chapter.topics.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        </button>

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Collapse chapter" : "Expand chapter"}
          className="shrink-0 px-3 flex items-center border-l border-slate-100 hover:bg-slate-50 transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <motion.div animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50/50 border-t border-slate-100 p-3 space-y-2">
              {chapter.topics.map(t => (
                <TopicRow
                  key={t.id}
                  topic={t}
                  batchId={batchId}
                  isLocked={isLocked}
                  topicLectures={lecturesByTopicId.get(t.id) ?? []}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subject Section ──────────────────────────────────────────────────────────

function SubjectSection({
  subject, batchId, isLocked, defaultOpen, lecturesByTopicId, onSelectChapter,
}: {
  subject: CourseSubject;
  batchId: string;
  isLocked: boolean;
  defaultOpen?: boolean;
  lecturesByTopicId: Map<string, StudentLecture[]>;
  onSelectChapter?: (subjectId: string, chapterId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const color = subjectColor(subject.name);
  const totalTopics = subject.chapters.reduce((a, c) => a + c.topics.length, 0);
  const doneTopics = subject.chapters.reduce((a, c) => a + c.topics.filter(t => t.status === "completed").length, 0);
  const pct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
        onClick={() => setOpen(o => !o)}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: subject.colorCode ?? color.bg }}
        >
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900" style={{ color: subject.colorCode ?? color.bg }}>
            {subject.name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-slate-400 font-medium">{doneTopics}/{totalTopics} topics</span>
            <span className="text-[11px] text-slate-400 font-medium">· {subject.chapters.length} chapters</span>
            {subject.teacher && <span className="text-[11px] text-slate-400">· {subject.teacher.name}</span>}
          </div>
        </div>

        {/* Circular progress */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={subject.colorCode ?? color.bg}
                strokeWidth="3"
                strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-700">{pct}%</span>
          </div>
        </div>

        <motion.div animate={{ rotate: open ? 180 : 0 }} className="shrink-0">
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pl-3 space-y-2">
              {subject.chapters.map((ch, ci) => (
                <ChapterAccordion
                  key={ch.id}
                  chapter={ch}
                  batchId={batchId}
                  subjectId={subject.id}
                  isLocked={isLocked}
                  defaultOpen={ci === 0}
                  lecturesByTopicId={lecturesByTopicId}
                  onSelectChapter={onSelectChapter}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Lock Overlay ─────────────────────────────────────────────────────────────

function LockedBanner({ courseName, isPaid, feeAmount }: { courseName: string; isPaid?: boolean; feeAmount?: number | null }) {
  const navigate = useNavigate();
  return (
    <div className="relative rounded-3xl overflow-hidden border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {isPaid ? "Purchase Required" : "Not Enrolled"}
      </h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
        {isPaid
          ? `Enroll in "${courseName}" for ₹${feeAmount?.toLocaleString() ?? "—"} to unlock all content.`
          : `Enroll in "${courseName}" for free to access all materials.`}
      </p>
      <button
        onClick={() => navigate("/student/courses?discover=1")}
        className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all"
      >
        {isPaid ? `Enroll · ₹${feeAmount?.toLocaleString() ?? "—"}` : "Enroll Free"}
      </button>
    </div>
  );
}

// ─── Batch Preview Page (not enrolled) ───────────────────────────────────────

function BatchPreviewPage({ batchId, preview }: { batchId: string; preview: BatchPreview }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const enrollMutation = useEnrollInBatch();
  const [joining, setJoining] = useState(false);
  const thumbnail = resolveUrl(preview.thumbnailUrl);
  const gradient = preview.examTarget === "JEE"
    ? "from-orange-500 to-red-600"
    : preview.examTarget === "NEET"
      ? "from-emerald-500 to-teal-600"
      : "from-indigo-600 to-purple-700";

  const handleEnroll = () => {
    enrollMutation.mutate(batchId, {
      onSuccess: () => {
        toast.success("Enrolled successfully! Loading your course…");
        navigate(`/student/courses/${batchId}`, { replace: true });
      },
      onError: () => {
        toast.error("Enrollment failed. Please try again.");
      },
    });
  };

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handleCheckout = async () => {
    setJoining(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay SDK failed to load");

      const orderData = await apiClient.post(`/batches/${batchId}/checkout`);
      const { orderId, amount, currency, key } = extractData<{ orderId: string; amount: number; currency: string; key: string }>(orderData);

      const rzp = new (window as any).Razorpay({
        key, amount, currency,
        name: preview.name,
        description: "Course Enrollment",
        order_id: orderId,
        handler: async (response: any) => {
          setJoining(true);
          try {
            await apiClient.post(`/batches/${batchId}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Bust stale query cache so the enrolled view loads immediately
            await queryClient.invalidateQueries({ queryKey: studentKeys.courseCurriculum(batchId) });
            await queryClient.invalidateQueries({ queryKey: studentKeys.myCourses });
            queryClient.invalidateQueries({ queryKey: ["student", "batch-preview", batchId] });
            toast.success("Enrolled successfully! Loading your course…");
            navigate(`/student/courses/${batchId}`, { replace: true });
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Payment verification failed");
            setJoining(false);
          }
        },
        theme: { color: "#f59e0b" },
        modal: { ondismiss: () => setJoining(false) },
      });
      rzp.on("payment.failed", (res: any) => {
        toast.error(res.error.description);
        setJoining(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Checkout failed. Please try again.");
      setJoining(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Back */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => navigate("/student/courses")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-700 transition-colors group"
        >
          Discover Courses
          <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-180" />
        </button>
      </div>

      {/* Hero */}
      <div className={cn(
        "relative rounded-3xl overflow-hidden mb-8 shadow-xl",
        thumbnail ? "" : `bg-gradient-to-br ${gradient}`
      )}>
        {thumbnail && <img src={thumbnail} alt={preview.name} className="absolute inset-0 w-full h-full object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/30" />
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-xl text-xs font-bold text-white uppercase tracking-wide">
                  {preview.examTarget}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-xl text-xs font-bold text-white uppercase tracking-wide">
                  Class {preview.class}
                </span>
                {preview.isPaid ? (
                  <span className="px-3 py-1 bg-amber-500/80 backdrop-blur-sm rounded-xl text-xs font-bold text-white">
                    ₹{preview.feeAmount?.toLocaleString() ?? "—"}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-xl text-xs font-bold text-white">FREE</span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{preview.name}</h1>

              {preview.teacher && (
                <p className="text-indigo-200 text-sm font-medium mb-6 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {preview.teacher.fullName}
                </p>
              )}

              <div className="flex flex-wrap gap-6 text-sm text-white/80 font-medium mb-6">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-300" />
                  {preview.subjectNames?.length ?? 0} Subjects
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-300" />
                  {(preview.studentCount ?? 0).toLocaleString()} Students
                </span>
              </div>

              {/* Subject chips (locked) */}
              {preview.subjectNames && preview.subjectNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preview.subjectNames.map(sn => {
                    const c = subjectColor(sn);
                    return (
                      <div
                        key={sn}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white/90"
                        style={{ background: `${c.bg}80` }}
                      >
                        <Lock className="w-3 h-3 opacity-70" /> {sn}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Enroll Card */}
            <div className="lg:w-72 shrink-0">
              <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
                {preview.isPaid ? (
                  <>
                    <div className="text-center">
                      <p className="text-3xl font-black text-slate-900">₹{preview.feeAmount?.toLocaleString() ?? "—"}</p>
                      <p className="text-sm text-slate-400 mt-1">One-time payment</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        { icon: <Layers className="w-4 h-4 text-indigo-500" />, text: `${preview.subjectNames?.length ?? 0} subjects included` },
                        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Full curriculum access" },
                        { icon: <Trophy className="w-4 h-4 text-amber-500" />, text: "DPP & PYQ sheets" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-600">{item.icon}{item.text}</div>
                      ))}
                    </div>
                    <button
                      onClick={handleCheckout}
                      disabled={joining}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:from-amber-600 hover:to-orange-600 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      {joining
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                        : <><Zap className="w-4 h-4" /> Checkout · ₹{preview.feeAmount?.toLocaleString() ?? "—"}</>}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-3xl font-black text-emerald-600">Free</p>
                      <p className="text-sm text-slate-400 mt-1">No payment required</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        { icon: <Layers className="w-4 h-4 text-indigo-500" />, text: `${preview.subjectNames?.length ?? 0} subjects included` },
                        { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Full curriculum access" },
                        { icon: <Play className="w-4 h-4 text-blue-500" />, text: "All lectures included" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-600">{item.icon}{item.text}</div>
                      ))}
                    </div>
                    <button
                      onClick={handleEnroll}
                      disabled={enrollMutation.isPending}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      {enrollMutation.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Enrolling…</>
                        : <><Zap className="w-4 h-4" /> Enroll Free</>}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full locked curriculum */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Course Curriculum</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {preview.totalTopics ?? 0} topics across {preview.curriculum?.length ?? 0} subjects — enroll to access
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
              <Lock className="w-3.5 h-3.5" /> Locked
            </div>
          </div>

          {(preview.curriculum ?? []).map((subject: PreviewSubject) => {
            const color = subjectColor(subject.name);
            const totalTopics = subject.chapters.reduce((a, c) => a + c.topics.length, 0);
            return (
              <LockedSubjectSection
                key={subject.id}
                subject={subject}
                color={color}
                totalTopics={totalTopics}
              />
            );
          })}
        </div>

        {/* Info sidebar */}
        <div className="lg:w-72 shrink-0 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Course Details</h3>
            <dl className="space-y-3 text-sm">
              {preview.teacher && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Teacher</dt>
                    <dd className="font-semibold text-slate-700">{preview.teacher.fullName}</dd>
                  </div>
                </div>
              )}
              {preview.startDate && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Starts</dt>
                    <dd className="font-semibold text-slate-700">
                      {new Date(preview.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Star className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Exam Target</dt>
                  <dd className="font-semibold text-slate-700 uppercase">{preview.examTarget}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Students Enrolled</dt>
                  <dd className="font-semibold text-slate-700">{(preview.studentCount ?? 0).toLocaleString()}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Subject progress preview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Subjects</p>
            <div className="space-y-3">
              {(preview.curriculum ?? []).map((s: PreviewSubject) => {
                const c = subjectColor(s.name);
                const total = s.chapters.reduce((a, ch) => a + ch.topics.length, 0);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: s.colorCode ?? c.bg }}>
                      <GraduationCap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 truncate">{s.name}</span>
                        <span className="text-slate-400 shrink-0 ml-2">{total} topics</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full mt-1">
                        <div className="h-full w-0 rounded-full" style={{ background: s.colorCode ?? c.bg }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Locked Subject / Chapter components for preview ─────────────────────────

function LockedSubjectSection({
  subject, color, totalTopics,
}: {
  subject: PreviewSubject;
  color: { bg: string; text: string; light: string; ring: string };
  totalTopics: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: subject.colorCode ?? color.bg }}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900" style={{ color: subject.colorCode ?? color.bg }}>
            {subject.name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-slate-400 font-medium">{totalTopics} topics</span>
            <span className="text-[11px] text-slate-400 font-medium">· {subject.chapters.length} chapters</span>
            {subject.teacher && <span className="text-[11px] text-slate-400">· {subject.teacher.name}</span>}
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} className="shrink-0">
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pl-3 space-y-2">
              {subject.chapters.map((chapter, ci) => (
                <LockedChapterAccordion key={chapter.id} chapter={chapter} defaultOpen={ci === 0} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LockedChapterAccordion({
  chapter, defaultOpen,
}: {
  chapter: PreviewSubject["chapters"][number];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  // Aggregate resource counts across all topics in this chapter
  const chapterResourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of chapter.topics) {
      for (const [type, cnt] of Object.entries(t.resourceCounts ?? {})) {
        counts[type] = (counts[type] ?? 0) + cnt;
      }
    }
    return counts;
  }, [chapter.topics]);

  const chapterHasCounts = Object.keys(chapterResourceCounts).length > 0;

  // Fallback icons to always show when no counts available
  const FALLBACK_TYPES = ["pdf", "dpp", "notes", "quiz"] as const;

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden border transition-all",
      open ? "border-slate-200 shadow-sm" : "border-slate-100"
    )}>
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          open ? "bg-slate-900" : "bg-slate-100"
        )}>
          <BookOpen className={cn("w-5 h-5", open ? "text-white" : "text-slate-400")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm line-clamp-1">{chapter.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">{chapter.topics.length} topics</span>
            {(chapter.jeeWeightage ?? 0) > 0 && (
              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                JEE {chapter.jeeWeightage}%
              </span>
            )}
            {/* Aggregate resource badges — with counts if available, icon-only otherwise */}
            {chapterHasCounts
              ? Object.entries(chapterResourceCounts).map(([type, count]) => {
                  const meta = RESOURCE_META[type];
                  if (!meta) return null;
                  return (
                    <span key={type} className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border opacity-70", meta.bg, meta.color)}>
                      <Lock className="w-2.5 h-2.5" /> {count} {meta.label}
                    </span>
                  );
                })
              : FALLBACK_TYPES.map(type => {
                  const meta = RESOURCE_META[type];
                  return (
                    <span key={type} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-400">
                      <Lock className="w-2.5 h-2.5" /> {meta.label}
                    </span>
                  );
                })
            }
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} className="shrink-0">
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50/50 border-t border-slate-100 p-3 space-y-2">
              {chapter.topics.map(topic => {
                const topicCounts = topic.resourceCounts ?? {};
                const hasTopicCounts = Object.keys(topicCounts).length > 0;
                return (
                  <div
                    key={topic.id}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-xl border border-slate-100 bg-white"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-100">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-700 truncate">{topic.name}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {topic.estimatedStudyMinutes > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3" /> {topic.estimatedStudyMinutes}m
                          </span>
                        )}
                        {(topic.lectureCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Video className="w-3 h-3" /> {topic.lectureCount} lectures
                          </span>
                        )}
                        {/* With counts: coloured badges. Without: icon-only fallback badges */}
                        {hasTopicCounts
                          ? Object.entries(topicCounts).map(([type, count]) => {
                              const meta = RESOURCE_META[type];
                              if (!meta) return null;
                              return (
                                <span key={type} className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border opacity-70", meta.bg, meta.color)}>
                                  <Lock className="w-2.5 h-2.5" /> {count} {meta.label}
                                </span>
                              );
                            })
                          : FALLBACK_TYPES.map(type => {
                              const meta = RESOURCE_META[type];
                              return (
                                <span key={type} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-400">
                                  <Lock className="w-2.5 h-2.5" /> {meta.label}
                                </span>
                              );
                            })
                        }
                      </div>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Lecture Card ─────────────────────────────────────────────────────────────

function LectureCard({ lecture, onClick }: { lecture: StudentLecture; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const progress = lecture.studentProgress?.watchPercentage ?? 0;
  const isCompleted = lecture.studentProgress?.isCompleted ?? false;
  const isLive = lecture.type === "live";
  const thumb = resolveUrl(lecture.thumbnailUrl);
  const mins = lecture.videoDurationSeconds ? Math.ceil(lecture.videoDurationSeconds / 60) : null;
  const yt = isYoutubeLectureUrl(lecture.videoUrl);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group overflow-hidden flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden shrink-0">
        {thumb && !imgErr ? (
          <img src={thumb} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center">
            <Video className="w-8 h-8 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Badges */}
        {isCompleted && (
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg">
            <CheckCircle2 className="w-3 h-3" /> Watched
          </span>
        )}
        {(isLive || yt) && (
          <span className={cn(
            "absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-white text-[10px] font-bold rounded-lg",
            isLive ? "bg-red-500 animate-pulse" : "bg-red-600"
          )}>
            {isLive ? "● Live" : <span className="flex items-center gap-1"><Youtube className="w-3 h-3" /> YouTube</span>}
          </span>
        )}
        {mins && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-lg">
            {mins}m
          </span>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
          </div>
        </div>

        {/* In-progress bar */}
        {progress > 0 && !isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div className="h-full bg-indigo-400" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-semibold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors mb-1 leading-snug">
          {lecture.title}
        </h4>
        {lecture.topic && (
          <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mb-1">{lecture.topic.name}</p>
        )}
        {lecture.description && (
          <p className="text-[11px] text-slate-500 line-clamp-3 mb-2 leading-relaxed">{lecture.description}</p>
        )}
        {isLive && lecture.liveMeetingUrl && (
          <p className="text-[10px] text-violet-600 font-semibold mb-1">Tap card to open — live link on watch page</p>
        )}
        {progress > 0 && (
          <div className="mt-auto pt-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
              <span>{isCompleted ? "Completed" : "In Progress"}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", isCompleted ? "bg-emerald-500" : "bg-indigo-500")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lectures Tab ─────────────────────────────────────────────────────────────

type LectureFilter = "all" | "completed" | "in_progress" | "not_started";

function LecturesTabContent({
  lectures, batchId, isLoading, courseSubjects,
}: {
  lectures: StudentLecture[];
  batchId: string;
  isLoading: boolean;
  /** Full course subject list — drives the subject dropdown (not only subjects that already have lectures). */
  courseSubjects: { id: string; name: string }[];
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<LectureFilter>("all");
  const [subjectKey, setSubjectKey] = useState<string>("all");

  const subjectOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { key: string; label: string }[] = [];
    const fromCourse = courseSubjects.filter(s => (s.name ?? "").trim());
    if (fromCourse.length) {
      for (const s of fromCourse) {
        const name = (s.name ?? "").trim();
        const k = name.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        opts.push({ key: name, label: name });
      }
    } else {
      for (const l of lectures) {
        const name = l.topic?.chapter?.subject?.name?.trim();
        if (!name) continue;
        const k = name.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        opts.push({ key: name, label: name });
      }
    }
    opts.sort((a, b) => a.label.localeCompare(b.label));
    return opts;
  }, [courseSubjects, lectures]);

  const bySubject = useMemo(() => {
    if (subjectKey === "all") return lectures;
    const sk = subjectKey.toLowerCase();
    return lectures.filter(l => {
      const n = (l.topic?.chapter?.subject?.name ?? "").toLowerCase();
      return n === sk;
    });
  }, [lectures, subjectKey]);

  const filtered = bySubject.filter(l => {
    const wp = l.studentProgress?.watchPercentage ?? 0;
    const done = l.studentProgress?.isCompleted ?? false;
    if (filter === "completed")   return done;
    if (filter === "in_progress") return !done && wp > 0;
    if (filter === "not_started") return wp === 0;
    return true;
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  if (lectures.length === 0) return (
    <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Video className="w-7 h-7 text-slate-300" />
      </div>
      <p className="font-semibold text-slate-500">No lectures available yet</p>
      <p className="text-sm text-slate-400 mt-1">Lectures will appear here once your teacher adds them.</p>
    </div>
  );

  const filterOpts: { id: LectureFilter; label: string; count: number }[] = [
    { id: "all",         label: "All",         count: bySubject.length },
    { id: "in_progress", label: "In Progress", count: bySubject.filter(l => !l.studentProgress?.isCompleted && (l.studentProgress?.watchPercentage ?? 0) > 0).length },
    { id: "completed",   label: "Completed",   count: bySubject.filter(l => l.studentProgress?.isCompleted).length },
    { id: "not_started", label: "Not Started", count: bySubject.filter(l => (l.studentProgress?.watchPercentage ?? 0) === 0).length },
  ];

  const subjectSelectId = `lectures-subject-${batchId}`;

  return (
    <div className="space-y-5">
      {/* Filter pills — first control is subject scope (all subjects in course), then status */}
      <div className="flex items-center gap-2 flex-wrap">
        {subjectOptions.length > 0 && (
          <div className="relative shrink-0">
            <label htmlFor={subjectSelectId} className="sr-only">Subject</label>
            <select
              id={subjectSelectId}
              value={subjectKey}
              onChange={e => { setSubjectKey(e.target.value); setFilter("all"); }}
              className={cn(
                "appearance-none cursor-pointer pl-4 pr-9 py-2 rounded-xl text-xs font-bold border transition-all max-w-[220px] sm:max-w-xs truncate",
                subjectKey === "all"
                  ? "bg-indigo-600 text-white border-transparent shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
              )}
              style={{ backgroundImage: subjectKey === "all"
                ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"
                : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat", backgroundPosition: "right 0.65rem center" }}
            >
              <option value="all">All subjects ({lectures.length})</option>
              {subjectOptions.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label} ({lectures.filter(l => (l.topic?.chapter?.subject?.name ?? "").toLowerCase() === key.toLowerCase()).length})
                </option>
              ))}
            </select>
          </div>
        )}
        {filterOpts.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
              filter === f.id
                ? "bg-indigo-600 text-white border-transparent shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
            )}
          >
            {f.label}
            {f.count > 0 && (
              <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                filter === f.id ? "bg-white/20" : "bg-slate-100"
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-400 font-medium">No lectures in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(lecture => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              onClick={() => navigate(`/student/lectures/${lecture.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mock Test Tab ────────────────────────────────────────────────────────────

function MockTestTabContent({
  mockTests,
  mockTestsLoading,
  getScopePath,
  SCOPE_BADGE,
  TYPE_BADGE,
  grouped,
  hasFilters,
  navigate,
  sessionsByTestId,
}: {
  mockTests: MockTestListItem[];
  mockTestsLoading: boolean;
  getScopePath: (mt: MockTestListItem) => string;
  SCOPE_BADGE: Record<string, { label: string; cls: string }>;
  TYPE_BADGE: Record<string, string>;
  grouped: Record<string, MockTestListItem[]>;
  hasFilters: boolean;
  navigate: (path: string) => void;
  sessionsByTestId: Map<string, TestSession[]>;
}) {
  const [activeScope, setActiveScope] = useState<"all" | "subject" | "chapter" | "topic">("all");

  if (mockTestsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (mockTests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <FlaskConical className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-semibold text-slate-500">No mock tests available yet</p>
        <p className="text-xs mt-1">Tests will appear here once your teacher publishes them.</p>
      </div>
    );
  }

  const FILTER_TABS = [
    { key: "all",     label: "All Tests" },
    { key: "subject", label: "Subject" },
    { key: "chapter", label: "Chapter" },
    { key: "topic",   label: "Topic" },
  ] as const;

  const visibleTests = grouped[activeScope] ?? mockTests;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
        <FlaskConical className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-xs font-semibold text-indigo-700">
          {mockTests.length} test{mockTests.length !== 1 ? "s" : ""} available
        </span>
        <span className="text-xs text-indigo-400 ml-auto">
          {mockTests.filter(mt => mt.questionIds?.length).reduce((s, mt) => s + (mt.questionIds?.length ?? 0), 0)} total questions
        </span>
      </div>

      {/* Scope filter tabs (only shown when there are scoped tests) */}
      {hasFilters && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveScope(tab.key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeScope === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {tab.label}
              {tab.key !== "all" && grouped[tab.key]?.length > 0 && (
                <span className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  activeScope === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                )}>
                  {grouped[tab.key].length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Test list */}
      {visibleTests.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-8">No {activeScope} tests yet.</p>
      ) : (
        <div className="space-y-3">
          {visibleTests.map((mt, i) => {
            const scopePath = getScopePath(mt);
            const scopeKey = mt.scope ?? (mt.type?.includes("subject") ? "subject" : mt.type?.includes("chapter") ? "chapter" : mt.type?.includes("topic") ? "topic" : "batch");
            const badge = SCOPE_BADGE[scopeKey] ?? SCOPE_BADGE.batch;
            const typeCls = TYPE_BADGE[mt.type] ?? "bg-slate-50 text-slate-500";
            const questionCount = mt.questionIds?.length ?? 0;

            const testSessions = sessionsByTestId.get(mt.id) ?? [];
            const completed = testSessions.filter(isSessionCompleted);
            const bestSession = completed.length > 0
              ? completed.reduce((best, s) => (s.totalScore ?? 0) > (best.totalScore ?? 0) ? s : best)
              : null;
            const bestPct = bestSession && mt.totalMarks
              ? Math.round(((bestSession.totalScore ?? 0) / mt.totalMarks) * 100)
              : null;

            return (
              <div
                key={mt.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group overflow-hidden"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-4 p-5">
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors mt-0.5",
                    bestSession ? "bg-emerald-50 group-hover:bg-emerald-100" : "bg-indigo-50 group-hover:bg-indigo-100",
                  )}>
                    <FlaskConical className={cn("w-5 h-5", bestSession ? "text-emerald-600" : "text-indigo-600")} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900 text-sm leading-snug">{mt.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {bestPct !== null && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            bestPct >= 70 ? "bg-emerald-100 text-emerald-700" : bestPct >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600",
                          )}>
                            Best: {bestPct}%
                          </span>
                        )}
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", badge.cls)}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Scope breadcrumb */}
                    {scopePath && (
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{scopePath}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" /> {mt.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Star className="w-3 h-3" /> {mt.totalMarks} marks
                      </span>
                      {questionCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <ClipboardList className="w-3 h-3" /> {questionCount} Qs
                        </span>
                      )}
                      {mt.passingMarks && (
                        <span className="text-[11px] text-emerald-600 font-medium">Pass: {mt.passingMarks}</span>
                      )}
                      {mt.type && (
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide", typeCls)}>
                          {mt.type.replace(/_/g, " ")}
                        </span>
                      )}
                      {completed.length > 0 && (
                        <span className="text-[11px] text-slate-400">{completed.length} attempt{completed.length > 1 ? "s" : ""}</span>
                      )}
                    </div>

                    {/* Score bar for attempted tests */}
                    {bestPct !== null && (
                      <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", bestPct >= 70 ? "bg-emerald-500" : bestPct >= 40 ? "bg-amber-400" : "bg-red-400")}
                          style={{ width: `${Math.min(bestPct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action footer */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100">
                  {mt.scheduledAt ? (
                    <p className="text-[11px] text-slate-400">
                      Scheduled: {new Date(mt.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  ) : bestSession ? (
                    <p className="text-[11px] text-slate-500">
                      Score: <span className="font-semibold text-slate-700">{(bestSession.totalScore ?? 0).toFixed(0)}/{mt.totalMarks}</span>
                      {" · "}✓{bestSession.correctCount ?? 0} ✗{bestSession.wrongCount ?? 0}
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-600 font-semibold">● Available now</p>
                  )}
                  <button
                    onClick={() => navigate(`/student/mock-tests/${mt.id}`)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm",
                      bestSession
                        ? "bg-slate-700 text-white hover:bg-slate-900"
                        : "bg-indigo-600 text-white hover:bg-indigo-700",
                    )}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {bestSession ? "Retake / Review" : "Start Test"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type EnrolledTab = "curriculum" | "lectures" | "dpp" | "pyq" | "material" | "mock_test";

export default function StudentCourseDetailPage() {
  const { batchId = "" } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── All hooks unconditionally at the top (Rules of Hooks) ────────────────

  const { data: myCourses = [], isLoading: myCoursesLoading } = useMyCourses();
  const isKnownEnrolled = myCourses.some(c => c.id === batchId);

  const { data, isLoading, isError, refetch } = useCourseCurriculum(batchId);

  const retryCount = useRef(0);
  useEffect(() => {
    if (isError && isKnownEnrolled && retryCount.current < 2) {
      retryCount.current += 1;
      const t = setTimeout(() => refetch(), 800 * retryCount.current);
      return () => clearTimeout(t);
    }
  }, [isError, isKnownEnrolled, refetch]);

  const enablePreview = isError && !isKnownEnrolled && !myCoursesLoading;
  const { data: preview, isLoading: previewLoading } = useBatchPreview(enablePreview ? batchId : "");

  const VALID_TABS: EnrolledTab[] = ["curriculum", "lectures", "dpp", "pyq", "material", "mock_test"];
  const tabParam = searchParams.get("tab") as EnrolledTab | null;
  const [activeTab, setActiveTab] = useState<EnrolledTab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "curriculum"
  );
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: lectures = [], isLoading: lecturesLoading } = useAllBatchLectures(batchId);
  const { data: mockTestsRaw, isLoading: mockTestsLoading } = useMockTests({ batchId });
  const mockTests: MockTestListItem[] = Array.isArray(mockTestsRaw) ? mockTestsRaw : (mockTestsRaw as any)?.items ?? [];
  const { data: allSessions = [] } = useStudentSessions();
  const sessionsByTestId = useMemo(() => {
    const map = new Map<string, TestSession[]>();
    for (const s of allSessions) {
      const arr = map.get(s.mockTestId) ?? [];
      arr.push(s);
      map.set(s.mockTestId, arr);
    }
    return map;
  }, [allSessions]);

  // Derive subjects safely — empty array when data not yet loaded
  const subjects = data?.subjects ?? [];

  useEffect(() => {
    setActiveChapterId(null);
  }, [batchId]);

  // All useMemo hooks before any early return
  const dppList = useMemo(() => collectResources(subjects, ["dpp"]), [subjects]);
  const pyqList = useMemo(() => collectResources(subjects, ["pyq"]), [subjects]);
  const materialList = useMemo(
    () => collectResources(subjects, ["pdf", "notes", "video", "link"]),
    [subjects],
  );
  const allTopicsFlat = useMemo(
    () => subjects.flatMap(s => s.chapters.flatMap(c =>
      c.topics.map(t => ({ ...t, subjectName: s.name, chapterName: c.name }))
    )),
    [subjects],
  );
  const displaySubjects = useMemo(() => {
    let subj = activeSubjectId ? subjects.filter(s => s.id === activeSubjectId) : subjects;
    if (activeChapterId) {
      subj = subj
        .map(s => ({
          ...s,
          chapters: s.chapters.filter(c => c.id === activeChapterId),
        }))
        .filter(s => s.chapters.length > 0);
    }
    return subj;
  }, [subjects, activeSubjectId, activeChapterId]);

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return displaySubjects;
    const q = search.toLowerCase();
    return displaySubjects.map(s => ({
      ...s,
      chapters: s.chapters.map(c => ({
        ...c, topics: c.topics.filter(t => t.name.toLowerCase().includes(q)),
      })).filter(c => c.topics.length > 0),
    })).filter(s => s.chapters.length > 0);
  }, [displaySubjects, search]);

  const lecturesByTopicId = useMemo(() => {
    const m = new Map<string, StudentLecture[]>();
    for (const l of lectures) {
      if (!l.topicId) continue;
      const arr = m.get(l.topicId) ?? [];
      arr.push(l);
      m.set(l.topicId, arr);
    }
    return m;
  }, [lectures]);

  const lecturesWithoutTopic = useMemo(() => lectures.filter(l => !l.topicId), [lectures]);

  const handleSelectChapter = useCallback((subjectId: string, chapterId: string) => {
    setActiveSubjectId(subjectId);
    setActiveChapterId(prev => (prev === chapterId ? null : chapterId));
    setActiveTab("curriculum");
    requestAnimationFrame(() => {
      document.getElementById(`chapter-block-${chapterId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // ── Guards & derivations (all hooks already called above) ────────────────

  const stillLoading = isLoading || previewLoading || (myCoursesLoading && !isKnownEnrolled);
  if (stillLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (enablePreview && preview) return <BatchPreviewPage batchId={batchId} preview={preview} />;
  if (enablePreview) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-slate-500 font-medium">Course data unavailable. Please try again.</p>
      <button onClick={() => refetch()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
        Retry
      </button>
    </div>
  );

  const { batch, enrollment, summary } = data;
  const progress = data.progress;
  const thumbnail = resolveUrl(batch.thumbnailUrl);
  const nextTopic = allTopicsFlat.find(t => t.status !== "completed" && t.status !== "locked") ?? null;
  const resourcesLocked = false;

  const TABS: { id: EnrolledTab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: "curriculum", label: "Curriculum",    icon: <Layers className="w-4 h-4" /> },
    { id: "lectures",   label: "Lectures",      count: lectures.length || undefined,       icon: <Video className="w-4 h-4" /> },
    { id: "dpp",        label: "DPP",           count: dppList.length || undefined,        icon: <ClipboardList className="w-4 h-4" /> },
    { id: "pyq",        label: "PYQ",           count: pyqList.length || undefined,        icon: <Trophy className="w-4 h-4" /> },
    { id: "material",   label: "Notes",         count: materialList.length || undefined,   icon: <BookOpen className="w-4 h-4" /> },
    { id: "mock_test", label: "Mock Tests", count: mockTests.length || undefined, icon: <FlaskConical className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate("/student/courses")}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-900 truncate leading-tight">{batch.name}</h1>
            {batch.teacher && (
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5" /> {batch.teacher.fullName}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            if (nextTopic) navigate(`/student/courses/${batchId}/topics/${nextTopic.id}`);
            else navigate("/student/lectures");
          }}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-md"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {progress.overallPct > 0 ? "Continue" : "Start"}
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex gap-6 items-start">

        {/* ── RIGHT SUBJECT SIDEBAR (sticky) ── */}
        <div className="hidden lg:flex flex-col w-56 shrink-0 sticky top-6 self-start max-h-[calc(100vh-8rem)] overflow-y-auto order-last">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Navigate</p>
            </div>
            <div className="p-2 space-y-1">
              {/* All subjects */}
              <button
                type="button"
                onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); setActiveTab("curriculum"); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                  !activeSubjectId && !activeChapterId && activeTab === "curriculum"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span className="truncate">All Subjects</span>
              </button>

              {/* Per-subject + chapters */}
              {subjects.map(s => {
                const done  = s.chapters.reduce((a, c) => a + c.topics.filter(t => t.status === "completed").length, 0);
                const total = s.chapters.reduce((a, c) => a + c.topics.length, 0);
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                const color = subjectColor(s.name);
                const isActive = activeSubjectId === s.id && activeTab === "curriculum";
                return (
                  <div key={s.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = s.id === activeSubjectId ? null : s.id;
                        setActiveSubjectId(next);
                        setActiveChapterId(null);
                        setActiveTab("curriculum");
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl transition-all border",
                        isActive && !activeChapterId ? "bg-indigo-50 border-indigo-200" : "border-transparent hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.colorCode ?? color.bg }} />
                        <span className={cn("text-xs font-semibold line-clamp-1", isActive ? "text-indigo-700" : "text-slate-700")}>{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.colorCode ?? color.bg }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">{pct}%</span>
                      </div>
                    </button>
                    {activeSubjectId === s.id && (
                      <div className="ml-2 pl-2 border-l border-slate-100 space-y-0.5 pb-1">
                        {s.chapters.map(ch => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleSelectChapter(s.id, ch.id)}
                            className={cn(
                              "w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors",
                              activeChapterId === ch.id ? "bg-indigo-100 text-indigo-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            )}
                          >
                            {ch.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Divider + resource shortcuts */}
              <div className="pt-2 mt-1 border-t border-slate-100 space-y-1">
                {[
                  { id: "lectures"  as EnrolledTab, label: "Lectures",    count: lectures.length,    icon: <Video className="w-3.5 h-3.5" />,        color: "text-blue-600"   },
                  { id: "dpp"       as EnrolledTab, label: "DPP",         count: dppList.length,     icon: <ClipboardList className="w-3.5 h-3.5" />, color: "text-orange-600" },
                  { id: "pyq"       as EnrolledTab, label: "PYQ",         count: pyqList.length,     icon: <Trophy className="w-3.5 h-3.5" />,        color: "text-violet-600" },
                  { id: "material"  as EnrolledTab, label: "Notes",       count: materialList.length, icon: <BookOpen className="w-3.5 h-3.5" />,     color: "text-teal-600"   },
                  { id: "mock_test" as EnrolledTab, label: "Mock Tests",  count: mockTests.length,   icon: <FlaskConical className="w-3.5 h-3.5" />,  color: "text-rose-600"   },
                ].filter(r => r.count > 0 || r.id === "lectures" || r.id === "mock_test").map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); setActiveTab(r.id); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                      activeTab === r.id ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <span className={cn("flex items-center gap-1.5", r.color)}>{r.icon}{r.label}</span>
                    {r.count > 0 && <span className="text-slate-400 font-bold">{r.count}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 space-y-5 order-first">

          {/* Continue Learning card */}
          {nextTopic && activeTab === "curriculum" && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 flex items-center justify-between gap-4 text-white shadow-lg">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">
                  {progress.overallPct > 0 ? "Continue Learning" : "Start Here"}
                </p>
                <p className="font-bold text-base line-clamp-1">{nextTopic.name}</p>
                <p className="text-xs text-indigo-200 mt-0.5 line-clamp-1">{nextTopic.chapterName} · {nextTopic.subjectName}</p>
              </div>
              <button
                onClick={() => navigate(`/student/courses/${batchId}/topics/${nextTopic.id}`)}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-md text-sm whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {progress.overallPct > 0 ? "Continue" : "Start"}
              </button>
            </div>
          )}

          {/* Tab Bar */}
          <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "curriculum") {
                    setActiveSubjectId(null);
                    setActiveChapterId(null);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                  activeTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-full",
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── CURRICULUM TAB ── */}
          {activeTab === "curriculum" && (
            <div className="space-y-4">
              {/* Mobile: subject pills */}
              <div className="flex lg:hidden flex-col gap-1.5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => { setActiveSubjectId(null); setActiveChapterId(null); }}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-all shrink-0",
                      !activeSubjectId ? "bg-indigo-600 text-white border-transparent" : "bg-white text-slate-600 border-slate-200"
                    )}
                  >
                    All
                  </button>
                  {subjects.map(s => {
                    const c = subjectColor(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setActiveSubjectId(s.id === activeSubjectId ? null : s.id);
                          setActiveChapterId(null);
                        }}
                        className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-all shrink-0",
                          activeSubjectId === s.id ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200"
                        )}
                        style={activeSubjectId === s.id ? { background: s.colorCode ?? c.bg, borderColor: "transparent" } : {}}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {/* Chapter pills — shown when a subject is active */}
                {activeSubjectId && (() => {
                  const activeSub = subjects.find(s => s.id === activeSubjectId);
                  if (!activeSub || activeSub.chapters.length === 0) return null;
                  return (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pl-1">
                      <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                      <button
                        type="button"
                        onClick={() => setActiveChapterId(null)}
                        className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-all shrink-0",
                          !activeChapterId ? "bg-slate-800 text-white border-transparent" : "bg-white text-slate-500 border-slate-200"
                        )}
                      >
                        All chapters
                      </button>
                      {activeSub.chapters.map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleSelectChapter(activeSubjectId, ch.id)}
                          className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-all shrink-0",
                            activeChapterId === ch.id ? "bg-slate-800 text-white border-transparent" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {ch.name}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search topics, chapters…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-sm"
                />
              </div>

              {lecturesWithoutTopic.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                    <Video className="w-4 h-4 shrink-0" />
                    Course lectures (not tied to a topic)
                  </p>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    These sessions belong to this course but are not linked to a curriculum topic. You can still watch them here.
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {lecturesWithoutTopic.map(lec => (
                      <li key={lec.id}>
                        <Link
                          to={`/student/lectures/${lec.id}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-950 hover:underline"
                        >
                          <Play className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                          <span className="line-clamp-2">{lec.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {filteredSubjects.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-100">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-500">No topics match your search</p>
                </div>
              ) : (
                filteredSubjects.map((s, si) => (
                  <SubjectSection
                    key={s.id}
                    subject={s}
                    batchId={batchId}
                    isLocked={resourcesLocked}
                    defaultOpen={si === 0}
                    lecturesByTopicId={lecturesByTopicId}
                    onSelectChapter={handleSelectChapter}
                  />
                ))
              )}
            </div>
          )}

          {/* ── LECTURES TAB ── */}
          {activeTab === "lectures" && (
            <LecturesTabContent
              lectures={lectures}
              batchId={batchId}
              isLoading={lecturesLoading}
              courseSubjects={subjects.map(s => ({ id: s.id, name: s.name }))}
            />
          )}

          {/* ── DPP TAB ── */}
          {activeTab === "dpp" && <ResourceTab resources={dppList} isLocked={resourcesLocked} emptyLabel="No DPPs available yet" />}

          {/* ── PYQ TAB ── */}
          {activeTab === "pyq" && <ResourceTab resources={pyqList} isLocked={resourcesLocked} emptyLabel="No PYQs available yet" />}

          {/* ── MATERIAL TAB ── */}
          {activeTab === "material" && <ResourceTab resources={materialList} isLocked={resourcesLocked} emptyLabel="No study materials added yet" />}

          {/* ── MOCK TESTS TAB ── */}
          {activeTab === "mock_test" && (() => {
            // Build lookup maps from curriculum data already loaded
            const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
            const chapterMap = new Map(subjects.flatMap(s => s.chapters.map(c => [c.id, { name: c.name, subjectName: s.name }])));
            const topicMap = new Map(subjects.flatMap(s => s.chapters.flatMap(c => c.topics.map(t => ({ id: t.id, name: t.name, chapterName: c.name, subjectName: s.name })))).map(t => [t.id, t]));

            const SCOPE_BADGE: Record<string, { label: string; cls: string }> = {
              subject:  { label: "Subject Test",  cls: "bg-sky-50 text-sky-600 border-sky-200" },
              chapter:  { label: "Chapter Test",  cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
              topic:    { label: "Topic Test",    cls: "bg-violet-50 text-violet-600 border-violet-200" },
              batch:    { label: "Full Mock",     cls: "bg-rose-50 text-rose-600 border-rose-200" },
            };
            const TYPE_BADGE: Record<string, string> = {
              subject_test: "bg-sky-50 text-sky-600",
              chapter_test: "bg-emerald-50 text-emerald-600",
              topic_test: "bg-violet-50 text-violet-600",
              full_mock: "bg-rose-50 text-rose-600",
              diagnostic: "bg-orange-50 text-orange-600",
              speed_test: "bg-amber-50 text-amber-600",
              revision: "bg-teal-50 text-teal-600",
              pyq: "bg-yellow-50 text-yellow-700",
            };

            const getScopePath = (mt: MockTestListItem): string => {
              if (mt.topicId) {
                const t = topicMap.get(mt.topicId);
                if (t) return `${t.subjectName} › ${t.chapterName} › ${t.name}`;
              }
              if (mt.chapterId) {
                const c = chapterMap.get(mt.chapterId);
                if (c) return `${c.subjectName} › ${c.name}`;
              }
              if (mt.subjectId) {
                const name = subjectMap.get(mt.subjectId);
                if (name) return name;
              }
              return "";
            };

            const scopeFilter = ["all", "subject", "chapter", "topic"] as const;
            type ScopeFilter = typeof scopeFilter[number];

            // Group tests by scope for filter tabs
            const grouped = {
              all: mockTests,
              subject: mockTests.filter(mt => mt.scope === "subject" || mt.type?.includes("subject")),
              chapter: mockTests.filter(mt => mt.scope === "chapter" || mt.type?.includes("chapter")),
              topic:   mockTests.filter(mt => mt.scope === "topic"   || mt.type?.includes("topic")),
            };
            const hasFilters = mockTests.some(mt => mt.scope && mt.scope !== "batch");

            return (
              <MockTestTabContent
                mockTests={mockTests}
                mockTestsLoading={mockTestsLoading}
                getScopePath={getScopePath}
                SCOPE_BADGE={SCOPE_BADGE}
                TYPE_BADGE={TYPE_BADGE}
                grouped={grouped}
                hasFilters={hasFilters}
                navigate={navigate}
                sessionsByTestId={sessionsByTestId}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}
