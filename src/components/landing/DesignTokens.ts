import React from "react";

/* ── Tokens ── */
export const B  = "#3B82F6";  // Soft Blue
export const P  = "#8B5CF6";  // Soft Purple
export const T  = "#10B981";  // Soft Emerald
export const IN = "#6366F1";  // Indigo

/* ── Typography Scale (Home Page Match) ── */
export const TYPO = {
  h1: "text-[clamp(2.5rem,3.1vw+1.6rem,3.85rem)] font-extrabold leading-[1.05] tracking-tight",
  h2: "text-[clamp(2rem,1.5vw+1.5rem,2.8rem)] font-extrabold tracking-tight leading-[1.1]",
  p: "text-[16px] font-medium leading-relaxed text-gray-500",
  cardTitle: "text-[clamp(1.125rem,0.5vw+1rem,1.35rem)] font-extrabold tracking-tight leading-tight",
  label: "text-[11px] font-black uppercase tracking-[0.12em] text-blue-600",
  small: "text-[12px] font-bold text-gray-400 uppercase tracking-widest",
};

/* ── Shared Gradients ── */
export const grad  = (a = B, b = P) => `linear-gradient(135deg, ${a}, ${b})`;
export const gText = (a = B, b = P) => ({
  background: grad(a, b),
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
} as React.CSSProperties);

/* ── Aero Backgrounds ── */
export const G = grad(B, P);
export const SG = "linear-gradient(160deg, #F0F7FF 0%, #F5F3FF 50%, #F0FDFA 100%)";
export const BG_AERO = "radial-gradient(at 0% 0%, #f0f7ff 0px, transparent 50%), radial-gradient(at 100% 0%, #f5f3ff 0px, transparent 50%), radial-gradient(at 100% 100%, #f0fdfa 0px, transparent 50%), radial-gradient(at 0% 100%, #eff6ff 0px, transparent 50%)";
export const BG_STUDIO = "linear-gradient(180deg, #f8faff 0%, #ffffff 100%)";
export const BG_GLASS = "rgba(255, 255, 255, 0.7)";
export const NEURAL_BG = "radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.05) 1px, transparent 0)";
export const SHADOW_PREMIUM = "0 20px 50px rgba(0, 0, 0, 0.08)";
