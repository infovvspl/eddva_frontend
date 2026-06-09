/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FileText, Upload, Sparkles, BookOpen, ChevronRight, ChevronLeft, Home, GraduationCap, Users, Layers, Plus, Trash2, BarChart3, ClipboardList, Target, Trophy
} from "lucide-react";
import AssessmentContentRenderer from "@/components/school/AssessmentContentRenderer";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Modal from "@/components/school/Modal";
import InputField from "@/components/school/InputField";
import SelectField from "@/components/school/SelectField";
import SearchBar from "@/components/school/SearchBar";
import DataTable from "@/components/school/DataTable";
import Tabs from "@/components/school/Tabs";
import api, { unwrapSchoolList } from "@/lib/api/school-client";
import { useAcademicStore } from "@/lib/academic-store";
import "./AssessmentSystem.css";

function normaliseType(value: any) {
  const type = String(value || "topic").trim().toLowerCase();
  if (type === "unit") return "chapter";
  if (["topic", "chapter", "subject", "mock", "final"].includes(type)) return type;
  return "topic";
}

function Breadcrumb({
  items,
}: {
  items: { label: string; icon?: React.ReactNode; onClick: () => void; active: boolean }[];
}) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 && <ChevronRight size={14} className="text-gray-300" />}
          <button
            type="button"
            onClick={item.onClick}
            disabled={item.active}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition-colors ${item.active
              ? "bg-brand-50 text-brand-700"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

function NavCard({
  icon,
  tone,
  title,
  meta,
  actionLabel,
  onClick,
}: {
  icon: React.ReactNode;
  tone: "brand" | "emerald";
  title: string;
  meta: string;
  actionLabel: string;
  onClick: () => void;
}) {
  const toneClasses =
    tone === "brand"
      ? { soft: "bg-brand-100", icon: "text-brand-600" }
      : { soft: "bg-emerald-100", icon: "text-emerald-600" };

  return (
    <GlassCard hover className="group cursor-pointer p-5 transition-all" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ${toneClasses.soft} ${toneClasses.icon}`}>{icon}</div>
      </div>
      <h4 className="mt-4 truncate text-lg font-bold text-gray-900">{title}</h4>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Users size={14} /> {meta}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className={`text-sm font-semibold ${toneClasses.icon}`}>{actionLabel}</span>
        <ChevronRight size={16} className="text-gray-400 transition-transform group-hover:translate-x-0.5" />
      </div>
    </GlassCard>
  );
}

function ContentEditor({
  questions,
  onQuestionsChange,
  answerKey,
  onAnswerKeyChange,
}: {
  questions: string;
  onQuestionsChange: (v: string) => void;
  answerKey: string;
  onAnswerKeyChange: (v: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "edit"
            ? "border-brand-500 text-brand-600 font-extrabold"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          ✏️ Edit Test
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "preview"
            ? "border-brand-500 text-brand-600 font-extrabold"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          👁️ Preview (Student View)
        </button>
      </div>

      {activeTab === "edit" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Question Paper pane */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 border-b border-blue-100">
              <FileText size={14} className="text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Question Paper</span>
              <span className="ml-auto text-[10px] text-blue-400 font-medium">Students will see this</span>
            </div>
            <textarea
              value={questions}
              onChange={(e) => onQuestionsChange(e.target.value)}
              placeholder="Type or paste the question paper here. Markdown supported (## Section A, 1. question, etc.)."
              className="h-[45vh] w-full resize-none p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Answer Key pane */}
          <div className="rounded-xl border border-amber-200 bg-white overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 border-b border-amber-100">
              <span className="text-sm">🔑</span>
              <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Answer Key</span>
              <span className="ml-auto text-[10px] text-amber-500 font-medium">Teacher only · hidden from students</span>
            </div>
            <textarea
              value={answerKey}
              onChange={(e) => onAnswerKeyChange(e.target.value)}
              placeholder="Type or paste the answer key here. E.g. Q1(a), Q2 True, Q3 ______"
              className="h-[45vh] w-full resize-none p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 overflow-hidden">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            <FileText size={14} />
            <span>Question Paper Preview (Student View)</span>
          </div>
          <div className="h-[45vh] overflow-y-auto rounded-lg bg-white p-6 border border-gray-100 shadow-inner">
            {questions.trim() ? (
              <AssessmentContentRenderer>{questions}</AssessmentContentRenderer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">The rendered question paper will appear here once questions are added.</p>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-amber-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
              <span>Answer Key Preview (Teacher Only)</span>
            </div>
            {answerKey.trim() ? (
              <AssessmentContentRenderer>{answerKey}</AssessmentContentRenderer>
            ) : (
              <p className="text-sm text-gray-400">The answer key preview will appear here once answers are added.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const AssessmentSystem: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { assignments, setAssignments } = useAcademicStore();
  const [loadingContext, setLoadingContext] = useState(true);

  // Navigation state
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const restoredState = (location.state as any)?.assessmentWorkspace;
    if (!restoredState) return;
    setSelectedClass(restoredState.selectedClass || null);
    setSelectedSection(restoredState.selectedSection || null);
    setSelectedSubject(restoredState.selectedSubject || null);
    setSearch('');
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // Assessment States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testsList, setTestsList] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [contentMode, setContentMode] = useState<"manual" | "upload" | "ai">("manual");
  const [contentText, setContentText] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiLanguage, setAiLanguage] = useState("en");
  const [aiConfig, setAiConfig] = useState({
    mcqCount: 5,
    trueFalseCount: 5,
    fillBlankCount: 5,
    shortCount: 3,
    longCount: 2,
    difficulty: "intermediate",
  });

  // Curriculum scope (optional) — chapter → topic for the selected subject
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    type: "topic",
    total_marks: 100,
    duration_minutes: 120,
    scheduled_date: "",
  });

  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState("all");

  // ── Load Context (source of truth for navigation) ────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (assignments.length > 0) {
          setLoadingContext(false);
          return;
        }
        const res = await api.get('/dashboard/stats');
        const tData = res.data?.data?.teacherData || res.data?.teacherData || {};
        if (!cancelled && Array.isArray(tData.assignments)) {
          setAssignments(tData.assignments);
        }
      } catch (err) {
        console.error('Failed to load teacher context', err);
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [assignments.length, setAssignments]);

  // Load chapters for the selected subject whenever the Create modal opens.
  useEffect(() => {
    if (!showCreateModal || !selectedSubject) return;
    let cancelled = false;
    setSelectedChapterId("");
    setSelectedTopicId("");
    setTopics([]);
    api.get(`/topics/chapters?subjectId=${selectedSubject.id}`)
      .then((res) => { if (!cancelled) setChapters(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setChapters([]); });
    return () => { cancelled = true; };
  }, [showCreateModal, selectedSubject]);

  // Load topics for the selected chapter
  useEffect(() => {
    setSelectedTopicId("");
    if (!selectedChapterId) { setTopics([]); return; }
    let cancelled = false;
    api.get(`/topics?chapterId=${selectedChapterId}`)
      .then((res) => { if (!cancelled) setTopics(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setTopics([]); });
    return () => { cancelled = true; };
  }, [selectedChapterId]);

  // ── Derived hierarchies ──────────────────────────────────────────────────
  const classes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sections: Set<string>; subjects: Set<string> }>();
    assignments.forEach((a: any) => {
      if (!a.classId) return;
      const entry = map.get(a.classId) ?? { id: a.classId, name: a.className, sections: new Set(), subjects: new Set() };
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
        const entry = map.get(a.sectionId) ?? { id: a.sectionId, name: a.sectionName, subjects: new Set() };
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

  const level = selectedSubject ? 'workspace' : selectedSection ? 'subjects' : selectedClass ? 'sections' : 'classes';

  const goToClasses = () => { setSelectedClass(null); setSelectedSection(null); setSelectedSubject(null); setSearch(''); setWorkspaceSearch(''); };
  const goToSections = () => { setSelectedSection(null); setSelectedSubject(null); setSearch(''); setWorkspaceSearch(''); };
  const goToSubjects = () => { setSelectedSubject(null); setSearch(''); setWorkspaceSearch(''); };
  const goBack = () => {
    if (level === 'workspace') goToSubjects();
    else if (level === 'subjects') goToSections();
    else if (level === 'sections') goToClasses();
  };

  // ── Data Fetching for Workspace ──────────────────────────────────────────
  const fetchTests = async () => {
    if (!selectedSubject) return;
    setLoadingTests(true);
    try {
      const res = await api.get("/assessments", {
        params: {
          classId: selectedClass?.id,
          subjectId: selectedSubject.id,
        },
      });
      const allAssessments = unwrapSchoolList(res);

      const formatted = allAssessments.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: normaliseType(item.assessment_type || item.type || "topic"),
        rawType: item.assessment_type || item.type || "topic", // original for debugging
        totalMarks: item.total_marks,
        duration: item.duration_minutes || "-",
        date: item.scheduled_at || item.scheduled_date
          ? new Date(item.scheduled_at || item.scheduled_date).toLocaleDateString()
          : "-",
        rawDate: item.scheduled_at || item.scheduled_date || "",
        class: selectedClass?.name || "-",
        status: item.status || (item.scheduled_at || item.scheduled_date
          ? new Date(item.scheduled_at || item.scheduled_date) > new Date() ? "upcoming" : "completed"
          : "draft"),
        submissions: 0,
        raw: item,
      }));

      setTestsList(formatted);
    } catch (err) {
      console.error("Fetch assessments error:", err);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    if (level === 'workspace') {
      fetchTests();
    }
  }, [level, selectedSubject]);

  const handleCreateTest = async () => {
    if (!formData.title.trim()) {
      alert("Please enter test title");
      return;
    }
    if (!formData.scheduled_date) {
      alert("Please select test date");
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: formData.title,
        type: formData.type,
        assessmentType: formData.type,
        subjectId: selectedSubject?.id,
        class_id: selectedClass?.id,
        sectionId: selectedSection?.id,
        total_marks: formData.total_marks,
        totalMarks: formData.total_marks,
        duration_minutes: formData.duration_minutes,
        durationMinutes: formData.duration_minutes,
        scheduled_date: formData.scheduled_date,
        scheduledAt: formData.scheduled_date,
        contentText,
        answerKey,
        contentSource: contentMode,
        chapterId: selectedChapterId || undefined,
        topicId: selectedTopicId || undefined,
        language: aiLanguage,
      };

      if (editingTest) {
        await api.put(`/assessments/${editingTest.id}`, payload);
      } else if (contentMode !== "upload" || !uploadFile) {
        await api.post("/assessments", payload);
      } else {
        const data = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) data.append(key, String(value));
        });
        data.append("file", uploadFile);
        await api.post("/assessments", data);
      }

      await fetchTests();
      setEditingTest(null);
      setShowCreateModal(false);
      setFormData({
        title: "",
        type: "topic",
        total_marks: 100,
        duration_minutes: 120,
        scheduled_date: "",
      });
      setContentMode("manual");
      setContentText("");
      setAnswerKey("");
      setUploadFile(null);
      setAiPrompt("");
      setAiLanguage("en");
    } catch (err) {
      console.error("Create assessment error:", err);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setAiLanguage(newLang);
    if (!contentText.trim() && !answerKey.trim()) return;

    const langLabel = newLang === 'hi' ? 'Hindi' : newLang === 'od' ? 'Odia' : 'English';
    const confirmed = window.confirm(`Do you want to translate the current question paper and answer key to ${langLabel}?`);
    if (!confirmed) return;

    setGeneratingAi(true);
    try {
      if (contentText.trim()) {
        const resQ = await api.post("/assessments/translate", {
          text: contentText,
          language: newLang,
        });
        const translatedQ = resQ.data?.data?.translatedText || resQ.data?.translatedText || contentText;
        setContentText(translatedQ);
      }
      if (answerKey.trim()) {
        const resA = await api.post("/assessments/translate", {
          text: answerKey,
          language: newLang,
        });
        const translatedA = resA.data?.data?.translatedText || resA.data?.translatedText || answerKey;
        setAnswerKey(translatedA);
      }
    } catch (err) {
      console.error("Translation error:", err);
      alert("Failed to translate the content. Please try again.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAiGenerate = async () => {
    setGeneratingAi(true);
    try {
      const chapterName = chapters.find((c: any) => c.id === selectedChapterId)?.name;
      const topicName = topics.find((t: any) => t.id === selectedTopicId)?.name;
      const res = await api.post("/assessments/ai-generate", {
        title: formData.title,
        type: formData.type,
        totalMarks: formData.total_marks,
        durationMinutes: formData.duration_minutes,
        className: selectedClass?.name,
        subjectName: selectedSubject?.name,
        chapterName,
        topicName,
        prompt: aiPrompt,
        mcqCount: aiConfig.mcqCount,
        trueFalseCount: aiConfig.trueFalseCount,
        fillBlankCount: aiConfig.fillBlankCount,
        shortCount: aiConfig.shortCount,
        longCount: aiConfig.longCount,
        difficulty: aiConfig.difficulty,
        language: aiLanguage,
      });
      const draft = res.data?.data || res.data || {};
      if (draft.title && !formData.title.trim()) {
        setFormData((current) => ({ ...current, title: draft.title }));
      }
      setContentText(draft.contentText || draft.content_text || "");
      setAnswerKey(draft.answerKey || draft.answer_key || "");
      setContentMode("ai");
    } catch (err) {
      console.error("AI assessment generation error:", err);
      alert("AI could not generate the assessment right now. Please use manual entry or upload.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const testColumns = [
    {
      key: "title",
      title: "Test Name",
      render: (v: string, row: any) => (
        <span
          className="text-brand-600 font-medium hover:underline cursor-pointer"
          onClick={() => navigate(`/school/teacher/assessments/${row.id}`, {
            state: {
              from: `${location.pathname}${location.search}`,
              assessmentWorkspace: {
                selectedClass,
                selectedSection,
                selectedSubject,
              },
            },
          })}
        >
          {v}
        </span>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (v: string) => {
        const labelMap: Record<string, string> = {
          topic: "Topic Test",
          chapter: "Chapter Test",
          subject: "Subject Test",
          mock: "Mock Test",
          final: "Final Exam",
        };
        const variantMap: Record<string, "error" | "warning" | "info" | "purple" | "success"> = {
          topic: "purple",
          chapter: "info",
          subject: "success",
          mock: "warning",
          final: "error",
        };
        return (
          <Badge variant={variantMap[v] ?? "purple"}>
            {labelMap[v] ?? v}
          </Badge>
        );
      },
    },
    { key: "totalMarks", title: "Total Marks" },
    { key: "duration", title: "Duration (mins)" },
    { key: "date", title: "Date" },
    {
      key: "status",
      title: "Status",
      render: (v: string) => (
        <Badge
          variant={
            v === "completed" ? "success" : v === "scheduled" || v === "upcoming" ? "info" : "warning"
          }
        >
          {v}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, row: any) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingTest(row);
              setFormData({
                title: row.title || "",
                type: row.type || "topic",
                total_marks: Number(row.totalMarks) || 100,
                duration_minutes: Number(row.duration) || 120,
                scheduled_date: row.rawDate ? String(row.rawDate).slice(0, 10) : "",
              });
              setContentText(row.raw?.content_text || row.raw?.contentText || "");
              setAnswerKey(row.raw?.answer_key || row.raw?.answerKey || "");
              setContentMode(row.raw?.content_source === "upload" ? "upload" : row.raw?.content_source === "ai" ? "ai" : "manual");
              setUploadFile(null);
              setAiPrompt("");
              setAiLanguage(row.raw?.language || "en");
              setShowCreateModal(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Trash2 size={14} />}
            onClick={async () => {
              const confirmed = window.confirm("Delete this assessment?");
              if (!confirmed) return;
              try {
                await api.delete(`/assessments/${row.id}`);
                fetchTests();
              } catch (err) {
                console.error(err);
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // ── Type label map (used for search matching against type) ──────────────
  const TYPE_LABEL_MAP: Record<string, string> = {
    topic: "topic test",
    chapter: "chapter test",
    subject: "subject test",
    mock: "mock test",
    final: "final exam",
  };

  /**
   * renderDataTable — 5-stage filter pipeline
   *
   * Stage 1  RAW ASSESSMENTS     — all records from API (logged in fetchTests)
   * Stage 2  AFTER WORKSPACE     — subject + class filter (applied in fetchTests, stored in testsList)
   * Stage 3  AFTER TYPE FILTER   — keep only records matching this tab's type
   * Stage 4  AFTER STATUS FILTER — apply Upcoming / Completed dropdown
   * Stage 5  AFTER SEARCH FILTER — case-insensitive match on title OR type label
   */
  const renderDataTable = (typeFilter: string | string[]) => {
    // Stage 2 — workspace-filtered list (fetchTests already applied subject+class)

    // Stage 3 — tab type filter
    const afterType = testsList.filter((t) =>
      Array.isArray(typeFilter) ? typeFilter.includes(t.type) : t.type === typeFilter
    );

    // Stage 4 — status dropdown filter
    const afterStatus = workspaceStatusFilter === "all"
      ? afterType
      : afterType.filter((t) => t.status === workspaceStatusFilter);

    // Stage 5 — search: title OR type label only (NOT status, marks, dates)
    const sq = workspaceSearch.trim().toLowerCase();
    const afterSearch = sq
      ? afterStatus.filter((t) => {
        const inTitle = (t.title ?? "").toLowerCase().includes(sq);
        const inType = (TYPE_LABEL_MAP[t.type] ?? t.type ?? "").toLowerCase().includes(sq);
        return inTitle || inType;
      })
      : afterStatus;

    const data = afterSearch;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loadingTests ? (
          <div className="py-12 text-center text-gray-400">Loading tests...</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center bg-gray-50 border-dashed border-gray-200">
            <Target size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No assessments found</h3>
            <p className="text-gray-500 mt-1 text-sm">
              {sq
                ? `No results for "${workspaceSearch}" in this tab.`
                : "Get started by creating your first test."}
            </p>
          </div >
        ) : (
          <DataTable columns={testColumns} data={data} />
        )}
      </div >
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Assessments
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Navigate through your assigned classes to manage assessments.
          </p>
        </div>
        {level !== 'classes' && (
          <Button variant="outline" size="sm" icon={<ChevronLeft size={16} />} onClick={goBack}>
            Back
          </Button>
        )}
      </div>

      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Classes', icon: <Home size={14} />, onClick: goToClasses, active: level === 'classes' },
          ...(selectedClass ? [{ label: selectedClass.name, onClick: goToSections, active: level === 'sections' }] : []),
          ...(selectedSection ? [{ label: `Section ${selectedSection.name}`, onClick: goToSubjects, active: level === 'subjects' }] : []),
          ...(selectedSubject ? [{ label: selectedSubject.name, onClick: () => { }, active: true }] : []),
        ]}
      />

      {/* Search Bar for Navigation Levels */}
      {level !== 'workspace' && (
        <div className="max-w-md mb-6">
          <SearchBar value={search} onChange={setSearch} placeholder={`Search ${level}...`} />
        </div>
      )}

      {/* Level 1: Classes */}
      {level === 'classes' && (
        loadingContext ? (
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
                meta={`${c.sections.size} section${c.sections.size === 1 ? '' : 's'} • ${c.subjects.size} subject${c.subjects.size === 1 ? '' : 's'}`}
                actionLabel="View sections"
                onClick={() => { setSelectedClass({ id: c.id, name: c.name }); setSearch(''); }}
              />
            ))}
          </div>
        )
      )}

      {/* Level 2: Sections */}
      {level === 'sections' && (
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
                title={`Section ${s.name}`}
                meta={`${s.subjects.size} subject${s.subjects.size === 1 ? '' : 's'}`}
                actionLabel="View subjects"
                onClick={() => { setSelectedSection({ id: s.id, name: s.name }); setSearch(''); }}
              />
            ))}
          </div>
        )
      )}

      {/* Level 3: Subjects */}
      {level === 'subjects' && (
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
                meta="Assessments Workspace"
                actionLabel="Open workspace"
                onClick={() => { setSelectedSubject({ id: s.id, name: s.name }); setSearch(''); }}
              />
            ))}
          </div>
        )
      )}

      {/* Level 4: Workspace */}
      {level === 'workspace' && selectedClass && selectedSubject && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Workspace</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedClass.name} | {selectedSubject.name}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                id="workspace-search"
                type="text"
                placeholder="Search by title or type..."
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none min-w-[210px]"
              />
              <select
                value={workspaceStatusFilter}
                onChange={(e) => setWorkspaceStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
              <Button
                icon={<Plus size={18} />}
                onClick={() => {
                  setFormData({ title: "", type: "topic", total_marks: 100, duration_minutes: 120, scheduled_date: "" });
                  setEditingTest(null);
                  setContentMode("manual");
                  setContentText("");
                  setAnswerKey("");
                  setUploadFile(null);
                  setAiPrompt("");
                  setAiLanguage("en");
                  setShowCreateModal(true);
                }}
                className="shadow-sm"
              >
                Create Test
              </Button>
            </div>
          </div>

          <Tabs
            tabs={[
              {
                id: "topic",
                label: "Topic Tests",
                icon: <ClipboardList size={16} />,
                // Matches records with type = "topic"
                content: renderDataTable("topic"),
              },
              {
                id: "chapter",
                label: "Chapter Tests",
                icon: <BarChart3 size={16} />,
                // Matches records with type = "chapter" OR legacy "unit"
                // (legacy "unit" is already normalised to "chapter" in formatted list)
                content: renderDataTable("chapter"),
              },
              {
                id: "subject",
                label: "Subject Tests",
                icon: <BookOpen size={16} />,
                // Matches records with type = "subject"
                content: renderDataTable("subject"),
              },
              {
                id: "mock",
                label: "Mock Tests",
                icon: <Trophy size={16} />,
                // Matches records with type = "mock"
                content: renderDataTable("mock"),
              },
              {
                id: "final",
                label: "Final Exams",
                icon: <Target size={16} />,
                // Matches records with type = "final"
                content: renderDataTable("final"),
              },
            ]}
          />
        </div>
      )}

      {/* Create Modal */}
      {selectedClass && selectedSubject && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={editingTest ? "Update Test" : "Create New Test"}
          size="full"
        >
          <div className="space-y-4 p-2">
            <div className="bg-brand-50 text-brand-700 p-3 rounded-lg text-sm border border-brand-100 mb-4">
              <strong>Context:</strong> Posting to {selectedClass.name}
              {selectedSection ? ` / Section ${selectedSection.name}` : ""} ({selectedSubject.name})
            </div>

            <InputField
              label="Test Title"
              placeholder="Enter test title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <SelectField
              label="Test Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: "topic", label: "Topic Test" },
                { value: "chapter", label: "Chapter Test" },
                { value: "subject", label: "Subject Test" },
                { value: "mock", label: "Mock Test" },
                { value: "final", label: "Final Exam" },
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Total Marks"
                type="number"
                placeholder="100"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
              />
              <InputField
                label="Duration (mins)"
                type="number"
                placeholder="120"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
              />
            </div>

            <InputField
              label="Date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            />

            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <label className="text-sm font-semibold text-gray-800">Assessment Content</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "manual", label: "Manual", icon: <FileText size={14} /> },
                  { id: "upload", label: "Upload", icon: <Upload size={14} /> },
                  { id: "ai", label: "AI", icon: <Sparkles size={14} /> },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setContentMode(mode.id as "manual" | "upload" | "ai")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${contentMode === mode.id
                      ? "border-brand-400 bg-white text-brand-700 shadow-sm"
                      : "border-gray-200 bg-gray-100 text-gray-500 hover:bg-white"
                      }`}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                ))}
              </div>

              {contentMode === "manual" && (
                <ContentEditor
                  questions={contentText}
                  onQuestionsChange={setContentText}
                  answerKey={answerKey}
                  onAnswerKeyChange={setAnswerKey}
                />
              )}

              {contentMode === "upload" && (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm"
                  />
                  {uploadFile ? (
                    <p className="text-xs font-semibold text-emerald-600">{uploadFile.name} selected</p>
                  ) : (
                    <p className="text-xs text-gray-500">Upload a PDF, document, text file, or question-paper image.</p>
                  )}
                  <ContentEditor
                    questions={contentText}
                    onQuestionsChange={setContentText}
                    answerKey={answerKey}
                    onAnswerKeyChange={setAnswerKey}
                  />
                </div>
              )}

              {contentMode === "ai" && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Question types &amp; counts</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {([
                      { key: "mcqCount", label: "MCQ (1 mark)" },
                      { key: "trueFalseCount", label: "True / False" },
                      { key: "fillBlankCount", label: "Fill in blanks" },
                      { key: "shortCount", label: "Short answer" },
                      { key: "longCount", label: "Long answer" },
                    ] as const).map((f) => (
                      <label key={f.key} className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                        {f.label}
                        <input
                          type="number"
                          min={0}
                          value={(aiConfig as any)[f.key]}
                          onChange={(e) => setAiConfig((c) => ({ ...c, [f.key]: Math.max(0, Number(e.target.value) || 0) }))}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </label>
                    ))}
                    <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                      Difficulty
                      <select
                        value={aiConfig.difficulty}
                        onChange={(e) => setAiConfig((c) => ({ ...c, difficulty: e.target.value }))}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="hard">Hard</option>
                      </select>
                    </label>

                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={2}
                    placeholder="Optional: extra instructions. Example: focus on French Revolution causes; include one map-based question."
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Button onClick={handleAiGenerate} disabled={generatingAi} icon={<Sparkles size={16} />}>
                    {generatingAi ? "Generating..." : "Generate Question Paper"}
                  </Button>
                  {/* Show two-pane editor once AI has generated content */}
                  {contentText && (
                    <ContentEditor
                      questions={contentText}
                      onQuestionsChange={setContentText}
                      answerKey={answerKey}
                      onAnswerKeyChange={setAnswerKey}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTest}>
                {editingTest ? "Update Test" : "Create Test"}
              </Button>
            </div>
          </div >
        </Modal >
      )}
    </div >
  );
};

// ── Presentational helpers ───────────────────────────────────────────────────

export default AssessmentSystem;
