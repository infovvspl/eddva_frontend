import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SchoolVideoPlayer } from '@/components/school/SchoolVideoPlayer';
import { SchoolAskDoubtPanel } from '@/components/school/SchoolAskDoubtPanel';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { HighlightRenderer } from '@/lib/highlight-renderer';
import { toast } from 'sonner';
import { schoolLive } from '@/lib/api/school-live';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  Loader2,
  PlayCircle,
  Sparkles,
  Tag,
  X,
  MessageCircle,
  Trophy,
  Lock,
  ImagePlus,
  PanelRightClose,
  PanelRightOpen,
  HelpCircle,
  Trash2,
  Send,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseTabs } from '@/components/student/lecture/CourseTabs';
import { useSchoolFeature } from '@/hooks/use-school-feature';

function isYouTubeUrl(url = '') {
  return /(?:youtube\.com\/|youtu\.be\/)/i.test(url);
}

function youTubeEmbed(url = '') {
  const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : url;
}

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Date pending';
}

function fmtTime(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
}

function getAvatarColor(name = '') {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function RecordedClassDetails() {
  const isMobile = useIsMobile();
  const { recordingId } = useParams();
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'INSTITUTE_ADMIN' || user?.role === 'SUPER_ADMIN';
  const [searchParams] = useSearchParams();
  const playParam = searchParams.get('play');
  const shouldAutoPlay = playParam === '1';

  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasNotesGen = useSchoolFeature('ai', 'ai_notes_generator');
  const hasQuizGen = useSchoolFeature('ai', 'ai_quiz_generator');
  const hasDoubtResolution = useSchoolFeature('ai', 'ai_doubt_solver');

  // Derive the recording early so we can use lectureId in the tabs memo.
  // Note: `recordings` is populated asynchronously; the memo re-runs once it resolves.
  const recording = useMemo(
    () => recordings.find((item) => item.id === recordingId) ?? null,
    [recordings, recordingId],
  );

  const availableTabs = useMemo(() => {
    const list = [];
    if (hasNotesGen) list.push('notes');
    list.push('my_notes');
    if (hasNotesGen) list.push('transcript');
    if (hasQuizGen) list.push('quiz');
    // Only show the Q&A tab for recordings that originated from a live class
    if (recording?.lectureId) list.push('questions');
    if (hasDoubtResolution) list.push('doubt');
    return list;
  }, [hasNotesGen, hasQuizGen, hasDoubtResolution, recording?.lectureId]);

  const [detailTab, setDetailTab] = useState(() => {
    if (hasNotesGen) return 'notes';
    return 'my_notes';
  });

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(detailTab)) {
      setDetailTab(availableTabs[0]);
    }
  }, [availableTabs, detailTab]);
  const [playback, setPlayback] = useState({ src: '', source: '', loading: false, error: '' });
  const [addingVisuals, setAddingVisuals] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const [currentTime, setCurrentTime] = useState(0);
  const [savedResponses, setSavedResponses] = useState([]);
  const [resumeAt, setResumeAt] = useState(0);
  const [expandedQuizIds, setExpandedQuizIds] = useState({});
  const lastSaveTimeRef = useRef(0);

  const [notesHighlights, setNotesHighlights] = useState([]);
  const notesContentRef = useRef(null);
  const saveTimerRef = useRef(null);

  const [liveNotes, setLiveNotes] = useState('');
  const [liveQuestions, setLiveQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const response = await api.get('/classes/recordings');
        setRecordings(unwrapSchoolList(response));
      } catch (error) {
        console.error('Failed to fetch recorded class details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, []);

  // `recording` is derived above (near availableTabs) to keep the tabs in sync.

  useEffect(() => {
    if (!recording) return;
    if (hasNotesGen) {
      setDetailTab(recording.notes ? 'notes' : 'transcript');
    } else {
      setDetailTab('my_notes');
    }

    const lId = recording.lectureId;
    const saved = localStorage.getItem(`student_notes_${lId}`) || localStorage.getItem(`student_notes_${recording.id}`) || '';
    setLiveNotes(saved);

    // Sync with production DB
    api.get(`/classes/student-notes?recordingId=${recording.id}`).then((res) => {
      const data = unwrapSchoolData(res, {});
      if (data.notes) {
        setLiveNotes(data.notes);
        const key = lId ? `student_notes_${lId}` : `student_notes_${recording.id}`;
        localStorage.setItem(key, data.notes);
      }
    }).catch(err => console.error('Failed to sync notes with production DB:', err));

    const fetchProgress = async () => {
      try {
        const res = await api.get(`/classes/recordings/${recording.id}/progress`);
        const data = unwrapSchoolData(res, null);
        if (data) {
          setSavedResponses(data.quizResponses || []);
          if (data.lastPositionSeconds && data.lastPositionSeconds > 0) {
            setResumeAt(data.lastPositionSeconds);
          }
        }
      } catch (err) {
        console.error('Failed to fetch recording progress:', err);
      }
    };
    
    const fetchHighlights = async () => {
      try {
        const res = await api.get(`/recordings/${recording.id}/highlights`);
        setNotesHighlights(unwrapSchoolData(res, []));
      } catch (e) {
        console.error('Failed to fetch highlights', e);
      }
    };

    const fetchLiveQuestions = async () => {
      if (!lId) {
        setLiveQuestions([]);
        return;
      }
      try {
        setLoadingQuestions(true);
        const data = await schoolLive.getQuestions(lId);
        setLiveQuestions(data || []);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchProgress();
    fetchHighlights();
    fetchLiveQuestions();
  }, [recording]);

  useEffect(() => {
    const root = notesContentRef.current;
    if (!root) return;

    const timer = setTimeout(() => {
      const renderer = new HighlightRenderer(root, {
        editable: false,
      });
      renderer.render(notesHighlights);
    }, 150);

    return () => clearTimeout(timer);
  }, [detailTab, recording?.notes, notesHighlights]);

  const savePlaybackProgress = useCallback(async (seconds) => {
    if (!recording || !recording.duration) return;
    const durationMins = parseFloat(recording.duration) || 0;
    const durationSecs = durationMins * 60;
    const pct = durationSecs > 0 ? Math.min(100, Math.round((seconds / durationSecs) * 100)) : 0;

    try {
      await api.post(`/classes/recordings/${recording.id}/progress`, {
        watchPercentage: pct,
        lastPositionSeconds: Math.round(seconds),
      });
    } catch (err) {
      console.error('Failed to save progress to backend:', err);
    }
  }, [recording]);

  const handleTimeUpdate = useCallback((seconds) => {
    setCurrentTime(seconds);
    const now = Date.now();
    if (now - lastSaveTimeRef.current > 8000) { // save every 8 seconds
      lastSaveTimeRef.current = now;
      savePlaybackProgress(seconds);
    }
  }, [savePlaybackProgress]);

  const handleAnswerSubmitted = useCallback(async (questionId, option, isCorrect) => {
    if (!recording) return;
    try {
      const res = await api.post(`/classes/recordings/${recording.id}/quiz-response`, {
        questionId,
        selectedOption: option,
      });
      const data = unwrapSchoolData(res, {});
      
      setSavedResponses((prev) => {
        const existingIdx = prev.findIndex((r) => r.questionId === questionId);
        const newResponse = {
          questionId,
          selectedOption: option,
          isCorrect: data.isCorrect ?? isCorrect,
        };
        const next = [...prev];
        if (existingIdx >= 0) {
          next[existingIdx] = newResponse;
        } else {
          next.push(newResponse);
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to save quiz response to backend:', err);
    }
  }, [recording]);

  const handleLiveNotesChange = (e) => {
    const value = e.target.value;
    setLiveNotes(value);
    const key = recording?.lectureId ? `student_notes_${recording.lectureId}` : `student_notes_${recording?.id}`;
    if (key) {
      localStorage.setItem(key, value);
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api.post('/classes/student-notes', {
          recordingId: recording?.id,
          lectureId: recording?.lectureId || null,
          notes: value
        });
      } catch (err) {
        console.error('Failed to save notes to production DB:', err);
      }
    }, 1000);
  };

  const downloadLiveNotes = () => {
    if (!liveNotes.trim()) {
      toast.warning("Notes are empty");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([liveNotes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${recording?.title || 'Class'}_LiveNotes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Notes downloaded successfully!");
  };

  const clearLiveNotes = () => {
    if (window.confirm("Are you sure you want to clear your notes?")) {
      setLiveNotes('');
      const key = recording?.lectureId ? `student_notes_${recording.lectureId}` : `student_notes_${recording?.id}`;
      if (key) {
        localStorage.removeItem(key);
      }

      api.post('/classes/student-notes', {
        recordingId: recording?.id,
        lectureId: recording?.lectureId || null,
        notes: ''
      }).then(() => {
        toast.success("Notes cleared");
      }).catch(err => {
        console.error('Failed to clear notes in production DB:', err);
        toast.error("Failed to clear notes in DB");
      });
    }
  };

  useEffect(() => {
    if (!recording || !recording.video_url) return;

    let cancelled = false;
    const loadPlayUrl = async () => {
      const fallbackSrc = recording.video_url || '';
      setPlayback({ src: fallbackSrc, source: recording.source || '', loading: true, error: '' });

      try {
        if (recording.source === 'youtube' || isYouTubeUrl(recording.video_url)) {
          if (!cancelled) {
            setPlayback({ src: recording.video_url, source: 'youtube', loading: false, error: '' });
          }
          return;
        }

        const response = await api.get(`/classes/recordings/${recording.id}/play-url`);
        const data = unwrapSchoolData(response, {});
        if (!cancelled) {
          setPlayback({
            src: data.videoUrl || recording.video_url || '',
            source: data.source || recording.source || 'upload',
            loading: false,
            error: data.videoUrl || recording.video_url ? '' : 'No playable video URL was returned.',
          });
        }
      } catch (error) {
        console.error('Failed to load playable video URL:', error);
        if (!cancelled) {
          setPlayback({
            src: fallbackSrc,
            source: recording.source || 'upload',
            loading: false,
            error: fallbackSrc ? '' : 'Could not prepare the video link. Please refresh and try again.',
          });
        }
      }
    };

    loadPlayUrl();
    return () => {
      cancelled = true;
    };
  }, [recording]);

  const handleAddVisuals = async () => {
    if (!recording || addingVisuals) return;
    setAddingVisuals(true);
    try {
      await api.post(`/classes/recordings/${recording.id}/regenerate-notes-images`);
      const response = await api.get('/classes/recordings');
      setRecordings(unwrapSchoolList(response));
    } catch (err) {
      console.error('Failed to trigger image enrichment:', err);
    } finally {
      setAddingVisuals(false);
    }
  };

  const handleDownloadNotesPdf = async () => {
    if (downloadingPdf || !recording?.notes) return;
    setDownloadingPdf(true);
    try {
      // Fetch embedded visuals as base64 through the backend (S3 has no CORS)
      let imageMap = {};
      if (Array.isArray(recording.notes_images) && recording.notes_images.length > 0) {
        try {
          const res = await api.get(`/classes/recordings/${recording.id}/notes-images-data`);
          imageMap = res?.data?.data?.images ?? res?.data?.images ?? {};
        } catch (err) {
          console.warn('Could not fetch notes images for PDF, continuing without them', err);
        }
      }
      const { downloadNotesAsPDF } = await import('@/lib/school/notesPdf');
      const safeName = (recording.title || 'ai-notes').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      await downloadNotesAsPDF({
        markdown: recording.notes,
        title: recording.title || 'AI Notes',
        filename: `${safeName}-notes.pdf`,
        imageMap,
      });
      toast.success('Notes PDF downloaded');
    } catch (err) {
      console.error('Failed to download notes PDF:', err);
      toast.error('Could not generate the PDF. Try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const renderRecordingStatus = (item) => {
    if (!hasNotesGen) return null;

    if (item.notes_status === 'done' && item.notes) {
      const imageCount = Array.isArray(item.notes_images) ? item.notes_images.length : 0;
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <Sparkles size={13} />
          {imageCount > 0 ? `AI notes · ${imageCount} visuals` : 'AI notes ready'}
        </span>
      );
    }

    if (item.transcript_status === 'done') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          <Download size={13} />
          Transcript ready
        </span>
      );
    }

    if (item.notes_status === 'failed' || item.transcript_status === 'failed') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
          <X size={13} />
          Generation failed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        <Loader2 size={13} className="animate-spin" />
        Processing notes
      </span>
    );
  };

  const renderVideoPlayer = () => {
    if (!recording.video_url) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-6 text-center">
          <PlayCircle className="h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-xl font-black text-white">Video is not available</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            The teacher has not attached a playable recording for this class yet.
          </p>
        </div>
      );
    }

    if (playback.loading && !playback.src) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 text-center text-white">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="mt-3 text-sm font-bold">Preparing video...</p>
        </div>
      );
    }

    if (playback.error) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 px-6 text-center text-white">
          <PlayCircle className="h-10 w-10 text-white/60" />
          <h3 className="mt-4 text-lg font-bold">Video could not start</h3>
          <p className="mt-2 max-w-md text-sm text-white/70">{playback.error}</p>
          {playback.src && (
            <button
              type="button"
              onClick={() => setPlayback((current) => ({ ...current, error: '' }))}
              className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Try again inline
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <SchoolVideoPlayer
          src={playback.src}
          checkpoints={recording.quiz || []}
          autoPlay={shouldAutoPlay}
          onTimeUpdate={handleTimeUpdate}
          onAnswerSubmitted={handleAnswerSubmitted}
          resumeAt={resumeAt}
        />
        {playback.loading && (
          <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white z-10">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparing secure link
          </div>
        )}
      </div>
    );
  };

  const renderStudyPanel = () => {
    if (detailTab === 'my_notes') {
      return (
        <div className="flex flex-col min-h-[300px] space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Digital Notepad
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">Saved locally</span>
          </div>

          <textarea
            value={liveNotes}
            onChange={handleLiveNotesChange}
            placeholder="Take notes of the lecture here... Write down formulas, questions, or key takeaways."
            className="w-full h-72 rounded-2xl border border-slate-200 bg-white p-4 text-[13px] text-slate-700 outline-none focus:border-blue-500 shadow-sm resize-none mb-3 font-semibold placeholder:text-slate-400"
          />

          <div className="flex gap-2 bg-white p-2 border border-slate-200/60 rounded-xl">
            <button
              onClick={downloadLiveNotes}
              className="flex-1 py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-[13px] font-black transition flex items-center justify-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              onClick={clearLiveNotes}
              className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[13px] font-black transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      );
    }

    if (detailTab === 'questions') {
      if (loadingQuestions) {
        return (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm font-bold text-slate-500">Loading questions...</p>
          </div>
        );
      }

      if (!recording.lectureId) {
        return (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center px-4">
            <HelpCircle className="h-10 w-10 text-slate-300 mb-2 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800">Q&A Not Available</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xs">
              This class was uploaded as a pre-recorded lecture, so no live Q&A session is available.
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-col min-h-[300px] bg-slate-50/50 p-2 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between px-2 py-1">
            <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-400">Class Q&A</h4>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-black text-blue-700">
              {liveQuestions.length} Questions
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1">
            {liveQuestions.length === 0 ? (
              <div className="py-12 text-center text-slate-405 bg-white border border-slate-200/50 rounded-xl p-4">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 text-slate-350" />
                <p className="text-[13px] font-bold text-slate-500">No questions asked</p>
                <p className="text-[12px] text-slate-400 mt-0.5">No student questions were asked during this class.</p>
              </div>
            ) : (
              [...liveQuestions].reverse().map((q) => (
                <div key={q.id} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-[12px] uppercase shadow-xs"
                        style={{ backgroundColor: getAvatarColor(q.userName) }}
                      >
                        {q.userName ? q.userName.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-bold text-slate-800 block truncate">{q.userName}</span>
                        <span className="text-[12px] text-slate-400 font-semibold">{fmtTime(q.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                      q.answer ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {q.answer ? 'Answered' : 'Unanswered'}
                    </span>
                  </div>

                  <p className="text-[13px] text-slate-700 font-semibold leading-relaxed break-words pl-9">{q.text}</p>

                  {q.answer && (
                    <div className="ml-9 bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
                      <span className="text-[12px] font-black text-blue-600 block">Teacher's Answer:</span>
                      <p className="text-[13px] text-slate-700 leading-relaxed font-semibold">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (detailTab === 'notes') {
      if (recording.notes) {
        const imageCount = Array.isArray(recording.notes_images) ? recording.notes_images.length : 0;
        return (
          <div className="space-y-4">
            {/* Visuals metadata bar */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {imageCount > 0 ? (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                      <ImagePlus size={11} />
                    </span>
                    <span className="font-semibold text-slate-700">{imageCount} visual{imageCount !== 1 ? 's' : ''} embedded</span>
                    <span>· scroll down to see them</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-slate-400">
                      <ImagePlus size={11} />
                    </span>
                    <span>No visuals yet</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadNotesPdf}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-60"
                >
                  {downloadingPdf ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Download size={11} />
                  )}
                  {downloadingPdf ? 'Preparing…' : 'Download PDF'}
                </button>
                {isTeacher && (
                  <button
                    type="button"
                    onClick={handleAddVisuals}
                    disabled={addingVisuals}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {addingVisuals ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <ImagePlus size={11} />
                    )}
                    {imageCount > 0 ? 'Refresh visuals' : 'Add visuals'}
                  </button>
                )}
              </div>
            </div>

            <div ref={notesContentRef} className="relative">
              <MarkdownRenderer content={recording.notes} className="prose-slate" />
            </div>
          </div>
        );
      }

      if (['pending', 'processing'].includes(recording.notes_status)) {
        return (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">AI notes are being prepared</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              The system is still generating structured notes for this lecture.
            </p>
          </div>
        );
      }

      return (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <Sparkles className="h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-900">Notes not ready yet</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            This lecture does not have published AI notes yet.
          </p>
        </div>
      );
    }

    if (detailTab === 'transcript') {
      if (recording.transcript) {
        return (
          <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <p className="whitespace-pre-wrap">{recording.transcript}</p>
          </div>
        );
      }

      if (['pending', 'processing'].includes(recording.transcript_status)) {
        return (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Transcript is being generated</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Speech-to-text is still running. Please check back shortly.
            </p>
          </div>
        );
      }

      return (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <FileText className="h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-900">Transcript not available</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            This lecture does not have a transcript yet.
          </p>
        </div>
      );
    }

    if (detailTab === 'quiz') {
      const checkpoints = recording.quiz || [];
      const correct = savedResponses.filter(r => r.isCorrect).length;

      return (
        <div className="space-y-4 text-slate-800">
          {savedResponses.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl text-white">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</p>
                <p className="text-base font-black">
                  {correct}/{savedResponses.length}
                  <span className="text-indigo-400 ml-1.5 text-sm">
                    {Math.round((correct / Math.max(savedResponses.length, 1)) * 100)}%
                  </span>
                </p>
              </div>
            </div>
          )}
          {checkpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="h-8 h-8 text-slate-200 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">No quiz checkpoints yet</p>
            </div>
          ) : (
            checkpoints.map((cp, i) => {
              const response = savedResponses.find(r => r.questionId === cp.id);
              const hasAnswered = !!response;
              const isExpanded = !!expandedQuizIds[cp.id];
              if (!hasAnswered) {
                return (
                  <div
                    key={cp.id}
                    className="p-4 rounded-2xl border bg-white border-slate-100 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 bg-slate-100 text-slate-400">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {cp.segmentTitle && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {cp.segmentTitle}
                          </p>
                        )}
                        <div className="text-sm font-bold text-slate-800 leading-snug">
                          <MarkdownRenderer content={cp.questionText} className="prose-p:my-0 text-slate-800 font-bold" />
                        </div>
                        <span className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-350">
                          <Lock className="w-3.5 h-3.5 text-slate-300" /> Not answered yet
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cp.id}
                  onClick={() => {
                    setExpandedQuizIds((prev) => ({
                      ...prev,
                      [cp.id]: !prev[cp.id],
                    }));
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm select-none ${
                    response.isCorrect
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                        response.isCorrect
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {cp.segmentTitle && (
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          response.isCorrect ? "text-emerald-500/80" : "text-rose-500/80"
                        }`}>
                          {cp.segmentTitle}
                        </p>
                      )}
                      <div className="text-sm font-bold text-slate-800 leading-snug">
                        <MarkdownRenderer content={cp.questionText} className="prose-p:my-0 text-slate-800 font-bold" />
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                          {/* Options list */}
                          <div className="space-y-2">
                            {(cp.options || []).map((opt) => {
                              const isSelected = response.selectedOption === opt.label;
                              const isCorrectOption = cp.correctOption === opt.label;
                              
                              return (
                                <div
                                  key={opt.label}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs font-semibold ${
                                    isCorrectOption
                                      ? "border-emerald-250 bg-emerald-500/10 text-emerald-800"
                                      : isSelected
                                      ? "border-rose-250 bg-rose-500/10 text-rose-800"
                                      : "border-slate-100 bg-slate-50/50 text-slate-500"
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${
                                      isCorrectOption
                                        ? "bg-emerald-500 text-white"
                                        : isSelected
                                        ? "bg-rose-500 text-white"
                                        : "bg-slate-200 text-slate-500"
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                  <div className="flex-1 font-medium pointer-events-none">
                                    <MarkdownRenderer content={opt.text} className="prose-p:my-0 text-slate-700 font-semibold" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {cp.explanation && (
                            <div className="p-3 bg-white/60 rounded-xl border border-slate-200/60 text-xs text-slate-550 leading-relaxed">
                              <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Explanation
                              </p>
                              <MarkdownRenderer content={cp.explanation} className="prose-p:my-0 text-slate-500" />
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <div className={`w-1.5 h-1.5 rounded-full ${response.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`} />
                            <span className={response.isCorrect ? "text-emerald-700" : "text-rose-600"}>
                              You answered Option {response.selectedOption}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (detailTab === 'doubt') {
      return (
        <SchoolAskDoubtPanel
          recordingId={recording.id}
          subjectId={recording.subject_id}
          subjectName={recording.subject_name || "General"}
          lectureTitle={recording.title}
          timestampSeconds={currentTime}
          onClose={() => {}}
        />
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="space-y-6">
        <Link
          to="/school/student/recorded-classes"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Recorded Classes
        </Link>

        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Lecture not found</h2>
          <p className="mt-1 text-sm text-slate-500">
            This recorded lecture is not available right now or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 -mb-3 min-h-[calc(100vh-76px)] bg-slate-50 sm:-mx-5 sm:-mb-5 lg:-mx-6 lg:-mb-6 lg:flex lg:h-[calc(100vh-76px)] lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <div className="border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6 lg:shrink-0">
        <div className="flex w-full items-center gap-3">
          <Link
            to="/school/student/recorded-classes"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-600 hover:text-white"
            aria-label="Back to recorded classes"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-blue-600">
              {recording.chapter_name || recording.subject_name || 'Recorded Class'}
            </p>
            <h1 className="truncate text-sm font-black leading-tight text-slate-900">{recording.title}</h1>
          </div>
          <div className="hidden shrink-0 sm:block">{renderRecordingStatus(recording)}</div>
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
            aria-label={isSidebarExpanded ? 'Hide AI Notes Panel' : 'Show AI Notes Panel'}
          >
            {isSidebarExpanded ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span>{isSidebarExpanded ? 'Hide Panel' : 'Show Panel'}</span>
          </button>
        </div>
      </div>

      <div className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:min-h-0 lg:flex-1">
        {isMobile ? (
          <div className="flex flex-col space-y-4">
            {/* Video Player Container */}
            <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
              {renderVideoPlayer()}
            </div>

            {/* Unified Details & Tabs Container */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-850 dark:bg-slate-900 overflow-hidden">
              {/* Details */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-850">
                <div className="flex flex-wrap items-center gap-2">
                  {recording.subject_name && (
                    <span className="rounded-full bg-blue-50 dark:bg-blue-955/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                      {recording.subject_name}
                    </span>
                  )}
                  {recording.class_name && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {recording.class_name}
                    </span>
                  )}
                  <span>{renderRecordingStatus(recording)}</span>
                </div>
                <h2 className="mt-3 text-lg font-black text-slate-950 dark:text-white leading-tight">{recording.title}</h2>
                {recording.description && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{recording.description}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 dark:border-slate-800 dark:bg-slate-850">
                    <CalendarDays size={12} />
                    {dateLabel(recording.recorded_date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 dark:border-slate-800 dark:bg-slate-850">
                    <Clock3 size={12} />
                    {recording.duration
                      ? (parseFloat(recording.duration) >= 1
                          ? `${Math.round(parseFloat(recording.duration))} mins`
                          : `${Math.round(parseFloat(recording.duration) * 60)}s`)
                      : 'Duration pending'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1 dark:border-slate-800 dark:bg-slate-850">
                    <Tag size={12} />
                    {recording.topic_name || recording.chapter_name || 'General topic'}
                  </span>
                </div>
              </div>

              <div>
                <CourseTabs
                  activeTab={detailTab}
                  onChange={setDetailTab}
                  availableTabs={availableTabs}
                  isDarkTheme={true}
                />
                <div className="p-4">{renderStudyPanel()}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 transition-all duration-300 lg:h-full lg:min-h-0 lg:grid-rows-[minmax(0,1fr)] ${isSidebarExpanded ? 'lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]' : 'grid-cols-1'}`}>
            <main className="min-w-0 space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pb-5 scrollbar-hide">
              {renderVideoPlayer()}

              <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {recording.subject_name && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                          {recording.subject_name}
                        </span>
                      )}
                      {recording.class_name && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                          {recording.class_name}
                        </span>
                      )}
                      <span className="sm:hidden">{renderRecordingStatus(recording)}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">{recording.title}</h2>
                    {recording.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{recording.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-850">
                    <CalendarDays size={13} />
                    {dateLabel(recording.recorded_date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-850">
                    <Clock3 size={13} />
                    {recording.duration
                      ? (parseFloat(recording.duration) >= 1
                          ? `${Math.round(parseFloat(recording.duration))} mins`
                          : `${Math.round(parseFloat(recording.duration) * 60)}s`)
                      : 'Duration pending'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-850">
                    <Tag size={13} />
                    {recording.topic_name || recording.chapter_name || 'General topic'}
                  </span>
                  {recording.resolution && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-600 dark:border-blue-900 dark:bg-blue-955/45 dark:text-blue-400">
                      {recording.resolution}
                    </span>
                  )}
                  {recording.video_size && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-850">
                      {recording.video_size > 1024 * 1024 * 1024
                        ? `${(recording.video_size / (1024 * 1024 * 1024)).toFixed(1)} GB`
                        : `${Math.round(recording.video_size / (1024 * 1024))} MB`}
                    </span>
                  )}
                </div>
              </section>
            </main>

          <aside className={`min-w-0 ${isSidebarExpanded ? 'block' : 'hidden lg:hidden'} lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pb-5 scrollbar-hide`}>
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <CourseTabs
                activeTab={detailTab}
                onChange={setDetailTab}
                availableTabs={availableTabs}
              />
              <div className="p-5">{renderStudyPanel()}</div>
            </section>
          </aside>
        </div>
      )}
    </div>
  </div>
);
}
