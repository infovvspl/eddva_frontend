import { BookOpen, PlayCircle, ClipboardList, Target, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stat {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
  iconBg: string;
}

interface StatsGridProps {
  coursesEnrolled: number;
  pendingLectures: number;
  testsAttempted: number;
  accuracy: number;
  streak: number;
}

export default function StatsGrid({ coursesEnrolled, pendingLectures, testsAttempted, accuracy, streak }: StatsGridProps) {
  const stats: Stat[] = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: "Courses Enrolled",
      value: coursesEnrolled,
      gradient: "from-violet-500/10 to-purple-500/5",
      iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    },
    {
      icon: <PlayCircle className="w-5 h-5" />,
      label: "Pending Lectures",
      value: pendingLectures,
      gradient: "from-blue-500/10 to-sky-500/5",
      iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    },
    {
      icon: <ClipboardList className="w-5 h-5" />,
      label: "Tests Attempted",
      value: testsAttempted,
      gradient: "from-emerald-500/10 to-teal-500/5",
      iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: "Accuracy",
      value: `${accuracy}%`,
      gradient: "from-orange-500/10 to-amber-500/5",
      iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
    },
    {
      icon: <Flame className="w-5 h-5" />,
      label: "Day Streak",
      value: streak,
      sub: streak > 0 ? "Keep it up! 🔥" : "Start today!",
      gradient: "from-rose-500/10 to-pink-500/5",
      iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn(
            "relative rounded-2xl p-5 border border-border/50 bg-gradient-to-br shadow-sm",
            "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default",
            s.gradient
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.iconBg)}>
            {s.icon}
          </div>
          <p className="text-2xl font-black text-foreground">{s.value}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">{s.label}</p>
          {s.sub && <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}
