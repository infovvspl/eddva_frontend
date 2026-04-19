import { useMemo } from "react";
import { Lightbulb, PlayCircle, ClipboardList, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type RecType = "lecture" | "test";

interface Recommendation {
  id: string;
  type: RecType;
  title: string;
  subject: string;
  reason: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface WeakTopicRec {
  topicId: string;
  topicName: string;
  subjectName?: string;
  accuracy: number;
  severity: string;
}

interface RecommendationsProps {
  weakTopics?: WeakTopicRec[];
}

function severityToDifficulty(s: string): "Easy" | "Medium" | "Hard" {
  const x = (s || "").toLowerCase();
  if (x === "critical" || x === "high") return "Hard";
  if (x === "low") return "Easy";
  return "Medium";
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Hard:   "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const SUBJECT_COLOR: Record<string, string> = {
  Biology:   "text-emerald-600",
  Chemistry: "text-violet-600",
  Physics:   "text-sky-600",
};

export default function Recommendations({ weakTopics }: RecommendationsProps) {
  const navigate = useNavigate();

  const items: Recommendation[] = useMemo(() => {
    if (!weakTopics?.length) return [];
    return weakTopics.slice(0, 4).map((w) => {
      const difficulty = severityToDifficulty(w.severity);
      const subject = w.subjectName?.trim() || "Your course";
      return {
        id: w.topicId || w.topicName,
        type: "test" as const,
        title: w.topicName,
        subject,
        reason: `Accuracy ${Math.round(w.accuracy)}% — needs practice`,
        difficulty,
      };
    });
  }, [weakTopics]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">No weak topics yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Keep practicing — we will highlight topics to revise here from your quiz and test performance.
        </p>
        <button
          type="button"
          onClick={() => navigate("/student/learn")}
          className="mt-4 text-xs font-bold text-primary hover:underline"
        >
          Go to Learn
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((rec) => (
        <div
          key={rec.id}
          className="group flex gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
          onClick={() => navigate(rec.type === "lecture" ? "/student/lectures" : "/student/learn")}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", rec.type === "lecture" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" : "bg-orange-100 text-orange-600 dark:bg-orange-900/30")}>
            {rec.type === "lecture" ? <PlayCircle className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{rec.title}</p>
            <p className={cn("text-xs font-semibold mt-0.5", SUBJECT_COLOR[rec.subject] || "text-muted-foreground")}>{rec.subject}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Lightbulb className="w-3 h-3" /> {rec.reason}
              </span>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", DIFFICULTY_COLOR[rec.difficulty])}>
                {rec.difficulty}
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
