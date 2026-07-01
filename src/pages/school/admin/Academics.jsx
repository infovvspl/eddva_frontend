import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Eye,
  Layers,
  Plus,
  Search,
  School,
  Trash2,
  UsersRound,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import ClassForm from '@/components/school/admin/forms/ClassForm';
import SectionForm from '@/components/school/admin/forms/SectionForm';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';
import { CustomSelect } from "@/components/ui/CustomSelect";

const academicYears = ['2024-2025', '2025-2026', '2026-2027'];

export default function Academics() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [initialSectionClassId, setInitialSectionClassId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const navigate = useNavigate();
  const confirm = useConfirm();

  useEffect(() => {
    fetchData();
  }, [academicYear]);

  const totalSections = useMemo(
    () => classes.reduce((sum, cls) => sum + (cls.sections || []).length, 0),
    [classes],
  );

  const classesWithSections = useMemo(
    () => classes.filter((cls) => (cls.sections || []).length > 0).length,
    [classes],
  );

  const sectionCoverage = classes.length ? Math.round((classesWithSections / classes.length) * 100) : 0;

  const filteredClasses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return classes.filter((cls) => {
      const sections = cls.sections || [];
      const hasSections = sections.length > 0;
      const matchesSearch =
        !term ||
        cls.name?.toLowerCase().includes(term) ||
        sections.some((section) => section.name?.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'with-sections' && hasSections) ||
        (statusFilter === 'without-sections' && !hasSections);

      return matchesSearch && matchesStatus;
    });
  }, [classes, searchTerm, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const classRes = await api.get('/academic/classes', { params: { academicYear } });
      const classPayload = classRes.data?.data ?? classRes.data;
      setClasses(Array.isArray(classPayload) ? classPayload : []);
    } catch (error) {
      handleApiError(error, 'Failed to load academics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = () => {
    setSelectedClass(null);
    setIsClassModalOpen(true);
  };

  const handleEditClass = (cls) => {
    setSelectedClass(cls);
    setIsClassModalOpen(true);
  };

  const handleDeleteClass = async (id) => {
    const ok = await confirm({
      title: 'Delete Class',
      message: 'Are you sure? All associated sections will be deleted.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!ok) return;

    try {
      await api.delete(`/academic/classes/${id}`);
      setClasses((prev) => prev.filter((cls) => cls.id !== id));
    } catch (error) {
      handleApiError(error, 'Failed to delete class');
    }
  };

  const handleClassSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedClass) {
        const res = await api.put(`/academic/classes/${selectedClass.id}`, formData);
        const savedClass = res.data?.data ?? res.data;
        setClasses((prev) => prev.map((cls) => (cls.id === selectedClass.id ? savedClass : cls)));
      } else {
        const res = await api.post('/academic/classes', formData);
        const savedClass = res.data?.data ?? res.data;
        setClasses((prev) => [...prev, savedClass]);
      }
      setIsClassModalOpen(false);
      setSelectedClass(null);
    } catch (error) {
      handleApiError(error, 'Failed to save class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSection = () => {
    setSelectedSection(null);
    setInitialSectionClassId('');
    setIsSectionModalOpen(true);
  };

  const handleSectionSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const { classId, classTeacherId, ...data } = formData;
      const payload = { ...data, classId, teacherId: classTeacherId };
      if (selectedSection) {
        await api.put(`/academic/sections/${selectedSection.id}`, payload);
      } else {
        await api.post('/academic/sections', payload);
      }
      setIsSectionModalOpen(false);
      setSelectedSection(null);
      setInitialSectionClassId('');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const valueOrDash = (...values) => {
    const value = values.find((item) => item !== undefined && item !== null && item !== '');
    return value ?? '-';
  };

  const sectionCount = (cls) => (cls.sections || []).length;
  const classStudents = (cls) => valueOrDash(cls.totalStudents, cls.total_students, cls.studentCount, cls.student_count);
  const sectionStudents = (section) => valueOrDash(section.totalStudents, section.total_students, section.studentCount, section.student_count);
  const sectionTeacher = (section) => valueOrDash(section.classTeacher, section.class_teacher, section.classTeacherName, section.class_teacher_name);
  const classTeacher = (cls) => {
    const direct = valueOrDash(cls.classTeacher, cls.class_teacher, cls.classTeacherName, cls.class_teacher_name);
    if (direct !== '-') return direct;

    const firstSectionTeacher = (cls.sections || [])
      .map((section) => sectionTeacher(section))
      .find((teacher) => teacher !== '-');

    return firstSectionTeacher || '-';
  };

  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    setInitialSectionClassId('');
  };

  const openSectionsPage = (classId) => {
    navigate(`/school/admin/academics/${classId}/sections`, { state: { academicYear } });
  };

  if (loading) return <div className="p-8 dark:text-white">Loading academics...</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-950 dark:text-white">Academics</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Manage classes, sections and academic structure</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Academic Year:</label>
          <CustomSelect
            value={academicYear}
            options={academicYears.map((year) => ({ value: year, label: year }))}
            className="w-full"
          />
          <button
            onClick={handleAddClass}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard icon={School} tone="blue" label="Total Classes" value={classes.length} helper="Active Classes" />
        <SummaryCard icon={Layers} tone="emerald" label="Total Sections" value={totalSections} helper="Active Sections" />
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="flex flex-col gap-3 border-b border-surface-200 p-4 md:flex-row md:items-center md:justify-between dark:border-surface-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search class or section..."
                className="h-11 w-full rounded-lg border border-surface-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-72 dark:border-surface-800 dark:bg-surface-950 dark:text-white"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              options={[
              { value: "all", label: "All Status" },
              { value: "with-sections", label: "With Sections" },
              { value: "without-sections", label: "Without Sections" },
            ]}
              className="w-full"
            />
          </div>
          <button
            onClick={handleAddSection}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:bg-surface-900 dark:hover:bg-blue-950/20"
          >
            <Plus className="h-4 w-4" />
            Add Section
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-surface-50 text-xs font-bold text-surface-600 dark:bg-surface-950/50 dark:text-surface-300">
              <tr>
                <th className="px-3 py-4">Class</th>
                <th className="px-3 py-4 text-center">Sections</th>
                <th className="px-3 py-4 text-center">Students</th>
                <th className="px-3 py-4">Class Teacher</th>
                <th className="px-3 py-4">Status</th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 text-sm dark:divide-surface-800">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-bold text-surface-900 dark:text-white">No matching classes found</p>
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Try a different search, or add a new class.</p>
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  return (
                    <tr key={cls.id} className="bg-white align-middle hover:bg-surface-50/80 dark:bg-surface-900 dark:hover:bg-surface-800/40">
                      <td className="px-3 py-4 font-bold text-surface-950 dark:text-white">{cls.name}</td>
                      <td className="px-3 py-4 text-center font-semibold text-blue-700 dark:text-blue-300">{sectionCount(cls)}</td>
                      <td className="px-3 py-4 text-center text-surface-700 dark:text-surface-200">{classStudents(cls)}</td>
                      <td className="px-3 py-4 text-surface-700 dark:text-surface-200">{classTeacher(cls)}</td>
                      <td className="px-3 py-4"><StatusPill /></td>
                      <td className="px-3 py-4">
                        <div className="flex justify-center gap-2">
                          <IconButton title="Open sections page" onClick={() => openSectionsPage(cls.id)} icon={Eye} />
                          <IconButton title="Edit class" onClick={() => handleEditClass(cls)} icon={Edit2} />
                          <IconButton title="Delete class" onClick={() => handleDeleteClass(cls.id)} icon={Trash2} danger />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-surface-200 px-5 py-4 text-sm text-surface-600 sm:flex-row sm:items-center sm:justify-between dark:border-surface-800 dark:text-surface-300">
          <span>Showing {filteredClasses.length === 0 ? 0 : 1} to {filteredClasses.length} of {filteredClasses.length} classes</span>
          <div className="flex items-center gap-2">
            <DisabledPageButton icon={ChevronsLeft} />
            <DisabledPageButton icon={ChevronLeft} />
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">1</span>
            <DisabledPageButton icon={ChevronRight} />
            <DisabledPageButton icon={ChevronsRight} />
            <CustomSelect
            value="10"
            onChange={() => {}}
            options={[{ value: "10", label: "10" }]}
            className="ml-2 h-9 rounded-lg border border-surface-200 bg-white px-3 text-sm font-semibold dark:border-surface-800 dark:bg-surface-950 dark:text-white"
          />
          </div>
        </div>
      </section>

      <Modal
        isOpen={isClassModalOpen}
        title={selectedClass ? 'Edit Class' : 'Add New Class'}
        onClose={() => setIsClassModalOpen(false)}
        size="md"
      >
        <ClassForm
          classData={selectedClass}
          onSubmit={handleClassSubmit}
          onCancel={() => setIsClassModalOpen(false)}
          isLoading={isSubmitting}
          defaultAcademicYear={academicYear}
        />
      </Modal>

      <Modal
        isOpen={isSectionModalOpen}
        title={selectedSection ? 'Edit Section' : 'Add New Section'}
        onClose={closeSectionModal}
        size="md"
      >
        <SectionForm
          sectionData={selectedSection}
          classes={classes}
          onSubmit={handleSectionSubmit}
          onCancel={closeSectionModal}
          isLoading={isSubmitting}
          defaultAcademicYear={academicYear}
          initialClassId={initialSectionClassId}
        />
      </Modal>
    </div>
  );
}

function SummaryCard({ icon: Icon, tone, label, value, helper }) {
  const tones = {
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

function StatusPill() {
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/60">
      Active
    </span>
  );
}

function IconButton({ icon: Icon, title, onClick, danger = false, small = false }) {
  const size = small ? 'h-8 w-8' : 'h-9 w-9';
  const colors = danger
    ? 'border-red-100 text-red-500 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30'
    : 'border-surface-200 text-surface-600 hover:border-blue-200 hover:text-blue-600 dark:border-surface-800 dark:text-surface-300';

  return (
    <button
      onClick={onClick}
      className={`grid ${size} place-items-center rounded-lg border ${colors}`}
      title={title}
    >
      <Icon className={small ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </button>
  );
}

function DisabledPageButton({ icon: Icon }) {
  return (
    <button className="grid h-9 w-9 place-items-center rounded-lg border border-surface-200 text-surface-400 dark:border-surface-800" disabled>
      <Icon className="h-4 w-4" />
    </button>
  );
}
