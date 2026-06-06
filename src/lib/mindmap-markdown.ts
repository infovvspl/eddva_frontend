/**
 * Parse an AI-generated mind-map Markdown outline into the tree shape consumed
 * by <MindMapVisualizer /> / <MindMapCanvas />.
 *
 * The AI ("mindmap" content type) emits:
 *   # Main Topic            → root
 *   ## Main branch          → level 1
 *   ### Sub-branch          → level 2
 *   - leaf node             → leaf (nested by indentation)
 *
 * The parser is forgiving: it tolerates a missing top-level heading, bold/`code`
 * markers, "**Key:** value" leaves (split into title + description), and stray
 * paragraph lines (attached as a description to the current node).
 */

export interface MindMapNode {
  title: string;
  description?: string;
  children: MindMapNode[];
}

const clean = (s: string): string =>
  s
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^[*_~\s]+|[*_~\s]+$/g, '')
    .trim();

export function mindmapMarkdownToTree(md: string, fallbackTitle = 'Mind Map'): MindMapNode {
  const lines = (md || '').split(/\r?\n/);

  let root: MindMapNode | null = null;
  const stack: { depth: number; node: MindMapNode }[] = [];
  let headingDepth = 0;

  // Attach `node` at the given depth: pop deeper/equal nodes, then nest under
  // the nearest shallower node (or the root).
  const attach = (node: MindMapNode, depth: number) => {
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    if (!stack.length) {
      if (!root) root = node;
      else root.children.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ depth, node });
  };

  for (const raw of lines) {
    if (!raw.trim()) continue;

    const heading = raw.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const depth = heading[1].length - 1; // '#' → 0 (root)
      const title = clean(heading[2]);
      if (!title) continue;
      const node: MindMapNode = { title, children: [] };
      if (depth === 0 && !root) {
        root = node;
        stack.length = 0;
        stack.push({ depth: 0, node });
      } else {
        attach(node, depth);
      }
      headingDepth = depth;
      continue;
    }

    const bullet = raw.match(/^(\s*)[-*+]\s+(.+)$/);
    if (bullet) {
      const indent = bullet[1].replace(/\t/g, '  ').length;
      const depth = headingDepth + 1 + Math.floor(indent / 2);
      const text = clean(bullet[2]);
      if (!text) continue;
      // "Key: value" → title + description (only when the key is short)
      const kv = text.match(/^(.{1,48}?):\s+(.+)$/);
      const node: MindMapNode = kv
        ? { title: clean(kv[1]), description: clean(kv[2]), children: [] }
        : { title: text, children: [] };
      attach(node, depth);
      continue;
    }

    // Stray paragraph → enrich the current node's description.
    if (stack.length) {
      const last = stack[stack.length - 1].node;
      const t = clean(raw);
      if (t) last.description = last.description ? `${last.description} ${t}` : t;
    }
  }

  if (!root) return { title: fallbackTitle, children: [] };
  const resolved: MindMapNode = root;
  if (!resolved.title) resolved.title = fallbackTitle;
  return resolved;
}
