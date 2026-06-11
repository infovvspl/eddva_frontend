import React, { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Video, Users, Clock, Plus, Radio, PlayCircle, Trash2, Upload, Youtube, Image as ImageIcon, FileText, Loader2, BarChart3, Download, ChevronRight, X, Sparkles } from 'lucide-react';

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
    <button onClick={onView} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
      <Download size={11} /> Transcript Ready
    </button>
  );
};
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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [liveClassData, setLiveClassData] = useState([]);
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
  const [recordingForm, setRecordingForm] = useState({
    title: '',
    description: '',
    classId: '',
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
    fetchRecordedClasses();
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      const [classRes, subjectRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
      ]);
      const classes = classRes.data?.data ?? classRes.data ?? [];
      const subjects = subjectRes.data?.data ?? subjectRes.data ?? [];
      setAcademicClasses(Array.isArray(classes) ? classes : []);
      setAcademicSubjects(Array.isArray(subjects) ? subjects : []);
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
    setRecordingForm({ title: '', description: '', classId: '', subjectId: '', chapterId: '', topicId: '', recordedDate: '', duration: '', youtubeUrl: '', language: 'en' });
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

  const handleGenerateQuiz = async (id: string) => {
    try {
      await api.post(`/classes/recordings/${id}/generate-quiz`);
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

  const liveContent = (
    <div className="class__section">
      <DataTable columns={liveColumns} data={liveClassData} />
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
                    className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                    {rec.thumbnail_url ? (
                      <img src={rec.thumbnail_url} alt={rec.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><PlayCircle size={26} className="text-white/80" /></div>
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
            {recordedClassData.length} recorded · {liveClassData.length} live classes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Radio size={16} />} onClick={() => setShowScheduleModal(true)}>Schedule Live</Button>
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
                        { label: 'Total Watches', value: detailRec.views ?? 0 },
                        { label: 'Completion Rate', value: '0%' },
                        { label: 'Avg Watch', value: '0%' },
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
                </div>
              )}
              {detailTab === 'notes' && (
                <div>
                  {detailRec.notes_status === 'done' && detailRec.notes?.trim() ? (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><Sparkles size={13} /> AI-generated notes</span>
                        <button onClick={() => handleRegenerateNotes(detailRec.id)} className="text-xs font-bold text-blue-600 hover:underline">Regenerate</button>
                      </div>
                      <MarkdownRenderer content={detailRec.notes} className="prose-slate" />
                    </>
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
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{detailRec.transcript}</p>
                ) : detailRec.transcript_status === 'failed' ? (
                  <div className="text-sm text-slate-500">
                    Transcription failed.{' '}
                    <button onClick={() => { handleRetranscribe(detailRec.id); setDetailRec(null); }} className="font-bold text-blue-600 hover:underline">Retry</button>
                  </div>
                ) : (
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Transcribing… check back shortly.</p>
                )
              )}
              {detailTab === 'quiz' && (
                <div>
                  {detailRec.quiz_status === 'done' && Array.isArray(detailRec.quiz) && detailRec.quiz.length ? (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <Sparkles size={13} /> {detailRec.quiz.length} in-video questions
                        </span>
                        <button onClick={() => handleGenerateQuiz(detailRec.id)} className="text-xs font-bold text-blue-600 hover:underline">Regenerate</button>
                      </div>
                      <div className="space-y-4">
                        {detailRec.quiz.map((q: any, qi: number) => (
                          <div key={q.id || qi} className="rounded-xl border border-slate-100 p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-600">At {q.triggerAtPercent ?? 0}%</span>
                              {q.segmentTitle && <span className="truncate text-[11px] font-semibold text-slate-400">{q.segmentTitle}</span>}
                            </div>
                            <p className="text-sm font-bold text-slate-900">{qi + 1}. {q.questionText}</p>
                            <div className="mt-2 space-y-1.5">
                              {(q.options || []).map((opt: any) => {
                                const correct = opt.label === q.correctOption;
                                return (
                                  <div key={opt.label}
                                    className={`flex items-start gap-2 rounded-lg border px-3 py-1.5 text-sm ${correct ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                                    <span className="font-bold">{opt.label}.</span>
                                    <span>{opt.text}</span>
                                    {correct && <span className="ml-auto text-[10px] font-black uppercase text-emerald-600">Correct</span>}
                                  </div>
                                );
                              })}
                            </div>
                            {q.explanation && (
                              <p className="mt-2 text-xs text-slate-500"><span className="font-bold text-slate-600">Why:</span> {q.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
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

      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule New Class">
        <div className="class__modal-form">
          <InputField
            label="Class Title"
            placeholder="Enter class title"
            value={scheduleForm.title}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <SelectField
            label="Subject"
            value={scheduleForm.subjectId}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, subjectId: e.target.value }))}
            options={academicSubjects.map((s: any) => ({ value: s.id, label: s.name }))}
          />
          <SelectField
            label="Class"
            value={scheduleForm.classId}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, classId: e.target.value }))}
            options={academicClasses.map((c: any) => ({ value: c.id, label: c.name }))}
          />
          <div className="class__modal-row">
            <InputField
              label="Date"
              type="date"
              value={scheduleForm.date}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, date: e.target.value }))}
            />
            <InputField
              label="Time"
              type="time"
              value={scheduleForm.time}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>
          <InputField
            label="Duration"
            placeholder="e.g., 45"
            value={scheduleForm.duration}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, duration: e.target.value }))}
          />
          <InputField
            label="Zoom Link"
            placeholder="https://zoom.us/j/..."
            value={scheduleForm.zoomLink}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, zoomLink: e.target.value }))}
          />
          <InputField
            label="Google Meet Link"
            placeholder="https://meet.google.com/..."
            value={scheduleForm.googleMeetLink}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, googleMeetLink: e.target.value }))}
          />
          <SelectField
            label="Live Status"
            value={scheduleForm.liveStatus}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, liveStatus: e.target.value }))}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'ongoing', label: 'Ongoing' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
          <SelectField
            label="Recurring Schedule"
            value={scheduleForm.recurringSchedule}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, recurringSchedule: e.target.value }))}
            options={[
              { value: 'none', label: 'One-time' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
          />
          <div className="class__modal-actions">
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  if (!scheduleForm.classId || !scheduleForm.subjectId || !scheduleForm.date || !scheduleForm.time) {
                    console.log('Form validation failed:', scheduleForm);
                    alert('Please fill in class, subject, date and time fields');
                    return;
                  }

                  const dayOfWeek = new Date(scheduleForm.date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                  const durationMin = parseInt(scheduleForm.duration, 10) || 45;
                  const payload = {
                    class_id: scheduleForm.classId,
                    subject_id: scheduleForm.subjectId,
                    teacher_id: user?.id,
                    day_of_week: dayOfWeek,
                    start_time: scheduleForm.time,
                    end_time: toEndTime(scheduleForm.time, durationMin),
                    type: 'live',
                    zoom_link: scheduleForm.zoomLink,
                    google_meet_link: scheduleForm.googleMeetLink,
                    live_status: scheduleForm.liveStatus,
                    recurring_schedule: scheduleForm.recurringSchedule === 'none' ? null : { pattern: scheduleForm.recurringSchedule },
                  };

                  console.log('Scheduling with payload:', payload);
                  await api.post('/classes/schedules', payload);

                  alert('Class scheduled successfully');
                  fetchSchedules();

                  setShowScheduleModal(false);
                  setScheduleForm({ title: '', classId: '', subjectId: '', date: '', time: '', duration: '45', zoomLink: '', googleMeetLink: '', liveStatus: 'scheduled', recurringSchedule: 'none' });
                } catch (error) {
                  console.error('Failed to create schedule', error);
                  const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to schedule class';
                  alert(errorMessage);
                }
              }}
            >
              Schedule Class
            </Button>
          </div>
        </div>
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
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, classId: e.target.value }))}
              options={[{ value: '', label: 'Select class…' }, ...academicClasses.map((c: any) => ({ value: c.id, label: c.name }))]}
            />
            <SelectField
              label="Subject"
              value={recordingForm.subjectId}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, subjectId: e.target.value }))}
              options={[{ value: '', label: 'Select subject…' }, ...academicSubjects.map((s: any) => ({ value: s.id, label: s.name }))]}
            />
          </div>
          <div className="class__modal-row">
            <SelectField
              label="Chapter (optional)"
              value={recordingForm.chapterId}
              onChange={(e) => setRecordingForm((prev) => ({ ...prev, chapterId: e.target.value }))}
              options={[{ value: '', label: recordingForm.subjectId ? (recChapters.length ? 'All / general' : 'No chapters') : 'Select subject first' }, ...recChapters.map((c: any) => ({ value: c.id, label: c.name }))]}
            />
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
