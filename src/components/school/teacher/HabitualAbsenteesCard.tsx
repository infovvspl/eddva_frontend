import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { habitualAbsenteesApi } from "@/lib/api/habitual-absentees";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function classLabel(a: { className: string | null; sectionName: string | null }) {
  if (!a.className) return null;
  return a.sectionName ? `${a.className} - ${a.sectionName}` : a.className;
}

/**
 * Students in the teacher's own sections who are habitual absentees: 3+
 * absences, or a 3+ day absence streak, in the last 30 days — not just a
 * flat attendance-% snapshot, which a sparse history can keep looking fine.
 */
export default function HabitualAbsenteesCard({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-habitual-absentees", 30],
    queryFn: () => habitualAbsenteesApi.list(30),
    staleTime: 5 * 60_000,
  });

  if (isError) return null;

  return (
    <div className={cn("flex w-full flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm", className)} aria-label="Habitual absentees">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-600">
          <AlertTriangle className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Habitual Absentees</p>
          <p className="text-[11px] font-medium text-muted-foreground">Last 30 days</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-3 text-xs font-medium text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          No habitual absentees right now.
        </div>
      ) : (
        <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {data.map((a) => (
            <li
              key={a.userId}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/school/teacher/students/${a.userId}`)}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 hover:border-amber-200 hover:bg-amber-50/60"
            >
              {a.avatar ? (
                <img src={a.avatar} alt="" className="size-7 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {initials(a.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{a.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {[classLabel(a), `${a.attendancePercentage}% present`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {a.currentStreak >= 3 ? `${a.currentStreak}d streak` : `${a.absences} absences`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
