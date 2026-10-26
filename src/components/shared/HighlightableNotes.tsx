import React, { useEffect, useRef, useState } from 'react';
import { Highlighter, X } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrapSchoolData } from '@/lib/api/school-client';
import { MarkdownRenderer } from './MarkdownRenderer';

const COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca'];

interface SavedHighlight {
  id: string;
  selectedText: string;
  color: string;
}

interface HighlightableNotesProps {
  /** study_materials.id this content belongs to — highlights are saved/loaded per material. */
  materialId?: string | null;
  content: string;
  className?: string;
  imageMap?: Record<string, string>;
  /** Only students highlight their own notes; teachers/admins preview read-only. */
  enabled?: boolean;
}

/**
 * Wraps MarkdownRenderer with student self-highlighting: select text, pick a
 * color, it's saved (and reloaded on the next visit) via the existing
 * `school_material_highlights` table's text-mode rows — the same substring
 * match MarkdownRenderer's `highlights` prop already renders, just not
 * previously wired to any capture UI or persistence for plain notes/study
 * guides (only the PDF viewer had that).
 */
export default function HighlightableNotes({
  materialId,
  content,
  className,
  imageMap,
  enabled = true,
}: HighlightableNotesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolbar, setToolbar] = useState<{ x: number; y: number; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const active = enabled && !!materialId;

  useEffect(() => {
    if (!active) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get(`/materials/${materialId}/highlights`)
      .then((res) => {
        if (cancelled) return;
        const rows = unwrapSchoolData<any[]>(res, []);
        setHighlights(
          (Array.isArray(rows) ? rows : [])
            .filter((h) => h.highlightType === 'text' && h.selectedText)
            .map((h) => ({ id: h.id, selectedText: h.selectedText, color: h.color || 'yellow' })),
        );
      })
      .catch((err) => console.error('Failed to load highlights', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [materialId, active]);

  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      // A click on the toolbar itself (a color swatch, or Cancel) also bubbles
      // a mouseup up to document. Without this guard, that mouseup re-runs
      // this handler first, sees the (by-then-collapsed) selection as empty,
      // and clears the toolbar out from under the click before its own
      // onClick (saveHighlight) gets to fire — so no color button ever works.
      if (toolbarRef.current?.contains(e.target as Node)) return;
      const sel = window.getSelection();
      const root = rootRef.current;
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !root) {
        setToolbar(null);
        return;
      }
      if (!sel.anchorNode || !root.contains(sel.anchorNode)) return;
      const text = sel.toString().trim().replace(/\s+/g, ' ');
      if (!text) {
        setToolbar(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      setToolbar({ x: rect.left - rootRect.left + rect.width / 2, y: rect.top - rootRect.top - 8, text });
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, [active]);

  const saveHighlight = async (color: string) => {
    if (!toolbar || saving || !materialId) return;
    setSaving(true);
    try {
      const res = await api.post(`/materials/${materialId}/highlights`, { selectedText: toolbar.text, color });
      const saved = unwrapSchoolData<any>(res, null);
      if (saved) {
        setHighlights((prev) => [...prev, { id: saved.id, selectedText: saved.selectedText, color: saved.color || color }]);
      }
      window.getSelection()?.removeAllRanges();
      setToolbar(null);
    } catch (err) {
      console.error('Failed to save highlight', err);
      toast.error('Failed to save highlight');
    } finally {
      setSaving(false);
    }
  };

  const deleteHighlight = async (id: string) => {
    if (!materialId) return;
    const prev = highlights;
    setHighlights((h) => h.filter((x) => x.id !== id)); // optimistic — a stale highlight lingering is worse than a brief flicker on failure
    try {
      await api.delete(`/materials/${materialId}/highlights/${id}`);
    } catch (err) {
      console.error('Failed to delete highlight', err);
      toast.error('Failed to delete highlight');
      setHighlights(prev);
    }
  };

  const rendererHighlights = highlights.map((h) => ({ text: h.selectedText, color: h.color }));

  return (
    <div className="relative">
      {active && toolbar && (
        <div
          ref={toolbarRef}
          className="absolute z-20 flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          style={{ left: toolbar.x, top: toolbar.y }}
        >
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={saving}
              onClick={() => saveHighlight(c)}
              className="size-5 rounded-full border border-black/10 transition hover:scale-110 disabled:opacity-50"
              style={{ backgroundColor: c }}
              title="Highlight this"
            />
          ))}
          <button
            type="button"
            onClick={() => setToolbar(null)}
            className="ml-0.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div ref={rootRef}>
        <MarkdownRenderer content={content} className={className} imageMap={imageMap} highlights={rendererHighlights} />
      </div>

      {active && !loading && highlights.length > 0 && (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
            <Highlighter size={12} /> My Highlights ({highlights.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <span
                key={h.id}
                className="inline-flex max-w-xs items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-800"
                style={{ backgroundColor: h.color }}
              >
                <span className="truncate">{h.selectedText}</span>
                <button
                  type="button"
                  onClick={() => deleteHighlight(h.id)}
                  className="shrink-0 text-slate-600/70 transition hover:text-slate-900"
                  title="Remove highlight"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
