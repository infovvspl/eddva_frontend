import React, { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

type FitMode = "contain" | "cover" | "full";

const _OVERLAY_MARKER_RE = / ?<<NOTE_IMAGE_OVERLAY:[^>]*>>/g;

function NoteImage({ src, alt }: { src?: string; alt?: string }) {
  const [fit, setFit] = useState<FitMode>("contain");
  const [lightbox, setLightbox] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Reset hidden when src changes (e.g. imageMap loads and replaces r2 URL with data URI)
  useEffect(() => { setHidden(false); }, [src]);

  const displayAlt = alt?.replace(_OVERLAY_MARKER_RE, "").trim();

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
            alt={displayAlt || ""}
            className={cn("w-full transition-all", heightClass, objectClass)}
            loading="lazy"
            onError={() => setHidden(true)}
          />
        </div>

        {displayAlt && (
          <figcaption className="flex items-start gap-2 border-t border-slate-100 px-4 py-2.5 text-xs font-medium leading-relaxed text-slate-500">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            {displayAlt}
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
              alt={displayAlt || ""}
              className="max-h-[90vh] w-full rounded-2xl object-contain shadow-2xl"
            />
            {displayAlt && (
              <p className="mt-3 text-center text-sm text-white/70">{displayAlt}</p>
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
  /** Map of public S3/R2 URLs → base64 data URIs. Used when the bucket lacks CORS headers. */
  imageMap?: Record<string, string>;
  highlights?: Array<{ text: string; color: string }>;
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
          // Don't insert double-newlines after lone question numbers (e.g. "1." or "Q1.") or option tags
          const isLoneNumberOrMarker = /^(?:Q\s*)?\d{1,3}[.)]\s*$/i.test(currentLine) || /^\([a-zA-Z0-9]{1,3}\)\s*$/.test(currentLine) || /^[-*+]\s*$/.test(currentLine);
          
          // Check if current or next line is a bullet/numbered list item
          const isListItem = /^[-*+]\s+/.test(currentLine) || /^\d+[.)]\s+/.test(currentLine);
          const nextIsListItem = /^[-*+]\s+/.test(nextLine) || /^\d+[.)]\s+/.test(nextLine);

          const isContinuation = endsWithOperator || startsWithOperator || isLoneNumberOrMarker;
          
          if (isContinuation) {
            result += " ";
          } else if (isListItem || nextIsListItem) {
            // Keep single newline between list items so Markdown list parser functions naturally
            result += "\n";
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

function normalizeBrokenMathText(text: string): string {
  return text
    // Adjacent inline-code math spans can arrive as `formula``next formula`.
    // Add a real separator before removing math-only backticks.
    .replace(/([A-Za-z0-9_{}^)\]])``(?=[A-Za-z])/g, "$1`\n\n`")
    // Some transcripts/LLM outputs split a fraction-like expression as:
    // S = k \ 
    // P
    // KaTeX treats the lone backslash as an invalid command, so convert it to division.
    .replace(/([A-Za-z0-9_{}^)\]])[ \t]*\\[ \t\r\n]+([A-Za-z0-9_{}^(])/g, "$1/$2")
    // Also handle the same artifact when the backslash was already collapsed onto one line.
    .replace(/([A-Za-z0-9_{}^)\]])\s+\\\s+([A-Za-z0-9_{}^(])/g, "$1/$2")
    // A common bad transcript form for multiplication is "\ *".
    .replace(/\\\s*\*\s*/g, "\\cdot ")
    // Raw generated equations often use programming multiplication. KaTeX accepts \cdot more reliably.
    .replace(/([A-Za-z0-9_{}^)\]])\s*\*\s*([A-Za-z0-9_{}^(])/g, "$1 \\cdot $2");
}

function unwrapMathCodeSpans(text: string): string {
  return text.replace(/(`+)([\s\S]*?)\1/g, (match, _ticks, inner) => {
    const isLikelyCode = /\b(?:const|let|var|function|return|import|export|class|interface|type)\b/.test(inner);
    const isLikelyMath =
      /(?:^|[\s(])[A-Za-z]{1,3}\s*=/.test(inner) ||
      /[A-Za-z]{1,4}_[A-Za-z0-9]{1,4}/.test(inner) ||
      /[A-Za-z0-9_{}^)\]][ \t]*\\[ \t\r\n]+[A-Za-z0-9_{}^(]/.test(inner) ||
      /\\(?:frac|sqrt|cdot|times|theta|alpha|beta|gamma|delta|pi)\b/.test(inner);

    return isLikelyMath && !isLikelyCode ? inner : match;
  });
}

function wrapStandaloneSubscriptVariables(text: string): string {
  return text
    .split("$")
    .map((segment, index) => {
      if (index % 2 === 1) return segment;
      return segment.replace(
        /(^|[^A-Za-z0-9$\\])([A-Za-z]{1,3}_[A-Za-z0-9]{1,3})(?![A-Za-z0-9$])/g,
        "$1$$$2$",
      );
    })
    .join("$");
}

function wrapFullEquationLines(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.includes("$")) return line;
      if (!/[=]/.test(trimmed)) return line;
      if (!/^[A-Za-z0-9_{}^()[\].=+\-*/\\\s]+$/.test(trimmed)) return line;

      const startsLikeEquation = /^[A-Za-z]{1,4}(?:_[A-Za-z0-9]{1,4})?\s*=/.test(trimmed);
      const hasRepeatedEquals = (trimmed.match(/=/g) ?? []).length >= 2;
      const hasMathOperator = /(?:\\cdot|[+\-*/^_])/.test(trimmed);
      if (!startsLikeEquation || (!hasRepeatedEquals && !hasMathOperator)) return line;

      const prefix = line.match(/^\s*/)?.[0] ?? "";
      const suffix = line.match(/\s*$/)?.[0] ?? "";
      return `${prefix}$${trimmed}$${suffix}`;
    })
    .join("\n");
}


/** Skip past a {…} group, tracking nested brace depth. Returns index after closing }. */
function _skipBraceGroup(s: string, start: number): number {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { if (--depth === 0) return i + 1; }
  }
  return s.length;
}

/** Returns index of the matching ')' for '(' at open, or -1 if not found. */
function _matchingParen(s: string, open: number): number {
  let d = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') d++;
    else if (s[i] === ')') { if (--d === 0) return i; }
  }
  return -1;
}

const _MATH_CMDS = new Set([
  'text','frac','sqrt','rightarrow','leftarrow','to','pm','cdot','times',
  'div','overrightarrow','vec','hat','bar','tilde','sum','int','prod',
  'lim','sin','cos','tan','log','ln','alpha','beta','gamma','delta',
  'theta','lambda','pi','sigma','mu','omega','nu','phi','psi','chi','rho',
]);
const _STRONG_MATH = new Set(['rightarrow','leftarrow','frac','sqrt','to','overrightarrow','sum','int']);

/**
 * Character-level scanner that collects compound, un-delimited LaTeX expressions
 * and wraps them in $…$.
 *
 * Handles:
 *  - Nested braces: \text{\frac{Energy}{ATP}}
 *  - \command{} immediately followed (no operator) by (C_{6}H_{12}O_{6})
 *  - Chains connected by +, -, =, or \rightarrow
 */
function _collectCompoundLatex(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    // Only start collecting at a recognized LaTeX command
    if (text[i] !== '\\' || i + 1 >= text.length || !/[A-Za-z]/.test(text[i + 1])) {
      result += text[i++];
      continue;
    }

    // Parse command name
    let ce = i + 1;
    while (ce < text.length && /[A-Za-z]/.test(text[ce])) ce++;
    const cmd = text.slice(i + 1, ce);

    if (!_MATH_CMDS.has(cmd)) {
      result += text[i++];
      continue;
    }

    // Try to collect a compound expression starting at i
    const exprStart = i;
    let j = i;
    let isMath = _STRONG_MATH.has(cmd);

    /* eslint-disable no-constant-condition */
    outer: for (;;) {
      // 1. Consume \command and its brace-argument groups (with full depth tracking)
      if (text[j] === '\\' && j + 1 < text.length && /[A-Za-z]/.test(text[j + 1])) {
        let k = j + 1;
        while (k < text.length && /[A-Za-z]/.test(text[k])) k++;
        const c = text.slice(j + 1, k);
        j = k;
        if (_STRONG_MATH.has(c)) isMath = true;
        // Consume any following {arg} groups, including nested ones
        while (j < text.length && text[j] === '{') j = _skipBraceGroup(text, j);
        continue;
      }

      // 2. Subscript / superscript (_ or ^)
      if ((text[j] === '_' || text[j] === '^') && j + 1 < text.length) {
        isMath = true;
        j++;
        if (j < text.length && text[j] === '{') j = _skipBraceGroup(text, j);
        else j++;
        continue;
      }

      // 3. Parenthesized molecular formula directly following a command: (C_{6}H_{12}O_{6})
      //    Only include if the parens contain subscripts, confirming it's math.
      if (text[j] === '(' && j > exprStart) {
        const close = _matchingParen(text, j);
        if (close > j && /[_^]\{/.test(text.slice(j, close + 1))) {
          isMath = true;
          j = close + 1;
          continue;
        }
        break outer;
      }

      // 4. Plain letter immediately before a subscript (e.g. H in H_{12}, O in O_{6})
      if (/[A-Za-z]/.test(text[j]) && j > exprStart) {
        const n1 = text[j + 1] ?? '';
        if (n1 === '_' || n1 === '^') { j++; continue; }
        // Two-letter element symbol: look two chars ahead
        if (/[A-Za-z]/.test(n1) && (text[j + 2] === '_' || text[j + 2] === '^')) { j++; continue; }
        break outer;
      }

      // 5. Operator (+, -, =) connecting to another LaTeX term
      if ((text[j] === '+' || text[j] === '-' || text[j] === '=') && j > exprStart) {
        let k = j + 1;
        while (k < text.length && /[ \t]/.test(text[k])) k++;
        const peek = text[k] ?? '';
        if (peek === '\\' || (peek === '(' && /[_^]\{/.test(text.slice(k)))) {
          j = k; continue;
        }
        break outer;
      }

      // 6. Whitespace between LaTeX tokens
      if (/[ \t]/.test(text[j]) && j > exprStart) {
        let k = j;
        while (k < text.length && /[ \t]/.test(text[k])) k++;
        const peek = text[k] ?? '';
        if (peek === '\\' || peek === '+' || peek === '-') { j = k; continue; }
        break outer;
      }

      break outer;
    }
    /* eslint-enable no-constant-condition */

    const expr = text.slice(exprStart, j).trim();
    if (isMath && expr.length > 2) {
      result += `$${expr}$`;
      i = j;
    } else {
      result += text[i++];
    }
  }

  return result;
}

/**
 * Wraps compound, un-delimited LaTeX expressions that span across operators
 * (+, -, \rightarrow, =, etc.) and multiple \command{...} groups.
 * Uses _collectCompoundLatex (character-level, brace-depth-aware) so nested
 * braces like \text{\frac{Energy}{ATP}} are handled correctly.
 */
function wrapCompoundLatexExpressions(text: string): string {
  return text
    .split("$")
    .map((segment, index) => {
      if (index % 2 !== 0) return segment; // inside $…$, skip
      return _collectCompoundLatex(segment);
    })
    .join("$");
}

/** Wrap structured, un-delimited LaTeX commands found inside prose. */


function wrapStructuredLatex(text: string): string {
  let result = "";
  let position = 0;

  while (position < text.length) {
    const relativeStart = text.slice(position).search(/\\[A-Za-z]+/);
    if (relativeStart < 0) return result + text.slice(position);

    const start = position + relativeStart;
    result += text.slice(position, start);
    let cursor = start + text.slice(start).match(/^\\[A-Za-z]+/)![0].length;
    let end = cursor;
    let hasStructure = false;

    const consumeGroup = (at: number): number => {
      if (text[at] !== "{") return at;
      let depth = 0;
      for (let i = at; i < text.length; i++) {
        if (/\r|\n/.test(text[i])) return at;
        if (text[i] === "{" && text[i - 1] !== "\\") depth++;
        if (text[i] === "}" && text[i - 1] !== "\\") {
          depth--;
          if (depth === 0) return i + 1;
        }
      }
      return at;
    };

    while (cursor < text.length) {
      const whitespaceStart = cursor;
      while (cursor < text.length && /[ \t]/.test(text[cursor])) cursor++;

      if (text[cursor] === "{") {
        const groupEnd = consumeGroup(cursor);
        if (groupEnd === cursor) break;
        cursor = groupEnd;
        end = cursor;
        hasStructure = true;
        continue;
      }

      if (text[cursor] === "_" || text[cursor] === "^") {
        cursor++;
        while (cursor < text.length && /[ \t]/.test(text[cursor])) cursor++;
        const groupEnd = consumeGroup(cursor);
        cursor = groupEnd > cursor ? groupEnd : Math.min(cursor + 1, text.length);
        end = cursor;
        hasStructure = true;
        continue;
      }

      cursor = whitespaceStart;
      break;
    }

    if (hasStructure) {
      result += `$${text.slice(start, end)}$`;
      position = end;
    } else {
      result += text.slice(start, cursor);
      position = cursor;
    }
  }

  return result;
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

  // Remove redundant caption/figure lines that follow right after an image tag.
  // e.g. ![caption](url)\n*caption* or ![caption](url)\n*Figure: caption*
  formatted = formatted.replace(
    /(!\[([^\]]+?)\]\([^\)]+?\))[\s\r\n]*\*+(?:Figure:\s*)?([^\n*]+?)\*+/gi,
    (match, imgTag, altText, italicText) => {
      const cleanAlt = altText.split("<<NOTE_IMAGE_OVERLAY")[0].trim().toLowerCase();
      const cleanItalic = italicText.trim().toLowerCase();
      if (cleanAlt === cleanItalic || cleanAlt.includes(cleanItalic) || cleanItalic.includes(cleanAlt)) {
        return imgTag;
      }
      return match;
    }
  );

  formatted = normalizeBrokenMathText(formatted);
  formatted = unwrapMathCodeSpans(formatted);
  formatted = wrapFullEquationLines(formatted);

  // Split single $ blocks that span across newlines so they render correctly
  formatted = formatted.replace(/(^|[^$])\$([^$]+)\$(?!\$)/g, (match, prefix, p1) => {
    if (!p1.includes("\n")) return match;
    const transformed = p1.split(/\r?\n/).map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      const hasWordSpaces = /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/.test(trimmed);
      if (hasWordSpaces) return line;
      return `$${trimmed}$`;
    }).join("\n");
    return `${prefix}${transformed}`;
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

  // Merge stacked option letters with their contents (e.g. A.\n0 -> A. 0)
  formatted = formatted.replace(
    /(?:\r?\n|^)\s*\b([A-D])\b[ \t.:\)]*\r?\n[ \t]*(?![A-D]\b|(?:Q\s*)?\d+[.)]\s|#{1,6}\s)([^\n]+)/gi,
    '\n$1. $2',
  );

  // Pull a lone trailing option A off the end of a question line.
  //
  // The rule below only fires when all four options share a line. Models
  // frequently emit just the first one inline and the rest on their own lines:
  //
  //   1. Corrosion happens when metals are exposed to: [p.6] A. Air only
  //   B. Moisture only
  //
  // which left "A. Air only" rendered as part of the question while B, C and D
  // became option cards. Requiring the next line to start with "B." is what
  // distinguishes an option list from prose that merely contains an "A" —
  // "Section A carries 10 marks" and "Vitamin A" are both left alone. The `$`
  // and the lookahead match without consuming, so the newline survives.
  formatted = formatted.replace(
    /^([^\n]*?\S)[ \t]+\bA[.):]\s+([^\n]+)$(?=\n[ \t]*B[.):]\s)/gm,
    '$1\nA. $2',
  );

  // Split inline options onto newlines (e.g. A. Opt1 B. Opt2 -> A. Opt1 \n B. Opt2)
  // Protect "Section A", "Part A", "Group A" and general instructions from being misidentified as options
  formatted = formatted.replace(
    /(?<!\b(?:Section|Part|Group|Class|Grade|Chapter|Unit)\s+)(?:\s+|^)\b([A-D])\s*[:.)]\s+([^A-D\n]+?)\s+\bB\s*[:.)]\s+([^A-D\n]+?)\s+\bC\s*[:.)]\s+([^A-D\n]+?)\s+\bD\s*[:.)]\s+([^\n]+)/gi,
    (match, aLabel, optA, optB, optC, optD) => {
      if (/\b(?:Section|Part|Group|Class|Grade|Chapter|Unit|consists|questions)\b/i.test(match)) {
        return match;
      }
      return `\n\n${aLabel}. ${optA.trim()}\n\nB. ${optB.trim()}\n\nC. ${optC.trim()}\n\nD. ${optD.trim()}`;
    }
  );

  // Split inline Q&A onto newlines
  formatted = formatted.replace(/(\*\*Q\d+\..*?\*\*)\s*(\*\*A\..*?)/gi, '$1\n\n$2');
  formatted = formatted.replace(/(Q\d+\..*?)\r?\n(A\..*?)/gi, '$1\n\n$2');

  formatted = replaceNewlinesOutsideMath(formatted);

  // Pull standalone question numbers onto the same line as question text AFTER newlines normalization
  const pullRegex = /((?:^|\n)\s*(?:Q\s*)?\d{1,3}[.)])\s*(?:\r?\n)+\s*(?!(?:[A-E][.):]\s*|\([A-E]\)\s*|Q?\d{1,3}[.)]\s*|#{1,6}\s|[-*+]\s))/gi;
  formatted = formatted.replace(pullRegex, "$1 ");

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
  // Fix AI OCR / KaTeX mangling of chemical state indicators e.g. \text{\frac{Mg}{s}} -> Mg_{(s)}, \text{\frac{O}{l}} -> H_2O_{(l)}, \text{/(g)} -> (g)
  formatted = formatted
    .replace(/\\text\{\\frac\{([A-Za-z0-9_]+)\}\{([a-z]+)\}\}/g, "$1_{($2)}")
    .replace(/\\text\{([A-Za-z0-9_]+)\}\s*\/([a-z]+)/g, "$1($2)")
    .replace(/\\text\{([A-Za-z0-9_]+)\}\s*\/\s*\(([^)]+)\)/g, "$1($2)")
    .replace(/\\text\{([^}]+)\}/g, "$1");

  // Separate numbered observation headers and headings onto newlines (e.g. Observation:... -> \n\nObservation:...)
  formatted = formatted
    .replace(/([^\n])\s*(Observation\s*[:\u2014\u2013-]?|Balanced Chemical Equation\s*[:\u2014\u2013-]?|\d+[.)]\s*[A-Z])/gi, "$1\n\n$2");

  // Automatically wrap un-delimited chemical reaction equations (containing -> or \rightarrow with + and chemical terms) into KaTeX math blocks
  formatted = formatted.replace(
    /(?<!\$)(?:\b\d+\s*)?[A-Z][a-z]?(?:_\{\d+\}|_\d+|\([a-z]+\)|_\{\([a-z]+\)\})*\s*(?:\+\s*(?:\d+\s*)?[A-Z][a-z]?(?:_\{\d+\}|_\d+|\([a-z]+\)|_\{\([a-z]+\)\})*\s*)*(?:\\rightarrow|->|\u2192)\s*(?:\d+\s*)?[A-Z][a-z]?(?:_\{\d+\}|_\d+|\([a-z]+\)|_\{\([a-z]+\)\})*(?:\s*\+\s*(?:\d+\s*)?[A-Z][a-z]?(?:_\{\d+\}|_\d+|\([a-z]+\)|_\{\([a-z]+\)\})*)*(?!\$)/g,
    (match) => `$${match.trim()}$`
  );

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
  // Protect chemical formulas / state indicators like Mg / (s) from fraction conversion
  formatted = formatted.replace(/(^|[^a-zA-Z0-9_$])([a-zA-Z0-9]{1,3}(?:\^[{a-zA-Z0-9}-]+|_[{a-zA-Z0-9}-]+)?)\s*\/([ \t]*)([a-zA-Z0-9]{1,3}(?:\^[{a-zA-Z0-9}-]+|_[{a-zA-Z0-9}-]+)?)(?![\w$])/g, (match, prefix, num, space, den) => {
    if (/^(?:[a-z]|aq|g|l|s)$/i.test(den.trim())) return match;
    return `${prefix}\\frac{${num}}{${den.trim()}}`;
  });

  // Wrap chemical formulas with dots (e.g. Fe_2O_3 \cdot H_2O or (Fe_2O_3 . H_2O))
  formatted = formatted.replace(
    /(^|[^$A-Za-z0-9\\])(\(?\s*[A-Z][a-z]?(?:_\{\d+\}|_\d+)?(?:[A-Z][a-z]?(?:_\{\d+\}|_\d+)?)*\s*(?:\\[cC]dot|\u22C5|\u2219|\.)\s*(?:\d+)?\s*[A-Z][a-z]?(?:_\{\d+\}|_\d+)?(?:[A-Z][a-z]?(?:_\{\d+\}|_\d+)?)*\s*\)?)(?![^$]*\$)/g,
    "$1$$$2$"
  );

  // Wrap compound un-delimited LaTeX expressions (e.g. chemical equations like
  // \text{Glucose/}(C_{6}H_{12}O_{6})+\text{Oxygen/}(6O_{2})\rightarrow ...)
  // as a single math block before wrapStructuredLatex fragments them.
  formatted = wrapCompoundLatexExpressions(formatted);

  // Wrap any balanced, structured LaTeX command embedded in prose. The generic
  // math detector below cannot reliably consume spaces inside command arguments
  // arguments (for example: "The value of \frac{sin 30°}{cos 60°} is").
  // Splitting on `$` keeps existing inline/display math untouched.
  formatted = formatted
    .split("$")
    .map((segment, index) => index % 2 === 0
      ? wrapStructuredLatex(segment)
      : segment)
    .join("$");

  // 7. Tokenize to protect already-formatted math blocks ($...$ and $$...$$)
  const tokenize = (text: string) => {
    const tokens: { type: "prose" | "math"; text: string }[] = [];
    let lastIndex = 0;
    const mathRegex = /(\$\$(?:[\s\S]*?)\$\$)|(\$(?:[^$]+?)\$)/g;
    let match;
    while ((match = mathRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        tokens.push({ type: "prose", text: text.slice(lastIndex, matchIndex) });
      }
      tokens.push({ type: "math", text: match[0] });
      lastIndex = mathRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      tokens.push({ type: "prose", text: text.slice(lastIndex) });
    }
    return tokens;
  };

  const tokens = tokenize(formatted);

  const englishWords = '(?:is|as|if|of|to|by|we|do|in|on|an|the|and|or|for|but|yet|so|at|then|with|from|into|over|under|above|below|between|among|through|during|before|after|against|about|like|throughout|upon|within|without|since|until|here|there|when|where|why|how|all|any|both|each|few|more|most|some|such|no|nor|not|only|own|same|than|too|very|can|will|should|would|could|may|might|must|shall|derivative|limit|function|chapter|topic|question|answer|solution|rule|power|quotient|product|sum|difference|value|rate|change|input|output|average|state|find|show|prove|calculate|determine|evaluate|solve|check|verify|logic|explanation|reason|key|concept|step|example)';
  const mathWord = `(?:\\b(?:sin|cos|tan|log|ln|lim|pi|theta|alpha|beta|gamma|delta|phi|psi|omega|lambda|sigma|mu|nu|zeta|eta|iota|kappa|tau|upsilon|xi|chi|rho|cdot|times)\\b|\\b(?!${englishWords}\\b)[a-zA-Z]{1,2}\\b|\\d+)`;
  const opPattern = `[ \\t]*[()+\\-*\\/^=<>\'_\\-{}#\\cdot\u22C5\u2219.][ \\t]*`;
  const commandPattern = `[ \\t]*\\\\[a-zA-Z]+[ \\t]*`;

  const mathToken = `(?:${mathWord}|${opPattern}|${commandPattern})`;

  const mathPattern = `(?:^|[^a-zA-Z0-9_$])(?:${mathToken}){0,10}\\^(?:${mathToken}){0,10}(?![\\w$])`;
  const subscriptPattern = `(?:^|[^a-zA-Z0-9_$])(?:${mathToken}){0,10}_(?:${mathToken}){0,10}(?![\\w$])`;
  const equationPattern = `(?:^|[^a-zA-Z0-9_$])(?:${mathToken}){0,10}=(?:${mathToken}){0,10}(?![\\w$])`;
  const latexPattern = `(?:^|[^a-zA-Z0-9_$])(?:${mathToken}){0,10}(?:${commandPattern})(?:${mathToken}){0,10}(?![\\w$])`;
  const functionPattern = `(?:^|[^a-zA-Z0-9_$])[a-zA-Z]'?\\(x\\)(?![\\w$])`;

  const combinedRegex = new RegExp(`${mathPattern}|${subscriptPattern}|${equationPattern}|${latexPattern}|${functionPattern}`, "gi");

  for (const token of tokens) {
    if (token.type === "prose") {
      token.text = token.text.replace(combinedRegex, (match) => {
        const leadChar = /^[^a-zA-Z0-9_\$\\()]/.test(match) ? match[0] : "";
        const body = leadChar ? match.slice(1) : match;
        // Don't double wrap if already contains $
        if (body.includes("$")) return match;
        return `${leadChar} $${body.trim()}$ `;
      });
    }
  }

  formatted = tokens.map((t) => t.text).join("");
  formatted = wrapStandaloneSubscriptVariables(formatted);

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

const highlightChildren = (children: any, highlights: Array<{ text: string; color: string }>): any => {
  if (!highlights || highlights.length === 0) return children;

  const processText = (text: string): React.ReactNode[] => {
    let parts: Array<{ type: 'text' | 'highlight'; content: string; color?: string }> = [{ type: 'text', content: text }];

    for (const h of highlights) {
      if (!h.text) continue;
      const nextParts: typeof parts = [];
      for (const p of parts) {
        if (p.type === 'highlight') {
          nextParts.push(p);
          continue;
        }
        const index = p.content.toLowerCase().indexOf(h.text.toLowerCase());
        if (index >= 0) {
          let currentContent = p.content;
          while (true) {
            const idx = currentContent.toLowerCase().indexOf(h.text.toLowerCase());
            if (idx < 0) {
              if (currentContent) {
                nextParts.push({ type: 'text', content: currentContent });
              }
              break;
            }
            if (idx > 0) {
              nextParts.push({ type: 'text', content: currentContent.slice(0, idx) });
            }
            const matchLen = h.text.length;
            nextParts.push({ type: 'highlight', content: currentContent.slice(idx, idx + matchLen), color: h.color });
            currentContent = currentContent.slice(idx + matchLen);
          }
        } else {
          nextParts.push(p);
        }
      }
      parts = nextParts;
    }

    return parts.map((p, idx) => {
      if (p.type === 'highlight') {
        return (
          <mark
            key={idx}
            data-user-highlight="1"
            style={{ backgroundColor: p.color, padding: '0 1px', borderRadius: '4px' }}
          >
            {p.content}
          </mark>
        );
      }
      return p.content;
    });
  };

  const recurse = (node: any): any => {
    if (typeof node === 'string') {
      return processText(node);
    }
    if (Array.isArray(node)) {
      return node.map((child, idx) => <React.Fragment key={idx}>{recurse(child)}</React.Fragment>);
    }
    if (node && typeof node === 'object' && React.isValidElement(node)) {
      const element = node as React.ReactElement;
      if (element.props.children) {
        return React.cloneElement(element, {
          children: recurse(element.props.children)
        } as any);
      }
    }
    return node;
  };

  return recurse(children);
};

export function MarkdownRenderer({ content, className, imageMap, highlights = [] }: MarkdownRendererProps) {
  const customComponents = {
    a: ({ node, ...props }: any) => <a target="_blank" rel="noopener noreferrer" {...props} />,
    img: ({ node, alt, src }: any) => <NoteImage src={imageMap?.[src ?? ''] ?? src} alt={alt} />,
    li: ({ node, children, ...props }: any) => {
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

      finalChildren = highlightChildren(finalChildren, highlights);

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

      return <li {...props} className="py-1 [&_p]:inline [&_p]:m-0">{finalChildren}</li>;
    },
    p: ({ node, children, ...props }: any) => {
      const hasImageNode = Array.isArray((node as any)?.children)
        && (node as any).children.some((child: any) => child?.tagName === "img");
      const hasImage = hasImageNode || React.Children.toArray(children).some(
        (child) => React.isValidElement(child) && (child.type === NoteImage || child.type === "img")
      );
      if (hasImage) {
        return <div {...props} className="my-2">{highlightChildren(children, highlights)}</div>;
      }

      const text = getTextContent(children);
      const optionMatch = text.match(/^\s*\(?\b([A-D])\b\)?[\s.:]+(.*)/i);
      if (optionMatch) {
        const label = optionMatch[1].toUpperCase();
        const restChildren = modifyChildrenToRemoveTag(children, optionMatch[0].length - optionMatch[2].length);
        return (
          <div className="my-2.5 flex items-center gap-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/10 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-slate-200 dark:hover:bg-slate-900/30 dark:hover:border-slate-700/60 transition-all shadow-sm/5">
            <span className="w-7 h-7 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-violet-200/30">
              {label}
            </span>
            <span className="flex-1 leading-relaxed">{highlightChildren(restChildren, highlights)}</span>
          </div>
        );
      }

      const faqAnswerMatch = text.match(/^\s*\bA\b[\s.:]+(.*)/i);
      if (faqAnswerMatch) {
        const restChildren = modifyChildrenToRemoveTag(children, faqAnswerMatch[0].length - faqAnswerMatch[1].length);
        return (
          <div className="my-2.5 flex items-start gap-3.5 rounded-2xl border border-emerald-100/60 dark:border-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50/40 hover:border-emerald-200/60 transition-all">
            <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-emerald-200/30">
              ANS
            </span>
            <span className="flex-1 leading-relaxed text-slate-600 dark:text-slate-400">{highlightChildren(restChildren, highlights)}</span>
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
          <div className="my-3 flex items-start gap-3.5 rounded-2xl border border-sky-100/60 dark:border-sky-950/20 bg-sky-50/20 dark:bg-sky-950/5 px-4 py-3 pr-28 text-sm font-black text-slate-800 dark:text-slate-200 hover:bg-sky-50/40 hover:border-sky-200/60 transition-all">
            <span className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-sky-200/30">
              {label}
            </span>
            <span className="flex-1 leading-relaxed">{highlightChildren(finalChildren, highlights)}</span>
            {formattedTag && (
              <span className="absolute right-2.5 top-3 select-none text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/30 px-2 py-0.5 rounded-lg font-mono">
                {formattedTag}
              </span>
            )}
          </div>
        );
      }

      return <p {...props} className="my-2">{highlightChildren(children, highlights)}</p>;
    }
  };

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={customComponents}
      >
        {formatMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}

