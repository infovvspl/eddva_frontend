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

  if (!src) return null;

  if (hidden) {
    return (
      <figure className="not-prose group relative my-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-5 text-slate-400">
          <svg className="w-8 h-8 mb-2 text-blue-500/60 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-bold text-slate-600">Loading educational diagram…</span>
        </div>
        {displayAlt && (
          <figcaption className="flex items-start justify-center gap-2 border-t border-slate-200/60 px-4 py-2.5 text-xs font-medium leading-relaxed text-slate-600">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            {displayAlt}
          </figcaption>
        )}
      </figure>
    );
  }

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
 * THE single authoritative definition of "is this text already inside existing math" in this
 * file. Splits on whole "$$...$$" / "$...$" spans (correctly, across multiple lines) rather than
 * naively splitting on a single "$" or checking one line at a time for a "$" character — those
 * ad-hoc, hand-rolled checks are what caused a long-running class of bugs this file has had:
 * a heuristic meant to find UN-delimited math in prose and wrap it in "$...$" would instead land
 * on a line/segment that's already inside a multi-line "$$...$$" block (whose delimiters sit on
 * their own lines, so the content line itself has zero "$" characters), and wrap it AGAIN —
 * nesting a new "$...$" inside the existing "$$...$$" and leaving literal "$" characters visible
 * once rendered, or in some cases produced an odd/unpaired "$" count that made remark-math refuse
 * to render the whole paragraph as math at all.
 *
 * Any new heuristic that decides whether to ADD "$" delimiters around some pattern must run via
 * `mapOutsideMath` below, never re-implement its own "am I inside $ already" check.
 */
function splitMathProse(text: string): Array<{ type: "prose" | "math" | "image"; text: string }> {
  const tokens: Array<{ type: "prose" | "math" | "image"; text: string }> = [];
  let lastIndex = 0;
  const mathRegex = /(\$\$(?:[\s\S]*?)\$\$)|(\$(?:[^$]+?)\$)|(!\[[\s\S]*?\]\([^)]+\))/g;
  let match: RegExpExecArray | null;
  while ((match = mathRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      tokens.push({ type: "prose", text: text.slice(lastIndex, matchIndex) });
    }
    tokens.push({ type: match[3] ? "image" : "math", text: match[0] });
    lastIndex = mathRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "prose", text: text.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Applies `fn` only to the prose runs of `text`, leaving existing math/image spans byte-for-byte
 * untouched, then rejoins. This is how a heuristic that wraps un-delimited math patterns in new
 * "$...$" must be scoped — see splitMathProse's doc comment for why.
 */
function mapOutsideMath(text: string, fn: (prose: string) => string): string {
  return splitMathProse(text)
    .map((tok) => (tok.type === "prose" ? fn(tok.text) : tok.text))
    .join("");
}

/**
 * Line-based counterpart to mapOutsideMath, for a heuristic that inspects ONE LINE at a time and
 * decides whether to wrap it in new math delimiters (e.g. "does this whole line look like a bare
 * equation?"). A bare `.split("\n").map(lineFn).join("\n")` cannot tell a content line of an
 * existing multi-line "$$\ncontent\n$$" block (which has no "$" of its own — the delimiters sit
 * on their own lines) from genuine un-delimited prose, and would wrap it again. This tracks
 * entry/exit of such a block explicitly and passes those lines through untouched. Any new
 * heuristic that classifies text line-by-line must use this, not a bare split/map/join.
 */
function mapProseLines(text: string, lineFn: (line: string) => string): string {
  let insideDisplayMathBlock = false;
  return text
    .split("\n")
    .map((line) => {
      if (line.trim() === "$$") {
        insideDisplayMathBlock = !insideDisplayMathBlock;
        return line;
      }
      if (insideDisplayMathBlock) return line;
      return lineFn(line);
    })
    .join("\n");
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
          // An already-blank separator line (from an upstream "\n\n" paragraph break, e.g. right
          // after a heading) needs no synthesized separator of its own — falling through to the
          // generic hard-break branch below would inject a stray "  \n" (a visible <br>) between
          // what should just be two cleanly separated paragraphs.
          if (!currentLine) {
            result += "\n";
            continue;
          }
          // Symmetric case: the NEXT line is the blank separator (this line is the last content
          // before a "\n\n" gap). Same reasoning — a plain newline here, not a hard break; the
          // following iteration's empty-currentLine check above emits the second newline.
          if (!nextLine) {
            result += "\n";
            continue;
          }

          // Preserve Markdown tables. A table row ends with "|", which the
          // operator test below treats as a line-continuation \u2014 that joined every
          // row onto one line, so remark-gfm could not parse it and the raw pipes
          // showed as text. Keep a plain newline between consecutive rows, and a
          // blank line when entering/leaving the table so the block is recognized.
          const isTableRow = (s: string) => /^\|.*\|$/.test(s.trim());
          const curIsRow = isTableRow(currentLine);
          const nextIsRow = isTableRow(nextLine);
          if (curIsRow || nextIsRow) {
            result += curIsRow !== nextIsRow ? "\n\n" : "\n";
            continue;
          }

          // Preserve headings and bullet lists. A bullet line starts with "-",
          // which the operator test below caught as a continuation \u2014 so every
          // "- Definition / - Notation / - Example" bullet was folded up into the
          // heading above it and the whole block rendered as one bold heading.
          // Headings are their own block; give a bullet list a blank line before
          // its first item and a single newline between consecutive items.
          const isBullet = (s: string) => /^[-*+]\s+/.test(s);
          const isHeading = (s: string) => /^#{1,6}\s+/.test(s);
          if (isHeading(currentLine) || isHeading(nextLine)) {
            result += "\n\n";
            continue;
          }
          if (isBullet(nextLine)) {
            result += isBullet(currentLine) ? "\n" : "\n\n";
            continue;
          }
          if (isBullet(currentLine)) {
            result += "\n\n";
            continue;
          }
          // A bare option letter ("A", "B.", "(C)") immediately followed by the NEXT question's
          // number needs a full paragraph break, not a hard line break — otherwise it visually
          // reads as if the empty option belongs to the next question's list.
          if (/^[A-Za-z][.):]?$/.test(currentLine) && /^(?:Q\s*)?\d{1,3}[.)]\s/i.test(nextLine)) {
            result += "\n\n";
            continue;
          }

          const endsWithOperator = /[+\-/=,\\&|]$/.test(currentLine) || /^[+=><\u2212\u2013-]{1,3}$/.test(currentLine);
          const startsWithOperator = /^[+\/=)\]},=>\u2212\u2013-]/.test(nextLine) || /^-[^ ]/.test(nextLine) || /^\(\d+\)\s*[+\-/=]/.test(nextLine);
          // Don't insert double-newlines after lone question numbers (e.g. "1." or "Q1.") or option tags
          const isLoneNumberOrMarker = /^(?:Q\s*)?\d{1,3}[.)]\s*$/i.test(currentLine) || /^\([a-zA-Z0-9]{1,3}\)\s*$/.test(currentLine) || /^[-*+]\s*$/.test(currentLine) || /^[0-9]+$/.test(currentLine);
          
          // Check if current or next line is a bullet/numbered list item
          const isListItem = /^[-*+]\s+/.test(currentLine) || /^\d+[.)]\s+/.test(currentLine);
          const nextIsListItem = /^[-*+]\s+/.test(nextLine) || /^\d+[.)]\s+/.test(nextLine);

          const isLoneParen = /^\s*[\(\)]\s*$/.test(currentLine) || /^\s*[\(\)]\s*$/.test(nextLine);
          const isContinuation = endsWithOperator || startsWithOperator || isLoneNumberOrMarker || isLoneParen;
          
          if (isContinuation) {
            result += " ";
          } else {
            // Add trailing double-space so Markdown preserves hard line breaks (each step on new line)
            result += "  \n";
          }
        }
      }
      inlineParts[j] = result;
    }
    displayParts[i] = inlineParts.join("$");
  }
  return displayParts.join("$$");
}

const _SUB_SUP_TAG_RE = /<su[bp]>[^<]*<\/su[bp]>/gi;
const _IDENT_OR_TAG_RE = /(?:[A-Za-zΑ-ωÀ-ÿ0-9()]|<su[bp]>[^<]*<\/su[bp]>)*<su[bp]>[^<]*<\/su[bp]>(?:[A-Za-zΑ-ωÀ-ÿ0-9()]|<su[bp]>[^<]*<\/su[bp]>)*/g;

/**
 * Some LLM output uses literal HTML <sub>/<sup> tags for subscripts and
 * superscripts (e.g. "K<sub>f</sub>") instead of LaTeX. This renderer has no
 * rehype-raw plugin, so raw HTML is never interpreted — it shows up as
 * literal visible text ("K<sub>f</sub>") instead of an actual subscript.
 * Convert each contiguous run of identifier characters + <sub>/<sup> tags
 * (e.g. "K<sub>f</sub>" or "C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>") into a
 * single LaTeX span ("$K_{f}$"), keeping multi-tag runs like chemical
 * formulas in ONE $...$ span rather than fragmenting into adjacent spans
 * (which can otherwise collide into an accidental "$$" display-math boundary).
 */
function convertHtmlSubSupToLatex(text: string): string {
  if (!_SUB_SUP_TAG_RE.test(text)) return text;
  _SUB_SUP_TAG_RE.lastIndex = 0;
  return text.replace(_IDENT_OR_TAG_RE, (run) => {
    const latex = run
      .replace(/<sub>([^<]*)<\/sub>/gi, "_{$1}")
      .replace(/<sup>([^<]*)<\/sup>/gi, "^{$1}");
    return `$${latex}$`;
  });
}

const _MATH_TOKEN = String.raw`[A-Za-zΑ-ωÀ-ÿ]+(?:[_^](?:\{[^{}]*\}|[A-Za-z0-9]+))+`;
const _COMMA_BETWEEN_MATH_TOKENS_RE = new RegExp(`(${_MATH_TOKEN}),(${_MATH_TOKEN})`, "g");

/**
 * A comma with NO surrounding whitespace directly between two
 * subscripted/superscripted math tokens (e.g. "x_i,P_i^{\circ}") is not a
 * real list separator — written prose always has "x, y" with a space after
 * the comma. This shape is what a spoken pause transcribed as a literal
 * comma looks like once carried through into a formula that should have used
 * multiplication (x_i · P_i°). Convert it to \cdot.
 */
function fixCommaBetweenMathTokens(text: string): string {
  return text.replace(_COMMA_BETWEEN_MATH_TOKENS_RE, "$1 \\cdot $2");
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
    // Raw generated equations often use programming multiplication ("a*b", "2*x"). Real math
    // variables/units are short (1-3 chars); a longer word flanking a lone "*" is prose — most
    // often a "**Term** (aside)" bold marker that lost an asterisk somewhere — and must never be
    // rewritten into a math dot. The negative look-behind/-ahead reject a SUFFIX/PREFIX of a
    // longer token (so "Writing" can't sneak in as its last-3-chars "ing"), not just length.
    .replace(/([)\]])\s*\*\s*([A-Za-z0-9_{}^]{1,3})(?![A-Za-z0-9_{}^])/g, "$1 \\cdot $2")
    .replace(/(?<![A-Za-z0-9_{}^])([A-Za-z0-9_{}^]{1,3})\s*\*\s*([A-Za-z0-9_{}^]{1,3})(?![A-Za-z0-9_{}^])/g, "$1 \\cdot $2")
    .replace(/([)\]])\s*\*(\()/g, "$1 \\cdot $2")
    .replace(/(?<![A-Za-z0-9_{}^])([A-Za-z0-9_{}^]{1,3})\s*\*(\()/g, "$1 \\cdot $2");
}

function unwrapMathCodeSpans(text: string): string {
  return text.replace(/(`+)([\s\S]*?)\1/g, (match, _ticks, inner) => {
    const trimmed = inner.trim();
    const isLikelyCode = /\b(?:const|let|var|function|return|import|export|class|interface|type)\b/.test(trimmed);
    const isLikelyMath =
      /[=+\-*/^_\u2260\u2264\u2265\u2192]/.test(trimmed) ||
      /\b[a-zA-Z]{1,3}\d{1,2}\b/.test(trimmed) ||
      /\\(?:frac|sqrt|cdot|times|theta|alpha|beta|gamma|delta|pi)\b/.test(trimmed);

    if (isLikelyMath && !isLikelyCode) {
      // Fix subscript variables e.g. a1 -> a_1, b1^2 -> b_1^2
      // Collapse internal linebreaks inside equation blocks so "x\n=\n10" stays on one line "x = 10"
      const cleanMath = trimmed.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
      const formattedMath = cleanMath.replace(/\b([a-zA-Z]{1,2})(\d{1,2})\b/g, '$1_$2');
      return `$${formattedMath}$`;
    }
    return match;
  });
}

/**
 * LaTeX/KaTeX only subscripts (or superscripts) a SINGLE character after
 * "_"/"^" unless it's wrapped in {}. "C_total" therefore renders as "C" with
 * subscript "t", followed by normal-size "otal" immediately after — the
 * model writes multi-letter subscript labels (total, max, avg, atm, eq...)
 * without braces. Restricted to letters-only tokens (2+ letters, no digits)
 * so this never touches coefficient notation like "a_1x" (subscript is just
 * the digit "1"; "x" is a separate term multiplied by it, not part of the
 * subscript) or chemical formulas like "H_2O" (subscript "2", then "O").
 * Applied only inside $...$/$$...$$ math spans — a bare "_" in plain prose
 * is Markdown italic syntax, not a subscript.
 */
function wrapMultiLetterSubSup(text: string): string {
  const fixSegment = (segment: string) =>
    segment.replace(/([_^])([A-Za-z]{2,})/g, "$1{$2}");
  return text
    .split("$$")
    .map((seg, i) => {
      if (i % 2 !== 0) return fixSegment(seg);
      return seg.split("$").map((s, j) => (j % 2 !== 0 ? fixSegment(s) : s)).join("$");
    })
    .join("$$");
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
  return mapProseLines(text, (line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.includes("$")) return line;
      // Must contain = or a Unicode math relation (≠ ≤ ≥ ≈)
      const hasEquals = /[=]/.test(trimmed);
      const hasUnicodeMathRel = /[\u2260\u2264\u2265\u2248]/.test(trimmed);
      if (!hasEquals && !hasUnicodeMathRel) return line;
      // Allow ASCII math chars + Unicode math relations/symbols (incl. \u00D7 \u00F7 \u00B7)
      if (!/^[A-Za-z0-9_{}^()[\].,=+\-*/\\\s\u2260\u2264\u2265\u2248\u2212\u00D7\u00F7\u00B7\u00B2\u00B3\u2070-\u2079\u207F]+$/.test(trimmed)) return line;

      const startsLikeEquation = /^[A-Za-z]{1,4}(?:_[A-Za-z0-9]{1,4})?(?:\s*[=\u2260\u2264\u2265]|\^)/.test(trimmed);
      const hasRepeatedEquals = (trimmed.match(/=/g) ?? []).length >= 2;
      const hasMathOperator = /(?:\\cdot|[+\-*/^_\u2260\u2264\u2265\u2248\u00D7\u00F7\u00B7])/.test(trimmed);
      if (!startsLikeEquation || (!hasRepeatedEquals && !hasMathOperator)) return line;

      const prefix = line.match(/^\s*/)?.[0] ?? "";
      const suffix = line.match(/\s*$/)?.[0] ?? "";
      // Convert Unicode math relations/operators to LaTeX equivalents in the block
      const latexTrimmed = trimmed
        .replace(/\u2260/g, "\\neq ")
        .replace(/\u2264/g, "\\leq ")
        .replace(/\u2265/g, "\\geq ")
        .replace(/\u2248/g, "\\approx ")
        .replace(/\u00D7/g, " \\times ")
        .replace(/\u00F7/g, " \\div ")
        .replace(/\u00B7/g, " \\cdot ");
      return `${prefix}$${latexTrimmed}$${suffix}`;
  });
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
  return mapOutsideMath(text, _collectCompoundLatex);
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

/**
 * Repairs a bold span whose closing "**" lost one asterisk before a
 * parenthetical aside — e.g. "**Term* (explanation)" instead of
 * "**Term** (explanation)", the exact shape this app's "Key Term (aside)"
 * content style produces when the model drops a character. Only fires on a
 * lone "*" immediately before whitespace + "(" while a "**" opened earlier
 * in the text is still unclosed, so a genuine single-asterisk italic
 * (never preceded by an unclosed "**") is left untouched.
 */
function repairDroppedBoldCloser(text: string): string {
  let boldOpen = false;
  return text.replace(/\*\*|\*(?=\s+\()/g, (match) => {
    if (match === "**") {
      boldOpen = !boldOpen;
      return match;
    }
    if (boldOpen) {
      boldOpen = false;
      return "**";
    }
    return match;
  });
}

export const formatMarkdown = (text?: string) => {
  if (!text) return "";

  let formatted = repairDroppedBoldCloser(text);
  formatted = formatted
    // 1. Unescape double-escaped backslashes from JSON payloads. Restricted to a backslash pair
    // immediately followed by a letter — that shape is what a double-JSON-encoded command name
    // looks like ("\\text{Na}" meaning the intended "\text{Na}" picked up one extra escape layer
    // in transport). A genuine LaTeX row-separator inside \begin{cases}/array/matrix is the SAME
    // two-character command "\\" but is followed by whitespace or a newline before the next row,
    // never a letter — collapsing it here too turned it into a single stray "\" that a later rule
    // (meant for OCR line-wrapped fractions) then read as "S = k \\n P" and rewrote as "S/P",
    // silently deleting the row break and running a two-equation system onto one line.
    .replace(/\\\\(?=[a-zA-Z])/g, "\\")
    // 1b. Unescape dollar delimiters (\$ -> $). Models and JSON transport
    // sometimes emit "\$formula\$"; remark-math ignores an escaped dollar, so the
    // formula rendered as literal "$…$" text with raw \times / \quad commands.
    .replace(/\\\$/g, "$")
    // 2. Restore form feeds and other control characters that might be mangled backslash sequences
    .replace(/\x0C/g, "\\f")
    .replace(/\x0B/g, "\\v")
    .replace(/\x07/g, "\\a")
    .replace(/\x08/g, "\\b")
    // 3. Convert LaTeX delimiters from \[ \] and \( \) to $$ and $ for remark-math / KaTeX parsing.
    // Replacer must be a FUNCTION, not the string "$$" — in a replacement STRING, "$$" is JS's
    // own escape for a single literal "$" (like $&, $1), so it silently produced "$" instead of
    // "$$", turning every \[...\] display-math block into single-dollar inline math. That single
    // (rather than doubled) boundary is exactly what let later regexes — which only check the
    // single character immediately before/after a match — reach inside and fragment the equation.
    .replace(/\\\[/g, () => "$$").replace(/\\\]/g, () => "$$")
    .replace(/\\\(/g, "$").replace(/\\\)/g, "$")
    // 4. Keep carriage returns as simple newlines
    .replace(/\\n(?![a-zA-Z])/g, "\n");

  // 4b. Convert literal HTML <sub>/<sup> tags to LaTeX before any other math
  // detection runs, so downstream heuristics see a normal $...$ span instead
  // of raw HTML.
  formatted = convertHtmlSubSupToLatex(formatted);

  // 4c. Fix a comma standing in for multiplication between two math tokens
  // (e.g. "x_i,P_i^{\circ}" -> "x_i \cdot P_i^{\circ}").
  formatted = fixCommaBetweenMathTokens(formatted);

  // Protect GFM table blocks from every math/line heuristic below. A table row
  // ends in "|", which the line-continuation logic reads as a math continuation
  // and folds all rows onto one line — remark-gfm then shows raw pipes. Pull each
  // table out to a placeholder, run all normalisation, then reinsert verbatim.
  const tableBlocks: string[] = [];
  formatted = formatted.replace(
    /(?:^|\n)[ \t]*(\|[^\n]+\|[ \t]*\n[ \t]*\|[ \t]*:?-+[-:|\t ]*\|[ \t]*(?:\n[ \t]*\|[^\n]+\|[ \t]*)*)/g,
    (_m, block: string) => {
      const normalized = block
        .trim()
        .split(/\r?\n/)
        .map((r) => r.trim())
        .join("\n");
      tableBlocks.push(normalized);
      return `\n\nTABLEBLOCKTOKEN${tableBlocks.length - 1}ENDTABLEBLOCK\n\n`;
    },
  );

  // Split inline MCQ options onto their own lines. Models emit "A. x B. y C. z
  // D. w" inconsistently — sometimes all on one line — which reads as a jumble
  // (the old splitter used a case-insensitive class that broke whenever an option
  // contained a lowercase a–d, e.g. "cm" or "a²b³"). Done before math wrapping,
  // and only when A + B + C labels share a line, so a single "A." option or prose
  // like "Vitamin A … B …" / "Section A … B …" is left untouched.
  formatted = formatted
    .split("\n")
    .map((line) => {
      if (
        /(^|\s)A[.):]\s/.test(line) &&
        /\sB[.):]\s/.test(line) &&
        /\sC[.):]\s/.test(line) &&
        !/\b(?:Section|Part|Group|Chapter|Unit|consists|questions)\b/.test(line)
      ) {
        return line.replace(/\s+([B-E])([.):])\s+/g, "\n$1$2 ");
      }
      return line;
    })
    .join("\n");

  formatted = unwrapMathCodeSpans(formatted);

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

  // Clean up 4 or 3 dollar sequences: $$$$ -> $$, $$$ -> $$. Same "$$" replacement-string gotcha
  // as above — must be a function or these collapse all the way down to a single "$".
  formatted = formatted.replace(/\$\$\$\$/g, () => "$$").replace(/\$\$\$/g, () => "$$");

  // ── Step 1: Strip stray $ signs that appear inside prose function call arguments
  // e.g. LCM(306, $657) or $657) → but ONLY when not already inside a $...$ span
  formatted = mapOutsideMath(formatted, (s) => s.replace(/\$(\d+)([),])/g, "$1$2"));
  // Strip orphan $ = $ or $=$ patterns (dollar-wrapped equals signs): $=$ → =
  formatted = formatted.replace(/\$\s*=\s*\$/g, " = ");

  // Join equation labels that appear on a separate line: "...equation text\n(Equation 1)" -> "...equation text ... (Equation 1)"
  // Also handles bare "(1)", "(2)" etc.
  // Group 1 must contain a digit or operator, not just letters \u2014 a heading/sentence ending in a
  // plain word (e.g. "Quick Revision Summary") followed by an unrelated "(1)." list marker on the
  // next line otherwise matches too (any alphabetic run satisfies the old charset), producing a
  // bogus "Summary ... ((1))." \u2014 a fabricated ellipsis plus a doubled paren around the list number.
  // "*" is deliberately excluded from that trigger set \u2014 it is far more often a markdown "**bold**"
  // delimiter than a multiplication sign, so "**label:**\n1. item" (a bold label right before an
  // ordinary numbered list) was qualifying on the "**" alone and getting the same treatment.
  // Group 2 requires real parens, or the literal "Equation"/"Eq" keyword \u2014 a bare "1" with nothing
  // marking it as an equation number is an ordinary "1. list item", not a wrapped label, and must
  // be left with its own trailing "." rather than grown a pair of fabricated parens.
  formatted = formatted.replace(
    /([A-Za-z0-9_.]*[0-9+=\-/^\u2260\u2264\u2265][A-Za-z0-9_+=\-*/^.\u2260\u2264\u2265]*)[ \t]*\r?\n[ \t]*(\((?:Equation|Eq\.?)?[ \t]*\d{1,2}\)|(?:Equation|Eq\.?)[ \t]*\d{1,2})/gi,
    (_m, expr, label) => `${expr} ... ${label.startsWith("(") ? label : `(${label})`}`,
  );
  // Simpler: line ending with 0 or equation chars followed by newline then just "(1)" or "(Equation 1)"
  formatted = formatted.replace(
    /(\S)[ \t]*\r?\n[ \t]*(\((?:Equation\s*)?\d{1,2}\))/gi,
    "$1 $2"
  );

  // Clean up broken equation numbering splits e.g. "a1x + b1y + c1 = 0 ... \n (\n 1." -> "a1x + b1y + c1 = 0 ... (1)"
  formatted = formatted.replace(/\.\.\.\s*\n\s*\(\s*\n\s*(\d{1,2})[.)]/g, "... ($1)");

  // A heading is meant to be its own line ("## Exam Strategy"), with the section's actual content
  // starting fresh below it. The model sometimes runs the first content straight onto the heading
  // line instead — either via a " - Label:" separator ("## Exam Strategy - Question Types: Expect
  // ...") or by gluing an embedded example's "Question:" directly on ("### Example 3 ... Question:
  // The passage ..."). Split both shapes so the label starts its own paragraph, not the heading.
  formatted = formatted.replace(/^(#{1,6}\s+[^\n]*?)\s-\s([A-Z][A-Za-z0-9 ]{2,40}:)/gm, "$1\n\n$2");
  formatted = formatted.replace(/^(#{1,6}\s+[^\n]*?)\s+((?:\*\*|__)?Question:(?:\*\*|__)?)/gm, "$1\n\n$2");

  // Clean up vertical line breaks around operators e.g. "x \n = \n 10" -> "x = 10"
  // "-", "+" and "*" are also CommonMark bullet markers, so an operator immediately followed by
  // whitespace ("- ", "+ ", "* ") is excluded — that shape is a list item starting the next line,
  // not a wrapped operator, and joining it here was erasing the newline that made it a list at all
  // (e.g. "## Heading\n- **First bullet**" collapsed into "## Heading - **First bullet**").
  formatted = formatted.replace(/([A-Za-z0-9_]+)\s*\r?\n\s*(=|\+(?!\s)|-(?!\s)|\*(?!\s)(?!\*)|\/)\s*\r?\n\s*([A-Za-z0-9_]+)/g, "$1 $2 $3");
  formatted = formatted.replace(/([A-Za-z0-9_]+)\s*\r?\n\s*(=|\+(?!\s)|-(?!\s)|\*(?!\s)(?!\*)|\/)/g, "$1 $2");
  formatted = formatted.replace(/(=|\+(?!\s)|-(?!\s)|\*(?!\s)(?!\*)|\/)\s*\r?\n\s*([A-Za-z0-9_]+)/g, "$1 $2");
  formatted = formatted
    .replace(/(?:=\s*){2,}/g, "= ")
    .replace(/=\s*>\s*=?/g, "=> ")
    .replace(/=\s*[\u2212\u2013-]\s*/g, "= -");


  // ── Step 2: Unnest single dollar signs inside double-dollar display math blocks $$ ... $$
  formatted = formatted.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    const cleanedInner = inner.replace(/(?<!\$)\$(?!\$)/g, "");
    return `$$\n${cleanedInner.trim()}\n$$`;
  });

  // ── Step 3: Fix partial inline math where left side of equation is outside $
  // e.g. LCM(p, q, r) = $\frac{...}$ → $LCM(p, q, r) = \frac{...}$
  formatted = formatted.replace(
    /(^|\n)([ \t]*[A-Za-z0-9_(),\s]+\s*=\s*)\$([^$\n]+)\$/g,
    (_m, newline, left, inner) => {
      const words = (left.match(/\b[A-Za-z]{4,}\b/g) || []);
      if (words.length > 2) return `${newline}${left}$${inner}$`;
      const cleanInner = inner.replace(/\\quad\s*$/g, "").trim();
      return `${newline}$${left.trim()} ${cleanInner}$`;
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

  // An EXAMTAG line with nothing else on it ("4. [EXAMTAG: ...]") is the number+tag alone; the
  // actual question text was on the next line. Pull it onto the same line — unless that next line
  // is itself another option/list marker, in which case force a full paragraph break instead so it
  // doesn't get glued onto the tag either.
  formatted = formatted.replace(
    /^(\d+\.\s*\[EXAMTAG:\s*[^\]]+\]\s*)\r?\n(?=\s*(?:[A-Za-z][.):]\s|\([A-Za-z]\)\s|\d+[.)]\s|#{1,6}\s|[-*+]\s))/gim,
    "$1\n\n",
  );
  // Group 1's trailing whitespace is deliberately [ \t]*, not \s* — \s would also match a
  // newline, so a greedy match could backtrack across the blank line the rule above just
  // inserted (swallowing one of its two newlines into group 1) and merge anyway, undoing it.
  formatted = formatted.replace(
    /^(\d+\.\s*\[EXAMTAG:\s*[^\]]+\][ \t]*)\r?\n([^\n]+)/gim,
    "$1$2",
  );

  // Merge stacked option letters with their contents (e.g. A.\n0 -> A. 0)
  formatted = formatted.replace(
    /(?:\r?\n|^)\s*\b([A-D])\b[ \t.:\)]*\r?\n[ \t]*(?![A-D]\b|(?:Q\s*)?\d+[.)]\s|#{1,6}\s)([^\n]+)/gi,
    '\n$1. $2',
  );

  // Give option A the blank line that B, C and D already get.
  //
  // The rules below separate the options from each other but leave only a
  // single newline between the question and the first option. Markdown treats
  // that as a soft wrap, so "1. The Latin word 'alga' means:" and "A. Small
  // life" rendered as one paragraph while B, C and D became option cards —
  // every question in the paper appeared to have its first option missing and
  // its text running on. Requiring a following "B." line keeps prose that
  // merely starts with "A." untouched.
  formatted = formatted.replace(
    /([^\n])\n([ \t]*A[.):][ \t]+[^\n]+)(?=\n\s*\n?[ \t]*B[.):][ \t])/g,
    '$1\n\n$2',
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
  // A blank line, not a single newline: Markdown treats one newline as a soft
  // wrap, so the option would rejoin the question paragraph it was just split
  // from — which is the bug this rule exists to fix.
  formatted = formatted.replace(
    /^([^\n]*?\S)[ \t]+\bA[.):]\s+([^\n]+)$(?=\n[ \t]*B[.):]\s)/gm,
    '$1\n\nA. $2',
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

  // Separate adjacent inline math blocks that are on the same line separated only by spaces,
  // but only with a soft break (two spaces + newline) to keep them inline inside the same paragraph.
  // Paragraph breaks (\n\n) between them caused each $...$ to become its own block element.
  // e.g. $LCM(...)$ $HCF(...)$ → $LCM(...)$  \n$HCF(...)$
  formatted = formatted.replace(/(\$)[ \t]+(\$)/g, '$1  \n$2');

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

  formatted = mapProseLines(formatted, normalizeMathLine);

  // Step-based and final answer formatting
  formatted = formatted
    .replace(/(?:\r?\n|^)[ \t]*(\*\*Step\s*\d+[^:]*:\*\*|Step\s*\d+[^:\n]*:?|Final\s*Answer\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1\n")
    // Format action steps (e.g. "Add y to both sides:", "Minus 10 from both sides:", "Divide both sides by 2:") onto newlines
    .replace(/([^\n])\s+((?:Add|Subtract|Minus|Multiply|Divide|Substitute|Replacing|Using|Pick)\s+[^:\n]{3,40}:)/g, "$1\n\n$2\n")
    // A numbered point like "(1). Text" can arrive INLINE mid-paragraph rather than at a line
    // start (the model runs a whole "(1). ... (2). ... (3). ..." list into one block) - the rule
    // below only re-spaces markers already at a line start, so it never splits this run-on case.
    // Force a break before every such marker regardless of position; \d{1,2} (not the single-digit
    // \d below) also covers "(10)." onward. Also swallow a leading "..." separator so it doesn't
    // dangle at the end of the previous line.
    // (?<!\*\*) stops this from splitting a bold-wrapped label like "**(1). Text**" into an
    // orphaned "**" on its own line followed by "(1). Text**" — the "**" there opens the bold
    // span, not a separate sentence, so there is nothing to break before.
    .replace(/(?<!\*\*)(?:\.\.\.)?\s*\((\d{1,2})\)\.\s*(?=[A-Z"])/g, "\n\n($1). ")
    // Same run-on problem, for lettered/roman sub-part markers: "(a) ... (b) ..." or
    // "(i) ... (ii) ... (iii) ..." — used throughout multi-part answers ("Answer: (a) ... (b) ...")
    // but, unlike the numbered case above, these markers are never followed by a period, so they
    // need their own rule. Requiring a capital letter right after is what keeps this from firing on
    // an ordinary lowercase parenthetical aside ("a biological process") or a chemical state symbol
    // ("H_2(g). The reaction...") — both leave a lowercase letter or punctuation right after ")",
    // never whitespace then a capital.
    // Same (?<!\*\*) guard as the numbered rule above — don't split a bold-wrapped
    // "**(a) Label:**" into an orphaned "**" plus "(a) Label:**".
    .replace(/(?<!\*\*)(?:\.\.\.)?\s*\(([a-z]|i{1,3}|iv|vi{0,3}|ix|x)\)\s+(?=[A-Z"])/g, "\n\n($1) ")
    // Theory-specific 5-part numerical/theory headers - only match standalone (1), (2) etc at START of line or after explicit heading context
    .replace(/(?:^|\n)(\(\d\)\s*(?=[A-Z])[A-Z][a-zA-Z\s/-]*[:\u2014\u2013\u002D.]?)/gm, "\n\n$1")
    // Legacy sub-headers, extended with this app's "Common Mistakes" section labels
    .replace(/(?:\r?\n|^)(\s*(?:[-*+]\s+)?(?:\*\*|__)?)(Reason\s*[:\u2014\u2013\u002D.]?|Explanation\s*[:\u2014\u2013\u002D.]?|Logic\s*[:\u2014\u2013\u002D.]?|Key\s*Concept\s*[:\u2014\u2013\u002D.]?|Verification\s*[:\u2014\u2013\u002D.]?|Mistake\s*[:\u2014\u2013\u002D.]?|Why\s*it\s*happens\s*[:\u2014\u2013\u002D.]?|Correct\s*approach\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1$2");

  // 4. Convert LaTeX delimiters from \[ \] and \( \) to $$ and $ if remark-math needs them.
  // Same "$$"-replacement-string gotcha as the first pass above.
  formatted = formatted
    .replace(/\\\[/g, () => "$$").replace(/\\\]/g, () => "$$")
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
    .replace(/\\text\{\s*[_.\-]{2,}\s*\}/g, "\\underline{\\quad\\quad}")
    .replace(/\\text\{([^}]+)\}/g, "$1");

  // Separate numbered observation headers and headings onto newlines - only when number is at start of a new line context.
  // The trailing [:\u2014\u2013-] is mandatory, not optional \u2014 it was previously optional, so this matched
  // "Observation" as a bare SUBSTRING with nothing after it, firing inside ordinary prose plurals
  // ("...everyday observations...") and phrases ("...write balanced chemical equations...") and
  // splitting a single sentence into three paragraphs. A genuine lab-report-style label ("Observation:
  // bubbles form...") always has the colon; ordinary prose usage never does.
  formatted = formatted
    .replace(/([^\n])\s*\b(Observation\s*[:\u2014\u2013-]|Balanced Chemical Equation\s*[:\u2014\u2013-])/gi, "$1\n\n$2");

  // Automatically wrap un-delimited chemical reaction equations (containing -> or \rightarrow with + and chemical terms) into KaTeX math blocks.
  // A compound like "MgCl_2" or "HCl" is several element symbols concatenated with no separator
  // between them \u2014 the element sub-pattern only matched ONE such symbol, so the regex could start
  // mid-compound (e.g. at the "Cl" inside "HCl") and treat the rest of "HCl" as if it belonged to
  // the next term, wrapping only "Cl \rightarrow Mg" and leaving stray "$" signs splitting both
  // "HCl" and "MgCl_2" apart. The element sub-pattern now repeats (one or more) so a full compound
  // is consumed as a single term before the "+" / arrow separators are considered.
  // A polyatomic group like "(OH)" or "(NO3)" holds UPPERCASE element letters, not lowercase —
  // "Fe(OH)_3" was matching only "Fe" (the paren-group alternative required lowercase, e.g. the
  // "(aq)"/"(s)" state-indicator use), leaving "(OH)_3" outside the wrap: an odd, unpaired "$"
  // count that made remark-math refuse to render ANY of it as math, falling back to raw text.
  {
    // A polyatomic ion inside the parens can carry its own LaTeX subscript, e.g. "(NO_3)" — allow
    // that inside the group too, not just after it (covers "Zn(NO_3)_2", "Ca(SO_4)" etc.).
    const chemElement = String.raw`[A-Z][a-z]?(?:_\{\d+\}|_\d+|\((?:[A-Za-z0-9]|_\{\d+\}|_\d+)+\)(?:_\{\d+\}|_\d+)?|_\{\([a-z]+\)\})*`;
    const chemCompound = `(?:${chemElement})+`;
    const chemTerm = String.raw`(?:\d+\s*)?${chemCompound}(?:\\uparrow|\\downarrow)?`;
    const chemEquation = new RegExp(
      String.raw`${chemTerm}\s*(?:\+\s*${chemTerm}\s*)*(?:\\rightarrow|->|\u2192)\s*${chemTerm}(?:\s*\+\s*${chemTerm})*`,
      "g",
    );
    // Restricted to segments OUTSIDE existing $...$/$$...$$ \u2014 the (?<!\$)/(?!\$) this rule used to
    // rely on only inspects the single character at each match's own edge, which does nothing to
    // stop the match from landing entirely INSIDE an already math-delimited equation (e.g.
    // "$2Na + ... H_2\uparrow$") and re-wrapping a middle slice of it in its own "$...$". That
    // leaves fragments of the original delimiters stranded outside the new wrap \u2014 e.g. "$2$Na +
    // ... H_2$\uparrow$" \u2014 which is worse than doing nothing: remark-math can no longer parse any
    // of it as math at all.
    const wrapChemEquations = (prose: string) => prose.replace(chemEquation, (match) => `$${match.trim()}$`);
    formatted = mapOutsideMath(formatted, wrapChemEquations);
  }

  // Convert caret/subscript with parentheses to curly braces e.g. ^(n-1) -> ^{n-1}
  formatted = formatted
    .replace(/\^\(([^)]+)\)/g, "^{$1}")
    .replace(/_\(([^)]+)\)/g, "_{$1}");

  // Convert limits e.g. limh -> 0 to \lim_{h \to 0}
  formatted = formatted
    .replace(/\blim\s*([a-zA-Z0-9]+)\s*(?:->|\\to)\s*([a-zA-Z0-9]+)\b/gi, "\\lim_{$1 \\to $2}");

  // Convert division slashes to \frac{}{} where safe.
  // IMPORTANT: Only apply to prose segments outside existing $...$ math spans.
  const applyFractionConversions = (prose: string): string => {
    // 1. (num) / (den) or [num] / [den]
    let s = prose.replace(/(?:\(([^)]+)\)|\[([^\]]+)\])\s*\/\s*(?:\(([^)]+)\)|\[([^\]]+)\])/g, (_m, p1, p2, p3, p4) => {
      const num = p1 || p2;
      const den = p3 || p4;
      return `\\frac{${num}}{${den}}`;
    });
    // 2. (num) / den_word or [num] / den_word
    s = s.replace(/(?:\(([^)]+)\)|\[([^\]]+)\])\s*\/\s*\b([a-zA-Z0-9]+)\b/g, (_m, p1, p2, p3) => {
      const num = p1 || p2;
      return `\\frac{${num}}{${p3}}`;
    });
    // 3. num_word / (den) or num_word / [den]
    s = s.replace(/\b([a-zA-Z0-9]+)\b\s*\/\s*(?:\(([^)]+)\)|\[([^\]]+)\])/g, (_m, p1, p2, p3) => {
      const den = p2 || p3;
      return `\\frac{${p1}}{${den}}`;
    });
    // 4. simple term / simple term (dy/dx, 1/2, x^2/y^2, p^2/q^2, 1/1.033)
    // Protect state indicators like Mg / (s), and common unit ratios like
    // kg/mol, mol/L, J/mol — these are plain-text units, not math fractions,
    // and rendering them as a stacked \frac{} produces mangled-looking output
    // (e.g. "1.86 °C·kg/mol" turning into a broken fraction glyph).
    // The decimal-number alternative must come FIRST in the token so a value
    // like "1.033" matches whole — otherwise the [a-zA-Z0-9]{1,3} branch
    // grabs just "1" (stopping at the decimal point) and the rest (".033")
    // is left dangling as plain text right after the fraction.
    const _FRACTION_TOKEN = String.raw`(?:\d+\.\d+|[a-zA-Z0-9]{1,3}(?:\^[{a-zA-Z0-9}-]+|_[{a-zA-Z0-9}-]+)?)`;
    s = s.replace(new RegExp(String.raw`(^|[^a-zA-Z0-9_$])(${_FRACTION_TOKEN})\s*/([ \t]*)(${_FRACTION_TOKEN})(?![\w$])`, "g"), (match, prefix, num, _space, den) => {
      if (/^(?:[a-z]|aq|g|l|s|mol|atm|min|hr|cal|hz|kg|km|cm|mm|ml|kj)$/i.test(den.trim())) return match;
      return `${prefix}\\frac{${num}}{${den.trim()}}`;
    });
    return s;
  };
  // Apply fraction conversions only to prose (outside $...$ spans)
  formatted = mapOutsideMath(formatted, applyFractionConversions);

  // Wrap chemical formulas with dots (e.g. Fe_2O_3 \cdot H_2O or (Fe_2O_3 . H_2O))
  //
  // An MCQ option label matches this shape exactly: in "A. Small life", "A" is
  // an element symbol, "." is the hydrate dot and "Sm" is samarium. Every option
  // in a biology paper came out as "$A. Sm$all life", italicised by KaTeX. A
  // real hydrate always has a subscript or more than one element symbol on the
  // left of the dot, so a bare single letter there is rejected below.
  formatted = formatted.replace(
    /(^|[^$A-Za-z0-9\\])(\(?\s*([A-Z][a-z]?(?:_\{\d+\}|_\d+)?(?:[A-Z][a-z]?(?:_\{\d+\}|_\d+)?)*)\s*(?:\\[cC]dot|\u22C5|\u2219|\.)\s*(?:\d+)?\s*[A-Z][a-z]?(?:_\{\d+\}|_\d+)?(?:[A-Z][a-z]?(?:_\{\d+\}|_\d+)?)*\s*\)?)(?![^$]*\$)/g,
    (match, lead: string, formula: string, leftSide: string) => {
      const left = (leftSide || "").trim();
      // "A", "B", "C"\u2026 on their own are option labels, not compounds.
      const isSingleBareLetter = /^[A-Z]$/.test(left);
      // A real hydrate/compound carries a subscript (H_2O) or an explicit \u22c5/\cdot
      // dot. A plain period between all-caps words is a sentence boundary
      // ("NATURE. Q2") \u2014 assessment papers are all-caps, so this used to fire on
      // every one, wrapping prose in $\u2026$ and producing stray unmatched dollars.
      const isRealCompound = /_/.test(formula) || /\\[cC]dot|\u22c5|\u2219/.test(formula);
      if (isSingleBareLetter || !isRealCompound) return match;
      return `${lead}$${formula}$`;
    }
  );

  // Wrap compound un-delimited LaTeX expressions (e.g. chemical equations like
  // \text{Glucose/}(C_{6}H_{12}O_{6})+\text{Oxygen/}(6O_{2})\rightarrow ...)
  // as a single math block before wrapStructuredLatex fragments them.
  formatted = wrapCompoundLatexExpressions(formatted);

  // Wrap any balanced, structured LaTeX command embedded in prose. The generic
  // math detector below cannot reliably consume spaces inside command arguments
  // arguments (for example: "The value of \frac{sin 30°}{cos 60°} is").
  formatted = mapOutsideMath(formatted, wrapStructuredLatex);

  // Brace multi-letter subscripts/superscripts inside math spans now that all
  // equation-wrapping above is done (e.g. "C_total" -> "C_{total}").
  formatted = wrapMultiLetterSubSup(formatted);

  // 7. Tokenize to protect already-formatted math blocks ($...$ and $$...$$) and markdown image tags (![...]())
  const tokens = splitMathProse(formatted);
  // Un-delimited LaTeX symbol commands sometimes leak into prose (e.g. the model
  // writes "physically \cdot mixed" instead of a bullet). KaTeX never sees them
  // because they are not wrapped in $…$, so they render as the literal text
  // "\cdot". Only in prose tokens — never inside math/image tokens — swap the
  // common symbol commands for their actual character.
  const proseLatexSymbols: Array<[RegExp, string]> = [
    [/\\cdot(?![a-zA-Z])/g, "·"],
    [/\\times(?![a-zA-Z])/g, "×"],
    [/\\div(?![a-zA-Z])/g, "÷"],
    [/\\pm(?![a-zA-Z])/g, "±"],
    [/\\rightarrow(?![a-zA-Z])/g, "→"],
    [/\\leftarrow(?![a-zA-Z])/g, "←"],
    [/\\to(?![a-zA-Z])/g, "→"],
  ];
  formatted = tokens
    .map((t) => {
      if (t.type !== "prose") return t.text;
      let s = t.text;
      for (const [re, sym] of proseLatexSymbols) s = s.replace(re, sym);
      // Drop orphan brace-only lines left by broken LaTeX (e.g. a "{" on its own
      // line from a \frac{…}/\text{…} group that lost its command). A real brace
      // inside math was already consumed by KaTeX in a math token, so a lone "{"
      // or "}" reaching prose is always an artifact.
      s = s.replace(/(^|\n)[ \t]*[{}][ \t]*(?=\n|$)/g, "$1");
      return s;
    })
    .join("");

  // Strip an orphaned code-span backtick left over from generation (e.g. a
  // final-answer span like "`C_total = ...`" whose closing backtick got lost
  // across a paragraph/chunk boundary during generation). unwrapMathCodeSpans
  // above already consumed every genuinely PAIRED run of backticks, so any
  // backtick run still present in a block by this point is either a
  // legitimate, intentional inline-code span (which always comes in a pair —
  // even count, left untouched) or a lone unpaired marker (odd count) that
  // renders as a stray literal "`" character. Only the latter gets removed.
  formatted = formatted
    .split("\n\n")
    .map((block) => {
      const runs = block.match(/`+/g);
      if (!runs || runs.length % 2 === 0) return block;
      const last = block.lastIndexOf(runs[runs.length - 1]);
      return block.slice(0, last) + block.slice(last + runs[runs.length - 1].length);
    })
    .join("\n\n");

  formatted = formatted
    .replace(/\n{3,}/g, "\n\n")
    // Collapse runs of horizontal whitespace to one space — but never a run that lands right
    // before a newline. Trailing "  \n" is CommonMark's hard line break (renders as <br>); it's
    // how labels like "**Question:**" / "**Model Answer:**" stay on their own visual line inside
    // one paragraph. Flattening it to a single space silently turns the hard break into an
    // ordinary soft wrap, which browsers render as nothing — every such label then runs together
    // with the next one. Backtracking always leaves exactly one trailing space unconsumed right
    // before the newline, so a genuine hard break (2+ spaces) is normalized to exactly two, while
    // ordinary mid-line whitespace still collapses as before.
    .replace(/[ \t]+(?!\n)/g, " ")
    .trim();

  // Reinsert the protected tables verbatim, with blank lines around each so
  // remark-gfm recognises them as table blocks.
  if (tableBlocks.length) {
    formatted = formatted.replace(
      /TABLEBLOCKTOKEN(\d+)ENDTABLEBLOCK/g,
      (_m, idx: string) => {
        const block = tableBlocks[Number(idx)];
        return block ? `\n\n${block}\n\n` : "";
      },
    );
  }

  // Add breathing room between rows of a system of equations (\begin{cases}...\end{cases}) and
  // similar multi-row environments — KaTeX renders consecutive rows tight by default, which reads
  // as cramped for a 2-3 line system. KaTeX's row separator accepts an optional spacing argument
  // ("\\[0.5em]" instead of bare "\\"), so add one to every row break inside these environments,
  // skipping any that already carry an explicit spacing argument.
  formatted = formatted.replace(
    /\\begin\{(cases|array|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?)\}([\s\S]*?)\\end\{\1\}/g,
    (_whole, envName: string, body: string) => {
      const spaced = body.replace(/\\\\(?!\[)/g, "\\\\[0.5em]");
      return `\\begin{${envName}}${spaced}\\end{${envName}}`;
    },
  );

  return formatted;
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
    img: ({ node, alt, src }: any) => {
      const cleanSrc = (src ?? '').split('?')[0];
      const resolvedSrc = imageMap?.[src ?? ''] 
        ?? imageMap?.[cleanSrc] 
        ?? (cleanSrc ? Object.entries(imageMap || {}).find(([k]) => k.split('?')[0] === cleanSrc)?.[1] : undefined) 
        ?? src;
      return <NoteImage src={resolvedSrc} alt={alt} />;
    },
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

      return <p {...props} className="my-2">{highlightChildren(children, highlights)}</p>;
    }
  };

  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]] as any}
        components={customComponents}
      >
        {formatMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}

