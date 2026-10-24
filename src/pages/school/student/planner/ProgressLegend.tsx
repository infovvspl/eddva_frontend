import { cn } from "@/lib/utils";
import { PROGRESS_STYLE } from "./status";

/** What the node colours mean: not started, in progress, completed. */
export function ProgressLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-nowrap items-center gap-2.5 whitespace-nowrap text-[11px] text-muted-foreground", className)} aria-label="Colour key">
      {(["not_started", "in_progress", "completed"] as const).map((p) => (
        <li key={p} className="inline-flex shrink-0 items-center gap-1">
          <span className={cn("size-2.5 rounded-full", PROGRESS_STYLE[p].swatch)} aria-hidden />
          {PROGRESS_STYLE[p].label}
        </li>
      ))}
    </ul>
  );
}
