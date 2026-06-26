import { Highlight } from '@/types/highlight';

export interface HighlightRendererOptions {
  editable: boolean;
  onDeleteClick?: (highlight: Highlight) => void;
}

interface TextNodeData {
  node: Text;
  start: number;
  end: number;
}

interface HighlightMutation {
  highlight: Highlight;
  nodeIndex: number;
  localStart: number;
  localEnd: number;
}

export class HighlightRenderer {
  private rootElement: HTMLElement;
  private options: HighlightRendererOptions;

  constructor(rootElement: HTMLElement, options: HighlightRendererOptions) {
    this.rootElement = rootElement;
    this.options = options;
  }

  /**
   * Clears all existing highlights from the DOM by replacing <mark> tags
   * with their text content and normalizing the tree.
   */
  public clear() {
    const marks = Array.from(this.rootElement.querySelectorAll('mark[data-hl="1"]'));
    for (const mark of marks) {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      }
    }
    this.rootElement.normalize();
  }

  /**
   * Renders the given highlights using a single TreeWalker pass and a mutation plan.
   */
  public render(highlights: Highlight[]) {
    this.clear();

    if (!highlights || highlights.length === 0) return;

    // 1. Collect all Text nodes and their absolute offset ranges
    const walker = document.createTreeWalker(this.rootElement, NodeFilter.SHOW_TEXT);
    const textNodes: TextNodeData[] = [];
    let currentOffset = 0;
    
    let currentNode: Node | null;
    while ((currentNode = walker.nextNode())) {
      const textNode = currentNode as Text;
      const length = textNode.length;
      textNodes.push({
        node: textNode,
        start: currentOffset,
        end: currentOffset + length,
      });
      currentOffset += length;
    }

    // 2. Build Mutation Plan
    const mutations: HighlightMutation[] = [];
    const coveredRanges: { start: number, end: number }[] = [];

    const isCovered = (start: number, end: number) => {
      return coveredRanges.some(r => Math.max(start, r.start) < Math.min(end, r.end));
    };

    // Sort highlights deterministically
    const sortedHighlights = [...highlights].sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.startOffset - b.startOffset;
    });

    for (const hl of sortedHighlights) {
      if (isCovered(hl.startOffset, hl.endOffset)) {
        continue; // Prevent nested marks
      }

      let overlapFound = false;

      for (let i = 0; i < textNodes.length; i++) {
        const tn = textNodes[i];
        
        // 4. Determine overlap
        if (hl.startOffset < tn.end && hl.endOffset > tn.start) {
          overlapFound = true;
          const localStart = Math.max(0, hl.startOffset - tn.start);
          const localEnd = Math.min(tn.node.length, hl.endOffset - tn.start);
          
          if (localStart < localEnd) {
            mutations.push({
              highlight: hl,
              nodeIndex: i,
              localStart,
              localEnd
            });
          }
        }
      }

      if (overlapFound) {
        coveredRanges.push({ start: hl.startOffset, end: hl.endOffset });
      }
    }

    // Sort mutations descending by nodeIndex, and then descending by localStart
    // This allows us to modify nodes safely from back to front without messing up earlier offsets.
    mutations.sort((a, b) => {
      if (a.nodeIndex !== b.nodeIndex) return b.nodeIndex - a.nodeIndex;
      return b.localStart - a.localStart;
    });

    // 5. Apply DOM updates in batch
    for (const mut of mutations) {
      const tn = textNodes[mut.nodeIndex];
      const textNode = tn.node;

      try {
        // Split and wrap
        let targetNode = textNode;
        
        if (mut.localEnd < targetNode.length) {
          targetNode.splitText(mut.localEnd);
        }
        
        if (mut.localStart > 0) {
          targetNode = targetNode.splitText(mut.localStart);
        }

        const mark = document.createElement('mark');
        mark.setAttribute('data-hl', '1');
        mark.setAttribute('data-id', mut.highlight.id);
        mark.style.backgroundColor = mut.highlight.color;
        // Accessibility
        mark.setAttribute('role', 'mark');
        mark.setAttribute('aria-label', 'Highlighted text');
        mark.className = 'transition-colors rounded-sm px-0.5 relative group cursor-pointer';

        if (this.options.editable && this.options.onDeleteClick) {
          mark.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.options.onDeleteClick!(mut.highlight);
          };
        }

        const parent = targetNode.parentNode;
        if (parent) {
          parent.insertBefore(mark, targetNode);
          mark.appendChild(targetNode);
        }
      } catch (err) {
        console.error('Failed to apply highlight mutation', err, mut);
      }
    }
  }
}
