export function cleanAiNotesContent(input: string): string {
  if (!input) return "";

  return String(input)
    .replace(/\\n/g, "\n")
    .replace(/```+/g, " ")
    .replace(/\$(.*?)\$/gs, (_m, inner) =>
      String(inner)
        .replace(/\\text\s*\{([^}]*)\}/g, "$1")
        .replace(/\\pi/g, "pi")
        .replace(/\\times/g, " x ")
        .replace(/\\gt/g, ">")
        .replace(/\\lt/g, "<")
        .replace(/\\geq?/g, ">=")
        .replace(/\\leq?/g, "<=")
        .trim(),
    )
    .replace(/\\text\s*\{([^}]*)\}/g, "$1")
    .replace(/<\/?(?:noise|music|silence|pause|speaker\s*\d+|babble|cough|laugh(?:ter)?|applause|breath|sneeze)[^>]*\/?>/gi, "")
    .replace(/\[(?:silence|music|noise|speaker \d+|pause|babble|cough|laughter|applause|breath|sneeze)\]/gi, "")
    .replace(/([^\n])\s*(#{1,4} )/g, "$1\n\n$2")
    .replace(/([^\n])\s*(\* |- |\d+\. )/g, "$1\n$2")
    .replace(/\bXB\s*=\s*1\s+XA\b/gi, "XB = 1 - XA")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
