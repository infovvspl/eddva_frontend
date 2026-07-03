import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ExternalLink, FileText, Loader2,
  Zap, CheckCircle2, RotateCcw, ChevronLeft, ChevronRight,
  ListChecks, Check, Trophy, AlertCircle, Maximize2, Minimize2,
  ZoomIn, ZoomOut, BarChart3, Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import DppContentRenderer from "@/components/DppContentRenderer";
import { getResourceDownloadUrl } from "@/lib/api/student";
import { apiClient, tokenStorage } from "@/lib/api/client";
import { toast } from "sonner";
import { getApiOrigin } from "@/lib/api-config";
import { useAuth } from "@/context/SchoolAuthContext";
import PdfHighlightOverlay from "@/components/resources/PdfHighlightOverlay";
import {
  HIGHLIGHT_CATEGORIES,
  type ActiveHighlightSelection,
  type PdfHighlight,
  type PdfHighlightRect,
} from "@/components/resources/pdf-highlight-types";

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
const _API_ORIGIN = getApiOrigin();

function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

import FlashcardViewer from "@/components/resources/FlashcardViewer";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { MindMapCanvas } from "@/components/school/MindMapVisualizer";
import { mindmapMarkdownToTree } from "@/lib/mindmap-markdown";

function findPracticeSectionStart(content: string, patterns: RegExp[]) {
  let cursor = 0;
  for (const line of content.split("\n")) {
    const normalized = line.replace(/^#{1,6}\s*/, "").replace(/^\*\*\s*|\s*\*\*$/g, "").trim();
    if (patterns.some((pattern) => pattern.test(normalized))) return cursor;
    cursor += line.length + 1;
  }
  return -1;
}

function splitPracticeContent(content: string, type: string) {
  if (!content || (type !== "pyq" && type !== "dpp")) return null;
  const patterns = type === "pyq"
    ? [/^detailed\s+solutions?\b/i, /^solutions?\b/i, /^answer\s+key\b/i]
    : [/^detailed\s+solutions?\b/i, /^answer\s+key\b/i, /^answers?\b/i, /^solutions?\b/i];
  const splitAt = findPracticeSectionStart(content, patterns);
  if (splitAt <= 0) return null;
  const questions = content.slice(0, splitAt).trim();
  const solutions = content.slice(splitAt).trim();
  return questions && solutions ? { questions, solutions } : null;
}

function PracticePagedViewer({ content, type }: { content: string; type: string }) {
  const pages = useMemo(() => splitPracticeContent(content, type), [content, type]);
  const [page, setPage] = useState<"questions" | "solutions">("questions");

  useEffect(() => setPage("questions"), [content, type]);
  if (!pages) return <DppContentRenderer content={content} />;

  return (
    <div>
      <div className="sticky top-2 z-20 mb-5 flex rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
        <button type="button" onClick={() => setPage("questions")} className={cn("flex-1 rounded-lg px-3 py-2 text-xs font-black transition", page === "questions" ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-100")}>Questions</button>
        <button type="button" onClick={() => setPage("solutions")} className={cn("flex-1 rounded-lg px-3 py-2 text-xs font-black transition", page === "solutions" ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-100")}>{type === "pyq" ? "Detailed Solutions" : "Answer Key"}</button>
      </div>
      <MarkdownRenderer content={page === "questions" ? pages.questions : pages.solutions} className="prose-slate max-w-none" />
    </div>
  );
}

// ─── Checklist Viewer ─────────────────────────────────────────────────────────

function ChecklistViewer({ content, title }: { content: string; title: string }) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`checklist_state_${title}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(`checklist_state_${title}`, JSON.stringify(checkedItems));
  }, [checkedItems, title]);

  const sections = useMemo(() => {
    const lines = content.split("\n");
    const result: { title: string; items: string[] }[] = [];
    let currentSection = { title: "General", items: [] as string[] };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (/^#+\s+/.test(line)) {
        if (currentSection.items.length > 0 || currentSection.title !== "General") {
          result.push(currentSection);
        }
        currentSection = { title: line.replace(/^#+\s+/, "").trim(), items: [] };
      } else if (/^[*+-]\s+\[\s*\]\s+/.test(line) || /^[*+-]\s+/.test(line)) {
        currentSection.items.push(line.replace(/^[*+-]\s+\[\s*\]\s+/, "").replace(/^[*+-]\s+/, "").trim());
      } else if (currentSection.items.length > 0) {
        const lastIdx = currentSection.items.length - 1;
        currentSection.items[lastIdx] += " " + line;
      }
    }
    if (currentSection.items.length > 0 || currentSection.title !== "General") {
      result.push(currentSection);
    }
    return result;
  }, [content]);

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  if (sections.length === 0) return <DppContentRenderer content={content} />;

  const toggleItem = (itemText: string) => {
    setCheckedItems(prev => ({ ...prev, [itemText]: !prev[itemText] }));
  };

  return (
    <div className="py-4">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md pb-6 pt-2 border-b border-slate-100 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <ListChecks className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Your Progress</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {completedCount} of {totalItems} items completed
              </p>
            </div>
          </div>
          <span className="text-xl font-black text-indigo-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section, si) => (
          <div key={si} className="space-y-4">
            <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] px-1 border-l-4 border-indigo-500 pl-3 py-1">
              {section.title}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {section.items.map((item, ii) => {
                const isChecked = !!checkedItems[item];
                return (
                  <button
                    key={ii}
                    onClick={() => toggleItem(item)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all group",
                      isChecked
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-white border-slate-50 hover:border-slate-200 hover:shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all mt-0.5",
                      isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 group-hover:border-indigo-300"
                    )}>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={cn(
                      "text-[13px] font-medium leading-relaxed transition-all",
                      isChecked ? "line-through opacity-60" : "text-slate-700"
                    )}>
                      <MarkdownRenderer content={item} className="inline prose-p:my-0" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {progress === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-center shadow-xl shadow-emerald-500/20"
        >
          <Trophy className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-black mb-2">Topic Mastered!</h3>
          <p className="text-sm font-medium text-white/80">You've completed all items in this checklist. Great job!</p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface ResourceViewerModalProps {
  title: string;
  content?: string; // Markdown/AI content
  fileUrl?: string | null;
  externalUrl?: string | null;
  type: string;
  topicId?: string;
  resourceId?: string;
  isTeacher?: boolean;
  allowHighlights?: boolean;
  currentUserId?: string | null;
  isFullPage?: boolean;
  hideFullscreen?: boolean;
  onClose: () => void;
}

const RESOURCE_META: Record<string, {
  label: string; icon: React.ReactNode; color: string; bg: string; border: string;
}> = {
  dpp: { label: "DPP", icon: <FileText className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  pyq: { label: "PYQ", icon: <Trophy className="w-4 h-4" />, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  pdf: { label: "Lecture Notes", icon: <FileText className="w-4 h-4" />, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  notes: { label: "Handwritten Notes", icon: <FileText className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  mindmap: { label: "Mindmap", icon: <Brain className="w-4 h-4" />, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
  quiz: { label: "Quiz", icon: <FlaskConical className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function Brain(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" /></svg>
  );
}

function FlaskConical(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.5" /><path d="M14 2v7.5" /><path d="M8.5 13h7" /><path d="M16 3H8" /><path d="M12 2a3 3 0 0 1 3 3v4.5l5.3 9a2 2 0 0 1-1.7 3H5.4a2 2 0 0 1-1.7-3l5.3-9V5a3 3 0 0 1 3-3Z" /></svg>
  );
}

// ─── Internal PDF Viewer (react-pdf) ──────────────────────────────────────────

function InternalPdfViewer({ url, resourceId, isTeacher, allowHighlights, currentUserId, highlights, setHighlights, useOuterScroll = false, scale = 1.2 }: { url: string, resourceId?: string, isTeacher?: boolean, allowHighlights?: boolean, currentUserId?: string | null, highlights: PdfHighlight[], setHighlights: React.Dispatch<React.SetStateAction<PdfHighlight[]>>, useOuterScroll?: boolean, scale?: number }) {
  const [numPages, setNumPages] = useState<number>();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canAnnotate = !!(isTeacher || allowHighlights);

  const [activeSelection, setActiveSelection] = useState<ActiveHighlightSelection | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    let active = true;
    if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
      setBlobUrl(url || null);
      return;
    }

    const targetUrl = (url.startsWith('http') && !url.includes('/proxy-pdf'))
      ? `${_API_ORIGIN}/api/v1/school/materials/proxy-pdf?url=${encodeURIComponent(url)}`
      : url;

    fetch(targetUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (active) {
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
        }
      })
      .catch((err) => {
        console.warn("PDF fetch blob failed", err);
        if (active) setBlobUrl(url);
      });

    return () => {
      active = false;
    };
  }, [url]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!canAnnotate) return;

    const target = e.target as HTMLElement;
    const isInteractive = !!target.closest('.highlight-interactive');
    if (isInteractive) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setActiveSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setActiveSelection(null);
      return;
    }

    const selectionBounds = range.getBoundingClientRect();
    const selMidY = selectionBounds.top + selectionBounds.height / 2;
    const selMidX = selectionBounds.left + selectionBounds.width / 2;

    let selectedPageNumber = -1;
    let owningBounds: DOMRect | null = null;

    for (let i = 1; i <= (numPages || 0); i++) {
      const pageWrapper = pageRefs.current[i];
      if (!pageWrapper) continue;
      const overlayBounds = pageWrapper.getBoundingClientRect();
      if (
        selMidX >= overlayBounds.left &&
        selMidX <= overlayBounds.right &&
        selMidY >= overlayBounds.top &&
        selMidY <= overlayBounds.bottom
      ) {
        selectedPageNumber = i;
        owningBounds = overlayBounds;
        break;
      }
    }

    if (selectedPageNumber === -1 || !owningBounds) return;

    const rawRects = Array.from(range.getClientRects());
    const filteredRects = rawRects.filter(r =>
      r.width > 1 && r.height > 1 && Number.isFinite(r.width) && Number.isFinite(r.height)
    );

    if (filteredRects.length === 0) return;

    const normalizedRects: PdfHighlightRect[] = filteredRects.map(r => ({
      x: ((r.left - owningBounds!.left) / owningBounds!.width) * 100,
      y: ((r.top - owningBounds!.top) / owningBounds!.height) * 100,
      width: (r.width / owningBounds!.width) * 100,
      height: (r.height / owningBounds!.height) * 100,
    }));

    const validRects = normalizedRects.filter(r =>
      r.width > 0.5 && r.height > 0.1 &&
      r.y >= -1 && r.y <= 101 && r.x >= -1 && r.x <= 101
    );

    if (validRects.length === 0) return;

    const LINE_TOLERANCE = 1.5;
    const X_GAP_TOLERANCE = 3.0;

    validRects.sort((a, b) => {
      if (Math.abs(a.y - b.y) <= LINE_TOLERANCE) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    const mergedRects: PdfHighlightRect[] = [];
    let currentRect: PdfHighlightRect | null = null;

    for (const rect of validRects) {
      if (!currentRect) {
        currentRect = { ...rect };
        mergedRects.push(currentRect);
        continue;
      }

      const isSameLine = Math.abs(currentRect.y - rect.y) <= LINE_TOLERANCE;
      const isAdjacent = (rect.x - (currentRect.x + currentRect.width)) <= X_GAP_TOLERANCE;

      if (isSameLine && isAdjacent) {
        const newX = Math.min(currentRect.x, rect.x);
        const newRight = Math.max(currentRect.x + currentRect.width, rect.x + rect.width);
        currentRect.x = newX;
        currentRect.width = newRight - newX;
        currentRect.height = Math.max(currentRect.height, rect.height);
        currentRect.y = Math.min(currentRect.y, rect.y);
      } else {
        currentRect = { ...rect };
        mergedRects.push(currentRect);
      }
    }

    if (mergedRects.length === 0) return;

    const lastRect = mergedRects[mergedRects.length - 1];

    setActiveSelection({
      pageNumber: selectedPageNumber,
      pendingRects: mergedRects,
      pendingText: selectedText,
      toolbarPos: {
        x: Math.min(lastRect.x + lastRect.width / 2, 90),
        y: lastRect.y + lastRect.height,
      }
    });
  }, [canAnnotate, numPages]);

  useEffect(() => {
    if (!canAnnotate) return;
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp, canAnnotate]);

  const safePdfUrl = useMemo(() => {
    if (blobUrl) return blobUrl;
    if (!url) return null;
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;
    if (url.startsWith('http')) {
      return `${_API_ORIGIN}/api/v1/school/materials/proxy-pdf?url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [blobUrl, url]);

  return (
    <div ref={containerRef} className={cn("p-4 md:p-8 flex justify-center w-full relative", useOuterScroll ? "overflow-visible" : "flex-1 overflow-auto")}>
      <Document
        file={safePdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => {
          console.error("PDF Load Error:", error);
        }}
        onSourceError={(error) => {
          console.error("PDF Source Error:", error);
        }}
        loading={
          <div className="flex items-center justify-center h-full w-full gap-3 text-indigo-600 font-bold p-10">
            <Loader2 className="w-8 h-8 animate-spin" />
            Loading PDF...
          </div>
        }
        className="flex flex-col items-center min-w-min gap-6 pb-20"
      >
        {numPages &&
          Array.from({ length: numPages }, (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => {
                pageRefs.current[index + 1] = el;
              }}
              className="relative shadow-lg bg-white"
            >
              <Page
                pageNumber={index + 1}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="w-[800px] h-[1000px] bg-white animate-pulse" />
                }
                onRenderError={(error) => {
                  console.error(
                    `Page ${index + 1} render error:`,
                    error
                  );
                }}
              />
              {resourceId && (
                <PdfHighlightOverlay
                  pageNumber={index + 1}
                  resourceId={resourceId}
                  isTeacher={!!isTeacher}
                  allowEditing={canAnnotate}
                  currentUserId={currentUserId}
                  highlights={highlights}
                  setHighlights={setHighlights}
                  activeSelection={activeSelection?.pageNumber === index + 1 ? activeSelection : null}
                  onClearSelection={() => setActiveSelection(null)}
                />
              )}
            </div>
          ))}
      </Document>
    </div>
  );
}

export default function ResourceViewerModal({
  title, content, fileUrl, externalUrl, type, topicId, resourceId, isTeacher, allowHighlights, currentUserId, isFullPage, hideFullscreen = false, onClose
}: ResourceViewerModalProps) {
  const { user } = useAuth();
  const activeUserId = currentUserId ?? user?.id ?? null;
  const [downloading, setDownloading] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(!!fileUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.2);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [highlights, setHighlights] = useState<PdfHighlight[]>([]);
  const canUseHighlights = !!(isTeacher || allowHighlights);

  useEffect(() => {
    let mounted = true;
    const normalizedType = type.toLowerCase();
    const isPdfByUrl = fileUrl?.match(/\.pdf(?:$|[?#])/i);
    const isPdfLike = !!isPdfByUrl || normalizedType.includes("pdf") || normalizedType.includes("ebook");

    if (!resourceId || !canUseHighlights || !isPdfLike) {
      return;
    }

    apiClient.get(`/school/materials/${resourceId}/highlights`)
      .then(res => {
        if (mounted && res.data?.data) {
          setHighlights(res.data.data);
        }
      })
      .catch(err => console.error("Failed to load highlights", err));

    return () => { mounted = false; };
  }, [resourceId, canUseHighlights, type, fileUrl]);

  const analyticsData = useMemo(() => {
    const counts: Record<string, number> = {};
    highlights.forEach((h: PdfHighlight) => {
      const cat = h.category || "concept";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [highlights]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const meta = (() => {
    const normType = type.toLowerCase();
    const base = RESOURCE_META[normType] ?? RESOURCE_META.dpp;
    if (normType === "notes") {
      const t = title.toLowerCase();
      if (t.includes("study guide")) {
        return { label: "Study Guide", icon: <Brain className="w-4 h-4" />, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" };
      }
      if (t.includes("key concept")) {
        return { label: "Key Concepts", icon: <Lightbulb className="w-4 h-4" />, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
      }
      if (t.includes("flashcard")) {
        return { label: "Flashcards", icon: <FileText className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
      }
      if (t.includes("checklist") || t.includes("revision checklist")) {
        return { label: "Revision Checklist", icon: <ListChecks className="w-4 h-4" />, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" };
      }
    }
    return base;
  })();

  useEffect(() => {
    async function fetchUrl() {
      if (fileUrl) {
        const resolved = resolveUrl(fileUrl);
        if (resolved) {
          setPresignedUrl(resolved);
          setLoadingFile(false);
          return;
        }
      }
      if (!topicId || !resourceId) {
        setPresignedUrl(resolveUrl(fileUrl) || null);
        setLoadingFile(false);
        return;
      }
      try {
        const result = await getResourceDownloadUrl(topicId, resourceId);
        setPresignedUrl(result.url ? resolveUrl(result.url) || result.url : resolveUrl(fileUrl) || null);
      } catch (err) {
        console.error("Failed to get presigned URL", err);
        setPresignedUrl(resolveUrl(fileUrl) || null);
      } finally {
        setLoadingFile(false);
      }
    }
    fetchUrl();
  }, [fileUrl, topicId, resourceId]);

  const normalizedType = type.toLowerCase();
  const mindmapTree = useMemo(
    () => normalizedType === "mindmap" && content ? mindmapMarkdownToTree(content, title) : null,
    [content, normalizedType, title],
  );
  const isImage = fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)(?:$|[?#])/i);
  const isPdf = !!fileUrl?.match(/\.pdf(?:$|[?#])/i) || normalizedType.includes("pdf") || normalizedType.includes("ebook");

  const innerContent = (
    <>
      {/* Header */}
      <div className={cn("flex items-center gap-4 px-6 py-4 border-b shrink-0", meta.bg, meta.border)}>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm bg-white", meta.color)}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-800 text-base line-clamp-1">{title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border", meta.bg, meta.color, meta.border)}>
              {meta.label}
            </span>
            {fileUrl && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                • {fileUrl.split(".").pop()?.toUpperCase()} File
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTeacher && isPdf && resourceId && (
            <button
              type="button"
              onClick={() => setShowAnalytics(true)}
              className="px-3 h-10 rounded-xl flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm font-bold text-sm"
              title="Chapter Highlights Analytics"
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
          )}

          {isPdf && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setPdfScale((prev) => Math.max(0.6, Number((prev - 0.15).toFixed(2))))}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 px-1.5 font-mono">
                {Math.round((pdfScale / 1.2) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPdfScale((prev) => Math.min(2.5, Number((prev + 0.15).toFixed(2))))}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}


          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white/60 transition-all border border-transparent hover:border-slate-200 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Viewer */}
      <div className={cn("bg-slate-50 flex flex-col relative", !isFullPage && "flex-1 overflow-hidden")}>
        {loadingFile ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-bold text-slate-500 animate-pulse">Loading material...</p>
          </div>
        ) : content ? (
          <div className={cn(
            "p-5 sm:p-8 lg:p-10 bg-white mx-auto w-full shadow-inner",
            isFullPage ? "max-w-none" : "max-w-4xl flex-1 overflow-y-auto",
          )}>
            {normalizedType === "mindmap" && mindmapTree?.children?.length ? (
              <MindMapCanvas data={mindmapTree} height={isFullPage ? 720 : 560} />
            ) : (normalizedType === "dpp" || normalizedType === "pyq") ? (
              <PracticePagedViewer content={content} type={normalizedType} />
            ) : (title.toLowerCase().includes("flashcard") || title.toLowerCase().includes("flash card") || content.trim().startsWith("Q:")) ? (
              <FlashcardViewer content={content} />
            ) : (title.toLowerCase().includes("checklist") || content.includes("* [ ]")) ? (
              <ChecklistViewer content={content} title={title} />
            ) : (
              <DppContentRenderer content={content} />
            )}
          </div>
        ) : isImage && presignedUrl ? (
          <div className={cn("p-4 flex items-center justify-center bg-slate-200/30", !isFullPage && "flex-1 overflow-auto")}>
            <img
              src={presignedUrl}
              alt={title}
              className="max-w-full h-auto shadow-2xl rounded-lg border border-slate-300"
            />
          </div>
        ) : isPdf && presignedUrl ? (
          <InternalPdfViewer url={presignedUrl} resourceId={resourceId} isTeacher={isTeacher} allowHighlights={allowHighlights} currentUserId={activeUserId} highlights={highlights} setHighlights={setHighlights} useOuterScroll={isFullPage} scale={pdfScale} />
        ) : externalUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 shadow-sm">
              <ExternalLink className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">External Material</h3>
            <p className="text-slate-500 max-w-sm mb-8">
              This resource is hosted on an external platform. Click the button below to view it.
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              View Content <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Unable to display this content directly.</p>
            {presignedUrl && (
              <button
                onClick={() => window.open(presignedUrl, "_blank")}
                className="mt-4 text-indigo-600 font-bold hover:underline"
              >
                Open in new tab instead
              </button>
            )}
          </div>
        )}
      </div>

      {/* Analytics Dialog */}
      <AnimatePresence>
        {showAnalytics && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Chapter Highlights</h3>
                    <p className="text-xs font-medium text-slate-500">Summary Analytics</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnalytics(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {HIGHLIGHT_CATEGORIES.map(cat => {
                    const count = analyticsData[cat.id] || 0;
                    return (
                      <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-inner", cat.bg)}>
                            <span className="text-sm">{cat.icon}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-700">{cat.label}</span>
                        </div>
                        <span className="text-base font-black text-slate-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  if (isFullPage) {
    return (
      <div className="w-full min-h-[calc(100vh-1rem)] bg-white flex flex-col">
        {innerContent}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "w-full max-w-5xl bg-white shadow-2xl flex flex-col overflow-hidden",
          isFullscreen ? "h-screen max-w-none rounded-none" : "h-[90vh] rounded-3xl"
        )}
      >
        {innerContent}
      </motion.div>
    </div>,
    document.body
  );
}
