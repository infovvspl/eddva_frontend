import React from 'react';
import { MobileListLayout } from '@/components/shared/mobile/MobileLayouts';
import { CalendarDays, Clock3, Video, MapPin, Sparkles } from 'lucide-react';

export default function TeacherMeetingsMobile({
  meetings,
  loading,
  onOpenCreate,
  onAccept,
  onReject,
  updatingId,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Meetings</h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Schedule & Manage Parent Meets</p>
        </div>
        <button
          onClick={onOpenCreate}
          className="inline-flex h-9 items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-md active:scale-95 transition-transform"
        >
          <Sparkles size={13} />
          New Meet
        </button>
      </div>

      <MobileListLayout
        title="My Meetings"
        subtitle=""
        loading={loading}
        items={meetings}
        renderItem={(item) => {
          const isOnline = item.meetingMode === 'online';
          const isPending = item.status === 'pending';
          const isIncomingPending = isPending && item.isIncoming;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-850 dark:text-white leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-1">
                    {isOnline ? <Video size={12} className="text-blue-500" /> : <MapPin size={12} className="text-emerald-500" />}
                    {isOnline ? `${item.meetingPlatform || 'Google Meet'}` : (item.location || 'In Person')}
                  </p>
                </div>
                <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase ${
                  item.status === 'accepted' || item.status === 'scheduled'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                    : item.status === 'rejected' || item.status === 'cancelled'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                }`}>
                  {item.status || 'Pending'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 bg-slate-50/50 p-2.5 rounded-xl dark:bg-slate-950">
                <span className="flex items-center gap-1"><CalendarDays size={11} /> {item.meetingDate}</span>
                <span className="flex items-center gap-1"><Clock3 size={11} /> {item.startTime} ({item.durationMinutes} mins)</span>
              </div>

              {isIncomingPending && (
                <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/85">
                  <button
                    onClick={() => onAccept(item.id)}
                    disabled={updatingId === item.id}
                    className="flex-1 rounded-xl bg-blue-600 py-2 text-[10px] font-black text-white hover:bg-blue-750 disabled:opacity-40"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(item.id)}
                    disabled={updatingId === item.id}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 disabled:opacity-40"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
