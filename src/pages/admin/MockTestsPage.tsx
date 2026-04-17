import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, FileText, Trash2, X, ChevronRight,
  Eye, EyeOff, ClipboardList, Clock, CheckCircle2,
  AlertCircle, Pencil, ArrowLeft, Sparkles, Wand2,
  RefreshCw, Check, Upload, Download, Users, Search,
  BookOpen, Layers, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useMockTests, useCreateMockTest, useDeleteMockTest, usePublishMockTest,
  useMockTestDetail, useUpdateMockTest, useRemoveQuestionFromMockTest, useBatches,
  useSubjects, useChapters, useTopics,
} from "@/hooks/use-admin";
import { createQuestion, aiGenerateQuestions } from "@/lib/api/admin";
import type { CreateMockTestQuestionPayload, AiGeneratedQuestion, Batch } from "@/lib/api/admin";

// ─── URL resolver (relative paths → absolute backend URL) ────────────────────

const API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").origin; }
  catch { return "http://localhost:3000"; }
})();

function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE = "#013889";
const BLUE_M = "#0257c8";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-600",
  medium: "bg-amber-500/10 text-amber-600",
  hard: "bg-rose-500/10 text-rose-600",
};

const TYPE_COLORS: Record<string, string> = {
  diagnostic:    "bg-violet-500/10 text-violet-600",
  full_mock:     "bg-blue-500/10 text-blue-600",
  subject_test:  "bg-sky-500/10 text-sky-600",
  chapter_test:  "bg-emerald-500/10 text-emerald-600",
  topic_test:    "bg-violet-500/10 text-violet-600",
  subtopic_drill:"bg-fuchsia-500/10 text-fuchsia-600",
  speed_test:    "bg-orange-500/10 text-orange-600",
  pyq:           "bg-amber-500/10 text-amber-600",
  revision:      "bg-teal-500/10 text-teal-600",
};

const TYPE_LABELS: Record<string, string> = {
  diagnostic:    "Diagnostic",
  full_mock:     "Full Mock",
  subject_test:  "Subject Test",
  chapter_test:  "Chapter Test",
  topic_test:    "Topic Test",
  subtopic_drill:"Subtopic Drill",
  speed_test:    "Speed Test",
  pyq:           "PYQ",
  revision:      "Revision",
};

const EXAM_CONFIGS: Record<string, { subjects: string[]; topics: string[]; description: string }> = {
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

// ─── Types ────────────────────────────────────────────────────────────────────

type TestCategory = "subject" | "chapter" | "topic";

interface ScopeState {
  subjectId: string; subjectName: string;
  chapterId: string; chapterName: string;
  topicId:   string; topicName: string;
}

const emptyScope: ScopeState = {
  subjectId: "", subjectName: "",
  chapterId: "", chapterName: "",
  topicId: "",   topicName: "",
};

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

// ─── StepBar ──────────────────────────────────────────────────────────────────

function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-start mb-6">
      {steps.map((label, i) => (
        <div key={i} className="flex items-start flex-1">
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-all",
                  i <= current ? "bg-[#013889]" : "bg-slate-200"
                )} />
              )}
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all",
                i < current
                  ? "bg-[#013889] border-[#013889] text-white"
                  : i === current
                  ? "border-[#013889] text-[#013889] bg-blue-50"
                  : "border-slate-300 text-slate-400 bg-white"
              )}>
                {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-all",
                  i < current ? "bg-[#013889]" : "bg-slate-200"
                )} />
              )}
            </div>
            <span className={cn(
              "text-[10px] font-semibold mt-1.5 whitespace-nowrap text-center",
              i <= current ? "text-slate-700" : "text-slate-400"
            )}>{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TopicPicker ──────────────────────────────────────────────────────────────

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
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Question Topic * <span className="text-slate-400 normal-case font-normal">(all questions tagged here)</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId(""); onChange(""); }}
          className="h-9 w-full px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]">
          <option value="">Subject…</option>
          {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={chapterId} onChange={e => { setChapterId(e.target.value); onChange(""); }}
          disabled={!subjectId}
          className="h-9 w-full px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] disabled:opacity-40">
          <option value="">Chapter…</option>
          {chapterList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={value} onChange={e => onChange(e.target.value)}
          disabled={!chapterId}
          className="h-9 w-full px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] disabled:opacity-40">
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

// ─── Question Builder Row ─────────────────────────────────────────────────────

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
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <span className="text-xs font-bold text-slate-400 w-6 shrink-0">{String(index + 1).padStart(2, "0")}</span>
        <p className="text-sm text-slate-700 flex-1 truncate">{q.content || <span className="text-slate-400 italic">Empty question…</span>}</p>
        <div className="flex items-center gap-2 shrink-0">
          {q.subject && <span className="text-xs text-slate-400 hidden sm:block">{q.subject}</span>}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}>
            {q.difficulty}
          </span>
          {canRemove && (
            <button onClick={e => { e.stopPropagation(); onRemove(); }}
              className="text-slate-400 hover:text-red-500 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-slate-400 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/50">
          <textarea required rows={2} value={q.content}
            onChange={e => onChange({ ...q, content: e.target.value })}
            placeholder="Question text…"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#013889] resize-none" />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 font-semibold">Type</label>
              <select value={q.type} onChange={e => onChange({ ...q, type: e.target.value as any })}
                className="mt-1 h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]">
                <option value="mcq_single">MCQ Single</option>
                <option value="mcq_multi">MCQ Multi</option>
                <option value="integer">Integer</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold">Difficulty</label>
              <select value={q.difficulty} onChange={e => onChange({ ...q, difficulty: e.target.value as any })}
                className="mt-1 h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold">Marks +/-</label>
              <div className="mt-1 flex gap-1">
                <input type="number" value={q.marksCorrect}
                  onChange={e => onChange({ ...q, marksCorrect: +e.target.value })}
                  className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] text-center" />
                <input type="number" value={q.marksWrong}
                  onChange={e => onChange({ ...q, marksWrong: +e.target.value })}
                  className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] text-center" />
              </div>
            </div>
          </div>

          {!isInteger && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-semibold">Options (tick correct)</label>
              {(q.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-slate-400">{opt.optionLabel}</span>
                  <input type="text" value={opt.content}
                    onChange={e => setOpt(i, "content", e.target.value)}
                    placeholder={`Option ${opt.optionLabel}`}
                    className="h-8 flex-1 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]" />
                  <input type={q.type === "mcq_single" ? "radio" : "checkbox"}
                    name={`correct-${q._key}`} checked={opt.isCorrect}
                    onChange={e => setOpt(i, "isCorrect", e.target.checked)}
                    className="w-4 h-4 accent-[#013889]" />
                </div>
              ))}
            </div>
          )}

          {isInteger && (
            <div>
              <label className="text-xs text-slate-500 font-semibold">Correct Integer Answer</label>
              <input value={q.integerAnswer ?? ""}
                onChange={e => onChange({ ...q, integerAnswer: e.target.value })}
                placeholder="e.g. 42"
                className="mt-1 h-9 w-full px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]" />
            </div>
          )}

          {q.explanation && (
            <p className="text-xs text-slate-500 italic border-l-2 border-[#013889]/30 pl-3">{q.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Generate Panel ────────────────────────────────────────────────────────

function AIGeneratePanel({
  onQuestionsGenerated,
  initSubjectId = "", initSubjectName = "",
  initChapterId = "", initChapterName = "",
  initTopicId = "",  initTopicName = "",
}: {
  onQuestionsGenerated: (questions: DraftQuestion[], topicId?: string) => void;
  initSubjectId?: string; initSubjectName?: string;
  initChapterId?: string; initChapterName?: string;
  initTopicId?: string;   initTopicName?: string;
}) {
  const [exam, setExam] = useState("JEE");
  const [count, setCount] = useState(20);
  const [customInstructions, setCustomInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const [subjectId, setSubjectId] = useState(initSubjectId);
  const [chapterId, setChapterId] = useState(initChapterId);
  const [aiTopicId, setAiTopicId] = useState(initTopicId);
  const [aiTopicName, setAiTopicName] = useState(initTopicName);
  const [aiChapterName, setAiChapterName] = useState(initChapterName);
  const [aiSubjectName, setAiSubjectName] = useState(initSubjectName);

  const { data: subjects } = useSubjects();
  const { data: chapters } = useChapters(subjectId);
  const { data: topics } = useTopics(chapterId);

  const subjectList = Array.isArray(subjects) ? subjects : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const topicList = Array.isArray(topics) ? topics : [];

  const cfg = EXAM_CONFIGS[exam] ?? EXAM_CONFIGS.JEE;
  const topicSelected = !!aiTopicId;

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    setProgress("Crafting prompt…");

    const easyCount = Math.round(count * 0.3);
    const hardCount = Math.round(count * 0.25);
    const mediumCount = count - easyCount - hardCount;

    let transcript: string;
    let testTitle: string;

    if (topicSelected) {
      const topicPath = [aiSubjectName, aiChapterName, aiTopicName].filter(Boolean).join(" > ");
      testTitle = `${aiTopicName} Test`;
      transcript = `You are an expert question setter. Generate exactly ${count} high-quality multiple-choice questions specifically on the topic: "${aiTopicName}" (${topicPath}).

DISTRIBUTION:
- Easy questions: ${easyCount} (label difficulty: easy)
- Medium questions: ${mediumCount} (label difficulty: medium)
- Hard questions: ${hardCount} (label difficulty: hard)

REQUIREMENTS FOR EACH QUESTION:
1. ALL questions MUST be strictly about "${aiTopicName}" only
2. Four distinct options labeled A, B, C, D
3. Exactly one correct answer
4. Questions should test both conceptual understanding AND numerical/problem-solving skills
5. Cover different subtopics and aspects of "${aiTopicName}" — do NOT repeat the same concept twice in a row
6. Set subject: "${aiSubjectName || aiTopicName}"
7. Label each question with difficulty (easy/medium/hard)
8. Provide a brief explanation of the correct answer

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}

Generate exactly ${count} questions ALL based on "${aiTopicName}". Suitable for Class 11-12 or competitive exam students.`.trim();
    } else if (aiChapterName) {
      testTitle = `${aiChapterName} Chapter Test`;
      transcript = `You are an expert question setter. Generate exactly ${count} high-quality multiple-choice questions for the chapter: "${aiChapterName}" (Subject: ${aiSubjectName || "N/A"}).

DISTRIBUTION: Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}

REQUIREMENTS:
1. All questions must be about "${aiChapterName}" chapter
2. Four distinct options labeled A, B, C, D — exactly one correct answer
3. Cover all important topics within this chapter
4. Mix conceptual and numerical/problem-solving questions
5. Label each question with difficulty (easy/medium/hard) and subject: "${aiSubjectName}"
6. Provide a brief explanation of the correct answer

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}

Generate exactly ${count} questions.`.trim();
    } else if (aiSubjectName) {
      testTitle = `${aiSubjectName} Subject Test`;
      transcript = `You are an expert question setter. Generate exactly ${count} high-quality multiple-choice questions covering the subject: "${aiSubjectName}".

DISTRIBUTION: Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}

REQUIREMENTS:
1. All questions must be from "${aiSubjectName}"
2. Cover diverse chapters and topics within the subject
3. Four distinct options labeled A, B, C, D — exactly one correct answer
4. Mix conceptual and numerical questions
5. Label each question with difficulty and subject: "${aiSubjectName}"
6. Provide a brief explanation of the correct answer

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}

Generate exactly ${count} questions.`.trim();
    } else {
      testTitle = `${exam} Diagnostic Test`;
      transcript = `You are an expert question setter for competitive exams in India. Generate exactly ${count} high-quality multiple-choice diagnostic test questions for ${exam} (${cfg.description}).

DISTRIBUTION: Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}

SUBJECTS TO COVER:
${cfg.topics.join("\n")}

REQUIREMENTS:
1. Four distinct options labeled A, B, C, D — exactly one correct answer
2. Questions should test conceptual understanding AND problem-solving
3. Include numerical problems where appropriate
4. Cover diverse topics — do NOT repeat the same topic twice in a row
5. Label each question with its subject and difficulty
6. Provide a brief explanation of the correct answer

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}

Generate exactly ${count} questions spanning all subjects evenly.`.trim();
    }

    try {
      setProgress("AI is generating questions (this may take ~30 seconds)…");
      const result = await aiGenerateQuestions({ transcript, lectureTitle: testTitle });
      const raw = result?.questions ?? [];

      if (!raw.length) {
        setError("AI returned no questions. Try again or reduce the count.");
        return;
      }

      setProgress(`Converting ${raw.length} questions…`);
      const drafts = raw.map((aiToDict: any) => {
        const q: AiGeneratedQuestion = {
          questionText: aiToDict.questionText || aiToDict.question || "",
          options: aiToDict.options ?? [],
          correctOption: aiToDict.correctOption || aiToDict.correct_option || "A",
          difficulty: aiToDict.difficulty ?? "medium",
          subject: aiToDict.subject ?? (aiSubjectName || ""),
          explanation: aiToDict.explanation ?? "",
        };
        return aiToDict3(q);
      });

      onQuestionsGenerated(drafts, aiTopicId || undefined);
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
      <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 border border-violet-200">
        <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
        <p className="text-xs text-violet-700 font-medium">
          {topicSelected
            ? `AI will generate ${count} questions specifically about "${aiTopicName}"`
            : aiChapterName
            ? `AI will generate ${count} questions for "${aiChapterName}" chapter`
            : aiSubjectName
            ? `AI will generate ${count} questions for "${aiSubjectName}" subject`
            : "Select a topic below for topic-specific questions, or use exam-based generation."}
        </p>
      </div>

      {/* Topic Selector */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Topic <span className="normal-case font-normal text-slate-400">(narrows questions to specific topic)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <select value={subjectId}
            onChange={e => {
              const id = e.target.value;
              const name = subjectList.find(s => s.id === id)?.name ?? "";
              setSubjectId(id); setChapterId(""); setAiTopicId(""); setAiTopicName(""); setAiSubjectName(name); setAiChapterName("");
            }}
            className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]">
            <option value="">Subject…</option>
            {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={chapterId}
            onChange={e => {
              const id = e.target.value;
              const name = chapterList.find(c => c.id === id)?.name ?? "";
              setChapterId(id); setAiTopicId(""); setAiTopicName(""); setAiChapterName(name);
            }}
            disabled={!subjectId}
            className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] disabled:opacity-40">
            <option value="">Chapter…</option>
            {chapterList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={aiTopicId}
            onChange={e => {
              const id = e.target.value;
              const name = topicList.find(t => t.id === id)?.name ?? "";
              setAiTopicId(id); setAiTopicName(name);
            }}
            disabled={!chapterId}
            className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] disabled:opacity-40">
            <option value="">Topic…</option>
            {topicList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {topicSelected ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-xs text-emerald-600 font-medium flex-1 truncate">
              {[aiSubjectName, aiChapterName, aiTopicName].filter(Boolean).join(" › ")}
            </span>
            <button type="button"
              onClick={() => { setSubjectId(""); setChapterId(""); setAiTopicId(""); setAiTopicName(""); setAiSubjectName(""); setAiChapterName(""); }}
              className="text-xs text-slate-400 hover:text-slate-700 shrink-0">Clear</button>
          </div>
        ) : (
          <p className="text-xs text-amber-600 pt-0.5">No topic selected — will use exam-based generation below.</p>
        )}
      </div>

      <div className={`grid gap-3 ${!topicSelected ? "grid-cols-2" : "grid-cols-1"}`}>
        {!topicSelected && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Exam Target</label>
            <select value={exam} onChange={e => setExam(e.target.value)}
              className="h-10 w-full px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]">
              {Object.keys(EXAM_CONFIGS).map(k => <option key={k} value={k}>{k.replace("_", " ")}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Number of Questions</label>
          <select value={count} onChange={e => setCount(+e.target.value)}
            className="h-10 w-full px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]">
            <option value={10}>10 questions (~15 min)</option>
            <option value={20}>20 questions (~30 min)</option>
            <option value={30}>30 questions (~45 min)</option>
            <option value={40}>40 questions (~60 min)</option>
            <option value={60}>60 questions (~90 min)</option>
          </select>
        </div>
      </div>

      {!topicSelected && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Subjects covered:</p>
          <div className="flex flex-wrap gap-1.5">
            {cfg.subjects.map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#013889]/10 text-[#013889] font-medium">{s}</span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Difficulty: ~30% easy · ~45% medium · ~25% hard</p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Additional Instructions <span className="text-slate-400 normal-case font-normal">(optional)</span>
        </label>
        <textarea rows={2} value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          placeholder={topicSelected
            ? `e.g. Include more numerical problems on ${aiTopicName}. Focus on advanced concepts.`
            : "e.g. Focus more on modern physics and organic chemistry. Avoid very long numerical problems."}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] resize-none" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {generating && (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
          <Loader2 className="w-4 h-4 animate-spin text-[#013889] shrink-0" />
          <p className="text-sm text-slate-600">{progress}</p>
        </div>
      )}

      <Button type="button" className="w-full gap-2" disabled={generating} onClick={handleGenerate}
        style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
        {generating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          : <><Wand2 className="w-4 h-4" /> Generate {count} Questions with AI</>
        }
      </Button>
    </div>
  );
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
  const fileRef: { current: HTMLInputElement | null } = { current: null };

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /></button>
            <h3 className="text-lg font-bold text-slate-800">Bulk Import via CSV</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <button onClick={downloadTemplate}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 hover:border-[#013889]/40 hover:bg-slate-50 transition-all mb-4 text-left">
          <Download className="w-4 h-4 text-[#013889] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-700">Download CSV Template</p>
            <p className="text-xs text-slate-400">Columns: question, option_a–d, correct_option (A/B/C/D), difficulty, marks_correct, marks_wrong</p>
          </div>
        </button>

        {!preview.length && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-[#013889] bg-blue-50" : "border-slate-200 hover:border-[#013889]/40 hover:bg-slate-50"}`}>
            <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Drop CSV file here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">Supports .csv files up to 100 questions</p>
            <input ref={r => { fileRef.current = r; }} type="file" accept=".csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {parseError && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
          </div>
        )}

        {preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />{preview.length} questions parsed successfully
              </p>
              <button onClick={() => setPreview([])} className="text-xs text-slate-400 hover:text-slate-700">Re-upload</button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {preview.map((q, i) => (
                <div key={q._key} className="text-xs bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold shrink-0">{i + 1}.</span>
                  <span className="text-slate-700 line-clamp-2">{q.content}</span>
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

// ─── Create Test Modal (4-step wizard) ───────────────────────────────────────

const STEP_LABELS = ["Test Type", "Scope", "Details", "Questions"];

type WizardStep = 0 | 1 | 2 | 3;

const CATEGORY_TO_TYPE: Record<TestCategory, string> = {
  subject: "subject_test",
  chapter: "chapter_test",
  topic:   "topic_test",
};

const TEST_CATEGORY_CONFIG: Record<TestCategory, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}> = {
  subject: {
    icon: BookOpen,
    label: "Subject Test",
    description: "A comprehensive test covering an entire subject — ideal for mid-term or end-of-term assessment.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  chapter: {
    icon: Layers,
    label: "Chapter Test",
    description: "A focused test for a specific chapter — perfect for post-chapter evaluation.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  topic: {
    icon: Target,
    label: "Topic Test",
    description: "A precise test targeting one topic — great for spot assessment and revision.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
};

function CreateTestModal({
  batchId, onClose, onCreated,
}: {
  batchId: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const createMockTest = useCreateMockTest();

  const [step, setStep] = useState<WizardStep>(0);
  const [testCategory, setTestCategory] = useState<TestCategory | null>(null);
  const [scope, setScope] = useState<ScopeState>(emptyScope);
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingMarks, setPassingMarks] = useState<number | "">("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()]);
  const [activeTab, setActiveTab] = useState<"manual" | "ai" | "csv">("manual");
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Scope selectors
  const { data: subjects } = useSubjects();
  const { data: chapters } = useChapters(scope.subjectId);
  const { data: topics } = useTopics(scope.chapterId);
  const subjectList = Array.isArray(subjects) ? subjects : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const topicList = Array.isArray(topics) ? topics : [];

  const computedMarks = questions.reduce((sum, q) => sum + q.marksCorrect, 0);
  const computedDuration = Math.max(30, Math.ceil(questions.length * 1.5));

  const suggestTitle = (cat: TestCategory, s: ScopeState) => {
    if (cat === "topic" && s.topicName) return `${s.topicName} — Topic Test`;
    if (cat === "chapter" && s.chapterName) return `${s.chapterName} — Chapter Test`;
    if (cat === "subject" && s.subjectName) return `${s.subjectName} — Subject Test`;
    return "";
  };

  const canProceedStep0 = testCategory !== null;

  const canProceedStep1 = (() => {
    if (!testCategory) return false;
    if (testCategory === "subject") return !!scope.subjectId;
    if (testCategory === "chapter") return !!scope.subjectId && !!scope.chapterId;
    if (testCategory === "topic") return !!scope.subjectId && !!scope.chapterId && !!scope.topicId;
    return false;
  })();

  const canProceedStep2 = title.trim().length > 0 && durationMinutes > 0;

  const canSubmit = questions.length > 0 && questions.every(q =>
    q.content.trim().length > 0 &&
    (q.type === "integer"
      ? (q.integerAnswer ?? "").toString().trim().length > 0
      : (q.options ?? []).some(o => o.isCorrect) && (q.options ?? []).every(o => o.content.trim().length > 0))
  );

  const handleNext = () => {
    setError("");
    if (step === 0 && canProceedStep0) {
      setStep(1);
    } else if (step === 1 && canProceedStep1) {
      if (!title) setTitle(suggestTitle(testCategory!, scope));
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 0) setStep((step - 1) as WizardStep);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Please complete all questions before submitting. Check for empty questions or missing correct answers.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const ids: string[] = [];
      for (const q of questions) {
        const payload: any = {
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          marksCorrect: q.marksCorrect,
          marksWrong: q.marksWrong,
        };
        if (scope.topicId) payload.topicId = scope.topicId;
        if (q.type === "integer") payload.integerAnswer = q.integerAnswer;
        else payload.options = q.options;
        const created = await createQuestion(payload);
        ids.push(created.id);
      }

      const test = await createMockTest.mutateAsync({
        title: title.trim(),
        type: testCategory ? CATEGORY_TO_TYPE[testCategory] : "topic_test",
        batchId,
        durationMinutes: durationMinutes || computedDuration,
        totalMarks: computedMarks || ids.length * 4,
        passingMarks: passingMarks !== "" ? passingMarks : undefined,
        subjectId: scope.subjectId || undefined,
        chapterId: scope.chapterId || undefined,
        topicId: scope.topicId || undefined,
        questionIds: ids,
      });

      onCreated(test.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create test.";
      const errs = err?.response?.data?.errors;
      setError(Array.isArray(errs) ? errs.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (showCsvImport) {
    return (
      <CsvImportModal
        onClose={onClose}
        onBack={() => setShowCsvImport(false)}
        onImported={(imported) => {
          setQuestions(prev => [...prev.filter(q => q.content.trim()), ...imported]);
          setShowCsvImport(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/30 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={handleBack} className="text-slate-400 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-lg font-bold text-slate-800">
              {step === 0 && "Choose Test Type"}
              {step === 1 && "Select Scope"}
              {step === 2 && "Test Details"}
              {step === 3 && "Add Questions"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <StepBar current={step} steps={STEP_LABELS} />

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 0: Test Type ── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">What kind of test do you want to create?</p>
              {(["subject", "chapter", "topic"] as TestCategory[]).map((cat) => {
                const cfg = TEST_CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                const isSelected = testCategory === cat;
                return (
                  <button key={cat} onClick={() => setTestCategory(cat)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      isSelected
                        ? `${cfg.border} ${cfg.bg}`
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}>
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      isSelected ? cfg.bg : "bg-slate-100")}>
                      <Icon className={cn("w-5 h-5", isSelected ? cfg.color : "text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-bold text-sm", isSelected ? cfg.color : "text-slate-700")}>{cfg.label}</p>
                        {isSelected && <Check className={cn("w-4 h-4", cfg.color)} />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{cfg.description}</p>
                    </div>
                  </button>
                );
              })}
              <Button className="w-full mt-2 gap-2" disabled={!canProceedStep0} onClick={handleNext}
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 1: Scope ── */}
          {step === 1 && testCategory && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div className={cn("flex items-center gap-2 p-3 rounded-xl border",
                TEST_CATEGORY_CONFIG[testCategory].border,
                TEST_CATEGORY_CONFIG[testCategory].bg)}>
                {(() => { const Icon = TEST_CATEGORY_CONFIG[testCategory].icon; return <Icon className={cn("w-4 h-4 shrink-0", TEST_CATEGORY_CONFIG[testCategory].color)} />; })()}
                <p className={cn("text-xs font-semibold", TEST_CATEGORY_CONFIG[testCategory].color)}>
                  {TEST_CATEGORY_CONFIG[testCategory].label} — select the scope below
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Subject *</label>
                <select value={scope.subjectId}
                  onChange={e => {
                    const id = e.target.value;
                    const name = subjectList.find(s => s.id === id)?.name ?? "";
                    setScope({ ...emptyScope, subjectId: id, subjectName: name });
                  }}
                  className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]">
                  <option value="">— Select Subject —</option>
                  {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {!subjectList.length && <p className="text-xs text-amber-500 mt-1">No subjects found. Create subjects in Content first.</p>}
              </div>

              {/* Chapter */}
              {(testCategory === "chapter" || testCategory === "topic") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Chapter *</label>
                  <select value={scope.chapterId} disabled={!scope.subjectId}
                    onChange={e => {
                      const id = e.target.value;
                      const name = chapterList.find(c => c.id === id)?.name ?? "";
                      setScope(s => ({ ...s, chapterId: id, chapterName: name, topicId: "", topicName: "" }));
                    }}
                    className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] disabled:opacity-40">
                    <option value="">— Select Chapter —</option>
                    {chapterList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Topic */}
              {testCategory === "topic" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Topic *</label>
                  <select value={scope.topicId} disabled={!scope.chapterId}
                    onChange={e => {
                      const id = e.target.value;
                      const name = topicList.find(t => t.id === id)?.name ?? "";
                      setScope(s => ({ ...s, topicId: id, topicName: name }));
                    }}
                    className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] disabled:opacity-40">
                    <option value="">— Select Topic —</option>
                    {topicList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              {/* Scope path preview */}
              {scope.subjectId && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-700">
                    {[scope.subjectName, scope.chapterName, scope.topicName].filter(Boolean).join(" › ")}
                  </span>
                </div>
              )}

              <Button className="w-full gap-2" disabled={!canProceedStep1} onClick={handleNext}
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Test Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={suggestTitle(testCategory!, scope) || "e.g. Chapter 1 — Kinematics Test"}
                  className="h-10 w-full px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] focus:ring-2 focus:ring-[#013889]/10" />
                {!title && (
                  <button onClick={() => setTitle(suggestTitle(testCategory!, scope))}
                    className="mt-1 text-xs text-[#013889] hover:underline font-medium">
                    Use suggested: "{suggestTitle(testCategory!, scope) || `${scope.subjectName} Test`}"
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Duration (minutes) *</label>
                  <input type="number" min={1} value={durationMinutes}
                    onChange={e => setDurationMinutes(+e.target.value)}
                    className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Passing Marks <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                  <input type="number" min={0} value={passingMarks}
                    onChange={e => setPassingMarks(e.target.value === "" ? "" : +e.target.value)}
                    placeholder="e.g. 60"
                    className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-600">Test Summary</p>
                <p>Scope: <span className="text-slate-700 font-medium">{[scope.subjectName, scope.chapterName, scope.topicName].filter(Boolean).join(" › ") || "—"}</span></p>
                <p>Type: <span className="text-slate-700 font-medium">{testCategory ? TEST_CATEGORY_CONFIG[testCategory].label : "—"}</span></p>
                <p className="text-amber-600">Total Marks: computed from questions added in next step</p>
              </div>

              <Button className="w-full gap-2" disabled={!canProceedStep2} onClick={handleNext}
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                Continue to Questions <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 3: Questions ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex-1">
                  <p className="font-bold text-slate-700 truncate">{title}</p>
                  <p className="text-slate-400 mt-0.5">{[scope.subjectName, scope.chapterName, scope.topicName].filter(Boolean).join(" › ") || "—"} · {durationMinutes} min</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#013889]">{questions.length}Q</p>
                  <p className="text-slate-400">{computedMarks} marks</p>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {(["manual", "ai", "csv"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize",
                      activeTab === tab ? "bg-white text-[#013889] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}>
                    {tab === "ai" ? "AI Generate" : tab === "csv" ? "CSV Import" : "Manual"}
                  </button>
                ))}
              </div>

              {/* Manual Tab */}
              {activeTab === "manual" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
                    <button onClick={() => setQuestions([...questions, blankQuestion()])}
                      className="flex items-center gap-1 text-xs font-bold text-[#013889] hover:text-[#0257c8]">
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {questions.map((q, i) => (
                      <QuestionRow key={q._key} q={q} index={i}
                        onChange={u => { const next = [...questions]; next[i] = u; setQuestions(next); }}
                        onRemove={() => setQuestions(questions.filter((_, j) => j !== i))}
                        canRemove={questions.length > 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* AI Tab */}
              {activeTab === "ai" && (
                <div className="max-h-[400px] overflow-y-auto pr-1">
                  <AIGeneratePanel
                    initSubjectId={scope.subjectId}
                    initSubjectName={scope.subjectName}
                    initChapterId={scope.chapterId}
                    initChapterName={scope.chapterName}
                    initTopicId={scope.topicId}
                    initTopicName={scope.topicName}
                    onQuestionsGenerated={(drafts) => {
                      setQuestions(prev => {
                        const hasContent = prev.filter(q => q.content.trim().length > 0);
                        return [...hasContent, ...drafts];
                      });
                      setActiveTab("manual");
                    }}
                  />
                </div>
              )}

              {/* CSV Tab */}
              {activeTab === "csv" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Import questions from a CSV file. Download the template to see the required format.</p>
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowCsvImport(true)}>
                    <Upload className="w-4 h-4" /> Open CSV Import
                  </Button>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {computedMarks > 0 && (
                  <p className="text-xs text-slate-400 text-center">
                    {questions.length} questions · {computedMarks} total marks · {durationMinutes} min
                  </p>
                )}
                <Button className="w-full gap-2" disabled={submitting || questions.length === 0}
                  onClick={handleSubmit}
                  style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving {questions.length} questions…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Create Test</>
                  }
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
    setError("");
    setSubmitting(true);
    try {
      const payload: any = {
        content: q.content, type: q.type, difficulty: q.difficulty,
        marksCorrect: q.marksCorrect, marksWrong: q.marksWrong,
      };
      if (topicId) payload.topicId = topicId;
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
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/30 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">Add Question</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <TopicPicker value={topicId} onChange={setTopicId} />
          <QuestionRow q={q} index={0} onChange={setQ} onRemove={() => {}} canRemove={false} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={submitting}
              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Question"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Mock Test Detail ─────────────────────────────────────────────────────────

function MockTestDetail({ testId, onBack }: { testId: string; onBack: () => void }) {
  const { data: test, isLoading } = useMockTestDetail(testId);
  const publishMockTest = usePublishMockTest();
  const updateMockTest = useUpdateMockTest();
  const removeQuestion = useRemoveQuestionFromMockTest(testId);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const questions = test?.questions ?? [];
  const existingIds = questions.map(q => q.id);

  if (isLoading) return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
    </div>
  );
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
          <button onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Tests
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">{test.title}</h2>
          {test.type && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[test.type] ?? "bg-slate-100 text-slate-500"}`}>
              {TYPE_LABELS[test.type] ?? test.type}
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${test.isPublished ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
            {test.isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" disabled={publishMockTest.isPending}
            onClick={() => publishMockTest.mutate({ id: testId, publish: !test.isPublished })}>
            {publishMockTest.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : test.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {test.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowAddQuestion(true)}
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
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
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #E6EEF8 0%, #CCE0F5 100%)", color: BLUE }}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-base font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No questions yet</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowAddQuestion(true)}
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
            <Plus className="w-3.5 h-3.5" /> Add Question
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 mt-0.5 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 leading-relaxed">{q.content}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{q.type}</span>
                      <span className="text-xs text-emerald-600 font-semibold">+{q.marksCorrect}</span>
                      {q.marksWrong !== 0 && <span className="text-xs text-red-500 font-semibold">{q.marksWrong}</span>}
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.options.map(o => (
                          <div key={o.id} className={cn("flex items-center gap-2 text-xs rounded-lg px-2 py-1",
                            o.isCorrect ? "bg-emerald-50 text-emerald-700" : "text-slate-500")}>
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
                  className="shrink-0 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50">
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

// ─── Batch Card ───────────────────────────────────────────────────────────────

function BatchCard({ batch, onClick }: { batch: Batch; onClick: () => void }) {
  const initials = batch.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const [imgError, setImgError] = useState(false);
  const resolvedThumb = resolveMediaUrl(batch.thumbnailUrl);
  const showImg = !!resolvedThumb && !imgError;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-[#013889]/30 transition-all overflow-hidden"
    >
      {/* Thumbnail / gradient header */}
      <div className="h-28 relative flex items-end p-3"
        style={{ background: showImg ? undefined : `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
        {showImg ? (
          <img src={resolvedThumb} alt={batch.name} onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-black text-white/20">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="relative flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
            {batch.examTarget}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
            {batch.class}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-sm truncate">{batch.name}</h3>
        {batch.description && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{batch.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>{batch.studentCount ?? 0} students</span>
          </div>
          <span className={cn("ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
            batch.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
            {batch.status}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type MainView = "batches" | "tests" | "detail";

const MockTestsPage = () => {
  const { data: batches, isLoading: batchesLoading } = useBatches();
  const deleteMockTest = useDeleteMockTest();
  const publishMockTest = usePublishMockTest();

  const [view, setView] = useState<MainView>("batches");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");

  const { data: tests, isLoading: testsLoading } = useMockTests(
    selectedBatch ? { batchId: selectedBatch.id } : undefined
  );

  const batchList = Array.isArray(batches) ? batches : [];
  const testList = Array.isArray(tests) ? tests : [];

  const filteredBatches = batchList.filter(b =>
    b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
    b.examTarget.toLowerCase().includes(batchSearch.toLowerCase())
  );

  const openBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setView("tests");
  };

  const goBack = () => {
    if (view === "detail") { setView("tests"); setSelectedTestId(""); }
    else if (view === "tests") { setView("batches"); setSelectedBatch(null); }
  };

  // ── Detail view ──
  if (view === "detail" && selectedTestId) {
    return (
      <div className="min-h-screen p-6" style={{ background: "#F7FAFF" }}>
        <MockTestDetail testId={selectedTestId} onBack={() => { setView("tests"); setSelectedTestId(""); }} />
      </div>
    );
  }

  // ── Phase 1: Batch grid ──
  if (view === "batches") {
    return (
      <div className="min-h-screen p-6" style={{ background: "#F7FAFF" }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800">Mock Tests</h1>
          <p className="text-sm text-slate-400 mt-0.5">Select a course to view and manage its mock tests</p>
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={batchSearch} onChange={e => setBatchSearch(e.target.value)}
            placeholder="Search courses…"
            className="h-10 w-full pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] focus:ring-2 focus:ring-[#013889]/10 shadow-sm"
          />
        </div>

        {batchesLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">{batchSearch ? "No courses match your search" : "No courses found"}</p>
            <p className="text-sm text-slate-400 mt-1">Create courses in the Courses section first</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBatches.map(batch => (
              <BatchCard key={batch.id} batch={batch} onClick={() => openBatch(batch)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Phase 2: Tests for selected batch ──
  return (
    <div className="min-h-screen p-6" style={{ background: "#F7FAFF" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={goBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800">{selectedBatch!.name}</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                {selectedBatch!.examTarget}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {selectedBatch!.class}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {testList.length} test{testList.length !== 1 ? "s" : ""} · {selectedBatch!.studentCount ?? 0} students
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5"
          style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
          <Plus className="w-4 h-4" /> Create Test
        </Button>
      </div>

      {/* Tests list */}
      {testsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
        </div>
      ) : testList.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <ClipboardList className="w-14 h-14 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-bold text-slate-500">No tests yet</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Create a Subject Test, Chapter Test, or Topic Test for this course
          </p>
          <div className="flex gap-2 justify-center mt-5">
            <Button className="gap-1.5" onClick={() => setShowCreate(true)}
              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
              <Sparkles className="w-3.5 h-3.5" /> Create with AI
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Manually
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {testList.map(test => (
            <motion.div key={test.id} layout
              className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-[#013889]/30 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #E6EEF8 0%, #CCE0F5 100%)" }}>
                    <ClipboardList className="w-5 h-5" style={{ color: BLUE }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{test.title}</h4>
                      {test.type && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[test.type] ?? "bg-slate-100 text-slate-500"}`}>
                          {TYPE_LABELS[test.type] ?? test.type}
                        </span>
                      )}
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                        test.isPublished ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                        {test.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
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
                    onClick={() => { setSelectedTestId(test.id); setView("detail"); }}>
                    <Pencil className="w-3 h-3" /> Manage
                  </Button>
                  <button onClick={() => deleteMockTest.mutate(test.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && selectedBatch && (
          <CreateTestModal
            batchId={selectedBatch.id}
            onClose={() => setShowCreate(false)}
            onCreated={id => { setShowCreate(false); setSelectedTestId(id); setView("detail"); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockTestsPage;
