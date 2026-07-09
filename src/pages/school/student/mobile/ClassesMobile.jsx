import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Radio,
  Video,
  ChevronRight,
  Clock3,
  CalendarDays,
  PlayCircle,
  Sparkles,
  FileText,
  Loader2,
} from 'lucide-react';

export default function ClassesMobile({
  isLiveView,
  isRecordedView,
  loading,
  liveClasses,
  obsLive,
  recordings,
  liveRecordings,
  recordingsSummary,
  LiveRecordingCard,
}) {
  const [activeTab, setActiveTab] = useState(isLiveView ? 'live' : 'recorded');

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Toggle Switch */}
      <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-800/80">
        <button
          onClick={() => setActiveTab('live')}
          className={`rounded-lg py-2.5 text-xs font-black text-center transition-all ${
            activeTab === 'live'
              ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Live Classes
        </button>
        <button
          onClick={() => setActiveTab('recorded')}
          className={`rounded-lg py-2.5 text-xs font-black text-center transition-all ${
            activeTab === 'recorded'
              ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Recorded Classes
        </button>
      </div>

      {activeTab === 'live' ? (
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Scheduled Live Classes</h2>
          {liveClasses.length === 0 && obsLive.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <Radio className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No live classes scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveClasses.map((cls, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                        <Radio size={10} /> Live Class
                      </span>
                      <h3 className="mt-2 text-base font-black text-slate-800 dark:text-white">
                        {cls.subject || 'Live Class'}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {cls.teacher || 'Teacher not assigned'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800/40">
                      <CalendarDays size={11} />
                      {cls.day}
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800/40">
                      <Clock3 size={11} />
                      {cls.startTime} - {cls.endTime}
                    </span>
                  </div>

                  <div className="mt-4">
                    {cls.meetingLink ? (
                      <a
                        href={cls.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 transitionactive:scale-95"
                      >
                        <Radio size={13} />
                        Join Class
                      </a>
                    ) : (
                      <span className="w-full inline-flex items-center justify-center rounded-xl bg-slate-50 py-2.5 text-center text-xs font-bold text-slate-400 dark:bg-slate-800/50">
                        Join link pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Live Class Recordings */}
          {liveRecordings.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Past Recordings</h3>
              <div className="space-y-3">
                {liveRecordings.map((rec) => (
                  <LiveRecordingCard key={rec.id} rec={rec} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recordings Summary Cards (stacked vertical) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 col-span-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Recorded Lectures</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{recordingsSummary.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <Sparkles className="h-4 w-4 text-emerald-500 mb-1" />
              <p className="text-[9px] font-bold text-slate-400">AI Notes Ready</p>
              <p className="text-base font-black text-slate-800 dark:text-white">{recordingsSummary.notesReady}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <FileText className="h-4 w-4 text-violet-500 mb-1" />
              <p className="text-[9px] font-bold text-slate-400">Transcripts Ready</p>
              <p className="text-base font-black text-slate-800 dark:text-white">{recordingsSummary.transcriptReady}</p>
            </div>
          </div>

          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Recorded Library</h2>
          {recordings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <Video className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No recorded classes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => {
                const hasNotes = !!recording.notes;
                const hasTranscript = !!recording.transcript;
                const canWatch = !!recording.video_url;

                return (
                  <div
                    key={recording.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex gap-3">
                      <Link
                        to={`/school/student/recorded-classes/${recording.id}?play=1`}
                        className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center"
                      >
                        {recording.thumbnail_url ? (
                          <img
                            src={recording.thumbnail_url}
                            alt={recording.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <PlayCircle className="h-8 w-8 text-white/70" />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-2 text-sm font-black text-slate-800 dark:text-white leading-tight">
                          {recording.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                          {recording.endedAt ? new Date(recording.endedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <Link
                        to={`/school/student/recorded-classes/${recording.id}?play=1`}
                        className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white shadow-md shadow-blue-500/10 transition active:scale-95"
                      >
                        Watch Class
                      </Link>
                      {hasNotes && (
                        <Link
                          to={`/school/student/recorded-classes/${recording.id}?tab=notes`}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                          title="AI Notes"
                        >
                          <Sparkles size={14} />
                        </Link>
                      )}
                      {hasTranscript && (
                        <Link
                          to={`/school/student/recorded-classes/${recording.id}?tab=transcript`}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                          title="Transcript"
                        >
                          <FileText size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
