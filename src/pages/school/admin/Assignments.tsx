import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '@/lib/api/school-client';
import DataTable from '@/components/school/DataTable';
import Modal from '@/components/school/Modal';
import Button from '@/components/school/Button';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import { toast } from 'sonner';
import { useConfirm } from '@/context/ConfirmContext';

export default function Assignments() {
  const confirm = useConfirm();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    fetchAssignments();
    fetchSubjects();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      // Fault-tolerance: if backend returns an object or error, default to empty array
      if (Array.isArray(res.data)) {
        setAssignments(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setAssignments(res.data.data);
      } else {
        setAssignments([]);
      }
    } catch (err: any) {
      toast.error('Failed to load assignments');
      setAssignments([]); // ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      if (Array.isArray(res.data)) setSubjects(res.data);
      else if (res.data?.data) setSubjects(res.data.data);
    } catch (err) {}
  };

  const handleOpenModal = (assignment?: any) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setTitle(assignment.title);
      setDescription(assignment.description);
      setClassId(assignment.classId);
      setSubjectId(assignment.subjectId);
      setDueDate(assignment.dueDate.split('T')[0]);
      setMaxMarks(assignment.maxMarks);
      setStatus(assignment.status);
    } else {
      setEditingAssignment(null);
      setTitle('');
      setDescription('');
      setClassId('');
      setSubjectId('');
      setDueDate('');
      setMaxMarks(100);
      setStatus('Active');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { title, description, classId, subjectId, dueDate, maxMarks: Number(maxMarks), status };
      if (editingAssignment) {
        await api.patch(`/assignments/${editingAssignment.id}`, payload);
        toast.success('Assignment updated successfully');
      } else {
        await api.post('/assignments', payload);
        toast.success('Assignment created successfully');
      }
      setIsModalOpen(false);
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving assignment');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this assignment? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (err: any) {
      toast.error('Failed to delete assignment');
    }
  };

  const filteredAssignments = assignments.filter(
    (a) => a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: 'title', title: 'Title', width: '25%' },
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
      key: 'dueDate', 
      title: 'Due Date', 
      width: '15%',
      render: (val: any) => new Date(val).toLocaleDateString()
    },
    { key: 'status', title: 'Status', width: '15%' },
    {
      key: 'actions',
      title: 'Actions',
      width: '15%',
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
            <ClipboardList className="text-blue-600" /> Assignments & Homework
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage student assignments.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={20} /> Create Assignment
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search assignments by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filteredAssignments} />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <InputField
            label="Assignment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Physics Chapter 1 Homework"
          />
          <InputField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Detailed instructions..."
          />
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
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <InputField
              label="Max Marks"
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              required
            />
          </div>
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Completed', label: 'Completed' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingAssignment ? 'Save Changes' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
