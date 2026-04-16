import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, BookOpen, Video, CheckCircle2, Lock,
  Clock, ArrowLeft, Download, ExternalLink, Play, FileText,
  Users, BarChart3, Trophy, Loader2, Search, Filter,
  GraduationCap, Layers, Zap, Star, Circle, AlertCircle,
  Youtube, File, ClipboardList, FlaskConical,
} from "lucide-react";
import { useCourseCurriculum, useBatchPreview, useEnrollInBatch } from "@/hooks/use-student";
import type { CourseSubject, CourseChapter, CourseTopic, CourseResource, BatchPreview, PreviewSubject } from "@/lib/api/student";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();

function resolveUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
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
  topic, batchId, isLocked,
}: { topic: CourseTopic; batchId: string; isLocked: boolean }) {
  const navigate = useNavigate();
  const isComplete = topic.status === "completed";
  const isInProgress = topic.status === "in_progress";
  const locked = isLocked || topic.status === "locked";

  const resourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of topic.resources) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
    return counts;
  }, [topic.resources]);

  const handleClick = () => {
    if (locked) { toast.error("Complete previous topics to unlock this one"); return; }
    navigate(`/student/courses/${batchId}/topics/${topic.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all group border",
        isComplete
          ? "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-50"
          : isInProgress
            ? "bg-blue-50/60 border-blue-100 hover:bg-blue-50"
            : locked
              ? "bg-slate-50 border-slate-100 opacity-70 cursor-not-allowed"
              : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm"
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
          {topic.lectures.total > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Video className="w-3 h-3" /> {topic.lectures.completed}/{topic.lectures.total} lectures
            </span>
          )}
          {/* Resource badges */}
          {Object.entries(resourceCounts).map(([type, count]) => {
            const meta = RESOURCE_META[type];
            if (!meta) return null;
            return (
              <span key={type} className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", meta.bg, meta.color)}>
                {meta.icon} {count} {meta.label}
              </span>
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
  );
}

// ─── Chapter Accordion ────────────────────────────────────────────────────────

function ChapterAccordion({
  chapter, batchId, isLocked, defaultOpen,
}: { chapter: CourseChapter; batchId: string; isLocked: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const completedCount = chapter.topics.filter(t => t.status === "completed").length;
  const allDone = completedCount === chapter.topics.length && chapter.topics.length > 0;
  const totalResources = chapter.topics.reduce((s, t) => s + t.resources.length, 0);
  const totalLectures = chapter.topics.reduce((s, t) => s + t.lectures.total, 0);

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
          allDone ? "bg-emerald-100" : open ? "bg-slate-900" : "bg-slate-100"
        )}>
          {allDone
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            : <BookOpen className={cn("w-5 h-5", open ? "text-white" : "text-slate-400")} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm line-clamp-1">{chapter.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
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

        {/* Progress mini bar */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${chapter.topics.length > 0 ? Math.round((completedCount / chapter.topics.length) * 100) : 0}%` }}
            />
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
              {chapter.topics.map(t => (
                <TopicRow key={t.id} topic={t} batchId={batchId} isLocked={isLocked} />
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
  subject, batchId, isLocked, defaultOpen,
}: { subject: CourseSubject; batchId: string; isLocked: boolean; defaultOpen?: boolean }) {
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
                  isLocked={isLocked}
                  defaultOpen={ci === 0}
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
      const { orderId, amount, currency, key } = orderData.data;

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
      <button
        onClick={() => navigate("/student/courses")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Discover Courses
      </button>

      {/* Hero */}
      <div className={cn(
        "relative rounded-3xl overflow-hidden mb-8 shadow-xl",
        thumbnail ? "" : `bg-gradient-to-br ${gradient}`
      )}>
        {thumbnail && <img src={thumbnail} alt={preview.name} className="absolute inset-0 w-full h-full object-cover" />}
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
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-slate-400 font-medium">{chapter.topics.length} topics</span>
            {(chapter.jeeWeightage ?? 0) > 0 && (
              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                JEE {chapter.jeeWeightage}%
              </span>
            )}
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
              {chapter.topics.map(topic => (
                <div
                  key={topic.id}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-xl border border-slate-100 bg-white opacity-70"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-100">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-700 truncate">{topic.name}</p>
                    {topic.estimatedStudyMinutes > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-0.5">
                        <Clock className="w-3 h-3" /> {topic.estimatedStudyMinutes}m
                      </span>
                    )}
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentCourseDetailPage() {
  const { batchId = "" } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCourseCurriculum(batchId);
  const { data: preview, isLoading: previewLoading } = useBatchPreview(isError ? batchId : "");
  const [activeTab, setActiveTab] = useState<Tab>("curriculum");
  const [search, setSearch] = useState("");

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading || (isError && previewLoading)) return (
    <div className="py-40 flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      <p className="text-sm text-slate-400 font-medium">Loading course...</p>
    </div>
  );

  // ── Not enrolled → show preview page ─────────────────────────────────────
  if (isError && preview) {
    return <BatchPreviewPage batchId={batchId} preview={preview} />;
  }

  if (isError || !data) return (
    <div className="py-40 flex flex-col items-center text-center max-w-sm mx-auto gap-6">
      <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Course not found</h3>
        <p className="text-slate-500 text-sm">This course doesn't exist or has been removed.</p>
      </div>
      <button
        onClick={() => navigate("/student/courses")}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </button>
    </div>
  );

  const { batch, enrollment, summary, subjects, progress } = data;

  // Paid + not paid yet → partial lock
  const isUnpaid = (batch.isPaid && !enrollment?.feePaid);
  // The curriculum itself is always returned (enrollment exists) but DPP/PYQ/material locked for unpaid
  const resourcesLocked = !!isUnpaid;
  const thumbnail = resolveUrl(batch.thumbnailUrl);

  // Collected resources per tab
  const dppList = useMemo(() => collectResources(subjects, ["dpp"]), [subjects]);
  const pyqList = useMemo(() => collectResources(subjects, ["pyq"]), [subjects]);
  const materialList = useMemo(() => collectResources(subjects, ["pdf", "notes", "video", "link"]), [subjects]);

  // Curriculum search filter
  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects.map(s => ({
      ...s,
      chapters: s.chapters.map(c => ({
        ...c,
        topics: c.topics.filter(t => t.name.toLowerCase().includes(q)),
      })).filter(c => c.topics.length > 0),
    })).filter(s => s.chapters.length > 0);
  }, [subjects, search]);

  const TABS: { id: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: "curriculum", label: "Curriculum", icon: <Layers className="w-4 h-4" /> },
    { id: "dpp",        label: "DPP",        count: dppList.length,      icon: <ClipboardList className="w-4 h-4" /> },
    { id: "pyq",        label: "PYQ",        count: pyqList.length,      icon: <Trophy className="w-4 h-4" /> },
    { id: "material",   label: "Study Material", count: materialList.length, icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-24">

      {/* ── Back ── */}
      <button
        onClick={() => navigate("/student/courses")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        My Courses
      </button>

      {/* ── Hero Banner ── */}
      <div className={cn(
        "relative rounded-3xl overflow-hidden mb-8 shadow-xl",
        thumbnail ? "" : "bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800"
      )}>
        {thumbnail && (
          <img src={thumbnail} alt={batch.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/30" />

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-xl text-xs font-bold text-white uppercase tracking-wide">
                  {batch.examTarget}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-xl text-xs font-bold text-white uppercase tracking-wide">
                  Class {batch.class}
                </span>
                {batch.isPaid && (
                  <span className="px-3 py-1 bg-amber-500/80 backdrop-blur-sm rounded-xl text-xs font-bold text-white">
                    {enrollment?.feePaid ? "✓ Enrolled" : `₹${batch.feeAmount?.toLocaleString() ?? "—"}`}
                  </span>
                )}
                {!batch.isPaid && (
                  <span className="px-3 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-xl text-xs font-bold text-white">FREE</span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{batch.name}</h1>

              {batch.teacher && (
                <p className="text-indigo-200 text-sm font-medium mb-6 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {batch.teacher.fullName}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 text-sm text-white/80 font-medium mb-6">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-300" />
                  {summary?.totalSubjects ?? subjects.length} Subjects
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-300" />
                  {summary?.totalTopics ?? progress.totalTopics} Topics
                </span>
                <span className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-300" />
                  {summary?.totalLectures ?? progress.totalLectures} Lectures
                </span>
                {dppList.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-orange-300" />
                    {dppList.length} DPPs
                  </span>
                )}
                {pyqList.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-violet-300" />
                    {pyqList.length} PYQs
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="max-w-md">
                <div className="flex justify-between text-xs font-semibold text-white/60 mb-1.5">
                  <span>Overall Progress</span>
                  <span className="text-white font-bold">{progress.overallPct}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.overallPct}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                  />
                </div>
                <p className="text-xs text-white/50 mt-1.5">
                  {progress.completedTopics} of {progress.totalTopics} topics completed
                </p>
              </div>
            </div>

            {/* Right: quick action card */}
            <div className="lg:w-64 shrink-0 flex flex-col gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 space-y-3">
                {[
                  { label: "Topics Done", val: `${progress.completedTopics}/${progress.totalTopics}`, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                  { label: "Lectures",    val: `${progress.completedLectures}/${progress.totalLectures}`, icon: <Video className="w-4 h-4 text-blue-400" /> },
                  { label: "Progress",    val: `${progress.overallPct}%`, icon: <BarChart3 className="w-4 h-4 text-purple-400" /> },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/60 text-sm">{s.icon}{s.label}</div>
                    <span className="text-white font-bold text-sm">{s.val}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const firstIncomplete = subjects.flatMap(s => s.chapters.flatMap(c => c.topics)).find(t => t.status !== "completed");
                  if (firstIncomplete) navigate(`/student/courses/${batchId}/topics/${firstIncomplete.id}`);
                  else navigate(`/student/lectures`);
                }}
                className="w-full py-3 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                {progress.overallPct > 0 ? "Continue Learning" : "Start Learning"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unpaid locked notice ── */}
      {isUnpaid && (
        <div className="mb-6">
          <LockedBanner courseName={batch.name} isPaid={batch.isPaid} feeAmount={batch.feeAmount} />
        </div>
      )}

      {/* ── Main layout: left content + right sticky sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── LEFT: Tabs + Content ── */}
        <div className="flex-1 min-w-0">

          {/* Tab Bar */}
          <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm mb-6 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-full",
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
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-sm"
                />
              </div>

              {filteredSubjects.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-100">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-500">No topics match your search</p>
                </div>
              ) : (
                filteredSubjects.map((s, si) => (
                  <SubjectSection key={s.id} subject={s} batchId={batchId} isLocked={resourcesLocked} defaultOpen={si === 0} />
                ))
              )}
            </div>
          )}

          {/* ── DPP TAB ── */}
          {activeTab === "dpp" && (
            <ResourceTab
              resources={dppList}
              isLocked={resourcesLocked}
              emptyLabel="No DPPs available yet"
            />
          )}

          {/* ── PYQ TAB ── */}
          {activeTab === "pyq" && (
            <ResourceTab
              resources={pyqList}
              isLocked={resourcesLocked}
              emptyLabel="No PYQs available yet"
            />
          )}

          {/* ── MATERIAL TAB ── */}
          {activeTab === "material" && (
            <ResourceTab
              resources={materialList}
              isLocked={resourcesLocked}
              emptyLabel="No study materials added yet"
            />
          )}
        </div>

        {/* ── RIGHT: Sticky Info Sidebar ── */}
        <div className="lg:w-72 shrink-0 space-y-5 lg:sticky lg:top-24 lg:self-start">

          {/* Course info card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Course Details</h3>
              <dl className="space-y-3 text-sm">
                {batch.teacher && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Teacher</dt>
                      <dd className="font-semibold text-slate-700">{batch.teacher.fullName}</dd>
                    </div>
                  </div>
                )}
                {batch.startDate && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Duration</dt>
                      <dd className="font-semibold text-slate-700">
                        {new Date(batch.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        {batch.endDate && ` → ${new Date(batch.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}
                      </dd>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Exam Target</dt>
                    <dd className="font-semibold text-slate-700 uppercase">{batch.examTarget}</dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Subjects quick view */}
            <div className="p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Subjects</p>
              <div className="space-y-2">
                {subjects.map(s => {
                  const c = subjectColor(s.name);
                  const total = s.chapters.reduce((a, ch) => a + ch.topics.length, 0);
                  const done = s.chapters.reduce((a, ch) => a + ch.topics.filter(t => t.status === "completed").length, 0);
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: s.colorCode ?? c.bg }}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 truncate">{s.name}</span>
                          <span className="text-slate-400 shrink-0 ml-2">{pct}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.colorCode ?? c.bg }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick resource counts */}
          {(dppList.length > 0 || pyqList.length > 0 || materialList.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Resources</p>
              <div className="space-y-2">
                {[
                  { label: "DPP Sheets",      count: dppList.length,      tab: "dpp" as Tab,      color: "text-orange-600", bg: "bg-orange-50", icon: <ClipboardList className="w-4 h-4" /> },
                  { label: "Previous Year Qs", count: pyqList.length,      tab: "pyq" as Tab,      color: "text-violet-600", bg: "bg-violet-50", icon: <Trophy className="w-4 h-4" /> },
                  { label: "Study Material",   count: materialList.length, tab: "material" as Tab, color: "text-blue-600",   bg: "bg-blue-50",   icon: <BookOpen className="w-4 h-4" /> },
                ].filter(r => r.count > 0).map(r => (
                  <button
                    key={r.tab}
                    onClick={() => setActiveTab(r.tab)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-sm",
                      activeTab === r.tab ? "border-indigo-200 bg-indigo-50" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className={cn("flex items-center gap-2 text-sm font-semibold", r.color)}>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", r.bg)}>{r.icon}</div>
                      {r.label}
                    </div>
                    <span className="text-xs font-bold text-slate-500">{r.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
