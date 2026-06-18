import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SchoolVideoPlayer } from '@/components/school/SchoolVideoPlayer';
import { SchoolAskDoubtPanel } from '@/components/school/SchoolAskDoubtPanel';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
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
} from 'lucide-react';

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

export default function RecordedClassDetails() {
  const { recordingId } = useParams();
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'INSTITUTE_ADMIN' || user?.role === 'SUPER_ADMIN';
  const [searchParams] = useSearchParams();
  const playParam = searchParams.get('play');
  const shouldAutoPlay = playParam === '1';

  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('notes');
  const [playback, setPlayback] = useState({ src: '', source: '', loading: false, error: '' });
  const [addingVisuals, setAddingVisuals] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [savedResponses, setSavedResponses] = useState([]);
  const [resumeAt, setResumeAt] = useState(0);
  const [expandedQuizIds, setExpandedQuizIds] = useState({});
  const lastSaveTimeRef = useRef(0);

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

  const recording = useMemo(
    () => recordings.find((item) => item.id === recordingId) ?? null,
    [recordings, recordingId],
  );

  useEffect(() => {
    if (!recording) return;
    setDetailTab(recording.notes ? 'notes' : 'transcript');

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
    fetchProgress();
  }, [recording]);

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

  const renderRecordingStatus = (item) => {
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

            <MarkdownRenderer content={recording.notes} className="prose-slate" />
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
                        <p className="text-sm font-bold text-slate-800 leading-snug">{cp.questionText}</p>
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
                      <p className="text-sm font-bold text-slate-800 leading-snug">{cp.questionText}</p>
                      
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
                                  <span className="flex-1 font-medium">{opt.text}</span>
                                </div>
                              );
                            })}
                          </div>

                          {cp.explanation && (
                            <div className="p-3 bg-white/60 rounded-xl border border-slate-200/60 text-xs text-slate-500 leading-relaxed">
                              <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Explanation
                              </p>
                              {cp.explanation}
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
    <div className="-m-3 min-h-screen bg-slate-50 sm:-m-5 lg:-m-6">
      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
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
        </div>
      </div>

      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <main className="min-w-0 space-y-4">
            {renderVideoPlayer()}

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
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
                  <h2 className="mt-3 text-xl font-black text-slate-950">{recording.title}</h2>
                  {recording.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">{recording.description}</p>
                  )}
                </div>

                {recording.video_url && (
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                    <PlayCircle size={15} />
                    Watch Video
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <CalendarDays size={13} />
                  {dateLabel(recording.recorded_date)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <Clock3 size={13} />
                  {recording.duration ? `${recording.duration} mins` : 'Duration pending'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <Tag size={13} />
                  {recording.topic_name || recording.chapter_name || 'General topic'}
                </span>
              </div>
            </section>
          </main>

          <aside className="min-w-0 xl:sticky xl:top-20 xl:self-start">
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailTab('notes')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'notes'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <BookOpen size={13} />
                  AI Notes
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('transcript')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'transcript'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <FileText size={13} />
                  Transcript
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('quiz')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'quiz'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Sparkles size={13} />
                  Quiz
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('doubt')}
                  className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2.5 py-3 text-[11px] font-black transition ${
                    detailTab === 'doubt'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <MessageCircle size={13} />
                  Doubt
                </button>
              </div>
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-5">{renderStudyPanel()}</div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
