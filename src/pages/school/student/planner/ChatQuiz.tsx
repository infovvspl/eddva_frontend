import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, X } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { learningApi, type ChatQuizQuestion, type ChatQuizResult } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";
import { stripCitations } from "./citations";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Practice questions from the AI tutor, answered in the chat: the student taps
 * an option and sees at once whether it is right, with the explanation, then
 * moves on; the score is saved on the message so it shows when they come back.
 */
export function ChatQuiz({ threadId, messageId, questions: rawQuestions, savedResult }: {
  threadId: string;
  messageId: string;
  questions: ChatQuizQuestion[];
  savedResult: ChatQuizResult | null;
}) {
  // No citation marks ([C4], [W2]) in the questions, options or explanations.
  const questions = useMemo(
    () =>
      rawQuestions.map((q) => ({
        ...q,
        question: stripCitations(q.question),
        options: q.options.map(stripCitations),
        explanation: stripCitations(q.explanation ?? ""),
      })),
    [rawQuestions],
  );
  const [result, setResult] = useState<ChatQuizResult | null>(savedResult);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const finish = async (final: number[]) => {
    setSaving(true);
    const local: ChatQuizResult = {
      answers: final,
      score: final.filter((a, i) => a === questions[i].answerIndex).length,
      total: questions.length,
      completedAt: new Date().toISOString(),
    };
    try {
      setResult((await learningApi.saveChatQuizResult(threadId, messageId, final)).quizResult ?? local);
    } catch {
      setResult(local); // the score still shows; it just is not saved
    } finally {
      setSaving(false);
    }
  };

  const retake = () => {
    setResult(null);
    setIndex(0);
    setAnswers([]);
  };

  if (result) {
    const share = result.score / result.total;
    return (
      <div className="mt-3 rounded-2xl border border-border bg-card p-4" aria-label="Quiz result">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quiz complete</p>
            <p className="mt-0.5 text-2xl font-bold text-foreground">{result.score} / {result.total}</p>
            <p className="text-xs text-muted-foreground">
              {share >= 0.8 ? "Excellent work!" : share >= 0.5 ? "Good effort. Look again at the ones you missed." : "Keep practising. Read the explanations below."}
            </p>
          </div>
          <button type="button" onClick={retake}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
            <RotateCcw className="size-3.5" /> Try again
          </button>
        </div>
        <ol className="mt-4 space-y-2">
          {questions.map((q, i) => {
            const picked = result.answers[i];
            const right = picked === q.answerIndex;
            return (
              <li key={i} className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm">
                {right ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <X className="mt-0.5 size-4 shrink-0 text-rose-600" />}
                <div className="min-w-0 flex-1">
                  <MarkdownRenderer content={q.question} />
                  {!right && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your answer: {LETTERS[picked]}) {q.options[picked]} · Correct: {LETTERS[q.answerIndex]}) {q.options[q.answerIndex]}
                    </p>
                  )}
                  {!right && q.explanation && <p className="mt-1 text-xs text-foreground">{q.explanation}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const q = questions[index];
  const picked = answers[index];
  const answered = picked !== undefined;
  const last = index === questions.length - 1;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-4" aria-label="Practice quiz">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Question {index + 1} of {questions.length}</p>
        <div className="flex gap-1" aria-hidden>
          {questions.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-5 rounded-full",
              i < answers.length ? (answers[i] === questions[i].answerIndex ? "bg-emerald-500" : "bg-rose-500") : i === index ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold text-foreground"><MarkdownRenderer content={q.question} /></div>
      <div className="mt-3 grid gap-2">
        {q.options.map((option, i) => {
          const isRight = i === q.answerIndex;
          const isPicked = i === picked;
          return (
            <button key={i} type="button" disabled={answered} onClick={() => setAnswers((a) => [...a.slice(0, index), i])}
              aria-label={`${LETTERS[i]}) ${option}`}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                !answered && "border-border hover:border-primary/50 hover:bg-primary/5",
                answered && isRight && "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
                answered && isPicked && !isRight && "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100",
                answered && !isRight && !isPicked && "border-border opacity-60",
              )}
            >
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                answered && isRight ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200"
                  : answered && isPicked ? "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200"
                    : "bg-muted text-muted-foreground")}>
                {LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1"><MarkdownRenderer content={option} /></span>
              {answered && isRight && <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />}
              {answered && isPicked && !isRight && <X className="size-4 shrink-0 text-rose-600" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 rounded-xl bg-muted/60 p-3 text-sm" role="status">
          <p className={cn("font-semibold", picked === q.answerIndex ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
            {picked === q.answerIndex ? "Correct!" : `Not quite. The answer is ${LETTERS[q.answerIndex]}.`}
          </p>
          {q.explanation && <p className="mt-1 text-foreground">{q.explanation}</p>}
          <button type="button" disabled={saving} onClick={() => (last ? finish(answers) : setIndex((i) => i + 1))}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {last ? "See my score" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}
