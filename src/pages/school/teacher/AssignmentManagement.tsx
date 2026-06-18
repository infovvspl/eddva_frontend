import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  BookOpen,
  Clock,
  Download,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Home,
  GraduationCap,
  Users,
  Sparkles,
  ImageIcon,
  PenLine,
  Loader2,
  Inbox,
  Plus,
  CheckCircle2,
  Layers,
} from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Modal from "@/components/school/Modal";
import InputField from "@/components/school/InputField";
import SelectField from "@/components/school/SelectField";
import FileUpload from "@/components/school/FileUpload";
import SearchBar from "@/components/school/SearchBar";
import api, { unwrapSchoolData } from "@/lib/api/school-client";
import { getApiOrigin } from "@/lib/api-config";
import { useAcademicStore } from "@/lib/academic-store";
import DoubtImageAttach from "@/components/school/DoubtImageAttach";
import { uploadAssignmentImage } from "@/lib/school/assignment-upload";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmContext";

type CreateMode = "manual" | "image" | "ai";

function formatSectionName(name: string | null | undefined) {
  const value = String(name || '').trim();
  if (!value) return 'Section';
  return /^(sec|section)\b/i.test(value) ? value : `Sec ${value}`;
}

function resolveUploadUrl(filePath: string | null | undefined) {
  if (!filePath) return null;
  const raw = String(filePath);
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/uploads/')) return `${getApiOrigin()}${raw}`;
  const clean = raw.replace(/^\.\//, "").replace(/^uploads[/\\]/, "");
  return `${getApiOrigin()}/uploads/${clean}`;
}

function fileNameFromPath(filePath: string | null | undefined) {
  if (!filePath) return 'Submission';
  return String(filePath).split(/[\\/]/).pop()?.replace(/^\d+-/, '') || 'Submission';
}

function fileExtension(filePath: string | null | undefined) {
  const name = fileNameFromPath(filePath).toLowerCase();
  return name.includes('.') ? name.split('.').pop() || '' : '';
}

// ── Components ─────────────────────────────────────────────────────────────

function Breadcrumb({ items }: { items: { label: string; icon?: React.ReactNode; onClick: () => void; active: boolean }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm mb-6">
      {items.map((it, i) => (
        <React.Fragment key={`${it.label}-${i}`}>
          {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
          <button
            type="button"
            onClick={it.onClick}
            disabled={it.active}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-colors ${
              it.active ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {it.icon}{it.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

function NavCard({
  icon, tone, title, meta, actionLabel, onClick,
}: {
  icon: React.ReactNode; tone: 'brand' | 'emerald'; title: string; meta: string;
  actionLabel: string; onClick: () => void;
}) {
  const t = tone === 'brand' ? { soft: 'bg-brand-100', icon: 'text-brand-600' } : { soft: 'bg-emerald-100', icon: 'text-emerald-600' };
  return (
    <GlassCard hover className="group cursor-pointer p-5 transition-all" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ${t.soft} ${t.icon}`}>{icon}</div>
      </div>
      <h4 className="mt-4 truncate text-lg font-bold text-gray-900">{title}</h4>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Users size={14} /> {meta}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className={`text-sm font-semibold ${t.icon}`}>{actionLabel}</span>
        <ChevronRight size={16} className="text-gray-400 transition-transform group-hover:translate-x-0.5" />
      </div>
    </GlassCard>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

const AssignmentManagement: React.FC = () => {
  const confirm = useConfirm();
  const { assignments, setAssignments } = useAcademicStore();
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Navigation state
  const [mainTab, setMainTab] = useState<'manage' | 'inbox'>('manage');
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);

  // Workspace states
  const [workspaceAssignments, setWorkspaceAssignments] = useState<any[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'submissions'>('details');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState<{ marks: string; feedback: string }>({ marks: '', feedback: '' });
  const [previewSubmission, setPreviewSubmission] = useState<any | null>(null);
  const [previewFileMissing, setPreviewFileMissing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    type: "homework",
    due_date: "",
    instructions: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createMode, setCreateMode] = useState<CreateMode>("manual");
  const [aiTopic, setAiTopic] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [worksheetImageUrl, setWorksheetImageUrl] = useState<string | null>(null);
  const [worksheetPreview, setWorksheetPreview] = useState<string | null>(null);
  const [extractingImage, setExtractingImage] = useState(false);
  const [creating, setCreating] = useState(false);

  // ── Load teacher assignments (source of truth for navigation) ────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (assignments.length > 0) {
          setLoadingAssignments(false);
          return;
        }
        const res = await api.get('/dashboard/stats');
        const tData = res.data?.data?.teacherData || res.data?.teacherData || {};
        if (!cancelled && Array.isArray(tData.assignments)) {
          setAssignments(tData.assignments);
        }
      } catch (err) {
        console.error('Failed to load teacher assignments', err);
      } finally {
        if (!cancelled) setLoadingAssignments(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [assignments.length, setAssignments]);

  // ── Derived hierarchies (class → subject, skip sections) ─────────────────
  const classes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sections: Set<string>; subjects: Set<string> }>();
    assignments.forEach((a: any) => {
      if (!a.classId) return;
      const entry = map.get(a.classId) ?? {
        id: a.classId,
        name: a.className,
        sections: new Set<string>(),
        subjects: new Set<string>(),
      };
      if (a.sectionId) entry.sections.add(a.sectionId);
      if (a.subjectId) entry.subjects.add(a.subjectId);
      map.set(a.classId, entry);
    });
    return Array.from(map.values());
  }, [assignments]);

  const sections = useMemo(() => {
    if (!selectedClass) return [];
    const map = new Map<string, { id: string; name: string; subjects: Set<string> }>();
    assignments
      .filter((a: any) => a.classId === selectedClass.id)
      .forEach((a: any) => {
        if (!a.sectionId) return;
        const entry = map.get(a.sectionId) ?? {
          id: a.sectionId,
          name: formatSectionName(a.sectionName),
          subjects: new Set<string>(),
        };
        if (a.subjectId) entry.subjects.add(a.subjectId);
        map.set(a.sectionId, entry);
      });
    return Array.from(map.values());
  }, [assignments, selectedClass]);

  const subjects = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    const map = new Map<string, { id: string; name: string }>();
    assignments
      .filter((a: any) => a.classId === selectedClass.id && a.sectionId === selectedSection.id)
      .forEach((a: any) => {
        if (a.subjectId) map.set(a.subjectId, { id: a.subjectId, name: a.subjectName });
      });
    return Array.from(map.values());
  }, [assignments, selectedClass, selectedSection]);

  // ── Filtered Navigation ──────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const filteredClasses = classes.filter((c) => c.name?.toLowerCase().includes(q));
  const filteredSections = sections.filter((s) => s.name?.toLowerCase().includes(q));
  const filteredSubjects = subjects.filter((s) => s.name?.toLowerCase().includes(q));

  const visibleInboxItems = useMemo(() => {
    const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();
    return inboxItems.filter((sub) => {
      const classMatches = !selectedClass
        || String(sub.class_id ?? sub.classId ?? '') === selectedClass.id
        || normalize(sub.class_name) === normalize(selectedClass.name);
      const sectionMatches = !selectedSection
        || String(sub.section_id ?? sub.sectionId ?? '') === selectedSection.id
        || normalize(sub.section_name) === normalize(selectedSection.name);
      const subjectMatches = !selectedSubject
        || String(sub.subject_id ?? sub.subjectId ?? '') === selectedSubject.id
        || normalize(sub.subject_name) === normalize(selectedSubject.name);
      return classMatches && sectionMatches && subjectMatches;
    });
  }, [inboxItems, selectedClass, selectedSection, selectedSubject]);

  const pendingInboxCount = visibleInboxItems.filter((s) => s.status !== 'graded').length;

  const level: 'classes' | 'sections' | 'subjects' | 'workspace' =
    selectedSubject ? 'workspace' : selectedSection ? 'subjects' : selectedClass ? 'sections' : 'classes';

  const goToClasses = () => { setSelectedClass(null); setSelectedSection(null); setSelectedSubject(null); setSearch(''); };
  const goToSections = () => { setSelectedSection(null); setSelectedSubject(null); setSearch(''); };
  const goToSubjects = () => { setSelectedSubject(null); setSearch(''); };
  const goBack = () => {
    if (level === 'workspace') goToSubjects();
    else if (level === 'subjects') goToSections();
    else if (level === 'sections') goToClasses();
  };

  const openClass = (classItem: { id: string; name: string }) => {
    setSelectedClass({ id: classItem.id, name: classItem.name });
    setSelectedSection(null);
    setSelectedSubject(null);
    setSearch('');
  };

  const openSection = (section: { id: string; name: string; subjects: Set<string> }) => {
    setSelectedSection({ id: section.id, name: section.name });
    setSelectedSubject(null);
    setSearch('');
  };

  const openWorkspace = (subject: { id: string; name: string }) => {
    setSelectedSubject(subject);
    setSearch('');
  };

  // ── Workspace Fetches ────────────────────────────────────────────────────
  const fetchWorkspaceAssignments = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) return;
    setLoadingWorkspace(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClass.id,
        sectionId: selectedSection.id,
        subjectId: selectedSubject.id,
      });
      const res = await api.get(`/assignments?${params.toString()}`);
      setWorkspaceAssignments(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    if (level === 'workspace') {
      fetchWorkspaceAssignments();
    }
  }, [level, selectedClass, selectedSection, selectedSubject]);

  const fetchInbox = async () => {
    setLoadingInbox(true);
    setInboxItems([]);
    try {
      const params = new URLSearchParams();
      if (selectedClass?.id) params.set('classId', selectedClass.id);
      if (selectedSection?.id) params.set('sectionId', selectedSection.id);
      if (selectedSubject?.id) params.set('subjectId', selectedSubject.id);
      const query = params.toString();
      const res = await api.get(`/assignments/submissions/inbox${query ? `?${query}` : ''}`);
      setInboxItems(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'inbox') void fetchInbox();
  }, [mainTab, selectedClass?.id, selectedSection?.id, selectedSubject?.id]);

  const openAssignmentDetail = (a: any, tab: 'details' | 'submissions' = 'details') => {
    setSelectedAssignment(a);
    setDetailTab(tab);
    setSubmissions([]);
    setGradingId(null);
    setGradeForm({ marks: '', feedback: '' });
    if (tab === 'submissions') {
      void fetchSubmissions(a.id);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGrade = async (submissionId: string, assignmentId = selectedAssignment?.id) => {
    if (!assignmentId) return;
    try {
      await api.post(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
        marks: gradeForm.marks !== '' ? Number(gradeForm.marks) : undefined,
        feedback: gradeForm.feedback || undefined,
      });
      toast.success('Graded successfully');
      setGradingId(null);
      if (selectedAssignment?.id) await fetchSubmissions(selectedAssignment.id);
      await fetchInbox();
      await fetchWorkspaceAssignments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to grade');
    }
  };

  const openSubmissionPreview = async (submission: any) => {
    if (!submission?.file_path) {
      toast.warning('No submitted file found');
      return;
    }
    const url = resolveUploadUrl(submission.file_path);
    if (!url) {
      toast.warning('No submitted file found');
      return;
    }
    setPreviewFileMissing(false);
    setPreviewSubmission(submission);
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) setPreviewFileMissing(true);
    } catch {
      setPreviewFileMissing(true);
    }
  };

  const resetCreateForm = () => {
    setFormData({ title: "", type: "homework", due_date: "", instructions: "" });
    setSelectedFile(null);
    setCreateMode("manual");
    setAiTopic("");
    setAiPrompt("");
    setWorksheetImageUrl(null);
    setWorksheetPreview(null);
    setShowAdvancedCreate(false);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setShowUploadModal(true);
  };

  const handleAiGenerate = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) return;
    if (!aiTopic.trim() && !aiPrompt.trim()) {
      toast.error("Enter a topic or instructions for AI");
      return;
    }
    setAiGenerating(true);
    try {
      const res = await api.post("/assignments/ai-generate", {
        topic: aiTopic.trim() || "Homework",
        prompt: aiPrompt.trim(),
        type: formData.type,
        subjectName: selectedSubject.name,
        className: selectedClass.name,
        sectionName: selectedSection.name,
        questionCount: formData.type === "dpp" ? 10 : undefined,
      });
      const draft = unwrapSchoolData(res, { title: "", instructions: "" });
      setFormData((prev) => ({
        ...prev,
        title: draft.title || prev.title,
        instructions: draft.instructions || prev.instructions,
      }));
      toast.success("AI draft ready — review and publish");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "AI generation failed");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFromImage = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) return;
    if (!worksheetImageUrl) {
      toast.error("Upload a worksheet photo first");
      return;
    }
    setExtractingImage(true);
    try {
      const res = await api.post("/assignments/from-image", {
        imageUrl: worksheetImageUrl,
        subjectName: selectedSubject.name,
        className: selectedClass.name,
        sectionName: selectedSection.name,
        type: formData.type,
        prompt: aiPrompt.trim() || undefined,
      });
      const draft = unwrapSchoolData(res, { title: "", instructions: "" });
      setFormData((prev) => ({
        ...prev,
        title: draft.title || prev.title,
        instructions: draft.instructions || prev.instructions,
      }));
      toast.success("Worksheet converted — review and publish");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not read worksheet image");
    } finally {
      setExtractingImage(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) {
      toast.error("No active workspace context.");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Assignment title is required");
      return;
    }
    setCreating(true);
    try {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("type", formData.type);
      data.append("class_id", selectedClass.id);
      data.append("section_id", selectedSection.id);
      data.append("subject_id", selectedSubject.id);
      if (formData.due_date) data.append("due_date", formData.due_date);
      if (formData.instructions) data.append("instructions", formData.instructions);
      if (selectedFile) data.append("file", selectedFile);
      if (worksheetImageUrl && !selectedFile) {
        data.append("reference_image_url", worksheetImageUrl);
      }

      await api.post("/assignments", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Assignment published for students");
      await fetchWorkspaceAssignments();
      await fetchInbox();
      resetCreateForm();
      setShowUploadModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  const closeDetail = () => {
    setSelectedAssignment(null);
    setDetailTab('details');
    setSubmissions([]);
    setGradingId(null);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this assignment? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/assignments/${id}`);
      closeDetail();
      await fetchWorkspaceAssignments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete assignment");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Assignments
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Create homework and review student submissions in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mainTab === 'manage' && level === 'workspace' && (
            <Button icon={<Plus size={16} />} onClick={openCreateModal}>
              New Assignment
            </Button>
          )}
          {mainTab === 'manage' && level !== 'classes' && (
            <Button variant="outline" size="sm" icon={<ChevronLeft size={16} />} onClick={goBack}>
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex gap-2 rounded-xl bg-gray-100 p-1 max-w-md">
        <button
          type="button"
          onClick={() => setMainTab('manage')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
            mainTab === 'manage' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <BookOpen size={14} /> My Assignments
        </button>
        <button
          type="button"
          onClick={() => setMainTab('inbox')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
            mainTab === 'inbox' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Inbox size={14} /> Submissions
          {pendingInboxCount > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">
              {pendingInboxCount}
            </span>
          )}
        </button>
      </div>

      {mainTab === 'manage' && (
        <>
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Classes', icon: <Home size={14} />, onClick: goToClasses, active: level === 'classes' },
          ...(selectedClass ? [{ label: selectedClass.name, onClick: goToSections, active: level === 'sections' }] : []),
          ...(selectedSection ? [{ label: selectedSection.name, onClick: goToSubjects, active: level === 'subjects' }] : []),
          ...(selectedSubject ? [{ label: selectedSubject.name, onClick: () => {}, active: true }] : []),
        ]}
      />

      {/* Search Bar */}
      {level !== 'workspace' && (
        <div className="max-w-md mb-6">
          <SearchBar value={search} onChange={setSearch} placeholder={`Search ${level}...`} />
        </div>
      )}
        </>
      )}

      {/* Inbox tab */}
      {mainTab === 'inbox' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {selectedSubject && selectedClass && selectedSection
              ? `Student work for ${selectedClass.name} - ${selectedSection.name} - ${selectedSubject.name} only.`
              : selectedSection && selectedClass
                ? `Student work for ${selectedClass.name} - ${selectedSection.name}.`
              : selectedClass
                ? `Student work for ${selectedClass.name}.`
                : 'All student work submitted to your assignments - grade directly from here.'}
          </p>
          {loadingInbox ? (
            <div className="py-12 text-center text-gray-400">Loading submissions…</div>
          ) : visibleInboxItems.length === 0 ? (
            <div className="py-16 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
              <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">No submissions yet</p>
              <p className="text-sm text-gray-500 mt-1">Students will appear here after they submit work.</p>
            </div>
          ) : (
            visibleInboxItems.map((sub) => (
              <GlassCard key={sub.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{sub.student_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[sub.assignment_title, sub.class_name, sub.section_name, sub.subject_name].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}
                    </p>
                    {sub.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">{sub.notes}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sub.file_path && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<FileText size={14} />}
                            onClick={() => openSubmissionPreview(sub)}
                          >
                            View submission
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Download size={14} />}
                            onClick={() => {
                              const url = resolveUploadUrl(sub.file_path);
                              if (url) window.open(url, '_blank');
                            }}
                          >
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>{sub.status}</Badge>
                    {sub.marks != null && <span className="text-sm font-bold text-emerald-600">{sub.marks} marks</span>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {gradingId === sub.id ? (
                    <div className="flex flex-wrap gap-2 w-full mt-2 pt-3 border-t border-gray-100">
                      <input
                        type="number"
                        min={0}
                        placeholder="Marks"
                        value={gradeForm.marks}
                        onChange={(e) => setGradeForm((f) => ({ ...f, marks: e.target.value }))}
                        className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Feedback"
                        value={gradeForm.feedback}
                        onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                        className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                      />
                      <Button size="sm" onClick={() => {
                        setSelectedAssignment({ id: sub.assignment_id, title: sub.assignment_title });
                        void handleGrade(sub.id, sub.assignment_id);
                      }}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedAssignment({ id: sub.assignment_id, title: sub.assignment_title });
                        setGradingId(sub.id);
                        setGradeForm({ marks: sub.marks ?? '', feedback: sub.feedback ?? '' });
                      }}
                    >
                      {sub.status === 'graded' ? 'Edit grade' : 'Grade now'}
                    </Button>
                  )}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Level 1: Classes */}
      {mainTab === 'manage' && level === 'classes' && (
        loadingAssignments ? (
          <div className="py-12 text-center text-gray-400">Loading your classes...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            No classes assigned.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((c) => (
              <NavCard
                key={c.id}
                icon={<GraduationCap size={22} />}
                tone="brand"
                title={c.name}
                meta={`${c.sections.size} section${c.sections.size === 1 ? '' : 's'} · ${c.subjects.size} subject${c.subjects.size === 1 ? '' : 's'}`}
                actionLabel="Choose section"
                onClick={() => openClass(c)}
              />
            ))}
          </div>
        )
      )}

      {/* Level 2: Sections */}
      {mainTab === 'manage' && level === 'sections' && (
        filteredSections.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            No sections assigned for this class.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((s) => (
              <NavCard
                key={s.id}
                icon={<Layers size={22} />}
                tone="brand"
                title={s.name}
                meta={`${s.subjects.size} subject${s.subjects.size === 1 ? '' : 's'}`}
                actionLabel="Choose subject"
                onClick={() => openSection(s)}
              />
            ))}
          </div>
        )
      )}

      {/* Level 3: Subjects */}
      {mainTab === 'manage' && level === 'subjects' && (
        filteredSubjects.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            No subjects assigned for this section.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((s) => (
              <NavCard
                key={s.id}
                icon={<BookOpen size={22} />}
                tone="emerald"
                title={s.name}
                meta="Assignments Workspace"
                actionLabel="View assignments"
                onClick={() => openWorkspace(s)}
              />
            ))}
          </div>
        )
      )}

      {/* Workspace */}
      {mainTab === 'manage' && level === 'workspace' && selectedClass && selectedSection && selectedSubject && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Workspace</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedClass.name} | {selectedSection.name} | {selectedSubject.name}
              </p>
            </div>
            <Button icon={<Plus size={18} />} onClick={openCreateModal} className="shadow-sm">
              New Assignment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingWorkspace ? (
              <div className="col-span-full py-12 text-center text-gray-400">Loading assignments...</div>
            ) : workspaceAssignments.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No assignments yet</h3>
                <p className="text-gray-500 mt-1 text-sm mb-4">Post homework for {selectedClass.name} - {selectedSection.name} - {selectedSubject.name}.</p>
                <Button icon={<Plus size={16} />} onClick={openCreateModal}>Create first assignment</Button>
              </div>
            ) : (
              workspaceAssignments.map((a) => {
                const subCount = a.submissionCount ?? a.submission_count ?? 0;
                const pending = a.pendingGradeCount ?? a.pending_grade_count ?? 0;
                return (
                <GlassCard key={a.id} className="flex flex-col p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight pr-4 line-clamp-2">
                      {a.title}
                    </h3>
                    <Badge variant={a.type === 'homework' ? 'purple' : a.type === 'dpp' ? 'info' : 'success'}>
                      {String(a.type).toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-gray-400" />
                      {a.due_date || a.dueDate ? `Due: ${new Date(a.due_date || a.dueDate).toLocaleDateString()}` : 'No due date'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-gray-400" />
                      <span>{subCount} submission{subCount === 1 ? '' : 's'}</span>
                      {pending > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {pending} to grade
                        </span>
                      )}
                      {subCount > 0 && pending === 0 && (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openAssignmentDetail(a, 'details')}>
                      Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openAssignmentDetail(a, 'submissions')}
                      disabled={subCount === 0}
                    >
                      <Inbox size={14} className="mr-1" />
                      Submissions ({subCount})
                    </Button>
                  </div>
                </GlassCard>
              );})
            )}
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {selectedClass && selectedSection && selectedSubject && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => { setShowUploadModal(false); resetCreateForm(); }}
          title="New Assignment"
          size="lg"
        >
          <div className="space-y-5 p-2">
            <div className="bg-brand-50 text-brand-700 p-3 rounded-lg text-sm border border-brand-100">
              Posting to <strong>{selectedClass.name}</strong> · <strong>{selectedSection.name}</strong> · <strong>{selectedSubject.name}</strong>
            </div>

            <InputField
              label="Title"
              placeholder="e.g. Chapter 4 homework"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: "homework", label: "Homework" },
                  { value: "dpp", label: "DPP" },
                  { value: "notes", label: "Class Notes" },
                ]}
              />
              <InputField
                label="Due date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Instructions (optional)</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none text-sm min-h-[80px]"
                placeholder="What should students do?"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>

            <FileUpload
              label="Attach file (optional)"
              multiple={false}
              accept="image/*,.pdf,.doc,.docx"
              onFilesSelected={(files) => setSelectedFile(files[0] || null)}
            />

            <button
              type="button"
              onClick={() => setShowAdvancedCreate((v) => !v)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              {showAdvancedCreate ? '− Hide AI & image tools' : '+ Use AI or worksheet image'}
            </button>

            {showAdvancedCreate && (
            <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
              {([
                ["manual", "Manual", PenLine],
                ["image", "From image", ImageIcon],
                ["ai", "AI assist", Sparkles],
              ] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCreateMode(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                    createMode === id
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
            )}

            {showAdvancedCreate && createMode === "image" && (
              <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="text-sm text-violet-900">
                  Upload a photo of a worksheet, textbook page, or question paper. AI will read it and draft the assignment.
                </p>
                <DoubtImageAttach
                  label="Upload worksheet image"
                  uploadFn={uploadAssignmentImage}
                  imageUrl={worksheetImageUrl}
                  previewUrl={worksheetPreview}
                  onChange={(url, preview) => {
                    setWorksheetImageUrl(url);
                    setWorksheetPreview(preview);
                  }}
                />
                <InputField
                  label="Extra notes for AI (optional)"
                  placeholder="e.g. Focus on word problems only"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <Button
                  variant="outline"
                  icon={extractingImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  onClick={handleFromImage}
                  disabled={extractingImage || !worksheetImageUrl}
                >
                  {extractingImage ? "Reading image…" : "Generate from image"}
                </Button>
              </div>
            )}

            {showAdvancedCreate && createMode === "ai" && (
              <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <p className="text-sm text-blue-900">
                  Describe the topic or paste rough questions — AI will draft title and instructions.
                </p>
                <InputField
                  label="Topic / chapter"
                  placeholder="e.g. Fractions — addition and subtraction"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">AI instructions</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none text-sm min-h-[80px]"
                    placeholder="e.g. 8 medium-level questions, include 2 word problems…"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  icon={aiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  onClick={handleAiGenerate}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? "Generating…" : "Generate with AI"}
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => { setShowUploadModal(false); resetCreateForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={creating}>
                {creating ? "Publishing…" : "Publish for students"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <Modal
          isOpen={!!selectedAssignment}
          onClose={closeDetail}
          title="Assignment Details"
          size="lg"
        >
          <div className="p-2">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={selectedAssignment.type === 'homework' ? 'purple' : selectedAssignment.type === 'dpp' ? 'info' : 'success'}>
                  {String(selectedAssignment.type).toUpperCase()}
                </Badge>
                <Badge variant={selectedAssignment.status === 'completed' ? 'success' : 'warning'}>
                  {selectedAssignment.status || 'Active'}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{selectedAssignment.title}</h2>
              {(selectedAssignment.className || selectedAssignment.class_name || selectedAssignment.sectionName || selectedAssignment.section_name || selectedAssignment.subjectName || selectedAssignment.subject_name) && (
                <p className="mt-1 text-sm font-semibold text-gray-500">
                  {[
                    selectedAssignment.className || selectedAssignment.class_name,
                    selectedAssignment.sectionName || selectedAssignment.section_name,
                    selectedAssignment.subjectName || selectedAssignment.subject_name,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> Due: {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : "No Due Date"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> Created: {new Date(selectedAssignment.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-5">
              {(['details', 'submissions'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setDetailTab(tab);
                    if (tab === 'submissions' && submissions.length === 0) {
                      fetchSubmissions(selectedAssignment.id);
                    }
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${
                    detailTab === tab
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab === 'submissions' ? 'Submissions' : 'Details'}
                </button>
              ))}
            </div>

            {/* Details Tab */}
            {detailTab === 'details' && (
              <div className="space-y-5">
                {selectedAssignment.instructions && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions</h4>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{selectedAssignment.instructions}</p>
                  </div>
                )}
                {selectedAssignment.file_path ? (
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-brand-50 text-brand-600 rounded-lg shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedAssignment.file_path.split('/').pop()?.replace(/^\d+-/, '') || 'Attachment'}
                        </p>
                        <p className="text-xs text-gray-500">Document</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Download size={14} />}
                      onClick={() => {
                        const url = resolveUploadUrl(selectedAssignment.file_path);
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      Download
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No attachments provided.</div>
                )}
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <button
                    className="text-red-600 text-sm font-medium hover:text-red-700"
                    onClick={() => handleDelete(selectedAssignment.id)}
                  >
                    Delete Assignment
                  </button>
                  <Button onClick={closeDetail}>Close</Button>
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {detailTab === 'submissions' && (
              <div className="space-y-3 min-h-[200px]">
                {loadingSubmissions ? (
                  <div className="py-12 text-center text-gray-400 text-sm">Loading submissions…</div>
                ) : submissions.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Users size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No submissions yet</p>
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div key={sub.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{sub.student_name}</p>
                          <p className="text-xs text-gray-400">
                            {[sub.student_email, sub.class_name, sub.section_name].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>
                            {sub.status}
                          </Badge>
                          {sub.marks != null && (
                            <span className="text-xs font-bold text-emerald-600">{sub.marks} marks</span>
                          )}
                        </div>
                      </div>

                      {sub.notes && (
                        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{sub.notes}</p>
                      )}

                      <div className="flex items-center gap-3">
                        {sub.file_path && (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                              onClick={() => openSubmissionPreview(sub)}
                            >
                              <FileText size={13} /> View submission
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                              onClick={() => {
                                const url = resolveUploadUrl(sub.file_path);
                                if (url) window.open(url, '_blank');
                              }}
                            >
                              <Download size={13} /> Download
                            </button>
                          </div>
                        )}
                        {sub.feedback && (
                          <span className="text-xs text-gray-500 italic">"{sub.feedback}"</span>
                        )}
                      </div>

                      {gradingId === sub.id ? (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={0}
                              placeholder="Marks"
                              value={gradeForm.marks}
                              onChange={(e) => setGradeForm((f) => ({ ...f, marks: e.target.value }))}
                              className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <input
                              type="text"
                              placeholder="Feedback (optional)"
                              value={gradeForm.feedback}
                              onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleGrade(sub.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          onClick={() => {
                            setGradingId(sub.id);
                            setGradeForm({ marks: sub.marks ?? '', feedback: sub.feedback ?? '' });
                          }}
                        >
                          {sub.status === 'graded' ? 'Edit grade' : 'Grade'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* In-app Submission Preview */}
      {previewSubmission && (
        <Modal
          isOpen={!!previewSubmission}
          onClose={() => setPreviewSubmission(null)}
          title="Submission Preview"
          size="xl"
        >
          {(() => {
            const url = resolveUploadUrl(previewSubmission.file_path);
            const name = fileNameFromPath(previewSubmission.file_path);
            const ext = fileExtension(previewSubmission.file_path);
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
            const isPdf = ext === 'pdf';

            return (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {previewSubmission.student_name || 'Student submission'}
                      {previewSubmission.assignment_title ? ` · ${previewSubmission.assignment_title}` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Download size={14} />}
                    onClick={() => {
                      if (!url || previewFileMissing) {
                        toast.error('Submitted file is missing from the server');
                        return;
                      }
                      window.open(url, '_blank');
                    }}
                  >
                    Download
                  </Button>
                </div>

                <div className="min-h-[70vh] overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {!url || previewFileMissing ? (
                    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center text-gray-500">
                      <FileText size={42} className="mb-3 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-700">Submitted file is missing from the server.</p>
                      <p className="mt-1 max-w-md text-xs">
                        The submission record exists, but the uploaded file cannot be found. Ask the student to submit the assignment again.
                      </p>
                    </div>
                  ) : isImage ? (
                    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 p-4">
                      <img
                        src={url}
                        alt={name}
                        className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-sm"
                        onError={() => setPreviewFileMissing(true)}
                      />
                    </div>
                  ) : isPdf ? (
                    <iframe src={url} title={name} className="h-[70vh] w-full border-0" />
                  ) : (
                    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-gray-500">
                      <FileText size={42} className="mb-3 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-700">Preview is not available for this file type.</p>
                      <p className="mt-1 max-w-md text-xs">Use Download to open the submitted file with an app on your device.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};

export default AssignmentManagement;
