/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FlashcardViewer from '@/components/resources/FlashcardViewer';
import FlashcardEditor from '@/components/resources/FlashcardEditor';
import ChecklistEditor from '@/components/resources/ChecklistEditor';
import {
  completeCards, incompleteCardCount, parseFlashcards, serializeFlashcards, toEditableCards, type EditableCard,
} from '@/components/resources/flashcard-format';
import {
  completeRows, parseChecklist, serializeChecklist, toEditableRows, type EditableChecklistRow,
} from '@/components/resources/checklist-format';
import {
  LINK_TIPS, MAX_UPLOAD_MB, TYPED_CARD_TIPS, TYPED_CHECKLIST_TIPS, acceptAttribute, formatSummary, isSupportedUpload, materialUploadGuide,
} from '@/lib/material-upload-guide';
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
  Clapperboard,
  Play,
  ScanLine,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb as UiBreadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import SearchBar from '@/components/school/SearchBar';
import { Badge } from '@/components/ui/badge';
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
import { pptStudioPath } from './PptStudioPage';
import PptJobsList from '@/components/school/teacher/PptJobsList';
import { pptJobOpenPath, pptJobRetryPath } from '@/components/school/teacher/PptJobsNotifier';
import { dismissPptJob, isGenerating, pptJobToResume, usePptJobs } from '@/lib/pptJobs';

function formatSectionName(name: string | null | undefined) {
  const value = String(name || '').trim();
  if (!value) return 'Section';
  return /^(sec|section)\b/i.test(value) ? value : `Sec ${value}`;
}

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


const TopicManagement: React.FC = () => {
  const confirm = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [cardActiveSections, setCardActiveSections] = useState<Record<string, string>>({});
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  // ── Curriculum (chapters / topics tree + selected topic) ───────────────────
  const [chaptersList, setChaptersList] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  // Bumped after any topic mutation so open chapter nodes re-fetch their topics.
  const [curriculumVersion, setCurriculumVersion] = useState(0);
  // Bumped after a PPT (or other material) is saved so the open MaterialWorkspace re-fetches its list.
  const [materialsRefreshToken, setMaterialsRefreshToken] = useState(0);
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

  const openEditChapter = (chapter: any, fallbackIndex?: number) => {
    setEditingChapterId(chapter.id);
    const existingOrder = Number(chapter.sort_order ?? chapter.orderIndex ?? chapter.order ?? 0);
    const orderVal = existingOrder > 0 ? existingOrder : (fallbackIndex || 1);
    setNewChapter({ name: chapter.name || '', order: orderVal });
    setShowChapterModal(true);
  };

  const handleSaveChapter = async () => {
    if (!newChapter.name.trim()) { toast.warning('Chapter name is required'); return; }
    if (!selectedSubject) { toast.warning('Subject is required'); return; }
    try {
      const payload = {
        name: newChapter.name,
        orderIndex: Number(newChapter.order),
        order: Number(newChapter.order),
        subjectId: selectedSubject.id,
      };
      if (editingChapterId) {
        await api.put(`/topics/chapters/${editingChapterId}`, payload);
      } else {
        await api.post('/topics/chapters', payload);
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

  const openEditTopic = (topic: any, fallbackIndex?: number) => {
    setEditingTopicId(topic.id);
    setTopicTargetChapterId(topic.chapter_id ?? topic.chapterId ?? null);
    const existingOrder = Number(topic.sort_order ?? topic.orderIndex ?? topic.order ?? 0);
    const orderVal = existingOrder > 0 ? existingOrder : (fallbackIndex || 1);
    setNewTopic({ name: topic.name || '', orderIndex: orderVal });
    setShowTopicModal(true);
  };

  const handleSaveTopic = async () => {
    if (!newTopic.name.trim()) { toast.warning('Topic name is required'); return; }
    try {
      const payload = {
        name: newTopic.name,
        orderIndex: Number(newTopic.orderIndex),
        order: Number(newTopic.orderIndex),
        chapterId: topicTargetChapterId,
      };
      if (editingTopicId) {
        await api.put(`/topics/${editingTopicId}`, payload);
      } else {
        if (!topicTargetChapterId) { toast.warning('No chapter selected'); return; }
        await api.post('/topics', payload);
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
          <Button variant="outline" size="sm" onClick={goBack}>
<ChevronLeft size={16} />
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

      {/* ── CLASSES GRID WITH SHADCN ACCORDION SECTIONS & SUBJECTS ── */}
      {(level === 'classes' || level === 'sections' || level === 'subjects') && (
        loadingAssignments ? (
          <CardGridSkeleton />
        ) : filteredClasses.length === 0 ? (
          <EmptyState icon={<GraduationCap size={40} />} title="No classes assigned" message="You haven't been assigned to any classes yet. Contact your administrator." />
        ) : (
          <Accordion
            type="multiple"
            defaultValue={filteredClasses.slice(0, 1).map((c) => c.id)}
            className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredClasses.map((c, classIdx) => {
              // 1. All sections for this class
              const classSecs: { id: string; name: string }[] = [];
              const secMap = new Map<string, string>();
              all.filter((a) => a.classId === c.id).forEach((a) => {
                if (a.sectionId && !secMap.has(a.sectionId)) {
                  secMap.set(a.sectionId, formatSectionName(a.sectionName));
                  classSecs.push({ id: a.sectionId, name: formatSectionName(a.sectionName) });
                }
              });

              // Active selected section for this card (defaults to first section)
              const activeSecId = cardActiveSections[c.id] || classSecs[0]?.id;
              const activeSecObj = classSecs.find((s) => s.id === activeSecId) || classSecs[0];

              // 2. All subjects for active section in this class
              const classSubjs: { id: string; name: string }[] = [];
              if (activeSecObj) {
                const subjMap = new Map<string, string>();
                all
                  .filter((a) => a.classId === c.id && a.sectionId === activeSecObj.id)
                  .forEach((a) => {
                    if (a.subjectId && !subjMap.has(a.subjectId)) {
                      subjMap.set(a.subjectId, a.subjectName);
                      classSubjs.push({ id: a.subjectId, name: a.subjectName });
                    }
                  });
              }

              // Pre-calculate all unique subjects for this class
              const totalClassSubjectsCount = new Set(all.filter((a) => a.classId === c.id && a.subjectId).map((a) => a.subjectId)).size;

              // Card theme gradients per card index for rich visual variety
              const cardThemes = [
                {
                  gradient: 'from-blue-600 via-indigo-600 to-violet-600',
                  accentBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
                  badge: 'bg-blue-500/10 text-blue-600 border-blue-200/60 dark:bg-blue-400/10 dark:text-blue-300',
                  glow: 'hover:border-blue-400/50 hover:shadow-blue-500/10',
                },
                {
                  gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
                  accentBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
                  badge: 'bg-purple-500/10 text-purple-600 border-purple-200/60 dark:bg-purple-400/10 dark:text-purple-300',
                  glow: 'hover:border-purple-400/50 hover:shadow-purple-500/10',
                },
                {
                  gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
                  accentBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
                  badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60 dark:bg-emerald-400/10 dark:text-emerald-300',
                  glow: 'hover:border-emerald-400/50 hover:shadow-emerald-500/10',
                },
                {
                  gradient: 'from-amber-500 via-orange-600 to-rose-600',
                  accentBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
                  badge: 'bg-amber-500/10 text-amber-600 border-amber-200/60 dark:bg-amber-400/10 dark:text-amber-300',
                  glow: 'hover:border-amber-400/50 hover:shadow-amber-500/10',
                },
              ];
              const theme = cardThemes[classIdx % cardThemes.length];

              return (
                <AccordionItem
                  key={c.id}
                  value={c.id}
                  className={`group relative flex h-fit self-start flex-col justify-start overflow-hidden rounded-3xl border border-surface-200/80 bg-white shadow-xs transition-all duration-300 hover:shadow-lg dark:border-surface-800 dark:bg-surface-900 ${theme.glow}`}
                >
                  {/* shadcn Accordion Trigger as the Card Hero Header */}
                  <AccordionTrigger
                    className={`relative w-full text-left overflow-hidden bg-gradient-to-r ${theme.gradient} px-5 py-4 text-white shadow-inner transition-all duration-200 hover:no-underline hover:brightness-105 [&[data-state=open]>svg]:rotate-180 [&>svg]:hidden`}
                  >
                    {/* Abstract background blur orbs */}
                    <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl transition-transform duration-500 group-hover:scale-150" />
                    <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-black/10 blur-lg" />

                    <div className="relative flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30 shadow-xs transition-transform duration-300 group-hover:scale-105">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black tracking-tight leading-tight drop-shadow-xs truncate text-white">
                              {c.name}
                            </h3>
                            {c.isClassTeacher && (
                              <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white backdrop-blur-md ring-1 ring-white/30">
                                ★ Incharge
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-white/80 mt-0.5">
                            {classSecs.length} {classSecs.length === 1 ? 'Section' : 'Sections'} • {totalClassSubjectsCount} {totalClassSubjectsCount === 1 ? 'Subject' : 'Subjects'}
                          </p>
                        </div>
                      </div>

                      {/* Styled indicator icon that rotates on data-state=open */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/25 transition-transform duration-300 group-hover:bg-white/25 group-data-[state=open]:rotate-180">
                        <ChevronDown className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </AccordionTrigger>

                  {/* shadcn Accordion Content */}
                  <AccordionContent className="p-0 pb-0">
                    {/* Section Segmented Switcher */}
                    {classSecs.length > 0 && (
                      <div className="border-b border-surface-100 bg-surface-50/60 p-3 dark:border-surface-800 dark:bg-surface-900/50">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                            Select Section
                          </span>
                          <span className="text-[11px] font-semibold text-surface-500">
                            Active: <strong className="text-surface-800 dark:text-white">{activeSecObj?.name}</strong>
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {classSecs.map((sec) => {
                            const isSelected = activeSecObj?.id === sec.id;
                            return (
                              <button
                                key={sec.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCardActiveSections((prev) => ({ ...prev, [c.id]: sec.id }));
                                }}
                                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-surface-900 text-white shadow-xs ring-1 ring-surface-900 dark:bg-white dark:text-surface-900'
                                    : 'border border-surface-200/80 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300'
                                }`}
                              >
                                <span>{sec.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Subjects Area */}
                    <div className="p-4">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-surface-700 dark:text-surface-300">
                          Assigned Courses in {activeSecObj?.name || 'Section'}
                        </span>
                        <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[11px] font-bold text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                          {classSubjs.length} available
                        </span>
                      </div>

                      {classSubjs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/40 py-6 text-center dark:border-surface-800 dark:bg-surface-900/30">
                          <BookOpen className="h-6 w-6 text-surface-300 dark:text-surface-600 mb-1.5" />
                          <p className="text-xs font-semibold text-surface-500">No subjects in {activeSecObj?.name || 'this section'}</p>
                          <p className="text-[11px] text-surface-400">Switch section above to explore</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {classSubjs.map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!activeSecObj) return;
                                setSelectedClass({ id: c.id, name: c.name });
                                setSelectedSection({ id: activeSecObj.id, name: activeSecObj.name });
                                setSelectedSubject({ id: sub.id, name: sub.name });
                                setSearch('');
                              }}
                              className="group/sub flex flex-col justify-between rounded-2xl border border-surface-200/80 bg-surface-50/50 p-3 text-left transition-all duration-200 hover:border-brand-400 hover:bg-brand-50/30 hover:shadow-xs dark:border-surface-800 dark:bg-surface-800/40 dark:hover:border-brand-600 dark:hover:bg-brand-950/20"
                            >
                              <div className="flex items-center justify-between w-full mb-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs ring-1 ring-surface-200/60 dark:bg-surface-700 dark:ring-surface-700">
                                  <BookOpen className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200/60 text-surface-600 transition-transform group-hover/sub:translate-x-0.5 group-hover/sub:bg-brand-600 group-hover/sub:text-white dark:bg-surface-700 dark:text-surface-300">
                                  <ChevronRight className="h-3 w-3" />
                                </div>
                              </div>
                              <span className="line-clamp-1 text-xs font-bold text-surface-900 transition-colors group-hover/sub:text-brand-600 dark:text-surface-100 dark:group-hover/sub:text-brand-400">
                                {sub.name}
                              </span>
                              <span className="text-[10px] font-medium text-surface-400">
                                View Chapters
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )
      )}

      {/* ── CURRICULUM (chapters + topics) ── */}
      {level === 'curriculum' && selectedSubject && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
          {/* Curriculum tree: chapters → topics */}
          <Card className="self-start lg:sticky lg:top-6 rounded-2xl border-surface-100 bg-white dark:border-surface-700 dark:bg-surface-900/40 shadow-none">
            <div className="flex items-center justify-between border-b border-surface-100 p-4 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <Library size={18} className="text-brand-600" />
                <h3 className="font-bold text-surface-900 dark:text-white">Chapters & Topics</h3>
              </div>
              {canEditCurriculum && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowBulkModal(true)}>
<Upload size={16} />Import</Button>
                  <Button size="sm" onClick={openCreateChapter}>
<Plus size={16} />Chapter</Button>
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
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${selectedTopic?.kind === 'subject' ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400'}`}>
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
                      key={`${chapter.id}-${ci}`}
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
                      onEditChapter={() => openEditChapter(chapter, ci + 1)}
                      onDeleteChapter={() => handleDeleteChapter(chapter)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Material workspace for the selected topic */}
          <Card className="rounded-2xl border-surface-100 bg-white dark:border-surface-700 dark:bg-surface-900/40 shadow-none">
            {selectedTopic ? (
              <MaterialWorkspace
                key={selectedTopic.id}
                topic={selectedTopic}
                subjectId={selectedSubject.id}
                classId={selectedClass?.id}
                sectionId={selectedSection?.id}
                canEdit={canEditCurriculum}
                returnState={{ selectedClass, selectedSection, selectedSubject, selectedTopic }}
                onOpenPptStudio={() => navigate(pptStudioPath({
                  topic: selectedTopic, subject: selectedSubject,
                  klass: selectedClass, section: selectedSection,
                }))}
                refreshToken={materialsRefreshToken}
              />
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center p-6">
                <EmptyState icon={<UploadCloud size={40} />} title="Select a topic" message="Pick a topic on the left to view and add its study materials." />
              </div>
            )}
          </Card>
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

    </div >
  );
};

// ── Presentational helpers ───────────────────────────────────────────────────

const toneStyles: Record<string, { soft: string; icon: string; border: string }> = {
  brand: { soft: 'bg-brand-100 dark:bg-brand-900/40', icon: 'text-brand-600 dark:text-brand-400', border: 'border-brand-200 hover:border-brand-500 dark:border-brand-800 dark:hover:border-brand-500' },
  violet: { soft: 'bg-violet-100 dark:bg-violet-900/40', icon: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 hover:border-violet-500 dark:border-violet-800 dark:hover:border-violet-500' },
  emerald: { soft: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 hover:border-emerald-500 dark:border-emerald-800 dark:hover:border-emerald-500' },
};

function NavCard({
  icon, tone, title, meta, actionLabel, badge, onClick,
}: {
  icon: React.ReactNode; tone: keyof typeof toneStyles; title: string; meta: string;
  actionLabel: string; badge?: React.ReactNode; onClick: () => void;
}) {
  const t = toneStyles[tone];
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group flex h-full cursor-pointer flex-col justify-between rounded-2xl border bg-white shadow-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-surface-900 ${t.border}`}
    >
      <CardHeader className="space-y-0 p-3.5 pb-0 sm:p-5 sm:pb-0">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className={`rounded-lg p-2 sm:rounded-xl sm:p-2.5 ${t.soft} ${t.icon} [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-[22px] sm:[&>svg]:w-[22px]`}>{icon}</div>
          {badge}
        </div>
        <CardTitle className="mt-3 truncate text-sm font-bold leading-normal tracking-normal text-surface-900 dark:text-white sm:mt-4 sm:text-lg" title={title}>{title}</CardTitle>
        <CardDescription className="mt-1 flex items-center gap-1 text-xs font-medium text-surface-500 sm:gap-1.5 sm:text-sm">
          <Users size={14} className="size-3.5 shrink-0 sm:size-4" /> <span className="truncate">{meta}</span>
        </CardDescription>
      </CardHeader>
      <CardFooter className="mt-3 justify-between border-t border-surface-100 p-3.5 pt-2.5 dark:border-surface-700 sm:mt-4 sm:p-5 sm:pt-3">
        <span className={`text-xs font-semibold sm:text-sm ${t.icon}`}>{actionLabel}</span>
        <ChevronRight size={16} className="hidden shrink-0 text-surface-400 transition-transform group-hover:translate-x-0.5 sm:block" />
      </CardFooter>
    </Card>
  );
}

function IconButton({ children, label, danger, onClick }: { children: React.ReactNode; label: string; danger?: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`size-8 rounded-lg border border-transparent ${danger
        ? 'text-surface-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30'
        : 'text-surface-400 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30'
        }`}
    >
      {children}
    </Button>
  );
}

function Breadcrumb({ items }: { items: { label: string; icon?: React.ReactNode; onClick: () => void; active: boolean }[] }) {
  return (
    <UiBreadcrumb>
      <BreadcrumbList className="gap-1.5 text-sm sm:gap-1.5">
        {items.map((it, i) => (
          <React.Fragment key={`${it.label}-${i}`}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {it.active ? (
                <BreadcrumbPage className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {it.icon}{it.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Button variant="ghost" size={null}
                    type="button"
                    onClick={it.onClick}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:hover:bg-surface-800"
                  >
                    {it.icon}{it.label}
                  </Button>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </UiBreadcrumb>
  );
}

function EmptyState({ icon, title, message, compact }: { icon: React.ReactNode; title: string; message: string; compact?: boolean }) {
  return (
    <Card className={`flex flex-col items-center justify-center rounded-2xl border-dashed border-surface-200 bg-surface-50/60 text-center shadow-none dark:border-surface-700 dark:bg-surface-800/40 ${compact ? 'px-6 py-10' : 'px-6 py-16'}`}>
      <div className="mb-3 text-surface-300 dark:text-surface-600">{icon}</div>
      <p className="text-base font-bold text-surface-800 dark:text-surface-200">{title}</p>
      <p className="mt-1 max-w-sm text-sm font-medium text-surface-500">{message}</p>
    </Card>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex flex-col justify-between rounded-xl border-surface-100 bg-white p-3.5 shadow-none dark:border-surface-700 dark:bg-surface-800 sm:rounded-2xl sm:p-5">
          <div>
            <Skeleton className="size-9 rounded-lg sm:size-11 sm:rounded-xl" />
            <Skeleton className="mt-3 h-4 w-2/3 sm:mt-4 sm:h-5" />
            <Skeleton className="mt-1 h-3 w-1/2 sm:mt-2 sm:h-4" />
          </div>
          <Skeleton className="mt-3 h-3.5 w-full sm:mt-4 sm:h-4" />
        </Card>
      ))}
    </div>
  );
}

function RowSkeleton() {
  return <Skeleton className="h-16 w-full rounded-xl" />;
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
  { value: 'animation', label: 'Animation', icon: Clapperboard, soft: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
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
  onEditTopic: (t: any, fallbackIndex?: number) => void; onDeleteTopic: (t: any) => void; onEditChapter: () => void; onDeleteChapter: () => void;
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
        <Button variant="ghost" size={null}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="h-auto min-w-0 flex-1 justify-start gap-2 whitespace-normal p-0 text-left font-normal hover:bg-transparent"
        >
          {/* Chapter number badge */}
          <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors ${open ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'}`}>
            {chapterIndex + 1}
          </span>
          <ChevronDown
            size={13}
            className={`shrink-0 text-surface-400 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          />
          <span className={`min-w-0 flex-1 truncate text-left text-sm font-bold leading-tight ${open ? 'text-brand-700 dark:text-brand-300' : 'text-surface-800 dark:text-surface-100'}`}>
            {chapter.name}
          </span>
        </Button>
        {canEdit && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton label="Edit chapter" onClick={(e) => { e.stopPropagation(); onEditChapter(); }}><Pencil size={13} /></IconButton>
            <IconButton label="Delete chapter" danger onClick={(e) => { e.stopPropagation(); onDeleteChapter(); }}><Trash2 size={13} /></IconButton>
          </div>
        )}
      </div>

      {/* ── Topics subtree ── */}
      {open && (
        <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-surface-100 pb-2 pl-3 dark:border-surface-800">
          {loading ? (
            <div className="space-y-1.5 py-1">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
            </div>
          ) : (
            <>
              {/* ── Chapter Materials node ── */}
              <TreeItem
                icon={<Library size={13} />}
                label="Chapter Materials"
                sublabel="Overview & shared files"
                active={isChapterSelected}
                onClick={onSelectChapter}
              />

              {topics.length > 0 && (
                <p className="px-2 pb-0.5 pt-2 text-[10px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-600">
                  Topics · {topics.length}
                </p>
              )}

              {/* ── Topic nodes ── */}
              {topics.map((t, ti) => {
                const active = selectedScopeId === t.id;
                return (
                  <div key={`${t.id}-${ti}`} className="group/topic">
                    <TreeItem
                      icon={<BookOpen size={13} />}
                      label={t.name}
                      index={ti + 1}
                      active={active}
                      onClick={() => onSelectTopic(t)}
                      actions={canEdit ? (
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/topic:opacity-100">
                          <IconButton label="Edit topic" onClick={(e) => { e.stopPropagation(); onEditTopic({ ...t, chapter_id: chapter.id }, ti + 1); }}><Pencil size={12} /></IconButton>
                          <IconButton label="Delete topic" danger onClick={(e) => { e.stopPropagation(); onDeleteTopic(t); }}><Trash2 size={12} /></IconButton>
                        </div>
                      ) : null}
                    />
                  </div>
                );
              })}

              {/* ── Add Topic ── */}
              {canEdit && (
                <Button
                  variant="ghost"
                  size={null}
                  type="button"
                  onClick={() => onAddTopic(topics.length)}
                  className="mt-1.5 h-8 w-full justify-start gap-1.5 rounded-lg border border-dashed border-surface-200 px-2.5 text-xs font-semibold text-surface-500 hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-600 dark:border-surface-700 dark:hover:bg-brand-900/10"
                >
                  <Plus size={13} /> Add topic
                </Button>
              )}

              {!canEdit && topics.length === 0 && (
                <p className="px-2 py-2 text-xs italic text-surface-400">No topics yet.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TreeItem({
  icon, label, sublabel, index, active, onClick, actions,
}: {
  icon: React.ReactNode; label: string; sublabel?: string; index?: number; active?: boolean;
  onClick: () => void; actions?: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={active ? 'true' : undefined}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={`relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 ${
        active
          ? 'bg-brand-50 dark:bg-brand-900/30'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800'
      }`}
    >
      {/* Selected marker sits on the guide line */}
      {active && <span className="absolute -left-[14px] top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-500" />}
      <div className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold transition-colors ${active ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'}`}>
        {index !== undefined ? index : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] leading-tight ${active ? 'font-semibold text-brand-700 dark:text-brand-300' : 'font-medium text-surface-700 dark:text-surface-200'}`}>
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
  refreshToken,
}: {
  topic: { id: string; name: string; chapterId: string; kind: 'topic' | 'chapter' | 'subject' };
  subjectId: string;
  classId?: string;
  sectionId?: string;
  canEdit: boolean;
  returnState: CourseContentReturnState;
  onOpenPptStudio: () => void;
  refreshToken?: number;
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
  // Presentations generating in the background (PPT Studio "Continue in background").
  const { generating: pptGenerating } = usePptJobs();
  const [viewMaterial, setViewMaterial] = useState<SchoolMaterial | null>(null);
  const [editingFlashcards, setEditingFlashcards] = useState<SchoolMaterial | null>(null);
  const [editingChecklist, setEditingChecklist] = useState<SchoolMaterial | null>(null);
  const [animationUrl, setAnimationUrl] = useState<string | null>(null);
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

  useEffect(() => { load(); }, [load, refreshToken]);

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
      animation: [],
    };
    materials.forEach((m) => {
      let t = String(m.fileType ?? 'notes').toLowerCase();
      // Also detect animation by file URL extension in case backend doesn't persist the type
      if (t !== 'animation' && /\.(mp4|webm|og[gv])([?#].*)?$/i.test(String(m.fileUrl ?? m.file_url ?? ''))) {
        t = 'animation';
      }
      if (topic.kind === 'subject') {
        if (t === 'ebook') {
          g.ebook.push(m);
        }
      } else {
        (g[t] ?? g.notes).push(m);
      }
    });
    return g;
  }, [materials, topic.kind]);

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
  // Only a typed (no-file) checklist can be edited row by row — an uploaded
  // document has no structured content to parse back into items.
  const isTypedChecklistMaterial = (m: SchoolMaterial) => {
    const type = String(m.fileType ?? '').toLowerCase();
    return type === 'revision_checklist' && !!m.description && !(m.fileUrl || m.file_url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 p-4 dark:border-surface-700">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-surface-400">{isChapter ? 'Chapter' : 'Topic'}</p>
          <h3 className="truncate text-lg font-bold text-surface-900 dark:text-white">{topic.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-lg border-surface-100 bg-surface-50 px-2.5 py-1 text-xs font-bold text-surface-500 dark:border-surface-700 dark:bg-surface-800">
            {materials.length} item{materials.length === 1 ? '' : 's'}
          </Badge>
          {aiCount > 0 && (
            <Button variant="outline" size={null}
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              title="Download all AI-generated materials as one PDF"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
            >
              {downloadingAll ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download all
            </Button>
          )}
          {canEdit && (
            <>
              {topic.kind !== 'subject' && (hasAiMaterials || hasPptGen) && (
                <Button variant={null} size={null}
                  onClick={() => setShowAi(true)}
                  title={hasPptGen && pptGenerating.length ? 'A presentation is generating in the background' : undefined}
                  className="relative inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
                >
                  <Sparkles size={15} /> AI Generate
                  {hasPptGen && pptGenerating.length > 0 && (
                    <span data-testid="ppt-generating-dot" className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-600" />
                    </span>
                  )}
                </Button>
              )}
              <Button size="sm" onClick={() => { setAddType(topic.kind === 'subject' ? 'ebook' : undefined); setShowAdd(true); }}>
<Plus size={16} />Add Material</Button>
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
                  {MATERIAL_TYPES.filter(mt => topic.kind !== 'subject' || mt.value === 'ebook').map((mt) => {
                    const Icon = mt.icon;
                    return (
                      <Button variant={null} size={null} key={mt.value} onClick={() => { setAddType(mt.value); setShowAdd(true); }}
                        className={`flex items-center gap-2 rounded-xl border border-surface-100 p-3 text-left transition-all hover:shadow-sm dark:border-surface-700 ${mt.soft}`}>
                        <Icon size={16} className={mt.text} />
                        <span className={`text-sm font-bold ${mt.text}`}>{mt.label}</span>

                      </Button>
                    );
                  })}
                </div>
                {topic.kind !== 'subject' && (
                  <>
                    <div className="mt-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-surface-300">
                      <span className="h-px w-10 bg-surface-200 dark:bg-surface-700" /> or <span className="h-px w-10 bg-surface-200 dark:bg-surface-700" />
                    </div>
                    {(hasAiMaterials || hasPptGen) && (
                      <Button variant={null} size={null} onClick={() => setShowAi(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                        <Sparkles size={16} /> Generate with AI
                      </Button>
                    )}
                  </>
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
                    <Badge variant="secondary" className="rounded-full border-0 bg-surface-100 px-2 py-0.5 text-xs font-bold text-surface-500 hover:bg-surface-100 dark:bg-surface-800">{items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map((m, mi) => {
                      const href = resolveFileUrl(m.fileUrl ?? m.file_url);
                      const isText = !!m.description && !href;
                      const displayTitle = materialDisplayTitle(m);
                      // A real uploaded slide deck (.pptx) → open it in the in-app Office viewer.
                      const canPreviewInPage = !!m.description || !!href;
                      const isPdfOrEbook = String(m.fileType || '').toLowerCase().includes('pdf') || String(m.fileType || '').toLowerCase().includes('ebook') || href.toLowerCase().endsWith('.pdf');
                      const isAnimation =
                        String(m.fileType || '').toLowerCase() === 'animation' ||
                        /\.(mp4|webm|og[gv])([?#].*)?$/i.test(href);
                      const isPpt = mt.value === 'ppt' || String(m.fileType || '').toLowerCase() === 'ppt';
                      return (
                        <Card key={`${m.id}-${mi}`} className="overflow-hidden rounded-xl border-surface-100 bg-white transition-colors hover:border-brand-200 dark:border-surface-700 dark:bg-surface-800 shadow-none">
                          <div className="group flex items-center gap-3 p-3">
                            <div className={`rounded-lg p-2 ${mt.soft}`}><Icon size={16} className={mt.text} /></div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-surface-800 dark:text-surface-100">{displayTitle}</p>
                              <div className="flex items-center gap-2">
                                {isText && m.contentSource !== 'manual' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-500">
                                    <Sparkles size={11} /> AI Generated
                                  </span>
                                )}
                                {isText && m.contentSource === 'manual' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-brand-500">
                                    <Pencil size={11} /> Created by teacher
                                  </span>
                                )}
                                {!!m.fileSizeKb && <span className="text-[11px] font-medium text-surface-400">{m.fileSizeKb < 1024 ? `${m.fileSizeKb} KB` : `${(m.fileSizeKb / 1024).toFixed(1)} MB`}</span>}
                              </div>
                            </div>
                            {isText && (
                              <Button variant="outline" size={null} onClick={() => downloadMaterial(m)} title="Download as PDF"
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold hover:border-brand-200 hover:text-brand-600 dark:border-surface-700">
                                <Download size={13} /> PDF
                              </Button>
                            )}
                            {isAnimation && href ? (
                              <Button variant={null} size={null}
                                onClick={() => setAnimationUrl(href)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 text-xs font-bold text-purple-600 transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30"
                              >
                                <Play size={13} /> Play
                              </Button>
                            ) : canPreviewInPage ? (
                              <Button variant={null} size={null} onClick={() => isFlashcardMaterial(m) ? setViewMaterial(m) : navigate(`/school/teacher/course-content/materials/${m.id}`, { state: { from: sourcePath, courseContentState: returnState } })}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/30">
                                <Eye size={13} /> View
                              </Button>
                            ) : href && !isPdfOrEbook ? (
                              isPpt ? (
                                <Button asChild variant="outline" size={null} className="h-8 gap-1 rounded-lg px-2.5 text-xs font-bold hover:border-brand-200 hover:text-brand-600 dark:border-surface-700"><a href={href} download target="_blank" rel="noreferrer">
                                  <Download size={13} /> PPT
                                </a></Button>
                              ) : (
                                <Button asChild variant="outline" size={null} className="h-8 gap-1 rounded-lg px-2.5 text-xs font-bold hover:border-brand-200 hover:text-brand-600 dark:border-surface-700"><a href={href} target="_blank" rel="noreferrer">
                                  <ExternalLink size={13} /> Open
                                </a></Button>
                              )
                            ) : null}
                            {!isAnimation && canPreviewInPage && href && !isPdfOrEbook && (
                              isPpt ? (
                                <Button asChild variant="outline" size={null} className="h-8 gap-1 rounded-lg px-2.5 text-xs font-bold hover:border-brand-200 hover:text-brand-600 dark:border-surface-700"><a href={href} download target="_blank" rel="noreferrer">
                                  <Download size={13} /> PPT
                                </a></Button>
                              ) : (
                                <Button asChild variant="outline" size={null} className="h-8 gap-1 rounded-lg px-2.5 text-xs font-bold hover:border-brand-200 hover:text-brand-600 dark:border-surface-700"><a href={href} target="_blank" rel="noreferrer">
                                  <ExternalLink size={13} /> Open
                                </a></Button>
                              )
                            )}
                            {canEdit && isText && isFlashcardMaterial(m) && (
                              <IconButton label="Edit flashcards" onClick={() => setEditingFlashcards(m)}><Pencil size={15} /></IconButton>
                            )}
                            {canEdit && isText && isTypedChecklistMaterial(m) && (
                              <IconButton label="Edit checklist" onClick={() => setEditingChecklist(m)}><Pencil size={15} /></IconButton>
                            )}
                            {canEdit && (
                              <IconButton label="Delete material" danger onClick={() => handleDelete(m)}><Trash2 size={15} /></IconButton>
                            )}
                          </div>
                        </Card>
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
          onOpenPptStudio={() => { setShowAdd(false); onOpenPptStudio(); }}
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

      {editingFlashcards && (
        <EditFlashcardsModal
          material={editingFlashcards}
          onClose={() => setEditingFlashcards(null)}
          onSaved={() => { setEditingFlashcards(null); load(); }}
        />
      )}

      {editingChecklist && (
        <EditChecklistModal
          material={editingChecklist}
          onClose={() => setEditingChecklist(null)}
          onSaved={() => { setEditingChecklist(null); load(); }}
        />
      )}

      {animationUrl && (
        <Dialog open onOpenChange={(open) => { if (!open) setAnimationUrl(null); }}>
  <DialogContent className="w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl gap-0 p-0 sm:rounded-2xl [&>button:last-child]:hidden">
    <DialogTitle className="sr-only">Animation player</DialogTitle>
    <DialogDescription className="sr-only">Animation player</DialogDescription>

            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
              <div className="flex items-center gap-2 text-white">
                <Clapperboard size={16} className="text-purple-400" />
                <span className="text-sm font-bold text-white">Animation</span>
              </div>
              <Button variant={null} size={null}
                onClick={() => setAnimationUrl(null)}
                className="grid size-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X size={16} />
              </Button>
            </div>
            <video
              src={animationUrl}
              controls
              autoPlay
              className="w-full bg-black"
              style={{ maxHeight: '75vh' }}
            />
          
  </DialogContent>
</Dialog>
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
      <Card className="rounded-2xl border-surface-100 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
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
      </Card>
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

      <div className="relative size-full overflow-hidden rounded-xl border border-surface-200 bg-surface-100 dark:border-surface-700 dark:bg-surface-800">
        {resolving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="animate-spin text-rose-400" />
            <span className="text-[11px] font-semibold text-surface-400">Generating image…</span>
          </div>
        )}
        {hasImage && (
          <img src={url!} alt={alt} loading="lazy" onError={() => setBroken(true)}
            className="size-full object-contain transition-opacity duration-300" />
        )}
        {!resolving && !hasImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="rounded-full bg-rose-50 p-3 dark:bg-rose-900/20">
              <ImagePlus size={20} className="text-rose-400" />
            </div>
            <p className="text-xs font-medium text-surface-400">No image generated</p>
            <div className="flex gap-2">
              <Button variant={null} size={null} type="button" onClick={handleRegenerate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-rose-600 active:scale-95 transition-all">
                <RefreshCw size={11} /> Retry
              </Button>
              <Button variant="outline" size={null} type="button" onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold shadow-sm active:scale-95 transition-all dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200">
                <Upload size={11} /> Upload
              </Button>
            </div>
          </div>
        )}

        {/* Hover actions — shown over existing image */}
        {hasImage && !resolving && (
          <div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/40 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant={null} size={null} type="button" title="Enlarge" onClick={() => setLightbox(true)}
              className="flex size-7 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow hover:bg-white active:scale-95 transition-all">
              <ZoomIn size={13} />
            </Button>
            <Button variant={null} size={null} type="button" title="Regenerate image" onClick={handleRegenerate}
              className="flex size-7 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow hover:bg-white active:scale-95 transition-all">
              <RefreshCw size={13} />
            </Button>
            <Button variant={null} size={null} type="button" title="Upload your own image" onClick={() => fileRef.current?.click()}
              className="flex size-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow hover:bg-rose-600 active:scale-95 transition-all">
              <ImagePlus size={13} />
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && hasImage && (
        <Dialog open onOpenChange={(open) => { if (!open) setLightbox(false); }}>
  <DialogContent className="relative max-h-full max-w-3xl w-full gap-0 p-0 [&>button:last-child]:hidden border-0 bg-transparent shadow-none">
    <DialogTitle className="sr-only">Image preview</DialogTitle>
    <DialogDescription className="sr-only">Image preview</DialogDescription>

            <Button variant={null} size={null} type="button" onClick={() => setLightbox(false)}
              className="absolute -right-3 -top-3 z-10 flex size-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg text-sm font-bold hover:bg-slate-100">
              <X size={14} />
            </Button>
            <img src={url!} alt={alt} className="max-h-[85vh] w-full rounded-2xl object-contain shadow-2xl" />
          
  </DialogContent>
</Dialog>
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
  // Drop bullets that are only JSON punctuation ("{", "}", "[", quotes, commas):
  // a malformed generation occasionally leaks a stray brace onto a slide.
  const bullets = (slide.bullets || []).filter(
    (b) => b && b.trim() && !/^[{}[\]"'`,;:]+$/.test(b.trim()),
  );
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
              <Button variant={null} size={null} type="button" onClick={handleRegenerate}
                title="Regenerate slide image"
                className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-white/30 active:scale-95 transition-all">
                <RefreshCw size={10} /> Regen image
              </Button>
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
                {bullets.length ? bullets.map((b, i) => (
                  <li key={i} className="flex gap-2.5 text-sm font-medium leading-snug text-surface-700 dark:text-surface-200">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-400" />
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
        <Button variant="outline" size={null} type="button" onClick={() => go(-1)} disabled={safeIdx === 0}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:border-rose-200 hover:text-rose-600 disabled:opacity-40 dark:border-surface-700 dark:text-surface-300">
          <ChevronLeft size={14} /> Prev
        </Button>

        {/* Slide dots */}
        <div className="flex flex-1 flex-wrap justify-center gap-1.5">
          {slides.map((s, i) => (
            <Button variant={null} size={null} key={i} type="button" onClick={() => setIdx(i)} title={`${i + 1}. ${s.title}`}
              aria-label={`Go to slide ${i + 1}`}
              className={`size-2.5 rounded-full transition-all ${i === safeIdx ? 'scale-125 bg-rose-500' : 'bg-surface-300 hover:bg-rose-300 dark:bg-surface-600'}`} />
          ))}
        </div>

        <Button variant="outline" size={null} type="button" onClick={() => go(1)} disabled={safeIdx === slides.length - 1}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:border-rose-200 hover:text-rose-600 disabled:opacity-40 dark:border-surface-700 dark:text-surface-300">
          Next <ChevronRight size={14} />
        </Button>
      </div>

      {/* Slide thumbnail strip */}
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5">
          {slides.map((s, i) => (
            <Button variant={null} size={null} key={i} type="button" onClick={() => setIdx(i)}
              className={`h-auto flex-shrink-0 flex-col items-stretch justify-start gap-0 rounded-lg border-2 px-3 py-2 text-left font-normal transition-all ${i === safeIdx ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20' : 'border-surface-200 bg-white hover:border-rose-200 dark:border-surface-700 dark:bg-surface-800'}`}
              style={{ minWidth: 120, maxWidth: 150 }}>
              <p className="truncate text-[9px] font-black uppercase tracking-wide text-rose-500">{i + 1}</p>
              <p className="truncate text-[10px] font-semibold text-surface-700 dark:text-surface-200">{s.title}</p>
              {imageOverrides[i] && (
                <div className="mt-1 h-8 w-full overflow-hidden rounded">
                  <img src={imageOverrides[i]} alt="" className="size-full object-cover" />
                </div>
              )}
            </Button>
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
  <DialogContent className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-900 ${widthClass} gap-0 p-0 [&>button:last-child]:hidden sm:rounded-3xl`}>
    <DialogTitle className="sr-only">Material viewer</DialogTitle>
    <DialogDescription className="sr-only">Material viewer</DialogDescription>

        <div className="flex items-center justify-between gap-3 border-b border-surface-100 px-6 py-4 dark:border-surface-700">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-surface-900 dark:text-white">{displayTitle}</h3>
            <p className="text-[11px] font-black uppercase tracking-wider text-violet-500">AI Generated · {material.fileType}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasRich && (
              <div className="flex rounded-xl border border-surface-200 p-0.5 dark:border-surface-700">
                <Button variant={null} size={null} onClick={() => setView('rich')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${view === 'rich' ? 'bg-violet-500 text-white' : 'text-surface-500'}`}>{richLabel}</Button>
                <Button variant={null} size={null} onClick={() => setView('text')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${view === 'text' ? 'bg-violet-500 text-white' : 'text-surface-500'}`}>Text</Button>
              </div>
            )}
            {isBinaryPpt ? (
              <Button asChild variant="outline" size={null} className="h-9 gap-1.5 rounded-xl px-3 text-xs font-bold hover:border-brand-200 hover:text-brand-600 dark:border-surface-700 dark:text-surface-200"><a href={fileUrl} target="_blank" rel="noreferrer" download title="Download PPT">
                <Download size={14} /> PPT
              </a></Button>
            ) : (
              <Button variant="outline" size={null} onClick={() => downloadMaterial(material)} title="Download as PDF"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold hover:border-brand-200 hover:text-brand-600 dark:border-surface-700 dark:text-surface-200">
                <Download size={14} /> PDF
              </Button>
            )}
            <Button variant="secondary" size="icon" onClick={onClose} className="size-9 rounded-xl"><X size={18} /></Button>
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
                    <Button variant={null} size={null}
                      key={color}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => { e.preventDefault(); setHighlightColor(color); }}
                      className={`size-6 rounded-full border-2 transition-transform ${highlightColor === color ? "scale-110 border-surface-900 dark:border-white" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                      title="Select color"
                    />
                  ))}
                </div>
                <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />
                <Button variant={null} size={null}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { e.preventDefault(); handleCaptureHighlight(); }}
                  className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-700 flex items-center gap-1.5"
                >
                  <Highlighter size={13} /> Save
                </Button>
              </div>
            )}
          </div>
        )}
      
  </DialogContent>
</Dialog>
  );
}

// ── AI Content Generator panel ───────────────────────────────────────────────

const AI_GEN_TYPES: { id: string; label: string; desc: string; saveAs: string; icon: React.ComponentType<{ size?: number; className?: string }>; soft: string; text: string }[] = [
  { id: 'presentation', label: 'Presentation', desc: 'Opens AI PPT Studio — build, edit & save a slide deck to this topic', saveAs: 'ppt', icon: Presentation, soft: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  { id: 'study_guide', label: 'Study Guide', desc: 'Exam-ready summary with must-know points for revision', saveAs: 'study_guide', icon: BookOpen, soft: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'key_concepts', label: 'Key Concepts', desc: 'Bulleted must-know concepts, formulas & definitions', saveAs: 'key_concepts', icon: Lightbulb, soft: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  { id: 'formula_sheet', label: 'Formula Sheet', desc: 'Every key formula, grouped by sub-topic, with variables explained', saveAs: 'formula_sheet', icon: FileSpreadsheet, soft: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { id: 'mindmap', label: 'Mindmap', desc: 'Hierarchical breakdown of topic concepts & sub-topics', saveAs: 'mindmap', icon: Brain, soft: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
  { id: 'flashcard', label: 'Flashcards', desc: 'Bite-sized Q&A cards for quick recall', saveAs: 'flashcard', icon: FileText, soft: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { id: 'revision_checklist', label: 'Revision Checklist', desc: 'Subtopic checklist students can tick off', saveAs: 'revision_checklist', icon: ListChecks, soft: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'faq', label: 'FAQ', desc: 'Frequently asked questions with clear answers', saveAs: 'faq', icon: FileQuestion, soft: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { id: 'pyq', label: 'PYQ Practice', desc: 'Previous Year Question style paper with solutions', saveAs: 'pyq', icon: FileQuestion, soft: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  { id: 'dpp', label: 'Daily Assessment', desc: 'Daily Practice Problems with MCQs, numericals & answer key', saveAs: 'dpp', icon: ListChecks, soft: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
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
    : [/^detailed\s+solutions?\b/i, /^answer\s+key\b/i, /^answers?\b/i, /^solutions?\b/i];
  const splitAt = findGeneratedSectionStart(content, patterns);
  if (splitAt <= 0) return null;
  const questions = content.slice(0, splitAt).trim();
  const solutions = content.slice(splitAt).trim();
  if (!questions || !solutions) return null;
  return { questions, solutions };
}

/**
 * States plainly whether this material was written from the school's own
 * chapter PDF.
 *
 * The server sets `grounded`, so it is authoritative. Inline [p.N] citations
 * are the model's own doing and appear inconsistently — a study guide came back
 * with 143 markers and a slide deck, equally grounded, with 2 — so a teacher
 * cannot use their absence to conclude anything.
 */
function SourceBadge({ source }: {
  source: { grounded: boolean; pages?: number[]; citations?: string[]; hasEbook?: boolean; hasLecture?: boolean; reason?: string } | null;
}) {
  if (!source) return null;

  if (source.grounded) {
    const pages = (source.pages || []).filter((p) => Number.isFinite(p));
    const range = pages.length
      ? (Math.min(...pages) === Math.max(...pages)
          ? ` · page ${Math.min(...pages)}`
          : ` · pages ${Math.min(...pages)}–${Math.max(...pages)}`)
      : '';
    const bothSources = source.hasEbook && source.hasLecture;
    const label = bothSources
      ? 'From your textbook & lecture'
      : source.hasLecture
        ? 'From your lecture transcript'
        : `From your textbook${range}`;
    const title = source.citations?.length
      ? `Cited: ${source.citations.join(', ')}`
      : 'Every section was written from the chapter PDF uploaded for this class.';
    return (
      <span
        title={title}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        <span className="size-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  }

  // Not grounded. A book that IS indexed but the textbook AI (Gemini) could not
  // be used is a temporary, fixable state — distinct from a chapter that was
  // never indexed. The server's `reason` names the exact cause (see
  // _generate_grounded in ppt.py); anything Gemini-side means "book is fine, AI
  // was not", which the teacher fixes by retrying or topping up quota — not by
  // re-uploading a book that is already indexed.
  const reason = source.reason;
  const AI_SIDE: Record<string, string> = {
    unavailable:
      'The textbook AI was temporarily unavailable, so this used general knowledge. Your book is indexed — just generate again in a little while.',
    gemini_exhausted:
      'Your book IS indexed, but the textbook AI is out of quota right now, so this used general knowledge. Try again shortly, or ask an admin to top up the Gemini quota.',
    gemini_overloaded:
      'Your book IS indexed, but the textbook AI was momentarily overloaded, so this used general knowledge. Just generate again — it is usually available within a minute.',
    gemini_key_rejected:
      'Your book IS indexed, but the textbook AI key was rejected, so this used general knowledge. Ask an admin to check the Gemini API key.',
    gemini_model_unavailable:
      'Your book IS indexed, but the textbook AI model is unavailable for the configured key, so this used general knowledge. Ask an admin to check the Gemini setup.',
    gemini_unavailable:
      'Your book IS indexed, but the textbook AI is not configured on the server, so this used general knowledge. Ask an admin to configure Gemini.',
    no_relevant_passages:
      'Your book is indexed but its scanned text was unusable here, so this used general knowledge. Re-upload a clearer PDF under Textbook Coverage.',
  };
  const aiSideTitle = reason ? AI_SIDE[reason] : undefined;
  const isAiSide = Boolean(aiSideTitle);
  return (
    <span
      title={
        aiSideTitle
          ?? (reason === 'no_source_available'
            ? 'No indexed textbook or lecture transcript was available for the source you picked, so this used general knowledge.'
            : 'This chapter has no indexed textbook, so it was written from general knowledge. Upload the chapter PDF under Textbook Coverage to change that.')
      }
      className={
        isAiSide
          ? 'inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          : 'inline-flex items-center gap-1.5 rounded-full border border-surface-300 bg-surface-100 px-2.5 py-0.5 text-[11px] font-bold text-surface-600 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300'
      }
    >
      <span className="size-1.5 rounded-full bg-current" />
      {isAiSide ? 'Textbook AI unavailable — retry' : 'General knowledge'}
    </span>
  );
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
          <Button variant={null} size={null}
            key={id}
            type="button"
            onClick={() => setPage(id as 'questions' | 'solutions')}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-black transition ${page === id ? 'bg-violet-600 text-white' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
          >
            {label}
          </Button>
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
  const navigate = useNavigate();
  const { jobs: pptJobs } = usePptJobs();
  // A deck already being made for this topic (or made and not opened yet):
  // Presentation opens that, rather than a setup screen to generate it again.
  const pptJobHere = pptJobToResume(pptJobs, topic);
  const openPresentation = () => {
    if (pptJobHere) { onClose(); navigate(pptJobOpenPath(pptJobHere)); return; }
    onOpenPptStudio();
  };

  const [typeId, setTypeId] = useState(() => {
    // Match production: default to a material type, never 'presentation'.
    // Presentation is not generated inline here — its card opens the PPT Studio
    // (see the card onClick). Defaulting to 'presentation' made the generator
    // produce an inline slide-review instead of opening the Studio.
    if (hasAiMaterials) return 'dpp';
    if (hasPptGen) return 'presentation';
    return '';
  });
  const [questionCount, setQuestionCount] = useState(10);
  const [extraContext, setExtraContext] = useState('');
  const [language, setLanguage] = useState<'english' | 'hindi' | 'odia'>('english');
  const [generating, setGenerating] = useState(false);
  // Generation timing shown in the UI: a live counter while generating, and the
  // final duration once done (teachers asked to see how long a paper/material takes).
  const [genStartAt, setGenStartAt] = useState<number | null>(null);
  const [genElapsedMs, setGenElapsedMs] = useState(0);
  const [genDurationMs, setGenDurationMs] = useState<number | null>(null);
  useEffect(() => {
    if (!generating || genStartAt == null) return;
    const id = setInterval(() => setGenElapsedMs(Date.now() - genStartAt), 100);
    return () => clearInterval(id);
  }, [generating, genStartAt]);
  const fmtDuration = (ms: number) => (ms >= 10000 ? `${Math.round(ms / 1000)}s` : `${(ms / 1000).toFixed(1)}s`);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  // Whether the chapter's indexed textbook was actually used. Set by the server,
  // so it is reliable — inline [p.N] markers only appear when the model happens
  // to add them, and a teacher cannot tell "no citations" from "not grounded".
  const [source, setSource] = useState<{ grounded: boolean; pages?: number[]; citations?: string[]; reason?: string } | null>(null);

  // Which source(s) to ground generation on. Only offered when this topic
  // actually has an indexed lecture transcript AND the institute has lecture
  // grounding enabled — otherwise generation stays ebook-only, unchanged.
  const [sourceMode, setSourceMode] = useState<'ebook' | 'lecture' | 'both'>('ebook');
  const [sourceAvailability, setSourceAvailability] = useState<{
    ebookAvailable: boolean; lectureAvailable: boolean; lectureGroundingEnabled: boolean;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    schoolContent.getAiSourceAvailability(scopeRef).then((res) => {
      if (!cancelled) setSourceAvailability(res);
    }).catch(() => { if (!cancelled) setSourceAvailability(null); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id, topic.kind]);
  const showLectureOption = !!(sourceAvailability?.lectureGroundingEnabled && sourceAvailability?.lectureAvailable);
  useEffect(() => {
    if (!showLectureOption && sourceMode !== 'ebook') setSourceMode('ebook');
  }, [showLectureOption]);

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
    const start = Date.now();
    setGenerating(true);
    setContent(null);
    setSource(null);
    setGenDurationMs(null);
    setGenElapsedMs(0);
    setGenStartAt(start);
    try {
      const typeInstruction =
        typeId === 'faq'
          ? 'Generate FAQ only. Do not generate notes, introduction, summary, study guide, key concepts, or lesson content. The output must start with "# FAQ" and every item must be a frequently asked question that is repeatedly asked in target exams. For every question, you must specify the actual past board years it was asked (e.g., CBSE Class 10 2018, 2021). Format each question as: "**Q1. [EXAMTAG: <exam target and comma-separated years>] <question?>**" on its own line, then "**A.** <answer>" on a new line. Include 12-15 Q&A pairs grouped under sub-topic headings. For numerical questions, the answer must provide a detailed step-by-step solution where each new step is on a new line (never in paragraph format). For theory questions, the answer must provide a total, complete solution explaining the concept. Do not just give the final answer; provide the full, comprehensive explanation. CRITICAL MATH NOTATION: For all mathematics, equations, exponents, and variables, always use valid KaTeX/LaTeX Markdown. Exponents must use carets (e.g., $x^2$, $x^3$), and all mathematical expressions must be wrapped in single dollar signs (e.g. $3\\sqrt{5}$, $f(3) = 0$). Never output raw math or variables without dollar signs, and never use raw exponents like x2 or x3.'
          : typeId === 'revision_checklist'
            ? 'Generate revision checklist only. Do not generate notes. Every actionable item must be a Markdown checkbox using "- [ ]".'
            : typeId === 'formula_sheet'
              ? 'Generate a formula sheet only. Do not generate notes, an introduction, or explanatory paragraphs. List every key formula for this topic, grouped under sub-topic Markdown headings. For each formula: write it on its own line, name every variable used in it directly underneath, and give a one-line hint on when to use it. CRITICAL MATH NOTATION: For all formulas, equations, exponents, and variables, always use valid KaTeX/LaTeX Markdown. Exponents must use carets (e.g., $x^2$, $x^3$), and every mathematical expression must be wrapped in single dollar signs (e.g. $F = ma$, $3\\sqrt{5}$). Never output raw math or variables without dollar signs, and never use the Unicode square-root symbol.'
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
        sourceMode: showLectureOption ? sourceMode : undefined,
      });
      const generated = res.content ?? '';
      if (typeId === 'faq' && language === 'english' && !/\*\*\s*Q(?:uestion)?\s*\d*\.?/i.test(generated) && !/^#{1,3}\s*FAQ\b/im.test(generated)) {
        toast.error('AI returned notes instead of FAQ. Try Generate again.');
      }
      setContent(generated);
      setSource((res as any).source ?? null);
      setGenDurationMs(Date.now() - start);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'AI generation failed');
    } finally {
      setGenerating(false);
      setGenStartAt(null);
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
      <Dialog open onOpenChange={() => { /* closed via its own Back / Discard buttons */ }}>
  <DialogContent className="left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:rounded-none flex flex-col bg-surface-50 dark:bg-surface-950 gap-0 p-0 [&>button:last-child]:hidden">
    <DialogTitle className="sr-only">AI content generator</DialogTitle>
    <DialogDescription className="sr-only">AI content generator</DialogDescription>

        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-surface-200 bg-white px-5 py-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size={null} type="button" onClick={() => setContent(null)} className="grid size-10 shrink-0 place-items-center rounded-xl dark:border-surface-700 dark:hover:bg-surface-800" aria-label="Back to generator settings">
              <ChevronLeft size={19} />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-600" />
                <p className="text-[11px] font-black uppercase tracking-wider text-violet-600">Review generated content</p>
              </div>
              <h2 className="truncate text-lg font-bold text-surface-900 dark:text-white">{cfg.label} — {topic.name}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-surface-400">Draft only · students cannot see it until you confirm</p>
                <SourceBadge source={source} />
              </div>
            </div>
          </div>
          <Button variant="ghost" size={null} type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl text-surface-500 transition hover:bg-surface-100 dark:hover:bg-surface-800" aria-label="Discard and close">
            <X size={19} />
          </Button>
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
      
  </DialogContent>
</Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
  <DialogContent className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-900 gap-0 p-0 [&>button:last-child]:hidden sm:rounded-3xl">
    <DialogTitle className="sr-only">AI content generator</DialogTitle>
    <DialogDescription className="sr-only">AI content generator</DialogDescription>

        <div className="flex items-start justify-between border-b border-surface-100 bg-gradient-to-r from-violet-50 to-blue-50 px-5 py-4 dark:border-surface-700 dark:from-violet-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-violet-600 text-white"><Sparkles size={15} /></div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-violet-600">AI Content Generator</p>
              <p className="truncate text-sm font-bold text-surface-900 dark:text-white">{topic.name}</p>
            </div>
          </div>
          <Button variant={null} size={null} onClick={onClose} className="grid size-8 place-items-center rounded-xl bg-white/70 text-surface-500 dark:bg-surface-800"><X size={16} /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {hasPptGen && (
            <PptJobsList
              jobs={pptJobs}
              onOpen={(job) => { onClose(); navigate(pptJobOpenPath(job)); }}
              onRetry={(job) => { void dismissPptJob(job.jobId); onClose(); navigate(pptJobRetryPath(job)); }}
              onDismiss={(job) => { void dismissPptJob(job.jobId); }}
            />
          )}
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
                <Button variant={null} size={null} key={t.id} onClick={() => { if (t.id === 'presentation') { openPresentation(); return; } setTypeId(t.id); setContent(null); }}
                  className={`rounded-2xl border-2 p-3 text-left transition-all ${active ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30' : 'border-surface-100 hover:border-surface-200 dark:border-surface-700'}`}>
                  <div className={`mb-1.5 inline-flex rounded-lg p-1.5 ${t.soft}`}><Icon size={16} className={t.text} /></div>
                  <p className="text-sm font-bold text-surface-900 dark:text-white">{t.label}</p>
                  <p className="mt-0.5 text-[11px] font-medium leading-snug text-surface-400">{t.desc}</p>
                  {t.id === 'presentation' && pptJobHere && (
                    isGenerating(pptJobHere) ? (
                      <p data-testid="ppt-card-state" className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        <Loader2 size={10} className="animate-spin" /> Generating now · click to see progress
                      </p>
                    ) : (
                      <p data-testid="ppt-card-state" className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Ready · click to open
                      </p>
                    )
                  )}
                </Button>
              );
            })}
          </div>

          <p className="mb-3 mt-6 text-[11px] font-black uppercase tracking-wider text-surface-400">2 · Settings</p>
          <div className="space-y-4">
            {showLectureOption && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-400">Generate from</p>
                <div className="flex gap-2">
                  {([
                    ['ebook', 'Textbook', sourceAvailability?.ebookAvailable !== false],
                    ['lecture', 'Lecture Transcript', true],
                    ['both', 'Both', sourceAvailability?.ebookAvailable !== false],
                  ] as const).map(([mode, label, enabled]) => (
                    <Button variant={null} size={null}
                      key={mode}
                      type="button"
                      disabled={!enabled}
                      onClick={() => { setSourceMode(mode); setContent(null); }}
                      title={!enabled ? 'No indexed textbook for this chapter yet' : undefined}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${sourceMode === mode
                          ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300 dark:border-surface-700 dark:text-surface-300'
                        }`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] font-medium text-surface-400">
                  {sourceMode === 'both'
                    ? 'Written from the chapter PDF and this topic’s recorded-lecture transcript(s).'
                    : sourceMode === 'lecture'
                      ? 'Written from this topic’s recorded-lecture transcript(s) only.'
                      : 'Written from the chapter PDF only.'}
                </p>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-400">Language</p>
              <div className="flex gap-2">
                {(['english', 'hindi', 'odia'] as const).map((lang) => {
                  const labels: Record<string, string> = { english: 'English', hindi: 'Hindi (हिंदी)', odia: 'Odia (ଓଡ଼ିଆ)' };
                  return (
                    <Button variant={null} size={null}
                      key={lang}
                      onClick={() => { setLanguage(lang); setContent(null); }}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all ${language === lang
                          ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300 dark:border-surface-700 dark:text-surface-300'
                        }`}
                    >
                      {labels[lang]}
                    </Button>
                  );
                })}
              </div>
            </div>
            {isQuestionType && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-400">Number of Questions</p>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25, 30].map((n) => (
                    <Button variant={null} size={null} key={n} onClick={() => setQuestionCount(n)}
                      className={`h-9 w-10 rounded-xl border-2 text-sm font-bold transition-colors ${questionCount === n ? 'border-violet-400 bg-violet-500 text-white' : 'border-surface-200 text-surface-600 dark:border-surface-700'}`}>
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-400">Extra context (optional)</p>
              <Textarea value={extraContext} onChange={(e) => setExtraContext(e.target.value)} rows={2}
                placeholder="e.g. focus on numericals, include real-world examples…"
                className="w-full resize-none rounded-xl border-2 border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-surface-700 dark:bg-surface-800" />
            </div>
          </div>

          {(generating || content) && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-wider text-surface-400">Preview</p>
                {!generating && content && genDurationMs != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Generated in {fmtDuration(genDurationMs)}
                  </span>
                )}
              </div>
              {generating ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-surface-100 bg-surface-50 py-10 text-sm font-semibold text-surface-500 dark:border-surface-700 dark:bg-surface-800">
                  <Loader2 size={18} className="animate-spin text-violet-500" /> Generating with AI… {fmtDuration(genElapsedMs)}
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
            {generating ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Generating… {fmtDuration(genElapsedMs)}</span> : (content ? 'Regenerate' : 'Generate')}
          </Button>
          {content && (
            <Button className="flex-1 justify-center" onClick={handleSave} disabled={saving}>
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving…</span> : 'Save for students'}
            </Button>
          )}
        </div>
      
  </DialogContent>
</Dialog>
  );
}

// ── Add Material modal (pick type → upload file or paste link) ───────────────

/** "Supported formats + how to prepare it" hint shown in the Add Material dialog. */
function UploadGuidePanel({ label, formats, tips }: { label: string; formats?: string; tips: string[] }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-xs text-surface-600 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-surface-300">
      {formats && (
        <p className="mb-2">
          <span className="font-bold text-surface-800 dark:text-surface-100">Supported files: </span>{formats}
        </p>
      )}
      <p className="mb-1 font-bold text-surface-800 dark:text-surface-100">How to prepare your {label.toLowerCase()}</p>
      <ul className="list-disc space-y-1 pl-4">
        {tips.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
}

/** Edit an existing flashcard set (teacher-typed or AI-generated) card by card. */
function EditFlashcardsModal({ material, onClose, onSaved }: {
  material: SchoolMaterial;
  onClose: () => void;
  onSaved: () => void;
}) {
  const confirm = useConfirm();
  const original = useMemo(() => parseFlashcards(material.description || ''), [material.description]);
  const [cards, setCards] = useState<EditableCard[]>(() => toEditableCards(original));
  const [title, setTitle] = useState(material.title || '');
  const [busy, setBusy] = useState(false);

  const serialized = serializeFlashcards(completeCards(cards));
  const dirty = title.trim() !== (material.title || '').trim() || serialized !== serializeFlashcards(original);

  const requestClose = async () => {
    if (dirty && !busy) {
      const ok = await confirm({
        title: 'Discard changes?',
        message: 'Your edits to these flashcards have not been saved.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
      });
      if (!ok) return;
    }
    onClose();
  };

  const save = async () => {
    const incomplete = incompleteCardCount(cards);
    if (incomplete) { toast.warning(`${incomplete} card${incomplete === 1 ? ' is' : 's are'} missing a front or back`); return; }
    const count = completeCards(cards).length;
    if (!count) { toast.warning('A set needs at least one card — delete the set instead'); return; }
    if (!title.trim()) { toast.warning('Give the set a title'); return; }
    setBusy(true);
    try {
      await schoolContent.updateMaterial(material.id, { title: title.trim(), description: serialized });
      toast.success(`Flashcards updated (${count} card${count === 1 ? '' : 's'})`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update flashcards');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) void requestClose(); }}>
  <DialogContent className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-900 gap-0 p-0 [&>button:last-child]:hidden sm:rounded-3xl">
    <DialogTitle className="sr-only">Edit flashcards</DialogTitle>
    <DialogDescription className="sr-only">Edit flashcards</DialogDescription>

        <div className="flex shrink-0 items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white">Edit Flashcards</h3>
          <Button variant="secondary" size="icon" onClick={() => void requestClose()} aria-label="Close" className="size-8 rounded-xl"><X size={16} /></Button>
        </div>
        {original.length === 0 ? (
          // Never open an unreadable set as an empty editor — saving it would wipe the content.
          <div className="space-y-4 p-5">
            <p className="text-sm text-surface-600 dark:text-surface-300">
              This set isn't in question-and-answer form, so it can't be edited card by card. Delete it and add the cards again with <b>Add Material → Flashcards → Type cards</b>.
            </p>
            <Button className="w-full justify-center" variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto p-5">
            <InputField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <FlashcardEditor cards={cards} onChange={setCards} />
            <Button className="w-full justify-center" onClick={save} disabled={busy || !dirty}>
              {busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving…</span> : 'Save Changes'}
            </Button>
          </div>
        )}
      
  </DialogContent>
</Dialog>
  );
}

function EditChecklistModal({ material, onClose, onSaved }: {
  material: SchoolMaterial;
  onClose: () => void;
  onSaved: () => void;
}) {
  const confirm = useConfirm();
  const original = useMemo(() => parseChecklist(material.description || ''), [material.description]);
  const [rows, setRows] = useState<EditableChecklistRow[]>(() => toEditableRows(original));
  const [title, setTitle] = useState(material.title || '');
  const [busy, setBusy] = useState(false);

  const serialized = serializeChecklist(completeRows(rows));
  const dirty = title.trim() !== (material.title || '').trim() || serialized !== serializeChecklist(original);

  const requestClose = async () => {
    if (dirty && !busy) {
      const ok = await confirm({
        title: 'Discard changes?',
        message: 'Your edits to this checklist have not been saved.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
      });
      if (!ok) return;
    }
    onClose();
  };

  const save = async () => {
    const count = completeRows(rows).filter((r) => !r.heading).length;
    if (!count) { toast.warning('A checklist needs at least one item — delete it instead'); return; }
    if (!title.trim()) { toast.warning('Give the checklist a title'); return; }
    setBusy(true);
    try {
      await schoolContent.updateMaterial(material.id, { title: title.trim(), description: serialized });
      toast.success(`Checklist updated (${count} item${count === 1 ? '' : 's'})`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update checklist');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) void requestClose(); }}>
  <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-900 gap-0 p-0 [&>button:last-child]:hidden sm:rounded-3xl">
    <DialogTitle className="sr-only">Edit revision checklist</DialogTitle>
    <DialogDescription className="sr-only">Edit revision checklist</DialogDescription>

        <div className="flex shrink-0 items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white">Edit Revision Checklist</h3>
          <Button variant="secondary" size="icon" onClick={() => void requestClose()} aria-label="Close" className="size-8 rounded-xl"><X size={16} /></Button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          <InputField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <ChecklistEditor rows={rows} onChange={setRows} />
          <Button className="w-full justify-center" onClick={save} disabled={busy || !dirty}>
            {busy ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving…</span> : 'Save Changes'}
          </Button>
        </div>
      
  </DialogContent>
</Dialog>
  );
}

function AddMaterialModal({
  topic, subjectId, classId, sectionId, initialType, onClose, onSaved, onOpenPptStudio,
}: {
  topic: { id: string; name: string; chapterId: string; kind: 'topic' | 'chapter' | 'subject' };
  subjectId: string;
  classId?: string;
  sectionId?: string;
  initialType?: SchoolMaterialType;
  onClose: () => void;
  onSaved: () => void;
  onOpenPptStudio: () => void;
}) {
  const isSubject = topic.kind === 'subject';
  const [step, setStep] = useState<'type' | 'input'>(initialType || isSubject ? 'input' : 'type');
  const [type, setType] = useState<SchoolMaterialType>(initialType ?? (isSubject ? 'ebook' : 'notes'));
  const confirm = useConfirm();
  const [source, setSource] = useState<'file' | 'link' | 'cards'>(
    initialType === 'flashcard' || initialType === 'revision_checklist' ? 'cards' : 'file',
  );
  const [cards, setCards] = useState<EditableCard[]>(() => toEditableCards([]));
  const [checklistRows, setChecklistRows] = useState<EditableChecklistRow[]>(() => toEditableRows([]));
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cfg = mCfg(type);
  const guide = materialUploadGuide(type);

  const cleanName = (n: string) => n.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').trim();
  const stageFile = (f: File) => {
    // Drag-and-drop ignores the input's `accept`, so check the extension here too.
    if (!isSupportedUpload(guide, f.name)) { toast.error(`${cfg.label}: upload ${guide.formats}`); return; }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) { toast.error(`File must be ≤ ${MAX_UPLOAD_MB} MB`); return; }
    setFile(f);
    if (!title.trim()) setTitle(cleanName(f.name));
  };

  const isTypingCards = type === 'flashcard' && source === 'cards';
  const isTypingChecklist = type === 'revision_checklist' && source === 'cards';
  const hasTypedCards = cards.some((c) => c.q.trim() || c.a.trim());
  const hasTypedChecklist = checklistRows.some((r) => r.text.trim());

  // Typed content lives only in this modal — don't lose it to a stray click.
  const requestClose = async () => {
    if (isTypingCards && hasTypedCards && !busy) {
      const ok = await confirm({
        title: 'Discard flashcards?',
        message: 'The cards you typed have not been saved.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
      });
      if (!ok) return;
    }
    if (isTypingChecklist && hasTypedChecklist && !busy) {
      const ok = await confirm({
        title: 'Discard checklist?',
        message: 'The checklist you typed has not been saved.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
      });
      if (!ok) return;
    }
    onClose();
  };

  const saveTypedCards = async () => {
    const incomplete = incompleteCardCount(cards);
    if (incomplete) { toast.warning(`${incomplete} card${incomplete === 1 ? ' is' : 's are'} missing a front or back`); return; }
    const complete = completeCards(cards);
    if (!complete.length) { toast.warning('Add at least one card'); return; }
    setBusy(true);
    try {
      await schoolContent.createMaterial({
        title: title.trim() || `Flashcards — ${topic.name}`,
        fileType: 'flashcard',
        fileUrl: '',
        description: serializeFlashcards(complete),
        subjectIdFk: subjectId,
        chapterId: topic.kind === 'subject' ? undefined : topic.chapterId,
        topicId: topic.kind === 'topic' ? topic.id : undefined,
        classId,
        sectionId,
      });
      toast.success(`${complete.length} flashcard${complete.length === 1 ? '' : 's'} saved — students can now study them`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save flashcards');
    } finally {
      setBusy(false);
    }
  };

  const saveTypedChecklist = async () => {
    const complete = completeRows(checklistRows);
    const itemCount = complete.filter((r) => !r.heading).length;
    if (!itemCount) { toast.warning('Add at least one checklist item'); return; }
    setBusy(true);
    try {
      await schoolContent.createMaterial({
        title: title.trim() || `Revision Checklist — ${topic.name}`,
        fileType: 'revision_checklist',
        fileUrl: '',
        description: serializeChecklist(complete),
        subjectIdFk: subjectId,
        chapterId: topic.kind === 'subject' ? undefined : topic.chapterId,
        topicId: topic.kind === 'topic' ? topic.id : undefined,
        classId,
        sectionId,
      });
      toast.success(`${itemCount} checklist item${itemCount === 1 ? '' : 's'} saved — students can now tick them off`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save checklist');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (isTypingCards) { await saveTypedCards(); return; }
    if (isTypingChecklist) { await saveTypedChecklist(); return; }
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
    <Dialog open onOpenChange={(open) => { if (!open) void requestClose(); }}>
  <DialogContent className={`flex max-h-[92vh] w-full flex-col ${(isTypingCards || isTypingChecklist) && step === 'input' ? 'max-w-3xl' : 'max-w-md'} overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-surface-900 gap-0 p-0 [&>button:last-child]:hidden sm:rounded-3xl`}>
    <DialogTitle className="sr-only">Add material</DialogTitle>
    <DialogDescription className="sr-only">Add material</DialogDescription>

        <div className="flex shrink-0 items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
          <div className="flex items-center gap-2">
            {step === 'input' && !initialType && !isSubject && (
              <Button variant="secondary" size="icon" onClick={() => setStep('type')} className="size-8 rounded-xl"><ChevronLeft size={16} /></Button>
            )}
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">{step === 'type' ? 'Choose material type' : `Add ${cfg.label}`}</h3>
              <p className="max-w-[240px] truncate text-xs text-surface-400">{topic.name}</p>
            </div>
          </div>
          <Button variant="secondary" size="icon" onClick={() => void requestClose()} aria-label="Close" className="size-8 rounded-xl"><X size={16} /></Button>
        </div>

        {step === 'type' ? (
          <div className="grid grid-cols-2 gap-3 overflow-y-auto p-5">
            {MATERIAL_TYPES.map((mt) => {
              const Icon = mt.icon;
              return (
                <Button variant={null} size={null} key={mt.value}
                  onClick={() => {
                    setType(mt.value);
                    setSource(mt.value === 'flashcard' || mt.value === 'revision_checklist' ? 'cards' : 'file');
                    if (file && !isSupportedUpload(materialUploadGuide(mt.value), file.name)) setFile(null);
                    setStep('input');
                  }}
                  className={`flex items-center gap-3 rounded-2xl border border-surface-100 p-4 text-left transition-all hover:shadow-sm dark:border-surface-700 ${mt.soft}`}>
                  <Icon size={20} className={`shrink-0 ${mt.text}`} />
                  <span className="min-w-0">
                    <span className={`block text-sm font-bold ${mt.text}`}>{mt.label}</span>
                    <span className="block truncate text-[11px] font-medium text-surface-500 dark:text-surface-400">{formatSummary(mt.value)}</span>
                  </span>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto p-5">
            <InputField label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={isTypingCards ? `Flashcards — ${topic.name}` : isTypingChecklist ? `Revision Checklist — ${topic.name}` : 'Give this material a clear title…'} />

            <div className="flex gap-2">
              {type === 'flashcard' && (
                <Button variant={null} size={null} onClick={() => setSource('cards')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 text-sm font-bold transition-colors ${source === 'cards' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>
                  <Pencil size={15} /> Type cards
                </Button>
              )}
              {type === 'revision_checklist' && (
                <Button variant={null} size={null} onClick={() => setSource('cards')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 text-sm font-bold transition-colors ${source === 'cards' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>
                  <Pencil size={15} /> Type checklist
                </Button>
              )}
              <Button variant={null} size={null} onClick={() => setSource('file')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 text-sm font-bold transition-colors ${source === 'file' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>
                <Upload size={15} /> Upload file
              </Button>
              <Button variant={null} size={null} onClick={() => setSource('link')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2 text-sm font-bold transition-colors ${source === 'link' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-surface-200 text-surface-500 dark:border-surface-700'}`}>
                <Link2 size={15} /> Paste link
              </Button>
            </div>

            {type === 'ppt' && (
              <Button variant={null} size={null}
                type="button"
                onClick={onOpenPptStudio}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-900/10 dark:text-rose-300"
              >
                <Presentation size={15} /> Build it in PPT Studio instead
              </Button>
            )}

            {source === 'cards' && type === 'flashcard' ? (
              <FlashcardEditor cards={cards} onChange={setCards} />
            ) : source === 'cards' && type === 'revision_checklist' ? (
              <ChecklistEditor rows={checklistRows} onChange={setChecklistRows} />
            ) : source === 'link' ? (
              <InputField label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (PDF, Drive, YouTube, etc.)" />
            ) : file ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 rounded-2xl border-2 border-surface-200 p-3 dark:border-surface-700 ${cfg.soft}`}>
                  <cfg.icon size={20} className={cfg.text} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-surface-800 dark:text-surface-100">{file.name}</p>
                    <p className="text-xs text-surface-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant={null} size={null} onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="grid size-7 place-items-center rounded-lg bg-white/70 text-surface-400 hover:text-rose-500"><X size={14} /></Button>
                </div>
                {type === 'animation' && (
                  <video
                    src={URL.createObjectURL(file)}
                    controls
                    className="w-full rounded-2xl border border-surface-200 bg-black dark:border-surface-700"
                    style={{ maxHeight: '200px' }}
                  />
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) stageFile(f); }}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${dragging ? 'border-brand-400 bg-brand-50' : 'border-surface-200 hover:border-brand-300 hover:bg-surface-50 dark:border-surface-700'}`}
              >
                <div className={`mx-auto mb-3 grid size-12 place-items-center rounded-2xl ${cfg.soft}`}><Upload size={22} className={cfg.text} /></div>
                <p className="text-sm font-bold text-surface-600 dark:text-surface-300">
                  {type === 'animation' ? 'Drop video or ' : 'Drop file or '}<span className="text-brand-600">browse</span>
                </p>
                <p className="mt-1 text-xs text-surface-400">
                  {guide.formats} · max {MAX_UPLOAD_MB} MB
                </p>
                <input ref={fileRef} type="file" className="hidden"
                  accept={acceptAttribute(guide)}
                  onChange={(e) => { if (e.target.files?.[0]) stageFile(e.target.files[0]); }} />
              </div>
            )}

            <UploadGuidePanel
              label={cfg.label}
              formats={source === 'file' ? `${guide.formats} · max ${MAX_UPLOAD_MB} MB` : undefined}
              tips={isTypingCards ? TYPED_CARD_TIPS : isTypingChecklist ? TYPED_CHECKLIST_TIPS : source === 'link' ? LINK_TIPS : guide.tips}
            />

            <Button className="w-full justify-center" onClick={save} disabled={busy}>
              {busy
                ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {source === 'file' ? 'Uploading…' : 'Saving…'}</span>
                : isTypingCards ? 'Save Flashcards' : isTypingChecklist ? 'Save Checklist' : source === 'file' ? 'Upload & Save' : 'Save Link'}
            </Button>
          </div>
        )}
      
  </DialogContent>
</Dialog>
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

function csvField(value: string): string {
  const v = String(value ?? '');
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Turns the AI's chapter/topics read-out into the same two-column CSV the
 * textarea already understands, so a scanned index page reuses every bit of
 * the existing preview/edit/import flow instead of a parallel code path. */
function csvFromScannedChapters(chapters: Array<{ chapter: string; topics: string[] }>): string {
  const lines = ['Chapter,Topic'];
  for (const ch of chapters) {
    lines.push(`${csvField(ch.chapter)},${csvField((ch.topics || []).join(', '))}`);
  }
  return lines.join('\n');
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
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

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

  const onScanImage = async (f: File) => {
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append('image', f);
      // The shared axios instance defaults every request to Content-Type:
      // application/json, which — left in place — stops the browser from
      // setting the multipart boundary header a FormData body needs; the
      // server then sees no file. Same fix as uploadMaterialFile() in
      // lib/api/school-content.ts.
      const res = await api.post('/topics/bulk-import/parse-image', fd, {
        transformRequest: [(data: any, headers: any) => {
          delete headers['Content-Type'];
          return data;
        }],
      });
      const data = res.data?.data || res.data || {};
      const chapters: Array<{ chapter: string; topics: string[] }> = data.chapters || [];
      if (!chapters.length) {
        toast.warning(data.warning || 'Could not read a chapter/topic structure from that image — try a clearer, flatter photo of the index page.');
        return;
      }
      setText(csvFromScannedChapters(chapters));
      const topicCount = chapters.reduce((n, c) => n + (c.topics?.length || 0), 0);
      toast.success(`Read ${chapters.length} chapter(s), ${topicCount} topic(s) from the image — review below before importing.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not scan that image. Please try again or enter manually.');
    } finally {
      setScanning(false);
    }
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
            Upload a CSV, type two columns — <b>Chapter</b>, <b>Topic</b> — or scan a photo of the
            book's index page and let AI fill it in. Existing names are reused, not duplicated.
          </p>
          <Button size="sm" variant="ghost" onClick={downloadTemplate}>
<Download size={15} />Template</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) void onFile(e.target.files[0]); e.target.value = ''; }} />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
<FileSpreadsheet size={15} />Upload CSV</Button>
          <input ref={imageRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) void onScanImage(e.target.files[0]); e.target.value = ''; }} />
          <Button size="sm" variant="outline" disabled={scanning} onClick={() => imageRef.current?.click()}>
            {scanning ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
            {scanning ? 'Scanning…' : 'Scan Book Index'}
          </Button>
          {text && <Button size="sm" variant="ghost" onClick={() => setText('')}>
<X size={15} />Clear</Button>}
        </div>
        {scanning && (
          <p className="text-xs text-surface-400">
            Reading the chapter/topic structure from your photo — this can take up to ~20s.
          </p>
        )}

        <Textarea
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
