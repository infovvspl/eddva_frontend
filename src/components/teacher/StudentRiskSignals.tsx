import React from "react";
import { AlertCircle, AlertTriangle, Info, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RiskSignal } from "@/lib/api/teacher";

interface StudentRiskSignalsProps {
  signals: RiskSignal[];
  studentName?: string;
}

export function StudentRiskSignals({ signals, studentName }: StudentRiskSignalsProps) {
  if (signals.length === 0) return null;

  const sortedSignals = [...signals].sort((a, b) => {
    const priority = { critical: 0, warning: 1, info: 2 };
    return priority[a.type] - priority[b.type];
  });

  const getSignalConfig = (type: RiskSignal["type"]) => {
    switch (type) {
      case "critical":
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          color: "border-red-500/50 bg-red-500/5 text-red-700 dark:text-red-400",
          badge: "bg-red-500 text-white",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          color: "border-yellow-500/50 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400",
          badge: "bg-yellow-500 text-black",
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          color: "border-blue-500/50 bg-blue-500/5 text-blue-700 dark:text-blue-400",
          badge: "bg-blue-500 text-white",
        };
    }
  };

  const topSignal = sortedSignals[0];
  const topConfig = getSignalConfig(topSignal.type);

  return (
    <div className="space-y-4">
      {/* Top Banner for Critical/Warning */}
      {(topSignal.type === "critical" || topSignal.type === "warning") && (
        <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-pulse-subtle ${topConfig.color}`}>
          <div className="p-2 rounded-full bg-white/10">{topConfig.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={topConfig.badge}>{topSignal.type.toUpperCase()}</Badge>
              <span className="font-bold text-sm">Action Required</span>
            </div>
            <p className="text-sm font-medium">
              {studentName || "Student"} is showing {topSignal.label.toLowerCase()} behaviors.
            </p>
          </div>
        </div>
      )}

      {/* Signal List */}
      <div className="grid gap-3">
        {sortedSignals.map((signal) => {
          const config = getSignalConfig(signal.type);
          return (
            <div
              key={signal.id}
              className="card-surface p-4 flex items-start gap-4 hover:border-primary/20 transition-all group"
            >
              <div className="mt-1">{config.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {signal.label}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(signal.detectedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {signal.description}
                </p>
              </div>
              <button className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                <Bell className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
