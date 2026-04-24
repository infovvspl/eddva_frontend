import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles } from "lucide-react";

import { B, P } from "./DesignTokens";

/* ─── Floating animated badge ─── */
export const HeroBadge = ({
  icon, label, value, color, bg, drift = -8, delay = 0, className = "",
}: { icon: React.ReactNode; label: string; value: string; color: string; bg: string; drift?: number; delay?: number; className?: string }) => (
  <motion.div
    animate={{ y: [0, drift, 0] }}
    transition={{ duration: 3 + delay, repeat: Infinity, ease: "easeInOut" as const, delay }}
    className={`flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white px-3.5 py-2.5 shadow-xl backdrop-blur-sm ${className}`}>
    <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: bg }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-[14px] font-extrabold text-gray-900">{value}</p>
    </div>
  </motion.div>
);

/* ─── Scroll-reveal wrapper ─── */
export const FadeUp = ({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2, margin: "0px 0px -48px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}>
      {children}
    </motion.div>
  );
};

/* ─── Section label pill ─── */
export const Label = ({ children, color = B }: { children: React.ReactNode; color?: string }) => {
  const isPreset = ["blue", "purple", "teal"].includes(color);
  const styles: Record<string, string> = {
    blue:   "border-blue-100 bg-blue-50 text-blue-600",
    purple: "border-purple-100 bg-purple-50 text-purple-600",
    teal:   "border-teal-100 bg-teal-50 text-teal-600",
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-[16px] font-bold uppercase tracking-widest ${isPreset ? styles[color] : ""}`}
      style={!isPreset ? { background: color + "14", color, border: `1px solid ${color}30` } : {}}
    >
      <Sparkles className="h-3 w-3" />{children}
    </span>
  );
};
