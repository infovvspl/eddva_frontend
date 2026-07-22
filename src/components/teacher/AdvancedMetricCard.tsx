import React from "react";
import { TrendingUp, TrendingDown, Minus, Info, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AdvancedMetricCardProps {
  label: string;
  value: string | number;
  trend?: "improving" | "declining" | "stable";
  status?: "red" | "yellow" | "green";
  tooltip?: string;
  icon?: React.ReactNode;
  subValue?: string;
  onClick?: () => void;
  iconClassName?: string;
}

export function AdvancedMetricCard({
  label,
  value,
  trend,
  status,
  tooltip,
  icon,
  subValue,
  onClick,
  iconClassName,
}: AdvancedMetricCardProps) {
  const statusColors = {
    red: "text-red-400 border-red-500/30 bg-red-500/5",
    yellow: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
    green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  };

  const trendIcons = {
    improving: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />,
    declining: <TrendingDown className="w-3.5 h-3.5 text-red-500" />,
    stable: <Minus className="w-3.5 h-3.5 text-blue-500" />,
  };

  return (
    <div
      onClick={onClick}
      className={`card-surface p-3 sm:p-4 border transition-all duration-300 h-full flex flex-col justify-between ${onClick ? "cursor-pointer" : ""} ${status ? statusColors[status] : "border-border hover:border-primary/30"}`}
    >
      <div className="flex justify-between items-start mb-2 sm:mb-2">
        <div className="flex items-center gap-2 sm:block">
          <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", iconClassName || "bg-primary/10 text-primary")}>
            {icon}
          </div>
          {/* Label text placed beside the icon on mobile, hidden on desktop */}
          <p className="text-[10px] sm:hidden text-slate-500 font-bold uppercase tracking-wider leading-tight">
            {label}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {trend && trendIcons[trend]}
          {tooltip && (
            <div className="hidden sm:block">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground opacity-50 hover:opacity-100" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Label text below icon, visible on desktop only */}
        <p className="hidden sm:block text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
          {label}
        </p>

        {/* Value & Inline "See" Badge */}
        <div className="flex items-center justify-between sm:items-baseline sm:justify-start gap-2">
          <h3 className="text-base sm:text-xl font-bold text-foreground leading-none">{value}</h3>
          {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}

          {/* Inline "See" badge next to value on mobile only */}
          {onClick && (
            <span className="sm:hidden inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-primary border border-primary/20 rounded-lg px-1.5 py-0.5 bg-primary/5 hover:bg-primary/10">
              See <ChevronRight className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
