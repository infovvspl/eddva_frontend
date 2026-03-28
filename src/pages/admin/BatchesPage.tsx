import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Trash2, Users, X, ChevronDown, ChevronRight,
  UserPlus, Upload, Download, Copy, Check, AlertCircle,
  Layout, Calendar, GraduationCap, BarChart3, Edit2,
  Trophy, TrendingDown, TrendingUp, DollarSign, CheckCircle2,
  PauseCircle, PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch, useTeachers,
  useBatchRoster, useCreateBatchStudent, useBulkCreateBatchStudents,
  useSubjectTeachers, useAssignSubjectTeacher, useRemoveSubjectTeacher,
  useBatchAttendance, useBatchPerformance, useBatchLiveAttendance,
} from "@/hooks/use-admin";
import type { BatchStudentRow, BulkStudentResult } from "@/lib/api/admin";
import { toast } from "sonner";

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

// ─── Main BatchesPage ──────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  inactive: "bg-gray-400/10 text-gray-500",
  completed: "bg-blue-500/10 text-blue-600",
};

type BatchTab = "students" | "teacher" | "attendance" | "performance";

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

function EditBatchModal({ batch, teachers, onClose }: { batch: any; teachers: any[]; onClose: () => void }) {
  const updateBatch = useUpdateBatch();
  const [form, setForm] = useState({
    name: batch.name ?? "",
    examTarget: batch.examTarget ?? "jee",
    class: batch.class ?? "11",
    teacherId: batch.teacher?.id ?? batch.teacherId ?? "",
    maxStudents: batch.maxStudents ?? 60,
    feeAmount: batch.feeAmount ?? "",
    startDate: batch.startDate ? batch.startDate.split("T")[0] : "",
    endDate: batch.endDate ? batch.endDate.split("T")[0] : "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await updateBatch.mutateAsync({
        id: batch.id,
        name: form.name,
        examTarget: form.examTarget,
        class: form.class,
        teacherId: form.teacherId || undefined,
        maxStudents: form.maxStudents,
        feeAmount: form.feeAmount ? Number(form.feeAmount) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      toast.success("Batch updated");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update batch.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">Edit Batch</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Batch Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Exam Target</label>
              <select value={form.examTarget} onChange={e => setForm({ ...form, examTarget: e.target.value })}
                className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                <option value="jee">JEE</option>
                <option value="neet">NEET</option>
                <option value="both">Both / General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Class Level</label>
              <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}
                className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                {["8","9","10","11","12","DROPPER"].map(c => (
                  <option key={c} value={c}>{c === "DROPPER" ? "Dropper" : `Class ${c}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Assign Teacher</label>
              <select value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}
                className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                <option value="">None</option>
                {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Max Students</label>
              <input type="number" value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: +e.target.value })}
                className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Fee Amount (₹)</label>
              <input type="number" placeholder="0" value={form.feeAmount} onChange={e => setForm({ ...form, feeAmount: e.target.value })}
                className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={updateBatch.isPending} className="flex-1">
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
  const { data: batches, isLoading } = useBatches();
  const { data: teachers } = useTeachers();
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "", examTarget: "jee", class: "11", teacherId: "",
    maxStudents: 60, feeAmount: "", startDate: "", endDate: "",
  });
  const [expandedId, setExpandedId] = useState<string>("");
  const [batchTab, setBatchTab] = useState<Record<string, BatchTab>>({});
  const [editBatch, setEditBatch] = useState<any | null>(null);

  const batchList = Array.isArray(batches) ? batches : [];
  const teacherList = Array.isArray(teachers) ? teachers : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await createBatch.mutateAsync({
        name: form.name,
        examTarget: form.examTarget,
        class: form.class,
        teacherId: form.teacherId || undefined,
        maxStudents: form.maxStudents,
        feeAmount: form.feeAmount ? Number(form.feeAmount) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      setForm({ name: "", examTarget: "jee", class: "11", teacherId: "", maxStudents: 60, feeAmount: "", startDate: "", endDate: "" });
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to create batch.");
    }
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Batches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{batchList.length} batches total</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setFormError(""); }} className="gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Batch"}
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
          >
            <h3 className="font-semibold text-foreground">New Batch</h3>
            {formError && (
              <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <input required placeholder="Batch Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
              <select value={form.examTarget} onChange={e => setForm({ ...form, examTarget: e.target.value })}
                className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                <option value="jee">JEE</option>
                <option value="neet">NEET</option>
                <option value="both">Both / General</option>
              </select>
              <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}
                className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                {["8", "9", "10", "11", "12", "DROPPER"].map(c => (
                  <option key={c} value={c}>{c === "DROPPER" ? "Dropper" : `Class ${c}`}</option>
                ))}
              </select>
              <select value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}
                className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                <option value="">Assign Teacher (optional)</option>
                {teacherList.map((t: any) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
              <input type="number" placeholder="Max Students (default 60)" value={form.maxStudents} onChange={e => setForm({ ...form, maxStudents: +e.target.value })}
                className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
              <input type="number" placeholder="Fee Amount ₹ (optional)" value={form.feeAmount} onChange={e => setForm({ ...form, feeAmount: e.target.value })}
                className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground px-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground px-1">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <Button type="submit" disabled={createBatch.isPending || !form.name} className="h-11 self-end">
                {createBatch.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Batch"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Batch list */}
      {batchList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Layout className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No batches yet</p>
          <p className="text-sm mt-1">Create your first batch to start enrolling students.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batchList.map((b: any) => (
            <div key={b.id}>
              {/* Batch card header */}
              <button
                onClick={() => setExpandedId(expandedId === b.id ? "" : b.id)}
                className="w-full bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Layout className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{b.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground uppercase">{b.examTarget} · Class {b.class}</span>
                      {b.teacher?.fullName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> {b.teacher.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{b.studentCount ?? 0}/{b.maxStudents}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor[b.status] ?? statusColor.inactive}`}>
                    {b.status}
                  </span>
                  {/* Deactivate / Complete / Activate */}
                  {b.status === "active" && (
                    <button
                      onClick={e => { e.stopPropagation(); handleStatusChange(b.id, "inactive"); }}
                      title="Deactivate batch"
                      className="text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}
                  {b.status === "inactive" && (
                    <button
                      onClick={e => { e.stopPropagation(); handleStatusChange(b.id, "active"); }}
                      title="Re-activate batch"
                      className="text-muted-foreground hover:text-emerald-500 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}
                  {b.status !== "completed" && (
                    <button
                      onClick={e => { e.stopPropagation(); handleStatusChange(b.id, "completed"); }}
                      title="Mark as completed"
                      className="text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  {/* Edit */}
                  <button
                    onClick={e => { e.stopPropagation(); setEditBatch(b); }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Edit batch"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedId === b.id
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded panel */}
              <AnimatePresence>
                {expandedId === b.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card border border-t-0 border-border rounded-b-2xl overflow-hidden"
                  >
                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-border bg-secondary/20 scrollbar-none">
                      {([
                        { id: "students", label: "Students", icon: <Users className="w-4 h-4" /> },
                        { id: "teacher", label: "Teachers", icon: <GraduationCap className="w-4 h-4" /> },
                        { id: "attendance", label: "Attendance", icon: <Calendar className="w-4 h-4" /> },
                        { id: "performance", label: "Performance", icon: <BarChart3 className="w-4 h-4" /> },
                      ] as { id: BatchTab; label: string; icon: React.ReactNode }[]).map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setBatchTab(prev => ({ ...prev, [b.id]: tab.id }))}
                          className={`shrink-0 px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
                            (batchTab[b.id] ?? "students") === tab.id
                              ? "text-primary border-b-2 border-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                    </div>

                    {(batchTab[b.id] ?? "students") === "students" && <StudentImportPanel batchId={b.id} batchName={b.name} />}
                    {(batchTab[b.id] ?? "students") === "teacher" && <TeacherAssignPanel batchId={b.id} teachers={teacherList} />}
                    {(batchTab[b.id] ?? "students") === "attendance" && <AttendanceTab batchId={b.id} />}
                    {(batchTab[b.id] ?? "students") === "performance" && <PerformanceTab batchId={b.id} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Edit Batch Modal */}
      <AnimatePresence>
        {editBatch && (
          <EditBatchModal
            batch={editBatch}
            teachers={teacherList}
            onClose={() => setEditBatch(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BatchesPage;
