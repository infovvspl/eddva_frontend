import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, FileText, Trash2, X, ChevronRight,
  Eye, EyeOff, ClipboardList, Clock, CheckCircle2,
  AlertCircle, Pencil, ArrowLeft, Sparkles, Wand2,
  RefreshCw, Check, Upload, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useMockTests, useCreateMockTest, useDeleteMockTest, usePublishMockTest,
  useMockTestDetail, useUpdateMockTest, useRemoveQuestionFromMockTest, useBatches,
  useSubjects, useChapters, useTopics,
} from "@/hooks/use-admin";
import { createQuestion, aiGenerateQuestions } from "@/lib/api/admin";
import type { CreateMockTestQuestionPayload, AiGeneratedQuestion } from "@/lib/api/admin";

// ─── Topic Picker ─────────────────────────────────────────────────────────────

function TopicPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const { data: subjects } = useSubjects();
  const { data: chapters } = useChapters(subjectId);
  const { data: topics } = useTopics(chapterId);

  const subjectList = Array.isArray(subjects) ? subjects : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const topicList = Array.isArray(topics) ? topics : [];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Question Topic * <span className="text-muted-foreground/60 normal-case font-normal">(all questions tagged here)</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId(""); onChange(""); }}
          className="h-9 w-full px-2 bg-secondary border border-border rounded-lg text-xs outline-none focus:border-primary">
          <option value="">Subject…</option>
          {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={chapterId} onChange={e => { setChapterId(e.target.value); onChange(""); }}
          disabled={!subjectId}
          className="h-9 w-full px-2 bg-secondary border border-border rounded-lg text-xs outline-none focus:border-primary disabled:opacity-40">
          <option value="">Chapter…</option>
          {chapterList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={value} onChange={e => onChange(e.target.value)}
          disabled={!chapterId}
          className="h-9 w-full px-2 bg-secondary border border-border rounded-lg text-xs outline-none focus:border-primary disabled:opacity-40">
          <option value="">Topic…</option>
          {topicList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {!subjectList.length && (
        <p className="text-xs text-amber-500">No subjects found. Create subjects/chapters/topics in Content first.</p>
      )}
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

type Stage = "list" | "detail";
type CreateMode = "select" | "manual" | "ai" | "csv";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-600",
  medium: "bg-amber-500/10 text-amber-600",
  hard: "bg-rose-500/10 text-rose-600",
};

const TYPE_COLORS: Record<string, string> = {
  diagnostic: "bg-violet-500/10 text-violet-600",
  full_mock: "bg-blue-500/10 text-blue-600",
  mock: "bg-blue-500/10 text-blue-600",
  chapter_test: "bg-emerald-500/10 text-emerald-600",
  practice: "bg-amber-500/10 text-amber-600",
  battle: "bg-orange-500/10 text-orange-600",
};

const TYPE_LABELS: Record<string, string> = {
  diagnostic: "Diagnostic",
  full_mock: "Full Mock",
  mock: "Mock Test",
  chapter_test: "Chapter Test",
  practice: "Practice",
  battle: "Battle",
};

const EXAM_CONFIGS: Record<string, {
  subjects: string[];
  topics: string[];
  description: string;
}> = {
  JEE: {
    subjects: ["Physics", "Chemistry", "Mathematics"],
    topics: [
      "Physics: Mechanics, Electrostatics & Magnetism, Modern Physics, Optics, Thermodynamics",
      "Chemistry: Physical Chemistry (Mole Concept, Equilibrium, Electrochemistry), Organic Chemistry (Reactions, Named Reactions), Inorganic Chemistry (p-block, d-block, coordination)",
      "Mathematics: Calculus (Differentiation, Integration, Limits), Algebra (Complex Numbers, Matrices, Binomial Theorem), Coordinate Geometry, Trigonometry, Probability",
    ],
    description: "JEE (Joint Entrance Examination) for IIT/NIT admissions",
  },
  NEET: {
    subjects: ["Physics", "Chemistry", "Biology"],
    topics: [
      "Physics: Mechanics, Thermodynamics, Electrostatics, Optics, Modern Physics",
      "Chemistry: Physical Chemistry, Organic Chemistry, Inorganic Chemistry",
      "Biology: Cell Biology, Genetics, Human Physiology, Plant Physiology, Ecology, Evolution",
    ],
    description: "NEET (National Eligibility cum Entrance Test) for medical admissions",
  },
  CBSE_10: {
    subjects: ["Mathematics", "Science", "Social Science"],
    topics: [
      "Mathematics: Real Numbers, Polynomials, Linear Equations, Triangles, Coordinate Geometry, Trigonometry, Statistics",
      "Science: Chemical Reactions, Life Processes, Light, Electricity, Magnetic Effects, Natural Resources",
      "Social Science: India & Contemporary World, Democratic Politics, Understanding Economic Development",
    ],
    description: "CBSE Class 10 Board Examination",
  },
  CBSE_12: {
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    topics: [
      "Physics: Electrostatics, Current Electricity, Magnetism, Optics, Atoms & Nuclei, Semiconductors",
      "Chemistry: Solutions, Electrochemistry, Coordination Compounds, Aldehydes, Amines, Polymers",
      "Mathematics: Relations, Inverse Trigonometry, Matrices, Determinants, Integrals, Differential Equations, Probability",
    ],
    description: "CBSE Class 12 Board Examination",
  },
};

// ─── Draft question type ─────────────────────────────────────────────────────

type DraftQuestion = CreateMockTestQuestionPayload & {
  _key: number;
  subject?: string;
  explanation?: string;
};

let _keyCounter = 0;
const blankQuestion = (): DraftQuestion => ({
  _key: ++_keyCounter,
  content: "",
  type: "mcq_single",
  difficulty: "medium",
  marksCorrect: 4,
  marksWrong: -1,
  options: [
    { optionLabel: "A", content: "", isCorrect: false },
    { optionLabel: "B", content: "", isCorrect: false },
    { optionLabel: "C", content: "", isCorrect: false },
    { optionLabel: "D", content: "", isCorrect: false },
  ],
  integerAnswer: "",
});

function aiToDraft(q: AiGeneratedQuestion): DraftQuestion {
  const diff = (q.difficulty?.toLowerCase() ?? "medium") as "easy" | "medium" | "hard";
  return {
    _key: ++_keyCounter,
    content: q.questionText,
    type: "mcq_single",
    difficulty: ["easy", "medium", "hard"].includes(diff) ? diff : "medium",
    marksCorrect: diff === "hard" ? 4 : diff === "medium" ? 3 : 2,
    marksWrong: -1,
    subject: q.subject,
    explanation: q.explanation,
    options: q.options.map(o => ({
      optionLabel: o.label,
      content: o.text,
      isCorrect: o.label === q.correctOption,
    })),
  };
}

// ─── Question Builder Row ────────────────────────────────────────────────────

function QuestionRow({
  q, index, onChange, onRemove, canRemove,
}: {
  q: DraftQuestion; index: number;
  onChange: (u: DraftQuestion) => void;
  onRemove: () => void; canRemove: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isInteger = q.type === "integer";

  const setOpt = (i: number, key: "content" | "isCorrect", val: string | boolean) => {
    const opts = [...(q.options ?? [])];
    opts[i] = { ...opts[i], [key]: val };
    if (key === "isCorrect" && val === true && q.type === "mcq_single")
      opts.forEach((o, j) => { if (j !== i) o.isCorrect = false; });
    onChange({ ...q, options: opts });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">{String(index + 1).padStart(2, "0")}</span>
        <p className="text-sm text-foreground flex-1 truncate">{q.content || <span className="text-muted-foreground italic">Empty question…</span>}</p>
        <div className="flex items-center gap-2 shrink-0">
          {q.subject && <span className="text-xs text-muted-foreground hidden sm:block">{q.subject}</span>}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}>
            {q.difficulty}
          </span>
          {canRemove && (
            <button onClick={e => { e.stopPropagation(); onRemove(); }}
              className="text-muted-foreground hover:text-destructive p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-muted-foreground">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-secondary/20">
          <textarea required rows={2} value={q.content}
            onChange={e => onChange({ ...q, content: e.target.value })}
            placeholder="Question text…"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-primary resize-none" />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground font-semibold">Type</label>
              <select value={q.type} onChange={e => onChange({ ...q, type: e.target.value as any })}
                className="mt-1 h-9 w-full px-2 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary">
                <option value="mcq_single">MCQ Single</option>
                <option value="mcq_multi">MCQ Multi</option>
                <option value="integer">Integer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold">Difficulty</label>
              <select value={q.difficulty} onChange={e => onChange({ ...q, difficulty: e.target.value as any })}
                className="mt-1 h-9 w-full px-2 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold">Marks +/-</label>
              <div className="mt-1 flex gap-1">
                <input type="number" value={q.marksCorrect}
                  onChange={e => onChange({ ...q, marksCorrect: +e.target.value })}
                  className="h-9 w-full px-2 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary text-center" />
                <input type="number" value={q.marksWrong}
                  onChange={e => onChange({ ...q, marksWrong: +e.target.value })}
                  className="h-9 w-full px-2 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary text-center" />
              </div>
            </div>
          </div>

          {!isInteger && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-semibold">Options (tick correct)</label>
              {(q.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-muted-foreground">{opt.optionLabel}</span>
                  <input type="text" value={opt.content}
                    onChange={e => setOpt(i, "content", e.target.value)}
                    placeholder={`Option ${opt.optionLabel}`}
                    className="h-8 flex-1 px-3 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary" />
                  <input type={q.type === "mcq_single" ? "radio" : "checkbox"}
                    name={`correct-${q._key}`} checked={opt.isCorrect}
                    onChange={e => setOpt(i, "isCorrect", e.target.checked)}
                    className="w-4 h-4 accent-primary" />
                </div>
              ))}
            </div>
          )}

          {isInteger && (
            <div>
              <label className="text-xs text-muted-foreground font-semibold">Correct Integer Answer</label>
              <input value={q.integerAnswer ?? ""}
                onChange={e => onChange({ ...q, integerAnswer: e.target.value })}
                placeholder="e.g. 42"
                className="mt-1 h-9 w-full px-3 bg-background border border-border rounded-lg text-xs outline-none focus:border-primary" />
            </div>
          )}

          {q.explanation && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">{q.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Generate Panel ───────────────────────────────────────────────────────

function AIGeneratePanel({
  onQuestionsGenerated,
}: {
  onQuestionsGenerated: (questions: DraftQuestion[]) => void;
}) {
  const [exam, setExam] = useState("JEE");
  const [count, setCount] = useState(30);
  const [customInstructions, setCustomInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const cfg = EXAM_CONFIGS[exam] ?? EXAM_CONFIGS.JEE;

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    setProgress("Crafting diagnostic prompt…");

    const easyCount = Math.round(count * 0.3);
    const hardCount = Math.round(count * 0.25);
    const mediumCount = count - easyCount - hardCount;

    const transcript = `
You are an expert question setter for competitive exams in India. Generate exactly ${count} high-quality multiple-choice diagnostic test questions for ${exam} (${cfg.description}).

DISTRIBUTION:
- Easy questions: ${easyCount} (label difficulty: easy)
- Medium questions: ${mediumCount} (label difficulty: medium)
- Hard questions: ${hardCount} (label difficulty: hard)

SUBJECTS TO COVER:
${cfg.topics.join("\n")}

REQUIREMENTS FOR EACH QUESTION:
1. Four distinct options labeled A, B, C, D
2. Exactly one correct answer
3. Questions should test conceptual understanding AND problem-solving
4. Include numerical problems where appropriate
5. Cover diverse topics — do NOT repeat the same topic twice in a row
6. Label each question with its subject (e.g., subject: Physics)
7. Label each question with difficulty (easy/medium/hard)
8. Provide a brief explanation of the correct answer

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}

Generate exactly ${count} questions spanning all subjects evenly. Make questions suitable for diagnostic assessment of Class 11-12 students.
    `.trim();

    try {
      setProgress("AI is generating questions (this may take ~30 seconds)…");
      const result = await aiGenerateQuestions({ transcript, lectureTitle: `${exam} Diagnostic Test` });
      const raw = result?.questions ?? [];

      if (!raw.length) {
        setError("AI returned no questions. Try again or reduce the count.");
        return;
      }

      setProgress(`Converting ${raw.length} questions…`);
      const drafts = raw.map(aiToDict => aiToDict).map(aiToDict => {
        // Normalize: backend may return different shapes
        const q: AiGeneratedQuestion = {
          questionText: (aiToDict as any).questionText || (aiToDict as any).question || "",
          options: (aiToDict as any).options ?? [],
          correctOption: (aiToDict as any).correctOption || (aiToDict as any).correct_option || "A",
          difficulty: (aiToDict as any).difficulty ?? "medium",
          subject: (aiToDict as any).subject ?? "",
          explanation: (aiToDict as any).explanation ?? "",
        };
        return aiToDict2(q);
      });

      onQuestionsGenerated(drafts);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "AI generation failed.";
      setError(msg);
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
        <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">
          AI will generate a complete diagnostic test based on the exam target and difficulty distribution.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exam Target</label>
          <select value={exam} onChange={e => setExam(e.target.value)}
            className="h-10 w-full px-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary">
            {Object.keys(EXAM_CONFIGS).map(k => <option key={k} value={k}>{k.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Number of Questions</label>
          <select value={count} onChange={e => setCount(+e.target.value)}
            className="h-10 w-full px-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary">
            <option value={10}>10 questions (~15 min)</option>
            <option value={20}>20 questions (~30 min)</option>
            <option value={30}>30 questions (~45 min)</option>
            <option value={40}>40 questions (~60 min)</option>
            <option value={60}>60 questions (~90 min)</option>
          </select>
        </div>
      </div>

      {/* Subject preview */}
      <div className="rounded-xl border border-border bg-secondary/40 p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Subjects covered:</p>
        <div className="flex flex-wrap gap-1.5">
          {cfg.subjects.map(s => (
            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Difficulty: ~30% easy · ~45% medium · ~25% hard
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Additional Instructions <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
        </label>
        <textarea rows={2} value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          placeholder="e.g. Focus more on modern physics and organic chemistry. Avoid very long numerical problems."
          className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary resize-none" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">{progress}</p>
        </div>
      )}

      <Button type="button" className="w-full gap-2" disabled={generating} onClick={handleGenerate}>
        {generating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          : <><Wand2 className="w-4 h-4" /> Generate {count} Questions with AI</>
        }
      </Button>
    </div>
  );
}

// Helper kept outside component to avoid recreation issues
function aiToDict2(q: AiGeneratedQuestion): DraftQuestion {
  return aiToDict3(q);
}
function aiToDict3(q: AiGeneratedQuestion): DraftQuestion {
  const diff = (q.difficulty?.toLowerCase() ?? "medium") as "easy" | "medium" | "hard";
  const safeDiff = ["easy", "medium", "hard"].includes(diff) ? diff : "medium";
  return {
    _key: ++_keyCounter,
    content: q.questionText,
    type: "mcq_single",
    difficulty: safeDiff,
    marksCorrect: safeDiff === "hard" ? 4 : safeDiff === "medium" ? 3 : 2,
    marksWrong: -1,
    subject: q.subject,
    explanation: q.explanation,
    options: (q.options ?? []).map(o => ({
      optionLabel: o.label,
      content: o.text,
      isCorrect: o.label === q.correctOption,
    })),
  };
}

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

const CSV_TEMPLATE = [
  "question,option_a,option_b,option_c,option_d,correct_option,difficulty,marks_correct,marks_wrong",
  "What is Newton's first law?,An object at rest stays at rest,Force equals mass times acceleration,Energy is conserved,Action equals reaction,A,easy,4,-1",
  "The speed of light is approximately?,3×10^8 m/s,3×10^6 m/s,3×10^10 m/s,3×10^4 m/s,A,medium,4,-1",
].join("\n");

function parseCsvToQuestions(csv: string): DraftQuestion[] {
  const lines = csv.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(",").map(h => h.trim());
  const qi = header.indexOf("question");
  const oa = header.indexOf("option_a");
  const ob = header.indexOf("option_b");
  const oc = header.indexOf("option_c");
  const od = header.indexOf("option_d");
  const co = header.indexOf("correct_option");
  const di = header.indexOf("difficulty");
  const mc = header.indexOf("marks_correct");
  const mw = header.indexOf("marks_wrong");

  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const cols: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());

    const correct = (cols[co] ?? "A").toUpperCase();
    return {
      _key: ++_keyCounter,
      content: cols[qi] ?? "",
      type: "mcq_single" as const,
      difficulty: (cols[di] ?? "medium") as any,
      marksCorrect: Number(cols[mc] ?? 4),
      marksWrong: Number(cols[mw] ?? -1),
      options: [
        { optionLabel: "A", content: cols[oa] ?? "", isCorrect: correct === "A" },
        { optionLabel: "B", content: cols[ob] ?? "", isCorrect: correct === "B" },
        { optionLabel: "C", content: cols[oc] ?? "", isCorrect: correct === "C" },
        { optionLabel: "D", content: cols[od] ?? "", isCorrect: correct === "D" },
      ],
      integerAnswer: "",
    } satisfies DraftQuestion;
  }).filter(q => q.content.length > 0);
}

function CsvImportModal({
  onClose, onBack, onImported,
}: {
  onClose: () => void;
  onBack: () => void;
  onImported: (questions: DraftQuestion[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<DraftQuestion[]>([]);
  const [parseError, setParseError] = useState("");
  const fileRef = (typeof window !== "undefined" ? { current: null as HTMLInputElement | null } : { current: null });

  const handleFile = (file: File) => {
    setParseError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCsvToQuestions(text);
        if (!parsed.length) { setParseError("No valid questions found. Check your CSV format."); return; }
        setPreview(parsed);
      } catch {
        setParseError("Failed to parse CSV. Make sure it matches the template format.");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "questions_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></button>
            <h3 className="text-lg font-bold text-foreground">Bulk Import via CSV</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Template download */}
        <button onClick={downloadTemplate}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-all mb-4 text-left">
          <Download className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Download CSV Template</p>
            <p className="text-xs text-muted-foreground">
              Columns: question, option_a–d, correct_option (A/B/C/D), difficulty, marks_correct, marks_wrong
            </p>
          </div>
        </button>

        {/* Drop zone */}
        {!preview.length && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/30"}`}
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Drop CSV file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .csv files up to 100 questions</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {parseError && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />{preview.length} questions parsed successfully
              </p>
              <button onClick={() => setPreview([])} className="text-xs text-muted-foreground hover:text-foreground">
                Re-upload
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {preview.map((q, i) => (
                <div key={q._key} className="text-xs bg-secondary rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="text-muted-foreground font-bold shrink-0">{i + 1}.</span>
                  <span className="text-foreground line-clamp-2">{q.content}</span>
                  <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded-full font-bold ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => onImported(preview)}>
              Use These {preview.length} Questions <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Create Test Modal ────────────────────────────────────────────────────────

function CreateTestModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { data: batches } = useBatches();
  const createMockTest = useCreateMockTest();
  const updateMockTest = useUpdateMockTest();
  const batchList = Array.isArray(batches) ? batches : [];

  const [createMode, setCreateMode] = useState<CreateMode>("select");

  // Test metadata
  const [title, setTitle] = useState("");
  const [batchId, setBatchId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalMarks, setTotalMarks] = useState(0);

  // Questions
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"questions" | "details">("questions");

  const updateQ = (i: number, u: DraftQuestion) => {
    const next = [...questions]; next[i] = u; setQuestions(next);
  };

  const computedTotalMarks = questions.reduce((sum, q) => sum + q.marksCorrect, 0);
  const computedDuration = Math.max(30, Math.ceil(questions.length * 1.5));

  const handleAIGenerated = (drafts: DraftQuestion[]) => {
    setQuestions(drafts);
    // Auto-fill title and duration
    setDurationMinutes(Math.max(30, Math.ceil(drafts.length * 1.5)));
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!batchId) {
        setError("Please select a batch.");
        setSubmitting(false);
        return;
      }
      if (!topicId) {
        setError("Please select a topic for the questions.");
        setSubmitting(false);
        return;
      }
      const ids: string[] = [];
      for (const q of questions) {
        const payload: any = {
          topicId,
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          marksCorrect: q.marksCorrect,
          marksWrong: q.marksWrong,
        };
        if (q.type === "integer") payload.integerAnswer = q.integerAnswer;
        else payload.options = q.options;
        const created = await createQuestion(payload);
        ids.push(created.id);
      }

      const test = await createMockTest.mutateAsync({
        title,
        batchId,
        durationMinutes: durationMinutes || computedDuration,
        totalMarks: totalMarks || computedTotalMarks,
        questionIds: ids,
      });

      onCreated(test.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed.";
      const errs = err?.response?.data?.errors;
      setError(Array.isArray(errs) ? errs.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Mode selection screen ──
  if (createMode === "select") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Create Mock Test</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-muted-foreground mb-5">How do you want to create this test?</p>
          <div className="space-y-3">
            <button onClick={() => setCreateMode("ai")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-violet-500/40 bg-violet-500/5 hover:border-violet-500 hover:bg-violet-500/10 transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Generate with AI</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI creates a complete diagnostic test for JEE / NEET / CBSE automatically
                </p>
              </div>
            </button>
            <button onClick={() => setCreateMode("manual")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Pencil className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Add Manually</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Write questions yourself — MCQ, integer, multi-correct
                </p>
              </div>
            </button>
            <button onClick={() => setCreateMode("csv")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Bulk Import via CSV</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload a CSV file with multiple questions at once
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── CSV Import mode ──
  if (createMode === "csv") {
    return (
      <CsvImportModal
        onClose={onClose}
        onBack={() => setCreateMode("select")}
        onImported={(imported) => {
          setQuestions(imported);
          setCreateMode("manual");
          setStep("questions");
        }}
      />
    );
  }

  // ── AI mode ──
  if (createMode === "ai" && step === "questions") {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 my-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setCreateMode("select")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-bold text-foreground">AI Question Generator</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <AIGeneratePanel onQuestionsGenerated={handleAIGenerated} />
        </motion.div>
      </div>
    );
  }

  // ── Manual mode OR AI step 2 (review + details) ──
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (step === "details") setStep("questions");
              else setCreateMode("select");
            }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground">
              {step === "questions"
                ? (createMode === "ai" ? "Review AI Questions" : "Add Questions")
                : "Test Details"}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Step 1: Questions */}
        {step === "questions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {questions.length} question{questions.length !== 1 ? "s" : ""}
                {createMode === "ai" && (
                  <span className="ml-2 text-xs text-violet-500 font-medium">AI-generated — review & edit if needed</span>
                )}
              </p>
              <div className="flex gap-2">
                {createMode === "ai" && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                    onClick={() => setStep("questions") /* go back to AI panel */}>
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </Button>
                )}
                <button onClick={() => setQuestions([...questions, blankQuestion()])}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {questions.map((q, i) => (
                <QuestionRow key={q._key} q={q} index={i}
                  onChange={u => updateQ(i, u)}
                  onRemove={() => setQuestions(questions.filter((_, j) => j !== i))}
                  canRemove={questions.length > 1} />
              ))}
            </div>

            <Button className="w-full gap-2" onClick={() => setStep("details")} disabled={questions.length === 0}>
              Continue to Test Details <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Test details */}
        {step === "details" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/40 p-3 flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-foreground font-medium">{questions.length} questions ready</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Test Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. JEE Diagnostic Test 2025"
                className="h-10 w-full px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </div>

            <TopicPicker value={topicId} onChange={setTopicId} />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Batch *</label>
                <select required value={batchId} onChange={e => setBatchId(e.target.value)}
                  className={`h-10 w-full px-3 bg-secondary border rounded-xl text-sm outline-none focus:border-primary ${!batchId ? "border-amber-500/50" : "border-border"}`}>
                  <option value="">— Select batch —</option>
                  {batchList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Duration (min)
                </label>
                <input type="number" min={1} value={durationMinutes || computedDuration}
                  onChange={e => setDurationMinutes(+e.target.value)}
                  className="h-10 w-full px-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Marks
                </label>
                <input type="number" min={1} value={totalMarks || computedTotalMarks}
                  onChange={e => setTotalMarks(+e.target.value)}
                  className="h-10 w-full px-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("questions")}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving {questions.length} questions…</>
                  : "Create Test"}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ─── Add Question to existing test ───────────────────────────────────────────

function AddQuestionModal({ mockTestId, existingIds, onClose }: {
  mockTestId: string; existingIds: string[]; onClose: () => void;
}) {
  const updateMockTest = useUpdateMockTest();
  const [q, setQ] = useState<DraftQuestion>(blankQuestion());
  const [topicId, setTopicId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) { setError("Please select a topic."); return; }
    setError("");
    setSubmitting(true);
    try {
      const payload: any = {
        topicId,
        content: q.content, type: q.type, difficulty: q.difficulty,
        marksCorrect: q.marksCorrect, marksWrong: q.marksWrong,
      };
      if (q.type === "integer") payload.integerAnswer = q.integerAnswer;
      else payload.options = q.options;
      const created = await createQuestion(payload);
      await updateMockTest.mutateAsync({ id: mockTestId, questionIds: [...existingIds, created.id] });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed.";
      setError(Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Add Question</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <TopicPicker value={topicId} onChange={setTopicId} />
          <QuestionRow q={q} index={0} onChange={setQ} onRemove={() => {}} canRemove={false} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Question"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Test Detail ──────────────────────────────────────────────────────────────

function MockTestDetail({ testId, onBack }: { testId: string; onBack: () => void }) {
  const { data: test, isLoading } = useMockTestDetail(testId);
  const publishMockTest = usePublishMockTest();
  const updateMockTest = useUpdateMockTest();
  const removeQuestion = useRemoveQuestionFromMockTest(testId);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const questions = test?.questions ?? [];
  const existingIds = questions.map(q => q.id);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!test) return null;

  const handleRemove = (questionId: string) => {
    const newIds = existingIds.filter(id => id !== questionId);
    if (newIds.length > 0) {
      updateMockTest.mutate({ id: testId, questionIds: newIds });
    } else {
      removeQuestion.mutate(questionId);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-medium">
            <ArrowLeft className="w-4 h-4" /> Tests
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">{test.title}</h2>
          {test.type && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[test.type] ?? "bg-muted text-muted-foreground"}`}>
              {TYPE_LABELS[test.type] ?? test.type}
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${test.isPublished ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
            {test.isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" disabled={publishMockTest.isPending}
            onClick={() => publishMockTest.mutate({ id: testId, publish: !test.isPublished })}>
            {publishMockTest.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : test.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {test.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowAddQuestion(true)}>
            <Plus className="w-3 h-3" /> Add Question
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Questions", value: questions.length, icon: <ClipboardList className="w-4 h-4" /> },
          { label: "Duration", value: `${test.durationMinutes} min`, icon: <Clock className="w-4 h-4" /> },
          { label: "Total Marks", value: test.totalMarks, icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: "Passing Marks", value: test.passingMarks ?? "—", icon: <AlertCircle className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{s.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-base font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No questions yet</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowAddQuestion(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Question
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground mt-0.5 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">{q.content}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{q.type}</span>
                      <span className="text-xs text-emerald-600 font-semibold">+{q.marksCorrect}</span>
                      {q.marksWrong !== 0 && <span className="text-xs text-rose-500 font-semibold">{q.marksWrong}</span>}
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.options.map(o => (
                          <div key={o.id} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 ${o.isCorrect ? "bg-emerald-500/10 text-emerald-700" : "text-muted-foreground"}`}>
                            <span className="font-bold w-4">{o.optionLabel}.</span>
                            <span>{o.content}</span>
                            {o.isCorrect && <CheckCircle2 className="w-3 h-3 ml-auto shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => handleRemove(q.id)}
                  disabled={updateMockTest.isPending || removeQuestion.isPending}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddQuestion && (
        <AddQuestionModal mockTestId={testId} existingIds={existingIds} onClose={() => setShowAddQuestion(false)} />
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const MockTestsPage = () => {
  const { data: tests, isLoading } = useMockTests();
  const deleteMockTest = useDeleteMockTest();
  const publishMockTest = usePublishMockTest();

  const [stage, setStage] = useState<Stage>("list");
  const [selectedId, setSelectedId] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all");

  const testList = Array.isArray(tests) ? tests : [];
  // Build dynamic filter tabs from actual types returned by backend
  const allTypes = ["all", ...Array.from(new Set(testList.map(t => t.type).filter(Boolean)))];
  const filtered = filter === "all" ? testList : testList.filter(t => t.type === filter);

  if (stage === "detail" && selectedId) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <MockTestDetail testId={selectedId} onBack={() => { setStage("list"); setSelectedId(""); }} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader title="Mock Tests" subtitle="Create diagnostic, mock, and practice tests — manually or with AI" />

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {allTypes.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f === "all" ? "All" : (TYPE_LABELS[f] ?? f)}
            </button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> New Test
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tests yet</p>
          <p className="text-sm mt-1 max-w-xs mx-auto">
            Create a <span className="font-semibold text-violet-500">Diagnostic</span> test for first-time students,
            or a <span className="font-semibold text-blue-500">Full Mock</span> for exam practice.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Sparkles className="w-3.5 h-3.5" /> Generate with AI
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(test => (
            <div key={test.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-foreground text-sm truncate">{test.title}</h4>
                      {test.type && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[test.type] ?? "bg-muted text-muted-foreground"}`}>
                          {TYPE_LABELS[test.type] ?? test.type}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${test.isPublished ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {test.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {test._count?.questions ?? 0} questions · {test.durationMinutes} min · {test.totalMarks} marks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-8"
                    disabled={publishMockTest.isPending}
                    onClick={() => publishMockTest.mutate({ id: test.id, publish: !test.isPublished })}>
                    {test.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {test.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-8"
                    onClick={() => { setSelectedId(test.id); setStage("detail"); }}>
                    <Pencil className="w-3 h-3" /> Manage
                  </Button>
                  <button onClick={() => deleteMockTest.mutate(test.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateTestModal
            onClose={() => setShowCreate(false)}
            onCreated={id => { setShowCreate(false); setSelectedId(id); setStage("detail"); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MockTestsPage;
