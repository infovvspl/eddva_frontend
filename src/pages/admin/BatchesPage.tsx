import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Trash2, Users, X, ChevronRight,
  UserPlus, Upload, Download, Copy, Check, AlertCircle,
  Layout, Calendar, GraduationCap, BarChart3, Edit2,
  Trophy, TrendingDown, TrendingUp, CheckCircle2,
  PauseCircle, PlayCircle, ImageIcon, IndianRupee, BadgePercent,
  Building2, Sparkles, Unlock, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch,
  useBatchRoster, useCreateBatchStudent, useBulkCreateBatchStudents,
  useUploadBatchThumbnail,
  useSubjectTeachers, useAssignSubjectTeacher, useRemoveSubjectTeacher,
  useBatchLiveAttendance, useBatchAttendance, useBatchPerformance,
} from "@/hooks/use-admin";
import type { BatchStudentRow, BulkStudentResult } from "@/lib/api/admin";
import { toast } from "sonner";
import { getApiOrigin } from "@/lib/api-config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Subject-Teacher Assignment Panel ─────────────────────────────────────────

const SUBJECT_SUGGESTIONS = [
  "Physics", "Chemistry", "Mathematics", "Biology",
  "English", "Hindi", "History", "Geography",
  "Economics", "Computer Science", "Accountancy",
];

const TeacherAssignPanel = ({ batchId, teachers }: { batchId: string; teachers: any[] }) => {
  const { data: assignments = [], isLoading } = useSubjectTeachers(batchId);
  const assign = useAssignSubjectTeacher(batchId);
  const remove = useRemoveSubjectTeacher(batchId);

  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = subject
    ? SUBJECT_SUGGESTIONS.filter(s => s.toLowerCase().includes(subject.toLowerCase()) && s.toLowerCase() !== subject.toLowerCase())
    : [];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !teacherId) return;
    setError("");
    try {
      await assign.mutateAsync({ subjectName: subject.trim(), teacherId });
      setSubject("");
      setTeacherId("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign teacher.");
    }
  };

  const handleRemove = async (id: string) => {
    await remove.mutateAsync(id);
  };

  const statusBadge = (status: string | null) => {
    if (!status) return "";
    if (status === "active") return "bg-emerald-500/10 text-emerald-600";
    if (status === "pending_verification") return "bg-amber-500/10 text-amber-600";
    return "bg-secondary text-muted-foreground";
  };

  return (
    <div className="p-5 space-y-5">

      {/* Assign form */}
      <form onSubmit={handleAssign} className="bg-secondary/30 border border-border rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Assign Teacher to Subject</h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Subject input with suggestions */}
          <div className="relative">
            <input
              value={subject}
              onChange={e => { setSubject(e.target.value); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Subject (e.g. Physics) *"
              className="w-full h-10 px-4 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-11 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                {filteredSuggestions.map(s => (
                  <button
                    key={s} type="button"
                    onMouseDown={() => { setSubject(s); setShowSuggestions(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={teacherId}
            onChange={e => setTeacherId(e.target.value)}
            className="h-10 px-4 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Select Teacher *</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>

          <Button type="submit" disabled={assign.isPending || !subject.trim() || !teacherId} className="h-10 gap-2">
            {assign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Assign
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </form>

      {/* Current assignments */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No subject teachers assigned yet</p>
          <p className="text-xs mt-1">Assign a teacher per subject using the form above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">{assignments.length} Subject{assignments.length > 1 ? "s" : ""} Assigned</p>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase">Subject</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase">Teacher</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">Status</th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        {a.subjectName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(a.teacherName || "T").charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.teacherName || "—"}</p>
                          {a.teacherEmail && <p className="text-xs text-muted-foreground">{a.teacherEmail}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(a.teacherStatus)}`}>
                        {a.teacherStatus?.replace("_", " ") || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(a.id)}
                        disabled={remove.isPending}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Student Import Panel ──────────────────────────────────────────────────────

type ImportView = "idle" | "single" | "bulk" | "result";

const StudentImportPanel = ({ batchId, batchName }: { batchId: string; batchName: string }) => {
  const [view, setView] = useState<ImportView>("idle");
  const [singleForm, setSingleForm] = useState({ fullName: "", phoneNumber: "", email: "" });
  const [singleError, setSingleError] = useState("");
  const [singleResult, setSingleResult] = useState<{ tempPassword: string; fullName: string; email: string } | null>(null);
  const [csvPreview, setCsvPreview] = useState<BatchStudentRow[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkStudentResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: roster, isLoading: rosterLoading } = useBatchRoster(batchId);
  const createStudent = useCreateBatchStudent(batchId);
  const bulkCreate = useBulkCreateBatchStudents(batchId);

  const rosterList: any[] = (() => {
    if (!roster) return [];
    if (Array.isArray(roster)) return roster;
    if ((roster as any).data) return (roster as any).data;
    return [];
  })();

  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError("");
    try {
      const res = await createStudent.mutateAsync(singleForm);
      setSingleResult({ tempPassword: res.tempPassword, fullName: singleForm.fullName, email: singleForm.email });
      setSingleForm({ fullName: "", phoneNumber: "", email: "" });
      setView("result");
    } catch (err: any) {
      setSingleError(err?.response?.data?.message || "Failed to create student.");
    }
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
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

  const handleBulkImport = async () => {
    try {
      const res = await bulkCreate.mutateAsync(csvPreview);
      setBulkResult(res);
      setCsvPreview([]);
      setView("result");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Bulk import failed.");
    }
  };

  const downloadTemplate = () => {
    const csv = "Full Name,Phone Number,Email\nArjun Sharma,+919876543210,arjun@example.com\nPriya Singh,+919876543211,priya@example.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-template-${batchName.replace(/\s+/g, "-")}.csv`;
    a.click();
  };

  return (
    <div className="p-5 space-y-5">

      {/* Action bar */}
      {view === "idle" && (
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={() => setView("single")} className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Student
          </Button>
          <Button size="sm" variant="outline" onClick={() => setView("bulk")} className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={downloadTemplate} className="gap-2 text-muted-foreground">
            <Download className="w-4 h-4" /> Download Template
          </Button>
        </div>
      )}

      {/* Single form */}
      <AnimatePresence>
        {view === "single" && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSingleCreate}
            className="bg-secondary/30 border border-border rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Add Single Student</h4>
              <button type="button" onClick={() => { setView("idle"); setSingleError(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {singleError && (
              <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{singleError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input required placeholder="Full Name *" value={singleForm.fullName}
                onChange={e => setSingleForm({ ...singleForm, fullName: e.target.value })}
                className="h-10 px-4 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
              <input required placeholder="+91xxxxxxxxxx *" value={singleForm.phoneNumber}
                onChange={e => setSingleForm({ ...singleForm, phoneNumber: e.target.value })}
                className="h-10 px-4 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
              <input required type="email" placeholder="Email *" value={singleForm.email}
                onChange={e => setSingleForm({ ...singleForm, email: e.target.value })}
                className="h-10 px-4 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={createStudent.isPending || !singleForm.fullName || !singleForm.phoneNumber || !singleForm.email}>
                {createStudent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Enroll"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setView("idle"); setSingleError(""); }}>Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Bulk CSV */}
      <AnimatePresence>
        {view === "bulk" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-secondary/30 border border-border rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Bulk Import Students</h4>
              <button onClick={() => { setView("idle"); setCsvPreview([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" /> Choose CSV File
              </Button>
              <Button size="sm" variant="ghost" onClick={downloadTemplate} className="gap-2 text-muted-foreground">
                <Download className="w-4 h-4" /> Template
              </Button>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
            </div>

            {csvPreview.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground">{csvPreview.length} students found in CSV</div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase">#</th>
                        <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">Phone</th>
                        <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((s, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 text-foreground">{s.fullName}</td>
                          <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{s.phoneNumber}</td>
                          <td className="px-3 py-2 text-muted-foreground">{s.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkImport} disabled={bulkCreate.isPending} className="gap-2">
                    {bulkCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import {csvPreview.length} Students
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCsvPreview([])}>Clear</Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result view */}
      <AnimatePresence>
        {view === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Single result */}
            {singleResult && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-emerald-600 mb-2">✓ Student created & enrolled</p>
                <p className="text-sm text-foreground font-medium">{singleResult.fullName}</p>
                <p className="text-xs text-muted-foreground">{singleResult.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Temp Password:</span>
                  <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">{singleResult.tempPassword}</code>
                  <CopyBtn text={singleResult.tempPassword} />
                </div>
              </div>
            )}

            {/* Bulk result */}
            {bulkResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{bulkResult.summary.created}</p>
                    <p className="text-xs text-emerald-600 font-medium">Created</p>
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-500">{bulkResult.summary.skipped}</p>
                    <p className="text-xs text-orange-600 font-medium">Skipped</p>
                  </div>
                  <div className="bg-secondary border border-border rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{bulkResult.summary.total}</p>
                    <p className="text-xs text-muted-foreground font-medium">Total</p>
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">Email</th>
                        <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Password</th>
                        <th className="text-left px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResult.results.map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 font-medium text-foreground">{r.fullName}</td>
                          <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell text-xs">{r.email}</td>
                          <td className="px-3 py-2">
                            {r.tempPassword ? (
                              <div className="flex items-center gap-1.5">
                                <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">{r.tempPassword}</code>
                                <CopyBtn text={r.tempPassword} />
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === "created" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"}`}>
                              {r.status === "created" ? "✓ created" : r.error || "skipped"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button size="sm" variant="outline" onClick={() => { setView("idle"); setSingleResult(null); setBulkResult(null); }}>
              Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roster */}
      {view === "idle" && (
        rosterLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : rosterList.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No students enrolled yet</p>
            <p className="text-xs mt-1">Add individual students or import via CSV above.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">Streak</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Last Score</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase hidden lg:table-cell">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {rosterList.map((s: any) => (
                  <tr key={s.studentId} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(s.name || s.fullName || "S").charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{s.name || s.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{s.phone || s.phoneNumber || "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm font-semibold text-foreground">🔥 {s.streakDays ?? s.currentStreak ?? 0}d</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.lastTestScore != null ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.lastTestScore >= 60 ? "bg-emerald-500/10 text-emerald-600" : s.lastTestScore >= 40 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-500"}`}>
                          {s.lastTestScore}%
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

// ─── Course thumbnail (shared with dashboard) ─────────────────────────────────

const EXAM_STYLES: Record<string, { from: string; to: string; badge: string }> = {
  jee:     { from: "#1D4ED8", to: "#4F46E5", badge: "JEE"  },
  neet:    { from: "#059669", to: "#0D9488", badge: "NEET" },
  both:    { from: "#7C3AED", to: "#C026D3", badge: "ALL"  },
  default: { from: "#0F172A", to: "#334155", badge: "—"    },
};

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").origin; }
  catch { return "http://localhost:3000"; }
})();
function resolveMediaUrl(url?: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${_API_ORIGIN}${url}`;
}

function CourseThumbnail({ name, examTarget, imageUrl, className = "" }: {
  name: string; examTarget: string; imageUrl?: string; className?: string;
}) {
  const [imgError, setImgError] = React.useState(false);
  const style = EXAM_STYLES[examTarget?.toLowerCase()] ?? EXAM_STYLES.default;
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  const resolvedUrl = resolveMediaUrl(imageUrl);
  if (resolvedUrl && !imgError) {
    return (
      <div className={`rounded-2xl overflow-hidden shrink-0 ${className}`}>
        <img src={resolvedUrl} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
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
      <span className="text-white font-black text-xl relative z-10 leading-none">{initials}</span>
      <span className="text-white/60 text-[9px] font-black uppercase tracking-widest mt-1 relative z-10">{style.badge}</span>
    </div>
  );
}

// ─── Main BatchesPage ──────────────────────────────────────────────────────────

const statusColor: Record<string, { pill: string; dot: string }> = {
  active:    { pill: "bg-emerald-50 text-emerald-600 border border-emerald-100",  dot: "bg-emerald-500" },
  inactive:  { pill: "bg-slate-100 text-slate-500 border border-slate-200",        dot: "bg-slate-400"   },
  completed: { pill: "bg-blue-50 text-blue-600 border border-blue-100",            dot: "bg-blue-500"    },
};

// ─── Attendance Tab ───────────────────────────────────────────────────────────

function AttendanceTab({ batchId }: { batchId: string }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [liveView, setLiveView] = useState<"all" | "active" | "studied">("all");

  // Live attendance (auto-refreshes every 30s)
  const { data: live, isLoading: liveLoading, dataUpdatedAt } = useBatchLiveAttendance(batchId);

  // Monthly heatmap
  const firstDay = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
  const startDate = firstDay.toISOString().split("T")[0];
  const endDate = lastDay.toISOString().split("T")[0];
  const monthLabel = firstDay.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const { data: heatmapData, isLoading: heatmapLoading } = useBatchAttendance(batchId, startDate, endDate);

  // Build heatmap
  const watchMap: Record<string, number> = {};
  if (heatmapData) {
    const items = Array.isArray(heatmapData) ? heatmapData : heatmapData.attendance ?? heatmapData.data ?? [];
    items.forEach((item: any) => {
      const d = item.date ?? item.day;
      if (d) watchMap[d] = (watchMap[d] ?? 0) + (item.watched ? 1 : item.count ?? 0);
    });
  }
  const totalStudentsHeatmap = live?.totalStudents ?? Object.keys(watchMap).length;
  const calDays: { date: string; count: number }[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    calDays.push({ date: key, count: watchMap[key] ?? 0 });
  }
  const intensity = (count: number) => {
    if (!totalStudentsHeatmap || count === 0) return "bg-secondary";
    const pct = count / totalStudentsHeatmap;
    if (pct >= 0.8) return "bg-emerald-500";
    if (pct >= 0.5) return "bg-emerald-400";
    if (pct >= 0.25) return "bg-emerald-300";
    return "bg-emerald-200";
  };
  const startPad = firstDay.getDay();

  // Filtered student list
  const filteredStudents = (live?.students ?? []).filter(s => {
    if (liveView === "active") return s.isActiveNow;
    if (liveView === "studied") return s.studiedToday;
    return true;
  });

  const lastRefreshed = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="p-5 space-y-5">

      {/* ── Live Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Active now */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">Active Now</span>
          </div>
          {liveLoading
            ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mt-1" />
            : <p className="text-3xl font-black text-emerald-400">{live?.activeNowCount ?? 0}</p>
          }
          <p className="text-xs text-muted-foreground">of {live?.totalStudents ?? "—"} students</p>
        </div>

        {/* Studied today */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Studied Today</span>
          {liveLoading
            ? <Loader2 className="w-5 h-5 animate-spin text-blue-400 mt-1" />
            : <p className="text-3xl font-black text-blue-400">{live?.studiedTodayCount ?? 0}</p>
          }
          <p className="text-xs text-muted-foreground">
            {live && live.totalStudents > 0
              ? `${Math.round((live.studiedTodayCount / live.totalStudents) * 100)}% attendance`
              : "—"}
          </p>
        </div>

        {/* Not active */}
        <div className="bg-secondary border border-border rounded-2xl p-4 flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inactive Today</span>
          {liveLoading
            ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-1" />
            : <p className="text-3xl font-black text-foreground">{(live?.totalStudents ?? 0) - (live?.studiedTodayCount ?? 0)}</p>
          }
          <p className="text-xs text-muted-foreground">haven't opened app</p>
        </div>
      </div>

      {lastRefreshed && (
        <p className="text-xs text-muted-foreground text-right -mt-2">Auto-refreshes every 30s · Last at {lastRefreshed}</p>
      )}

      {/* ── Student List ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Students</p>
          <div className="flex gap-1">
            {(["all", "active", "studied"] as const).map(v => (
              <button key={v} onClick={() => setLiveView(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${liveView === v ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {v === "all" ? `All (${live?.totalStudents ?? 0})` : v === "active" ? `🟢 Active (${live?.activeNowCount ?? 0})` : `📚 Studied (${live?.studiedTodayCount ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {liveLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{liveView === "active" ? "No students active right now" : liveView === "studied" ? "No students have studied today yet" : "No students found"}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase">Student</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase hidden md:table-cell">Today's Activity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase hidden lg:table-cell">Streak</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.studentId} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {(s.name || "S").charAt(0)}
                          </div>
                          {s.isActiveNow && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <span className="font-medium text-foreground text-sm">{s.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {s.isActiveNow ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                        </span>
                      ) : s.studiedToday ? (
                        <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Studied today</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.lecturesWatchedToday > 0 && (
                          <span className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">
                            {s.lecturesWatchedToday} lecture{s.lecturesWatchedToday > 1 ? "s" : ""}
                          </span>
                        )}
                        {s.testsGivenToday > 0 && (
                          <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                            {s.testsGivenToday} quiz{s.testsGivenToday > 1 ? "zes" : ""}
                          </span>
                        )}
                        {s.currentActivity && s.isActiveNow && (
                          <span className="text-xs text-emerald-400 italic">{s.currentActivity}</span>
                        )}
                        {!s.lecturesWatchedToday && !s.testsGivenToday && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-semibold text-foreground">🔥 {s.streakDays}d</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {s.lastLoginAt
                          ? (() => {
                              const diff = Date.now() - new Date(s.lastLoginAt).getTime();
                              const mins = Math.floor(diff / 60000);
                              if (mins < 1) return "Just now";
                              if (mins < 60) return `${mins}m ago`;
                              const hrs = Math.floor(mins / 60);
                              if (hrs < 24) return `${hrs}h ago`;
                              return new Date(s.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                            })()
                          : "Never"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Monthly Heatmap ── */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Monthly Overview</p>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{monthLabel}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setMonthOffset(o => o - 1)}
              className="px-2.5 py-1 rounded-lg text-xs bg-secondary hover:bg-border transition-colors">← Prev</button>
            <button onClick={() => setMonthOffset(0)}
              className="px-2.5 py-1 rounded-lg text-xs bg-secondary hover:bg-border transition-colors">Today</button>
            <button onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0}
              className="px-2.5 py-1 rounded-lg text-xs bg-secondary hover:bg-border transition-colors disabled:opacity-40">Next →</button>
          </div>
        </div>

        {heatmapLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {calDays.map(({ date, count }) => {
                const d = new Date(date);
                const isToday = date === new Date().toISOString().split("T")[0];
                return (
                  <div key={date} title={`${date}: ${count} student${count !== 1 ? "s" : ""} watched`}
                    className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0 cursor-default transition-all hover:scale-110 ${intensity(count)} ${isToday ? "ring-2 ring-white/60" : ""}`}>
                    <span className={`text-[11px] font-bold leading-none ${count > 0 ? "text-white" : "text-muted-foreground"}`}>
                      {d.getDate()}
                    </span>
                    {count > 0 && (
                      <span className="text-[9px] leading-none text-white/80 font-semibold mt-0.5">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Less</span>
              {["bg-secondary","bg-emerald-200","bg-emerald-300","bg-emerald-400","bg-emerald-500"].map(c => (
                <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
              ))}
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

function PerformanceTab({ batchId }: { batchId: string }) {
  const { data, isLoading } = useBatchPerformance(batchId);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!data) return <div className="text-center py-12 text-muted-foreground text-sm">No performance data yet.</div>;

  const topStudents: any[] = data.topStudents ?? data.top ?? [];
  const bottomStudents: any[] = data.bottomStudents ?? data.bottom ?? [];
  const avgScore = data.averageAccuracy ?? data.avgScore ?? data.averageScore ?? 0;
  const testCount = data.testCount ?? data.totalTests ?? 0;

  return (
    <div className="p-5 space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Avg Accuracy", value: `${Math.round(avgScore)}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Tests Taken", value: testCount, icon: BarChart3, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Top Score", value: topStudents[0] ? `${Math.round(topStudents[0].accuracy ?? topStudents[0].score ?? 0)}%` : "—", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-secondary rounded-xl p-3 text-center">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top students */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Top Students
          </p>
          {topStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {topStudents.slice(0, 5).map((s: any, i: number) => (
                <div key={s.studentId ?? i} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">
                  <span className="text-sm font-bold text-emerald-600 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name ?? s.studentName ?? "—"}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{Math.round(s.accuracy ?? s.score ?? 0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom students */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Needs Attention
          </p>
          {bottomStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {bottomStudents.slice(0, 5).map((s: any, i: number) => (
                <div key={s.studentId ?? i} className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl px-3 py-2">
                  <span className="text-sm font-bold text-rose-500 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name ?? s.studentName ?? "—"}</p>
                  </div>
                  <span className="text-sm font-bold text-rose-500">{Math.round(s.accuracy ?? s.score ?? 0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Batch Modal ─────────────────────────────────────────────────────────

function EditBatchModal({ batch, onClose }: { batch: any; onClose: () => void }) {
  const updateBatch = useUpdateBatch();
  const uploadBatchThumbnail = useUploadBatchThumbnail();
  const editThumbRef = useRef<HTMLInputElement>(null);

  const resolvedInitialThumb = (() => {
    const url = batch.thumbnailUrl ?? "";
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${getApiOrigin() || "http://127.0.0.1:3000"}${url}`;
  })();

  const [form, setForm] = useState({
    name: batch.name ?? "",
    description: batch.description ?? "",
    examTarget: batch.examTarget ?? "jee",
    class: batch.class ?? "11",
    isPaid: batch.isPaid ?? (batch.feeAmount ? true : false),
    feeAmount: batch.feeAmount ? String(batch.feeAmount) : "",
    startDate: batch.startDate ? batch.startDate.split("T")[0] : "",
    endDate: batch.endDate ? batch.endDate.split("T")[0] : "",
    thumbnailUrl: batch.thumbnailUrl ?? "",
  });
  const [editThumbPreview, setEditThumbPreview] = useState<string>(resolvedInitialThumb);
  const [editThumbUploading, setEditThumbUploading] = useState(false);
  const [error, setError] = useState("");

  const handleEditThumbFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Thumbnail must be under 5 MB"); return; }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Only PNG, JPG or WEBP images allowed"); return; }
    setEditThumbUploading(true);
    const reader = new FileReader();
    reader.onload = ev => setEditThumbPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const { thumbnailUrl } = await uploadBatchThumbnail.mutateAsync({ batchId: batch.id, file });
      setForm(f => ({ ...f, thumbnailUrl }));
      toast.success("Thumbnail updated");
    } catch {
      toast.error("Thumbnail upload failed — please try again");
      setEditThumbPreview(resolvedInitialThumb);
    } finally {
      setEditThumbUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.isPaid && (!form.feeAmount || Number(form.feeAmount) <= 0)) {
      setError("Fee amount is required and must be greater than 0 for paid courses.");
      return;
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
      toast.success("Course updated successfully");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update course.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Edit Course</h3>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[240px]">{batch.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Basic Info */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Course Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Course Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Exam Target</label>
                  <select value={form.examTarget} onChange={e => setForm({ ...form, examTarget: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all">
                    <option value="jee">JEE</option>
                    <option value="neet">NEET</option>
                    <option value="both">Both / General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Class Level</label>
                  <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all">
                    {["8","9","10","11","12","DROPPER"].map(c => (
                      <option key={c} value={c}>{c === "DROPPER" ? "Dropper" : `Class ${c}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Course Pricing</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button type="button"
                  onClick={() => setForm({ ...form, isPaid: false, feeAmount: "" })}
                  className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                    !form.isPaid ? "border-emerald-400 bg-emerald-50/60" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    !form.isPaid ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}>
                    <Unlock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className={`text-xs font-black ${!form.isPaid ? "text-emerald-700" : "text-slate-500"}`}>Free</p>
                    <p className="text-[10px] text-slate-400">Open access</p>
                  </div>
                  {!form.isPaid && <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-2 h-2 text-white" /></div>}
                </button>
                <button type="button"
                  onClick={() => setForm({ ...form, isPaid: true })}
                  className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                    form.isPaid ? "border-blue-400 bg-blue-50/60" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    form.isPaid ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
                  }`}>
                    <IndianRupee className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className={`text-xs font-black ${form.isPaid ? "text-blue-700" : "text-slate-500"}`}>Paid</p>
                    <p className="text-[10px] text-slate-400">Set a fee</p>
                  </div>
                  {form.isPaid && <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center"><Check className="w-2 h-2 text-white" /></div>}
                </button>
              </div>

              <AnimatePresence>
                {form.isPaid && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input type="number" required={form.isPaid} min={1} placeholder="Enter fee amount"
                        value={form.feeAmount} onChange={e => setForm({ ...form, feeAmount: e.target.value })}
                        className="w-full h-11 pl-8 pr-4 bg-white border-2 border-blue-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:font-normal placeholder:text-slate-400" />
                    </div>
                    {form.feeAmount && Number(form.feeAmount) > 0 && (() => {
                      const total = Number(form.feeAmount);
                      const platform = Math.round(total * 0.2 * 100) / 100;
                      const institute = Math.round(total * 0.8 * 100) / 100;
                      return (
                        <div className="rounded-xl overflow-hidden border border-slate-100">
                          <div className="bg-slate-900 px-3 py-2 flex items-center gap-2">
                            <BadgePercent className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Revenue Split</span>
                          </div>
                          <div className="flex h-1.5">
                            <div className="bg-amber-400" style={{ width: "20%" }} />
                            <div className="bg-emerald-500 flex-1" />
                          </div>
                          <div className="p-3 grid grid-cols-2 gap-2 bg-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                <Building2 className="w-3 h-3 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Platform (20%)</p>
                                <p className="text-sm font-black text-amber-600">₹{platform.toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-3 h-3 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">You Earn (80%)</p>
                                <p className="text-sm font-black text-emerald-600">₹{institute.toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Thumbnail */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Course Thumbnail</p>
              <input ref={editThumbRef} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleEditThumbFile(e.target.files[0]); }} />
              <button type="button" onClick={() => editThumbRef.current?.click()}
                className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all overflow-hidden relative">
                {editThumbUploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs">Uploading…</span></>
                ) : editThumbPreview ? (
                  <>
                    <img src={editThumbPreview} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
                    <span className="relative z-10 flex items-center gap-1 text-xs font-bold bg-white/90 px-3 py-1.5 rounded-xl shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5" /> Change thumbnail
                    </span>
                  </>
                ) : (
                  <><ImageIcon className="w-6 h-6 opacity-30" /><span className="text-xs font-semibold">Click to upload thumbnail</span></>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-2xl h-11">Cancel</Button>
            <Button type="submit" disabled={updateBatch.isPending || editThumbUploading || (form.isPaid && !form.feeAmount)}
              className="flex-1 rounded-2xl h-11 font-black" style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
              {updateBatch.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main BatchesPage ──────────────────────────────────────────────────────────

const BatchesPage = () => {
  const navigate = useNavigate();
  const { data: batches, isLoading } = useBatches();
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  const uploadBatchThumbnail = useUploadBatchThumbnail();

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", examTarget: "jee", class: "11",
    isPaid: false, feeAmount: "", startDate: "", endDate: "",
  });
  const [thumbPreview, setThumbPreview] = useState<string>("");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [editBatch, setEditBatch] = useState<any | null>(null);

  const batchList = Array.isArray(batches) ? batches : [];

  const resetForm = () => {
    setForm({ name: "", description: "", examTarget: "jee", class: "11", isPaid: false, feeAmount: "", startDate: "", endDate: "" });
    setThumbPreview("");
    setThumbFile(null);
    setFormError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (form.isPaid && (!form.feeAmount || Number(form.feeAmount) <= 0)) {
      setFormError("Fee amount is required and must be greater than 0 for paid courses.");
      return;
    }
    try {
      const batch = await createBatch.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        examTarget: form.examTarget,
        class: form.class,
        isPaid: form.isPaid,
        feeAmount: form.isPaid && form.feeAmount ? Number(form.feeAmount) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      // Upload thumbnail after batch is created (needs the batchId)
      if (thumbFile && batch?.id) {
        setThumbUploading(true);
        try {
          await uploadBatchThumbnail.mutateAsync({ batchId: batch.id, file: thumbFile });
        } catch {
          toast.error("Course created but thumbnail upload failed. You can re-upload from the edit form.");
        } finally {
          setThumbUploading(false);
        }
      }
      toast.success("Course created successfully!");
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to create course.");
    }
  };

  const handleThumbFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Thumbnail must be under 5 MB"); return; }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) { toast.error("Only PNG, JPG or WEBP images allowed"); return; }
    setThumbFile(file);
    const reader = new FileReader();
    reader.onload = ev => setThumbPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this batch? It must have no enrolled students.")) {
      try {
        await deleteBatch.mutateAsync(id);
      } catch (err: any) {
        alert(err?.response?.data?.message || "Failed to delete batch.");
      }
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateBatch.mutateAsync({ id, status });
      toast.success(`Batch marked as ${status}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-6 pb-20">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900">Courses</h1>
          <p className="text-sm text-slate-400 mt-0.5">{batchList.length} course{batchList.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Course"}
        </button>
      </motion.div>

      {/* ── Create form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onSubmit={handleCreate}
            className="bg-white border border-slate-100 rounded-3xl p-6 space-y-5 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">New Course</h3>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            {/* Row 1: Name + Exam + Class */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 px-1">Course Name *</label>
                <input required placeholder="e.g. JEE 2026 Batch A" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 px-1">Exam Target *</label>
                <select value={form.examTarget} onChange={e => setForm({ ...form, examTarget: e.target.value })}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400">
                  <option value="jee">JEE</option>
                  <option value="neet">NEET</option>
                  <option value="both">Both / General</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 px-1">Class Level *</label>
                <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400">
                  {["8", "9", "10", "11", "12", "DROPPER"].map(c => (
                    <option key={c} value={c}>{c === "DROPPER" ? "Dropper" : `Class ${c}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 px-1">Course Description</label>
              <textarea
                rows={3}
                placeholder="What will students learn? Topics covered, prerequisites, outcomes…"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors resize-none"
              />
            </div>

            {/* Row 2: Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 px-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 px-1">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors" />
              </div>
            </div>

            {/* Row 3: Pricing */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 px-1 block">Course Pricing *</label>
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => setForm({ ...form, isPaid: false, feeAmount: "" })}
                  className={`flex-1 h-12 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    !form.isPaid
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                  }`}>
                  <CheckCircle2 className={`w-4 h-4 ${!form.isPaid ? "text-emerald-500" : "text-slate-300"}`} />
                  Free Course
                </button>
                <button type="button"
                  onClick={() => setForm({ ...form, isPaid: true })}
                  className={`flex-1 h-12 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    form.isPaid
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                  }`}>
                  <IndianRupee className={`w-4 h-4 ${form.isPaid ? "text-blue-500" : "text-slate-300"}`} />
                  Paid Course
                </button>
              </div>

              {form.isPaid && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 px-1">Fee Amount (₹) *</label>
                    <input
                      type="number" min={1} required={form.isPaid}
                      placeholder="Enter fee amount in INR"
                      value={form.feeAmount}
                      onChange={e => setForm({ ...form, feeAmount: e.target.value })}
                      className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                  {/* Revenue split info */}
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                    <IndianRupee className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex-1 text-xs text-blue-700">
                      <span className="font-black">Revenue split:</span>
                      {" "}
                      <span className="font-semibold">80% → Your Institute</span>
                      <span className="text-blue-400 mx-1">·</span>
                      <span className="font-semibold">20% → Platform</span>
                      {form.feeAmount && Number(form.feeAmount) > 0 && (
                        <span className="ml-2 text-blue-500">
                          (You earn ₹{Math.round(Number(form.feeAmount) * 0.8)} per student)
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Row 4: Thumbnail */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 px-1">Course Thumbnail</label>
              <input ref={thumbInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleThumbFile(e.target.files[0]); e.target.value = ""; }} />
              <button type="button" onClick={() => thumbInputRef.current?.click()}
                className="h-28 flex flex-col items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors overflow-hidden relative">
                {thumbPreview ? (
                  <>
                    <img src={thumbPreview} className="absolute inset-0 w-full h-full object-cover" alt="" />
                    <div className="relative z-10 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5" /> Click to change image
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-7 h-7 opacity-30" />
                    <span className="text-xs font-semibold">Upload course thumbnail</span>
                    <span className="text-[11px] text-slate-300">PNG, JPG, WEBP · max 5 MB</span>
                  </>
                )}
              </button>
              {thumbFile && (
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 mt-0.5">
                  <span>{thumbFile.name}</span>
                  <button type="button" onClick={() => { setThumbFile(null); setThumbPreview(""); }} className="text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit"
                disabled={createBatch.isPending || !form.name || thumbUploading || (form.isPaid && !form.feeAmount)}
                className="flex-1 h-11 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
                {createBatch.isPending || thumbUploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {thumbUploading ? "Uploading thumbnail…" : "Creating…"}</>
                  : "Create Course"
                }
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Course list ── */}
      {batchList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200">
          <Layout className="w-12 h-12 text-gray-800 mb-3" />
          <p className="text-sm font-bold text-slate-400">No courses yet</p>
          <p className="text-xs text-gray-600 mt-1">Create your first course to start enrolling students.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batchList.map((b: any, _bIdx: number) => {
            const sc = statusColor[b.status] ?? statusColor.inactive;
            const enrolled = b.enrolledCount ?? b.studentCount ?? 0;
            const examStyle = EXAM_STYLES[b.examTarget?.toLowerCase()] ?? EXAM_STYLES.default;
            return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: _bIdx * 0.05 }}
            >
              {/* Course card header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/batches/${b.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/admin/batches/${b.id}`);
                  }
                }}
                className="w-full bg-white border border-slate-100 rounded-3xl px-5 py-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all text-left group"
              >
                <CourseThumbnail name={b.name} examTarget={b.examTarget} imageUrl={b.thumbnailUrl} className="w-16 h-16" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-black text-slate-900 text-base truncate group-hover:text-blue-700 transition-colors">{b.name}</p>
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${sc.pill}`}>
                      {b.status}
                    </span>
                    {/* Paid / Free badge */}
                    {b.isPaid ? (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        <IndianRupee className="w-2.5 h-2.5" />
                        {Number(b.feeAmount).toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        FREE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase mb-2">
                    {b.examTarget?.toUpperCase()} · Class {b.class}
                    {b.teacher?.fullName && ` · ${b.teacher.fullName}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-500">{enrolled} students</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Deactivate / Activate / Complete */}
                  {b.status === "active" && (
                    <button onClick={e => { e.stopPropagation(); handleStatusChange(b.id, "inactive"); }}
                      title="Deactivate course"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all">
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}
                  {b.status === "inactive" && (
                    <button onClick={e => { e.stopPropagation(); handleStatusChange(b.id, "active"); }}
                      title="Re-activate course"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}
                  {b.status !== "completed" ? (
                    <button onClick={e => { e.stopPropagation(); handleStatusChange(b.id, "completed"); }}
                      title="Mark as completed"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); handleStatusChange(b.id, "active"); }}
                      title="Mark as incomplete (reopen)"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-violet-500 bg-violet-50 hover:text-violet-700 hover:bg-violet-100 transition-all">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); setEditBatch(b); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Edit course">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Delete course">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

            </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Course Modal */}
      <AnimatePresence>
        {editBatch && (
          <EditBatchModal
            batch={editBatch}
            onClose={() => setEditBatch(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BatchesPage;
