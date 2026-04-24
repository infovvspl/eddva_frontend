const PRESET_EXAM_TARGETS = ["jee", "neet", "both"] as const;
const PRESET_CLASSES = ["9", "10", "11", "12", "dropper"] as const;

export const BATCH_EXAM_TARGET_OPTIONS = [
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "custom", label: "Custom" },
] as const;

export const BATCH_CLASS_OPTIONS = [
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
  { value: "dropper", label: "Dropper" },
  { value: "custom", label: "Custom" },
] as const;

export const KNOWN_BATCH_EXAM_TARGETS = [...PRESET_EXAM_TARGETS];
export const KNOWN_BATCH_CLASSES = [...PRESET_CLASSES];

function compactWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeBatchExamTargetInput(value: string) {
  const cleaned = compactWhitespace(value);
  if (!cleaned) return "";

  const lowered = cleaned.toLowerCase();
  return PRESET_EXAM_TARGETS.includes(lowered as (typeof PRESET_EXAM_TARGETS)[number]) ? lowered : cleaned;
}

export function normalizeBatchClassInput(value: string) {
  const cleaned = compactWhitespace(value);
  if (!cleaned) return "";

  const lowered = cleaned.toLowerCase();
  return PRESET_CLASSES.includes(lowered as (typeof PRESET_CLASSES)[number]) ? lowered : cleaned;
}

export function resolveBatchExamTargetFormState(value?: string | null) {
  const normalized = normalizeBatchExamTargetInput(value ?? "");
  if (!normalized) {
    return { selected: "jee", custom: "" };
  }

  if (KNOWN_BATCH_EXAM_TARGETS.includes(normalized as (typeof KNOWN_BATCH_EXAM_TARGETS)[number])) {
    return { selected: normalized, custom: "" };
  }

  return { selected: "custom", custom: normalized };
}

export function resolveBatchClassFormState(value?: string | null) {
  const normalized = normalizeBatchClassInput(value ?? "");
  if (!normalized) {
    return { selected: "11", custom: "" };
  }

  if (KNOWN_BATCH_CLASSES.includes(normalized as (typeof KNOWN_BATCH_CLASSES)[number])) {
    return { selected: normalized, custom: "" };
  }

  return { selected: "custom", custom: normalized };
}

export function formatBatchClassLabel(value?: string | null) {
  const normalized = normalizeBatchClassInput(value ?? "");
  if (!normalized) return "Class";
  if (normalized.toLowerCase() === "dropper") return "Dropper";
  if (/^\d+$/.test(normalized)) return `Class ${normalized}`;
  return normalized;
}

export function formatBatchExamTargetLabel(value?: string | null) {
  const normalized = normalizeBatchExamTargetInput(value ?? "");
  if (!normalized) return "Course";
  if (normalized === "jee") return "JEE";
  if (normalized === "neet") return "NEET";
  return normalized;
}
