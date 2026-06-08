import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AssessmentContentRendererProps = {
  children: string;
  className?: string;
};

function formatDenseAssessmentText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const lineCount = trimmed.split(/\r?\n/).length;
  const looksDense = lineCount <= 3 && trimmed.length > 220;
  if (!looksDense) return text;

  return trimmed
    .replace(/\s+(?=(?:Section|Part|Answer Key|Answers|Ans Key)\b)/gi, "\n\n")
    .replace(/\s+(?=([A-E]|[ଏ-ଐ])\s*[-:]\s*)/g, "\n\n")
    .replace(/([^\n])\s+(?=\d{1,2}[.)]\s+)/g, "$1\n")
    .replace(/([^\n])\s+(?=\([a-dA-D]\)\s+)/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n");
}

export default function AssessmentContentRenderer({
  children,
  className = "",
}: AssessmentContentRendererProps) {
  const formattedContent = formatDenseAssessmentText(children);

  return (
    <div className={`assessment-content prose prose-sm prose-slate max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}
