import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useParams } from 'react-router-dom';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
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

export default function RecordedClassDetails() {
  const { recordingId } = useParams();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('notes');

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
                  <a
                    href={recording.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Watch Video
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[420px] px-6 py-6">
          {detailTab === 'notes' ? (
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
