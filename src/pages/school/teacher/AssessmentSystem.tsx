/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Upload, BookOpen, Calendar, ChevronRight, ChevronLeft, Home, GraduationCap, Users, Layers, Plus, Trash2, Trophy, BarChart3, ClipboardList, Target
} from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Modal from "@/components/school/Modal";
import InputField from "@/components/school/InputField";
import SelectField from "@/components/school/SelectField";
import { apiClient as api } from "@/lib/api/client";
import "./AssessmentSystem.css";

const AssessmentSystem: React.FC = () => {
  const navigate = useNavigate();
  const { assignments, setAssignments } = useAcademicStore();
  const [loadingContext, setLoadingContext] = useState(true);

  // Navigation state
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');

  // Assessment States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testsList, setTestsList] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);

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

  const goToClasses = () => { setSelectedClass(null); setSelectedSection(null); setSelectedSubject(null); setSearch(''); };
  const goToSections = () => { setSelectedSection(null); setSelectedSubject(null); setSearch(''); };
  const goToSubjects = () => { setSelectedSubject(null); setSearch(''); };
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
      // Fetch all assessments and filter on frontend based on subjectId
      const res = await api.get("/assessments");
      const allAssessments = res.data.data || [];
      
      const filtered = allAssessments.filter((item: any) => 
        String(item.subject_id) === String(selectedSubject.id) &&
        String(item.section_id) === String(selectedSection?.id)
      );

      const formatted = filtered.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.assessment_type || item.type || "topic",
        totalMarks: item.total_marks,
        duration: item.duration_minutes || "-",
        date: item.scheduled_at || item.scheduled_date
          ? new Date(item.scheduled_at || item.scheduled_date).toLocaleDateString()
          : "-",
        class: selectedClass?.name || "-",
        status: item.status || (new Date(item.scheduled_at || item.scheduled_date) > new Date() ? "upcoming" : "completed"),
        submissions: 0,
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
      const payload = {
        title: formData.title,
        type: formData.type,
        assessmentType: formData.type, // Handle backend variations
        subjectId: selectedSubject?.id,
        class_id: selectedClass?.id, // frontend metadata if needed
        sectionId: selectedSection?.id,
        total_marks: formData.total_marks,
        totalMarks: formData.total_marks,
        duration_minutes: formData.duration_minutes,
        durationMinutes: formData.duration_minutes,
        scheduled_date: formData.scheduled_date,
        scheduledAt: formData.scheduled_date
      };

      if (editingTest) {
        await api.patch(`/assessments/${editingTest.id}`, payload);
      } else {
        await api.post("/assessments", payload);
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
    } catch (err) {
      console.error("Create assessment error:", err);
    }
  };

  const testColumns = [
    {
      key: "title",
      title: "Test Name",
      render: (v: string, row: any) => (
        <span
          className="text-brand-600 font-medium hover:underline cursor-pointer"
          onClick={() => navigate(`/teacher/assessments/${row.id}`)}
        >
          {v}
        </span>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (v: string) => (
        <Badge
          variant={
            v === "final" ? "error" : v === "mock" ? "warning" : v === "unit" ? "info" : "purple"
          }
        >
          {v}
        </Badge>
      ),
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
      ),
    },
  ];

  const renderDataTable = (typeFilter: string | string[]) => {
    const data = testsList.filter((t) => {
      const matchType = Array.isArray(typeFilter) ? typeFilter.includes(t.type) : t.type === typeFilter;
      const matchSearch = t.title.toLowerCase().includes(workspaceSearch.toLowerCase());
      const matchStatus = workspaceStatusFilter === "all" || t.status === workspaceStatusFilter;
      return matchType && matchSearch && matchStatus;
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loadingTests ? (
          <div className="py-12 text-center text-gray-400">Loading tests...</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center bg-gray-50 border-dashed border-gray-200">
             <Target size={48} className="mx-auto text-gray-300 mb-4" />
             <h3 className="text-lg font-medium text-gray-700">No assessments found</h3>
             <p className="text-gray-500 mt-1 text-sm">Get started by creating your first test.</p>
          </div>
        ) : (
          <DataTable columns={testColumns} data={data} />
        )}
      </div>
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
          ...(selectedSubject ? [{ label: selectedSubject.name, onClick: () => {}, active: true }] : []),
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
                type="text"
                placeholder="Search tests..."
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
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
                content: renderDataTable("topic"),
              },
              {
                id: "unit",
                label: "Unit Tests",
                icon: <BarChart3 size={16} />,
                content: renderDataTable("unit"),
              },
              {
                id: "mock",
                label: "Mock & Final",
                icon: <Target size={16} />,
                content: renderDataTable(["mock", "subject", "final"]),
              }
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
        >
          <div className="space-y-4 p-2">
            <div className="bg-brand-50 text-brand-700 p-3 rounded-lg text-sm border border-brand-100 mb-4">
              <strong>Context:</strong> Posting to {selectedClass.name} ({selectedSubject.name})
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
                { value: "unit", label: "Unit Test" },
                { value: "mock", label: "Mock Test" },
                { value: "subject", label: "Subject Test" },
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
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTest}>
                {editingTest ? "Update Test" : "Create Test"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssessmentSystem;
