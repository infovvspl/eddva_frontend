/**
 * Building blocks of the AI notes view (AiNotesPanel): lesson-markdown
 * normalisation, the practice-question card and the flashcard.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, ChevronDown, Lightbulb, ListTodo, MessageSquare } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { CardGlass } from "@/components/shared/CardGlass";
import type { AiPracticeQuestion } from "@/lib/api/student";
import { cn } from "@/lib/utils";

export function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Markdown styles (Modernized for Aero) ──────────────────────────────────────
export const mdClassBase = [
  "prose max-w-none",
  "prose-h2:font-black prose-h2:text-slate-900 prose-h2:mt-10 prose-h2:mb-5 prose-h2:tracking-tight",
  "prose-h3:font-bold prose-h3:text-slate-800 prose-h3:mt-7 prose-h3:mb-3",
  "prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-5 prose-p:font-medium",
  "prose-strong:text-slate-900 prose-strong:font-black prose-strong:bg-blue-50 prose-strong:px-1.5 prose-strong:py-0.5 prose-strong:rounded-lg",
  "prose-code:bg-slate-100 prose-code:text-blue-600 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:font-mono prose-code:font-black prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:bg-slate-900 prose-pre:text-white prose-pre:rounded-2xl prose-pre:p-6 prose-pre:shadow-xl",
  "prose-ul:text-slate-700 prose-ul:space-y-3 prose-ul:my-5",
  "prose-li:marker:text-blue-500 prose-li:marker:font-black",
  "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:rounded-2xl prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:text-slate-700 prose-blockquote:my-6",
].join(" ");

export function normalizeAiMessage(message: unknown): string {
  if (typeof message === "string") {
    const tryParseJsonPayload = (input: string): string | null => {
      const trimmedInput = input.trim();
      if (!trimmedInput) return null;
      try {
        return normalizeAiMessage(JSON.parse(trimmedInput));
      } catch {
        return null;
      }
    };

    const trimmed = message.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const directParsed = tryParseJsonPayload(trimmed);
    if (directParsed) return directParsed;

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const extractedObject = trimmed.slice(firstBrace, lastBrace + 1);
      const parsedObject = tryParseJsonPayload(extractedObject);
      if (parsedObject) return parsedObject;
    }
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      const extractedArray = trimmed.slice(firstBracket, lastBracket + 1);
      const parsedArray = tryParseJsonPayload(extractedArray);
      if (parsedArray) return parsedArray;
    }
    return trimmed;
  }
  if (message && typeof message === "object") {
    const m = message as any;
    if (typeof m.response === "string") return m.response;
    if (typeof m.answer === "string") return m.answer;
    if (typeof m.message === "string") return m.message;
    if (Array.isArray(m.hints) && m.hints.length) {
      const hints = m.hints.map((h: unknown) => `- ${String(h)}`).join("\n");
      return `Hints:\n${hints}`;
    }
    return JSON.stringify(message);
  }
  return String(message ?? "");
}

export function normalizeLessonMarkdown(md: string): string {
  return String(md || "")
    // Restricted to a backslash pair immediately followed by a letter (a double-JSON-escaped
    // command name, e.g. "\\text{Na}" meaning "\text{Na}") — collapsing it unconditionally also
    // destroyed the genuine LaTeX row-separator "\\" inside \begin{cases}/array/matrix (which is
    // followed by whitespace/a newline, never a letter), silently running a system of equations
    // onto one line. Same fix as MarkdownRenderer.tsx's identical first-pass unescape.
    .replace(/\\\\(?=[a-zA-Z])/g, "\\")
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_m, inner) => `\n\n$$${inner}$$\n\n`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_m, inner) => `$${inner}$`)
    .replace(
      /(^|\n)\s*(Formula|Equation)\s*:\s*([^\n]+)/gi,
      (_m, prefix, label, expr) => {
        const e = String(expr || "").trim();
        const looksMath = /[=+\-*/^]|\\[a-zA-Z]+|[Δδαβγθλμπσω]/.test(e);
        if (!looksMath) return `${prefix}${label}: ${e}`;
        return `${prefix}${label}: $$${e}$$`;
      },
    )
    .replace(/\n##\s*.*Core Concepts[\s\S]*?(?=\n##\s+|$)/gi, "\n");
}

export function formatSolutionSteps(text: string): string {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\s*(Step\s*[:#.)-]?\s*\d+\b)/gi, "$1\n\n$2")
    .replace(/\n{3,}/g, "\n\n");
}

export function normalizeReadableText(text: string): string {
  return String(text || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])([.:,;!?()])/g, "$1 $2")
    .replace(/([.:,;!?()])([A-Za-z])/g, "$1 $2")
    .replace(/\s*[-−]\s*/g, " − ")
    .replace(/\s+/g, " ")
    .trim();
}

export type SavedHighlight = { text: string; color: string };
export type InlineComment = { id: string; text: string; quote: string; top: number; left?: number };

export function parseMcqOptions(rawQuestion: string, rawOptions?: unknown[]) {
  const optionsFromPayload = Array.isArray(rawOptions)
    ? rawOptions
      .map((opt) => {
        if (typeof opt === "string") return opt.trim();
        if (opt && typeof opt === "object") {
          const o = opt as Record<string, unknown>;
          return String(o.content ?? o.text ?? o.value ?? "").trim();
        }
        return "";
      })
      .filter(Boolean)
    : [];
  if (optionsFromPayload.length >= 2) {
    return { question: rawQuestion.trim(), options: optionsFromPayload };
  }

  const normalized = String(rawQuestion || "").replace(/\r/g, "\n");
  const markerRegex = /(?:^|\n)\s*(?:[A-Da-d][\).\]:-]|\(\s*[A-Da-d]\s*\))\s*/g;
  const matches = Array.from(normalized.matchAll(markerRegex));
  if (matches.length < 2) {
    return { question: rawQuestion.trim(), options: [] as string[] };
  }

  const firstMarker = matches[0].index ?? 0;
  const questionStem = normalized.slice(0, firstMarker).trim();
  const options = matches.map((match, idx) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = idx + 1 < matches.length ? (matches[idx + 1].index ?? normalized.length) : normalized.length;
    return normalized.slice(start, end).trim();
  }).filter(Boolean);

  return { question: questionStem || rawQuestion.trim(), options };
}

export function NotesFlashcard({
  question,
  answer,
  explanation,
  flipped,
  onToggle,
}: {
  question: string;
  answer: string;
  explanation?: string;
  flipped: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative min-h-[180px] transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className="absolute inset-0 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm overflow-auto"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 mb-3">Question</p>
          <div className="text-sm font-semibold text-slate-800 leading-relaxed">
            <MarkdownRenderer content={question} />
          </div>
          <p className="text-[11px] text-slate-500 mt-4">Click to reveal answer</p>
        </div>
        <div
          className="absolute inset-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm overflow-auto"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-3">Answer</p>
          <div className="text-sm font-semibold text-slate-800 leading-relaxed">
            <MarkdownRenderer content={formatSolutionSteps(answer)} />
          </div>
          {explanation && (
            <div className="text-xs text-slate-600 mt-3 leading-relaxed">
              <MarkdownRenderer content={formatSolutionSteps(explanation)} />
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-3">Click to flip back</p>
        </div>
      </div>
    </button>
  );
}

export function PracticeCard({ q, index, onAskAI }: { q: AiPracticeQuestion; index: number; onAskAI: (question: string) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const parsed = useMemo(() => {
    const rawFromAny = (q as any).options ?? (q as any).choices ?? (q as any).optionList ?? [];
    const primary = parseMcqOptions(q.question, rawFromAny);
    if (primary.options.length > 0) return primary;
    const fromAnswer = parseMcqOptions(q.question, []);
    if (fromAnswer.options.length > 0) return fromAnswer;
    const combined = parseMcqOptions(`${q.question}\n${q.answer}`, []);
    return combined.options.length ? combined : primary;
  }, [q]);
  const correctOptionIndex = useMemo(() => {
    const answer = String(q.answer || "").trim();
    if (!answer) return null;
    const letterMatch = answer.match(/\b([A-Da-d])\b/);
    if (letterMatch?.[1]) return letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    const startsMatch = answer.match(/^\s*([A-Da-d])[\).\]:-]/);
    if (startsMatch?.[1]) return startsMatch[1].toUpperCase().charCodeAt(0) - 65;
    return null;
  }, [q.answer]);

  return (
    <CardGlass className={cn("p-0 overflow-hidden transition-all duration-300 border-slate-200 bg-white shadow-sm", open ? "shadow-md" : "hover:shadow-md")}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 p-5 text-left transition-colors"
      >
        <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500">Q{index + 1}</span>
        </div>
        <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug flex-1 truncate">{parsed.question}</p>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="size-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 pt-3 border-t border-slate-100 space-y-5">
              <div>
                <p className="text-[11px] font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                  <Brain className="size-4 text-indigo-500" /> Full Question
                </p>
                <div className="text-sm font-semibold text-slate-800 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <MarkdownRenderer content={parsed.question} />
                </div>
              </div>

              {parsed.options.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <ListTodo className="size-4" /> Options
                  </p>
                  <div className="space-y-2">
                    {parsed.options.map((option, optionIndex) => (
                      <div
                        key={`${option}-${optionIndex}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedOptionIndex(optionIndex)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedOptionIndex(optionIndex);
                          }
                        }}
                        className={cn(
                          "w-full text-left text-sm font-medium leading-relaxed p-3 rounded-xl border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500",
                          selectedOptionIndex === optionIndex
                            ? "bg-blue-100 border-blue-300 text-slate-800"
                            : "bg-blue-50 border-blue-100 text-slate-700 hover:bg-blue-100/70",
                        )}
                      >
                        <span className="font-semibold text-blue-700 mr-2 inline-block">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        <div className="inline-block align-top text-slate-700">
                          <MarkdownRenderer content={option} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedOptionIndex !== null && correctOptionIndex !== null && (
                    <p
                      className={cn(
                        "mt-2 text-xs font-semibold",
                        selectedOptionIndex === correctOptionIndex ? "text-emerald-700" : "text-rose-700",
                      )}
                    >
                      {selectedOptionIndex === correctOptionIndex
                        ? "Correct option selected."
                        : `Selected ${String.fromCharCode(65 + selectedOptionIndex)}. Correct option: ${String.fromCharCode(65 + correctOptionIndex)}.`}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="size-4" /> Solution Core
                </p>
                <div className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <MarkdownRenderer content={formatSolutionSteps(q.answer)} />
                </div>
              </div>
              {q.explanation && (
                <div>
                  <p className="text-[11px] font-semibold text-amber-600 mb-2 flex items-center gap-2">
                    <Lightbulb className="size-4" /> Logic Synthesis
                  </p>
                  <div className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <MarkdownRenderer content={formatSolutionSteps(q.explanation)} />
                  </div>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={(e) => { e.stopPropagation(); onAskAI(q.question); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm"
              >
                <MessageSquare className="size-4" /> Ask AI for explanation
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CardGlass>
  );
}
