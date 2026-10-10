import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSetBreadcrumbLabel } from '@/components/school/breadcrumbs/BreadcrumbContext';
import { ArrowLeft, Check, Download, ExternalLink, FileText, Loader2, Printer, X } from 'lucide-react';
import FlashcardViewer from '@/components/resources/FlashcardViewer';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { MindMapCanvas, type MindMapCanvasHandle, type LayoutMode } from '@/components/school/MindMapVisualizer';
import { mindmapMarkdownToTree } from '@/lib/mindmap-markdown';
import { presentationMarkdownToSlides, type Slide } from '@/lib/presentation-markdown';
import { materialDisplayTitle } from '@/lib/material-download';
import { schoolContent, type SchoolMaterial } from '@/lib/api/school-content';
import ResourceViewerModal from '@/components/resources/ResourceViewerModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getApiBaseUrl } from '@/lib/api-config';
import { useAuthStore } from '@/lib/auth-store';

function resolveFileUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
}

function isGeneratedId(value?: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return false;
  const compact = text.replace(/[\s_-]+/g, '');
  return /^[0-9a-f]{32}$/i.test(compact);
}

function cleanHeadingPart(value?: unknown) {
  const text = String(value ?? '').trim();
  if (!text || isGeneratedId(text)) return '';
  return text;
}

function labelFromType(value?: unknown) {
  const type = String(value ?? '').toLowerCase();
  const labels: Record<string, string> = {
    study_guide: 'Study Guide',
    key_concepts: 'Key Concepts',
    flashcard: 'Flashcards',
    revision_checklist: 'Revision Checklist',
    faq: 'FAQ',
    pyq: 'PYQ',
    formula_sheet: 'Formula Sheet',
    dpp: 'Daily Assessment',
    mindmap: 'Mind Map',
    ppt: 'PPT',
    ebook: 'E-Book',
    notes: 'Notes',
    pdf: 'PDF',
  };
  return labels[type] || type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Material';
}

function materialTopicLabel(material: SchoolMaterial) {
  const typeLabel = labelFromType(material.fileType);
  const rawLabel =
    cleanHeadingPart(material.topicName) ||
    cleanHeadingPart(material.chapterName) ||
    cleanHeadingPart(material.title) ||
    cleanHeadingPart(material.fileName) ||
    'Material';
  return rawLabel
    .replace(new RegExp(`^${typeLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:]\\s*`, 'i'), '')
    .trim() || rawLabel;
}

function materialPageHeading(material: SchoolMaterial) {
  return `${labelFromType(material.fileType)} - ${materialTopicLabel(material)}`;
}

function findSectionStart(content: string, patterns: RegExp[]) {
  const lines = String(content || '').split(/\r?\n/);
  let cursor = 0;
  for (const line of lines) {
    const normalized = line.replace(/^#{1,6}\s*/, '').replace(/^\*\*\s*|\s*\*\*$/g, '').trim();
    if (patterns.some((pattern) => pattern.test(normalized))) return cursor;
    cursor += line.length + 1;
  }
  return -1;
}

function splitPracticeContent(content: string, typeId: string) {
  if (!content || (typeId !== 'pyq' && typeId !== 'dpp')) return null;
  const patterns = typeId === 'pyq'
    ? [/^detailed\s+solutions?\b/i, /^solutions?\b/i, /^answer\s+key\b/i]
    : [/^detailed\s+solutions?\b/i, /^answer\s+key\b/i, /^answers?\b/i, /^solutions?\b/i];
  const splitAt = findSectionStart(content, patterns);
  if (splitAt <= 0) return null;
  const questions = content.slice(0, splitAt).trim();
  const solutions = content.slice(splitAt).trim();
  if (!questions || !solutions) return null;
  return { questions, solutions };
}

function PracticeViewer({ content, typeId }: { content: string; typeId: string }) {
  const pages = useMemo(() => splitPracticeContent(content, typeId), [content, typeId]);
  const [page, setPage] = useState<'questions' | 'solutions'>('questions');

  useEffect(() => setPage('questions'), [content, typeId]);

  if (!pages) return <MarkdownRenderer content={content} className="prose-slate max-w-none" />;

  return (
    <div>
      <Tabs value={page} onValueChange={(v) => setPage(v as 'questions' | 'solutions')} className="mb-5">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl border border-slate-200 bg-white p-1">
          <TabsTrigger value="questions" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            Questions
          </TabsTrigger>
          <TabsTrigger value="solutions" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            {typeId === 'pyq' ? 'Detailed Solutions' : 'Answer Key'}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <MarkdownRenderer content={page === 'questions' ? pages.questions : pages.solutions} className="prose-slate max-w-none" />
    </div>
  );
}

function RevisionChecklistViewer({ content, materialId }: { content: string; materialId: string }) {
  const storageKey = `school_revision_checklist:${materialId}`;
  const [marks, setMarks] = useState<Record<string, string>>({});

  useEffect(() => {
    try { setMarks(JSON.parse(localStorage.getItem(storageKey) || '{}')); } catch { setMarks({}); }
  }, [storageKey]);

  const updateMark = (key: string, value: string) => {
    setMarks((prev) => {
      const next = { ...prev };
      if (next[key] === value) delete next[key];
      else next[key] = value;
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  let itemIndex = 0;
  return (
    <div className="space-y-3">
      {content.split(/\r?\n/).map((line, lineIndex) => {
        const match = line.match(/^\s*[-*]\s+\[[ xX]\]\s+(.+)$/);
        if (!match) {
          if (!line.trim()) return <div key={lineIndex} className="h-1" />;
          return <MarkdownRenderer key={lineIndex} content={line} className="prose-slate max-w-none prose-p:my-1" />;
        }
        const itemKey = `item-${itemIndex++}`;
        const mark = marks[itemKey];
        return (
          <div key={lineIndex} className={`flex items-start gap-3 rounded-xl border p-3 ${
            mark === 'done' ? 'border-emerald-200 bg-emerald-50' : mark === 'skip' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex shrink-0 gap-1">
              <Button type="button" variant="outline" size="icon" aria-label="Mark done" aria-pressed={mark === 'done'} onClick={() => updateMark(itemKey, 'done')} className={`size-8 rounded-lg ${mark === 'done' ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white' : 'border-slate-200 text-slate-400'}`}>
                <Check size={16} />
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label="Skip" aria-pressed={mark === 'skip'} onClick={() => updateMark(itemKey, 'skip')} className={`size-8 rounded-lg ${mark === 'skip' ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600 hover:text-white' : 'border-slate-200 text-slate-400'}`}>
                <X size={16} />
              </Button>
            </div>
            <MarkdownRenderer content={match[1]} className="prose-slate max-w-none prose-p:my-0 text-sm font-semibold text-slate-700" />
          </div>
        );
      })}
    </div>
  );
}

function SlideDeck({ slides, topic = '' }: { slides: Slide[]; topic?: string }) {
  const [idx, setIdx] = useState(0);
  if (!slides.length) return null;
  const slide = slides[Math.min(idx, slides.length - 1)];
  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-none sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wider text-rose-500">Slide {idx + 1} / {slides.length}</span>
        <span className="min-w-0 truncate text-xs font-semibold text-slate-400">{topic}</span>
      </div>
      <h2 className="break-words border-b border-rose-100 pb-3 text-xl font-black text-slate-900 sm:text-2xl">
        <MarkdownRenderer content={slide.title} className="prose-slate max-w-none prose-p:my-0 prose-headings:my-0" />
      </h2>
      <ul className="mt-5 space-y-3">
        {slide.bullets.map((point, i) => (
          <li key={i} className="flex gap-3 text-sm font-medium leading-7 text-slate-700">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
            <span className="min-w-0 flex-1">
              <MarkdownRenderer content={point} className="prose-slate max-w-none prose-p:my-0 prose-headings:my-0 [&_.katex]:text-sm" />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between">
        <Button type="button" variant="outline" disabled={idx === 0} onClick={() => setIdx((v) => Math.max(0, v - 1))} className="rounded-xl border-slate-200 px-4 text-sm font-bold text-slate-600">Prev</Button>
        <Button type="button" variant="outline" disabled={idx === slides.length - 1} onClick={() => setIdx((v) => Math.min(slides.length - 1, v + 1))} className="rounded-xl border-slate-200 px-4 text-sm font-bold text-slate-600">Next</Button>
      </div>
    </Card>
  );
}

function MaterialBody({ material, isStudent }: { material: SchoolMaterial; isStudent: boolean }) {
  const fileType = String(material.fileType ?? material.type ?? '').toLowerCase();
  const title = materialDisplayTitle(material);
  const content = material.description || '';
  const fileUrl = resolveFileUrl(material.fileUrl ?? material.file_url);
  const tree = useMemo(() => (fileType === 'mindmap' && content ? mindmapMarkdownToTree(content, title) : null), [fileType, content, title]);
  const isFlashcard = fileType.includes('flashcard') || material.title.toLowerCase().includes('flashcard') || /^\s*\**\s*Q(?:uestion)?\s*\d*\s*[:.]/i.test(content);
  
  const { user } = useAuthStore();
  const instituteId = user?.instituteId || user?.tenantId;

  if (tree?.children?.length) return <MindMapCanvas data={tree} height={620} />;

  if (fileType === 'ppt') {
    if (content) {
      return (
        <iframe
          id="ppt-viewer-iframe"
          title={title}
          src={(() => {
            const q = new URLSearchParams();
            q.set('mode', 'viewer');
            q.set('api', getApiBaseUrl());
            const inst = material.topicId ? (material.tenantId || String(instituteId || '')) : String(instituteId || '');
            if (inst) q.set('institute', inst);
            return `/ppt-studio/index.html?${q.toString()}`;
          })()}
          className="h-[65vh] w-full rounded-xl border border-slate-200 bg-white sm:h-[75vh]"
          onLoad={() => {
            const iframe = document.getElementById('ppt-viewer-iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'EDVA_PPT_VIEWER_LOAD',
                markdown: content,
                title: title,
                theme: 'clean-white',
                materialId: material.id || materialId,
              }, '*');
            }
          }}
        />
      );
    } else if (fileUrl) {
      return <iframe title={title} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`} className="h-[65vh] w-full rounded-xl border border-slate-200 bg-white sm:h-[75vh]" />;
    }
  }

  if ((fileType === 'pyq' || fileType === 'dpp') && content) return <PracticeViewer content={content} typeId={fileType} />;
  if (fileType === 'revision_checklist' && isStudent && content) return <RevisionChecklistViewer content={content} materialId={material.id} />;
  if (isFlashcard && content) return <FlashcardViewer content={content} />;
  if (content) return <MarkdownRenderer content={content} className="prose-slate max-w-none" />;
  if (fileUrl && /\.(pptx?|docx?|xlsx?)$/i.test(fileUrl)) {
    return <iframe title={title} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`} className="h-[65vh] w-full rounded-xl border border-slate-200 bg-white sm:h-[75vh]" />;
  }
  if (fileUrl && /\.pdf($|\?)/i.test(fileUrl)) {
    return <iframe title={title} src={fileUrl} className="h-[65vh] w-full rounded-xl border border-slate-200 bg-white sm:h-[75vh]" />;
  }
  // Photos of notes, mind-map exports etc. — the upload form accepts JPG/PNG.
  if (fileUrl && /\.(png|jpe?g|webp|gif)($|[?#])/i.test(fileUrl)) {
    return (
      <a href={fileUrl} target="_blank" rel="noreferrer" title="Open full size" className="block">
        <img src={fileUrl} alt={title} className="mx-auto max-h-[75vh] w-auto max-w-full rounded-xl border border-slate-200 bg-white object-contain" />
      </a>
    );
  }
  return <Card className="rounded-xl border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-400 shadow-none">No preview content is available.</Card>;
}

const MINDMAP_TABS: Array<{ mode: LayoutMode; label: string }> = [
  { mode: 'org', label: 'Organisational Tree' },
  { mode: 'hybrid', label: 'Hybrid Tree' },
];

function MindmapFullScreenView({ material, tree, onBack }: { material: SchoolMaterial; tree: ReturnType<typeof mindmapMarkdownToTree>; onBack: () => void }) {
  const [mode, setMode] = useState<LayoutMode>('org');
  const canvasRef = useRef<MindMapCanvasHandle>(null);
  const topicLabel = materialTopicLabel(material);

  return (
    <div className="flex h-full min-h-[600px] flex-col bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onBack}
            aria-label="Go back"
            className="size-9 shrink-0 rounded-lg border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <Badge variant="secondary" className="mb-1 gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-600 hover:bg-violet-50">
              <FileText size={14} /> {labelFromType(material.fileType)}
            </Badge>
            <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{topicLabel}</h1>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
          <Tabs value={mode} onValueChange={(v) => setMode(v as LayoutMode)} className="w-full sm:w-auto">
            <TabsList className="grid h-auto w-full grid-cols-2 bg-slate-100 p-1 sm:inline-flex sm:w-auto">
              {MINDMAP_TABS.map((t) => (
                <TabsTrigger
                  key={t.mode}
                  value={t.mode}
                  className="rounded-md px-3 py-1.5 text-xs font-bold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => canvasRef.current?.exportPNG(topicLabel)}
            className="h-8 flex-1 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 sm:flex-none"
          >
            <Download size={14} /> Download
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => canvasRef.current?.printMindmap(topicLabel)}
            className="h-8 flex-1 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 sm:flex-none"
          >
            <Printer size={14} /> Print
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <MindMapCanvas ref={canvasRef} data={tree} height="100%" mode={mode} onModeChange={setMode} hideToggle />
      </div>
    </div>
  );
}

export default function SchoolMaterialViewPage() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudent = location.pathname.includes('/student/');
  const routeState = location.state as { from?: string; courseContentState?: unknown } | null;
  const fromPath = routeState?.from;
  const handleBack = () =>
    fromPath
      ? navigate(fromPath, { replace: true, state: { courseContentState: routeState?.courseContentState } })
      : navigate(-1);
  const [material, setMaterial] = useState<SchoolMaterial | null>(null);
  useSetBreadcrumbLabel(material?.title);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!materialId) return;
    setLoading(true);
    schoolContent.getMaterial(materialId)
      .then((item) => setMaterial(item ?? null))
      .catch(() => setMaterial(null))
      .finally(() => setLoading(false));
  }, [materialId]);

  useEffect(() => {
    if (!material) return;
    const materialTypeLabel = labelFromType(material.fileType);
    if (routeState?.materialTypeLabel === materialTypeLabel) return;
    navigate(location.pathname, {
      replace: true,
      state: { ...routeState, materialTypeLabel },
    });
  }, [material, routeState, navigate, location.pathname]);

  const fileType = String(material?.fileType ?? material?.type ?? '').toLowerCase();
  const fileUrl = resolveFileUrl(material?.fileUrl ?? material?.file_url);
  const isPdf = !!fileUrl?.match(/\.pdf(?:$|[?#])/i) || fileType.includes('pdf') || fileType.includes('ebook');
  const isMindmap = fileType === 'mindmap';
  const mindmapContent = material?.description || '';
  const mindmapTitle = material ? materialDisplayTitle(material) : '';
  const mindmapTree = useMemo(
    () => (isMindmap && mindmapContent ? mindmapMarkdownToTree(mindmapContent, mindmapTitle) : null),
    [isMindmap, mindmapContent, mindmapTitle],
  );

  if (!loading && material && isMindmap && mindmapTree?.children?.length) {
    return <MindmapFullScreenView material={material} tree={mindmapTree} onBack={handleBack} />;
  }

  if (!loading && material && isPdf) {
    return (
      <ResourceViewerModal
        title={materialPageHeading(material)}
        fileUrl={fileUrl}
        type="pdf"
        topicId={material.topicId}
        resourceId={material.id}
        allowHighlights={isStudent}
        isTeacher={!isStudent}
        isFullPage={true}
        onClose={handleBack}
      />
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      {loading ? (
        <Card className="w-full space-y-5 rounded-2xl border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-busy="true" aria-label="Loading material">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-7 w-2/3" />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </Card>
      ) : !material ? (
        <Card className="rounded-2xl border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-none">Material not found.</Card>
      ) : (
        <Card className="w-full rounded-2xl border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleBack}
                aria-label="Go back"
                className="mt-1 size-9 shrink-0 rounded-lg border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
              </Button>
              <div className="min-w-0">
                <Badge variant="secondary" className="mb-2 gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-600 hover:bg-violet-50">
                  <FileText size={14} /> {labelFromType(material.fileType)}
                </Badge>
                <h1 className="break-words text-xl font-black text-slate-900 sm:text-2xl">{materialTopicLabel(material)}</h1>
                <p className="mt-1 text-sm font-semibold text-slate-400">{material.subjectName || material.chapterName || material.topicName || ''}</p>
              </div>
            </div>
            {fileType === 'ppt' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const iframe = document.getElementById('ppt-viewer-iframe') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                      type: 'EDVA_PPT_EXPORT_PDF',
                      fileName: material.title || 'Presentation',
                    }, '*');
                  }
                }}
                className="w-full gap-2 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 sm:w-auto"
              >
                <FileText size={15} className="text-violet-600" /> Download PDF
              </Button>
            ) : (material.fileUrl || material.file_url) && (
              <Button asChild variant="outline" className="w-full gap-2 rounded-xl border-slate-200 px-4 text-sm font-bold text-slate-600 sm:w-auto">
                <a href={resolveFileUrl(material.fileUrl ?? material.file_url)} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} /> Open file
                </a>
              </Button>
            )}
          </div>
          <MaterialBody material={material} isStudent={isStudent} />
        </Card>
      )}
    </div>
  );
}
