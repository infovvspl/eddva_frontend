import React from "react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdvancedMetricCardProps {
  label: string;
  value: string | number;
  trend?: "improving" | "declining" | "stable";
  status?: "red" | "yellow" | "green";
  tooltip?: string;
  icon?: React.ReactNode;
  subValue?: string;
}

export function AdvancedMetricCard({
  label,
  value,
  trend,
  status,
  tooltip,
  icon,
  subValue,
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
    <div className={`card-surface p-4 border transition-all duration-300 ${status ? statusColors[status] : "border-border hover:border-primary/30"}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {trend && trendIcons[trend]}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
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
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
          {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
        </div>
      </div>
    </div>
  );
}
