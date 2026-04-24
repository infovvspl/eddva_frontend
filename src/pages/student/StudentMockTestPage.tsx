import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Clock, ClipboardList, CheckCircle,
  XCircle, Minus, Trophy, Target, Zap, BarChart3, Loader2,
  AlertTriangle, ChevronRight, BookOpen, Flag, RotateCcw,
  TrendingUp, Calendar, Award, Check, X,
} from "lucide-react";
import {
  getMockTestById, startSession, submitAnswer, submitSession,
  getMockTestSessions, getSessionResult, getSessionById, isSessionCompleted,
} from "@/lib/api/student";
import type {
  QuizQuestion, TestSession, SessionResult, SessionResultAttempt, InProgressSessionAttempt,
} from "@/lib/api/student";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { uploadToS3 } from "@/lib/api/upload";

// ─── Timer hook ───────────────────────────────────────────────────────────────
function useCountdown(total: number, running: boolean, onExpire: () => void) {
  const [secs, setSecs] = useState(total);
  const cbRef = useRef(onExpire);
  cbRef.current = onExpire;
  useEffect(() => { setSecs(total); }, [total]);
  useEffect(() => {
    if (!running) return;
    if (secs <= 0) { cbRef.current(); return; }
    const id = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, secs]);
  return secs;
}

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function isAttemptComplete(
  q: QuizQuestion,
  selected: string[] | undefined,
  imageUrls?: string[],
): boolean {
  if (q.type === "descriptive") {
    return Boolean(
      (selected && selected[0]?.trim()) || (Array.isArray(imageUrls) && imageUrls.length > 0),
    );
  }
  if (!selected || selected.length === 0) return false;
  if (q.type === "integer") return Boolean(selected[0]?.toString().trim());
  return selected.length > 0;
}

function hydrateFromAttempts(
  attempts: InProgressSessionAttempt[] | undefined,
  questions: QuizQuestion[],
): { answers: Record<string, string[]>; answerImages: Record<string, string[]> } {
  const answers: Record<string, string[]> = {};
  const answerImages: Record<string, string[]> = {};
  if (!attempts?.length) return { answers, answerImages };
  const byQ = new Map(attempts.map((a) => [a.questionId, a]));
  for (const q of questions) {
    const a = byQ.get(q.id);
    if (!a) continue;
    const raw = a as { answer_image_urls?: string[]; integer_answer?: string | null };
    const imageUrls = a.answerImageUrls ?? raw.answer_image_urls ?? [];
    if (q.type === "mcq_single" || q.type === "mcq_multi") {
      if (a.selectedOptionIds?.length) answers[q.id] = a.selectedOptionIds;
    } else if (q.type === "integer") {
      const v = a.integerAnswer ?? raw.integer_answer;
      if (v != null && String(v).trim() !== "") answers[q.id] = [String(v)];
    } else if (q.type === "descriptive") {
      const v = a.integerAnswer ?? raw.integer_answer;
      if (v != null) answers[q.id] = [String(v)];
      if (Array.isArray(imageUrls) && imageUrls.length) answerImages[q.id] = [...imageUrls];
    }
  }
  return { answers, answerImages };
}

// ─── Palette dot ─────────────────────────────────────────────────────────────
type QStatus = "unanswered" | "answered" | "current";
function PaletteDot({ status, idx, onClick }: { status: QStatus; idx: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-9 h-9 rounded-lg text-xs font-bold transition-all border",
        status === "current"    && "bg-indigo-600 text-white border-indigo-600 scale-110 shadow-md",
        status === "answered"   && "bg-emerald-500 text-white border-emerald-500",
        status === "unanswered" && "bg-white text-slate-500 border-slate-200 hover:border-indigo-300",
      )}
    >
      {idx + 1}
    </button>
  );
}

// ─── Question view ────────────────────────────────────────────────────────────
const TYPE_PILL: Record<QuizQuestion["type"], { label: string; className: string }> = {
  mcq_single: { label: "MCQ", className: "bg-sky-100 text-sky-800" },
  mcq_multi: { label: "MSQ (multi)", className: "bg-violet-100 text-violet-800" },
  integer: { label: "Integer", className: "bg-amber-100 text-amber-800" },
  descriptive: { label: "Written", className: "bg-rose-100 text-rose-800" },
};

function QuestionView({
  question, index, total, selected, imageUrls, onSelect, onImageUrlsChange, onDescriptiveInput,
}: {
  question: QuizQuestion; index: number; total: number;
  selected: string[];
  imageUrls?: string[];
  onSelect: (v: string) => void;
  /** Fires on every textarea change; parent debounces auto-save. */
  onDescriptiveInput?: (v: string) => void;
  onImageUrlsChange?: (urls: string[]) => void;
}) {
  const isInteger = question.type === "integer";
  const isMulti = question.type === "mcq_multi";
  const isDescriptive = question.type === "descriptive";
  const [intVal, setIntVal] = useState(selected[0] ?? "");
  const [textVal, setTextVal] = useState(selected[0] ?? "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setIntVal(selected[0] ?? ""); }, [question.id, selected]);
  useEffect(() => { setTextVal(selected[0] ?? ""); }, [question.id, selected]);

  const handlePickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!onImageUrlsChange) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadToS3(
          {
            type: "doubt-response-image",
            fileName: file.name,
            contentType: file.type || "image/jpeg",
            fileSize: file.size,
          },
          file,
        );
        uploaded.push(url);
      }
      onImageUrlsChange([...(imageUrls || []), ...uploaded]);
      toast.success(`${uploaded.length} handwritten page(s) uploaded`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload handwritten page.");
    } finally {
      setUploading(false);
    }
  };

  const typePill = TYPE_PILL[question.type] ?? TYPE_PILL.mcq_single;

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
          Q{index + 1} / {total}
        </span>
        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", typePill.className)}>{typePill.label}</span>
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full",
          question.difficulty === "easy"   && "bg-emerald-100 text-emerald-700",
          question.difficulty === "medium" && "bg-amber-100 text-amber-700",
          question.difficulty === "hard"   && "bg-red-100 text-red-700",
        )}>
          {question.difficulty}
        </span>
        <span className="ml-auto text-xs font-semibold text-slate-500">
          +{question.marksCorrect} pts
          {question.marksWrong > 0 && <span className="text-red-500"> / -{question.marksWrong}</span>}
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <p className="text-base font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
          {question.content}
        </p>
      </div>

      {isDescriptive ? (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Your answer</p>
          <textarea
            value={textVal}
            onChange={(e) => {
              const raw = e.target.value;
              setTextVal(raw);
              onDescriptiveInput?.(raw);
            }}
            rows={6}
            placeholder="Write your answer here. It is saved automatically as you type."
            className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y min-h-[140px]"
          />
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500 font-medium">Upload handwritten pages (for diagrams/stepwork)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => handlePickImages(e.target.files)}
                className="text-[11px]"
              />
            </div>
            {!!imageUrls?.length && (
              <ul className="space-y-2 mt-2">
                {imageUrls.map((url, idx) => (
                  <li
                    key={`${url}-${idx}`}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 pr-1"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-slate-700">Page {idx + 1}</p>
                      <p className="text-[10px] text-slate-400 truncate" title={url}>
                        {url.length > 48 ? `${url.slice(0, 24)}…${url.slice(-12)}` : url}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onImageUrlsChange?.((imageUrls || []).filter((_, i) => i !== idx))}
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Remove this page"
                      aria-label={`Remove page ${idx + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {uploading && <p className="text-[11px] text-indigo-600">Uploading pages…</p>}
            <p className="text-[10px] text-slate-500 leading-relaxed max-w-lg">
              Handwritten images are stored securely. Your work is read from them (using vision AI) and combined with anything you typed for grading.
            </p>
          </div>
        </div>
      ) : isInteger ? (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Enter integer answer</p>
          <input
            type="number"
            value={intVal}
            onChange={e => { setIntVal(e.target.value); onSelect(e.target.value); }}
            placeholder="Type your answer..."
            className="w-full p-3 rounded-xl border border-slate-200 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {isMulti && (
            <p className="text-xs text-slate-500 font-medium">Select all correct options.</p>
          )}
          {(question.options ?? []).map((opt) => {
            const isSel = selected.includes(opt.id);
            return (
              <button key={opt.id} type="button" onClick={() => onSelect(opt.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                  isSel ? "bg-indigo-50 border-indigo-400 shadow-sm" : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30",
                )}
              >
                <div className={cn(
                  "w-5 h-5 border-2 shrink-0 flex items-center justify-center",
                  isMulti ? "rounded-md" : "rounded-full",
                  isSel ? "border-indigo-500 bg-indigo-500" : "border-slate-300",
                )}>
                  {isSel && (isMulti ? <Check className="w-3 h-3 text-white" strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-white" />)}
                </div>
                <span className={cn("text-sm font-medium leading-snug", isSel ? "text-indigo-800" : "text-slate-700")}>
                  {opt.content}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Past attempts list ───────────────────────────────────────────────────────
function AttemptHistory({ sessions, totalMarks, onViewResult }: {
  sessions: TestSession[];
  totalMarks: number;
  onViewResult: (sessionId: string) => void;
}) {
  const completed = sessions.filter(isSessionCompleted);
  if (!completed.length) return null;

  const bestScore = Math.max(...completed.map(s => s.totalScore ?? 0));
  const bestPct = totalMarks > 0 ? Math.round((bestScore / totalMarks) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Best score banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
        <Award className="w-5 h-5 text-indigo-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-indigo-600">Best Score</p>
          <p className="text-base font-black text-indigo-800">{bestScore.toFixed(0)}/{totalMarks} <span className="text-sm font-semibold">({bestPct}%)</span></p>
        </div>
        <div className="ml-auto text-right shrink-0">
          <p className="text-xs text-slate-500">{completed.length} attempt{completed.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Attempts list */}
      <div className="space-y-2">
        {completed.slice(0, 5).map((s, i) => {
          const score = s.totalScore ?? 0;
          const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
          return (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100">
              <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                #{completed.length - i}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-bold",
                    pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-500",
                  )}>
                    {score.toFixed(0)}/{totalMarks} ({pct}%)
                  </span>
                  <span className="text-xs text-slate-400">
                    ✓{s.correctCount ?? 0} ✗{s.wrongCount ?? 0} —{s.skippedCount ?? 0}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formatDistanceToNow(new Date(s.submittedAt ?? s.startedAt), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={() => onViewResult(s.id)}
                className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50"
              >
                Review
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Backend uses camelCase; some proxies/legacy rows may use snake_case */
function solutionTextFromQuestion(q: unknown): string | undefined {
  const o = q as Record<string, unknown> | null | undefined;
  if (!o) return undefined;
  const t = o.solutionText ?? o.solution_text;
  return typeof t === "string" && t.trim() ? t.trim() : undefined;
}

function solutionVideoFromQuestion(q: unknown): string | undefined {
  const o = q as Record<string, unknown> | null | undefined;
  if (!o) return undefined;
  const t = o.solutionVideoUrl ?? o.solution_video_url;
  return typeof t === "string" && t.trim() ? t.trim() : undefined;
}

function ExplanationBlock({ text, videoUrl }: { text?: string | null; videoUrl?: string | null }) {
  if (!text?.trim() && !videoUrl) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Explanation</p>
      {text?.trim() ? (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</p>
      ) : null}
      {videoUrl ? (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
        >
          Watch solution video
        </a>
      ) : null}
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────
function ResultsScreen({
  result, questions, totalMarks, onRetake, onBack,
}: {
  result: SessionResult;
  questions: QuizQuestion[];
  totalMarks: number;
  onRetake: () => void;
  onBack: () => void;
}) {
  const [showReview, setShowReview] = useState(false);
  const pct = result.accuracy ?? 0;
  const passed = pct >= 40;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      {/* Hero */}
      <div className={cn(
        "rounded-3xl p-8 text-center border",
        passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200",
      )}>
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg",
          passed ? "bg-emerald-500" : "bg-red-400",
        )}>
          {passed ? <Trophy className="w-10 h-10 text-white" /> : <AlertTriangle className="w-10 h-10 text-white" />}
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-1">
          {(result.totalScore ?? 0).toFixed(0)} / {totalMarks}
        </h2>
        <p className={cn("text-base font-semibold", passed ? "text-emerald-600" : "text-red-500")}>
          {pct.toFixed(1)}% accuracy · {passed ? "Passed ✓" : "Keep practising"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Correct",  value: result.totalCorrect,  Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Wrong",    value: result.totalWrong,    Icon: XCircle,     color: "text-red-500",    bg: "bg-red-50 border-red-100" },
          { label: "Skipped",  value: result.totalSkipped,  Icon: Minus,       color: "text-slate-500",  bg: "bg-slate-50 border-slate-100" },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className={cn("rounded-2xl p-4 text-center border", bg)}>
            <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
            <p className="text-xl font-black text-slate-900">{value}</p>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">Accuracy</span>
          <span className="text-sm font-bold text-indigo-600">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("h-full rounded-full", passed ? "bg-emerald-500" : "bg-red-400")}
          />
        </div>
      </div>

      {/* Review toggle */}
      <button
        onClick={() => setShowReview(v => !v)}
        className="w-full py-3 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-sm flex items-center justify-center gap-2"
      >
        <BookOpen className="w-4 h-4" />
        {showReview ? "Hide" : "Review"} Answers
        <ChevronRight className={cn("w-4 h-4 transition-transform", showReview && "rotate-90")} />
      </button>

      {showReview && (
        <div className="space-y-4">
          {result.attempts.map((attempt: SessionResultAttempt, i) => {
            const q = attempt.question ?? questions.find(x => x.id === attempt.questionId);
            if (!q) return null;
            const explanationOnly = q.reviewMode === "explanation_only";
            const opts = q.options ?? [];
            const skipped = attempt.errorType === "skip";
            const isDesc = q.type === "descriptive";
            return (
              <div key={attempt.questionId} className={cn(
                "rounded-2xl border p-4 space-y-3",
                isDesc ? "bg-slate-50/80 border-slate-200" : attempt.isCorrect
                  ? "bg-emerald-50/60 border-emerald-200"
                  : skipped
                    ? "bg-slate-50 border-slate-200"
                    : "bg-red-50/60 border-red-200",
              )}>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                    Q{i + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-800 leading-snug flex-1">{q.content}</p>
                  {isDesc ? (
                    <BookOpen className="w-5 h-5 text-slate-500 shrink-0" aria-hidden />
                  ) : attempt.isCorrect
                    ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    : skipped
                      ? <Minus className="w-5 h-5 text-slate-400 shrink-0" />
                      : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                </div>

                {explanationOnly ? (
                  <ExplanationBlock text={solutionTextFromQuestion(q)} videoUrl={solutionVideoFromQuestion(q)} />
                ) : (
                  <>
                    {q.type === "descriptive" ? (
                      <div className="space-y-2 text-sm rounded-xl border border-slate-200 bg-white/80 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-500">Your response</p>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {(attempt as { integerAnswer?: string }).integerAnswer?.trim() || "—"}
                        </p>
                        {solutionTextFromQuestion(q) ? (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1">Model / key points</p>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{solutionTextFromQuestion(q)}</p>
                          </div>
                        ) : null}
                        {(() => {
                          const rb = (attempt as any)?.analysis?.rubricBreakdown as Record<string, number> | null | undefined;
                          if (!rb || !Object.keys(rb).length) return null;
                          return (
                            <div className="pt-2 border-t border-slate-100">
                              <p className="text-[10px] font-bold uppercase text-indigo-700 mb-1">Rubric breakdown</p>
                              <p className="text-slate-700 text-xs leading-relaxed">
                                {Object.entries(rb)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(" | ")}
                              </p>
                            </div>
                          );
                        })()}
                        {!!(attempt.answerImageUrls || []).length && (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Attached handwritten page(s)</p>
                            <div className="flex flex-wrap gap-2">
                              {(attempt.answerImageUrls || []).map((u, idx) => (
                                <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-700 underline">
                                  Page {idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : q.type === "integer" ? (
                      <div className="space-y-2 text-sm rounded-xl border border-slate-200 bg-white/80 p-3">
                        <p className="text-slate-600">
                          Your answer:{" "}
                          <span className="font-mono font-semibold text-slate-900">
                            {attempt.integerAnswer ?? "—"}
                          </span>
                        </p>
                        <p className="text-slate-600">
                          Correct answer:{" "}
                          <span className="font-mono font-semibold text-emerald-700">
                            {q.integerAnswer ?? "—"}
                          </span>
                        </p>
                      </div>
                    ) : opts.length > 0 ? (
                      <div className="space-y-1.5">
                        {opts.map((opt) => {
                          const wasSel = attempt.selectedOptionIds?.includes(opt.id);
                          const isCorrectOpt = opt.isCorrect === true;
                          return (
                            <div key={opt.id} className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border",
                              isCorrectOpt && "bg-emerald-100 border-emerald-300 text-emerald-800",
                              wasSel && !isCorrectOpt && "bg-red-100 border-red-300 text-red-700",
                              !wasSel && !isCorrectOpt && "bg-white border-slate-100 text-slate-500",
                            )}>
                              {isCorrectOpt
                                ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                : wasSel
                                  ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                              {opt.content}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <ExplanationBlock text={solutionTextFromQuestion(q)} videoUrl={solutionVideoFromQuestion(q)} />
                  </>
                )}

                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  (attempt.marksAwarded ?? 0) > 0 ? "bg-emerald-100 text-emerald-700"
                  : (attempt.marksAwarded ?? 0) < 0 ? "bg-red-100 text-red-600"
                  : "bg-slate-100 text-slate-500",
                )}>
                  {(attempt.marksAwarded ?? 0) > 0 ? `+${attempt.marksAwarded}` : attempt.marksAwarded} marks
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onRetake}
          className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md"
        >
          <RotateCcw className="w-4 h-4" /> Retake Test
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Stage = "loading" | "intro" | "running" | "submitting" | "results" | "viewing_past";

export default function StudentMockTestPage() {
  const { id: mockTestId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [stage, setStage]             = useState<Stage>("loading");
  const [mockTest, setMockTest]       = useState<any | null>(null);
  const [allSessions, setAllSessions] = useState<TestSession[]>([]);
  const [session, setSession]         = useState<TestSession | null>(null);
  const [questions, setQuestions]     = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ]       = useState(0);
  const [answers, setAnswers]         = useState<Record<string, string[]>>({});
  const [answerImages, setAnswerImages] = useState<Record<string, string[]>>({});
  const [result, setResult]           = useState<SessionResult | null>(null);
  const [elapsed, setElapsed]         = useState(0);
  const doSubmitRef = useRef<((timedOut?: boolean) => Promise<void>) | null>(null);
  const desSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const answerImagesRef = useRef<Record<string, string[]>>({});
  const answersRef = useRef<Record<string, string[]>>({});
  useEffect(() => { answerImagesRef.current = answerImages; }, [answerImages]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const totalSecs = (mockTest?.durationMinutes ?? 60) * 60;
  const remaining = Math.max(0, totalSecs - elapsed);
  const totalMarks = mockTest?.totalMarks ?? 0;

  const handleTimeUp = useCallback(() => {
    if (stage === "running" && session) {
      toast.warning("Time's up! Auto-submitting…");
      void doSubmitRef.current?.(true);
    }
  }, [stage, session]);

  const secs = useCountdown(remaining, stage === "running", handleTimeUp);
  const timerDanger = secs < 120;

  const flushDescriptiveIfNeeded = useCallback(async () => {
    if (!session || !questions.length) return;
    const q = questions[currentQ];
    if (q.type !== "descriptive") return;
    const t = desSaveTimers.current[q.id];
    if (t) {
      clearTimeout(t);
      desSaveTimers.current[q.id] = null;
    }
    const text = (answersRef.current[q.id] || [])[0] ?? "";
    const urls = answerImagesRef.current[q.id] || [];
    try {
      await submitAnswer(session.id, {
        questionId: q.id,
        integerResponse: text,
        answerImageUrls: urls,
        timeTakenSeconds: totalSecs - secs,
      });
    } catch { /* best-effort */ }
  }, [session, questions, currentQ, totalSecs, secs]);

  const handleDescriptiveInput = useCallback(
    (q: QuizQuestion, value: string) => {
      setAnswers((a) => ({ ...a, [q.id]: [value] }));
      if (!session) return;
      const prior = desSaveTimers.current[q.id];
      if (prior) clearTimeout(prior);
      desSaveTimers.current[q.id] = setTimeout(() => {
        submitAnswer(session.id, {
          questionId: q.id,
          integerResponse: value,
          answerImageUrls: answerImagesRef.current[q.id] || [],
          timeTakenSeconds: totalSecs - secs,
        }).catch(() => {});
      }, 500);
    },
    [session, totalSecs, secs],
  );

  // ── Initial load ──────────────────────────────────────────────────────────
  const loadPage = useCallback(async () => {
    if (!mockTestId) return;
    setStage("loading");
    try {
      const [test, sessions] = await Promise.all([
        getMockTestById(mockTestId),
        getMockTestSessions(mockTestId),
      ]);
      setMockTest(test);
      setAllSessions(sessions);

      const active = sessions.find(s => s.status === "in_progress");
      if (active) {
        const elapsed = Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000);
        setElapsed(elapsed);
        const full = await getSessionById(active.id);
        const qs = (full.questions as QuizQuestion[]) ?? (test.questions as QuizQuestion[]) ?? [];
        setSession({ ...active, questions: full.questions, attempts: full.attempts } as any);
        setQuestions(qs);
        setCurrentQ(0);
        const { answers: a, answerImages: img } = hydrateFromAttempts(
          (full as TestSession & { attempts?: InProgressSessionAttempt[] }).attempts,
          qs,
        );
        setAnswers(a);
        setAnswerImages(img);
        setStage("running");
        toast.info("Resuming your session…");
      } else {
        setStage("intro");
      }
    } catch {
      toast.error("Failed to load test.");
      navigate(-1);
    }
  }, [mockTestId]); // eslint-disable-line

  useEffect(() => { loadPage(); }, [loadPage]);

  // Sync elapsed while running
  useEffect(() => {
    if (stage !== "running" || !session) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
    }, 5000);
    return () => clearInterval(id);
  }, [stage, session]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!mockTest) return;
    setStage("loading");
    try {
      const sess = await startSession(mockTest.id);
      setSession(sess);
      setQuestions((sess.questions as QuizQuestion[]) ?? []);
      setCurrentQ(0);
      setAnswers({});
      setAnswerImages({});
      setElapsed(0);
      setStage("running");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to start test.");
      setStage("intro");
    }
  };

  const handleSelect = async (value: string) => {
    const q = questions[currentQ];
    if (!q || !session) return;
    if (q.type === "descriptive") return;
    const isMulti = q.type === "mcq_multi";
    const isInteger = q.type === "integer";
    const prev = answers[q.id] ?? [];
    const next: string[] = isInteger
      ? [value]
      : isMulti
        ? (prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value])
        : [value];
    setAnswers((a) => ({ ...a, [q.id]: next }));
    try {
      await submitAnswer(session.id, {
        questionId: q.id,
        selectedOptionIds: isInteger ? undefined : next,
        integerResponse: isInteger ? value : undefined,
        timeTakenSeconds: totalSecs - secs,
      });
    } catch { /* graded on final submit */ }
  };

  const doSubmit = async (timedOut = false) => {
    if (!session) return;
    await flushDescriptiveIfNeeded();
    setStage("submitting");
    try {
      const res = await submitSession(session.id);
      setResult(res);
      // Refresh sessions list
      getMockTestSessions(mockTestId!).then(setAllSessions).catch(() => {});
      setStage("results");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Submit failed.");
      setStage("running");
    }
  };
  doSubmitRef.current = doSubmit;

  const handleSubmit = async (timedOut = false) => {
    if (!timedOut) {
      const unanswered = questions.filter(
        (q) => !isAttemptComplete(q, answers[q.id], answerImages[q.id]),
      ).length;
      if (unanswered > 0) {
        const ok = window.confirm(`${unanswered} question${unanswered > 1 ? "s" : ""} unanswered. Submit anyway?`);
        if (!ok) return;
      }
    }
    await doSubmit(timedOut);
  };

  const handleViewPastResult = async (sessionId: string) => {
    setStage("loading");
    try {
      const res = await getSessionResult(sessionId);
      setResult(res);
      // Use questions from mock test
      if (!questions.length && mockTest?.questions) setQuestions(mockTest.questions);
      setStage("results");
    } catch {
      toast.error("Could not load result.");
      setStage("intro");
    }
  };

  const handleRetake = () => {
    setResult(null);
    setSession(null);
    setAnswers({});
      setAnswerImages({});
    setCurrentQ(0);
    setStage("intro");
  };

  // ── Loading / submitting ──────────────────────────────────────────────────
  if (stage === "loading" || stage === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500 font-medium">
          {stage === "submitting" ? "Grading your test…" : "Loading…"}
        </p>
      </div>
    );
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (stage === "intro" && mockTest) {
    const qCount = (mockTest.questions as any[])?.length ?? mockTest.questionIds?.length ?? 0;
    const completedSessions = allSessions.filter(isSessionCompleted);
    const hasAttempts = completedSessions.length > 0;

    return (
      <div className="max-w-lg mx-auto py-10 px-4 space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Test info card */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>

          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Mock Test</p>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">{mockTest.title}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ClipboardList, label: "Questions", value: qCount },
              { icon: Clock, label: "Duration", value: `${mockTest.durationMinutes} min` },
              { icon: Target, label: "Max Marks", value: mockTest.totalMarks },
              { icon: Zap, label: "Passing", value: mockTest.passingMarks ? `${mockTest.passingMarks} marks` : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Icon className="w-4 h-4 text-indigo-500 mb-2" />
                <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-1.5">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Instructions
            </p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Timer starts immediately and cannot be paused.</li>
              <li>Answers are saved automatically (including multi-select, integer, and written responses).</li>
              {mockTest.shuffleQuestions && <li>Questions are shuffled each attempt.</li>}
              <li>Submit before the timer expires to avoid auto-submission.</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            {hasAttempts ? (
              <><RotateCcw className="w-5 h-5" /> Retake Test</>
            ) : (
              <><ChevronRight className="w-5 h-5" /> Start Test</>
            )}
          </motion.button>
        </div>

        {/* Past attempts */}
        {hasAttempts && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Your Progress</h3>
            </div>
            <AttemptHistory
              sessions={allSessions}
              totalMarks={totalMarks}
              onViewResult={handleViewPastResult}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Running ───────────────────────────────────────────────────────────────
  if (stage === "running" && questions.length > 0) {
    const q = questions[currentQ];
    const answeredCount = questions.filter((qItem) =>
      isAttemptComplete(qItem, answers[qItem.id], answerImages[qItem.id]),
    ).length;

    return (
      <div className="max-w-3xl mx-auto px-4 pb-24">
        {/* Sticky header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 py-3 mb-6 flex items-center justify-between gap-2 sm:gap-4 -mx-4 px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-slate-800 truncate">{mockTest?.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Close this test? Your last answers are saved; you can resume this mock test from the list when you come back.",
                  )
                ) {
                  navigate(-1);
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Close test"
              aria-label="Close test and leave"
            >
              <X className="w-4 h-4" />
            </button>
            <div
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-sm",
                timerDanger ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-800",
              )}
            >
              <Clock className="w-4 h-4" /> {fmt(secs)}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <motion.div animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            className="h-full bg-indigo-500 rounded-full" />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <QuestionView
            key={q.id} question={q} index={currentQ} total={questions.length}
            selected={answers[q.id] ?? []}
            imageUrls={answerImages[q.id] ?? []}
            onDescriptiveInput={(text) => handleDescriptiveInput(q, text)}
            onImageUrlsChange={(urls) => {
              setAnswerImages((m) => ({ ...m, [q.id]: urls }));
              const t = desSaveTimers.current[q.id];
              if (t) {
                clearTimeout(t);
                desSaveTimers.current[q.id] = null;
              }
              if (session && q.type === "descriptive") {
                const text = (answersRef.current[q.id] ?? [])[0] ?? "";
                submitAnswer(session.id, {
                  questionId: q.id,
                  integerResponse: text,
                  answerImageUrls: urls,
                  timeTakenSeconds: totalSecs - secs,
                }).catch(() => {});
              }
            }}
            onSelect={handleSelect}
          />
        </AnimatePresence>

        {/* Nav */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={async () => {
              await flushDescriptiveIfNeeded();
              setCurrentQ((i) => Math.max(i - 1, 0));
            }} disabled={currentQ === 0}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={async () => {
              if (currentQ < questions.length - 1) {
                await flushDescriptiveIfNeeded();
                setCurrentQ((i) => i + 1);
              }
            }}
            disabled={currentQ === questions.length - 1}
            className="flex-1 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 disabled:opacity-30"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSubmit(false)}
            className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-sm hover:bg-emerald-600" title="Submit"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>

        {/* Palette */}
        <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Question Palette</p>
            <p className="text-xs font-medium text-slate-500">{answeredCount}/{questions.length} answered</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((qItem, i) => (
              <PaletteDot
                key={qItem.id}
                idx={i}
                onClick={async () => {
                  if (i !== currentQ) await flushDescriptiveIfNeeded();
                  setCurrentQ(i);
                }}
                status={i === currentQ ? "current" : isAttemptComplete(qItem, answers[qItem.id], answerImages[qItem.id]) ? "answered" : "unanswered"}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
            {[
              { cls: "bg-indigo-600", label: "Current" },
              { cls: "bg-emerald-500", label: "Answered" },
              { cls: "bg-white border border-slate-200", label: "Not attempted" },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded", cls)} />
                <span className="text-[10px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleSubmit(false)}
          className="mt-4 w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:bg-emerald-700"
        >
          <BarChart3 className="w-5 h-5" /> Submit Test
        </button>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (stage === "results" && result) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <ResultsScreen
          result={result}
          questions={questions.length ? questions : (mockTest?.questions ?? [])}
          totalMarks={totalMarks}
          onRetake={handleRetake}
          onBack={() => navigate(-1)}
        />
      </div>
    );
  }

  return null;
}
