import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles } from "lucide-react";

/* ─── Scroll-reveal wrapper ─── */
export const FadeUp = ({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
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
export const Label = ({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "purple" | "teal" }) => {
  const styles = {
    blue:   "border-blue-100 bg-blue-50 text-blue-600",
    purple: "border-purple-100 bg-purple-50 text-purple-600",
    teal:   "border-teal-100 bg-teal-50 text-teal-600",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-[12px] font-bold uppercase tracking-widest ${styles[color]}`}>
      <Sparkles className="h-3 w-3" />{children}
    </span>
  );
};
