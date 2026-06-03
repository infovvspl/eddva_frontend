import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layout, Plus, Edit2, Trash2, Layers } from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import ClassForm from '@/components/school/admin/forms/ClassForm';
import SectionForm from '@/components/school/admin/forms/SectionForm';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';

export default function Academics() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirm = useConfirm();

  useEffect(() => {
    fetchData();
  }, [academicYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const classRes = await api.get('/academic/classes', { params: { academicYear } });
      const classPayload = classRes.data?.data ?? classRes.data;
      setClasses(Array.isArray(classPayload) ? classPayload : []);
    } catch (error) {
      console.error(error);
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
      cancelLabel: 'Cancel'
    });
    if (ok) {
      try {
        await api.delete(`/academic/classes/${id}`);
        setClasses(classes.filter(c => c.id !== id));
      } catch (error) {
        handleApiError(error, 'Failed to delete class');
      }
    }
  };


  const handleClassSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedClass) {
        const res = await api.put(`/academic/classes/${selectedClass.id}`, formData);
        const savedClass = res.data?.data ?? res.data;
        setClasses(classes.map(c => c.id === selectedClass.id ? savedClass : c));
      } else {
        const res = await api.post('/academic/classes', formData);
        const savedClass = res.data?.data ?? res.data;
        setClasses([...classes, savedClass]);
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
    setIsSectionModalOpen(true);
  };

  const handleEditSection = (section) => {
    setSelectedSection(section);
    setIsSectionModalOpen(true);
  };

  const handleDeleteSection = async (id) => {
    const ok = await confirm({
      title: 'Delete Section',
      message: 'Are you sure you want to delete this section?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });
    if (ok) {
      try {
        await api.delete(`/academic/sections/${id}`);
        fetchData(); // Refresh to get updated class/section counts
      } catch (error) {
        handleApiError(error, 'Failed to delete section');
      }
    }
  };

  const handleSectionSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const { classId, classTeacherId, ...data } = formData;
      const payload = { ...data, classId, teacherId: classTeacherId };
      if (selectedSection) {
        await api.put(`/academic/sections/${selectedSection.id}`, payload);
      } else {
        await api.post(`/academic/sections`, payload);
      }
      setIsSectionModalOpen(false);
      setSelectedSection(null);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 dark:text-white">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-950 dark:text-white">Academics</h1>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">Manage classes and sections.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Academic Year:</label>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:border-surface-800 dark:bg-surface-900 dark:text-white"
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Classes Section */}
        <div className="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layout className="h-6 w-6 text-brand-600" />
              <h2 className="text-xl font-bold text-surface-950 dark:text-white">Classes & Sections</h2>
            </div>
            <button 
              onClick={handleAddClass}
              className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700"
              title="Add Class"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {classes.length === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400">No classes configured for this academic year.</p>
          ) : (
            <ul className="space-y-3">
              {classes.map(c => (
                <li key={c.id} className="flex items-center justify-between rounded-md bg-surface-55 dark:bg-surface-800 p-3">
                  <span className="text-sm font-semibold text-surface-950 dark:text-white">
                    {c.name} - {(c.sections || []).length} Sections
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditClass(c)}
                      className="rounded p-1 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-brand-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClass(c.id)}
                      className="rounded p-1 text-surface-500 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sections Section */}
        <div className="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-brand-600" />
              <h2 className="text-xl font-bold text-surface-950 dark:text-white">All Sections</h2>
            </div>
            <button 
              onClick={handleAddSection}
              className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700"
              title="Add Section"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {classes.every(c => (c.sections || []).length === 0) ? (
            <p className="text-sm text-surface-500 dark:text-surface-400">No sections configured for this academic year.</p>
          ) : (
            <div className="space-y-4">
              {classes.filter(c => (c.sections || []).length > 0).map(c => (
                <div key={c.id}>
                  <h3 className="mb-2 text-xs font-bold tracking-tight uppercase tracking-widest text-surface-400 dark:text-surface-500">{c.name}</h3>
                  <ul className="space-y-2">
                    {(c.sections || []).map(sec => (
                      <li key={sec.id} className="flex items-center justify-between rounded-md border border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 p-2 text-sm">
                        <span className="font-semibold text-surface-900 dark:text-surface-200">Section {sec.name}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditSection({...sec, classId: c.id})}
                            className="rounded p-1 text-surface-400 dark:text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-brand-600"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSection(sec.id)}
                            className="rounded p-1 text-surface-400 dark:text-surface-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Class Modal */}
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

      {/* Section Modal */}
      <Modal 
        isOpen={isSectionModalOpen}
        title={selectedSection ? 'Edit Section' : 'Add New Section'}
        onClose={() => setIsSectionModalOpen(false)}
        size="md"
      >
        <SectionForm 
          sectionData={selectedSection}
          classes={classes}
          onSubmit={handleSectionSubmit}
          onCancel={() => setIsSectionModalOpen(false)}
          isLoading={isSubmitting}
          defaultAcademicYear={academicYear}
        />
      </Modal>
    </div>
  );
}
