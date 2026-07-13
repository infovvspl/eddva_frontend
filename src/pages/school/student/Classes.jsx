import React, { useEffect, useMemo, useState } from 'react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { schoolLive } from '@/lib/api/school-live';
import {
  BookOpen,
  Radio,
  Video,
  ChevronRight,
  CheckCircle2,
  Hand,
  BarChart3,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  Loader2,
  PlayCircle,
  Sparkles,
  X,
  MonitorPlay,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

function LiveRecordingCard({ rec }) {
  const isProcessing = rec.status !== 'PROCESSED';
  const [imgError, setImgError] = useState(false);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className={`flex gap-3 overflow-hidden rounded-2xl border bg-white p-3 sm:p-4 shadow-sm dark:bg-slate-900 ${isProcessing ? 'border-amber-100 dark:border-amber-900/30' : 'border-rose-100 dark:border-rose-900/30'}`}>
      <div className="relative flex h-20 w-28 sm:h-24 sm:w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-rose-900 to-red-900">
        {rec.thumbnailKey && !isProcessing && !imgError ? (
          <img 
            src={rec.thumbnailKey} 
            alt={rec.title} 
            className="h-full w-full object-cover" 
            loading="lazy" 
            onError={() => setImgError(true)} 
          />
        ) : isProcessing ? (
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-amber-400" />
        ) : (
          <MonitorPlay className="h-6 w-6 sm:h-8 sm:w-8 text-white/60" />
        )}
        {rec.durationSeconds && !isProcessing && (
          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white">
            {formatDuration(rec.durationSeconds)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {isProcessing ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <Loader2 size={8} className="animate-spin" /> Processing…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              <Radio size={8} /> Live Recording
            </span>
          )}
          {rec.subjectName && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {rec.subjectName}
            </span>
          )}
        </div>
        <h4 className="mt-1.5 line-clamp-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white">{rec.title}</h4>
        <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-slate-500">
          {rec.endedAt ? new Date(rec.endedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          {rec.className ? ` · ${rec.className}` : ''}
        </p>
        {isProcessing ? (
          <p className="mt-2 text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400">
            Recording is being saved — usually ready in 5–15 min
          </p>
        ) : (
          <Link
            to={`/school/student/live-classes/${rec.classRecordingId}/recording`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            <PlayCircle size={12} />
            Watch Recording
          </Link>
        )}
      </div>
    </div>
  );
}

function RecordedClassCard({ recording, renderRecordingStatus }) {
  const isMobile = useIsMobile();
  const [imgError, setImgError] = useState(false);
  const hasNotes = !!recording.notes;
  const hasTranscript = !!recording.transcript;
  const canWatch = !!recording.video_url;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:rounded-[1.75rem] sm:p-4"
    >
      <div className="flex flex-col gap-3.5 sm:flex-row sm:gap-4">
        <Link
          to={`/school/student/recorded-classes/${recording.id}?play=1`}
          className="group/thumb relative flex aspect-video w-full sm:h-28 sm:w-36 sm:aspect-auto sm:shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900"
          aria-label={`Watch ${recording.title}`}
        >
          {recording.thumbnail_url && !imgError ? (
            <img
              src={recording.thumbnail_url}
              alt={recording.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <PlayCircle className="h-10 w-10 text-white/70" />
          )}
          {/* Play icon overlay on hover */}
          <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition-all group-hover/thumb:bg-slate-950/35 group-hover/thumb:opacity-100">
            <PlayCircle className="h-9 w-9 text-white drop-shadow-lg" />
          </span>
          {/* Duration badge */}
          {recording.duration && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {parseFloat(recording.duration) >= 1 ? `${Math.round(parseFloat(recording.duration))} min` : `${Math.round(parseFloat(recording.duration) * 60)}s`}
            </span>
          )}
          {/* Subject badge on thumbnail for mobile only */}
          {recording.subject_name && isMobile && (
            <span className="absolute left-1.5 top-1.5 rounded bg-blue-600/85 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
              {recording.subject_name}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1 flex flex-col">
          {/* Subject badge (desktop only) */}
          {!isMobile && recording.subject_name && (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-50 dark:bg-slate-850 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
                {recording.subject_name}
              </span>
            </div>
          )}

          <h3 className="mt-1 text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug sm:mt-3">
            {recording.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">
            {recording.chapter_name || 'General chapter'}
            {recording.topic_name ? ` · ${recording.topic_name}` : ''}
          </p>

          {/* Status and metadata details pills */}
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-500 sm:mt-3 sm:text-[11px] sm:gap-2">
            {renderRecordingStatus(recording)}
            
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800 px-2 py-0.5 sm:rounded-full sm:px-2.5 sm:py-1">
              <CalendarDays size={11} />
              {recording.recorded_date ? new Date(recording.recorded_date).toLocaleDateString('en-GB') : 'No date'}
            </span>

            {hasNotes && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 sm:rounded-full sm:px-2.5 sm:py-1">
                <Sparkles size={11} />
                Notes
              </span>
            )}
            
            {!hasNotes && hasTranscript && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-violet-750 dark:bg-violet-950/20 dark:text-violet-400 sm:rounded-full sm:px-2.5 sm:py-1">
                <Download size={11} />
                Transcript
              </span>
            )}
          </div>

          <div className="mt-3.5 sm:mt-4">
            <Link
              to={`/school/student/recorded-classes/${recording.id}${canWatch ? '?play=1' : ''}`}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white transition hover:bg-blue-700"
            >
              {canWatch ? <PlayCircle size={14} /> : <FileText size={14} />}
              {canWatch ? 'Watch Video' : 'Open Details'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Classes() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [obsLive, setObsLive] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [liveRecordings, setLiveRecordings] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [recordingsLoading, setRecordingsLoading] = useState(false);

  const isLiveView = location.pathname.endsWith('/live-classes');
  const isRecordedView = location.pathname.endsWith('/recorded-classes');

  const loading = isRecordedView ? recordingsLoading : isLiveView ? liveLoading : coursesLoading;

  useEffect(() => {
    if (isLiveView || isRecordedView) {
      setCoursesLoading(false);
      return;
    }

    const fetchCourses = async () => {
      try {
        const response = await api.get('/students/courses/my');
        setCourses(unwrapSchoolList(response));
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [isLiveView, isRecordedView]);

  useEffect(() => {
    if (!isLiveView) return;

    const fetchLiveClasses = async () => {
      try {
        setLiveLoading(true);
        const [timetableRes, liveRecsRes] = await Promise.allSettled([
          api.get('/timetables/student/me'),
          schoolLive.listRecordings(),
        ]);
        
        if (timetableRes.status === 'fulfilled') {
          const response = timetableRes.value;
          const timetable = response.data?.timetable || response.data?.data?.timetable || [];
          setLiveClasses(timetable.filter((item) => String(item.type || '').toLowerCase() === 'live'));
        } else {
          setLiveClasses([]);
        }

        if (liveRecsRes.status === 'fulfilled') {
          setLiveRecordings(Array.isArray(liveRecsRes.value) ? liveRecsRes.value : []);
        } else {
          setLiveRecordings([]);
        }
      } catch (error) {
        console.error('Failed to fetch live classes:', error);
        setLiveClasses([]);
        setLiveRecordings([]);
      } finally {
        setLiveLoading(false);
      }
    };

    fetchLiveClasses();
  }, [isLiveView]);

  // Self-hosted (OBS/RTMP) broadcasts — LIVE + SCHEDULED — polled every 15s.
  useEffect(() => {
    if (!isLiveView) return;
    let active = true;
    const load = async () => {
      try {
        const lectures = await schoolLive.listLectures();
        if (active) {
          setObsLive(
            Array.isArray(lectures)
              ? lectures.filter((l) => l.status === 'LIVE' || l.status === 'SCHEDULED')
              : []
          );
        }
      } catch (err) {
        console.error('Failed to fetch live broadcasts:', err);
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => { active = false; clearInterval(id); };
  }, [isLiveView]);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setRecordingsLoading(true);
        const response = await api.get('/classes/recordings');
        setRecordings(unwrapSchoolList(response).filter((item) => item.source !== 'live_stream'));
      } catch (error) {
        console.error('Failed to fetch recorded classes:', error);
      } finally {
        setRecordingsLoading(false);
      }
    };

    fetchRecordings();
  }, []);

  const recordingsSummary = useMemo(() => {
    const total = recordings.length;
    const transcriptReady = recordings.filter((item) => item.transcript_status === 'done').length;
    const notesReady = recordings.filter((item) => item.notes_status === 'done' && item.notes).length;
    const processing = recordings.filter((item) =>
      ['pending', 'processing'].includes(item.transcript_status) ||
      ['pending', 'processing'].includes(item.notes_status)
    ).length;
    return { total, transcriptReady, notesReady, processing };
  }, [recordings]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const title = isLiveView ? 'Live Classes' : isRecordedView ? 'Recorded Classes' : 'My Learning';
  const subtitle = isLiveView
    ? 'Join live sessions, track auto attendance, raise your hand, and participate in polls.'
    : isRecordedView
      ? 'Watch teacher-uploaded recorded lectures, open transcript, and study from generated notes.'
      : 'Explore classes, chapters, topics, notes, assignments, tests, and teacher resources.';

  const renderRecordingStatus = (recording) => {
    if (recording.notes_status === 'done' && recording.notes) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <Sparkles size={13} />
          AI notes ready
        </span>
      );
    }

    if (recording.transcript_status === 'done') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          <Download size={13} />
          Transcript ready
        </span>
      );
    }

    if (recording.notes_status === 'failed' || recording.transcript_status === 'failed') {
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

  const obsLiveLectures = obsLive.filter((l) => l.status === 'LIVE');
  const obsScheduledLectures = obsLive.filter((l) => l.status === 'SCHEDULED');

  const liveClassesView = (
    <div className="space-y-5">
      {/* Live Now — OBS broadcasts currently streaming */}
      {obsLiveLectures.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-rose-600">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            Live Now
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {obsLiveLectures.map((lec) => (
              <div key={lec.id} className="overflow-hidden rounded-2xl sm:rounded-[1.5rem] border border-rose-200 bg-white shadow-sm dark:border-rose-900/40 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 sm:px-5 sm:py-3 text-white">
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]"><Radio size={12} /> Live</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold">streaming now</span>
                </div>
                <div className="p-4 sm:p-5">
                  <h4 className="truncate text-sm sm:text-lg font-black text-slate-900 dark:text-white">{lec.title}</h4>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-500">
                    {lec.startedAt ? `Started ${new Date(lec.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'In progress'}
                  </p>
                  <Link
                    to={`/school/student/live/${lec.id}/watch`}
                    className="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white transition hover:bg-rose-700"
                  >
                    <PlayCircle size={14} /> Join Live Class
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled — OBS broadcasts not yet started */}
      {obsScheduledLectures.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-blue-600">
            <CalendarDays size={14} />
            Upcoming Live Classes
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {obsScheduledLectures.map((lec) => (
              <div key={lec.id} className="overflow-hidden rounded-2xl sm:rounded-[1.5rem] border border-blue-200 bg-white shadow-sm dark:border-blue-900/40 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-2.5 sm:px-5 sm:py-3 text-white">
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]"><Video size={12} /> Scheduled</span>
                  {lec.scheduledFor && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold">
                      {new Date(lec.scheduledFor).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <h4 className="truncate text-sm sm:text-lg font-black text-slate-900 dark:text-white">{lec.title}</h4>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-500">
                    {lec.subjectName ? lec.subjectName : lec.className || 'Live class'}
                    {lec.sectionName ? ` · ${lec.sectionName}` : ''}
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-500 dark:bg-slate-800">
                    <Clock3 size={14} /> Starting soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {liveClasses.length === 0 && obsLive.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Radio className="mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">No live classes scheduled</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Live sessions assigned by your school will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {liveClasses.map((cls, index) => (
            <div
              key={`${cls.day}-${cls.startTime}-${cls.subject}-${index}`}
              className="rounded-2xl sm:rounded-[1.5rem] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
                    <Radio size={11} />
                    Live Class
                  </span>
                  <h3 className="mt-3 sm:mt-4 text-sm sm:text-xl font-black text-slate-900 dark:text-white">{cls.subject || 'Live session'}</h3>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-500">{cls.teacher || 'Teacher not assigned'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2 sm:p-3 text-blue-600 dark:bg-slate-800 shrink-0">
                  <Video size={18} />
                </div>
              </div>

              <div className="mt-4 sm:mt-5 flex flex-wrap gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                  <CalendarDays size={11} />
                  {cls.day || 'Scheduled day'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                  <Clock3 size={11} />
                  {cls.startTime || '00:00'} - {cls.endTime || '00:00'}
                </span>
              </div>

              <div className="mt-4 sm:mt-5">
                {cls.meetingLink ? (
                  <a
                    href={cls.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs sm:text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    <Radio size={13} />
                    Join Class
                  </a>
                ) : (
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:bg-slate-800">
                    Join link not added yet
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Live Class Recordings — auto-saved when a live session ends */}
      {liveRecordings.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-rose-700">
            <Radio size={14} />
            Past Live Class Recordings
          </h3>
          <div className="grid gap-4 xl:grid-cols-2">
            {liveRecordings.map((rec) => (
              <LiveRecordingCard key={rec.id} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const recordedClassesView = (
    <div className="space-y-6">
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 sm:p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Video className="h-4.5 w-4.5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          <p className="mt-2 sm:mt-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">Lectures</p>
          <p className="mt-0.5 sm:mt-2 text-xl sm:text-3xl font-black text-slate-900 dark:text-white">{recordingsSummary.total}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm font-medium text-slate-500 hidden sm:block">Recorded lessons available</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <Sparkles className="h-4.5 w-4.5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
          <p className="mt-2 sm:mt-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">AI Notes</p>
          <p className="mt-0.5 sm:mt-2 text-xl sm:text-3xl font-black text-slate-950 dark:text-white">{recordingsSummary.notesReady}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm font-medium text-slate-500 hidden sm:block">Ready to read and revise</p>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-3 sm:p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
          <FileText className="h-4.5 w-4.5 sm:h-6 sm:w-6 text-violet-600 dark:text-violet-400" />
          <p className="mt-2 sm:mt-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300">Transcript</p>
          <p className="mt-0.5 sm:mt-2 text-xl sm:text-3xl font-black text-slate-900 dark:text-white">{recordingsSummary.transcriptReady}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm font-medium text-slate-500 hidden sm:block">Lecture transcripts ready</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 sm:p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <Loader2 className="h-4.5 w-4.5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400 animate-spin" />
          <p className="mt-2 sm:mt-4 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">Processing</p>
          <p className="mt-0.5 sm:mt-2 text-xl sm:text-3xl font-black text-slate-900 dark:text-white">{recordingsSummary.processing}</p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm font-medium text-slate-500 hidden sm:block">AI is still preparing content</p>
        </div>
      </div>

      {recordings.length === 0 ? (
        <div className="rounded-2xl sm:rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center shadow-sm">
          <Video className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
          <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-bold text-slate-900">No recorded classes yet</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Once your teachers upload recorded lectures, transcript and notes will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {recordings.map((recording) => (
            <RecordedClassCard 
              key={recording.id} 
              recording={recording} 
              renderRecordingStatus={renderRecordingStatus} 
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {!isMobile && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">{subtitle}</p>
          </div>
        </div>
      )}

      {isRecordedView ? (
        recordedClassesView
      ) : isLiveView ? (
        liveClassesView
      ) : (
        <>
      <div className="grid gap-2.5 grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Radio className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <h2 className="mt-3 text-xs sm:text-sm font-black text-slate-950 dark:text-white">Live Session</h2>
          <p className="mt-1 text-[10px] sm:text-xs font-medium text-slate-500 hidden sm:block">Live sessions support auto attendance and classroom interaction.</p>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3 sm:p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
          <Hand className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
          <h2 className="mt-3 text-xs sm:text-sm font-black text-slate-950 dark:text-white">Raise Hand</h2>
          <p className="mt-1 text-[10px] sm:text-xs font-medium text-slate-500 hidden sm:block">Ask questions during class and participate in polls or quizzes.</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 sm:p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          <h2 className="mt-3 text-xs sm:text-sm font-black text-slate-950 dark:text-white">Progress</h2>
          <p className="mt-1 text-[10px] sm:text-xs font-medium text-slate-500 hidden sm:block">Recorded lessons can resume from your last watched point.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active classes</h3>
          <p className="mt-1 text-sm text-slate-500">You are not enrolled in any active classes yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.enrollmentId} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {course.batch?.thumbnailUrl ? (
                  <img src={course.batch.thumbnailUrl} alt={course.batch.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                    <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-white/50" />
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-900 backdrop-blur-md">
                  {course.batch?.examTarget || course.batch?.class || 'Course'}
                </div>
              </div>
              
              <div className="flex flex-1 flex-col p-4 sm:p-6">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {course.subjects?.slice(0, 3).map((sub, i) => (
                    <span key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {sub}
                    </span>
                  ))}
                  {(course.subjects?.length || 0) > 3 && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      +{course.subjects.length - 3}
                    </span>
                  )}
                </div>
                
                <h3 className="mb-1 text-sm sm:text-xl font-bold text-slate-900 dark:text-white line-clamp-2">
                  {course.batch?.name}
                </h3>
                
                <div className="mb-4 flex items-center gap-3 text-[10px] sm:text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1">
                    <Video size={12} />
                    <span>{course.progress?.watchedLectures || 0}/{course.progress?.totalLectures || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>{course.progress?.completedTopics || 0}/{course.progress?.totalTopics || 0}</span>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] sm:text-xs font-bold">
                    <span className="text-slate-500">Course Progress</span>
                    <span className="text-blue-600">{course.progress?.overallPct || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div 
                      className="h-full rounded-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${course.progress?.overallPct || 0}%` }}
                    />
                  </div>
                  
                  <Link
                    to={`/school/student/classes/${course.batch?.id}`}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2.5 text-xs sm:text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50 dark:bg-slate-800/50 dark:hover:bg-blue-900/20"
                  >
                    View Curriculum
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
