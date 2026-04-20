import { Brain, BookOpen, ClipboardList, MessageCircleQuestion, CalendarDays, Swords, Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Action {
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
  iconBg: string;
  iconColor: string;
  accent?: boolean;
}

const ACTIONS: Action[] = [
  {
    icon: <Brain className="w-5 h-5" />,
    label: "AI Study",
    description: "Smart guidance",
    route: "/student/study-plan",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    accent: true,
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    label: "Notes",
    description: "Study material",
    route: "/student/learn",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    label: "Practice Questions",
    description: "Start practice",
    route: "/student/quiz",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    icon: <MessageCircleQuestion className="w-5 h-5" />,
    label: "Ask Doubt",
    description: "Get help instantly",
    route: "/student/doubts",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    label: "Calendar",
    description: "Classes & institute events",
    route: "/student/calendar",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    icon: <CalendarDays className="w-5 h-5" />,
    label: "Study Plan",
    description: "View today's plan",
    route: "/student/study-plan",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: <Swords className="w-5 h-5" />,
    label: "Battle Arena",
    description: "Challenge peers",
    route: "/student/battle",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.route)}
          className={cn(
            "group text-left p-4 rounded-2xl border transition-all duration-200 active:scale-[0.99]",
            "bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5",
            action.accent ? "ring-1 ring-violet-200/70 bg-gradient-to-br from-violet-50/70 to-white" : ""
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", action.iconBg, action.iconColor)}>
            {action.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">{action.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{action.description}</p>
          </div>
          <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600">
            Open <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      ))}
    </div>
  );
}
