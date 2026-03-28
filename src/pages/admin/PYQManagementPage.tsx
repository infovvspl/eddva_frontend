import { useState, useRef, useEffect } from "react";
import { CheckCircle, XCircle, Upload, Sparkles, BarChart2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  usePYQStats, useUnverifiedPYQs, useVerifyPYQ, useRejectPYQ,
  useGenerateAIPYQs, useGenerateChapterPYQs, useImportPYQCSV,
} from "@/hooks/use-admin";
import { useSubjects, useChapters, useTopics } from "@/hooks/use-admin";
import { useMyBatches } from "@/hooks/use-teacher";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UnverifiedPYQ } from "@/lib/api/admin";

const EXAM_LABELS: Record<string, string> = {
  jee_mains: "JEE Mains",
  jee_advanced: "JEE Advanced",
  neet: "NEET",
};
const EXAM_LIST = Object.entries(EXAM_LABELS);

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - i);

// ─── Stats Overview ───────────────────────────────────────────────────────────

function StatsOverview() {
  const { data, isLoading, refetch } = usePYQStats();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">PYQ Database Stats</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mx-auto" /></div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.totalVerified}</div>
                <div className="text-xs text-muted-foreground">Verified (live)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-500">{data.totalUnverified}</div>
                <div className="text-xs text-muted-foreground">Pending Review</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">By Exam & Subject</CardTitle></CardHeader>
            <CardContent>
              {data.byExamAndSubject.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {data.byExamAndSubject.map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] w-20 justify-center">{row.examLabel}</Badge>
                      <span className="text-sm flex-1">{row.subject}</span>
                      <span className="text-sm font-medium">{row.verified}<span className="text-muted-foreground">/{row.total}</span></span>
                      <Progress value={row.total > 0 ? (row.verified / row.total) * 100 : 0} className="w-20 h-1.5" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── AI Generate Form ─────────────────────────────────────────────────────────

function GenerateTab() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher";

  const [mode, setMode] = useState<"topic" | "chapter">("topic");
  const [batchId, setBatchId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [startYear, setStartYear] = useState(2015);
  const [endYear, setEndYear] = useState(CURRENT_YEAR);
  const [exams, setExams] = useState<string[]>(["jee_mains", "neet"]);

  // Teacher: load their batches for context + exam auto-detection
  const { data: myBatches } = useMyBatches();
  const { data: subjects } = useSubjects();
  const { data: chapters } = useChapters(subjectId);
  const { data: topics } = useTopics(chapterId);

  const generateTopic = useGenerateAIPYQs();
  const generateChapter = useGenerateChapterPYQs();

  // Auto-select exams based on selected batch's examTarget
  useEffect(() => {
    if (!batchId || !myBatches) return;
    const batch = (myBatches as any[]).find((b: any) => b.id === batchId);
    if (!batch) return;
    const target = (batch.examTarget ?? "").toLowerCase();
    if (target.includes("neet")) setExams(["neet"]);
    else if (target.includes("jee")) setExams(["jee_mains", "jee_advanced"]);
  }, [batchId, myBatches]);

  function toggleExam(exam: string) {
    setExams((prev) => prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]);
  }

  async function handleGenerate() {
    if (exams.length === 0) return toast.error("Select at least one exam");
    if (mode === "topic" && !topicId) return toast.error("Select a topic");
    if (mode === "chapter" && !chapterId) return toast.error("Select a chapter");

    try {
      const payload = { startYear, endYear, exams } as any;
      if (mode === "topic") { payload.topicId = topicId; await generateTopic.mutateAsync(payload); }
      else { payload.chapterId = chapterId; await generateChapter.mutateAsync(payload); }
      toast.success("AI generation started — questions appear in the Review tab shortly");
    } catch {
      toast.error("Generation failed");
    }
  }

  const isBusy = generateTopic.isPending || generateChapter.isPending;
  const selectedBatch = (myBatches as any[])?.find((b: any) => b.id === batchId);

  return (
    <div className="space-y-5 max-w-lg">

      {/* Teacher: Batch selector first */}
      {isTeacher && (
        <Card className="border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium">Select Batch</span>
              <span className="text-xs text-muted-foreground ml-auto">Exam type auto-fills from batch</span>
            </div>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your batch" />
              </SelectTrigger>
              <SelectContent>
                {(myBatches as any[])?.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                    <span className="ml-2 text-xs text-muted-foreground">({b.examTarget})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBatch && (
              <p className="text-xs text-muted-foreground mt-2">
                Generating PYQs for students in <span className="font-medium text-foreground">{selectedBatch.name}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(["topic", "chapter"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
              mode === m ? "bg-indigo-600 text-white border-indigo-600" : "bg-card border-border text-foreground hover:border-indigo-300",
            )}
          >
            {m === "topic" ? "Single Topic" : "Full Chapter"}
          </button>
        ))}
      </div>

      {/* Subject → Chapter → Topic selectors */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Subject</Label>
          <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setChapterId(""); setTopicId(""); }}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {(subjects as any[])?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {subjectId && (
          <div>
            <Label className="text-xs">Chapter</Label>
            <Select value={chapterId} onValueChange={(v) => { setChapterId(v); setTopicId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
              <SelectContent>
                {(chapters as any[])?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {chapterId && mode === "topic" && (
          <div>
            <Label className="text-xs">Topic</Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
              <SelectContent>
                {(topics as any[])?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Year range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">From Year</Label>
          <Select value={String(startYear)} onValueChange={(v) => setStartYear(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">To Year</Label>
          <Select value={String(endYear)} onValueChange={(v) => setEndYear(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Exam selection */}
      <div>
        <Label className="text-xs mb-2 block">Exams to Generate</Label>
        <div className="flex gap-2 flex-wrap">
          {EXAM_LIST.map(([v, l]) => (
            <button
              key={v}
              onClick={() => toggleExam(v)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg border transition-all",
                exams.includes(v) ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-400 text-indigo-700 dark:text-indigo-300" : "bg-card border-border",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isBusy} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
        {isBusy ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate with AI</>}
      </Button>

      <p className="text-xs text-muted-foreground">
        AI generates questions based on real exam patterns. All questions go to the Review queue — you can verify or correct them before students see them.
      </p>
    </div>
  );
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

function ImportTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const importCSV = useImportPYQCSV();

  async function handleUpload() {
    if (!file) return;
    try {
      const res = await importCSV.mutateAsync(file);
      toast.success(`Import done: ${res?.imported ?? "?"} imported, ${res?.skipped ?? 0} skipped`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Import failed — check CSV format");
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Upload PYQ CSV</p>
          <p className="text-xs text-muted-foreground mb-4">Max 10 MB · Required columns: <code>topic_id, pyq_year, pyq_exam, content, type, correct_option_ids</code></p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            {file ? file.name : "Choose CSV file"}
          </Button>
        </CardContent>
      </Card>

      {file && (
        <Button onClick={handleUpload} disabled={importCSV.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
          {importCSV.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Importing…</> : "Import Questions"}
        </Button>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">CSV Format Guide</CardTitle></CardHeader>
        <CardContent>
          <div className="text-xs font-mono bg-muted p-3 rounded overflow-auto whitespace-pre text-muted-foreground">
{`topic_id,pyq_year,pyq_exam,type,difficulty,content,
option_a,option_b,option_c,option_d,
correct_option_ids,solution_text,marks,negative_marks`}
          </div>
          <ul className="text-xs text-muted-foreground mt-3 space-y-1">
            <li>• <code>pyq_exam</code>: jee_mains | jee_advanced | neet</li>
            <li>• <code>type</code>: mcq_single | integer</li>
            <li>• <code>difficulty</code>: easy | medium | hard</li>
            <li>• <code>correct_option_ids</code>: option letter(s) e.g. "a" or "a,c"</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Review Queue ─────────────────────────────────────────────────────────────

function UnverifiedCard({ q }: { q: UnverifiedPYQ }) {
  const [expanded, setExpanded] = useState(true);
  const [editContent, setEditContent] = useState(q.content);
  const [editing, setEditing] = useState(false);
  const verify = useVerifyPYQ();
  const reject = useRejectPYQ();

  async function handleVerify() {
    try {
      await verify.mutateAsync({ questionId: q.id, payload: { isVerified: true, correctedContent: editing ? editContent : undefined } });
      toast.success("Question verified");
    } catch { toast.error("Failed"); }
  }

  async function handleReject() {
    if (!confirm("Reject and delete this question?")) return;
    try {
      await reject.mutateAsync(q.id);
      toast.success("Rejected");
    } catch { toast.error("Failed"); }
  }

  const isBusy = verify.isPending || reject.isPending;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{EXAM_LABELS[q.pyqExam] ?? q.pyqExam} {q.pyqYear}</Badge>
            <Badge variant="outline" className={cn("text-[10px]", q.difficulty === "hard" ? "text-red-600" : q.difficulty === "medium" ? "text-yellow-600" : "text-green-600")}>
              {q.difficulty}
            </Badge>
            {q.topic && <span className="text-xs text-muted-foreground">{q.topic.name}</span>}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Question text — always visible */}
        {editing ? (
          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} className="text-sm mt-2" />
        ) : (
          <p className="text-sm mt-2 leading-relaxed">{q.content}</p>
        )}

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Edit toggle */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id={`edit-${q.id}`} checked={editing} onChange={(e) => setEditing(e.target.checked)} className="rounded" />
              <label htmlFor={`edit-${q.id}`} className="text-xs text-muted-foreground cursor-pointer">Edit question before verifying</label>
            </div>

            {/* Options */}
            <div className="space-y-1.5">
              {q.options.map((opt, i) => (
                <div key={i} className={cn(
                  "text-sm px-3 py-2 rounded-lg border flex items-start gap-2",
                  opt.isCorrect
                    ? "bg-green-50 border-green-300 text-green-800 dark:bg-green-950/30 dark:border-green-700 dark:text-green-200"
                    : "bg-muted/30 border-border",
                )}>
                  <span className="font-mono font-semibold shrink-0 w-5">{opt.optionLabel}.</span>
                  <span className="flex-1">{opt.content}</span>
                  {opt.isCorrect && <span className="text-[10px] text-green-600 dark:text-green-400 font-bold shrink-0">✓ Correct</span>}
                </div>
              ))}
            </div>

            {q.solutionText && (
              <div className="text-xs p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200">
                <span className="font-semibold">Solution: </span>{q.solutionText}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleVerify} disabled={isBusy} className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            {verify.isPending ? "Verifying…" : "Verify"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReject} disabled={isBusy} className="text-red-600 border-red-200 hover:bg-red-50">
            <XCircle className="h-3.5 w-3.5 mr-1" />
            {reject.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewTab() {
  const [filterExam, setFilterExam] = useState("all");
  const [page, setPage] = useState(1);
  const LIMIT = 15;
  const { data, isLoading, refetch } = useUnverifiedPYQs({
    exam: filterExam !== "all" ? filterExam : undefined,
    page,
    limit: LIMIT,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">
            {data?.total ?? "…"} questions awaiting review
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterExam} onValueChange={(v) => { setFilterExam(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All Exams" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {EXAM_LIST.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-500" /></div>
      ) : !data || data.questions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400 opacity-60" />
          <p>All caught up! No questions pending review.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.questions.map((q) => <UnverifiedCard key={q.id} q={q} />)}
          </div>
          {data.total > LIMIT && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(data.total / LIMIT)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(data.total / LIMIT)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PYQManagementPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isTeacher ? "PYQ Generator & Review" : "PYQ Management"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isTeacher
            ? "Generate AI-based Previous Year Questions for your batch topics, then review and verify them"
            : "Manage Previous Year Questions — generate, import, and review"}
        </p>
      </div>

      <Tabs defaultValue={isTeacher ? "generate" : "stats"}>
        <TabsList className="flex-wrap h-auto">
          {!isTeacher && (
            <TabsTrigger value="stats"><BarChart2 className="h-4 w-4 mr-1.5" />Overview</TabsTrigger>
          )}
          <TabsTrigger value="generate"><Sparkles className="h-4 w-4 mr-1.5" />AI Generate</TabsTrigger>
          {!isTeacher && (
            <TabsTrigger value="import"><Upload className="h-4 w-4 mr-1.5" />Import CSV</TabsTrigger>
          )}
          <TabsTrigger value="review"><AlertCircle className="h-4 w-4 mr-1.5" />Review Queue</TabsTrigger>
        </TabsList>

        {!isTeacher && <TabsContent value="stats" className="mt-6"><StatsOverview /></TabsContent>}
        <TabsContent value="generate" className="mt-6"><GenerateTab /></TabsContent>
        {!isTeacher && <TabsContent value="import" className="mt-6"><ImportTab /></TabsContent>}
        <TabsContent value="review" className="mt-6"><ReviewTab /></TabsContent>
      </Tabs>
    </div>
  );
}
