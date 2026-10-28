import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cake, PartyPopper } from "lucide-react";
import { birthdaysApi, birthdaySubtitle } from "@/lib/api/birthdays";
import { cn } from "@/lib/utils";

function daysLeftLabel(daysLeft: number) {
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  return `in ${daysLeft}d`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Slowly auto-scrolls `ref`'s content, pausing while the pointer is over it, looping back to the top at the bottom. */
function useAutoScroll(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let paused = false;
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    const id = window.setInterval(() => {
      if (paused) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += 1;
      }
    }, 40);
    return () => {
      window.clearInterval(id);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, enabled]);
}

/**
 * A compact, auto-scrolling "Upcoming Birthdays" card for a dashboard's side
 * column — matches the Notices/Today's Schedule side-card pattern rather
 * than taking a full-width banner. Shows the next `days` (default 7),
 * scoped server-side to what the signed-in user should see — admins see the
 * whole institute, teachers see their own students plus staff, students see
 * their classmates, section teachers and admins.
 */
export default function BirthdayWidget({ days = 7, className }: { days?: number; className?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["school-birthdays", days],
    queryFn: () => birthdaysApi.upcoming(days),
    staleTime: 5 * 60_000,
  });
  const listRef = useRef<HTMLUListElement>(null);
  useAutoScroll(listRef, (data?.length ?? 0) > 3);

  if (isError) return null;

  return (
    <div className={cn("flex w-full flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm", className)} aria-label="Upcoming birthdays">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 text-pink-600">
          <Cake className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Upcoming Birthdays</p>
          <p className="text-[11px] font-medium text-muted-foreground">Next {days} days</p>
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
          <PartyPopper className="size-4 shrink-0 text-pink-500" />
          No birthdays in the next {days} days.
        </div>
      ) : (
        <ul ref={listRef} className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {data.map((b) => (
            <li
              key={b.userId}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-1.5",
                b.isToday ? "border-pink-300 bg-pink-50" : "border-border/60 bg-background/60",
              )}
            >
              {b.avatar ? (
                <img src={b.avatar} alt="" className="size-7 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {initials(b.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{b.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{birthdaySubtitle(b)}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  b.isToday ? "bg-pink-500 text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {daysLeftLabel(b.daysLeft)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
