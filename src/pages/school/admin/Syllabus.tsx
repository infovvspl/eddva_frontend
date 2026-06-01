import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '@/lib/api/school-client';
import DataTable from '@/components/school/DataTable';
import Modal from '@/components/school/Modal';
import Button from '@/components/school/Button';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import ProgressBar from '@/components/school/ProgressBar';
import { toast } from 'sonner';

export default function Syllabus() {
  const [syllabusList, setSyllabusList] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [description, setDescription] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [status, setStatus] = useState('Not Started');

  useEffect(() => {
    fetchSyllabus();
    fetchSubjects();
  }, []);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/content/chapters');
      if (Array.isArray(res.data)) {
        setSyllabusList(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setSyllabusList(res.data.data);
      } else {
        setSyllabusList([]);
      }
    } catch (err: any) {
      toast.error('Failed to load syllabus/chapters');
      setSyllabusList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/content/subjects');
      if (Array.isArray(res.data)) setSubjects(res.data);
      else if (res.data?.data) setSubjects(res.data.data);
    } catch (err) {}
  };

  const handleOpenModal = (syllabus?: any) => {
    if (syllabus) {
      setEditingSyllabus(syllabus);
      setClassId(syllabus.classId);
      setSubjectId(syllabus.subjectId);
      setChapterName(syllabus.chapterName);
      setDescription(syllabus.description || '');
      setCompletionPercentage(syllabus.completionPercentage);
      setStatus(syllabus.status);
    } else {
      setEditingSyllabus(null);
      setClassId('');
      setSubjectId('');
      setChapterName('');
      setDescription('');
      setCompletionPercentage(0);
      setStatus('Not Started');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      toast.error('Please select a subject');
      return;
    }
    
    try {
      const payload = { 
        subjectId, 
        name: chapterName, 
        description, 
        completionPercentage: Number(completionPercentage), 
        status 
      };
      if (editingSyllabus) {
        await api.patch(`/content/chapters/${editingSyllabus.id}`, payload);
        toast.success('Chapter updated successfully');
      } else {
        await api.post('/content/chapters', payload);
        toast.success('Chapter created successfully');
      }
      setIsModalOpen(false);
      fetchSyllabus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving syllabus');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this syllabus entry?')) return;
    try {
      await api.delete(`/content/chapters/${id}`);
      toast.success('Syllabus entry deleted successfully');
      fetchSyllabus();
    } catch (err: any) {
      toast.error('Failed to delete syllabus entry');
    }
  };

  const filteredSyllabus = syllabusList.filter(
    (s) => s.chapterName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: 'chapterName', title: 'Chapter', width: '25%' },
    { 
      key: 'subjectId', 
      title: 'Subject', 
      width: '15%',
      render: (val: any) => {
        const sub = subjects.find(s => s.id === val);
        return sub ? sub.name : val;
      }
    },
    { key: 'classId', title: 'Class', width: '15%' },
    { 
      key: 'completionPercentage', 
      title: 'Progress', 
      width: '20%',
      render: (val: any) => <ProgressBar progress={val} showLabel />
    },
    { key: 'status', title: 'Status', width: '15%' },
    {
      key: 'actions',
      title: 'Actions',
      width: '10%',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="text-blue-600" /> Syllabus Tracking
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Track curriculum progress across classes.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={20} /> Add Chapter
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filteredSyllabus} />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSyllabus ? 'Edit Chapter Progress' : 'Add Chapter'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              placeholder="e.g. Class 10A"
            />
            <SelectField
              label="Subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              options={[
                { value: '', label: 'Select Subject' },
                ...subjects.map(s => ({ value: s.id, label: s.name }))
              ]}
            />
          </div>
          <InputField
            label="Chapter Name"
            value={chapterName}
            onChange={(e) => setChapterName(e.target.value)}
            required
            placeholder="e.g. Introduction to Physics"
          />
          <InputField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Completion (%)"
              type="number"
              value={completionPercentage}
              onChange={(e) => setCompletionPercentage(Number(e.target.value))}
              required
              min="0"
              max="100"
            />
            <SelectField
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'Not Started', label: 'Not Started' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSyllabus ? 'Save Changes' : 'Add Chapter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
