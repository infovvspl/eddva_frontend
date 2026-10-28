import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { useLearningHome, useOpenThread } from "@/hooks/use-learning-path";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { apiErrorMessage } from "@/lib/api/learning-path";
import { useSetBreadcrumbLabel } from "@/components/school/breadcrumbs/BreadcrumbContext";
import { cn } from "@/lib/utils";
import { findChapter, findTopic, layoutChapterMap, layoutTopicMap, PLANNER_BASE, type MapAction } from "./mind-map-layout";
import { MindMapCanvas, RoadmapList } from "./RoadmapMindMap";
import { formatMinutes, formatPct, STATUS_STYLE } from "./status";
import { useRoadmapView, ViewToggle } from "./ViewToggle";

/**
 * The roadmap of one weak chapter (all its AI topics and subtopics) or of one
 * weak topic (its AI subtopics). A topic or subtopic opens the topic's chat,
 * where the curved path is. Reads the home data, so it needs no request of its own.
 */
export default function RoadmapPage({ kind }: { kind: "chapter" | "topic" }) {
  const { chapterId = "", topicId = "" } = useParams();
  const navigate = useNavigate();
  const { data: home, isLoading, isError, refetch } = useLearningHome();
  const openThread = useOpenThread();
  const [view, setView] = useRoadmapView();
  // Every topic starts collapsed, same as the home map's subjects; opening one
  // reveals its subtopics, and closing it again returns the map to that exact
  // starting layout.
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => new Set());
  useActivityTracker({ section: "home" });

  const found = useMemo(() => {
    if (!home) return null;
    if (kind === "chapter") {
      const hit = findChapter(home.mindMap, chapterId);
      return hit?.chapter.expanded ? { ...hit, topic: null } : null;
    }
    return findTopic(home.mindMap, topicId);
  }, [home, kind, chapterId, topicId]);

  const layout = useMemo(() => {
    if (!found) return null;
    return found.topic ? layoutTopicMap(found.topic) : layoutChapterMap(found.chapter, expandedTopics);
  }, [found, expandedTopics]);

  const title = found ? (found.topic ? found.topic.name : found.chapter.name) : null;
  useSetBreadcrumbLabel(title);

  const openTopic = useCallback(
    (id: string) => {
      if (openThread.isPending) return;
      openThread.mutate(
        { topicId: id },
        {
          onSuccess: (v) => navigate(`${PLANNER_BASE}/t/${v.thread.id}`),
          onError: (err) => toast.error(apiErrorMessage(err, "Could not open this topic. Please try again.")),
        },
      );
    },
    [navigate, openThread],
  );
  const openSubtopic = useCallback(
    (id: string) => {
      if (openThread.isPending) return;
      openThread.mutate(
        { subtopicId: id },
        {
          onSuccess: (v) => navigate(`${PLANNER_BASE}/t/${v.thread.id}`),
          onError: (err) => toast.error(apiErrorMessage(err, "Could not open this subtopic. Please try again.")),
        },
      );
    },
    [navigate, openThread],
  );
  const activate = useCallback((a: MapAction) => {
    if (a.type === "open-topic") openTopic(a.topicId);
    else if (a.type === "open-subtopic") openSubtopic(a.subtopicId);
  }, [openTopic, openSubtopic]);
  const toggle = useCallback((id: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const back = (
    <Link to={PLANNER_BASE} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> My roadmap
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading your roadmap…
      </div>
    );
  }
  if (isError || !home) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="size-6 text-amber-500" />
        <p className="text-sm text-muted-foreground">This roadmap could not be loaded.</p>
        <button type="button" onClick={() => refetch()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
      </div>
    );
  }
  if (!found || !layout) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-base font-semibold text-foreground">This {kind} is no longer on your roadmap</p>
        <p className="max-w-sm text-sm text-muted-foreground">It is not weak any more, or your latest results moved it. Your chats on it are still in the list of chats.</p>
        {back}
      </div>
    );
  }

  const { subject, chapter, topic } = found;
  const status = topic ? topic.status : chapter.status;
  const mastery = topic ? topic.mastery : chapter.mastery;
  const minutes = topic ? topic.estMinutes : chapter.estMinutes;
  const pending = topic ? topic.roadmapState === "pending" : chapter.roadmapState === "pending";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 pt-14 sm:p-6 lg:pt-6">
      <div>{back}</div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {[subject.name, topic ? chapter.name : null, topic ? "Topic roadmap" : "Chapter roadmap"].filter(Boolean).join(" · ")}
          </p>
          <h1 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("rounded-full border px-2.5 py-0.5 font-medium", STATUS_STYLE[status].chip)}>{STATUS_STYLE[status].label}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">Mastery {formatPct(mastery)}</span>
            {minutes > 0 && <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">Study time {formatMinutes(minutes)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {topic && !pending && !topic.subtopics.length && (
            <button type="button" onClick={() => openTopic(topic.topicId)} disabled={openThread.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {openThread.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {topic.thread ? "Continue learning" : "Start learning"}
            </button>
          )}
          {!pending && <ViewToggle view={view} onChange={setView} />}
        </div>
      </header>

      {pending ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <p className="font-medium text-foreground">Preparing your roadmap…</p>
          <p>The AI is laying out the {topic ? "subtopics" : "topics and subtopics"}. This page updates by itself.</p>
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {topic ? "Open the topic or a subtopic to start its learning path." : "Open a topic or a subtopic to start its learning path."}
          </p>
          {view === "map" ? (
            <div className="relative min-h-0 flex-1">
              <MindMapCanvas layout={layout} onActivate={activate} onToggle={topic ? undefined : toggle} large />
              {openThread.isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Opening your learning path…
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RoadmapList chapter={topic ? undefined : chapter} topic={topic ?? undefined} onOpenTopic={openTopic} onOpenSubtopic={openSubtopic} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
