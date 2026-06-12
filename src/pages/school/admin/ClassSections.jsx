import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Layers, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import SectionForm from '@/components/school/admin/forms/SectionForm';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';

const academicYears = ['2024-2025', '2025-2026', '2026-2027'];

export default function ClassSections() {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState(location.state?.academicYear || '2025-2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [academicYear]);

  const selectedClass = useMemo(
    () => classes.find((cls) => String(cls.id) === String(classId)),
    [classes, classId],
  );

  const sections = selectedClass?.sections || [];

  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sections;

    return sections.filter((section) => {
      return (
        section.name?.toLowerCase().includes(term) ||
        sectionTeacher(section).toLowerCase().includes(term) ||
        String(valueOrDash(section.room, section.roomNo, section.room_no)).toLowerCase().includes(term)
      );
    });
  }, [sections, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const classRes = await api.get('/academic/classes', { params: { academicYear } });
      const classPayload = classRes.data?.data ?? classRes.data;
      setClasses(Array.isArray(classPayload) ? classPayload : []);
    } catch (error) {
      handleApiError(error, 'Failed to load class sections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    setSelectedSection(null);
    setIsSectionModalOpen(true);
  };

  const handleEditSection = (section) => {
    setSelectedSection({ ...section, classId });
    setIsSectionModalOpen(true);
  };

  const handleDeleteSection = async (id) => {
    const ok = await confirm({
      title: 'Delete Section',
      message: 'Are you sure you want to delete this section?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!ok) return;

    try {
      await api.delete(`/academic/sections/${id}`);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to delete section');
    }
  };

  const handleSectionSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const { classId: formClassId, classTeacherId, ...data } = formData;
      const payload = { ...data, classId: formClassId, teacherId: classTeacherId };
      if (selectedSection) {
        await api.put(`/academic/sections/${selectedSection.id}`, payload);
      } else {
        await api.post('/academic/sections', payload);
      }
      closeSectionModal();
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSectionModal = () => {
    setSelectedSection(null);
    setIsSectionModalOpen(false);
  };

  if (loading) return <div className="p-8 dark:text-white">Loading sections...</div>;

  if (!selectedClass) {
    return (
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/school/admin/academics')}
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Academics
        </button>
        <div className="rounded-xl border border-surface-200 bg-white p-10 text-center shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <h1 className="text-2xl font-bold text-surface-950 dark:text-white">Class not found</h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">The selected class is not available for this academic year.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            onClick={() => navigate('/school/admin/academics')}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </button>
          <h1 className="font-display text-3xl font-bold text-surface-950 dark:text-white">{selectedClass.name} Sections</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Manage all sections inside this class on one page.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Academic Year:</label>
          <select
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-surface-800 dark:bg-surface-900 dark:text-white"
          >
            {academicYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={handleAddSection}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Section
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard icon={Layers} tone="blue" label="Total Sections" value={sections.length} helper={`Inside ${selectedClass.name}`} />
        <SummaryCard icon={UsersRound} tone="emerald" label="Total Students" value={classStudents(selectedClass)} helper="Across all sections" />
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="flex flex-col gap-3 border-b border-surface-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-surface-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search section, teacher or room..."
              className="h-11 w-full rounded-lg border border-surface-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-80 dark:border-surface-800 dark:bg-surface-950 dark:text-white"
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
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-surface-50 text-xs font-bold text-surface-600 dark:bg-surface-950/50 dark:text-surface-300">
              <tr>
                <th className="px-5 py-4">Section Name</th>
                <th className="px-3 py-4 text-center">Students</th>
                <th className="px-3 py-4">Class Teacher</th>
                <th className="px-3 py-4">Room No.</th>
                <th className="px-3 py-4">Status</th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 text-sm dark:divide-surface-800">
              {filteredSections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-bold text-surface-900 dark:text-white">No sections found</p>
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Add a section to start organizing students in {selectedClass.name}.</p>
                    <button
                      onClick={handleAddSection}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Section
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSections.map((section) => (
                  <tr key={section.id} className="bg-white hover:bg-surface-50/80 dark:bg-surface-900 dark:hover:bg-surface-800/40">
                    <td className="px-5 py-4 font-bold text-surface-950 dark:text-white">Section {section.name}</td>
                    <td className="px-3 py-4 text-center text-surface-700 dark:text-surface-200">{sectionStudents(section)}</td>
                    <td className="px-3 py-4 text-surface-700 dark:text-surface-200">{sectionTeacher(section)}</td>
                    <td className="px-3 py-4 text-surface-700 dark:text-surface-200">{valueOrDash(section.room, section.roomNo, section.room_no)}</td>
                    <td className="px-3 py-4"><StatusPill /></td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center gap-2">
                        <IconButton title={`Edit Section ${section.name}`} onClick={() => handleEditSection(section)} icon={Edit2} />
                        <IconButton title={`Delete Section ${section.name}`} onClick={() => handleDeleteSection(section.id)} icon={Trash2} danger />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={isSectionModalOpen}
        title={selectedSection ? 'Edit Section' : `Add Section in ${selectedClass.name}`}
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
          initialClassId={classId}
        />
      </Modal>
    </div>
  );
}

function valueOrDash(...values) {
  const value = values.find((item) => item !== undefined && item !== null && item !== '');
  return value ?? '-';
}

function classStudents(cls) {
  return valueOrDash(cls.totalStudents, cls.total_students, cls.studentCount, cls.student_count);
}

function sectionStudents(section) {
  return valueOrDash(section.totalStudents, section.total_students, section.studentCount, section.student_count);
}

function sectionTeacher(section) {
  return valueOrDash(section.classTeacher, section.class_teacher, section.classTeacherName, section.class_teacher_name);
}

function SummaryCard({ icon: Icon, tone, label, value, helper }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40',
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

function IconButton({ icon: Icon, title, onClick, danger = false }) {
  const colors = danger
    ? 'border-red-100 text-red-500 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30'
    : 'border-surface-200 text-surface-600 hover:border-blue-200 hover:text-blue-600 dark:border-surface-800 dark:text-surface-300';

  return (
    <button
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg border ${colors}`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
