/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';

import {
  Plus,
  BookOpen,
  File,
  ChevronRight,
  Library
} from 'lucide-react';

import GlassCard from '@/components/school/GlassCard';
import Button from '@/components/school/Button';
import SearchBar from '@/components/school/SearchBar';
import Badge from '@/components/school/Badge';
import ProgressBar from '@/components/school/ProgressBar';
import Modal from '@/components/school/Modal';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import Tabs from '@/components/school/Tabs';

import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { useAcademicStore } from '@/lib/academic-store';
import { toast } from 'sonner';

const TopicManagement: React.FC = () => {
  const { user } = useAuth();
  const { assignments, activeAcademicContext } = useAcademicStore();
  const isTeacher = user?.role === 'TEACHER';
  const canEditCurriculum = user?.role === 'INSTITUTE_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER';

  // =====================================
  // STATES
  // =====================================

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [chaptersList, setChaptersList] = useState<any[]>([]);
  const [topicsList, setTopicsList] = useState<any[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [uploadTopicId, setUploadTopicId] = useState<string | null>(null);

  // =====================================
  // FORMS
  // =====================================

  const [newChapter, setNewChapter] = useState({
    name: '',
    order: 1,
  });

  const [newTopic, setNewTopic] = useState({
    name: '',
    orderIndex: 1,
  });

  const [newMaterial, setNewMaterial] = useState({ 
    title: '', 
    category: 'Notes', 
    fileUrl: '', 
    fileName: '' 
  });

  // =====================================
  // FETCH SUBJECTS
  // =====================================

  const fetchSubjects = async () => {
    try {
      if (isTeacher) {
        let currentAssignments = assignments;
        if (currentAssignments.length === 0) {
          const statsRes = await api.get('/dashboard/stats');
          const tData = statsRes.data?.data?.teacherData || statsRes.data?.teacherData || {};
          if (tData.assignments) {
            useAcademicStore.getState().setAssignments(tData.assignments);
            currentAssignments = tData.assignments;
          }
        }

        // Build unique subjects from teacher assignments
        const teacherSubjects = currentAssignments.map((a: any) => ({
          id: a.subjectId,
          name: `${a.className} - ${a.sectionName} - ${a.subjectName}`
        }));
        
        // Remove duplicates by ID
        const uniqueSubjects = Array.from(new Map(teacherSubjects.map(item => [item.id, item])).values());
        setSubjects(uniqueSubjects);

        // Respect active academic context if present
        if (activeAcademicContext && uniqueSubjects.find(s => s.id === activeAcademicContext.subjectId)) {
          setSelectedSubject(activeAcademicContext.subjectId);
        } else if (uniqueSubjects.length > 0 && !selectedSubject) {
          setSelectedSubject(uniqueSubjects[0].id);
        }
      } else {
        const res = await api.get('/academic/subjects');
        const list = res.data?.data || res.data || [];
        setSubjects(list);
        if (list.length > 0 && !selectedSubject) {
          setSelectedSubject(list[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =====================================
  // FETCH CHAPTERS
  // =====================================

  const fetchChapters = async (subjectId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/topics/chapters?subjectId=${subjectId}`);
      setChaptersList(res.data?.data || res.data || []);
      setSelectedChapter(null);
      setTopicsList([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch chapters');
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // FETCH TOPICS
  // =====================================

  const fetchTopics = async (chapterId: string) => {
    try {
      const res = await api.get(`/topics?chapterId=${chapterId}`);
      setTopicsList(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch topics');
    }
  };

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedChapter) {
      fetchTopics(selectedChapter);
    }
  }, [selectedChapter]);

  // =====================================
  // CREATE CHAPTER
  // =====================================

  const handleCreateChapter = async () => {
    try {
      if (!newChapter.name.trim()) {
        toast.warning('Chapter name is required');
        return;
      }
      if (!selectedSubject) {
        toast.warning('Subject is required');
        return;
      }

      await api.post('/topics/chapters', {
        name: newChapter.name,
        orderIndex: Number(newChapter.order),
        subjectId: selectedSubject,
      });

      await fetchChapters(selectedSubject);

      setNewChapter({ name: '', order: 1 });
      setShowChapterModal(false);
      toast.success('Chapter created successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create chapter');
    }
  };

  // =====================================
  // CREATE TOPIC
  // =====================================

  const handleCreateTopic = async () => {
    try {
      if (!newTopic.name.trim()) {
        toast.warning('Topic name is required');
        return;
      }
      if (!selectedChapter) {
        toast.warning('Please select a chapter first');
        return;
      }

      await api.post('/topics', {
        name: newTopic.name,
        orderIndex: Number(newTopic.orderIndex),
        chapterId: selectedChapter,
      });

      await fetchTopics(selectedChapter);

      setNewTopic({ name: '', orderIndex: 1 });
      setShowTopicModal(false);
      toast.success('Topic created successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create topic');
    }
  };

  // =====================================
  // UPLOAD MATERIAL
  // =====================================

  const handleUploadMaterial = async () => {
    try {
      if (!newMaterial.title.trim() || !newMaterial.fileName.trim() || !newMaterial.fileUrl.trim()) {
        toast.warning('Please fill all required fields');
        return;
      }
      await api.post('/materials', {
        title: newMaterial.title,
        fileName: newMaterial.fileName,
        fileUrl: newMaterial.fileUrl,
        fileType: newMaterial.category,
        fileSize: 0,
        subjectId: selectedSubject,
        subjectIdFk: selectedSubject,
        chapterId: selectedChapter,
        topicId: uploadTopicId,
        description: ''
      });
      setShowMaterialModal(false);
      setNewMaterial({ title: '', category: 'Notes', fileUrl: '', fileName: '' });
      toast.success('Material uploaded successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload material');
    }
  };

  // =====================================
  // FILTER
  // =====================================

  const filteredChapters = chaptersList.filter((chap) =>
    chap.name?.toLowerCase().includes(search.toLowerCase())
  );

  // =====================================
  // CHAPTERS TAB
  // =====================================

  const chapterContent = (
    <>
      <div className="topic__header flex items-center justify-between mb-4">
        <div className="flex gap-4 w-full max-w-2xl">
          <SelectField
            label=""
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            options={[
              { value: '', label: 'Select Subject' },
              ...subjects.map(s => ({ value: s.id, label: s.name }))
            ]}
          />
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search chapters..."
          />
        </div>

        {canEditCurriculum && (
          <Button
            icon={<Plus size={16} />}
            onClick={() => {
              if (!selectedSubject) {
                toast.warning('Please select a subject first');
                return;
              }
              setShowChapterModal(true);
            }}
          >
            Create Chapter
          </Button>
        )}
      </div>

      <div className="topic__list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p>Loading chapters...</p>
        ) : !selectedSubject ? (
          <p>Please select a subject to view chapters.</p>
        ) : filteredChapters.length === 0 ? (
          <p>No chapters found for this subject.</p>
        ) : (
          filteredChapters.map((chapter) => (
            <GlassCard
              key={chapter.id}
              hover
              className={`topic__card cursor-pointer p-4 transition-all ${
                selectedChapter === chapter.id
                  ? 'ring-2 ring-brand-500 bg-brand-50/50 dark:bg-brand-900/20'
                  : ''
              }`}
              onClick={() => setSelectedChapter(chapter.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/50 rounded-lg text-brand-600 dark:text-brand-400">
                  <Library size={20} />
                </div>
                <Badge variant={chapter.status === 'completed' ? 'success' : 'info'}>
                  {chapter.status || 'Active'}
                </Badge>
              </div>

              <h4 className="font-semibold text-surface-900 dark:text-white mb-2">
                {chapter.name}
              </h4>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                  View Topics
                </span>
                <ChevronRight size={16} className="text-surface-400" />
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </>
  );

  // =====================================
  // TOPICS TAB
  // =====================================

  const topicContent = (
    <div className="topic__topics">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
            Topics
          </h3>
          <p className="text-sm text-surface-500">
            {selectedChapter 
              ? `Showing topics for ${chaptersList.find(c => c.id === selectedChapter)?.name}`
              : 'Select a chapter to view its topics'}
          </p>
        </div>

        {canEditCurriculum && selectedChapter && (
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => setShowTopicModal(true)}
          >
            Add Topic
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {!selectedChapter ? (
          <div className="text-center p-8 bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-200 dark:border-surface-700">
            <p className="text-surface-500">Please select a chapter from the Chapters tab first.</p>
          </div>
        ) : topicsList.length === 0 ? (
          <div className="text-center p-8 bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-200 dark:border-surface-700">
            <p className="text-surface-500">No topics found in this chapter.</p>
          </div>
        ) : (
          topicsList.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-100 dark:border-surface-700 hover:border-brand-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 font-semibold text-sm">
                  {topic.sort_order || 0}
                </div>
                <div>
                  <h4 className="font-medium text-surface-900 dark:text-white">
                    {topic.name}
                  </h4>
                  {topic.description && (
                    <p className="text-sm text-surface-500 mt-1">{topic.description}</p>
                  )}
                </div>
              </div>
              {canEditCurriculum && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => { 
                    setUploadTopicId(topic.id); 
                    setShowMaterialModal(true); 
                  }}
                >
                  Upload Material
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="topic">
      {isTeacher && (
        <p className="mb-4 text-surface-500 dark:text-surface-400">
          Curriculum structure follows Subject → Chapter → Topic. Only interact with subjects you are assigned to.
        </p>
      )}

      <Tabs
        tabs={[
          {
            id: 'chapters',
            label: 'Chapters',
            icon: <Library size={16} />,
            content: chapterContent,
          },
          {
            id: 'topics',
            label: 'Topics',
            icon: <BookOpen size={16} />,
            content: topicContent,
          }
        ]}
      />

      {canEditCurriculum && (
        <>
          {/* CREATE CHAPTER MODAL */}
          <Modal
            isOpen={showChapterModal}
            onClose={() => setShowChapterModal(false)}
            title="Create Chapter"
          >
            <div className="space-y-4">
              <InputField
                label="Chapter Name"
                value={newChapter.name}
                onChange={(e) => setNewChapter({ ...newChapter, name: e.target.value })}
                placeholder="e.g. Thermodynamics"
              />
              <InputField
                label="Order"
                type="number"
                value={newChapter.order}
                onChange={(e) => setNewChapter({ ...newChapter, order: Number(e.target.value) })}
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowChapterModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChapter}>Create Chapter</Button>
              </div>
            </div>
          </Modal>

          {/* CREATE TOPIC MODAL */}
          <Modal
            isOpen={showTopicModal}
            onClose={() => setShowTopicModal(false)}
            title="Create Topic"
          >
            <div className="space-y-4">
              <InputField
                label="Topic Name"
                value={newTopic.name}
                onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                placeholder="e.g. Laws of Thermodynamics"
              />
              <InputField
                label="Order Index"
                type="number"
                value={newTopic.orderIndex}
                onChange={(e) => setNewTopic({ ...newTopic, orderIndex: Number(e.target.value) })}
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowTopicModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTopic}>Create Topic</Button>
              </div>
            </div>
          </Modal>

          {/* UPLOAD MATERIAL MODAL */}
          <Modal
            isOpen={showMaterialModal}
            onClose={() => setShowMaterialModal(false)}
            title="Upload Material"
          >
            <div className="space-y-4">
              <InputField
                label="Material Title"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                placeholder="e.g. Thermodynamics PDF"
              />
              <SelectField
                label="Category"
                value={newMaterial.category}
                onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                options={[
                  { value: 'Notes', label: 'Notes' },
                  { value: 'Presentation', label: 'Presentation' },
                  { value: 'Video', label: 'Video' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <InputField
                label="File Name"
                value={newMaterial.fileName}
                onChange={(e) => setNewMaterial({ ...newMaterial, fileName: e.target.value })}
                placeholder="e.g. notes.pdf"
              />
              <InputField
                label="File URL"
                value={newMaterial.fileUrl}
                onChange={(e) => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })}
                placeholder="e.g. https://..."
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowMaterialModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUploadMaterial}>Upload Material</Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default TopicManagement;
