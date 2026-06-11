import React, { useEffect, useMemo, useState } from 'react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Link, useParams } from 'react-router-dom';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
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
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('notes');
  const [playback, setPlayback] = useState({ src: '', source: '', loading: false, error: '' });

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

  const renderRecordingStatus = (item) => {
    if (item.notes_status === 'done' && item.notes) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <Sparkles size={13} />
          AI notes ready
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
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        {playback.source === 'youtube' || isYouTubeUrl(playback.src) ? (
          <iframe
            src={youTubeEmbed(playback.src)}
            title={recording.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            src={playback.src}
            controls
            preload="metadata"
            playsInline
            autoPlay
            onError={() =>
              setPlayback((current) => ({
                ...current,
                error: 'The browser could not play this recording. It may be an unsupported format or codec.',
              }))
            }
            className="aspect-video w-full bg-slate-950"
          />
        )}
        {playback.loading && (
          <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white">
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
        return (
          <MarkdownRenderer content={recording.notes} className="prose-slate" />
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
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3">
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

      <div className="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
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
                  className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition ${
                    detailTab === 'notes'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <BookOpen size={14} />
                  AI Notes
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('transcript')}
                  className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition ${
                    detailTab === 'transcript'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <FileText size={14} />
                  Transcript
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
