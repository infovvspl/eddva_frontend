import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { useSubmitQuiz } from "@/hooks/use-learning-path";
import { apiErrorMessage, isQuizResult, learningApi, type QuizInProgress, type QuizResult, type QuizView } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";

const DRAFT_DELAY_MS = 800;

interface QuizRunnerProps {
  quiz: QuizView;
  threadId: string | null;
  onRetake?: () => void;
  retaking?: boolean;
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Takes a quiz or the formal assessment, then shows the graded result. */
export function QuizRunner({ quiz, threadId, onRetake, retaking }: QuizRunnerProps) {
  const [view, setView] = useState<QuizView>(quiz);
  useEffect(() => setView(quiz), [quiz]);
  return isQuizResult(view) ? (
    <QuizResultView result={view} onRetake={onRetake} retaking={retaking} />
  ) : (
    <QuizTaking quiz={view} threadId={threadId} onGraded={setView} />
  );
}

function QuizTaking({ quiz, threadId, onGraded }: { quiz: QuizInProgress; threadId: string | null; onGraded: (r: QuizResult) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>(quiz.draftAnswers ?? {});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirming, setConfirming] = useState(false);
  const submit = useSubmitQuiz(threadId);
  const draftTimer = useRef<number | null>(null);
  const latest = useRef(answers);
  latest.current = answers;
  const isAssessment = quiz.kind === "assessment";

  // Countdown from the server's remaining time (the server enforces the real deadline).
  const deadline = useMemo(() => (quiz.remainingSeconds !== null ? Date.now() + quiz.remainingSeconds * 1000 : null), [quiz.instanceId, quiz.remainingSeconds]);
  const [left, setLeft] = useState<number | null>(quiz.remainingSeconds);

  const doSubmit = useCallback(() => {
    if (submit.isPending) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    submit.mutate(
      { instanceId: quiz.instanceId, answers: latest.current },
      {
        onSuccess: onGraded,
        onError: async (err) => {
          // Already graded elsewhere (another tab, or the timer): show that result.
          try {
            const now = await learningApi.quiz(quiz.instanceId);
            if (isQuizResult(now)) return onGraded(now);
          } catch {
            /* fall through */
          }
          toast.error(apiErrorMessage(err, "Could not submit. Your answers are saved; please try again."));
        },
      },
    );
  }, [onGraded, quiz.instanceId, submit]);

  useEffect(() => {
    if (!deadline) return;
    const t = window.setInterval(() => {
      const s = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        window.clearInterval(t);
        doSubmit();
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [deadline, doSubmit]);

  const choose = (questionId: string, optionId: string) => {
    const next = { ...answers, [questionId]: optionId };
    setAnswers(next);
    setSaveState("saving");
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(async () => {
      try {
        const res = await learningApi.saveDraft(quiz.instanceId, next);
        if ("instanceId" in res && isQuizResult(res as QuizResult)) return onGraded(res as QuizResult); // time ran out
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, DRAFT_DELAY_MS);
  };

  const answered = quiz.questions.filter((q) => answers[q.id]).length;
  const unanswered = quiz.questions.length - answered;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
        <div>
          <p className="text-sm font-semibold text-foreground">{isAssessment ? "Formal assessment" : "Quiz"} · {quiz.questions.length} questions</p>
          <p className="text-xs text-muted-foreground">
            {answered} answered ·{" "}
            {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : saveState === "error" ? "not saved, will retry on your next answer" : "answers save as you go"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {left !== null && (
            <span className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums", left < 60 ? "bg-rose-100 text-rose-700" : "bg-muted text-foreground")}
              role="timer" aria-live={left < 60 ? "polite" : "off"}>
              <Clock className="size-4" /> {formatClock(left)}
            </span>
          )}
          <button type="button" onClick={() => (unanswered ? setConfirming(true) : doSubmit())} disabled={submit.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : "Submit"}
          </button>
        </div>
      </div>

      {isAssessment && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          One attempt, timed. The chat is paused until you submit. When time runs out, your saved answers are submitted.
        </p>
      )}

      {confirming && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="inline-flex items-center gap-2"><AlertTriangle className="size-4" /> {unanswered} question{unanswered === 1 ? "" : "s"} unanswered. Submit anyway?</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-amber-300 px-3 py-1.5 font-medium">Keep going</button>
            <button type="button" onClick={() => { setConfirming(false); doSubmit(); }} className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white">Submit</button>
          </div>
        </div>
      )}

      <ol className="space-y-4">
        {quiz.questions.map((q, i) => (
          <li key={q.id} className="rounded-2xl border border-border bg-card p-4">
            <fieldset>
              <legend className="flex gap-2 text-sm font-semibold text-foreground">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1"><MarkdownRenderer content={q.text} /></span>
              </legend>
              <div className="mt-3 grid gap-2">
                {q.options.map((o, oi) => {
                  const selected = answers[q.id] === o.id;
                  return (
                    <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted")}>
                      <input type="radio" name={q.id} value={o.id} checked={selected} onChange={() => choose(q.id, o.id)} className="mt-1 accent-primary" />
                      <span className="font-semibold text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                      <span className="min-w-0 flex-1 text-foreground"><MarkdownRenderer content={o.text} /></span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
    </div>
  );
}

function QuizResultView({ result, onRetake, retaking }: { result: QuizResult; onRetake?: () => void; retaking?: boolean }) {
  const good = result.accuracy >= 70;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className={cn("rounded-2xl border p-5", good ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40")}>
        <p className="text-sm font-medium text-muted-foreground">{result.kind === "assessment" ? "Formal assessment" : "Quiz"} result{result.status === "auto_submitted" ? " (submitted when time ran out)" : ""}</p>
        <p className="mt-1 text-3xl font-bold text-foreground">{Math.round(result.accuracy)}%</p>
        <p className="text-sm text-muted-foreground">{result.score} of {result.total} correct</p>
        {result.weakConcepts.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-foreground">Needs more work:</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {result.weakConcepts.map((c) => (
                <li key={c.conceptTag} className="rounded-full border border-rose-200 bg-white px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  {c.conceptTag} · {Math.round(c.accuracy)}%
                </li>
              ))}
            </ul>
          </div>
        )}
        {onRetake && result.kind === "quiz" && (
          <button type="button" onClick={onRetake} disabled={retaking}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-60">
            {retaking ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Try a new quiz
          </button>
        )}
      </div>

      <ol className="space-y-3">
        {result.questions.map((q, i) => (
          <li key={q.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex gap-2 text-sm font-semibold text-foreground">
              {q.isCorrect ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-label="Correct" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" aria-label="Wrong" />}
              <span className="text-muted-foreground">{i + 1}.</span>
              <span className="min-w-0 flex-1"><MarkdownRenderer content={q.text} /></span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {q.options.map((o, oi) => {
                const correct = o.id === q.correctOptionId;
                const mine = o.id === q.yourAnswer;
                return (
                  <li key={o.id} className={cn("flex gap-2 rounded-lg px-3 py-1.5 text-sm",
                    correct ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : mine ? "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200" : "text-muted-foreground")}>
                    <span className="font-semibold">{String.fromCharCode(65 + oi)}.</span>
                    <span className="min-w-0 flex-1"><MarkdownRenderer content={o.text} /></span>
                    {mine && <span className="text-xs font-medium">Your answer</span>}
                  </li>
                );
              })}
            </ul>
            {!q.yourAnswer && <p className="mt-1 text-xs text-muted-foreground">Not answered</p>}
            {q.explanation && (
              <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-foreground"><MarkdownRenderer content={q.explanation} /></div>
            )}
            {q.conceptTag && <p className="mt-1 text-[11px] text-muted-foreground">Concept: {q.conceptTag}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
