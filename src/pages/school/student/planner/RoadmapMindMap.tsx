import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { Link } from "react-router-dom";
import ReactFlow, { Background, ControlButton, Controls, Handle, Position, useNodesInitialized, useReactFlow, useStore, type Edge, type Node, type NodeProps } from "reactflow";
import "reactflow/dist/style.css";
import { BookOpen, ChevronDown, ChevronRight, Loader2, Maximize2, MessageCircle, Minimize2, Sparkles, UserRound } from "lucide-react";
import type { ChapterNode, SubjectNode, TopicNode } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";
import { homeHeadings, PLANNER_BASE, type MapAction, type MapLayout, type MapNode } from "./mind-map-layout";
import { ProgressLegend } from "./ProgressLegend";
import { GLOW_COLOR, glowDelay, PROGRESS_STYLE, STATUS_STYLE, THREAD_STATUS_LABEL } from "./status";

const EDGE_COLOR: Record<string, string> = {
  weak: "#f43f5e",
  at_risk: "#f59e0b",
  ok: "#0ea5e9",
  mastered: "#10b981",
};

const SIDES = [
  ["top", Position.Top],
  ["bottom", Position.Bottom],
  ["left", Position.Left],
  ["right", Position.Right],
] as const;

// `onToggle` is pre-bound per node (to its own key, id and current expanded
// state) by MindMapCanvas, so every caller — the card, the corner arrow —
// takes no arguments and automatically records the right kind of focus fit.
type MindNodeData = MapNode & { onActivate: (a: MapAction) => void; onToggle?: () => void; large?: boolean };

const MindNode = memo(function MindNode({ data }: NodeProps<MindNodeData>) {
  const style = data.status ? STATUS_STYLE[data.status] : null;
  const canToggle = !!data.expandable && !!data.onToggle && data.toggleKey !== undefined;
  // A node with its own action (open a topic) keeps that as the card's main click,
  // with the corner arrow as the one thing that expands/collapses it. A node with no
  // action of its own (a home-map subject) has nothing else to lose: the whole card
  // becomes the toggle, exactly like clicking a node to open its branches in focus.
  const toggleWholeCard = canToggle && data.action.type === "none";
  const clickable = data.action.type !== "none" || toggleWholeCard;
  const activate = () => (toggleWholeCard ? data.onToggle?.() : data.onActivate(data.action));
  const content = (
    <>
      {/* Every side can take an edge; the layout says which one each edge uses. */}
      {SIDES.map(([id, pos]) => (
        <Handle key={`t-${id}`} id={id} type="target" position={pos} className="!size-1.5 !border-0 !bg-transparent" />
      ))}
      {SIDES.map(([id, pos]) => (
        <Handle key={`s-${id}`} id={id} type="source" position={pos} className="!size-1.5 !border-0 !bg-transparent" />
      ))}
      {/* Centred: an icon or status dot beside the name, the detail and chat badge under it. */}
      <div className="flex flex-col items-center text-center">
        <div className="flex max-w-full items-center justify-center gap-2">
          {data.kind === "root" && <UserRound className="size-5 shrink-0" />}
          {data.kind === "subject" && <BookOpen className="size-5 shrink-0 text-primary" />}
          {(data.kind === "preparing" || data.pending) && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
          {data.kind === "prerequisite" && <Sparkles className="size-4 shrink-0 text-violet-500" />}
          {style && !data.pending && <span className={cn("size-2.5 shrink-0 rounded-full", style.dot)} aria-hidden />}
          <p
            className={cn(
              "line-clamp-2 break-words font-bold leading-snug",
              data.kind === "subtopic" ? (data.large ? "text-base" : "text-sm") : data.large ? "text-lg" : "text-base",
            )}
            title={data.label}
          >
            {data.label}
          </p>
        </div>
        {(data.detail || style) && data.kind !== "root" && (
          <p
            className={cn("mt-1 line-clamp-2 font-medium text-muted-foreground", data.large ? "text-sm" : "text-xs")}
            title={[style?.label, data.detail].filter(Boolean).join(" · ")}
          >
            {[style?.label, data.detail].filter(Boolean).join(" · ")}
          </p>
        )}
        {data.hasThread && data.threadStatus && (
          <p className={cn("mt-1.5 inline-flex items-center gap-1 font-semibold text-primary", data.large ? "text-sm" : "text-xs")}>
            <MessageCircle className="size-3.5" /> {THREAD_STATUS_LABEL[data.threadStatus]}
          </p>
        )}
      </div>
      {canToggle && (
        toggleWholeCard ? (
          // The whole card is already the toggle (no separate action to protect);
          // this is just the same affordance a topic's corner arrow gives.
          <span aria-hidden className="nodrag absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground">
            {data.expanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
          </span>
        ) : (
          <button
            type="button"
            aria-label={data.expanded ? "Hide subtopics" : "Show subtopics"}
            className="nodrag absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              data.onToggle?.();
            }}
          >
            {data.expanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
          </button>
        )
      )}
    </>
  );
  // The travelling light takes the box's own colour: blue opened, green completed, red weak, yellow at risk.
  const glow =
    data.progress && !data.isRoot && data.progress !== "not_started"
      ? GLOW_COLOR[data.progress]
      : data.status === "weak" || data.status === "at_risk"
        ? GLOW_COLOR[data.status]
        : GLOW_COLOR.default;
  const boxStyle = { width: data.width, "--planner-glow": glow, "--planner-glow-delay": glowDelay(data.id) } as CSSProperties;
  const box = cn(
    "planner-glow relative rounded-2xl border-2 px-4 py-3 shadow-sm text-center text-foreground",
    // Light tints only, no solid fills. "You" is tinted blue. The home map and the top of a
    // chapter or topic map are coloured weak (red) / at risk (yellow); the rest of a chapter or
    // topic map is coloured by progress: white not opened, blue opened, green completed.
    data.kind === "root"
      ? "border-primary/40 bg-primary/10 text-primary"
      : data.progress && !data.isRoot
        ? PROGRESS_STYLE[data.progress].node
        : style?.node ?? "border-border bg-card",
    !data.progress && data.kind === "subject" && "border-primary/30 bg-card",
    data.kind === "preparing" && "border-dashed text-muted-foreground",
    clickable && "cursor-pointer transition-shadow hover:shadow-md hover:ring-2 hover:ring-primary/30",
    canToggle && "px-8", // room for the corner arrow, so the text stays centred
  );
  return clickable ? (
    <div role="button" tabIndex={0} aria-label={toggleWholeCard ? `${data.label}, ${data.expanded ? "hide" : "show"} details` : data.label} className={box} style={boxStyle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
    >
      {content}
    </div>
  ) : (
    <div className={box} style={boxStyle}>{content}</div>
  );
});

const nodeTypes = { mind: MindNode };

// `padding` is the one thing standing between the fitted content and the
// edge of the canvas, so it's kept small — this is a map to read, not a
// poster to frame. `duration`: an animated glide back to the fitted view
// (closing a node back down to the collapsed layout is otherwise an instant,
// easy-to-miss jump).
const FIT = { padding: 0.05, maxZoom: 1.4, duration: 300 } as const;

/** What the next fit should do: zoom into one branch just opened, or (closing one, resizing, entering/leaving full screen) fit everything currently visible. */
type PendingFocus = { type: "expand"; nodeId: string } | null;

/**
 * Keeps the map in view. On first load (and whenever a node is *closed*, the
 * canvas resizes, or full screen is toggled) this fits the whole currently
 * visible tree — closing the last open branch exactly reproduces the initial
 * view. Opening a node is different: fitting to the *whole* (now bigger) tree
 * would shrink everything just to make room, which reads as the map getting
 * smaller right when the student asked to see more — so that one case zooms
 * into just the clicked node and its new children instead, via `pendingFocus`
 * (set synchronously by the click, read and cleared here once the new layout
 * — with those children actually present — has committed).
 */
const MAX_FIT_ATTEMPTS = 30; // ~0.5s at 60fps — generous for a node to finish measuring, short enough to never look stuck

function AutoFit({ layout, refitKey, pendingFocus }: { layout: MapLayout; refitKey?: unknown; pendingFocus: MutableRefObject<PendingFocus> }) {
  const { fitView } = useReactFlow();
  const measured = useNodesInitialized();
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  useEffect(() => {
    if (!measured || !width || !height) return;
    let cancelled = false;
    let frame = 0;
    // fitView returns false (and does nothing) when its target nodes haven't
    // measured yet — true right after any node set change (nodes just added,
    // or just removed and the rest re-centring), not only on expand. A single
    // attempt can land on exactly that transitional render and silently do
    // nothing, leaving the previous — now stale — view on screen. Retry every
    // frame until it actually applies, instead of assuming the first try did.
    const attempt = (n: number) => {
      if (cancelled) return;
      const pending = pendingFocus.current;
      const didFit =
        pending?.type === "expand"
          ? fitView({ ...FIT, nodes: [pending.nodeId, ...layout.edges.filter((e) => e.source === pending.nodeId).map((e) => e.target)].map((id) => ({ id })) })
          : fitView(FIT);
      if (didFit) {
        if (pending) pendingFocus.current = null;
      } else if (n < MAX_FIT_ATTEMPTS) {
        frame = requestAnimationFrame(() => attempt(n + 1));
      }
    };
    frame = requestAnimationFrame(() => attempt(0));
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [measured, width, height, layout, refitKey, pendingFocus, fitView]);
  return null;
}

/**
 * Draws a laid-out mind map. Read-only: nodes are clicked, never dragged.
 * Clicks go through `onNodeClick`: React Flow sets `pointer-events: none` on a
 * node that is neither draggable nor selectable unless the flow has a click
 * handler, so a handler on the node's own content never receives the click.
 */
export function MindMapCanvas({
  layout,
  onActivate,
  onToggle,
  large,
}: {
  layout: MapLayout;
  onActivate: (a: MapAction) => void;
  onToggle?: (key: string) => void;
  /** The chapter/topic roadmap fits far more nodes into the same view than the home
   * map does, so it sits at a lower zoom once fitted — bump the node text up a notch
   * so it reads at roughly the same on-screen size as the home map's. */
  large?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Same full-screen mechanism as the course-content mind map: the browser's
  // own Fullscreen API on the canvas's own element, not a fixed/portalled
  // overlay — so Esc, the OS's own fullscreen chrome, and swipe-to-exit on
  // mobile all work for free, and the canvas really is the only thing on
  // screen. `fullscreenchange` also fires when the browser itself ends
  // fullscreen (Esc, OS gesture), so state here never drifts from reality.
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);
  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // Browser denied full screen; leave the canvas usable in place.
    }
  }, []);

  // Set synchronously by a toggle, read once by AutoFit after the resulting
  // layout commits (see AutoFit's own comment for why expand and collapse need
  // different fits).
  const pendingFocus = useRef<PendingFocus>(null);

  const { nodes, edges } = useMemo(
    () => ({
      nodes: layout.nodes.map<Node<MindNodeData>>((n) => ({
        id: n.id,
        type: "mind",
        position: { x: n.x, y: n.y },
        data: {
          ...n,
          onActivate,
          onToggle: onToggle && n.toggleKey !== undefined
            ? () => {
                pendingFocus.current = n.expanded ? null : { type: "expand", nodeId: n.id };
                onToggle(n.toggleKey!);
              }
            : undefined,
          large,
        },
        draggable: false,
        connectable: false,
        selectable: false,
      })),
      edges: layout.edges.map<Edge>((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: "step", // right-angled connectors
        style: { stroke: (e.status && EDGE_COLOR[e.status]) || "#94a3b8", strokeWidth: 2 },
      })),
    }),
    [layout, onActivate, onToggle, large],
  );
  // A node with no action of its own but something to expand (a home-map
  // subject) toggles on click instead of activating a no-op action — the same
  // "click a node to open its branches in focus" behaviour as the toggle arrow.
  const onNodeClick = useCallback(
    (_: unknown, node: Node<MindNodeData>) => {
      const d = node.data;
      if (d.action.type === "none" && d.expandable && d.onToggle) d.onToggle();
      else onActivate(d.action);
    },
    [onActivate],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-border bg-muted/30 fullscreen:h-screen fullscreen:rounded-none fullscreen:border-0"
      // A Tailwind class here loses the cascade to the `bg-muted/30` utility (both land in
      // the same `@layer utilities`, so source order — not the `fullscreen:` variant — decides,
      // and `!important` didn't survive Tailwind v4's own layering either). An inline style
      // always wins over any stylesheet rule that isn't itself `!important`, so it's the one
      // reliable way to swap the embedded card's translucent tint for a solid background once
      // native full screen has no page behind it to show the black `::backdrop` through.
      style={isFullscreen ? { backgroundColor: "hsl(var(--background))" } : undefined}
    >
      {layout.nodes.some((n) => n.progress && !n.isRoot) && (
        <ProgressLegend className="absolute left-3 top-3 z-10 rounded-lg border border-border bg-card/90 px-2.5 py-1.5 shadow-sm" />
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={FIT}
        minZoom={0.2}
        maxZoom={1.8}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <AutoFit layout={layout} refitKey={isFullscreen} pendingFocus={pendingFocus} />
        <Background gap={24} size={1} />
        {/* Zoom in / zoom out, plus the full-screen toggle standing in for the
            built-in fit-view button — the map already auto-fits on its own, so
            a separate fit button and a separate full-screen button would both
            be redundant. */}
        <Controls position="top-right" showFitView={false} showInteractive={false}>
          <ControlButton type="button" onClick={toggleFullscreen} title={isFullscreen ? "Exit full screen" : "Full screen"} aria-label={isFullscreen ? "Exit full screen" : "View full screen"}>
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  );
}

function StatusChip({ status }: { status: TopicNode["status"] }) {
  return <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_STYLE[status].chip)}>{STATUS_STYLE[status].label}</span>;
}

/** The home map as a list: each subject with its weak chapters and topics, each linking to its roadmap. */
export function HomeList({ subjects }: { subjects: SubjectNode[] }) {
  return (
    <div className="space-y-4">
      {subjects.map((s) => {
        const headings = homeHeadings(s);
        if (!headings.length) return null;
        return (
          <section key={s.subjectId} className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
            <ul className="mt-3 space-y-1.5">
              {headings.map((h) => {
                const chapter = h.kind === "chapter";
                const status = chapter ? h.chapter.status : h.topic!.status;
                const pending = chapter ? h.chapter.roadmapState === "pending" : h.topic!.roadmapState === "pending";
                return (
                  <li key={chapter ? h.chapter.chapterId : h.topic!.topicId}>
                    <Link
                      to={chapter ? `${PLANNER_BASE}/chapter/${h.chapter.chapterId}` : `${PLANNER_BASE}/topic/${h.topic!.topicId}`}
                      className="flex items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-muted"
                    >
                      <span className={cn("size-2 shrink-0 rounded-full", STATUS_STYLE[status].dot)} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{chapter ? h.chapter.name : h.topic!.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{chapter ? "Chapter" : `Topic · ${h.chapter.name}`}</span>
                      </span>
                      {pending ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : <StatusChip status={status} />}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SubtopicList({ topic, onOpenTopic }: { topic: TopicNode; onOpenTopic: (topicId: string, focusSubtopic?: string) => void }) {
  if (!topic.subtopics.length) return null;
  return (
    <ul className="ml-6 mt-1 space-y-0.5">
      {topic.subtopics.map((st) => (
        <li key={st.order}>
          <button
            type="button"
            onClick={() => onOpenTopic(topic.topicId, st.name)}
            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_STYLE[st.status].dot)} aria-hidden />
            <span className="truncate">{st.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** A chapter or topic roadmap as a list: better on a phone and for screen readers. */
export function RoadmapList({ chapter, topic, onOpenTopic }: { chapter?: ChapterNode; topic?: TopicNode; onOpenTopic: (topicId: string, focusSubtopic?: string) => void }) {
  const topics = topic ? [topic] : chapter?.topics ?? [];
  return (
    <ol className="space-y-2 rounded-2xl border border-border bg-card p-4">
      {topics.map((t) => (
        <li key={t.topicId}>
          <button
            type="button"
            disabled={t.roadmapState === "pending"}
            onClick={() => onOpenTopic(t.topicId)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted disabled:cursor-default disabled:opacity-70"
          >
            <span className={cn("size-2 shrink-0 rounded-full", STATUS_STYLE[t.status].dot)} aria-hidden />
            <span className="flex-1 truncate font-medium text-foreground">{!topic && t.order ? `${t.order}. ` : ""}{t.name}</span>
            {t.roadmapState === "pending" ? <Loader2 className="size-3 animate-spin text-muted-foreground" /> : <StatusChip status={t.status} />}
          </button>
          <SubtopicList topic={t} onOpenTopic={onOpenTopic} />
        </li>
      ))}
    </ol>
  );
}
