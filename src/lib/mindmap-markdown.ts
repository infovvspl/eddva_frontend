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

export function mindmapMarkdownToTree(markdown: string, title = 'Mindmap'): MindMapTreeNode {
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
