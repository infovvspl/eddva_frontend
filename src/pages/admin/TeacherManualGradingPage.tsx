import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, Minus, Loader2, AlertCircle,
  Save, ChevronRight, Image as ImageIcon, BookOpen, PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessionResult, gradeSessionAnswers, type SessionAttempt } from "@/lib/api/admin";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeBadge(type: string) {
  const map: Record<string, string> = {
    mcq_single:  "bg-blue-100 text-blue-700",
    mcq_multi:   "bg-purple-100 text-purple-700",
    integer:     "bg-amber-100 text-amber-700",
    descriptive: "bg-rose-100 text-rose-700",
  };
  const labels: Record<string, string> = {
    mcq_single: "MCQ", mcq_multi: "MSQ", integer: "Integer", descriptive: "Descriptive",
  };
  return { cls: map[type] ?? "bg-slate-100 text-slate-600", label: labels[type] ?? type };
}

function diffBadge(difficulty: string) {
  const map: Record<string, string> = { easy: "text-emerald-600", medium: "text-amber-600", hard: "text-red-500" };
  return map[difficulty] ?? "text-muted-foreground";
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className={cn("fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2",
        ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}
    >
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </motion.div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  attempt, index, gradeValue, onGradeChange,
}: {
  attempt: SessionAttempt;
  index: number;
  gradeValue: number;
  onGradeChange: (qId: string, v: number) => void;
}) {
  const q = attempt.question;
  if (!q) return null;
  const { cls, label } = typeBadge(q.type);
  const isDescriptive = q.type === "descriptive";
  const isAutoGraded = !isDescriptive;

  const correctIds = (q.options ?? []).filter(o => o.isCorrect).map(o => o.id);
  const selectedIds = attempt.selectedOptionIds ?? [];
  const studentAnswer = attempt.integerAnswer ?? null;
  const modelAnswer = q.integerAnswer ?? q.solutionText ?? (q as any).solution_text ?? null;
  const aiMarks = attempt.marksAwarded ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="border border-border rounded-xl overflow-hidden bg-card"
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border">
        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cls)}>{label}</span>
        <span className={cn("text-xs font-medium capitalize", diffBadge(q.difficulty))}>{q.difficulty}</span>
        <span className="ml-auto text-xs text-muted-foreground">{q.marksCorrect} marks</span>
        {isAutoGraded && (
          attempt.isCorrect === true
            ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Correct</span>
            : attempt.isCorrect === false
              ? <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle className="w-3.5 h-3.5" />Wrong</span>
              : <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium"><Minus className="w-3.5 h-3.5" />Skipped</span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Question text */}
        <p className="text-sm leading-relaxed">{q.content}</p>
        {(q as any).contentImageUrl || (q as any).content_image_url ? (
          <img
            src={(q as any).contentImageUrl || (q as any).content_image_url}
            alt="Question"
            className="max-h-40 rounded-lg border border-border object-contain"
          />
        ) : null}

        {/* MCQ Options */}
        {q.options && q.options.length > 0 && (
          <div className="space-y-1.5">
            {q.options.map(opt => {
              const isSelected = selectedIds.includes(opt.id);
              const isCorrect = opt.isCorrect;
              return (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 rounded-lg text-sm border transition-colors",
                    isCorrect && isSelected ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700" :
                    isCorrect ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-900/10" :
                    isSelected ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700" :
                    "border-border bg-muted/20"
                  )}
                >
                  <span className="font-semibold text-xs shrink-0 mt-0.5">{opt.optionLabel}.</span>
                  <span className="flex-1">{opt.content}</span>
                  {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                  {!isCorrect && isSelected && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Integer answer */}
        {q.type === "integer" && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Student's Answer</p>
              <p className="font-semibold">{studentAnswer ?? <span className="text-muted-foreground">Not answered</span>}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Correct Answer</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">{modelAnswer ?? "—"}</p>
            </div>
          </div>
        )}

        {/* Descriptive */}
        {isDescriptive && (
          <div className="space-y-3">
            {/* Student's written answer */}
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5" /> Student's Answer
              </p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {studentAnswer ?? <span className="text-muted-foreground italic">No written answer</span>}
              </p>
            </div>

            {/* Uploaded images */}
            {Array.isArray(attempt.answerImageUrls) && attempt.answerImageUrls.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Uploaded Answer Images
                </p>
                <div className="flex flex-wrap gap-2">
                  {attempt.answerImageUrls.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Answer image ${idx + 1}`}
                        className="h-28 rounded-lg border border-border object-cover hover:opacity-80 transition-opacity cursor-zoom-in"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Model answer reference */}
            {modelAnswer && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10 p-3">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Model / Reference Answer
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">{modelAnswer}</p>
              </div>
            )}

            {/* Manual marks input */}
            <div className="flex items-center gap-4 pt-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  AI Suggested Marks
                </label>
                <span className="text-sm font-semibold text-primary">{aiMarks} / {q.marksCorrect}</span>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Your Mark (0 – {q.marksCorrect})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={q.marksCorrect}
                    step={0.5}
                    value={gradeValue}
                    onChange={e => {
                      const v = Math.max(0, Math.min(q.marksCorrect, Number(e.target.value)));
                      onGradeChange(q.id, v);
                    }}
                    className="w-20 px-3 py-1.5 border border-border rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  />
                  <span className="text-sm text-muted-foreground">/ {q.marksCorrect}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${q.marksCorrect > 0 ? (gradeValue / q.marksCorrect) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-graded marks display */}
        {isAutoGraded && (
          <div className="flex items-center justify-end text-xs text-muted-foreground gap-1">
            Marks: <span className="font-semibold text-foreground ml-1">{attempt.marksAwarded ?? 0} / {q.marksCorrect}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherManualGradingPage() {
  const { testId, sessionId } = useParams<{ testId: string; sessionId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: result, isLoading, error } = useQuery({
    queryKey: ["session-result", sessionId],
    queryFn: () => getSessionResult(sessionId!),
    enabled: !!sessionId,
    onSuccess: (data) => {
      // Pre-fill grades from existing marksAwarded for descriptive questions
      const init: Record<string, number> = {};
      for (const att of data.attempts ?? []) {
        if (att.question?.type === "descriptive") {
          init[att.questionId] = att.marksAwarded ?? 0;
        }
      }
      setGrades(init);
    },
  });

  const mutation = useMutation({
    mutationFn: (g: { questionId: string; marksAwarded: number }[]) =>
      gradeSessionAnswers(sessionId!, g),
    onSuccess: () => {
      showToast("Marks saved successfully!", true);
      qc.invalidateQueries({ queryKey: ["session-result", sessionId] });
      qc.invalidateQueries({ queryKey: ["mock-test-sessions-results", testId] });
    },
    onError: (e: any) => showToast(e?.message ?? "Failed to save marks", false),
  });

  const descriptiveAttempts = useMemo(
    () => (result?.attempts ?? []).filter(a => a.question?.type === "descriptive"),
    [result],
  );

  const allAttempts = useMemo(() => {
    const qs = result?.questions ?? [];
    const attMap = new Map((result?.attempts ?? []).map(a => [a.questionId, a]));
    return qs.map(q => attMap.get(q.id)).filter(Boolean) as SessionAttempt[];
  }, [result]);

  const handleSaveAll = () => {
    const gradePayload = descriptiveAttempts.map(a => ({
      questionId: a.questionId,
      marksAwarded: grades[a.questionId] ?? a.marksAwarded ?? 0,
    }));
    if (!gradePayload.length) {
      showToast("No descriptive questions to grade", false);
      return;
    }
    mutation.mutate(gradePayload);
  };

  const studentName =
    (result as any)?.student?.fullName ??
    (result as any)?.student?.name ??
    `Student ${(result?.studentId ?? "").slice(0, 8)}`;

  const test = (result as any)?.mockTest;
  const totalScore = result?.totalScore ?? 0;
  const totalMarks = test?.totalMarks ?? 0;
  const accuracy = result?.accuracy ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading session…</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <AlertCircle className="w-10 h-10 opacity-30" />
        <p>Session not found.</p>
        <button
          onClick={() => navigate(`/admin/mock-tests/${testId}/results`)}
          className="text-sm text-primary underline"
        >
          Back to Results
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/mock-tests/${testId}/results`)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
              <button onClick={() => navigate("/admin/mock-tests")} className="hover:text-foreground transition-colors">Mock Tests</button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => navigate(`/admin/mock-tests/${testId}/results`)} className="hover:text-foreground transition-colors truncate max-w-[120px]">
                {test?.title ?? "Results"}
              </button>
              <ChevronRight className="w-3 h-3" />
              <span className="font-medium text-foreground">Grade</span>
            </div>
            <h1 className="text-base font-bold truncate">{studentName}</h1>
          </div>
          {/* Summary chips */}
          <div className="hidden sm:flex items-center gap-2 text-xs shrink-0">
            <span className="px-2 py-1 rounded-lg bg-muted font-semibold">{totalScore}/{totalMarks}</span>
            <span className="px-2 py-1 rounded-lg bg-muted font-semibold">{accuracy}% acc</span>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={mutation.isPending || descriptiveAttempts.length === 0}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              descriptiveAttempts.length === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All
          </button>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-foreground">{result.correctCount}</span> correct
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-foreground">{result.wrongCount}</span> wrong
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Minus className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-foreground">{result.skippedCount}</span> skipped
          </span>
          {descriptiveAttempts.length > 0 && (
            <span className="flex items-center gap-1.5 text-amber-600 font-medium ml-auto">
              <PenLine className="w-4 h-4" />
              {descriptiveAttempts.length} descriptive question{descriptiveAttempts.length > 1 ? "s" : ""} to grade
            </span>
          )}
        </div>
      </div>

      {/* ── Questions ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {allAttempts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No question attempts found for this session.</p>
          </div>
        )}
        {allAttempts.map((attempt, i) => (
          <QuestionCard
            key={attempt.questionId}
            attempt={attempt}
            index={i}
            gradeValue={grades[attempt.questionId] ?? attempt.marksAwarded ?? 0}
            onGradeChange={(qId, v) => setGrades(g => ({ ...g, [qId]: v }))}
          />
        ))}

        {/* Save button at bottom */}
        {descriptiveAttempts.length > 0 && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveAll}
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Marks
            </button>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
