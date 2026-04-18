import { CheckCircle2, Circle, AlertCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTodaysPlan } from "@/hooks/use-student";
import type { StudyPlanItem } from "@/lib/api/student";

const STATUS_CONFIG = {
  completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", label: "Done" },
  pending:   { icon: <Circle       className="w-4 h-4" />, color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20",       label: "Pending" },
  skipped:   { icon: <AlertCircle  className="w-4 h-4" />, color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-900/20",        label: "Missed" },
};

const TYPE_COLOR: Record<string, string> = {
  lecture:       "bg-indigo-100 text-indigo-700",
  practice:      "bg-amber-100 text-amber-700",
  mock_test:     "bg-violet-100 text-violet-700",
  battle:        "bg-rose-100 text-rose-700",
  revision:      "bg-teal-100 text-teal-700",
  doubt_session: "bg-sky-100 text-sky-700",
};

const TYPE_LABEL: Record<string, string> = {
  lecture: "Lecture", practice: "Practice", mock_test: "Mock Test",
  battle: "Battle", revision: "Revision", doubt_session: "Doubt",
};

const DUMMY_TASKS: StudyPlanItem[] = [
  { id: "1", type: "lecture",   title: "Human Respiratory System",   estimatedMinutes: 45, status: "completed", refId: "", scheduledDate: "" },
  { id: "2", type: "practice",  title: "Organic Chemistry – Aldehydes", estimatedMinutes: 60, status: "completed", refId: "", scheduledDate: "" },
  { id: "3", type: "mock_test", title: "Laws of Motion – Practice Set",  estimatedMinutes: 30, status: "pending",   refId: "", scheduledDate: "" },
  { id: "4", type: "lecture",   title: "Cell Division Quiz",            estimatedMinutes: 20, status: "pending",   refId: "", scheduledDate: "" },
  { id: "5", type: "revision",  title: "Electrochemistry – Lecture 3",  estimatedMinutes: 50, status: "skipped",   refId: "", scheduledDate: "" },
];

export default function TodayStudyPlan() {
  const navigate = useNavigate();
  const { data: apiTasks } = useTodaysPlan();

  const items = ((apiTasks && apiTasks.length > 0 ? apiTasks : DUMMY_TASKS) as StudyPlanItem[]).slice(0, 5);
  const completed = items.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{completed}/{items.length} tasks done</span>
        <button onClick={() => navigate("/student/study-plan")}
          className="text-primary font-semibold flex items-center gap-0.5 hover:underline">
          Full plan <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {items.map((task) => {
        const cfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
        return (
          <div key={task.id}
            className={cn("flex items-center gap-3 p-3.5 rounded-xl border border-border/50 transition-all",
              task.status === "completed" && "opacity-60", cfg.bg)}>
            <span className={cn("shrink-0", cfg.color)}>{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold text-foreground truncate", task.status === "completed" && "line-through")}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", TYPE_COLOR[task.type] ?? "bg-muted text-muted-foreground")}>
                  {TYPE_LABEL[task.type] ?? task.type}
                </span>
                <span className="text-[10px] text-muted-foreground">{task.estimatedMinutes} min</span>
              </div>
            </div>
            <span className={cn("text-[10px] font-bold shrink-0", cfg.color)}>{cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}
