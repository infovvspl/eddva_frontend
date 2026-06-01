import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '@/lib/api/school-client';
import DataTable from '@/components/school/DataTable';
import Modal from '@/components/school/Modal';
import Button from '@/components/school/Button';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import { toast } from 'sonner';

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Theory');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects');
      if (Array.isArray(res.data)) {
        setSubjects(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setSubjects(res.data.data);
      } else {
        setSubjects([]);
      }
    } catch (err: any) {
      toast.error('Failed to load subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (subject?: any) => {
    if (subject) {
      setEditingSubject(subject);
      setName(subject.name);
      setCode(subject.code);
      setDescription(subject.description || '');
      setType(subject.type || 'Theory');
    } else {
      setEditingSubject(null);
      setName('');
      setCode('');
      setDescription('');
      setType('Theory');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name, code, description, type };
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, payload);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/subjects', payload);
        toast.success('Subject created successfully');
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving subject');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (err: any) {
      toast.error('Failed to delete subject');
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: 'code', title: 'Code', width: '15%' },
    { key: 'name', title: 'Subject Name', width: '30%' },
    { key: 'type', title: 'Type', width: '15%' },
    { key: 'description', title: 'Description', width: '25%' },
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
            <BookOpen className="text-blue-600" /> Subjects
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all academic subjects and mappings.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={20} /> Add Subject
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filteredSubjects} />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <InputField
            label="Subject Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="e.g. PHY101"
          />
          <InputField
            label="Subject Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Physics"
          />
          <SelectField
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'Theory', label: 'Theory' },
              { value: 'Practical', label: 'Practical' },
            ]}
          />
          <InputField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
