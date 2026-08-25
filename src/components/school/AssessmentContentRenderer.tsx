import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type AssessmentContentRendererProps = {
  children: string;
  className?: string;
};

/**
 * Pre-processor for assessment paper / answer key text.
 *
 * Goals:
 *  1. Join ANY question number (e.g. "1.\n", "1.\n\n", "Q2.\n\n") with its statement text
 *     so they are guaranteed to sit on the exact same line.
 *  2. Escape the dot after numbers at start of lines (e.g. "1." -> "1\.") so Markdown
 *     renders them as clean single paragraphs rather than <ol><li> list items (which can
 *     break lines on certain browser/CSS list marker layouts).
 *  3. Preserve LaTeX delimiters so KaTeX renders equations ($V = s^3$).
 */
function prepareAssessmentText(raw: string): string {
  let text = (raw || "").trim();
  if (!text) return text;

  // Unescape double backslashes
  text = text.replace(/\\\\/g, "\\");

  // Convert LaTeX delimiters \[ \] and \( \) to $$ and $ for remark-math / KaTeX parsing
  text = text
    .replace(/\\\[/g, "$$").replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$").replace(/\\\)/g, "$");

  // Unescape dollar delimiters (\$ -> $) so escaped math still renders.
  text = text.replace(/\\\$/g, "$");

  // Remove textbook page citations that leaked from grounding into the question text
  text = text.replace(/\s*\[\s*[pP]\.?\s*\d+(?:\s*,\s*[pP]?\.?\s*\d+)*\s*\]/g, "");

  // Convert raw fill-in-blank placeholders \text{____} or bare ____ (which throw KaTeX subscript errors)
  // to \underline{\quad\quad} which renders a clean underline in math mode.
  text = text.replace(/\\text\{\s*[_.\-]{2,}\s*\}/g, "\\underline{\\quad\\quad}");
  text = text.replace(/(?<!\\)_(?![_{}a-zA-Z0-9])/g, "\\_");

  // Auto-wrap un-delimited LaTeX commands like \sqrt{...}, \frac{...}, \underline{...} outside $...$
  text = text
    .split("$")
    .map((segment, index) => {
      if (index % 2 === 1) return segment; // Inside $...$, skip
      // 1. Wrap commands with brace-argument groups (e.g. \frac{a}{b}, \sqrt{x}, \underline{...})
      let s = segment.replace(/(\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt\{[^{}]*\}|\\underline\{[^{}]*\}|\\[a-zA-Z]+(?:\{[^{}]*\})+)/g, "$$$1$");
      // 2. Wrap standalone math symbol commands (no brace args).
      //    Allow trailing period/comma/semicolon so "\times." or "\dots." is caught too.
      s = s.replace(/((?:^|[\s\w=×÷±$(),]))(\\(?:times|cdot|div|pm|mp|leq|geq|neq|approx|infty|rightarrow|leftarrow|to|in|notin|subset|supset|cup|cap|forall|exists|alpha|beta|gamma|delta|epsilon|varepsilon|theta|vartheta|lambda|mu|nu|pi|sigma|tau|phi|varphi|psi|omega|rho|eta|chi|xi|zeta|iota|kappa|upsilon|dots|ldots|cdots|vdots|ddots|therefore|because|implies|iff))([\s\w=(),;.:]|$)/g, (_m, pre, cmd, post) => `${pre}$${cmd}$${post}`);
      return s;
    })
    .join("$");

  // Heuristic: wrap entire "math-like" trailing portions of lines that mix
  // bare caret-exponents / LaTeX symbols without any $ delimiters.
  // e.g. "The prime factorisation of 120 is 2^3 \times 3 \times \text{____}."
  // → keep prose prefix, wrap the math suffix in $...$
  text = text
    .split("\n")
    .map((line) => {
      // Skip lines that already have $ or are blank
      if (!line.trim() || line.includes("$")) return line;
      // Must contain a LaTeX command OR caret exponent to be worth examining
      const hasLatex = /\\[a-zA-Z]/.test(line);
      const hasCaret = /\d\^/.test(line);
      if (!hasLatex && !hasCaret) return line;
      // Don't touch section headers or question number lines
      if (/^(?:Q\s*)?\d{1,3}[.)]\s+/.test(line.trim()) && !/\\/.test(line.replace(/^(?:Q\s*)?\d{1,3}[.)]\s+/, ''))) return line;
      // Find where the "math suffix" begins: last position of a word boundary
      // before any \command or digit^ that's not already in prose context.
      // Simple approach: if the entire trimmed content looks like an expression, wrap it all.
      const mathExprPattern = /^([^\\]*?)((?:\d+\^(?:\{[^{}]*\}|\d+)\s*(?:\\[a-zA-Z]+(?:\{[^{}]*\})?\s*)*)+.*)$/;
      const m = line.match(mathExprPattern);
      if (m) {
        const [, prose, mathPart] = m;
        // Avoid wrapping if mathPart is just a single digit or short fragment
        if (mathPart.trim().length > 4) {
          return `${prose}$${mathPart.trim().replace(/[.,;]$/, "")}$${mathPart.match(/[.,;]$/)?.[0] ?? ""}`;
        }
      }
      return line;
    })
    .join("\n");

  // 1. Join any standalone question number ("1.", "2.", "Q1.") followed by single or double
  // newlines with its question text so they are NEVER separated into distinct blocks.
  text = text.replace(
    /((?:^|\n)\s*(?:Q\s*)?\d{1,3}[.)])\s*(?:\r?\n)+\s*(?!(?:[A-E][.):]\s*|\([A-E]\)\s*|Q?\d{1,3}[.)]\s*|#{1,6}\s|[-*+]\s))/gi,
    "$1 "
  );

  // Break before Section/heading markers and before every question number that
  // follows other text on the same line.
  text = text
    .replace(/([^\n])\s+(?=(?:Section|Part|Answer Key|Answers|Ans Key|General Instructions)\b)/gi, "$1\n\n")
    .replace(/([^\n])\s+(?=#{1,6}\s+)/g, "$1\n\n")
    .replace(/([^\n])\s+(?=(?:Q\s*)?\d{1,3}[.)]\s+)/g, "$1\n\n")
    .replace(/\n{3,}/g, "\n\n");

  // Re-run number joining after paragraph breaking as a final pass
  text = text.replace(
    /((?:^|\n)\s*(?:Q\s*)?\d{1,3}[.)])\s*(?:\r?\n)+\s*(?!(?:[A-E][.):]\s*|\([A-E]\)\s*|Q?\d{1,3}[.)]\s*|#{1,6}\s|[-*+]\s))/gi,
    "$1 "
  );

  // Escape the dot after line-starting numbers (1. -> 1\.) so Markdown renders
  // them as a single inline paragraph instead of an HTML <ol><li> list element.
  text = text.replace(/^(\s*(?:Q\s*)?\d{1,3})\.(?!\s*[\$\\])/gm, "$1\\.");

  return text;
}

/**
 * Custom components for the assessment paper view.
 */
const assessmentComponents = {
  p: ({ children, ...props }: any) => (
    <p {...props} className="my-2.5 text-sm leading-relaxed text-gray-800 font-sans">
      {children}
    </p>
  ),
  li: ({ children, ...props }: any) => (
    <li {...props} className="my-1.5 text-sm leading-relaxed text-gray-800 [&_p]:inline [&_p]:m-0">
      {children}
    </li>
  ),
  h1: ({ children, ...props }: any) => (
    <h1 {...props} className="mt-5 mb-2 text-base font-bold text-gray-900 border-b border-gray-200 pb-1">
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 {...props} className="mt-5 mb-2 text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-1">
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 {...props} className="mt-3 mb-1 text-sm font-semibold text-gray-700">
      {children}
    </h3>
  ),
  strong: ({ children, ...props }: any) => (
    <strong {...props} className="font-semibold text-gray-900">
      {children}
    </strong>
  ),
  ol: ({ children, ...props }: any) => (
    <ol {...props} className="my-2 space-y-1 list-decimal pl-5">
      {children}
    </ol>
  ),
  ul: ({ children, ...props }: any) => (
    <ul {...props} className="my-2 space-y-1 list-disc pl-5">
      {children}
    </ul>
  ),
  hr: ({ ...props }: any) => (
    <hr {...props} className="my-4 border-gray-200" />
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote {...props} className="my-3 border-l-4 border-gray-300 pl-4 text-sm text-gray-600 italic">
      {children}
    </blockquote>
  ),
};

export default function AssessmentContentRenderer({
  children,
  className = "",
}: AssessmentContentRendererProps) {
  if (!children?.trim()) {
    return (
      <p className={`text-sm text-gray-400 italic ${className}`}>
        No content available.
      </p>
    );
  }

  // Note: the notes-oriented formatMarkdown() is deliberately NOT used here — its
  // math-repair heuristics mangled all-caps question papers (stray $, hydrate
  // wrapping, joining Section headers onto the first question). prepareAssessmentText
  // + remark-math is all an exam paper needs.
  const prepared = prepareAssessmentText(children);

  return (
    <div className={`assessment-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={assessmentComponents as any}
      >
        {prepared}
      </ReactMarkdown>
    </div>
  );
}
