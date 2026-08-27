import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className,
  gradientFrom = "#f1f5f9", 
  gradientTo = "#f8fafc" 
}: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      "flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-slate-200/60 bg-white/50 backdrop-blur-sm",
      className
    )}
  >
    <div className="relative flex items-center justify-center w-24 h-24 mb-6">
      <div
        className="absolute inset-0 rounded-[2rem] opacity-40 animate-pulse"
        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
      />
      <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: gradientFrom }} />
      <div className="relative z-10 text-slate-400">
        <Icon className="w-10 h-10 text-indigo-500" />
      </div>
    </div>
    
    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
      {title}
    </h3>
    <p className="text-sm font-semibold text-slate-500 max-w-sm mb-6">
      {description}
    </p>
    
    {action && (
      <div className="mt-2">
        {action}
      </div>
    )}
  </motion.div>
);
