import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

type FitMode = "contain" | "cover" | "full";

function NoteImage({ src, alt }: { src?: string; alt?: string }) {
  const [fit, setFit] = useState<FitMode>("contain");
  const [lightbox, setLightbox] = useState(false);
  const [hidden, setHidden] = useState(false);

  const closeLightbox = useCallback(() => setLightbox(false), []);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  if (hidden || !src) return null;

  const heightClass = fit === "full" ? "" : fit === "contain" ? "max-h-72" : "max-h-60";
  const objectClass = fit === "cover" ? "object-cover" : fit === "contain" ? "object-contain" : "object-contain";
  const bgClass = fit === "contain" ? "bg-slate-100" : "bg-transparent";

  return (
    <>
      <figure className="not-prose group relative my-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
        {/* Toolbar — visible on hover */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
          {(["contain", "cover", "full"] as FitMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              title={mode === "contain" ? "Fit (no crop)" : mode === "cover" ? "Fill (crop)" : "Full size"}
              onClick={() => setFit(mode)}
              className={cn(
                "rounded-lg px-2 py-1 text-[10px] font-bold transition",
                fit === mode
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {mode === "contain" ? "Fit" : mode === "cover" ? "Fill" : "Full"}
            </button>
          ))}
          {/* Expand to fullscreen */}
          <button
            type="button"
            title="View fullscreen"
            onClick={() => setLightbox(true)}
            className="rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition"
          >
            ⛶
          </button>
        </div>

        <div className={cn("w-full flex items-center justify-center transition-all", bgClass, fit !== "full" && heightClass)}>
          <img
            src={src}
            alt={alt || ""}
            className={cn("w-full transition-all", heightClass, objectClass)}
            loading="lazy"
            onError={() => setHidden(true)}
          />
        </div>

        {alt && alt.trim() && (
          <figcaption className="flex items-start gap-2 border-t border-slate-100 px-4 py-2.5 text-xs font-medium leading-relaxed text-slate-500">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            {alt}
          </figcaption>
        )}
      </figure>

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-h-full max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg text-sm font-bold hover:bg-slate-100"
            >
              ✕
            </button>
            <img
              src={src}
              alt={alt || ""}
              className="max-h-[90vh] w-full rounded-2xl object-contain shadow-2xl"
            />
            {alt && alt.trim() && (
              <p className="mt-3 text-center text-sm text-white/70">{alt}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

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
    .replace(/\\n(?![a-zA-Z])/g, "\n")
    .replace(/\r?\n/g, "\n\n");

  const mathCommandPattern = String.raw`(?:\\(?:frac|sqrt|int|sum|lim|sin|cos|tan|theta|alpha|beta|gamma|delta|pi|phi|psi|omega|lambda|sigma|mu|nu|zeta|eta|iota|kappa|tau|upsilon|xi|chi|rho)|\\frac|\\sqrt|√)`;
  const normalizeMathLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes("$") || !new RegExp(mathCommandPattern).test(trimmed)) return line;
    const prefix = line.match(/^\s*(?:\d+[\).]\s*|[-*]\s*)?/)?.[0] ?? "";
    const body = line.slice(prefix.length).trim();
    if (!/[=+\-*/^_{}\\√]/.test(body)) return line;
    const sentenceLike = /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(body.replace(/\\[A-Za-z]+/g, ""));
    const standaloneMath =
      /^[a-zA-Z]\s*=/.test(body) ||
      /^(?:\\(?:frac|sqrt)|√|\d+\s*[+\-*/=]|\(?\s*[a-zA-Z0-9]+\s*[+\-*/=])/.test(body);
    if (sentenceLike && !standaloneMath) return line;
    return `${prefix}$${body}$`;
  };

  formatted = formatted
    .split("\n")
    .map(normalizeMathLine)
    .join("\n");

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
    .replace(/(^|[^A-Za-z\\])(rac|frac|sqrt|int|sum|lim|sin|cos|tan|theta|alpha|beta|gamma|delta|pi|phi|psi|omega|lambda|sigma|mu|nu|zeta|eta|iota|kappa|tau|upsilon|xi|chi|rho)\{/g, (_m, prefix, command) => `${prefix}\\${command === "rac" ? "frac" : command}{`)
    .replace(/(^|[^A-Za-z\\])(int_|sum_|lim_)/g, "$1\\$2")
    .replace(/√\s*\{([^{}]+)\}/g, "\\sqrt{$1}")
    .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}")
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
  // 4. simple term / simple term (to catch dy/dx, 1/2, x^2/y^2, p^2/q^2 safely)
  // base variable length is limited to 1-3 characters to prevent matching URLs/paths.
  formatted = formatted.replace(/(?<![\w$])([a-zA-Z0-9]{1,3}(?:\^[{a-zA-Z0-9}-]+|_[{a-zA-Z0-9}-]+)?)\s*\/([ \t]*)([a-zA-Z0-9]{1,3}(?:\^[{a-zA-Z0-9}-]+|_[{a-zA-Z0-9}-]+)?)(?![\w$])/g, (match, num, space, den) => {
    return `\\frac{${num}}{${den.trim()}}`;
  });

  // 7. Split by $ to protect already-formatted math blocks
  const parts = formatted.split("$");
  for (let i = 0; i < parts.length; i += 2) {
    let segment = parts[i];

    const englishWords = '(?:is|as|if|of|to|by|we|do|in|on|an|the|and|or|for|but|yet|so|at|then|with|from|into|over|under|above|below|between|among|through|during|before|after|against|about|like|throughout|upon|within|without|since|until|here|there|when|where|why|how|all|any|both|each|few|more|most|some|such|no|nor|not|only|own|same|than|too|very|can|will|should|would|could|may|might|must|shall|derivative|limit|function|chapter|topic|question|answer|solution|rule|power|quotient|product|sum|difference|value|rate|change|input|output|average|state|find|show|prove|calculate|determine|evaluate|solve|check|verify|logic|explanation|reason|key|concept|step|example)';
    
    // A math word is a standard function, a variable of 1-2 letters not in the englishWords list, or digits.
    const mathWord = `(?:\\b(?:sin|cos|tan|log|ln|lim|pi|theta|alpha|beta|gamma|delta|phi|psi|omega|lambda|sigma|mu|nu|zeta|eta|iota|kappa|tau|upsilon|xi|chi|rho)\\b|(?<![a-zA-Z])(?!${englishWords}(?![a-zA-Z]))[a-zA-Z]{1,2}(?![a-zA-Z])|\\d+)`;
    const opPattern = `[ \\t]*[()+\\-*\\/^=<>\'_\\-{}#][ \\t]*`;
    const commandPattern = `[ \\t]*\\\\[a-zA-Z]+[ \\t]*`;

    const mathToken = `(?:${mathWord}|${opPattern}|${commandPattern})`;

    const mathPattern = `(?<![\\w$])(?:${mathToken})*\\^(?:${mathToken})*(?![\\w$])`;
    const subscriptPattern = `(?<![\\w$])(?:${mathToken})*_(?:${mathToken})*(?![\\w$])`;
    const equationPattern = `(?<![\\w$])(?:${mathToken})*=(?:${mathToken})*(?![\\w$])`;
    const latexPattern = `(?<![\\w$])(?:${mathToken})*(?:${commandPattern})(?:${mathToken})*(?![\\w$])`;
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
          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
          img: ({ node, alt, src }) => <NoteImage src={src} alt={alt} />,
        }}
      >
        {formatMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
