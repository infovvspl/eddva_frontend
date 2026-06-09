import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/SchoolAuthContext';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  Presentation,
  Search,
  Tag,
  Video,
  X,
} from 'lucide-react';

const materialTypes = [
  { label: 'All Types', value: 'ALL' },
  { label: 'Notes', value: 'notes' },
  { label: 'PDFs', value: 'pdf' },
  { label: 'PPTs', value: 'ppt' },
  { label: 'Videos', value: 'video' },
  { label: 'Assignments / DPP', value: 'dpp' },
  { label: 'Question Banks / PYQ', value: 'pyq' },
];

const SUBJECT_COLORS = {
  physics: { bg: '#3B82F6' },
  chemistry: { bg: '#10B981' },
  mathematics: { bg: '#F59E0B' },
  biology: { bg: '#8B5CF6' },
  maths: { bg: '#F59E0B' },
  math: { bg: '#F59E0B' },
  science: { bg: '#10B981' },
  english: { bg: '#EC4899' },
  history: { bg: '#7C3AED' },
  default: { bg: '#6366F1' },
};

const RESOURCE_META = {
  dpp: { label: 'DPP', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20' },
  pyq: { label: 'PYQ', icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200 dark:bg-violet-950/20' },
  pdf: { label: 'PDF Notes', icon: FileText, color: 'text-red-600', bg: 'bg-red-50 border-red-200 dark:bg-red-950/20' },
  notes: { label: 'Notes', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' },
  video: { label: 'Video Lecture', icon: Video, color: 'text-red-600', bg: 'bg-red-50 border-red-200 dark:bg-red-950/20' },
  ppt: { label: 'PPT Presentation', icon: Presentation, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200 dark:bg-teal-950/20' },
  mindmap: { label: 'Mindmap', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20' },
  default: { label: 'Material', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20' },
};

function getSubjectColor(name) {
  const key = (name || '').toLowerCase();
  return Object.entries(SUBJECT_COLORS).find(([k]) => key.includes(k))?.[1] ?? SUBJECT_COLORS.default;
}

function getResourceMeta(type, fileUrl = '') {
  const t = (type || '').toLowerCase();
  const url = (fileUrl || '').toLowerCase();

  if (t.includes('video') || url.endsWith('.mp4') || url.endsWith('.mkv')) return RESOURCE_META.video;
  if (t.includes('ppt') || t.includes('presentation') || url.endsWith('.ppt') || url.endsWith('.pptx')) return RESOURCE_META.ppt;
  if (t.includes('pdf') || url.endsWith('.pdf')) return RESOURCE_META.pdf;
  if (t.includes('assignment') || t.includes('dpp')) return RESOURCE_META.dpp;
  if (t.includes('pyq') || t.includes('question_bank') || t.includes('formula_sheet')) return RESOURCE_META.pyq;
  if (t.includes('mindmap')) return RESOURCE_META.mindmap;
  if (t.includes('notes')) return RESOURCE_META.notes;
  return RESOURCE_META.default;
}

function materialMatchesType(material, selectedType) {
  if (selectedType === 'ALL') return true;
  const typeStr = (material.fileType || material.type || '').toLowerCase();
  const fileUrlLower = (material.fileUrl || '').toLowerCase();

  if (selectedType === 'pdf') return typeStr.includes('pdf') || typeStr.includes('notes') || fileUrlLower.endsWith('.pdf');
  if (selectedType === 'notes') return typeStr.includes('notes');
  if (selectedType === 'ppt') return typeStr.includes('ppt') || typeStr.includes('presentation') || fileUrlLower.endsWith('.ppt') || fileUrlLower.endsWith('.pptx');
  if (selectedType === 'video') return typeStr.includes('video') || typeStr.includes('mp4') || fileUrlLower.endsWith('.mp4');
  if (selectedType === 'dpp') return typeStr.includes('dpp') || typeStr.includes('assignment');
  if (selectedType === 'pyq') return typeStr.includes('pyq') || typeStr.includes('question_bank') || typeStr.includes('formula_sheet');
  return typeStr.includes(selectedType);
}

function groupMaterials(materials) {
  const tree = {};

  materials.forEach((m) => {
    const subject = m.subjectName || m.subjectId || 'Other Subjects';
    const chapter = m.chapterName || m.fileName || 'General Chapters';
    const topic = m.topicName || 'General Topics';

    if (!tree[subject]) tree[subject] = {};
    if (!tree[subject][chapter]) tree[subject][chapter] = {};
    if (!tree[subject][chapter][topic]) tree[subject][chapter][topic] = [];
    tree[subject][chapter][topic].push(m);
  });

  return tree;
}

function countSubject(chapters) {
  const chapterNames = Object.keys(chapters);
  let topics = 0;
  let materials = 0;

  chapterNames.forEach((chapterName) => {
    const topicNames = Object.keys(chapters[chapterName]);
    topics += topicNames.length;
    topicNames.forEach((topicName) => {
      materials += chapters[chapterName][topicName].length;
    });
  });

  return { chapters: chapterNames.length, topics, materials };
}

export default function StudyMaterials() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedType, setSelectedType] = useState('ALL');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [viewerMaterial, setViewerMaterial] = useState(null);

  const profile = user?.studentProfile || user?.profile || {};
  const className = profile.className || profile.class || user?.className || 'Class 10';
  const sectionName = profile.sectionName || profile.section || user?.sectionName || 'A';

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const [materialsRes, recordingsRes] = await Promise.all([
          api.get('/materials', {
            params: { _ts: Date.now() },
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          }),
          api.get('/classes/recordings', {
            params: { _ts: Date.now() },
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          }),
        ]);
        setMaterials(unwrapSchoolList(materialsRes));
        setRecordings(unwrapSchoolList(recordingsRes));
      } catch (error) {
        console.error('Failed to fetch study resources:', error);
        setMaterials([]);
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const recordedLectureMaterials = useMemo(() => (
    recordings.map((recording) => ({
      id: `recording-${recording.id}`,
      recordingId: recording.id,
      title: recording.title,
      type: 'recorded_class',
      fileType: 'video',
      fileUrl: recording.video_url || null,
      subjectName: recording.subject_name || 'Other Subjects',
      chapterName: recording.chapter_name || 'General Chapters',
      topicName: recording.topic_name || 'General Topics',
      uploaded_by_name: recording.teacher_name || 'Teacher',
      createdAt: recording.created_at || recording.recorded_date || null,
      description: recording.description || null,
      transcriptStatus: recording.transcript_status || null,
      notesStatus: recording.notes_status || null,
      isRecordedClass: true,
    }))
  ), [recordings]);

  const allMaterials = useMemo(
    () => [...materials, ...recordedLectureMaterials],
    [materials, recordedLectureMaterials],
  );

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allMaterials.filter((m) => {
      const haystack = [
        m.title,
        m.subjectName || m.subjectId,
        m.chapterName || m.fileName,
        m.topicName,
        m.fileType || m.type,
      ].filter(Boolean).join(' ').toLowerCase();

      return (!q || haystack.includes(q)) && materialMatchesType(m, selectedType);
    });
  }, [allMaterials, searchQuery, selectedType]);

  const groupedTree = useMemo(() => groupMaterials(filteredMaterials), [filteredMaterials]);
  const subjectNames = Object.keys(groupedTree).sort();
  const activeChapters = selectedSubject ? groupedTree[selectedSubject] || {} : {};
  const totalCount = allMaterials.length;

  useEffect(() => {
    if (!selectedSubject) return;
    const chapters = groupedTree[selectedSubject] || {};
    const next = {};
    Object.keys(chapters).forEach((chapterName) => {
      next[chapterName] = true;
    });
    setExpandedChapters(next);
  }, [groupedTree, selectedSubject]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
  };

  const openMaterial = (material) => {
    if (material.isRecordedClass && material.recordingId) {
      navigate(`/school/student/recorded-classes/${material.recordingId}`);
      return;
    }
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
      return;
    }
    setViewerMaterial(material);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-lg md:p-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-white/90 backdrop-blur-sm">
              Study Materials
            </span>
            <h1 className="mt-3 font-display text-2xl font-black text-white md:text-3xl">
              Your Learning Resource Hub
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-white/90">
              Select a subject first, then browse chapters, topics, and resources.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 shadow-inner backdrop-blur-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200/80">Assigned Class</p>
                <p className="text-sm font-black text-white">{className} - Section {sectionName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 shadow-inner backdrop-blur-md">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200/80">Total Materials</p>
                <p className="text-sm font-black text-white">{totalCount} Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-[1fr_260px_auto] md:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                placeholder={selectedSubject ? `Search in ${selectedSubject}...` : 'Search subjects or resources...'}
                type="text"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {materialTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedType !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400"
              type="button"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {!selectedSubject ? (
        subjectNames.length === 0 ? (
          <EmptyMaterials className={className} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjectNames.map((subjectName) => {
              const stats = countSubject(groupedTree[subjectName]);
              const subColor = getSubjectColor(subjectName);

              return (
                <button
                  key={subjectName}
                  type="button"
                  onClick={() => setSelectedSubject(subjectName)}
                  className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm" style={{ background: subColor.bg }}>
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300">
                      View
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>

                  <div>
                    <h3 className="mt-5 text-lg font-black dark:text-white" style={{ color: subColor.bg }}>
                      {subjectName}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>{stats.chapters} chapters</span>
                      <span className="text-slate-300">|</span>
                      <span>{stats.topics} topics</span>
                      <span className="text-slate-300">|</span>
                      <span>{stats.materials} materials</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setSelectedSubject(null)}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Subjects
            </button>
            <div className="min-w-0 sm:text-right">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Selected Subject</p>
              <h2 className="truncate text-lg font-black text-slate-900 dark:text-white">{selectedSubject}</h2>
            </div>
          </div>

          {Object.keys(activeChapters).length === 0 ? (
            <EmptyMaterials className={className} />
          ) : (
            Object.keys(activeChapters).sort().map((chapterName) => {
              const topics = activeChapters[chapterName];
              const topicNames = Object.keys(topics).sort();
              const materialCount = topicNames.reduce((sum, topicName) => sum + topics[topicName].length, 0);
              const isOpen = expandedChapters[chapterName] ?? true;

              return (
                <div key={chapterName} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setExpandedChapters((prev) => ({ ...prev, [chapterName]: !isOpen }))}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      <BookOpen className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">{chapterName}</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-400">
                        {topicNames.length} topics | {materialCount} resources
                      </p>
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                          {topicNames.map((topicName) => (
                            <TopicBlock
                              key={topicName}
                              topicName={topicName}
                              materials={topics[topicName]}
                              onView={openMaterial}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      )}

      {viewerMaterial && (
        <MaterialViewer material={viewerMaterial} onClose={() => setViewerMaterial(null)} />
      )}
    </div>
  );
}

function TopicBlock({ topicName, materials, onView }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
          <Tag className="h-4 w-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900 dark:text-white">{topicName}</p>
          <p className="text-xs font-bold text-slate-400">{materials.length} files available</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {materials.map((m) => {
          const meta = getResourceMeta(m.fileType, m.fileUrl);
          const TypeIcon = meta.icon;
          const actionLabel = m.isRecordedClass ? 'Open Class' : 'View';
          const statusText = m.isRecordedClass
            ? [
                m.notesStatus === 'done' ? 'AI notes ready' : null,
                m.transcriptStatus === 'done' ? 'Transcript ready' : null,
              ].filter(Boolean).join(' · ')
            : null;

          return (
            <div key={m.id} className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.bg} ${meta.color}`}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{m.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <span className={`font-black uppercase ${meta.color}`}>{meta.label}</span>
                  <span>|</span>
                  <span>{m.uploaded_by_name || 'Teacher'}</span>
                  <span>|</span>
                  <span>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}</span>
                  {statusText && (
                    <>
                      <span>|</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{statusText}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onView(m)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyMaterials({ className }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 py-16 text-center dark:border-slate-800 dark:bg-slate-950/30">
      <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
      <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">No materials found</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        We could not find any study materials matching your current view for {className}.
      </p>
    </div>
  );
}

function MaterialViewer({ material, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-slate-900 dark:text-white">{material.title}</h2>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-blue-600">
              {material.fileType || material.type || 'Material'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {material.description ? (
            <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
              {material.description}
            </pre>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700">
              No preview content is available for this material.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
