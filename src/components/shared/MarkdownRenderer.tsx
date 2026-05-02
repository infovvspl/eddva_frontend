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
  return text
    .replace(/\\n/g, "\n")
    .replace(/\r?\n/g, "\n\n")
    // Step-based and final answer formatting
    .replace(/(Step\s*\d+[^a-zA-Z0-9\s]?|Final\s*Answer\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    // Theory-specific 5-part numerical/theory headers
    .replace(/(\(\d\)\s*[a-zA-Z\s/-]+[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    // Legacy sub-headers
    .replace(/(Reason\s*[:\u2014\u2013\u002D.]?|Explanation\s*[:\u2014\u2013\u002D.]?|Logic\s*[:\u2014\u2013\u002D.]?|Key\s*Concept\s*[:\u2014\u2013\u002D.]?|Verification\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    // Convert LaTeX delimiters from \[ \] and \( \) to $$ and $ if remark-math needs them
    .replace(/\\\[/g, "$$").replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$").replace(/\\\)/g, "$")
    .replace(/\n{3,}/g, "\n\n")
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
