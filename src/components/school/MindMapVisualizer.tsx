import React from 'react';

type MindMapNode = {
  label: string;
  children?: MindMapNode[];
};

type MindMapCanvasProps = {
  data: MindMapNode | null;
  height?: number;
};

function flatten(node: MindMapNode | null, depth = 0, x = 0, result: Array<{ node: MindMapNode; depth: number; x: number; y: number }> = []) {
  if (!node) return result;
  result.push({ node, depth, x, y: result.length });
  node.children?.forEach((child, index) => {
    flatten(child, depth + 1, x + index, result);
  });
  return result;
}

export function MindMapCanvas({ data, height = 480 }: MindMapCanvasProps) {
  if (!data) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
        No mindmap data available.
      </div>
    );
  }

  const nodes = flatten(data);
  const width = Math.max(900, nodes.length * 160);
  const xGap = 180;
  const yGap = 96;

  return (
    <div className="w-full overflow-auto rounded-2xl border border-slate-200 bg-white">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {nodes.slice(1).map((entry, index) => {
          const parent = nodes[Math.max(0, index)];
          return (
            <line
              key={`${entry.node.label}-${index}`}
              x1={40 + parent.depth * xGap}
              y1={48 + parent.y * yGap}
              x2={40 + entry.depth * xGap}
              y2={48 + entry.y * yGap}
              stroke="#cbd5e1"
              strokeWidth="2"
            />
          );
        })}
        {nodes.map((entry) => (
          <g key={`${entry.node.label}-${entry.depth}-${entry.y}`} transform={`translate(${24 + entry.depth * xGap}, ${24 + entry.y * yGap})`}>
            <rect rx="18" ry="18" width="200" height="52" fill={entry.depth === 0 ? '#2563eb' : entry.depth === 1 ? '#0f766e' : '#8b5cf6'} opacity="0.96" />
            <text x="100" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">
              {entry.node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
