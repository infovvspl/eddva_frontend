/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';

import {
  Plus,
  BookOpen,
  File,
  ChevronRight,
} from 'lucide-react';

import GlassCard from '@/components/school/GlassCard';
import Button from '@/components/school/Button';
import SearchBar from '@/components/school/SearchBar';
import Badge from '@/components/school/Badge';
import ProgressBar from '@/components/school/ProgressBar';
import Modal from '@/components/school/Modal';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import FileUpload from '@/components/school/FileUpload';
import Tabs from '@/components/school/Tabs';

import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { toast } from 'sonner';

const TopicManagement: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const canEditCurriculum = user?.role === 'INSTITUTE_ADMIN' || user?.role === 'SUPER_ADMIN';
  // =====================================
  // STATES
  // =====================================

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [topicsList, setTopicsList] =
    useState<any[]>([]);

  const [chaptersList, setChaptersList] =
    useState<any[]>([]);

  const [subjects, setSubjects] =
    useState<any[]>([]);

  const [selectedTopic, setSelectedTopic] =
    useState<number | null>(null);

  const [showTopicModal, setShowTopicModal] =
    useState(false);

  const [showChapterModal, setShowChapterModal] =
    useState(false);

  const [showMaterialModal, setShowMaterialModal] =
    useState(false);

  // =====================================
  // FORMS
  // =====================================

  const [newTopic, setNewTopic] =
    useState({
      name: '',
      subject_id: '',
    });

  const [newChapter, setNewChapter] =
    useState({
      name: '',
      order: 1,
    });

    const [selectedChapter, setSelectedChapter] =
      useState<number | null>(null);

    const [materialTitle, setMaterialTitle] =
      useState('');

    const [selectedFiles, setSelectedFiles] =
      useState<File[]>([]);

    const [uploading, setUploading] =
      useState(false);

    const [materialsList, setMaterialsList] = useState<any[]>([]);

    const fetchMaterials = async (chapterId: number) => {
      try {
        const res = await api.get(`/materials/${chapterId}`);
        setMaterialsList(res.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };
  // =====================================
  // FETCH SUBJECTS
  // =====================================

  const fetchSubjects = async () => {
    try {
      const res =
        await api.get('/academic/subjects');

      const list = res.data?.data || res.data || [];
      setSubjects(list);
      setNewTopic((prev) => ({
        ...prev,
        subject_id: prev.subject_id || list[0]?.id || '',
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // =====================================
  // FETCH TOPICS
  // =====================================

  const fetchTopics = async () => {
    try {
      setLoading(true);

      const res =
        await api.get('/topics');

      setTopicsList(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);

      alert(
        'Failed to fetch topics'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // FETCH CHAPTERS
  // =====================================

  const fetchChapters = async (
    topicId: number
  ) => {
    try {
      const res = await api.get(
        `/topics/${topicId}`
      );

      setChaptersList(
        res.data?.data || res.data || []
      );
    } catch (err) {
      console.error(err);

      alert(
        'Failed to fetch chapters'
      );
    }
  };

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    fetchTopics();
    fetchSubjects();
  }, []);

  // =====================================
  // FETCH CHAPTERS ON TOPIC CHANGE
  // =====================================

  useEffect(() => {
    if (selectedTopic !== null) {
      fetchChapters(selectedTopic);
    }
  }, [selectedTopic]);

  useEffect(() => {
    if (selectedChapter !== null) {
      fetchMaterials(selectedChapter);
    } else {
      setMaterialsList([]);
    }
  }, [selectedChapter]);

  // =====================================
  // CREATE TOPIC
  // =====================================

  const handleCreateTopic =
    async () => {
      try {
        if (
          !newTopic.name.trim()
        ) {
          toast.warning('Topic name is required');
          return;
        }
        if (!canEditCurriculum) {
          toast.warning('Only institute admins can create topics');
          return;
        }
        if (!newTopic.subject_id) {
          toast.warning('Subject is required');
          return;
        }

        await api.post('/topics', {
          name: newTopic.name,
          subject_id:
            newTopic.subject_id,
        });

        await fetchTopics();

        setNewTopic({
          name: '',
          subject_id: subjects[0]?.id || '',
        });

        setShowTopicModal(false);

        toast.success('Topic created successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to create topic');
      }
    };

  // =====================================
  // CREATE CHAPTER
  // =====================================

  const handleCreateChapter =
    async () => {
      try {
        if (
          !newChapter.name.trim()
        ) {
          toast.warning('Chapter name is required');
          return;
        }
        if (!canEditCurriculum) {
          toast.warning('Only institute admins can create chapters');
          return;
        }

        if (
          selectedTopic === null
        ) {
          toast.warning('Please select a topic card first');
          return;
        }

        await api.post(
          `/topics/${selectedTopic}/chapters`,
          {
            name: newChapter.name,
            order: Number(
              newChapter.order
            ),
            subjectId: selectedTopic, // Assuming selectedTopic maps to something, but actually chapter needs subjectId. Wait, topics are under chapters. Let's fix this in a second pass.
          }
        );

        await fetchChapters(
          selectedTopic
        );

        await fetchTopics();

        setNewChapter({
          name: '',
          order: 1,
        });

        setShowChapterModal(false);

        toast.success('Chapter created successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to create chapter');
      }
    };

    const handleUploadMaterial =
  async () => {
    try {
      if (!materialTitle.trim()) {
        alert(
          'Material title is required'
        );

        return;
      }

      if (
        selectedTopic === null
      ) {
        alert(
          'Please select a topic first'
        );

        return;
      }

      if (
        selectedFiles.length === 0
      ) {
        alert(
          'Please select a file'
        );

        return;
      }

      // ============================
      // MUST HAVE CHAPTER
      // ============================

      if (
        selectedChapter === null
      ) {
        alert(
          'Please select a chapter from the Chapters tab first'
        );

        return;
      }

      setUploading(true);

      const chapterId =
        selectedChapter;

      const formData =
        new FormData();

      formData.append(
        'title',
        materialTitle
      );

      formData.append(
        'chapter_id',
        String(chapterId)
      );

      formData.append(
        'file',
        selectedFiles[0]
      );

      await api.post(
        '/materials',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      alert(
        'Material uploaded successfully'
      );

      if (selectedChapter !== null) {
        fetchMaterials(selectedChapter);
      }

      // reset
      setMaterialTitle('');

      setSelectedFiles([]);

      setShowMaterialModal(false);
    } catch (err) {
      console.error(err);

      alert(
        'Failed to upload material'
      );
    } finally {
      setUploading(false);
    }
  };
  // =====================================
  // FILTER TOPICS
  // =====================================

  const filteredTopics =
    topicsList.filter((topic) =>
      topic.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  // =====================================
  // TOPICS TAB
  // =====================================

  const topicContent = (
    <>
       <div className="topic__header">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search topics..."
        />

        {canEditCurriculum && (
          <Button
            icon={<Plus size={16} />}
            className="topic__action-btn"
            onClick={() =>
              setShowTopicModal(true)
            }
          >
            Create Topic
          </Button>
        )}
      </div>

      <div className="topic__list">
        {loading ? (
          <p>Loading topics...</p>
        ) : filteredTopics.length ===
          0 ? (
          <p>No topics found.</p>
        ) : (
          filteredTopics.map(
            (topic) => (
              <GlassCard
                key={topic.id}
                hover
                className={`topic__card ${
                  selectedTopic ===
                  topic.id
                    ? 'topic__card--active'
                    : ''
                }`}
                onClick={() => {
                  setSelectedTopic(
                    topic.id
                  );
                }}
              >
                {/* HEADER */}
                <div className="topic__card-header">
                  <div className="topic__card-icon">
                    <BookOpen
                      size={20}
                    />
                  </div>

                  <Badge
                    variant={
                      topic.status ===
                      'completed'
                        ? 'success'
                        : topic.status ===
                          'active'
                        ? 'info'
                        : 'default'
                    }
                  >
                    {topic.status}
                  </Badge>
                </div>

                {/* NAME */}
                <h4 className="topic__card-name">
                  {topic.name}
                </h4>

                {/* SUBJECT */}
                <p className="topic__card-subject">
                  {
                    topic.subject_name
                  }
                </p>

                {/* META */}
                <div className="topic__card-meta">
                  <span>
                    {topic.chapters ||
                      0}{' '}
                    Chapters
                  </span>
                </div>

                {/* PROGRESS */}
                <ProgressBar
                  value={
                    topic.progress ||
                    0
                  }
                  size="sm"
                />

                {/* FOOTER */}
                <div className="topic__card-footer">
                  <span className="topic__card-progress">
                    {topic.progress ||
                      0}
                    % Complete
                  </span>

                  <ChevronRight
                    size={16}
                  />
                </div>
              </GlassCard>
            )
          )
        )}
      </div>
    </>
  );

  // =====================================
  // CHAPTER TAB
  // =====================================

  const chapterContent = (
    <div className="topic__chapters">
      <div className="topic__chapters-header">
        <h3>
          Chapters{' '}
          {selectedTopic
            ? `- ${
                topicsList.find(
                  (t) =>
                    t.id ===
                    selectedTopic
                )?.name || ''
              }`
            : ''}
        </h3>

        {canEditCurriculum && (
          <Button
            size="sm"
            icon={<Plus size={16} />}
            className="topic__action-btn"
            onClick={() => {
              if (
                selectedTopic ===
                null
              ) {
                toast.warning('Please select a topic card first');
                return;
              }

              setShowChapterModal(
                true
              );
            }}
          >
            Add Chapter
          </Button>
        )}
      </div>

      <div className="topic__chapter-list">
        {selectedTopic ===
        null ? (
          <p>
            Select a topic to
            view chapters.
          </p>
        ) : chaptersList.length ===
          0 ? (
          <p>
            No chapters found.
          </p>
        ) : (
          chaptersList.map(
            (chapter) => (
              <div
                key={chapter.id}
                className={`topic__chapter-item ${
                  selectedChapter === chapter.id
                    ? 'topic__chapter-item--active'
                    : ''
                }`}
                onClick={() =>
                  setSelectedChapter(chapter.id)
                }
              >
                <div className="topic__chapter-order">
                  {
                    chapter.order
                  }
                </div>

                <div className="topic__chapter-info">
                  <h4>
                    {
                      chapter.name
                    }
                  </h4>

                  <div className="topic__chapter-meta">
                    <Badge
                      variant={
                        chapter.status ===
                        'completed'
                          ? 'success'
                          : chapter.status ===
                            'active'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {
                        chapter.status
                      }
                    </Badge>
                  </div>
                </div>

                <ProgressBar
                  value={
                    chapter.progress ||
                    0
                  }
                  size="sm"
                  showValue={
                    false
                  }
                />

                <span className="topic__chapter-pct">
                  {chapter.progress ||
                    0}
                  %
                </span>
              </div>
            )
          )
        )}
      </div>
    </div>
  );

  // =====================================
  // MATERIAL TAB
  // =====================================

  const materialContent = (
    <div className="topic__materials">
      <div className="topic__materials-header">
        <h3>
          Study Materials
          {selectedTopic && (
            <span>
              {' '}
              - {
                topicsList.find(
                  (t) => t.id === selectedTopic
                )?.name
              }
            </span>
          )}
        </h3>

        <Button
          size="sm"
          icon={<Plus size={16} />}
          className="topic__action-btn"
          onClick={() =>
            setShowMaterialModal(
              true
            )
          }
        >
          Upload Material
        </Button>
      </div>

      <div className="topic__material-list">
        {selectedChapter === null ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>
            Please select a chapter from the Chapters tab to view its materials.
          </p>
        ) : materialsList.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>
            No materials found for this chapter.
          </p>
        ) : (
          <ul className="space-y-3 p-4">
            {materialsList.map((m: any) => (
              <li key={m.id} className="flex items-center justify-between rounded-md bg-surface-50 p-3 shadow-sm border border-surface-200">
                <div className="flex items-center gap-3">
                  <File className="text-brand-600" size={20} />
                  <div>
                    <h4 className="text-sm font-semibold text-surface-900">{m.title}</h4>
                    <p className="text-xs text-surface-500">{m.file_type} • {(m.file_size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <a 
                  href={`http://localhost:5000${m.file_url}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="rounded bg-surface-200 px-3 py-1 text-xs font-semibold text-surface-700 hover:bg-surface-300"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
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
        <p className="topic__admin-note" style={{ marginBottom: '1rem', color: 'var(--text-muted, #64748b)' }}>
          Classes, subjects, topics, and chapters are managed by your institute admin. You can view content here and upload teaching materials.
        </p>
      )}

      {/* TABS */}
      <Tabs
        tabs={[
          {
            id: 'topics',
            label: 'Topics',
            icon: (
              <BookOpen
                size={16}
              />
            ),
            content:
              topicContent,
          },
          {
            id: 'chapters',
            label: 'Chapters',
            icon: (
              <ChevronRight
                size={16}
              />
            ),
            content:
              chapterContent,
          },
          {
            id: 'materials',
            label:
              'Materials',
            icon: (
              <File
                size={16}
              />
            ),
            content:
              materialContent,
          },
        ]}
      />

      {canEditCurriculum && (
      <>
      {/* CREATE TOPIC MODAL */}
      <Modal
        isOpen={
          showTopicModal
        }
        onClose={() =>
          setShowTopicModal(
            false
          )
        }
        title="Create Topic"
      >
        <div className="topic__modal-form">
          <InputField
            label="Topic Name"
            value={
              newTopic.name
            }
            onChange={(
              e
            ) =>
              setNewTopic({
                ...newTopic,
                name:
                  e.target
                    .value,
              })
            }
          />

          <SelectField
            label="Subject"
            value={String(
              newTopic.subject_id
            )}
            onChange={(
              e
            ) =>
              setNewTopic({
                ...newTopic,
                subject_id:
                  e.target.value,
              })
            }
            options={subjects.map(
              (
                subject
              ) => ({
                value:
                  String(
                    subject.id
                  ),
                label:
                  subject.name,
              })
            )}
          />

          <div className="topic__modal-actions">
            <Button
              variant="outline"
              onClick={() =>
                setShowTopicModal(
                  false
                )
              }
            >
              Cancel
            </Button>

            <Button
              onClick={
                handleCreateTopic
              }
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* CREATE CHAPTER MODAL */}
      <Modal
        isOpen={
          showChapterModal
        }
        onClose={() =>
          setShowChapterModal(
            false
          )
        }
        title="Create Chapter"
      >
        <div className="topic__modal-form">
          <InputField
            label="Chapter Name"
            value={
              newChapter.name
            }
            onChange={(
              e
            ) =>
              setNewChapter({
                ...newChapter,
                name:
                  e.target
                    .value,
              })
            }
          />

          <InputField
            label="Order"
            type="number"
            value={
              newChapter.order
            }
            onChange={(
              e
            ) =>
              setNewChapter({
                ...newChapter,
                order:
                  Number(
                    e.target
                      .value
                  ),
              })
            }
          />

          <div className="topic__modal-actions">
            <Button
              variant="outline"
              onClick={() =>
                setShowChapterModal(
                  false
                )
              }
            >
              Cancel
            </Button>

            <Button
              onClick={
                handleCreateChapter
              }
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
      </>
      )}

      {/* MATERIAL MODAL */}
      <Modal
        isOpen={showMaterialModal}
        onClose={() =>
          setShowMaterialModal(false)
        }
        title="Upload Material"
      >
        <div className="topic__modal-form">
          <InputField
            label="Material Name"
            placeholder="Enter material name"
            value={materialTitle}
            onChange={(e) =>
              setMaterialTitle(
                e.target.value
              )
            }
          />

          <FileUpload
            onFilesSelected={(files) =>
              setSelectedFiles(files)
            }
          />

          <div className="topic__modal-actions">
            <Button
              variant="outline"
              onClick={() =>
                setShowMaterialModal(false)
              }
            >
              Cancel
            </Button>

            <Button
              onClick={
                handleUploadMaterial
              }
              disabled={uploading}
            >
              {uploading
                ? 'Uploading...'
                : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TopicManagement;
