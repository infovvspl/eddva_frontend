import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, GraduationCap, Users, BookOpen,
  ChevronRight, CheckCircle2, Loader2, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDiscoverBatches, useEnrollInBatch } from "@/hooks/use-student";
import type { PublicBatch } from "@/lib/api/student";

// ─── Resolve thumbnail URLs ───────────────────────────────────────────────────
const BASE = (import.meta.env.VITE_API_BASE_URL as string ?? "").replace(/\/api\/v1\/?$/, "");
function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${BASE}${url}`;
}

// ─── Batch Card ───────────────────────────────────────────────────────────────
function BatchCard({
  batch,
  enrolled,
  onEnroll,
  enrolling,
}: {
  batch: PublicBatch;
  enrolled: boolean;
  onEnroll: () => void;
  enrolling: boolean;
}) {
  const thumb = resolveUrl(batch.thumbnailUrl);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        enrolled
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20",
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full bg-white/5 relative overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={batch.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white/20" />
          </div>
        )}
        {enrolled && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
            batch.isPaid
              ? "bg-amber-500/80 text-amber-100"
              : "bg-emerald-500/80 text-emerald-100",
          )}>
            {batch.isPaid ? "Paid" : "Free"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-white truncate mb-1">{batch.name}</h3>
        {batch.teacher && (
          <p className="text-[11px] text-white/50 mb-2">
            by {batch.teacher.fullName}
          </p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-white/40 mb-3">
          <span className="flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {batch.examTarget}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {batch.studentCount ?? 0} students
          </span>
        </div>
        <motion.button
          whileHover={!enrolled && !enrolling ? { scale: 1.02 } : {}}
          whileTap={!enrolled && !enrolling ? { scale: 0.98 } : {}}
          onClick={!enrolled ? onEnroll : undefined}
          disabled={enrolled || enrolling}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
            enrolled
              ? "bg-emerald-500/15 text-emerald-400 cursor-default"
              : "text-white",
          )}
          style={!enrolled ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : {}}
        >
          {enrolling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : enrolled ? (
            <><CheckCircle2 className="w-3.5 h-3.5" />Enrolled</>
          ) : (
            <>Enroll Now <ChevronRight className="w-3.5 h-3.5" /></>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface BatchDiscoveryModalProps {
  onClose: () => void;
}

export function BatchDiscoveryModal({ onClose }: BatchDiscoveryModalProps) {
  const { data, isLoading } = useDiscoverBatches(true);
  const enroll = useEnrollInBatch();
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const batches: PublicBatch[] = data?.availableBatches ?? [];
  const prefs = data?.studentPreferences;
  const isFirst = data?.isFirstLogin ?? false;

  const handleEnroll = async (batchId: string) => {
    setEnrollingId(batchId);
    enroll.mutate(batchId, {
      onSuccess: () => {
        setEnrolledIds(prev => new Set([...prev, batchId]));
        toast.success("Enrolled successfully!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message ?? "Enrollment failed");
      },
      onSettled: () => setEnrollingId(null),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0f0f23 0%, #1a1040 50%, #0d1f3c 100%)" }}
        >
          {/* Ambient orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 right-1/4 w-[300px] h-[300px] bg-purple-600/10 blur-[80px] rounded-full" />
            <div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] bg-indigo-600/10 blur-[70px] rounded-full" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-start justify-between p-6 pb-4 border-b border-white/8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {isFirst ? "Welcome to EDVA!" : "Available Courses"}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                {isFirst ? "Start your learning journey" : "Discover your courses"}
              </h2>
              {prefs && (
                <p className="text-sm text-white/40 mt-1">
                  Showing batches for <span className="text-indigo-300 font-semibold">{prefs.examTarget}</span>
                  {prefs.class && <> · Class <span className="text-indigo-300 font-semibold">{prefs.class}</span></>}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="relative z-10 flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400/60" />
                <p className="text-sm text-white/40">Finding available courses…</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-base font-bold text-white/50 mb-1">No courses available yet</p>
                <p className="text-sm text-white/30">Check back later or contact your institute.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches.map(batch => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    enrolled={enrolledIds.has(batch.id)}
                    enrolling={enrollingId === batch.id}
                    onEnroll={() => handleEnroll(batch.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between p-4 border-t border-white/8 bg-white/3">
            <p className="text-[11px] text-white/30">
              {enrolledIds.size > 0
                ? `${enrolledIds.size} course${enrolledIds.size > 1 ? "s" : ""} enrolled`
                : "Select courses to enroll"}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {enrolledIds.size > 0 ? "Go to Dashboard" : "Skip for now"}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
