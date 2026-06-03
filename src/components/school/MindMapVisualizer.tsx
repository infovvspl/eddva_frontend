import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";

import "reactflow/dist/style.css";

/* =========================================================
   PERFECT MINDMAP LAYOUT
========================================================= */

const DIM: any = {
  0: { w: 180, h: 70 },
  1: { w: 170, h: 85 },
  2: { w: 150, h: 75 },
  3: { w: 140, h: 65 },
};

const dim = (level: number) => DIM[Math.min(level, 3)];

const X_GAP: any = {
  0: 240,
  1: 190,
  2: 150,
  3: 120,
};

const xGap = (level: number) => X_GAP[Math.min(level, 3)];

const Y_GAP: any = {
  0: 0,
  1: 180,
  2: 140,
  3: 110,
};

const yGap = (level: number) => Y_GAP[Math.min(level, 3)];

/* =========================================================
   SUBTREE HEIGHT CALCULATION
========================================================= */

function calculateSubtree(node: any, level = 1) {
  const children = node.children || [];

  if (!children.length) {
    node._subtree = dim(level).h;
    return;
  }

  children.forEach((child: any) =>
    calculateSubtree(child, level + 1)
  );

  const total =
    children.reduce((sum: number, c: any) => sum + c._subtree, 0) +
    (children.length - 1) * yGap(level);

  node._subtree = Math.max(dim(level).h, total);
}

/* =========================================================
   ASSIGN POSITIONS
========================================================= */

function assignPositions(
  node: any,
  parentCX: number,
  parentCY: number,
  level: number,
  side: "left" | "right",
  map: any
) {
  const { w, h } = dim(level);

  const dir = side === "right" ? 1 : -1;

  const parentDim = dim(level - 1);

  const cx =
    parentCX +
    dir *
      (parentDim.w / 2 +
        xGap(level - 1) +
        w / 2);

  const cy = parentCY;

  map[node._id] = {
    x: cx - w / 2,
    y: cy - h / 2,
    cx,
    cy,
  };

  const children = node.children || [];

  if (!children.length) return;

  const totalHeight =
    children.reduce((s: number, c: any) => s + c._subtree, 0) +
    (children.length - 1) * yGap(level);

  let startY = cy - totalHeight / 2;

  children.forEach((child: any) => {
    const childCY = startY + child._subtree / 2;

    assignPositions(
      child,
      cx,
      childCY,
      level + 1,
      side,
      map
    );

    startY += child._subtree + yGap(level);
  });
}

/* =========================================================
   MAIN LAYOUT
========================================================= */

function buildLayout(tree: any) {
  const positions: any = {};

  positions["root"] = {
    x: -dim(0).w / 2,
    y: -dim(0).h / 2,
    cx: 0,
    cy: 0,
  };

  const children = tree.children || [];

  const half = Math.floor(children.length / 2);

  const right = children.slice(0, half);
  const left = children.slice(half);

  right.forEach((c: any) => calculateSubtree(c, 1));
  left.forEach((c: any) => calculateSubtree(c, 1));

  const rightHeight =
    right.reduce((s: number, c: any) => s + c._subtree, 0) +
    Math.max(0, right.length - 1) * yGap(1);

  let ry = -rightHeight / 2;

  right.forEach((child: any) => {
    const cy = ry + child._subtree / 2;

    assignPositions(
      child,
      0,
      cy,
      1,
      "right",
      positions
    );

    ry += child._subtree + yGap(1);
  });

  const leftHeight =
    left.reduce((s: number, c: any) => s + c._subtree, 0) +
    Math.max(0, left.length - 1) * yGap(1);

  let ly = -leftHeight / 2;

  left.forEach((child: any) => {
    const cy = ly + child._subtree / 2;

    assignPositions(
      child,
      0,
      cy,
      1,
      "left",
      positions
    );

    ly += child._subtree + yGap(1);
  });

  return positions;
}

/* =========================================================
   CUSTOM EDGE
========================================================= */

function OrganicEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: any) {
  const dx = targetX - sourceX;

  const curve = Math.abs(dx) * 0.6;

  const path = `
    M ${sourceX} ${sourceY}
    C ${sourceX + (dx > 0 ? curve : -curve)} ${sourceY},
      ${targetX - (dx > 0 ? curve : -curve)} ${targetY},
      ${targetX} ${targetY}
  `;

  return (
    <path
      id={id}
      d={path}
      fill="none"
      stroke={style?.stroke || "#999"}
      strokeWidth={style?.strokeWidth || 2}
      markerEnd={markerEnd as string}
      strokeLinecap="round"
    />
  );
}

/* =========================================================
   ROOT NODE
========================================================= */

function RootNode({ data }: any) {
  return (
    <div
      style={{
        ...data.style,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {data.label}
      </div>
    </div>
  );
}

/* =========================================================
   BRANCH NODE
========================================================= */

function BranchNode({ data }: any) {
  return (
    <div
      style={{
        ...data.style,
        padding: 12,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Right} />

      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {data.sequence && (
        <div
          style={{
            fontSize: 10,
            opacity: 0.7,
            marginBottom: 4,
          }}
        >
          {data.sequence}
        </div>
      )}

      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {data.label}
      </div>

      {data.description && (
        <div
          style={{
            fontSize: 11,
            opacity: 0.85,
            lineHeight: 1.3,
          }}
        >
          {data.description}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function MindMapVisualizerContent({ data }: { data: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [hasError, setHasError] = useState(false);

  const generatedRef = useRef(false);

  const nodeTypes = useMemo(
    () => ({
      rootNode: RootNode,
      branchNode: BranchNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      organic: OrganicEdge,
    }),
    []
  );

  const colors = [
    "#2563eb",
    "#10b981",
    "#ec4899",
    "#f59e0b",
  ];

  const lightColors = [
    "#dbeafe",
    "#d1fae5",
    "#fce7f3",
    "#fef3c7",
  ];

  const flattenTree = useCallback((tree: any) => {
    let idCounter = 0;

    const getId = () => `node_${idCounter++}`;

    const nodes: any[] = [];
    const edges: any[] = [];

    nodes.push({
      id: "root",
      type: "rootNode",
      position: { x: 0, y: 0 },
      data: {
        label: tree.title || "MindMap",
        style: {
          width: dim(0).w,
          height: dim(0).h,
          background: "#0f172a",
          color: "white",
          borderRadius: 18,
          boxShadow:
            "0 6px 16px rgba(0,0,0,0.12)",
        },
      },
    });

    const children = tree.children || [];

    const half = Math.ceil(children.length / 2);

    const right = children.slice(0, half);
    const left = children.slice(half);

    function assignIds(node: any) {
      node._id = getId();

      (node.children || []).forEach(assignIds);
    }

    right.forEach(assignIds);
    left.forEach(assignIds);

    const walk = (
      node: any,
      parent: string,
      level: number,
      branchType: number
    ) => {
      const id = node._id;

      const bg =
        level === 1
          ? colors[branchType]
          : lightColors[branchType];

      const text =
        level === 1 ? "white" : "#111827";

      nodes.push({
        id,
        type: "branchNode",
        position: { x: 0, y: 0 },
        data: {
          label: node.title,
          sequence: node.sequence,
          description: node.description,
          style: {
            width: dim(level).w,
            minHeight: dim(level).h,
            background: bg,
            color: text,
            borderRadius: 14,
            boxShadow:
              "0 4px 10px rgba(0,0,0,0.08)",
          },
        },
      });

      edges.push({
        id: `${parent}-${id}`,
        source: parent,
        target: id,
        type: "organic",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 28,
          height: 28,
          color: colors[branchType],
        },
        style: {
          stroke: colors[branchType],
          strokeWidth: level === 1 ? 5 : 3.5,
        },
      });

      (node.children || []).forEach((child: any) =>
        walk(
          child,
          id,
          level + 1,
          branchType
        )
      );
    };

    right.forEach((c: any, i: number) =>
      walk(c, "root", 1, i % 4)
    );

    left.forEach((c: any, i: number) =>
      walk(c, "root", 1, (half + i) % 4)
    );

    return { nodes, edges };
  }, [colors, lightColors]);

  useEffect(() => {
    if (data) {
      try {
        setHasError(false);
        const { nodes, edges } = flattenTree(data);
        const positions = buildLayout(data);

        const finalNodes = nodes.map((n) => {
          const p = positions[n.id];
          if (!p) return n;

          return {
            ...n,
            position: {
              x: p.x,
              y: p.y,
            },
          };
        });

        generatedRef.current = true;
        setNodes(finalNodes);
        setEdges(edges);
      } catch (err) {
        console.error("Error building mind map visualization:", err);
        setHasError(true);
      }
    }
  }, [data, flattenTree, setNodes, setEdges]);

  useEffect(() => {
    if (generatedRef.current && nodes.length) {
      generatedRef.current = false;

      setTimeout(() => {
        fitView({
          padding: 0.45,
          duration: 800,
          minZoom: 0.65,
          maxZoom: 1.2,
        });
      }, 100);
    }
  }, [nodes, fitView]);

  if (hasError) {
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center", border: "1px solid red", borderRadius: "8px", marginTop: "20px" }}>
        Visualization failed to load for this Mind Map.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "600px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb", background: "#f8fafc" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background
          gap={24}
          size={1}
          color="#d1d5db"
        />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export function MindMapVisualizer({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="creator__section" style={{ marginTop: "20px" }}>
      <h3>Generated Mind Map Visualization</h3>
      <ReactFlowProvider>
        <MindMapVisualizerContent data={data} />
      </ReactFlowProvider>
    </div>
  );
}

export default MindMapVisualizer;
