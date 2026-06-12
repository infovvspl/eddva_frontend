import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Pre-processes markdown text to handle common AI formatting quirks
 * and ensures LaTeX delimiters are correctly interpreted by remark-math.
 */
export const formatMarkdown = (text?: string) => {
  if (!text) return "";
  
  let formatted = text
    // 1. Unescape double-escaped backslashes from JSON payloads
    .replace(/\\\\/g, "\\")
    // 2. Restore form feeds and other control characters that might be mangled backslash sequences
    .replace(/\x0C/g, "\\f")
    .replace(/\x0B/g, "\\v")
    .replace(/\x07/g, "\\a")
    .replace(/\x08/g, "\\b")
    // 3. Keep carriage returns as simple newlines
    .replace(/\\n/g, "\n")
    .replace(/\r?\n/g, "\n\n");

  // Step-based and final answer formatting
  formatted = formatted
    .replace(/(Step\s*\d+[^a-zA-Z0-9\s]?|Final\s*Answer\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    // Theory-specific 5-part numerical/theory headers
    .replace(/(\(\d\)\s*[a-zA-Z\s/-]+[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    // Legacy sub-headers
    .replace(/(Reason\s*[:\u2014\u2013\u002D.]?|Explanation\s*[:\u2014\u2013\u002D.]?|Logic\s*[:\u2014\u2013\u002D.]?|Key\s*Concept\s*[:\u2014\u2013\u002D.]?|Verification\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1");

  // 4. Convert LaTeX delimiters from \[ \] and \( \) to $$ and $ if remark-math needs them
  formatted = formatted
    .replace(/\\\[/g, "$$").replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$").replace(/\\\)/g, "$");

  // 5. Restore missing backslashes for common math symbols (e.g. frac, sqrt, pi, theta, etc.)
  formatted = formatted
    .replace(/(^|[^A-Za-z\\])(rac|sqrt|int|sum|lim|sin|cos|tan|theta|alpha|beta|gamma|delta|pi|phi|psi|omega|lambda|sigma|mu|nu|zeta|eta|iota|kappa|tau|upsilon|xi|chi|rho)\{/g, "$1\\$2{")
    .replace(/(^|[^A-Za-z\\])(int_|sum_|lim_)/g, "$1\\$2")
    .replace(/x\s+\bo\b\s+(\d+|[a-z])/gi, "x \\to $1")
    .replace(/x\s*->\s*(\d+|[a-z])/gi, "x \\to $1");

  // 6. Pre-process fractions, limits, and exponents before math wrapping
  // Convert caret/subscript with parentheses to curly braces e.g. ^(n-1) -> ^{n-1}
  formatted = formatted
    .replace(/\^\(([^)]+)\)/g, "^{$1}")
    .replace(/_\(([^)]+)\)/g, "_{$1}");

  // Convert limits e.g. limh -> 0 to \lim_{h \to 0}
  formatted = formatted
    .replace(/\blim\s*([a-zA-Z0-9]+)\s*(?:->|\\to)\s*([a-zA-Z0-9]+)\b/gi, "\\lim_{$1 \\to $2}");

  // Convert division slashes to \frac{}{} where safe
  // 1. (num) / (den) or [num] / [den]
  formatted = formatted.replace(/(?:\(([^)]+)\)|\[([^\]]+)\])\s*\/\s*(?:\(([^)]+)\)|\[([^\]]+)\])/g, (match, p1, p2, p3, p4) => {
    const num = p1 || p2;
    const den = p3 || p4;
    return `\\frac{${num}}{${den}}`;
  });
  // 2. (num) / den_word or [num] / den_word
  formatted = formatted.replace(/(?:\(([^)]+)\)|\[([^\]]+)\])\s*\/\s*\b([a-zA-Z0-9]+)\b/g, (match, p1, p2, p3) => {
    const num = p1 || p2;
    return `\\frac{${num}}{${p3}}`;
  });
  // 3. num_word / (den) or num_word / [den]
  formatted = formatted.replace(/\b([a-zA-Z0-9]+)\b\s*\/\s*(?:\(([^)]+)\)|\[([^\]]+)\])/g, (match, p1, p2, p3) => {
    const den = p2 || p3;
    return `\\frac{${p1}}{${den}}`;
  });
  // 4. short_word / short_word (to catch dy/dx, 1/2, x/y safely)
  formatted = formatted.replace(/\b([a-zA-Z0-9]{1,3})\s*\/\s*([a-zA-Z0-9]{1,3})\b/g, "\\frac{$1}{$2}");

  // 7. Split by $ to protect already-formatted math blocks
  const parts = formatted.split("$");
  for (let i = 0; i < parts.length; i += 2) {
    let segment = parts[i];

    const englishWords = '(?:is|as|if|of|to|by|we|do|in|on|an|the|and|or|for|but|yet|so|at|then|with|from|into|over|under|above|below|between|among|through|during|before|after|against|about|like|throughout|upon|within|without|since|until|here|there|when|where|why|how|all|any|both|each|few|more|most|some|such|no|nor|not|only|own|same|than|too|very|can|will|should|would|could|may|might|must|shall|derivative|limit|function|chapter|topic|question|answer|solution|rule|power|quotient|product|sum|difference|value|rate|change|input|output|average|state|find|show|prove|calculate|determine|evaluate|solve|check|verify|logic|explanation|reason|key|concept|step|example)';
    
    // A math word is a standard function, a variable of 1-2 letters not in the englishWords list, or digits.
    const mathWord = `(?:\\b(?:sin|cos|tan|log|ln|lim|pi|theta|alpha|beta|gamma|delta|phi|psi|omega|lambda|sigma|mu|nu|zeta|eta|iota|kappa|tau|upsilon|xi|chi|rho)\\b|(?<![a-zA-Z])(?!${englishWords}(?![a-zA-Z]))[a-zA-Z]{1,2}(?![a-zA-Z])|\\d+)`;
    const opPattern = `\\s*[()+\\-*\\/^=<>\'_\\-{}#]\\s*`;
    const commandPattern = `\\s*\\\\[a-zA-Z]+\\s*`;

    const mathToken = `(?:${mathWord}|${opPattern}|${commandPattern})`;

    const mathPattern = `(?<![\\w$])(?:${mathToken})*\\^(?:${mathToken})*(?![\\w$])`;
    const subscriptPattern = `(?<![\\w$])(?:${mathToken})*_(?:${mathToken})*(?![\\w$])`;
    const equationPattern = `(?<![\\w$])(?:${mathToken})*=(?:${mathToken})*(?![\\w$])`;
    const latexPattern = `(?<![\\w$])(?:${mathToken})*(?:\\\\frac|\\\\lim|\\\\to|\\\\sum|\\\\int)(?:${mathToken})*(?![\\w$])`;
    const functionPattern = `(?<![\\w$])[a-zA-Z]'?\\(x\\)(?![\\w$])`;

    const combinedRegex = new RegExp(`${mathPattern}|${subscriptPattern}|${equationPattern}|${latexPattern}|${functionPattern}`, "gi");

    segment = segment.replace(combinedRegex, (match) => {
      return ` $${match.trim()}$ `;
    });

    parts[i] = segment;
  }

  // Re-assemble
  formatted = parts.join("$");

  return formatted
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Ensure links open in new tab
          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
        }}
      >
        {formatMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
