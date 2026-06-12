import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

export type PdfHighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PdfHighlight = {
  id: string;
  pageNumber: number;
  selectedText: string;
  rects: PdfHighlightRect[];
  color?: string; // Always yellow for now
};

type Props = {
  pageNumber: number;
  resourceId: string;
  containerRef: React.RefObject<HTMLDivElement>;
  isTeacher: boolean;
};

export default function PdfHighlightOverlay({
  pageNumber,
  resourceId,
  containerRef,
  isTeacher,
}: Props) {
  const [highlights, setHighlights] = useState<PdfHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch highlights
  useEffect(() => {
    let mounted = true;
    async function fetchHighlights() {
      try {
        const res = await apiClient.get(
          `/school/materials/${resourceId}/highlights`
        );
        if (mounted && res.data?.data) {
          const pageHighlights = res.data.data.filter(
            (h: any) => h.pageNumber === pageNumber
          );
          setHighlights(pageHighlights);
        }
      } catch (err) {
        console.error("Failed to load highlights", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (resourceId) {
      fetchHighlights();
    } else {
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [resourceId, pageNumber]);

  const handleMouseUp = useCallback(async () => {
    if (!isTeacher) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    const containerRect = container.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects());

    const normalizedRects: PdfHighlightRect[] = clientRects.map((rect) => {
      return {
        x: ((rect.left - containerRect.left) / containerRect.width) * 100,
        y: ((rect.top - containerRect.top) / containerRect.height) * 100,
        width: (rect.width / containerRect.width) * 100,
        height: (rect.height / containerRect.height) * 100,
      };
    });

    // Clear selection immediately
    selection.removeAllRanges();

    // Optimistically add
    const tempId = `temp-${Date.now()}`;
    const newHighlight: PdfHighlight = {
      id: tempId,
      pageNumber,
      selectedText,
      rects: normalizedRects,
      color: "yellow",
    };
    setHighlights((prev) => [...prev, newHighlight]);

    try {
      const res = await apiClient.post(
        `/school/materials/${resourceId}/highlights`,
        {
          pageNumber,
          selectedText,
          rects: normalizedRects,
        }
      );
      if (res.data?.data) {
        setHighlights((prev) =>
          prev.map((h) => (h.id === tempId ? res.data.data : h))
        );
        toast.success("Highlight saved");
      }
    } catch (err) {
      console.error("Failed to save highlight", err);
      setHighlights((prev) => prev.filter((h) => h.id !== tempId));
      toast.error("Failed to save highlight");
    }
  }, [isTeacher, containerRef, pageNumber, resourceId]);

  useEffect(() => {
    const container = containerRef.current;
    if (container && isTeacher) {
      container.addEventListener("mouseup", handleMouseUp);
      return () => container.removeEventListener("mouseup", handleMouseUp);
    }
  }, [containerRef, handleMouseUp, isTeacher]);

  if (loading) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {highlights.map((h) => (
        <div key={h.id}>
          {h.rects.map((r, i) => (
            <div
              key={`${h.id}-${i}`}
              className="absolute mix-blend-multiply pointer-events-auto cursor-pointer"
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.width}%`,
                height: `${r.height}%`,
                backgroundColor: "rgba(253, 224, 71, 0.4)", // yellow-300 with opacity
              }}
              title={h.selectedText}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
