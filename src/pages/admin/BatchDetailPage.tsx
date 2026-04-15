import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, Users, Edit2, Trash2, Upload, Download, X,
  AlertCircle, Check, Copy, UserPlus, ImageIcon, DollarSign,
  CheckCircle2, PauseCircle, PlayCircle, Link, Calendar,
  BookOpen, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useBatch, useBatchRoster, useCreateBatchStudent,
  useBulkCreateBatchStudents, useUpdateBatch, useDeleteBatch,
  useUploadBatchThumbnail, useGenerateInviteLink,
} from "@/hooks/use-admin";
import type { BatchStudentRow, BulkStudentResult } from "@/lib/api/admin";

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
    maxStudents: batch.maxStudents ?? 60,
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
        maxStudents: form.maxStudents,
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
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Max Students</label>
              <input type="number" min={1} value={form.maxStudents}
                onChange={e => setForm({ ...form, maxStudents: +e.target.value })}
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400" />
            </div>
            <div className="col-span-2">
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

// ─── Students Section ─────────────────────────────────────────────────────────

type ImportView = "idle" | "single" | "bulk" | "result";

function StudentsSection({ batchId, batchName }: { batchId: string; batchName: string }) {
  const { data: roster, isLoading } = useBatchRoster(batchId);
  const createStudent = useCreateBatchStudent(batchId);
  const bulkCreate = useBulkCreateBatchStudents(batchId);
  const generateInvite = useGenerateInviteLink();

  const [view, setView] = useState<ImportView>("idle");
  const [singleForm, setSingleForm] = useState({ fullName: "", phoneNumber: "", email: "" });
  const [singleError, setSingleError] = useState("");
  const [singleResult, setSingleResult] = useState<{ tempPassword: string; fullName: string; email: string } | null>(null);
  const [csvPreview, setCsvPreview] = useState<BatchStudentRow[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkStudentResult | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [inviteCopied, setInviteCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rosterList: any[] = (() => {
    if (!roster) return [];
    if (Array.isArray(roster)) return roster;
    if ((roster as any).data) return (roster as any).data;
    return [];
  })();

  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSingleError("");
    try {
      const res = await createStudent.mutateAsync(singleForm);
      setSingleResult({ tempPassword: res.tempPassword, fullName: singleForm.fullName, email: singleForm.email });
      setSingleForm({ fullName: "", phoneNumber: "", email: "" });
      setView("result");
    } catch (err: any) { setSingleError(err?.response?.data?.message || "Failed to create student."); }
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = (ev.target?.result as string).split("\n").map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      const header = lines[0].toLowerCase().split(",").map(h => h.trim());
      const nameIdx = header.findIndex(h => h.includes("name"));
      const phoneIdx = header.findIndex(h => h.includes("phone") || h.includes("mobile"));
      const emailIdx = header.findIndex(h => h.includes("email") || h.includes("mail"));
      const rows: BatchStudentRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const fullName = nameIdx >= 0 ? cols[nameIdx] : "";
        const phoneNumber = phoneIdx >= 0 ? cols[phoneIdx] : "";
        const email = emailIdx >= 0 ? cols[emailIdx] : "";
        if (fullName && phoneNumber && email) rows.push({ fullName, phoneNumber, email });
      }
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleGenerateInvite = async () => {
    try {
      const res = await generateInvite.mutateAsync(batchId);
      setInviteUrl(res?.inviteUrl ?? "");
    } catch { toast.error("Failed to generate invite link"); }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const downloadTemplate = () => {
    const csv = "Full Name,Phone Number,Email\nArjun Sharma,+919876543210,arjun@example.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `students-template-${batchName.replace(/\s+/g, "-")}.csv`; a.click();
  };

  return (
    <div className="space-y-6">

      {/* ── Action bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-900">{rosterList.length} Student{rosterList.length !== 1 ? "s" : ""} Enrolled</p>
          <p className="text-xs text-slate-400 mt-0.5">Enroll students directly or share an invite link for self-enrollment</p>
        </div>
        {view === "idle" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setView("single")} className="gap-2 rounded-xl">
              <UserPlus className="w-4 h-4" /> Add Student
            </Button>
            <Button size="sm" variant="outline" onClick={() => setView("bulk")} className="gap-2 rounded-xl">
              <Upload className="w-4 h-4" /> Import CSV
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerateInvite} disabled={generateInvite.isPending} className="gap-2 rounded-xl">
              {generateInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              Invite Link
            </Button>
            <Button size="sm" variant="ghost" onClick={downloadTemplate} className="gap-2 rounded-xl text-slate-400">
              <Download className="w-4 h-4" /> Template
            </Button>
          </div>
        )}
      </div>

      {/* ── Invite link banner ── */}
      <AnimatePresence>
        {inviteUrl && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-sm font-semibold text-blue-800">Self-Enrollment Invite Link</p>
              </div>
              <button onClick={() => setInviteUrl("")} className="text-blue-300 hover:text-blue-600"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-blue-500">Valid for 7 days. Students can use this link to enroll themselves into the course.</p>
            <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-4 py-2.5">
              <span className="flex-1 text-xs text-slate-600 truncate font-mono">{inviteUrl}</span>
              <button onClick={copyInviteLink}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                {inviteCopied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add single student ── */}
      <AnimatePresence>
        {view === "single" && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSingleCreate}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800">Add Student</h4>
              <button type="button" onClick={() => { setView("idle"); setSingleError(""); }}
                className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            {singleError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{singleError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input required placeholder="Full Name *" value={singleForm.fullName}
                onChange={e => setSingleForm({ ...singleForm, fullName: e.target.value })}
                className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
              <input required placeholder="+91xxxxxxxxxx *" value={singleForm.phoneNumber}
                onChange={e => setSingleForm({ ...singleForm, phoneNumber: e.target.value })}
                className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
              <input required type="email" placeholder="Email *" value={singleForm.email}
                onChange={e => setSingleForm({ ...singleForm, email: e.target.value })}
                className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm"
                disabled={createStudent.isPending || !singleForm.fullName || !singleForm.phoneNumber || !singleForm.email}>
                {createStudent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Enroll"}
              </Button>
              <Button type="button" size="sm" variant="ghost"
                onClick={() => { setView("idle"); setSingleError(""); }}>Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Bulk CSV ── */}
      <AnimatePresence>
        {view === "bulk" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800">Import from CSV</h4>
              <button type="button" onClick={() => { setView("idle"); setCsvPreview([]); }}
                className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            {csvPreview.length === 0 ? (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex flex-col items-center justify-center gap-2">
                <Upload className="w-5 h-5" /> Click to select CSV file
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">{csvPreview.length} students ready to import</p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-bold text-slate-500">Name</th>
                        <th className="text-left px-4 py-2 text-xs font-bold text-slate-500">Phone</th>
                        <th className="text-left px-4 py-2 text-xs font-bold text-slate-500">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((r, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-4 py-2 text-sm">{r.fullName}</td>
                          <td className="px-4 py-2 text-sm text-slate-500">{r.phoneNumber}</td>
                          <td className="px-4 py-2 text-sm text-slate-500">{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={bulkCreate.isPending}
                    onClick={async () => {
                      try {
                        const res = await bulkCreate.mutateAsync(csvPreview);
                        setBulkResult(res); setCsvPreview([]); setView("result");
                      } catch (err: any) { toast.error(err?.response?.data?.message || "Bulk import failed."); }
                    }}>
                    {bulkCreate.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                      : `Import ${csvPreview.length} Students`}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCsvPreview([])}>Clear</Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success result ── */}
      <AnimatePresence>
        {view === "result" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h4 className="font-semibold text-emerald-800">
                {bulkResult ? `${bulkResult.summary.created} students imported` : "Student created!"}
              </h4>
              <button type="button" onClick={() => { setView("idle"); setSingleResult(null); setBulkResult(null); }}
                className="ml-auto text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
            </div>
            {singleResult && (
              <div className="bg-white rounded-xl p-4 space-y-2">
                <p className="font-semibold text-slate-800">{singleResult.fullName}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{singleResult.email}</span><CopyBtn text={singleResult.email} />
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg text-sm">{singleResult.tempPassword}</code>
                  <CopyBtn text={singleResult.tempPassword} />
                  <span className="text-xs text-slate-400">Temporary password — share with student</span>
                </div>
              </div>
            )}
            {bulkResult && bulkResult.results.filter(r => r.status === 'error').length > 0 && (
              <p className="text-sm text-amber-700">{bulkResult.results.filter(r => r.status === 'error').length} failed — check CSV for duplicates</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Roster table ── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : rosterList.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No students enrolled yet</p>
          <p className="text-xs text-slate-400 mt-1">Add students above or share an invite link</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase">#</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase">Student</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Enrolled On</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {rosterList.map((s: any, i: number) => (
                <tr key={s.id ?? s.studentId ?? i} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-400">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">
                        {(s.fullName || s.name || "S").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800">{s.fullName || s.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="text-sm">{s.phoneNumber || s.phone || "—"}</span>
                      {(s.phoneNumber || s.phone) && <CopyBtn text={s.phoneNumber || s.phone} />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="text-sm">{s.email || "—"}</span>
                      {s.email && <CopyBtn text={s.email} />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400">
                    {s.enrolledAt
                      ? new Date(s.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      s.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    }`}>{s.status || "active"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const max = batch.maxStudents ?? 60;
  const pct = Math.min(100, Math.round((enrolled / max) * 100));
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
              {/* Enrollment */}
              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase">
                  <Users className="w-3.5 h-3.5" /> Enrolled
                </div>
                <p className="text-2xl font-black text-slate-800">{enrolled}<span className="text-sm font-semibold text-slate-400">/{max}</span></p>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${examStyle.from}, ${examStyle.to})` }} />
                </div>
              </div>

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

      {/* ── Students section ── */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Students</h2>
            <p className="text-xs text-slate-400">Enrolled students for this course</p>
          </div>
        </div>
        <StudentsSection batchId={id!} batchName={batch.name} />
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {showEdit && <EditCourseModal batch={batch} onClose={() => setShowEdit(false)} />}
      </AnimatePresence>
    </div>
  );
}
