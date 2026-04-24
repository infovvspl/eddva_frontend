import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsCompactLayout } from "@/hooks/use-mobile";
import {
  getMyBatches,
  getMockTests,
  getMockTestById,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  getMockTestSessions,
  getQuestionBank,
  createQuestion,
  type MockTest,
  type MockTestSession,
  type BankQuestion,
  type CreateMockTestPayload,
  type CreateQuestionPayload,
} from "@/lib/api/teacher";
import { apiClient, extractData } from "@/lib/api/client";
import { QuizAnalyticsModal } from "@/components/teacher/QuizAnalyticsModal";
import {
  BookOpen, Plus, Trash2, Edit2, Eye, BarChart2, X, ChevronRight, ChevronLeft,
  Shuffle, CheckSquare, RefreshCw, Clock, Target, Users, Loader2, Sparkles,
  Search, Filter, Check, AlertCircle, Download, Share2, Play, Calendar,
  PlusCircle, MinusCircle, Brain,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type DifficultyLevel = "easy" | "medium" | "hard";
type QuestionType = "mcq_single" | "mcq_multi" | "integer";
type TestScope = "topic" | "chapter" | "subject" | "full_mock";

interface LocalOption {
  label: string;   // A, B, C, D
  content: string;
  isCorrect: boolean;
}

interface LocalQuestion {
  _localId: string;        // client-side id
  savedId?: string;        // set after POST /content/questions
  fromBank?: boolean;      // picked from question bank
  topicId: string;
  topicName?: string;      // display label in question list
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marksCorrect: number;
  marksWrong: number;
  integerAnswer?: string;
  /** Saved as question.solutionText — from AI explanation / teacher notes */
  solutionText?: string;
  options: LocalOption[];
}

interface WizardState {
  step: 1 | 2 | 3;
  // Step 1
  testScope: TestScope;
  batchId: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  topicId: string;
  topicName: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  scheduledAt: string;
  // Step 2
  questions: LocalQuestion[];
  // Step 3
  shuffleQuestions: boolean;
  showAnswersAfterSubmit: boolean;
  allowReattempt: boolean;
  publishNow: boolean;
}

const DEFAULT_WIZARD: WizardState = {
  step: 1,
  testScope: "topic",
  batchId: "",
  subjectId: "",
  subjectName: "",
  chapterId: "",
  chapterName: "",
  topicId: "",
  topicName: "",
  title: "",
  durationMinutes: 60,
  totalMarks: 100,
  passingMarks: 40,
  scheduledAt: "",
  questions: [],
  shuffleQuestions: false,
  showAnswersAfterSubmit: true,
  allowReattempt: false,
  publishNow: true,
};

function makeLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function emptyMcqQuestion(topicId: string): LocalQuestion {
  return {
    _localId: makeLocalId(),
    topicId,
    content: "",
    type: "mcq_single",
    difficulty: "medium",
    marksCorrect: 4,
    marksWrong: -1,
    options: [
      { label: "A", content: "", isCorrect: false },
      { label: "B", content: "", isCorrect: false },
      { label: "C", content: "", isCorrect: false },
      { label: "D", content: "", isCorrect: false },
    ],
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<DifficultyLevel, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

const STATUS_BADGE: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  scheduled: "bg-blue-100 text-blue-700",
};

function getQuizStatus(q: MockTest): string {
  if (q.isPublished) return "published";
  if (q.scheduledAt) return "scheduled";
  return "draft";
}

function computeTotalMarksFromQuestions(questions: LocalQuestion[]) {
  return questions.reduce((s, q) => s + q.marksCorrect, 0);
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Quiz Details", "Add Questions", "Settings & Publish"];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-center">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                active ? "bg-white/20" : done ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
              )}>
                {done ? <Check className="w-3 h-3" /> : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < 2 && <div className={cn("w-8 h-px mx-1", step > n ? "bg-primary" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Quiz Details ──────────────────────────────────────────────────

interface Step1Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
}

const SCOPE_OPTIONS: { key: TestScope; label: string; desc: string }[] = [
  { key: "topic",    label: "Topic Test",    desc: "Single topic" },
  { key: "chapter",  label: "Chapter Test",  desc: "All topics in a chapter" },
  { key: "subject",  label: "Subject Test",  desc: "All chapters in a subject" },
  { key: "full_mock",label: "Full Mock",      desc: "Complete syllabus" },
];

const SEL = "mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

function Step1QuizDetails({ state, onChange, onNext }: Step1Props) {
  const { data: batches = [] } = useQuery({ queryKey: ["my-batches"], queryFn: getMyBatches });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics,   setTopics]   = useState<any[]>([]);

  // Reset cascade when scope changes
  const handleScopeChange = (scope: TestScope) => {
    onChange({ testScope: scope, subjectId: "", subjectName: "", chapterId: "", chapterName: "", topicId: "", topicName: "" });
    setChapters([]); setTopics([]);
  };

  // Load subjects when batch changes
  useEffect(() => {
    onChange({ subjectId: "", subjectName: "", chapterId: "", chapterName: "", topicId: "", topicName: "" });
    setSubjects([]); setChapters([]); setTopics([]);
    if (!state.batchId) return;
    apiClient.get(`/content/subjects?batchId=${state.batchId}`).then(r => {
      const d = extractData<any[]>(r);
      setSubjects(Array.isArray(d) ? d : (d as any)?.data ?? []);
    }).catch(() => {});
  }, [state.batchId]);

  // Load chapters when subject changes
  useEffect(() => {
    onChange({ chapterId: "", chapterName: "", topicId: "", topicName: "" });
    setChapters([]); setTopics([]);
    if (!state.subjectId) return;
    apiClient.get(`/content/chapters?subjectId=${state.subjectId}`).then(r => {
      const d = extractData<any[]>(r);
      setChapters(Array.isArray(d) ? d : (d as any)?.data ?? []);
    }).catch(() => {});
  }, [state.subjectId]);

  // Load topics when chapter changes
  useEffect(() => {
    onChange({ topicId: "", topicName: "" });
    setTopics([]);
    if (!state.chapterId) return;
    apiClient.get(`/content/topics?chapterId=${state.chapterId}`).then(r => {
      const d = extractData<any[]>(r);
      setTopics(Array.isArray(d) ? d : (d as any)?.data ?? []);
    }).catch(() => {});
  }, [state.chapterId]);

  const scopeValid =
    state.testScope === "full_mock" ? true :
    state.testScope === "subject"   ? !!state.subjectId :
    state.testScope === "chapter"   ? !!state.chapterId :
    true; // topic: topicId is optional

  const valid = !!state.batchId && !!state.title.trim() && state.durationMinutes > 0 && state.totalMarks > 0 && scopeValid;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Quiz Details</h2>

      {/* ── Test Scope ── */}
      <div>
        <label className="text-sm font-medium text-foreground">Test Scope</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {SCOPE_OPTIONS.map(s => (
            <button key={s.key} type="button" onClick={() => handleScopeChange(s.key)}
              className={cn("border rounded-xl p-3 text-left transition-colors",
                state.testScope === s.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
              <p className={cn("text-sm font-semibold", state.testScope === s.key ? "text-primary" : "text-foreground")}>{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Batch */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-foreground">Batch *</label>
          <select value={state.batchId} onChange={e => onChange({ batchId: e.target.value })} className={SEL}>
            <option value="">Select batch</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Subject — shown for topic/chapter/subject scope */}
        {state.testScope !== "full_mock" && (
          <div>
            <label className="text-sm font-medium text-foreground">
              Subject{state.testScope === "subject" ? " *" : ""}
            </label>
            <select value={state.subjectId} disabled={!state.batchId}
              onChange={e => {
                const s = subjects.find(x => x.id === e.target.value);
                onChange({ subjectId: e.target.value, subjectName: s?.name ?? "" });
              }}
              className={SEL}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Chapter — shown for topic/chapter scope */}
        {(state.testScope === "topic" || state.testScope === "chapter") && (
          <div>
            <label className="text-sm font-medium text-foreground">
              Chapter{state.testScope === "chapter" ? " *" : ""}
            </label>
            <select value={state.chapterId} disabled={!state.subjectId}
              onChange={e => {
                const c = chapters.find(x => x.id === e.target.value);
                onChange({ chapterId: e.target.value, chapterName: c?.name ?? "" });
              }}
              className={SEL}>
              <option value="">Select chapter</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Topic — shown for topic scope only */}
        {state.testScope === "topic" && (
          <div>
            <label className="text-sm font-medium text-foreground">Topic (optional)</label>
            <select value={state.topicId} disabled={!state.chapterId}
              onChange={e => {
                const t = topics.find(x => x.id === e.target.value);
                onChange({ topicId: e.target.value, topicName: t?.name ?? "" });
              }}
              className={SEL}>
              <option value="">All topics in chapter</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* Scope info badge */}
        {(state.testScope === "chapter" && state.chapterName) && (
          <div className="sm:col-span-2 flex items-center gap-2 bg-blue-500/8 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            Chapter test will cover <strong>all topics</strong> under <strong>{state.chapterName}</strong>. You'll choose topics per-question in Step 2.
          </div>
        )}
        {(state.testScope === "subject" && state.subjectName) && (
          <div className="sm:col-span-2 flex items-center gap-2 bg-violet-500/8 border border-violet-500/20 rounded-lg px-3 py-2 text-xs text-violet-700 dark:text-violet-400">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            Subject test will cover <strong>all chapters</strong> under <strong>{state.subjectName}</strong>. You'll choose topics per-question in Step 2.
          </div>
        )}
        {state.testScope === "full_mock" && (
          <div className="sm:col-span-2 flex items-center gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            Full mock — add questions from any subject, chapter, or topic in Step 2.
          </div>
        )}

        {/* Title */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-foreground">Quiz Title *</label>
          <input value={state.title} onChange={e => onChange({ title: e.target.value })}
            placeholder={
              state.testScope === "chapter" && state.chapterName ? `${state.chapterName} Test` :
              state.testScope === "subject" && state.subjectName ? `${state.subjectName} Test` :
              "e.g. Thermodynamics Chapter Test"
            }
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Duration / Marks */}
        <div>
          <label className="text-sm font-medium text-foreground">Duration (minutes) *</label>
          <input type="number" min={5} max={300} value={state.durationMinutes}
            onChange={e => onChange({ durationMinutes: Number(e.target.value) })} className={SEL} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Total Marks *</label>
          <input type="number" min={1} value={state.totalMarks}
            onChange={e => onChange({ totalMarks: Number(e.target.value) })} className={SEL} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Passing Marks</label>
          <input type="number" min={0} value={state.passingMarks}
            onChange={e => onChange({ passingMarks: Number(e.target.value) })} className={SEL} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={onNext} disabled={!valid}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Next: Add Questions <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Manual Question Form ──────────────────────────────────────────────────

function ManualQuestionForm({ topicId, topicName, onAdd }: { topicId: string; topicName?: string; onAdd: (q: LocalQuestion) => void }) {
  const [q, setQ] = useState<LocalQuestion>(emptyMcqQuestion(topicId || ""));

  useEffect(() => {
    if (topicId) setQ(prev => ({ ...prev, topicId }));
  }, [topicId]);

  const updateOption = (i: number, content: string) => {
    setQ(prev => {
      const opts = [...prev.options];
      opts[i] = { ...opts[i], content };
      return { ...prev, options: opts };
    });
  };

  const setCorrect = (i: number) => {
    setQ(prev => ({
      ...prev,
      options: prev.options.map((o, idx) =>
        prev.type === "mcq_single"
          ? { ...o, isCorrect: idx === i }
          : { ...o, isCorrect: idx === i ? !o.isCorrect : o.isCorrect }
      ),
    }));
  };

  const canAdd =
    q.content.trim() &&
    (q.type === "integer"
      ? q.integerAnswer?.trim()
      : q.options.every(o => o.content.trim()) && q.options.some(o => o.isCorrect));

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ ...q, topicId: topicId || q.topicId, topicName: topicName || undefined });
    setQ(emptyMcqQuestion(topicId || ""));
  };

  return (
    <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-center gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select value={q.type} onChange={(e) => setQ(prev => ({ ...prev, type: e.target.value as QuestionType }))}
            className="mt-1 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="mcq_single">MCQ (Single)</option>
            <option value="mcq_multi">MCQ (Multi)</option>
            <option value="integer">Integer</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
          <select value={q.difficulty} onChange={(e) => setQ(prev => ({ ...prev, difficulty: e.target.value as DifficultyLevel }))}
            className="mt-1 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Marks (correct)</label>
          <input type="number" value={q.marksCorrect}
            onChange={(e) => setQ(prev => ({ ...prev, marksCorrect: Number(e.target.value) }))}
            className="mt-1 w-20 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Negative marks</label>
          <input type="number" value={q.marksWrong}
            onChange={(e) => setQ(prev => ({ ...prev, marksWrong: Number(e.target.value) }))}
            className="mt-1 w-20 border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Question *</label>
        <textarea
          value={q.content}
          onChange={(e) => setQ(prev => ({ ...prev, content: e.target.value }))}
          rows={2}
          placeholder="Type your question here... (supports LaTeX: $\frac{1}{2}$)"
          className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      {q.type === "integer" ? (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Correct Answer (integer) *</label>
          <input
            value={q.integerAnswer || ""}
            onChange={(e) => setQ(prev => ({ ...prev, integerAnswer: e.target.value }))}
            placeholder="e.g. 42"
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Options * — {q.type === "mcq_single" ? "Click to mark correct answer" : "Click to toggle correct answers"}
          </label>
          {q.options.map((opt, i) => (
            <div key={i} className={cn("flex items-center gap-2 border rounded-lg px-3 py-2 transition-colors cursor-pointer",
              opt.isCorrect ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-50/20" : "border-border")}>
              <button
                type="button"
                onClick={() => setCorrect(i)}
                className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  opt.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground")}
              >
                {opt.isCorrect && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className="font-bold text-sm text-muted-foreground w-4">{opt.label}</span>
              <input
                value={opt.content}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${opt.label}`}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> Add Question
        </button>
      </div>
    </div>
  );
}

// ─── Question Bank Browser ─────────────────────────────────────────────────

function QuestionBankBrowser({
  topicId,
  selectedIds,
  onToggle,
}: {
  topicId: string;
  selectedIds: Set<string>;
  onToggle: (q: BankQuestion) => void;
}) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["question-bank", topicId, difficulty, type, search, page],
    queryFn: () => getQuestionBank({ topicId: topicId || undefined, difficulty: difficulty || undefined, type: type || undefined, search: search || undefined, page, limit: 20 }),
    placeholderData: (prev) => prev,
  });

  const questions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search questions..."
            className="pl-8 pr-3 py-1.5 w-full border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
          className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none">
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none">
          <option value="">All types</option>
          <option value="mcq_single">MCQ Single</option>
          <option value="mcq_multi">MCQ Multi</option>
          <option value="integer">Integer</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading question bank...
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No questions found{topicId ? " for the selected topic" : ""}.
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {questions.map((q) => {
            const sel = selectedIds.has(q.id);
            return (
              <div key={q.id}
                onClick={() => onToggle(q)}
                className={cn("border rounded-lg p-3 cursor-pointer transition-colors",
                  sel ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                <div className="flex items-start gap-3">
                  <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                    sel ? "border-primary bg-primary" : "border-muted-foreground")}>
                    {sel && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{q.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", DIFFICULTY_COLOR[q.difficulty as DifficultyLevel] || "bg-muted text-muted-foreground")}>
                        {q.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">{q.type.replace("_", " ")}</span>
                      <span className="text-xs text-muted-foreground">+{q.marksCorrect} / {q.marksWrong}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
          <span>{meta.total} questions</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 border border-border rounded hover:bg-secondary disabled:opacity-50">Prev</button>
            <span>{page} / {meta.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
              className="px-2 py-1 border border-border rounded hover:bg-secondary disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────

/** Accepts any AI response shape and returns a flat array of raw question objects. */
function extractQuestionList(raw: any): any[] {
  if (!raw) return [];
  // Already a plain array
  if (Array.isArray(raw)) return raw;
  // { questions: [...] } envelope (Django / Ollama)
  if (Array.isArray(raw?.questions)) return raw.questions;
  // { data: [...] } envelope (NestJS global wrapper)
  if (Array.isArray(raw?.data)) return raw.data;
  // { data: { questions: [...] } }
  if (Array.isArray(raw?.data?.questions)) return raw.data.questions;
  return [];
}

function mapAiResponseToLocal(
  data: any[],
  topicId: string,
  topicName: string | undefined,
  type: QuestionType,
  difficulty: DifficultyLevel,
): LocalQuestion[] {
  const FB = ["A", "B", "C", "D", "E"];

  return data.map((q: any) => {
    // Question text — all known field names
    const content = (
      q.content || q.question || q.questionText || q.question_text || q.text || ""
    ).trim();

    // Correct answer letter — all known field names
    const correctLetter = (
      q.correctOption || q.correct_option ||
      q.correctAnswer || q.correct_answer ||
      q.answer || ""
    ).trim().toUpperCase();

    // Options — handle {label,text}, {label,content}, or plain strings
    const options: LocalOption[] = (q.options || []).map((o: any, i: number) => {
      const optText = (typeof o === "string" ? o : (o.text || o.content || o.value || "")).trim();
      const label = (typeof o === "object" && o.label)
        ? String(o.label).toUpperCase()
        : (FB[i] ?? String.fromCharCode(65 + i));
      const isCorrect = ("isCorrect" in (typeof o === "object" ? o : {}))
        ? !!o.isCorrect
        : (correctLetter !== "" && label === correctLetter);
      return { label, content: optText, isCorrect };
    });

    // If no options, add 4 empty placeholders so the editor renders properly
    if (options.length === 0) {
      FB.slice(0, 4).forEach(label => options.push({ label, content: "", isCorrect: false }));
    }

    const explanationRaw = (
      q.explanation ||
      q.solutionText ||
      q.solution_text ||
      q.solution ||
      q.rationale ||
      q.reasoning ||
      ""
    );
    const solutionText = String(explanationRaw).trim() || undefined;

    return {
      _localId: makeLocalId(),
      topicId,
      topicName: topicName || undefined,
      content,
      type,
      difficulty,
      marksCorrect: 4,
      marksWrong: type === "integer" ? 0 : -1,
      integerAnswer: (q.integerAnswer ?? null) as string | undefined,
      solutionText,
      options,
    };
  });
}

// ─── AI Review Panel — editable question cards shown after AI generation ─────

function AiReviewPanel({
  initialQuestions,
  onConfirm,
  onDiscard,
}: {
  initialQuestions: LocalQuestion[];
  onConfirm: (selected: LocalQuestion[]) => void;
  onDiscard: () => void;
}) {
  const [questions, setQuestions] = useState<LocalQuestion[]>(initialQuestions);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialQuestions.map(q => q._localId)),
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    initialQuestions[0]?._localId ?? null,
  );

  const updateQ = (localId: string, patch: Partial<LocalQuestion>) =>
    setQuestions(prev => prev.map(q => q._localId === localId ? { ...q, ...patch } : q));

  const updateOption = (localId: string, idx: number, content: string) =>
    setQuestions(prev => prev.map(q => {
      if (q._localId !== localId) return q;
      const opts = [...q.options];
      opts[idx] = { ...opts[idx], content };
      return { ...q, options: opts };
    }));

  const setCorrect = (localId: string, idx: number) =>
    setQuestions(prev => prev.map(q => {
      if (q._localId !== localId) return q;
      return {
        ...q,
        options: q.options.map((o, i) =>
          q.type === "mcq_single"
            ? { ...o, isCorrect: i === idx }
            : { ...o, isCorrect: i === idx ? !o.isCorrect : o.isCorrect }
        ),
      };
    }));

  const toggle = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allSelected = selectedIds.size === questions.length;

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Review AI Questions</span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {selectedIds.size} / {questions.length} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedIds(allSelected ? new Set() : new Set(questions.map(q => q._localId)))}
            className="text-xs font-medium text-primary hover:underline"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            Discard
          </button>
          <button
            onClick={() => onConfirm(questions.filter(q => selectedIds.has(q._localId)))}
            disabled={selectedIds.size === 0}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Add {selectedIds.size} to Test
          </button>
        </div>
      </div>

      {/* Editable question cards */}
      <div className="max-h-[600px] overflow-y-auto p-3 space-y-3">
        {questions.map((q, idx) => {
          const selected = selectedIds.has(q._localId);
          const expanded = expandedId === q._localId;
          return (
            <div
              key={q._localId}
              className={cn(
                "border rounded-xl overflow-hidden transition-all",
                selected ? "border-border" : "border-dashed border-muted-foreground/30 opacity-50",
              )}
            >
              {/* Card header row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 select-none"
                onClick={() => setExpandedId(expanded ? null : q._localId)}
              >
                {/* Select checkbox */}
                <div
                  onClick={(e) => { e.stopPropagation(); toggle(q._localId); }}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    selected ? "border-primary bg-primary" : "border-muted-foreground/40",
                  )}
                >
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className={cn("flex-1 text-sm truncate", !q.content && "italic text-muted-foreground")}>
                  {q.content || "Empty question..."}
                </p>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", DIFFICULTY_COLOR[q.difficulty])}>
                  {q.difficulty}
                </span>
                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", expanded && "rotate-90")} />
              </div>

              {/* Expanded editor — matches ManualQuestionForm layout */}
              {expanded && (
                <div className="px-4 pb-5 pt-2 space-y-4 border-t border-border bg-background/60">
                  {/* Question textarea */}
                  <textarea
                    value={q.content}
                    onChange={(e) => updateQ(q._localId, { content: e.target.value })}
                    rows={3}
                    placeholder="Question text..."
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />

                  {/* Type / Difficulty / Marks */}
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Type</label>
                      <select
                        value={q.type}
                        onChange={(e) => updateQ(q._localId, { type: e.target.value as QuestionType })}
                        className="mt-1 block border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="mcq_single">MCQ Single</option>
                        <option value="mcq_multi">MCQ Multi</option>
                        <option value="integer">Integer</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                      <select
                        value={q.difficulty}
                        onChange={(e) => updateQ(q._localId, { difficulty: e.target.value as DifficultyLevel })}
                        className="mt-1 block border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Marks +/-</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="number"
                          value={q.marksCorrect}
                          onChange={(e) => updateQ(q._localId, { marksCorrect: Number(e.target.value) })}
                          className="w-16 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                        />
                        <input
                          type="number"
                          value={q.marksWrong}
                          onChange={(e) => updateQ(q._localId, { marksWrong: Number(e.target.value) })}
                          className="w-16 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  {q.type !== "integer" ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Options (tick correct)</label>
                      {q.options.map((opt, i) => (
                        <div
                          key={opt.label}
                          className={cn(
                            "flex items-center gap-3 border rounded-xl px-4 py-2.5 transition-colors",
                            opt.isCorrect
                              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                              : "border-border bg-background",
                          )}
                        >
                          <span className="font-bold text-sm text-muted-foreground w-4 shrink-0">{opt.label}</span>
                          <input
                            value={opt.content}
                            onChange={(e) => updateOption(q._localId, i, e.target.value)}
                            placeholder={`Option ${opt.label}`}
                            className="flex-1 bg-transparent text-sm outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setCorrect(q._localId, i)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              opt.isCorrect
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-muted-foreground hover:border-emerald-400",
                            )}
                          >
                            {opt.isCorrect && <Check className="w-3 h-3 text-white" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Correct Answer (integer)</label>
                      <input
                        value={q.integerAnswer || ""}
                        onChange={(e) => updateQ(q._localId, { integerAnswer: e.target.value })}
                        placeholder="e.g. 42"
                        className="mt-1 w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Generate Panel ─────────────────────────────────────────────────────

function AiGeneratePanel({ topicId, topicName, onAdd }: { topicId: string; topicName: string; onAdd: (qs: LocalQuestion[]) => void }) {
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [type, setType] = useState<QuestionType>("mcq_single");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<LocalQuestion[] | null>(null);

  const generate = async () => {
    if (!topicId) { toast.error("Please select a topic first"); return; }
    setLoading(true);
    try {
      const res = await apiClient.post("/ai/questions/generate", {
        topicId,
        topicName: topicName || topicId,
        count,
        difficulty,
        type,
      }, { timeout: 120_000 });
      const raw = extractData<any>(res);
      const list = extractQuestionList(raw);
      if (list.length) {
        setPreview(mapAiResponseToLocal(list, topicId, topicName, type, difficulty));
        toast.success(`${list.length} questions ready — review before adding.`);
      } else {
        toast.error("No questions returned. The AI service may be unavailable.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "";
      toast.error(msg || "AI generation failed. Check the AI service is running.");
    } finally {
      setLoading(false);
    }
  };

  if (preview) {
    return (
      <AiReviewPanel
        initialQuestions={preview}
        onConfirm={(selected) => {
          if (selected.length) {
            onAdd(selected);
            toast.success(`${selected.length} question${selected.length > 1 ? "s" : ""} added to test.`);
          }
          setPreview(null);
        }}
        onDiscard={() => setPreview(null)}
      />
    );
  }

  return (
    <div className="border border-border rounded-xl p-5 space-y-4 bg-card">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-semibold">AI Question Generator</h3>
      </div>

      {!topicId && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-50/20 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Select a topic to enable AI generation.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Questions</label>
          <input type="number" min={1} max={30} value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as QuestionType)}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">
            <option value="mcq_single">MCQ Single</option>
            <option value="mcq_multi">MCQ Multi</option>
            <option value="integer">Integer</option>
          </select>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading || !topicId}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
        {loading ? "Generating questions…" : "Generate with AI"}
      </button>

      <p className="text-xs text-muted-foreground">
        Questions are shown for review before being added — you can deselect any you don't want.
      </p>
    </div>
  );
}

// ─── Multi-Topic AI Panel (chapter / subject scope) ───────────────────────

function MultiTopicAiPanel({ scope, subjectId, chapterId, scopeLabel, onAdd }: {
  scope: "chapter" | "subject";
  subjectId: string;
  chapterId: string;
  scopeLabel: string;
  onAdd: (qs: LocalQuestion[]) => void;
}) {
  const [count, setCount] = useState(15);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [type, setType] = useState<QuestionType>("mcq_single");
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [preview, setPreview] = useState<LocalQuestion[] | null>(null);

  // Load all topics for the scope
  useEffect(() => {
    setTopics([]);
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        if (scope === "chapter" && chapterId) {
          const r = await apiClient.get(`/content/topics?chapterId=${chapterId}`);
          const d = extractData<any[]>(r);
          setTopics(Array.isArray(d) ? d : (d as any)?.data ?? []);
        } else if (scope === "subject" && subjectId) {
          const cr = await apiClient.get(`/content/chapters?subjectId=${subjectId}`);
          const chapters: any[] = (() => { const d = extractData<any[]>(cr); return Array.isArray(d) ? d : (d as any)?.data ?? []; })();
          const all: any[] = [];
          for (const ch of chapters) {
            const tr = await apiClient.get(`/content/topics?chapterId=${ch.id}`);
            const d = extractData<any[]>(tr);
            all.push(...(Array.isArray(d) ? d : (d as any)?.data ?? []));
          }
          setTopics(all);
        }
      } catch { /* ignore */ }
      finally { setLoadingTopics(false); }
    };
    fetchTopics();
  }, [scope, subjectId, chapterId]);

  const generate = async () => {
    if (!topics.length) { toast.error("No topics found for this scope."); return; }
    setLoading(true);
    const perTopic = Math.ceil(count / topics.length);
    const all: LocalQuestion[] = [];
    setProgress({ done: 0, total: topics.length });
    for (const topic of topics) {
      try {
        const res = await apiClient.post("/ai/questions/generate", {
          topicId: topic.id,
          topicName: topic.name,
          count: perTopic,
          difficulty,
          type,
        }, { timeout: 120_000 });
        const raw = extractData<any>(res);
        const list = extractQuestionList(raw);
        if (list.length) {
          all.push(...mapAiResponseToLocal(list, topic.id, topic.name, type, difficulty));
        }
      } catch { /* skip failed topic */ }
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }
    const trimmed = all.slice(0, count);
    if (trimmed.length) {
      setPreview(trimmed);
      toast.success(`${trimmed.length} questions ready — review before adding.`);
    } else {
      toast.error("No questions generated. Check the AI service.");
    }
    setLoading(false);
    setProgress({ done: 0, total: 0 });
  };

  if (preview) {
    return (
      <AiReviewPanel
        initialQuestions={preview}
        onConfirm={(selected) => {
          if (selected.length) {
            onAdd(selected);
            toast.success(`${selected.length} question${selected.length > 1 ? "s" : ""} added to test.`);
          }
          setPreview(null);
        }}
        onDiscard={() => setPreview(null)}
      />
    );
  }

  return (
    <div className="border border-border rounded-xl p-5 space-y-4 bg-card">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold">AI Question Generator</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generating for: <span className="font-medium text-foreground">{scopeLabel}</span>
          </p>
        </div>
      </div>

      {/* Topics preview */}
      {loadingTopics ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading topics…
        </div>
      ) : topics.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{topics.length} topics found — AI will generate questions across all of them:</p>
          <div className="flex flex-wrap gap-1.5">
            {topics.map(t => (
              <span key={t.id} className="text-[11px] bg-primary/8 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-50/20 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No topics found. Add topics to this {scope} first.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Total Questions</label>
          <input type="number" min={1} max={100} value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
          {topics.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">~{Math.ceil(count / topics.length)} per topic</p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select value={type} onChange={e => setType(e.target.value as QuestionType)}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none">
            <option value="mcq_single">MCQ Single</option>
            <option value="mcq_multi">MCQ Multi</option>
            <option value="integer">Integer</option>
          </select>
        </div>
      </div>

      {/* Progress bar while generating */}
      {loading && progress.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Generating… topic {progress.done + 1} of {progress.total}</span>
            <span>{Math.round((progress.done / progress.total) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          </div>
        </div>
      )}

      <button onClick={generate} disabled={loading || !topics.length}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
        {loading ? `Generating… (${progress.done}/${progress.total})` : `Generate ${count} Questions with AI`}
      </button>

      <p className="text-xs text-muted-foreground">
        Questions are shown for review before being added — you can deselect any you don't want.
      </p>
    </div>
  );
}

// ─── Topic Picker (Step 2 — for chapter/subject/full_mock scope, Manual/Bank only) ─

function TopicPicker({ scope, subjectId, chapterId, value, onSelect }: {
  scope: TestScope;
  subjectId: string;
  chapterId: string;
  value: { topicId: string; topicName: string };
  onSelect: (topicId: string, topicName: string) => void;
}) {
  const [pickerChapters, setPickerChapters] = useState<any[]>([]);
  const [pickerTopics, setPickerTopics] = useState<any[]>([]);
  const [pickerChapterId, setPickerChapterId] = useState(chapterId || "");

  // For subject/full_mock: load chapters
  useEffect(() => {
    if (scope === "chapter") {
      // chapterId already known — just load its topics
      setPickerChapterId(chapterId);
    } else if ((scope === "subject" || scope === "full_mock") && subjectId) {
      apiClient.get(`/content/chapters?subjectId=${subjectId}`).then(r => {
        const d = extractData<any[]>(r);
        setPickerChapters(Array.isArray(d) ? d : (d as any)?.data ?? []);
      }).catch(() => {});
    }
  }, [scope, subjectId, chapterId]);

  // Load topics when pickerChapterId changes
  useEffect(() => {
    setPickerTopics([]);
    onSelect("", "");
    if (!pickerChapterId) return;
    apiClient.get(`/content/topics?chapterId=${pickerChapterId}`).then(r => {
      const d = extractData<any[]>(r);
      const list = Array.isArray(d) ? d : (d as any)?.data ?? [];
      setPickerTopics(list);
      if (list.length > 0) onSelect(list[0].id, list[0].name);
    }).catch(() => {});
  }, [pickerChapterId]);

  if (scope === "topic") return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-secondary/40 border border-border rounded-xl">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adding for:</span>

      {(scope === "subject" || scope === "full_mock") && (
        <select value={pickerChapterId} onChange={e => setPickerChapterId(e.target.value)}
          className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none min-w-[140px]">
          <option value="">— Chapter —</option>
          {pickerChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      <select value={value.topicId}
        onChange={e => {
          const t = pickerTopics.find(x => x.id === e.target.value);
          onSelect(e.target.value, t?.name ?? "");
        }}
        disabled={!pickerChapterId || pickerTopics.length === 0}
        className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none min-w-[140px] disabled:opacity-50">
        <option value="">— Topic —</option>
        {pickerTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {value.topicName && (
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
          {value.topicName}
        </span>
      )}
    </div>
  );
}

// ─── Step 2: Add Questions ─────────────────────────────────────────────────

type QuestionTab = "manual" | "bank" | "ai";

interface Step2Props {
  state: WizardState;
  onAdd: (qs: LocalQuestion[]) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

function Step2AddQuestions({ state, onAdd, onRemove, onBack, onNext }: Step2Props) {
  const [tab, setTab] = useState<QuestionTab>("manual");
  const [bankSelectedIds, setBankSelectedIds] = useState<Set<string>>(new Set(
    state.questions.filter(q => q.fromBank && q.savedId).map(q => q.savedId!)
  ));

  // Active topic for question panels (for non-topic scopes, driven by TopicPicker)
  const [activeTopicId, setActiveTopicId] = useState(state.topicId || "");
  const [activeTopicName, setActiveTopicName] = useState(state.topicName || "");

  const handleTopicSelect = (id: string, name: string) => {
    setActiveTopicId(id);
    setActiveTopicName(name);
  };

  const toggleBankQuestion = (bq: BankQuestion) => {
    setBankSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(bq.id)) {
        next.delete(bq.id);
        const found = state.questions.find(q => q.savedId === bq.id);
        if (found) onRemove(found._localId);
      } else {
        next.add(bq.id);
        onAdd([{
          _localId: makeLocalId(),
          savedId: bq.id,
          fromBank: true,
          topicId: bq.topicId,
          topicName: bq.topic?.name,
          content: bq.content,
          type: bq.type as QuestionType,
          difficulty: bq.difficulty as DifficultyLevel,
          marksCorrect: bq.marksCorrect,
          marksWrong: bq.marksWrong,
          options: (bq.options || []).map(o => ({ label: o.optionLabel, content: o.content, isCorrect: o.isCorrect })),
        }]);
      }
      return next;
    });
  };

  // Per-topic question counts for summary strip
  const topicCounts = state.questions.reduce<Record<string, { name: string; count: number }>>((acc, q) => {
    const key = q.topicId || "unknown";
    if (!acc[key]) acc[key] = { name: q.topicName || q.topicId || "Unknown topic", count: 0 };
    acc[key].count++;
    return acc;
  }, {});

  const totalMarksFromQuestions = computeTotalMarksFromQuestions(state.questions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Add Questions</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{state.questions.length} questions</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{totalMarksFromQuestions} marks</span>
        </div>
      </div>

      {/* Topic picker — shown for chapter/subject/full_mock scope, but NOT when AI tab is active for chapter/subject */}
      {state.testScope !== "topic" &&
        !(tab === "ai" && (state.testScope === "chapter" || state.testScope === "subject")) && (
        <TopicPicker
          scope={state.testScope}
          subjectId={state.subjectId}
          chapterId={state.chapterId}
          value={{ topicId: activeTopicId, topicName: activeTopicName }}
          onSelect={handleTopicSelect}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: input methods */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
            {(["manual", "bank", "ai"] as QuestionTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {t === "ai" ? "AI Generate" : t === "bank" ? "Question Bank" : "Manual"}
              </button>
            ))}
          </div>

          {tab === "manual" && (
            <ManualQuestionForm topicId={activeTopicId} topicName={activeTopicName} onAdd={q => onAdd([q])} />
          )}
          {tab === "bank" && (
            <QuestionBankBrowser topicId={activeTopicId} selectedIds={bankSelectedIds} onToggle={toggleBankQuestion} />
          )}
          {tab === "ai" && (state.testScope === "chapter" || state.testScope === "subject") && (
            <MultiTopicAiPanel
              scope={state.testScope}
              subjectId={state.subjectId}
              chapterId={state.chapterId}
              scopeLabel={state.testScope === "chapter" ? (state.chapterName || "Chapter") : (state.subjectName || "Subject")}
              onAdd={onAdd}
            />
          )}
          {tab === "ai" && state.testScope !== "chapter" && state.testScope !== "subject" && (
            <AiGeneratePanel topicId={activeTopicId} topicName={activeTopicName} onAdd={onAdd} />
          )}
        </div>

        {/* Right: question list */}
        <div className="lg:col-span-2 space-y-2">
          {/* Per-topic summary strip */}
          {Object.keys(topicCounts).length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(topicCounts).map(([tid, { name, count }]) => (
                <span key={tid} className="text-[10px] bg-secondary border border-border rounded-full px-2 py-1 text-muted-foreground">
                  {name} <strong className="text-foreground">{count}</strong>
                </span>
              ))}
            </div>
          )}

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quiz Questions</span>
              <span className="text-xs text-muted-foreground">{state.questions.length} added</span>
            </div>
            {state.questions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground px-3">
                No questions yet. Add from the left panel.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
                {state.questions.map((q, i) => (
                  <div key={q._localId} className="flex items-start gap-2 p-3">
                    <span className="text-xs font-mono text-muted-foreground mt-0.5 w-5 shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{q.content || <span className="italic text-muted-foreground">No content</span>}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={cn("text-xs px-1 py-0.5 rounded", DIFFICULTY_COLOR[q.difficulty])}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-muted-foreground">+{q.marksCorrect}/{q.marksWrong}</span>
                        {q.fromBank && <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-50/20 px-1 py-0.5 rounded">Bank</span>}
                        {q.topicName && (
                          <span className="text-[10px] text-violet-700 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                            {q.topicName}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => onRemove(q._localId)} className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} disabled={state.questions.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Next: Settings <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Settings & Publish ────────────────────────────────────────────

interface Step3Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn("w-11 h-6 rounded-full transition-colors relative",
          value ? "bg-primary" : "bg-muted-foreground/30")}
      >
        <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
          value ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}

function Step3Settings({ state, onChange, onBack, onSubmit, submitting }: Step3Props) {
  const totalQuestions = state.questions.length;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Settings & Publish</h2>

      {/* Summary card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "Questions", value: totalQuestions },
          { icon: Target, label: "Total Marks", value: state.totalMarks },
          { icon: Clock, label: "Duration", value: `${state.durationMinutes} min` },
          { icon: CheckSquare, label: "Pass Mark", value: state.passingMarks },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="border border-border rounded-xl p-3 text-center">
            <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="border border-border rounded-xl px-4 divide-y divide-border">
        <ToggleRow
          label="Shuffle Questions"
          description="Randomize question order for each student"
          value={state.shuffleQuestions}
          onChange={(v) => onChange({ shuffleQuestions: v })}
        />
        <ToggleRow
          label="Show Answers After Submit"
          description="Students can review correct answers after submitting"
          value={state.showAnswersAfterSubmit}
          onChange={(v) => onChange({ showAnswersAfterSubmit: v })}
        />
        <ToggleRow
          label="Allow Reattempt"
          description="Students can retake the quiz multiple times"
          value={state.allowReattempt}
          onChange={(v) => onChange({ allowReattempt: v })}
        />
      </div>

      {/* Publish options */}
      <div className="border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold">Publish Settings</p>
        <div className="flex gap-3">
          <button
            onClick={() => onChange({ publishNow: true, scheduledAt: "" })}
            className={cn("flex-1 border rounded-xl p-3 text-sm font-medium transition-colors",
              state.publishNow ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40")}
          >
            <Play className="w-4 h-4 mx-auto mb-1" />
            Publish Now
          </button>
          <button
            onClick={() => onChange({ publishNow: false })}
            className={cn("flex-1 border rounded-xl p-3 text-sm font-medium transition-colors",
              !state.publishNow ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40")}
          >
            <Calendar className="w-4 h-4 mx-auto mb-1" />
            Schedule
          </button>
        </div>
        {!state.publishNow && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={state.scheduledAt}
              onChange={(e) => onChange({ scheduledAt: e.target.value })}
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {submitting ? "Creating..." : state.publishNow ? "Create & Publish" : "Create Quiz"}
        </button>
      </div>
    </div>
  );
}

// ─── Quiz List Card ────────────────────────────────────────────────────────

function QuizCard({ quiz, onView, onDelete }: {
  quiz: MockTest;
  onView: () => void;
  onDelete: () => void;
}) {
  const status = getQuizStatus(quiz);
  return (
    <div
      onClick={onView}
      className="border border-border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_BADGE[status] || STATUS_BADGE.draft)}>
              {status}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{quiz.type?.replace(/_/g, " ")}</span>
          </div>
          <h3 className="font-semibold mt-1.5 truncate group-hover:text-primary transition-colors">{quiz.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{quiz.questionIds?.length ?? 0} Qs</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.durationMinutes} min</span>
            <span className="flex items-center gap-1"><Target className="w-3 h-3" />{quiz.totalMarks} marks</span>
          </div>
          {quiz.scheduledAt && (
            <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(quiz.scheduledAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-muted-foreground hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {quiz.isPublished ? "Click to view analytics" : "Click to manage quiz"}
        </span>
        <BarChart2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

// ─── Live Results Dashboard ────────────────────────────────────────────────

function LiveResultsDashboard({ quiz, onClose }: { quiz: MockTest; onClose: () => void }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mock-test-sessions", quiz.id],
    queryFn: () => getMockTestSessions(quiz.id),
    refetchInterval: 30_000, // auto-refresh every 30s
  });

  const sessions = (data as any)?.data ?? data ?? [];
  const submitted = sessions.filter(s => s.status === "completed");
  const totalStudents = sessions.length;
  const avgScore = submitted.length
    ? Math.round(submitted.reduce((s, se) => s + (se.totalScore || 0), 0) / submitted.length)
    : 0;
  const avgAccuracy = submitted.length && quiz.totalMarks
    ? Math.round((avgScore / quiz.totalMarks) * 100)
    : 0;
  const passCount = submitted.filter(s => (s.totalScore || 0) >= (quiz.passingMarks || 0)).length;

  const exportCsv = () => {
    const rows = [["Student ID", "Status", "Score", "Correct", "Wrong", "Skipped", "Submitted At"]];
    sessions.forEach(s => {
      rows.push([
        s.studentId,
        s.status,
        String(s.totalScore ?? ""),
        String(s.correctCount ?? ""),
        String(s.wrongCount ?? ""),
        String(s.skippedCount ?? ""),
        s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "",
      ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quiz.title.replace(/\s+/g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-300/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-lg">{quiz.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Live Results Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-0 border-b border-border shrink-0">
          {[
            { label: "Attempted", value: totalStudents },
            { label: "Submitted", value: submitted.length },
            { label: "Avg Score", value: `${avgScore}/${quiz.totalMarks}` },
            { label: "Pass Rate", value: submitted.length ? `${Math.round((passCount / submitted.length) * 100)}%` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 text-center border-r border-border last:border-0">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Class accuracy bar */}
        <div className="px-5 pt-4 shrink-0">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium">Class Average</span>
            <span className="text-muted-foreground">{avgAccuracy}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all",
              avgAccuracy >= 70 ? "bg-emerald-500" : avgAccuracy >= 40 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${avgAccuracy}%` }} />
          </div>
        </div>

        {/* Sessions table */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading results...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No students have attempted yet</p>
              <p className="text-sm mt-1">Results will appear here as students submit.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-3">Student</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3 text-right">Score</th>
                  <th className="pb-2 pr-3 text-right">Correct</th>
                  <th className="pb-2 pr-3 text-right">Wrong</th>
                  <th className="pb-2 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s) => {
                  const acc = (s.correctCount && s.correctCount + (s.wrongCount || 0) + (s.skippedCount || 0)) > 0
                    ? Math.round((s.correctCount / ((s.correctCount || 0) + (s.wrongCount || 0) + (s.skippedCount || 0))) * 100)
                    : 0;
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-3 font-medium">{s.student?.fullName || s.studentId.slice(0, 8) + "…"}</td>
                      <td className="py-2.5 pr-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                          s.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          s.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600")}>
                          {s.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-medium">{s.totalScore ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right text-emerald-600">{s.correctCount ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right text-red-500">{s.wrongCount ?? "—"}</td>
                      <td className="py-2.5 text-right">
                        <span className={cn("font-medium", acc >= 70 ? "text-emerald-600" : acc >= 40 ? "text-amber-600" : "text-red-500")}>
                          {s.status === "completed" ? `${acc}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Detail Drawer ────────────────────────────────────────────────────

function QuizDetailPanel({ quiz, onClose, onPublish }: { quiz: MockTest; onClose: () => void; onPublish: () => void }) {
  const status = getQuizStatus(quiz);
  const [publishing, setPublishing] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold">{quiz.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", STATUS_BADGE[status])}>
              {status}
            </span>
            <span className="text-xs text-muted-foreground capitalize">{quiz.type?.replace("_", " ")}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Questions", value: quiz.questionIds?.length ?? 0 },
              { label: "Duration", value: `${quiz.durationMinutes} min` },
              { label: "Total Marks", value: quiz.totalMarks },
              { label: "Passing Marks", value: quiz.passingMarks ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="border border-border rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold">Settings</p>
            {[
              { label: "Shuffle Questions", value: quiz.shuffleQuestions },
              { label: "Show Answers After Submit", value: quiz.showAnswersAfterSubmit },
              { label: "Allow Reattempt", value: quiz.allowReattempt },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn("font-medium", value ? "text-emerald-600" : "text-muted-foreground")}>
                  {value ? "Yes" : "No"}
                </span>
              </div>
            ))}
          </div>

          {quiz.scheduledAt && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-50/20 border border-blue-200 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 shrink-0" />
              Scheduled: {new Date(quiz.scheduledAt).toLocaleString()}
            </div>
          )}
        </div>

        {!quiz.isPublished && (
          <div className="p-5 border-t border-border">
            <button
              onClick={async () => {
                setPublishing(true);
                await onPublish();
                setPublishing(false);
              }}
              disabled={publishing}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {publishing ? "Publishing..." : "Publish Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Wizard Modal ───────────────────────────────────────────────────

function CreateWizardModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [state, setState] = useState<WizardState>(DEFAULT_WIZARD);
  const [submitting, setSubmitting] = useState(false);

  const update = useCallback((partial: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const addQuestions = useCallback((qs: LocalQuestion[]) => {
    setState(prev => ({ ...prev, questions: [...prev.questions, ...qs] }));
  }, []);

  const removeQuestion = useCallback((localId: string) => {
    setState(prev => ({ ...prev, questions: prev.questions.filter(q => q._localId !== localId) }));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Create any new (non-bank) questions
      const questionIds: string[] = [];
      for (const q of state.questions) {
        if (q.fromBank && q.savedId) {
          questionIds.push(q.savedId);
          continue;
        }
        if (q.savedId) {
          questionIds.push(q.savedId);
          continue;
        }
        // Need to create this question
        const payload: CreateQuestionPayload = {
          topicId: q.topicId || state.topicId,
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          marksCorrect: q.marksCorrect,
          marksWrong: q.marksWrong,
          integerAnswer: q.integerAnswer,
          solutionText: q.solutionText?.trim() || undefined,
          options: q.type !== "integer" ? q.options.map((o, i) => ({
            optionLabel: o.label || ["A", "B", "C", "D"][i],
            content: o.content,
            isCorrect: o.isCorrect,
            sortOrder: i,
          })) : undefined,
        };
        const created = await createQuestion(payload);
        questionIds.push(created.id);
      }

      if (questionIds.length === 0) {
        toast.error("No valid questions to save.");
        setSubmitting(false);
        return;
      }

      // 2. Create mock test — always use the teacher-specified totalMarks from Step 1
      const testPayload: CreateMockTestPayload = {
        batchId: state.batchId,
        title: state.title,
        durationMinutes: state.durationMinutes,
        totalMarks: state.totalMarks,
        passingMarks: state.passingMarks || undefined,
        topicId: state.testScope === "topic" ? (state.topicId || undefined) : undefined,
        questionIds,
        scheduledAt: !state.publishNow && state.scheduledAt ? state.scheduledAt : undefined,
        shuffleQuestions: state.shuffleQuestions,
        showAnswersAfterSubmit: state.showAnswersAfterSubmit,
        allowReattempt: state.allowReattempt,
      };

      const created = await createMockTest(testPayload);

      // 3. Publish if needed
      if (state.publishNow) {
        await updateMockTest(created.id, { isPublished: true });
      }

      toast.success(state.publishNow ? "Quiz published successfully!" : "Quiz saved as draft.");
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create quiz.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-300/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="font-bold text-lg">Create New Quiz</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <StepIndicator step={state.step} />

          {state.step === 1 && (
            <Step1QuizDetails
              state={state}
              onChange={update}
              onNext={() => update({ step: 2 })}
            />
          )}
          {state.step === 2 && (
            <Step2AddQuestions
              state={state}
              onAdd={addQuestions}
              onRemove={removeQuestion}
              onBack={() => update({ step: 1 })}
              onNext={() => update({ step: 3 })}
            />
          )}
          {state.step === 3 && (
            <Step3Settings
              state={state}
              onChange={update}
              onBack={() => update({ step: 2 })}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function TeacherQuizzesPage() {
  const isCompactLayout = useIsCompactLayout();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewQuiz, setViewQuiz] = useState<MockTest | null>(null);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "published" | "draft" | "scheduled">("");

  const { data: batches = [] } = useQuery({ queryKey: ["my-batches"], queryFn: getMyBatches });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mock-tests", filterBatch, filterStatus],
    queryFn: () => getMockTests({
      batchId: filterBatch || undefined,
      isPublished: filterStatus === "published" ? true : filterStatus === "draft" ? false : undefined,
    }),
  });

  const quizzes: MockTest[] = Array.isArray(data) ? data : [];

  // Filter "scheduled" client-side (no dedicated API filter)
  const filtered = filterStatus === "scheduled"
    ? quizzes.filter(q => !q.isPublished && q.scheduledAt)
    : filterStatus === "draft"
    ? quizzes.filter(q => !q.isPublished && !q.scheduledAt)
    : quizzes;
  const initialBatchSize = isCompactLayout ? 9 : 15;
  const loadMoreBatchSize = isCompactLayout ? 6 : 9;
  const [visibleCount, setVisibleCount] = useState(initialBatchSize);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount((prev) => {
      const max = filtered.length || initialBatchSize;
      return Math.max(initialBatchSize, Math.min(prev, max));
    });
  }, [filtered.length, initialBatchSize]);

  const visibleQuizzes = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );
  const canLoadMore = visibleQuizzes.length < filtered.length;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !canLoadMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleCount((prev) => Math.min(prev + loadMoreBatchSize, filtered.length));
      },
      { rootMargin: isCompactLayout ? "220px 0px" : "300px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, filtered.length, isCompactLayout, isLoading, loadMoreBatchSize]);

  const deleteM = useMutation({
    mutationFn: deleteMockTest,
    onSuccess: () => { toast.success("Quiz deleted."); queryClient.invalidateQueries({ queryKey: ["mock-tests"] }); },
    onError: () => toast.error("Failed to delete quiz."),
  });

  const handleDelete = (quiz: MockTest) => {
    if (!confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;
    deleteM.mutate(quiz.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quizzes & Tests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Create and manage assessments for your batches</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Quiz
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Batches</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {(["", "published", "draft", "scheduled"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize",
                filterStatus === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Quizzes", value: quizzes.length, icon: BookOpen },
          { label: "Published", value: quizzes.filter(q => q.isPublished).length, icon: Play },
          { label: "Drafts", value: quizzes.filter(q => !q.isPublished).length, icon: Edit2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-border rounded-xl p-4 flex items-center gap-3 bg-card">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading quizzes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-muted-foreground">No quizzes found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filterBatch || filterStatus ? "Try clearing the filters." : "Create your first quiz to get started."}
          </p>
          {!filterBatch && !filterStatus && (
            <button onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Create Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleQuizzes.map((q) => (
              <QuizCard
                key={q.id}
                quiz={q}
                onView={() => setViewQuiz(q)}
                onDelete={() => handleDelete(q)}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Showing {visibleQuizzes.length} of {filtered.length} quizzes
          </p>
        </div>
      )}

      {canLoadMore && !isLoading && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="ml-2 text-xs font-medium">Loading more quizzes...</span>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateWizardModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ["mock-tests"] });
          }}
        />
      )}
      {viewQuiz && (
        <QuizAnalyticsModal
          quiz={viewQuiz}
          onClose={() => setViewQuiz(null)}
        />
      )}
    </div>
  );
}
