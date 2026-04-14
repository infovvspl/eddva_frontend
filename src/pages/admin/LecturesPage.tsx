import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Loader2, EyeOff, BarChart3, X, Play,
  Clock, Users, CheckCircle2, AlertTriangle, ChevronRight,
  Video, Flame, Radio, Upload, Plus, ChevronDown,
  GraduationCap, Hash, Link2, Calendar, Check,
  FolderOpen, Folder, ArrowRight, MonitorPlay,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useLectures, useUnpublishLecture, useLectureStats, useCreateLecture,
  useBatches, useSubjects, useChapters, useTopics,
} from "@/hooks/use-admin";
import type { Subject, Chapter, Topic } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(seconds?: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-500/10 text-emerald-600",
    draft: "bg-muted text-muted-foreground",
    processing: "bg-amber-500/10 text-amber-600",
    scheduled: "bg-blue-500/10 text-blue-600",
    live: "bg-rose-500/10 text-rose-600",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ─── Stats Drawer ────────────────────────────────────────────────────────────

function StatsDrawer({ lectureId, title, onClose }: { lectureId: string; title: string; onClose: () => void }) {
  const { data: stats, isLoading } = useLectureStats(lectureId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-300/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground text-sm truncate max-w-xs">{title}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !stats ? (
            <p className="text-center text-sm text-muted-foreground py-8">No stats available yet.</p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Views", value: stats.totalViews ?? stats.watchCount ?? 0, icon: Play, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "Completed", value: stats.completedCount ?? 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Avg Watch %", value: `${Math.round(stats.avgCompletionPct ?? stats.averageProgress ?? 0)}%`, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-secondary rounded-xl p-3 text-center">
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <p className="text-lg font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {(stats.uniqueViewers ?? stats.uniqueStudents) != null && (
                <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    Unique students who watched
                  </div>
                  <span className="font-bold text-foreground">{stats.uniqueViewers ?? stats.uniqueStudents}</span>
                </div>
              )}
              {stats.confusionHotspots?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> Confusion Hotspots
                  </p>
                  <div className="space-y-2">
                    {stats.confusionHotspots.slice(0, 5).map((h: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{fmtDuration(h.timestampSeconds)} — {h.label ?? "High rewind rate"}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (h.count / (stats.totalViews || 1)) * 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{h.count}×</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats.dropOffPct != null && (
                <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                  <span className="text-sm text-foreground">Students who dropped off before 50%</span>
                  <span className="font-bold text-rose-500">{Math.round(stats.dropOffPct)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Wizard Step Indicator ────────────────────────────────────────────────────

const STEPS = ["Course", "Subject & Topic", "Details"] as const;
type WizardStep = 0 | 1 | 2;

function StepBar({ current }: { current: WizardStep }) {
  return (
    <div className="flex items-center gap-0 px-6 py-4 border-b border-slate-100">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-0 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all",
                done ? "bg-blue-600 text-white" :
                active ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                "bg-slate-100 text-slate-400"
              )}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn("text-[10px] font-bold whitespace-nowrap", active ? "text-blue-600" : done ? "text-blue-400" : "text-slate-400")}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-2 mb-4 transition-colors", done ? "bg-blue-300" : "bg-slate-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Course Picker ────────────────────────────────────────────────────

function CoursePicker({ onSelect }: { onSelect: (batch: any) => void }) {
  const { data: batches = [], isLoading } = useBatches();
  const batchList = Array.isArray(batches) ? batches : [];
  const [search, setSearch] = useState("");

  const filtered = batchList.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4 pb-3">
        <p className="text-sm font-black text-slate-700 mb-1">Which course is this lecture for?</p>
        <p className="text-xs text-slate-400 mb-3">Select the course (batch) this lecture belongs to.</p>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search courses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">{search ? "No courses match" : "No courses yet"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(b => {
              const statusColor = b.status === "active" ? "#10B981" : b.status === "completed" ? "#3B82F6" : "#94A3B8";
              const statusBg = b.status === "active" ? "bg-emerald-50 text-emerald-700" : b.status === "completed" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500";
              return (
                <motion.button
                  key={b.id}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelect(b)}
                  className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md text-left transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-snug truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn("text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full", statusBg)}>{b.status}</span>
                      {b.examTarget && <span className="text-[10px] text-slate-400 font-semibold">{b.examTarget}</span>}
                      {b.class && <span className="text-[10px] text-slate-400">Cls {b.class}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                      {b.enrolledCount ?? 0} students
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 shrink-0 mt-1 transition-colors" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Topic Picker ─────────────────────────────────────────────────────

function ChapterTopics({
  chapterId, selectedTopicId, onSelect, accentColor,
}: {
  chapterId: string;
  selectedTopicId: string | null;
  onSelect: (t: Topic) => void;
  accentColor: string;
}) {
  const { data: topics = [], isLoading } = useTopics(chapterId);
  if (isLoading) return <div className="py-2 flex justify-center"><Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /></div>;
  if (topics.length === 0) return <p className="text-[11px] text-slate-400 px-3 py-2 italic">No topics in this chapter</p>;
  return (
    <div className="pl-4 border-l-2 ml-3 py-1 space-y-0.5" style={{ borderColor: `${accentColor}40` }}>
      {topics.map((t: Topic) => {
        const sel = selectedTopicId === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all",
              sel ? "text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
            style={sel ? { background: accentColor } : {}}
          >
            <Hash className={cn("w-3 h-3 shrink-0", sel ? "text-white/60" : "text-slate-300")} />
            <span className="flex-1 truncate">{t.name}</span>
            {sel && <Check className="w-3 h-3 shrink-0 text-white/80" />}
          </button>
        );
      })}
    </div>
  );
}

function ChapterRow({
  chapter, selectedTopicId, onSelect, accentColor,
}: {
  chapter: Chapter;
  selectedTopicId: string | null;
  onSelect: (t: Topic) => void;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
      >
        {open
          ? <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
          : <Folder className="w-4 h-4 text-amber-400 shrink-0" />}
        <span className="text-sm font-semibold text-slate-700 flex-1 truncate">{chapter.name}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ChapterTopics
              chapterId={chapter.id}
              selectedTopicId={selectedTopicId}
              onSelect={onSelect}
              accentColor={accentColor}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubjectPanel({
  subject, selectedTopicId, onSelect,
}: {
  subject: Subject;
  selectedTopicId: string | null;
  onSelect: (t: Topic, chapter: Chapter, subject: Subject) => void;
}) {
  const accentColor = subject.colorCode ?? "#3B82F6";
  const { data: chapters = [], isLoading } = useChapters(subject.id);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2">
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <p className="text-sm font-semibold">No chapters in this subject</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {chapters.map((ch: Chapter) => (
            <ChapterRow
              key={ch.id}
              chapter={ch}
              selectedTopicId={selectedTopicId}
              onSelect={(t) => onSelect(t, ch, subject)}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicPicker({
  batchId,
  examTarget,
  selectedTopic,
  onSelect,
}: {
  batchId: string;
  examTarget: string;
  selectedTopic: { topic: Topic; chapter: Chapter; subject: Subject } | null;
  onSelect: (topic: Topic, chapter: Chapter, subject: Subject) => void;
}) {
  const { data: subjects = [], isLoading } = useSubjects(batchId);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  const activeSubject = subjects.find((s: Subject) => s.id === activeSubjectId) ?? subjects[0] ?? null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4 pb-3 shrink-0">
        <p className="text-sm font-black text-slate-700 mb-0.5">Select the topic for this lecture</p>
        <p className="text-xs text-slate-400">Choose a subject → open a chapter → pick a topic.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
      ) : subjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-8 gap-3">
          <GraduationCap className="w-12 h-12 text-slate-200" />
          <p className="text-sm font-semibold text-slate-500">No subjects yet</p>
          <p className="text-xs text-slate-400">Add subjects from the Content page first.</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Subject list — left column */}
          <div className="w-44 shrink-0 border-r border-slate-100 overflow-y-auto py-2 px-2 space-y-1">
            {subjects.map((s: Subject) => {
              const accent = s.colorCode ?? "#3B82F6";
              const active = (activeSubjectId ?? subjects[0]?.id) === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSubjectId(s.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all",
                    active ? "shadow-sm text-white" : "text-slate-600 hover:bg-slate-50"
                  )}
                  style={active ? { background: accent } : {}}
                >
                  <GraduationCap className={cn("w-3.5 h-3.5 shrink-0", active ? "text-white/70" : "text-slate-400")} />
                  <span className="truncate flex-1">{s.name}</span>
                </button>
              );
            })}
          </div>

          {/* Chapter + Topic tree — right */}
          {activeSubject && (
            <SubjectPanel
              subject={activeSubject}
              selectedTopicId={selectedTopic?.topic.id ?? null}
              onSelect={onSelect}
            />
          )}
        </div>
      )}

      {/* Selected topic indicator */}
      {selectedTopic && (
        <div className="shrink-0 mx-6 mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5">
          <Check className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-black text-blue-700 truncate">{selectedTopic.topic.name}</p>
            <p className="text-[10px] text-blue-500 truncate">
              {selectedTopic.subject.name} · {selectedTopic.chapter.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Details Forms ─────────────────────────────────────────────────────

function LiveDetailsForm({
  value, onChange,
}: {
  value: { title: string; description: string; scheduledAt: string; liveMeetingUrl: string };
  onChange: (v: typeof value) => void;
}) {
  const set = (k: keyof typeof value) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div className="px-6 pt-5 pb-4 space-y-4">
      <div>
        <p className="text-sm font-black text-slate-700 mb-1">Schedule a Live Lecture</p>
        <p className="text-xs text-slate-400">Students will see this lecture in their schedule and can join via the meeting link.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">Lecture Title *</label>
          <input
            placeholder="e.g. Newton's Laws of Motion — Part 1"
            value={value.title}
            onChange={set("title")}
            className="w-full h-10 px-4 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">Description</label>
          <textarea
            placeholder="What will be covered in this lecture?"
            value={value.description}
            onChange={set("description")}
            rows={2}
            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date &amp; Time *
            </label>
            <input
              type="datetime-local"
              value={value.scheduledAt}
              onChange={set("scheduledAt")}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Meeting URL *
            </label>
            <input
              placeholder="https://meet.google.com/..."
              value={value.liveMeetingUrl}
              onChange={set("liveMeetingUrl")}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Live badge */}
      <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <Radio className="w-4 h-4 text-rose-600" />
        </div>
        <div>
          <p className="text-xs font-black text-rose-700">Live Lecture</p>
          <p className="text-[11px] text-rose-500 mt-0.5">Students will be notified and can join via the meeting link at the scheduled time.</p>
        </div>
      </div>
    </div>
  );
}

function RecordedDetailsForm({
  value, onChange,
}: {
  value: { title: string; description: string; videoUrl: string };
  onChange: (v: typeof value) => void;
}) {
  const set = (k: keyof typeof value) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div className="px-6 pt-5 pb-4 space-y-4">
      <div>
        <p className="text-sm font-black text-slate-700 mb-1">Upload a Recorded Lecture</p>
        <p className="text-xs text-slate-400">Paste a YouTube or video URL. Students can watch it at their own pace.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">Lecture Title *</label>
          <input
            placeholder="e.g. Electrostatics — Coulomb's Law"
            value={value.title}
            onChange={set("title")}
            className="w-full h-10 px-4 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">Description</label>
          <textarea
            placeholder="Brief overview of the lecture…"
            value={value.description}
            onChange={set("description")}
            rows={2}
            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block flex items-center gap-1">
            <Video className="w-3 h-3" /> Video URL *
          </label>
          <input
            placeholder="https://youtube.com/watch?v=... or direct video link"
            value={value.videoUrl}
            onChange={set("videoUrl")}
            className="w-full h-10 px-4 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
          />
          <p className="text-[10px] text-slate-400 mt-1">Supports YouTube, Vimeo, or any direct video URL.</p>
        </div>
      </div>

      {/* Recorded badge */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <MonitorPlay className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-black text-blue-700">Recorded Lecture</p>
          <p className="text-[11px] text-blue-500 mt-0.5">Students can watch anytime with AI-generated notes, quizzes, and progress tracking.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Lecture Modal ───────────────────────────────────────────────────

function ScheduleLectureModal({
  type, onClose,
}: {
  type: "live" | "recorded";
  onClose: () => void;
}) {
  const createLecture = useCreateLecture();

  const [step, setStep] = useState<WizardStep>(0);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<{ topic: Topic; chapter: Chapter; subject: Subject } | null>(null);

  const [liveForm, setLiveForm] = useState({ title: "", description: "", scheduledAt: "", liveMeetingUrl: "" });
  const [recForm, setRecForm] = useState({ title: "", description: "", videoUrl: "" });

  const isLive = type === "live";

  const canProceed = () => {
    if (step === 0) return !!selectedBatch;
    if (step === 1) return !!selectedEntry;
    if (step === 2) {
      if (isLive) return !!(liveForm.title.trim() && liveForm.scheduledAt && liveForm.liveMeetingUrl.trim());
      return !!(recForm.title.trim() && recForm.videoUrl.trim());
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!selectedBatch || !selectedEntry) return;
    try {
      if (isLive) {
        await createLecture.mutateAsync({
          batchId: selectedBatch.id,
          topicId: selectedEntry.topic.id,
          title: liveForm.title.trim(),
          description: liveForm.description.trim() || undefined,
          type: "live",
          scheduledAt: liveForm.scheduledAt,
          liveMeetingUrl: liveForm.liveMeetingUrl.trim(),
        });
        toast.success("Live lecture scheduled!");
      } else {
        await createLecture.mutateAsync({
          batchId: selectedBatch.id,
          topicId: selectedEntry.topic.id,
          title: recForm.title.trim(),
          description: recForm.description.trim() || undefined,
          type: "recorded",
          videoUrl: recForm.videoUrl.trim(),
        });
        toast.success("Recorded lecture saved!");
      }
      onClose();
    } catch {
      toast.error("Failed to save lecture. Please try again.");
    }
  };

  const handleSelectBatch = (b: any) => {
    setSelectedBatch(b);
    setSelectedEntry(null);
    setStep(1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0",
              isLive ? "bg-rose-100" : "bg-blue-100"
            )}>
              {isLive
                ? <Radio className="w-5 h-5 text-rose-600" />
                : <MonitorPlay className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isLive ? "Schedule Live Lecture" : "Upload Recorded Lecture"}
              </h2>
              {selectedBatch && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedBatch.name}
                  {selectedEntry && <> · <span className="text-blue-500">{selectedEntry.subject.name}</span> · {selectedEntry.chapter.name} · <strong>{selectedEntry.topic.name}</strong></>}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Bar */}
        <StepBar current={step} />

        {/* Step Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-hidden flex flex-col">
                <CoursePicker onSelect={handleSelectBatch} />
              </motion.div>
            )}
            {step === 1 && selectedBatch && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-hidden flex flex-col">
                <TopicPicker
                  batchId={selectedBatch.id}
                  examTarget={selectedBatch.examTarget}
                  selectedTopic={selectedEntry}
                  onSelect={(topic, chapter, subject) => setSelectedEntry({ topic, chapter, subject })}
                />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-y-auto">
                {isLive
                  ? <LiveDetailsForm value={liveForm} onChange={setLiveForm} />
                  : <RecordedDetailsForm value={recForm} onChange={setRecForm} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1) as WizardStep)}
            disabled={step === 0}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-30"
          >
            Back
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(s => (s + 1) as WizardStep)}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-opacity"
              style={{ background: "linear-gradient(135deg,#013889,#0257c8)" }}
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || createLecture.isPending}
              className={cn(
                "flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-opacity",
                isLive ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {createLecture.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : isLive
                  ? <><Radio className="w-3.5 h-3.5" /> Schedule Live</>
                  : <><Upload className="w-3.5 h-3.5" /> Save Lecture</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LecturesPage = () => {
  const { data: lectures, isLoading } = useLectures();
  const unpublish = useUnpublishLecture();
  const [statsLecture, setStatsLecture] = useState<{ id: string; title: string } | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState<{ id: string; title: string } | null>(null);
  const [scheduleType, setScheduleType] = useState<"live" | "recorded" | null>(null);

  const lectureList: any[] = Array.isArray(lectures) ? lectures : [];

  const handleUnpublish = async () => {
    if (!confirmUnpublish) return;
    try {
      await unpublish.mutateAsync(confirmUnpublish.id);
      toast.success(`"${confirmUnpublish.title}" unpublished`);
      setConfirmUnpublish(null);
    } catch {
      toast.error("Failed to unpublish lecture");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader
          title="Lectures"
          subtitle={`${lectureList.filter(l => l.status === "published").length} published · ${lectureList.length} total`}
        />
        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            onClick={() => setScheduleType("live")}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-black transition-colors"
          >
            <Radio className="w-3.5 h-3.5" />
            Schedule Live
          </button>
          <button
            onClick={() => setScheduleType("recorded")}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-white text-sm font-black transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#013889,#0257c8)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Recorded
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : lectureList.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No lectures yet</p>
          <p className="text-sm mt-1 mb-5">Schedule a live session or upload a recorded lecture to get started.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setScheduleType("live")}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-black transition-colors"
            >
              <Radio className="w-3.5 h-3.5" /> Schedule Live
            </button>
            <button
              onClick={() => setScheduleType("recorded")}
              className="flex items-center gap-2 h-9 px-5 rounded-xl text-white text-sm font-black"
              style={{ background: "linear-gradient(135deg,#013889,#0257c8)" }}
            >
              <MonitorPlay className="w-3.5 h-3.5" /> Add Recorded
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lectureList.map((lec) => (
            <div key={lec.id}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                {lec.type === "live"
                  ? <Radio className="w-5 h-5 text-rose-500" />
                  : lec.thumbnailUrl
                    ? <img src={lec.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    : <MonitorPlay className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm truncate">{lec.title}</p>
                  <StatusBadge status={lec.status} />
                  {lec.type === "live" && (
                    <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">Live</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {lec.topic?.name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {lec.topic.name}
                    </span>
                  )}
                  {lec.durationSeconds && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmtDuration(lec.durationSeconds)}
                    </span>
                  )}
                  {lec.scheduledAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(lec.scheduledAt).toLocaleString()}
                    </span>
                  )}
                  {lec.batch?.name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {lec.batch.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setStatsLecture({ id: lec.id, title: lec.title })}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Stats
                </button>
                {lec.status === "published" && (
                  <button
                    onClick={() => setConfirmUnpublish({ id: lec.id, title: lec.title })}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Unpublish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Lecture Modal */}
      <AnimatePresence>
        {scheduleType && (
          <ScheduleLectureModal
            key="schedule-modal"
            type={scheduleType}
            onClose={() => setScheduleType(null)}
          />
        )}
      </AnimatePresence>

      {/* Stats drawer */}
      <AnimatePresence>
        {statsLecture && (
          <StatsDrawer lectureId={statsLecture.id} title={statsLecture.title} onClose={() => setStatsLecture(null)} />
        )}
      </AnimatePresence>

      {/* Unpublish confirm */}
      <AnimatePresence>
        {confirmUnpublish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                <EyeOff className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Unpublish Lecture?</h3>
              <p className="text-sm text-muted-foreground mb-5">
                "<span className="text-foreground">{confirmUnpublish.title}</span>" will be hidden from students immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmUnpublish(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnpublish}
                  disabled={unpublish.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {unpublish.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unpublish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LecturesPage;
