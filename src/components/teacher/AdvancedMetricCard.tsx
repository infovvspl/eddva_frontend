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
      className={`card-surface p-4 border transition-all duration-300 h-full flex flex-col justify-between ${onClick ? "cursor-pointer" : ""} ${status ? statusColors[status] : "border-border hover:border-primary/30"}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={cn("p-2 rounded-lg", iconClassName || "bg-primary/10 text-primary")}>
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {trend && trendIcons[trend]}
          {tooltip && (
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
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-foreground leading-none">{value}</h3>
          {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
        </div>
      </div>
      {onClick && (
        <div className="mt-3 flex justify-end sm:hidden">
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20 rounded-md px-2 py-0.5 bg-primary/5 hover:bg-primary/10">
            See <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
}
