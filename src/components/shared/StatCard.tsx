import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatCardData } from "@/lib/types";

const colorMap = {
  primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  success: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  warning: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
  ai: { bg: "bg-ai/10", text: "text-ai", border: "border-ai/20" },
  info: { bg: "bg-info/10", text: "text-info", border: "border-info/20" },
};

export const StatCard = ({ label, value, trend, icon: Icon, color }: StatCardData) => {
  const c = colorMap[color];
  return (
    <div className={cn("card-surface p-5 flex flex-col gap-3", `border-l-2`, c.border)}>
      <div className="flex items-center justify-between">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", c.bg)}>
          <Icon className={cn("w-4.5 h-4.5", c.text)} />
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
};
