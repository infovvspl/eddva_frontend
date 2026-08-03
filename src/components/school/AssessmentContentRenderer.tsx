import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { formatMarkdown } from "@/components/shared/MarkdownRenderer";

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
  let text = raw.trim();
  if (!text) return text;

  // 1. Join any standalone question number ("1.", "2.", "Q1.") followed by single or double
  // newlines with its question text so they are NEVER separated into distinct blocks.
  text = text.replace(
    /((?:^|\n)\s*(?:Q\s*)?\d{1,3}[.)])\s*(?:\r?\n)+\s*(?!(?:[A-E][.):]\s*|\([A-E]\)\s*|Q?\d{1,3}[.)]\s*|#{1,6}\s|[-*+]\s))/gi,
    "$1 "
  );

  const lines = text.split(/\r?\n/);

  // Dense single-blob (3 lines or fewer but long) — insert paragraph breaks.
  if (lines.length <= 3 && text.length > 220) {
    text = text
      .replace(/\s+(?=(?:Section|Part|Answer Key|Answers|Ans Key|General Instructions)\b)/gi, "\n\n")
      .replace(/\s+(?=#+\s+)/g, "\n\n")
      .replace(/([^\n])\s+(?=Q?\s*\d{1,3}[.)]\s+)/g, "$1\n\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    // Already multi-line — collapse excess blank lines.
    text = text.replace(/\n{3,}/g, "\n\n");
  }

  // Re-run number joining after paragraph breaking as a final pass
  text = text.replace(
    /((?:^|\n)\s*(?:Q\s*)?\d{1,3}[.)])\s*(?:\r?\n)+\s*(?!(?:[A-E][.):]\s*|\([A-E]\)\s*|Q?\d{1,3}[.)]\s*|#{1,6}\s|[-*+]\s))/gi,
    "$1 "
  );

  // Escape the dot after line-starting numbers (1. -> 1\.) so Markdown renders
  // them as a single inline paragraph instead of an HTML <ol><li> list element.
  // Avoid escaping dots if followed by LaTeX delimiters or math expressions.
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

  const prepared = prepareAssessmentText(children);
  const formatted = formatMarkdown(prepared);

  return (
    <div className={`assessment-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={assessmentComponents as any}
      >
        {formatted}
      </ReactMarkdown>
    </div>
  );
}
