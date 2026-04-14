import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, AlertCircle, CheckCircle2, BookOpen,
  Users, Calendar, DollarSign, GraduationCap,
  LogIn, UserPlus, Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import * as adminApi from "@/lib/api/admin";
import type { BatchPreview } from "@/lib/api/admin";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

const API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").origin; }
  catch { return "http://localhost:3000"; }
})();

function resolveThumb(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

export default function JoinBatchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { user } = useAuthStore();

  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState("");

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Fetch batch preview (public — no auth needed)
  useEffect(() => {
    if (!token) { setPreviewError("No invite token found in the link."); setLoadingPreview(false); return; }
    adminApi.getBatchPreview(token)
      .then(data => setPreview(data))
      .catch(() => setPreviewError("This invite link is invalid or has expired."))
      .finally(() => setLoadingPreview(false));
  }, [token]);

  const handleJoin = async () => {
    if (!user || user.role !== "student") return;
    setJoinError("");
    setJoining(true);
    try {
      await adminApi.joinBatchByToken(token);
      setJoined(true);
      setTimeout(() => navigate("/student"), 2500);
    } catch (err: any) {
      setJoinError(err?.response?.data?.message || "Failed to join batch. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const returnTo = `/join?token=${token}`;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ── Invalid link ───────────────────────────────────────────────────────────
  if (previewError || !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Invalid Link</h2>
          <p className="text-slate-500 text-sm">{previewError || "This invite link is not valid."}</p>
          <button onClick={() => navigate("/")} className="text-blue-600 text-sm font-semibold hover:underline">
            Go to homepage →
          </button>
        </div>
      </div>
    );
  }

  const spotsLeft = preview.maxStudents - preview.enrolledCount;
  const enrolledPct = Math.min(100, Math.round((preview.enrolledCount / preview.maxStudents) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="mb-8">
        <img src={edvaLogo} alt="ApexIQ" className="h-10 object-contain cursor-pointer" onClick={() => navigate("/")} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden"
      >
        {/* Thumbnail */}
        {preview.thumbnailUrl ? (
          <div className="h-48 w-full overflow-hidden relative">
            <img src={resolveThumb(preview.thumbnailUrl)} alt={preview.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex gap-2">
                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/30">
                  {preview.examTarget?.toUpperCase()}
                </span>
                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/30">
                  Class {preview.class}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/60" />
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Invite badge */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">You're Invited</span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">{preview.name}</h1>
            {preview.description && (
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{preview.description}</p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl p-3">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Enrolled</p>
                <p className="text-sm font-black text-slate-800">{preview.enrolledCount} / {preview.maxStudents}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl p-3">
              <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fee</p>
                <p className="text-sm font-black text-slate-800">
                  {preview.isPaid ? `₹${preview.feeAmount?.toLocaleString("en-IN")}` : "Free"}
                </p>
              </div>
            </div>
            {preview.startDate && (
              <div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl p-3 col-span-2">
                <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Duration</p>
                  <p className="text-sm font-black text-slate-800">
                    {new Date(preview.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {preview.endDate && ` → ${new Date(preview.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Capacity bar */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
              <span>{spotsLeft} spots remaining</span>
              <span>{enrolledPct}% full</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${enrolledPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${enrolledPct >= 90 ? "bg-red-500" : enrolledPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
              />
            </div>
          </div>

          {/* Action area */}
          {joined ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <div>
                <p className="font-black text-emerald-800">Successfully Enrolled!</p>
                <p className="text-sm text-emerald-600 mt-0.5">Redirecting to your dashboard…</p>
              </div>
            </motion.div>
          ) : user?.role === "student" ? (
            // Student is logged in → show Join button
            <div className="space-y-3">
              {joinError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{joinError}</p>
                </div>
              )}
              <button
                onClick={handleJoin}
                disabled={joining || spotsLeft <= 0}
                className="w-full h-12 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #3B82F6, #A855F7)" }}
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                {spotsLeft <= 0 ? "Batch is Full" : joining ? "Joining…" : "Join This Batch"}
              </button>
            </div>
          ) : user ? (
            // Logged in but not a student
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-sm font-semibold text-amber-700">
                Only student accounts can join batches. Please log in with a student account.
              </p>
            </div>
          ) : (
            // Not logged in → register or login
            <div className="space-y-3">
              <p className="text-xs text-center text-slate-400 font-semibold">
                Create an account or log in to join this batch
              </p>
              <button
                onClick={() => navigate(`/register?returnTo=${encodeURIComponent(returnTo)}`)}
                className="w-full h-12 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #3B82F6, #A855F7)" }}
              >
                <UserPlus className="w-4 h-4" />
                Register &amp; Join
              </button>
              <button
                onClick={() => navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)}
                className="w-full h-12 rounded-2xl font-black text-slate-700 text-sm flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                I already have an account
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <p className="mt-6 text-[11px] font-semibold text-slate-400 text-center">
        Powered by ApexIQ · Secure AI Education Platform
      </p>
    </div>
  );
}
