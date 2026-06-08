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

type CreateMode = "manual" | "image" | "ai";

function resolveUploadUrl(filePath: string | null | undefined) {
  if (!filePath) return null;
  const clean = String(filePath).replace(/^\.\//, "").replace(/^uploads[/\\]/, "");
  return `${getApiOrigin()}/uploads/${clean}`;
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
  const { assignments, setAssignments } = useAcademicStore();
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Navigation state
  const [mainTab, setMainTab] = useState<'manage' | 'inbox'>('manage');
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
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
    const map = new Map<string, { id: string; name: string; subjects: Map<string, { id: string; name: string }> }>();
    assignments.forEach((a: any) => {
      if (!a.classId || !a.subjectId) return;
      const entry = map.get(a.classId) ?? {
        id: a.classId,
        name: a.className,
        subjects: new Map<string, { id: string; name: string }>(),
      };
      entry.subjects.set(a.subjectId, { id: a.subjectId, name: a.subjectName });
      map.set(a.classId, entry);
    });
    return Array.from(map.values()).map((c) => ({
      id: c.id,
      name: c.name,
      subjects: Array.from(c.subjects.values()),
    }));
  }, [assignments]);

  const subjects = useMemo(() => {
    if (!selectedClass) return [];
    return classes.find((c) => c.id === selectedClass.id)?.subjects ?? [];
  }, [classes, selectedClass]);

  const pendingInboxCount = inboxItems.filter((s) => s.status !== 'graded').length;

  // ── Filtered Navigation ──────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const filteredClasses = classes.filter((c) => c.name?.toLowerCase().includes(q));
  const filteredSubjects = subjects.filter((s) => s.name?.toLowerCase().includes(q));

  const level: 'classes' | 'subjects' | 'workspace' =
    selectedSubject ? 'workspace' : selectedClass ? 'subjects' : 'classes';

  const goToClasses = () => { setSelectedClass(null); setSelectedSubject(null); setSearch(''); };
  const goToSubjects = () => { setSelectedSubject(null); setSearch(''); };
  const goBack = () => {
    if (level === 'workspace') goToSubjects();
    else if (level === 'subjects') goToClasses();
  };

  const openClass = (classItem: { id: string; name: string; subjects: { id: string; name: string }[] }) => {
    setSelectedClass({ id: classItem.id, name: classItem.name });
    setSearch('');
    if (classItem.subjects.length === 1) {
      setSelectedSubject(classItem.subjects[0]);
    } else {
      setSelectedSubject(null);
    }
  };

  const openWorkspace = (subject: { id: string; name: string }) => {
    setSelectedSubject(subject);
    setSearch('');
  };

  // ── Workspace Fetches ────────────────────────────────────────────────────
  const fetchWorkspaceAssignments = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoadingWorkspace(true);
    try {
      const res = await api.get(`/assignments?classId=${selectedClass.id}&subjectId=${selectedSubject.id}`);
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
  }, [level, selectedClass, selectedSubject]);

  const fetchInbox = async () => {
    setLoadingInbox(true);
    try {
      const res = await api.get('/assignments/submissions/inbox');
      setInboxItems(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    void fetchInbox();
  }, []);

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

  const handleGrade = async (submissionId: string) => {
    if (!selectedAssignment) return;
    try {
      await api.post(`/assignments/${selectedAssignment.id}/submissions/${submissionId}/grade`, {
        marks: gradeForm.marks !== '' ? Number(gradeForm.marks) : undefined,
        feedback: gradeForm.feedback || undefined,
      });
      toast.success('Graded successfully');
      setGradingId(null);
      await fetchSubmissions(selectedAssignment.id);
      await fetchInbox();
      await fetchWorkspaceAssignments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to grade');
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
    if (!selectedClass || !selectedSubject) return;
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
    if (!selectedClass || !selectedSubject) return;
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
    if (!selectedClass || !selectedSubject) {
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
    if (!window.confirm("Delete this assignment?")) return;
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
          onClick={() => { setMainTab('inbox'); void fetchInbox(); }}
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
          ...(selectedClass ? [{ label: selectedClass.name, onClick: goToSubjects, active: level === 'subjects' }] : []),
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
            All student work submitted to your assignments — grade directly from here.
          </p>
          {loadingInbox ? (
            <div className="py-12 text-center text-gray-400">Loading submissions…</div>
          ) : inboxItems.length === 0 ? (
            <div className="py-16 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
              <Inbox size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">No submissions yet</p>
              <p className="text-sm text-gray-500 mt-1">Students will appear here after they submit work.</p>
            </div>
          ) : (
            inboxItems.map((sub) => (
              <GlassCard key={sub.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{sub.student_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sub.assignment_title} · {sub.class_name} · {sub.subject_name}
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
                            onClick={() => {
                              const url = resolveUploadUrl(sub.file_path);
                              if (url) window.open(url, '_blank');
                            }}
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
                        void handleGrade(sub.id);
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
                meta={`${c.subjects.length} subject${c.subjects.length === 1 ? '' : 's'}`}
                actionLabel={c.subjects.length === 1 ? 'Open assignments' : 'Choose subject'}
                onClick={() => openClass(c)}
              />
            ))}
          </div>
        )
      )}

      {/* Level 2: Subjects */}
      {mainTab === 'manage' && level === 'subjects' && (
        filteredSubjects.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            No subjects assigned for this class.
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
      {mainTab === 'manage' && level === 'workspace' && selectedClass && selectedSubject && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Workspace</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedClass.name} | {selectedSubject.name}
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
                <p className="text-gray-500 mt-1 text-sm mb-4">Post homework for {selectedClass.name} — {selectedSubject.name}.</p>
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
      {selectedClass && selectedSubject && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => { setShowUploadModal(false); resetCreateForm(); }}
          title="New Assignment"
          size="lg"
        >
          <div className="space-y-5 p-2">
            <div className="bg-brand-50 text-brand-700 p-3 rounded-lg text-sm border border-brand-100">
              Posting to <strong>{selectedClass.name}</strong> · <strong>{selectedSubject.name}</strong>
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
                          <p className="text-xs text-gray-400">{sub.student_email}</p>
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
                              onClick={() => {
                                const url = resolveUploadUrl(sub.file_path);
                                if (url) window.open(url, '_blank');
                              }}
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
    </div>
  );
};

export default AssignmentManagement;
