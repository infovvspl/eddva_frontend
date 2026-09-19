// blogCategoryStyle.js — accent icon/colour per blog category.
//
// Posts used to carry their own Icon/color/bg; now that /blog reads live
// posts from the admin-managed backend (which has no notion of a lucide
// icon), the accent is looked up by category instead so every post —
// static fallback or backend — renders consistently without needing art.

import { BrainCircuit, GraduationCap, Landmark, Newspaper } from "lucide-react";

const categoryStyle = {
  "AI in Education":   { Icon: BrainCircuit,  color: "#7c3aed", bg: "#faf8ff" },
  "Exam Prep":         { Icon: GraduationCap, color: "#0f766e", bg: "#f2fafa" },
  "School Management": { Icon: Landmark,      color: "#16a34a", bg: "#f5fbf7" },
  "Product Updates":   { Icon: Newspaper,      color: "#2563eb", bg: "#f5f9ff" },
};

const defaultStyle = { Icon: Newspaper, color: "#1a56db", bg: "#eaf1fd" };

export const getCategoryStyle = category => categoryStyle[category] || defaultStyle;
