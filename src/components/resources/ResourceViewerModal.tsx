import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Printer, ExternalLink, FileText, Loader2, 
  Zap, CheckCircle2, RotateCcw, ChevronLeft, ChevronRight, 
  ListChecks, Check, Trophy, AlertCircle, Maximize2, Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import DppContentRenderer from "@/components/DppContentRenderer";
import { getResourceDownloadUrl } from "@/lib/api/student";
import { toast } from "sonner";
import { getApiOrigin } from "@/lib/api-config";

const _API_ORIGIN = getApiOrigin();

function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

// ─── Flashcard Viewer ─────────────────────────────────────────────────────────

function FlashcardViewer({ content }: { content: string }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards = useMemo(() => {
    const lines = content.split("\n");
    const result: { q: string; a: string }[] = [];
    let currentQ = "";
    let currentA = "";

    for (const raw of lines) {
      const line = raw.trim().replace(/\*\*/g, ""); 
      if (!line) continue;

      if (/^[Qq][\s\d]*[:.]/.test(line)) {
        if (currentQ && currentA) {
          result.push({ q: currentQ, a: currentA });
          currentA = "";
        }
        currentQ = line.replace(/^[Qq][\s\d]*[:.]\s*/, "").trim();
      } else if (/^[Aa][\s\d]*[:.]/.test(line)) {
        currentA = line.replace(/^[Aa][\s\d]*[:.]\s*/, "").trim();
      } else if (currentQ) {
        if (currentA) currentA += "\n" + line;
        else currentQ += "\n" + line;
      }
    }
    if (currentQ && currentA) result.push({ q: currentQ, a: currentA });
    return result;
  }, [content]);

  if (cards.length === 0) return <DppContentRenderer content={content} />;

  const card = cards[index];

  return (
    <div className="flex flex-col items-center py-4 sm:py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {index + 1} / {cards.length}
        </span>
      </div>

      <div className="w-full max-w-lg perspective-1000 h-[280px] sm:h-[320px] relative">
        <motion.div
          className="w-full h-full relative cursor-pointer"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => setFlipped(!flipped)}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 w-full h-full bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-10 shadow-xl flex flex-col items-center justify-center text-center backface-hidden"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 shrink-0">Question</p>
            <div className="flex-1 flex items-center justify-center overflow-y-auto w-full px-2 text-slate-800 font-bold text-lg">
              {card.q}
            </div>
            <div className="mt-6 flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase tracking-widest animate-pulse shrink-0">
              <RotateCcw className="w-3.5 h-3.5" /> Tap to reveal answer
            </div>
          </div>

          <div
            className="absolute inset-0 w-full h-full bg-indigo-600 border border-indigo-500 rounded-[2.5rem] p-6 sm:p-10 shadow-xl flex flex-col items-center justify-center text-center backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-4 shrink-0">Correct Answer</p>
            <div className="flex-1 flex items-center justify-center overflow-y-auto w-full px-2 text-white font-bold text-lg whitespace-pre-wrap">
              {card.a}
            </div>
            <div className="mt-6 flex items-center gap-2 text-white/60 font-bold text-[10px] uppercase tracking-widest shrink-0">
              <RotateCcw className="w-3.5 h-3.5" /> Tap to flip back
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-4 mt-10">
        <button
          disabled={index === 0}
          onClick={() => { setIndex(index - 1); setFlipped(false); }}
          className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          disabled={index === cards.length - 1}
          onClick={() => { setIndex(index + 1); setFlipped(false); }}
          className="px-8 h-12 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-indigo-600"
        >
          Next Card
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
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
                      {item}
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
  onClose: () => void;
}

const RESOURCE_META: Record<string, {
  label: string; icon: React.ReactNode; color: string; bg: string; border: string;
}> = {
  dpp:      { label: "DPP",              icon: <FileText className="w-4 h-4" />, color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200" },
  pyq:      { label: "PYQ",              icon: <Trophy className="w-4 h-4" />, color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200" },
  pdf:      { label: "Lecture Notes",     icon: <FileText className="w-4 h-4" />, color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200" },
  notes:    { label: "Handwritten Notes", icon: <FileText className="w-4 h-4" />, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200" },
  mindmap:  { label: "Mindmap",           icon: <Brain className="w-4 h-4" />, color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200" },
  quiz:     { label: "Quiz",             icon: <FlaskConical className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function Brain(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"/></svg>
  );
}

function FlaskConical(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.5"/><path d="M14 2v7.5"/><path d="M8.5 13h7"/><path d="M16 3H8"/><path d="M12 2a3 3 0 0 1 3 3v4.5l5.3 9a2 2 0 0 1-1.7 3H5.4a2 2 0 0 1-1.7-3l5.3-9V5a3 3 0 0 1 3-3Z"/></svg>
  );
}

export default function ResourceViewerModal({
  title, content, fileUrl, externalUrl, type, topicId, resourceId, onClose
}: ResourceViewerModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(!!fileUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const meta = RESOURCE_META[type.toLowerCase()] ?? RESOURCE_META.dpp;

  useEffect(() => {
    async function fetchUrl() {
      if (!fileUrl || !topicId || !resourceId) {
        setPresignedUrl(resolveUrl(fileUrl) || null);
        setLoadingFile(false);
        return;
      }
      try {
        const result = await getResourceDownloadUrl(topicId, resourceId);
        setPresignedUrl(result.url);
      } catch (err) {
        console.error("Failed to get presigned URL", err);
        setPresignedUrl(resolveUrl(fileUrl) || null);
      } finally {
        setLoadingFile(false);
      }
    }
    fetchUrl();
  }, [fileUrl, topicId, resourceId]);

  const isImage = fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const isPdf = fileUrl?.match(/\.(pdf)$/i);

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
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all border border-transparent hover:border-slate-200 shadow-sm"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => window.print()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all border border-transparent hover:border-slate-200 shadow-sm"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white/60 transition-all border border-transparent hover:border-slate-200 shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-hidden bg-slate-50 flex flex-col relative">
          {loadingFile ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-sm font-bold text-slate-500 animate-pulse">Loading material...</p>
            </div>
          ) : content ? (
            <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white max-w-4xl mx-auto w-full shadow-inner">
              {(title.toLowerCase().includes("flashcard") || title.toLowerCase().includes("flash card") || content.trim().startsWith("Q:")) ? (
                <FlashcardViewer content={content} />
              ) : (title.toLowerCase().includes("checklist") || content.includes("* [ ]")) ? (
                <ChecklistViewer content={content} title={title} />
              ) : (
                <DppContentRenderer content={content} />
              )}
            </div>
          ) : isImage && presignedUrl ? (
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-200/30">
              <img 
                src={presignedUrl} 
                alt={title} 
                className="max-w-full h-auto shadow-2xl rounded-lg border border-slate-300" 
              />
            </div>
          ) : isPdf && presignedUrl ? (
            <iframe
              src={`${presignedUrl}#toolbar=0`}
              className="w-full h-full border-0"
              title={title}
            />
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
      </motion.div>
    </div>,
    document.body
  );
}
