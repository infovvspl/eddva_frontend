import React from "react";
import { BookOpen, FileText, Sparkles, BarChart3, MessageCircle, HelpCircle, Loader2, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type CourseTabId = "notes" | "transcript" | "quiz" | "overview" | "doubt" | "my_notes" | "questions" | "doubts";

export interface CourseTabInfo {
  id: CourseTabId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: number;
}

interface CourseTabsProps {
  activeTab: CourseTabId;
  onChange: (id: CourseTabId) => void;
  availableTabs: CourseTabId[];
  badges?: Partial<Record<CourseTabId, number>>;
  isLoading?: boolean;
  isDarkTheme?: boolean;
}

const TAB_METADATA: Record<CourseTabId, { label: string; icon: any }> = {
  notes: { label: "AI Notes", icon: BookOpen },
  transcript: { label: "Transcript", icon: FileText },
  quiz: { label: "Quiz", icon: Sparkles },
  overview: { label: "Stats", icon: BarChart3 },
  doubt: { label: "Doubt", icon: MessageCircle },
  my_notes: { label: "My Notes", icon: FileText },
  questions: { label: "Questions", icon: HelpCircle },
  doubts: { label: "Student Doubts", icon: MessagesSquare },
};

export function CourseTabs({
  activeTab,
  onChange,
  availableTabs,
  badges = {},
  isLoading = false,
  isDarkTheme = false,
}: CourseTabsProps) {
  if (isLoading) {
    return (
      <div className="flex h-11 items-center gap-4 px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">Checking features…</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 overflow-x-auto overscroll-x-contain whitespace-nowrap border-b border-slate-100 dark:border-slate-850 px-1 [-webkit-overflow-scrolling:touch] shrink-0 w-full scrollbar-hide">
      {availableTabs.map((tabId) => {
        const meta = TAB_METADATA[tabId];
        if (!meta) return null;
        const Icon = meta.icon;
        const isActive = activeTab === tabId;
        const badge = badges[tabId];

        return (
          <button
            key={tabId}
            type="button"
            onClick={() => onChange(tabId)}
            className={cn(
              "flex flex-1 min-w-max flex-none items-center justify-center gap-1 border-b-2 px-3 py-3 text-[11px] font-poppins font-black transition",
              isActive
                ? isDarkTheme
                  ? "border-blue-600 bg-blue-50/50 text-blue-700 dark:text-blue-400"
                  : "border-blue-600 bg-blue-50/50 text-blue-700"
                : isDarkTheme
                  ? "border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400"
                  : "border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <Icon size={13} className="shrink-0" />
            <span>{meta.label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={cn(
                  "text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1",
                  isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
