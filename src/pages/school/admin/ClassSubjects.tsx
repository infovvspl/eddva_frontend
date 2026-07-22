import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Edit2, Layers, Plus, Search, Trash2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';
import { CustomSelect } from "@/components/ui/CustomSelect";

type SchoolClass = {
  id: string;
  name: string;
  sections?: SchoolSection[];
};

type SchoolSection = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
  code?: string;
  type?: string;
  description?: string;
  class_id?: string;
  section_id?: string;
  section_name?: string;
};

type SubjectFormState = {
  name: string;
  code: string;
  description: string;
  type: string;
  classId: string;
  sectionId: string;
};

const fieldClassName =
  'w-full rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-surface-800 dark:bg-surface-950 dark:text-white';

export default function ClassSubjects() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use URLSearchParams to store and read the section filter state
  const [sectionFilter, setSectionFilterState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('sectionFilter') || 'all';
  });

  const setSectionFilter = (val: string) => {
    setSectionFilterState(val);
    const params = new URLSearchParams(window.location.search);
    if (val === 'all') {
      params.delete('sectionFilter');
    } else {
      params.set('sectionFilter', val);
    }
    const newSearch = params.toString();
    navigate({
      pathname: window.location.pathname,
      search: newSearch ? `?${newSearch}` : '',
    }, { replace: true });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormState>({
    name: '',
    code: '',
    description: '',
    type: 'Theory',
    classId: classId || '',
    sectionId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [classId]);

  const selectedClass = useMemo(
    () => classes.find((cls) => String(cls.id) === String(classId)),
    [classes, classId],
  );

  const filteredSubjects = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesSearch =
        !term ||
        subject.name?.toLowerCase().includes(term) ||
        subject.code?.toLowerCase().includes(term) ||
        subject.description?.toLowerCase().includes(term);

      const matchesSection =
        sectionFilter === 'all' ||
        (sectionFilter === 'all-sections' && !subject.section_id) ||
        String(subject.section_id) === String(sectionFilter) ||
        (!subject.section_id && sectionFilter !== 'all-sections');

      return matchesSearch && matchesSection;
    });
  }, [subjects, searchQuery, sectionFilter]);

  const mappedSectionCount = useMemo(
    () => new Set(subjects.map((subject) => subject.section_id).filter(Boolean)).size,
    [subjects],
  );

  const uniqueSubjectsCount = useMemo(() => {
    const uniqueNames = new Set(
      subjects
        .map((subject) => subject.name?.trim().toLowerCase())
        .filter(Boolean),
    );
    return uniqueNames.size;
  }, [subjects]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, subjectRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/subjects', { params: { page: 1, limit: 500, classId } }),
      ]);

      const classPayload = classRes.data?.data ?? classRes.data;
      const subjectPayload = subjectRes.data?.data ?? subjectRes.data;

      const loadedClasses = Array.isArray(classPayload) ? classPayload : [];
      setClasses(loadedClasses);
      setSubjects(Array.isArray(subjectPayload) ? subjectPayload : []);

      // If the page is loaded directly or refreshed, programmatically populate className to state for Navbar title resolver
      const matched = loadedClasses.find((cls) => String(cls.id) === String(classId));
      if (matched && matched.name && !window.history.state?.usr?.className) {
        const currentUsr = window.history.state?.usr || {};
        navigate(
          { pathname: window.location.pathname, search: window.location.search },
          { replace: true, state: { ...currentUsr, className: matched.name } }
        );
      }
    } catch (error) {
      handleApiError(error, 'Failed to load class subjects');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        description: subject.description || '',
        type: subject.type || 'Theory',
        classId: subject.class_id || classId || '',
        sectionId: subject.section_id || '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        type: 'Theory',
        classId: classId || '',
        sectionId: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        classId: formData.classId,
        sectionId: formData.sectionId,
      };

      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, payload);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/subjects', payload);
        toast.success('Subject created successfully');
      }

      closeModal();
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error saving subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Subject',
      message: 'Are you sure you want to delete this subject?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!ok) return;

    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted successfully');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to delete subject');
    }
  };

  const handleMakeClassWide = async (subject: Subject) => {
    try {
      const payload = {
        name: subject.name,
        code: subject.code,
        type: subject.type || 'Theory',
        classId: subject.class_id,
        sectionId: '', // Setting to empty makes it class-wide
      };
      await api.put(`/subjects/${subject.id}`, payload);
      toast.success(`Moved ${subject.name} to class-wide`);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to make subject class-wide');
    }
  };

  const handleMakeAllClassWide = async () => {
    const sectionSpecific = subjects.filter(s => s.section_id);
    if (sectionSpecific.length === 0) {
      toast.info('All subjects are already class-wide');
      return;
    }

    const ok = await confirm({
      title: 'Move All to Class-wide',
      message: `Are you sure you want to move all ${sectionSpecific.length} section-specific subjects to class-wide? This will make them accessible across all sections.`,
      confirmLabel: 'Move All',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;

    setLoading(true);
    try {
      await Promise.all(
        sectionSpecific.map(s => 
          api.put(`/subjects/${s.id}`, {
            name: s.name,
            code: s.code,
            type: s.type || 'Theory',
            classId: s.class_id,
            sectionId: '',
          })
        )
      );
      toast.success('All subjects moved to class-wide successfully');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to move some subjects');
      fetchData();
    }
  };

  if (loading) return <div className="p-8 dark:text-white">Loading class subjects...</div>;

  if (!selectedClass && classes.length > 0) {
    return (
      <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
        <button
          onClick={() => navigate('/school/admin/subjects')}
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Subjects
        </button>
        <div className="rounded-xl border border-surface-200 bg-white p-10 text-center shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <h1 className="text-2xl font-bold text-surface-955 dark:text-white">Class not found</h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">The selected class is not available.</p>
        </div>
      </div>
    );
  }

  if (!selectedClass) {
    return <div className="p-8 dark:text-white">Resolving class...</div>;
  }

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            onClick={() => navigate('/school/admin/subjects')}
            className="mb-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-955 dark:text-white">{selectedClass.name} Subjects</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-500 dark:text-surface-400">Manage subject mappings for this class.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
        <SummaryCard icon={BookOpen} tone="blue" label="Total Subjects" value={uniqueSubjectsCount} helper={`Inside ${selectedClass.name}`} />
        <SummaryCard icon={Layers} tone="emerald" label="Mapped Sections" value={mappedSectionCount} helper={`${(selectedClass.sections || []).length} sections available`} />
        <div className="col-span-2 xl:col-span-1">
          <SummaryCard icon={BookOpen} tone="indigo" label="Class-wide Subjects" value={subjects.filter((subject) => !subject.section_id).length} helper="Applied to all sections" />
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="flex flex-col gap-3 border-b border-surface-200 p-4 md:flex-row md:items-center md:justify-between dark:border-surface-800">
          {/* ── Mobile Filters ── */}
          <div className="flex flex-col md:hidden gap-3 w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-xs font-semibold text-surface-700">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span>Subjects List</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition",
                  showMobileFilters
                    ? "bg-blue-600 border-blue-700 text-white"
                    : "bg-white border-surface-200 text-surface-700"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
              </button>
            </div>
            
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search subject..."
                className="h-10 w-full rounded-lg border border-surface-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-surface-800 dark:bg-surface-955 dark:text-white"
              />
            </div>

            {showMobileFilters && (
              <div className="flex flex-col gap-2 pt-2 border-t border-surface-100 dark:border-surface-800">
                <CustomSelect
                  onChange={setSectionFilter}
                  value={sectionFilter}
                  options={[
                    { value: "all", label: "All Sections" },
                    { value: "all-sections", label: "Class-wide" },
                    ...(selectedClass?.sections || []).map((sec) => ({
                      value: sec.id,
                      label: `Section ${sec.name}`,
                    })),
                  ]}
                  className="w-full"
                />
                <button
                  onClick={() => openModal()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:bg-surface-900 dark:hover:bg-blue-950/20"
                >
                  <Plus className="h-4 w-4" />
                  Add Subject
                </button>
              </div>
            )}
          </div>

          {/* ── Desktop Filters ── */}
          <div className="hidden md:flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search subject..."
                  className="h-11 w-full rounded-lg border border-surface-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-72 dark:border-surface-800 dark:bg-surface-950 dark:text-white"
                />
              </div>
              <CustomSelect
                onChange={setSectionFilter}
                value={sectionFilter}
                options={[
                  { value: "all", label: "All Sections" },
                  { value: "all-sections", label: "Class-wide" },
                  ...(selectedClass?.sections || []).map((sec) => ({
                    value: sec.id,
                    label: `Section ${sec.name}`,
                  })),
                ]}
                className="w-full"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-50 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:bg-surface-900 dark:hover:bg-blue-950/20"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </button>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-surface-50 text-xs font-bold text-surface-600 dark:bg-surface-950/50 dark:text-surface-300">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-3 py-4">Subject Name</th>
                <th className="px-3 py-4">Section</th>
                <th className="px-3 py-4">Type</th>
                <th className="px-3 py-4">Description</th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 text-sm dark:divide-surface-800">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-bold text-surface-955 dark:text-white">No subjects found</p>
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Add subjects for {selectedClass.name} to complete the academic setup.</p>
                    <button
                      onClick={() => openModal()}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Subject
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="bg-white hover:bg-surface-50/80 dark:bg-surface-900 dark:hover:bg-surface-800/40">
                    <td className="px-5 py-4 font-mono text-sm text-surface-700 dark:text-surface-200">{subject.code || '-'}</td>
                    <td className="px-3 py-4 font-bold text-surface-950 dark:text-white">{subject.name}</td>
                    <td className="px-3 py-4 text-surface-700 dark:text-surface-200">{subject.section_id ? `Section ${subject.section_name}` : 'All Sections'}</td>
                    <td className="px-3 py-4 text-surface-700 dark:text-surface-200">{subject.type || 'Theory'}</td>
                    <td className="px-3 py-4 text-surface-700 dark:text-surface-200">{subject.description || '-'}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center gap-2">
                        {subject.section_id && (
                          <IconButton title="Move to Class-wide" onClick={() => handleMakeClassWide(subject)} icon={Layers} />
                        )}
                        <IconButton title={`Edit ${subject.name}`} onClick={() => openModal(subject)} icon={Edit2} />
                        <IconButton title={`Delete ${subject.name}`} onClick={() => handleDelete(subject.id)} icon={Trash2} danger />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-surface-200 dark:divide-surface-800 bg-white dark:bg-surface-900">
          {filteredSubjects.length === 0 ? (
            <div className="p-5 py-12 text-center text-sm">
              <p className="font-bold text-surface-955 dark:text-white">No subjects found</p>
              <p className="mt-1 text-surface-500 dark:text-surface-400">Add subjects for {selectedClass.name} to complete the academic setup.</p>
              <button
                onClick={() => openModal()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Subject
              </button>
            </div>
          ) : (
            filteredSubjects.map((subject) => (
              <div key={subject.id} className="p-4 space-y-3 hover:bg-surface-50/80 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-surface-950 dark:text-white text-base">{subject.name}</span>
                  <span className="font-mono text-xs text-surface-650 bg-slate-50 dark:bg-slate-800 dark:text-slate-350 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">{subject.code || '-'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-surface-700 dark:text-surface-200 pt-1">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-surface-400 font-bold">Section</span>
                    <span className="font-semibold">{subject.section_id ? `Section ${subject.section_name}` : 'All Sections'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Type</span>
                    <span className="font-semibold">{subject.type || 'Theory'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Description</span>
                    <span className="font-semibold">{subject.description || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-100 dark:border-surface-800/40">
                  {subject.section_id && (
                    <button
                      onClick={() => handleMakeClassWide(subject)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-surface-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 text-xs font-bold dark:bg-surface-900 dark:border-surface-800 dark:text-surface-300"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Make Class-wide</span>
                    </button>
                  )}
                  <button
                    onClick={() => openModal(subject)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-surface-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 text-xs font-bold dark:bg-surface-900 dark:border-surface-800 dark:text-surface-300"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-red-650 hover:border-red-400 hover:bg-red-50 hover:text-red-600 text-xs font-bold dark:bg-surface-900 dark:border-red-950/20 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        title={editingSubject ? 'Edit Subject' : `Add Subject in ${selectedClass.name}`}
        onClose={closeModal}
        size="md"
      >
        <SubjectEditor
          formData={formData}
          setFormData={setFormData}
          selectedClass={selectedClass}
          isSubmitting={isSubmitting}
          editingSubject={editingSubject}
          onSubmit={handleSave}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}

function SubjectEditor({
  formData,
  setFormData,
  selectedClass,
  isSubmitting,
  editingSubject,
  onSubmit,
  onCancel,
}: {
  formData: SubjectFormState;
  setFormData: React.Dispatch<React.SetStateAction<SubjectFormState>>;
  selectedClass: SchoolClass;
  isSubmitting: boolean;
  editingSubject: Subject | null;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const updateField = (field: keyof SubjectFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Subject Code">
          <input value={formData.code} onChange={(event) => updateField('code', event.target.value)} placeholder="MATH-101" className={fieldClassName} />
        </FormField>
        <FormField label="Subject Name *">
          <input value={formData.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Mathematics" className={fieldClassName} />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Type">
          <CustomSelect
            onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
            value={formData.type}
            options={[
              { value: "Theory", label: "Theory" },
              { value: "Practical", label: "Practical" },
            ]}
            className="w-full"
          />
        </FormField>
        <FormField label="Section">
          <CustomSelect
            onChange={(val) => setFormData(prev => ({ ...prev, sectionId: val }))}
            value={formData.sectionId}
            options={[
              { value: "", label: "All Sections / Class-wide" },
              ...(selectedClass?.sections || []).map((sec) => ({
                value: sec.id,
                label: `Section ${sec.name}`,
              })),
            ]}
            className="w-full"
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">
        <button type="button" onClick={onCancel} className="rounded-lg border border-surface-200 px-4 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-800 dark:text-surface-200">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
          {editingSubject ? 'Save Changes' : 'Add Subject'}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-surface-700 dark:text-surface-200">{label}</span>
      {children}
    </label>
  );
}

function SummaryCard({ icon: Icon, tone, label, value, helper }: { icon: any; tone: string; label: string; value: React.ReactNode; helper: string }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40',
  };

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-3 sm:p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center gap-3 sm:gap-5">
        <span className={`grid h-10 w-10 sm:h-16 sm:w-16 place-items-center rounded-full shrink-0 ${tones[tone]}`}>
          <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
        </span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-surface-600 dark:text-surface-300 truncate">{label}</p>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-bold leading-none text-surface-950 dark:text-white">{value}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-surface-500 dark:text-surface-400 truncate">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function IconButton({ icon: Icon, title, onClick, danger = false }: { icon: any; title: string; onClick: () => void; danger?: boolean }) {
  const colors = danger
    ? 'border-red-100 text-red-500 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30'
    : 'border-surface-200 text-surface-600 hover:border-blue-200 hover:text-blue-600 dark:border-surface-800 dark:text-surface-300';

  return (
    <button onClick={onClick} className={`grid h-9 w-9 place-items-center rounded-lg border ${colors}`} title={title}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
