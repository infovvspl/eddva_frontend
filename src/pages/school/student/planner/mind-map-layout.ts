import type { ChapterNode, MasteryStatus, SubjectNode, SubtopicNode, ThreadStatus, TopicNode } from "@/lib/api/learning-path";

/**
 * Lays out the planner's three mind maps, all top to bottom with right-angled
 * connectors. Pure, so it is unit-tested and independent of the graph library.
 * Positions are each node's top-left corner.
 *
 * All three are complete top-to-bottom trees: one row per level, children
 * side by side under their parent, each parent centred over its children.
 * What stays small is how much of the tree is actually in the layout at
 * once — a subject or a topic with children to show starts collapsed, so
 * only "You" and the next row are there until it is clicked (see
 * `layoutHomeMap`, `layoutChapterMap`'s `collapsedTopics`).
 * - Home: You -> subjects -> each subject's weak chapters and weak topics.
 * - Chapter roadmap: chapter -> its AI topics -> each topic's subtopics.
 * - Topic roadmap: topic -> its AI subtopics.
 */

export type MapNodeKind = "root" | "subject" | "chapter" | "topic" | "subtopic" | "prerequisite" | "preparing";

export type MapAction =
  | { type: "open-topic"; topicId: string; focusSubtopic?: string }
  | { type: "open-chapter-map"; chapterId: string }
  | { type: "open-topic-map"; topicId: string }
  | { type: "none" };

/** How far the student has got: shown as the node's colour on every map and on the curved path. */
export type Progress = "not_started" | "in_progress" | "completed";

/** A topic's progress, from its chat: in progress once the student has opened it, completed once its path is finished. */
export function threadProgress(thread: { status: ThreadStatus } | null | undefined): Progress {
  if (!thread) return "not_started";
  if (thread.status === "completed") return "completed";
  return thread.status === "active" || thread.status === "needs_teacher" ? "in_progress" : "not_started"; // "suggested": not opened yet
}

/**
 * A subtopic's own progress: completed once the student's answers on it are OK
 * or mastered; in progress once answered, or once the student opened the
 * topic's path from it; otherwise not started.
 */
export function subtopicProgress(s: SubtopicNode): Progress {
  if (s.answered) return s.status === "ok" || s.status === "mastered" ? "completed" : "in_progress";
  return s.opened ? "in_progress" : "not_started";
}

/** Progress of a group (a chapter's topics, a subject's chapters and topics): completed when all are, in progress once any has started. */
export function combineProgress(parts: Progress[]): Progress {
  if (!parts.length) return "not_started";
  if (parts.every((p) => p === "completed")) return "completed";
  return parts.some((p) => p !== "not_started") ? "in_progress" : "not_started";
}

export const chapterProgress = (c: ChapterNode): Progress => combineProgress(c.topics.map((t) => threadProgress(t.thread)));

export interface MapNode {
  id: string;
  kind: MapNodeKind;
  label: string;
  x: number;
  y: number;
  width: number;
  status?: MasteryStatus;
  /**
   * Not started, in progress or completed: the node's colour on the chapter and topic maps.
   * Not set on the home map (coloured by weak / at risk) or for a preparing node.
   */
  progress?: Progress;
  /** Short second line: mastery, time, round, counts. */
  detail?: string;
  /** What a click does. */
  action: MapAction;
  threadStatus?: ThreadStatus | null;
  hasThread?: boolean;
  /** Its roadmap is still being generated. */
  pending?: boolean;
  /** The top of its map. On a chapter or topic map it keeps its home-map colour (weak or at risk). */
  isRoot?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  /** The id `onToggle` is called with when this node is expandable — independent of `id` (which carries a kind prefix) and of `action` (a toggle has none). */
  toggleKey?: string;
}

/** Which side of a node an edge leaves or enters. */
export type HandleSide = "top" | "bottom" | "left" | "right";

export interface MapEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: HandleSide;
  targetHandle: HandleSide;
  status?: MasteryStatus;
}

export interface MapLayout {
  nodes: MapNode[];
  edges: MapEdge[];
}

type NodeSpec = Omit<MapNode, "x" | "y" | "width">;

/** Sizes and spacing shared by all three maps. */
export const LAYOUT = {
  /** Box widths; the lowest level is narrower (names wrap to two lines) so a wide chapter stays readable. */
  width: { root: 200, subject: 290, chapter: 330, topic: 310, subtopic: 260, prerequisite: 260, preparing: 280 } as Record<MapNodeKind, number>,
  /** Vertical distance between levels (room for a two-line name, a detail line and a chat badge). */
  levelStep: 190,
  /** Gap between neighbours in a row. */
  siblingGap: 32,
} as const;

const pct = (v: number | null) => (v !== null ? `${Math.round(v)}%` : null);
const mins = (v: number) => (v ? `~${v} min` : null);
const joinDetail = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join(" · ") || undefined;

interface TreeSpec {
  node: NodeSpec;
  children: TreeSpec[];
}

/**
 * Lays a tree out top to bottom: one row per level, children side by side
 * under their parent, the parent centred over them. Each subtree gets a block
 * as wide as its children (or itself, if wider), so neighbouring subtrees
 * never overlap.
 */
function layoutTopDown(root: TreeSpec): MapLayout {
  const out: MapLayout = { nodes: [], edges: [] };
  const widths = new Map<TreeSpec, number>();
  const widthOf = (t: TreeSpec) => LAYOUT.width[t.node.kind];

  const measure = (t: TreeSpec): number => {
    const w = Math.max(widthOf(t), t.children.reduce((sum, c) => sum + measure(c), 0) + Math.max(0, t.children.length - 1) * LAYOUT.siblingGap);
    widths.set(t, w);
    return w;
  };

  const link = (from: MapNode, to: MapNode) =>
    out.edges.push({
      id: `${from.id}->${to.id}`,
      source: from.id,
      target: to.id,
      sourceHandle: "bottom",
      targetHandle: "top",
      status: to.status,
    });

  /** Places a subtree in its block starting at `left`; returns the node so the parent can link to it. */
  const place = (t: TreeSpec, left: number, depth: number): MapNode => {
    const block = widths.get(t)!;
    const width = widthOf(t);
    const y = depth * LAYOUT.levelStep;
    const root = depth === 0 ? { isRoot: true } : {};

    const kidsWidth = t.children.reduce((sum, c) => sum + widths.get(c)!, 0) + Math.max(0, t.children.length - 1) * LAYOUT.siblingGap;
    let cursor = left + (block - kidsWidth) / 2;
    const kids = t.children.map((c) => {
      const placed = place(c, cursor, depth + 1);
      cursor += widths.get(c)! + LAYOUT.siblingGap;
      return placed;
    });
    // Centred over its first and last child (the usual tree look), kept inside its own block.
    const centre = kids.length ? (kids[0].x + kids[0].width / 2 + kids[kids.length - 1].x + kids[kids.length - 1].width / 2) / 2 : left + block / 2;
    const x = Math.min(Math.max(centre - width / 2, left), left + block - width);
    const node: MapNode = { ...t.node, x, y, width, ...root };
    out.nodes.push(node);
    for (const k of kids) link(node, k);
    return node;
  };
  measure(root);
  place(root, 0, 0);
  return out;
}

// ── Home ────────────────────────────────────────────────────────────────────

/** What a subject shows on the home map: weak chapters, and weak topics of chapters that are otherwise fine. */
export function homeHeadings(subject: SubjectNode): { kind: "chapter" | "topic"; chapter: ChapterNode; topic?: TopicNode }[] {
  const out: { kind: "chapter" | "topic"; chapter: ChapterNode; topic?: TopicNode }[] = [];
  for (const c of subject.chapters) {
    if (c.expanded) out.push({ kind: "chapter", chapter: c });
    else for (const t of c.topics) out.push({ kind: "topic", chapter: c, topic: t });
  }
  return out;
}

/**
 * Home map: "You" and its subjects are always shown; a subject's own weak
 * chapters/topics are hidden until it is clicked, like a mind map that opens
 * only the root and the next node, each branch expanding in focus from there.
 * `expandedSubjects` is empty by default (every subject starts collapsed).
 */
export function layoutHomeMap(subjects: SubjectNode[], expandedSubjects: Set<string> = new Set()): MapLayout {
  const shown = subjects.filter((s) => homeHeadings(s).length > 0);
  if (!shown.length) return { nodes: [], edges: [] };
  return layoutTopDown({
    node: { id: "root", kind: "root", label: "You", action: { type: "none" } },
    children: shown.map((s) => {
      const open = expandedSubjects.has(s.subjectId);
      return {
        node: {
          id: `subject-${s.subjectId}`,
          kind: "subject",
          label: s.name,
          detail: joinDetail(s.weakChapters ? `${s.weakChapters} weak` : null, s.atRiskChapters ? `${s.atRiskChapters} at risk` : null),
          action: { type: "none" },
          expandable: true,
          expanded: open,
          toggleKey: s.subjectId,
        },
        children: open ? homeHeadings(s).map((h): TreeSpec => ({ node: headingSpec(h), children: [] })) : [],
      };
    }),
  });
}

function headingSpec(h: ReturnType<typeof homeHeadings>[number]): NodeSpec {
  if (h.kind === "chapter") {
    const c = h.chapter;
    const pending = c.roadmapState === "pending";
    return {
      id: `chapter-${c.chapterId}`,
      kind: "chapter",
      label: c.name,
      status: c.status,
      detail: joinDetail("Chapter", pct(c.mastery), pending ? "Preparing roadmap" : `${c.topics.length} topics`),
      pending,
      action: { type: "open-chapter-map", chapterId: c.chapterId },
    };
  }
  const t = h.topic!;
  return {
    id: `topic-${t.topicId}`,
    kind: "topic",
    label: t.name,
    status: t.status,
    detail: joinDetail(h.chapter.name, pct(t.mastery)),
    pending: t.roadmapState === "pending",
    threadStatus: t.thread?.status ?? null,
    hasThread: !!t.thread,
    action: { type: "open-topic-map", topicId: t.topicId },
  };
}

// ── Chapter and topic roadmaps ──────────────────────────────────────────────

function topicSpec(t: TopicNode, expanded: boolean, numbered: boolean): NodeSpec {
  return {
    id: `topic-${t.topicId}`,
    kind: "topic",
    label: numbered && t.order ? `${t.order}. ${t.name}` : t.name,
    status: t.status,
    detail: joinDetail(
      pct(t.mastery),
      mins(t.estMinutes),
      t.thread ? (t.thread.status === "completed" ? "Done" : `Round ${t.thread.round}`) : null,
    ),
    action: t.roadmapState === "pending" ? { type: "none" } : { type: "open-topic", topicId: t.topicId },
    progress: threadProgress(t.thread),
    threadStatus: t.thread?.status ?? null,
    hasThread: !!t.thread,
    pending: t.roadmapState === "pending",
    expandable: t.roadmapState === "ready" && t.subtopics.length > 0,
    expanded,
    toggleKey: t.topicId,
  };
}

/** A topic's subtopics (unless collapsed), then chats suggested as prerequisites. */
function topicChildren(t: TopicNode, expanded: boolean): NodeSpec[] {
  const items: NodeSpec[] = [];
  if (t.roadmapState === "pending") {
    items.push({ id: `prep-${t.topicId}`, kind: "preparing", label: "Preparing subtopics…", action: { type: "none" } });
  } else if (expanded) {
    for (const s of t.subtopics) {
      items.push({
        id: `sub-${t.topicId}-${s.order}`,
        kind: "subtopic",
        label: s.name,
        status: s.status,
        detail: s.answered ? `${Math.round(s.accuracy ?? 0)}% of ${s.answered}` : undefined,
        progress: subtopicProgress(s),
        action: { type: "open-topic", topicId: t.topicId, focusSubtopic: s.name },
      });
    }
  }
  for (const p of t.children) {
    items.push({
      id: `pre-${p.threadId}`,
      kind: "prerequisite",
      label: p.name || "Earlier topic",
      detail: "Suggested first",
      progress: threadProgress({ status: p.status }),
      threadStatus: p.status,
      action: { type: "open-topic", topicId: p.topicId },
    });
  }
  return items;
}

const leaf = (node: NodeSpec): TreeSpec => ({ node, children: [] });

/**
 * A weak chapter's roadmap: chapter -> its AI topics in teaching order, top to
 * bottom -> each topic's subtopics, in a row under it once that topic is
 * opened. Same as the home map: `expandedTopics` is empty by default (every
 * topic starts collapsed), so only the chapter and its row of topics show
 * until one is clicked — closing it again reproduces that exact starting
 * layout, since the result depends only on which topics are in the set now,
 * not on how it got there.
 *
 * With a third layer to show, clicking a topic opens its subtopics rather
 * than its chat: a subtopic is the thing actually being learned and tested,
 * so the "start learning" click belongs on it, not on the topic that groups
 * them. A topic with nothing to expand into (still preparing, or genuinely
 * no subtopics) keeps its own chat as the click, same as before.
 */
export function layoutChapterMap(chapter: ChapterNode, expandedTopics: Set<string> = new Set()): MapLayout {
  const pending = chapter.roadmapState === "pending";
  const root: NodeSpec = {
    id: `chapter-${chapter.chapterId}`,
    kind: "chapter",
    label: chapter.name,
    status: chapter.status,
    detail: joinDetail(pct(chapter.mastery), mins(chapter.estMinutes)),
    pending,
    progress: chapterProgress(chapter),
    action: { type: "none" },
  };
  if (pending) {
    return layoutTopDown({ node: root, children: [leaf({ id: `prep-${chapter.chapterId}`, kind: "preparing", label: "Preparing your roadmap…", action: { type: "none" } })] });
  }
  return layoutTopDown({
    node: root,
    children: chapter.topics.map((t) => {
      const expanded = expandedTopics.has(t.topicId);
      const spec = topicSpec(t, expanded, true);
      const node = spec.expandable ? { ...spec, action: { type: "none" as const } } : spec;
      return { node, children: topicChildren(t, expanded).map(leaf) };
    }),
  });
}

/** A weak topic's roadmap: topic -> its AI subtopics. */
export function layoutTopicMap(topic: TopicNode): MapLayout {
  return layoutTopDown({ node: topicSpec(topic, true, false), children: topicChildren(topic, true).map(leaf) });
}

// ── Finding a roadmap in the home data ──────────────────────────────────────

export function findChapter(subjects: SubjectNode[], chapterId: string): { subject: SubjectNode; chapter: ChapterNode } | null {
  for (const subject of subjects) for (const chapter of subject.chapters) if (chapter.chapterId === chapterId) return { subject, chapter };
  return null;
}

export function findTopic(
  subjects: SubjectNode[],
  topicId: string,
): { subject: SubjectNode; chapter: ChapterNode; topic: TopicNode } | null {
  for (const subject of subjects)
    for (const chapter of subject.chapters)
      for (const topic of chapter.topics) if (topic.topicId === topicId) return { subject, chapter, topic };
  return null;
}

export const PLANNER_BASE = "/school/student/planner";

/** Where "back to roadmap" goes from a topic's chat: its chapter's roadmap when the chapter is weak, else the topic's own. */
export function roadmapHref(subjects: SubjectNode[] | undefined, chapterId: string | null, topicId: string | null): string {
  if (!subjects) return PLANNER_BASE;
  if (chapterId && findChapter(subjects, chapterId)?.chapter.expanded) return `${PLANNER_BASE}/chapter/${chapterId}`;
  if (topicId && findTopic(subjects, topicId)) return `${PLANNER_BASE}/topic/${topicId}`;
  return PLANNER_BASE;
}
