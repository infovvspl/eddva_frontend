/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConfirm } from "@/context/ConfirmContext";
import {
  FileText, Key, Upload, Sparkles, BookOpen, ChevronRight, ChevronLeft, Home, GraduationCap, Users, Layers, Plus, Trash2, BarChart3, ClipboardList, Target, Trophy, Clock, Pencil, Eye, Check, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb as UiBreadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import SearchBar from "@/components/school/SearchBar";
import DataTable from "@/components/school/DataTable";
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
    <UiBreadcrumb className="mb-6">
      <BreadcrumbList className="gap-1.5 text-sm sm:gap-1.5">
        {items.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.active ? (
                <BreadcrumbPage className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
                  {item.icon}
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </UiBreadcrumb>
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
      ? { soft: "bg-brand-100", icon: "text-brand-600", border: "border-brand-200 hover:border-brand-500" }
      : { soft: "bg-emerald-100", icon: "text-emerald-600", border: "border-emerald-200 hover:border-emerald-500" };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group flex h-full cursor-pointer flex-col justify-between rounded-2xl border bg-white shadow-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        toneClasses.border,
      )}
    >
      <div className="p-3.5 pb-0 sm:p-5 sm:pb-0">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className={`rounded-lg sm:rounded-xl p-2 sm:p-2.5 ${toneClasses.soft} ${toneClasses.icon} [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-[22px] sm:[&>svg]:h-[22px]`}>{icon}</div>
        </div>
        <h4 className="mt-3 sm:mt-4 truncate text-sm sm:text-lg font-bold text-gray-900" title={title}>{title}</h4>
        <p className="mt-1 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-gray-500">
          <Users size={14} className="shrink-0 size-3.5 sm:size-4" /> <span className="truncate">{meta}</span>
        </p>
      </div>
      <div className="mx-3.5 mb-3.5 mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 sm:mx-5 sm:mb-5 sm:mt-4 sm:pt-3">
        <span className={`text-xs sm:text-sm font-semibold ${toneClasses.icon}`}>{actionLabel}</span>
        <ChevronRight size={16} className="text-gray-400 transition-transform group-hover:translate-x-0.5 shrink-0 hidden sm:block" />
      </div>
    </Card>
  );
}

// shadcn Select with the simple (value, onChange(val), options) shape used on this page.
function SimpleSelect({
  value,
  onChange,
  options,
  className,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const TONE_BADGE: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-700",
  info: "bg-blue-500/10 text-blue-700",
  warning: "bg-amber-500/10 text-amber-700",
  error: "bg-red-500/10 text-red-700",
  purple: "bg-violet-500/10 text-violet-700",
};

function ToneBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn("border-transparent capitalize", TONE_BADGE[tone] ?? TONE_BADGE.purple)}>
      {children}
    </Badge>
  );
}

// Inline notice (icon + text) on the shadcn Alert — Alert positions a leading svg absolutely,
// these notices lay it out inline instead.
function InfoAlert({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Alert className={cn("[&>svg]:static [&>svg]:text-current [&>svg~*]:pl-0 [&>svg+div]:translate-y-0", className)}>
      {children}
    </Alert>
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
    const restoredTab = (location.state as any)?.assessmentTab;
    if (restoredTab) setActiveTabId(restoredTab);
    setSearch('');
  }, [location.state]);

  // Assessment States
  const [testsList, setTestsList] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
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
          <ToneBadge tone={variantMap[v] ?? "purple"}>
            {labelMap[v] ?? v}
          </ToneBadge>
        );
      },
    },
    { key: "totalMarks", title: "Total Marks" },
    { key: "duration", title: "Duration (mins)" },
    {
      key: "date",
      title: "Schedule (Start → End)",
      render: (_: any, row: any) => {
        if (!row.rawDate) return "-";
        const start = new Date(row.rawDate);
        if (isNaN(start.getTime())) return row.date || "-";
        const durationMins = Number(row.duration) || 60;
        const end = new Date(start.getTime() + durationMins * 60 * 1000);
        return (
          <div className="text-xs">
            <p className="font-bold text-gray-800">
              {start.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-gray-500 font-semibold mt-0.5">
              {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (v: string) => (
        <ToneBadge
          tone={
            v === "completed" ? "success" : v === "scheduled" || v === "upcoming" ? "info" : "warning"
          }
        >
          {v}
        </ToneBadge>
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
            onClick={() => navigate(`/school/teacher/assessments/${row.id}/edit`, {
              state: {
                test: row,
                assessmentWorkspace: { selectedClass, selectedSection, selectedSubject },
                assessmentTab: activeTabId,
                from: `${location.pathname}${location.search}`,
              },
            })}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
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
<Trash2 size={14} />
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
      <Card className="bg-white rounded-xl shadow-sm border-gray-100 overflow-hidden min-h-[280px]">
        {loadingTests ? (
          <div className="min-h-[280px] space-y-3 p-4">
            <p className="text-sm font-semibold text-gray-500">Fetching assessments...</p>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : data.length === 0 ? (
          <Card className="py-12 text-center bg-gray-50 border-dashed border-gray-200 min-h-[280px] flex flex-col justify-center items-center px-4 shadow-none">
            <Target size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No assessments found</h3>
            <p className="text-gray-500 mt-1 text-xs">
              {sq
                ? `No results for "${workspaceSearch}" in this tab.`
                : "Get started by creating your first test."}
            </p>
          </Card>
        ) : (
          <div className="min-h-[280px]">
            {/* Mobile: one card per assessment */}
            <div className="space-y-3 p-3 md:hidden">
              {data.map((row: any) => {
                const col = (key: string) => testColumns.find((c) => c.key === key)!;
                return (
                  <Card key={row.id} className="space-y-3 rounded-xl border-gray-100 p-4 shadow-none">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">{col("title").render!(row.title, row)}</div>
                      {col("status").render!(row.status, row)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-gray-500">
                      {col("type").render!(row.type, row)}
                      <span>{row.totalMarks} marks</span>
                      <span>{row.duration} mins</span>
                    </div>
                    {col("date").render!(null, row)}
                    <div className="border-t border-gray-100 pt-3">{col("actions").render!(null, row)}</div>
                  </Card>
                );
              })}
            </div>
            {/* Tablet / desktop table */}
            <div className="hidden md:block">
              <DataTable columns={testColumns} data={data} />
            </div>
          </div>
        )}
      </Card>
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
          <Button variant="outline" size="sm" onClick={goBack}>
<ChevronLeft size={16} />
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
          <Card className="py-12 text-center text-gray-500 bg-gray-50 border-dashed border-gray-200 rounded-xl shadow-none">
            No classes assigned.
          </Card>
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
          <Card className="py-12 text-center text-gray-500 bg-gray-50 border-dashed border-gray-200 rounded-xl shadow-none">
            No sections assigned for this class.
          </Card>
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
          <Card className="py-12 text-center text-gray-500 bg-gray-50 border-dashed border-gray-200 rounded-xl shadow-none">
            No subjects assigned for this class.
          </Card>
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
          <Card className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 bg-white p-3.5 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Workspace</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedClass.name} | {selectedSubject.name}
              </p>
            </div>

            <div className="flex flex-row items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
              <Input
                id="workspace-search"
                type="text"
                placeholder="Search..."
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                className="h-9 min-w-0 flex-1 rounded-lg px-2.5 text-xs sm:w-auto sm:min-w-[210px] sm:flex-none sm:px-3 sm:text-sm"
              />
              <SimpleSelect
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
                aria-label="Create Test"
                onClick={() => navigate("/school/teacher/assessments/new", {
                  state: {
                    assessmentWorkspace: { selectedClass, selectedSection, selectedSubject },
                    assessmentTab: activeTabId,
                    from: `${location.pathname}${location.search}`,
                  },
                })}
                className="shrink-0 gap-2 px-3 shadow-sm sm:px-4"
              >
<Plus size={18} />
                <span className="hidden sm:inline">Create Test</span>
              </Button>
            </div>
          </Card>

          <Tabs value={activeTabId} onValueChange={setActiveTabId}>
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm">
              {[
                { id: "topic", label: "Topic Tests", icon: <ClipboardList size={16} /> },
                { id: "chapter", label: "Chapter Tests", icon: <BarChart3 size={16} /> },
                { id: "subject", label: "Subject Tests", icon: <BookOpen size={16} /> },
                { id: "mock", label: "Mock Tests", icon: <Trophy size={16} /> },
                { id: "final", label: "Final Exams", icon: <Target size={16} /> },
              ].map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="shrink-0 gap-2 rounded-lg px-3 py-2 text-xs font-bold text-gray-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm sm:text-sm"
                >
                  {t.icon}
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {renderDataTable(activeTabId)}
        </div>
      )}

    </div >
  );
};

// ── Presentational helpers ───────────────────────────────────────────────────

export default AssessmentSystem;
