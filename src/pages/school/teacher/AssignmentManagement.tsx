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
  sectionId?: string;
  sectionName?: string;
  className?: string;
}

interface QuestionItem {
  type: string;
  text: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string | null;
  explanation: string | null;
  marks: number;
  topicName: string | null;
  source: 'bank' | 'ai' | 'manual';
  sourceRef: string | null;
  // only on bank results
  assessmentTitle?: string;
}

interface PoolSection {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
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
  const [poolOptions, setPoolOptions] = useState<PoolSection[]>([]);
  const [poolSectionIds, setPoolSectionIds] = useState<string[]>([]);
  const [poolStudents, setPoolStudents] = useState<StudentMember[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [keepSectionsTogether, setKeepSectionsTogether] = useState(false);

  // Questions (picked from the question bank and/or generated by Eddva AI)
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [questionTab, setQuestionTab] = useState<'bank' | 'ai'>('bank');
  const [bankQuery, setBankQuery] = useState('');
  const [bankResults, setBankResults] = useState<QuestionItem[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [aiQTopic, setAiQTopic] = useState('');
  const [aiQCount, setAiQCount] = useState('5');
  const [aiQDifficulty, setAiQDifficulty] = useState('medium');
  const [aiQType, setAiQType] = useState('mcq_single');
  const [aiQMarks, setAiQMarks] = useState('1');
  const [aiQResults, setAiQResults] = useState<QuestionItem[]>([]);
  const [generatingQ, setGeneratingQ] = useState(false);
  const [detailQuestions, setDetailQuestions] = useState<any[]>([]);
  const questionTotal = useMemo(
    () => Math.round(questions.reduce((n, q) => n + (Number(q.marks) || 0), 0) * 100) / 100,
    [questions],
  );

  // Schedule & submission rules
  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>('now');
  const [startAt, setStartAt] = useState('');
  const [latePolicy, setLatePolicy] = useState<'allow' | 'block'>('allow');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  // Students who will receive the assignment (pool minus deselected students)
  const studentsRoster = useMemo(
    () => poolStudents.filter((st) => !excludedIds.has(st.id)),
    [poolStudents, excludedIds],
  );

  // Modals & Sheets
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<number>(1);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'details' | 'submissions' | 'groups' | 'analytics'>('details');
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradingAnswers, setGradingAnswers] = useState<any[]>([]);
  const [questionMarks, setQuestionMarks_] = useState<Record<string, string>>({});
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
  const [groupMode, setGroupMode] = useState<'balanced' | 'random' | 'manual'>('balanced');
  const [previewingGroups, setPreviewingGroups] = useState(false);

  // Saved groups of the assignment open in the detail dialog
  const [assignmentGroups, setAssignmentGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
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

  // Student pool: the sections this teacher may assign to, and the students in the chosen ones
  const buildPoolSections = (sectionIds: string[], options: PoolSection[] = poolOptions) =>
    options
      .filter((o) => sectionIds.includes(o.sectionId))
      .map((o) => ({ classId: o.classId, sectionId: o.sectionId }));

  const loadPoolStudents = async (sectionIds: string[], options: PoolSection[] = poolOptions) => {
    if (!sectionIds.length) {
      setPoolStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const res = await api.post('/assignments/pool/resolve', {
        pool: { sections: buildPoolSections(sectionIds, options) },
      });
      const raw = res.data?.data || res.data || [];
      setPoolStudents(
        raw.map((st: any) => ({
          id: String(st.id),
          name: st.name || 'Student',
          rollNo: st.rollNo || undefined,
          sectionId: st.sectionId,
          sectionName: st.sectionName,
          className: st.className,
        })),
      );
    } catch (err: any) {
      console.error('Failed to load student pool', err);
      setPoolStudents([]);
      toast.error(err?.response?.data?.message || 'Could not load the student list');
    } finally {
      setLoadingStudents(false);
    }
  };

  const initStudentPool = async () => {
    if (!selectedClass || !selectedSection) return;
    setLoadingStudents(true);
    try {
      const res = await api.get('/assignments/pool/options');
      const options: PoolSection[] = res.data?.data || res.data || [];
      setPoolOptions(options);
      const initial = [selectedSection.id];
      setPoolSectionIds(initial);
      await loadPoolStudents(initial, options);
    } catch (err: any) {
      console.error('Failed to load pool options', err);
      toast.error(err?.response?.data?.message || 'Could not load classes you can assign to');
      setLoadingStudents(false);
    }
  };

  const togglePoolSection = (sectionId: string) => {
    const next = poolSectionIds.includes(sectionId)
      ? poolSectionIds.filter((id) => id !== sectionId)
      : [...poolSectionIds, sectionId];
    setPoolSectionIds(next);
    setGeneratedGroups([]);
    void loadPoolStudents(next);
  };

  const toggleStudent = (studentId: string) => {
    setGeneratedGroups([]);
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  // Group Auto-Assign Logic (grouping runs on the server so balanced mode can use past scores)
  const generateStudentGroups = async () => {
    if (!selectedClass || !selectedSection) return;
    if (studentsRoster.length === 0) {
      toast.error("No students found in section to assign groups");
      return;
    }
    setPreviewingGroups(true);
    try {
      const res = await api.post('/assignments/groups/preview', {
        classId: selectedClass.id,
        sectionId: selectedSection.id,
        subjectId: selectedSubject?.id,
        pool: {
          sections: buildPoolSections(poolSectionIds),
          studentIds: studentsRoster.map((st) => st.id),
        },
        keepSectionsTogether,
        strategy: groupMode,
        ...(groupStrategy === 'group_size'
          ? { groupSize: Math.max(1, groupSizeValue) }
          : { groupCount: Math.max(1, groupSizeValue) }),
      });
      const data = res.data?.data || res.data;
      const groups: StudentGroup[] = (data?.groups || []).map((g: any) => ({
        id: `group-${g.groupNumber}`,
        name: g.name,
        members: g.members,
      }));
      setGeneratedGroups(groups);
      toast.success(
        groupMode === 'manual'
          ? `Created ${groups.length} empty groups - move students into them`
          : `Generated ${groups.length} student groups successfully!`,
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not generate groups');
    } finally {
      setPreviewingGroups(false);
    }
  };

  const unassignedStudents = useMemo(() => {
    const placed = new Set(generatedGroups.flatMap((g) => g.members.map((m) => m.id)));
    return studentsRoster.filter((s) => !placed.has(s.id));
  }, [generatedGroups, studentsRoster]);

  /** Move a student to another group, or back to "unassigned" (toGroupId = ''). */
  const moveStudent = (studentId: string, toGroupId: string) => {
    const student = studentsRoster.find((s) => s.id === studentId);
    if (!student) return;
    setGeneratedGroups((prev) =>
      prev.map((g) => {
        const without = g.members.filter((m) => m.id !== studentId);
        return g.id === toGroupId ? { ...g, members: [...without, student] } : { ...g, members: without };
      }),
    );
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
    setGroupMode('balanced');
    setPoolStudents([]);
    setPoolSectionIds([]);
    setExcludedIds(new Set());
    setKeepSectionsTogether(false);
    setPublishMode('now');
    setStartAt('');
    setLatePolicy('allow');
    setMaxAttempts('');
    setQuestions([]);
    setBankResults([]);
    setBankQuery('');
    setAiQResults([]);
    setAiQTopic('');
  };

  const openCreateModal = async () => {
    resetCreateForm();
    setShowCreateModal(true);
    await initStudentPool();
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
  const handlePublishAssignment = async (asDraft = false) => {
    if (!selectedClass || !selectedSection || !selectedSubject) {
      toast.error("Please select a Class, Section, and Subject first");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Assignment title is required");
      return;
    }
    if (studentsRoster.length === 0) {
      toast.error("Select at least one student in the Student Pool step");
      return;
    }
    if (questions.some((q) => !(Number(q.marks) > 0))) {
      toast.error("Every question needs marks greater than 0");
      return;
    }
    if (formData.target_type === 'group' && generatedGroups.every((g) => g.members.length === 0)) {
      toast.error("Please auto-generate or create at least one student group");
      return;
    }
    if (!asDraft && publishMode === 'scheduled') {
      if (!startAt) {
        toast.error("Choose when the assignment should be released");
        return;
      }
      if (new Date(startAt).getTime() <= Date.now()) {
        toast.error("The release time must be in the future");
        return;
      }
    }
    if (formData.due_date && publishMode === 'scheduled' && !asDraft && new Date(formData.due_date) <= new Date(startAt)) {
      toast.error("Due date must be after the release time");
      return;
    }
    if (formData.target_type === 'group' && unassignedStudents.length > 0) {
      const proceed = await confirm({
        title: 'Students without a group',
        message: `${unassignedStudents.length} student(s) are not in any group and will not receive this assignment. Publish anyway?`,
        confirmLabel: 'Publish anyway',
        cancelLabel: 'Go back',
      });
      if (!proceed) return;
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
      data.append(
        "pool",
        JSON.stringify({
          sections: buildPoolSections(poolSectionIds),
          studentIds: studentsRoster.map((st) => st.id),
        }),
      );
      data.append("max_marks", formData.max_marks || "100");
      data.append("publish_mode", asDraft ? "draft" : publishMode);
      if (questions.length) data.append("questions", JSON.stringify(questions));
      if (publishMode === 'scheduled' && startAt) data.append("start_at", new Date(startAt).toISOString());
      data.append("late_policy", latePolicy);
      if (maxAttempts) data.append("max_attempts", maxAttempts);
      if (formData.due_date) data.append("due_date", formData.due_date);
      if (formData.instructions) data.append("instructions", formData.instructions);
      if (selectedFile) data.append("file", selectedFile);
      if (worksheetImageUrl && !selectedFile) {
        data.append("reference_image_url", worksheetImageUrl);
      }
      if (formData.target_type === 'group') {
        data.append(
          "groups",
          JSON.stringify(
            generatedGroups
              .filter((g) => g.members.length > 0)
              .map((g) => ({ name: g.name, memberIds: g.members.map((m) => m.id) })),
          ),
        );
        data.append("group_strategy", groupMode);
        if (groupStrategy === 'group_size') data.append("group_size", String(groupSizeValue));
      }

      await api.post("/assignments", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (asDraft) {
        toast.success('Saved as draft - publish it from the assignment details when ready');
      } else if (publishMode === 'scheduled') {
        toast.success(`Assignment scheduled for ${new Date(startAt).toLocaleString()}`);
      } else toast.success(`Assignment published for ${formData.target_type === 'group' ? `${generatedGroups.filter((g) => g.members.length > 0).length} Groups` : 'All Students'}!`);
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

  const handlePublishDraft = async (assignment: any, scheduleAt?: string) => {
    try {
      await api.post(`/assignments/${assignment.id}/publish`, scheduleAt ? { start_at: new Date(scheduleAt).toISOString() } : {});
      toast.success(scheduleAt ? 'Assignment scheduled' : 'Assignment published to students');
      setDetailSheetOpen(false);
      setSelectedAssignment(null);
      await fetchWorkspaceAssignments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to publish assignment');
    }
  };

  const searchQuestionBank = async () => {
    setLoadingBank(true);
    try {
      const res = await api.get('/assignments/question-bank', {
        params: {
          subjectId: selectedSubject?.id,
          classId: selectedClass?.id,
          q: bankQuery.trim() || undefined,
        },
      });
      setBankResults(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not load the question bank');
    } finally {
      setLoadingBank(false);
    }
  };

  const generateAiQuestions = async () => {
    if (!aiQTopic.trim()) {
      toast.error('Enter a topic to generate questions for');
      return;
    }
    setGeneratingQ(true);
    try {
      const res = await api.post('/assignments/questions/generate', {
        topic: aiQTopic.trim(),
        count: Number(aiQCount) || 5,
        difficulty: aiQDifficulty,
        type: aiQType,
        marks: Number(aiQMarks) || 1,
        subjectName: selectedSubject?.name,
        subjectId: selectedSubject?.id,
        className: selectedClass?.name,
      });
      setAiQResults(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'AI could not generate questions');
    } finally {
      setGeneratingQ(false);
    }
  };

  const questionKey = (q: QuestionItem) => q.sourceRef || q.text.trim().toLowerCase();
  const isAdded = (q: QuestionItem) => questions.some((x) => questionKey(x) === questionKey(q));
  const addQuestions = (items: QuestionItem[]) => {
    const fresh = items.filter((q) => !isAdded(q));
    if (!fresh.length) return;
    setQuestions((prev) => [...prev, ...fresh.map(({ assessmentTitle, ...q }) => q as QuestionItem)]);
  };
  const removeQuestion = (index: number) => setQuestions((prev) => prev.filter((_, i) => i !== index));
  const moveQuestion = (index: number, dir: -1 | 1) =>
    setQuestions((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  const setQuestionMarks = (index: number, value: string) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, marks: Number(value) } : q)));

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

  const fetchAssignmentGroups = async (assignmentId: string) => {
    setLoadingGroups(true);
    try {
      const res = await api.get(`/assignments/${assignmentId}/groups`);
      setAssignmentGroups((res.data?.data || res.data)?.groups || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load assignment groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchAnalytics = async (assignmentId: string) => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get(`/assignments/${assignmentId}/analytics`);
      setAnalytics(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load assignment analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const openAssignmentDetail = (assignment: any, tab: 'details' | 'submissions' | 'groups' | 'analytics' = 'details') => {
    setSelectedAssignment(assignment);
    setDetailTab(tab);
    setDetailSheetOpen(true);
    setSubmissions([]);
    setAssignmentGroups([]);
    setAnalytics(null);
    setDetailQuestions([]);
    if (Number(assignment.question_count) > 0) {
      api
        .get(`/assignments/${assignment.id}/questions`)
        .then((res) => setDetailQuestions(res.data?.data || res.data || []))
        .catch(() => {});
    }
    setGradingId(null);
    setGradeForm({ marks: '', feedback: '' });
    if (tab === 'submissions') void fetchSubmissions(assignment.id);
    if (tab === 'groups') void fetchAssignmentGroups(assignment.id);
    if (tab === 'analytics') void fetchAnalytics(assignment.id);
  };

  const startGrading = async (sub: any, assignmentId?: string) => {
    if (gradingId === sub.id) {
      setGradingId(null);
      setGradingAnswers([]);
      return;
    }
    setGradingId(sub.id);
    setGradingAnswers([]);
    setQuestionMarks_({});
    setGradeForm({ marks: sub.marks != null ? String(sub.marks) : '', feedback: sub.feedback || '' });
    const aid = assignmentId || selectedAssignment?.id;
    if (!aid) return;
    try {
      const res = await api.get(`/assignments/${aid}/submissions/${sub.id}/answers`);
      const list: any[] = res.data?.data || res.data || [];
      setGradingAnswers(list);
      // Objective answers arrive graded; a blank written answer defaults to 0
      setQuestionMarks_(
        Object.fromEntries(
          list.map((q) => [q.id, q.marksAwarded != null ? String(q.marksAwarded) : q.answer ? '' : '0']),
        ),
      );
    } catch {
      /* assignment without questions - the plain marks box is used */
    }
  };

  const gradingTotal = useMemo(
    () => Math.round(gradingAnswers.reduce((n, q) => n + (Number(questionMarks[q.id]) || 0), 0) * 100) / 100,
    [gradingAnswers, questionMarks],
  );

  const renderGrader = () =>
    gradingAnswers.length === 0 ? null : (
      <div className="mb-2 space-y-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
        {gradingAnswers.map((q) => (
          <div key={q.id} className="space-y-1">
            <p className="font-semibold text-slate-900">
              {q.position}. {q.text} <span className="font-normal text-slate-400">[{q.marks}]</span>
            </p>
            {q.options?.length ? (
              <p className="text-slate-600">
                Student chose: <span className="font-semibold">{q.answer || 'no answer'}</span>
                {' · '}Correct: <span className="font-semibold text-emerald-700">{q.correctAnswer}</span>
              </p>
            ) : (
              <>
                <p className="rounded bg-slate-50 p-2 text-slate-700 whitespace-pre-wrap">{q.answer || 'No answer given'}</p>
                {q.correctAnswer && <p className="text-emerald-700">Model answer: {q.correctAnswer}</p>}
              </>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={q.marks}
                step={0.5}
                aria-label={`Marks for question ${q.position}`}
                value={questionMarks[q.id] ?? ''}
                onChange={(e) => setQuestionMarks_((m) => ({ ...m, [q.id]: e.target.value }))}
                className="h-7 w-20 text-xs"
              />
              <span className="text-slate-400">/ {q.marks}</span>
              {q.isCorrect != null && (
                <Badge variant="outline" className={`text-[10px] ${q.isCorrect ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700'}`}>
                  {q.isCorrect ? 'Auto: correct' : 'Auto: incorrect'}
                </Badge>
              )}
            </div>
          </div>
        ))}
        <p className="border-t border-slate-100 pt-2 text-right font-bold text-slate-900">
          Total: {gradingTotal} / {gradingAnswers.reduce((n, q) => n + Number(q.marks), 0)}
        </p>
      </div>
    );

  const handleGradeSubmission = async (submissionId: string, assignmentIdArg?: string) => {
    const assignmentId = assignmentIdArg || selectedAssignment?.id;
    if (!assignmentId) return;
    if (gradingAnswers.length > 0 && gradingAnswers.some((q) => (questionMarks[q.id] ?? '') === '')) {
      toast.error('Give marks for every question first');
      return;
    }
    try {
      await api.post(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
        ...(gradingAnswers.length > 0
          ? { questionMarks: gradingAnswers.map((q) => ({ questionId: q.id, marks: Number(questionMarks[q.id]) })) }
          : { marks: gradeForm.marks !== '' ? Number(gradeForm.marks) : undefined }),
        feedback: gradeForm.feedback || undefined,
      });
      setGradingAnswers([]);
      toast.success('Submission graded successfully');
      setGradingId(null);
      if (selectedAssignment?.id) await fetchSubmissions(selectedAssignment.id);
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
    return workspaceAssignments.filter((a) => a.target_type === 'group');
  }, [workspaceAssignments]);

  const stepKeys = useMemo(
    () => ['basics', 'pool', ...(formData.target_type === 'group' ? ['groups'] : []), 'content', 'questions', 'schedule', 'review'] as const,
    [formData.target_type],
  );
  const stepLabels: Record<string, string> = {
    basics: 'Basics & Target',
    pool: 'Student Pool',
    groups: 'Auto-Group Setup',
    content: 'Assignment Content',
    questions: 'Questions',
    schedule: 'Schedule',
    review: 'Review & Publish',
  };
  const currentStep = stepKeys[Math.min(createStep, stepKeys.length) - 1];

  // Real submission rate: submissions received / submissions expected (groups count once)
  const submissionRate = useMemo(() => {
    const expected = workspaceAssignments.reduce((n, a) => n + (Number(a.expected_count) || 0), 0);
    if (!expected) return null;
    const received = workspaceAssignments.reduce(
      (n, a) => n + Math.min(Number(a.submission_count) || 0, Number(a.expected_count) || 0),
      0,
    );
    return Math.round((received / expected) * 100);
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
            <div className="text-2xl font-bold text-slate-900">{submissionRate === null ? '-' : `${submissionRate}%`}</div>
            <Progress value={submissionRate ?? 0} className="h-1.5 mt-2 bg-emerald-100" />
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
                            <div className="flex items-center gap-1">
                              {a.status === 'draft' && <Badge variant="outline" className="text-[11px] border-amber-300 text-amber-700">Draft</Badge>}
                              {a.status === 'scheduled' && (
                                <Badge variant="outline" className="text-[11px] border-sky-300 text-sky-700">
                                  Scheduled{a.start_at ? ` · ${new Date(a.start_at).toLocaleDateString()}` : ''}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[11px] capitalize">
                                {a.type || 'Homework'}
                              </Badge>
                            </div>
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
                            onClick={() => startGrading(sub, sub.assignment_id || sub.assignmentId)}
                            className="h-8 gap-1 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            <PenLine className="size-3" />
                            {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                          </Button>
                        </div>

                        {gradingId === sub.id && (
                          <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
                            {renderGrader()}
                            {gradingAnswers.length === 0 && (
                              <Input
                                type="number"
                                placeholder="Marks"
                                value={gradeForm.marks}
                                onChange={(e) => setGradeForm((f) => ({ ...f, marks: e.target.value }))}
                                className="h-9 bg-white text-xs"
                              />
                            )}
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
                                onClick={() => handleGradeSubmission(sub.id, sub.assignment_id || sub.assignmentId)}
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
                                onClick={() => startGrading(sub, sub.assignment_id || sub.assignmentId)}
                                className="h-7 text-xs gap-1 text-primary hover:bg-primary/5"
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
                              {renderGrader()}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl ml-auto">
                                {gradingAnswers.length === 0 && (
                                <Input
                                  type="number"
                                  placeholder="Marks"
                                  value={gradeForm.marks}
                                  onChange={(e) => setGradeForm((f) => ({ ...f, marks: e.target.value }))}
                                  className="w-28 h-8 text-xs bg-white"
                                />
                                )}
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
                          <span className="font-semibold">{ga.group_count || 0} Student Groups Assigned</span>
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
          <div className="flex flex-wrap items-center justify-between gap-y-2 border-y border-slate-100 py-3 my-2 text-xs font-semibold">
            {stepKeys.map((key, i) => (
              <React.Fragment key={key}>
                {i > 0 && <ChevronRight className="size-4 text-slate-300" />}
                <span className={`flex items-center gap-1.5 ${createStep === i + 1 ? 'text-primary font-bold' : 'text-slate-400'}`}>
                  <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">{i + 1}</span>
                  {stepLabels[key]}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* STEP: STUDENT POOL */}
          {currentStep === 'pool' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  Who should receive this assignment?
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {poolOptions.map((o) => (
                    <label
                      key={o.sectionId}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={poolSectionIds.includes(o.sectionId)}
                        onChange={() => togglePoolSection(o.sectionId)}
                      />
                      <span className="font-medium text-slate-800">{o.className} · {formatSectionName(o.sectionName)}</span>
                    </label>
                  ))}
                  {poolOptions.length === 0 && !loadingStudents && (
                    <p className="text-xs text-muted-foreground">No classes available to assign.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <span className="text-xs font-bold text-slate-800">
                    {studentsRoster.length} of {poolStudents.length} students selected
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => { setGeneratedGroups([]); setExcludedIds(new Set()); }}
                    >
                      Select all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => { setGeneratedGroups([]); setExcludedIds(new Set(poolStudents.map((st) => st.id))); }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {loadingStudents ? (
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : poolStudents.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted-foreground">No students in the selected sections.</p>
                  ) : (
                    poolStudents.map((st) => (
                      <label key={st.id} className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!excludedIds.has(st.id)}
                          onChange={() => toggleStudent(st.id)}
                        />
                        <span className="flex-1 font-medium text-slate-800">{st.name}</span>
                        {st.rollNo && <span className="text-[10px] text-slate-400">#{st.rollNo}</span>}
                        {poolSectionIds.length > 1 && (
                          <Badge variant="outline" className="text-[10px]">
                            {st.className} {formatSectionName(st.sectionName)}
                          </Badge>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {formData.target_type === 'group' && poolSectionIds.length > 1 && (
                <label className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={keepSectionsTogether}
                    onChange={(e) => { setKeepSectionsTogether(e.target.checked); setGeneratedGroups([]); }}
                  />
                  <span>
                    <span className="font-semibold block">Keep students from each section together</span>
                    Groups are formed inside each section instead of mixing the whole pool.
                  </span>
                </label>
              )}
            </div>
          )}

          {/* STEP 1: BASICS & TARGET */}
          {currentStep === 'basics' && (
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
                  <p className="text-indigo-700">
                    Students will be split into collaborative groups. Proceed to Step 3 to configure group size and auto-generate student teams.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: AUTO-GROUP SETUP (If Group target) OR CONTENT */}
          {currentStep === 'groups' && (
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Distribution</Label>
                    <Select value={groupMode} onValueChange={(val: any) => setGroupMode(val)}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced (by past marks)</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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

                <Button
                  onClick={generateStudentGroups}
                  disabled={previewingGroups || loadingStudents}
                  size="sm"
                  className="w-full gap-2 text-xs font-semibold"
                >
                  {previewingGroups ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  {generatedGroups.length > 0
                    ? 'Regenerate Groups'
                    : groupMode === 'manual'
                      ? 'Create Empty Groups'
                      : groupMode === 'random'
                        ? 'Auto-Generate Random Student Groups'
                        : 'Auto-Generate Balanced Student Groups'}
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
                            <Badge key={m.id} variant="secondary" className="text-[10px] font-medium bg-white gap-1 pr-0.5">
                              {m.name}
                              <select
                                aria-label={`Move ${m.name}`}
                                value={group.id}
                                onChange={(e) => moveStudent(m.id, e.target.value)}
                                className="w-4 bg-transparent text-[10px] cursor-pointer"
                              >
                                {generatedGroups.map((g) => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                                <option value="">Unassign</option>
                              </select>
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {unassignedStudents.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2">
                      <span className="text-[11px] font-bold text-amber-900">
                        Not in any group ({unassignedStudents.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {unassignedStudents.map((m) => (
                          <Badge key={m.id} variant="secondary" className="text-[10px] font-medium bg-white gap-1 pr-0.5">
                            {m.name}
                            <select
                              aria-label={`Add ${m.name} to a group`}
                              value=""
                              onChange={(e) => e.target.value && moveStudent(m.id, e.target.value)}
                              className="w-4 bg-transparent text-[10px] cursor-pointer"
                            >
                              <option value="">Add to...</option>
                              {generatedGroups.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 (FOR INDIVIDUAL) OR STEP 3 (FOR GROUP): CONTENT & INSTRUCTIONS */}
          {currentStep === 'content' && (
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

          {/* STEP: QUESTIONS (optional) */}
          {currentStep === 'questions' && (
            <div className="space-y-4">
              <Tabs value={questionTab} onValueChange={(v: any) => setQuestionTab(v)}>
                <TabsList className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg">
                  <TabsTrigger value="bank" className="text-xs font-semibold">From question bank</TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs font-semibold gap-1.5">
                    <Sparkles className="size-3.5" /> Generate with Eddva AI
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bank" className="space-y-3 pt-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Search questions${selectedSubject ? ` in ${selectedSubject.name}` : ''}`}
                      value={bankQuery}
                      onChange={(e) => setBankQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchQuestionBank()}
                      className="text-xs"
                    />
                    <Button size="sm" onClick={searchQuestionBank} disabled={loadingBank} className="gap-1.5">
                      {loadingBank ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                      Search
                    </Button>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {bankResults.length === 0 ? (
                      <p className="p-4 text-center text-xs text-muted-foreground">
                        Search to browse questions from your school's saved papers.
                      </p>
                    ) : (
                      bankResults.map((q) => (
                        <div key={q.sourceRef || q.text} className="flex items-start justify-between gap-3 p-2.5 text-xs">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 line-clamp-2">{q.text}</p>
                            <p className="text-[11px] text-slate-500">
                              {q.assessmentTitle} · {q.type.replace('_', ' ')} · {q.marks} mark(s)
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" disabled={isAdded(q)} onClick={() => addQuestions([q])}>
                            {isAdded(q) ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="col-span-2 sm:col-span-4 space-y-1">
                      <Label className="text-[11px] font-semibold">Topic</Label>
                      <Input value={aiQTopic} onChange={(e) => setAiQTopic(e.target.value)} placeholder="e.g. Laws of Motion" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">How many</Label>
                      <Input type="number" min={1} max={20} value={aiQCount} onChange={(e) => setAiQCount(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Marks each</Label>
                      <Input type="number" min={1} value={aiQMarks} onChange={(e) => setAiQMarks(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Difficulty</Label>
                      <Select value={aiQDifficulty} onValueChange={setAiQDifficulty}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Type</Label>
                      <Select value={aiQType} onValueChange={setAiQType}>
                        <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq_single">Multiple choice</SelectItem>
                          <SelectItem value="short_answer">Short answer</SelectItem>
                          <SelectItem value="long_answer">Long answer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button size="sm" onClick={generateAiQuestions} disabled={generatingQ} className="w-full gap-2 text-xs font-semibold">
                    {generatingQ ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    {aiQResults.length ? 'Regenerate' : 'Generate questions'}
                  </Button>
                  {aiQResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">Review generated questions</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addQuestions(aiQResults)}>
                          Add all
                        </Button>
                      </div>
                      <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {aiQResults.map((q, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 p-2.5 text-xs">
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-medium text-slate-900">{q.text}</p>
                              {q.options?.map((o) => (
                                <p key={o.label} className={`pl-3 text-[11px] ${q.correctAnswer?.split(',').includes(o.label) ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                  ({o.label}) {o.text}
                                </p>
                              ))}
                            </div>
                            <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" disabled={isAdded(q)} onClick={() => addQuestions([q])}>
                              {isAdded(q) ? 'Added' : 'Add'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs">
                  <span className="font-bold text-slate-800">Selected questions ({questions.length})</span>
                  <span className="font-semibold text-slate-600">Total: {questionTotal} marks</span>
                </div>
                {questions.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    Optional. Without questions, students follow the instructions and upload their work.
                  </p>
                ) : (
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-200">
                    {questions.map((q, i) => (
                      <div key={`${questionKey(q)}-${i}`} className="flex items-start gap-2 p-2.5 text-xs">
                        <span className="mt-0.5 w-5 text-slate-400">{i + 1}.</span>
                        <p className="flex-1 min-w-0 font-medium text-slate-900 line-clamp-2">{q.text}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{q.source === 'ai' ? 'AI' : 'Bank'}</Badge>
                        <Input
                          type="number"
                          min={0.5}
                          step={0.5}
                          aria-label="Marks"
                          value={q.marks}
                          onChange={(e) => setQuestionMarks(i, e.target.value)}
                          className="h-7 w-16 text-xs"
                        />
                        <div className="flex shrink-0">
                          <Button variant="ghost" size="icon" className="size-7" disabled={i === 0} onClick={() => moveQuestion(i, -1)} aria-label="Move up">
                            <ChevronLeft className="size-3.5 rotate-90" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7" disabled={i === questions.length - 1} onClick={() => moveQuestion(i, 1)} aria-label="Move down">
                            <ChevronRight className="size-3.5 rotate-90" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7 text-slate-400 hover:text-rose-500" onClick={() => removeQuestion(i)} aria-label="Remove question">
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: SCHEDULE & SUBMISSION RULES */}
          {currentStep === 'schedule' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">When should students receive it?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([['now', 'Publish immediately'], ['scheduled', 'Schedule for later']] as const).map(([val, label]) => (
                    <label
                      key={val}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer ${publishMode === val ? 'border-primary bg-primary/5 font-semibold' : 'border-slate-200 bg-white'}`}
                    >
                      <input type="radio" name="publish-mode" checked={publishMode === val} onChange={() => setPublishMode(val)} />
                      {label}
                    </label>
                  ))}
                </div>
                {publishMode === 'scheduled' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Release date & time</Label>
                    <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="text-xs" />
                  </div>
                )}
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
                  <Label className="text-xs font-semibold">Late submissions</Label>
                  <Select value={latePolicy} onValueChange={(val: any) => setLatePolicy(val)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Accept and mark as late</SelectItem>
                      <SelectItem value="block">Close after the due date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Submission attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    placeholder="Unlimited"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Leave empty to allow unlimited re-submissions until graded.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: REVIEW */}
          {currentStep === 'review' && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200">
                {([
                  ['Title', formData.title || '-'],
                  ['Type', formData.type],
                  ['Subject', `${selectedSubject?.name ?? ''} · ${selectedClass?.name ?? ''} ${selectedSection ? formatSectionName(selectedSection.name) : ''}`],
                  ['Students', `${studentsRoster.length} across ${poolSectionIds.length} section(s)`],
                  ['Target', formData.target_type === 'group'
                    ? `Group - ${generatedGroups.filter((g) => g.members.length > 0).length} groups (${groupMode})`
                    : 'Individual'],
                  ['Release', publishMode === 'scheduled' && startAt ? new Date(startAt).toLocaleString() : 'Immediately'],
                  ['Due', formData.due_date ? new Date(formData.due_date).toLocaleString() : 'No deadline'],
                  ['Late submissions', latePolicy === 'allow' ? 'Accepted, marked late' : 'Closed after due date'],
                  ['Attempts', maxAttempts ? `${maxAttempts}` : 'Unlimited'],
                  ['Questions', questions.length ? `${questions.length} questions` : 'None attached'],
                  ['Max marks', questions.length ? String(questionTotal) : formData.max_marks || '100'],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 px-3 py-2">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-900 text-right">{value}</span>
                  </div>
                ))}
              </div>
              {formData.target_type === 'group' && unassignedStudents.length > 0 && (
                <p className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="size-3.5" />
                  {unassignedStudents.length} student(s) are not in any group and will not receive this assignment.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {createStep > 1 ? (
              <Button variant="outline" size="sm" onClick={() => setCreateStep((prev) => prev - 1)}>
                Previous
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>

              {currentStep !== 'review' && (
                <Button
                  size="sm"
                  disabled={
                    (currentStep === 'pool' && (loadingStudents || studentsRoster.length === 0)) ||
                    (currentStep === 'schedule' && publishMode === 'scheduled' && !startAt)
                  }
                  onClick={() => setCreateStep((prev) => prev + 1)}
                  className="gap-1.5"
                >
                  {currentStep === 'groups' ? 'Next: Content' : 'Next Step'} <ChevronRight className="size-3.5" />
                </Button>
              )}

              {currentStep === 'review' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handlePublishAssignment(true)}
                    disabled={creating}
                    size="sm"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handlePublishAssignment(false)}
                    disabled={creating}
                    size="sm"
                    className="gap-2 font-semibold shadow-xs"
                  >
                    {creating ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    {publishMode === 'scheduled' ? 'Schedule Assignment' : 'Publish Assignment'}
                  </Button>
                </>
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
                <TabsList className={`grid ${selectedAssignment.target_type === 'group' ? 'grid-cols-4' : 'grid-cols-3'} bg-slate-100 p-1 rounded-lg`}>
                  <TabsTrigger value="details" className="text-xs font-semibold">Overview</TabsTrigger>
                  <TabsTrigger value="submissions" onClick={() => fetchSubmissions(selectedAssignment.id)} className="text-xs font-semibold">
                    Submissions
                  </TabsTrigger>
                  {selectedAssignment.target_type === 'group' && (
                    <TabsTrigger value="groups" onClick={() => fetchAssignmentGroups(selectedAssignment.id)} className="text-xs font-semibold">
                      Groups
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="analytics" onClick={() => fetchAnalytics(selectedAssignment.id)} className="text-xs font-semibold">
                    Analytics
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
                    <div>
                      <span className="text-slate-400 block text-[11px]">Late submissions</span>
                      <span className="font-semibold text-slate-900">
                        {selectedAssignment.late_policy === 'block' ? 'Closed after due date' : 'Accepted, marked late'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Attempts</span>
                      <span className="font-semibold text-slate-900">{selectedAssignment.max_attempts || 'Unlimited'}</span>
                    </div>
                  </div>

                  {detailQuestions.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-semibold block text-slate-800">
                        Questions ({detailQuestions.length})
                      </span>
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {detailQuestions.map((q) => (
                          <div key={q.id} className="p-2.5 space-y-0.5">
                            <p className="font-medium text-slate-900">
                              {q.position}. {q.text} <span className="font-normal text-slate-400">[{q.marks}]</span>
                            </p>
                            {q.options?.map((o: any) => (
                              <p key={o.label} className={`pl-3 text-[11px] ${q.correctAnswer?.split(',').includes(o.label) ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                ({o.label}) {o.text}
                              </p>
                            ))}
                            {!q.options && q.correctAnswer && (
                              <p className="pl-3 text-[11px] text-emerald-700">Model answer: {q.correctAnswer}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedAssignment.status === 'draft' || selectedAssignment.status === 'scheduled') && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <span className="text-amber-900">
                        {selectedAssignment.status === 'draft'
                          ? 'This draft is not visible to students yet.'
                          : `Scheduled for ${selectedAssignment.start_at ? new Date(selectedAssignment.start_at).toLocaleString() : 'later'}.`}
                      </span>
                      <Button size="sm" onClick={() => handlePublishDraft(selectedAssignment)}>
                        Publish now
                      </Button>
                    </div>
                  )}

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

                <TabsContent value="analytics" className="space-y-4 pt-4 text-xs">
                  {loadingAnalytics || !analytics ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {([
                          ['Submitted', `${analytics.summary.submitted}/${analytics.summary.total}`, analytics.summary.submissionRate != null ? `${analytics.summary.submissionRate}% of ${analytics.unitLabel}` : ''],
                          ['Pending', String(analytics.summary.pending), `not yet submitted`],
                          ['Evaluated', `${analytics.summary.evaluated}/${analytics.summary.submitted}`, `${analytics.summary.awaitingEvaluation} awaiting grading`],
                          ['Late', String(analytics.summary.late), 'submitted after due date'],
                        ] as const).map(([label, value, hint]) => (
                          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                            <span className="block text-[11px] text-slate-500">{label}</span>
                            <span className="block text-xl font-bold text-slate-900">{value}</span>
                            <span className="block text-[10px] text-slate-400">{hint}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        {([
                          ['Average', analytics.summary.avgMarks, analytics.summary.avgPercent != null ? `${analytics.summary.avgPercent}%` : ''],
                          ['Highest', analytics.summary.highest, ''],
                          ['Lowest', analytics.summary.lowest, ''],
                        ] as const).map(([label, value, hint]) => (
                          <div key={label}>
                            <span className="block text-[11px] text-slate-500">{label} (out of {analytics.assignment.maxMarks})</span>
                            <span className="block text-base font-bold text-slate-900">
                              {value ?? '-'} {hint && <span className="text-[11px] font-medium text-slate-500">({hint})</span>}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-semibold text-slate-800">Score distribution</span>
                        {(() => {
                          const peak = Math.max(1, ...analytics.distribution.map((d: any) => d.count));
                          return analytics.distribution.map((d: any) => (
                            <div key={d.label} className="flex items-center gap-2">
                              <span className="w-14 text-[11px] text-slate-500">{d.label}</span>
                              <div className="h-3 flex-1 rounded bg-slate-100">
                                <div className="h-3 rounded bg-primary" style={{ width: `${(d.count / peak) * 100}%` }} />
                              </div>
                              <span className="w-6 text-right text-[11px] font-semibold text-slate-700">{d.count}</span>
                            </div>
                          ));
                        })()}
                      </div>

                      {analytics.questionLevel && (
                        <>
                          {analytics.questionLevel.topics.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="font-semibold text-slate-800">Topic performance</span>
                              {analytics.questionLevel.topics.map((t: any) => (
                                <div key={t.topic} className="flex items-center gap-2">
                                  <span className="w-32 truncate text-[11px] text-slate-600" title={t.topic}>{t.topic}</span>
                                  <div className="h-3 flex-1 rounded bg-slate-100">
                                    <div
                                      className={`h-3 rounded ${t.weak ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(100, t.avgPercent ?? 0)}%` }}
                                    />
                                  </div>
                                  <span className="w-20 text-right text-[11px] font-semibold text-slate-700">
                                    {t.avgPercent != null ? `${t.avgPercent}%` : '-'}{t.weak ? ' · weak' : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <span className="font-semibold text-slate-800">Question-wise performance</span>
                            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                              {analytics.questionLevel.questions.map((q: any) => (
                                <div key={q.id} className="px-3 py-2 space-y-0.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <span className="font-medium text-slate-900 line-clamp-2">{q.position}. {q.text}</span>
                                    <span className="shrink-0 font-bold text-slate-800">
                                      {q.correctPercent != null ? `${q.correctPercent}% correct` : q.avgPercent != null ? `${q.avgPercent}% avg` : 'Not graded'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {q.topicName || 'General'} · {q.marks} mark(s) · {q.attempts - q.skipped}/{q.attempts} answered
                                    {q.mostChosenWrong ? ` · most chosen wrong option: ${q.mostChosenWrong}` : ''}
                                  </p>
                                  {q.optionCounts && (
                                    <p className="text-[11px] text-slate-400">
                                      {Object.entries(q.optionCounts).map(([label, n]) => `${label}: ${n}`).join('   ')}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="space-y-1.5">
                        <span className="font-semibold text-slate-800">
                          {analytics.unitLabel === 'groups' ? 'Group-wise performance' : 'Student-wise status'}
                        </span>
                        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-64 overflow-y-auto">
                          {analytics.units.length === 0 ? (
                            <p className="p-4 text-center text-muted-foreground">Nobody has been assigned yet.</p>
                          ) : (
                            analytics.units.map((u: any) => (
                              <div key={u.id} className="flex items-center justify-between gap-3 px-3 py-2">
                                <div className="min-w-0">
                                  <span className="block font-semibold text-slate-900 truncate">{u.name}</span>
                                  {u.members?.length > 0 && (
                                    <span className="block text-[11px] text-slate-500 truncate">{u.members.join(', ')}</span>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  {u.isLate && u.status !== 'pending' && (
                                    <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-700">Late</Badge>
                                  )}
                                  {u.marks != null && (
                                    <span className="font-bold text-emerald-600">{u.marks}{u.percent != null ? ` (${u.percent}%)` : ''}</span>
                                  )}
                                  <Badge variant={u.status === 'graded' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                                    {u.status === 'graded' ? 'Graded' : u.status === 'submitted' ? 'Submitted' : 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="groups" className="space-y-3 pt-4">
                  {loadingGroups ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : assignmentGroups.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      No groups found for this assignment.
                    </div>
                  ) : (
                    assignmentGroups.map((g) => (
                      <Card key={g.id} className="p-3 border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{g.name}</span>
                          <Badge
                            variant={g.submission?.status === 'graded' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {g.submission ? (g.submission.status === 'graded' ? `Graded${g.submission.marks != null ? ` - ${g.submission.marks}` : ''}` : 'Submitted') : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {g.members.map((m: any) => (
                            <Badge key={m.id} variant="secondary" className="text-[10px] font-medium bg-white">
                              {m.name}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))
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
                            <span className="font-bold text-slate-900">
                              {sub.group_name ? `${sub.group_name} (submitted by ${sub.student_name || 'Student'})` : (sub.student_name || 'Student')}
                            </span>
                            <div className="flex items-center gap-2">
                              {sub.is_late && <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-700">Late</Badge>}
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
                                onClick={() => startGrading(sub, selectedAssignment?.id)}
                                className="h-7 text-xs gap-1 text-primary hover:bg-primary/5"
                              >
                                <PenLine className="size-3" />
                                {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                              </Button>
                            </div>
                          </div>

                          {/* Inline Grading Form */}
                          {gradingId === sub.id && (
                            <div className="pt-2 border-t border-slate-100">
                            {renderGrader()}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              {gradingAnswers.length === 0 && (
                              <Input
                                type="number"
                                placeholder="Marks"
                                value={gradeForm.marks}
                                onChange={(e) => setGradeForm((f) => ({ ...f, marks: e.target.value }))}
                                className="w-24 h-7 text-xs"
                              />
                              )}
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