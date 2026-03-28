import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, XCircle, ChevronRight,
  Trophy, RefreshCw, Play, RotateCcw, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useStartPYQSession, useSubmitPYQAnswer } from "@/hooks/use-student";
import type { PYQQuestion, PYQSubmitResult } from "@/lib/api/student";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EXAM_LABELS: Record<string, string> = {
  jee_mains: "JEE Mains",
  jee_advanced: "JEE Advanced",
  neet: "NEET",
};

const CURRENT_YEAR = new Date().getFullYear();
// Years from 2000 up to current year
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

type QuizPhase = "setup" | "quiz" | "result";

interface SessionResult {
  questionId: string;
  isCorrect: boolean;
  xpAwarded: number;
}

// ── Single quiz question ───────────────────────────────────────────────────────

function QuizQuestion({
  question,
  qNumber,
  total,
  onNext,
  isLast,
}: {
  question: PYQQuestion;
  qNumber: number;
  total: number;
  onNext: (result: SessionResult) => void;
  isLast: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [intInput, setIntInput] = useState("");
  const [submitResult, setSubmitResult] = useState<PYQSubmitResult | null>(null);
  const [startTime] = useState(Date.now());
  const submitMutation = useSubmitPYQAnswer();

  const isAnswered = !!submitResult;
  const correctIds = submitResult?.correctOptionIds ?? [];

  function handleOptionClick(optId: string) {
    if (isAnswered) return;
    if (question.type === "mcq_single") setSelected([optId]);
    else
      setSelected((prev) =>
        prev.includes(optId) ? prev.filter((x) => x !== optId) : [...prev, optId]
      );
  }

  async function handleSubmit() {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const payload: Record<string, unknown> = { timeTakenSeconds: timeTaken };
    if (question.type === "integer") payload.integerResponse = intInput;
    else payload.selectedOptionIds = selected;
    const res = await submitMutation.mutateAsync({ topicId: question.topicId, questionId: question.id, payload });
    setSubmitResult(res);
  }

  const canSubmit =
    question.type === "integer" ? intInput.trim() !== "" : selected.length > 0;

  const examLabel = EXAM_LABELS[question.pyqExam] ?? question.pyqExam;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">
          {qNumber} / {total}
        </span>
        <Progress value={(qNumber / total) * 100} className="flex-1 h-2" />
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Year + exam strip — always visible */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {question.pyqYear}
              </span>
            </div>
            <Badge variant="outline" className="text-xs font-medium">
              {examLabel}
            </Badge>
            {question.pyqShift && (
              <Badge variant="outline" className="text-xs">
                {question.pyqShift}
              </Badge>
            )}
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
                question.difficulty === "easy"
                  ? "text-green-700 bg-green-50 border-green-200"
                  : question.difficulty === "hard"
                  ? "text-red-700 bg-red-50 border-red-200"
                  : "text-yellow-700 bg-yellow-50 border-yellow-200"
              )}
            >
              {question.difficulty}
            </span>
          </div>

          {/* Question text */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {question.questionText}
          </p>
          {question.questionImageUrl && (
            <img
              src={question.questionImageUrl}
              alt="question"
              className="max-h-48 rounded object-contain"
            />
          )}

          {/* Options / Integer */}
          {question.type === "integer" ? (
            <div className="space-y-2">
              <input
                type="text"
                value={intInput}
                onChange={(e) => setIntInput(e.target.value)}
                disabled={isAnswered}
                placeholder="Enter integer answer"
                className="border rounded px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 bg-background"
              />
              {submitResult && (
                <p className="text-sm">
                  Correct answer:{" "}
                  <span className="font-bold text-green-600">
                    {submitResult.correctIntegerAnswer}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {question.options.map((opt) => {
                const isSelected = selected.includes(opt.id);
                const isCorrectOpt = correctIds.includes(opt.id);
                let cls = "border bg-card text-foreground cursor-pointer hover:border-primary/50";
                if (isAnswered) {
                  if (isCorrectOpt)
                    cls =
                      "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
                  else if (isSelected)
                    cls =
                      "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200";
                  else cls = "border-border opacity-50 bg-muted/40 cursor-default";
                } else if (isSelected) {
                  cls = "border-primary bg-primary/10 text-primary cursor-pointer";
                }
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleOptionClick(opt.id)}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-sm transition-all select-none",
                      cls
                    )}
                  >
                    {opt.text}
                  </div>
                );
              })}
            </div>
          )}

          {/* Submit */}
          {!isAnswered && (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? "Submitting…" : "Submit Answer"}
            </Button>
          )}

          {/* Result + Explanation + Next */}
          {isAnswered && (
            <div className="space-y-3">
              <div
                className={cn(
                  "flex items-center gap-2 font-semibold text-sm",
                  submitResult.isCorrect ? "text-green-600" : "text-red-500"
                )}
              >
                {submitResult.isCorrect ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Correct!
                    {submitResult.xpAwarded > 0 && (
                      <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        +{submitResult.xpAwarded} XP
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    Incorrect
                  </>
                )}
              </div>

              {submitResult.explanation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-semibold block mb-1">Explanation</span>
                  <span className="whitespace-pre-wrap">{submitResult.explanation}</span>
                </div>
              )}

              <Button
                onClick={() =>
                  onNext({
                    questionId: question.id,
                    isCorrect: submitResult.isCorrect,
                    xpAwarded: submitResult.xpAwarded,
                  })
                }
                className="w-full gap-2"
              >
                {isLast ? (
                  <>
                    <Trophy className="h-4 w-4" />
                    See Results
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Next Question
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Result screen ──────────────────────────────────────────────────────────────

function ResultScreen({
  results,
  total,
  onRestart,
}: {
  results: SessionResult[];
  total: number;
  onRestart: () => void;
}) {
  const correct = results.filter((r) => r.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalXP = results.reduce((s, r) => s + r.xpAwarded, 0);

  return (
    <Card className="text-center">
      <CardContent className="py-10 space-y-6">
        <div>
          <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <p className="text-muted-foreground text-sm mt-1">Here's how you did</p>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="text-2xl font-bold text-green-600">{correct}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Correct</div>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">Accuracy</div>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="text-2xl font-bold text-yellow-600">{totalXP}</div>
            <div className="text-xs text-muted-foreground mt-0.5">XP Earned</div>
          </div>
        </div>

        <Button onClick={onRestart} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Practice Again
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

// Build a cache key from topicId + active filters
function buildCacheKey(topicId: string, filters: Record<string, unknown>) {
  return `pyq_session:${topicId}:${JSON.stringify(filters)}`;
}

function readCache(key: string): PYQQuestion[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PYQQuestion[];
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, questions: PYQQuestion[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(questions));
  } catch {
    // storage full or unavailable — silently skip
  }
}

export default function StudentPYQPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);

  // Setup form — "all" means no filter applied for that field
  const [startYear, setStartYear] = useState("all");
  const [endYear, setEndYear] = useState("all");
  const [exam, setExam] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const startSession = useStartPYQSession();

  // Returns the active filters as an object (only non-"all" values)
  function activeFilters() {
    const f: Record<string, unknown> = {};
    if (startYear !== "all") f.startYear = parseInt(startYear);
    if (endYear !== "all") f.endYear = parseInt(endYear);
    if (exam !== "all") f.exam = exam;
    if (difficulty !== "all") f.difficulty = difficulty;
    return f;
  }

  async function handleStart() {
    const filters = activeFilters();
    const cacheKey = buildCacheKey(topicId!, filters);

    // Serve from cache instantly if available
    const cached = readCache(cacheKey);
    if (cached) {
      setQuestions(cached);
      setCurrentIndex(0);
      setResults([]);
      setPhase("quiz");
      return;
    }

    // Not cached — call API (may trigger AI generation)
    const payload: Record<string, unknown> = { limit: 200, ...filters };
    const data = await startSession.mutateAsync({ topicId: topicId!, payload });

    if (!data.questions.length) {
      toast.error("Could not generate questions. Please try again.");
      return;
    }

    // Cache the result for subsequent visits in this session
    writeCache(cacheKey, data.questions);

    setQuestions(data.questions);
    setCurrentIndex(0);
    setResults([]);
    setPhase("quiz");
  }

  function handleNext(result: SessionResult) {
    const newResults = [...results, result];
    setResults(newResults);
    const next = currentIndex + 1;
    if (next >= questions.length) {
      setPhase("result");
    } else {
      setCurrentIndex(next);
    }
  }

  // Check cache count whenever filters change so the button can reflect readiness
  const [cachedCount, setCachedCount] = useState(0);
  useEffect(() => {
    const cached = readCache(buildCacheKey(topicId!, activeFilters()));
    setCachedCount(cached?.length ?? 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, startYear, endYear, exam, difficulty]);

  function handleRestart() {
    setPhase("setup");
    setQuestions([]);
    setCurrentIndex(0);
    setResults([]);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (phase === "quiz" ? handleRestart() : navigate(-1))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">PYQ Practice</h1>
          <p className="text-sm text-muted-foreground">Previous Year Questions</p>
        </div>
      </div>

      {/* Setup */}
      {phase === "setup" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Configure Your Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Year range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">From Year</label>
                <Select value={startYear} onValueChange={setStartYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">To Year</label>
                <Select value={endYear} onValueChange={setEndYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exam */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Exam</label>
              <Select value={exam} onValueChange={setExam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {Object.entries(EXAM_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => handleStart()}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating questions…
                </>
              ) : cachedCount > 0 ? (
                <>
                  <Play className="h-4 w-4" />
                  Start Practice
                  <span className="ml-1 text-xs opacity-80">({cachedCount} ready)</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Practice
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quiz */}
      {phase === "quiz" && questions.length > 0 && (
        <QuizQuestion
          key={questions[currentIndex].id}
          question={questions[currentIndex]}
          qNumber={currentIndex + 1}
          total={questions.length}
          onNext={handleNext}
          isLast={currentIndex === questions.length - 1}
        />
      )}

      {/* Results */}
      {phase === "result" && (
        <ResultScreen
          results={results}
          total={questions.length}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
