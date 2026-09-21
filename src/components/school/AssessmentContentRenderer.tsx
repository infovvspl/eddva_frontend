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
 * The AI generator occasionally repeats a section heading verbatim (or
 * glues a second copy directly onto the previous sentence with no newline)
 * — a generation glitch, not two different sections. Collapses any run of
 * consecutive "## Section X" / "### Section X" headings that share the same
 * section letter down to just the last (fullest) one, keeping genuinely
 * different back-to-back sections (e.g. an empty Section B) intact.
 */
function dedupeSectionHeadings(text: string): string {
  // Force every heading onto its own line first, even when the source glued
  // it straight onto trailing punctuation from the previous line. The
  // negative lookbehind keeps this from re-triggering on every "#" inside an
  // already-multi-hash marker (e.g. "###" would otherwise also match at its
  // own 2nd and 3rd characters, shredding the marker into lone "#" lines).
  const spaced = text.replace(/(?<!#)[ \t]*(?=#{1,4}\s*Section\s+[A-E]\b)/gi, "\n\n");
  const lines = spaced.split("\n");
  const headingRe = /^#{1,4}\s*Section\s+([A-E])\b/i;
  const output: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(headingRe);
    if (!match) {
      output.push(lines[i]);
      i++;
      continue;
    }
    const letter = match[1].toUpperCase();
    let lastHeadingLine = trimmed;
    let cursor = i;
    let j = i + 1;
    while (j < lines.length) {
      const nextTrimmed = lines[j].trim();
      if (!nextTrimmed) {
        j++;
        continue;
      }
      const nextMatch = nextTrimmed.match(headingRe);
      if (nextMatch && nextMatch[1].toUpperCase() === letter) {
        lastHeadingLine = nextTrimmed;
        cursor = j;
        j++;
        continue;
      }
      break;
    }
    output.push("", lastHeadingLine);
    i = cursor + 1;
  }
  return output.join("\n");
}

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
/**
 * Markdown images, pulled out before the text transformations below and put
 * back afterwards.
 *
 * Every pass in prepareAssessmentText is written for exam prose and is actively
 * harmful to a URL: the bare-underscore rule inserts a backslash inside the
 * path, the "[p. 12]" citation cleanup eats bracketed alt text, and the
 * LaTeX auto-wrapping treats a backslash or a digit-caret in a filename as
 * maths. Chapter figures arrive as Markdown images, so they have to sit out
 * every one of those passes.
 */
const IMAGE_TOKEN_RE = /!\[[^\]]*\]\([^)\s]+\)/g;

function protectImages(text: string): { text: string; images: string[] } {
  const images: string[] = [];
  const masked = text.replace(IMAGE_TOKEN_RE, (match) => {
    images.push(match);
    // Deliberately plain letters and digits on their own line: no underscore
    // for the escaping pass to touch, no bracket for the citation cleanup, no
    // backslash or digit-caret for the LaTeX heuristics, and nothing that
    // looks like a question number to the paragraph-splitting rules.
    return `\n\nIMGTOKEN${images.length - 1}ENDIMG\n\n`;
  });
  return { text: masked, images };
}

function restoreImages(text: string, images: string[]): string {
  if (!images.length) return text;
  return text.replace(/IMGTOKEN(\d+)ENDIMG/g, (whole, index) => {
    const image = images[Number(index)];
    // Kept on their own lines so ReactMarkdown renders a block image rather
    // than wedging it inside the question's paragraph.
    return image ? `\n\n${image}\n\n` : whole;
  });
}

function prepareAssessmentText(raw: string): string {
  let text = (raw || "").trim();
  if (!text) return text;

  // Images are masked out FIRST, before any other pass can touch them: every
  // heuristic below is written for exam prose and is hostile to a URL.
  const protectedImages = protectImages(text);
  text = protectedImages.text;

  text = dedupeSectionHeadings(text);

  // Unescape double backslashes. Restricted to a backslash pair immediately followed by a letter
  // (a double-escaped command name, e.g. "\\text{Na}") — collapsing it unconditionally also
  // destroys the genuine LaTeX row-separator "\\" inside \begin{cases}/array/matrix (followed by
  // whitespace/newline, never a letter), silently running a system of equations onto one line.
  text = text.replace(/\\\\(?=[a-zA-Z])/g, "\\");

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

  // Renumber "Qn." markers sequentially across the WHOLE document (1, 2, 3, ...)
  // instead of the authored numbering, which restarts at 1 in every section
  // (Section A: Q1-Q3, Section B: Q1-Q3, ...). Only markers with a literal "Q"
  // prefix are touched, so the separate bare-numbered "General Instructions"
  // list is left alone. content_text and answer_key each get their own counter
  // via their own AssessmentContentRenderer call, but since both list the same
  // questions in the same section order, the two stay in sync.
  let questionCounter = 0;
  text = text.replace(/^Q\s*\d{1,3}(?=[.)])/gm, () => `Q${++questionCounter}`);

  // Escape the dot after line-starting numbers (1. -> 1\.) so Markdown renders
  // them as a single inline paragraph instead of an HTML <ol><li> list element.
  text = text.replace(/^(\s*(?:Q\s*)?\d{1,3})\.(?!\s*[\$\\])/gm, "$1\\.");

  text = restoreImages(text, protectedImages.images);
  text = text.replace(/\n{3,}/g, "\n\n");

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
  // Chapter figures. ReactMarkdown's default <img> carries no width constraint,
  // so a 1200px crop would push the paper into horizontal scrolling; and since
  // the surrounding <p> is the block that lays it out, the figure is centred
  // and given a caption-ish max width rather than filling the column edge to
  // edge. Lazy-loaded because a paper can carry a dozen of them.
  img: ({ src, alt, ...props }: any) => (
    <img
      {...props}
      src={src}
      alt={alt || "Figure"}
      loading="lazy"
      className="my-3 mx-auto block h-auto max-w-full rounded border border-gray-200 bg-white"
      style={{ maxHeight: "420px" }}
    />
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
