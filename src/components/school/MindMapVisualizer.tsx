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
  side: 1 | -1 | 0;
  parent: LayoutNode | null;
  children: LayoutNode[];
  subtreeHeight: number;
  x: number;
  y: number;
}

// ── Layout constants ─────────────────────────────────────────────
const NODE_W = 210;
const NODE_H = 46;
const X_GAP = 260;
const Y_GAP = 64;
const MARGIN_X = 28;
const MARGIN_Y = 28;
const MIN_K = 0.2;
const MAX_K = 3;

const DEPTH_FILL = ['#2563eb', '#0f766e', '#8b5cf6', '#db2777', '#ea580c'];

const GAP_X = 60;
const GAP_Y = 16;

function layoutTree(root: MindMapNode, sizes: Map<MindMapNode, {w: number, h: number}>): { nodes: LayoutNode[]; totalWidth: number; totalHeight: number; maxDepth: number } {
  let maxDepth = 0;

  const buildTree = (
    n: MindMapNode, 
    depth: number, 
    side: 1 | -1 | 0, 
    parent: LayoutNode | null
  ): LayoutNode => {
    maxDepth = Math.max(maxDepth, depth);
    const size = sizes.get(n) || { w: 140, h: 46 };
    const lnode: LayoutNode = {
      node: n, depth, w: size.w, h: size.h, side, parent, children: [], subtreeHeight: 0, x: 0, y: 0
    };
    const kids = n.children || [];
    lnode.children = kids.map(c => buildTree(c, depth + 1, side, lnode));
    
    const childrenH = lnode.children.reduce((sum, c) => sum + c.subtreeHeight, 0) + Math.max(0, lnode.children.length - 1) * GAP_Y;
    lnode.subtreeHeight = Math.max(lnode.h, childrenH);
    return lnode;
  };

  const assignPositions = (lnode: LayoutNode) => {
    if (!lnode.parent) {
      lnode.x = 0;
    } else {
      lnode.x = lnode.parent.x + lnode.side * (lnode.parent.w / 2 + GAP_X + lnode.w / 2);
    }

    const childrenH = lnode.children.reduce((sum, c) => sum + c.subtreeHeight, 0) + Math.max(0, lnode.children.length - 1) * GAP_Y;
    let currentY = lnode.y - childrenH / 2;
    
    for (const c of lnode.children) {
      c.y = currentY + c.subtreeHeight / 2;
      currentY += c.subtreeHeight + GAP_Y;
      assignPositions(c);
    }
  };

  const rootSize = sizes.get(root) || { w: 140, h: 46 };
  const rootLNode: LayoutNode = {
    node: root, depth: 0, w: rootSize.w, h: rootSize.h, side: 0, parent: null, children: [], subtreeHeight: 0, x: 0, y: 0
  };

  const children = root.children || [];
  const split = Math.ceil(children.length / 2);
  const rightKids = children.slice(0, split);
  const leftKids = children.slice(split);

  const rightNodes = rightKids.map(c => buildTree(c, 1, 1, rootLNode));
  const leftNodes = leftKids.map(c => buildTree(c, 1, -1, rootLNode));
  rootLNode.children = [...rightNodes, ...leftNodes];

  const layoutSide = (sideNodes: LayoutNode[]) => {
    const childrenH = sideNodes.reduce((sum, c) => sum + c.subtreeHeight, 0) + Math.max(0, sideNodes.length - 1) * GAP_Y;
    let currentY = -childrenH / 2;
    for (const c of sideNodes) {
      c.y = currentY + c.subtreeHeight / 2;
      currentY += c.subtreeHeight + GAP_Y;
      assignPositions(c);
    }
  };

  layoutSide(rightNodes);
  layoutSide(leftNodes);

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

const nodeX = (depth: number, side: number, maxDepth: number) => MARGIN_X + maxDepth * X_GAP + side * depth * X_GAP;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function MindMapCanvas({ data, height = 480 }: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Map<MindMapNode, {w: number, h: number}> | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const drag = useRef<{ ox: number; oy: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const flatNodes = React.useMemo(() => {
    if (!data) return [];
    const list: MindMapNode[] = [];
    const traverse = (n: MindMapNode) => { list.push(n); n.children?.forEach(traverse); };
    traverse(data);
    return list;
  }, [data]);

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

  const built = data && dimensions ? layoutTree(data, dimensions) : null;
  const contentW = built ? Math.max(built.totalWidth, 1) : 1;
  const contentH = built ? Math.max(built.totalHeight, 1) : 1;

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || height;
    const k = clamp(Math.min(w / contentW, h / contentH), MIN_K, 1.2);
    setView({ x: Math.max(8, (w - contentW * k) / 2), y: Math.max(8, (h - contentH * k) / 2), k });
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
      const rect = el.getBoundingClientRect();
      zoomAround(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAround]);

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
    if (!drag.current) return;
    setView((v) => ({ ...v, x: e.clientX - drag.current!.ox, y: e.clientY - drag.current!.oy }));
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
      style={{ height: canvasHeight }}
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
            
            const isLeft = entry.side === -1;
            const x1 = entry.parent.x + (isLeft ? -entry.parent.w / 2 : entry.parent.w / 2);
            const y1 = entry.parent.y;
            const x2 = entry.x + (isLeft ? entry.w / 2 : -entry.w / 2);
            const y2 = entry.y;
            const mx = (x1 + x2) / 2;
            
            return (
              <path key={`edge-${i}`} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke="#cbd5e1" strokeWidth="2" />
            );
          })}
          {built.nodes.map((entry, i) => {
            const x = entry.x - entry.w / 2;
            const y = entry.y - entry.h / 2;
            const fill = DEPTH_FILL[Math.min(entry.depth, DEPTH_FILL.length - 1)];
            return (
              <g key={`node-${i}`} transform={`translate(${x}, ${y})`}>
                <title>{entry.node.label}</title>
                <rect rx="12" ry="12" width={entry.w} height={entry.h} fill={fill} opacity={entry.depth === 0 ? 1 : 0.94} />
                <foreignObject width={entry.w} height={entry.h} style={{ pointerEvents: 'none' }}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex items-center justify-center text-center text-white w-full h-full select-none"
                    style={{
                      padding: '12px 16px',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      fontSize: '13.5px',
                      fontWeight: entry.depth === 0 ? 800 : 600,
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
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
