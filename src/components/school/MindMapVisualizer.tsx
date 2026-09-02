import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Expand, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

type MindMapNode = {
  label: string;
  children?: MindMapNode[];
};

export type LayoutMode = 'org' | 'hybrid';

type MindMapCanvasProps = {
  data: MindMapNode | null;
  height?: number | string;
  // Controlled tab state -- omit both to let the component manage its own
  // 'org'/'hybrid' toggle internally (the default, used by every existing
  // caller). Provide both when a host page wants to render that toggle
  // itself elsewhere (see `hideToggle`) instead of in its usual spot here.
  mode?: LayoutMode;
  onModeChange?: (mode: LayoutMode) => void;
  // Suppresses the built-in Org Chart/Hybrid Tree toggle row -- only
  // meaningful alongside a controlled `mode`, when a host page is rendering
  // its own toggle UI instead.
  hideToggle?: boolean;
};

// Imperative handle for host pages that need to trigger an action on the
// canvas from outside (e.g. a "Download" button in a page header). Both
// actions always render the complete tree (every node expanded), regardless
// of whatever is currently collapsed/panned/zoomed on screen -- a download
// or printout is a document, not a screenshot of the current interaction state.
export type MindMapCanvasHandle = {
  exportPNG: (filenameBase?: string) => void;
  printMindmap: (filenameBase?: string) => void;
};
// How a node's connector should be drawn: 'elbow' -- the existing right-angle
// bracket (org chart default, and hybrid branches); 'straight' -- a direct
// diagonal line from `connectorFrom` (hybrid root-to-branch only);
// 'stackTick' -- a short curved segment from the stack's shared vertical
// spine (`spineX`) into this leaf (hybrid leaf stacks only) -- the spine
// itself is drawn once per stack, not per leaf, so it never has to cross
// through another leaf's card the way an independent line per leaf would.
type ConnectorType = 'elbow' | 'straight' | 'stackTick';

interface LayoutNode {
  node: MindMapNode;
  depth: number;
  w: number;
  h: number;
  parent: LayoutNode | null;
  children: LayoutNode[];
  subtreeWidth: number;
  x: number;
  y: number;
  connector: ConnectorType;
  connectorFrom: LayoutNode | null;
  // Hybrid-only bookkeeping (unused by the org layout): the leaf children of
  // this node that render as a vertical stack instead of their own columns,
  // and (on each of those leaves) the x of the shared spine they tick off of.
  leafStack?: LayoutNode[];
  spineX?: number;
}

// ── Layout constants (top-down organisational chart) ──────────────
const MARGIN_X = 28;
const MARGIN_Y = 28;
// Hard floor for manual zoom-out (pinch/scroll), so a user can always zoom out
// to see a huge tree in full if they choose to.
const MIN_K = 0.05;
const MAX_K = 3;
// Floor used by the initial auto-fit — keeps node text legible by refusing to
// shrink past this scale even if that means the tree overflows the container
// (it's pannable). See `fit()`.
const READABLE_MIN_K = 0.85;
// Fixed screen-space gap between the viewport's top edge and the root card,
// independent of zoom -- keeps the root pinned at the top on fit instead of
// vertically centered.
const TOP_PAD = 24;

const DEPTH_FILL = ['#2563eb', '#0f766e', '#8b5cf6', '#db2777', '#ea580c'];

// Tree depth is now dynamic (no fixed number of levels), so a 5-color palette
// alone would repeat past depth 4. Once the curated colors run out, generate
// further hues via the golden angle -- keeps every extra level visually
// distinct instead of collapsing onto the last curated color.
function depthColor(depth: number): string {
  if (depth < DEPTH_FILL.length) return DEPTH_FILL[depth];
  const hue = (depth * 137.508) % 360;
  return `hsl(${hue.toFixed(0)}, 62%, 42%)`;
}

// Focus-based sizing: the root reads as a large, prominent card and each
// level shrinks from there, instead of every node -- root through the
// deepest leaf -- rendering at identical visual weight. Shared between the
// hidden measurement pass and the actual render so measured size always
// matches what's drawn.
function cardStyleForDepth(depth: number, hasChildren: boolean) {
  const isRoot = depth === 0;
  const fontSize = isRoot ? 34 : depth === 1 ? 25 : depth === 2 ? 22 : 19;
  const padX = isRoot ? 46 : depth === 1 ? 34 : depth === 2 ? 30 : 26;
  const padY = isRoot ? 32 : depth === 1 ? 24 : depth === 2 ? 21 : 19;
  const minWidth = isRoot ? 280 : depth === 1 ? 220 : depth === 2 ? 200 : 180;
  const maxWidth = isRoot ? 500 : depth === 1 ? 400 : depth === 2 ? 360 : 320;
  const fontWeight = isRoot ? 800 : hasChildren ? 600 : 500;
  return { fontSize, padX, padY, minWidth, maxWidth, fontWeight };
}

const ROW_GAP = 140; // vertical gap between depth rows
const SIB_GAP = 20; // horizontal gap between sibling subtrees

function layoutTree(
  root: MindMapNode,
  sizes: Map<MindMapNode, {w: number, h: number}>,
  collapsed: Set<MindMapNode>,
): { nodes: LayoutNode[]; totalWidth: number; totalHeight: number; maxDepth: number } {
  let maxDepth = 0;
  const depthHeights = new Map<number, number>();

  const buildTree = (n: MindMapNode, depth: number, parent: LayoutNode | null): LayoutNode => {
    maxDepth = Math.max(maxDepth, depth);
    const measured = sizes.get(n) || { w: 140, h: 46 };
    // Small safety margin over the raw measured size -- an invisible
    // off-screen measurement pass and the actual on-screen foreignObject
    // render can drift by a few px (font hinting/rounding), and a box even
    // slightly too short lets text visibly spill past its top/bottom edge.
    const size = { w: measured.w + 4, h: measured.h + 8 };
    depthHeights.set(depth, Math.max(depthHeights.get(depth) || 0, size.h));
    const lnode: LayoutNode = {
      node: n, depth, w: size.w, h: size.h, parent, children: [], subtreeWidth: 0, x: 0, y: 0,
      connector: 'elbow', connectorFrom: parent,
    };
    // A collapsed node's children are excluded from layout entirely (not just
    // visually hidden) -- that's what keeps a bushy tree from sprawling until
    // the branch is actually expanded.
    const kids = collapsed.has(n) ? [] : (n.children || []);
    lnode.children = kids.map(c => buildTree(c, depth + 1, lnode));

    const childrenW = lnode.children.reduce((sum, c) => sum + c.subtreeWidth, 0) + Math.max(0, lnode.children.length - 1) * SIB_GAP;
    lnode.subtreeWidth = Math.max(lnode.w, childrenW);
    return lnode;
  };

  const rootLNode = buildTree(root, 0, null);

  // Row 0 (root) is centered on its own children block, so its y is assigned
  // below along with everyone else, keyed purely by depth.
  const rowY: number[] = [];
  let cumY = 0;
  for (let d = 0; d <= maxDepth; d++) {
    const h = depthHeights.get(d) || 46;
    rowY[d] = cumY + h / 2;
    cumY += h + ROW_GAP;
  }

  const assignX = (lnode: LayoutNode, leftEdge: number) => {
    const childrenW = lnode.children.reduce((sum, c) => sum + c.subtreeWidth, 0) + Math.max(0, lnode.children.length - 1) * SIB_GAP;
    let cursor = leftEdge + (lnode.subtreeWidth - childrenW) / 2;
    for (const c of lnode.children) {
      assignX(c, cursor);
      cursor += c.subtreeWidth + SIB_GAP;
    }
    lnode.x = leftEdge + lnode.subtreeWidth / 2;
    lnode.y = rowY[lnode.depth];
  };
  assignX(rootLNode, 0);

  const allNodes: LayoutNode[] = [];
  const collect = (n: LayoutNode) => {
    allNodes.push(n);
    n.children.forEach(collect);
  };
  collect(rootLNode);

  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  allNodes.forEach(n => {
    minX = Math.min(minX, n.x - n.w / 2);
    maxX = Math.max(maxX, n.x + n.w / 2);
    minY = Math.min(minY, n.y - n.h / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  });

  const shiftX = Math.abs(minX) + MARGIN_X;
  const shiftY = Math.abs(minY) + MARGIN_Y;
  allNodes.forEach(n => {
    n.x += shiftX;
    n.y += shiftY;
  });

  const totalWidth = maxX - minX + MARGIN_X * 2;
  const totalHeight = maxY - minY + MARGIN_Y * 2;

  return { nodes: allNodes, totalWidth, totalHeight, maxDepth };
}

// Vertical gap between one stacked leaf card and the next (hybrid layout).
const LEAF_STACK_GAP = 14;
// Length of the tick connecting the stack's shared vertical spine to each
// leaf card's left edge (hybrid layout).
const STACK_TICK_LEN = 22;
// Extra breathing room reserved to the right of a leaf stack's column, on
// top of the ordinary sibling gap -- otherwise two adjacent nodes that both
// happen to have their own leaf stack can end up reading as one crowded
// block instead of two clearly separate ones.
const STACK_EXTRA_MARGIN = 24;
// How far right of the parent's exact left edge the spine actually starts --
// enough to clearly read as coming from under the card's body rather than
// its corner (clearing the rounded bottom-left corner, see the card's `rx`,
// is only the floor here).
const STACK_SPINE_INSET = 40;
// Vertical gap from a leaf-stack parent down to its first stacked leaf --
// smaller than the ordinary ROW_GAP used between branch rows, since the
// stack reads as belonging tightly to its parent rather than as a new row.
const LEAF_STACK_ROW_GAP = 60;

// Hybrid layout: root-to-branch (depth 0→1) connects with a straight line.
// From there, a node whose children are ALL leaves stacks them in a narrow,
// left-aligned vertical list with one shared spine dropping from the parent
// and a short curved tick into each leaf, instead of its usual sibling
// columns. Any other node (a single branch child, or a mix of leaf and
// branch children) just uses the org chart's plain right-angle elbow for
// every child -- there's no split-stacking within one node's children.
// Depth-1 nodes are never stacked either way -- they're always the tree's
// main branches and stay spread out.
function layoutHybridTree(
  root: MindMapNode,
  sizes: Map<MindMapNode, {w: number, h: number}>,
  collapsed: Set<MindMapNode>,
): { nodes: LayoutNode[]; totalWidth: number; totalHeight: number; maxDepth: number } {
  let maxDepth = 0;

  const sizeOf = (n: MindMapNode) => {
    const measured = sizes.get(n) || { w: 140, h: 46 };
    return { w: measured.w + 4, h: measured.h + 8 };
  };

  const build = (n: MindMapNode, depth: number, parent: LayoutNode | null): LayoutNode => {
    maxDepth = Math.max(maxDepth, depth);
    const size = sizeOf(n);
    const lnode: LayoutNode = {
      node: n, depth, w: size.w, h: size.h, parent, children: [], subtreeWidth: 0, x: 0, y: 0,
      connector: depth === 0 ? 'elbow' : depth === 1 ? 'straight' : 'elbow',
      connectorFrom: parent,
      leafStack: [],
    };
    // A collapsed node's children are excluded from layout entirely (not just
    // visually hidden), but -- unlike an early return -- execution still falls
    // through to the subtreeWidth calc below, so a collapsed node still claims
    // its own card's width instead of leaving subtreeWidth at its 0 default
    // (which collapsed root's own siblings onto each other).
    const kids = collapsed.has(n) ? [] : (n.children || []);
    // A node switches to the leaf-stack design only when EVERY one of its
    // children is a leaf -- a mix of leaf and branch children (or any single
    // branch child) just uses the plain elbow layout for all of them, same as
    // the org chart, rather than splitting some children into a stack and
    // others into columns.
    const allLeaves = kids.length > 0 && kids.every(c => !c.children || c.children.length === 0);

    if (depth === 0 || !allLeaves) {
      lnode.children = kids.map(c => build(c, depth + 1, lnode));
    } else {
      const leafNodes: LayoutNode[] = kids.map((c): LayoutNode => {
        const s = sizeOf(c);
        return {
          node: c, depth: depth + 1, w: s.w, h: s.h, parent: lnode, children: [], subtreeWidth: s.w, x: 0, y: 0,
          connector: 'stackTick', connectorFrom: lnode,
        };
      });
      lnode.leafStack = leafNodes;
      lnode.children = leafNodes;
    }

    // A leaf-stack node's children never coexist with normal branch columns
    // (the allLeaves check above guarantees one or the other), so its own
    // width is just whichever needs more room from the shared left edge: its
    // own card, or the stack's tick+cards -- both the parent and the stack
    // start flush against that same left edge (see `assign`), rather than
    // the parent centering over a reserved block wider than itself.
    if (lnode.leafStack!.length) {
      const stackW = STACK_SPINE_INSET + STACK_TICK_LEN + Math.max(...lnode.leafStack!.map(l => l.w)) + STACK_EXTRA_MARGIN;
      lnode.subtreeWidth = Math.max(lnode.w, stackW);
    } else {
      const childrenW = lnode.children.reduce((s, c) => s + c.subtreeWidth, 0) + Math.max(0, lnode.children.length - 1) * SIB_GAP;
      lnode.subtreeWidth = Math.max(lnode.w, childrenW);
    }
    return lnode;
  };

  const rootLNode = build(root, 0, null);

  const assign = (lnode: LayoutNode, leftEdge: number, y: number) => {
    lnode.y = y;

    if (lnode.leafStack!.length) {
      // The spine drops from near the parent's own left edge (the parent's
      // card starts flush at `leftEdge`; STACK_SPINE_INSET nudges the line
      // in just far enough to clear the card's rounded bottom-left corner),
      // with each leaf left-aligned to the right of it via a short tick.
      lnode.x = leftEdge + lnode.w / 2;
      const spineX = leftEdge + STACK_SPINE_INSET;
      const boxLeftX = spineX + STACK_TICK_LEN;
      let top = y + lnode.h / 2 + LEAF_STACK_ROW_GAP;
      for (const leaf of lnode.leafStack!) {
        leaf.x = boxLeftX + leaf.w / 2;
        leaf.y = top + leaf.h / 2;
        leaf.spineX = spineX;
        top += leaf.h + LEAF_STACK_GAP;
      }
      return;
    }

    const columns: Array<{ width: number; branch: LayoutNode }> = lnode.children.map(c => ({ width: c.subtreeWidth, branch: c }));
    const totalColumnsW = columns.reduce((s, c) => s + c.width, 0) + Math.max(0, columns.length - 1) * SIB_GAP;
    let cursor = leftEdge + (lnode.subtreeWidth - totalColumnsW) / 2;

    for (const col of columns) {
      assign(col.branch, cursor, y + lnode.h / 2 + ROW_GAP + col.branch.h / 2);
      cursor += col.width + SIB_GAP;
    }
    lnode.x = leftEdge + lnode.subtreeWidth / 2;
  };
  assign(rootLNode, 0, 0);

  const allNodes: LayoutNode[] = [];
  const collect = (n: LayoutNode) => {
    allNodes.push(n);
    n.children.forEach(collect);
  };
  collect(rootLNode);

  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  allNodes.forEach(n => {
    minX = Math.min(minX, n.x - n.w / 2);
    maxX = Math.max(maxX, n.x + n.w / 2);
    minY = Math.min(minY, n.y - n.h / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  });

  const shiftX = Math.abs(minX) + MARGIN_X;
  const shiftY = Math.abs(minY) + MARGIN_Y;
  allNodes.forEach(n => {
    n.x += shiftX;
    n.y += shiftY;
  });

  const totalWidth = maxX - minX + MARGIN_X * 2;
  const totalHeight = maxY - minY + MARGIN_Y * 2;

  return { nodes: allNodes, totalWidth, totalHeight, maxDepth };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Builds a complete, standalone SVG document string for a fully-expanded
// build (call the layout functions with an empty collapsed set) -- mirrors
// the on-screen <svg> markup exactly, but as plain strings rather than JSX,
// so download/print can produce it without mounting anything or waiting on
// a render/layout cycle. It has to inline styling that the live canvas gets
// for free from Tailwind's global preflight (e.g. box-sizing: border-box on
// the foreignObject's div) since this markup is used completely outside the
// app's stylesheet context (rasterized standalone, or opened in a blank
// print window).
function buildFullMindmapSvg(built: { nodes: LayoutNode[]; totalWidth: number; totalHeight: number }): string {
  const w = Math.max(built.totalWidth, 1);
  const h = Math.max(built.totalHeight, 1);
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
  parts.push('<rect width="100%" height="100%" fill="#ffffff" />');

  for (const entry of built.nodes) {
    if (entry.connector === 'stackTick') {
      if (entry.spineX === undefined) continue;
      const x1 = entry.spineX, ty = entry.y, x2 = entry.x - entry.w / 2;
      parts.push(`<path d="M ${x1} ${ty} L ${x2} ${ty}" fill="none" stroke="#000000" stroke-width="1.5" />`);
      continue;
    }
    const src = entry.connectorFrom;
    if (!src) continue;
    const x1 = src.x, y1 = src.y + src.h / 2, x2 = entry.x, y2 = entry.y - entry.h / 2;
    if (entry.connector === 'straight') {
      parts.push(`<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="#000000" stroke-width="1.5" />`);
      continue;
    }
    const my = y1 + ROW_GAP / 2;
    parts.push(`<path d="M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}" fill="none" stroke="#000000" stroke-width="1.5" />`);
  }

  for (const entry of built.nodes) {
    if (!entry.leafStack || !entry.leafStack.length) continue;
    const first = entry.leafStack[0];
    const last = entry.leafStack[entry.leafStack.length - 1];
    if (first.spineX === undefined) continue;
    const y1 = entry.y + entry.h / 2;
    parts.push(`<path d="M ${first.spineX} ${y1} L ${first.spineX} ${last.y}" fill="none" stroke="#000000" stroke-width="1.5" />`);
  }

  for (const entry of built.nodes) {
    const x = entry.x - entry.w / 2, y = entry.y - entry.h / 2;
    const color = depthColor(entry.depth);
    const isRoot = entry.depth === 0;
    const hasChildren = !!entry.node.children && entry.node.children.length > 0;
    const s = cardStyleForDepth(entry.depth, hasChildren);
    const rx = isRoot ? 22 : 12;
    parts.push(`<g transform="translate(${x}, ${y})">`);
    parts.push(`<rect rx="${rx}" ry="${rx}" width="${entry.w}" height="${entry.h}" fill="#f8fafc" stroke="${color}" stroke-width="${isRoot ? 3 : 2}" />`);
    parts.push(`<rect x="0" y="0" width="${entry.w}" height="${isRoot ? 10 : 5}" rx="2" fill="${color}" />`);
    parts.push(`<foreignObject width="${entry.w}" height="${entry.h}">`);
    parts.push(
      `<div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;color:#1e293b;width:100%;height:100%;padding:${s.padY}px ${s.padX}px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-size:${s.fontSize}px;font-weight:${s.fontWeight};line-height:1.4;font-family:inherit;">${escapeXml(entry.node.label)}</div>`,
    );
    parts.push('</foreignObject>');
    parts.push('</g>');
  }

  parts.push('</svg>');
  return parts.join('');
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const MindMapCanvasInner = forwardRef<MindMapCanvasHandle, MindMapCanvasProps & { mode: LayoutMode }>(function MindMapCanvasInner({ data, height = 480, mode }, ref) {
  const heightFallback = typeof height === 'number' ? height : 480;
  const containerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Map<MindMapNode, {w: number, h: number}> | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const drag = useRef<{ ox: number; oy: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<MindMapNode>>(new Set());
  // Auto-fit should only run while a document is first loading in (its size
  // settles across a couple of renders as dimensions get measured and the
  // default collapse state is applied). Once that's done, expanding/collapsing
  // a node must NOT re-trigger it -- otherwise every click shrinks the whole
  // view further to keep fitting more content, instead of the view holding
  // still while the tree grows/shrinks under it.
  const autoFitEnabled = useRef(true);
  const builtRef = useRef<ReturnType<typeof layoutTree> | null>(null);
  // Set only when a node is expanded (not collapsed) -- once its newly
  // revealed children are laid out, if that pushed content below the visible
  // viewport the view pans up just enough to bring it back into view.
  const pendingOverflowCheck = useRef<MindMapNode | null>(null);

  const { flatNodes, nodeDepth } = React.useMemo(() => {
    if (!data) return { flatNodes: [] as MindMapNode[], nodeDepth: new Map<MindMapNode, number>() };
    const list: MindMapNode[] = [];
    const depthMap = new Map<MindMapNode, number>();
    const traverse = (n: MindMapNode, depth: number) => {
      list.push(n);
      depthMap.set(n, depth);
      n.children?.forEach(c => traverse(c, depth + 1));
    };
    traverse(data, 0);
    return { flatNodes: list, nodeDepth: depthMap };
  }, [data]);

  // A fresh mindmap starts with only the root's direct branches visible --
  // everything past that collapses by default so a bushy/deep tree doesn't
  // dump its entire sprawl on screen at once. Click a node to expand it.
  useEffect(() => {
    autoFitEnabled.current = true;
    if (!data) { setCollapsedNodes(new Set()); return; }
    const initial = new Set<MindMapNode>();
    const walk = (n: MindMapNode, depth: number) => {
      if (depth >= 1) initial.add(n);
      n.children?.forEach(c => walk(c, depth + 1));
    };
    walk(data, 0);
    setCollapsedNodes(initial);
  }, [data]);

  const toggleCollapse = useCallback((node: MindMapNode) => {
    // From here on the user is driving the view manually -- don't let the
    // content-size change from this toggle re-trigger an auto-fit. The view
    // itself is left untouched; expanded children simply render below the
    // clicked node, in whatever space the layout already puts them.
    autoFitEnabled.current = false;
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node)) {
        next.delete(node);
        pendingOverflowCheck.current = node;
      } else {
        next.add(node);
      }
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    if (!data || !measureContainerRef.current) return;
    const container = measureContainerRef.current;
    const map = new Map<MindMapNode, {w: number, h: number}>();
    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      map.set(flatNodes[i], { w: el.offsetWidth, h: el.offsetHeight });
    }
    setDimensions(map);
  }, [data, flatNodes]);

  const layoutFn = mode === 'hybrid' ? layoutHybridTree : layoutTree;
  const built = data && dimensions ? layoutFn(data, dimensions, collapsedNodes) : null;
  builtRef.current = built;
  const contentW = built ? Math.max(built.totalWidth, 1) : 1;
  const contentH = built ? Math.max(built.totalHeight, 1) : 1;
  const maxDepth = built ? built.maxDepth : 0;

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || heightFallback;
    const idealK = Math.min(w / contentW, h / contentH);
    // A shallow tree (root plus one level of children, before anything's been
    // expanded further) has few enough nodes to fit fully on screen and stay
    // readable. Past that, fitting to width shrinks text too far, so floor the
    // zoom at READABLE_MIN_K and let the tree overflow horizontally instead
    // (it's pannable/zoomable).
    const k = maxDepth <= 1 ? clamp(idealK, MIN_K, 1.2) : clamp(idealK, READABLE_MIN_K, 1.2);
    // Anchor to the top instead of centering vertically -- the root stays
    // pinned near the top edge and expanding levels grow downward into the
    // space that used to just be blank, instead of the whole tree re-centering.
    setView({ x: (w - contentW * k) / 2, y: TOP_PAD, k });
  }, [contentW, contentH, heightFallback, maxDepth]);

  useLayoutEffect(() => {
    if (autoFitEnabled.current) fit();
  }, [fit]);

  // After an expand click's new layout has committed, nudge the view just
  // enough to bring newly revealed content back within the viewport if it
  // now overflows any edge -- otherwise the view is left exactly as is.
  useLayoutEffect(() => {
    const node = pendingOverflowCheck.current;
    pendingOverflowCheck.current = null;
    const el = containerRef.current;
    const currentBuilt = builtRef.current;
    if (!node || !el || !currentBuilt) return;
    const entry = currentBuilt.nodes.find(n => n.node === node);
    if (!entry) return;

    let minX = entry.x - entry.w / 2, maxX = entry.x + entry.w / 2;
    let maxY = entry.y + entry.h / 2;
    const walk = (n: typeof entry) => {
      n.children.forEach(c => {
        minX = Math.min(minX, c.x - c.w / 2);
        maxX = Math.max(maxX, c.x + c.w / 2);
        maxY = Math.max(maxY, c.y + c.h / 2);
        walk(c);
      });
    };
    walk(entry);

    const w = el.clientWidth || 1;
    const h = el.clientHeight || heightFallback;
    const PAD = 24;
    setView(v => {
      let { x, y, k } = v;

      const bottomOverflow = (y + maxY * k) - (h - PAD);
      if (bottomOverflow > 0) y -= bottomOverflow;

      const rightOverflow = (x + maxX * k) - (w - PAD);
      if (rightOverflow > 0) x -= rightOverflow;

      const leftOverflow = PAD - (x + minX * k);
      if (leftOverflow > 0) x += leftOverflow;

      if (x === v.x && y === v.y) return v;
      return { ...v, x, y };
    });
  }, [collapsedNodes, heightFallback]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
      window.setTimeout(fit, 80);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [fit]);

  const zoomAround = useCallback((factor: number, px: number, py: number) => {
    setView((v) => {
      const k = clamp(v.k * factor, MIN_K, MAX_K);
      const ratio = k / v.k;
      return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio };
    });
  }, []);

  const zoomCenter = (factor: number) => {
    const el = containerRef.current;
    zoomAround(factor, (el?.clientWidth ?? 0) / 2, (el?.clientHeight ?? 0) / 2);
  };

  // Native non-passive wheel listener so preventDefault works (zoom, don't scroll the page).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      zoomAround(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAround, dimensions]);

  // Both actions below render the COMPLETE tree, not whatever's currently
  // expanded/panned/zoomed on screen -- `dimensions` already has every
  // node's measured size (the hidden measurement pass measures the full
  // `data` tree regardless of collapse state), so re-running the layout
  // function with an empty collapsed set is enough to get every node's
  // position without touching the live view or waiting on a render.
  const buildFullSvgString = useCallback(() => {
    if (!data || !dimensions) return null;
    const fullBuilt = layoutFn(data, dimensions, new Set());
    return { svgString: buildFullMindmapSvg(fullBuilt), w: Math.max(fullBuilt.totalWidth, 1), h: Math.max(fullBuilt.totalHeight, 1) };
  }, [data, dimensions, layoutFn]);

  const exportPNG = useCallback((filenameBase?: string) => {
    const full = buildFullSvgString();
    if (!full) return;
    const { svgString, w, h } = full;
    // A download has no fixed physical page to conform to, so the canvas is
    // shaped to match the tree's own aspect ratio exactly instead of a fixed
    // A4 box -- that means it's drawn at plain uniform scale, filling the
    // whole canvas with zero stretch, rather than distorting the tree to
    // fit a page shape it was never going to naturally match. Capped well
    // under browser canvas size limits regardless of how large the tree is.
    const MAX_DIM = 4000;
    const scale = Math.min(MAX_DIM / w, MAX_DIM / h, 3);
    const canvasW = Math.round(w * scale);
    const canvasH = Math.round(h * scale);
    const svgUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(svgUrl);
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvasW, canvasH);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filenameBase || 'mindmap'}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');
    };
    img.onerror = () => URL.revokeObjectURL(svgUrl);
    img.src = svgUrl;
  }, [buildFullSvgString]);

  const printMindmap = useCallback((filenameBase?: string) => {
    const full = buildFullSvgString();
    if (!full) return;
    // Same idea as the download above: rather than forcing the tree into a
    // fixed A4 shape (which always left either blank margin or distortion
    // whenever the tree's own aspect ratio didn't match the page's), the
    // @page size itself is shaped to match the tree's aspect ratio exactly
    // -- so it's drawn at plain uniform scale, filling the page with zero
    // stretch and zero leftover margin to center in. Capped on its longest
    // side so a very large tree still gets a sane physical/PDF page size
    // rather than one many meters long.
    const LONG_SIDE_MM_CAP = 900;
    const MM_TO_PX = 96 / 25.4;
    let pageWmm = full.w / MM_TO_PX;
    let pageHmm = full.h / MM_TO_PX;
    const longestMm = Math.max(pageWmm, pageHmm);
    if (longestMm > LONG_SIDE_MM_CAP) {
      const shrink = LONG_SIDE_MM_CAP / longestMm;
      pageWmm *= shrink;
      pageHmm *= shrink;
    }
    const scale = (pageWmm * MM_TO_PX) / full.w;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><title>${escapeXml(filenameBase || 'Mind Map')}</title><style>` +
      `@page{size:${pageWmm}mm ${pageHmm}mm;margin:0;}` +
      `html,body{margin:0;padding:0;}` +
      `.page{width:${pageWmm * MM_TO_PX}px;height:${pageHmm * MM_TO_PX}px;overflow:hidden;position:relative;}` +
      `.tile{position:absolute;left:0;top:0;width:${full.w}px;height:${full.h}px;transform:scale(${scale});transform-origin:top left;}` +
      `</style></head><body><div class="page"><div class="tile">${full.svgString}</div></div></body></html>`,
    );
    win.document.close();
    window.setTimeout(() => { win.focus(); win.print(); }, 200);
  }, [buildFullSvgString]);

  useImperativeHandle(ref, () => ({ exportPNG, printMindmap }), [exportPNG, printMindmap]);

  if (!data) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
        No mindmap data available.
      </div>
    );
  }

  if (!built || !dimensions) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400 overflow-hidden relative">
        Computing layout...
        <div ref={measureContainerRef} style={{ position: 'absolute', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
          {flatNodes.map((n, i) => {
            const s = cardStyleForDepth(nodeDepth.get(n) ?? 0, !!n.children?.length);
            return (
              <div
                key={i}
                className="text-center"
                style={{
                  width: 'max-content',
                  minWidth: `${s.minWidth}px`,
                  maxWidth: `${s.maxWidth}px`,
                  padding: `${s.padY}px ${s.padX}px`,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                  fontSize: `${s.fontSize}px`,
                  fontWeight: s.fontWeight,
                  lineHeight: '1.4',
                  fontFamily: 'inherit'
                }}
              >
                {n.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { ox: e.clientX - view.x, oy: e.clientY - view.y };
    setGrabbing(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const currentDrag = drag.current;
    if (!currentDrag) return;
    setView((v) => ({ ...v, x: e.clientX - currentDrag.ox, y: e.clientY - currentDrag.oy }));
  };
  const endDrag = () => { drag.current = null; setGrabbing(false); };
  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
      window.setTimeout(fit, 120);
    } catch {
      // Browser denied fullscreen; leave the canvas usable in-place.
    }
  };

  const btn = 'grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50';
  const canvasHeight = isFullscreen ? '100%' : height;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white fullscreen:rounded-none fullscreen:border-0"
      style={{ height: canvasHeight, touchAction: 'none' }}
    >      {/* Zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button type="button" className={btn} onClick={() => zoomCenter(1.2)} title="Zoom in"><ZoomIn size={16} /></button>
        <button type="button" className={btn} onClick={() => zoomCenter(0.8)} title="Zoom out"><ZoomOut size={16} /></button>
        <button type="button" className={btn} onClick={toggleFullscreen} title={isFullscreen ? 'Exit full screen' : 'Full screen'}>
          {isFullscreen ? <Minimize2 size={16} /> : <Expand size={16} />}
        </button>
      </div>

      <svg
        width="100%"
        height="100%"
        style={{ display: 'block', cursor: grabbing ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <g transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
          {built.nodes.map((entry, i) => {
            // Leaf-stack ticks: a short curved segment from the stack's
            // shared spine into this leaf's left edge. The spine itself is
            // drawn once per stack in the pass below, not per leaf, so it
            // never has to run through another leaf's card to reach a deeper
            // one in the same stack.
            if (entry.connector === 'stackTick') {
              if (entry.spineX === undefined) return null;
              const x1 = entry.spineX, ty = entry.y, x2 = entry.x - entry.w / 2;
              return <path key={`tick-${i}`} d={`M ${x1} ${ty} L ${x2} ${ty}`} fill="none" stroke="#000000" strokeWidth="1.5" />;
            }

            const src = entry.connectorFrom;
            if (!src) return null;

            const x1 = src.x;
            const y1 = src.y + src.h / 2;
            const x2 = entry.x;
            const y2 = entry.y - entry.h / 2;

            if (entry.connector === 'straight') {
              return <path key={`edge-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} fill="none" stroke="#000000" strokeWidth="1.5" />;
            }

            // Fixed offset from the source's own bottom edge rather than the
            // midpoint to this specific child's top edge -- siblings with
            // different heights (a wrapped 2-line label vs a single-line one)
            // would otherwise each get a slightly different elbow height,
            // which read as a doubled/blurry spine line instead of one clean bar.
            const my = y1 + ROW_GAP / 2;
            return (
              <path key={`edge-${i}`} d={`M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}`} fill="none" stroke="#000000" strokeWidth="1.5" />
            );
          })}
          {built.nodes.map((entry, i) => {
            // One line per leaf stack: leaves the parent already at the
            // spine's own x (not the parent's center), so the whole thing is
            // one unbroken straight vertical line -- no jog -- running down
            // through every leaf's tick point. Drawn once so it never
            // overlaps or re-enters another card.
            if (!entry.leafStack || !entry.leafStack.length) return null;
            const first = entry.leafStack[0];
            const last = entry.leafStack[entry.leafStack.length - 1];
            if (first.spineX === undefined) return null;
            const y1 = entry.y + entry.h / 2;
            return (
              <path key={`spine-${i}`} d={`M ${first.spineX} ${y1} L ${first.spineX} ${last.y}`} fill="none" stroke="#000000" strokeWidth="1.5" />
            );
          })}
          {built.nodes.map((entry, i) => {
            const x = entry.x - entry.w / 2;
            const y = entry.y - entry.h / 2;
            const color = depthColor(entry.depth);
            const isRoot = entry.depth === 0;
            const hasChildren = !!entry.node.children && entry.node.children.length > 0;
            const isCollapsed = hasChildren && collapsedNodes.has(entry.node);
            const s = cardStyleForDepth(entry.depth, hasChildren);
            return (
              <g
                key={`node-${i}`}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                onPointerDown={hasChildren ? (e) => e.stopPropagation() : undefined}
                onClick={hasChildren ? (e) => { e.stopPropagation(); toggleCollapse(entry.node); } : undefined}
              >
                <title>{entry.node.label}</title>
                <rect rx={isRoot ? 22 : 12} ry={isRoot ? 22 : 12} width={entry.w} height={entry.h} fill="#f8fafc" stroke={color} strokeWidth={isRoot ? 3 : 2} />
                <rect x="0" y="0" width={entry.w} height={isRoot ? 10 : 5} rx="2" fill={color} />
                <foreignObject width={entry.w} height={entry.h} style={{ pointerEvents: 'none' }}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex items-center justify-center text-center text-slate-800 w-full h-full select-none"
                    style={{
                      padding: `${s.padY}px ${s.padX}px`,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      fontSize: `${s.fontSize}px`,
                      fontWeight: s.fontWeight,
                      lineHeight: '1.4',
                      fontFamily: 'inherit',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                  >
                    {entry.node.label}
                  </div>
                </foreignObject>
                {hasChildren && (
                  <g transform={`translate(${entry.w / 2}, ${entry.h})`}>
                    <circle r={isRoot ? 20 : 15} fill="white" stroke={color} strokeWidth="2" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={isRoot ? 20 : 17}
                      fontWeight={800}
                      fill={color}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {isCollapsed ? '+' : '−'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});

const TABS: Array<{ mode: LayoutMode; label: string }> = [
  { mode: 'org', label: 'Org Chart' },
  { mode: 'hybrid', label: 'Hybrid Tree' },
];

export const MindMapCanvas = forwardRef<MindMapCanvasHandle, MindMapCanvasProps>(function MindMapCanvas(
  { data, height = 480, mode: controlledMode, onModeChange, hideToggle },
  ref,
) {
  const [internalMode, setInternalMode] = useState<LayoutMode>('org');
  const mode = controlledMode ?? internalMode;
  const setMode = onModeChange ?? setInternalMode;
  return (
    <div className="flex h-full flex-col">
      {!hideToggle && (
        <div className="mb-2 flex flex-shrink-0 justify-end gap-1.5">
          {TABS.map(t => (
            <button
              key={t.mode}
              type="button"
              onClick={() => setMode(t.mode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                mode === t.mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {/* Remounted on tab switch (fresh default-collapse + fit) rather than kept
          mounted side by side -- the two layouts differ enough that carrying
          over expand/pan state from one wouldn't mean anything in the other.
          Wrapped in a flex-1/min-h-0 box so a percentage `height` (e.g. "100%"
          from a full-screen host page) has a definite box to resolve against --
          without it, this div's own height is `auto`, and a 100%-height child
          of an auto-height parent collapses instead of filling the space. */}
      <div className="min-h-0 flex-1">
        <MindMapCanvasInner ref={ref} key={mode} data={data} height={height} mode={mode} />
      </div>
    </div>
  );
});
