import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Expand, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

type MindMapNode = {
  label: string;
  children?: MindMapNode[];
};

type MindMapCanvasProps = {
  data: MindMapNode | null;
  height?: number;
};

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

const ROW_GAP = 64; // vertical gap between depth rows
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
      node: n, depth, w: size.w, h: size.h, parent, children: [], subtreeWidth: 0, x: 0, y: 0
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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function MindMapCanvas({ data, height = 480 }: MindMapCanvasProps) {
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
  // The node most recently expanded by a click -- once its subtree has been
  // laid out, the view pans (without rescaling) to bring it into focus.
  const pendingFocusNode = useRef<MindMapNode | null>(null);
  const builtRef = useRef<ReturnType<typeof layoutTree> | null>(null);
  // Always holds the latest `view`, so toggleCollapse (a stable useCallback)
  // can snapshot the current camera position without a stale closure.
  const viewRef = useRef(view);
  viewRef.current = view;
  // The view captured right before each node was expanded -- collapsing that
  // same node restores it, instead of leaving the camera wherever the
  // expand's focus-pan last left it.
  const viewBeforeExpand = useRef<Map<MindMapNode, { x: number; y: number; k: number }>>(new Map());
  const pendingRestoreView = useRef<{ x: number; y: number; k: number } | null>(null);

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
    viewBeforeExpand.current = new Map();
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
    // content-size change from this toggle re-trigger an auto-fit.
    autoFitEnabled.current = false;
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node)) {
        next.delete(node);
        // Expanding: snapshot the view as it is right now so collapsing this
        // same node later can restore it, then once this node's children are
        // laid out, pan (not rescale) so the node and its newly-revealed
        // branches are centered.
        viewBeforeExpand.current.set(node, viewRef.current);
        pendingFocusNode.current = node;
        pendingRestoreView.current = null;
      } else {
        next.add(node);
        pendingFocusNode.current = null;
        // Collapsing: revert to whatever the view looked like right before
        // this node was expanded, if we captured one.
        const saved = viewBeforeExpand.current.get(node);
        viewBeforeExpand.current.delete(node);
        pendingRestoreView.current = saved ?? null;
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

  const built = data && dimensions ? layoutTree(data, dimensions, collapsedNodes) : null;
  builtRef.current = built;
  const contentW = built ? Math.max(built.totalWidth, 1) : 1;
  const contentH = built ? Math.max(built.totalHeight, 1) : 1;
  const maxDepth = built ? built.maxDepth : 0;

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || height;
    const idealK = Math.min(w / contentW, h / contentH);
    // A shallow tree (root plus one level of children, before anything's been
    // expanded further) has few enough nodes to fit fully on screen and stay
    // readable. Past that, fitting to width shrinks text too far, so floor the
    // zoom at READABLE_MIN_K and let the tree overflow horizontally instead
    // (it's pannable/zoomable).
    const k = maxDepth <= 1 ? clamp(idealK, MIN_K, 1.2) : clamp(idealK, READABLE_MIN_K, 1.2);
    setView({ x: (w - contentW * k) / 2, y: (h - contentH * k) / 2, k });
  }, [contentW, contentH, height, maxDepth]);

  useLayoutEffect(() => {
    if (autoFitEnabled.current) fit();
  }, [fit]);

  // Runs after an expand- or collapse-click's new layout has committed.
  // Collapsing restores the exact view captured before that node was
  // expanded; expanding pans to center the clicked node plus everything now
  // visible under it, holding the current zoom level -- unlike auto-fit,
  // neither of these ever shrinks the view to fit more in.
  useLayoutEffect(() => {
    if (pendingRestoreView.current) {
      const restored = pendingRestoreView.current;
      pendingRestoreView.current = null;
      setView(restored);
      return;
    }

    const node = pendingFocusNode.current;
    pendingFocusNode.current = null;
    const el = containerRef.current;
    const currentBuilt = builtRef.current;
    if (!node || !el || !currentBuilt) return;
    const entry = currentBuilt.nodes.find(n => n.node === node);
    if (!entry) return;

    let minX = entry.x - entry.w / 2, maxX = entry.x + entry.w / 2;
    let minY = entry.y - entry.h / 2, maxY = entry.y + entry.h / 2;
    const expand = (n: typeof entry) => {
      n.children.forEach(c => {
        minX = Math.min(minX, c.x - c.w / 2);
        maxX = Math.max(maxX, c.x + c.w / 2);
        minY = Math.min(minY, c.y - c.h / 2);
        maxY = Math.max(maxY, c.y + c.h / 2);
        expand(c);
      });
    };
    expand(entry);

    const boxCx = (minX + maxX) / 2;
    const boxCy = (minY + maxY) / 2;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || height;
    setView(v => ({ ...v, x: w / 2 - boxCx * v.k, y: h / 2 - boxCy * v.k }));
  }, [collapsedNodes, height]);

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
            if (!entry.parent) return null;

            const x1 = entry.parent.x;
            const y1 = entry.parent.y + entry.parent.h / 2;
            const x2 = entry.x;
            const y2 = entry.y - entry.h / 2;
            // Fixed offset from the parent's own bottom edge rather than the
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
                    <circle r={isRoot ? 15 : 10} fill="white" stroke={color} strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="12"
                      fontWeight={700}
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
}
