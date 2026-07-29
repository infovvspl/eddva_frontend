import React from "react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

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
    .replace(/\s+(?=(?:Section|Part|Answer Key|Answers|Ans Key|General Instructions)\b)/gi, "\n\n")
    .replace(/\s+(?=#+\s+)/g, "\n\n")
    .replace(/\s+(?=[A-Ea-e]\s*[-:]\s*)/g, "\n\n")
    .replace(/([^\n])\s+(?=\d{1,2}[.)]\s+)/g, "$1\n\n")
    .replace(/([^\n])\s+(?=\d{1,2}\s+[^\s])/g, "$1\n\n")
    .replace(/([^\n])\s+(?=\([a-dA-D]\)\s+)/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n");
}

export default function AssessmentContentRenderer({
  children,
  className = "",
}: AssessmentContentRendererProps) {
  const formattedContent = formatDenseAssessmentText(children);

  return (
    <MarkdownRenderer
      content={formattedContent}
      className={`assessment-content prose-headings:mb-3 prose-headings:mt-6 prose-li:my-1 prose-p:my-3 ${className}`}
    />
  );
}
