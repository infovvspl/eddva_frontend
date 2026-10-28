import type { CSSProperties } from "react";
import { BookOpen, Check, ClipboardCheck, Lock, PlayCircle, SkipForward, Target, X } from "lucide-react";
import type { StepKind, ThreadRound, ThreadStep } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";
import { PATH_WIDTH, pathGeometry } from "./curved-path-geometry";
import { ProgressLegend } from "./ProgressLegend";
import { GLOW_COLOR, glowDelay, QUIZ_PASS_THRESHOLD, STEP_LABEL } from "./status";

const ICON: Record<StepKind, typeof BookOpen> = {
  videos: PlayCircle,
  notes: BookOpen,
  quiz: Target,
  assessment: ClipboardCheck,
};

interface CurvedPathProps {
  rounds: ThreadRound[];
  currentStepId: string | null;
  onSelect: (step: ThreadStep) => void;
}

/** The learning path of one chat: videos -> notes -> quiz -> assessment, round after round. */
export function CurvedPath({ rounds, currentStepId, onSelect }: CurvedPathProps) {
  const g = pathGeometry(rounds);
  const steps = new Map(rounds.flatMap((r) => r.steps).map((s) => [s.id, s]));
  return (
    <div className="mx-auto flex flex-col items-center">
    <ProgressLegend className="mb-2" />
    <div className="relative" style={{ width: PATH_WIDTH, height: g.height }}>
      <svg className="absolute inset-0" width={PATH_WIDTH} height={g.height} aria-hidden>
        {g.segments.map((s, i) => (
          <path key={i} d={s.d} fill="none" strokeLinecap="round" strokeWidth={s.reached ? 5 : 4}
            className={s.reached ? "stroke-primary" : "stroke-border"} strokeDasharray={s.reached ? undefined : "2 9"}
          />
        ))}
        {/* A light gliding along each line, one line after another down the path (see .planner-path-light). */}
        {g.segments.map((s, i) => (
          <path key={`light-${i}`} d={s.d} strokeWidth={s.reached ? 3 : 2.5}
            className={cn("planner-path-light", s.reached ? "planner-path-light--reached" : "planner-path-light--ahead")}
            style={{ "--planner-flow-delay": `${(i * 0.9).toFixed(2)}s` } as CSSProperties}
          />
        ))}
      </svg>

      {g.separators.map((sep) => (
        <div key={sep.round} className="absolute inset-x-0 px-2 text-center" style={{ top: sep.y }}>
          <p className="truncate rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
            title={sep.focusConcepts.join(", ")}
          >
            Round {sep.round}{sep.focusConcepts.length ? ` · ${sep.focusConcepts.slice(0, 2).join(", ")}${sep.focusConcepts.length > 2 ? "…" : ""}` : ""}
          </p>
        </div>
      ))}

      {g.points.map((p) => {
        const step = steps.get(p.stepId)!;
        // A graded quiz or assessment that came back below the pass mark turns red instead of green.
        const failed =
          p.status === "done" && (p.kind === "quiz" || p.kind === "assessment") &&
          step.accuracy != null && step.accuracy < QUIZ_PASS_THRESHOLD;
        const Icon = failed ? X : p.status === "done" ? Check : p.status === "locked" ? Lock : p.status === "skipped" ? SkipForward : ICON[p.kind];
        const openable = p.status === "active" || p.status === "done";
        // In progress once the step has been opened (the video, the notes or the questions).
        const started = p.status === "active" && (!!step.opened || !!step.refId || step.watchedCount > 0);
        const current = p.stepId === currentStepId;
        const label = `${STEP_LABEL[p.kind]} · ${failed ? "failed, done" : p.status === "done" ? "done" : p.status === "locked" ? "locked" : p.status === "skipped" ? "replaced by the round below" : started ? "in progress" : "open, not started"}`;
        return (
          <div key={p.stepId} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: p.x, top: p.y }}>
            <button
              type="button"
              disabled={!openable}
              onClick={() => onSelect(step)}
              aria-label={label}
              aria-current={current ? "step" : undefined}
              title={label}
              style={{
                // The travelling light: red failed, green done, blue opened, grey locked or skipped, blue otherwise.
                "--planner-glow":
                  failed ? GLOW_COLOR.weak
                    : p.status === "done" ? GLOW_COLOR.completed
                      : started ? GLOW_COLOR.in_progress : p.status === "active" ? GLOW_COLOR.default : GLOW_COLOR.locked,
                "--planner-glow-delay": glowDelay(p.stepId),
              } as CSSProperties}
              className={cn(
                "planner-glow flex size-12 items-center justify-center rounded-full border-4 shadow-sm transition-transform",
                // Same light tints as the mind maps (no solid fills): red failed, green completed, blue opened, grey locked.
                failed && "border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
                p.status === "done" && !failed && "border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                started && "border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
                p.status === "active" && !started && "border-border bg-card text-foreground",
                p.status === "locked" && "border-border bg-muted text-muted-foreground",
                p.status === "skipped" && "border-border bg-muted text-muted-foreground opacity-60",
                openable && "hover:scale-105",
                current && "ring-4 ring-slate-300 dark:ring-slate-600",
              )}
            >
              <Icon className="size-5" />
            </button>
            <span className={cn("mt-1 whitespace-nowrap text-[11px] font-medium", p.status === "locked" || p.status === "skipped" ? "text-muted-foreground" : "text-foreground")}>
              {STEP_LABEL[p.kind]}
            </span>
          </div>
        );
      })}
    </div>
    </div>
  );
}
