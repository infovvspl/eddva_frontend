import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardGlassProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: string;
  style?: React.CSSProperties;
}

export const CardGlass = ({ children, className, onClick, glow, style }: CardGlassProps) => (
  <motion.div 
    whileHover={onClick ? { y: -2, scale: 1.005 } : {}}
    whileTap={onClick ? { scale: 0.995 } : {}}
    onClick={onClick}
    className={cn(
      "bg-white/30 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] relative overflow-hidden transition-all duration-500",
      onClick ? "cursor-pointer" : "",
      className
    )}
    style={{ 
      ...(glow ? { boxShadow: `inset 0 0 20px ${glow}, 0 8px 32px 0_rgba(31,38,135,0.07)` } : {}), 
      ...style 
    }}
  >
    {children}
  </motion.div>
);
