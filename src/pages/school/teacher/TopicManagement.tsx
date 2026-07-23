/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FlashcardViewer from '@/components/resources/FlashcardViewer';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

import {
  Plus,
  BookOpen,
  ChevronRight,
  Library,
  Layers,
  GraduationCap,
  Users,
  ChevronLeft,
  ChevronDown,
  Home,
  UploadCloud,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  Link2,
  FileText,
  FileQuestion,
  FileSpreadsheet,
  ListChecks,
  ExternalLink,
  X,
  Sparkles,
  Eye,
  Brain,
  Lightbulb,
  Presentation,
  BookMarked,
  Download,
  Highlighter,
  RefreshCw,
  ImagePlus,
  ZoomIn,
} from 'lucide-react';

import GlassCard from '@/components/school/GlassCard';
import Button from '@/components/school/Button';
import SearchBar from '@/components/school/SearchBar';
import Badge from '@/components/school/Badge';
import Modal from '@/components/school/Modal';
import InputField from '@/components/school/InputField';

import api from '@/lib/api/school-client';
import { MindMapCanvas } from '@/components/school/MindMapVisualizer';
import { mindmapMarkdownToTree } from '@/lib/mindmap-markdown';
import { presentationMarkdownToSlides, slideImageQuery, slideImagePrompt, fetchSlideImage, type Slide } from '@/lib/presentation-markdown';
import { downloadMaterial, downloadAllMaterials, isDownloadableAiMaterial, materialDisplayTitle } from '@/lib/material-download';
import { schoolContent, type SchoolMaterial, type SchoolMaterialType } from '@/lib/api/school-content';
import { getApiOrigin, getApiBaseUrl } from '@/lib/api-config';
import { useAuth } from '@/context/SchoolAuthContext';
import { useAcademicStore } from '@/lib/academic-store';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSchoolFeature } from '@/hooks/use-school-feature';

// ── Types ────────────────────────────────────────────────────────────────────

interface Assignment {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  isClassTeacher?: boolean;
}

interface Ref { id: string; name: string }

interface CourseContentReturnState {
  selectedClass?: Ref | null;
  selectedSection?: Ref | null;
  selectedSubject?: Ref | null;
  selectedTopic?: { id: string; name: string; chapterId: string; kind: 'topic' | 'chapter' | 'subject' } | null;
}

// AI PPT Studio — served natively from the EDVA frontend (same origin), so nothing
// separate needs to run. Override via VITE_PPT_STUDIO_URL only if hosted elsewhere.
const PPT_STUDIO_URL = (import.meta.env.VITE_PPT_STUDIO_URL as string) || '/ppt-studio/index.html';

const TopicManagement: React.FC = () => {
  const confirm = useConfirm();
  const { user } = useAuth();
  const location = useLocation();
  const { assignments, setAssignments, activeAcademicContext, setActiveAcademicContext } = useAcademicStore();
  const canEditCurriculum =
    user?.role === 'INSTITUTE_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER';

  // ── Navigation state (Classes → Sections → Subjects → Curriculum) ──────────
  const [searchParams, setSearchParams] = useSearchParams();

  const updateUrlState = (updates: Record<string, any>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined) {
          next.delete(key);
        } else {
          next.set(key, JSON.stringify(val));
        }
      });
      return next;
    });
  };

  const getParam = (key: string) => {
    const val = searchParams.get(key);
    try { return val ? JSON.parse(val) : null; } catch { return null; }
  };

  const selectedClass = useMemo(() => getParam('class'), [searchParams.get('class')]);
  const selectedSection = useMemo(() => getParam('section'), [searchParams.get('section')]);
  const selectedSubject = useMemo(() => getParam('subject'), [searchParams.get('subject')]);
  const selectedTopic = useMemo(() => getParam('topic'), [searchParams.get('topic')]);

  const setSelectedClass = (val: Ref | null) => updateUrlState({ class: val, section: null, subject: null, topic: null });
  const setSelectedSection = (val: Ref | null) => updateUrlState({ section: val, subject: null, topic: null });
  const setSelectedSubject = (val: Ref | null) => updateUrlState({ subject: val, topic: null });
  const setSelectedTopic = (val: any) => updateUrlState({ topic: val });

  const [search, setSearch] = useState('');
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // ── Curriculum (chapters / topics tree + selected topic) ───────────────────
  const [chaptersList, setChaptersList] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [pptStudioOpen, setPptStudioOpen] = useState(false);
  // Bumped after any topic mutation so open chapter nodes re-fetch their topics.
  const [curriculumVersion, setCurriculumVersion] = useState(0);
  const restoredReturnState = useRef(false);
  const restoredSubjectId = useRef<string | null>(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicTargetChapterId, setTopicTargetChapterId] = useState<string | null>(null);
  const [newChapter, setNewChapter] = useState({ name: '', order: 1 });
  const [newTopic, setNewTopic] = useState({ name: '', orderIndex: 1 });

  // ── Load teacher assignments ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        const tData = res.data?.data?.teacherData || res.data?.teacherData || {};
        if (!cancelled && Array.isArray(tData.assignments)) {
          const freshAssignments = tData.assignments;
          setAssignments(freshAssignments);
          if (
            activeAcademicContext &&
            !freshAssignments.some((a: Assignment) =>
              a.classId === activeAcademicContext.classId &&
              a.sectionId === activeAcademicContext.sectionId &&
              a.subjectId === activeAcademicContext.subjectId
            )
          ) {
            setActiveAcademicContext(null);
          }
        }
      } catch (err) {
        console.error('Failed to load teacher assignments', err);
      } finally {
        if (!cancelled) setLoadingAssignments(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [activeAcademicContext, setActiveAcademicContext, setAssignments]);

  const all = assignments as unknown as Assignment[];

  // ── Derived hierarchies ────────────────────────────────────────────────────
  const classes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sections: Set<string>; subjects: Set<string>; isClassTeacher: boolean }>();
    all.forEach((a) => {
      if (!a.classId) return;
      const entry = map.get(a.classId) ?? { id: a.classId, name: a.className, sections: new Set(), subjects: new Set(), isClassTeacher: false };
      if (a.sectionId) entry.sections.add(a.sectionId);
      if (a.subjectId) entry.subjects.add(a.subjectId);
      if (a.isClassTeacher) entry.isClassTeacher = true;
      map.set(a.classId, entry);
    });
    const result = Array.from(map.values());
    result.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    return result;
  }, [all]);

  const sections = useMemo(() => {
    if (!selectedClass) return [];
    const map = new Map<string, { id: string; name: string; subjects: Set<string> }>();
    all.filter((a) => a.classId === selectedClass.id).forEach((a) => {
      if (!a.sectionId) return;
      const entry = map.get(a.sectionId) ?? { id: a.sectionId, name: a.sectionName, subjects: new Set() };
      if (a.subjectId) entry.subjects.add(a.subjectId);
      map.set(a.sectionId, entry);
    });
    return Array.from(map.values());
  }, [all, selectedClass]);

  const subjects = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    const map = new Map<string, Ref>();
    all
      .filter((a) => a.classId === selectedClass.id && a.sectionId === selectedSection.id)
      .forEach((a) => { if (a.subjectId) map.set(a.subjectId, { id: a.subjectId, name: a.subjectName }); });
    return Array.from(map.values());
  }, [all, selectedClass, selectedSection]);

  // ── Curriculum fetches ─────────────────────────────────────────────────────
  const fetchChapters = async (subjectId: string) => {
    try {
      setLoadingChapters(true);
      const res = await api.get(`/topics/chapters?subjectId=${subjectId}`);
      setChaptersList(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch chapters');
    } finally {
      setLoadingChapters(false);
    }
  };

  useEffect(() => {
    if (!selectedSubject) return;
    if (restoredSubjectId.current === selectedSubject.id) {
      restoredSubjectId.current = null;
    }
    void fetchChapters(selectedSubject.id);
  }, [selectedSubject?.id]);

  useEffect(() => {
    if (restoredReturnState.current) return;
    const state = (location.state as { courseContentState?: CourseContentReturnState } | null)?.courseContentState;
    if (!state?.selectedSubject) return;
    restoredReturnState.current = true;
    restoredSubjectId.current = state.selectedSubject.id;
    setSelectedClass(state.selectedClass ?? null);
    setSelectedSection(state.selectedSection ?? null);
    setSelectedSubject(state.selectedSubject ?? null);
    setSelectedTopic(state.selectedTopic ?? null);
    setSearch('');
  }, [location.state]);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const level: 'classes' | 'sections' | 'subjects' | 'curriculum' =
    selectedSubject ? 'curriculum' : selectedSection ? 'subjects' : selectedClass ? 'sections' : 'classes';

  const goToClasses = () => { updateUrlState({ class: null, section: null, subject: null, topic: null }); setSearch(''); };
  const goToSections = () => { updateUrlState({ section: null, subject: null, topic: null }); setSearch(''); };
  const goToSubjects = () => { updateUrlState({ subject: null, topic: null }); setSearch(''); };
  const goBack = () => {
    if (level === 'curriculum') goToSubjects();
    else if (level === 'subjects') goToSections();
    else if (level === 'sections') goToClasses();
  };

  // ── Chapter create / edit / delete ─────────────────────────────────────────
  const openCreateChapter = () => {
    setEditingChapterId(null);
    setNewChapter({ name: '', order: (chaptersList.length || 0) + 1 });
    setShowChapterModal(true);
  };

  const openEditChapter = (chapter: any) => {
    setEditingChapterId(chapter.id);
    setNewChapter({ name: chapter.name || '', order: Number(chapter.sort_order ?? chapter.orderIndex ?? 1) });
    setShowChapterModal(true);
  };

  const handleSaveChapter = async () => {
    if (!newChapter.name.trim()) { toast.warning('Chapter name is required'); return; }
    if (!selectedSubject) { toast.warning('Subject is required'); return; }
    try {
      if (editingChapterId) {
        await api.put(`/topics/chapters/${editingChapterId}`, { name: newChapter.name, orderIndex: Number(newChapter.order) });
      } else {
        await api.post('/topics/chapters', { name: newChapter.name, orderIndex: Number(newChapter.order), subjectId: selectedSubject.id });
      }
      await fetchChapters(selectedSubject.id);
      setNewChapter({ name: '', order: 1 });
      setShowChapterModal(false);
      setEditingChapterId(null);
      toast.success(editingChapterId ? 'Chapter updated' : 'Chapter created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save chapter');
    }
  };

  const handleDeleteChapter = async (chapter: any) => {
    const isConfirmed = await confirm({
      title: "Confirm Delete",
      message: `Delete chapter "${chapter.name}"? Its topics will also be removed. This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/topics/chapters/${chapter.id}`);
      if (selectedTopic?.chapterId === chapter.id) setSelectedTopic(null);
      if (selectedSubject) await fetchChapters(selectedSubject.id);
      toast.success('Chapter deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete chapter');
    }
  };

  // ── Topic create / edit / delete ───────────────────────────────────────────
  const openCreateTopic = (chapterId: string, count: number) => {
    setEditingTopicId(null);
    setTopicTargetChapterId(chapterId);
    setNewTopic({ name: '', orderIndex: count + 1 });
    setShowTopicModal(true);
  };

  const openEditTopic = (topic: any) => {
    setEditingTopicId(topic.id);
    setTopicTargetChapterId(topic.chapter_id ?? topic.chapterId ?? null);
    setNewTopic({ name: topic.name || '', orderIndex: Number(topic.sort_order ?? topic.orderIndex ?? 1) });
    setShowTopicModal(true);
  };

  const handleSaveTopic = async () => {
    if (!newTopic.name.trim()) { toast.warning('Topic name is required'); return; }
    try {
      if (editingTopicId) {
        await api.put(`/topics/${editingTopicId}`, { name: newTopic.name, orderIndex: Number(newTopic.orderIndex) });
      } else {
        if (!topicTargetChapterId) { toast.warning('No chapter selected'); return; }
        await api.post('/topics', { name: newTopic.name, orderIndex: Number(newTopic.orderIndex), chapterId: topicTargetChapterId });
      }
      setNewTopic({ name: '', orderIndex: 1 });
      setShowTopicModal(false);
      setEditingTopicId(null);
      setCurriculumVersion((v) => v + 1);
      toast.success(editingTopicId ? 'Topic updated' : 'Topic created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save topic');
    }
  };

  const handleDeleteTopic = async (topic: any) => {
    const isConfirmed = await confirm({
      title: "Confirm Delete",
      message: `Delete topic "${topic.name}"? Its materials will also be removed. This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/topics/${topic.id}`);
      if (selectedTopic?.id === topic.id) setSelectedTopic(null);
      setCurriculumVersion((v) => v + 1);
      toast.success('Topic deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete topic');
    }
  };

  // ── Filtered current level ─────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const filteredClasses = classes.filter((c) => c.name?.toLowerCase().includes(q));
  const filteredSections = sections.filter((s) => s.name?.toLowerCase().includes(q));
  const filteredSubjects = subjects.filter((s) => s.name?.toLowerCase().includes(q));

  // ── Render ─────────────────────────────────────────────────────────────────
  // Receive a generated .pptx from the embedded PPT Studio and save it to the
  // open topic's Course Content materials, then acknowledge the iframe.
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      const data = e.data as { type?: string; title?: string; fileName?: string; base64?: string };
      if (data?.type !== 'EDVA_PPT_SAVE') return;
      const reply = (type: string, message?: string) =>
        (e.source as Window | null)?.postMessage({ type, message }, '*');
      try {
        if (!selectedTopic) { toast.error('Open a topic first, then save the PPT to it.'); reply('EDVA_PPT_SAVE_ERROR', 'Open a topic first'); return; }
        if (!data.base64) { reply('EDVA_PPT_SAVE_ERROR', 'No file data'); return; }
        const bin = atob(data.base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const fileName = data.fileName || `${data.title || 'Presentation'}.pptx`;
        const file = new File([bytes], fileName, {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        });
        const fileUrl = await schoolContent.uploadMaterialFile(file);
        await schoolContent.createMaterial({
          title: data.title || 'Presentation',
          fileType: 'ppt',
          fileUrl,
          fileName,
          fileSizeKb: Math.round(file.size / 1024),
          topicId: selectedTopic.kind === 'topic' ? selectedTopic.id : undefined,
          chapterId: selectedTopic.kind === 'subject' ? undefined : selectedTopic.chapterId,
          subjectId: selectedSubject?.id,
          classId: selectedClass?.id,
          sectionId: selectedSection?.id,
        });
        toast.success('PPT saved to Course Content');
        reply('EDVA_PPT_SAVED');
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
        toast.error(msg);
        reply('EDVA_PPT_SAVE_ERROR', msg);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [selectedTopic, selectedSubject, selectedClass, selectedSection]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
            Course Content
          </h1>
          <p className="mt-1 text-sm font-medium text-surface-500">
            Browse your assigned classes, drill into sections and subjects, and manage the curriculum.
          </p>
        </div>
        {level !== 'classes' && (
          <Button variant="outline" size="sm" icon={<ChevronLeft size={16} />} onClick={goBack}>
            Back
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Classes', icon: <Home size={14} />, onClick: goToClasses, active: level === 'classes' },
          ...(selectedClass ? [{ label: selectedClass.name, onClick: goToSections, active: level === 'sections' }] : []),
          ...(selectedSection ? [{ label: selectedSection.name, onClick: goToSubjects, active: level === 'subjects' }] : []),
          ...(selectedSubject ? [{ label: selectedSubject.name, onClick: () => { }, active: true }] : []),
        ]}
      />

      {/* Search (not on curriculum's topic side) */}
      {level !== 'curriculum' && (
        <div className="max-w-md">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={`Search ${level}...`}
          />
        </div>
      )}

      {/* ── CLASSES ── */}
      {level === 'classes' && (
        loadingAssignments ? (
          <CardGridSkeleton />
        ) : filteredClasses.length === 0 ? (
          <EmptyState icon={<GraduationCap size={40} />} title="No classes assigned" message="You haven't been assigned to any classes yet. Contact your administrator." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((c) => (
              <NavCard
                key={c.id}
                icon={<GraduationCap size={22} />}
                tone="brand"
                title={c.name}
                meta={`${c.sections.size} section${c.sections.size === 1 ? '' : 's'} • ${c.subjects.size} subject${c.subjects.size === 1 ? '' : 's'}`}
                badge={c.isClassTeacher ? <Badge variant="success" className="text-[9px] px-1.5 py-0.5 sm:text-xs"><span className="hidden sm:inline">Class Teacher</span><span className="inline sm:hidden">Teacher</span></Badge> : null}
                actionLabel="View sections"
                onClick={() => { setSelectedClass({ id: c.id, name: c.name }); setSearch(''); }}
              />
            ))}
          </div>
        )
      )}

      {/* ── SECTIONS ── */}
      {level === 'sections' && (
        filteredSections.length === 0 ? (
          <EmptyState icon={<Layers size={40} />} title="No sections" message="No sections found for this class." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSections.map((s) => (
              <NavCard
                key={s.id}
                icon={<Layers size={22} />}
                tone="violet"
                title={`Section ${s.name}`}
                meta={`${s.subjects.size} subject${s.subjects.size === 1 ? '' : 's'}`}
                actionLabel="View subjects"
                onClick={() => { setSelectedSection({ id: s.id, name: s.name }); setSearch(''); }}
              />
            ))}
          </div>
        )
      )}

      {/* ── SUBJECTS ── */}
      {level === 'subjects' && (
        filteredSubjects.length === 0 ? (
          <EmptyState icon={<BookOpen size={40} />} title="No subjects" message="No subjects found for this section." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((s) => (
              <NavCard
                key={s.id}
                icon={<BookOpen size={22} />}
                tone="emerald"
                title={s.name}
                meta="Chapters & topics"
                actionLabel="Open curriculum"
                onClick={() => { setSelectedSubject({ id: s.id, name: s.name }); setSearch(''); }}
              />
            ))}
          </div>
        )
      )}

      {/* ── CURRICULUM (chapters + topics) ── */}
      {level === 'curriculum' && selectedSubject && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
          {/* Curriculum tree: chapters → topics */}
          <div className="self-start lg:sticky lg:top-6 rounded-2xl border border-surface-100 bg-white dark:border-surface-700 dark:bg-surface-900/40">
            <div className="flex items-center justify-between border-b border-surface-100 p-4 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <Library size={18} className="text-brand-600" />
                <h3 className="font-bold text-surface-900 dark:text-white">Chapters & Topics</h3>
              </div>
              {canEditCurriculum && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" icon={<Upload size={16} />} onClick={() => setShowBulkModal(true)}>Import</Button>
                  <Button size="sm" icon={<Plus size={16} />} onClick={openCreateChapter}>Chapter</Button>
                </div>
              )}
            </div>
            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-3">
              {loadingChapters ? (
                <div className="space-y-3"><RowSkeleton /><RowSkeleton /><RowSkeleton /></div>
              ) : chaptersList.length === 0 ? (
                <EmptyState compact icon={<Library size={32} />} title="No chapters yet" message="Create the first chapter for this subject." />
              ) : (
                <div className="space-y-0.5">
                  {/* Root node — Complete Subject Materials */}
                  <div
                    className={`group/subjmat flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all ${
                      selectedTopic?.kind === 'subject'
                        ? 'bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-900/20'
                        : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                    }`}
                    onClick={() => setSelectedTopic({ id: selectedSubject.id, name: `${selectedSubject.name} Materials`, chapterId: '', kind: 'subject' })}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selectedTopic?.kind === 'subject' ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400'}`}>
                      <BookOpen size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[11px] font-black uppercase tracking-wider ${selectedTopic?.kind === 'subject' ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400 dark:text-surface-500'}`}>Subject</p>
                      <p className={`truncate text-sm font-bold leading-tight ${selectedTopic?.kind === 'subject' ? 'text-brand-700 dark:text-brand-300' : 'text-surface-800 dark:text-surface-100'}`}>
                        All Materials
                      </p>
                    </div>
                  </div>

                  {/* Divider before chapters */}
                  <div className="my-1.5 flex items-center gap-2 px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-600">Chapters</span>
                    <div className="flex-1 border-t border-dashed border-surface-200 dark:border-surface-700" />
                  </div>

                  {chaptersList.map((chapter, ci) => (
                    <ChapterNode
                      key={chapter.id}
                      chapter={chapter}
                      chapterIndex={ci}
                      version={curriculumVersion}
                      canEdit={canEditCurriculum}
                      selectedScopeId={selectedTopic?.id ?? null}
                      onSelectTopic={(t) => setSelectedTopic({ id: t.id, name: t.name, chapterId: chapter.id, kind: 'topic' })}
                      onSelectChapter={() => setSelectedTopic({ id: chapter.id, name: chapter.name, chapterId: chapter.id, kind: 'chapter' })}
                      onAddTopic={(count) => openCreateTopic(chapter.id, count)}
                      onEditTopic={openEditTopic}
                      onDeleteTopic={handleDeleteTopic}
                      onEditChapter={() => openEditChapter(chapter)}
                      onDeleteChapter={() => handleDeleteChapter(chapter)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Material workspace for the selected topic */}
          <div className="rounded-2xl border border-surface-100 bg-white dark:border-surface-700 dark:bg-surface-900/40">
            {selectedTopic ? (
              <MaterialWorkspace
                key={selectedTopic.id}
                topic={selectedTopic}
                subjectId={selectedSubject.id}
                classId={selectedClass?.id}
                sectionId={selectedSection?.id}
                canEdit={canEditCurriculum}
                returnState={{ selectedClass, selectedSection, selectedSubject, selectedTopic }}
                onOpenPptStudio={() => setPptStudioOpen(true)}
              />
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center p-6">
                <EmptyState icon={<UploadCloud size={40} />} title="Select a topic" message="Pick a topic on the left to view and add its study materials." />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {canEditCurriculum && (
        <>
          <Modal isOpen={showChapterModal} onClose={() => { setShowChapterModal(false); setEditingChapterId(null); }} title={editingChapterId ? 'Edit Chapter' : 'Create Chapter'}>
            <div className="space-y-4">
              <InputField label="Chapter Name" value={newChapter.name} onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })} placeholder="e.g. Thermodynamics" />
              <InputField label="Order" type="number" value={newChapter.order} onChange={(e) => setNewChapter({ ...newChapter, order: Number(e.target.value) })} />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowChapterModal(false); setEditingChapterId(null); }}>Cancel</Button>
                <Button onClick={handleSaveChapter}>{editingChapterId ? 'Save Changes' : 'Create Chapter'}</Button>
              </div>
            </div>
          </Modal>

          {selectedSubject && (
            <BulkImportModal
              isOpen={showBulkModal}
              subjectId={selectedSubject.id}
              subjectName={selectedSubject.name}
              onClose={() => setShowBulkModal(false)}
              onImported={() => { setShowBulkModal(false); void fetchChapters(selectedSubject.id); }}
            />
          )}

          <Modal isOpen={showTopicModal} onClose={() => { setShowTopicModal(false); setEditingTopicId(null); }} title={editingTopicId ? 'Edit Topic' : 'Create Topic'}>
            <div className="space-y-4">
              <InputField label="Topic Name" value={newTopic.name} onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })} placeholder="e.g. Laws of Thermodynamics" />
              <InputField label="Order Index" type="number" value={newTopic.orderIndex} onChange={(e) => setNewTopic({ ...newTopic, orderIndex: Number(e.target.value) })} />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowTopicModal(false); setEditingTopicId(null); }}>Cancel</Button>
                <Button onClick={handleSaveTopic}>{editingTopicId ? 'Save Changes' : 'Create Topic'}</Button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {/* ── AI PPT Studio (embedded ppt-generator) ──────────────────────── */}
      {pptStudioOpen && (
        <div className="fixed inset-0 z-[300] flex flex-col bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-2 text-white">
              <Presentation size={18} />
              <span className="text-sm font-bold">AI PPT Studio</span>
              {selectedTopic && <span className="truncate text-xs text-white/60">· {selectedTopic.name}</span>}
            </div>
            <button
              onClick={() => setPptStudioOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
          <iframe
            title="AI PPT Studio"
            src={(() => {
              const q = new URLSearchParams();
              q.set('api', getApiBaseUrl());
              const inst = (user as any)?.instituteId || (user as any)?.tenantId;
              if (inst) q.set('institute', String(inst));
              if (selectedTopic) q.set('topic', selectedTopic.name);
              return `${PPT_STUDIO_URL}?${q.toString()}`;
            })()}
            className="w-full flex-1 border-0 bg-white"
            allow="clipboard-write; downloads"
          />
        </div>
      )}
    </div >
  );
};

// ── Presentational helpers ───────────────────────────────────────────────────

const toneStyles: Record<string, { soft: string; icon: string }> = {
  brand: { soft: 'bg-brand-100 dark:bg-brand-900/40', icon: 'text-brand-600 dark:text-brand-400' },
  violet: { soft: 'bg-violet-100 dark:bg-violet-900/40', icon: 'text-violet-600 dark:text-violet-400' },
  emerald: { soft: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'text-emerald-600 dark:text-emerald-400' },
};

function NavCard({
  icon, tone, title, meta, actionLabel, badge, onClick,
}: {
  icon: React.ReactNode; tone: keyof typeof toneStyles; title: string; meta: string;
  actionLabel: string; badge?: React.ReactNode; onClick: () => void;
}) {
  const t = toneStyles[tone];
  return (
    <GlassCard hover className="group cursor-pointer p-3.5 sm:p-5 transition-all flex flex-col justify-between h-full" onClick={onClick}>
      <div>
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-2.5 ${t.soft} ${t.icon} [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-[22px] sm:[&>svg]:h-[22px]`}>{icon}</div>
          {badge}
        </div>
        <h4 className="mt-3 sm:mt-4 truncate text-sm sm:text-lg font-bold text-surface-900 dark:text-white" title={title}>{title}</h4>
        <p className="mt-1 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-surface-500">
          <Users size={14} className="shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate">{meta}</span>
        </p>
      </div>
      <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-surface-100 pt-2.5 sm:pt-3 dark:border-surface-700">
        <span className={`text-xs sm:text-sm font-semibold ${t.icon}`}>{actionLabel}</span>
        <ChevronRight size={16} className="text-surface-400 transition-transform group-hover:translate-x-0.5 shrink-0 hidden sm:block" />
      </div>
    </GlassCard>
  );
}

function IconButton({ children, label, danger, onClick }: { children: React.ReactNode; label: string; danger?: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-transparent transition-colors ${danger
        ? 'text-surface-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30'
        : 'text-surface-400 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30'
        }`}
    >
      {children}
    </button>
  );
}

function Breadcrumb({ items }: { items: { label: string; icon?: React.ReactNode; onClick: () => void; active: boolean }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((it, i) => (
        <React.Fragment key={`${it.label}-${i}`}>
          {i > 0 && <ChevronRight size={14} className="text-surface-300" />}
          <button
            type="button"
            onClick={it.onClick}
            disabled={it.active}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-colors ${it.active ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:hover:bg-surface-800'
              }`}
          >
            {it.icon}{it.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

function EmptyState({ icon, title, message, compact }: { icon: React.ReactNode; title: string; message: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/60 text-center dark:border-surface-700 dark:bg-surface-800/40 ${compact ? 'px-6 py-10' : 'px-6 py-16'}`}>
      <div className="mb-3 text-surface-300 dark:text-surface-600">{icon}</div>
      <p className="text-base font-bold text-surface-800 dark:text-surface-200">{title}</p>
      <p className="mt-1 max-w-sm text-sm font-medium text-surface-500">{message}</p>
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl sm:rounded-2xl border border-surface-100 bg-white p-3.5 sm:p-5 dark:border-surface-700 dark:bg-surface-800 flex flex-col justify-between">
          <div>
            <div className="h-9 w-9 sm:h-11 sm:w-11 animate-pulse rounded-lg sm:rounded-xl bg-surface-200 dark:bg-surface-700" />
            <div className="mt-3 sm:mt-4 h-4 sm:h-5 w-2/3 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div className="mt-1 sm:mt-2 h-3 sm:h-4 w-1/2 animate-pulse rounded bg-surface-100 dark:bg-surface-700/60" />
          </div>
          <div className="mt-3 sm:mt-4 h-3.5 sm:h-4 w-full animate-pulse rounded bg-surface-100 dark:bg-surface-700/60" />
        </div>
      ))}
    </div>
  );
}

function RowSkeleton() {
  return <div className="h-16 w-full animate-pulse rounded-xl bg-surface-100 dark:bg-surface-800" />;
}

// ── Material type config ─────────────────────────────────────────────────────

const MATERIAL_TYPES: { value: SchoolMaterialType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; soft: string; text: string }[] = [
  { value: 'notes', label: 'Notes', icon: FileText, soft: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { value: 'study_guide', label: 'Study Guide', icon: BookOpen, soft: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  { value: 'key_concepts', label: 'Key Concepts', icon: Lightbulb, soft: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  { value: 'flashcard', label: 'Flashcards', icon: FileText, soft: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { value: 'revision_checklist', label: 'Revision Checklist', icon: ListChecks, soft: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'faq', label: 'FAQ', icon: FileQuestion, soft: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { value: 'pyq', label: 'PYQ', icon: FileQuestion, soft: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  { value: 'formula_sheet', label: 'Formula Sheet', icon: FileSpreadsheet, soft: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { value: 'dpp', label: 'Daily Assessment', icon: ListChecks, soft: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'mindmap', label: 'Mindmap', icon: Brain, soft: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
  { value: 'ppt', label: 'Presentation', icon: Presentation, soft: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  { value: 'ebook', label: 'E-book', icon: BookMarked, soft: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
];
const mCfg = (t?: string) => MATERIAL_TYPES.find((m) => m.value === t) ?? MATERIAL_TYPES[0];

function resolveFileUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${getApiOrigin() || ''}${url}`;
}

// ── Chapter node (accordion: chapter → its topics) ───────────────────────────

function ChapterNode({
  chapter, chapterIndex, version, canEdit, selectedScopeId,
  onSelectTopic, onSelectChapter, onAddTopic, onEditTopic, onDeleteTopic, onEditChapter, onDeleteChapter,
}: {
  chapter: any; chapterIndex: number; version: number; canEdit: boolean; selectedScopeId: string | null;
  onSelectTopic: (t: any) => void; onSelectChapter: () => void; onAddTopic: (count: number) => void;
  onEditTopic: (t: any) => void; onDeleteTopic: (t: any) => void; onEditChapter: () => void; onDeleteChapter: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isChapterSelected = selectedScopeId === chapter.id;
  const anyChildSelected = isChapterSelected || topics.some((t) => t.id === selectedScopeId);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    api.get(`/topics?chapterId=${chapter.id}`)
      .then((res) => { if (!cancelled) setTopics(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setTopics([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, chapter.id, version]);

  return (
    <div className="relative">
      {/* ── Chapter header row ── */}
      <div className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all ${anyChildSelected && !open ? 'bg-brand-50/60 dark:bg-brand-900/10' : 'hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {/* Chapter number badge */}
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors ${open ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'}`}>
            {chapterIndex + 1}
          </span>
          <ChevronDown
            size={13}
            className={`shrink-0 text-surface-400 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          />
          <span className={`truncate text-sm font-bold leading-tight ${open ? 'text-brand-700 dark:text-brand-300' : 'text-surface-800 dark:text-surface-100'}`}>
            {chapter.name}
          </span>
        </button>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton label="Edit chapter" onClick={(e) => { e.stopPropagation(); onEditChapter(); }}><Pencil size={13} /></IconButton>
            <IconButton label="Delete chapter" danger onClick={(e) => { e.stopPropagation(); onDeleteChapter(); }}><Trash2 size={13} /></IconButton>
          </div>
        )}
      </div>

      {/* ── Topics subtree (with tree lines) ── */}
      {open && (
        <div className="relative ml-[22px] mt-0.5 pb-1">
          {/* Vertical trunk line */}
          <div className="absolute bottom-2 left-2.5 top-0 w-px bg-surface-200 dark:bg-surface-700" />

          {loading ? (
            <div className="flex items-center gap-2 py-3 pl-6 text-xs text-surface-400">
              <Loader2 size={13} className="animate-spin" /> Loading…
            </div>
          ) : (
            <>
              {/* ── Chapter Materials node ── */}
              <TreeItem
                icon={<Library size={13} />}
                label="Chapter Materials"
                sublabel="Overview & shared files"
                active={isChapterSelected}
                italic
                onClick={onSelectChapter}
              />

              {/* ── Topic nodes ── */}
              {topics.map((t, ti) => {
                const active = selectedScopeId === t.id;
                const isLast = ti === topics.length - 1;
                return (
                  <div key={t.id} className="group/topic relative">
                    <TreeItem
                      icon={<BookOpen size={13} />}
                      label={t.name}
                      active={active}
                      isLast={isLast && !canEdit}
                      onClick={() => onSelectTopic(t)}
                      actions={canEdit ? (
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/topic:opacity-100">
                          <IconButton label="Edit topic" onClick={(e) => { e.stopPropagation(); onEditTopic({ ...t, chapter_id: chapter.id }); }}><Pencil size={12} /></IconButton>
                          <IconButton label="Delete topic" danger onClick={(e) => { e.stopPropagation(); onDeleteTopic(t); }}><Trash2 size={12} /></IconButton>
                        </div>
                      ) : null}
                    />
                  </div>
                );
              })}

              {/* ── Add Topic ── */}
              {canEdit && (
                <div className="relative flex items-center">
                  {/* horizontal stub */}
                  <div className="absolute left-2.5 top-1/2 h-px w-4 bg-surface-200 dark:bg-surface-700" />
                  <button
                    type="button"
                    onClick={() => onAddTopic(topics.length)}
                    className="ml-8 flex items-center gap-1.5 rounded-lg py-2 pr-2 text-xs font-semibold text-surface-400 transition-all hover:text-brand-600"
                  >
                    <Plus size={12} /> Add Topic
                  </button>
                </div>
              )}

              {!canEdit && topics.length === 0 && (
                <p className="py-2 pl-8 text-xs text-surface-400 italic">No topics yet.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TreeItem({
  icon, label, sublabel, active, italic, isLast, onClick, actions,
}: {
  icon: React.ReactNode; label: string; sublabel?: string; active?: boolean;
  italic?: boolean; isLast?: boolean; onClick: () => void; actions?: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-2 transition-all ${active ? 'bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-900/30' : 'hover:bg-surface-50 dark:hover:bg-surface-800'}`}
      onClick={onClick}
    >
      {/* Horizontal branch line */}
      <div className="absolute left-2.5 top-1/2 h-px w-4 bg-surface-200 dark:bg-surface-700" />
      {/* Icon */}
      <div className={`relative z-10 ml-8 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${active ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500'}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm leading-tight ${italic ? 'italic' : ''} ${active ? 'font-semibold text-brand-700 dark:text-brand-300' : 'font-medium text-surface-700 dark:text-surface-200'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="truncate text-[10px] text-surface-400">{sublabel}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

// ── Material workspace (selected topic's materials, grouped by type) ─────────

function MaterialWorkspace({
  topic,
  subjectId,
  classId,
  sectionId,
  canEdit,
  returnState,
  onOpenPptStudio,
}: {
  topic: { id: string; name: string; chapterId: string; kind: 'topic' | 'chapter' | 'subject' };
  subjectId: string;
  classId?: string;
  sectionId?: string;
  canEdit: boolean;
  returnState: CourseContentReturnState;
  onOpenPptStudio: () => void;
}) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();
  const hasAiMaterials = useSchoolFeature('ai', 'ai_content_generator_materials');
  const hasPptGen = useSchoolFeature('ai', 'ai_ppt_generator');
  const isChapter = topic.kind === 'chapter';
  const [materials, setMaterials] = useState<SchoolMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<SchoolMaterialType | undefined>(undefined);
  const [showAi, setShowAi] = useState(false);
  const [viewMaterial, setViewMaterial] = useState<SchoolMaterial | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    schoolContent.getMaterials(
      topic.kind === 'subject'
        ? { subjectId: topic.id, classId, sectionId }
        : isChapter
          ? { chapterId: topic.id, classId, sectionId }
          : { topicId: topic.id, classId, sectionId }
    )
      .then((list) => setMaterials(Array.isArray(list) ? list : []))
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, [topic.id, isChapter, classId, sectionId]);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const g: Record<string, SchoolMaterial[]> = {
      notes: [],
      study_guide: [],
      key_concepts: [],
      flashcard: [],
      revision_checklist: [],
      faq: [],
      pyq: [],
      formula_sheet: [],
      dpp: [],
      mindmap: [],
      ppt: [],
      ebook: [],
    };
    materials.forEach((m) => { const t = String(m.fileType ?? 'notes').toLowerCase(); (g[t] ?? g.notes).push(m); });
    return g;
  }, [materials]);

  const handleDelete = async (m: SchoolMaterial) => {
    const isConfirmed = await confirm({
      title: "Confirm Delete",
      message: `Delete material "${m.title}"?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
    if (!isConfirmed) return;
    try { await schoolContent.deleteMaterial(m.id); toast.success('Material deleted'); load(); }
    catch { toast.error('Failed to delete material'); }
  };

  const aiCount = useMemo(() => materials.filter(isDownloadableAiMaterial).length, [materials]);

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      const n = await downloadAllMaterials(materials, topic.name);
      if (!n) toast.message('No AI-generated materials to download');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingAll(false);
    }
  };

  const sourcePath = `${location.pathname}${location.search}${location.hash}`;
  const isFlashcardMaterial = (m: SchoolMaterial) => {
    const type = String(m.fileType ?? '').toLowerCase();
    return type.includes('flashcard') || String(m.title || '').toLowerCase().includes('flashcard');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 p-4 dark:border-surface-700">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-surface-400">{isChapter ? 'Chapter' : 'Topic'}</p>
          <h3 className="truncate text-lg font-bold text-surface-900 dark:text-white">{topic.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-surface-100 bg-surface-50 px-2.5 py-1 text-xs font-bold text-surface-500 dark:border-surface-700 dark:bg-surface-800">
            {materials.length} item{materials.length === 1 ? '' : 's'}
          </span>
          {aiCount > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              title="Download all AI-generated materials as one PDF"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-sm font-bold text-surface-600 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
            >
              {downloadingAll ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download all
            </button>
          )}
          {canEdit && (
            <>
              {(hasAiMaterials || hasPptGen) && (
                <button
                  onClick={() => setShowAi(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
                >
                  <Sparkles size={15} /> AI Generate
                </button>
              )}
              <Button size="sm" icon={<Plus size={16} />} onClick={() => { setAddType(undefined); setShowAdd(true); }}>Add Material</Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3"><RowSkeleton /><RowSkeleton /><RowSkeleton /></div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 text-surface-300 dark:text-surface-600"><UploadCloud size={40} /></div>
            <p className="text-base font-bold text-surface-800 dark:text-surface-200">No materials yet</p>
            <p className="mt-1 max-w-sm text-sm font-medium text-surface-500">Upload notes, PYQs, formula sheets or DPPs — or paste a link — for this topic.</p>
            {canEdit && (
              <>
                <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-2">
                  {MATERIAL_TYPES.map((mt) => {
                    const Icon = mt.icon;
                    return (
                      <button key={mt.value} onClick={() => { setAddType(mt.value); setShowAdd(true); }}
                        className={`flex items-center gap-2 rounded-xl border border-surface-100 p-3 text-left transition-all hover:shadow-sm dark:border-surface-700 ${mt.soft}`}>
                        <Icon size={16} className={mt.text} />
                        <span className={`text-sm font-bold ${mt.text}`}>{mt.label}</span>

                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-surface-300">
                  <span className="h-px w-10 bg-surface-200 dark:bg-surface-700" /> or <span className="h-px w-10 bg-surface-200 dark:bg-surface-700" />
                </div>
                {(hasAiMaterials || hasPptGen) && (
                  <button onClick={() => setShowAi(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                    <Sparkles size={16} /> Generate with AI
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {MATERIAL_TYPES.map((mt) => {
              const items = grouped[mt.value];
              if (!items || items.length === 0) return null;
              const Icon = mt.icon;
              return (
                <section key={mt.value}>
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`rounded-lg p-1.5 ${mt.soft}`}><Icon size={14} className={mt.text} /></div>
                    <h4 className={`text-sm font-bold ${mt.text}`}>{mt.label}</h4>
                    <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-bold text-surface-500 dark:bg-surface-800">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((m) => {
                      const href = resolveFileUrl(m.fileUrl ?? m.file_url);
                      const isText = !!m.description && !href;
                      const displayTitle = materialDisplayTitle(m);
                      // A real uploaded slide deck (.pptx) → open it in the in-app Office viewer.
                      const canPreviewInPage = !!m.description || !!href;
                      const isPdfOrEbook = String(m.fileType || '').toLowerCase().includes('pdf') || String(m.fileType || '').toLowerCase().includes('ebook') || href.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={m.id} className="overflow-hidden rounded-xl border border-surface-100 bg-white transition-colors hover:border-brand-200 dark:border-surface-700 dark:bg-surface-800">
                          <div className="group flex items-center gap-3 p-3">
                            <div className={`rounded-lg p-2 ${mt.soft}`}><Icon size={16} className={mt.text} /></div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-surface-800 dark:text-surface-100">{displayTitle}</p>
                              <div className="flex items-center gap-2">
                                {isText && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-500">
                                    <Sparkles size={11} /> AI Generated
                                  </span>
                                )}
                                {!!m.fileSizeKb && <span className="text-[11px] font-medium text-surface-400">{m.fileSizeKb < 1024 ? `${m.fileSizeKb} KB` : `${(m.fileSizeKb / 1024).toFixed(1)} MB`}</span>}
                              </div>
                            </div>
                            {isText && (
                              <button onClick={() => downloadMaterial(m)} title="Download as PDF"
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200 px-2.5 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700">
                                <Download size={13} /> PDF
                              </button>
                            )}
                            {canPreviewInPage ? (
                              <button onClick={() => isFlashcardMaterial(m) ? setViewMaterial(m) : navigate(`/school/teacher/course-content/materials/${m.id}`, { state: { from: sourcePath, courseContentState: returnState } })}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30">
                                <Eye size={13} /> View
                              </button>
                            ) : href && !isPdfOrEbook ? (
                              <a href={href} target="_blank" rel="noreferrer"
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200 px-2.5 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700">
                                <ExternalLink size={13} /> Open
                              </a>
                            ) : null}
                            {canPreviewInPage && href && !isPdfOrEbook && (
                              <a href={href} target="_blank" rel="noreferrer"
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-200 px-2.5 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700">
                                <ExternalLink size={13} /> Open
                              </a>
                            )}
                            {canEdit && (
                              <IconButton label="Delete material" danger onClick={() => handleDelete(m)}><Trash2 size={15} /></IconButton>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <AddMaterialModal
          topic={topic}
          subjectId={subjectId}
          classId={classId}
          sectionId={sectionId}
          initialType={addType}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}

      {showAi && (
        <AiGeneratePanel
          topic={topic}
          classId={classId}
          sectionId={sectionId}
          onClose={() => setShowAi(false)}
          onSaved={() => { load(); }}
          onOpenPptStudio={() => { setShowAi(false); onOpenPptStudio(); }}
        />
      )}

      {viewMaterial && (
        <MarkdownViewer material={viewMaterial} onClose={() => setViewMaterial(null)} />
      )}

    </div>
  );
}

// ── Markdown viewer (AI / text materials) ────────────────────────────────────

// ── Slide deck viewer (presentation / ppt materials) ─────────────────────────

/**
 * Slide image column: generates a content-matched image for the slide via the
 * backend HF image endpoint (cached in S3), falling back to a Wikipedia image
 * if generation isn't available. Renders nothing (bullets go full width) when
 * neither yields an image.
 */
function InlineMaterialPage({ material, fileUrl }: { material: SchoolMaterial; fileUrl: string }) {
  const fileType = String(material.fileType ?? '').toLowerCase();
  const displayTitle = materialDisplayTitle(material);
  const content = material.description || '';
  const isMindmap = fileType === 'mindmap';
  const isPresentation = fileType === 'ppt';
  const isPracticeMaterial = fileType === 'pyq' || fileType === 'dpp';
  const isFlashcard = fileType.includes('flashcard') || material.title.toLowerCase().includes('flashcard') || /^\s*\**\s*Q(?:uestion)?\s*\d*\s*[:.]/i.test(content);
  const tree = useMemo(
    () => (isMindmap && content ? mindmapMarkdownToTree(content, displayTitle) : null),
    [isMindmap, content, displayTitle],
  );
  const slides = useMemo(
    () => (isPresentation && content ? presentationMarkdownToSlides(content) : []),
    [isPresentation, content],
  );
  const showTree = !!tree && tree.children.length > 0;
  const showSlides = slides.length > 0;
  const isOfficeFile = !!fileUrl && /\.(pptx?|docx?|xlsx?)$/i.test(fileUrl);
  const isPdfFile = !!fileUrl && /\.pdf($|\?)/i.test(fileUrl);

  return (
    <div className="border-t border-surface-100 bg-surface-50/70 p-4 dark:border-surface-700 dark:bg-surface-900/50">
      <div className="rounded-2xl border border-surface-100 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
        {showTree ? (
          <MindMapCanvas data={tree} height={520} />
        ) : showSlides ? (
          <SlideDeck slides={slides} height={440} topic={displayTitle} />
        ) : isPracticeMaterial && content ? (
          <PracticeContentPreview content={content} typeId={fileType} />
        ) : isFlashcard && content ? (
          <FlashcardViewer content={content} />
        ) : content ? (
          <MarkdownRenderer content={content} className="prose-slate max-w-none" />
        ) : isOfficeFile ? (
          <iframe
            title={displayTitle}
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            className="h-[70vh] w-full rounded-xl border border-surface-200 bg-white dark:border-surface-700"
          />
        ) : isPdfFile ? (
          <iframe
            title={displayTitle}
            src={fileUrl}
            className="h-[70vh] w-full rounded-xl border border-surface-200 bg-white dark:border-surface-700"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-surface-200 p-8 text-center text-sm font-semibold text-surface-400 dark:border-surface-700">
            This material is available as an external file.
          </div>
        )}
      </div>
    </div>
  );
}

function SlideImage({
  prompt, fallbackQuery, directUrl, alt, onImageResolved, onManualUpload, onRegenerate,
}: {
  prompt: string; fallbackQuery: string; directUrl?: string; alt: string;
  onImageResolved?: (url: string | null) => void;
  onManualUpload?: (url: string) => void;
  onRegenerate?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(directUrl ?? null);
  const [resolving, setResolving] = useState<boolean>(!directUrl);
  const [broken, setBroken] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resolve = (cancelled: { v: boolean }) => {
    setResolving(true); setUrl(null); setBroken(false);
    (async () => {
      let resolved: string | null = null;
      try { const r = await schoolContent.generateSlideImage({ prompt }); resolved = r?.url ?? null; } catch { resolved = null; }
      if (!resolved) { try { resolved = await fetchSlideImage(fallbackQuery); } catch { resolved = null; } }
      if (!cancelled.v) { setUrl(resolved); setResolving(false); onImageResolved?.(resolved); }
    })();
  };

  useEffect(() => {
    if (directUrl) { setUrl(directUrl); setResolving(false); return; }
    const c = { v: false };
    resolve(c);
    return () => { c.v = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, fallbackQuery, directUrl]);

  const handleRegenerate = () => {
    const c = { v: false };
    resolve(c);
    onRegenerate?.();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUrl(dataUrl); setBroken(false); setResolving(false);
      onManualUpload?.(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const hasImage = !broken && !!url;

  return (
    <div className="group relative hidden w-2/5 shrink-0 sm:block">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="relative h-full w-full overflow-hidden rounded-xl border border-surface-200 bg-surface-100 dark:border-surface-700 dark:bg-surface-800">
        {resolving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="animate-spin text-rose-400" />
            <span className="text-[11px] font-semibold text-surface-400">Generating image…</span>
          </div>
        )}
        {hasImage && (
          <img src={url!} alt={alt} loading="lazy" onError={() => setBroken(true)}
            className="h-full w-full object-contain transition-opacity duration-300" />
        )}
        {!resolving && !hasImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="rounded-full bg-rose-50 p-3 dark:bg-rose-900/20">
              <ImagePlus size={20} className="text-rose-400" />
            </div>
            <p className="text-xs font-medium text-surface-400">No image generated</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleRegenerate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-rose-600 active:scale-95 transition-all">
                <RefreshCw size={11} /> Retry
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-[11px] font-bold text-surface-600 shadow-sm hover:bg-surface-50 active:scale-95 transition-all dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200">
                <Upload size={11} /> Upload
              </button>
            </div>
          </div>
        )}

        {/* Hover actions — shown over existing image */}
        {hasImage && !resolving && (
          <div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/40 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" title="Enlarge" onClick={() => setLightbox(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow hover:bg-white active:scale-95 transition-all">
              <ZoomIn size={13} />
            </button>
            <button type="button" title="Regenerate image" onClick={handleRegenerate}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow hover:bg-white active:scale-95 transition-all">
              <RefreshCw size={13} />
            </button>
            <button type="button" title="Upload your own image" onClick={() => fileRef.current?.click()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow hover:bg-rose-600 active:scale-95 transition-all">
              <ImagePlus size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && hasImage && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(false)}>
          <div className="relative max-h-full max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setLightbox(false)}
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg text-sm font-bold hover:bg-slate-100">
              <X size={14} />
            </button>
            <img src={url!} alt={alt} className="max-h-[85vh] w-full rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function SlideDeck({ slides, height = 460, topic = '' }: { slides: Slide[]; height?: number; topic?: string }) {
  const [idx, setIdx] = useState(0);
  const [imageOverrides, setImageOverrides] = useState<Record<number, string>>({});
  const [regenKey, setRegenKey] = useState<Record<number, number>>({});

  if (!slides.length) return null;
  const safeIdx = Math.min(idx, slides.length - 1);
  const slide = slides[safeIdx];
  const go = (d: number) => setIdx((i) => Math.max(0, Math.min(slides.length - 1, i + d)));
  const imgPrompt = slideImagePrompt(slide, topic);
  const imgQuery = slideImageQuery(slide, topic);
  const overrideUrl = imageOverrides[safeIdx];

  const handleRegenerate = () =>
    setRegenKey((prev) => ({ ...prev, [safeIdx]: (prev[safeIdx] ?? 0) + 1 }));

  const handleManualUpload = (url: string) =>
    setImageOverrides((prev) => ({ ...prev, [safeIdx]: url }));

  const handleImageResolved = (url: string | null) => {
    if (url) setImageOverrides((prev) => ({ ...prev, [safeIdx]: url }));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Slide card */}
      <div
        className="overflow-hidden rounded-2xl border border-surface-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/30 shadow-md dark:border-surface-700 dark:from-surface-800 dark:via-surface-900 dark:to-surface-800"
        style={{ height }}
      >
        <div className="flex h-full flex-col">
          {/* Slide header strip */}
          <div className="flex items-center justify-between border-b border-rose-100 bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2 dark:border-rose-900/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-100">
              Slide {safeIdx + 1} / {slides.length}
            </span>
            {/* Per-slide image actions */}
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={handleRegenerate}
                title="Regenerate slide image"
                className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-white/30 active:scale-95 transition-all">
                <RefreshCw size={10} /> Regen image
              </button>
              <label title="Upload your own image"
                className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-white/30 active:scale-95 transition-all">
                <ImagePlus size={10} /> Upload image
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const url = ev.target?.result as string;
                      setImageOverrides((prev) => ({ ...prev, [safeIdx]: url }));
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          {/* Slide body */}
          <div className="flex flex-1 flex-col overflow-hidden px-6 pb-5 pt-4">
            <h3 className="border-b-2 border-rose-200 pb-2 text-xl font-black text-surface-900 dark:border-rose-900/40 dark:text-white">
              {slide.title}
            </h3>
            <div className="mt-4 flex flex-1 gap-5 overflow-hidden">
              <ul className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {slide.bullets.length ? slide.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2.5 text-sm font-medium leading-snug text-surface-700 dark:text-surface-200">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span>{b}</span>
                  </li>
                )) : (
                  <li className="text-sm text-surface-400">No content on this slide.</li>
                )}
              </ul>
              <SlideImage
                key={`${safeIdx}-${regenKey[safeIdx] ?? 0}`}
                prompt={imgPrompt}
                fallbackQuery={imgQuery}
                directUrl={overrideUrl ?? slide.imageUrl}
                alt={slide.title}
                onImageResolved={handleImageResolved}
                onRegenerate={handleRegenerate}
                onManualUpload={handleManualUpload}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => go(-1)} disabled={safeIdx === 0}
          className="inline-flex items-center gap-1 rounded-xl border border-surface-200 px-3 py-1.5 text-xs font-bold text-surface-600 transition-all hover:border-rose-200 hover:text-rose-600 disabled:opacity-40 dark:border-surface-700 dark:text-surface-300">
          <ChevronLeft size={14} /> Prev
        </button>

        {/* Slide dots */}
        <div className="flex flex-1 flex-wrap justify-center gap-1.5">
          {slides.map((s, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)} title={`${i + 1}. ${s.title}`}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-all ${i === safeIdx ? 'scale-125 bg-rose-500' : 'bg-surface-300 hover:bg-rose-300 dark:bg-surface-600'}`} />
          ))}
        </div>

        <button type="button" onClick={() => go(1)} disabled={safeIdx === slides.length - 1}
          className="inline-flex items-center gap-1 rounded-xl border border-surface-200 px-3 py-1.5 text-xs font-bold text-surface-600 transition-all hover:border-rose-200 hover:text-rose-600 disabled:opacity-40 dark:border-surface-700 dark:text-surface-300">
          Next <ChevronRight size={14} />
        </button>
      </div>

      {/* Slide thumbnail strip */}
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5">
          {slides.map((s, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              className={`flex-shrink-0 rounded-lg border-2 px-3 py-2 text-left transition-all ${i === safeIdx ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20' : 'border-surface-200 bg-white hover:border-rose-200 dark:border-surface-700 dark:bg-surface-800'}`}
              style={{ minWidth: 120, maxWidth: 150 }}>
              <p className="truncate text-[9px] font-black uppercase tracking-wide text-rose-500">{i + 1}</p>
              <p className="truncate text-[10px] font-semibold text-surface-700 dark:text-surface-200">{s.title}</p>
              {imageOverrides[i] && (
                <div className="mt-1 h-8 w-full overflow-hidden rounded">
                  <img src={imageOverrides[i]} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MarkdownViewer({ material, onClose }: { material: SchoolMaterial; onClose: () => void }) {
  const fileType = String(material.fileType ?? '').toLowerCase();
  const displayTitle = materialDisplayTitle(material);
  const isMindmap = fileType === 'mindmap';
  const isPresentation = fileType === 'ppt';
  const isPracticeMaterial = fileType === 'pyq' || fileType === 'dpp';
  const isFlashcard = fileType.includes('flashcard') || material.title.toLowerCase().includes('flashcard') || /^\s*\**\s*Q(?:uestion)?\s*\d*\s*[:.]/i.test(material.description || '');
  const tree = useMemo(
    () => (isMindmap && material.description ? mindmapMarkdownToTree(material.description, displayTitle) : null),
    [isMindmap, material.description, displayTitle],
  );
  const slides = useMemo(
    () => (isPresentation && material.description ? presentationMarkdownToSlides(material.description) : []),
    [isPresentation, material.description],
  );
  const showTree = !!tree && tree.children.length > 0;
  const showSlides = slides.length > 0;
  // A real uploaded .pptx file (binary) — no markdown slides to render.
  const fileUrl = resolveFileUrl(material.fileUrl ?? (material as unknown as { file_url?: string }).file_url);
  const isOfficeFile = !!fileUrl && /\.(pptx?|docx?|xlsx?)$/i.test(fileUrl);
  const isBinaryPpt = isPresentation && isOfficeFile && !showSlides;
  const hasRich = showTree || showSlides;
  const richLabel = showTree ? 'Tree' : 'Slides';
  const [view, setView] = useState<'rich' | 'text'>(hasRich ? 'rich' : 'text');
  const rich = hasRich && view === 'rich';
  const widthClass = isBinaryPpt ? 'max-w-[1400px] h-[88vh]' : rich && showTree ? 'max-w-5xl' : rich && showSlides ? 'max-w-4xl' : 'max-w-3xl';

  // --- HIGHLIGHTER LOGIC ---
  const [highlights, setHighlights] = useState<{ text: string; color: string }[]>([]);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  const notesContentRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    if (!material.id) return;
    try {
      const h = localStorage.getItem(`teacher-content-highlights-${material.id}`);
      if (h) setHighlights(JSON.parse(h));
    } catch { }
  }, [material.id]);

  useEffect(() => {
    if (!material.id) return;
    localStorage.setItem(`teacher-content-highlights-${material.id}`, JSON.stringify(highlights));
  }, [material.id, highlights]);

  useEffect(() => {
    if (view !== 'text') return;
    const root = notesContentRef.current;
    if (!root || !material.description) return;

    // Clear existing marks first to prevent duplication on re-renders
    const existingMarks = Array.from(root.querySelectorAll("mark[data-user-highlight='1']"));
    existingMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
      }
    });

    const timer = setTimeout(() => {
      highlights.forEach((h) => {
        if (!h.text) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            let parent: HTMLElement | null = (node.parentElement as HTMLElement) || null;
            while (parent && parent !== root) {
              if (parent.tagName === "MARK") return NodeFilter.FILTER_REJECT;
              parent = parent.parentElement;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        });
        let node = walker.nextNode();
        while (node) {
          const nv = node.nodeValue || "";
          const idx = nv.indexOf(h.text);
          if (idx >= 0) {
            try {
              const range = document.createRange();
              range.setStart(node, idx);
              range.setEnd(node, idx + h.text.length);
              const mark = document.createElement("mark");
              mark.setAttribute("data-user-highlight", "1");
              mark.style.backgroundColor = h.color;
              mark.style.padding = "0 1px";
              mark.style.cursor = "pointer";
              mark.title = "Click to remove highlight";
              mark.onclick = () => {
                setHighlights(prev => prev.filter(x => x.text !== h.text));
              };
              range.surroundContents(mark);
            } catch { }
            break;
          }
          node = walker.nextNode();
        }
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [view, material.description, highlights]);

  useEffect(() => {
    if (view !== 'text') return;
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelectionRect(null);
        return;
      }
      const root = notesContentRef.current;
      if (!root) return;
      const anchor = sel.anchorNode;
      if (!anchor || !root.contains(anchor)) {
        setSelectionRect(null);
        return;
      }
      const range = sel.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();
      setSelectedText(sel.toString().trim().replace(/\s+/g, " "));
      setSelectionRect(range.getBoundingClientRect());
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [view]);

  const handleCaptureHighlight = () => {
    if (!savedRangeRef.current || !selectedText) return;
    if (highlights.some(h => h.text === selectedText)) {
      window.getSelection()?.removeAllRanges();
      setSelectionRect(null);
      return;
    }
    const newHighlight = { text: selectedText, color: highlightColor };
    setHighlights(prev => [newHighlight, ...prev]);
    window.getSelection()?.removeAllRanges();
    setSelectionRect(null);
    savedRangeRef.current = null;
    setSelectedText("");
  };
  // -------------------------

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-900 ${widthClass}`}>
        <div className="flex items-center justify-between gap-3 border-b border-surface-100 px-6 py-4 dark:border-surface-700">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-surface-900 dark:text-white">{displayTitle}</h3>
            <p className="text-[11px] font-black uppercase tracking-wider text-violet-500">AI Generated · {material.fileType}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasRich && (
              <div className="flex rounded-xl border border-surface-200 p-0.5 dark:border-surface-700">
                <button onClick={() => setView('rich')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${view === 'rich' ? 'bg-violet-500 text-white' : 'text-surface-500'}`}>{richLabel}</button>
                <button onClick={() => setView('text')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${view === 'text' ? 'bg-violet-500 text-white' : 'text-surface-500'}`}>Text</button>
              </div>
            )}
            {isBinaryPpt ? (
              <a href={fileUrl} target="_blank" rel="noreferrer" download title="Download PPT"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-200 px-3 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700 dark:text-surface-200">
                <Download size={14} /> PPT
              </a>
            ) : (
              <button onClick={() => downloadMaterial(material)} title="Download as PDF"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-surface-200 px-3 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700 dark:text-surface-200">
                <Download size={14} /> PDF
              </button>
            )}
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-surface-100 text-surface-500 dark:bg-surface-800"><X size={18} /></button>
          </div>
        </div>
        {isBinaryPpt ? (
          <div className="flex-1 overflow-hidden bg-surface-50 dark:bg-surface-950">
            <iframe
              title={displayTitle}
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              className="h-full min-h-[70vh] w-full border-0"
            />
          </div>
        ) : rich && showTree ? (
          <div className="flex-1 overflow-hidden p-4">
            <MindMapCanvas data={tree} height={560} />
          </div>
        ) : rich && showSlides ? (
          <div className="flex-1 overflow-y-auto p-5">
            <SlideDeck slides={slides} height={480} topic={displayTitle} />
          </div>
        ) : isPracticeMaterial && material.description ? (
          <div className="flex-1 overflow-y-auto p-6">
            <PracticeContentPreview content={material.description} typeId={fileType} />
          </div>
        ) : isFlashcard && material.description ? (
          <div className="flex-1 overflow-y-auto p-4">
            <FlashcardViewer content={material.description} />
          </div>
        ) : material.description ? (
          <MarkdownRenderer
            content={material.description}
            className="prose-slate flex-1 overflow-y-auto p-6"
          />
        ) : (
          <div ref={notesContentRef} className="prose prose-slate max-w-none flex-1 overflow-y-auto p-6 dark:prose-invert relative">
            {material.description
              ? isFlashcard
                ? <FlashcardViewer content={material.description} />
                : <ReactMarkdown remarkPlugins={[remarkGfm]}>{material.description}</ReactMarkdown>
              : <p className="text-surface-400">No content.</p>}

            {/* Floating Color Picker */}
            {selectionRect && selectedText && (
              <div
                className="fixed z-[250] flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl border border-surface-200 dark:bg-surface-800 dark:border-surface-700 animate-in fade-in zoom-in-95"
                style={{
                  top: Math.max(10, selectionRect.top - 60) + 'px',
                  left: Math.max(10, selectionRect.left + (selectionRect.width / 2) - 100) + 'px',
                }}
              >
                <div className="flex items-center gap-1.5 px-1">
                  {["#fef08a", "#bfdbfe", "#bbf7d0", "#fecaca", "#e9d5ff"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => { e.preventDefault(); setHighlightColor(color); }}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${highlightColor === color ? "scale-110 border-surface-900 dark:border-white" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                      title="Select color"
                    />
                  ))}
                </div>
                <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { e.preventDefault(); handleCaptureHighlight(); }}
                  className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-700 flex items-center gap-1.5"
                >
                  <Highlighter size={13} /> Save
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Content Generator panel ───────────────────────────────────────────────

const AI_GEN_TYPES: { id: string; label: string; desc: string; saveAs: string; icon: React.ComponentType<{ size?: number; className?: string }>; soft: string; text: string }[] = [
  { id: 'dpp', label: 'Daily Assessment', desc: 'Daily Practice Problems with MCQs, numericals & answer key', saveAs: 'dpp', icon: ListChecks, soft: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  { id: 'mindmap', label: 'Mindmap', desc: 'Hierarchical breakdown of topic concepts & sub-topics', saveAs: 'mindmap', icon: Brain, soft: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
  { id: 'presentation', label: 'Presentation', desc: 'Opens AI PPT Studio — build, edit & save a slide deck to this topic', saveAs: 'ppt', icon: Presentation, soft: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  { id: 'pyq', label: 'PYQ Practice', desc: 'Previous Year Question style paper with solutions', saveAs: 'pyq', icon: FileQuestion, soft: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  { id: 'study_guide', label: 'Study Guide', desc: 'Exam-ready summary with must-know points for revision', saveAs: 'study_guide', icon: BookOpen, soft: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'key_concepts', label: 'Key Concepts', desc: 'Bulleted must-know concepts, formulas & definitions', saveAs: 'key_concepts', icon: Lightbulb, soft: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  { id: 'flashcard', label: 'Flashcards', desc: 'Bite-sized Q&A cards for quick recall', saveAs: 'flashcard', icon: FileText, soft: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { id: 'revision_checklist', label: 'Revision Checklist', desc: 'Subtopic checklist students can tick off', saveAs: 'revision_checklist', icon: ListChecks, soft: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'faq', label: 'FAQ', desc: 'Frequently asked questions with clear answers', saveAs: 'faq', icon: FileQuestion, soft: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
];

function findGeneratedSectionStart(content: string, patterns: RegExp[]) {
  const lines = String(content || '').split(/\r?\n/);
  let cursor = 0;
  for (const line of lines) {
    const normalized = line
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\*\*\s*|\s*\*\*$/g, '')
      .trim();
    if (patterns.some((pattern) => pattern.test(normalized))) return cursor;
    cursor += line.length + 1;
  }
  return -1;
}

function splitGeneratedPracticeContent(content: string, typeId: string) {
  if (!content || (typeId !== 'pyq' && typeId !== 'dpp')) return null;
  const patterns = typeId === 'pyq'
    ? [/^detailed\s+solutions?\b/i, /^solutions?\b/i, /^answer\s+key\b/i]
    : [/^answer\s+key\b/i, /^answers?\b/i, /^solutions?\b/i];
  const splitAt = findGeneratedSectionStart(content, patterns);
  if (splitAt <= 0) return null;
  const questions = content.slice(0, splitAt).trim();
  const solutions = content.slice(splitAt).trim();
  if (!questions || !solutions) return null;
  return { questions, solutions };
}

function PracticeContentPreview({ content, typeId }: { content: string; typeId: string }) {
  const pages = useMemo(() => splitGeneratedPracticeContent(content, typeId), [content, typeId]);
  const [page, setPage] = useState<'questions' | 'solutions'>('questions');

  useEffect(() => { setPage('questions'); }, [content, typeId]);

  if (!pages) return <MarkdownRenderer content={content} className="prose-slate" />;

  return (
    <div>
      <div className="mb-3 flex rounded-xl border border-surface-200 bg-white p-0.5 dark:border-surface-700 dark:bg-surface-900">
        {[
          ['questions', 'Page 1'],
          ['solutions', typeId === 'pyq' ? 'Detailed Solutions' : 'Answer Key'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPage(id as 'questions' | 'solutions')}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-black transition ${page === id ? 'bg-violet-600 text-white' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
          >
            {label}
          </button>
        ))}
      </div>
      <MarkdownRenderer content={page === 'questions' ? pages.questions : pages.solutions} className="prose-slate" />
    </div>
  );
}

function AiGeneratePanel({
  topic,
  classId,
  sectionId,
  onClose,
  onSaved,
  onOpenPptStudio,
}: {
  topic: { id: string; name: string; chapterId: string; kind: 'topic' | 'chapter' | 'subject' };
  classId?: string;
  sectionId?: string;
  onClose: () => void;
  onSaved: () => void;
  onOpenPptStudio: () => void;
}) {
  const scopeRef = topic.kind === 'subject' ? { subjectId: topic.id } : topic.kind === 'chapter' ? { chapterId: topic.id } : { topicId: topic.id };
  const hasAiMaterials = useSchoolFeature('ai', 'ai_content_generator_materials');
  const hasPptGen = useSchoolFeature('ai', 'ai_ppt_generator');

  const [typeId, setTypeId] = useState(() => {
    if (hasAiMaterials) return 'dpp';
    if (hasPptGen) return 'presentation';
    return '';
  });
  const [questionCount, setQuestionCount] = useState(10);
  const [extraContext, setExtraContext] = useState('');
  const [language, setLanguage] = useState<'english' | 'hindi' | 'odia'>('english');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const cfg = AI_GEN_TYPES.find((t) => t.id === typeId)!;
  const isQuestionType = typeId === 'dpp' || typeId === 'pyq';
  const isMindmap = typeId === 'mindmap';
  const previewTree = useMemo(
    () => (isMindmap && content ? mindmapMarkdownToTree(content, topic.name) : null),
    [isMindmap, content, topic.name],
  );
  const showPreviewTree = !!previewTree && previewTree.children.length > 0;
  const isPresentation = typeId === 'presentation';
  const previewSlides = useMemo(
    () => (isPresentation && content ? presentationMarkdownToSlides(content) : []),
    [isPresentation, content],
  );
  const showPreviewSlides = previewSlides.length > 0;
  const showPreviewFlashcards = typeId === 'flashcard' && !!content;

  const handleGenerate = async () => {
    setGenerating(true);
    setContent(null);
    try {
      const typeInstruction =
        typeId === 'faq'
          ? 'Generate FAQ only. Do not generate notes, introduction, summary, study guide, key concepts, or lesson content. The output must start with "# FAQ" and every item must be a frequently asked question that is repeatedly asked in target exams. For every question, you must specify the actual past board years it was asked (e.g., CBSE Class 10 2018, 2021). Format each question as: "**Q1. [EXAMTAG: <exam target and comma-separated years>] <question?>**" on its own line, then "**A.** <answer>" on a new line. Include 12-15 Q&A pairs grouped under sub-topic headings. For numerical questions, the answer must provide a detailed step-by-step solution where each new step is on a new line (never in paragraph format). For theory questions, the answer must provide a total, complete solution explaining the concept. Do not just give the final answer; provide the full, comprehensive explanation. CRITICAL MATH NOTATION: For all mathematics, equations, exponents, and variables, always use valid KaTeX/LaTeX Markdown. Exponents must use carets (e.g., $x^2$, $x^3$), and all mathematical expressions must be wrapped in single dollar signs (e.g. $3\\sqrt{5}$, $f(3) = 0$). Never output raw math or variables without dollar signs, and never use raw exponents like x2 or x3.'
          : typeId === 'revision_checklist'
            ? 'Generate revision checklist only. Do not generate notes. Every actionable item must be a Markdown checkbox using "- [ ]".'
            : typeId === 'flashcard'
              ? 'Generate flashcards only. Do not generate notes. Use repeated "**Q:**" and "**A:**" pairs.'
              : typeId === 'pyq'
                ? 'Generate school PYQ practice only. Put all detailed step-by-step solutions on the next page by adding a separate Markdown heading "## Detailed Solutions" only after all questions. Do not include solutions inline with questions. For every solution, provide a detailed step-by-step explanation showing all workings, formulas used, and conceptual steps, where each new mathematical step is written on a new line (never combined into a single paragraph). For theory/MCQ questions, provide the complete explanation/reasoning along with the correct option, not just the option letter alone. Each question must show the exact real, authentic year and class of the board exam (e.g. CBSE Class 10 2021) next to the question number. The question text must start on the same line immediately after the exam year tag (do not insert a newline between the tag and the question text). CRITICAL MCQ FORMATTING: Write each option (A-D) on a new line, never inline on a single line. CRITICAL MATH NOTATION: For all mathematics, equations, exponents, and variables, always use valid KaTeX/LaTeX Markdown. Exponents must use carets (e.g., $x^2$, $x^3$), and all mathematical expressions must be wrapped in single dollar signs (e.g. $3\\sqrt{5}$, $f(3) = 0$). Never output raw math or variables without dollar signs, and never use raw exponents like x2 or x3. For mathematics, wrap only the expression in single dollar signs, e.g. Determine whether $3\\sqrt{5}$ is rational.'
                : typeId === 'dpp'
                  ? 'Generate school Daily Practice Problem (DPP) sheet only. Put all detailed step-by-step solutions on the next page by adding a separate Markdown heading "## Detailed Solutions" only after all questions. Do not include solutions inline with questions. For every solution, provide a detailed step-by-step explanation showing all workings, formulas used, and conceptual steps, where each new mathematical step is written on a new line (never combined into a single paragraph). For theory/MCQ questions, provide the complete explanation/reasoning along with the correct option, not just the option letter alone. CRITICAL MCQ FORMATTING: Write each option (A-D) on a new line, never inline on a single line. CRITICAL MATH NOTATION: For all mathematics, equations, exponents, and variables, always use valid KaTeX/LaTeX Markdown. Exponents must use carets (e.g., $x^2$, $x^3$), and all mathematical expressions must be wrapped in single dollar signs (e.g. $3\\sqrt{5}$, $f(3) = 0$). Never output raw math or variables without dollar signs, and never use raw exponents like x2 or x3. For mathematics, wrap only the expression in single dollar signs, e.g. $x = \\frac{6}{3 + \\sqrt{2}}$.'
                  : '';
      const languageInstruction =
        language === 'hindi'
          ? 'Generate ALL content entirely in Hindi (Devanagari script). Use Hindi throughout — headings, explanations, questions, and solutions must all be in Hindi.'
          : language === 'odia'
            ? 'Generate ALL content entirely in Odia (Odia script). Use Odia throughout.'
            : '';
      const mergedExtraContext = [typeInstruction, languageInstruction, extraContext.trim()].filter(Boolean).join(' ');
      const res = await schoolContent.generateAiContent({
        ...scopeRef,
        contentType: typeId,
        questionCount: isQuestionType ? questionCount : undefined,
        extraContext: mergedExtraContext || undefined,
        language: language !== 'english' ? language : undefined,
      });
      const generated = res.content ?? '';
      if (typeId === 'faq' && language === 'english' && !/\*\*\s*Q(?:uestion)?\s*\d*\.?/i.test(generated) && !/^#{1,3}\s*FAQ\b/im.test(generated)) {
        toast.error('AI returned notes instead of FAQ. Try Generate again.');
      }
      setContent(generated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    if (typeId === 'faq' && language === 'english' && !/\*\*\s*Q(?:uestion)?\s*\d*\.?/i.test(content) && !/^#{1,3}\s*FAQ\b/im.test(content)) {
      toast.error('This does not look like an FAQ yet. Generate again before saving.');
      return;
    }
    setSaving(true);
    try {
      await schoolContent.saveAiMaterial({
        ...scopeRef,
        title: `${cfg.label} — ${topic.name}`,
        content,
        resourceType: cfg.saveAs,
        classId,
        sectionId,
      });
      toast.success(`${cfg.label} saved — students can now access it!`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Keep generated work as an unpublished draft until the teacher confirms it.
  if (content) {
    return (
      <div className="fixed inset-0 z-[210] flex flex-col bg-surface-50 dark:bg-surface-950">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-surface-200 bg-white px-5 py-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setContent(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-surface-200 text-surface-600 transition hover:bg-surface-50 dark:border-surface-700 dark:hover:bg-surface-800" aria-label="Back to generator settings">
              <ChevronLeft size={19} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-600" />
                <p className="text-[11px] font-black uppercase tracking-wider text-violet-600">Review generated content</p>
              </div>
              <h2 className="truncate text-lg font-bold text-surface-900 dark:text-white">{cfg.label} — {topic.name}</h2>
              <p className="text-xs font-medium text-surface-400">Draft only · students cannot see it until you confirm</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-surface-500 transition hover:bg-surface-100 dark:hover:bg-surface-800" aria-label="Discard and close">
            <X size={19} />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto min-h-full max-w-5xl overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900">
            {showPreviewTree ? (
              <MindMapCanvas data={previewTree} height={560} />
            ) : showPreviewSlides ? (
              <div className="p-5"><SlideDeck slides={previewSlides} height={520} topic={topic.name} /></div>
            ) : showPreviewFlashcards ? (
              <div className="p-5 sm:p-8"><FlashcardViewer content={content} /></div>
            ) : (
              <article className="p-5 sm:p-8 lg:p-10"><PracticeContentPreview content={content} typeId={typeId} /></article>
            )}
          </div>
        </main>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-surface-200 bg-white px-5 py-4 dark:border-surface-700 dark:bg-surface-900">
          <Button variant="outline" onClick={() => setContent(null)} disabled={saving}>Edit settings & regenerate</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Publishing…</span> : 'Confirm & publish to students'}
          </Button>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-900">
        <div className="flex items-start justify-between border-b border-surface-100 bg-gradient-to-r from-violet-50 to-blue-50 px-5 py-4 dark:border-surface-700 dark:from-violet-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-600 text-white"><Sparkles size={15} /></div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-violet-600">AI Content Generator</p>
              <p className="truncate text-sm font-bold text-surface-900 dark:text-white">{topic.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl bg-white/70 text-surface-500 dark:bg-surface-800"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-surface-400">1 · Choose content type</p>
          <div className="grid grid-cols-2 gap-2.5">
            {AI_GEN_TYPES.map((t) => {
              if (t.id === 'presentation') {
                if (!hasPptGen) return null;
              } else {
                if (!hasAiMaterials) return null;
              }
              const Icon = t.icon;
              const active = typeId === t.id;
              return (
                <button key={t.id} onClick={() => { if (t.id === 'presentation') { onOpenPptStudio(); return; } setTypeId(t.id); setContent(null); }}
                  className={`rounded-2xl border-2 p-3 text-left transition-all ${active ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30' : 'border-surface-100 hover:border-surface-200 dark:border-surface-700'}`}>
                  <div className={`mb-1.5 inline-flex rounded-lg p-1.5 ${t.soft}`}><Icon size={16} className={t.text} /></div>
                  <p className="text-sm font-bold text-surface-900 dark:text-white">{t.label}</p>
                  <p className="mt-0.5 text-[11px] font-medium leading-snug text-surface-400">{t.desc}</p>
                </button>
              );
            })}
          </div>

          <p className="mb-3 mt-6 text-[11px] font-black uppercase tracking-wider text-surface-400">2 · Settings</p>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-400">Language</p>
              <div className="flex gap-2">
                {(['english', 'hindi', 'odia'] as const).map((lang) => {
                  const labels: Record<string, string> = { english: 'English', hindi: 'Hindi (हिंदी)', odia: 'Odia (ଓଡ଼ିଆ)' };
                  return (
                    <button
                      key={lang}
                      onClick={() => { setLanguage(lang); setContent(null); }}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all ${language === lang
                          ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300 dark:border-surface-700 dark:text-surface-300'
                        }`}
                    >
                      {labels[lang]}
                    </button>
                  );
                })}
              </div>
            </div>
            {isQuestionType && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-400">Number of Questions</p>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25, 30].map((n) => (
                    <button key={n} onClick={() => setQuestionCount(n)}
                      className={`h-9 w-10 rounded-xl border-2 text-sm font-bold transition-colors ${questionCount === n ? 'border-violet-400 bg-violet-500 text-white' : 'border-surface-200 text-surface-600 dark:border-surface-700'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-400">Extra context (optional)</p>
              <textarea value={extraContext} onChange={(e) => setExtraContext(e.target.value)} rows={2}
                placeholder="e.g. focus on numericals, include real-world examples…"
                className="w-full resize-none rounded-xl border-2 border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-surface-700 dark:bg-surface-800" />
            </div>
          </div>

          {(generating || content) && (
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-surface-400">Preview</p>
              {generating ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-surface-100 bg-surface-50 py-10 text-sm font-semibold text-surface-500 dark:border-surface-700 dark:bg-surface-800">
                  <Loader2 size={18} className="animate-spin text-violet-500" /> Generating with AI…
                </div>
              ) : showPreviewTree ? (
                <div className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-700">
                  <MindMapCanvas data={previewTree} height={360} />
                </div>
              ) : showPreviewSlides ? (
                <SlideDeck slides={previewSlides} height={300} topic={topic.name} />
              ) : showPreviewFlashcards ? (
                <div className="rounded-2xl border border-surface-100 bg-surface-50 px-2 dark:border-surface-700 dark:bg-surface-800">
                  <FlashcardViewer content={content || ''} />
                </div>
              ) : (
                <div className="max-h-[40vh] overflow-y-auto rounded-2xl border border-surface-100 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800">
                  <PracticeContentPreview content={content || ''} typeId={typeId} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-surface-100 p-4 dark:border-surface-700">
          <Button variant="outline" className="flex-1 justify-center" onClick={handleGenerate} disabled={generating}>
            {generating ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Generating…</span> : (content ? 'Regenerate' : 'Generate')}
          </Button>
          {content && (
            <Button className="flex-1 justify-center" onClick={handleSave} disabled={saving}>
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving…</span> : 'Save for students'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Material modal (pick type → upload file or paste link) ───────────────

function AddMaterialModal({
  topic, subjectId, classId, sectionId, initialType, onClose, onSaved,
}: {
  topic: { id: string; name: string; chapterId: string; kind: 'topic' | 'chapter' | 'subject' }; subjectId: string;
  classId?: string; sectionId?: string;
  initialType?: SchoolMaterialType; onClose: () => void; onSaved: () => void;
}) {
  const [step, setStep] = useState<'type' | 'input'>(initialType ? 'input' : 'type');
  const [type, setType] = useState<SchoolMaterialType>(initialType ?? 'notes');
  const [source, setSource] = useState<'file' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cfg = mCfg(type);

  const cleanName = (n: string) => n.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').trim();
  const stageFile = (f: File) => {
    if (f.size > 100 * 1024 * 1024) { toast.error('File must be ≤ 100 MB'); return; }
    setFile(f);
    if (!title.trim()) setTitle(cleanName(f.name));
  };

  const save = async () => {
    const finalTitle = title.trim() || (file ? cleanName(file.name) : 'Material');
    setBusy(true);
    try {
      let fileUrl = '';
      let fileName = '';
      let fileSizeKb = 0;
      if (source === 'file') {
        if (!file) { toast.warning('Choose a file to upload'); setBusy(false); return; }
        fileUrl = await schoolContent.uploadMaterialFile(file);
        fileName = file.name;
        fileSizeKb = Math.round(file.size / 1024);
      } else {
        if (!url.trim()) { toast.warning('Paste a URL first'); setBusy(false); return; }
        fileUrl = url.trim();
      }
      await schoolContent.createMaterial({
        title: finalTitle,
        fileType: type,
        fileUrl,
        fileName,
        fileSizeKb,
        subjectIdFk: subjectId,
        chapterId: topic.kind === 'subject' ? undefined : topic.chapterId,
        topicId: topic.kind === 'topic' ? topic.id : undefined,
        classId,
        sectionId,
      });
      toast.success('Material added');
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add material');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-900">
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
          <div className="flex items-center gap-2">
            {step === 'input' && !initialType && (
              <button onClick={() => setStep('type')} className="grid h-8 w-8 place-items-center rounded-xl bg-surface-100 text-surface-500 dark:bg-surface-800"><ChevronLeft size={16} /></button>
            )}
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">{step === 'type' ? 'Choose material type' : `Add ${cfg.label}`}</h3>
              <p className="max-w-[240px] truncate text-xs text-surface-400">{topic.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl bg-surface-100 text-surface-500 dark:bg-surface-800"><X size={16} /></button>
        </div>

        {step === 'type' ? (
          <div className="grid grid-cols-2 gap-3 p-5">
            {MATERIAL_TYPES.map((mt) => {
              const Icon = mt.icon;
              return (
                <button key={mt.value} onClick={() => { setType(mt.value); setStep('input'); }}
                  className={`flex items-center gap-3 rounded-2xl border border-surface-100 p-4 text-left transition-all hover:shadow-sm dark:border-surface-700 ${mt.soft}`}>
                  <Icon size={20} className={mt.text} />
                  <span className={`text-sm font-bold ${mt.text}`}>{mt.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <InputField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give this material a clear title…" />

            <div className="flex gap-2">
              <button onClick={() => setSource('file')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 text-sm font-bold transition-colors ${source === 'file' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>
                <Upload size={15} /> Upload file
              </button>
              <button onClick={() => setSource('link')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 text-sm font-bold transition-colors ${source === 'link' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>
                <Link2 size={15} /> Paste link
              </button>
            </div>

            {source === 'link' ? (
              <InputField label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (PDF, Drive, YouTube, etc.)" />
            ) : file ? (
              <div className={`flex items-center gap-3 rounded-2xl border-2 border-surface-200 p-3 dark:border-surface-700 ${cfg.soft}`}>
                <cfg.icon size={20} className={cfg.text} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-surface-800 dark:text-surface-100">{file.name}</p>
                  <p className="text-xs text-surface-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="grid h-7 w-7 place-items-center rounded-lg bg-white/70 text-surface-400 hover:text-rose-500"><X size={14} /></button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) stageFile(f); }}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${dragging ? 'border-brand-400 bg-brand-50' : 'border-surface-200 hover:border-brand-300 hover:bg-surface-50 dark:border-surface-700'}`}
              >
                <div className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl ${cfg.soft}`}><Upload size={22} className={cfg.text} /></div>
                <p className="text-sm font-bold text-surface-600 dark:text-surface-300">Drop file or <span className="text-brand-600">browse</span></p>
                <p className="mt-1 text-xs text-surface-400">{type === 'ebook' ? 'Max 100 MB · PDF only' : 'Max 100 MB · PDF, DOC, images'}</p>
                <input ref={fileRef} type="file" className="hidden" accept={type === 'ebook' ? '.pdf' : '.pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png'}
                  onChange={(e) => { if (e.target.files?.[0]) stageFile(e.target.files[0]); }} />
              </div>
            )}

            <Button className="w-full justify-center" onClick={save} disabled={busy}>
              {busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {source === 'file' ? 'Uploading…' : 'Saving…'}</span> : (source === 'file' ? 'Upload & Save' : 'Save Link')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Bulk curriculum import (chapters + topics) from CSV / pasted text.
 * Format: two columns — Chapter, Topic. Rows that repeat a chapter add more
 * topics to it; a row with only a chapter creates an empty chapter.
 * ───────────────────────────────────────────────────────────────────────────── */

type ParsedRow = { chapter: string; topic: string };

/** Minimal CSV parser: handles quoted fields, commas inside quotes, and CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c === '\r') {
      // ignore — handled by the following \n
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function rowsFromCsv(text: string): ParsedRow[] {
  const raw = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  if (!raw.length) return [];
  // Drop a header row if the first cell looks like a header label.
  const first = (raw[0][0] || '').trim().toLowerCase();
  const start = first === 'chapter' || first === 'chapters' ? 1 : 0;
  const out: ParsedRow[] = [];
  for (let i = start; i < raw.length; i++) {
    const chapter = (raw[i][0] || '').trim();
    const topicRaw = (raw[i][1] || '').trim();
    if (!chapter) continue;
    if (!topicRaw) {
      // Chapter-only row (no topics)
      out.push({ chapter, topic: '' });
      continue;
    }
    // Split comma-separated topics, trim each, ignore blanks & deduplicate
    const seen = new Set<string>();
    for (const part of topicRaw.split(',')) {
      const t = part.trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ chapter, topic: t });
    }
  }
  return out;
}

const CSV_TEMPLATE =
  'Chapter,Topic\n' +
  'Real Numbers,Euclid’s Division Lemma\n' +
  'Real Numbers,Fundamental Theorem of Arithmetic\n' +
  'Polynomials,Zeroes of a Polynomial\n' +
  'Polynomials,Division Algorithm\n';

function BulkImportModal({
  isOpen, subjectId, subjectName, onClose, onImported,
}: {
  isOpen: boolean; subjectId: string; subjectName: string;
  onClose: () => void; onImported: () => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => rowsFromCsv(text), [text]);
  const grouped = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, string[]>();
    for (const r of rows) {
      if (!map.has(r.chapter)) { map.set(r.chapter, []); order.push(r.chapter); }
      if (r.topic && !map.get(r.chapter)!.some((t) => t.toLowerCase() === r.topic.toLowerCase())) {
        map.get(r.chapter)!.push(r.topic);
      }
    }
    return order.map((c) => ({ chapter: c, topics: map.get(c)! }));
  }, [rows]);

  const topicCount = grouped.reduce((n, g) => n + g.topics.length, 0);

  const onFile = async (f: File) => {
    const content = await f.text();
    setText(content);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'curriculum-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!rows.length) { toast.warning('Add at least one chapter row first'); return; }
    setBusy(true);
    try {
      const res = await api.post('/topics/bulk-import', { subjectId, rows });
      const s = res.data?.data || res.data || {};
      const parts: string[] = [];
      if (s.chaptersCreated) parts.push(`${s.chaptersCreated} chapter(s)`);
      if (s.topicsCreated) parts.push(`${s.topicsCreated} topic(s)`);
      const skipped = (s.chaptersExisting || 0) + (s.topicsExisting || 0);
      toast.success(
        parts.length ? `Imported ${parts.join(' & ')}${skipped ? ` · ${skipped} already existed` : ''}`
          : 'Nothing new to import — everything already existed',
      );
      setText('');
      onImported();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Curriculum">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-surface-500 dark:text-surface-300">
            Import chapters &amp; topics into <span className="font-semibold text-surface-700 dark:text-surface-100">{subjectName}</span>.
            Use two columns — <b>Chapter</b>, <b>Topic</b>. Existing names are reused, not duplicated.
          </p>
          <Button size="sm" variant="ghost" icon={<Download size={15} />} onClick={downloadTemplate}>Template</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) void onFile(e.target.files[0]); e.target.value = ''; }} />
          <Button size="sm" variant="outline" icon={<FileSpreadsheet size={15} />} onClick={() => fileRef.current?.click()}>Upload CSV</Button>
          {text && <Button size="sm" variant="ghost" icon={<X size={15} />} onClick={() => setText('')}>Clear</Button>}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder={'Chapter,Topic\nReal Numbers,Euclid’s Division Lemma\nReal Numbers,Fundamental Theorem of Arithmetic\nPolynomials,Zeroes of a Polynomial'}
          className="w-full rounded-xl border border-surface-200 bg-white p-3 font-mono text-xs text-surface-800 outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
        />

        {grouped.length > 0 && (
          <div className="rounded-xl border border-surface-100 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-900/40">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
              Preview · {grouped.length} chapter(s), {topicCount} topic(s)
            </p>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {grouped.map((g) => (
                <div key={g.chapter} className="text-sm">
                  <p className="font-semibold text-surface-800 dark:text-surface-100">{g.chapter}</p>
                  {g.topics.length > 0 && (
                    <ul className="ml-4 list-disc text-surface-500 dark:text-surface-300">
                      {g.topics.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleImport} disabled={busy || !rows.length}>
            {busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Importing…</span>
              : `Import ${grouped.length || ''} Chapter(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default TopicManagement;
