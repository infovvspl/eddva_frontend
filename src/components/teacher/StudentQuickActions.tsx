import React from "react";
import { 
  Send, 
  BookPlus, 
  CalendarClock, 
  RefreshCcw, 
  MessageCircle,
  TrendingUp,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StudentQuickActionsProps {
  studentId: string;
  batchId: string;
  studentName?: string;
  insights?: {
    riskStatus: string;
    topWeakTopics: string[];
  };
}

export function StudentQuickActions({ 
  studentId, 
  batchId, 
  studentName,
  insights 
}: StudentQuickActionsProps) {
  
  const handleAction = (label: string) => {
    toast.success(`${label} initiated for ${studentName || "Student"}`);
  };

  return (
    <div className="card-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Teacher Interventions</h3>
        <Badge variant="outline" className="text-[10px] uppercase">Active Batch</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="justify-start gap-2 h-11 border-primary/20 hover:border-primary/50 hover:bg-primary/5 group"
          onClick={() => handleAction("Assign Practice")}
        >
          <BookPlus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">Assign Practice</p>
            <p className="text-[10px] text-muted-foreground">Focus on weak topics</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-2 h-11 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 group"
          onClick={() => handleAction("Send Reminder")}
        >
          <Send className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">Send Reminder</p>
            <p className="text-[10px] text-muted-foreground">Ping via WhatsApp/App</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-2 h-11 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5 group"
          onClick={() => handleAction("Schedule Session")}
        >
          <CalendarClock className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">Schedule Doubt</p>
            <p className="text-[10px] text-muted-foreground">1-on-1 session</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-2 h-11 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5 group"
          onClick={() => handleAction("Regenerate Plan")}
        >
          <RefreshCcw className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">Regenerate Plan</p>
            <p className="text-[10px] text-muted-foreground">Auto-optimize path</p>
          </div>
        </Button>
      </div>

      {insights && insights.topWeakTopics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Priority Topics to Assign</p>
          <div className="flex flex-wrap gap-2">
            {insights.topWeakTopics.map((topic, i) => (
              <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[10px] py-1 px-2">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
