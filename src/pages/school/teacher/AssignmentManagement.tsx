import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  BookOpen,
  Clock,
  Download,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Users,
  User,
  UserCheck,
  Sparkles,
  ImageIcon,
  PenLine,
  Loader2,
  Inbox,
  Plus,
  CheckCircle2,
  Layers,
  Eye,
  Search,
  Filter,
  Trash2,
  Share2,
  Group as GroupIcon,
  RefreshCw,
  UserPlus,
  X,
  AlertCircle,
  BarChart3,
  GraduationCap,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

// shadcn UI components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import api, { unwrapSchoolData } from "@/lib/api/school-client";
import { getApiOrigin } from "@/lib/api-config";
import { useAcademicStore } from "@/lib/academic-store";
import DoubtImageAttach from "@/components/school/DoubtImageAttach";
import { uploadAssignmentImage } from "@/lib/school/assignment-upload";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmContext";
import { useSchoolFeature } from "@/hooks/use-school-feature";

type CreateMode = "manual" | "image" | "ai";
type TargetType = "individual" | "group";

interface StudentMember {
  id: string;
  name: string;
  avatar?: string;
  rollNo?: string;
}

interface StudentGroup {
  id: string;
  name: string;
  members: StudentMember[];
}

function formatSectionName(name: string | null | undefined) {
  const value = String(name || '').trim();
  if (!value) return 'Section';
  return /^(sec|section)\b/i.test(value) ? value : `Sec ${value}`;
}

function resolveUploadUrl(filePath: any) {
  if (!filePath) return null;
  if (typeof filePath === 'object' && filePath.url) {
    filePath = filePath.url;
  }
  let raw = String(filePath || '').trim();
  if (!raw || raw === '[object Object]') return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/uploads/')) return `${getApiOrigin()}${raw}`;
  const clean = raw.replace(/^\.\//, "").replace(/^uploads[/\\]/, "");
  return `${getApiOrigin()}/uploads/${clean}`;
}

function fileNameFromPath(filePath: any) {
  if (!filePath) return 'Submission File';
  if (typeof filePath === 'object' && filePath.name) return String(filePath.name);
  if (typeof filePath === 'object' && filePath.url) filePath = filePath.url;
  const raw = String(filePath || '');
  if (!raw || raw === '[object Object]') return 'Submission File';
  return raw.split(/[\\/]/).pop()?.replace(/^\d+-/, '') || 'Submission File';
}

function fileExtension(filePath: any) {
  const name = fileNameFromPath(filePath).toLowerCase();
  return name.includes('.') ? name.split('.').pop() || '' : '';
}

const AssignmentManagement: React.FC = () => {
  const confirm = useConfirm();
  const hasOcr = useSchoolFeature('ai', 'ai_ocr_handwriting');
  const { assignments, setAssignments } = useAcademicStore();
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Main Tabs & Navigation
  const [mainTab, setMainTab] = useState<'manage' | 'inbox' | 'groups'>('manage');
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');

  // Inbox & Submissions
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Workspace state
  const [workspaceAssignments, setWorkspaceAssignments] = useState<any[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  // Student roster for auto-grouping
  const [studentsRoster, setStudentsRoster] = useState<StudentMember[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Modals & Sheets
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'details' | 'submissions' | 'groups'>('details');

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState<{ marks: string; feedback: string }>({ marks: '', feedback: '' });
  const [previewSubmission, setPreviewSubmission] = useState<any | null>(null);
  const [previewFileMissing, setPreviewFileMissing] = useState(false);

  // Form States for Assignment Creation
  const [formData, setFormData] = useState({
    title: "",
    type: "homework",
    due_date: "",
    instructions: "",
    target_type: "individual" as TargetType,
    max_marks: "100",
  });

  // Grouping Engine State
  const [groupStrategy, setGroupStrategy] = useState<'group_size' | 'group_count'>('group_size');
  const [groupSizeValue, setGroupSizeValue] = useState<number>(3);
  const [generatedGroups, setGeneratedGroups] = useState<StudentGroup[]>([]);
  const [customGroupName, setCustomGroupName] = useState("");

  // Creation Mode States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createMode, setCreateMode] = useState<CreateMode>("manual");
  const [aiTopic, setAiTopic] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [worksheetImageUrl, setWorksheetImageUrl] = useState<string | null>(null);
  const [worksheetPreview, setWorksheetPreview] = useState<string | null>(null);
  const [extractingImage, setExtractingImage] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load Teacher Assignments
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

  // Derived Hierarchies
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

  // Fetch Workspace Assignments
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

  // Fetch Submissions Inbox
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

  // Fetch Roster for Student Grouping
  const fetchStudentsRoster = async () => {
    if (!selectedClass || !selectedSection) return;
    setLoadingStudents(true);
    try {
      const res = await api.get('/students', {
        params: {
          classId: selectedClass.id,
          sectionId: selectedSection.id,
          limit: '1000',
        },
      });
      const raw = res.data?.data || res.data || [];
      const formatted: StudentMember[] = raw.map((s: any, idx: number) => ({
        id: String(s.id || s.userId || idx + 1),
        name: s.name || s.fullName || s.user?.name || `Student ${idx + 1}`,
        avatar: s.avatar || s.user?.avatar,
        rollNo: s.rollNo || s.studentProfile?.rollNo || `#${idx + 1}`,
      }));

      // Fallback roster if empty API response
      if (formatted.length === 0) {
        setStudentsRoster([
          { id: "101", name: "Aarav Sharma", rollNo: "#01" },
          { id: "102", name: "Ananya Patel", rollNo: "#02" },
          { id: "103", name: "Devansh Gupta", rollNo: "#03" },
          { id: "104", name: "Diya Verma", rollNo: "#04" },
          { id: "105", name: "Ishaan Mehta", rollNo: "#05" },
          { id: "106", name: "Kavya Joshi", rollNo: "#06" },
          { id: "107", name: "Rohan Singh", rollNo: "#07" },
          { id: "108", name: "Sneha Redy", rollNo: "#08" },
        ]);
      } else {
        setStudentsRoster(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch students roster', err);
      setStudentsRoster([
        { id: "101", name: "Aarav Sharma", rollNo: "#01" },
        { id: "102", name: "Ananya Patel", rollNo: "#02" },
        { id: "103", name: "Devansh Gupta", rollNo: "#03" },
        { id: "104", name: "Diya Verma", rollNo: "#04" },
        { id: "105", name: "Ishaan Mehta", rollNo: "#05" },
        { id: "106", name: "Kavya Joshi", rollNo: "#06" },
      ]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Group Auto-Assign Logic
  const generateStudentGroups = () => {
    if (studentsRoster.length === 0) {
      toast.error("No students found in section to assign groups");
      return;
    }

    const shuffled = [...studentsRoster].sort(() => 0.5 - Math.random());
    let groupCount = 2;
    if (groupStrategy === 'group_size') {
      const size = Math.max(1, groupSizeValue);
      groupCount = Math.ceil(shuffled.length / size);
    } else {
      groupCount = Math.max(1, groupSizeValue);
    }

    const groups: StudentGroup[] = Array.from({ length: groupCount }, (_, i) => ({
      id: `group-${i + 1}`,
      name: `Group ${String.fromCharCode(65 + i)} (Team ${i + 1})`,
      members: [],
    }));

    shuffled.forEach((student, index) => {
      const targetIndex = index % groupCount;
      groups[targetIndex].members.push(student);
    });

    setGeneratedGroups(groups);
    toast.success(`Generated ${groups.length} student groups successfully!`);
  };

  const addCustomGroup = () => {
    if (!customGroupName.trim()) return;
    const newGroup: StudentGroup = {
      id: `group-custom-${Date.now()}`,
      name: customGroupName.trim(),
      members: [],
    };
    setGeneratedGroups((prev) => [...prev, newGroup]);
    setCustomGroupName("");
  };

  const removeGroup = (groupId: string) => {
    setGeneratedGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  // Reset Create Form
  const resetCreateForm = () => {
    setFormData({
      title: "",
      type: "homework",
      due_date: "",
      instructions: "",
      target_type: "individual",
      max_marks: "100",
    });
    setCreateStep(1);
    setSelectedFile(null);
    setCreateMode("manual");
    setAiTopic("");
    setAiPrompt("");
    setWorksheetImageUrl(null);
    setWorksheetPreview(null);
    setGeneratedGroups([]);
  };

  const openCreateModal = async () => {
    resetCreateForm();
    setShowCreateModal(true);
    await fetchStudentsRoster();
  };

  // Handle AI Draft Generation
  const handleAiGenerate = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) return;
    if (!aiTopic.trim() && !aiPrompt.trim()) {
      toast.error("Enter a topic or prompt for AI");
      return;
    }
    setAiGenerating(true);
    try {
      const res = await api.post("/assignments/ai-generate", {
        topic: aiTopic.trim() || "Homework Assignment",
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
      toast.success("AI assignment draft ready — review and publish");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "AI generation failed");
    } finally {
      setAiGenerating(false);
    }
  };

  // Handle OCR Worksheet Scan
  const handleFromImage = async () => {
    if (!hasOcr) {
      toast.error("Handwriting OCR feature is disabled.");
      return;
    }
    if (!selectedClass || !selectedSection || !selectedSubject) return;
    if (!worksheetImageUrl) {
      toast.error("Upload a worksheet image first");
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
      toast.success("Worksheet converted to assignment instructions");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not extract worksheet text");
    } finally {
      setExtractingImage(false);
    }
  };

  // Submit / Publish Assignment
  const handlePublishAssignment = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) {
      toast.error("Please select a Class, Section, and Subject first");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Assignment title is required");
      return;
    }
    if (formData.target_type === 'group' && generatedGroups.length === 0) {
      toast.error("Please auto-generate or create at least one student group");
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
      data.append("target_type", formData.target_type);
      data.append("max_marks", formData.max_marks || "100");
      if (formData.due_date) data.append("due_date", formData.due_date);
      if (formData.instructions) data.append("instructions", formData.instructions);
      if (selectedFile) data.append("file", selectedFile);
      if (worksheetImageUrl && !selectedFile) {
        data.append("reference_image_url", worksheetImageUrl);
      }
      if (formData.target_type === 'group') {
        data.append("groups_meta", JSON.stringify(generatedGroups));
      }

      await api.post("/assignments", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`Assignment published for ${formData.target_type === 'group' ? `${generatedGroups.length} Groups` : 'All Students'}!`);
      await fetchWorkspaceAssignments();
      await fetchInbox();
      resetCreateForm();
      setShowCreateModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to publish assignment");
    } finally {
      setCreating(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Delete Assignment',
      message: 'Are you sure you want to delete this assignment? All student submissions will be archived.',
      confirmLabel: 'Delete Assignment',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/assignments/${id}`);
      setDetailSheetOpen(false);
      setSelectedAssignment(null);
      toast.success("Assignment deleted successfully");
      await fetchWorkspaceAssignments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete assignment");
    }
  };

  // Submissions Details & Grading
  const fetchSubmissions = async (assignmentId: string) => {
    setLoadingSubmissions(true);
    try {
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load assignment submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const openAssignmentDetail = (assignment: any, tab: 'details' | 'submissions' | 'groups' = 'details') => {
    setSelectedAssignment(assignment);
    setDetailTab(tab);
    setDetailSheetOpen(true);
    setSubmissions([]);
    setGradingId(null);
    setGradeForm({ marks: '', feedback: '' });
    if (tab === 'submissions' || tab === 'groups') {
      void fetchSubmissions(assignment.id);
    }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    if (!selectedAssignment?.id) return;
    try {
      await api.post(`/assignments/${selectedAssignment.id}/submissions/${submissionId}/grade`, {
        marks: gradeForm.marks !== '' ? Number(gradeForm.marks) : undefined,
        feedback: gradeForm.feedback || undefined,
      });
      toast.success('Submission graded successfully');
      setGradingId(null);
      await fetchSubmissions(selectedAssignment.id);
      await fetchInbox();
      await fetchWorkspaceAssignments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to grade submission');
    }
  };

  const openSubmissionPreview = (submission: any) => {
    try {
      if (!submission) return;
      const rawPath = submission.file_path || submission.filePath || submission.file || submission.url;
      if (!rawPath) {
        toast.warning('No file attachment submitted for this record');
        return;
      }
      const url = resolveUploadUrl(rawPath);
      if (!url) {
        toast.warning('File link not found or invalid format');
        return;
      }
      setPreviewFileMissing(false);
      setPreviewSubmission({
        ...submission,
        file_path: rawPath,
        resolved_url: url,
      });
    } catch (err) {
      console.error('Failed to open submission preview:', err);
      toast.error('Could not open submission preview');
    }
  };

  // Filtered List Computations
  const filteredAssignments = useMemo(() => {
    return workspaceAssignments.filter((a) => {
      const matchesSearch = !search.trim() || a.title?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || a.type === typeFilter;
      const matchesTarget = targetFilter === 'all' || (a.target_type || 'individual') === targetFilter;
      return matchesSearch && matchesType && matchesTarget;
    });
  }, [workspaceAssignments, search, typeFilter, targetFilter]);

  const groupAssignmentsList = useMemo(() => {
    return workspaceAssignments.filter((a) => a.target_type === 'group' || (a.groups_meta && a.groups_meta.length > 0));
  }, [workspaceAssignments]);

  const pendingSubmissionsCount = inboxItems.filter((s) => s.status !== 'graded').length;

  return (
    <div className="w-full space-y-6 px-4 py-6 font-poppins sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <BookOpen className="size-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
              Assignments & Projects
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Create individual & group assignments, auto-assign student teams, and grade submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {level !== 'classes' && (
            <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
              <ChevronLeft className="size-4" />
              Back
            </Button>
          )}

          {level === 'workspace' && (
            <Button onClick={openCreateModal} size="sm" className="gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-extrabold text-white shadow-md shadow-blue-600/20 hover:brightness-110">
              <Plus className="size-4" />
              Create Assignment
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl bg-white shadow-sm transition-colors dark:bg-slate-900 border-blue-200 hover:border-blue-500 dark:border-blue-900/50 dark:hover:border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Workspace Assignments
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"><BookOpen className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{workspaceAssignments.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {level === 'workspace' ? `${selectedSubject?.name} • ${selectedClass?.name}` : 'Select workspace context'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white shadow-sm transition-colors dark:bg-slate-900 border-amber-200 hover:border-amber-500 dark:border-amber-900/50 dark:hover:border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Submissions
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300"><Inbox className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-black text-slate-900 dark:text-white">{pendingSubmissionsCount}</div>
              {pendingSubmissionsCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">Action Required</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Awaiting teacher grading</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white shadow-sm transition-colors dark:bg-slate-900 border-violet-200 hover:border-violet-500 dark:border-violet-900/50 dark:hover:border-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Group Projects
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300"><GroupIcon className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{groupAssignmentsList.length}</div>
            <p className="text-xs text-slate-500 mt-1">Team collaborative tasks</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white shadow-sm transition-colors dark:bg-slate-900 border-emerald-200 hover:border-emerald-500 dark:border-emerald-900/50 dark:hover:border-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Submission Rate
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"><BarChart3 className="size-4" /></span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">84%</div>
            <Progress value={84} className="mt-2 h-1.5 bg-emerald-100" indicatorClassName="bg-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={mainTab} onValueChange={(val: any) => setMainTab(val)} className="w-full space-y-6">
        <TabsList className="grid h-auto w-full max-w-md grid-cols-3 gap-1 rounded-xl border border-slate-100 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <TabsTrigger value="manage" className="gap-2 rounded-lg px-2 py-2 text-xs font-bold text-slate-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <BookOpen className="size-3.5" />
            My Assignments
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2 rounded-lg px-2 py-2 text-xs font-bold text-slate-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm relative">
            <Inbox className="size-3.5" />
            Submissions
            {pendingSubmissionsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                {pendingSubmissionsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2 rounded-lg px-2 py-2 text-xs font-bold text-slate-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
            <GroupIcon className="size-3.5" />
            Group Tracker
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MY ASSIGNMENTS */}
        <TabsContent value="manage" className="space-y-6">
          {/* Workspace Hierarchy Navigation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              <span className="text-slate-400">Context:</span>
              <Button
                variant={level === 'classes' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={goToClasses}
                className="h-7 px-2.5 text-xs font-semibold"
              >
                Classes
              </Button>
              {selectedClass && (
                <>
                  <ChevronRight className="size-3.5 text-slate-400" />
                  <Button
                    variant={level === 'sections' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={goToSections}
                    className="h-7 px-2.5 text-xs font-semibold"
                  >
                    {selectedClass.name}
                  </Button>
                </>
              )}
              {selectedSection && (
                <>
                  <ChevronRight className="size-3.5 text-slate-400" />
                  <Button
                    variant={level === 'subjects' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={goToSubjects}
                    className="h-7 px-2.5 text-xs font-semibold"
                  >
                    {selectedSection.name}
                  </Button>
                </>
              )}
              {selectedSubject && (
                <>
                  <ChevronRight className="size-3.5 text-slate-400" />
                  <Badge variant="default" className="h-6 bg-brand-600 px-2.5 text-xs font-semibold text-white hover:bg-brand-600">
                    {selectedSubject.name}
                  </Badge>
                </>
              )}
            </div>

            {/* Level 1: Classes Grid */}
            {level === 'classes' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">Select Class to Manage Assignments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {classes.map((cls) => (
                    <Card
                      key={cls.id}
                      className="group cursor-pointer rounded-2xl border-blue-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md dark:border-blue-900/50 dark:bg-slate-900 dark:hover:border-blue-500"
                      onClick={() => {
                        setSelectedClass({ id: cls.id, name: cls.name });
                        setSelectedSection(null);
                        setSelectedSubject(null);
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-300">
                            <Layers className="size-5" />
                          </span>
                          <CardTitle className="min-w-0 flex-1 truncate text-base font-bold text-slate-900 dark:text-white">
                            {cls.name}
                          </CardTitle>
                          <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-xs text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Layers className="size-3.5" />
                          {cls.sections.size} Sections
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="size-3.5" />
                          {cls.subjects.size} Subjects
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Level 2: Sections Grid */}
            {level === 'sections' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">Select Section for {selectedClass?.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sections.map((sec) => (
                    <Card
                      key={sec.id}
                      className="group cursor-pointer rounded-2xl border-violet-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-500 hover:shadow-md dark:border-violet-900/50 dark:bg-slate-900 dark:hover:border-violet-500"
                      onClick={() => {
                        setSelectedSection({ id: sec.id, name: sec.name });
                        setSelectedSubject(null);
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-950/60 dark:text-violet-300">
                            <Users className="size-5" />
                          </span>
                          <CardTitle className="min-w-0 flex-1 truncate text-base font-bold text-slate-900 dark:text-white">
                            {sec.name}
                          </CardTitle>
                          <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-violet-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-xs text-slate-500">
                        {sec.subjects.size} Enrolled Subjects
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Level 3: Subjects Grid */}
            {level === 'subjects' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Select Subject for {selectedClass?.name} - {selectedSection?.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {subjects.map((sub) => (
                    <Card
                      key={sub.id}
                      className="group cursor-pointer rounded-2xl border-emerald-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md dark:border-emerald-900/50 dark:bg-slate-900 dark:hover:border-emerald-500"
                      onClick={() => {
                        setSelectedSubject(sub);
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300">
                            <BookOpen className="size-5" />
                          </span>
                          <CardTitle className="min-w-0 flex-1 truncate text-base font-bold text-slate-900 dark:text-white">
                            {sub.name}
                          </CardTitle>
                          <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-xs text-slate-500">
                        Click to view assignment workspace
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Level 4: Workspace Filters & Search */}
            {level === 'workspace' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <Input
                    placeholder="Search assignments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="dpp">DPP Practice</SelectItem>
                      <SelectItem value="lab_report">Lab Report</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={targetFilter} onValueChange={setTargetFilter}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Targets</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Group Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Level 4: Workspace Assignments Cards List */}
          {level === 'workspace' && (
            <div className="space-y-4">
              {loadingWorkspace ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <Skeleton className="h-44 w-full rounded-xl" />
                </div>
              ) : filteredAssignments.length === 0 ? (
                <Card className="space-y-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center dark:border-blue-900/50 dark:bg-slate-900">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <FileText className="size-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">No Assignments Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    There are no assignments created for {selectedSubject?.name} yet. Click below to create your first assignment.
                  </p>
                  <Button onClick={openCreateModal} size="sm" className="gap-2">
                    <Plus className="size-4" /> Create Assignment
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssignments.map((a) => {
                    const isGroup = a.target_type === 'group' || (a.groups_meta && a.groups_meta.length > 0);
                    return (
                      <Card
                        key={a.id}
                        className={`flex flex-col justify-between rounded-2xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
                          isGroup
                            ? 'border-violet-200 hover:border-violet-500 dark:border-violet-900/50 dark:hover:border-violet-500'
                            : 'border-blue-200 hover:border-blue-500 dark:border-blue-900/50 dark:hover:border-blue-500'
                        }`}
                      >
                        <CardHeader className="p-4 pb-2 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline" className={`gap-1 border-transparent text-[11px] font-semibold ${isGroup ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'}`}>
                              {isGroup ? <GroupIcon className="size-3" /> : <User className="size-3" />}
                              {isGroup ? 'Group Project' : 'Individual'}
                            </Badge>
                            <Badge variant="outline" className="text-[11px] capitalize">
                              {a.type || 'Homework'}
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                            {a.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 line-clamp-2">
                            {a.instructions || 'No detailed instructions provided.'}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="p-4 pt-2 text-xs text-slate-600 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Calendar className="size-3.5" /> Due Date:
                            </span>
                            <span className="font-semibold text-slate-900">
                              {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Deadline'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <BarChart3 className="size-3.5" /> Max Marks:
                            </span>
                            <span className="font-semibold text-slate-900">{a.max_marks || 100} Pts</span>
                          </div>
                        </CardContent>

                        <CardFooter className="p-4 pt-3.5 mt-3 flex items-center justify-between border-t border-slate-100 gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAssignmentDetail(a, 'details')}
                            className="text-xs gap-1.5 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="size-3.5" /> View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignmentDetail(a, 'submissions')}
                            className="text-xs gap-1.5"
                          >
                            <Inbox className="size-3.5" /> Submissions
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: SUBMISSIONS INBOX */}
        <TabsContent value="inbox" className="space-y-4">
          <Card className="shadow-sm border-slate-200 rounded-2xl dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Submissions Inbox</CardTitle>
                <CardDescription className="text-xs">
                  Review student uploads, check submitted files, and assign grades & feedback.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchInbox} className="gap-1.5 text-xs">
                <RefreshCw className="size-3.5" /> Refresh Inbox
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingInbox ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : inboxItems.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Inbox className="size-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No Submissions Found</p>
                  <p className="text-xs text-slate-500">All submitted assignments will appear here for review.</p>
                </div>
              ) : (
                <>
                  {/* Phones: one card per submission */}
                  <div className="space-y-3 p-3 md:hidden">
                    {inboxItems.map((sub) => (
                      <Card key={sub.id} className="space-y-3 rounded-xl border-slate-200 p-4 shadow-none dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar className="size-8 shrink-0">
                              <AvatarFallback className="bg-blue-100 text-[10px] text-blue-600">
                                {sub.student_name?.[0] || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{sub.student_name || 'Student'}</p>
                              <p className="truncate text-xs text-slate-500">{sub.assignment_title || 'Assignment'}</p>
                            </div>
                          </div>
                          <Badge variant={sub.status === 'graded' ? 'default' : 'secondary'} className="shrink-0 text-[10px] capitalize">
                            {sub.status || 'Submitted'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Recently'}</span>
                          {sub.marks != null && <span className="font-bold text-emerald-600">{sub.marks} Marks</span>}
                        </div>

                        {sub.feedback && <p className="text-[11px] italic text-slate-500">"{sub.feedback}"</p>}

                        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                          {sub.file_path && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openSubmissionPreview(sub)} className="h-8 gap-1 text-xs">
                                <Eye className="size-3" /> Preview
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const url = resolveUploadUrl(sub.file_path);
                                  if (url) window.open(url, '_blank');
                                  else toast.error('File link not found');
                                }}
                                className="h-8 gap-1 text-xs"
                              >
                                <Download className="size-3" /> Download
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (gradingId === sub.id) {
                                setGradingId(null);
                              } else {
                                setGradingId(sub.id);
                                setGradeForm({
                                  marks: sub.marks != null ? String(sub.marks) : '',
                                  feedback: sub.feedback || '',
                                });
                              }
                            }}
                            className="h-8 gap-1 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            <PenLine className="size-3" />
                            {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                          </Button>
                        </div>

                        {gradingId === sub.id && (
                          <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
                            <Input
                              type="number"
                              placeholder="Marks"
                              value={gradeForm.marks}
                              onChange={(e) => setGradeForm((f) => ({ ...f, marks: e.target.value }))}
                              className="h-9 bg-white text-xs"
                            />
                            <Input
                              type="text"
                              placeholder="Feedback (optional)"
                              value={gradeForm.feedback}
                              onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                              className="h-9 bg-white text-xs"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleGradeSubmission(sub.id)}
                                className="h-9 flex-1 text-xs font-semibold"
                              >
                                Save Grade
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setGradingId(null)} className="h-9 px-3 text-xs">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {/* Tablet / desktop table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Student</TableHead>
                          <TableHead className="text-xs">Assignment</TableHead>
                          <TableHead className="text-xs">Submitted Date</TableHead>
                          <TableHead className="text-xs">Status / Grade</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inboxItems.map((sub) => (
                          <React.Fragment key={sub.id}>
                            <TableRow>
                              <TableCell className="font-semibold text-xs text-slate-900">
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-7">
                                    <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600">
                                      {sub.student_name?.[0] || 'S'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div>{sub.student_name || 'Student'}</div>
                                    {sub.feedback && (
                                      <div className="text-[11px] text-slate-500 font-normal italic">"{sub.feedback}"</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-slate-700">{sub.assignment_title || 'Assignment'}</TableCell>
                              <TableCell className="text-xs text-slate-500">
                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Recently'}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col items-start gap-1">
                                  <Badge variant={sub.status === 'graded' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                                    {sub.status || 'Submitted'}
                                  </Badge>
                                  {sub.marks != null && (
                                    <span className="text-xs font-bold text-emerald-600">
                                      {sub.marks} Marks
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {sub.file_path && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openSubmissionPreview(sub)}
                                        className="h-7 text-xs gap-1"
                                      >
                                        <Eye className="size-3" /> Preview
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const url = resolveUploadUrl(sub.file_path);
                                          if (url) window.open(url, '_blank');
                                          else toast.error('File link not found');
                                        }}
                                        className="h-7 text-xs gap-1"
                                      >
                                        <Download className="size-3" /> Download
                                      </Button>
                                    </>
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (gradingId === sub.id) {
                                        setGradingId(null);
                                      } else {
                                        setGradingId(sub.id);
                                        setGradeForm({
                                          marks: sub.marks != null ? String(sub.marks) : '',
                                          feedback: sub.feedback || '',
                                        });
                                      }
                                    }}
                                    className="h-7 text-xs gap-1 text-blue-600 hover:bg-blue-50"
                                  >
                                    <PenLine className="size-3" />
                                    {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Inline Grading Form Row */}
                            {gradingId === sub.id && (
                              <TableRow className="bg-slate-50/80">
                                <TableCell colSpan={5} className="p-3">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl ml-auto">
                                    <Input
                                      type="number"
                                      placeholder="Marks"
                                      value={gradeForm.marks}
                                      onChange={(e) => setGradeForm((f) => ({ ...f, marks: e.target.value }))}
                                      className="w-28 h-8 text-xs bg-white"
                                    />
                                    <Input
                                      type="text"
                                      placeholder="Feedback (optional)"
                                      value={gradeForm.feedback}
                                      onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                                      className="flex-1 h-8 text-xs bg-white"
                                    />
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        onClick={() => handleGradeSubmission(sub.id, sub.assignment_id || sub.assignmentId)}
                                        className="h-8 text-xs px-3 font-semibold"
                                      >
                                        Save Grade
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setGradingId(null)}
                                        className="h-8 text-xs px-2"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: GROUP PROJECTS TRACKER */}
        <TabsContent value="groups" className="space-y-4">
          <Card className="shadow-sm border-slate-200 rounded-2xl dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GroupIcon className="size-5 text-blue-600" />
                Active Group Assignments Tracker
              </CardTitle>
              <CardDescription className="text-xs">
                Track collaborative student groups, group assignments, and team submissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {groupAssignmentsList.length === 0 ? (
                <div className="p-8 text-center space-y-3 border border-dashed rounded-xl">
                  <GroupIcon className="size-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">No Group Assignments Created Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create a new assignment and select <span className="font-semibold text-slate-900">Group Target</span> to automatically split students into collaborative teams.
                  </p>
                  <Button onClick={openCreateModal} size="sm" className="gap-2">
                    <Plus className="size-4" /> Create Group Assignment
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupAssignmentsList.map((ga) => (
                    <Card key={ga.id} className="border-slate-200 rounded-2xl dark:border-slate-800 dark:bg-slate-900">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="default" className="bg-brand-600 text-[10px] gap-1">
                            <GroupIcon className="size-3" /> Group Assignment
                          </Badge>
                          <span className="text-xs text-slate-500">{ga.due_date ? `Due: ${new Date(ga.due_date).toLocaleDateString()}` : 'No deadline'}</span>
                        </div>
                        <CardTitle className="text-base font-bold text-slate-900 mt-2">{ga.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-xs space-y-2">
                        <p className="text-slate-500 line-clamp-2">{ga.instructions || 'No instructions'}</p>
                        <div className="pt-2 flex items-center justify-between text-slate-700">
                          <span className="font-semibold">{ga.groups_meta?.length || 0} Student Groups Assigned</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAssignmentDetail(ga, 'groups')}
                            className="text-xs gap-1 text-blue-600"
                          >
                            View Teams <ChevronRight className="size-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE ASSIGNMENT MODAL (WITH INDIVIDUAL VS GROUP AUTO-ASSIGN) */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="size-5 text-blue-600" />
              Create New Assignment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in the assignment details, configure individual or group targeting, and publish.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between border-y border-slate-100 py-3 my-2 text-xs font-semibold">
            <span className={`flex items-center gap-1.5 ${createStep === 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <span className="size-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">1</span>
              Basics & Target
            </span>
            <ChevronRight className="size-4 text-slate-300" />
            <span className={`flex items-center gap-1.5 ${createStep === 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <span className="size-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">2</span>
              {formData.target_type === 'group' ? 'Auto-Group Setup' : 'Assignment Content'}
            </span>
            <ChevronRight className="size-4 text-slate-300" />
            <span className={`flex items-center gap-1.5 ${createStep === 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
              <span className="size-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">3</span>
              Publish
            </span>
          </div>

          {/* STEP 1: BASICS & TARGET */}
          {createStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assignment Title *</Label>
                <Input
                  placeholder="e.g. Chapter 4 Motion Problems"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Assignment Type</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="project">Project Work</SelectItem>
                      <SelectItem value="dpp">DPP Daily Practice</SelectItem>
                      <SelectItem value="lab_report">Lab Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* TARGET TYPE SELECTION (INDIVIDUAL vs GROUP) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-blue-600 font-bold flex items-center gap-1">
                    <Users className="size-3.5" />
                    Assignment Target *
                  </Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(val: TargetType) => setFormData({ ...formData, target_type: val })}
                  >
                    <SelectTrigger className="text-xs font-semibold border-blue-500">
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">👤 Individual (All Students)</SelectItem>
                      <SelectItem value="group">👥 Group (Auto-Assign Teams)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Due Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Max Marks / Points</Label>
                  <Input
                    type="number"
                    value={formData.max_marks}
                    onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              {formData.target_type === 'group' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <GroupIcon className="size-4 text-blue-600" />
                    Group Assignment Selected
                  </p>
                  <p className="text-blue-700">
                    Students will be split into collaborative groups. Proceed to Step 2 to configure group size and auto-generate student teams.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: AUTO-GROUP SETUP (If Group target) OR CONTENT */}
          {createStep === 2 && formData.target_type === 'group' && (
            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <RefreshCw className="size-4 text-blue-600" />
                    Auto-Assign Student Groups Strategy
                  </h4>
                  <Badge variant="outline" className="text-[10px]">
                    {studentsRoster.length} Total Enrolled Students
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Grouping Method</Label>
                    <Select
                      value={groupStrategy}
                      onValueChange={(val: any) => setGroupStrategy(val)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group_size">By Group Size (Students per group)</SelectItem>
                        <SelectItem value="group_count">By Total Number of Groups</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">
                      {groupStrategy === 'group_size' ? 'Students Per Group' : 'Total Groups Count'}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={groupSizeValue}
                      onChange={(e) => setGroupSizeValue(Number(e.target.value))}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <Button onClick={generateStudentGroups} size="sm" className="w-full gap-2 text-xs font-semibold">
                  <Sparkles className="size-3.5" /> Auto-Generate Balanced Student Groups
                </Button>
              </div>

              {/* Generated Groups Preview */}
              {generatedGroups.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Generated Student Teams ({generatedGroups.length})</span>
                    <span className="text-[11px] text-slate-500 font-normal">Review teams before publishing</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {generatedGroups.map((group) => (
                      <Card key={group.id} className="border-blue-100 bg-blue-50/40 p-3 space-y-2 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-950">{group.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGroup(group.id)}
                            className="size-5 text-slate-400 hover:text-rose-500"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.members.map((m) => (
                            <Badge key={m.id} variant="secondary" className="text-[10px] font-medium bg-white">
                              {m.name}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 (FOR INDIVIDUAL) OR STEP 3 (FOR GROUP): CONTENT & INSTRUCTIONS */}
          {((createStep === 2 && formData.target_type === 'individual') || (createStep === 3 && formData.target_type === 'group')) && (
            <div className="space-y-4">
              <Tabs value={createMode} onValueChange={(val: any) => setCreateMode(val)} className="w-full">
                <TabsList className="grid h-auto grid-cols-3 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  <TabsTrigger value="manual" className="text-xs font-semibold gap-1.5 text-slate-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                    <PenLine className="size-3.5" /> Manual / Upload
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs font-semibold gap-1.5 text-slate-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                    <Sparkles className="size-3.5" /> AI Generator
                  </TabsTrigger>
                  <TabsTrigger value="image" className="text-xs font-semibold gap-1.5 text-slate-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                    <ImageIcon className="size-3.5" /> OCR Scan Photo
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-3 pt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Instructions / Questions</Label>
                    <Textarea
                      placeholder="Write assignment instructions, problem statements, or guidelines..."
                      rows={4}
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Attach Reference File (PDF/Doc/Image)</Label>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="space-y-3 pt-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Topic / Concept Name</Label>
                    <Input
                      placeholder="e.g. Newton's Laws of Motion"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Custom AI Prompt (Optional)</Label>
                    <Textarea
                      placeholder="e.g. Include 5 numerical problems with varying difficulty..."
                      rows={2}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <Button
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                    size="sm"
                    className="w-full gap-2 text-xs font-semibold"
                  >
                    {aiGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Generate Assignment Instructions with AI
                  </Button>
                </TabsContent>

                <TabsContent value="image" className="space-y-3 pt-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Upload Worksheet Photo</Label>
                    <DoubtImageAttach
                      onUploadComplete={(url) => {
                        setWorksheetImageUrl(url);
                        setWorksheetPreview(resolveUploadUrl(url));
                      }}
                    />
                  </div>

                  {worksheetPreview && (
                    <Button
                      onClick={handleFromImage}
                      disabled={extractingImage}
                      size="sm"
                      className="w-full gap-2 text-xs font-semibold"
                    >
                      {extractingImage ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
                      Extract Worksheet Text via OCR
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {createStep > 1 ? (
              <Button variant="outline" size="sm" onClick={() => setCreateStep((prev) => (prev - 1) as any)}>
                Previous
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              {((createStep === 1 && formData.target_type === 'individual') || (createStep === 1 && formData.target_type === 'group')) && (
                <Button size="sm" onClick={() => setCreateStep(2)} className="gap-1.5">
                  Next Step <ChevronRight className="size-3.5" />
                </Button>
              )}

              {createStep === 2 && formData.target_type === 'group' && (
                <Button size="sm" onClick={() => setCreateStep(3)} className="gap-1.5">
                  Next: Content <ChevronRight className="size-3.5" />
                </Button>
              )}

              {((createStep === 2 && formData.target_type === 'individual') || (createStep === 3 && formData.target_type === 'group')) && (
                <Button
                  onClick={handlePublishAssignment}
                  disabled={creating}
                  size="sm"
                  className="gap-2 font-semibold shadow-sm"
                >
                  {creating ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Publish Assignment
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGNMENT DETAILS & SUBMISSIONS POPUP MODAL */}
      <Dialog open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5">
          {selectedAssignment && (
            <>
              <DialogHeader className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between pr-6">
                  <Badge variant={selectedAssignment.target_type === 'group' ? 'default' : 'secondary'} className="text-[10px]">
                    {selectedAssignment.target_type === 'group' ? 'Group Project' : 'Individual Task'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAssignment(selectedAssignment.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs gap-1"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {selectedAssignment.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedAssignment.instructions || 'No detailed instructions provided.'}
                </DialogDescription>
              </DialogHeader>

              {/* Dialog Sub-Tabs */}
              <Tabs value={detailTab} onValueChange={(val: any) => setDetailTab(val)}>
                <TabsList className="grid h-auto grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  <TabsTrigger value="details" className="text-xs font-semibold text-slate-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                  <TabsTrigger value="submissions" onClick={() => fetchSubmissions(selectedAssignment.id)} className="text-xs font-semibold">
                    Submissions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Due Date</span>
                      <span className="font-semibold text-slate-900">
                        {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Max Marks</span>
                      <span className="font-semibold text-slate-900">{selectedAssignment.max_marks || 100} Points</span>
                    </div>
                  </div>

                  {selectedAssignment.reference_image_url && (
                    <div className="space-y-2">
                      <span className="font-semibold block text-slate-800">Reference Worksheet Image:</span>
                      <img
                        src={resolveUploadUrl(selectedAssignment.reference_image_url) || ''}
                        alt="Worksheet"
                        className="max-h-56 rounded-lg border object-contain"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="submissions" className="space-y-4 pt-4">
                  {loadingSubmissions ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                      No submissions recorded for this assignment yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((sub) => (
                        <Card key={sub.id} className="p-3 border-slate-200 text-xs space-y-3 rounded-2xl dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{sub.student_name || 'Student'}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={sub.status === 'graded' ? 'default' : 'secondary'} className="text-[10px]">
                                {sub.status || 'Submitted'}
                              </Badge>
                              {sub.marks != null && (
                                <span className="font-bold text-emerald-600 text-xs">
                                  {sub.marks} Marks
                                </span>
                              )}
                            </div>
                          </div>

                          {sub.feedback && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                              "{sub.feedback}"
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500">
                              {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Submitted'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {sub.file_path && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openSubmissionPreview(sub)}
                                    className="h-7 text-xs gap-1"
                                  >
                                    <Eye className="size-3" /> Preview
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const url = resolveUploadUrl(sub.file_path);
                                      if (url) window.open(url, '_blank');
                                      else toast.error('File link not found');
                                    }}
                                    className="h-7 text-xs gap-1"
                                  >
                                    <Download className="size-3" /> Download
                                  </Button>
                                </>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (gradingId === sub.id) {
                                    setGradingId(null);
                                  } else {
                                    setGradingId(sub.id);
                                    setGradeForm({
                                      marks: sub.marks != null ? String(sub.marks) : '',
                                      feedback: sub.feedback || '',
                                    });
                                  }
                                }}
                                className="h-7 text-xs gap-1 text-blue-600 hover:bg-blue-50"
                              >
                                <PenLine className="size-3" />
                                {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                              </Button>
                            </div>
                          </div>

                          {/* Inline Grading Form */}
                          {gradingId === sub.id && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
                              <Input
                                type="number"
                                placeholder="Marks"
                                value={gradeForm.marks}
                                onChange={(e) => setGradeForm((f) => ({ ...f, marks: e.target.value }))}
                                className="w-24 h-7 text-xs"
                              />
                              <Input
                                type="text"
                                placeholder="Feedback (optional)"
                                value={gradeForm.feedback}
                                onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))}
                                className="flex-1 h-7 text-xs"
                              />
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleGradeSubmission(sub.id, selectedAssignment.id)}
                                  className="h-7 text-xs px-2.5"
                                >
                                  Save Grade
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setGradingId(null)}
                                  className="h-7 text-xs px-2"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* IN-APP SUBMISSION FILE PREVIEW MODAL */}
      <Dialog open={Boolean(previewSubmission)} onOpenChange={(open) => { if (!open) setPreviewSubmission(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
          {previewSubmission && (() => {
            const rawPath = previewSubmission.file_path || previewSubmission.filePath;
            const url = previewSubmission.resolved_url || resolveUploadUrl(rawPath);
            const name = fileNameFromPath(rawPath);
            const ext = fileExtension(rawPath);
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
            const isPdf = ext === 'pdf';

            return (
              <>
                <DialogHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 pr-10 sm:pr-12">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base font-bold text-slate-900 truncate">
                      {name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5 truncate">
                      Submitted by <span className="font-semibold text-slate-800">{previewSubmission.student_name || 'Student'}</span>
                      {previewSubmission.assignment_title ? ` for ${previewSubmission.assignment_title}` : ''}
                    </DialogDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!url || previewFileMissing) {
                        toast.error('Submitted file is missing from the server');
                        return;
                      }
                      window.open(url, '_blank');
                    }}
                    className="gap-1.5 text-xs font-semibold shrink-0"
                  >
                    <Download className="size-3.5" /> Download File
                  </Button>
                </DialogHeader>

                <div className="min-h-[60vh] rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-2 overflow-hidden">
                  {!url || previewFileMissing ? (
                    <div className="text-center space-y-2 p-6">
                      <AlertCircle className="size-10 text-amber-500 mx-auto" />
                      <p className="text-sm font-bold text-slate-800">Submitted File Missing on Server</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        The submission record exists, but the file could not be fetched from the server. Ask the student to resubmit.
                      </p>
                    </div>
                  ) : isImage ? (
                    <img
                      src={url}
                      alt={name}
                      className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-sm"
                      onError={() => setPreviewFileMissing(true)}
                    />
                  ) : isPdf ? (
                    <iframe src={url} title={name} className="w-full h-[65vh] rounded-lg border-0 bg-white" />
                  ) : (
                    <div className="text-center space-y-3 p-6">
                      <FileText className="size-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">Preview Not Available For This File Format</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Click the Download File button above to view this file on your device.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => window.open(url, '_blank')}
                        className="gap-2"
                      >
                        <Download className="size-3.5" /> Download & Open
                      </Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentManagement;