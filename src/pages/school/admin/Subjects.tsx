import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Edit2, Eye, Layers, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';

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
  class_name?: string;
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

const emptyForm: SubjectFormState = {
  name: '',
  code: '',
  description: '',
  type: 'Theory',
  classId: '',
  sectionId: '',
};

const fieldClassName =
  'w-full rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-surface-800 dark:bg-surface-950 dark:text-white';

export default function Subjects() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const totalSections = useMemo(
    () => classes.reduce((sum, cls) => sum + (cls.sections || []).length, 0),
    [classes],
  );

  const classesWithSubjects = useMemo(() => {
    const classIds = new Set(subjects.map((subject) => subject.class_id).filter(Boolean));
    return classes.filter((cls) => classIds.has(cls.id)).length;
  }, [classes, subjects]);

  const filteredClasses = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return classes;

    return classes.filter((cls) => {
      const classSubjects = subjectsForClass(cls.id);
      return (
        cls.name.toLowerCase().includes(term) ||
        classSubjects.some((subject) =>
          subject.name?.toLowerCase().includes(term) ||
          subject.code?.toLowerCase().includes(term),
        )
      );
    });
  }, [classes, subjects, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, subjectRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/subjects', { params: { page: 1, limit: 500 } }),
      ]);

      const classPayload = classRes.data?.data ?? classRes.data;
      const subjectPayload = subjectRes.data?.data ?? subjectRes.data;

      setClasses(Array.isArray(classPayload) ? classPayload : []);
      setSubjects(Array.isArray(subjectPayload) ? subjectPayload : []);
    } catch (error) {
      handleApiError(error, 'Failed to load subject management');
    } finally {
      setLoading(false);
    }
  };

  const subjectsForClass = (classId: string) => subjects.filter((subject) => String(subject.class_id) === String(classId));

  const sectionCountWithSubjects = (cls: SchoolClass) => {
    const sectionIds = new Set(subjectsForClass(cls.id).map((subject) => subject.section_id).filter(Boolean));
    return sectionIds.size;
  };

  const handleOpenModal = (subject?: Subject, classId = '') => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        description: subject.description || '',
        type: subject.type || 'Theory',
        classId: subject.class_id || classId,
        sectionId: subject.section_id || '',
      });
    } else {
      setEditingSubject(null);
      setFormData({ ...emptyForm, classId });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    setFormData(emptyForm);
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

  const openClassSubjects = (classId: string) => {
    navigate(`/school/admin/subjects/${classId}`);
  };

  const selectedClass = classes.find((cls) => cls.id === formData.classId);

  if (loading) return <div className="p-8 dark:text-white">Loading subjects...</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-950 dark:text-white">Subjects</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Manage subjects class by class.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard icon={BookOpen} tone="blue" label="Total Subjects" value={subjects.length} helper="All mapped subjects" />
        <SummaryCard icon={Layers} tone="emerald" label="Total Classes" value={classes.length} helper="Available classes" />
        <SummaryCard icon={UsersRound} tone="indigo" label="Classes with Subjects" value={classesWithSubjects} helper={`${totalSections} total sections`} />
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="flex flex-col gap-3 border-b border-surface-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-surface-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search class or subject..."
              className="h-11 w-full rounded-lg border border-surface-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-80 dark:border-surface-800 dark:bg-surface-950 dark:text-white"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:bg-surface-900 dark:hover:bg-blue-950/20"
          >
            <Plus className="h-4 w-4" />
            Add Subject
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-surface-50 text-xs font-bold text-surface-600 dark:bg-surface-950/50 dark:text-surface-300">
              <tr>
                <th className="px-5 py-4">Class</th>
                <th className="px-3 py-4 text-center">Subjects</th>
                <th className="px-3 py-4 text-center">Sections</th>
                <th className="px-3 py-4">Sample Subjects</th>
                <th className="px-3 py-4">Status</th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 text-sm dark:divide-surface-800">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-bold text-surface-900 dark:text-white">No matching classes found</p>
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Try a different search, or add subjects to a class.</p>
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  const classSubjects = subjectsForClass(cls.id);
                  const sampleSubjects = classSubjects.slice(0, 3).map((subject) => subject.name).join(', ') || '-';

                  return (
                    <tr key={cls.id} className="bg-white hover:bg-surface-50/80 dark:bg-surface-900 dark:hover:bg-surface-800/40">
                      <td className="px-5 py-4 font-bold text-surface-950 dark:text-white">{cls.name}</td>
                      <td className="px-3 py-4 text-center font-semibold text-blue-700 dark:text-blue-300">{classSubjects.length}</td>
                      <td className="px-3 py-4 text-center text-surface-700 dark:text-surface-200">{sectionCountWithSubjects(cls)} / {(cls.sections || []).length}</td>
                      <td className="px-3 py-4 text-surface-700 dark:text-surface-200">{sampleSubjects}</td>
                      <td className="px-3 py-4"><StatusPill active={classSubjects.length > 0} /></td>
                      <td className="px-3 py-4">
                        <div className="flex justify-center gap-2">
                          <IconButton title="Open class subjects" onClick={() => openClassSubjects(cls.id)} icon={Eye} />
                          <IconButton title="Add subject to class" onClick={() => handleOpenModal(undefined, cls.id)} icon={Plus} />
                          {classSubjects[0] && (
                            <>
                              <IconButton title="Edit first subject" onClick={() => handleOpenModal(classSubjects[0])} icon={Edit2} />
                              <IconButton title="Delete first subject" onClick={() => handleDelete(classSubjects[0].id)} icon={Trash2} danger />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}
        onClose={closeModal}
        size="md"
      >
        <SubjectEditor
          formData={formData}
          setFormData={setFormData}
          classes={classes}
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
  classes,
  selectedClass,
  isSubmitting,
  editingSubject,
  onSubmit,
  onCancel,
}: {
  formData: SubjectFormState;
  setFormData: React.Dispatch<React.SetStateAction<SubjectFormState>>;
  classes: SchoolClass[];
  selectedClass?: SchoolClass;
  isSubmitting: boolean;
  editingSubject: Subject | null;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const updateField = (field: keyof SubjectFormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'classId' ? { sectionId: '' } : {}),
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Subject Code">
          <input
            value={formData.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder="MATH-101"
            className={fieldClassName}
          />
        </FormField>
        <FormField label="Subject Name *">
          <input
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Mathematics"
            className={fieldClassName}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Type">
          <select value={formData.type} onChange={(event) => updateField('type', event.target.value)} className={fieldClassName}>
            <option value="Theory">Theory</option>
            <option value="Practical">Practical</option>
          </select>
        </FormField>
        <FormField label="Class">
          <select value={formData.classId} onChange={(event) => updateField('classId', event.target.value)} className={fieldClassName}>
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Section">
        <select
          value={formData.sectionId}
          onChange={(event) => updateField('sectionId', event.target.value)}
          disabled={!formData.classId}
          className={`${fieldClassName} disabled:opacity-50`}
        >
          <option value="">All Sections / No specific section</option>
          {(selectedClass?.sections || []).map((section) => (
            <option key={section.id} value={section.id}>Section {section.name}</option>
          ))}
        </select>
      </FormField>

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
    <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center gap-5">
        <span className={`grid h-16 w-16 place-items-center rounded-full ${tones[tone]}`}>
          <Icon className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-medium text-surface-600 dark:text-surface-300">{label}</p>
          <p className="mt-1 text-3xl font-bold leading-none text-surface-950 dark:text-white">{value}</p>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const classes = active
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/60'
    : 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/60';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${classes}`}>
      {active ? 'Mapped' : 'Pending'}
    </span>
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
