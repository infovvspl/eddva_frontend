import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Loader2, EyeOff, BarChart3, X, Play,
  Clock, Users, CheckCircle2, AlertTriangle, ChevronRight,
  Video, Flame,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLectures, useUnpublishLecture, useLectureStats } from "@/hooks/use-admin";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Stats Drawer ─────────────────────────────────────────────────────────────

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
        {/* Header */}
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
              {/* Top metrics */}
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

              {/* Unique viewers */}
              {(stats.uniqueViewers ?? stats.uniqueStudents) != null && (
                <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    Unique students who watched
                  </div>
                  <span className="font-bold text-foreground">{stats.uniqueViewers ?? stats.uniqueStudents}</span>
                </div>
              )}

              {/* Confusion hotspots */}
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
                              <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${Math.min(100, (h.count / (stats.totalViews || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{h.count}×</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drop-off */}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const LecturesPage = () => {
  const { data: lectures, isLoading } = useLectures();
  const unpublish = useUnpublishLecture();
  const [statsLecture, setStatsLecture] = useState<{ id: string; title: string } | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState<{ id: string; title: string } | null>(null);

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
      <PageHeader
        title="Lectures"
        subtitle={`${lectureList.filter(l => l.status === "published").length} published · ${lectureList.length} total`}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : lectureList.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No lectures yet</p>
          <p className="text-sm mt-1">Teachers publish lectures from their dashboard — they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lectureList.map((lec) => (
            <div key={lec.id}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Thumbnail / Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                {lec.thumbnailUrl
                  ? <img src={lec.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                  : <BookOpen className="w-6 h-6 text-primary" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm truncate">{lec.title}</p>
                  <StatusBadge status={lec.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {lec.topic?.name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {lec.topic.name}
                    </span>
                  )}
                  {lec.durationSeconds && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmtDuration(lec.durationSeconds)}
                    </span>
                  )}
                  {lec.teacher?.fullName && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {lec.teacher.fullName}
                    </span>
                  )}
                  {lec.batch?.name && (
                    <span className="text-xs text-muted-foreground">
                      Batch: {lec.batch.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
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

      {/* Stats drawer */}
      <AnimatePresence>
        {statsLecture && (
          <StatsDrawer
            lectureId={statsLecture.id}
            title={statsLecture.title}
            onClose={() => setStatsLecture(null)}
          />
        )}
      </AnimatePresence>

      {/* Unpublish confirm dialog */}
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
