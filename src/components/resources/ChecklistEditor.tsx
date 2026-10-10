import { useEffect, useRef, useState } from "react";
import { ClipboardPaste, Heading, ListChecks, Plus, Trash2, X } from "lucide-react";
import { blankRow, newRowId, parsePastedChecklist, type EditableChecklistRow } from "./checklist-format";

const MAX_ITEM_CHARS = 300;

const PASTE_PLACEHOLDER = [
  "One item per line. End a line with \":\" to make it a sub-topic heading:",
  "",
  "The water cycle:",
  "Can explain evaporation",
  "Can explain condensation",
  "Can label a diagram of the cycle",
].join("\n");

export default function ChecklistEditor({
  rows,
  onChange,
}: {
  rows: EditableChecklistRow[];
  onChange: (rows: EditableChecklistRow[]) => void;
}) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const pasted = parsePastedChecklist(pasteText);

  useEffect(() => {
    if (!focusId) return;
    inputRefs.current[focusId]?.focus();
    setFocusId(null);
  }, [focusId, rows]);

  const update = (id: string, patch: Partial<EditableChecklistRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch, text: patch.text !== undefined ? patch.text.slice(0, MAX_ITEM_CHARS) : r.text } : r)));

  const remove = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    onChange(next.length ? next : [blankRow()]);
  };

  const addRow = () => {
    const row = blankRow();
    onChange([...rows, row]);
    setFocusId(row.id);
  };

  const addPasted = () => {
    if (!pasted.rows.length) return;
    const kept = rows.filter((r) => r.text.trim());
    onChange([...kept, ...pasted.rows.map((r) => ({ ...r, id: newRowId(), text: r.text.slice(0, MAX_ITEM_CHARS) }))]);
    setPasteText("");
    setPasteOpen(false);
  };

  const filled = rows.filter((r) => r.text.trim() && !r.heading).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-surface-400">
          {filled} item{filled === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setPasteOpen((o) => !o)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-surface-200 px-2.5 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700 dark:text-surface-300"
        >
          {pasteOpen ? <X size={13} /> : <ClipboardPaste size={13} />} {pasteOpen ? "Close" : "Paste a list"}
        </button>
      </div>

      {pasteOpen && (
        <div className="space-y-2 rounded-2xl border border-brand-200 bg-brand-50/50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            autoFocus
            placeholder={PASTE_PLACEHOLDER}
            className="w-full rounded-xl border border-surface-200 bg-white p-3 text-sm text-surface-800 outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-surface-500">
              Found <b>{pasted.rows.length}</b> line{pasted.rows.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={addPasted}
              disabled={!pasted.rows.length}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
            >
              <Plus size={13} /> Add {pasted.rows.length || ""} line{pasted.rows.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <div key={r.id}
            className={`flex items-center gap-2 rounded-2xl border p-2 ${r.heading ? "border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-900/10" : "border-surface-100 dark:border-surface-700"}`}>
            <button
              type="button"
              onClick={() => update(r.id, { heading: !r.heading })}
              title={r.heading ? "Sub-topic heading — click to make it a tickable item" : "Tickable item — click to make it a sub-topic heading"}
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${r.heading ? "border-brand-400 bg-brand-100 text-brand-700 dark:bg-brand-900/40" : "border-surface-200 text-surface-400"}`}
            >
              {r.heading ? <Heading size={14} /> : <ListChecks size={14} />}
            </button>
            <input
              ref={(el) => { inputRefs.current[r.id] = el; }}
              value={r.text}
              onChange={(e) => update(r.id, { text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && i === rows.length - 1 && r.text.trim()) {
                  e.preventDefault();
                  addRow();
                }
              }}
              aria-label={r.heading ? `Heading ${i + 1}` : `Item ${i + 1}`}
              placeholder={r.heading ? "Sub-topic heading" : "Checklist item — e.g. \"Can explain the water cycle\""}
              className={`h-9 w-full min-w-0 flex-1 rounded-xl border border-surface-200 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 ${r.heading ? "font-bold text-surface-800" : "font-medium text-surface-700"}`}
            />
            <button
              type="button"
              onClick={() => remove(r.id)}
              aria-label={`Delete row ${i + 1}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-surface-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-surface-200 py-2.5 text-sm font-bold text-surface-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-surface-700"
      >
        <Plus size={15} /> Add item
      </button>
    </div>
  );
}
