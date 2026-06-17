import React, { useEffect, useMemo, useState } from 'react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { AnimatePresence, motion } from 'framer-motion';
import { MindMapCanvas } from '@/components/school/MindMapVisualizer';
import { useAuth } from '@/context/SchoolAuthContext';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import { mindmapMarkdownToTree } from '@/lib/mindmap-markdown';
import FlashcardViewer from '@/components/resources/FlashcardViewer';
import ResourceViewerModal from '@/components/resources/ResourceViewerModal';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Network,
  Presentation,
  Search,
  Tag,
  X,
  PlayCircle,
  Layers,
  Sparkles,
  ArrowRight,
  BookMarked,
  Library,
  ScrollText,
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
  physics:     { from: '#3B82F6', to: '#6366F1', light: '#EFF6FF', text: '#1D4ED8' },
  chemistry:   { from: '#10B981', to: '#059669', light: '#ECFDF5', text: '#047857' },
  mathematics: { from: '#F59E0B', to: '#D97706', light: '#FFFBEB', text: '#B45309' },
  biology:     { from: '#8B5CF6', to: '#7C3AED', light: '#F5F3FF', text: '#6D28D9' },
  maths:       { from: '#F59E0B', to: '#D97706', light: '#FFFBEB', text: '#B45309' },
  math:        { from: '#F59E0B', to: '#D97706', light: '#FFFBEB', text: '#B45309' },
  science:     { from: '#10B981', to: '#059669', light: '#ECFDF5', text: '#047857' },
  english:     { from: '#EC4899', to: '#DB2777', light: '#FDF2F8', text: '#9D174D' },
  history:     { from: '#7C3AED', to: '#6D28D9', light: '#F5F3FF', text: '#5B21B6' },
  hindi:       { from: '#F97316', to: '#EA580C', light: '#FFF7ED', text: '#C2410C' },
  default:     { from: '#6366F1', to: '#4F46E5', light: '#EEF2FF', text: '#4338CA' },
};

// Each entry adds gradient colors used for the card accent bar and icon background
const RESOURCE_META = {
  video:    { label: 'Video Lecture',      icon: PlayCircle,    color: 'text-rose-600',    bg: 'bg-rose-50',     ring: 'ring-rose-200',    dot: 'bg-rose-500',    grad: 'from-rose-500 to-pink-500',    cardBorder: 'border-l-rose-400',    cardBg: 'bg-rose-50/40' },
  ppt:      { label: 'Slides',             icon: Presentation,  color: 'text-teal-600',    bg: 'bg-teal-50',     ring: 'ring-teal-200',    dot: 'bg-teal-500',    grad: 'from-teal-500 to-cyan-500',    cardBorder: 'border-l-teal-400',    cardBg: 'bg-teal-50/40' },
  pdf:      { label: 'PDF',               icon: FileText,      color: 'text-red-600',     bg: 'bg-red-50',      ring: 'ring-red-200',     dot: 'bg-red-500',     grad: 'from-red-500 to-orange-500',   cardBorder: 'border-l-red-400',     cardBg: 'bg-red-50/40' },
  notes:    { label: 'Notes',             icon: ScrollText,    color: 'text-blue-600',    bg: 'bg-blue-50',     ring: 'ring-blue-200',    dot: 'bg-blue-500',    grad: 'from-blue-500 to-indigo-500',  cardBorder: 'border-l-blue-400',    cardBg: 'bg-blue-50/40' },
  faq:      { label: 'FAQ',               icon: HelpCircle,    color: 'text-cyan-600',    bg: 'bg-cyan-50',     ring: 'ring-cyan-200',    dot: 'bg-cyan-500',    grad: 'from-cyan-500 to-sky-500',     cardBorder: 'border-l-cyan-400',    cardBg: 'bg-cyan-50/40' },
  checklist:{ label: 'Revision Checklist',icon: ListChecks,    color: 'text-amber-600',   bg: 'bg-amber-50',    ring: 'ring-amber-200',   dot: 'bg-amber-500',   grad: 'from-amber-500 to-yellow-500', cardBorder: 'border-l-amber-400',   cardBg: 'bg-amber-50/40' },
  keyconcept:{ label: 'Key Concepts',     icon: Lightbulb,     color: 'text-violet-600',  bg: 'bg-violet-50',   ring: 'ring-violet-200',  dot: 'bg-violet-500',  grad: 'from-violet-500 to-purple-500',cardBorder: 'border-l-violet-400',  cardBg: 'bg-violet-50/40' },
  studyguide:{ label: 'Study Guide',      icon: BookMarked,    color: 'text-emerald-600', bg: 'bg-emerald-50',  ring: 'ring-emerald-200', dot: 'bg-emerald-500', grad: 'from-emerald-500 to-green-500',cardBorder: 'border-l-emerald-400', cardBg: 'bg-emerald-50/40' },
  flashcard:{ label: 'Flashcards',        icon: Layers,        color: 'text-indigo-600',  bg: 'bg-indigo-50',   ring: 'ring-indigo-200',  dot: 'bg-indigo-500',  grad: 'from-indigo-500 to-blue-500',  cardBorder: 'border-l-indigo-400',  cardBg: 'bg-indigo-50/40' },
  mindmap:  { label: 'Mind Map',          icon: Network,       color: 'text-green-600',   bg: 'bg-green-50',    ring: 'ring-green-200',   dot: 'bg-green-500',   grad: 'from-green-500 to-teal-500',   cardBorder: 'border-l-green-400',   cardBg: 'bg-green-50/40' },
  dpp:      { label: 'DPP',               icon: ClipboardList, color: 'text-orange-600',  bg: 'bg-orange-50',   ring: 'ring-orange-200',  dot: 'bg-orange-500',  grad: 'from-orange-500 to-amber-500', cardBorder: 'border-l-orange-400',  cardBg: 'bg-orange-50/40' },
  pyq:      { label: 'PYQ',               icon: ClipboardList, color: 'text-purple-600',  bg: 'bg-purple-50',   ring: 'ring-purple-200',  dot: 'bg-purple-500',  grad: 'from-purple-500 to-violet-500',cardBorder: 'border-l-purple-400',  cardBg: 'bg-purple-50/40' },
  default:  { label: 'Material',          icon: FileText,      color: 'text-slate-600',   bg: 'bg-slate-50',    ring: 'ring-slate-200',   dot: 'bg-slate-400',   grad: 'from-slate-400 to-slate-500',  cardBorder: 'border-l-slate-300',   cardBg: 'bg-slate-50/40' },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanLabel(value) {
  const label = String(value || '').trim();
  if (!label || UUID_PATTERN.test(label)) return '';
  return label;
}

function normalizeSubjectName(value) {
  const raw = cleanLabel(value);
  if (!raw) return '';
  const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['math', 'maths', 'mathematics'].includes(compact)) return 'Math';
  if (compact === 'english') return 'English';
  if (compact === 'science') return 'Science';
  if (compact === 'history') return 'History';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function getMaterialSubjectName(material) {
  const rawSubject = cleanLabel(material.subjectName) ||
    cleanLabel(material.subject_name) ||
    cleanLabel(material.subject);
  if (!rawSubject) return 'Other Subjects';
  return normalizeSubjectName(rawSubject) || 'Other Subjects';
}

function getSubjectColor(name) {
  const key = (name || '').toLowerCase();
  return Object.entries(SUBJECT_COLORS).find(([k]) => key.includes(k))?.[1] ?? SUBJECT_COLORS.default;
}

function getResourceMeta(type, fileUrl = '', title = '') {
  const t = (type || '').toLowerCase();
  const url = (fileUrl || '').toLowerCase();
  const ttl = (title || '').toLowerCase();

  // File-type signals first
  if (t.includes('video') || url.endsWith('.mp4') || url.endsWith('.mkv') || url.endsWith('.webm')) return RESOURCE_META.video;
  if (t.includes('ppt') || t.includes('presentation') || url.endsWith('.ppt') || url.endsWith('.pptx')) return RESOURCE_META.ppt;
  if (t.includes('pdf') || t.includes('ebook') || url.endsWith('.pdf')) return RESOURCE_META.pdf;
  if (t.includes('assignment') || t.includes('dpp')) return RESOURCE_META.dpp;
  if (t.includes('pyq') || t.includes('question_bank') || t.includes('formula_sheet')) return RESOURCE_META.pyq;
  if (t.includes('mindmap') || t.includes('mind_map') || ttl.includes('mindmap') || ttl.includes('mind map')) return RESOURCE_META.mindmap;
  if (t.includes('flashcard') || ttl.includes('flashcard')) return RESOURCE_META.flashcard;

  // Detect by title keywords (for generic "notes" / "material" fileType entries)
  if (ttl.includes('faq') || ttl.includes('frequently asked')) return RESOURCE_META.faq;
  if (ttl.includes('revision checklist') || ttl.includes('checklist') || ttl.includes('revision list')) return RESOURCE_META.checklist;
  if (ttl.includes('key concept') || ttl.includes('key concepts') || ttl.includes('important concept')) return RESOURCE_META.keyconcept;
  if (ttl.includes('study guide') || ttl.includes('studyguide') || ttl.includes('learning guide')) return RESOURCE_META.studyguide;

  if (t.includes('notes') || ttl.includes('notes')) return RESOURCE_META.notes;
  return RESOURCE_META.default;
}

// Defines display order within each category section
const MATERIAL_TYPE_ORDER = {
  ppt:        1,   // Slides
  studyguide: 2,   // Study Guide
  checklist:  3,   // Revision Checklist
  keyconcept: 4,   // Key Concepts
  flashcard:  5,   // Flashcards
  mindmap:    6,   // Mind Map
  faq:        7,   // FAQ
  notes:      8,   // Notes
  pdf:        9,   // PDF / Ebook
  pyq:        10,  // PYQ Practice
  dpp:        11,  // DPP / Daily Assessment
  video:      12,
  default:    99,
};

function getMaterialSortOrder(m) {
  const meta = getResourceMeta(m.fileType, m.fileUrl, m.title);
  const key = Object.keys(RESOURCE_META).find((k) => RESOURCE_META[k] === meta) || 'default';
  return MATERIAL_TYPE_ORDER[key] ?? 99;
}

const CATEGORY_ORDER = ['video', 'material', 'practice'];
const CATEGORY_META = {
  video:    { label: 'Video Lectures',         icon: PlayCircle,   accent: 'text-rose-500',   bg: 'bg-rose-50' },
  material: { label: 'Study Materials',         icon: FileText,     accent: 'text-blue-500',   bg: 'bg-blue-50' },
  practice: { label: 'Practice & Assignments',  icon: ClipboardList,accent: 'text-violet-500', bg: 'bg-violet-50' },
};

function getMaterialCategory(m) {
  if (m?.isRecordedClass) return 'video';
  const t = (m?.fileType || m?.type || '').toLowerCase();
  const url = (m?.fileUrl || '').toLowerCase();
  if (t.includes('video') || url.endsWith('.mp4') || url.endsWith('.mkv') || url.endsWith('.webm')) return 'video';
  if (t.includes('dpp') || t.includes('assignment') || t.includes('pyq') || t.includes('question_bank')) return 'practice';
  return 'material';
}

function materialMatchesType(material, selectedType) {
  if (selectedType === 'ALL') return true;
  const typeStr = (material.fileType || material.type || '').toLowerCase();
  const fileUrlLower = (material.fileUrl || '').toLowerCase();
  if (selectedType === 'pdf') return typeStr.includes('pdf') || typeStr.includes('notes') || typeStr.includes('ebook') || fileUrlLower.endsWith('.pdf');
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
    const subject = getMaterialSubjectName(m);
    const chapter = m.chapterName || m.fileName || 'General Chapters';
    const topic = m.topicName || 'General Topics';
    if (!tree[subject]) tree[subject] = {};
    if (!tree[subject][chapter]) tree[subject][chapter] = {};
    if (!tree[subject][chapter][topic]) tree[subject][chapter][topic] = [];
    tree[subject][chapter][topic].push(m);
  });
  return tree;
}

function groupCurriculum(curriculum, searchQuery = '') {
  const q = searchQuery.toLowerCase().trim();
  const tree = {};

  curriculum.forEach((subject) => {
    const subjectName = normalizeSubjectName(subject.name || subject.subjectName || subject.subject || '');
    if (!subjectName) return;

    (subject.chapters || []).forEach((chapter) => {
      const chapterName = cleanLabel(chapter.name || chapter.chapterName || chapter.chapter) || 'General Chapters';
      const topicList = Array.isArray(chapter.topics) ? chapter.topics : [];
      const matchingTopics = topicList.filter((topic) => {
        if (!q) return true;
        const haystack = [subjectName, chapterName, topic.name, topic.topicName].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
      const chapterMatches = q && [subjectName, chapterName].join(' ').toLowerCase().includes(q);
      if (q && !chapterMatches && matchingTopics.length === 0) return;

      if (!tree[subjectName]) tree[subjectName] = {};
      if (!tree[subjectName][chapterName]) tree[subjectName][chapterName] = {};

      matchingTopics.forEach((topic) => {
        const topicName = cleanLabel(topic.name || topic.topicName || topic.title) || 'General Topics';
        if (!tree[subjectName][chapterName][topicName]) tree[subjectName][chapterName][topicName] = [];
      });
    });
  });

  return tree;
}

function mergeTrees(baseTree, materialTree) {
  const merged = {};
  [baseTree, materialTree].forEach((tree) => {
    Object.entries(tree || {}).forEach(([subjectName, chapters]) => {
      if (!merged[subjectName]) merged[subjectName] = {};
      Object.entries(chapters || {}).forEach(([chapterName, topics]) => {
        if (!merged[subjectName][chapterName]) merged[subjectName][chapterName] = {};
        Object.entries(topics || {}).forEach(([topicName, materials]) => {
          const existing = merged[subjectName][chapterName][topicName] || [];
          merged[subjectName][chapterName][topicName] = [...existing, ...(Array.isArray(materials) ? materials : [])];
        });
      });
    });
  });
  return merged;
}

function countSubject(chapters) {
  const chapterNames = Object.keys(chapters);
  let topics = 0; let materials = 0;
  chapterNames.forEach((ch) => {
    const topicNames = Object.keys(chapters[ch]);
    topics += topicNames.length;
    topicNames.forEach((t) => { materials += chapters[ch][t].length; });
  });
  return { chapters: chapterNames.length, topics, materials };
}

function labelFromKey(key = '') {
  return String(key).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (c) => c.toUpperCase());
}

function tryParseJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || !/^[\[{]/.test(trimmed)) return value;
  try { return JSON.parse(trimmed); } catch { return value; }
}

function valueToMarkdown(value, key = '', depth = 0) {
  const parsed = tryParseJson(value);
  const heading = '#'.repeat(Math.min(depth + 3, 6));
  if (parsed == null || parsed === '') return '';
  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') return String(parsed);
  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const title = item.title || item.name || item.term || item.concept || item.question || `${labelFromKey(key) || 'Item'} ${index + 1}`;
        const body = Object.entries(item)
          .filter(([k]) => !['title', 'name', 'term', 'concept', 'question', 'id', 'type'].includes(k))
          .map(([k, v]) => { const text = valueToMarkdown(v, k, depth + 1); return text ? `- **${labelFromKey(k)}:** ${text.replace(/\n/g, '\n  ')}` : ''; })
          .filter(Boolean).join('\n');
        return `${index + 1}. ${title}${body ? `\n${body}` : ''}`;
      }
      return `- ${valueToMarkdown(item, key, depth + 1)}`;
    }).filter(Boolean).join('\n\n');
  }
  const directContent = parsed.markdown || parsed.content || parsed.text || parsed.notes || parsed.answer;
  if (directContent && Object.keys(parsed).length <= 3) return valueToMarkdown(directContent, key, depth);
  return Object.entries(parsed).map(([k, v]) => {
    const text = valueToMarkdown(v, k, depth + 1);
    if (!text) return '';
    if (Array.isArray(tryParseJson(v)) || (tryParseJson(v) && typeof tryParseJson(v) === 'object')) return `${heading} ${labelFromKey(k)}\n\n${text}`;
    return `- **${labelFromKey(k)}:** ${text}`;
  }).filter(Boolean).join('\n\n');
}

function materialDescriptionMarkdown(material) { return valueToMarkdown(material.description || ''); }
function isMindmapMaterial(material) { return String(material?.fileType || material?.type || '').toLowerCase().includes('mindmap'); }
function isPdfOrEbookMaterial(material) {
  const type = String(material?.fileType || material?.type || '').toLowerCase();
  const url = String(material?.fileUrl || '').toLowerCase();
  return type.includes('pdf') || type.includes('ebook') || url.endsWith('.pdf');
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudyMaterials() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [courses, setCourses] = useState([]);
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
        const [materialsRes, recordingsRes, coursesRes] = await Promise.all([
          api.get('/materials', { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }),
          api.get('/classes/recordings', { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }),
          api.get('/students/courses/my', { params: { _ts: Date.now() }, headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }),
        ]);
        setMaterials(unwrapSchoolList(materialsRes));
        setRecordings(unwrapSchoolList(recordingsRes));
        const courseData = unwrapSchoolData(coursesRes, {});
        setCourses(Array.isArray(courseData?.curriculum) ? courseData.curriculum : unwrapSchoolList(coursesRes));
      } catch { setMaterials([]); setRecordings([]); setCourses([]); }
      finally { setLoading(false); }
    };
    fetchMaterials();
  }, []);

  const recordedLectureMaterials = useMemo(() => recordings.map((r) => ({
    id: `recording-${r.id}`, recordingId: r.id, title: r.title,
    type: 'recorded_class', fileType: 'video', fileUrl: r.video_url || null,
    subjectName: r.subject_name || 'Other Subjects', chapterName: r.chapter_name || 'General Chapters',
    topicName: r.topic_name || 'General Topics', uploaded_by_name: r.teacher_name || 'Teacher',
    createdAt: r.created_at || r.recorded_date || null, description: r.description || null,
    transcriptStatus: r.transcript_status || null, notesStatus: r.notes_status || null,
    isRecordedClass: true,
  })), [recordings]);

  const allMaterials = useMemo(() => [...materials, ...recordedLectureMaterials], [materials, recordedLectureMaterials]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allMaterials.filter((m) => {
      const haystack = [m.title, getMaterialSubjectName(m), m.chapterName || m.fileName, m.topicName, m.fileType || m.type].filter(Boolean).join(' ').toLowerCase();
      return (!q || haystack.includes(q)) && materialMatchesType(m, selectedType);
    });
  }, [allMaterials, searchQuery, selectedType]);

  const materialTree = useMemo(() => groupMaterials(filteredMaterials), [filteredMaterials]);
  const curriculumTree = useMemo(() => groupCurriculum(courses, searchQuery), [courses, searchQuery]);
  const groupedTree = useMemo(() => mergeTrees(curriculumTree, materialTree), [curriculumTree, materialTree]);
  const allSubjectNames = useMemo(() => {
    const names = new Set();
    courses.forEach((c) => {
      const n = normalizeSubjectName(c.name || c.subjectName || c.subject);
      if (n) names.add(n);
      if (Array.isArray(c.subjects)) c.subjects.forEach((s) => { const subjectName = normalizeSubjectName(s); if (subjectName) names.add(subjectName); });
    });
    Object.keys(groupedTree).forEach((s) => names.add(s));
    return Array.from(names).sort();
  }, [courses, groupedTree]);

  const activeChapters = selectedSubject ? groupedTree[selectedSubject] || {} : {};
  const totalCount = allMaterials.length;

  useEffect(() => {
    if (!selectedSubject) return;
    const chapters = groupedTree[selectedSubject] || {};
    const next = {};
    Object.keys(chapters).forEach((ch) => { next[ch] = true; });
    setExpandedChapters(next);
  }, [groupedTree, selectedSubject]);

  const resetFilters = () => { setSearchQuery(''); setSelectedType('ALL'); };

  const openMaterial = (material, mode = 'auto') => {
    if (material.isRecordedClass && material.recordingId) { navigate(`/school/student/recorded-classes/${material.recordingId}`); return; }
    if (isPdfOrEbookMaterial(material) && material.fileUrl) { setViewerMaterial(material); return; }
    if (mode === 'view') { setViewerMaterial(material); return; }
    if (mode === 'open' || material.fileUrl) { window.open(material.fileUrl, '_blank'); return; }
    setViewerMaterial(material);
  };

  useEffect(() => {
    if (loading || allMaterials.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const openId = params.get('openMaterialId');
    if (openId) {
      const found = allMaterials.find((m) => String(m.id) === String(openId));
      if (found) { setSelectedSubject(getMaterialSubjectName(found)); openMaterial(found); }
    }
  }, [loading, allMaterials]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm font-semibold text-slate-400">Loading your resources…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 px-6 py-8 shadow-lg md:px-10">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white/90">
              <Library size={11} /> Study Materials
            </span>
            <h1 className="mt-3 text-2xl font-black text-white md:text-3xl">Your Learning Hub</h1>
            <p className="mt-1.5 max-w-md text-sm text-blue-100">
              {selectedSubject
                ? `Browsing ${selectedSubject} — select a chapter to explore topics`
                : 'Choose a subject below to explore chapters, topics, and resources'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatChip icon={<GraduationCap size={15} />} label="Class" value={`${className} · Sec ${sectionName}`} />
            <StatChip icon={<BookOpen size={15} />} label="Resources" value={`${totalCount} available`} />
          </div>
        </div>
      </div>

      {/* ── Filters bar ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white px-6 py-3 shadow-sm md:px-10">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder={selectedSubject ? `Search in ${selectedSubject}…` : 'Search…'}
            />
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            {materialTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {(searchQuery || selectedType !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
            >
              <X size={14} /> Clear
            </button>
          )}

          {/* Breadcrumb when subject selected */}
          {selectedSubject && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <button
                onClick={() => setSelectedSubject(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              >
                <ChevronRight size={14} className="rotate-180" /> Subjects
              </button>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="font-black text-slate-900">{selectedSubject}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-6 md:px-10">
        {!selectedSubject ? (
          allSubjectNames.length === 0 ? (
            <EmptyMaterials className={className} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {allSubjectNames.map((subjectName) => {
                const stats = countSubject(groupedTree[subjectName] || {});
                const col = getSubjectColor(subjectName);
                return (
                  <SubjectCard
                    key={subjectName}
                    name={subjectName}
                    stats={stats}
                    color={col}
                    onClick={() => setSelectedSubject(subjectName)}
                  />
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {Object.keys(activeChapters).length === 0 ? (
              <EmptyMaterials className={className} />
            ) : (
              Object.keys(activeChapters).sort().map((chapterName, ci) => {
                const topics = activeChapters[chapterName];
                const topicNames = Object.keys(topics).sort();
                const materialCount = topicNames.reduce((s, t) => s + topics[t].length, 0);
                const isOpen = expandedChapters[chapterName] ?? true;
                const col = getSubjectColor(selectedSubject);

                return (
                  <div key={chapterName} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Chapter header */}
                    <button
                      type="button"
                      onClick={() => setExpandedChapters((prev) => ({ ...prev, [chapterName]: !isOpen }))}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                    >
                      {/* Colored chapter index */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-black shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}
                      >
                        {ci + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">{chapterName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400">{topicNames.length} topic{topicNames.length !== 1 ? 's' : ''}</span>
                          <span className="text-slate-200">·</span>
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{ background: col.light, color: col.text }}
                          >
                            {materialCount} resource{materialCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      </motion.div>
                    </button>

                    {/* Topics list */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-2">
                            {topicNames.map((topicName) => (
                              <TopicBlock
                                key={topicName}
                                topicName={topicName}
                                materials={topics[topicName]}
                                onView={openMaterial}
                                subjectColor={col}
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
      </div>

      {viewerMaterial && (
        isPdfOrEbookMaterial(viewerMaterial) && viewerMaterial.fileUrl ? (
          <ResourceViewerModal
            title={viewerMaterial.title}
            fileUrl={viewerMaterial.fileUrl}
            type="pdf"
            topicId={viewerMaterial.topicId}
            resourceId={viewerMaterial.id}
            allowHighlights
            currentUserId={user?.id}
            onClose={() => setViewerMaterial(null)}
          />
        ) : (
          <MaterialViewer material={viewerMaterial} onClose={() => setViewerMaterial(null)} />
        )
      )}
    </div>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────

function SubjectCard({ name, stats, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-200"
    >
      {/* Top accent strip */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }} />

      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
          style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
        >
          <BookMarked size={20} className="text-white" />
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black transition group-hover:opacity-80"
          style={{ background: color.light, color: color.text }}
        >
          Open <ArrowRight size={12} />
        </span>
      </div>

      <h3 className="mt-4 text-lg font-black text-slate-900">{name}</h3>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Pill label={`${stats.chapters} ch`} color={color} />
        <Pill label={`${stats.topics} topics`} color={color} />
        <Pill label={`${stats.materials} files`} color={color} />
      </div>
    </button>
  );
}

function Pill({ label, color }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: color.light, color: color.text }}>
      {label}
    </span>
  );
}

function StatChip({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">{icon}</div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200">{label}</p>
        <p className="text-sm font-black text-white">{value}</p>
      </div>
    </div>
  );
}

// ─── Topic Block ──────────────────────────────────────────────────────────────

function TopicBlock({ topicName, materials, onView, subjectColor }) {
  const [open, setOpen] = useState(false);

  const sections = useMemo(() => {
    const buckets = {};
    materials.forEach((m) => { const cat = getMaterialCategory(m); (buckets[cat] ||= []).push(m); });
    Object.keys(buckets).forEach((cat) => {
      buckets[cat].sort((a, b) => getMaterialSortOrder(a) - getMaterialSortOrder(b));
    });
    return CATEGORY_ORDER.filter((cat) => buckets[cat]?.length).map((cat) => ({ cat, ...CATEGORY_META[cat], items: buckets[cat] }));
  }, [materials]);

  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-200 ${open ? 'border-blue-200 bg-white shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Topic icon */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${open ? 'bg-blue-600' : 'bg-slate-100'}`}>
          <Tag size={14} className={open ? 'text-white' : 'text-slate-400'} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">{topicName}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {materials.length} resource{materials.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Resource type pills */}
        <div className="hidden sm:flex items-center gap-1.5 mr-2">
          {sections.map(({ cat, accent, items }) => (
            <span key={cat} className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold ${accent}`}>
              {items.length}
            </span>
          ))}
        </div>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={16} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100">
              {sections.map(({ cat, label, icon: CatIcon, accent, bg, items }) => (
                <div key={cat}>
                  {/* Category header */}
                  <div className={`flex items-center gap-2 px-4 py-2 ${bg}`}>
                    <CatIcon size={13} className={accent} />
                    <span className={`text-[11px] font-black uppercase tracking-wider ${accent}`}>{label}</span>
                    <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500 shadow-sm">
                      {items.length}
                    </span>
                  </div>

                  {/* Material rows */}
                  <div className="divide-y divide-slate-50">
                    {items.map((m) => <MaterialRow key={m.id} m={m} onView={onView} />)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Material Row ─────────────────────────────────────────────────────────────

function hasInlineContent(m) {
  if (m.isRecordedClass) return false;
  const desc = m.description;
  if (!desc) return false;
  const str = typeof desc === 'string' ? desc.trim() : JSON.stringify(desc).trim();
  return str.length >= 10;
}

function MaterialRow({ m, onView }) {
  const meta = getResourceMeta(m.fileType, m.fileUrl, m.title);
  const TypeIcon = meta.icon;
  const isVideo = m.isRecordedClass;
  const hasAiNotes = isVideo && m.notesStatus === 'done';
  const canView = hasInlineContent(m);
  const canOpen = !!m.fileUrl;

  return (
    <div
      className={`group relative flex items-center gap-4 border-l-4 rounded-r-xl px-4 py-3.5 transition-all duration-150 hover:shadow-sm ${meta.cardBorder} ${meta.cardBg} hover:brightness-95`}
    >
      {/* Gradient icon block */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ${meta.grad}`}
      >
        <TypeIcon size={17} className="text-white" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900 leading-snug">{m.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Type pill */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${meta.bg} ${meta.color} border-current/20`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>

          {hasAiNotes && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <Sparkles size={9} /> AI Notes
            </span>
          )}
          {m.uploaded_by_name && (
            <span className="text-[11px] font-medium text-slate-400">{m.uploaded_by_name}</span>
          )}
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex shrink-0 items-center gap-2">
        {isVideo ? (
          <button
            type="button"
            onClick={() => onView(m)}
            className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br px-3.5 py-2 text-[11px] font-black text-white shadow-sm transition hover:opacity-90 ${meta.grad}`}
          >
            <PlayCircle size={12} /> Watch
          </button>
        ) : (
          <>
            {canView && (
              <button
                type="button"
                onClick={() => onView(m, 'view')}
                className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br px-3.5 py-2 text-[11px] font-black text-white shadow-sm transition hover:opacity-90 ${meta.grad}`}
              >
                <Eye size={12} /> View
              </button>
            )}
            {canOpen && (
              <button
                type="button"
                onClick={() => onView(m, 'open')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ExternalLink size={12} /> Open
              </button>
            )}
            {!canView && !canOpen && (
              <span className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-400">
                No preview
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyMaterials({ className }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <BookOpen size={28} className="text-slate-300" />
      </div>
      <h3 className="mt-5 text-base font-black text-slate-900">No materials found</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">
        No study materials are available for {className} yet. Check back soon.
      </p>
    </div>
  );
}

// ─── Material Viewer Modal ────────────────────────────────────────────────────

function MaterialViewer({ material, onClose }) {
  const previewContent = materialDescriptionMarkdown(material);
  const isMindmap = isMindmapMaterial(material);
  const mindmapTree = useMemo(() => (isMindmap && previewContent ? mindmapMarkdownToTree(previewContent, material.title) : null), [isMindmap, material.title, previewContent]);
  const canShowMindmap = !!mindmapTree?.children?.length;
  const isFlashcard = (material.fileType || material.type || '').toLowerCase().includes('flashcard') ||
    (material.title || '').toLowerCase().includes('flashcard') ||
    (!!previewContent && /^\s*\**\s*Q(?:uestion)?\s*\d*\s*[:.]/i.test(previewContent));

  const [viewMode, setViewMode] = useState(canShowMindmap ? 'mindmap' : 'text');
  useEffect(() => { setViewMode(canShowMindmap ? 'mindmap' : 'text'); }, [canShowMindmap, material.id]);

  const meta = getResourceMeta(material.fileType, material.fileUrl, material.title);
  const TypeIcon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${canShowMindmap && viewMode === 'mindmap' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {/* Modal header — gradient stripe */}
        <div className={`flex items-center gap-4 px-6 py-4 bg-gradient-to-r ${meta.grad} bg-opacity-10`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/30 backdrop-blur-sm shadow-sm">
            <TypeIcon size={20} className="text-white drop-shadow" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black text-white drop-shadow">{material.title}</h2>
            <p className="text-[11px] font-black uppercase tracking-wider text-white/80">{meta.label}</p>
          </div>
          <div className="flex items-center gap-2">
            {canShowMindmap && (
              <div className="flex rounded-xl border border-white/30 bg-white/20 p-0.5 backdrop-blur-sm">
                {['mindmap', 'text'].map((mode) => (
                  <button key={mode} type="button" onClick={() => setViewMode(mode)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${viewMode === mode ? 'bg-white text-slate-800' : 'text-white hover:bg-white/20'}`}>
                    {mode === 'mindmap' ? 'Mind Map' : 'Text'}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-auto p-6">
          {canShowMindmap && viewMode === 'mindmap' ? (
            <MindMapCanvas data={mindmapTree} height={560} />
          ) : previewContent ? (
            isFlashcard ? <FlashcardViewer content={previewContent} /> : (
              <MarkdownRenderer content={previewContent} className="prose-slate" />
            )
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-400">
              No preview content is available for this material.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
