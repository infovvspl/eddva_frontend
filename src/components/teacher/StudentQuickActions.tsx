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
    <div className="card-surface p-6 space-y-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
      
      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-base font-bold text-foreground tracking-tight">Teacher Interventions</h3>
        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-muted/50 border-none px-2 py-0.5">
          Active Batch
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 relative z-10">
        <Button 
          variant="outline" 
          className="justify-start gap-4 h-16 rounded-[1.25rem] border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group shadow-sm"
          onClick={() => handleAction("Assign Practice")}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <BookPlus className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[13px] font-black leading-tight text-slate-900">Assign Practice</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">Focus on weak topics</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-4 h-16 rounded-[1.25rem] border-emerald-500/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-300 group shadow-sm"
          onClick={() => handleAction("Send Reminder")}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Send className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[13px] font-black leading-tight text-slate-900">Send Reminder</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">Ping via WhatsApp/App</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-4 h-16 rounded-[1.25rem] border-purple-500/10 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-300 group shadow-sm"
          onClick={() => handleAction("Schedule Session")}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[13px] font-black leading-tight text-slate-900">Schedule Doubt</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">1-on-1 session</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-4 h-16 rounded-[1.25rem] border-orange-500/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all duration-300 group shadow-sm"
          onClick={() => handleAction("Regenerate Plan")}
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <RefreshCcw className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[13px] font-black leading-tight text-slate-900">Regenerate Plan</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">Auto-optimize path</p>
          </div>
        </Button>
      </div>

      {insights && insights.topWeakTopics.length > 0 && (
        <div className="mt-2 pt-6 border-t border-border/50 relative z-10">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Priority Topics to Assign</p>
          <div className="flex flex-wrap gap-2">
            {insights.topWeakTopics.map((topic, i) => (
              <Badge key={i} variant="secondary" className="bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold py-1 px-3 rounded-full transition-colors cursor-default">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
