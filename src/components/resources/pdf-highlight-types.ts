export type PdfHighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum HighlightCategory {
  CONCEPT = "concept",
  EXAM = "exam",
  EXAMPLE = "example",
  REVISE = "revise",
  MUST_KNOW = "must_know",
  TEACHER_NOTE = "teacher_note",
}

export type PdfHighlight = {
  id: string;
  pageNumber: number;
  selectedText: string;
  rects: PdfHighlightRect[];
  createdBy?: string;
  createdByRole?: string;
  color?: string;
  category?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface ActiveHighlightSelection {
  pageNumber: number;
  pendingRects: PdfHighlightRect[];
  pendingText: string;
  toolbarPos: { x: number; y: number };
}

export const HIGHLIGHT_CATEGORIES = [
  { id: HighlightCategory.CONCEPT, label: "Concept", icon: "Y", hex: "#FDE047", bg: "bg-yellow-400" },
  { id: HighlightCategory.EXAM, label: "Exam", icon: "G", hex: "#86EFAC", bg: "bg-green-400" },
  { id: HighlightCategory.EXAMPLE, label: "Example", icon: "B", hex: "#93C5FD", bg: "bg-blue-400" },
  { id: HighlightCategory.REVISE, label: "Revise", icon: "O", hex: "#FDBA74", bg: "bg-orange-400" },
  { id: HighlightCategory.MUST_KNOW, label: "Must Know", icon: "R", hex: "#FCA5A5", bg: "bg-red-400" },
  { id: HighlightCategory.TEACHER_NOTE, label: "Teacher Note", icon: "N", hex: "#C4B5FD", bg: "bg-purple-400" },
];
