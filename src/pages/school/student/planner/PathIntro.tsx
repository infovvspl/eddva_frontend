import { Route } from "lucide-react";
import type { ThreadSummary } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";
import { formatPct } from "./status";

/** What the path is for, shown below the curved path: the steps, and the score before starting. */
export function PathIntro({ thread, className }: { thread: Pick<ThreadSummary, "topicName" | "baselineMastery" | "origin">; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-primary/20 bg-primary/5 p-3", className)}>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Route className="size-4 shrink-0 text-primary" /> Your path for {thread.topicName ?? "this topic"}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Watch the videos, read your AI notes, take the quiz, then the formal assessment. Ask me anything along the way.
        {thread.baselineMastery !== null && <> Your score here before starting: <strong className="text-foreground">{formatPct(thread.baselineMastery)}</strong>.</>}
        {thread.origin === "prerequisite" && <> This topic was suggested because it helps with the one you were studying.</>}
      </p>
    </section>
  );
}
