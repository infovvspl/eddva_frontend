import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, Download, ExternalLink, FileText, Loader2, Printer, X } from 'lucide-react';
import FlashcardViewer from '@/components/resources/FlashcardViewer';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { MindMapCanvas, type MindMapCanvasHandle, type LayoutMode } from '@/components/school/MindMapVisualizer';
import { mindmapMarkdownToTree } from '@/lib/mindmap-markdown';
import { presentationMarkdownToSlides, type Slide } from '@/lib/presentation-markdown';
import { materialDisplayTitle } from '@/lib/material-download';
import { schoolContent, type SchoolMaterial } from '@/lib/api/school-content';
import ResourceViewerModal from '@/components/resources/ResourceViewerModal';

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
      <div className="mb-5 flex rounded-xl border border-slate-200 bg-white p-1">
        {[
          ['questions', 'Questions'],
          ['solutions', typeId === 'pyq' ? 'Detailed Solutions' : 'Answer Key'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPage(id as 'questions' | 'solutions')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition ${
              page === id ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
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
              <button type="button" onClick={() => updateMark(itemKey, 'done')} className={`grid h-8 w-8 place-items-center rounded-lg border ${mark === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400'}`}>
                <Check size={16} />
              </button>
              <button type="button" onClick={() => updateMark(itemKey, 'skip')} className={`grid h-8 w-8 place-items-center rounded-lg border ${mark === 'skip' ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 text-slate-400'}`}>
                <X size={16} />
              </button>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-rose-500">Slide {idx + 1} / {slides.length}</span>
        <span className="text-xs font-semibold text-slate-400">{topic}</span>
      </div>
      <h2 className="border-b border-rose-100 pb-3 text-2xl font-black text-slate-900">
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
        <button type="button" disabled={idx === 0} onClick={() => setIdx((v) => Math.max(0, v - 1))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-40">Prev</button>
        <button type="button" disabled={idx === slides.length - 1} onClick={() => setIdx((v) => Math.min(slides.length - 1, v + 1))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-40">Next</button>
      </div>
    </div>
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
          className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white"
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
      return <iframe title={title} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`} className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white" />;
    }
  }

  if ((fileType === 'pyq' || fileType === 'dpp') && content) return <PracticeViewer content={content} typeId={fileType} />;
  if (fileType === 'revision_checklist' && isStudent && content) return <RevisionChecklistViewer content={content} materialId={material.id} />;
  if (isFlashcard && content) return <FlashcardViewer content={content} />;
  if (content) return <MarkdownRenderer content={content} className="prose-slate max-w-none" />;
  if (fileUrl && /\.(pptx?|docx?|xlsx?)$/i.test(fileUrl)) {
    return <iframe title={title} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`} className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white" />;
  }
  if (fileUrl && /\.pdf($|\?)/i.test(fileUrl)) {
    return <iframe title={title} src={fileUrl} className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white" />;
  }
  return <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-400">No preview content is available.</div>;
}

const MINDMAP_TABS: Array<{ mode: LayoutMode; label: string }> = [
  { mode: 'org', label: 'Org Chart' },
  { mode: 'hybrid', label: 'Hybrid Tree' },
];

function MindmapFullScreenView({ material, tree }: { material: SchoolMaterial; tree: ReturnType<typeof mindmapMarkdownToTree> }) {
  const [mode, setMode] = useState<LayoutMode>('org');
  const canvasRef = useRef<MindMapCanvasHandle>(null);
  const topicLabel = materialTopicLabel(material);

  return (
    <div className="flex h-full min-h-[600px] flex-col bg-slate-50">
      <div className="flex flex-nowrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-600">
            <FileText size={14} /> {labelFromType(material.fileType)}
          </div>
          <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{topicLabel}</h1>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {MINDMAP_TABS.map(t => (
            <button
              key={t.mode}
              type="button"
              onClick={() => setMode(t.mode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                mode === t.mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => canvasRef.current?.exportPNG(topicLabel)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <Download size={14} /> Download
          </button>
          <button
            type="button"
            onClick={() => canvasRef.current?.printMindmap(topicLabel)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <Printer size={14} /> Print
          </button>
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
  const [material, setMaterial] = useState<SchoolMaterial | null>(null);
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
    return <MindmapFullScreenView material={material} tree={mindmapTree} />;
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
        onClose={() => fromPath ? navigate(fromPath, { replace: true, state: { courseContentState: routeState?.courseContentState } }) : navigate(-1)}
      />
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-sm font-semibold text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Loading material...
        </div>
      ) : !material ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">Material not found.</div>
      ) : (
        <article className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-600">
                <FileText size={14} /> {labelFromType(material.fileType)}
              </div>
              <h1 className="text-2xl font-black text-slate-900">{materialTopicLabel(material)}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-400">{material.subjectName || material.chapterName || material.topicName || ''}</p>
            </div>
            {fileType === 'ppt' ? (
              <button
                type="button"
                onClick={() => {
                  const iframe = document.getElementById('ppt-viewer-iframe') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                      type: 'EDVA_PPT_EXPORT_PDF',
                      fileName: material.title || 'Presentation',
                    }, '*');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition"
              >
                <FileText size={15} className="text-violet-600" /> Download PDF
              </button>
            ) : (material.fileUrl || material.file_url) && (
              <a href={resolveFileUrl(material.fileUrl ?? material.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">
                <ExternalLink size={15} /> Open file
              </a>
            )}
          </div>
          <MaterialBody material={material} isStudent={isStudent} />
        </article>
      )}
    </div>
  );
}
