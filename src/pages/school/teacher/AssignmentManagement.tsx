import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Upload,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Home,
  GraduationCap,
  Users,
  Layers
} from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Modal from "@/components/school/Modal";
import InputField from "@/components/school/InputField";
import SelectField from "@/components/school/SelectField";
import FileUpload from "@/components/school/FileUpload";
import SearchBar from "@/components/school/SearchBar";
import api from "@/lib/api/school-client";
import { useAcademicStore } from "@/lib/academic-store";

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
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState('');

  // Workspace states
  const [workspaceAssignments, setWorkspaceAssignments] = useState<any[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    type: "homework",
    due_date: "",
    instructions: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    console.log("classes count", Array.from(map.values()).length);
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
    console.log("sections count", Array.from(map.values()).length);
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
    console.log("subjects count", Array.from(map.values()).length);
    return Array.from(map.values());
  }, [assignments, selectedClass, selectedSection]);

  // ── Filtered Navigation ──────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const filteredClasses = classes.filter((c) => c.name?.toLowerCase().includes(q));
  const filteredSections = sections.filter((s) => s.name?.toLowerCase().includes(q));
  const filteredSubjects = subjects.filter((s) => s.name?.toLowerCase().includes(q));

  const level: 'classes' | 'sections' | 'subjects' | 'workspace' = selectedSubject ? 'workspace' : selectedSection ? 'subjects' : selectedClass ? 'sections' : 'classes';

  const goToClasses = () => { setSelectedClass(null); setSelectedSection(null); setSelectedSubject(null); setSearch(''); };
  const goToSections = () => { setSelectedSection(null); setSelectedSubject(null); setSearch(''); };
  const goToSubjects = () => { setSelectedSubject(null); setSearch(''); };
  const goBack = () => {
    if (level === 'workspace') goToSubjects();
    else if (level === 'subjects') goToSections();
    else if (level === 'sections') goToClasses();
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

  const handleUpload = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("No active workspace context.");
      return;
    }
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("type", formData.type);
      data.append("class_id", selectedClass.id);
      data.append("subject_id", selectedSubject.id);
      data.append("due_date", formData.due_date);
      data.append("instructions", formData.instructions);
      if (selectedFile) data.append("file", selectedFile);

      await api.post("/assignments", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Assignment created successfully");
      await fetchWorkspaceAssignments();
      
      setFormData({ title: "", type: "homework", due_date: "", instructions: "" });
      setSelectedFile(null);
      setShowUploadModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || "Upload failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await api.delete(`/assignments/${id}`);
      setSelectedAssignment(null);
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
            Navigate through your assigned classes to manage assignments.
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

      {/* Search Bar */}
      {level !== 'workspace' && (
        <div className="max-w-md mb-6">
          <SearchBar value={search} onChange={setSearch} placeholder={`Search ${level}...`} />
        </div>
      )}

      {/* Level 1: Classes */}
      {level === 'classes' && (
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
                meta="Assignments Workspace"
                actionLabel="Open workspace"
                onClick={() => { setSelectedSubject({ id: s.id, name: s.name }); setSearch(''); }}
              />
            ))}
          </div>
        )
      )}

      {/* Level 3: Workspace */}
      {level === 'workspace' && selectedClass && selectedSubject && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Workspace</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedClass.name} | {selectedSubject.name}
              </p>
            </div>
            <Button
              icon={<Upload size={18} />}
              onClick={() => {
                setFormData({ title: "", type: "homework", due_date: "", instructions: "" });
                setSelectedFile(null);
                setShowUploadModal(true);
              }}
              className="shadow-sm"
            >
              Create Assignment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingWorkspace ? (
              <div className="col-span-full py-12 text-center text-gray-400">Loading assignments...</div>
            ) : workspaceAssignments.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No assignments yet</h3>
                <p className="text-gray-500 mt-1 text-sm">Get started by creating your first assignment.</p>
              </div>
            ) : (
              workspaceAssignments.map((a) => (
                <GlassCard 
                  key={a.id} 
                  hover 
                  className="cursor-pointer flex flex-col p-5"
                  onClick={() => setSelectedAssignment(a)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight pr-4 line-clamp-2">
                      {a.title}
                    </h3>
                    <Badge variant={a.type === 'homework' ? 'purple' : a.type === 'dpp' ? 'info' : 'success'}>
                      {String(a.type).toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={15} className="mr-2 text-gray-400" />
                      {a.due_date ? `Due: ${new Date(a.due_date).toLocaleDateString()}` : "No Due Date"}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Created: {new Date(a.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      {a.file_path && (
                        <div title="Has attachment">
                          <FileText size={16} className="text-brand-500" />
                        </div>
                      )}
                      <Badge variant={a.status === 'completed' ? 'success' : 'warning'}>
                        {a.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {selectedClass && selectedSubject && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Create Assignment"
          size="lg"
        >
          <div className="space-y-5 p-2">
            <div className="bg-brand-50 text-brand-700 p-3 rounded-lg text-sm border border-brand-100">
              <strong>Context:</strong> Posting to {selectedClass.name} ({selectedSubject.name})
            </div>
            
            <InputField
              label="Assignment Title"
              placeholder="e.g. Chapter 4 Exercises"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            
            <SelectField
              label="Assignment Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: "homework", label: "Homework" },
                { value: "dpp", label: "Daily Practice Problem (DPP)" },
                { value: "notes", label: "Class Notes" }
              ]}
            />
            
            <InputField
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-brand-500 outline-none text-sm min-h-[100px]"
                placeholder="Provide detailed instructions for students..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Attachment (Optional)</label>
              <FileUpload onFilesSelected={(files) => setSelectedFile(files[0])} />
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload}>
                Create Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <Modal
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          title="Assignment Details"
          size="md"
        >
          <div className="space-y-6 p-2">
            <div>
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
                      {selectedAssignment.file_path.split('/').pop()?.replace(/^\d+-/, "") || "Attachment"}
                    </p>
                    <p className="text-xs text-gray-500">Document</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  icon={<Download size={14} />}
                  onClick={() => window.open(`http://localhost:5000/${selectedAssignment.file_path}`, '_blank')}
                >
                  Download
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No attachments provided.</div>
            )}

            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
              <button 
                className="text-red-600 text-sm font-medium hover:text-red-700 flex items-center gap-1"
                onClick={() => handleDelete(selectedAssignment.id)}
              >
                Delete Assignment
              </button>
              <Button onClick={() => setSelectedAssignment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssignmentManagement;
