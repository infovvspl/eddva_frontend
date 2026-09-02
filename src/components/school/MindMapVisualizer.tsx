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
  subtreeHeight: number;
  x: number;
  y: number;
}

// ── Layout constants (left-to-right tree, root pinned at the left) ────────
const MARGIN_X = 28;
const MARGIN_Y = 28;
// Hard floor for manual zoom-out (pinch/scroll), so a user can always zoom out
// to see a huge tree in full if they choose to.
const MIN_K = 0.05;
const MAX_K = 3;
// Floor used by the initial auto-fit — keeps node text legible by refusing to
// shrink past this scale even if that means the tree overflows the container
// (it's pannable). See `fit()`.
const READABLE_MIN_K = 0.55;

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

const COL_GAP = 96; // horizontal gap between depth columns
const SIB_GAP = 20; // vertical gap between sibling subtrees

function layoutTree(
  root: MindMapNode,
  sizes: Map<MindMapNode, {w: number, h: number}>,
  collapsed: Set<MindMapNode>,
): { nodes: LayoutNode[]; totalWidth: number; totalHeight: number; maxDepth: number } {
  let maxDepth = 0;
  const depthWidths = new Map<number, number>();

  const buildTree = (n: MindMapNode, depth: number, parent: LayoutNode | null): LayoutNode => {
    maxDepth = Math.max(maxDepth, depth);
    const size = sizes.get(n) || { w: 140, h: 46 };
    depthWidths.set(depth, Math.max(depthWidths.get(depth) || 0, size.w));
    const lnode: LayoutNode = {
      node: n, depth, w: size.w, h: size.h, parent, children: [], subtreeHeight: 0, x: 0, y: 0
    };
    // A collapsed node's children are excluded from layout entirely (not just
    // visually hidden) -- that's what keeps a bushy tree from sprawling until
    // the branch is actually expanded.
    const kids = collapsed.has(n) ? [] : (n.children || []);
    lnode.children = kids.map(c => buildTree(c, depth + 1, lnode));

    const childrenH = lnode.children.reduce((sum, c) => sum + c.subtreeHeight, 0) + Math.max(0, lnode.children.length - 1) * SIB_GAP;
    lnode.subtreeHeight = Math.max(lnode.h, childrenH);
    return lnode;
  };

  const rootLNode = buildTree(root, 0, null);

  // Column 0 (root) is vertically centered on its own children block, so its
  // x is assigned below along with everyone else, keyed purely by depth.
  const colX: number[] = [];
  let cumX = 0;
  for (let d = 0; d <= maxDepth; d++) {
    const w = depthWidths.get(d) || 140;
    colX[d] = cumX + w / 2;
    cumX += w + COL_GAP;
  }

  const assignY = (lnode: LayoutNode, topEdge: number) => {
    const childrenH = lnode.children.reduce((sum, c) => sum + c.subtreeHeight, 0) + Math.max(0, lnode.children.length - 1) * SIB_GAP;
    let cursor = topEdge + (lnode.subtreeHeight - childrenH) / 2;
    for (const c of lnode.children) {
      assignY(c, cursor);
      cursor += c.subtreeHeight + SIB_GAP;
    }
    lnode.y = topEdge + lnode.subtreeHeight / 2;
    lnode.x = colX[lnode.depth];
  };
  assignY(rootLNode, 0);

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

  const flatNodes = React.useMemo(() => {
    if (!data) return [];
    const list: MindMapNode[] = [];
    const traverse = (n: MindMapNode) => { list.push(n); n.children?.forEach(traverse); };
    traverse(data);
    return list;
  }, [data]);

  // A fresh mindmap starts with only the root's direct branches visible --
  // everything past that collapses by default so a bushy/deep tree doesn't
  // dump its entire sprawl on screen at once. Click a node to expand it.
  useEffect(() => {
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
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node)) next.delete(node); else next.add(node);
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
  const contentW = built ? Math.max(built.totalWidth, 1) : 1;
  const contentH = built ? Math.max(built.totalHeight, 1) : 1;

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || height;
    // Left-to-right tree: depth grows rightward and can get far wider than the
    // container, so pin the root column to the left edge instead of centering
    // it (a wide tree would otherwise shrink to fit or leave root off-center).
    // Never auto-shrink text below READABLE_MIN_K for readability's sake --
    // let it overflow and pan instead. Siblings stack vertically, so center
    // that axis the way the previous top-down layout centered width.
    const idealK = Math.min(w / contentW, h / contentH);
    const k = clamp(idealK, READABLE_MIN_K, 1.2);
    setView({ x: MARGIN_X, y: (h - contentH * k) / 2, k });
  }, [contentW, contentH, height]);

  useLayoutEffect(() => { fit(); }, [fit]);

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
          {flatNodes.map((n, i) => (
            <div
              key={i}
              className="text-center"
              style={{
                width: 'max-content',
                minWidth: '140px',
                maxWidth: '240px',
                padding: '12px 16px',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                fontSize: '13.5px',
                fontWeight: n === data ? 800 : 600,
                lineHeight: '1.4',
                fontFamily: 'inherit'
              }}
            >
              {n.label}
            </div>
          ))}
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

            const x1 = entry.parent.x + entry.parent.w / 2;
            const y1 = entry.parent.y;
            const x2 = entry.x - entry.w / 2;
            const y2 = entry.y;
            const mx = (x1 + x2) / 2;

            return (
              <path key={`edge-${i}`} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke="#000000" strokeWidth="1.5" />
            );
          })}
          {built.nodes.map((entry, i) => {
            const x = entry.x - entry.w / 2;
            const y = entry.y - entry.h / 2;
            const color = depthColor(entry.depth);
            const isRoot = entry.depth === 0;
            const hasChildren = !!entry.node.children && entry.node.children.length > 0;
            const isCollapsed = hasChildren && collapsedNodes.has(entry.node);
            return (
              <g
                key={`node-${i}`}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                onPointerDown={hasChildren ? (e) => e.stopPropagation() : undefined}
                onClick={hasChildren ? (e) => { e.stopPropagation(); toggleCollapse(entry.node); } : undefined}
              >
                <title>{entry.node.label}</title>
                <rect rx="10" ry="10" width={entry.w} height={entry.h} fill="#f8fafc" stroke={color} strokeWidth={isRoot ? 2 : 1.5} />
                <rect x="0" y="0" width={isRoot ? 6 : 4} height={entry.h} rx="2" fill={color} />
                <foreignObject width={entry.w} height={entry.h} style={{ pointerEvents: 'none' }}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex items-center justify-center text-center text-slate-800 w-full h-full select-none"
                    style={{
                      padding: '12px 16px',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      fontSize: '13.5px',
                      fontWeight: isRoot ? 800 : (hasChildren ? 600 : 500),
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
                  <g transform={`translate(${entry.w}, ${entry.h / 2})`}>
                    <circle r="9" fill="white" stroke={color} strokeWidth="1.5" />
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
