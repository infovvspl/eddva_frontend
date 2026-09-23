import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SchoolVideoPlayer } from '@/components/school/SchoolVideoPlayer';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import Button from '@/components/school/Button';
import { CourseTabs } from '@/components/student/lecture/CourseTabs';
import { useSchoolFeature } from '@/hooks/use-school-feature';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import 'katex/dist/katex.min.css';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Tag,
  FileText,
  Loader2,
  PlayCircle,
  Sparkles,
  ImagePlus,
  Download,
  ChevronRight,
  CheckCircle,
  XCircle,
  ListChecks,
  Users,
  TrendingUp,
  RefreshCw,
  MessagesSquare,
  MessageCircle,
  Send,
  HelpCircle,
} from 'lucide-react';

function isYouTubeUrl(url = '') {
  return /(?:youtube\.com\/|youtu\.be\/)/i.test(url);
}

const DOUBT_STATUS_META = {
  escalated: { label: 'Needs reply', tone: 'bg-amber-50 text-amber-800' },
  open: { label: 'Open', tone: 'bg-slate-100 text-slate-700' },
  ai_answered: { label: 'AI answered', tone: 'bg-indigo-50 text-indigo-700' },
  teacher_answered: { label: 'Answered', tone: 'bg-emerald-50 text-emerald-700' },
};

// A plain count — no upper bound, so it reads as a stat tile rather than a meter.
function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
        <Icon className="h-5 w-5 text-blue-600" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none text-slate-900">{value}</p>
        <p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// A ratio against a 0-100% limit — rendered as a meter (fill + track), banded
// by severity the same way quiz accuracy is elsewhere on this page, so "healthy
// engagement" reads the same color language across the whole tab.
function StatMeter({ label, value, icon: Icon }) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const tone = pct >= 70 ? 'emerald' : pct >= 40 ? 'amber' : 'rose';
  const toneText = { emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600' }[tone];
  const toneFill = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[tone];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
          <Icon className="h-4 w-4 text-slate-500" />
        </span>
        <p className="flex-1 truncate text-[11px] font-semibold text-slate-500">{label}</p>
        <p className={cn('shrink-0 text-lg font-black', toneText)}>{pct}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', toneFill)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function sortByNewest(list, dateField = 'createdAt') {
  return [...list].sort((a, b) => new Date(b[dateField] || 0) - new Date(a[dateField] || 0));
}

// "All" mixes answered and unanswered doubts, so it orders by whichever is more
// recent for each one — resolvedAt (when the teacher replied) or createdAt (when
// asked) — rather than always the ask time, which would bury a just-answered doubt.
function sortByActivity(list) {
  const activityDate = (d) => new Date(d.resolvedAt || d.createdAt || 0).getTime();
  return [...list].sort((a, b) => activityDate(b) - activityDate(a));
}

function parseAiDoubtAnswer(raw) {
  if (!raw) return '';
  let str = raw.trim();
  const jsonMatch = str.match(/(\{[\s\S]*\})/);
  if (jsonMatch) str = jsonMatch[1].trim();
  try {
    const obj = JSON.parse(str);
    if (obj && typeof obj === 'object') {
      return obj.detailed?.solution || obj.brief?.answer || obj.explanation || raw;
    }
  } catch (e) {
    // not JSON — fall through to the raw string
  }
  return raw;
}

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Date pending';
}

// Teacher-only view of a recorded class. Deliberately a separate component from
// the student one (pages/school/student/RecordedClassDetails.jsx) — teachers need
// quiz analytics (per-option %, per-student correct/incorrect), not the student's
// self-assessment quiz UI, so the two audiences can't share a single quiz tab.
export default function TeacherRecordedClassDetails() {
  const navigate = useNavigate();
  const { recordingId } = useParams();
  const location = useLocation();
  const requestedTab = location.state?.openTab;

  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasNotesGen = useSchoolFeature('ai', 'ai_notes_generator');
  const hasQuizGen = useSchoolFeature('ai', 'ai_quiz_generator');

  const recording = useMemo(
    () => recordings.find((item) => item.id === recordingId) ?? null,
    [recordings, recordingId],
  );

  const fetchRecordings = useCallback(async () => {
    try {
      const response = await api.get('/classes/recordings');
      setRecordings(unwrapSchoolList(response));
    } catch (error) {
      console.error('Failed to fetch recorded class details:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const availableTabs = useMemo(() => {
    const list = [];
    if (hasNotesGen) list.push('notes');
    if (hasNotesGen) list.push('transcript');
    if (hasQuizGen) list.push('quiz');
    list.push('overview');
    list.push('doubts');
    return list;
  }, [hasNotesGen, hasQuizGen]);

  const [detailTab, setDetailTab] = useState(() => requestedTab || (hasNotesGen ? 'notes' : 'overview'));

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(detailTab)) {
      setDetailTab(availableTabs[0]);
    }
  }, [availableTabs, detailTab]);

  const [playback, setPlayback] = useState({ src: '', source: '', loading: false, error: '' });
  const [notesImageMap, setNotesImageMap] = useState({});

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
  }, [recording?.id, recording?.video_url, recording?.source]);

  // Notes images as data URIs (the bucket has no CORS for direct browser <img> loads)
  useEffect(() => {
    if (!recording?.id || !recording?.notes) {
      setNotesImageMap({});
      return;
    }
    let cancelled = false;
    api.get(`/classes/recordings/${recording.id}/notes-images-data`)
      .then((res) => {
        if (!cancelled) setNotesImageMap(res?.data?.data?.images ?? res?.data?.images ?? {});
      })
      .catch(() => { if (!cancelled) setNotesImageMap({}); });
    return () => { cancelled = true; };
  }, [recording?.id, recording?.notes]);

  const [regeneratingNotes, setRegeneratingNotes] = useState(false);
  const handleRegenerateNotes = async () => {
    if (!recording || regeneratingNotes) return;
    setRegeneratingNotes(true);
    try {
      await api.post(`/classes/recordings/${recording.id}/regenerate-notes`);
      await fetchRecordings();
    } catch (err) {
      console.error('Failed to generate notes:', err);
      toast.error(err?.response?.data?.message || 'Could not generate notes. Make sure the transcript is ready.');
    } finally {
      setRegeneratingNotes(false);
    }
  };

  const [addingVisuals, setAddingVisuals] = useState(false);
  const handleAddVisuals = async () => {
    if (!recording || addingVisuals) return;
    setAddingVisuals(true);
    try {
      await api.post(`/classes/recordings/${recording.id}/regenerate-notes-images`);
      toast.success('Image enrichment started — notes will update shortly');
      [20_000, 45_000, 75_000, 120_000].forEach((delay) => {
        window.setTimeout(fetchRecordings, delay);
      });
    } catch (err) {
      console.error('Failed to trigger image enrichment:', err);
      toast.error(err?.response?.data?.message || 'Could not add visuals. Try again.');
    } finally {
      setAddingVisuals(false);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const handleDownloadNotesPdf = async () => {
    if (downloadingPdf || !recording?.notes) return;
    setDownloadingPdf(true);
    try {
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

  const [retranscribing, setRetranscribing] = useState(false);
  const handleRetranscribe = async () => {
    if (!recording || retranscribing) return;
    setRetranscribing(true);
    try {
      await api.post(`/classes/recordings/${recording.id}/retranscribe`);
      await fetchRecordings();
    } catch (err) {
      console.error('Failed to start transcription:', err);
      toast.error('Could not start transcription. Is the AI service running?');
    } finally {
      setRetranscribing(false);
    }
  };

  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const handleGenerateQuiz = async () => {
    if (!recording || generatingQuiz) return;
    setGeneratingQuiz(true);
    try {
      await api.post(`/classes/recordings/${recording.id}/generate-quiz`);
      toast.success('In-video AI Quiz generation started');
      await fetchRecordings();
    } catch (err) {
      console.error('Failed to generate in-video quiz:', err);
      toast.error(err?.response?.data?.message || 'Could not generate quiz. Make sure the transcript or notes are ready.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // ── Quiz analytics: % answered per option + per-student right/wrong breakdown ──
  const [quizAnalytics, setQuizAnalytics] = useState(null);
  const [quizAnalyticsLoading, setQuizAnalyticsLoading] = useState(false);
  const [quizAnalyticsError, setQuizAnalyticsError] = useState(null);
  const [quizSubTab, setQuizSubTab] = useState('questions');
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    if (!recording?.id || detailTab !== 'quiz' || recording.quiz_status !== 'done') {
      setQuizAnalytics(null);
      setQuizAnalyticsError(null);
      return;
    }
    let cancelled = false;
    setQuizAnalyticsLoading(true);
    setQuizAnalyticsError(null);
    api.get(`/classes/recordings/${recording.id}/quiz-analytics`)
      .then((response) => {
        if (!cancelled) setQuizAnalytics(response.data?.data ?? response.data ?? null);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to fetch quiz analytics', error);
        setQuizAnalytics(null);
        setQuizAnalyticsError(error?.response?.data?.message || 'Could not load student results.');
      })
      .finally(() => { if (!cancelled) setQuizAnalyticsLoading(false); });
    return () => { cancelled = true; };
  }, [recording?.id, recording?.quiz_status, detailTab]);

  // ── Recording-scoped Student Doubts panel ──────────────────────────────────
  const [recDoubts, setRecDoubts] = useState([]);
  const [recDoubtsLoading, setRecDoubtsLoading] = useState(false);
  const [recDoubtTab, setRecDoubtTab] = useState('pending');
  const [doubtReplyingId, setDoubtReplyingId] = useState(null);
  const [doubtReplyText, setDoubtReplyText] = useState('');
  const [doubtSubmitting, setDoubtSubmitting] = useState(false);
  const [doubtAiSuggesting, setDoubtAiSuggesting] = useState(false);
  const [doubtError, setDoubtError] = useState('');

  const fetchRecordingDoubts = useCallback(async (showSpinner = false) => {
    if (!recording?.id) return;
    setDoubtError('');
    if (showSpinner) setRecDoubtsLoading(true);
    try {
      const res = await api.get('/doubts');
      const all = res.data?.data ?? res.data ?? [];
      // Match by recordingId, or (for older doubts raised before that field existed)
      // by the lecture title embedded in the question text.
      const filtered = all.filter((d) => {
        if (d.recordingId && String(d.recordingId) === String(recording.id)) return true;
        if (!d.recordingId && d.questionText && recording.title && d.questionText.includes(`Lecture: ${recording.title}`)) return true;
        return false;
      });
      setRecDoubts(filtered);
    } catch (err) {
      setDoubtError(err?.response?.data?.message || 'Failed to load doubts');
      setRecDoubts([]);
    } finally {
      setRecDoubtsLoading(false);
    }
  }, [recording?.id, recording?.title]);

  useEffect(() => {
    if (recording?.id && detailTab === 'doubts') {
      fetchRecordingDoubts(true);
    }
  }, [recording?.id, detailTab, fetchRecordingDoubts]);

  useEffect(() => {
    setRecDoubts([]);
    setDoubtReplyingId(null);
    setDoubtReplyText('');
    setDoubtError('');
    setRecDoubtTab('pending');
  }, [recording?.id]);

  const submitDoubtReply = async (id) => {
    if (doubtReplyText.trim().length < 5) return;
    setDoubtSubmitting(true);
    setDoubtError('');
    try {
      await api.post(`/doubts/${id}/respond`, { response: doubtReplyText.trim() });
      setDoubtReplyingId(null);
      setDoubtReplyText('');
      await fetchRecordingDoubts();
    } catch (err) {
      setDoubtError(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setDoubtSubmitting(false);
    }
  };

  const aiSuggestDoubtReply = async (id) => {
    setDoubtAiSuggesting(true);
    setDoubtError('');
    try {
      const res = await api.post(`/doubts/${id}/ai-suggest`);
      const data = res.data?.data ?? res.data ?? {};
      if (data.suggestion) setDoubtReplyText(data.suggestion);
    } catch (err) {
      setDoubtError(err?.response?.data?.message || 'AI draft failed');
    } finally {
      setDoubtAiSuggesting(false);
    }
  };

  const renderVideoPlayer = () => {
    if (!recording.video_url) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-6 text-center">
          <PlayCircle className="h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-xl font-black text-white">Video is not available</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            No playable recording has been attached to this class yet.
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
        </div>
      );
    }

    return (
      <div className="relative">
        <SchoolVideoPlayer src={playback.src} checkpoints={recording.quiz || []} />
        {playback.loading && (
          <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white z-10">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparing secure link
          </div>
        )}
      </div>
    );
  };

  const renderNotesTab = () => {
    if (recording.notes) {
      const imageCount = Array.isArray(recording.notes_images) ? recording.notes_images.length : 0;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {imageCount > 0 ? (
                <>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                    <ImagePlus size={11} />
                  </span>
                  <span className="font-semibold text-slate-700">{imageCount} visual{imageCount !== 1 ? 's' : ''} embedded</span>
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
                {downloadingPdf ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                {downloadingPdf ? 'Preparing…' : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={handleAddVisuals}
                disabled={addingVisuals}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {addingVisuals ? <Loader2 size={11} className="animate-spin" /> : <ImagePlus size={11} />}
                {imageCount > 0 ? 'Refresh visuals' : 'Add visuals'}
              </button>
            </div>
          </div>

          <MarkdownRenderer content={recording.notes} className="prose-slate" imageMap={notesImageMap} />
        </div>
      );
    }

    if (['pending', 'processing'].includes(recording.notes_status)) {
      return (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <h3 className="mt-4 text-lg font-bold text-slate-900">AI notes are being prepared</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">The system is still generating structured notes for this lecture.</p>
        </div>
      );
    }

    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
        <Sparkles className="h-10 w-10 text-slate-300" />
        <h3 className="mt-4 text-lg font-bold text-slate-900">Notes not ready yet</h3>
        {hasNotesGen ? (
          <>
            <p className="mt-1 max-w-md text-sm text-slate-500">Generate AI notes once the transcript is ready.</p>
            <button
              type="button"
              onClick={handleRegenerateNotes}
              disabled={regeneratingNotes || recording.transcript_status !== 'done'}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
            >
              {regeneratingNotes ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {recording.notes_status === 'failed' ? 'Retry notes generation' : 'Generate AI notes'}
            </button>
          </>
        ) : (
          <p className="mt-1 max-w-md text-sm text-slate-500">AI notes generation is disabled for this institution.</p>
        )}
      </div>
    );
  };

  const renderTranscriptTab = () => {
    if (recording.transcript) {
      const cleanedTranscript = recording.transcript
        .replace(/(?:\r?\n|^)\s*\d+[\.:)]\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return (
        <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          <p className="whitespace-pre-wrap leading-relaxed">{cleanedTranscript}</p>
        </div>
      );
    }

    if (['pending', 'processing'].includes(recording.transcript_status)) {
      return (
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <h3 className="mt-4 text-lg font-bold text-slate-900">Transcript is being generated</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">Speech-to-text is still running. Please check back shortly.</p>
        </div>
      );
    }

    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
        <FileText className="h-10 w-10 text-slate-300" />
        <h3 className="mt-4 text-lg font-bold text-slate-900">
          {recording.transcript_status === 'failed' ? 'Transcription failed' : 'Transcript not available'}
        </h3>
        <button
          type="button"
          onClick={handleRetranscribe}
          disabled={retranscribing}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
        >
          {retranscribing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {recording.transcript_status === 'failed' ? 'Retry transcription' : 'Generate transcript'}
        </button>
      </div>
    );
  };

  const renderQuizTab = () => {
    const quiz = Array.isArray(recording.quiz) ? recording.quiz : [];

    if (recording.quiz_status !== 'done' || quiz.length === 0) {
      if (recording.quiz_status === 'processing' || recording.quiz_status === 'pending') {
        return <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600"><Loader2 size={15} className="animate-spin" /> Generating in-video quiz…</p>;
      }
      if (recording.transcript_status === 'done' || recording.notes_status === 'done') {
        return (
          <div className="text-center">
            {recording.quiz_status === 'failed' && <p className="mb-3 text-sm text-rose-500">Quiz generation failed. Try again.</p>}
            {hasQuizGen ? (
              <>
                <Button icon={<Sparkles size={16} />} onClick={handleGenerateQuiz} loading={generatingQuiz}>
                  {recording.quiz_status === 'failed' ? 'Retry quiz generation' : 'Generate in-video quiz'}
                </Button>
                <p className="mt-2 text-xs text-slate-400">Creates MCQ checkpoints from the lecture content that pop up at points during the video.</p>
              </>
            ) : (
              <p className="text-xs text-slate-400">AI Quiz Generator is disabled for this institution.</p>
            )}
          </div>
        );
      }
      return <p className="text-sm text-slate-500">A quiz is generated from the lecture content — it'll be available once the transcript or notes are ready.</p>;
    }

    const analytics = quizAnalytics ?? { students: [], questionStats: [], totalWatchers: 0 };
    const scoredStudents = analytics.students.filter((s) => s.quizScore !== null);
    const quizAvg = scoredStudents.length > 0
      ? `${Math.round(scoredStudents.reduce((a, s) => a + (s.quizScore ?? 0), 0) / scoredStudents.length)}%`
      : '—';

    return (
      <div className="flex flex-col space-y-4">
        {quizAnalyticsError && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            {quizAnalyticsError}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 rounded-2xl border-b border-slate-100 bg-slate-50/50 p-4">
          {[
            { label: 'Questions', value: quiz.length, icon: ListChecks, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Attempted By', value: quizAnalyticsError ? '—' : (analytics.students.filter((s) => s.answeredCount > 0).length ?? 0), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Avg Accuracy', value: quizAnalyticsError ? '—' : quizAvg, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <div className={cn('mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg', m.bg)}>
                <m.icon className={cn('h-4.5 w-4.5', m.color)} />
              </div>
              <p className="text-base font-bold text-slate-800">{m.value}</p>
              <p className="text-[10px] font-semibold text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="flex border-b border-slate-100">
          {['questions', 'students'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setQuizSubTab(k)}
              className={cn(
                '-mb-px px-4 py-2.5 text-xs font-bold capitalize transition-colors border-b-2',
                quizSubTab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600',
              )}
            >
              {k === 'questions' ? `Questions (${quiz.length})` : `Student Results (${analytics.students.length ?? 0})`}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 pt-2">
          {quizAnalyticsLoading && (
            <p className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Loading student results...
            </p>
          )}

          {quizSubTab === 'questions' && quiz.map((cp, i) => {
            const qKey = cp.id || `q-${i}`;
            const qStat = analytics.questionStats.find((q) => q.questionId === qKey);
            const isExpanded = expandedQuestion === qKey;
            const totalAnswered = qStat?.totalAttempts ?? 0;

            const optionCounts = {};
            (cp.options || []).forEach((o) => { optionCounts[o.label] = 0; });
            analytics.students.forEach((s) => {
              const r = s.responses.find((resp) => resp.questionId === qKey);
              if (r) optionCounts[r.selectedOption] = (optionCounts[r.selectedOption] ?? 0) + 1;
            });

            return (
              <div key={qKey} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : qKey)}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="mt-0.5 shrink-0 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-600">Q{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-bold text-slate-400">{cp.segmentTitle} · at {cp.triggerAtPercent}% of video</p>
                    <div className="text-sm font-bold leading-5 text-slate-800">
                      <MarkdownRenderer content={cp.questionText} className="prose-p:my-0 text-slate-800 font-bold" />
                    </div>
                    {qStat && (
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn('h-full rounded-full transition-all', (qStat.accuracy ?? 0) >= 60 ? 'bg-emerald-500' : (qStat.accuracy ?? 0) >= 40 ? 'bg-amber-500' : 'bg-rose-500')}
                            style={{ width: `${qStat.accuracy ?? 0}%` }}
                          />
                        </div>
                        <span className={cn('shrink-0 text-[10px] font-black', (qStat.accuracy ?? 0) >= 60 ? 'text-emerald-600' : (qStat.accuracy ?? 0) >= 40 ? 'text-amber-600' : 'text-rose-600')}>
                          {qStat.accuracy !== null ? `${qStat.accuracy}% correct` : 'No attempts'}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold text-slate-400">{totalAnswered} attempts</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className={cn('mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform', isExpanded && 'rotate-90')} />
                </button>

                {isExpanded && (
                  <div className="space-y-2.5 border-t border-slate-100 bg-slate-50/50 p-4">
                    <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-slate-400">Option Breakdown</p>
                    {(cp.options || []).map((opt) => {
                      const count = optionCounts[opt.label] ?? 0;
                      const pct = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
                      const isCorrect = opt.label === cp.correctOption;
                      return (
                        <div key={opt.label} className={cn('rounded-xl border p-3', isCorrect ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-100 bg-white text-slate-700')}>
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black', isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')}>{opt.label}</span>
                            <div className={cn('flex-1 pointer-events-none text-xs', isCorrect ? 'font-bold text-emerald-800' : 'text-slate-700')}>
                              <MarkdownRenderer content={opt.text} className={cn('prose-p:my-0 font-semibold', isCorrect ? 'text-emerald-800' : 'text-slate-700')} />
                            </div>
                            {isCorrect && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                            <span className="shrink-0 text-xs font-bold text-slate-800">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className={cn('h-full rounded-full transition-all', isCorrect ? 'bg-emerald-500' : 'bg-slate-300')} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {cp.explanation && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <div className="text-xs font-medium leading-relaxed text-amber-800">
                          <MarkdownRenderer content={cp.explanation} className="prose-p:my-0 text-amber-800 font-semibold" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {quizSubTab === 'students' && (
            analytics.students.filter((s) => s.answeredCount > 0).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Users className="mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm font-bold">No students have attempted the quiz yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.students
                  .filter((s) => s.answeredCount > 0)
                  .sort((a, b) => (b.quizScore ?? 0) - (a.quizScore ?? 0))
                  .map((s) => (
                    <div key={s.studentId} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600">
                          {s.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">{s.studentName}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">{s.correctCount}/{s.answeredCount} correct</span>
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs font-semibold text-slate-400">watched {Math.round(s.watchPercentage)}%</span>
                          </div>
                        </div>
                        <div className={cn(
                          'shrink-0 rounded-full px-2.5 py-1 text-xs font-black',
                          s.quizScore === null ? 'bg-slate-100 text-slate-500' :
                            s.quizScore >= 70 ? 'bg-emerald-50 text-emerald-700' :
                              s.quizScore >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700',
                        )}>
                          {s.quizScore !== null ? `${s.quizScore}%` : '—'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2">
                        {quiz.map((cp, qi) => {
                          const qKey = cp.id || `q-${qi}`;
                          const resp = s.responses.find((r) => r.questionId === qKey);
                          return (
                            <div
                              key={qKey}
                              title={resp ? `Q${qi + 1}: chose ${resp.selectedOption}${resp.isCorrect ? ' ✓' : ` (correct: ${cp.correctOption})`}` : `Q${qi + 1}: not answered`}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold cursor-default',
                                !resp ? 'bg-slate-100 text-slate-400' : resp.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                              )}
                            >
                              <span>Q{qi + 1}</span>
                              {resp ? (resp.isCorrect ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />) : <span className="text-[9px]">?</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => {
    const totalWatches = recording.total_watchers ?? recording.views ?? 0;

    return (
      <div className="space-y-4">
        <StatTile label="Total watches" value={totalWatches} icon={Users} />

        <div className="space-y-3">
          <StatMeter label="Completion rate" value={recording.completion_rate} icon={CheckCircle} />
          <StatMeter label="Avg watch %" value={recording.avg_watch_percentage} icon={TrendingUp} />
        </div>

        {recording.description && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Description</p>
            <p className="text-sm leading-relaxed text-slate-700">{recording.description}</p>
          </div>
        )}

        {(recording.resolution || recording.video_size || recording.source) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold text-slate-400">Format</p>
              <p className="text-sm font-black text-slate-900">{recording.source === 'youtube' ? 'YouTube' : 'Recorded'}</p>
            </div>
            {recording.resolution && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-400">Resolution</p>
                <p className="text-sm font-black text-slate-900">{recording.resolution}</p>
              </div>
            )}
            {recording.video_size && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-400">File Size</p>
                <p className="text-sm font-black text-slate-900">
                  {recording.video_size > 1024 * 1024 * 1024
                    ? `${(recording.video_size / (1024 * 1024 * 1024)).toFixed(1)} GB`
                    : `${Math.round(recording.video_size / (1024 * 1024))} MB`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDoubtsTab = () => {
    const pendingDoubts = sortByNewest(recDoubts.filter((d) => ['escalated', 'open', 'ai_answered'].includes(d.status)));
    // Most recently *answered* first — resolvedAt is set when the teacher replies.
    const answeredDoubts = sortByNewest(recDoubts.filter((d) => d.status === 'teacher_answered'), 'resolvedAt');
    const allDoubts = sortByActivity(recDoubts);
    const shownDoubts = recDoubtTab === 'pending' ? pendingDoubts : recDoubtTab === 'answered' ? answeredDoubts : allDoubts;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessagesSquare size={15} className="text-blue-600" />
            <h4 className="text-[13px] font-black text-slate-800">Student Doubts</h4>
            {recording.subject_name && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">{recording.subject_name}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchRecordingDoubts(true)}
            disabled={recDoubtsLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={11} className={recDoubtsLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-center">
            <p className="text-base font-black text-amber-900">{pendingDoubts.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-center">
            <p className="text-base font-black text-emerald-900">{answeredDoubts.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Answered</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-2.5 text-center">
            <p className="text-base font-black text-slate-900">{recDoubts.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total</p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {['pending', 'answered', 'all'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setRecDoubtTab(t)}
              className={cn(
                'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-black transition',
                recDoubtTab === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {t === 'pending' ? `Pending (${pendingDoubts.length})` : t === 'answered' ? `Answered (${answeredDoubts.length})` : `All (${recDoubts.length})`}
            </button>
          ))}
        </div>

        {doubtError && (
          <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{doubtError}</p>
        )}

        {recDoubtsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          </div>
        ) : shownDoubts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
            <HelpCircle className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">
              {recDoubtTab === 'pending' ? 'No pending doubts' : recDoubtTab === 'answered' ? 'No answered doubts yet' : 'No doubts yet'}
            </p>
            <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-400">
              {recDoubtTab === 'pending' && answeredDoubts.length > 0
                ? 'All caught up! Check the Answered tab.'
                : 'When students ask doubts about this subject, they appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shownDoubts.map((doubt) => {
              const meta = DOUBT_STATUS_META[doubt.status] || DOUBT_STATUS_META.open;
              const isPending = ['escalated', 'open', 'ai_answered'].includes(doubt.status);
              const isReplying = doubtReplyingId === doubt.id;
              return (
                <article key={doubt.id} className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest', meta.tone)}>
                      {meta.label}
                    </span>
                    <time className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {doubt.createdAt ? new Date(doubt.createdAt).toLocaleString() : ''}
                    </time>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-600">
                      {(doubt.studentName || 'S').charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[110px] truncate">{doubt.studentName || 'Student'}</span>
                    {(doubt.className || doubt.sectionName) && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">
                        {[doubt.className, doubt.sectionName && `Sec ${doubt.sectionName}`].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>

                  {doubt.questionText && (
                    <p className="break-words text-xs font-semibold leading-relaxed text-slate-800">{doubt.questionText}</p>
                  )}

                  {doubt.aiExplanation && (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-2.5">
                      <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600">
                        <Sparkles size={10} /> AI response
                      </p>
                      <p className="mt-1 line-clamp-3 text-[11px] font-medium leading-relaxed text-slate-600">{parseAiDoubtAnswer(doubt.aiExplanation)}</p>
                    </div>
                  )}

                  {doubt.teacherResponse && (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Your answer</p>
                      <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-700">{doubt.teacherResponse}</p>
                    </div>
                  )}

                  {isPending && isReplying ? (
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        disabled={doubtAiSuggesting || doubtSubmitting}
                        onClick={() => aiSuggestDoubtReply(doubt.id)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        {doubtAiSuggesting ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                        Draft with AI (edit before sending)
                      </button>
                      <textarea
                        value={doubtReplyText}
                        onChange={(e) => setDoubtReplyText(e.target.value)}
                        rows={4}
                        placeholder="Write your answer for the student..."
                        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-400"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={doubtSubmitting || doubtReplyText.trim().length < 5}
                          onClick={() => submitDoubtReply(doubt.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {doubtSubmitting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                          Send
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDoubtReplyingId(null); setDoubtReplyText(''); }}
                          className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : isPending ? (
                    <button
                      type="button"
                      onClick={() => { setDoubtReplyingId(doubt.id); setDoubtReplyText(''); }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-blue-700"
                    >
                      <MessageCircle size={11} /> Reply to student
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStudyPanel = () => {
    if (detailTab === 'notes') return renderNotesTab();
    if (detailTab === 'transcript') return renderTranscriptTab();
    if (detailTab === 'quiz') return renderQuizTab();
    if (detailTab === 'overview') return renderOverviewTab();
    if (detailTab === 'doubts') return renderDoubtsTab();
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
        <Link to="/school/teacher/classes" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600">
          <ArrowLeft size={16} />
          Back to Recorded Classes
        </Link>
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Lecture not found</h2>
          <p className="mt-1 text-sm text-slate-500">This recorded lecture is not available right now or may have been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 -mb-3 min-h-[calc(100vh-76px)] bg-slate-50 sm:-mx-5 sm:-mb-5 lg:-mx-6 lg:-mb-6 lg:flex lg:h-[calc(100vh-76px)] lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <div className="border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6 lg:shrink-0">
        <div className="flex w-full items-center gap-3">
          <Link
            to="/school/teacher/classes"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-600 hover:text-white"
            aria-label="Back to recorded classes"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-blue-600">{recording.chapter_name || recording.subject_name || 'Recorded Class'}</p>
            <h1 className="truncate text-sm font-black leading-tight text-slate-900">{recording.title}</h1>
          </div>
          <button
            type="button"
            onClick={fetchRecordings}
            className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:flex"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      <div className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:min-h-0 lg:flex-1">
        <div className="grid gap-6 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(0,1fr)]">
          <main className="min-w-0 space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pb-5 scrollbar-hide">
            {renderVideoPlayer()}

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {recording.subject_name && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">{recording.subject_name}</span>
                )}
                {recording.class_name && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{recording.class_name}</span>
                )}
              </div>
              <h2 className="mt-3 text-xl font-black text-slate-950">{recording.title}</h2>
              {recording.description && <p className="mt-2 text-sm leading-6 text-slate-500">{recording.description}</p>}

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <CalendarDays size={13} />
                  {dateLabel(recording.recorded_date)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <Clock3 size={13} />
                  {recording.duration
                    ? (parseFloat(recording.duration) >= 1 ? `${Math.round(parseFloat(recording.duration))} mins` : `${Math.round(parseFloat(recording.duration) * 60)}s`)
                    : 'Duration pending'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <Tag size={13} />
                  {recording.topic_name || recording.chapter_name || 'General topic'}
                </span>
              </div>
            </section>
          </main>

          <aside className="min-w-0 lg:h-full lg:min-h-0">
            <section className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-140px)]">
              <div className="w-full min-w-0 shrink-0 overflow-hidden">
                <CourseTabs activeTab={detailTab} onChange={setDetailTab} availableTabs={availableTabs} />
              </div>
              <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">{renderStudyPanel()}</div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
