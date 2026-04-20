import { ClipboardList, MessageCircleQuestion, CalendarDays, Swords, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Action {
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
  gradient: string;
  shadow: string;
}

const ACTIONS: Action[] = [
  {
    icon: <ClipboardList className="w-6 h-6" />,
    label: "Start Test",
    description: "Take a mock test",
    route: "/student/quiz",
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-200 dark:shadow-violet-900/30",
  },
  {
    icon: <MessageCircleQuestion className="w-6 h-6" />,
    label: "Ask Doubt",
    description: "Get help instantly",
    route: "/student/doubts",
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-200 dark:shadow-blue-900/30",
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    label: "Calendar",
    description: "Classes & institute events",
    route: "/student/calendar",
    gradient: "from-cyan-500 to-blue-600",
    shadow: "shadow-cyan-200 dark:shadow-cyan-900/30",
  },
  {
    icon: <CalendarDays className="w-6 h-6" />,
    label: "Study Plan",
    description: "View today's plan",
    route: "/student/study-plan",
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-200 dark:shadow-emerald-900/30",
  },
  {
    icon: <Swords className="w-6 h-6" />,
    label: "Battle Arena",
    description: "Challenge peers",
    route: "/student/battle",
    gradient: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-200 dark:shadow-rose-900/30",
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.route)}
          className={cn(
            "group flex flex-col items-center gap-2 p-5 rounded-2xl text-white shadow-lg",
            "bg-gradient-to-br hover:scale-105 hover:shadow-xl transition-all duration-200 active:scale-95",
            action.gradient, action.shadow
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            {action.icon}
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{action.label}</p>
            <p className="text-[10px] text-white/75 mt-0.5">{action.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
