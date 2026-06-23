import * as fs from 'fs';

export type MindMapTreeNode = {
  label: string;
  children?: MindMapTreeNode[];
};

function normalizeLine(line: string) {
  return line.replace(/\s+/g, ' ').trim();
}

function headingLevel(line: string) {
  const match = line.match(/^(#{1,6})\s+(.*)$/);
  if (!match) return null;
  return { level: match[1].length, text: normalizeLine(match[2]) };
}

export function mindmapMarkdownToTreeOriginal(markdown: string, title = 'Mindmap'): MindMapTreeNode {
  const root: MindMapTreeNode = { label: title, children: [] };
  const stack: Array<{ level: number; node: MindMapTreeNode }> = [{ level: 0, node: root }];

  const lines = String(markdown || '')
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  for (const line of lines) {
    const heading = headingLevel(line);
    if (!heading) {
      const current = stack[stack.length - 1]?.node;
      if (current) {
        current.children ||= [];
        current.children.push({ label: line });
      }
      continue;
    }

    while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.node ?? root;
    parent.children ||= [];
    const node: MindMapTreeNode = { label: heading.text, children: [] };
    parent.children.push(node);
    stack.push({ level: heading.level, node });
  }

  if (!root.children?.length) {
    root.children = markdown
      .split(/\r?\n/)
      .map(normalizeLine)
      .filter(Boolean)
      .map((line) => ({ label: line }));
  }

  return root;
}

export function mindmapMarkdownToTreeFixed(markdown: string, title = 'Mindmap'): MindMapTreeNode {
  const root = mindmapMarkdownToTreeOriginal(markdown, title);
  
  if (root.children && root.children.length === 1) {
    const wrapper = root.children[0];
    if (wrapper.children && wrapper.children.length > 0) {
      root.children = wrapper.children;
    }
  }

  return root;
}

const md = `
# Topic Name
## Branch A
### Subtopic
## Branch B
### Subtopic
## Branch C
### Subtopic
`;

function countNodes(node: MindMapTreeNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

const before = mindmapMarkdownToTreeOriginal(md, "Root");
const after = mindmapMarkdownToTreeFixed(md, "Root");

console.log("Before Tree:");
console.log(JSON.stringify(before, null, 2));
console.log("Before Root Children Count:", before.children?.length);
console.log("Before Total Nodes:", countNodes(before));

console.log("\nAfter Tree:");
console.log(JSON.stringify(after, null, 2));
console.log("After Root Children Count:", after.children?.length);
console.log("After Total Nodes:", countNodes(after));
