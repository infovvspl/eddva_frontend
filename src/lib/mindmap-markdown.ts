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

// Leading indentation width of a raw (untrimmed) line -- must be measured
// before normalizeLine() strips it, since that's the only signal a nested
// bullet list gives us for how deep it goes. Tabs count as 4 spaces.
function leadingIndent(rawLine: string): number {
  let count = 0;
  for (const ch of rawLine) {
    if (ch === ' ') count += 1;
    else if (ch === '\t') count += 4;
    else break;
  }
  return count;
}

// Strip a leading bullet/number marker ("- ", "* ", "+ ", "1. ") from an
// already-trimmed line so it never ends up inside the node's label.
function bulletText(trimmedLine: string): string {
  return trimmedLine.replace(/^(?:[-*+]|\d+[.)])\s+/, '');
}

export function mindmapMarkdownToTree(markdown: string, title = 'Mindmap'): MindMapTreeNode {
  const root: MindMapTreeNode = { label: title, children: [] };
  const headingStack: Array<{ level: number; node: MindMapTreeNode }> = [{ level: 0, node: root }];
  // Nested-bullet stack, scoped to whichever heading section is currently
  // active. Without this, every bullet under a heading -- no matter how deeply
  // indented in the source -- collapsed into flat siblings, since only heading
  // level was ever used to build the tree. Reset on every heading so
  // indentation from one section never leaks into the next.
  let bulletStack: Array<{ indent: number; node: MindMapTreeNode }> = [{ indent: -1, node: root }];

  const rawLines = String(markdown || '').split(/\r?\n/);

  for (const rawLine of rawLines) {
    const trimmed = normalizeLine(rawLine);
    if (!trimmed) continue;

    const heading = headingLevel(trimmed);
    if (heading) {
      while (headingStack.length > 1 && headingStack[headingStack.length - 1].level >= heading.level) {
        headingStack.pop();
      }
      const parent = headingStack[headingStack.length - 1]?.node ?? root;
      parent.children ||= [];
      const node: MindMapTreeNode = { label: heading.text, children: [] };
      parent.children.push(node);
      headingStack.push({ level: heading.level, node });
      bulletStack = [{ indent: -1, node }];
      continue;
    }

    const indent = leadingIndent(rawLine);
    const label = bulletText(trimmed);
    if (!label) continue;

    while (bulletStack.length > 1 && bulletStack[bulletStack.length - 1].indent >= indent) {
      bulletStack.pop();
    }
    const parent = bulletStack[bulletStack.length - 1]?.node ?? root;
    parent.children ||= [];
    const node: MindMapTreeNode = { label, children: [] };
    parent.children.push(node);
    bulletStack.push({ indent, node });
  }

  if (!root.children?.length) {
    root.children = markdown
      .split(/\r?\n/)
      .map(normalizeLine)
      .filter(Boolean)
      .map((line) => ({ label: bulletText(line) }));
  }

  // Normalize: if the root has exactly one child (typically the H1 wrapper),
  // and that child has multiple branches (H2+), promote the branches to be direct children of the root.
  if (
    root.children &&
    root.children.length === 1 &&
    root.children[0].children &&
    root.children[0].children.length > 0
  ) {
    root.children = root.children[0].children;
  }

  return root;
}
