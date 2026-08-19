/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConfirm } from "@/context/ConfirmContext";
import {
  FileText, Key, Upload, Sparkles, BookOpen, ChevronRight, ChevronLeft, Home, GraduationCap, Users, Layers, Plus, Trash2, BarChart3, ClipboardList, Target, Trophy
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
import { CustomSelect } from "@/components/ui/CustomSelect";

function normaliseType(value: any) {
  const type = String(value || "topic").trim().toLowerCase();
  if (type === "unit") return "chapter";
  if (["topic", "chapter", "subject", "mock", "final"].includes(type)) return type;
  return "topic";
}

// Question mark weights used by the AI generator (matches the backend's
// hardcoded per-section values: MCQ/True-False/Fill-blank = 1 mark, Short
// answer = 3 marks, Long answer = 5 marks).
const QUESTION_MARK_WEIGHTS = { mcq: 1, trueFalse: 1, fillBlank: 1, short: 3, long: 5 } as const;

function computeAiConfigTotal(counts: { mcqCount: number; trueFalseCount: number; fillBlankCount: number; shortCount: number; longCount: number }) {
  return (
    counts.mcqCount * QUESTION_MARK_WEIGHTS.mcq +
    counts.trueFalseCount * QUESTION_MARK_WEIGHTS.trueFalse +
    counts.fillBlankCount * QUESTION_MARK_WEIGHTS.fillBlank +
    counts.shortCount * QUESTION_MARK_WEIGHTS.short +
    counts.longCount * QUESTION_MARK_WEIGHTS.long
  );
}

/**
 * Suggests question counts per section that sum EXACTLY to `total`, using a
 * sensible CBSE-style weightage (~30% long answer, ~25% short answer, the
 * remainder split evenly across the three 1-mark objective types). Any
 * rounding residue is absorbed by the 1-mark categories, which can always
 * make the sum land exactly on `total` since they have the finest granularity.
 */
function distributeMarksForTotal(total: number) {
  const t = Math.max(0, Math.round(total || 0));
  if (t === 0) return { mcqCount: 0, trueFalseCount: 0, fillBlankCount: 0, shortCount: 0, longCount: 0 };

  let longCount = Math.round((t * 0.3) / QUESTION_MARK_WEIGHTS.long);
  let shortCount = Math.round((t * 0.25) / QUESTION_MARK_WEIGHTS.short);
  let remaining = t - longCount * QUESTION_MARK_WEIGHTS.long - shortCount * QUESTION_MARK_WEIGHTS.short;

  // Small totals: long/short weighting alone can overshoot — scale back
  // before touching the 1-mark categories.
  while (remaining < 0 && (longCount > 0 || shortCount > 0)) {
    if (longCount > 0) { longCount -= 1; remaining += QUESTION_MARK_WEIGHTS.long; }
    else { shortCount -= 1; remaining += QUESTION_MARK_WEIGHTS.short; }
  }

  const base = Math.floor(remaining / 3);
  const leftover = remaining - base * 3;
  const mcqCount = base + (leftover > 0 ? 1 : 0);
  const trueFalseCount = base + (leftover > 1 ? 1 : 0);
  const fillBlankCount = base;

  return { mcqCount, trueFalseCount, fillBlankCount, shortCount, longCount };
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
    <GlassCard hover className="group cursor-pointer p-3.5 sm:p-5 transition-all flex flex-col justify-between h-full" onClick={onClick}>
      <div>
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-2.5 ${toneClasses.soft} ${toneClasses.icon} [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-[22px] sm:[&>svg]:h-[22px]`}>{icon}</div>
        </div>
        <h4 className="mt-3 sm:mt-4 truncate text-sm sm:text-lg font-bold text-gray-900" title={title}>{title}</h4>
        <p className="mt-1 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-gray-500">
          <Users size={14} className="shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate">{meta}</span>
        </p>
      </div>
      <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-gray-100 pt-2.5 sm:pt-3">
        <span className={`text-xs sm:text-sm font-semibold ${toneClasses.icon}`}>{actionLabel}</span>
        <ChevronRight size={16} className="text-gray-400 transition-transform group-hover:translate-x-0.5 shrink-0 hidden sm:block" />
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
  const [editorPage, setEditorPage] = useState<"questions" | "answerKey">("questions");

  return (
    <div className="space-y-4">
      {/* Header Tabs & Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 gap-2 pb-1">
        <div className="flex border-b border-transparent">
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

        {/* Quick Page Switcher Buttons */}
        <div className="flex items-center gap-2 pb-1">
          {editorPage === "questions" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold"
              icon={<Key size={14} />}
              onClick={() => setEditorPage("answerKey")}
            >
              Answer Key Page →
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-brand-300 bg-blue-50 text-brand-700 hover:bg-blue-100 font-bold"
              icon={<FileText size={14} />}
              onClick={() => setEditorPage("questions")}
            >
              ← Question Paper Page
            </Button>
          )}
        </div>
      </div>

      {activeTab === "edit" ? (
        <div>
          {editorPage === "questions" ? (
            /* Question Paper Page */
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between bg-blue-50 px-4 py-2.5 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Question Paper Page</span>
                  <span className="text-[10px] text-blue-400 font-medium hidden sm:inline">(Students will see this)</span>
                </div>
              </div>
              <textarea
                value={questions}
                onChange={(e) => onQuestionsChange(e.target.value)}
                placeholder="Type or paste the question paper here. Markdown supported (## Section A, 1. question, etc.)."
                className="h-[45vh] w-full resize-none p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ) : (
            /* Answer Key Page */
            <div className="rounded-xl border border-amber-200 bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between bg-amber-50 px-4 py-2.5 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Answer Key Page</span>
                  <span className="text-[10px] text-amber-500 font-medium hidden sm:inline">(Teacher only · hidden from students)</span>
                </div>
              </div>
              <textarea
                value={answerKey}
                onChange={(e) => onAnswerKeyChange(e.target.value)}
                placeholder="Type or paste the answer key here. E.g. Q1(a), Q2 True, Q3 ______"
                className="h-[45vh] w-full resize-none p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 overflow-hidden">
          {editorPage === "questions" ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <FileText size={14} />
                  <span>Question Paper Preview (Student View)</span>
                </div>
              </div>
              <div className="h-[45vh] overflow-y-auto rounded-lg bg-white p-6 border border-gray-100 shadow-inner">
                {questions.trim() ? (
                  <AssessmentContentRenderer>{questions}</AssessmentContentRenderer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">The rendered question paper will appear here once questions are added.</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                  <Key size={14} />
                  <span>Answer Key Preview (Teacher Only)</span>
                </div>
              </div>
              <div className="h-[45vh] overflow-y-auto rounded-lg bg-white p-6 border border-amber-100 shadow-inner">
                {answerKey.trim() ? (
                  <AssessmentContentRenderer>{answerKey}</AssessmentContentRenderer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">The answer key preview will appear here once answers are added.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useSchoolFeature } from "@/hooks/use-school-feature";

const AssessmentSystem: React.FC = () => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();
  const hasAiAssessments = useSchoolFeature('ai', 'ai_content_generator_assessments');
  const hasTranslation = useSchoolFeature('ai', 'ai_translation');
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
    if (restoredState.selectedClass) setSelectedClass(restoredState.selectedClass);
    if (restoredState.selectedSection) setSelectedSection(restoredState.selectedSection);
    if (restoredState.selectedSubject) setSelectedSubject(restoredState.selectedSubject);
    setSearch('');
  }, [location.state]);

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

  // Keep AI question-type counts in sync with Total Marks so the generated
  // paper's actual marks always match what the teacher set — editing a count
  // by hand afterward is still possible, it just won't auto-recompute again
  // until Total Marks itself changes.
  useEffect(() => {
    setAiConfig((current) => ({ ...current, ...distributeMarksForTotal(formData.total_marks) }));
  }, [formData.total_marks]);

  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState("all");
  const [activeTabId, setActiveTabId] = useState("topic");

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
  // When editing an existing chapter/topic test, preselect its saved chapter.
  useEffect(() => {
    if (!showCreateModal || !selectedSubject) return;
    let cancelled = false;
    setSelectedChapterId(editingTest?.raw?.chapter_id || "");
    setTopics([]);
    api.get(`/topics/chapters?subjectId=${selectedSubject.id}`)
      .then((res) => { if (!cancelled) setChapters(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setChapters([]); });
    return () => { cancelled = true; };
  }, [showCreateModal, selectedSubject, editingTest]);

  // Load topics for the selected chapter.
  // When editing an existing topic test whose chapter matches, preselect its saved topic.
  useEffect(() => {
    if (!selectedChapterId) { setTopics([]); setSelectedTopicId(""); return; }
    setSelectedTopicId(
      editingTest?.raw?.chapter_id === selectedChapterId ? (editingTest?.raw?.topic_id || "") : ""
    );
    let cancelled = false;
    api.get(`/topics?chapterId=${selectedChapterId}`)
      .then((res) => { if (!cancelled) setTopics(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setTopics([]); });
    return () => { cancelled = true; };
  }, [selectedChapterId, editingTest]);

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
          type: activeTabId,
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
        status: (() => {
          const status = (item.status || "scheduled").toLowerCase();
          if (status === "scheduled" || status === "upcoming" || status === "completed") {
            const dateVal = item.scheduled_at || item.scheduled_date;
            if (dateVal) {
              return new Date(dateVal) > new Date() ? "upcoming" : "completed";
            }
          }
          return status;
        })(),
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
  }, [level, selectedSubject, activeTabId]);

  const [submittingTest, setSubmittingTest] = useState(false);

  const handleCreateTest = async () => {
    if (submittingTest) return;
    if (!formData.title.trim()) {
      alert("Please enter test title");
      return;
    }
    if (!formData.scheduled_date) {
      alert("Please select test date");
      return;
    }
    if ((formData.type === "chapter" || formData.type === "topic") && !selectedChapterId) {
      alert("Please select a chapter");
      return;
    }
    if (formData.type === "topic" && !selectedTopicId) {
      alert("Please select a topic");
      return;
    }

    // Only carry chapter/topic scope for the test types that need it, even if a
    // prior selection lingers in state from switching the Test Type dropdown.
    const needsChapter = formData.type === "chapter" || formData.type === "topic";
    const needsTopic = formData.type === "topic";

    setSubmittingTest(true);
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
        chapterId: needsChapter ? selectedChapterId : undefined,
        topicId: needsTopic ? selectedTopicId : undefined,
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
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    if (!hasTranslation) {
      alert("AI Translation is disabled for this institution.");
      return;
    }
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
    // Guard against generating ungrounded content: for Chapter/Topic tests,
    // the AI prompt is scoped by these names, so a missing selection here
    // used to silently fall back to the class name / a generic string.
    if ((formData.type === "chapter" || formData.type === "topic") && !selectedChapterId) {
      alert("Please select a chapter above before generating questions.");
      return;
    }
    if (formData.type === "topic" && !selectedTopicId) {
      alert("Please select a topic above before generating questions.");
      return;
    }

    setGeneratingAi(true);
    try {
      const needsChapter = formData.type === "chapter" || formData.type === "topic";
      const needsTopic = formData.type === "topic";
      const chapterName = needsChapter ? chapters.find((c: any) => c.id === selectedChapterId)?.name : undefined;
      const topicName = needsTopic ? topics.find((t: any) => t.id === selectedTopicId)?.name : undefined;
      const res = await api.post("/assessments/ai-generate", {
        title: formData.title,
        type: formData.type,
        totalMarks: formData.total_marks,
        durationMinutes: formData.duration_minutes,
        classId: selectedClass?.id,
        className: selectedClass?.name,
        subjectId: selectedSubject?.id,
        subjectName: selectedSubject?.name,
        chapterId: needsChapter ? selectedChapterId : undefined,
        chapterName,
        topicId: needsTopic ? selectedTopicId : undefined,
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
              const confirmed = await confirm({
                title: "Confirm Delete",
                message: "Are you sure you want to delete this assessment? This action cannot be undone.",
                confirmLabel: "Delete",
                cancelLabel: "Cancel",
                variant: "destructive",
              });
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[280px]">
        {loadingTests ? (
          <div className="min-h-[280px] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-500">Fetching assessments...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 border-dashed border-gray-200 min-h-[280px] flex flex-col justify-center items-center px-4">
            <Target size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No assessments found</h3>
            <p className="text-gray-500 mt-1 text-xs">
              {sq
                ? `No results for "${workspaceSearch}" in this tab.`
                : "Get started by creating your first test."}
            </p>
          </div >
        ) : (
          <div className="min-h-[280px]">
            <DataTable columns={testColumns} data={data} />
          </div>
        )}
      </div >
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Assessments
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-gray-500">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 bg-white p-3.5 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Workspace</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedClass.name} | {selectedSubject.name}
              </p>
            </div>

            <div className="flex flex-row items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
              <input
                id="workspace-search"
                type="text"
                placeholder="Search..."
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none flex-1 min-w-0 sm:w-auto sm:text-sm sm:px-3 sm:py-2 sm:min-w-[210px]"
              />
              <CustomSelect
                value={workspaceStatusFilter}
                onChange={(val) => setWorkspaceStatusFilter(val)}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "completed", label: "Completed" },
                ]}
                className="w-[95px] sm:w-[150px] shrink-0"
              />
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
                className="!px-3 !min-h-[38px] !min-w-[38px] sm:!min-w-[auto] sm:!px-4 sm:!py-2 flex items-center justify-center shrink-0 shadow-sm"
              >
                <span className="hidden sm:inline">Create Test</span>
              </Button>
            </div>
          </div>

          {/* Tab selection on mobile, Tabs on desktop */}
          <div className="block sm:hidden">
            <CustomSelect
              value={activeTabId}
              onChange={(val) => setActiveTabId(val)}
              options={[
                { value: "topic", label: "Topic Tests" },
                { value: "chapter", label: "Chapter Tests" },
                { value: "subject", label: "Subject Tests" },
                { value: "mock", label: "Mock Tests" },
                { value: "final", label: "Final Exams" },
              ]}
              className="w-full mb-4"
            />
            {activeTabId === "topic" && renderDataTable("topic")}
            {activeTabId === "chapter" && renderDataTable("chapter")}
            {activeTabId === "subject" && renderDataTable("subject")}
            {activeTabId === "mock" && renderDataTable("mock")}
            {activeTabId === "final" && renderDataTable("final")}
          </div>

          <div className="hidden sm:block">
            <Tabs
              activeTabId={activeTabId}
              onChange={setActiveTabId}
              tabs={[
                {
                  id: "topic",
                  label: "Topic Tests",
                  icon: <ClipboardList size={16} />,
                  content: renderDataTable("topic"),
                },
                {
                  id: "chapter",
                  label: "Chapter Tests",
                  icon: <BarChart3 size={16} />,
                  content: renderDataTable("chapter"),
                },
                {
                  id: "subject",
                  label: "Subject Tests",
                  icon: <BookOpen size={16} />,
                  content: renderDataTable("subject"),
                },
                {
                  id: "mock",
                  label: "Mock Tests",
                  icon: <Trophy size={16} />,
                  content: renderDataTable("mock"),
                },
                {
                  id: "final",
                  label: "Final Exams",
                  icon: <Target size={16} />,
                  content: renderDataTable("final"),
                },
              ]}
            />
          </div>
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

            {(formData.type === "chapter" || formData.type === "topic") && (
              <SelectField
                label="Chapter"
                placeholder={chapters.length ? "Select chapter" : "No chapters found for this subject"}
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                disabled={chapters.length === 0}
                options={chapters.map((c: any) => ({ value: c.id, label: c.name }))}
              />
            )}

            {formData.type === "topic" && (
              <SelectField
                label="Topic"
                placeholder={
                  !selectedChapterId
                    ? "Select a chapter first"
                    : topics.length
                      ? "Select topic"
                      : "No topics found for this chapter"
                }
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={!selectedChapterId || topics.length === 0}
                options={topics.map((t: any) => ({ value: t.id, label: t.name }))}
              />
            )}

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
                ].map((mode) => {
                  if (mode.id === "ai" && !hasAiAssessments) return null;
                  return (
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
                  );
                })}
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
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-800">
                    AI scope: {selectedClass?.name} &rsaquo; {selectedSubject?.name}
                    {(formData.type === "chapter" || formData.type === "topic") && (
                      <>
                        {" "}&rsaquo;{" "}
                        {chapters.find((c: any) => c.id === selectedChapterId)?.name || (
                          <span className="text-red-600">no chapter selected</span>
                        )}
                      </>
                    )}
                    {formData.type === "topic" && (
                      <>
                        {" "}&rsaquo;{" "}
                        {topics.find((t: any) => t.id === selectedTopicId)?.name || (
                          <span className="text-red-600">no topic selected</span>
                        )}
                      </>
                    )}
                    . Questions will be generated only from this scope.
                  </div>
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
                      <CustomSelect
                        value={aiConfig.difficulty}
                        onChange={(val) => setAiConfig(prev => ({ ...prev, difficulty: val }))}
                        options={[
                        { value: "easy", label: "Easy" },
                        { value: "intermediate", label: "Intermediate" },
                        { value: "hard", label: "Hard" },
                      ]}
                        className="w-full"
                      />
                    </label>

                  </div>
                  {(() => {
                    const computedTotal = computeAiConfigTotal(aiConfig);
                    const matches = computedTotal === Number(formData.total_marks);
                    return (
                      <p className={`text-xs font-bold ${matches ? "text-emerald-600" : "text-amber-600"}`}>
                        These counts total {computedTotal} mark{computedTotal === 1 ? "" : "s"}
                        {matches
                          ? ` — matches Total Marks (${formData.total_marks}).`
                          : ` — does not match Total Marks (${formData.total_marks}). Adjust counts or Total Marks above.`}
                      </p>
                    );
                  })()}
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
              <Button onClick={handleCreateTest} disabled={submittingTest}>
                {submittingTest ? "Saving..." : editingTest ? "Update Test" : "Create Test"}
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
