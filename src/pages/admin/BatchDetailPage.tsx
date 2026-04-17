import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, Users, Edit2, Trash2, X,
  Check, Copy, ImageIcon, DollarSign,
  BookOpen, GraduationCap, Plus,
  CheckCircle2, PauseCircle, PlayCircle, Link, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useBatch,
  useUpdateBatch, useDeleteBatch,
  useUploadBatchThumbnail, useGenerateInviteLink,
} from "@/hooks/use-admin";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXAM_STYLES: Record<string, { from: string; to: string }> = {
  jee:     { from: "#1D4ED8", to: "#4F46E5" },
  neet:    { from: "#059669", to: "#0D9488" },
  both:    { from: "#7C3AED", to: "#C026D3" },
  default: { from: "#0F172A", to: "#334155" },
};

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").origin; }
  catch { return "http://localhost:3000"; }
})();

function resolveMediaUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-slate-400 hover:text-blue-500 transition-colors shrink-0"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Course Thumbnail ─────────────────────────────────────────────────────────

function CourseThumbnail({ name, examTarget, imageUrl, className = "" }: {
  name: string; examTarget: string; imageUrl?: string; className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const style = EXAM_STYLES[examTarget?.toLowerCase()] ?? EXAM_STYLES.default;
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  const resolved = resolveMediaUrl(imageUrl);
  if (resolved && !imgError) {
    return (
      <div className={`rounded-2xl overflow-hidden shrink-0 ${className}`}>
        <img src={resolved} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  return (
    <div
      className={`rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shrink-0 ${className}`}
      style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
      <span className="text-white font-black text-3xl relative z-10">{initials}</span>
      <span className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1 relative z-10">
        {examTarget?.toUpperCase() || "—"}
      </span>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditCourseModal({ batch, onClose }: { batch: any; onClose: () => void }) {
  const updateBatch = useUpdateBatch();
  const uploadBatchThumbnail = useUploadBatchThumbnail();
  const thumbRef = useRef<HTMLInputElement>(null);

  const resolvedInitialThumb = resolveMediaUrl(batch.thumbnailUrl) ?? "";

  const [form, setForm] = useState({
    name: batch.name ?? "",
    description: batch.description ?? "",
    examTarget: batch.examTarget ?? "jee",
    class: batch.class ?? "11",
    isPaid: batch.isPaid ?? false,
    feeAmount: batch.feeAmount ? String(batch.feeAmount) : "",
    startDate: batch.startDate ? batch.startDate.split("T")[0] : "",
    endDate: batch.endDate ? batch.endDate.split("T")[0] : "",
    thumbnailUrl: batch.thumbnailUrl ?? "",
  });
  const [thumbPreview, setThumbPreview] = useState<string>(resolvedInitialThumb);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [error, setError] = useState("");

  const handleThumbFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Thumbnail must be under 5 MB"); return; }
    if (!["image/png","image/jpeg","image/jpg","image/webp"].includes(file.type)) {
      toast.error("Only PNG, JPG or WEBP images allowed"); return;
    }
    setThumbUploading(true);
    const reader = new FileReader();
    reader.onload = ev => setThumbPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const { thumbnailUrl } = await uploadBatchThumbnail.mutateAsync({ batchId: batch.id, file });
      setForm(f => ({ ...f, thumbnailUrl }));
      toast.success("Thumbnail updated");
    } catch { toast.error("Thumbnail upload failed"); setThumbPreview(resolvedInitialThumb); }
    finally { setThumbUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (form.isPaid && (!form.feeAmount || Number(form.feeAmount) <= 0)) {
      setError("Fee amount is required for paid courses."); return;
    }
    try {
      await updateBatch.mutateAsync({
        id: batch.id,
        name: form.name,
        description: form.description || undefined,
        examTarget: form.examTarget,
        class: form.class,
        isPaid: form.isPaid,
        feeAmount: form.isPaid && form.feeAmount ? Number(form.feeAmount) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
      });
      toast.success("Course updated");
      onClose();
    } catch (err: any) { setError(err?.response?.data?.message || "Failed to update course."); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-900">Edit Course</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Course Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Course Description</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What will students learn?"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Exam Target</label>
              <select value={form.examTarget} onChange={e => setForm({ ...form, examTarget: e.target.value })}
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400">
                <option value="jee">JEE</option>
                <option value="neet">NEET</option>
                <option value="both">Both / General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Class Level</label>
              <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400">
                {["8","9","10","11","12","DROPPER"].map(c => (
                  <option key={c} value={c}>{c === "DROPPER" ? "Dropper" : `Class ${c}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400" />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 block">Course Pricing</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm({ ...form, isPaid: false, feeAmount: "" })}
                className={`flex-1 h-10 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  !form.isPaid ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-400"
                }`}>
                <CheckCircle2 className={`w-4 h-4 ${!form.isPaid ? "text-emerald-500" : "text-slate-300"}`} /> Free
              </button>
              <button type="button" onClick={() => setForm({ ...form, isPaid: true })}
                className={`flex-1 h-10 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  form.isPaid ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-400"
                }`}>
                <DollarSign className={`w-4 h-4 ${form.isPaid ? "text-blue-500" : "text-slate-300"}`} /> Paid
              </button>
            </div>
            {form.isPaid && (
              <div className="space-y-2">
                <input type="number" min={1} required placeholder="Fee amount (₹)" value={form.feeAmount}
                  onChange={e => setForm({ ...form, feeAmount: e.target.value })}
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400" />
                <p className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-xl font-medium">
                  Revenue split: <span className="font-black">80% → Your Institute</span> · <span className="font-black">20% → Platform</span>
                  {form.feeAmount && Number(form.feeAmount) > 0 && (
                    <span className="text-blue-500 ml-1">(You earn ₹{Math.round(Number(form.feeAmount) * 0.8)}/student)</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Course Thumbnail</label>
            <input ref={thumbRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleThumbFile(e.target.files[0]); e.target.value = ""; }} />
            <button type="button" onClick={() => thumbRef.current?.click()}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors overflow-hidden relative">
              {thumbUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs">Uploading…</span></>
              ) : thumbPreview ? (
                <>
                  <img src={thumbPreview} className="absolute inset-0 w-full h-full object-cover" alt="" />
                  <span className="relative z-10 text-xs font-semibold bg-white/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                    <ImageIcon className="w-3.5 h-3.5" /> Change thumbnail
                  </span>
                </>
              ) : (
                <><ImageIcon className="w-6 h-6 opacity-30" /><span className="text-xs">Upload thumbnail</span></>
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-2xl">Cancel</Button>
            <Button type="submit" disabled={updateBatch.isPending || thumbUploading} className="flex-1 rounded-2xl">
              {updateBatch.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

function CourseFAQsSection({ batchId, initialFaqs = [] }: { batchId: string; initialFaqs: { question: string; answer: string }[] }) {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [isEditing, setIsEditing] = useState(false);
  const updateBatch = useUpdateBatch();

  const handleAdd = () => setFaqs([...faqs, { question: "", answer: "" }]);
  
  const handleRemove = (i: number) => {
    const next = [...faqs];
    next.splice(i, 1);
    setFaqs(next);
  };
  
  const handleChange = (i: number, key: 'question'|'answer', val: string) => {
    const next = [...faqs];
    next[i][key] = val;
    setFaqs(next);
  };

  const handleSave = async () => {
    try {
      await updateBatch.mutateAsync({ id: batchId, faqs });
      toast.success("FAQs updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save FAQs");
    }
  };

  if (!isEditing) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Course FAQs</h2>
              <p className="text-xs text-slate-400">Manage frequently asked questions</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" /> Edit FAQs
          </Button>
        </div>
        {faqs.length === 0 ? (
          <p className="text-sm text-slate-400">No FAQs added yet.</p>
        ) : (
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <h4 className="font-semibold text-slate-800 text-sm mb-1">{f.question}</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{f.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm ring-1 ring-blue-100">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Edit FAQs</h2>
            <p className="text-xs text-slate-400">Add or remove questions</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mb-4">
        {faqs.map((f, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
            <button onClick={() => handleRemove(i)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors cursor-pointer">
              <X className="w-3 h-3" />
            </button>
            <div className="flex-1 space-y-3">
              <input value={f.question} onChange={e => handleChange(i, 'question', e.target.value)} placeholder="Question" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:border-blue-400 outline-none" />
              <textarea value={f.answer} onChange={e => handleChange(i, 'answer', e.target.value)} placeholder="Answer" rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-400 outline-none resize-none" />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={handleAdd} className="w-full border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Add Question
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setFaqs(initialFaqs); setIsEditing(false); }}>Cancel</Button>
        <Button size="sm" disabled={updateBatch.isPending} onClick={handleSave}>
          {updateBatch.isPending ? "Saving..." : "Save FAQs"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-600 border-emerald-100",
  inactive:  "bg-slate-100 text-slate-500 border-slate-200",
  completed: "bg-blue-50 text-blue-600 border-blue-100",
};

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: batch, isLoading, isError } = useBatch(id!);
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  const [showEdit, setShowEdit] = useState(false);

  const handleStatusChange = async (status: string) => {
    try { await updateBatch.mutateAsync({ id: id!, status }); toast.success(`Course marked as ${status}`); }
    catch { toast.error("Failed to update status."); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    try { await deleteBatch.mutateAsync(id!); navigate("/admin/batches"); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Failed to delete course."); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Course not found</p>
        <button onClick={() => navigate("/admin/batches")} className="text-sm text-blue-600 hover:underline">
          ← Back to Courses
        </button>
      </div>
    );
  }

  const enrolled = (batch as any).studentCount ?? 0;
  const examStyle = EXAM_STYLES[batch.examTarget?.toLowerCase()] ?? EXAM_STYLES.default;
  const sc = STATUS_COLORS[batch.status] ?? STATUS_COLORS.inactive;

  return (
    <div className="max-w-[1100px] mx-auto p-6 lg:p-8 space-y-6 pb-20">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => navigate("/admin/batches")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>
        <div className="flex items-center gap-2">
          {batch.status === "active" && (
            <button onClick={() => handleStatusChange("inactive")} title="Deactivate"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all">
              <PauseCircle className="w-5 h-5" />
            </button>
          )}
          {batch.status === "inactive" && (
            <button onClick={() => handleStatusChange("active")} title="Activate"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
              <PlayCircle className="w-5 h-5" />
            </button>
          )}
          {batch.status !== "completed" && (
            <button onClick={() => handleStatusChange("completed")} title="Mark completed"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* ── Course hero ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          <CourseThumbnail
            name={batch.name} examTarget={batch.examTarget}
            imageUrl={batch.thumbnailUrl}
            className="w-24 h-24 sm:w-32 sm:h-32 shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-4">
            {/* Title + badges */}
            <div className="flex flex-wrap items-start gap-2">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{batch.name}</h1>
              <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${sc}`}>
                {batch.status}
              </span>
              {batch.isPaid ? (
                <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-blue-50 text-blue-600 border-blue-100">
                  ₹{batch.feeAmount}
                </span>
              ) : (
                <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100">
                  Free
                </span>
              )}
            </div>

            {/* Description */}
            {batch.description && (
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{batch.description}</p>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <button
                onClick={() => navigate(`/admin/students?batch=${encodeURIComponent(batch.name)}`)}
                className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 space-y-2 text-left hover:bg-blue-100 hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 uppercase">
                  <Users className="w-3.5 h-3.5" /> Enrolled
                </div>
                <p className="text-2xl font-black text-blue-700 group-hover:text-blue-800 transition-colors">
                  {enrolled}<span className="text-sm font-semibold text-blue-400"> students</span>
                </p>
                <p className="text-[10px] font-semibold text-blue-400 group-hover:text-blue-600 transition-colors">View all students →</p>
              </button>

              {/* Exam target */}
              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">
                  <GraduationCap className="w-3.5 h-3.5" /> Target
                </div>
                <p className="text-sm font-black text-slate-800">{batch.examTarget?.toUpperCase()}</p>
                <p className="text-xs text-slate-400">Class {batch.class}</p>
              </div>

              {/* Revenue */}
              {batch.isPaid ? (
                <div className="bg-blue-50 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase">
                    <DollarSign className="w-3.5 h-3.5" /> Revenue
                  </div>
                  <p className="text-sm font-black text-blue-700">
                    ₹{Math.round(Number(batch.feeAmount) * 0.8)}<span className="text-xs font-semibold text-blue-400">/student</span>
                  </p>
                  <p className="text-xs text-blue-400">80% to you · 20% platform</p>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pricing
                  </div>
                  <p className="text-sm font-black text-emerald-700">Free</p>
                  <p className="text-xs text-emerald-400">Open enrollment</p>
                </div>
              )}

              {/* Dates */}
              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">
                  <Calendar className="w-3.5 h-3.5" /> Duration
                </div>
                {batch.startDate ? (
                  <>
                    <p className="text-xs font-semibold text-slate-700">
                      {new Date(batch.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {batch.endDate && (
                      <p className="text-xs text-slate-400">
                        → {new Date(batch.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">No dates set</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── FAQs Section ── */}
      <CourseFAQsSection batchId={id!} initialFaqs={(batch as any).faqs || []} />

      {/* Edit modal */}
      <AnimatePresence>
        {showEdit && <EditCourseModal batch={batch} onClose={() => setShowEdit(false)} />}
      </AnimatePresence>
    </div>
  );
}
