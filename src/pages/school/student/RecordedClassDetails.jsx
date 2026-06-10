import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useLocation, useParams } from 'react-router-dom';
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
  X,
} from 'lucide-react';

function isYouTubeUrl(url = '') {
  return /(?:youtube\.com\/|youtu\.be\/)/i.test(url);
}

function youTubeEmbed(url = '') {
  const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : url;
}

export default function RecordedClassDetails() {
  const { recordingId } = useParams();
  const location = useLocation();
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
    const shouldPlay = new URLSearchParams(location.search).get('play') === '1';
    setDetailTab(shouldPlay && recording.video_url ? 'video' : recording.notes ? 'notes' : 'transcript');
  }, [recording, location.search]);

  useEffect(() => {
    if (!recording || detailTab !== 'video') return;

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
  }, [detailTab, recording]);

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
    <div className="space-y-6">
      <Link
        to="/school/student/recorded-classes"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Recorded Classes
      </Link>

      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="relative flex h-56 w-full shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 xl:w-[26rem]">
              {recording.thumbnail_url ? (
                <img
                  src={recording.thumbnail_url}
                  alt={recording.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <PlayCircle className="h-16 w-16 text-white/70" />
              )}
            </div>

            <div className="flex-1">
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
                {renderRecordingStatus(recording)}
              </div>

              <h1 className="mt-4 text-3xl font-black text-slate-900">{recording.title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {recording.description || 'Study the lecture transcript, generated notes, and recording details from this dedicated class page.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
                  <CalendarDays size={13} />
                  {recording.recorded_date ? new Date(recording.recorded_date).toLocaleDateString('en-GB') : 'Date pending'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
                  <Clock3 size={13} />
                  {recording.duration ? `${recording.duration} mins` : 'Duration pending'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
                  <BookOpen size={13} />
                  {recording.chapter_name || 'General chapter'}
                  {recording.topic_name ? ` · ${recording.topic_name}` : ''}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setDetailTab('notes')}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    detailTab === 'notes'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  AI Notes
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('transcript')}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    detailTab === 'transcript'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Transcript
                </button>
                {recording.video_url && (
                  <button
                    type="button"
                    onClick={() => setDetailTab('video')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                      detailTab === 'video'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <PlayCircle size={15} />
                    Watch Video
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[420px] px-6 py-6">
          {detailTab === 'video' ? (
            recording.video_url ? (
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-950 shadow-sm">
                {playback.loading && !playback.src ? (
                  <div className="flex aspect-video w-full flex-col items-center justify-center text-center text-white">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p className="mt-3 text-sm font-bold">Preparing video...</p>
                  </div>
                ) : playback.error ? (
                  <div className="flex aspect-video w-full flex-col items-center justify-center px-6 text-center text-white">
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
                ) : playback.source === 'youtube' || isYouTubeUrl(playback.src) ? (
                  <iframe
                    src={youTubeEmbed(playback.src)}
                    title={recording.title}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative">
                    <video
                      src={playback.src}
                      controls
                      preload="metadata"
                      playsInline
                      autoPlay
                      onError={() =>
                        setPlayback((current) => ({
                          ...current,
                          error:
                            'The browser could not play this recording. It may be an unsupported format or codec.',
                        }))
                      }
                      className="aspect-video w-full bg-slate-950"
                    />
                    {playback.loading && (
                      <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Preparing secure link
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <PlayCircle className="h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">Video unavailable</h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  This recorded class does not have a playable video link yet.
                </p>
              </div>
            )
          ) : detailTab === 'notes' ? (
            recording.notes ? (
              <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:text-slate-700 prose-li:text-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {recording.notes}
                </ReactMarkdown>
              </div>
            ) : ['pending', 'processing'].includes(recording.notes_status) ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">AI notes are being prepared</h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Your teacher has uploaded this lecture and the system is still generating structured notes for students.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <Sparkles className="h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">Notes not ready yet</h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  This lecture does not have published AI notes yet. You can still open the transcript or watch the video.
                </p>
              </div>
            )
          ) : recording.transcript ? (
            <div className="rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              <p className="whitespace-pre-wrap">{recording.transcript}</p>
            </div>
          ) : ['pending', 'processing'].includes(recording.transcript_status) ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">Transcript is being generated</h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                The class recording is uploaded and speech-to-text is still running. Please check back shortly.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">Transcript not available</h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                This lecture does not have a transcript yet. If the teacher recorded it recently, the transcript may appear after processing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
