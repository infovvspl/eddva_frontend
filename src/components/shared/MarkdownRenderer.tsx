import React, { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

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
function replaceNewlinesOutsideMath(text: string): string {
  const displayParts = text.split("$$");
  for (let i = 0; i < displayParts.length; i += 2) {
    const inlineParts = displayParts[i].split("$");
    for (let j = 0; j < inlineParts.length; j += 2) {
      const lines = inlineParts[j].split(/\r?\n/);
      let result = "";
      for (let k = 0; k < lines.length; k++) {
        const currentLine = lines[k].trim();
        const nextLine = (lines[k + 1] ?? "").trim();
        
        result += lines[k];
        if (k < lines.length - 1) {
          const endsWithOperator = /[+\-/=,\\&|]$/.test(currentLine);
          const startsWithOperator = /^[+\/=)\]},]/.test(nextLine) || /^-[^ ]/.test(nextLine) || /^\(\d+\)\s*[+\-/=]/.test(nextLine);
          const isContinuation = endsWithOperator || startsWithOperator;
          
          if (isContinuation) {
            result += " ";
          } else {
            result += "\n\n";
          }
        }
      }
      inlineParts[j] = result;
    }
    displayParts[i] = inlineParts.join("$");
  }
  return displayParts.join("$$");
}

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
    .replace(/\\n(?![a-zA-Z])/g, "\n");

  // Split single $ blocks that span across newlines so they render correctly
  formatted = formatted.replace(/(?<!\$)\$([^$]+)\$(?!\$)/g, (match, p1) => {
    if (!p1.includes("\n")) return match;
    return p1.split(/\r?\n/).map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      const hasWordSpaces = /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/.test(trimmed);
      if (hasWordSpaces) return line;
      return `$${trimmed}$`;
    }).join("\n");
  });

  // Move exam/year into a dedicated badge marker. Accept common AI variants
  // while ensuring the year is not repeated in the visible question text.
  const examYearPattern = String.raw`(?:CBSE(?:\s+Class\s+\d+)?\s+\d{4}|CLASS\s+\d+\s+\d{4}|NEET(?:\s+UG)?\s+\d{4}|JEE(?:\s+(?:Main|Advanced))?\s+\d{4})`;
  formatted = formatted.replace(
    new RegExp(String.raw`(?:\r?\n|^)\s*(?:Q\s*)?(\d+)[.)]\s*(?:\*\*)?(?:\[|\()?\s*(${examYearPattern})\s*(?:\]|\))?(?:\*\*)?[ \t]*[:.\u2014\u2013-]?[ \t]*`, "gi"),
    (_match, num, tag) => `\n${num}. [EXAMTAG: ${tag}] `,
  );
  formatted = formatted.replace(
    new RegExp(String.raw`(?:\r?\n|^)\s*(?:Q\s*)?(\d+)[.)]\s*(.*?)(?:\[|\()\s*(${examYearPattern})\s*(?:\]|\))[ \t]*(?=\r?\n|$)`, "gi"),
    (_match, num, question, tag) => `\n${num}. [EXAMTAG: ${tag}] ${String(question).trim()}`,
  );
  formatted = formatted.replace(
    /^(\s*\d+\.\s*\[EXAMTAG:\s*([^\]]+)\]\s*)(.*)$/gim,
    (_match, prefix, tag, question) => {
      const escapedTag = String(tag).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicateTag = new RegExp(String.raw`\s*(?:\*\*)?(?:\[|\()?\s*${escapedTag}\s*(?:\]|\))?(?:\*\*)?\s*[:.\u2014\u2013-]?\s*`, "gi");
      return `${prefix}${String(question).replace(duplicateTag, " ").trim()}`;
    },
  );

  // If there's a newline after normalized EXAMTAG or question number, followed by the question text (not options/headers/bullet points), pull it to the same line
  const pullRegex = new RegExp(String.raw`(\d+[.)](?:\s*\[\s*EXAMTAG:\s*[^\]]+\s*\])?)\s*(?:\r?\n)+\s*(?!(?:[A-D][.):]\s*|\([A-D]\)\s*|\d+[.)]\s*|Q\d+\b|#{1,6}\s|[-*+]\s))`, "gi");
  formatted = formatted.replace(pullRegex, "$1 ");


  // Merge stacked option letters with their contents (e.g. A.\n0 -> A. 0)
  formatted = formatted.replace(
    /(?:\r?\n|^)\s*\b([A-D])\b[ \t.:\)]*\r?\n[ \t]*(?![A-D]\b|(?:Q\s*)?\d+[.)]\s|#{1,6}\s)([^\n]+)/gi,
    '\n$1. $2',
  );

  // Split inline options onto newlines (e.g. A. Opt1 B. Opt2 -> A. Opt1 \n B. Opt2)
  formatted = formatted.replace(/(?:\s+|\b)A[\s.:\)]+(.*?)\s+B[\s.:\)]+(.*?)\s+C[\s.:\)]+(.*?)\s+D[\s.:\)]+([^\n]*)/gi, '\n\nA. $1\n\nB. $2\n\nC. $3\n\nD. $4');

  // Split inline Q&A onto newlines
  formatted = formatted.replace(/(\*\*Q\d+\..*?\*\*)\s*(\*\*A\..*?)/gi, '$1\n\n$2');
  formatted = formatted.replace(/(Q\d+\..*?)\r?\n(A\..*?)/gi, '$1\n\n$2');

  formatted = replaceNewlinesOutsideMath(formatted);

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
    .replace(/(\(\d\)\s*(?=[a-zA-Z])[a-zA-Z][a-zA-Z\s/-]*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    // Legacy sub-headers
    .replace(/(?:\r?\n|^)(\s*(?:[-*+]\s+)?(?:\*\*|__)?)(Reason\s*[:\u2014\u2013\u002D.]?|Explanation\s*[:\u2014\u2013\u002D.]?|Logic\s*[:\u2014\u2013\u002D.]?|Key\s*Concept\s*[:\u2014\u2013\u002D.]?|Verification\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1$2");

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

    const mathPattern = `(?<![\\w$])(?:${mathToken}){0,10}\\^(?:${mathToken}){0,10}(?![\\w$])`;
    const subscriptPattern = `(?<![\\w$])(?:${mathToken}){0,10}_(?:${mathToken}){0,10}(?![\\w$])`;
    const equationPattern = `(?<![\\w$])(?:${mathToken}){0,10}=(?:${mathToken}){0,10}(?![\\w$])`;
    const latexPattern = `(?<![\\w$])(?:${mathToken}){0,10}(?:${commandPattern})(?:${mathToken}){0,10}(?![\\w$])`;
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

const getTextContent = (children: any): string => {
  return React.Children.toArray(children)
    .map((child: any) => {
      if (typeof child === 'string') return child;
      if (child && typeof child === 'object' && child.props && child.props.children) {
        return getTextContent(child.props.children);
      }
      return '';
    })
    .join('');
};

const modifyChildrenToRemoveTag = (children: any, tagLength: number): any => {
  if (tagLength <= 0) return children;
  const arr = React.Children.toArray(children);
  if (arr.length === 0) return children;
  
  const first = arr[0];
  if (typeof first === 'string') {
    arr[0] = first.substring(tagLength).trim();
  } else if (first && typeof first === 'object' && 'props' in first) {
    const element = first as React.ReactElement;
    if (element.props.children) {
      arr[0] = React.cloneElement(element, {
        children: modifyChildrenToRemoveTag(element.props.children, tagLength)
      });
    }
  }
  return arr;
};

const removeExamTagFromChildren = (children: any): any => {
  let removed = false;
  const recurse = (node: any): any => {
    if (removed) return node;
    if (typeof node === 'string') {
      if (node.includes('[EXAMTAG:')) {
        removed = true;
        return node.replace(/\[EXAMTAG:\s*[^\]]+\]\s*/gi, '').trim();
      }
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(child => recurse(child));
    }
    if (node && typeof node === 'object' && node.props) {
      if (node.props.children) {
        return React.cloneElement(node, {
          children: recurse(node.props.children)
        });
      }
    }
    return node;
  };
  return recurse(children);
};

const removePatternFromChildren = (children: any, patternText: string): any => {
  if (!patternText) return children;
  let removed = false;
  const recurse = (node: any): any => {
    if (removed) return node;
    if (typeof node === 'string') {
      if (node.includes(patternText)) {
        removed = true;
        return node.replace(patternText, '').trim();
      }
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(child => recurse(child));
    }
    if (node && typeof node === 'object' && node.props) {
      if (node.props.children) {
        return React.cloneElement(node, {
          children: recurse(node.props.children)
        });
      }
    }
    return node;
  };
  return recurse(children);
};

function formatExamTag(tagStr: string): string {
  let t = tagStr.trim().replace(/[:.-]+$/, '').trim();
  if (/^CLASS\s+(\d+)\s+(\d{4}(?:\s*,\s*\d{4})*)$/i.test(t)) {
    t = t.replace(/^CLASS\s+(\d+)\s+(\d{4}(?:\s*,\s*\d{4})*)$/i, 'CBSE Class $1 $2');
  }
  if (/^CBSE\s+(\d{4}(?:\s*,\s*\d{4})*)$/i.test(t)) {
    const isClass12 = window.location.href.toLowerCase().includes("class-12") || window.location.href.toLowerCase().includes("class12") || document.title.toLowerCase().includes("class 12");
    const classStr = isClass12 ? "Class 12" : "Class 10";
    t = t.replace(/^CBSE/i, `CBSE ${classStr}`);
  }
  return t.toUpperCase();
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
          img: ({ node, alt, src }) => <NoteImage src={src} alt={alt} />,
          li: ({ node, children, ...props }) => {
            const textContent = getTextContent(children);
            
            let tag = "";
            let tagLengthToRemove = 0;
            let shouldRemovePattern = false;
            let patternTextToReplace = "";

            const startTagMatch = textContent.match(/^\s*\[EXAMTAG:\s*([^\]]+)\]\s*/i);
            if (startTagMatch) {
              tag = startTagMatch[1];
              tagLengthToRemove = startTagMatch[0].length;
            } else {
              const patternTagMatch = textContent.match(/(?:\r?\n|^|\s+)\(?(?:Pattern|Exam):\s*(CBSE(?:\s+Class\s+\d+)?\s+\d{4}|CLASS\s+\d+\s+\d{4}|NEET\s+\d{4}|JEE(?:\s+(?:Main|Advanced))?\s+\d{4}(?:\s+[a-zA-Z0-9]+)?|[^\n\)]+)\)?\s*$/i);
              if (patternTagMatch) {
                tag = patternTagMatch[1];
                shouldRemovePattern = true;
                patternTextToReplace = patternTagMatch[0];
              }
            }

            let finalChildren = children;
            if (tagLengthToRemove > 0) {
              finalChildren = removeExamTagFromChildren(children);
            } else if (shouldRemovePattern && patternTextToReplace) {
              finalChildren = removePatternFromChildren(children, patternTextToReplace);
            }

            if (tag) {
              const formattedTag = formatExamTag(tag);
              return (
                <li {...props} className="relative group py-3 pr-28 pl-2 border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 rounded-xl transition-colors">
                  <div className="flex-1 text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                    {finalChildren}
                  </div>
                  <span className="absolute right-2 top-3 select-none text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/30 px-2 py-0.5 rounded-lg font-mono">
                    {formattedTag}
                  </span>
                </li>
              );
            }

            return <li {...props} className="py-1">{children}</li>;
          },
          p: ({ node, children, ...props }) => {
            const text = getTextContent(children);
            
            const optionMatch = text.match(/^\s*\(?\b([A-D])\b\)?[\s.:]+(.*)/i);
            if (optionMatch) {
              const label = optionMatch[1].toUpperCase();
              const restChildren = modifyChildrenToRemoveTag(children, optionMatch[0].length - optionMatch[2].length);
              return (
                <div className="my-2.5 flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/10 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-slate-200 dark:hover:bg-slate-900/30 dark:hover:border-slate-700/60 transition-all select-none shadow-sm/5">
                  <span className="w-7 h-7 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-violet-200/30">
                    {label}
                  </span>
                  <span className="flex-1 leading-relaxed">{restChildren}</span>
                </div>
              );
            }

            const faqAnswerMatch = text.match(/^\s*\bA\b[\s.:]+(.*)/i);
            if (faqAnswerMatch) {
              const restChildren = modifyChildrenToRemoveTag(children, faqAnswerMatch[0].length - faqAnswerMatch[1].length);
              return (
                <div className="my-2.5 flex items-start gap-3.5 rounded-2xl border border-emerald-100/60 dark:border-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50/40 hover:border-emerald-200/60 transition-all select-none">
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-emerald-200/30">
                    ANS
                  </span>
                  <span className="flex-1 leading-relaxed text-slate-600 dark:text-slate-400">{restChildren}</span>
                </div>
              );
            }

            const faqQuestionMatch = text.match(/^\s*\bQ\d+\b[\s.:]+(.*)/i);
            if (faqQuestionMatch) {
              const label = text.match(/^\s*\b(Q\d+)\b/i)?.[1].toUpperCase() || "Q";
              const rawChildren = modifyChildrenToRemoveTag(children, text.match(/^\s*\bQ\d+\b[\s.:]+/i)?.[0].length || 0);

              let tag = "";
              let tagLengthToRemove = 0;
              let shouldRemovePattern = false;
              let patternTextToReplace = "";

              const plainTextContent = getTextContent(rawChildren);
              const startTagMatch = plainTextContent.match(/^\s*\[EXAMTAG:\s*([^\]]+)\]\s*/i);
              if (startTagMatch) {
                tag = startTagMatch[1];
                tagLengthToRemove = startTagMatch[0].length;
              } else {
                const patternTagMatch = plainTextContent.match(/(?:\r?\n|^|\s+)\(?(?:Pattern|Exam):\s*(CBSE(?:\s+Class\s+\d+)?\s+\d{4}|CLASS\s+\d+\s+\d{4}|NEET\s+\d{4}|JEE(?:\s+(?:Main|Advanced))?\s+\d{4}(?:\s+[a-zA-Z0-9]+)?|[^\n\)]+)\)?\s*$/i);
                if (patternTagMatch) {
                  tag = patternTagMatch[1];
                  shouldRemovePattern = true;
                  patternTextToReplace = patternTagMatch[0];
                }
              }

              let finalChildren = rawChildren;
              if (tagLengthToRemove > 0) {
                finalChildren = removeExamTagFromChildren(rawChildren);
              } else if (shouldRemovePattern && patternTextToReplace) {
                finalChildren = removePatternFromChildren(rawChildren, patternTextToReplace);
              }

              const formattedTag = tag ? formatExamTag(tag) : "";

              return (
                <div className="relative group my-3 flex items-start gap-3.5 rounded-2xl border border-sky-100/60 dark:border-sky-950/20 bg-sky-50/20 dark:bg-sky-950/5 px-4 py-3 pr-28 text-sm font-black text-slate-800 dark:text-slate-200 hover:bg-sky-50/40 hover:border-sky-200/60 transition-all select-none">
                  <span className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-sky-200/30">
                    {label}
                  </span>
                  <span className="flex-1 leading-relaxed">{finalChildren}</span>
                  {formattedTag && (
                    <span className="absolute right-2.5 top-3 select-none text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/30 px-2 py-0.5 rounded-lg font-mono">
                      {formattedTag}
                    </span>
                  )}
                </div>
              );
            }

            return <p {...props} className="my-2">{children}</p>;
          }
        }}
      >
        {formatMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
