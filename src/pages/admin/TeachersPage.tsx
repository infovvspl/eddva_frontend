import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, GraduationCap, X, Copy, Check,
  Upload, Download, AlertCircle, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTeachers, useCreateTeacher, useBulkCreateTeachers } from "@/hooks/use-admin";
import type { BulkTeacherRow } from "@/lib/api/admin";

type View = "list" | "add-single" | "add-bulk" | "created" | "bulk-result";

const TeachersPage = () => {
  const navigate = useNavigate();
  const { data: teachers, isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const bulkCreate = useBulkCreateTeachers();

  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState({ fullName: "", phoneNumber: "", email: "" });
  const [createdResult, setCreatedResult] = useState<{ teacher: any; tempPassword: string } | null>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<BulkTeacherRow[]>([]);
  const [csvError, setCsvError] = useState("");
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const teacherList = Array.isArray(teachers) ? teachers : [];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      const result = await createTeacher.mutateAsync({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber.startsWith("+91") ? form.phoneNumber : `+91${form.phoneNumber}`,
        email: form.email,
      });
      setCreatedResult(result);
      setForm({ fullName: "", phoneNumber: "", email: "" });
      setView("created");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create teacher. Please try again.";
      setFormError(msg);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        setCsvError("CSV must have a header row and at least one data row.");
        return;
      }

      const header = lines[0].toLowerCase().replace(/\r/g, "");
      const cols = header.split(",").map((c) => c.trim());
      const nameIdx = cols.findIndex((c) => c.includes("name"));
      const phoneIdx = cols.findIndex((c) => c.includes("phone"));
      const emailIdx = cols.findIndex((c) => c.includes("email"));

      if (nameIdx === -1 || phoneIdx === -1 || emailIdx === -1) {
        setCsvError("CSV must have columns: name, phone, email (headers required).");
        return;
      }

      const rows: BulkTeacherRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].replace(/\r/g, "").split(",").map((c) => c.trim());
        if (parts.length < 3) continue;
        const fullName = parts[nameIdx];
        let phoneNumber = parts[phoneIdx].replace(/[\s-]/g, "");
        if (!phoneNumber.startsWith("+91")) phoneNumber = `+91${phoneNumber}`;
        const email = parts[emailIdx];
        if (fullName && phoneNumber && email) {
          rows.push({ fullName, phoneNumber, email });
        }
      }

      if (rows.length === 0) {
        setCsvError("No valid rows found. Check CSV format.");
        return;
      }
      setCsvRows(rows);
    };
    reader.readAsText(file);
    // reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleBulkSubmit = async () => {
    const result = await bulkCreate.mutateAsync(csvRows);
    setBulkResult(result);
    setCsvRows([]);
    setView("bulk-result");
  };

  const downloadTemplate = () => {
    const csv = "Full Name,Phone Number,Email\nRajesh Kumar,9876543210,rajesh@example.com\nPriya Sharma,9123456789,priya@example.com\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teachers_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetView = () => {
    setView("list");
    setCreatedResult(null);
    setBulkResult(null);
    setCsvRows([]);
    setCsvError("");
    setFormError("");
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Teachers" subtitle="Faculty management" actions={
        <div className="flex gap-2">
          {view === "list" ? (
            <>
              <Button variant="outline" onClick={() => setView("add-bulk")} className="gap-2">
                <Upload className="w-4 h-4" /> Bulk Import
              </Button>
              <Button onClick={() => setView("add-single")} className="gap-2">
                <Plus className="w-4 h-4" /> Add Teacher
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={resetView} className="gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
          )}
        </div>
      } />

      <AnimatePresence mode="wait">
        {/* ── Single Teacher Form ── */}
        {view === "add-single" && (
          <motion.form key="single" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4"
          >
            {formError && (
              <div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 font-medium">{formError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input required placeholder="Full Name" value={form.fullName}
                onChange={(e) => { setFormError(""); setForm({ ...form, fullName: e.target.value }); }}
                className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary" />
              <div className="flex gap-2">
                <div className="h-11 w-14 bg-secondary border border-border rounded-xl flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">+91</div>
                <input required type="tel" maxLength={10} placeholder="Phone Number" value={form.phoneNumber}
                  onChange={(e) => { setFormError(""); setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, "") }); }}
                  className="h-11 flex-1 px-4 bg-secondary border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary" />
              </div>
              <input required type="email" placeholder="Email" value={form.email}
                onChange={(e) => { setFormError(""); setForm({ ...form, email: e.target.value }); }}
                className="h-11 px-4 bg-secondary border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary" />
              <Button type="submit" disabled={createTeacher.isPending || !form.fullName || form.phoneNumber.length < 10 || !form.email} className="h-11">
                {createTeacher.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Teacher"}
              </Button>
            </div>
          </motion.form>
        )}

        {/* ── Created Result ── */}
        {view === "created" && createdResult && (
          <motion.div key="created" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-foreground">Teacher Created!</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Share these login credentials with <span className="font-medium text-foreground">{createdResult.teacher.fullName}</span>.
              Credentials will also be sent to their email.
            </p>
            <div className="space-y-2 bg-background rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm"><span className="text-muted-foreground">Email:</span> <code className="font-mono font-bold text-foreground ml-2">{createdResult.teacher.email}</code></div>
                <button onClick={() => handleCopy(createdResult.teacher.email, "email")} className="text-primary hover:text-primary/80">
                  {copied === "email" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm"><span className="text-muted-foreground">Temp Password:</span> <code className="font-mono font-bold text-foreground ml-2">{createdResult.tempPassword}</code></div>
                <button onClick={() => handleCopy(createdResult.tempPassword, "pass")} className="text-primary hover:text-primary/80">
                  {copied === "pass" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5" /> Credentials email sent to {createdResult.teacher.email}
            </div>
            <Button variant="ghost" onClick={resetView} className="mt-3 text-sm">Done</Button>
          </motion.div>
        )}

        {/* ── Bulk Import ── */}
        {view === "add-bulk" && (
          <motion.div key="bulk" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Bulk Import Teachers</h3>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs">
                <Download className="w-3.5 h-3.5" /> Download Template
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with columns: <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">Full Name, Phone Number, Email</code>
            </p>

            <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2 mb-4">
              <Upload className="w-4 h-4" /> Choose CSV File
            </Button>

            {csvError && (
              <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                <AlertCircle className="w-4 h-4" /> {csvError}
              </div>
            )}

            {csvRows.length > 0 && (
              <>
                <div className="bg-secondary/50 rounded-xl overflow-hidden mb-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-xs font-bold uppercase text-muted-foreground">#</th>
                        <th className="text-left p-3 text-xs font-bold uppercase text-muted-foreground">Name</th>
                        <th className="text-left p-3 text-xs font-bold uppercase text-muted-foreground">Phone</th>
                        <th className="text-left p-3 text-xs font-bold uppercase text-muted-foreground">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((r, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3 font-medium">{r.fullName}</td>
                          <td className="p-3 text-muted-foreground">{r.phoneNumber}</td>
                          <td className="p-3 text-muted-foreground">{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleBulkSubmit} disabled={bulkCreate.isPending} className="gap-2">
                    {bulkCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import {csvRows.length} Teachers
                  </Button>
                  <Button variant="ghost" onClick={() => { setCsvRows([]); setCsvError(""); }}>Clear</Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Bulk Result ── */}
        {view === "bulk-result" && bulkResult && (
          <motion.div key="bulk-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-foreground">Bulk Import Complete</h3>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-lg text-sm font-bold">{bulkResult.summary.created} Created</div>
              {bulkResult.summary.skipped > 0 && (
                <div className="bg-orange-500/10 text-orange-600 px-3 py-1.5 rounded-lg text-sm font-bold">{bulkResult.summary.skipped} Skipped</div>
              )}
            </div>

            <div className="bg-secondary/50 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-xs font-bold uppercase text-muted-foreground">Name</th>
                    <th className="text-left p-3 text-xs font-bold uppercase text-muted-foreground">Email</th>
                    <th className="text-left p-3 text-xs font-bold uppercase text-muted-foreground">Temp Password</th>
                    <th className="text-left p-3 text-xs font-bold uppercase text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkResult.results.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-3 font-medium">{r.fullName}</td>
                      <td className="p-3 text-muted-foreground">{r.email}</td>
                      <td className="p-3">
                        {r.tempPassword ? (
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold text-foreground">{r.tempPassword}</code>
                            <button onClick={() => handleCopy(r.tempPassword, `bulk-${i}`)} className="text-primary hover:text-primary/80">
                              {copied === `bulk-${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          r.status === "created" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                        }`}>
                          {r.status}
                        </span>
                        {r.error && <span className="text-xs text-red-400 ml-2">{r.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Mail className="w-3.5 h-3.5" /> Credentials emailed to all created teachers
            </div>
            <Button variant="ghost" onClick={resetView} className="mt-3 text-sm">Done</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Teacher List ── */}
      {teacherList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No teachers yet</p>
          <p className="text-sm mt-1">Add your first teacher to get started.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {teacherList.map((t: any) => (
                <tr key={t.id} onClick={() => navigate(`/admin/teachers/${t.id}`)}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {(t.fullName || "T").charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-foreground">{t.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">{t.phoneNumber}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{t.email || "—"}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      (t.status || "").toLowerCase() === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default TeachersPage;
