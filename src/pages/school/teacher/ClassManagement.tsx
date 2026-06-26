
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { SchoolVideoPlayer } from '@/components/school/SchoolVideoPlayer';
import { Video, Users, Clock, Plus, Radio, PlayCircle, Trash2, Upload, Youtube, Image as ImageIcon, FileText, Loader2, BarChart3, Download, ChevronRight, X, Sparkles, TrendingUp, XCircle, CheckCircle, ListChecks, Trophy, Copy, Eye, EyeOff, ArrowRight, ImagePlus, RefreshCw } from 'lucide-react';
import { schoolLive, type CreatedLecture, type LiveLecture } from '@/lib/api/school-live';
import { Highlight } from '@/types/highlight';
import { HighlightRenderer } from '@/lib/highlight-renderer';

/**
 * Transcript/notes status pill for a recording card. While transcription (or
 * notes generation) is running, it shows a time-based estimated percentage with
 * a progress bar — the AI service can't report real Whisper progress, so this
 * climbs over elapsed time, exactly like the coaching lecture card.
 */
const TranscriptStatusBadge: React.FC<{ rec: any; onView: () => void; onRetry: () => void }> = ({ rec, onView, onRetry }) => {
  const ts = rec.transcript_status;
  const ns = rec.notes_status;
  const transcribing = ts === 'pending' || ts === 'processing';
  const notesGenerating = ts === 'done' && (ns === 'pending' || ns === 'processing');
  const active = transcribing || notesGenerating;

  const [now, setNow] = useState(Date.now());
  const notesStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) { notesStartRef.current = null; return; }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (notesGenerating && notesStartRef.current == null) notesStartRef.current = Date.now();
  if (rec.source === 'youtube' || !ts) return null;

  const progressBar = (label: string, pct: number, tone: 'amber' | 'blue') => {
    const c = tone === 'amber'
      ? { text: 'text-amber-600', bg: 'bg-amber-100', fill: 'bg-amber-500' }
      : { text: 'text-blue-600', bg: 'bg-blue-100', fill: 'bg-blue-500' };
    return (
      <div className="w-40">
        <div className={`flex items-center justify-between text-[10px] font-bold ${c.text}`}>
          <span className="inline-flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> {label}</span>
          <span>{pct}%</span>
        </div>
        <div className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${c.bg}`}>
          <div className={`h-full rounded-full ${c.fill} transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  if (transcribing) {
    const start = rec.created_at ? new Date(rec.created_at).getTime() : now;
    const elapsed = Math.max(0, (now - start) / 1000);
    // Climb to ~95% over ~5 min, then hold until the backend flips it to done/failed.
    const pct = Math.min(95, Math.round(3 + (elapsed / 300) * 92));
    return progressBar('Transcribing…', pct, 'amber');
  }
  if (ts === 'failed') {
    return (
      <button onClick={onRetry} className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
        Transcript failed · Retry
      </button>
    );
  }
  if (notesGenerating) {
    const start = notesStartRef.current ?? now;
    const elapsed = Math.max(0, (now - start) / 1000);
    const pct = Math.min(95, Math.round(5 + (elapsed / 180) * 90));
    return progressBar('Generating notes…', pct, 'blue');
  }
  return (
    <div className="inline-flex items-center gap-1">
      <button onClick={onView} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
        <Download size={11} /> Transcript Ready
      </button>
      <button
        onClick={onRetry}
        title="Transcript incorrect? Regenerate it"
        className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
      >
        <RefreshCw size={9} />
      </button>
    </div>
  );
};
const CredRow: React.FC<{ label: string; value: string; onCopy: () => void }> = ({ label, value, onCopy }) => (
  <div>
    <div className="mb-1 flex items-center justify-between">
      <span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>
      <button onClick={onCopy} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
        <Copy size={13} /> Copy
      </button>
    </div>
    <code className="block w-full overflow-x-auto rounded-xl bg-slate-100 px-3 py-2.5 font-mono text-sm text-slate-800">{value || '—'}</code>
  </div>
);

import Button from '@/components/school/Button';
import Badge from '@/components/school/Badge';
import Tabs from '@/components/school/Tabs';
import Modal from '@/components/school/Modal';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import DataTable from '@/components/school/DataTable';
import api from '@/lib/api/school-client';
import { putFileToS3 } from '@/lib/api/upload';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { useAuth } from '@/context/SchoolAuthContext';

import './ClassManagement.css';

const ClassManagement: React.FC = () => {
  const { user } = useAuth();
  // navigate removed because calendar tab was removed
  const navigate = useNavigate();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [liveClassData, setLiveClassData] = useState([]);

  // ── Live (self-hosted OBS/RTMP) ─────────────────────────────────────────────
  const [obsLectures, setObsLectures] = useState<LiveLecture[]>([]);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [creatingLive, setCreatingLive] = useState(false);
  const [createdLive, setCreatedLive] = useState<CreatedLecture | null>(null);
  const [credsLecture, setCredsLecture] = useState<LiveLecture | null>(null); // re-show creds for an existing row
  const [showKey, setShowKey] = useState(false);

  const fetchObsLectures = async () => {
    try { setObsLectures(await schoolLive.listLectures()); }
    catch (err) { console.error('Failed to fetch live lectures', err); }
  };

  const openCreateLive = () => {
    setCreatedLive(null); setCredsLecture(null); setLiveTitle(''); setShowKey(false); setShowLiveModal(true);
  };

  const submitCreateLive = async () => {
    if (!liveTitle.trim()) { toast.warning('Enter a lecture title'); return; }
    setCreatingLive(true);
    try {
      const res = await schoolLive.createLecture(liveTitle.trim());
      setCreatedLive(res);
      toast.success('Live class created');
      fetchObsLectures();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create live class');
    } finally {
      setCreatingLive(false);
    }
  };

  // Credentials currently shown in the modal (from a fresh create or an existing row).
  const activeCreds: CreatedLecture | null = createdLive
    ? createdLive
    : credsLecture
      ? {
          lectureId: credsLecture.id,
          streamKey: credsLecture.streamKey || '',
          rtmpUrl: credsLecture.rtmpUrl || '',
          playbackUrl: credsLecture.playbackUrl || '',
        }
      : null;

  const copyText = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };
  const [recordedClassData, setRecordedClassData] = useState([]);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoSource, setVideoSource] = useState<'upload' | 'youtube'>('upload');
  const [recChapters, setRecChapters] = useState<any[]>([]);
  const [recTopics, setRecTopics] = useState<any[]>([]);
  const [recFilter, setRecFilter] = useState({ subjectId: '', chapterId: '', topicId: '' });
  const [filterChapters, setFilterChapters] = useState<any[]>([]);
  const [filterTopics, setFilterTopics] = useState<any[]>([]);
  const [detailRec, setDetailRec] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'notes' | 'transcript' | 'quiz'>('overview');
  const [quizSubTab, setQuizSubTab] = useState<'questions' | 'students'>('questions');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [quizAnalytics, setQuizAnalytics] = useState<any | null>(null);
  const [quizAnalyticsLoading, setQuizAnalyticsLoading] = useState(false);
  const [quizAnalyticsError, setQuizAnalyticsError] = useState<string | null>(null);

  // Notes highlight state
  const [notesHighlights, setNotesHighlights] = useState<Highlight[]>([]);
  const [notesToolbar, setNotesToolbar] = useState<{
    rect: DOMRect;
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [notesHighlightColor, setNotesHighlightColor] = useState("#fef08a");
  const notesContentRef = useRef<HTMLDivElement>(null);
  const [recordingForm, setRecordingForm] = useState({
    title: '',
    description: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    chapterId: '',
    topicId: '',
    recordedDate: '',
    duration: '',
    youtubeUrl: '',
    language: 'en',
  });
  const [academicClasses, setAcademicClasses] = useState<any[]>([]);
  const [academicSubjects, setAcademicSubjects] = useState<any[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    classId: '',
    subjectId: '',
    date: '',
    time: '',
    duration: '45',
    zoomLink: '',
    googleMeetLink: '',
    liveStatus: 'scheduled',
    recurringSchedule: 'none',
  });

  const recordingClassOptions = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string }>();
    teacherAssignments.forEach((assignment: any) => {
      if (!assignment.classId) return;
      classMap.set(String(assignment.classId), {
        id: String(assignment.classId),
        name: assignment.className || academicClasses.find((item) => String(item.id) === String(assignment.classId))?.name || 'Class',
      });
    });
    return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [academicClasses, teacherAssignments]);

  const recordingSectionOptions = useMemo(() => {
    if (!recordingForm.classId) return [];
    const sectionMap = new Map<string, { id: string; name: string }>();
    teacherAssignments
      .filter((assignment: any) => String(assignment.classId) === String(recordingForm.classId))
      .forEach((assignment: any) => {
        if (!assignment.sectionId) return;
        sectionMap.set(String(assignment.sectionId), {
          id: String(assignment.sectionId),
          name: assignment.sectionName || 'Section',
        });
      });

    return Array.from(sectionMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [recordingForm.classId, teacherAssignments]);

  const recordingSubjectOptions = useMemo(() => {
    if (!recordingForm.classId || !recordingForm.sectionId) return [];
    const subjectMap = new Map<string, { id: string; name: string }>();
    const matchingAssignments = teacherAssignments.filter((assignment: any) =>
      String(assignment.classId) === String(recordingForm.classId)
      && String(assignment.sectionId) === String(recordingForm.sectionId)
    );

    matchingAssignments.forEach((assignment: any) => {
      if (!assignment.subjectId) return;
      subjectMap.set(String(assignment.subjectId), {
        id: String(assignment.subjectId),
        name: assignment.subjectName || academicSubjects.find((item) => String(item.id) === String(assignment.subjectId))?.name || 'Subject',
      });
    });

    const canUseSectionSubjects = matchingAssignments.some((assignment: any) => assignment.isClassTeacher && !assignment.subjectId);
    if (canUseSectionSubjects) {
      academicSubjects
        .filter((subject: any) => {
          const subjectClassId = subject.classId ?? subject.class_id;
          const subjectSectionId = subject.sectionId ?? subject.section_id;
          return String(subjectClassId) === String(recordingForm.classId)
            && (!subjectSectionId || String(subjectSectionId) === String(recordingForm.sectionId));
        })
        .forEach((subject: any) => subjectMap.set(String(subject.id), { id: String(subject.id), name: subject.name }));
    }

    return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [academicSubjects, recordingForm.classId, recordingForm.sectionId, teacherAssignments]);

  const liveColumns = [
    { key: 'title', title: 'Class Title' },
    { key: 'class', title: 'Class', render: (v: string) => <Badge variant="purple">{v}</Badge> },
    { key: 'date', title: 'Date' },
    { key: 'time', title: 'Time', render: (v: string) => <span className="class__time"><Clock size={14} /> {v}</span> },
    { key: 'duration', title: 'Duration' },
    {
      key: 'status', title: 'Status', render: (v: string) => (
        <Badge variant={v === 'live' ? 'error' : 'info'}>{v === 'live' ? 'Live Now' : 'Scheduled'}</Badge>
      )
    },
    { key: 'attendees', title: 'Attendees', render: (v: number) => v > 0 ? <span className="class__attendees"><Users size={14} /> {v}</span> : '-' },
  ];

  useEffect(() => {
    fetchSchedules();
    fetchObsLectures();
    fetchRecordedClasses();
    fetchAcademicData();
  }, [user?.id]);

  const fetchAcademicData = async () => {
    try {
      const requests: Promise<any>[] = [
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
      ];
      if (user?.id) requests.push(api.get(`/teachers/${user.id}`));
      const [classRes, subjectRes, teacherRes] = await Promise.all(requests);
      const classes = classRes.data?.data ?? classRes.data ?? [];
      const subjects = subjectRes.data?.data ?? subjectRes.data ?? [];
      const teacher = teacherRes?.data?.data ?? teacherRes?.data ?? {};
      setAcademicClasses(Array.isArray(classes) ? classes : []);
      setAcademicSubjects(Array.isArray(subjects) ? subjects : []);
      setTeacherAssignments(Array.isArray(teacher?.teacherProfile?.assignments) ? teacher.teacherProfile.assignments : []);
    } catch (error) {
      console.error('Failed to fetch academic master data', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules');
      const formattedData = response.data.data.map((item: any) => ({
        id: item.id,
        title: item.subject_name || item.title,
        class: item.class_name,
        date: item.day_of_week,
        time: `${new Date(`1970-01-01T${item.start_time}`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })} - ${new Date(`1970-01-01T${item.end_time}`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}`,
        duration: '-',
        status: item.live_status || 'scheduled',
        attendees: 0,
        zoomLink: item.zoom_link,
        googleMeetLink: item.google_meet_link,
      }));

      setLiveClassData(formattedData);
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    }
  };

  const fetchRecordedClasses = async () => {
    try {
      const response = await api.get('/classes/recordings');
      const rows = response.data?.data ?? response.data ?? [];
      setRecordedClassData(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('Failed to fetch recordings', error);
    }
  };

  const fetchQuizAnalytics = async (recordingId: string) => {
    setQuizAnalyticsLoading(true);
    setQuizAnalyticsError(null);
    try {
      const response = await api.get(`/classes/recordings/${recordingId}/quiz-analytics`);
      setQuizAnalytics(response.data?.data ?? response.data ?? null);
    } catch (error: any) {
      console.error('Failed to fetch quiz analytics', error);
      setQuizAnalytics(null);
      setQuizAnalyticsError(error?.response?.status === 404
        ? 'Student results endpoint is not available on the running backend. Restart the backend server.'
        : (error?.response?.data?.message || 'Could not load student results.'));
    } finally {
      setQuizAnalyticsLoading(false);
    }
  };

  // Load chapters when subject changes (in the upload modal)
  useEffect(() => {
    setRecordingForm((p) => ({ ...p, chapterId: '', topicId: '' }));
    setRecTopics([]);
    if (!recordingForm.subjectId) { setRecChapters([]); return; }
    let cancelled = false;
    api.get(`/topics/chapters?subjectId=${recordingForm.subjectId}`)
      .then((res) => { if (!cancelled) setRecChapters(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setRecChapters([]); });
    return () => { cancelled = true; };
  }, [recordingForm.subjectId]);

  // Load topics when chapter changes
  useEffect(() => {
    setRecordingForm((p) => ({ ...p, topicId: '' }));
    if (!recordingForm.chapterId) { setRecTopics([]); return; }
    let cancelled = false;
    api.get(`/topics?chapterId=${recordingForm.chapterId}`)
      .then((res) => { if (!cancelled) setRecTopics(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setRecTopics([]); });
    return () => { cancelled = true; };
  }, [recordingForm.chapterId]);

  const resetRecordingModal = () => {
    setShowRecordingModal(false);
    setRecordingForm({ title: '', description: '', classId: '', sectionId: '', subjectId: '', chapterId: '', topicId: '', recordedDate: '', duration: '', youtubeUrl: '', language: 'en' });
    setRecordingFile(null);
    setThumbnailFile(null);
    setVideoSource('upload');
    setUploadPct(0);
  };

  const isYouTube = (u: string) => /(?:youtube\.com\/|youtu\.be\/)/i.test(u.trim());

  const uploadRecordingFile = async (file: File): Promise<{ url: string; key: string }> => {
    const contentType = file.type || (file.name.match(/\.(png|jpe?g|webp)$/i) ? 'image/jpeg' : 'video/mp4');
    const presign = await api.post('/classes/recordings/upload-url', {
      fileName: file.name,
      contentType,
      fileSize: file.size,
    });
    const { uploadUrl, fileUrl, key } = presign.data?.data ?? presign.data;
    const isVideo = contentType.startsWith('video') || contentType.startsWith('audio');
    await putFileToS3(uploadUrl, file, contentType, (e: any) => {
      if (isVideo && e?.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
    });
    return { url: fileUrl, key };
  };

  const handleUploadRecording = async () => {
    if (!recordingForm.title.trim()) { alert('Please enter a recording title'); return; }
    if (!recordingForm.classId) { alert('Please select a class'); return; }
    if (!recordingForm.sectionId) { alert('Please select a section'); return; }
    if (!recordingForm.subjectId) { alert('Please select a subject'); return; }
    if (videoSource === 'upload' && !recordingFile) { alert('Please choose a video file to upload'); return; }
    if (videoSource === 'youtube') {
      if (!recordingForm.youtubeUrl.trim()) { alert('Please paste a YouTube URL'); return; }
      if (!isYouTube(recordingForm.youtubeUrl)) { alert('That does not look like a YouTube link'); return; }
    }
    setUploadingRecording(true);
    setUploadPct(0);
    try {
      let videoUrl = '';
      let videoKey: string | undefined;
      if (videoSource === 'upload' && recordingFile) {
        const up = await uploadRecordingFile(recordingFile);
        videoUrl = up.url;
        videoKey = up.key;
      } else {
        videoUrl = recordingForm.youtubeUrl.trim();
      }

      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        try { thumbnailUrl = (await uploadRecordingFile(thumbnailFile)).url; }
        catch { /* thumbnail optional — ignore failure */ }
      }

      await api.post('/classes/recordings', {
        title: recordingForm.title.trim(),
        description: recordingForm.description || undefined,
        classId: recordingForm.classId || undefined,
        sectionId: recordingForm.sectionId || undefined,
        subjectId: recordingForm.subjectId || undefined,
        chapterId: recordingForm.chapterId || undefined,
        topicId: recordingForm.topicId || undefined,
        recordedDate: recordingForm.recordedDate || undefined,
        duration: recordingForm.duration || undefined,
        videoUrl,
        videoKey,
        thumbnailUrl,
        source: videoSource,
        language: recordingForm.language,
      });
      resetRecordingModal();
      fetchRecordedClasses();
    } catch (error: any) {
      console.error('Failed to upload recording', error);
      alert(error?.response?.data?.message || error?.message || 'Failed to upload recording');
    } finally {
      setUploadingRecording(false);
    }
  };

  useLiveRefresh(() => {
    fetchSchedules();
    fetchObsLectures();
    fetchRecordedClasses();
  }, [], 30000);

  const deleteRecording = async (id: string) => {
    if (!window.confirm('Delete this recording?')) return;
    try { await api.delete(`/classes/recordings/${id}`); fetchRecordedClasses(); }
    catch (e) { console.error('Failed to delete recording', e); }
  };

  const handleRetranscribe = async (id: string) => {
    try { await api.post(`/classes/recordings/${id}/retranscribe`); fetchRecordedClasses(); }
    catch (e) { console.error('Failed to start transcription', e); alert('Could not start transcription. Is the AI service running?'); }
  };

  const handleRegenerateNotes = async (id: string) => {
    try {
      await api.post(`/classes/recordings/${id}/regenerate-notes`);
      // Optimistically reflect "processing" so the panel updates immediately.
      setDetailRec((prev: any) => (prev && prev.id === id ? { ...prev, notes_status: 'processing' } : prev));
      fetchRecordedClasses();
    } catch (e: any) {
      console.error('Failed to generate notes', e);
      alert(e?.response?.data?.message || 'Could not generate notes. Make sure the transcript is ready and the AI service is running.');
    }
  };

  const [addingVisuals, setAddingVisuals] = useState(false);
  const handleAddVisuals = async (id: string) => {
    if (addingVisuals) return;
    setAddingVisuals(true);
    try {
      await api.post(`/classes/recordings/${id}/regenerate-notes-images`);
      toast.success('Image enrichment started — notes will update in ~30 seconds');
      setTimeout(() => fetchRecordedClasses(), 35000);
    } catch (e: any) {
      console.error('Failed to add visuals', e);
      toast.error(e?.response?.data?.message || 'Could not add visuals. Try again.');
    } finally {
      setAddingVisuals(false);
    }
  };

  const handleGenerateQuiz = async (id: string) => {
    try {
      await api.post(`/classes/recordings/${id}/generate-quiz`);
      setQuizAnalytics(null);
      setQuizAnalyticsError(null);
      setDetailRec((prev: any) => (prev && prev.id === id ? { ...prev, quiz_status: 'processing' } : prev));
      fetchRecordedClasses();
    } catch (e: any) {
      console.error('Failed to generate quiz', e);
      alert(e?.response?.data?.message || 'Could not generate quiz. Make sure the transcript or notes are ready and the AI service is running.');
    }
  };

  // Curriculum filters for the recorded list
  useEffect(() => {
    setRecFilter((p) => ({ ...p, chapterId: '', topicId: '' }));
    setFilterTopics([]);
    if (!recFilter.subjectId) { setFilterChapters([]); return; }
    let cancelled = false;
    api.get(`/topics/chapters?subjectId=${recFilter.subjectId}`)
      .then((res) => { if (!cancelled) setFilterChapters(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setFilterChapters([]); });
    return () => { cancelled = true; };
  }, [recFilter.subjectId]);

  useEffect(() => {
    setRecFilter((p) => ({ ...p, topicId: '' }));
    if (!recFilter.chapterId) { setFilterTopics([]); return; }
    let cancelled = false;
    api.get(`/topics?chapterId=${recFilter.chapterId}`)
      .then((res) => { if (!cancelled) setFilterTopics(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setFilterTopics([]); });
    return () => { cancelled = true; };
  }, [recFilter.chapterId]);

  const filteredRecordings = recordedClassData.filter((r: any) =>
    (!recFilter.subjectId || String(r.subject_id) === recFilter.subjectId) &&
    (!recFilter.chapterId || String(r.chapter_id) === recFilter.chapterId) &&
    (!recFilter.topicId || String(r.topic_id) === recFilter.topicId)
  );

  // Keep the open detail drawer in sync with live refreshes (transcript/notes status + content)
  useEffect(() => {
    setDetailRec((prev: any) => {
      if (!prev) return prev;
      const fresh = recordedClassData.find((r: any) => r.id === prev.id);
      return fresh || prev;
    });
  }, [recordedClassData]);

  useEffect(() => {
    if (detailRec?.id && detailTab === 'quiz' && detailRec.quiz_status === 'done') {
      fetchQuizAnalytics(detailRec.id);
    } else if (!detailRec || detailRec.quiz_status !== 'done') {
      setQuizAnalytics(null);
      setQuizAnalyticsError(null);
    }
  }, [detailRec?.id, detailRec?.quiz_status, detailTab, recordedClassData]);

  // Load highlights from API when recording changes
  const fetchHighlights = async () => {
    if (!detailRec?.id) return;
    try {
      const res = await api.get(`/recordings/${detailRec.id}/highlights`);
      setNotesHighlights(res.data);
    } catch (e) {
      console.error('Failed to fetch highlights', e);
    }
  };

  useEffect(() => {
    setNotesHighlights([]);
    setNotesToolbar(null);
    fetchHighlights();
  }, [detailRec?.id]);

  // Apply <mark> tags to DOM after render
  useEffect(() => {
    const root = notesContentRef.current;
    if (!root) return;

    const timer = setTimeout(() => {
      const renderer = new HighlightRenderer(root, {
        editable: true,
        onDeleteClick: async (hl) => {
          if (!window.confirm('Delete this highlight?')) return;
          try {
            // Optimistic
            setNotesHighlights(prev => prev.filter(x => x.id !== hl.id));
            await api.delete(`/recordings/${detailRec.id}/highlights/${hl.id}`);
          } catch (e) {
            toast.error('Failed to delete highlight');
            fetchHighlights(); // Rollback
          }
        }
      });
      renderer.render(notesHighlights);
    }, 150);

    return () => clearTimeout(timer);
  }, [detailRec?.notes, notesHighlights]);

  // Listen for text selection inside notes
  useEffect(() => {
    if (!detailRec?.id) return;

    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setNotesToolbar(null);
        return;
      }
      const root = notesContentRef.current;
      if (!root) return;
      const anchor = sel.anchorNode;
      if (!anchor || !root.contains(anchor)) {
        setNotesToolbar(null);
        return;
      }
      const text = sel.toString().trim().replace(/\s+/g, " ");
      if (!text || text.length < 1) {
        setNotesToolbar(null);
        return;
      }

      // Calculate the character offset of this selection from the start
      // of the notes content div — used to uniquely identify WHERE in 
      // the text this highlight lives (avoids duplicate-word problem)
      let startOffset = 0;
      const range = sel.getRangeAt(0);
      const preRange = document.createRange();
      preRange.selectNodeContents(root);
      preRange.setEnd(range.startContainer, range.startOffset);
      startOffset = preRange.toString().length;

      setNotesToolbar({
        rect: range.getBoundingClientRect(),
        text,
        startOffset,
        endOffset: startOffset + text.length,
      });
    };

    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [detailRec?.id]);

  const handleSaveNotesHighlight = async () => {
    if (!notesToolbar || !detailRec?.id) return;
    
    // Don't duplicate same offset highlight locally
    if (notesHighlights.some(h => h.startOffset === notesToolbar.startOffset)) {
      setNotesToolbar(null);
      window.getSelection()?.removeAllRanges();
      return;
    }

    const payload = {
      text: notesToolbar.text,
      color: notesHighlightColor,
      startOffset: notesToolbar.startOffset,
      endOffset: notesToolbar.endOffset,
      notesHash: undefined,
    };

    // Optimistic insert
    const tempId = `hl-${Date.now()}`;
    setNotesHighlights(prev => [...prev, { ...payload, id: tempId, recordingId: detailRec.id } as Highlight]);
    setNotesToolbar(null);
    window.getSelection()?.removeAllRanges();

    try {
      const res = await api.post(`/recordings/${detailRec.id}/highlights`, payload);
      setNotesHighlights(prev => prev.map(hl => hl.id === tempId ? res.data : hl));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save highlight');
      fetchHighlights(); // Rollback
    }
  };

  const isExpiredScheduled = (lec: LiveLecture) => {
    if (lec.status !== 'SCHEDULED' || !lec.createdAt) return false;
    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    return new Date(lec.createdAt) < todayMidnight;
  };

  const statusBadge = (lec: LiveLecture) =>
    lec.status === 'LIVE' ? <Badge variant="error">Live Now</Badge>
      : (lec.status === 'ENDED' || isExpiredScheduled(lec)) ? <Badge variant="info">Ended</Badge>
        : <Badge variant="purple">Scheduled</Badge>;

  const liveContent = (
    <div className="class__section">
      {obsLectures.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
          <Radio className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-base font-black text-slate-900">No live classes yet</h3>
          <p className="mt-1 text-sm text-slate-500">Click <b>Go Live (OBS)</b> to create one and get your OBS stream key.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {obsLectures.map((lec) => (
            <div key={lec.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
                <Radio className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">{lec.title}</p>
                <p className="text-xs font-medium text-slate-400">
                  {lec.createdAt ? new Date(lec.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              {statusBadge(lec)}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => { setCreatedLive(null); setCredsLecture(lec); setShowKey(false); setShowLiveModal(true); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <Eye size={14} /> Stream Info
                </button>
                <button
                  onClick={() => navigate(`/school/teacher/live/${lec.id}/dashboard`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  {lec.status === 'LIVE' ? 'Open Live'
                    : (lec.status === 'ENDED' || isExpiredScheduled(lec)) ? 'View Summary'
                    : 'Dashboard'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const toEndTime = (startTime: string, durationMinutes: number) => {
    const [h, m] = String(startTime || '00:00').split(':').map(Number);
    const startTotal = (h * 60) + m;
    const endTotal = startTotal + (Number.isFinite(durationMinutes) ? durationMinutes : 45);
    const endHour = Math.floor((endTotal % (24 * 60)) / 60);
    const endMinute = endTotal % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  const recordedContent = (
    <div className="class__section">
      {/* Curriculum filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Curriculum</span>
        <select value={recFilter.subjectId} onChange={(e) => setRecFilter((p) => ({ ...p, subjectId: e.target.value }))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400">
          <option value="">All subjects</option>
          {academicSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={recFilter.chapterId} disabled={!recFilter.subjectId} onChange={(e) => setRecFilter((p) => ({ ...p, chapterId: e.target.value }))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 disabled:opacity-50">
          <option value="">All chapters</option>
          {filterChapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={recFilter.topicId} disabled={!recFilter.chapterId} onChange={(e) => setRecFilter((p) => ({ ...p, topicId: e.target.value }))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400 disabled:opacity-50">
          <option value="">All topics</option>
          {filterTopics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {filteredRecordings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center">
          <Video size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">No recordings yet</p>
          <p className="mt-1 text-sm text-slate-400">Upload a recorded lecture or paste a YouTube link.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecordings.map((rec: any) => {
            const date = rec.recorded_date ? new Date(rec.recorded_date).toLocaleDateString('en-GB') : '';
            return (
              <div key={rec.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-start gap-4">
                  <button onClick={() => { setDetailRec(rec); setDetailTab('overview'); }}
                    className="group/thumb relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                    {rec.thumbnail_url ? (
                      <img src={rec.thumbnail_url} alt={rec.title} className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950"><PlayCircle size={26} className="text-white/60" /></div>
                    )}
                    {/* Play icon overlay on hover */}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/thumb:bg-black/30 group-hover/thumb:opacity-100">
                      <PlayCircle size={22} className="text-white drop-shadow-lg" />
                    </span>
                    {/* Duration badge */}
                    {rec.duration && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                        {parseFloat(rec.duration) >= 1 ? `${Math.round(parseFloat(rec.duration))} min` : `${Math.round(parseFloat(rec.duration) * 60)}s`}
                      </span>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-slate-900" title={rec.title}>{rec.title}</h4>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          · {[rec.topic_name, rec.subject_name, rec.class_name].filter(Boolean)[0] || 'Lecture'} · {date}
                        </p>
                        <button onClick={() => { setDetailRec(rec); setDetailTab('overview'); }}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                          <ChevronRight size={13} /> Click to view details
                        </button>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-600">Published</span>
                        <TranscriptStatusBadge
                          rec={rec}
                          onView={() => { setDetailRec(rec); setDetailTab('transcript'); }}
                          onRetry={() => handleRetranscribe(rec.id)}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                      <button onClick={() => { setDetailRec(rec); setDetailTab('overview'); }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                        <BarChart3 size={14} /> Live Stats
                      </button>
                      <button onClick={() => deleteRecording(rec.id)} className="text-slate-300 hover:text-rose-500" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const isYouTubeUrl = (u: string) => /(?:youtube\.com\/|youtu\.be\/)/i.test(u || '');
  const youTubeEmbed = (u: string) => {
    const m = (u || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : u;
  };

  return (
    <div className="class">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Lectures</h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {recordedClassData.length} recorded · {obsLectures.length} live classes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Radio size={16} />} onClick={openCreateLive}>Go Live (OBS)</Button>
          <Button icon={<Plus size={16} />} onClick={() => setShowRecordingModal(true)}>Upload Lecture</Button>
        </div>
      </div>
      <Tabs
        tabs={[
          { id: 'recorded', label: 'Recorded', icon: <Video size={16} />, content: recordedContent },
          { id: 'live', label: 'Live Classes', icon: <Radio size={16} />, content: liveContent },
        ]}
      />

      {/* Lecture detail drawer */}
      {detailRec && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailRec(null); }}>
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-600">Published</span>
                    <span className="text-xs font-semibold text-slate-400">
                      {detailRec.recorded_date ? new Date(detailRec.recorded_date).toLocaleDateString('en-GB') : ''}
                    </span>
                  </div>
                  <h3 className="mt-1 truncate text-lg font-black text-slate-900">{detailRec.title}</h3>
                  <p className="truncate text-xs font-semibold text-slate-500">· {detailRec.topic_name || detailRec.subject_name || detailRec.class_name || 'Lecture'}</p>
                </div>
                <button onClick={() => setDetailRec(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={18} /></button>
              </div>
              <div className="mt-4 flex gap-5 border-b border-slate-100">
                {([
                  { id: 'overview', label: 'Overview' },
                  { id: 'notes', label: 'Notes' },
                  { id: 'transcript', label: 'Transcript' },
                  { id: 'quiz', label: 'Quiz' },
                ] as const).map((t) => (
                  <button key={t.id} onClick={() => setDetailTab(t.id)}
                    className={`-mb-px border-b-2 pb-2 text-sm font-bold transition ${detailTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl bg-black">
                    {detailRec.source === 'youtube' || isYouTubeUrl(detailRec.video_url) ? (
                      <iframe src={youTubeEmbed(detailRec.video_url)} title={detailRec.title} className="aspect-video w-full" allowFullScreen />
                    ) : (
                      <video src={detailRec.video_url} controls className="aspect-video w-full" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-800">{detailRec.source === 'youtube' ? 'YouTube' : 'Recorded'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Topic</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{detailRec.topic_name || detailRec.subject_name || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Watch stats</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total Watches', value: detailRec.total_watchers ?? detailRec.views ?? 0 },
                        { label: 'Completion Rate', value: `${detailRec.completion_rate ?? 0}%` },
                        { label: 'Avg Watch', value: `${detailRec.avg_watch_percentage ?? 0}%` },
                        { label: 'Confusion Spots', value: 0 },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-slate-100 p-3">
                          <p className="text-xl font-black text-slate-900">{s.value}</p>
                          <p className="text-xs font-medium text-slate-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {detailRec.description && (
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</p>
                      <p className="mt-1 text-sm text-slate-700">{detailRec.description}</p>
                    </div>
                  )}
                  {/* Video metadata */}
                  {(detailRec.resolution || detailRec.video_size) && (
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Video Info</p>
                      <div className="grid grid-cols-2 gap-3">
                        {detailRec.resolution && (
                          <div className="rounded-xl border border-slate-100 p-3">
                            <p className="text-sm font-black text-slate-900">{detailRec.resolution}</p>
                            <p className="text-xs font-medium text-slate-400">Resolution</p>
                          </div>
                        )}
                        {detailRec.video_size && (
                          <div className="rounded-xl border border-slate-100 p-3">
                            <p className="text-sm font-black text-slate-900">
                              {detailRec.video_size > 1024 * 1024 * 1024
                                ? `${(detailRec.video_size / (1024 * 1024 * 1024)).toFixed(1)} GB`
                                : `${Math.round(detailRec.video_size / (1024 * 1024))} MB`}
                            </p>
                            <p className="text-xs font-medium text-slate-400">File Size</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Thumbnail actions */}
                  {detailRec.source !== 'youtube' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          api.post(`/classes/recordings/${detailRec.id}/regenerate-thumbnail`)
                            .then(() => { toast.success('Thumbnail generation started — refresh in ~30s'); setTimeout(fetchRecordedClasses, 30000); })
                            .catch((e: any) => toast.error(e?.response?.data?.message || 'Failed'));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        <ImageIcon size={13} /> {detailRec.thumbnail_url ? 'Regenerate Thumbnail' : 'Generate Thumbnail'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {detailTab === 'notes' && (
                <div>
                  {detailRec.notes_status === 'done' && detailRec.notes?.trim() ? (
                    <div className="relative">
                      {/* Floating highlight toolbar — appears on text selection */}
                      {notesToolbar && (
                        <div
                          className="fixed z-[250] flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md p-2 shadow-2xl border border-slate-200"
                          style={{
                            top: Math.max(10, notesToolbar.rect.top - 56) + "px",
                            left: Math.max(10, notesToolbar.rect.left + notesToolbar.rect.width / 2 - 120) + "px",
                          }}
                          onMouseDown={e => e.preventDefault()}
                        >
                          {/* Color selector */}
                          <div className="flex items-center gap-1.5 px-1">
                            {(["#fef08a", "#bfdbfe", "#bbf7d0", "#fecaca", "#e9d5ff"] as const).map(color => (
                              <button
                                key={color}
                                type="button"
                                onMouseDown={e => e.preventDefault()}
                                onClick={e => { e.preventDefault(); setNotesHighlightColor(color); }}
                                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                  notesHighlightColor === color
                                    ? "border-slate-700 scale-110"
                                    : "border-transparent"
                                }`}
                                style={{ backgroundColor: color }}
                                title="Select color"
                              />
                            ))}
                          </div>
                          <div className="w-px h-5 bg-slate-200" />
                          {/* Save button */}
                          <button
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={e => { e.preventDefault(); handleSaveNotesHighlight(); }}
                            className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors flex items-center gap-1.5"
                          >
                            ✦ Save
                          </button>
                          {/* Clear all button — only shows when highlights exist */}
                          {notesHighlights.length > 0 && (
                            <>
                              <div className="w-px h-5 bg-slate-200" />
                              <button
                                type="button"
                                onMouseDown={e => e.preventDefault()}
                                onClick={e => {
                                  e.preventDefault();
                                  setNotesHighlights([]);
                                  setNotesToolbar(null);
                                  window.getSelection()?.removeAllRanges();
                                }}
                                className="text-[10px] font-bold text-red-400 hover:text-red-600 px-1 transition-colors"
                                title="Clear all highlights"
                              >
                                Clear all
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Notes header: status + actions */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <Sparkles size={13} /> AI-generated notes
                        </span>
                        {/* Visuals badge */}
                        {(() => {
                          const imgs = Array.isArray(detailRec.notes_images) ? detailRec.notes_images : [];
                          return imgs.length > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                              <ImagePlus size={10} /> {imgs.length} visual{imgs.length !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                              <ImagePlus size={10} /> No visuals
                            </span>
                          );
                        })()}
                        <div className="ml-auto flex items-center gap-2">
                          {/* Add / Refresh visuals */}
                          <button
                            onClick={() => handleAddVisuals(detailRec.id)}
                            disabled={addingVisuals}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                          >
                            {addingVisuals ? <Loader2 size={11} className="animate-spin" /> : <ImagePlus size={11} />}
                            {Array.isArray(detailRec.notes_images) && detailRec.notes_images.length > 0
                              ? 'Refresh visuals'
                              : 'Add visuals'}
                          </button>
                          <button onClick={() => handleRegenerateNotes(detailRec.id)} className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:underline">
                            Regenerate notes
                          </button>
                        </div>
                      </div>

                      {/* Visuals info strip (when images exist) */}
                      {Array.isArray(detailRec.notes_images) && detailRec.notes_images.length > 0 && (
                        <div className="mb-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700">
                          <ImagePlus size={13} className="mt-0.5 shrink-0 text-blue-500" />
                          <span>
                            <span className="font-bold">{detailRec.notes_images.length} educational image{detailRec.notes_images.length !== 1 ? 's' : ''}</span>
                            {' '}embedded at:{' '}
                            {detailRec.notes_images.map((img: any, i: number) => (
                              <span key={i} className="font-semibold">
                                {img.heading?.replace(/^#+\s*/, '')}
                                {i < detailRec.notes_images.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}

                      {/* Notes content — wrap MarkdownRenderer in a ref div */}
                      <div ref={notesContentRef} className="select-text">
                        <MarkdownRenderer content={detailRec.notes} className="prose-slate" />
                      </div>
                    </div>
                  ) : detailRec.notes_status === 'processing' || detailRec.notes_status === 'pending' ? (
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Generating AI notes from the transcript…</p>
                  ) : detailRec.transcript_status === 'done' ? (
                    <div className="text-center">
                      {detailRec.notes_status === 'failed' && (
                        <p className="mb-3 text-sm text-rose-500">Notes generation failed. Try again.</p>
                      )}
                      <Button icon={<Sparkles size={16} />} onClick={() => handleRegenerateNotes(detailRec.id)}>
                        {detailRec.notes_status === 'failed' ? 'Retry notes generation' : 'Generate AI notes'}
                      </Button>
                      <p className="mt-2 text-xs text-slate-400">Builds structured notes from the transcript (Odia notes via Gemini).</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Notes are generated from the transcript — they'll be available once transcription finishes.</p>
                  )}
                </div>
              )}
              {detailTab === 'transcript' && (
                detailRec.source === 'youtube' ? (
                  <p className="text-sm text-slate-500">Transcripts are generated for uploaded videos only.</p>
                ) : detailRec.transcript_status === 'done' ? (
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle size={13} /> Transcript ready
                      </span>
                      <button
                        onClick={() => {
                          handleRetranscribe(detailRec.id);
                          setDetailRec((prev: any) => prev ? { ...prev, transcript_status: 'processing' } : prev);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <RefreshCw size={11} /> Regenerate transcript
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{detailRec.transcript}</p>
                  </div>
                ) : detailRec.transcript_status === 'failed' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-rose-500">Transcription failed.</p>
                    <button
                      onClick={() => {
                        handleRetranscribe(detailRec.id);
                        setDetailRec((prev: any) => prev ? { ...prev, transcript_status: 'processing' } : prev);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                    >
                      <RefreshCw size={14} /> Retry transcription
                    </button>
                  </div>
                ) : (
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Transcribing… check back shortly.</p>
                )
              )}
              {detailTab === 'quiz' && (
                <div>
                  {detailRec.quiz_status === 'done' && Array.isArray(detailRec.quiz) && detailRec.quiz.length ? (
                    (() => {
                      const analytics = quizAnalytics ?? { students: [], questionStats: [], totalWatchers: 0 };
                      const quizAvg = analytics && analytics.students.filter(s => s.quizScore !== null).length > 0
                        ? Math.round(analytics.students.filter(s => s.quizScore !== null).reduce((a, s) => a + (s.quizScore ?? 0), 0) / analytics.students.filter(s => s.quizScore !== null).length) + "%"
                        : "—";

                      return (
                        <div className="flex flex-col h-full space-y-4">
                          {quizAnalyticsError && (
                            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                              {quizAnalyticsError}
                            </div>
                          )}
                          {/* Summary strip */}
                          <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-100 bg-slate-50/50 rounded-2xl shrink-0">
                            {[
                              { label: "Questions", value: detailRec.quiz.length, icon: ListChecks, color: "text-blue-600", bg: "bg-blue-50" },
                              { label: "Attempted By", value: quizAnalyticsError ? "—" : (analytics?.students.filter(s => s.answeredCount > 0).length ?? 0), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                              { label: "Avg Accuracy", value: quizAnalyticsError ? "—" : quizAvg, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                            ].map(m => (
                              <div key={m.label} className="text-center">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5", m.bg)}>
                                  <m.icon className={cn("w-4.5 h-4.5", m.color)} />
                                </div>
                                <p className="text-base font-bold text-slate-800">{m.value}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{m.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Sub-tabs */}
                          <div className="flex border-b border-slate-100 shrink-0">
                            {(["questions", "students"] as const).map(k => (
                              <button key={k} onClick={() => setQuizSubTab(k)}
                                className={cn("px-4 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-px capitalize",
                                  quizSubTab === k ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}>
                                {k === "questions" ? `Questions (${detailRec.quiz.length})` : `Student Results (${analytics?.students.length ?? 0})`}
                              </button>
                            ))}
                          </div>

                          <div className="flex-1 space-y-3 pt-2">
                            {quizAnalyticsLoading && (
                              <p className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Loader2 size={14} className="animate-spin" /> Loading student results...
                              </p>
                            )}
                            {/* ── Questions sub-tab ── */}
                            {quizSubTab === "questions" && detailRec.quiz.map((cp: any, i: number) => {
                              const qStat = analytics?.questionStats.find(q => q.questionId === (cp.id || `q-${i}`));
                              const isExpanded = expandedQuestion === (cp.id || `q-${i}`);
                              const totalAnswered = qStat?.totalAttempts ?? 0;

                              const optionCounts: Record<string, number> = {};
                              if (analytics) {
                                cp.options.forEach((o: any) => { optionCounts[o.label] = 0; });
                                analytics.students.forEach(s => {
                                  const r = s.responses.find(r => r.questionId === (cp.id || `q-${i}`));
                                  if (r) optionCounts[r.selectedOption] = (optionCounts[r.selectedOption] ?? 0) + 1;
                                });
                              }

                              return (
                                <div key={cp.id || `q-${i}`} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedQuestion(isExpanded ? null : (cp.id || `q-${i}`))}
                                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                                  >
                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg shrink-0 mt-0.5">Q{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-bold text-slate-400 mb-1">{cp.segmentTitle} · at {cp.triggerAtPercent}% of video</p>
                                      <div className="text-sm font-bold text-slate-800 leading-5">
                                        <MarkdownRenderer content={cp.questionText} className="prose-p:my-0 text-slate-800 font-bold" />
                                      </div>
                                      {qStat && (
                                        <div className="mt-2.5 flex items-center gap-3">
                                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                              className={cn("h-full rounded-full transition-all", (qStat.accuracy ?? 0) >= 60 ? "bg-emerald-500" : (qStat.accuracy ?? 0) >= 40 ? "bg-amber-500" : "bg-rose-500")}
                                              style={{ width: `${qStat.accuracy ?? 0}%` }}
                                            />
                                          </div>
                                          <span className={cn("text-[10px] font-black shrink-0",
                                            (qStat.accuracy ?? 0) >= 60 ? "text-emerald-600" : (qStat.accuracy ?? 0) >= 40 ? "text-amber-600" : "text-rose-600")}>
                                            {qStat.accuracy !== null ? `${qStat.accuracy}% correct` : "No attempts"}
                                          </span>
                                          <span className="text-[10px] font-bold text-slate-400 shrink-0">{totalAnswered} attempts</span>
                                        </div>
                                      )}
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform", isExpanded && "rotate-90")} />
                                  </button>
 
                                  {isExpanded && (
                                    <div className="border-t border-slate-100 p-4 space-y-2.5 bg-slate-50/50">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Option Breakdown</p>
                                      {cp.options.map((opt: any) => {
                                        const count = optionCounts[opt.label] ?? 0;
                                        const pct = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
                                        const isCorrect = opt.label === cp.correctOption;
                                        return (
                                          <div key={opt.label} className={cn("rounded-xl p-3 border", isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-white border-slate-100 text-slate-700")}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                                                isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>{opt.label}</span>
                                              <div className={cn("text-xs flex-1 pointer-events-none", isCorrect ? "font-bold text-emerald-800" : "text-slate-700")}>
                                                <MarkdownRenderer content={opt.text} className={cn("prose-p:my-0 font-semibold", isCorrect ? "text-emerald-800" : "text-slate-700")} />
                                              </div>
                                              {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                              <span className="text-xs font-bold text-slate-800 shrink-0">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                              <div
                                                className={cn("h-full rounded-full transition-all", isCorrect ? "bg-emerald-500" : "bg-slate-300")}
                                                style={{ width: `${pct}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {cp.explanation && (
                                        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                          <div className="text-xs text-amber-800 font-medium leading-relaxed">
                                            <MarkdownRenderer content={cp.explanation} className="prose-p:my-0 text-amber-800 font-semibold" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* ── Students sub-tab ── */}
                            {quizSubTab === "students" && (
                              analytics?.students.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                  <Users className="w-10 h-10 opacity-20 mb-3" />
                                  <p className="text-sm font-bold">No students have attempted the quiz yet.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {(analytics?.students ?? [])
                                    .filter(s => s.answeredCount > 0)
                                    .sort((a, b) => (b.quizScore ?? 0) - (a.quizScore ?? 0))
                                    .map((s, idx) => (
                                      <div key={s.studentId} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                        <div className="flex items-center gap-3 p-3">
                                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-black text-blue-600 shrink-0">
                                            {s.studentName.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{s.studentName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-xs text-slate-400 font-semibold">{s.correctCount}/{s.answeredCount} correct</span>
                                              <span className="text-slate-300 text-xs">·</span>
                                              <span className="text-xs text-slate-400 font-semibold">watched {Math.round(s.watchPercentage)}%</span>
                                            </div>
                                          </div>
                                          <div className={cn("text-xs font-black px-2.5 py-1 rounded-full",
                                            s.quizScore === null ? "text-slate-500 bg-slate-100" :
                                            s.quizScore >= 70 ? "text-emerald-700 bg-emerald-50" :
                                            s.quizScore >= 40 ? "text-amber-700 bg-amber-50" : "text-rose-700 bg-rose-50")}>
                                            {s.quizScore !== null ? `${s.quizScore}%` : "—"}
                                          </div>
                                        </div>
                                        {s.answeredCount > 0 && (
                                          <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/50 flex flex-wrap gap-2">
                                            {detailRec.quiz.map((cp: any, qi: number) => {
                                              const resp = s.responses.find(r => r.questionId === (cp.id || `q-${qi}`));
                                              return (
                                                <div key={cp.id || `q-${qi}`} title={resp ? `Q${qi + 1}: chose ${resp.selectedOption}${resp.isCorrect ? " ✓" : ` (correct: ${cp.correctOption})`}` : `Q${qi + 1}: not answered`}
                                                  className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold cursor-default",
                                                    !resp ? "bg-slate-100 text-slate-400" :
                                                    resp.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                                  )}>
                                                  <span>Q{qi + 1}</span>
                                                  {resp ? (
                                                    resp.isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />
                                                  ) : (
                                                    <span className="text-[9px]">?</span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : detailRec.quiz_status === 'processing' || detailRec.quiz_status === 'pending' ? (
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Generating in-video quiz…</p>
                  ) : (detailRec.transcript_status === 'done' || detailRec.notes_status === 'done') ? (
                    <div className="text-center">
                      {detailRec.quiz_status === 'failed' && (
                        <p className="mb-3 text-sm text-rose-500">Quiz generation failed. Try again.</p>
                      )}
                      <Button icon={<Sparkles size={16} />} onClick={() => handleGenerateQuiz(detailRec.id)}>
                        {detailRec.quiz_status === 'failed' ? 'Retry quiz generation' : 'Generate in-video quiz'}
                      </Button>
                      <p className="mt-2 text-xs text-slate-400">Creates MCQ checkpoints from the lecture content that pop up at points during the video.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">A quiz is generated from the lecture content — it'll be available once the transcript or notes are ready.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showLiveModal} onClose={() => setShowLiveModal(false)} title={activeCreds ? 'Live Class — OBS Setup' : 'Go Live (OBS)'}>
        {!activeCreds ? (
          <div className="class__modal-form">
            <InputField
              label="Lecture Title"
              placeholder="e.g. Trigonometry — Live Doubt Session"
              value={liveTitle}
              onChange={(e) => setLiveTitle(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Stream from OBS to your institute's RTMP server — students watch live with chat, reactions, and raise-hand.
            </p>
            <div className="class__modal-actions">
              <Button variant="outline" onClick={() => setShowLiveModal(false)}>Cancel</Button>
              <Button onClick={submitCreateLive} disabled={creatingLive}>
                {creatingLive ? 'Creating…' : 'Create Live Class'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" /></span>
              Paste these into OBS → Settings → Stream (Service: Custom)
            </div>

            <CredRow label="RTMP URL" value={activeCreds.rtmpUrl} onCopy={() => copyText(activeCreds.rtmpUrl, 'RTMP URL')} />

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Stream Key</span>
                <div className="flex gap-3">
                  <button onClick={() => setShowKey((s) => !s)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700">
                    {showKey ? <EyeOff size={13} /> : <Eye size={13} />} {showKey ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => copyText(activeCreds.streamKey, 'Stream key')} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>
              <code className="block w-full overflow-x-auto rounded-xl bg-slate-100 px-3 py-2.5 font-mono text-sm text-slate-800">
                {showKey ? activeCreds.streamKey : '•'.repeat(Math.min(activeCreds.streamKey.length || 24, 32))}
              </code>
            </div>

            <ol className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <li><b>1.</b> Open OBS → <b>Settings → Stream</b></li>
              <li><b>2.</b> Service: <i>Custom</i>; paste the RTMP URL + Stream Key</li>
              <li><b>3.</b> Click <b>Start Streaming</b> — you go LIVE automatically</li>
            </ol>

            <div className="class__modal-actions">
              <Button variant="outline" onClick={() => setShowLiveModal(false)}>Close</Button>
              <Button icon={<ArrowRight size={16} />} onClick={() => navigate(`/school/teacher/live/${activeCreds.lectureId}/dashboard`)}>
                Open Live Dashboard
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showRecordingModal} onClose={() => !uploadingRecording && resetRecordingModal()} title="Upload Recorded Lecture" size="lg">
        <div className="class__modal-form">
          <InputField
            label="Lecture Title *"
            placeholder="e.g., Nazism and the Rise of Hitler — Lecture 1"
            value={recordingForm.title}
            onChange={(e) => setRecordingForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <div className="class__modal-row">
            <SelectField
              label="Class"
              value={recordingForm.classId}
              onChange={(e) => setRecordingForm((prev) => ({
                ...prev,
                classId: e.target.value,
                sectionId: '',
                subjectId: '',
                chapterId: '',
                topicId: '',
              }))}
              options={[{ value: '', label: 'Select class...' }, ...recordingClassOptions.map((c: any) => ({ value: c.id, label: c.name }))]}
            />
            <SelectField
              label="Section"
              value={recordingForm.sectionId}
              onChange={(e) => setRecordingForm((prev) => ({
                ...prev,
                sectionId: e.target.value,
                subjectId: '',
                chapterId: '',
                topicId: '',
              }))}
              options={[
                { value: '', label: recordingForm.classId ? (recordingSectionOptions.length ? 'Select section...' : 'No assigned sections') : 'Select class first' },
                ...recordingSectionOptions.map((section: any) => ({ value: section.id, label: section.name })),
              ]}
            />
          </div>
          <div className="class__modal-row">
            <SelectField
              label="Subject"
              value={recordingForm.subjectId}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, subjectId: e.target.value, chapterId: '', topicId: '' }))}
              options={[
                { value: '', label: recordingForm.sectionId ? (recordingSubjectOptions.length ? 'Select subject...' : 'No assigned subjects') : 'Select section first' },
                ...recordingSubjectOptions.map((s: any) => ({ value: s.id, label: s.name })),
              ]}
            />
            <SelectField
              label="Chapter (optional)"
              value={recordingForm.chapterId}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, chapterId: e.target.value }))}
              options={[{ value: '', label: recordingForm.subjectId ? (recChapters.length ? 'All / general' : 'No chapters') : 'Select subject first' }, ...recChapters.map((c: any) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div className="class__modal-row">
            <SelectField
              label="Topic (optional)"
              value={recordingForm.topicId}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, topicId: e.target.value }))}
              options={[{ value: '', label: recordingForm.chapterId ? 'Whole chapter' : 'Select chapter first' }, ...recTopics.map((t: any) => ({ value: t.id, label: t.name }))]}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">Description</label>
            <textarea
              rows={2}
              value={recordingForm.description}
              placeholder="Brief description for students…"
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full resize-none rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <SelectField
              label="Lecture Language (used for transcription)"
              value={recordingForm.language}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, language: e.target.value }))}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi' },
                { value: 'hinglish', label: 'Hinglish (Hindi + English)' },
                { value: 'od', label: 'Odia (ଓଡ଼ିଆ)' },
              ]}
            />
            <p className="mt-1 text-xs text-slate-400">
              Pick the language spoken in the video so the transcript is generated correctly. Odia uses Sarvam STT; English/Hindi use Whisper.
            </p>
          </div>

          {/* Video source toggle */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">Video source</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'upload', label: 'Upload Video', icon: Upload },
                { id: 'youtube', label: 'YouTube URL', icon: Youtube },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVideoSource(opt.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-bold transition ${videoSource === opt.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  <opt.icon size={16} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {videoSource === 'upload' ? (
            <div>
              <input
                type="file"
                accept="video/*,audio/*"
                onChange={(e) => setRecordingFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
              {recordingFile && (
                <p className="mt-1 text-xs text-emerald-600">{recordingFile.name} · {(recordingFile.size / 1024 / 1024).toFixed(1)} MB</p>
              )}
              <p className="mt-1 text-xs text-slate-400">Max 2 GB · MP4, WebM, MOV, etc.</p>
            </div>
          ) : (
            <InputField
              label="YouTube URL"
              placeholder="https://youtube.com/watch?v=…"
              value={recordingForm.youtubeUrl}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
            />
          )}

          {/* Thumbnail (optional) */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600"><ImageIcon size={14} /> Thumbnail (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            />
            {thumbnailFile && <p className="mt-1 text-xs text-emerald-600">{thumbnailFile.name}</p>}
          </div>

          <div className="class__modal-row">
            <InputField
              label="Recorded Date"
              type="date"
              value={recordingForm.recordedDate}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, recordedDate: e.target.value }))}
            />
            <InputField
              label="Duration"
              placeholder="e.g., 45:00"
              value={recordingForm.duration}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, duration: e.target.value }))}
            />
          </div>

          {uploadingRecording && videoSource === 'upload' && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
              <p className="mt-1 text-center text-xs font-semibold text-slate-500">Uploading… {uploadPct}%</p>
            </div>
          )}
          <div className="class__modal-actions">
            <Button variant="outline" disabled={uploadingRecording} onClick={resetRecordingModal}>Cancel</Button>
            <Button disabled={uploadingRecording} onClick={handleUploadRecording}>
              {uploadingRecording ? 'Saving…' : 'Save Recording'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ClassManagement;
