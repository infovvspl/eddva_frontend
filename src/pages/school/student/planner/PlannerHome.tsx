import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Flame, Loader2, PartyPopper, TrendingDown } from "lucide-react";
import { useLearningHome, useMyEngagement } from "@/hooks/use-learning-path";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { cn } from "@/lib/utils";
import { layoutHomeMap, PLANNER_BASE, type MapAction } from "./mind-map-layout";
import { HomeList, MindMapCanvas } from "./RoadmapMindMap";
import { formatMinutes } from "./status";
import { useRoadmapView, ViewToggle } from "./ViewToggle";

const SOURCE_LABEL: Record<string, string> = {
  assessment: "assessments",
  assignment: "assignments",
  game: "games",
  ai_quiz: "AI quizzes",
  ai_quiz_legacy: "AI quizzes",
  ai_assessment: "AI assessments",
};

function StatCard({ icon: Icon, value, label, tone }: { icon: typeof Clock; value: string; label: string; tone: string }) {
  return (
    <div className={cn("rounded-2xl border p-4", tone)}>
      <Icon className="size-4 opacity-80" />
      <p className="mt-2 text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-80">{label}</p>
    </div>
  );
}

/**
 * Planner home: what the AI found weak, how long it will take, and a mind map
 * of each subject's weak chapters and topics. A chapter or topic opens its own
 * roadmap page.
 */
export default function PlannerHome() {
  const navigate = useNavigate();
  const { data: home, isLoading, isError, refetch } = useLearningHome();
  const { data: engagement } = useMyEngagement();
  const [view, setView] = useRoadmapView();
  useActivityTracker({ section: "home" });

  const layout = useMemo(() => layoutHomeMap(home?.mindMap ?? []), [home?.mindMap]);
  const openRoadmap = useCallback(
    (a: MapAction) => {
      if (a.type === "open-chapter-map") navigate(`${PLANNER_BASE}/chapter/${a.chapterId}`);
      else if (a.type === "open-topic-map") navigate(`${PLANNER_BASE}/topic/${a.topicId}`);
    },
    [navigate],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Finding what to work on…
      </div>
    );
  }
  if (isError || !home) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="size-6 text-amber-500" />
        <p className="text-sm text-muted-foreground">Your roadmap could not be loaded.</p>
        <button type="button" onClick={() => refetch()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Try again
        </button>
      </div>
    );
  }

  const { summary, mindMap } = home;
  const sources = Object.entries(summary.detectedFrom ?? {}).filter(([, n]) => n > 0);
  const nothingWeak = layout.nodes.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 pt-14 sm:p-6 lg:pt-6">
      <header>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Your learning roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sources.length
            ? `Found from your ${sources.map(([k, n]) => `${n} ${SOURCE_LABEL[k] ?? k}`).join(", ")}.`
            : "Take assessments, assignments and games and your weak areas will appear here."}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Summary">
        <StatCard icon={TrendingDown} value={String(summary.weakTopics + summary.weakChapters)} label="Weak topics & chapters"
          tone="border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" />
        <StatCard icon={AlertTriangle} value={String(summary.atRiskTopics + (summary.atRiskChapters ?? 0))} label="At-risk topics & chapters"
          tone="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200" />
        <StatCard icon={Clock} value={formatMinutes(summary.studyMinutes)} label="Study time needed"
          tone="border-primary/20 bg-primary/5 text-foreground" />
        <StatCard icon={Flame} value={engagement ? `${formatMinutes(Math.round(engagement.weekSeconds / 60))}` : "–"}
          label={engagement ? `This week · ${engagement.streakDays}-day streak` : "This week"}
          tone="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" />
      </section>

      <section className="flex min-h-[460px] flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Roadmap</h2>
            <p className="text-xs text-muted-foreground">Open a weak chapter or topic to see its roadmap.</p>
          </div>
          <div className="flex items-center gap-2">
            {home.roadmapsPending && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Preparing roadmaps
              </span>
            )}
            {!nothingWeak && <ViewToggle view={view} onChange={setView} />}
          </div>
        </div>

        {nothingWeak ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <PartyPopper className="size-8 text-emerald-500" />
            <p className="mt-3 text-base font-semibold text-foreground">Nothing weak right now</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When an assessment, assignment or game shows a weak chapter or topic, its roadmap appears here.
            </p>
          </div>
        ) : view === "map" ? (
          <div className="flex-1">
            <MindMapCanvas layout={layout} onActivate={openRoadmap} />
          </div>
        ) : (
          <HomeList subjects={mindMap} />
        )}
      </section>

    </div>
  );
}
