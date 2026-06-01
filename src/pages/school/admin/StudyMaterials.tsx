import React, { useState, useEffect } from 'react';
import { BookMarked, Plus, Search, Trash2, Edit, Download } from 'lucide-react';
import api from '@/lib/api/school-client';
import DataTable from '@/components/school/DataTable';
import Modal from '@/components/school/Modal';
import Button from '@/components/school/Button';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import { toast } from 'sonner';

export default function StudyMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Notes');
  const [subjectId, setSubjectId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    fetchMaterials();
    fetchSubjects();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/materials');
      if (Array.isArray(res.data)) {
        setMaterials(res.data);
      } else if (res.data && Array.isArray(res.data.data)) {
        setMaterials(res.data.data);
      } else {
        setMaterials([]);
      }
    } catch (err: any) {
      toast.error('Failed to load study materials');
      setMaterials([]);
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

  const handleOpenModal = (material?: any) => {
    if (material) {
      setEditingMaterial(material);
      setTitle(material.title);
      setDescription(material.description || '');
      setCategory(material.fileType || material.category || 'Notes');
      setSubjectId(material.subjectId || '');
      setFileUrl(material.fileUrl || '');
      setFileName(material.fileName || '');
    } else {
      setEditingMaterial(null);
      setTitle('');
      setDescription('');
      setCategory('Notes');
      setSubjectId('');
      setFileUrl('');
      setFileName('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        title, 
        fileName,
        fileUrl,
        fileType: category,
        fileSize: 0,
        chapterId: null
      };
      if (editingMaterial) {
        await api.put(`/materials/${editingMaterial.id}`, payload);
        toast.success('Study material updated successfully');
      } else {
        await api.post('/materials', payload);
        toast.success('Study material uploaded successfully');
      }
      setIsModalOpen(false);
      fetchMaterials();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving study material');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    try {
      await api.delete(`/materials/${id}`);
      toast.success('Study material deleted successfully');
      fetchMaterials();
    } catch (err: any) {
      toast.error('Failed to delete material');
    }
  };

  const filteredMaterials = materials.filter(
    (m) => m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: 'title', title: 'Title', width: '25%' },
    { 
      key: 'file_type', 
      title: 'Category', 
      width: '15%',
      render: (val: any, row: any) => val || row.fileType || row.category || '-'
    },
    { 
      key: 'subjectId', 
      title: 'Subject', 
      width: '20%',
      render: (val: any) => {
        const sub = subjects.find(s => s.id === val);
        return sub ? sub.name : (val || '-');
      }
    },
    { 
      key: 'file_name', 
      title: 'File', 
      width: '20%',
      render: (val: any, row: any) => {
        const name = val || row.fileName;
        const url = row.file_url || row.fileUrl;
        return name ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
            <Download size={14} /> {name}
          </a>
        ) : 'No File';
      }
    },
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
            <BookMarked className="text-blue-600" /> Study Materials
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Upload and organize course materials.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={20} /> Upload Material
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search materials by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filteredMaterials} />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Edit Material' : 'Upload Material'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <InputField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Physics Chapter 1 Notes"
          />
          <SelectField
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'Notes', label: 'Notes' },
              { value: 'Presentation', label: 'Presentation' },
              { value: 'Video', label: 'Video' },
              { value: 'Other', label: 'Other' },
            ]}
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
          <InputField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          <InputField
            label="File URL"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://..."
          />
          <InputField
            label="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="notes.pdf"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingMaterial ? 'Save Changes' : 'Upload Material'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
