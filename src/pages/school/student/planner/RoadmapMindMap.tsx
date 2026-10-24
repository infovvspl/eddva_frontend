import { memo, useCallback, useEffect, useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import ReactFlow, { Background, Controls, Handle, Position, useNodesInitialized, useReactFlow, useStore, type Edge, type Node, type NodeProps } from "reactflow";
import "reactflow/dist/style.css";
import { BookOpen, ChevronDown, ChevronRight, Loader2, MessageCircle, Sparkles, UserRound } from "lucide-react";
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

type MindNodeData = MapNode & { onActivate: (a: MapAction) => void; onToggle?: (topicId: string) => void };

const MindNode = memo(function MindNode({ data }: NodeProps<MindNodeData>) {
  const style = data.status ? STATUS_STYLE[data.status] : null;
  const clickable = data.action.type !== "none";
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
        <div className="flex max-w-full items-center justify-center gap-1.5">
          {data.kind === "root" && <UserRound className="size-4 shrink-0" />}
          {data.kind === "subject" && <BookOpen className="size-4 shrink-0 text-primary" />}
          {(data.kind === "preparing" || data.pending) && <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />}
          {data.kind === "prerequisite" && <Sparkles className="size-3.5 shrink-0 text-violet-500" />}
          {style && !data.pending && <span className={cn("size-2 shrink-0 rounded-full", style.dot)} aria-hidden />}
          <p className={cn("line-clamp-2 break-words font-semibold leading-tight", data.kind === "subtopic" ? "text-xs" : "text-[13px]")} title={data.label}>
            {data.label}
          </p>
        </div>
        {(data.detail || style) && data.kind !== "root" && (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground" title={[style?.label, data.detail].filter(Boolean).join(" · ")}>
            {[style?.label, data.detail].filter(Boolean).join(" · ")}
          </p>
        )}
        {data.hasThread && data.threadStatus && (
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
            <MessageCircle className="size-3" /> {THREAD_STATUS_LABEL[data.threadStatus]}
          </p>
        )}
      </div>
      {data.expandable && data.onToggle && data.action.type === "open-topic" && (
        <button
          type="button"
          aria-label={data.expanded ? "Hide subtopics" : "Show subtopics"}
          className="nodrag absolute right-1 top-1 rounded p-0.5 text-muted-foreground hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            if (data.action.type === "open-topic") data.onToggle?.(data.action.topicId);
          }}
        >
          {data.expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
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
    "planner-glow relative rounded-xl border px-3 py-2 shadow-sm text-center text-foreground",
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
    data.expandable && data.onToggle && "px-6", // room for the corner arrow, so the text stays centred
  );
  return clickable ? (
    <div role="button" tabIndex={0} aria-label={data.label} className={box} style={boxStyle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          data.onActivate(data.action);
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

const FIT = { padding: 0.15, maxZoom: 1 } as const;

/**
 * Keeps the map centred and fully in view. React Flow's `fitView` prop fits
 * once, at start-up, which can be before the nodes are measured or the panel
 * has its final size; this fits again once the nodes are measured, whenever
 * the map changes, and whenever the canvas is resized.
 */
function AutoFit({ layout }: { layout: MapLayout }) {
  const { fitView } = useReactFlow();
  const measured = useNodesInitialized();
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  useEffect(() => {
    if (!measured || !width || !height) return;
    const frame = requestAnimationFrame(() => fitView(FIT));
    return () => cancelAnimationFrame(frame);
  }, [measured, width, height, layout, fitView]);
  return null;
}

/**
 * Draws a laid-out mind map. Read-only: nodes are clicked, never dragged.
 * Clicks go through `onNodeClick`: React Flow sets `pointer-events: none` on a
 * node that is neither draggable nor selectable unless the flow has a click
 * handler, so a handler on the node's own content never receives the click.
 */
export function MindMapCanvas({ layout, onActivate, onToggle }: { layout: MapLayout; onActivate: (a: MapAction) => void; onToggle?: (topicId: string) => void }) {
  const { nodes, edges } = useMemo(
    () => ({
      nodes: layout.nodes.map<Node<MindNodeData>>((n) => ({
        id: n.id,
        type: "mind",
        position: { x: n.x, y: n.y },
        data: { ...n, onActivate, onToggle },
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
        style: { stroke: (e.status && EDGE_COLOR[e.status]) || "#94a3b8", strokeWidth: 1.5 },
      })),
    }),
    [layout, onActivate, onToggle],
  );
  const onNodeClick = useCallback((_: unknown, node: Node<MindNodeData>) => onActivate(node.data.action), [onActivate]);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-muted/30">
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
        maxZoom={1.5}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <AutoFit layout={layout} />
        <Background gap={24} size={1} />
        <Controls showInteractive={false} />
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
