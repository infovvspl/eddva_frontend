import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import api from '@/lib/api/school-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Folder,
  Layers,
  Presentation,
  Search,
  Tag,
  Video,
  X,
  GraduationCap,
  ExternalLink,
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
  physics:     { bg: "#3B82F6", text: "#fff", light: "bg-blue-50",   ring: "ring-blue-200" },
  chemistry:   { bg: "#10B981", text: "#fff", light: "bg-emerald-50", ring: "ring-emerald-200" },
  mathematics: { bg: "#F59E0B", text: "#fff", light: "bg-amber-50",   ring: "ring-amber-200" },
  biology:     { bg: "#8B5CF6", text: "#fff", light: "bg-violet-50",  ring: "ring-violet-200" },
  maths:       { bg: "#F59E0B", text: "#fff", light: "bg-amber-50",   ring: "ring-amber-200" },
  science:     { bg: "#10B981", text: "#fff", light: "bg-emerald-50", ring: "ring-emerald-200" },
  english:     { bg: "#EC4899", text: "#fff", light: "bg-pink-50",    ring: "ring-pink-200" },
  default:     { bg: "#6366F1", text: "#fff", light: "bg-indigo-50",  ring: "ring-indigo-200" },
};

function getSubjectColor(name) {
  const key = (name || '').toLowerCase();
  return (
    Object.entries(SUBJECT_COLORS).find(([k]) => key.includes(k))?.[1] ??
    SUBJECT_COLORS.default
  );
}

const RESOURCE_META = {
  dpp:     { label: "DPP",   icon: ClipboardList, color: "text-orange-600",  bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/20" },
  pyq:     { label: "PYQ",   icon: ClipboardList,        color: "text-violet-600",  bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/20" },
  pdf:     { label: "PDF Notes",      icon: Download,          color: "text-red-600",     bg: "bg-red-50 border-red-200 dark:bg-red-950/20" },
  notes:   { label: "Notes", icon: FileText,      color: "text-blue-600",    bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/20" },
  video:   { label: "Video Lecture", icon: Video,       color: "text-red-600",     bg: "bg-red-50 border-red-200 dark:bg-red-950/20" },
  ppt:     { label: "PPT Presentation", icon: Presentation,  color: "text-teal-600",    bg: "bg-teal-50 border-teal-200 dark:bg-teal-950/20" },
  link:    { label: "Reference Link",  icon: BookOpen,  color: "text-teal-600",    bg: "bg-teal-50 border-teal-200 dark:bg-teal-950/20" },
  default: { label: "Material", icon: FileText,      color: "text-indigo-600",  bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20" },
};

function getResourceMeta(type, fileUrl = '') {
  const t = (type || '').toLowerCase();
  const url = (fileUrl || '').toLowerCase();

  if (t.includes('video') || url.endsWith('.mp4') || url.endsWith('.mkv')) {
    return RESOURCE_META.video;
  }
  if (t.includes('ppt') || t.includes('presentation') || url.endsWith('.ppt') || url.endsWith('.pptx')) {
    return RESOURCE_META.ppt;
  }
  if (t.includes('pdf') || url.endsWith('.pdf')) {
    return RESOURCE_META.pdf;
  }
  if (t.includes('assignment') || t.includes('dpp')) {
    return RESOURCE_META.dpp;
  }
  if (t.includes('pyq') || t.includes('question_bank') || t.includes('formula_sheet')) {
    return RESOURCE_META.pyq;
  }
  if (t.includes('notes')) {
    return RESOURCE_META.notes;
  }
  return RESOURCE_META.default;
}

export default function StudyMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedChapter, setSelectedChapter] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Expanded Tree Nodes State
  const [expandedNodes, setExpandedNodes] = useState({});

  const profile = user?.studentProfile || user?.profile || {};
  const className = profile.className || profile.class || user?.className || 'Class 10';
  const sectionName = profile.sectionName || profile.section || user?.sectionName || 'A';

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await api.get('/school/materials');
        setMaterials(res.data?.data || res.data || []);
      } catch (error) {
        console.error('Failed to fetch study materials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // Compute filters list dynamically based on loaded materials
  const filterOptions = useMemo(() => {
    const subjects = new Set();
    const chapters = new Set();
    const topics = new Set();

    materials.forEach((m) => {
      const sub = m.subjectName || m.subjectId;
      const chap = m.chapterName || m.fileName;
      const top = m.topicName;

      if (sub) subjects.add(sub);
      
      // Cascading logic
      const matchSubject = selectedSubject === 'ALL' || sub === selectedSubject;
      if (matchSubject && chap) chapters.add(chap);

      const matchChapter = selectedChapter === 'ALL' || chap === selectedChapter;
      if (matchSubject && matchChapter && top) topics.add(top);
    });

    return {
      subjects: Array.from(subjects).sort(),
      chapters: Array.from(chapters).sort(),
      topics: Array.from(topics).sort(),
    };
  }, [materials, selectedSubject, selectedChapter]);

  // Handle Cascading Filter Resets
  const handleSubjectChange = (val) => {
    setSelectedSubject(val);
    setSelectedChapter('ALL');
    setSelectedTopic('ALL');
  };

  const handleChapterChange = (val) => {
    setSelectedChapter(val);
    setSelectedTopic('ALL');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('ALL');
    setSelectedChapter('ALL');
    setSelectedTopic('ALL');
    setSelectedType('ALL');
  };

  // Group materials into: Subject -> Chapter -> Topic -> list
  const filteredAndGroupedTree = useMemo(() => {
    let list = materials;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          (m.subjectName || m.subjectId)?.toLowerCase().includes(q) ||
          (m.chapterName || m.fileName)?.toLowerCase().includes(q) ||
          m.topicName?.toLowerCase().includes(q)
      );
    }

    // Dropdown filters
    if (selectedSubject !== 'ALL') {
      list = list.filter((m) => (m.subjectName || m.subjectId) === selectedSubject);
    }
    if (selectedChapter !== 'ALL') {
      list = list.filter((m) => (m.chapterName || m.fileName) === selectedChapter);
    }
    if (selectedTopic !== 'ALL') {
      list = list.filter((m) => m.topicName === selectedTopic);
    }
    if (selectedType !== 'ALL') {
      list = list.filter((m) => {
        const typeStr = (m.fileType || m.type || '').toLowerCase();
        const fileUrlLower = (m.fileUrl || '').toLowerCase();
        
        if (selectedType === 'pdf') {
          return typeStr.includes('pdf') || typeStr.includes('notes') || fileUrlLower.endsWith('.pdf');
        }
        if (selectedType === 'notes') {
          return typeStr.includes('notes');
        }
        if (selectedType === 'ppt') {
          return typeStr.includes('ppt') || typeStr.includes('presentation') || fileUrlLower.endsWith('.ppt') || fileUrlLower.endsWith('.pptx');
        }
        if (selectedType === 'video') {
          return typeStr.includes('video') || typeStr.includes('mp4') || fileUrlLower.endsWith('.mp4');
        }
        if (selectedType === 'dpp') {
          return typeStr.includes('dpp') || typeStr.includes('assignment');
        }
        if (selectedType === 'pyq') {
          return typeStr.includes('pyq') || typeStr.includes('question_bank') || typeStr.includes('formula_sheet');
        }
        return typeStr.includes(selectedType);
      });
    }

    // Build hierarchical object
    const tree = {};
    list.forEach((m) => {
      const sub = m.subjectName || m.subjectId || 'Other Subjects';
      const chap = m.chapterName || m.fileName || 'General Chapters';
      const top = m.topicName || 'General Topics';

      if (!tree[sub]) tree[sub] = {};
      if (!tree[sub][chap]) tree[sub][chap] = {};
      if (!tree[sub][chap][top]) tree[sub][chap][top] = [];
      tree[sub][chap][top].push(m);
    });

    return tree;
  }, [materials, searchQuery, selectedSubject, selectedChapter, selectedTopic, selectedType]);

  // Set default expanded states for all nodes in the tree
  useEffect(() => {
    if (materials.length > 0) {
      const initialExpanded = {};
      materials.forEach((m) => {
        const sub = m.subjectName || m.subjectId || 'Other Subjects';
        const chap = m.chapterName || m.fileName || 'General Chapters';
        initialExpanded[sub] = true;
        initialExpanded[`${sub}:${chap}`] = true;
      });
      setExpandedNodes(initialExpanded);
    }
  }, [materials]);

  const toggleNode = (nodeKey) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const subjectKeys = Object.keys(filteredAndGroupedTree);
  const totalCount = materials.length;

  return (
    <div className="space-y-6">
      {/* Header & Welcome Info */}
      <div className="rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-white/90 backdrop-blur-sm">
              Study Materials
            </span>
            <h1 className="mt-3 font-display text-2xl font-black md:text-3xl text-white">
              Your Learning Resource Hub 📚
            </h1>
            <p className="mt-2 text-white/90 font-medium text-sm max-w-xl">
              Access notes, videos, assignments, and reference materials curated by your teachers for your assigned class.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Class & Section Info */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-inner">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-white font-black">
                🏫
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200/80">Assigned Class</p>
                <p className="text-sm font-black text-white">{className} - Section {sectionName}</p>
              </div>
            </div>

            {/* Total materials count */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-inner">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-white font-black">
                📂
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200/80">Total Materials</p>
                <p className="text-sm font-black text-white">{totalCount} Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
          
          {/* Search Bar */}
          <div className="lg:col-span-1 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                placeholder="Search resources..."
                type="text"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="ALL">All Subjects</option>
              {filterOptions.subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Chapter</label>
            <select
              value={selectedChapter}
              onChange={(e) => handleChapterChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="ALL">All Chapters</option>
              {filterOptions.chapters.map((chap) => (
                <option key={chap} value={chap}>{chap}</option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="ALL">All Topics</option>
              {filterOptions.topics.map((top) => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>

          {/* Material Type Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Type</label>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                {materialTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {(searchQuery || selectedSubject !== 'ALL' || selectedChapter !== 'ALL' || selectedTopic !== 'ALL' || selectedType !== 'ALL') && (
                <button
                  onClick={resetFilters}
                  className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 transition"
                  title="Reset Filters"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Hierarchical Tree Container (Coaching My Courses Card Opening System Style) */}
      <div className="space-y-4">
        {subjectKeys.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 py-16 text-center dark:border-slate-800 dark:bg-slate-950/30">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">No materials found</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              We couldn't find any study materials matching your selected filters for Class {className}.
            </p>
            {(searchQuery || selectedSubject !== 'ALL' || selectedChapter !== 'ALL' || selectedTopic !== 'ALL' || selectedType !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white hover:bg-blue-700 transition"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          subjectKeys.map((subName) => {
            const isSubExpanded = !!expandedNodes[subName];
            const chapters = filteredAndGroupedTree[subName];
            const chapterKeys = Object.keys(chapters);
            
            // Compute counts and metrics
            const totalChaptersCount = chapterKeys.length;
            let totalTopicsCount = 0;
            let totalMaterialsCount = 0;
            chapterKeys.forEach(ch => {
              const topics = chapters[ch];
              const topicKeys = Object.keys(topics);
              totalTopicsCount += topicKeys.length;
              topicKeys.forEach(t => {
                totalMaterialsCount += topics[t].length;
              });
            });

            const subColor = getSubjectColor(subName);

            return (
              <div 
                key={subName} 
                className="mb-2"
              >
                {/* Subject Header Card */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all dark:bg-slate-900 dark:border-slate-800/80"
                  onClick={() => toggleNode(subName)}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: subColor.bg }}
                  >
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white" style={{ color: subColor.bg }}>
                      {subName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      <span className="font-medium">{totalChaptersCount} chapters</span>
                      <span>·</span>
                      <span className="font-medium">{totalTopicsCount} topics</span>
                      <span>·</span>
                      <span className="font-medium">{totalMaterialsCount} materials</span>
                    </div>
                  </div>

                  <motion.div animate={{ rotate: isSubExpanded ? 180 : 0 }} className="shrink-0">
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </button>

                {/* Chapters Area */}
                <AnimatePresence initial={false}>
                  {isSubExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pl-3 space-y-2">
                        {chapterKeys.map((chapName) => {
                          const chapKey = `${subName}:${chapName}`;
                          const isChapExpanded = !!expandedNodes[chapKey];
                          const topics = chapters[chapName];
                          const topicKeys = Object.keys(topics);

                          let chapterMaterialsCount = 0;
                          topicKeys.forEach(t => {
                            chapterMaterialsCount += topics[t].length;
                          });

                          return (
                            <div 
                              key={chapName} 
                              className="rounded-2xl overflow-hidden border border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800/50 transition-all shadow-sm"
                            >
                              {/* Chapter Accordion Header */}
                              <div className="flex items-stretch">
                                <button
                                  type="button"
                                  className="flex-1 min-w-0 flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                  onClick={() => toggleNode(chapKey)}
                                >
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 shrink-0">
                                    <BookOpen className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-1">{chapName}</p>
                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                      <span className="font-medium">{topicKeys.length} topics</span>
                                      <span>·</span>
                                      <span className="font-medium">{chapterMaterialsCount} resources</span>
                                    </div>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  aria-expanded={isChapExpanded}
                                  className="shrink-0 px-3 flex items-center border-l border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                  onClick={() => toggleNode(chapKey)}
                                >
                                  <motion.div animate={{ rotate: isChapExpanded ? 180 : 0 }}>
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                  </motion.div>
                                </button>
                              </div>

                              {/* Topics Area inside Chapter */}
                              <AnimatePresence initial={false}>
                                {isChapExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 p-3 space-y-2">
                                      {topicKeys.map((topName) => {
                                        const materialList = topics[topName];
                                        const topicKey = `${subName}:${chapName}:${topName}`;
                                        const isTopicExpanded = !!expandedNodes[topicKey];

                                        return (
                                          <div
                                            key={topName}
                                            className="rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-all overflow-hidden"
                                          >
                                            {/* Topic Row (Clickable) */}
                                            <div
                                              role="button"
                                              tabIndex={0}
                                              onClick={() => toggleNode(topicKey)}
                                              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleNode(topicKey); } }}
                                              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group"
                                            >
                                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 shrink-0 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30">
                                                <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                                              </div>

                                              <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200">
                                                  {topName}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-400 dark:text-slate-500">
                                                  <span className="font-medium">{materialList.length} files available</span>
                                                </div>
                                              </div>

                                              <motion.div animate={{ rotate: isTopicExpanded ? 180 : 0 }}>
                                                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                              </motion.div>
                                            </div>

                                            {/* Topic Materials Expandable List */}
                                            <AnimatePresence initial={false}>
                                              {isTopicExpanded && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: "auto", opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.15 }}
                                                  className="overflow-hidden"
                                                >
                                                  <div className="p-4 space-y-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10">
                                                    {materialList.map((m) => {
                                                      const meta = getResourceMeta(m.fileType, m.fileUrl);
                                                      const TypeIcon = meta.icon;

                                                      return (
                                                        <div
                                                          key={m.id}
                                                          onClick={() => m.fileUrl && window.open(m.fileUrl, '_blank')}
                                                          className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:shadow-md transition-all group cursor-pointer"
                                                        >
                                                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border dark:border-slate-800 shrink-0 ${meta.bg} ${meta.color}`}>
                                                            <TypeIcon className="w-4 h-4" />
                                                          </div>
                                                          <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                              {m.title}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                                              <span className={`font-bold uppercase ${meta.color}`}>{meta.label}</span>
                                                              <span>·</span>
                                                              <span>By: {m.uploaded_by_name || 'Teacher'}</span>
                                                              <span>·</span>
                                                              <span>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}</span>
                                                              {m.fileSizeKb ? (
                                                                <>
                                                                  <span>·</span>
                                                                  <span>{(m.fileSizeKb / 1024).toFixed(1)} MB</span>
                                                                </>
                                                              ) : null}
                                                            </div>
                                                          </div>
                                                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white dark:group-hover:text-white transition-all">
                                                            <Download className="w-3.5 h-3.5" />
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
