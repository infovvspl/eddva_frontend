import React, { useState, useEffect } from 'react';
import { BookOpen, Layout, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import ClassForm from '@/components/school/admin/forms/ClassForm';
import SubjectForm from '@/components/school/admin/forms/SubjectForm';
import SectionForm from '@/components/school/admin/forms/SectionForm';
import { Layers } from 'lucide-react';

export default function Academics() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [classRes, subRes] = await Promise.all([
          api.get('/academic/classes'),
          api.get('/academic/subjects')
        ]);
      const classPayload = classRes.data?.data ?? classRes.data;
      const subPayload = subRes.data?.data ?? subRes.data;
      setClasses(Array.isArray(classPayload) ? classPayload : []);
      setSubjects(Array.isArray(subPayload) ? subPayload : []);
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
    if (confirm('Are you sure? All associated sections will be deleted.')) {
      try {
        await api.delete(`/academic/classes/${id}`);
        setClasses(classes.filter(c => c.id !== id));
      } catch (error) {
        alert('Failed to delete class');
      }
    }
  };

  const handleAddSubject = () => {
    setSelectedSubject(null);
    setIsSubjectModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setIsSubjectModalOpen(true);
  };

  const handleDeleteSubject = async (id) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await api.delete(`/academic/subjects/${id}`);
        setSubjects(subjects.filter(s => s.id !== id));
      } catch (error) {
        alert('Failed to delete subject');
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
      alert('Failed to save class');
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
    if (confirm('Are you sure you want to delete this section?')) {
      try {
        await api.delete(`/academic/sections/${id}`);
        fetchData(); // Refresh to get updated class/section counts
      } catch (error) {
        alert('Failed to delete section');
      }
    }
  };

  const handleSectionSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const { classId, ...data } = formData;
      if (selectedSection) {
        await api.put(`/academic/sections/${selectedSection.id}`, data);
      } else {
        await api.post(`/academic/classes/${classId}/sections`, data);
      }
      setIsSectionModalOpen(false);
      setSelectedSection(null);
      fetchData();
    } catch (error) {
      alert('Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubjectSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedSubject) {
        const res = await api.put(`/academic/subjects/${selectedSubject.id}`, formData);
        const savedSubject = res.data?.data ?? res.data;
        setSubjects(subjects.map(s => s.id === selectedSubject.id ? savedSubject : s));
      } else {
        const res = await api.post('/academic/subjects', formData);
        const savedSubject = res.data?.data ?? res.data;
        setSubjects([...subjects, savedSubject]);
      }
      setIsSubjectModalOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      alert('Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-surface-950">Academics</h1>
        <p className="mt-2 text-sm text-surface-500">Manage classes, sections, and subjects.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Classes Section */}
        <div className="rounded-lg border border-surface-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layout className="h-6 w-6 text-brand-600" />
              <h2 className="text-xl font-bold">Classes & Sections</h2>
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
            <p className="text-sm text-surface-500">No classes configured.</p>
          ) : (
            <ul className="space-y-3">
              {classes.map(c => (
                <li key={c.id} className="flex items-center justify-between rounded-md bg-surface-50 p-3">
                  <span className="text-sm font-semibold">
                    {c.name} - {(c.sections || []).length} Sections
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditClass(c)}
                      className="rounded p-1 text-surface-500 hover:bg-surface-200 hover:text-brand-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClass(c.id)}
                      className="rounded p-1 text-surface-500 hover:bg-red-50 hover:text-red-600"
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
        <div className="rounded-lg border border-surface-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-brand-600" />
              <h2 className="text-xl font-bold">All Sections</h2>
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
            <p className="text-sm text-surface-500">No sections configured.</p>
          ) : (
            <div className="space-y-4">
              {classes.filter(c => (c.sections || []).length > 0).map(c => (
                <div key={c.id}>
                  <h3 className="mb-2 text-xs font-bold tracking-tight uppercase tracking-widest text-surface-400">{c.name}</h3>
                  <ul className="space-y-2">
                    {(c.sections || []).map(sec => (
                      <li key={sec.id} className="flex items-center justify-between rounded-md border border-surface-100 bg-surface-50/50 p-2 text-sm">
                        <span className="font-semibold">Section {sec.name}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditSection({...sec, classId: c.id})}
                            className="rounded p-1 text-surface-400 hover:bg-surface-200 hover:text-brand-600"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSection(sec.id)}
                            className="rounded p-1 text-surface-400 hover:bg-red-50 hover:text-red-600"
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

        {/* Subjects Section */}
        <div className="rounded-lg border border-surface-200 bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-brand-600" />
              <h2 className="text-xl font-bold">Subjects</h2>
            </div>
            <button 
              onClick={handleAddSubject}
              className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700"
              title="Add Subject"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {subjects.length === 0 ? (
            <p className="text-sm text-surface-500">No subjects configured.</p>
          ) : (
            <ul className="space-y-3">
              {subjects.map(s => (
                <li key={s.id} className="flex items-center justify-between rounded-md bg-surface-50 p-3">
                  <span className="text-sm font-semibold">
                    {s.name} ({s.code || 'N/A'})
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditSubject(s)}
                      className="rounded p-1 text-surface-500 hover:bg-surface-200 hover:text-brand-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSubject(s.id)}
                      className="rounded p-1 text-surface-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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
        />
      </Modal>

      {/* Subject Modal */}
      <Modal 
        isOpen={isSubjectModalOpen}
        title={selectedSubject ? 'Edit Subject' : 'Add New Subject'}
        onClose={() => setIsSubjectModalOpen(false)}
        size="md"
      >
        <SubjectForm 
          subject={selectedSubject}
          onSubmit={handleSubjectSubmit}
          onCancel={() => setIsSubjectModalOpen(false)}
          isLoading={isSubmitting}
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
        />
      </Modal>
    </div>
  );
}
