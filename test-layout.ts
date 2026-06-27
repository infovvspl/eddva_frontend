type MindMapNode = {
  label: string;
  children?: MindMapNode[];
};

interface Positioned {
  node: MindMapNode;
  depth: number;
  y: number;
  parent: Positioned | null;
  side: 1 | -1 | 0;
}

const X_GAP = 260;
const MARGIN_X = 28;

function layout(root: MindMapNode): { nodes: Positioned[]; leafCount: number; maxDepth: number } {
  const nodes: Positioned[] = [];
  let maxDepth = 0;

  const assign = (
    node: MindMapNode, 
    depth: number, 
    parent: Positioned | null, 
    side: 1 | -1,
    state: { leafRow: number },
    subtreeNodes: Positioned[]
  ): Positioned => {
    maxDepth = Math.max(maxDepth, depth);
    const entry: Positioned = { node, depth, y: 0, parent, side };
    nodes.push(entry);
    subtreeNodes.push(entry);
    const children = node.children ?? [];
    if (children.length === 0) {
      entry.y = state.leafRow;
      state.leafRow += 1;
    } else {
      const childEntries = children.map((c) => assign(c, depth + 1, entry, side, state, subtreeNodes));
      entry.y = (childEntries[0].y + childEntries[childEntries.length - 1].y) / 2;
    }
    return entry;
  };

  const rootEntry: Positioned = { node: root, depth: 0, y: 0, parent: null, side: 0 };
  nodes.push(rootEntry);

  const children = root.children ?? [];
  const split = Math.ceil(children.length / 2);
  const rightChildren = children.slice(0, split);
  const leftChildren = children.slice(split);

  let maxLeavesPerBranch = 1;
  const countLeaves = (n: MindMapNode): number => {
    if (!n.children || n.children.length === 0) return 1;
    return n.children.reduce((sum, c) => sum + countLeaves(c), 0);
  };
  children.forEach(c => {
    maxLeavesPerBranch = Math.max(maxLeavesPerBranch, countLeaves(c));
  });

  const branchGap = Math.max(maxLeavesPerBranch, 1.5); // Ensure safe gap

  const placeSide = (sideChildren: MindMapNode[], side: 1 | -1) => {
    const N = sideChildren.length;
    if (N === 0) return;
    
    // Equal spacing centered around 0
    const startOffset = -((N - 1) * branchGap) / 2;

    sideChildren.forEach((childNode, i) => {
      const desiredY = startOffset + i * branchGap;
      const state = { leafRow: 0 };
      const subtreeNodes: Positioned[] = [];
      
      const childEntry = assign(childNode, 1, rootEntry, side, state, subtreeNodes);
      
      const shift = desiredY - childEntry.y;
      subtreeNodes.forEach(n => {
        n.y += shift;
      });
    });
  };

  placeSide(rightChildren, 1);
  placeSide(leftChildren, -1);

  let minY = 0;
  nodes.forEach(n => {
    minY = Math.min(minY, n.y);
  });

  const globalShift = Math.abs(minY);
  nodes.forEach(n => {
    n.y += globalShift;
  });

  let maxY = 0;
  nodes.forEach(n => {
    maxY = Math.max(maxY, n.y);
  });
  
  const leafCount = maxY + 1;

  return { nodes, leafCount, maxDepth };
}

const root: MindMapNode = {
  label: "Electricity",
  children: [
    { label: "Introduction to Electricity", children: [{label: "1"}, {label: "2"}] },
    { label: "Electric Current and Circuit", children: [{label: "1"}] },
    { label: "Ohm's Law and Resistance", children: [{label: "1"}] },
    { label: "Electric Power and Energy", children: [{label: "1"}] },
    { label: "Effects of Electric Current", children: [{label: "1"}] },
    { label: "Domestic Electric Circuits", children: [{label: "1"}] },
    { label: "Conclusion", children: [{label: "1"}] }
  ]
};

const result = layout(root);

console.log("Root Y:", result.nodes.find(n => n.depth === 0)!.y);

result.nodes.filter(n => n.depth === 1).forEach(n => {
    console.log(`Label: ${n.node.label.padEnd(30)} | Side: ${n.side.toString().padStart(2)} | Y: ${n.y}`);
});
