import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Presentation } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/SchoolAuthContext';
import { getApiBaseUrl } from '@/lib/api-config';
import { schoolContent } from '@/lib/api/school-content';

// The studio is a separate static app (public/ppt-studio) so it can be
// iterated on without rebuilding the panel. Override via VITE_PPT_STUDIO_URL
// only if it is hosted elsewhere.
const PPT_STUDIO_URL = (import.meta.env.VITE_PPT_STUDIO_URL as string) || '/ppt-studio/index.html';

/** Query keys the studio itself reads (see public/ppt-studio/js/app.js applyUrlPrefill). */
const STUDIO_KEYS = ['topic', 'topicId', 'topicName', 'chapterId', 'chapterName',
  'className', 'subjectName', 'subjectId', 'classId', 'job'] as const;

/** Open a deck made in the background: this page, with ``job`` to resume it. */
export function pptStudioJobPath(pagePath: string, jobId: string): string {
  const [path, query = ''] = pagePath.split('?');
  const q = new URLSearchParams(query);
  q.set('job', jobId);
  return `${path}?${q.toString()}`;
}

/**
 * Build this page's URL from a Course Content selection.
 *
 * IDs are authoritative: the backend resolves the real names from them. The
 * names only let the studio show the scope without a round-trip. The `save*`
 * keys say where a saved deck goes, exactly as the old in-page studio did.
 */
export function pptStudioPath(sel: {
  topic: { id: string; name: string; chapterId: string; kind: 'topic' | 'chapter' | 'subject' } | null | undefined;
  subject?: { id?: string; name?: string } | null;
  klass?: { id?: string; name?: string } | null;
  section?: { id?: string } | null;
}): string {
  const q = new URLSearchParams();
  const { topic, subject, klass, section } = sel;
  if (topic) {
    // A "subject" node's name is "<Subject> Materials", a useless prompt subject.
    q.set('topic', topic.kind === 'subject' ? (subject?.name ?? topic.name) : topic.name);
    if (topic.kind === 'topic') {
      q.set('topicId', topic.id);
      q.set('topicName', topic.name);
      if (topic.chapterId) q.set('chapterId', topic.chapterId);
      q.set('saveTopicId', topic.id);
    } else if (topic.kind === 'chapter') {
      q.set('chapterId', topic.id);
      q.set('chapterName', topic.name);
    }
    if (topic.kind !== 'subject' && topic.chapterId) q.set('saveChapterId', topic.chapterId);
  }
  if (klass?.name) q.set('className', klass.name);
  if (subject?.name) q.set('subjectName', subject.name);
  if (subject?.id) q.set('subjectId', subject.id);
  if (klass?.id) q.set('classId', klass.id);
  if (section?.id) q.set('sectionId', section.id);
  return `/school/teacher/ppt-studio?${q.toString()}`;
}

/** PPT Studio as a page of its own: full screen, no panel sidebar. */
export default function PptStudioPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const institute = (user as { instituteId?: string; tenantId?: string } | null)?.instituteId
    || (user as { tenantId?: string } | null)?.tenantId || '';

  // Built once per scope. The old in-page studio rebuilt it, with a fresh
  // cache-buster, on every re-render of Course Content - reloading the
  // studio, and losing a deck in progress.
  const search = params.toString();
  const src = useMemo(() => {
    const q = new URLSearchParams();
    q.set('api', getApiBaseUrl());
    if (institute) q.set('institute', String(institute));
    STUDIO_KEYS.forEach((k) => { const v = params.get(k); if (v) q.set(k, v); });
    // This page, so a deck sent to the background can be reopened here later.
    const page = new URLSearchParams(params);
    page.delete('job');
    q.set('page', `/school/teacher/ppt-studio?${page.toString()}`);
    q.set('cb', String(Date.now()));          // fresh studio code on each visit
    return `${PPT_STUDIO_URL}?${q.toString()}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, institute]);

  const crumbs = [params.get('className'), params.get('subjectName'),
    params.get('chapterName'), params.get('topicName')].filter(Boolean) as string[];

  const back = () => {
    // Course Content keeps its selection in the URL, so going back returns to
    // the same class, subject and topic.
    if (window.history.length > 1) navigate(-1);
    else navigate('/school/teacher/course-content');
  };

  // Receive a generated .pptx from the studio and save it to the topic's
  // Course Content materials, then acknowledge the iframe.
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      const data = e.data as { type?: string; title?: string; fileName?: string; base64?: string;
        buffer?: ArrayBuffer; markdownContent?: string; topic?: string; reason?: string };
      if (data?.type === 'EDVA_PPT_BACKGROUND') {
        // The deck keeps generating on the server; Course Content shows it
        // under AI Generate, and says when it is ready.
        // Sent by the teacher, or handed over by the studio when the deck was
        // slow or the server could not be reached - never shown as a failure.
        const what = data.topic || 'your presentation';
        const headline = data.reason === 'slow' ? `"${what}" is taking longer than usual`
          : data.reason === 'offline' ? `Reconnecting to "${what}"`
            : `Generating "${what}" in the background`;
        toast.info(headline, {
          description: data.reason === 'slow' || data.reason === 'offline'
            ? 'It is still being made. Find it under AI Generate in Course Content; we will tell you when it is ready.'
            : 'Keep working. Find it under AI Generate in Course Content; we will tell you when it is ready.',
        });
        back();
        return;
      }
      if (data?.type !== 'EDVA_PPT_SAVE') return;
      const reply = (type: string, message?: string, extra: Record<string, unknown> = {}) =>
        (e.source as Window | null)?.postMessage({ type, message, ...extra }, '*');
      try {
        const subjectId = params.get('subjectId') || undefined;
        if (!subjectId && !params.get('saveTopicId') && !params.get('saveChapterId')) {
          toast.error('Open PPT Studio from a topic in Course Content to save to it.');
          reply('EDVA_PPT_SAVE_ERROR', 'Open a topic first');
          return;
        }
        // The studio sends the file's bytes; an older studio still open in a
        // tab sends base64, which is decoded as before.
        let bytes: Uint8Array | ArrayBuffer;
        // By its type tag, not instanceof: a buffer made in another window's
        // context is not an instance of this window's ArrayBuffer.
        if (Object.prototype.toString.call(data.buffer) === '[object ArrayBuffer]') {
          bytes = data.buffer as ArrayBuffer;
        } else if (data.base64) {
          const bin = atob(data.base64);
          const decoded = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) decoded[i] = bin.charCodeAt(i);
          bytes = decoded;
        } else {
          reply('EDVA_PPT_SAVE_ERROR', 'No file data');
          return;
        }
        const fileName = data.fileName || `${data.title || 'Presentation'}.pptx`;
        const file = new File([bytes], fileName, {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        });
        // The studio's Save button shows this, so a slow connection reads as
        // progress rather than a frozen "Saving…".
        const fileUrl = await schoolContent.uploadMaterialFile(file, (p) =>
          reply('EDVA_PPT_SAVE_PROGRESS', undefined, { stage: 'uploading', percent: p.percent }));
        reply('EDVA_PPT_SAVE_PROGRESS', undefined, { stage: 'saving', percent: 100 });
        await schoolContent.createMaterial({
          title: data.title || 'Presentation',
          fileType: 'ppt',
          fileUrl,
          fileName,
          fileSizeKb: Math.round(file.size / 1024),
          // The slide markdown, so KaTeX math renders when viewed.
          description: data.markdownContent || undefined,
          topicId: params.get('saveTopicId') || undefined,
          chapterId: params.get('saveChapterId') || undefined,
          subjectId,
          classId: params.get('classId') || undefined,
          sectionId: params.get('sectionId') || undefined,
        });
        toast.success('PPT saved to Course Content');
        reply('EDVA_PPT_SAVED');
        back();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
        toast.error(msg);
        reply('EDVA_PPT_SAVE_ERROR', msg);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    // The bar sits on the studio's own lavender background, so the page and
    // the studio read as one screen.
    <div className="flex h-screen w-full flex-col bg-[#eef0f8]">
      <div className="flex shrink-0 items-center gap-4 px-4 pb-1 pt-3 sm:px-[2.5%]">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-[0_1px_4px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition hover:text-blue-700 hover:ring-blue-200"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Back to Course Content</span>
          <span className="sm:hidden">Back</span>
        </button>
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-sm">
            <Presentation size={13} />
          </span>
          <span className="shrink-0 font-semibold text-slate-900">PPT Studio</span>
          {crumbs.length > 0 && (
            <span className="hidden min-w-0 items-center gap-1.5 truncate text-slate-500 md:flex">
              {crumbs.map((c, i) => (
                <React.Fragment key={`${c}-${i}`}>
                  <ChevronRight size={12} className="shrink-0 text-slate-400" />
                  <span className="truncate">{c}</span>
                </React.Fragment>
              ))}
            </span>
          )}
        </div>
      </div>
      <iframe
        title="AI PPT Studio"
        src={src}
        className="block w-full flex-1 border-0"
        allow="clipboard-write; downloads"
      />
    </div>
  );
}
