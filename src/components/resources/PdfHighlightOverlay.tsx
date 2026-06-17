import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Trash2, Edit2, X, Check, FileEdit, AlertCircle } from "lucide-react";

export type PdfHighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum HighlightCategory {
  CONCEPT = "concept",
  EXAM = "exam",
  EXAMPLE = "example",
  REVISE = "revise",
  MUST_KNOW = "must_know",
  TEACHER_NOTE = "teacher_note",
}

export type PdfHighlight = {
  id: string;
  pageNumber: number;
  selectedText: string;
  rects: PdfHighlightRect[];
  color?: string;
  category?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface ActiveHighlightSelection {
  pageNumber: number;
  pendingRects: PdfHighlightRect[];
  pendingText: string;
  toolbarPos: { x: number; y: number };
}

type Props = {
  pageNumber: number;
  resourceId: string;
  isTeacher: boolean;
  highlights: PdfHighlight[];
  setHighlights: React.Dispatch<React.SetStateAction<PdfHighlight[]>>;
  activeSelection?: ActiveHighlightSelection | null;
  onClearSelection?: () => void;
};

export const HIGHLIGHT_CATEGORIES = [
  { id: HighlightCategory.CONCEPT, label: "Concept", icon: "🟨", hex: "#FDE047", bg: "bg-yellow-400" },
  { id: HighlightCategory.EXAM, label: "Exam", icon: "🟩", hex: "#86EFAC", bg: "bg-green-400" },
  { id: HighlightCategory.EXAMPLE, label: "Example", icon: "🟦", hex: "#93C5FD", bg: "bg-blue-400" },
  { id: HighlightCategory.REVISE, label: "Revise", icon: "🟧", hex: "#FDBA74", bg: "bg-orange-400" },
  { id: HighlightCategory.MUST_KNOW, label: "Must Know", icon: "🟥", hex: "#FCA5A5", bg: "bg-red-400" },
  { id: HighlightCategory.TEACHER_NOTE, label: "Teacher Note", icon: "🟪", hex: "#C4B5FD", bg: "bg-purple-400" },
];

function hexToRgba(hex: string, alpha: number) {
  if (!hex) return `rgba(253, 224, 71, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PdfHighlightOverlay({
  pageNumber,
  resourceId,
  isTeacher,
  highlights,
  setHighlights,
  activeSelection,
  onClearSelection,
}: Props) {
  // Note Popup State
  const [notePopup, setNotePopup] = useState<{
    categoryId: HighlightCategory;
    colorHex: string;
  } | null>(null);
  const [noteText, setNoteText] = useState("");

  // Hover Tooltip State
  const [hoveredHighlight, setHoveredHighlight] = useState<string | null>(null);

  // Context Menu State
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"menu" | "category" | "note" | "delete" | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  if (pageNumber === 14) {
    console.log("CHECKPOINT_2_OVERLAY", {
      pageNumber,
      highlightCount: highlights.length,
      hasTargetHighlight: highlights.some(h => h.id === "e3a15e3d-e3b7-4b97-b32b-b88ea0314378")
    });
  }

  const pageHighlights = highlights.filter(h => {
    if (h.id === "e3a15e3d-e3b7-4b97-b32b-b88ea0314378") {
      console.log("CHECKPOINT_3_FILTER", {
        highlightId: h.id,
        highlightPage: h.pageNumber,
        overlayPage: pageNumber,
        passes: h.pageNumber === pageNumber,
        highlightPageType: typeof h.pageNumber,
        overlayPageType: typeof pageNumber
      });
    }
    return h.pageNumber === pageNumber;
  });

  // ── Save Highlight ────────────────────────────────────────────────────────
  const handleCategorySelect = (cat: typeof HIGHLIGHT_CATEGORIES[0]) => {
    if (cat.id === HighlightCategory.TEACHER_NOTE) {
      setNotePopup({ categoryId: cat.id, colorHex: cat.hex });
    } else {
      saveHighlight(cat.id, cat.hex, "");
    }
  };

  const saveHighlight = async (categoryId: string, colorHex: string, note: string) => {
    if (!activeSelection?.pendingRects || activeSelection.pendingRects.length === 0) return;

    window.getSelection()?.removeAllRanges();

    const payload = {
      pageNumber,
      selectedText: activeSelection.pendingText,
      rects: activeSelection.pendingRects,
      color: colorHex,
      category: categoryId,
      note: note,
    };

    onClearSelection?.();
    setNotePopup(null);

    const tempId = `temp-${Date.now()}`;
    const optimistic: PdfHighlight = {
      id: tempId,
      ...payload,
      createdAt: new Date().toISOString(),
    };
    setHighlights(prev => [...prev, optimistic]);

    try {
      const res = await apiClient.post(`/school/materials/${resourceId}/highlights`, payload);
      if (res.data?.data) {
        setHighlights(prev => prev.map(h => (h.id === tempId ? res.data.data : h)));
        toast.success("Highlight saved");
      }
    } catch (err) {
      setHighlights(prev => prev.filter(h => h.id !== tempId));
      toast.error("Failed to save highlight");
    }
  };

  // ── Edit/Delete Highlight ──────────────────────────────────────────────────
  const updateHighlight = async (highlightId: string, updates: Partial<PdfHighlight>) => {
    const original = highlights.find(h => h.id === highlightId);
    if (!original) return;

    setHighlights(prev => prev.map(h => (h.id === highlightId ? { ...h, ...updates } : h)));

    try {
      await apiClient.patch(`/school/materials/${resourceId}/highlights/${highlightId}`, updates);
      toast.success("Highlight updated");
    } catch (err) {
      setHighlights(prev => prev.map(h => (h.id === highlightId ? original : h)));
      toast.error("Failed to update highlight");
    }
  };

  const deleteHighlight = async (highlightId: string) => {
    const original = highlights.find(h => h.id === highlightId);
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    setActiveHighlightId(null);
    setEditMode(null);

    try {
      await apiClient.delete(`/school/materials/${resourceId}/highlights/${highlightId}`);
      toast.success("Highlight deleted");
    } catch (err) {
      if (original) setHighlights(prev => [...prev, original]);
      toast.error("Failed to delete highlight");
    }
  };

  return (
    <div ref={overlayRef} className="absolute inset-0 z-10 pointer-events-none">
      {/* ── Render Highlights ── */}
      {pageHighlights.map(h => {
        const catObj = HIGHLIGHT_CATEGORIES.find(c => c.id === h.category) || HIGHLIGHT_CATEGORIES[0];
        const hex = h.color || catObj.hex;
        const isActive = activeHighlightId === h.id;
        const isHovered = hoveredHighlight === h.id && !isActive;
        const lastRect = h.rects[h.rects.length - 1];

        if (h.id === "e3a15e3d-e3b7-4b97-b32b-b88ea0314378") {
          console.log("CHECKPOINT_4_RENDER", {
            id: h.id,
            rectCount: h.rects?.length,
            isArray: Array.isArray(h.rects)
          });
        }

        return (
          <div key={h.id}>
            {/* The Highlight Rects */}
            {h.rects.map((r, i) => {
              if (h.id === "e3a15e3d-e3b7-4b97-b32b-b88ea0314378") {
                console.log("CHECKPOINT_5_CSS", {
                  rectIndex: i,
                  left: `${r.x}%`,
                  top: `${r.y}%`,
                  width: `${r.width}%`,
                  height: `${r.height}%`,
                  backgroundColor: hexToRgba(hex, 0.45),
                  opacity: isActive ? 1 : 0.8,
                  zIndex: "not set in style",
                  hexRaw: hex
                });
              }
              return (
                <div
                  key={`${h.id}-${i}`}
                  className={cn(
                    "absolute mix-blend-multiply pointer-events-auto cursor-pointer transition-opacity highlight-interactive",
                    isActive ? "opacity-100 ring-2 ring-indigo-400" : "opacity-80 hover:opacity-100"
                  )}
                  style={{
                    left: `${r.x}%`,
                    top: `${r.y}%`,
                    width: `${r.width}%`,
                    height: `${r.height}%`,
                    backgroundColor: hexToRgba(hex, 0.45),
                  }}
                  onMouseEnter={() => setHoveredHighlight(h.id)}
                  onMouseLeave={() => setHoveredHighlight(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (isTeacher) {
                      window.getSelection()?.removeAllRanges();
                      setActiveHighlightId(h.id);
                      setEditMode("menu");
                      setNoteText(h.note || "");
                    }
                  }}
                />
              );
            })}

            {/* Hover Tooltip */}
            <AnimatePresence>
              {isHovered && isTeacher && !activeHighlightId && !activeSelection && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="highlight-interactive absolute z-40 bg-white/90 backdrop-blur-md shadow-xl rounded-xl border border-slate-200 p-3 w-64 pointer-events-none"
                  style={{
                    left: `${Math.min(lastRect.x + lastRect.width / 2, 75)}%`,
                    top: `${lastRect.y + lastRect.height}%`,
                    transform: 'translate(-50%, 8px)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{catObj.icon}</span>
                    <span className="text-xs font-bold text-slate-700">{catObj.label}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {h.createdAt ? format(new Date(h.createdAt), "dd MMM yy") : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 italic border-l-2 border-slate-200 pl-2">
                    "{h.selectedText}"
                  </p>
                  {h.note && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-800">{h.note}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit / Context Menu */}
            <AnimatePresence>
              {isActive && isTeacher && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="highlight-interactive absolute z-50 pointer-events-auto bg-white/95 backdrop-blur-md shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 overflow-hidden"
                  style={{
                    left: `${Math.min(lastRect.x + lastRect.width / 2, 75)}%`,
                    top: `${lastRect.y + lastRect.height}%`,
                    transform: 'translate(-50%, 8px)',
                    minWidth: '200px'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {editMode === "menu" && (
                    <div className="flex flex-col p-1">
                      <button onClick={() => setEditMode("category")} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-xl transition-colors">
                        <span className="w-5">{catObj.icon}</span> Edit Category
                      </button>
                      <button onClick={() => setEditMode("note")} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-xl transition-colors">
                        <FileEdit className="w-4 h-4 ml-0.5 text-slate-400" /> {h.note ? "Edit Note" : "Add Note"}
                      </button>
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      <button onClick={() => setEditMode("delete")} className="flex items-center gap-3 px-3 py-2 hover:bg-red-50 text-sm font-medium text-red-600 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4 ml-0.5" /> Delete Highlight
                      </button>
                    </div>
                  )}

                  {editMode === "category" && (
                    <div className="p-2 w-48 grid grid-cols-2 gap-1">
                      {HIGHLIGHT_CATEGORIES.map(c => (
                        <button
                          key={c.id}
                          onClick={async () => {
                            await updateHighlight(h.id, {
                              category: c.id,
                              color: c.hex
                            });

                            setActiveHighlightId(null);
                            setEditMode(null);
                          }}
                          className={cn(
                            "flex items-center gap-2 p-2 text-xs font-medium rounded-lg transition-colors hover:bg-slate-50",
                            h.category === c.id ? "bg-slate-50 ring-1 ring-slate-200" : ""
                          )}
                        >
                          <span>{c.icon}</span> <span className="truncate">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {editMode === "note" && (
                    <div className="p-3 w-64 flex flex-col gap-2">
                      <p className="text-xs font-bold text-slate-700">Teacher Note</p>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note..."
                        className="w-full text-sm p-2 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-20"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setEditMode("menu")} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">Cancel</button>
                        <button
                          onClick={async () => {
                            await updateHighlight(h.id, {
                              note: noteText,
                              category: h.category,
                              color: h.color
                            });

                            setActiveHighlightId(null);
                            setEditMode(null);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  )}

                  {editMode === "delete" && (
                    <div className="p-3 w-56 text-center">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800 mb-1">Delete Highlight?</p>
                      <p className="text-xs text-slate-500 mb-4">This action cannot be undone.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setEditMode("menu")} className="flex-1 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                        <button onClick={() => deleteHighlight(h.id)} className="flex-1 py-1.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* ── Render Pending Highlight (Preview) ── */}
      {activeSelection?.pendingRects && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {activeSelection.pendingRects.map((rect, i) => (
            <div
              key={`pending_${i}`}
              className="absolute bg-blue-400/40 mix-blend-multiply"
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Creation Toolbar (Categories) ── */}
      <AnimatePresence>
        {activeSelection?.pendingRects && activeSelection?.toolbarPos && isTeacher && !notePopup && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="highlight-interactive absolute z-50 pointer-events-auto bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/50 rounded-2xl border border-white p-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1 w-72"
            style={{
              left: `${activeSelection.toolbarPos.x}%`,
              top: `calc(${activeSelection.toolbarPos.y}% + 8px)`,
              transform: "translateX(-50%)",
            }}
          >
            {HIGHLIGHT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="flex items-center gap-2 px-2.5 py-2 hover:bg-white rounded-xl transition-all hover:shadow-sm group text-left"
              >
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-black/5 shadow-inner", cat.bg)}>
                  <span className="text-[10px]">{cat.icon}</span>
                </div>
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 truncate">
                  {cat.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Teacher Note Popup ── */}
      <AnimatePresence>
        {activeSelection?.pendingRects && activeSelection?.toolbarPos && isTeacher && notePopup && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="highlight-interactive absolute z-50 pointer-events-auto bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-200 p-4 w-72"
            style={{
              left: `${activeSelection.toolbarPos.x}%`,
              top: `calc(${activeSelection.toolbarPos.y}% + 8px)`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🟪</span>
              <p className="text-sm font-bold text-slate-800">Add Teacher Note</p>
            </div>
            <textarea
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Type your explanation or note here..."
              className="w-full h-24 p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setNotePopup(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveHighlight(notePopup.categoryId, notePopup.colorHex, noteText)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save Highlight
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
