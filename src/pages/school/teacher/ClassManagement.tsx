
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { SchoolVideoPlayer } from '@/components/school/SchoolVideoPlayer';
import { Video, Users, Clock, Plus, Radio, PlayCircle, Trash2, Upload, Youtube, Image as ImageIcon, FileText, Loader2, BarChart3, Download, ChevronRight, X, Sparkles, TrendingUp, XCircle, CheckCircle, ListChecks, Trophy, Copy, Eye, EyeOff, ArrowLeft, ArrowRight, ImagePlus, RefreshCw, CalendarClock, AlarmClock, PanelRightClose, PanelRightOpen, CalendarDays, Clock3, Tag, BookOpen } from 'lucide-react';
import { schoolLive, type CreatedLecture, type LiveLecture } from '@/lib/api/school-live';
import { Highlight } from '@/types/highlight';
import { HighlightRenderer } from '@/lib/highlight-renderer';
import { useSchoolFeature } from '@/hooks/use-school-feature';

type ThumbnailJob = {
  status: 'processing' | 'done' | 'error';
  progress: number;
  startedAt: number;
  previousThumbnailUrl?: string | null;
  error?: string;
};

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
  const hasNotesGen = useSchoolFeature('ai', 'ai_notes_generator');
  if (rec.source === 'youtube') return null;
  if (!ts) {
    if (!hasNotesGen) return null;
    return (
      <button onClick={onRetry} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100">
        <Sparkles size={10} /> Generate Transcript
      </button>
    );
  }

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
    if (!hasNotesGen) return null;
    return (
      <button onClick={onRetry} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100">
        <Sparkles size={10} /> Generate Transcript
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
      {hasNotesGen && (
        <button
          onClick={onRetry}
          title="Transcript incorrect? Regenerate it"
          className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
        >
          <RefreshCw size={9} />
        </button>
      )}
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
import { isModuleEnabled } from '@/lib/constants/moduleFeatures';
import { useConfirm } from '@/context/ConfirmContext';

import './ClassManagement.css';
import { CustomSelect } from "@/components/ui/CustomSelect";

const ClassManagement: React.FC = () => {
  const { user, institute } = useAuth();
  const confirm = useConfirm();
  const hasNotesGen = useSchoolFeature('ai', 'ai_notes_generator');
  const hasQuizGen = useSchoolFeature('ai', 'ai_quiz_generator');
  const canGoLive = isModuleEnabled(institute?.modulesPermissions, 'live_classes');
  // navigate removed because calendar tab was removed
  const navigate = useNavigate();
  const location = useLocation();
  const [liveClassData, setLiveClassData] = useState([]);

  // ── Live (self-hosted OBS/RTMP) ─────────────────────────────────────────────
  const [obsLectures, setObsLectures] = useState<LiveLecture[]>([]);
  const [showLiveModal, setShowLiveModal] = useState(false);    // OBS creds display
  const [createdLive, setCreatedLive] = useState<CreatedLecture | null>(null);
  const [credsLecture, setCredsLecture] = useState<LiveLecture | null>(null);
  const [showKey, setShowKey] = useState(false);

  // ── Schedule live modal state ────────────────────────────────────────────────
  const [showScheduleLiveModal, setShowScheduleLiveModal] = useState(false);

  useEffect(() => {
    if (location.state?.scheduleLive) {
      setShowScheduleLiveModal(true);
      // Clean up history state so reloading doesn't keep opening the modal
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);
  const [schedLiveForm, setSchedLiveForm] = useState({
    title: '',
    description: '',
    scheduledFor: '',
    classId: '',
    sectionId: '',
    subjectId: '',
  });
  const [schedulingLive, setSchedulingLive] = useState(false);

  const resetSchedForm = () => setSchedLiveForm({ title: '', description: '', scheduledFor: '', classId: '', sectionId: '', subjectId: '' });

  const fetchObsLectures = async () => {
    try { setObsLectures(await schoolLive.listLectures()); }
    catch (err) { console.error('Failed to fetch live lectures', err); }
  };

  const submitScheduleLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedLiveForm.title.trim()) { toast.warning('Enter a class title'); return; }
    setSchedulingLive(true);
    try {
      const selectedClass = schedClassOptions.find((c) => String(c.id) === String(schedLiveForm.classId));
      const selectedSection = schedSectionOptions.find((s) => String(s.id) === String(schedLiveForm.sectionId));
      const selectedSubject = schedSubjectOptions.find((s) => String(s.id) === String(schedLiveForm.subjectId));
      const res = await schoolLive.createLecture({
        title: schedLiveForm.title.trim(),
        scheduledFor: schedLiveForm.scheduledFor || undefined,
        classId: schedLiveForm.classId || undefined,
        sectionId: schedLiveForm.sectionId || undefined,
        subjectId: schedLiveForm.subjectId || undefined,
        description: schedLiveForm.description.trim() || undefined,
        className: selectedClass?.name,
        sectionName: selectedSection?.name,
        subjectName: selectedSubject?.name,
      });
      setCreatedLive(res);
      setShowScheduleLiveModal(false);
      resetSchedForm();
      setShowKey(false);
      setShowLiveModal(true);
      toast.success('Live class scheduled!');
      fetchObsLectures();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to schedule live class');
    } finally {
      setSchedulingLive(false);
    }
  };

  // Credentials currently shown in the creds modal.
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
  const [thumbnailJobs, setThumbnailJobs] = useState<Record<string, ThumbnailJob>>({});
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoSource, setVideoSource] = useState<'upload' | 'youtube'>('upload');
  const [recChapters, setRecChapters] = useState<any[]>([]);
  const [recTopics, setRecTopics] = useState<any[]>([]);
  const [recFilter, setRecFilter] = useState({ classId: '', subjectId: '', chapterId: '', topicId: '' });
  const [filterChapters, setFilterChapters] = useState<any[]>([]);
  const [filterTopics, setFilterTopics] = useState<any[]>([]);
  const [detailRec, setDetailRec] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'notes' | 'transcript' | 'quiz'>('overview');
  const [detailPanelOpen, setDetailPanelOpen] = useState(true);
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
  const [deleteToolbar, setDeleteToolbar] = useState<{
    highlight: Highlight;
    rect: DOMRect;
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

  // ── Schedule-modal specific selects (mirror recording options but for schedLiveForm) ──
  const schedClassOptions = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string }>();
    teacherAssignments.forEach((a: any) => {
      if (!a.classId) return;
      classMap.set(String(a.classId), {
        id: String(a.classId),
        name: a.className || academicClasses.find((c) => String(c.id) === String(a.classId))?.name || 'Class',
      });
    });
    return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [academicClasses, teacherAssignments]);

  const schedSectionOptions = useMemo(() => {
    if (!schedLiveForm.classId) return [];
    const sectionMap = new Map<string, { id: string; name: string }>();
    teacherAssignments
      .filter((a: any) => String(a.classId) === String(schedLiveForm.classId))
      .forEach((a: any) => {
        if (!a.sectionId) return;
        sectionMap.set(String(a.sectionId), { id: String(a.sectionId), name: a.sectionName || 'Section' });
      });
    return Array.from(sectionMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [schedLiveForm.classId, teacherAssignments]);

  const schedSubjectOptions = useMemo(() => {
    if (!schedLiveForm.classId || !schedLiveForm.sectionId) return [];
    const subjectMap = new Map<string, { id: string; name: string }>();
    teacherAssignments
      .filter((a: any) => String(a.classId) === String(schedLiveForm.classId) && String(a.sectionId) === String(schedLiveForm.sectionId))
      .forEach((a: any) => {
        if (!a.subjectId) return;
        subjectMap.set(String(a.subjectId), {
          id: String(a.subjectId),
          name: a.subjectName || academicSubjects.find((s) => String(s.id) === String(a.subjectId))?.name || 'Subject',
        });
      });
    return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [academicSubjects, schedLiveForm.classId, schedLiveForm.sectionId, teacherAssignments]);


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

  const handleGenerateThumbnail = async (rec: any) => {
    if (!rec?.id || rec.source === 'youtube') return;
    const id = String(rec.id);
    setThumbnailJobs((prev) => ({
      ...prev,
      [id]: {
        status: 'processing',
        progress: 8,
        startedAt: Date.now(),
        previousThumbnailUrl: rec.thumbnail_url || null,
      },
    }));
    try {
      await api.post(`/classes/recordings/${id}/regenerate-thumbnail`);
      toast.success('Thumbnail generation started');
      [5000, 12000, 30000, 55000, 80000].forEach((delay) => {
        window.setTimeout(fetchRecordedClasses, delay);
      });
    } catch (e: any) {
      setThumbnailJobs((prev) => ({
        ...prev,
        [id]: {
          status: 'error',
          progress: 100,
          startedAt: Date.now(),
          previousThumbnailUrl: rec.thumbnail_url || null,
          error: e?.response?.data?.message || 'Could not generate thumbnail',
        },
      }));
      toast.error(e?.response?.data?.message || 'Could not generate thumbnail');
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
    const isConfirmed = await confirm({
      title: 'Delete Recording',
      subtitle: 'Critical Action',
      message: 'Are you sure you want to delete this recording? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const handleDownloadNotesPdf = async () => {
    if (downloadingPdf || !detailRec?.notes) return;
    setDownloadingPdf(true);
    try {
      // Fetch embedded visuals as base64 through the backend (S3 has no CORS)
      let imageMap: Record<string, string> = {};
      if (Array.isArray(detailRec.notes_images) && detailRec.notes_images.length > 0) {
        try {
          const res = await api.get(`/classes/recordings/${detailRec.id}/notes-images-data`);
          imageMap = res?.data?.data?.images ?? res?.data?.images ?? {};
        } catch (e) {
          console.warn('Could not fetch notes images for PDF, continuing without them', e);
        }
      }
      const { downloadNotesAsPDF } = await import('@/lib/school/notesPdf');
      const safeName = (detailRec.title || 'ai-notes').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      await downloadNotesAsPDF({
        markdown: detailRec.notes,
        title: detailRec.title || 'AI Notes',
        filename: `${safeName}-notes.pdf`,
        imageMap,
      });
      toast.success('Notes PDF downloaded');
    } catch (e: any) {
      console.error('Failed to download notes PDF', e);
      toast.error('Could not generate the PDF. Try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };
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

  const filteredRecordings = recordedClassData.filter((r: any) => {
    const rClass = String(r.classId ?? r.class_id ?? r.className ?? '');
    return (
      (!recFilter.classId || rClass === String(recFilter.classId)) &&
      (!recFilter.subjectId || String(r.subject_id) === recFilter.subjectId) &&
      (!recFilter.chapterId || String(r.chapter_id) === recFilter.chapterId) &&
      (!recFilter.topicId || String(r.topic_id) === recFilter.topicId)
    );
  });

  const uploadedRecordings = filteredRecordings.filter(r => r.source !== 'live_stream');
  const pastLiveRecordings = filteredRecordings.filter(r => r.source === 'live_stream');

  const renderThumbnailProgress = (rec: any) => {
    const job = thumbnailJobs[String(rec.id)];
    const backendFailed = rec.thumbnail_status === 'failed';
    const backendProcessing = rec.thumbnail_status === 'processing';
    const backendError = rec.thumbnail_error || 'Thumbnail generation failed';
    if (!job && !backendFailed && !backendProcessing) return null;
    if (backendFailed || job?.status === 'error') {
      return (
        <div className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600">
          {job?.error || backendError}
        </div>
      );
    }
    const startedAt = rec.thumbnail_started_at ? new Date(rec.thumbnail_started_at).getTime() : Date.now();
    const backendProgress = Math.min(95, Math.round(8 + ((Date.now() - startedAt) / 80000) * 87));
    const progress = job?.progress ?? backendProgress;
    const status = job?.status ?? 'processing';
    return (
      <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>{status === 'done' ? 'Thumbnail Ready' : 'Generating Thumbnail'}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              status === 'done' ? 'bg-emerald-500' : 'bg-blue-500',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  // Keep the open detail drawer in sync with live refreshes (transcript/notes status + content)
  useEffect(() => {
    setDetailRec((prev: any) => {
      if (!prev) return prev;
      const fresh = recordedClassData.find((r: any) => r.id === prev.id);
      return fresh || prev;
    });
  }, [recordedClassData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setThumbnailJobs((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.entries(next).forEach(([id, job]) => {
          if (job.status !== 'processing') return;
          const elapsed = Date.now() - job.startedAt;
          if (elapsed > 90000) {
            next[id] = {
              ...job,
              status: 'error',
              progress: 100,
              error: 'Thumbnail is taking longer than expected. Refresh or try again.',
            };
            changed = true;
            return;
          }
          const progress = Math.min(95, Math.round(8 + (elapsed / 80000) * 87));
          if (progress !== job.progress) {
            next[id] = { ...job, progress };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setThumbnailJobs((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(next).forEach(([id, job]) => {
        if (job.status !== 'processing') return;
        const fresh = recordedClassData.find((r: any) => String(r.id) === id);
        if (!fresh) return;

        if (fresh.thumbnail_status === 'failed') {
          next[id] = {
            ...job,
            status: 'error',
            progress: 100,
            error: fresh.thumbnail_error || 'Thumbnail generation failed',
          };
          changed = true;
          return;
        }

        const elapsed = Date.now() - job.startedAt;
        const isNewThumbnail = !job.previousThumbnailUrl || fresh.thumbnail_url !== job.previousThumbnailUrl;
        if (fresh.thumbnail_status === 'done' || (fresh.thumbnail_url && (isNewThumbnail || elapsed > 25000))) {
          next[id] = { ...job, status: 'done', progress: 100, error: undefined };
          changed = true;
        }
      });
      return changed ? next : prev;
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
      const rows = res.data?.data ?? res.data ?? [];
      setNotesHighlights(Array.isArray(rows) ? rows : []);
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
        onDeleteClick: (hl, rect) => {
          setDeleteToolbar({ highlight: hl, rect });
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
      console.log('HIGHLIGHT SAVE RESPONSE:', JSON.stringify(res.data));
      setNotesHighlights(prev => prev.map(hl => hl.id === tempId ? (res.data?.data ?? res.data) : hl));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save highlight');
      fetchHighlights(); // Rollback
    }
  };

  const handleDeleteHighlight = async () => {
    if (!deleteToolbar) return;
    const hl = deleteToolbar.highlight;
    setDeleteToolbar(null);
    try {
      setNotesHighlights(prev => prev.filter(x => x.id !== hl.id));
      await api.delete(`/recordings/${detailRec.id}/highlights/${hl.id}`);
    } catch (e: any) {
      toast.error('Failed to delete highlight');
      fetchHighlights();
    }
  };

  const isExpiredScheduled = (lec: LiveLecture) => {
    if (lec.status !== 'SCHEDULED') return false;
    const ref = lec.scheduledFor || lec.createdAt;
    if (!ref) return false;
    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    return new Date(ref) < todayMidnight;
  };

  const fmtDuration = (startedAt?: string | null, endedAt?: string | null) => {
    if (!startedAt || !endedAt) return null;
    const secs = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const deleteLiveClass = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Live Class',
      subtitle: 'Critical Action',
      message: 'Delete this live class? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      await schoolLive.deleteLecture(id);
      setObsLectures((prev) => prev.filter((l) => l.id !== id));
      toast.success('Live class deleted');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete live class');
    }
  };

  const LiveClassCard: React.FC<{ lec: LiveLecture }> = ({ lec }) => {
    const isLive = lec.status === 'LIVE';
    const isEnded = lec.status === 'ENDED' || lec.status === 'PROCESSED' || !!lec.recordingUrl || isExpiredScheduled(lec);
    const isScheduled = !isLive && !isEnded;
    const duration = fmtDuration(lec.startedAt, lec.endedAt);

    return (
      <div className={cn(
        'rounded-2xl border bg-white p-4 transition-shadow',
        isLive
          ? 'border-red-400/50 shadow-[0_0_24px_rgba(239,68,68,0.18)]'
          : 'border-slate-100 shadow-sm hover:shadow-md',
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl',
              isLive ? 'bg-red-100 text-red-500' : isEnded ? 'bg-slate-100 text-slate-400' : 'bg-violet-50 text-violet-500',
            )}>
              <Radio className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900" title={lec.title}>{lec.title}</p>
              {/* Class · Section · Subject chips */}
              {(lec.className || lec.sectionName || lec.subjectName) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {lec.className && (
                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">{lec.className}</span>
                  )}
                  {lec.sectionName && (
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">{lec.sectionName}</span>
                  )}
                  {lec.subjectName && (
                    <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">{lec.subjectName}</span>
                  )}
                </div>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {(lec.scheduledFor || lec.createdAt) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <CalendarClock size={11} />
                    {new Date(lec.scheduledFor || lec.createdAt!).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {duration && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Clock size={11} /> {duration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status badge */}
          {isLive ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Live Now
            </span>
          ) : isEnded ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
              Ended
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-600">
              <AlarmClock size={11} /> Scheduled
            </span>
          )}
        </div>

        {/* OBS tip for scheduled classes */}
        {isScheduled && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2">
            <AlarmClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
            <p className="text-[11px] font-medium text-violet-700">
              When ready, click <b>Stream Info</b> to get your OBS key, then start streaming — class goes live automatically.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={() => { setCreatedLive(null); setCredsLecture(lec); setShowKey(false); setShowLiveModal(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Eye size={13} /> Stream Info
          </button>

          {isEnded && lec.recordingUrl && (
            <button
              onClick={() => {
                const savedRecording = recordedClassData.find((recording: any) => recording.id === lec.classRecordingId);
                setDetailRec(savedRecording || {
                  id: lec.classRecordingId || lec.id,
                  title: lec.title,
                  video_url: lec.recordingUrl,
                  thumbnail_url: lec.thumbnailUrl,
                  description: lec.description,
                  duration: lec.recordingDurationSeconds ? String(Math.round(lec.recordingDurationSeconds / 60)) : '45',
                  recorded_date: lec.endedAt || lec.createdAt,
                  source: 'live_stream',
                  notes: lec.notes || null,
                  notes_status: lec.notesStatus || null,
                  transcript_status: lec.transcriptStatus || null,
                  quiz_status: lec.quizStatus || null,
                  language: lec.language || 'en'
                });
                setDetailTab('overview');
                setDetailPanelOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <PlayCircle size={13} /> Watch Video
            </button>
          )}
          <button
            onClick={() => navigate(`/school/teacher/live/${lec.id}/dashboard`, { state: { showSummary: isEnded } })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            {isLive ? <><Radio size={13} /> Open Live</>
              : isEnded ? <>View Summary <ArrowRight size={13} /></>
                : <>Dashboard <ArrowRight size={13} /></>}
          </button>

          <button onClick={() => deleteLiveClass(lec.id)} title="Delete" className="ml-auto text-slate-300 transition-colors hover:text-rose-500">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  };

  const toEndTime = (startTime: string, durationMinutes: number) => {
    const [h, m] = String(startTime || '00:00').split(':').map(Number);
    const startTotal = (h * 60) + m;
    const endTotal = startTotal + (Number.isFinite(durationMinutes) ? durationMinutes : 45);
    const endHour = Math.floor((endTotal % (24 * 60)) / 60);
    const endMinute = endTotal % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  const renderCurriculumFilters = () => {
    const filteredSubjects = recFilter.classId
      ? academicSubjects.filter((s: any) => String(s.classId ?? s.class_id) === String(recFilter.classId))
      : academicSubjects;

    return (
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 hidden sm:inline-block">Curriculum</span>
        <CustomSelect
          value={recFilter.classId}
          onChange={(val) => setRecFilter((p) => ({ ...p, classId: val, subjectId: '', chapterId: '', topicId: '' }))}
          options={[
            { value: "", label: "All classes" },
            ...schedClassOptions.map((c: any) => ({ value: c.id, label: c.name })),
          ]}
          className="w-[140px] flex-1 sm:flex-none"
        />
        <CustomSelect
          value={recFilter.subjectId}
          onChange={(val) => setRecFilter((p) => ({ ...p, subjectId: val, chapterId: '', topicId: '' }))}
          options={[
            { value: "", label: "All subjects" },
            ...filteredSubjects.map((s: any) => ({ value: s.id, label: s.name })),
          ]}
          className="w-[140px] flex-1 sm:flex-none"
        />
        <CustomSelect
          value={recFilter.chapterId}
          onChange={(val) => setRecFilter((p) => ({ ...p, chapterId: val, topicId: '' }))}
          options={[
            { value: "", label: "All chapters" },
            ...filterChapters.map((c: any) => ({ value: c.id, label: c.name })),
          ]}
          disabled={!recFilter.subjectId}
          className="w-[140px] flex-1 sm:flex-none"
        />
        <CustomSelect
          value={recFilter.topicId}
          onChange={(val) => setRecFilter((p) => ({ ...p, topicId: val }))}
          options={[
            { value: "", label: "All topics" },
            ...filterTopics.map((t: any) => ({ value: t.id, label: t.name })),
          ]}
          disabled={!recFilter.chapterId}
          className="w-[140px] flex-1 sm:flex-none"
        />
      </div>
    );
  };

  const liveContent = (
    <div className="class__section">
      {renderCurriculumFilters()}
      {!canGoLive ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 py-14 text-center">
          <Radio className="mx-auto mb-3 h-10 w-10 text-amber-300" />
          <h3 className="text-base font-black text-slate-900">Live Classes Disabled</h3>
          <p className="mt-1 text-sm text-slate-500">Live streaming is not enabled for your school. Contact the super admin to enable it.</p>
        </div>
      ) : obsLectures.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
          <Radio className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-base font-black text-slate-900">No live classes yet</h3>
          <p className="mt-1 text-sm text-slate-500">Click <b>Go Live (OBS)</b> to create one and get your OBS stream key.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {obsLectures
            .filter((lec) => {
              if (recFilter.classId && String(lec.classId) !== String(recFilter.classId)) return false;
              if (recFilter.subjectId && String(lec.subjectId) !== String(recFilter.subjectId)) return false;
              return true;
            })
            .map((lec) => (
              <LiveClassCard key={lec.id} lec={lec} />
            ))}
        </div>
      )}

    </div>
  );

  const recordedContent = (
    <div className="class__section">
      {/* Curriculum filters */}
      {renderCurriculumFilters()}

      {uploadedRecordings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center">
          <Video size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">No recordings yet</p>
          <p className="mt-1 text-sm text-slate-400">Upload a recorded lecture or paste a YouTube link.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uploadedRecordings.map((rec: any) => {
            const date = rec.recorded_date ? new Date(rec.recorded_date).toLocaleDateString('en-GB') : '';
            return (
              <div key={rec.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3.5 sm:gap-4">
                  <button onClick={() => { setDetailRec(rec); setDetailTab(rec.notes ? 'notes' : 'transcript'); setDetailPanelOpen(true); }}
                    className="group/thumb relative h-36 w-full sm:h-16 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                    {rec.thumbnail_url ? (
                      <img src={rec.thumbnail_url} alt={rec.title} className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950"><PlayCircle size={26} className="text-white/60" /></div>
                    )}
                    {/* Play icon overlay on hover */}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/10 sm:bg-black/0 opacity-100 sm:opacity-0 transition-all group-hover/thumb:bg-black/30 group-hover/thumb:opacity-100">
                      <PlayCircle size={26} className="text-white drop-shadow-lg" />
                    </span>
                    {/* Duration badge */}
                    {rec.duration && (
                      <span className="absolute bottom-2 right-2 sm:bottom-1 sm:right-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                        {parseFloat(rec.duration) >= 1 ? `${Math.round(parseFloat(rec.duration))} min` : `${Math.round(parseFloat(rec.duration) * 60)}s`}
                      </span>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-slate-900 text-sm sm:text-base leading-snug" title={rec.title}>{rec.title}</h4>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          · {[rec.topic_name, rec.subject_name, rec.class_name].filter(Boolean)[0] || 'Lecture'} · {date}
                        </p>
                        <button onClick={() => { setDetailRec(rec); setDetailTab(rec.notes ? 'notes' : 'transcript'); setDetailPanelOpen(true); }}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                          <ChevronRight size={13} /> Click to view details
                        </button>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1.5 mt-1.5 sm:mt-0 shrink-0">
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-600">Published</span>
                        <TranscriptStatusBadge
                          rec={rec}
                          onView={() => { setDetailRec(rec); setDetailTab('transcript'); }}
                          onRetry={() => handleRetranscribe(rec.id)}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3 border-t border-slate-100 pt-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => { setDetailRec(rec); setDetailTab('overview'); setDetailPanelOpen(true); }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                            <BarChart3 size={14} /> Live Stats
                          </button>
                          {rec.source !== 'youtube' && (
                            <button
                              onClick={() => handleGenerateThumbnail(rec)}
                              disabled={thumbnailJobs[String(rec.id)]?.status === 'processing'}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {thumbnailJobs[String(rec.id)]?.status === 'processing'
                                ? <Loader2 size={14} className="animate-spin" />
                                : <ImageIcon size={14} />}
                              {rec.thumbnail_url ? 'Regenerate Thumbnail' : 'Generate Thumbnail'}
                            </button>
                          )}
                        </div>
                        {renderThumbnailProgress(rec)}
                      </div>
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

  return (
    <div className="class">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Lectures</h1>
            {obsLectures.some((l) => l.status === 'LIVE') && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white opacity-75" />
                LIVE
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {recordedClassData.length} recorded · {obsLectures.length} live class{obsLectures.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {canGoLive && (
            <Button variant="outline" icon={<Radio size={16} />} onClick={() => setShowScheduleLiveModal(true)}>Schedule Live Class</Button>
          )}
          <Button icon={<Plus size={16} />} onClick={() => setShowRecordingModal(true)}>Upload Lecture</Button>
        </div>
      </div>
      <Tabs
        tabs={[
          { id: 'recorded', label: 'Recorded', icon: <Video size={16} />, content: recordedContent },
          { id: 'live', label: 'Live Classes', icon: <Radio size={16} />, content: liveContent },
        ]}
      />

      {/* Recorded lecture watch view */}
      {detailRec && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-50 lg:overflow-hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailRec(null); }}>
          <div className="min-h-full w-full bg-slate-50 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6 lg:shrink-0">
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => setDetailRec(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-600 hover:text-white" aria-label="Back to recorded lectures"><ArrowLeft size={17} /></button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-blue-600">
                    {detailRec.chapter_name || detailRec.subject_name || 'Recorded Class'}
                  </p>
                  <h1 className="truncate text-sm font-black leading-tight text-slate-900">{detailRec.title}</h1>
                </div>
                <div className="hidden shrink-0 sm:block">
                  <TranscriptStatusBadge rec={detailRec} onView={() => setDetailTab('transcript')} onRetry={() => handleRetryTranscript(detailRec.id)} />
                </div>
                <button
                  onClick={() => setDetailPanelOpen((open) => !open)}
                  className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 lg:flex"
                >
                  {detailPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                  <span>{detailPanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
                </button>
              </div>
            </div>

            <div className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:min-h-0 lg:flex-1">
              <div className={`grid gap-6 transition-all duration-300 lg:h-full lg:min-h-0 lg:grid-rows-[minmax(0,1fr)] ${detailPanelOpen ? 'lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]' : 'grid-cols-1'}`}>
                <main className="min-w-0 space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pb-5 scrollbar-hide">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm">
                    {detailRec.video_url ? (
                      <SchoolVideoPlayer
                        src={detailRec.video_url}
                        checkpoints={detailRec.quiz || []}
                        autoPlay={false}
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center text-sm font-semibold text-white/70">
                        Video unavailable
                      </div>
                    )}
                  </div>
                  <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {detailRec.subject_name && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                              {detailRec.subject_name}
                            </span>
                          )}
                          {detailRec.class_name && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                              {detailRec.class_name}
                            </span>
                          )}
                          <span className="sm:hidden">
                            <TranscriptStatusBadge rec={detailRec} onView={() => setDetailTab('transcript')} onRetry={() => handleRetryTranscript(detailRec.id)} />
                          </span>
                        </div>
                        <h2 className="mt-3 text-xl font-black text-slate-950">{detailRec.title}</h2>
                        {detailRec.description && (
                          <p className="mt-2 text-sm leading-6 text-slate-500">{detailRec.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                        <CalendarDays size={13} />
                        {detailRec.recorded_date ? new Date(detailRec.recorded_date).toLocaleDateString('en-GB') : 'Date pending'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                        <Clock3 size={13} />
                        {detailRec.duration
                          ? (parseFloat(detailRec.duration) >= 1
                            ? `${Math.round(parseFloat(detailRec.duration))} mins`
                            : `${Math.round(parseFloat(detailRec.duration) * 60)}s`)
                          : 'Duration pending'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                        <Tag size={13} />
                        {detailRec.topic_name || detailRec.chapter_name || 'General topic'}
                      </span>
                      {detailRec.resolution && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600">
                          {detailRec.resolution}
                        </span>
                      )}
                      {detailRec.video_size && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                          {detailRec.video_size > 1024 * 1024 * 1024
                            ? `${(detailRec.video_size / (1024 * 1024 * 1024)).toFixed(1)} GB`
                            : `${Math.round(detailRec.video_size / (1024 * 1024))} MB`}
                        </span>
                      )}
                    </div>
                  </section>
                </main>

                <aside className={`${detailPanelOpen ? 'block' : 'hidden'} min-w-0 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pb-5 scrollbar-hide`}>
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex border-b border-slate-100">
                      {([
                        { id: 'notes', label: 'AI Notes', icon: BookOpen },
                        { id: 'transcript', label: 'Transcript', icon: FileText },
                        { id: 'quiz', label: 'Quiz', icon: Sparkles },
                        { id: 'overview', label: 'Stats', icon: BarChart3 },
                      ] as const).map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setDetailTab(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${detailTab === tab.id
                                ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                                : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                          >
                            <Icon size={13} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-5">
                      {detailTab === 'overview' && (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-sm font-bold text-blue-800">Video preview is shown in the main watch area.</p>
                            <p className="mt-1 text-xs font-semibold text-blue-600">Use this panel for teacher stats, content details, transcript, notes, and quiz management.</p>
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
                            <div>
                              <button
                                onClick={() => handleGenerateThumbnail(detailRec)}
                                disabled={thumbnailJobs[String(detailRec.id)]?.status === 'processing'}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {thumbnailJobs[String(detailRec.id)]?.status === 'processing'
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <ImageIcon size={13} />}
                                {detailRec.thumbnail_url ? 'Regenerate Thumbnail' : 'Generate Thumbnail'}
                              </button>
                              {renderThumbnailProgress(detailRec)}
                            </div>
                          )}
                        </div>
                      )}
                      {detailTab === 'notes' && (
                        <div>
                          {detailRec.notes_status === 'done' && detailRec.notes?.trim() ? (
                            <div className="relative">
                              {/* Floating delete tooltip — appears on highlight click */}
                              {deleteToolbar && (
                                <div
                                  className="fixed z-[260] flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md p-2 shadow-2xl border border-slate-200"
                                  style={{
                                    top: Math.max(10, deleteToolbar.rect.top - 56) + 'px',
                                    left: Math.max(10, deleteToolbar.rect.left + deleteToolbar.rect.width / 2 - 80) + 'px',
                                  }}
                                  onMouseDown={e => e.preventDefault()}
                                >
                                  <span className="text-xs text-slate-500 px-1">Remove highlight?</span>
                                  <div className="w-px h-5 bg-slate-200" />
                                  <button
                                    className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    onClick={handleDeleteHighlight}
                                  >
                                    🗑 Delete
                                  </button>
                                  <button
                                    className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                                    onClick={() => setDeleteToolbar(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
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
                                    {(["#fef08a", "#bfdbfe", "#bbf7d0", "#fbcfe8", "#fed7aa"] as const).map(color => (
                                      <button
                                        key={color}
                                        type="button"
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={e => { e.preventDefault(); setNotesHighlightColor(color); }}
                                        className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${notesHighlightColor === color
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
                                  {/* Download notes as PDF */}
                                  <button
                                    onClick={handleDownloadNotesPdf}
                                    disabled={downloadingPdf}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-60"
                                  >
                                    {downloadingPdf ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                                    {downloadingPdf ? 'Preparing…' : 'Download PDF'}
                                  </button>
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
                              {hasNotesGen ? (
                                <>
                                  <Button icon={<Sparkles size={16} />} onClick={() => handleRegenerateNotes(detailRec.id)}>
                                    {detailRec.notes_status === 'failed' ? 'Retry notes generation' : 'Generate AI notes'}
                                  </Button>
                                  <p className="mt-2 text-xs text-slate-400">Builds structured notes from the transcript (Odia notes via Gemini).</p>
                                </>
                              ) : (
                                <p className="text-xs text-slate-400">AI Lecture Notes feature is disabled for this institution.</p>
                              )}
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
                              {hasNotesGen && (
                                <button
                                  onClick={() => {
                                    handleRetranscribe(detailRec.id);
                                    setDetailRec((prev: any) => prev ? { ...prev, transcript_status: 'processing' } : prev);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <RefreshCw size={11} /> Regenerate transcript
                                </button>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{detailRec.transcript}</p>
                          </div>
                        ) : detailRec.transcript_status === 'failed' ? (
                          <div className="space-y-3">
                            <p className="text-sm text-slate-500">No transcript is available yet.</p>
                            {hasNotesGen ? (
                              <button
                                onClick={() => {
                                  handleRetranscribe(detailRec.id);
                                  setDetailRec((prev: any) => prev ? { ...prev, transcript_status: 'processing' } : prev);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                              >
                                <Sparkles size={14} /> Generate Transcript
                              </button>
                            ) : (
                              <p className="text-xs text-slate-400">AI Lecture Transcription is disabled for this institution.</p>
                            )}
                          </div>
                        ) : ['pending', 'processing'].includes(detailRec.transcript_status) ? (
                          <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Transcribing… check back shortly.</p>
                        ) : (
                          <div className="text-center py-6">
                            {hasNotesGen ? (
                              <>
                                <button
                                  onClick={() => {
                                    handleRetranscribe(detailRec.id);
                                    setDetailRec((prev: any) => prev ? { ...prev, transcript_status: 'processing' } : prev);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                                >
                                  <Sparkles size={16} /> Generate Transcript
                                </button>
                                <p className="mt-2 text-xs text-slate-400">Uses AI to generate a text transcript of this lecture (sarvam for Odia, Whisper for Hindi/English).</p>
                              </>
                            ) : (
                              <p className="text-xs text-slate-400">AI Lecture Transcription is disabled for this institution.</p>
                            )}
                          </div>
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
                              {hasQuizGen ? (
                                <>
                                  <Button icon={<Sparkles size={16} />} onClick={() => handleGenerateQuiz(detailRec.id)}>
                                    {detailRec.quiz_status === 'failed' ? 'Retry quiz generation' : 'Generate in-video quiz'}
                                  </Button>
                                  <p className="mt-2 text-xs text-slate-400">Creates MCQ checkpoints from the lecture content that pop up at points during the video.</p>
                                </>
                              ) : (
                                <p className="text-xs text-slate-400">AI Quiz Generator is disabled for this institution.</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">A quiz is generated from the lecture content — it'll be available once the transcript or notes are ready.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Live Class modal (matches coaching panel design exactly) ── */}
      {showScheduleLiveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowScheduleLiveModal(false); resetSchedForm(); }} />
          <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style={{ maxHeight: 'min(90vh, 800px)' }}>

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Radio className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Schedule Live Class</h2>
                  <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">Students will be notified and reminded automatically</p>
                </div>
              </div>
              <button
                onClick={() => { setShowScheduleLiveModal(false); resetSchedForm(); }}
                className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={submitScheduleLive} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-5 md:divide-x md:divide-y-0">

                  {/* Left — form fields */}
                  <div className="space-y-3 p-4 sm:space-y-4 sm:p-6 md:col-span-3">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {/* Class */}
                      <div className="col-span-2 space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700">Class *</label>
                        <CustomSelect
                          value={schedLiveForm.classId}
                          onChange={(val) => setSchedLiveForm((prev) => ({ ...prev, classId: val, sectionId: '', subjectId: '' }))}
                          options={[
                            { value: "", label: schedClassOptions.length ? 'Select class…' : 'No classes assigned' },
                            ...schedClassOptions.map((c) => ({ value: c.id, label: c.name })),
                          ]}
                          className="w-full"
                        />
                      </div>

                      {/* Section */}
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700">Section *</label>
                        <CustomSelect
                          value={schedLiveForm.sectionId}
                          onChange={(val) => setSchedLiveForm((prev) => ({ ...prev, sectionId: val, subjectId: '' }))}
                          options={[
                            { value: "", label: !schedLiveForm.classId ? 'Select class first…' : (schedSectionOptions.length ? 'Select section…' : 'No sections') },
                            ...schedSectionOptions.map((s) => ({ value: s.id, label: s.name })),
                          ]}
                          disabled={!schedLiveForm.classId}
                          className="w-full"
                        />
                      </div>

                      {/* Subject */}
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700">Subject *</label>
                        <CustomSelect
                          value={schedLiveForm.subjectId}
                          onChange={(val) => setSchedLiveForm((prev) => ({ ...prev, subjectId: val }))}
                          options={[
                            { value: "", label: !schedLiveForm.sectionId ? 'Select section first…' : (schedSubjectOptions.length ? 'Select subject…' : 'No subjects') },
                            ...schedSubjectOptions.map((s) => ({ value: s.id, label: s.name })),
                          ]}
                          disabled={!schedLiveForm.sectionId}
                          className="w-full"
                        />
                      </div>

                      {/* Title */}
                      <div className="col-span-2 space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700">Class Title *</label>
                        <input
                          required
                          type="text"
                          value={schedLiveForm.title}
                          onChange={(e) => setSchedLiveForm((p) => ({ ...p, title: e.target.value }))}
                          placeholder="e.g. Electrostatics — Doubt Session"
                          className="h-9 sm:h-11 w-full rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 text-xs sm:text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Description */}
                      <div className="col-span-2 space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700">Description</label>
                        <textarea
                          rows={3}
                          value={schedLiveForm.description}
                          onChange={(e) => setSchedLiveForm((p) => ({ ...p, description: e.target.value }))}
                          placeholder="What topics will be covered? Any prerequisites?"
                          className="w-full resize-none rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Date & Time */}
                      <div className="col-span-2 space-y-1 sm:space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700">Date &amp; Time *</label>
                        <input
                          required
                          type="datetime-local"
                          value={schedLiveForm.scheduledFor}
                          onChange={(e) => setSchedLiveForm((p) => ({ ...p, scheduledFor: e.target.value }))}
                          className="h-9 sm:h-11 w-full rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 text-xs sm:text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right — info panel */}
                  <div className="flex flex-col gap-4 bg-slate-50/40 p-5 sm:p-6 md:col-span-2">
                    <div>
                      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <AlarmClock className="h-4 w-4 text-blue-500" /> What happens next
                      </p>
                      <div className="space-y-3">
                        {[
                          { icon: '🔔', title: 'Instant notification', desc: 'All enrolled students are notified immediately' },
                          { icon: '📅', title: 'Calendar saved', desc: "Added to every student's schedule" },
                          { icon: '⏰', title: '30-min reminder', desc: 'Automatic reminder before class starts' },
                          { icon: '🔴', title: 'LIVE badge via OBS', desc: 'Stream your OBS — class goes live automatically' },
                          { icon: '✅', title: 'Auto attendance', desc: 'Students are marked attended after class ends' },
                        ].map((s, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="mt-0.5 text-base">{s.icon}</span>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{s.title}</p>
                              <p className="text-xs text-slate-500">{s.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {schedLiveForm.scheduledFor && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <p className="mb-1 text-xs font-semibold text-blue-500">Scheduled for</p>
                        <p className="text-sm font-bold text-slate-900">
                          {new Date(schedLiveForm.scheduledFor).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(schedLiveForm.scheduledFor).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
                <button type="button" onClick={() => { setShowScheduleLiveModal(false); resetSchedForm(); }}
                  className="rounded-lg sm:rounded-xl border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingLive || !schedLiveForm.classId || !schedLiveForm.sectionId || !schedLiveForm.subjectId || !schedLiveForm.title || !schedLiveForm.scheduledFor}
                  className="inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-blue-600 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {schedulingLive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                  Schedule Live Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── OBS Stream Credentials modal ─────────────────────────────────── */}
      <Modal isOpen={showLiveModal} onClose={() => { setShowLiveModal(false); setCreatedLive(null); setCredsLecture(null); }} title="Live Class — OBS Setup">
        {activeCreds && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" /></span>
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
              <li><b>3.</b> Settings → Output → Encoding → Keyframe Interval: <b>1</b> (second)</li>
              <li><b>4.</b> Click <b>Start Streaming</b> — you go LIVE automatically</li>
            </ol>

            <div className="class__modal-actions">
              <Button variant="outline" onClick={() => { setShowLiveModal(false); setCreatedLive(null); setCredsLecture(null); }}>Close</Button>
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
