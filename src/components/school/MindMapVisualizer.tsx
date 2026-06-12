import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

type MindMapNode = {
  label: string;
  children?: MindMapNode[];
};

type MindMapCanvasProps = {
  data: MindMapNode | null;
  height?: number;
};

interface Positioned {
  node: MindMapNode;
  depth: number;
  y: number;
  parent: Positioned | null;
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

function layout(root: MindMapNode): { nodes: Positioned[]; leafCount: number; maxDepth: number } {
  const nodes: Positioned[] = [];
  let leafRow = 0;
  let maxDepth = 0;

  const assign = (node: MindMapNode, depth: number, parent: Positioned | null): Positioned => {
    maxDepth = Math.max(maxDepth, depth);
    const entry: Positioned = { node, depth, y: 0, parent };
    nodes.push(entry);
    const children = node.children ?? [];
    if (children.length === 0) {
      entry.y = leafRow;
      leafRow += 1;
    } else {
      const childEntries = children.map((c) => assign(c, depth + 1, entry));
      entry.y = (childEntries[0].y + childEntries[childEntries.length - 1].y) / 2;
    }
    return entry;
  };

  assign(root, 0, null);
  return { nodes, leafCount: Math.max(leafRow, 1), maxDepth };
}

const nodeX = (depth: number) => MARGIN_X + depth * X_GAP;
const nodeCenterY = (y: number) => MARGIN_Y + y * Y_GAP + NODE_H / 2;
const truncate = (s: string, n = 30) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function MindMapCanvas({ data, height = 480 }: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ ox: number; oy: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const built = data ? layout(data) : null;
  const contentW = built ? MARGIN_X * 2 + built.maxDepth * X_GAP + NODE_W : 1;
  const contentH = built ? MARGIN_Y * 2 + built.leafCount * Y_GAP : 1;

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || height;
    const k = clamp(Math.min(w / contentW, h / contentH), MIN_K, 1.2);
    setView({ x: Math.max(8, (w - contentW * k) / 2), y: Math.max(8, (h - contentH * k) / 2), k });
  }, [contentW, contentH, height]);

  useLayoutEffect(() => { fit(); }, [fit]);

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

  if (!data || !built) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
        No mindmap data available.
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

  const btn = 'grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50';

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white" style={{ height }}>
      {/* Zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button type="button" className={btn} onClick={() => zoomCenter(1.2)} title="Zoom in"><ZoomIn size={16} /></button>
        <button type="button" className={btn} onClick={() => zoomCenter(0.8)} title="Zoom out"><ZoomOut size={16} /></button>
        <button type="button" className={btn} onClick={fit} title="Fit to screen"><Maximize2 size={16} /></button>
      </div>

      <svg
        width="100%"
        height={height}
        style={{ display: 'block', cursor: grabbing ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <g transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
          {built.nodes.map((entry, i) => {
            if (!entry.parent) return null;
            const x1 = nodeX(entry.parent.depth) + NODE_W;
            const y1 = nodeCenterY(entry.parent.y);
            const x2 = nodeX(entry.depth);
            const y2 = nodeCenterY(entry.y);
            const mx = (x1 + x2) / 2;
            return (
              <path key={`edge-${i}`} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke="#cbd5e1" strokeWidth="2" />
            );
          })}
          {built.nodes.map((entry, i) => {
            const x = nodeX(entry.depth);
            const y = MARGIN_Y + entry.y * Y_GAP;
            const fill = DEPTH_FILL[Math.min(entry.depth, DEPTH_FILL.length - 1)];
            return (
              <g key={`node-${i}`} transform={`translate(${x}, ${y})`}>
                <title>{entry.node.label}</title>
                <rect rx="12" ry="12" width={NODE_W} height={NODE_H} fill={fill} opacity={entry.depth === 0 ? 1 : 0.94} />
                <text x={NODE_W / 2} y={NODE_H / 2 + 5} textAnchor="middle" fill="white" fontSize="13.5" fontWeight={entry.depth === 0 ? 800 : 600}>
                  {truncate(entry.node.label)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
