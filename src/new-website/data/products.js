// Shared product copy.
// Used by ProductsSection (home page card grid) and ProductsMatrix (the
// alternating full-width rows on /new-website/products).
//
// Artwork lives in `img`. The last product has no illustration supplied yet, so
// it falls back to `Icon`; drop an "Icon 5.png" beside the others, import it
// and set `img` to switch it over.

import { BookOpen } from "lucide-react";
import iconLms   from "../assets/Icon 1.png";
import iconErp   from "../assets/Icon 2.png";
import iconCombo from "../assets/Icon 3.png";
import iconJee   from "../assets/Icon 4.png";

export const products = [
  {
    id: "nw-prod-lms",
    title: "AI-LMS",
    desc: "AI-powered LMS with smart content, assessments, analytics and more.",
    img: iconLms,
    color: "#7c3aed",
    bg: "#faf8ff",
    border: "#ece5fd",
    btn: "#7c3aed",
    btnHover: "#6d28d9",
  },
  {
    id: "nw-prod-erp",
    title: "ERP",
    desc: "Manage academic, administrative & financial operations seamlessly.",
    img: iconErp,
    color: "#16a34a",
    bg: "#f5fbf7",
    border: "#dcf0e3",
    btn: "#16a34a",
    btnHover: "#15803d",
  },
  {
    id: "nw-prod-combo",
    title: "Combo",
    desc: "Get the best of ERP + AI-LMS in one integrated platform.",
    img: iconCombo,
    color: "#2563eb",
    bg: "#f5f9ff",
    border: "#dceafd",
    btn: "#2563eb",
    btnHover: "#1d4ed8",
  },
  {
    id: "nw-prod-jee-ai",
    title: "JEE / NEET\n(AI Model)",
    desc: "AI-driven learning & practice for competitive exam success.",
    img: iconJee,
    color: "#ea580c",
    bg: "#fff8f2",
    border: "#fde5d2",
    btn: "#f97316",
    btnHover: "#ea580c",
  },
  {
    id: "nw-prod-jee-nonai",
    title: "JEE / NEET\n(Non-AI Model)",
    desc: "Structured content & tests for effective exam preparation.",
    Icon: BookOpen,
    color: "#0f766e",
    bg: "#f2fafa",
    border: "#d5eeec",
    btn: "#0f766e",
    btnHover: "#115e59",
  },
];
