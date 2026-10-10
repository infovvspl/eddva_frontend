/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronsUpDown,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/school-client";
import { cn } from "@/lib/utils";
import { useAcademicStore } from "@/lib/academic-store";
import { useConfirm } from "@/context/ConfirmContext";
import { useSchoolFeature } from "@/hooks/use-school-feature";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { downloadPaperPdf, printPaper, type PaperPart } from "@/lib/school/paperExport";
import { toUtcIsoDateTime } from "./assessment-utils";
import { ContentEditor, computeAiConfigTotal, distributeMarksForTotal } from "./AssessmentContentEditor";

type Scope = { id: string; name: string } | null;
type ContentMode = "manual" | "upload" | "ai";

const TEST_TYPES = [
  { value: "topic", label: "Topic Test" },
  { value: "chapter", label: "Chapter Test" },
  { value: "subject", label: "Subject Test" },
  { value: "mock", label: "Mock Test" },
  { value: "final", label: "Final Exam" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "od", label: "Odia" },
];

const DEFAULT_FORM = {
  title: "",
  type: "topic",
  total_marks: 100,
  duration_minutes: 120,
  scheduled_date: "",
  start_time: "10:00",
};

const NONE = "__none__";

const toLocalDateParts = (rawDate: any) => {
  const dateObj = rawDate ? new Date(rawDate) : null;
  if (dateObj && !isNaN(dateObj.getTime())) {
    return {
      date: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`,
      time: `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`,
    };
  }
  return { date: rawDate ? String(rawDate).slice(0, 10) : "", time: "10:00" };
};

const formFromTest = (test: any) => {
  if (!test) return DEFAULT_FORM;
  const { date, time } = toLocalDateParts(test.rawDate);
  return {
    title: test.title || "",
    type: test.type || "topic",
    total_marks: Number(test.totalMarks) || 100,
    duration_minutes: Number(test.duration) || 120,
    scheduled_date: date,
    start_time: time,
  };
};

const testFromApi = (item: any) => ({
  id: item.id,
  title: item.title,
  type: String(item.assessment_type || item.type || "topic").toLowerCase() === "unit" ? "chapter" : String(item.assessment_type || item.type || "topic").toLowerCase(),
  totalMarks: item.total_marks,
  duration: item.duration_minutes,
  rawDate: item.scheduled_at || item.scheduled_date || "",
  raw: item,
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-semibold text-destructive">{message}</p>;
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-bold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] font-medium text-slate-400">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

function OptionSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  invalid,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={(v) => onChange(v === NONE ? "" : v)} disabled={disabled}>
      <SelectTrigger id={id} aria-invalid={invalid} className={cn("w-full", invalid && "border-destructive focus:ring-destructive")}>
        <SelectValue placeholder={placeholder || "Select…"} />
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <div className="px-3 py-2 text-xs font-medium text-slate-400">Nothing to choose from</div>
        ) : (
          options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

function ChapterMultiSelect({
  chapters,
  selected,
  onChange,
  invalid,
}: {
  chapters: any[];
  selected: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const label = selected.length === 0
    ? chapters.length ? "Select chapters" : "No chapters found for this subject"
    : `${selected.length} chapter${selected.length === 1 ? "" : "s"} selected`;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={chapters.length === 0}
            className={cn("w-full justify-between font-semibold", invalid && "border-destructive", selected.length === 0 && "text-muted-foreground")}
          >
            <span className="truncate">{label}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search chapters…" />
            <CommandList>
              <CommandEmpty>No chapter found.</CommandEmpty>
              <CommandGroup>
                {chapters.map((c: any, i: number) => {
                  const id = String(c.id);
                  return (
                    <CommandItem key={id} value={`${i + 1} ${c.name}`} onSelect={() => toggle(id)} className="gap-2">
                      <Checkbox checked={selected.includes(id)} className="pointer-events-none" />
                      <span className="truncate">{i + 1}. {c.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {chapters.length > 0 && (
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <Button type="button" variant="link" className="h-auto p-0 text-[11px]" onClick={() => onChange(chapters.map((c: any) => String(c.id)))}>
            Select all
          </Button>
          {selected.length > 0 && (
            <Button type="button" variant="link" className="h-auto p-0 text-[11px] text-slate-500" onClick={() => onChange([])}>
              Clear
            </Button>
          )}
          <span className="ml-auto text-slate-400">
            {selected.length} of {chapters.length} selected
          </span>
        </div>
      )}
    </div>
  );
}

function GroundingNotice({ grounding }: { grounding: { grounded?: boolean; groundedChapters?: string[]; ungroundedChapters?: string[] } }) {
  return (
    grounding.ungroundedChapters && grounding.ungroundedChapters.length > 0 ? (
      <Alert className="flex items-start gap-1.5 rounded-lg border-amber-300 bg-amber-50 p-2.5 text-xs font-semibold text-amber-800 [&>svg]:static [&>svg]:text-current [&>svg~*]:pl-0">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Not from the textbook (used general knowledge) for: {grounding.ungroundedChapters.join(", ")}.
          {grounding.groundedChapters && grounding.groundedChapters.length > 0 && (
            <> Grounded from the textbook for: {grounding.groundedChapters.join(", ")}.</>
          )}{" "}
          Upload these chapters' PDFs under Textbook Coverage for book-only questions.
        </span>
      </Alert>
    ) : grounding.grounded ? (
      <Alert className="flex items-center gap-1.5 rounded-lg border-emerald-300 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800 [&>svg]:static [&>svg]:text-current [&>svg~*]:pl-0">
        <Check className="size-3.5 shrink-0" /> Generated strictly from your indexed textbook.
      </Alert>
    ) : (
      <Alert className="flex items-start gap-1.5 rounded-lg border-amber-300 bg-amber-50 p-2.5 text-xs font-semibold text-amber-800 [&>svg]:static [&>svg]:text-current [&>svg~*]:pl-0">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        <span>This chapter has no indexed textbook, so the questions were written from general knowledge. Upload the chapter PDF under Textbook Coverage for book-only questions.</span>
      </Alert>
    )
  );
}

function PaperExportMenu({
  kind,
  hasQuestions,
  hasAnswers,
  disabled,
  onPick,
}: {
  kind: "pdf" | "print";
  hasQuestions: boolean;
  hasAnswers: boolean;
  disabled?: boolean;
  onPick: (part: PaperPart) => void;
}) {
  const Icon = kind === "pdf" ? Download : Printer;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled || (!hasQuestions && !hasAnswers)} className="h-9 flex-1 gap-1.5 rounded-xl font-bold sm:flex-none">
          <Icon className="size-4" />
          {kind === "pdf" ? "Download PDF" : "Print"}
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-slate-500">{kind === "pdf" ? "Download as PDF" : "Print"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!hasQuestions} onSelect={() => onPick("questions")}>
          <FileText className="mr-2 size-4" /> Question paper
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!hasAnswers} onSelect={() => onPick("answers")}>
          <Check className="mr-2 size-4" /> Answer key
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!hasQuestions || !hasAnswers} onSelect={() => onPick("both")}>
          <Eye className="mr-2 size-4" /> Both (answers on new page)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StepHeader({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <CardHeader className="flex-row items-start gap-3 space-y-0 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{step}</span>
      <div className="min-w-0">
        <CardTitle className="text-base font-bold leading-normal tracking-normal">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </div>
    </CardHeader>
  );
}

export default function AssessmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const confirm = useConfirm();
  const isEdit = Boolean(id);
  const routeState = (location.state as any) || {};
  const workspace = routeState.assessmentWorkspace || {};

  const hasTranslation = useSchoolFeature("ai", "ai_translation");
  const { assignments, setAssignments } = useAcademicStore();
  const [loadingContext, setLoadingContext] = useState(true);

  // ── Scope (class / section / subject) ──────────────────────────────────────
  const [selectedClass, setSelectedClass] = useState<Scope>(workspace.selectedClass || null);
  const [selectedSection, setSelectedSection] = useState<Scope>(workspace.selectedSection || null);
  const [selectedSubject, setSelectedSubject] = useState<Scope>(workspace.selectedSubject || null);

  // ── The test being edited (from the list, or fetched on a direct visit) ────
  const [editingTest, setEditingTest] = useState<any>(routeState.test || null);
  const [loadingTest, setLoadingTest] = useState(isEdit && !routeState.test);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(() => formFromTest(routeState.test));
  const [contentMode, setContentMode] = useState<ContentMode>(() => {
    const src = routeState.test?.raw?.content_source;
    return src === "upload" ? "upload" : src === "ai" ? "ai" : "manual";
  });
  const [contentText, setContentText] = useState(() => routeState.test?.raw?.content_text || routeState.test?.raw?.contentText || "");
  const [answerKey, setAnswerKey] = useState(() => routeState.test?.raw?.answer_key || routeState.test?.raw?.answerKey || "");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLanguage, setAiLanguage] = useState(() => routeState.test?.raw?.language || "en");
  const [aiConfig, setAiConfig] = useState({
    mcqCount: 5,
    trueFalseCount: 5,
    fillBlankCount: 5,
    shortCount: 3,
    longCount: 2,
    difficulty: "intermediate",
  });
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiGrounding, setAiGrounding] = useState<{ grounded?: boolean; groundedChapters?: string[]; ungroundedChapters?: string[] } | null>(null);
  const [genStartAt, setGenStartAt] = useState<number | null>(null);
  const [genElapsedMs, setGenElapsedMs] = useState(0);
  const [genDurationMs, setGenDurationMs] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportPaper = async (kind: "pdf" | "print", part: PaperPart) => {
    setExporting(true);
    try {
      const input = { title: formData.title, questions: contentText, answerKey, part };
      const ok = kind === "pdf" ? await downloadPaperPdf(input) : await printPaper(input);
      if (!ok) toast.error("Nothing to export yet");
      else if (kind === "pdf") toast.success("PDF downloaded");
    } catch (err) {
      console.error("Paper export failed:", err);
      toast.error(kind === "pdf" ? "Could not create the PDF" : "Could not open the print view");
    } finally {
      setExporting(false);
    }
  };
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const fmtDuration = (ms: number) => (ms >= 10000 ? `${Math.round(ms / 1000)}s` : `${(ms / 1000).toFixed(1)}s`);
  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));

  useEffect(() => {
    if (!genStartAt) return;
    const timer = setInterval(() => setGenElapsedMs(Date.now() - genStartAt), 100);
    return () => clearInterval(timer);
  }, [genStartAt]);

  // Keep the AI question counts in line with Total Marks (a manual tweak afterwards still sticks
  // until Total Marks itself changes again).
  useEffect(() => {
    setAiConfig((current) => ({ ...current, ...distributeMarksForTotal(formData.total_marks) }));
  }, [formData.total_marks]);

  // ── Teacher assignments (class / section / subject source of truth) ────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (assignments.length > 0) {
          setLoadingContext(false);
          return;
        }
        const res = await api.get("/dashboard/stats");
        const tData = res.data?.data?.teacherData || res.data?.teacherData || {};
        if (!cancelled && Array.isArray(tData.assignments)) setAssignments(tData.assignments);
      } catch (err) {
        console.error("Failed to load teacher context", err);
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [assignments.length, setAssignments]);

  // ── Opened on /:id/edit directly (no list state): fetch the test ───────────
  useEffect(() => {
    if (!isEdit || routeState.test) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/assessments/${id}`);
        const item = res.data?.data || res.data;
        if (cancelled || !item) return;
        const test = testFromApi(item);
        setEditingTest(test);
        setFormData(formFromTest(test));
        setContentText(item.content_text || item.contentText || "");
        setAnswerKey(item.answer_key || item.answerKey || "");
        setContentMode(item.content_source === "upload" ? "upload" : item.content_source === "ai" ? "ai" : "manual");
        setAiLanguage(item.language || "en");
      } catch (err) {
        console.error("Failed to load assessment", err);
        toast.error("Could not load this test");
      } finally {
        if (!cancelled) setLoadingTest(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit, routeState.test]);

  // Work out the scope of a test opened directly from its URL.
  useEffect(() => {
    if (!editingTest || selectedSubject || assignments.length === 0) return;
    const raw = editingTest.raw || {};
    const classId = String(raw.class_id || raw.classId || "");
    const subjectId = String(raw.subject_id || raw.subjectId || "");
    const sectionId = String(raw.section_id || raw.sectionId || "");
    const match =
      assignments.find((a: any) => String(a.classId) === classId && String(a.subjectId) === subjectId && (!sectionId || String(a.sectionId) === sectionId)) ||
      assignments.find((a: any) => String(a.classId) === classId && String(a.subjectId) === subjectId);
    if (match) {
      setSelectedClass({ id: match.classId, name: match.className });
      setSelectedSection({ id: match.sectionId, name: match.sectionName });
      setSelectedSubject({ id: match.subjectId, name: match.subjectName });
    }
  }, [editingTest, assignments, selectedSubject]);

  // ── Scope options ──────────────────────────────────────────────────────────
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a: any) => { if (a.classId) map.set(a.classId, a.className); });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [assignments]);

  const sectionOptions = useMemo(() => {
    if (!selectedClass) return [];
    const map = new Map<string, string>();
    assignments.filter((a: any) => a.classId === selectedClass.id).forEach((a: any) => { if (a.sectionId) map.set(a.sectionId, a.sectionName); });
    return Array.from(map, ([value, label]) => ({ value, label: `Section ${label}` }));
  }, [assignments, selectedClass]);

  const subjectOptions = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    const map = new Map<string, string>();
    assignments
      .filter((a: any) => a.classId === selectedClass.id && a.sectionId === selectedSection.id)
      .forEach((a: any) => { if (a.subjectId) map.set(a.subjectId, a.subjectName);});
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [assignments, selectedClass, selectedSection]);

  const sectionLabel = (sec: Scope) => (sec ? `Section ${sec.name}` : "");

  // ── Chapters / topics for the chosen subject ───────────────────────────────
  useEffect(() => {
    if (!selectedSubject) { setChapters([]); return; }
    let cancelled = false;
    setSelectedChapterId(editingTest?.raw?.chapter_id || "");
    const savedIds: string[] = Array.isArray(editingTest?.raw?.chapter_ids)
      ? editingTest.raw.chapter_ids.map((x: any) => String(x))
      : editingTest?.raw?.chapter_id
        ? [String(editingTest.raw.chapter_id)]
        : [];
    setSelectedChapterIds(savedIds);
    setTopics([]);
    api.get(`/topics/chapters?subjectId=${selectedSubject.id}`)
      .then((res) => { if (!cancelled) setChapters(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setChapters([]); });
    return () => { cancelled = true; };
  }, [selectedSubject?.id, editingTest]);

  useEffect(() => {
    if (!selectedChapterId) { setTopics([]); setSelectedTopicId(""); return; }
    setSelectedTopicId(editingTest?.raw?.chapter_id === selectedChapterId ? (editingTest?.raw?.topic_id || "") : "");
    let cancelled = false;
    api.get(`/topics?chapterId=${selectedChapterId}`)
      .then((res) => { if (!cancelled) setTopics(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setTopics([]); });
    return () => { cancelled = true; };
  }, [selectedChapterId, editingTest]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const endTimeLabel = useMemo(() => {
    if (!formData.scheduled_date || !formData.start_time) return "";
    const start = new Date(`${formData.scheduled_date}T${formData.start_time}`);
    if (isNaN(start.getTime())) return "";
    return new Date(start.getTime() + (Number(formData.duration_minutes) || 0) * 60000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }, [formData.scheduled_date, formData.start_time, formData.duration_minutes]);

  const startTimeLabel = useMemo(() => {
    if (!formData.scheduled_date || !formData.start_time) return "";
    const start = new Date(`${formData.scheduled_date}T${formData.start_time}`);
    return isNaN(start.getTime()) ? "" : start.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }, [formData.scheduled_date, formData.start_time]);

  const typeLabel = TEST_TYPES.find((t) => t.value === formData.type)?.label || formData.type;
  const needsChapter = formData.type === "chapter" || formData.type === "topic";
  const isDirty = !isEdit && Boolean(formData.title.trim() || contentText.trim() || answerKey.trim());

  const goBack = async (force = false) => {
    if (!force && isDirty) {
      const ok = await confirm({
        title: "Discard this test?",
        message: "You have unsaved changes. If you leave now they will be lost.",
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        variant: "destructive",
      });
      if (!ok) return;
    }
    navigate("/school/teacher/assessments", {
      state: {
        assessmentWorkspace: { selectedClass, selectedSection, selectedSubject },
        assessmentTab: routeState.assessmentTab || formData.type,
      },
    });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const next: Record<string, string> = {};
    if (!selectedClass) next.class = "Choose a class";
    if (!selectedSection) next.section = "Choose a section";
    if (!selectedSubject) next.subject = "Choose a subject";
    if (!formData.title.trim()) next.title = "Enter a test title";
    if (!formData.scheduled_date) next.date = "Pick the test date";
    if (!formData.start_time) next.time = "Pick a start time";
    if (!(Number(formData.total_marks) > 0)) next.marks = "Total marks must be more than 0";
    if (!(Number(formData.duration_minutes) > 0)) next.duration = "Duration must be more than 0";
    if (formData.type === "chapter" && selectedChapterIds.length === 0) next.chapters = "Select at least one chapter";
    if (formData.type === "topic" && !selectedChapterId) next.chapter = "Select a chapter";
    if (formData.type === "topic" && selectedChapterId && !selectedTopicId) next.topic = "Select a topic";
    setErrors(next);
    return next;
  };

  const submit = async () => {
    if (submitting) return;
    const found = validate();
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields");
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"], [data-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }

    const isChapterTest = formData.type === "chapter";
    const needsTopic = formData.type === "topic";
    setSubmitting(true);
    try {
      const scheduledDateTime = toUtcIsoDateTime(formData.scheduled_date, formData.start_time) || formData.scheduled_date || null;
      const payload: Record<string, any> = {
        title: formData.title.trim(),
        type: formData.type,
        assessmentType: formData.type,
        subjectId: selectedSubject?.id,
        class_id: selectedClass?.id,
        sectionId: selectedSection?.id,
        total_marks: formData.total_marks,
        totalMarks: formData.total_marks,
        duration_minutes: formData.duration_minutes,
        durationMinutes: formData.duration_minutes,
        scheduled_date: scheduledDateTime,
        scheduledAt: scheduledDateTime,
        contentText,
        answerKey,
        contentSource: contentMode,
        chapterIds: isChapterTest ? selectedChapterIds : undefined,
        chapterId: isChapterTest ? (selectedChapterIds[0] || undefined) : (needsChapter ? selectedChapterId : undefined),
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
      toast.success(editingTest ? "Test updated" : "Test created");
      await goBack(true);
    } catch (err: any) {
      console.error("Save assessment error:", err);
      toast.error(err?.response?.data?.message || "Could not save the test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── AI helpers (unchanged behaviour) ───────────────────────────────────────
  const handleLanguageChange = async (newLang: string) => {
    if (!hasTranslation) {
      toast.error("AI Translation is disabled for this institution.");
      return;
    }
    setAiLanguage(newLang);
    if (!contentText.trim() && !answerKey.trim()) return;

    const langLabel = LANGUAGES.find((l) => l.value === newLang)?.label || "English";
    const confirmed = await confirm({
      title: "Translate Content",
      message: `Do you want to translate the current question paper and answer key to ${langLabel}?`,
      confirmLabel: "Translate",
      variant: "default",
    });
    if (!confirmed) return;

    setGeneratingAi(true);
    try {
      if (contentText.trim()) {
        const resQ = await api.post("/assessments/translate", { text: contentText, language: newLang });
        setContentText(resQ.data?.data?.translatedText || resQ.data?.translatedText || contentText);
      }
      if (answerKey.trim()) {
        const resA = await api.post("/assessments/translate", { text: answerKey, language: newLang });
        setAnswerKey(resA.data?.data?.translatedText || resA.data?.translatedText || answerKey);
      }
    } catch (err) {
      console.error("Translation error:", err);
      toast.error("Failed to translate the content. Please try again.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!selectedSubject || !selectedClass) {
      toast.error("Choose the class, section and subject first");
      return;
    }
    if (formData.type === "chapter" && selectedChapterIds.length === 0) {
      setErrors((e) => ({ ...e, chapters: "Select at least one chapter" }));
      toast.error("Select at least one chapter before generating questions.");
      return;
    }
    if (formData.type === "topic" && !selectedChapterId) {
      setErrors((e) => ({ ...e, chapter: "Select a chapter" }));
      toast.error("Select a chapter before generating questions.");
      return;
    }
    if (formData.type === "topic" && !selectedTopicId) {
      setErrors((e) => ({ ...e, topic: "Select a topic" }));
      toast.error("Select a topic before generating questions.");
      return;
    }

    const start = Date.now();
    setGeneratingAi(true);
    setGenDurationMs(null);
    setGenElapsedMs(0);
    setGenStartAt(start);
    try {
      const isChapterTest = formData.type === "chapter";
      const needsTopic = formData.type === "topic";
      const chapterNames = isChapterTest
        ? selectedChapterIds.map((cid) => chapters.find((c: any) => String(c.id) === String(cid))?.name).filter(Boolean)
        : undefined;
      const chapterName = isChapterTest
        ? chapterNames?.[0]
        : (needsChapter ? chapters.find((c: any) => c.id === selectedChapterId)?.name : undefined);
      const topicName = needsTopic ? topics.find((t: any) => t.id === selectedTopicId)?.name : undefined;
      const res = await api.post("/assessments/ai-generate", {
        title: formData.title,
        type: formData.type,
        totalMarks: formData.total_marks,
        durationMinutes: formData.duration_minutes,
        classId: selectedClass.id,
        className: selectedClass.name,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        chapterIds: isChapterTest ? selectedChapterIds : undefined,
        chapterNames,
        chapterId: isChapterTest ? (selectedChapterIds[0] || undefined) : (needsChapter ? selectedChapterId : undefined),
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
      if (draft.title && !formData.title.trim()) setFormData((c) => ({ ...c, title: draft.title }));
      setContentText(draft.contentText || draft.content_text || "");
      setAnswerKey(draft.answerKey || draft.answer_key || "");
      setAiGrounding({
        grounded: draft.source?.grounded,
        groundedChapters: draft.groundedChapters,
        ungroundedChapters: draft.ungroundedChapters,
      });
      setContentMode("ai");
      setGenDurationMs(Date.now() - start);
      setReviewOpen(true);
    } catch (err) {
      console.error("AI assessment generation error:", err);
      toast.error("AI could not generate the assessment right now. Please use manual entry or upload.");
    } finally {
      setGeneratingAi(false);
      setGenStartAt(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loadingContext || loadingTest) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="hidden h-72 rounded-xl lg:block" />
        </div>
      </div>
    );
  }

  const computedTotal = computeAiConfigTotal(aiConfig);
  const aiTotalMatches = computedTotal === Number(formData.total_marks);

  const actionButtons = (
    <>
      <Button type="button" onClick={submit} disabled={submitting} className="h-11 w-full gap-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 sm:h-10">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {submitting ? "Saving…" : editingTest ? "Update Test" : "Create Test"}
      </Button>
      <Button type="button" variant="outline" onClick={() => goBack()} disabled={submitting} className="h-11 w-full rounded-xl font-bold sm:h-10">
        Cancel
      </Button>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button type="button" variant="outline" size="icon" onClick={() => goBack()} aria-label="Back to assessments" className="mt-0.5 size-9 shrink-0 rounded-xl">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {editingTest ? "Edit Test" : "Create New Test"}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
              Set up the details, then add the question paper manually, from a file, or with AI.
            </p>
          </div>
        </div>
        {selectedClass && selectedSubject && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-transparent bg-blue-50 text-blue-700">{selectedClass.name}</Badge>
            {selectedSection && <Badge variant="outline" className="border-transparent bg-emerald-50 text-emerald-700">{sectionLabel(selectedSection)}</Badge>}
            <Badge variant="outline" className="border-transparent bg-violet-50 text-violet-700">{selectedSubject.name}</Badge>
          </div>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {/* 1. Details */}
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <StepHeader step={1} title="Test details" description="Who it is for, what it covers and when it runs." />
            <CardContent className="space-y-5 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Class" required error={errors.class}>
                  <OptionSelect
                    value={selectedClass?.id || ""}
                    options={classOptions}
                    placeholder="Select class"
                    disabled={isEdit}
                    invalid={!!errors.class}
                    onChange={(v) => {
                      const opt = classOptions.find((o) => o.value === v);
                      setSelectedClass(opt ? { id: opt.value, name: opt.label } : null);
                      setSelectedSection(null);
                      setSelectedSubject(null);
                      clearError("class");
                    }}
                  />
                </Field>
                <Field label="Section" required error={errors.section}>
                  <OptionSelect
                    value={selectedSection?.id || ""}
                    options={sectionOptions}
                    placeholder={selectedClass ? "Select section" : "Pick a class first"}
                    disabled={isEdit || !selectedClass}
                    invalid={!!errors.section}
                    onChange={(v) => {
                      const raw = assignments.find((a: any) => a.classId === selectedClass?.id && a.sectionId === v);
                      setSelectedSection(raw ? { id: raw.sectionId, name: raw.sectionName } : null);
                      setSelectedSubject(null);
                      clearError("section");
                    }}
                  />
                </Field>
                <Field label="Subject" required error={errors.subject}>
                  <OptionSelect
                    value={selectedSubject?.id || ""}
                    options={subjectOptions}
                    placeholder={selectedSection ? "Select subject" : "Pick a section first"}
                    disabled={isEdit || !selectedSection}
                    invalid={!!errors.subject}
                    onChange={(v) => {
                      const opt = subjectOptions.find((o) => o.value === v);
                      setSelectedSubject(opt ? { id: opt.value, name: opt.label } : null);
                      clearError("subject");
                    }}
                  />
                </Field>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Test title" htmlFor="test-title" required error={errors.title} className="sm:col-span-2">
                  <Input
                    id="test-title"
                    placeholder="e.g. Chapter 3 — Motion, unit test"
                    value={formData.title}
                    aria-invalid={!!errors.title}
                    className={cn(errors.title && "border-destructive")}
                    onChange={(e) => { setFormData({ ...formData, title: e.target.value }); clearError("title"); }}
                  />
                </Field>

                <Field label="Test type" required>
                  <OptionSelect
                    value={formData.type}
                    options={TEST_TYPES}
                    onChange={(v) => { setFormData({ ...formData, type: v }); setErrors({}); }}
                  />
                </Field>

                <Field label="Total marks" htmlFor="total-marks" required error={errors.marks}>
                  <Input
                    id="total-marks"
                    type="number"
                    min={1}
                    placeholder="100"
                    value={formData.total_marks}
                    aria-invalid={!!errors.marks}
                    className={cn(errors.marks && "border-destructive")}
                    onChange={(e) => { setFormData({ ...formData, total_marks: Number(e.target.value) }); clearError("marks"); }}
                  />
                </Field>

                {formData.type === "chapter" && (
                  <Field label="Chapters" required error={errors.chapters} hint="Pick one or more — for example chapters 1 to 10." className="sm:col-span-2">
                    <div data-invalid={errors.chapters ? "true" : undefined}>
                      <ChapterMultiSelect
                        chapters={chapters}
                        selected={selectedChapterIds}
                        invalid={!!errors.chapters}
                        onChange={(ids) => { setSelectedChapterIds(ids); clearError("chapters"); }}
                      />
                    </div>
                  </Field>
                )}

                {formData.type === "topic" && (
                  <>
                    <Field label="Chapter" required error={errors.chapter}>
                      <OptionSelect
                        value={selectedChapterId}
                        options={chapters.map((c: any) => ({ value: String(c.id), label: c.name }))}
                        placeholder={chapters.length ? "Select chapter" : "No chapters found for this subject"}
                        disabled={chapters.length === 0}
                        invalid={!!errors.chapter}
                        onChange={(v) => { setSelectedChapterId(v); clearError("chapter"); }}
                      />
                    </Field>
                    <Field label="Topic" required error={errors.topic}>
                      <OptionSelect
                        value={selectedTopicId}
                        options={topics.map((t: any) => ({ value: String(t.id), label: t.name }))}
                        placeholder={!selectedChapterId ? "Select a chapter first" : topics.length ? "Select topic" : "No topics found for this chapter"}
                        disabled={!selectedChapterId || topics.length === 0}
                        invalid={!!errors.topic}
                        onChange={(v) => { setSelectedTopicId(v); clearError("topic"); }}
                      />
                    </Field>
                  </>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Date" htmlFor="test-date" required error={errors.date}>
                  <Input
                    id="test-date"
                    type="date"
                    value={formData.scheduled_date}
                    aria-invalid={!!errors.date}
                    className={cn(errors.date && "border-destructive")}
                    onChange={(e) => { setFormData({ ...formData, scheduled_date: e.target.value }); clearError("date"); }}
                  />
                </Field>
                <Field label="Start time" htmlFor="test-time" required error={errors.time}>
                  <Input
                    id="test-time"
                    type="time"
                    value={formData.start_time}
                    aria-invalid={!!errors.time}
                    className={cn(errors.time && "border-destructive")}
                    onChange={(e) => { setFormData({ ...formData, start_time: e.target.value }); clearError("time"); }}
                  />
                </Field>
                <Field label="Duration (mins)" htmlFor="test-duration" required error={errors.duration}>
                  <Input
                    id="test-duration"
                    type="number"
                    min={1}
                    placeholder="120"
                    value={formData.duration_minutes}
                    aria-invalid={!!errors.duration}
                    className={cn(errors.duration && "border-destructive")}
                    onChange={(e) => { setFormData({ ...formData, duration_minutes: Number(e.target.value) }); clearError("duration"); }}
                  />
                </Field>
              </div>

              {startTimeLabel && endTimeLabel && (
                <Alert className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-blue-200 bg-blue-50/80 p-3 text-xs font-semibold text-blue-900 [&>svg]:static [&>svg]:text-blue-600 [&>svg~*]:pl-0 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0" />
                    <span>Scheduled test window</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    <span>{startTimeLabel}</span>
                    <span className="text-blue-400">→</span>
                    <span>{endTimeLabel}</span>
                    <Badge variant="outline" className="border-transparent bg-blue-200/70 px-2 py-0.5 text-[10px] font-black uppercase text-blue-800">
                      Auto ends · {formData.duration_minutes} mins
                    </Badge>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 2. Question paper */}
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <StepHeader step={2} title="Question paper" description="Write it yourself, upload a document, or let AI draft it." />
            <CardContent className="space-y-4 p-4 sm:p-5">
              <Tabs value={contentMode} onValueChange={(v) => setContentMode(v as ContentMode)}>
                <TabsList className="grid h-auto w-full grid-cols-3 gap-2 bg-transparent p-0">
                  {[
                    { id: "manual", label: "Manual", icon: <FileText className="size-4" /> },
                    { id: "upload", label: "Upload", icon: <Upload className="size-4" /> },
                    { id: "ai", label: "AI", icon: <Sparkles className="size-4" /> },
                  ].map((mode) => (
                    <TabsTrigger
                      key={mode.id}
                      value={mode.id}
                      className="gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-500 hover:bg-white data-[state=active]:border-blue-400 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    >
                      {mode.icon}
                      {mode.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {contentMode === "manual" && (
                <ContentEditor
                  questions={contentText}
                  onQuestionsChange={setContentText}
                  answerKey={answerKey}
                  onAnswerKeyChange={setAnswerKey}
                  assessmentId={editingTest?.id}
                />
              )}

              {contentMode === "upload" && (
                <div className="space-y-4">
                  <Card className="rounded-xl border-dashed border-slate-300 bg-slate-50 p-4 shadow-none dark:border-slate-700 dark:bg-slate-950/50">
                    <Label htmlFor="test-file" className="text-xs font-bold text-slate-700 dark:text-slate-300">Question paper file</Label>
                    <Input
                      id="test-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="mt-2 h-auto cursor-pointer bg-white p-2 text-sm"
                    />
                    {uploadFile ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <Check className="size-3.5" /> {uploadFile.name} selected
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">PDF, document, text file, or a photo of the question paper.</p>
                    )}
                  </Card>
                  <ContentEditor
                    questions={contentText}
                    onQuestionsChange={setContentText}
                    answerKey={answerKey}
                    onAnswerKeyChange={setAnswerKey}
                    assessmentId={editingTest?.id}
                  />
                </div>
              )}

              {contentMode === "ai" && (
                <div className="space-y-4">
                  <Alert className="rounded-xl border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    AI scope: {selectedClass?.name || "—"} &rsaquo; {selectedSubject?.name || "—"}
                    {formData.type === "chapter" && (
                      <>
                        {" "}&rsaquo;{" "}
                        {selectedChapterIds.length === 0 ? (
                          <span className="text-red-600">no chapters selected</span>
                        ) : (
                          <span>
                            {selectedChapterIds.length} chapter{selectedChapterIds.length > 1 ? "s" : ""}:{" "}
                            {selectedChapterIds.map((cid) => chapters.find((c: any) => String(c.id) === String(cid))?.name).filter(Boolean).join(", ")}
                          </span>
                        )}
                      </>
                    )}
                    {formData.type === "topic" && (
                      <>
                        {" "}&rsaquo;{" "}
                        {chapters.find((c: any) => c.id === selectedChapterId)?.name || <span className="text-red-600">no chapter selected</span>}
                        {" "}&rsaquo;{" "}
                        {topics.find((t: any) => t.id === selectedTopicId)?.name || <span className="text-red-600">no topic selected</span>}
                      </>
                    )}
                    . Questions are generated only from this scope.
                  </Alert>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Question types &amp; counts</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {([
                        { key: "mcqCount", label: "MCQ (1 mark)" },
                        { key: "trueFalseCount", label: "True / False" },
                        { key: "fillBlankCount", label: "Fill in blanks" },
                        { key: "shortCount", label: "Short answer (3 marks)" },
                        { key: "longCount", label: "Long answer (5 marks)" },
                      ] as const).map((f) => (
                        <Field key={f.key} label={f.label} htmlFor={`ai-${f.key}`}>
                          <Input
                            id={`ai-${f.key}`}
                            type="number"
                            min={0}
                            value={(aiConfig as any)[f.key]}
                            onChange={(e) => setAiConfig((c) => ({ ...c, [f.key]: Math.max(0, Number(e.target.value) || 0) }))}
                          />
                        </Field>
                      ))}
                      <Field label="Difficulty">
                        <OptionSelect
                          value={aiConfig.difficulty}
                          options={[
                            { value: "easy", label: "Easy" },
                            { value: "intermediate", label: "Intermediate" },
                            { value: "hard", label: "Hard" },
                          ]}
                          onChange={(v) => setAiConfig((prev) => ({ ...prev, difficulty: v }))}
                        />
                      </Field>
                      {hasTranslation && (
                        <Field label="Language">
                          <OptionSelect value={aiLanguage} options={LANGUAGES} onChange={(v) => void handleLanguageChange(v)} />
                        </Field>
                      )}
                    </div>
                    <p className={cn("mt-2 text-xs font-bold", aiTotalMatches ? "text-emerald-600" : "text-amber-600")}>
                      These counts total {computedTotal} mark{computedTotal === 1 ? "" : "s"}
                      {aiTotalMatches
                        ? ` — matches Total Marks (${formData.total_marks}).`
                        : ` — does not match Total Marks (${formData.total_marks}). Adjust the counts or Total Marks above.`}
                    </p>
                  </div>

                  <Field label="Extra instructions (optional)" htmlFor="ai-prompt">
                    <Textarea
                      id="ai-prompt"
                      rows={2}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. focus on French Revolution causes; include one map-based question."
                      className="min-h-0 resize-none"
                    />
                  </Field>

                  <Button type="button" onClick={handleAiGenerate} disabled={generatingAi} className="h-11 w-full gap-2 rounded-xl font-bold sm:w-auto">
                    {generatingAi ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {generatingAi ? `Generating… ${fmtDuration(genElapsedMs)}` : contentText ? "Regenerate question paper" : "Generate question paper"}
                  </Button>

                  {contentText && (
                    <Card className="flex flex-col gap-3 rounded-xl border-emerald-200 bg-emerald-50/60 p-4 shadow-none sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Question paper ready</p>
                          <p className="text-xs font-medium text-slate-500">
                            {genDurationMs != null ? `Generated in ${fmtDuration(genDurationMs)} · ` : ""}
                            {answerKey.trim() ? "Answer key included" : "No answer key"}
                          </p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" onClick={() => setReviewOpen(true)} className="h-10 w-full gap-2 rounded-xl bg-white font-bold sm:w-auto">
                        <Eye className="size-4" /> Review &amp; edit
                      </Button>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary + actions (desktop) */}
        <aside className="hidden lg:block lg:sticky lg:top-4">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 p-4 dark:border-slate-800">
              <CardTitle className="text-sm font-bold leading-normal tracking-normal">Summary</CardTitle>
              <CardDescription className="text-xs">A quick check before you save.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-xs">
              {[
                { label: "Type", value: typeLabel },
                { label: "Class", value: selectedClass ? `${selectedClass.name}${selectedSection ? ` · ${sectionLabel(selectedSection)}` : ""}` : "—" },
                { label: "Subject", value: selectedSubject?.name || "—" },
                { label: "Total marks", value: formData.total_marks || "—" },
                { label: "Duration", value: formData.duration_minutes ? `${formData.duration_minutes} mins` : "—" },
                { label: "Starts", value: startTimeLabel || "Not set" },
                { label: "Ends", value: endTimeLabel || "Not set" },
                { label: "Content", value: contentMode === "manual" ? "Manual" : contentMode === "upload" ? "Upload" : "AI generated" },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-slate-400">{row.label}</span>
                  <span className="text-right font-bold text-slate-800 dark:text-slate-200">{row.value}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center gap-2 font-semibold text-slate-500">
                <Calendar className="size-3.5 shrink-0" />
                {contentText.trim() ? "Question paper added" : "No question paper yet — you can add it later"}
              </div>
            </CardContent>
            <div className="space-y-2 border-t border-slate-100 p-4 dark:border-slate-800">{actionButtons}</div>
          </Card>
        </aside>
      </div>

      {/* Sticky action bar (phones / tablets) */}
      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6 lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex w-full gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none sm:[&>button]:px-6">
          <Button type="button" variant="outline" onClick={() => goBack()} disabled={submitting} className="h-11 rounded-xl font-bold sm:h-10">
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={submitting} className="h-11 gap-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 sm:h-10">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {submitting ? "Saving…" : editingTest ? "Update Test" : "Create Test"}
          </Button>
        </div>
      </div>
      {/* Review the AI-generated paper without leaving the form */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="flex h-[92vh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl">
          <DialogHeader className="shrink-0 border-b border-slate-100 p-4 pr-12 text-left dark:border-slate-800 sm:p-5 sm:pr-14">
            <DialogTitle className="text-base font-bold leading-normal tracking-normal sm:text-lg">Review your question paper</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Read it the way students will see it, change anything you like, then use it. Nothing is saved until you click {editingTest ? "Update Test" : "Create Test"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/40 sm:px-5">
            <PaperExportMenu kind="pdf" hasQuestions={!!contentText.trim()} hasAnswers={!!answerKey.trim()} disabled={generatingAi || exporting} onPick={(part) => exportPaper("pdf", part)} />
            <PaperExportMenu kind="print" hasQuestions={!!contentText.trim()} hasAnswers={!!answerKey.trim()} disabled={generatingAi || exporting} onPick={(part) => exportPaper("print", part)} />
            <span className="w-full text-[11px] text-slate-500 sm:ml-auto sm:w-auto">For formulas and diagrams, use Print → Save as PDF.</span>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {generatingAi ? (
              <Alert className="flex items-center gap-2 rounded-lg border-blue-200 bg-blue-50 p-2.5 text-xs font-bold text-blue-800 [&>svg]:static [&>svg]:text-current [&>svg~*]:pl-0">
                <Loader2 className="size-4 animate-spin" /> Regenerating… {fmtDuration(genElapsedMs)}
              </Alert>
            ) : (
              genDurationMs != null && (
                <Alert className="rounded-lg border-emerald-300 bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800">
                  Generated in {fmtDuration(genDurationMs)}
                </Alert>
              )
            )}
            {aiGrounding && contentText && <GroundingNotice grounding={aiGrounding} />}
            <ContentEditor
              questions={contentText}
              onQuestionsChange={setContentText}
              answerKey={answerKey}
              onAnswerKeyChange={setAnswerKey}
              assessmentId={editingTest?.id}
            />
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:justify-between sm:space-x-0 sm:px-5">
            <Button type="button" variant="outline" onClick={handleAiGenerate} disabled={generatingAi} className="h-10 gap-2 rounded-xl font-bold">
              {generatingAi ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Regenerate
            </Button>
            <Button type="button" onClick={() => setReviewOpen(false)} disabled={generatingAi} className="h-10 gap-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700">
              <Check className="size-4" /> Use this paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
