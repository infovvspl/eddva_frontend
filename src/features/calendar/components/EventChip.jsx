import React from 'react';
import { getEventDetails } from '../theme';
import { EventIcon } from './EventIcon';
import { cn } from '@/components/school/admin/Skeleton';

export const EventChip = ({ event, setDragId, handleEventClick }) => {
  const details = getEventDetails(event);
  const hasTime = event.isAllDay === false || (event.startTime && !event.isAllDay);
  
  // Format clean start/end time
  const timeStr = hasTime 
    ? new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'All Day';
  const locStr = event.location ? `• ${event.location}` : '';

  return (
    <div
      draggable
      onDragStart={() => setDragId && setDragId(event.id)}
      onClick={(e) => handleEventClick(event, e)}
      className={cn(
        'group flex w-full items-center justify-between gap-2 rounded-xl border p-2 text-left shadow-xs transition hover:shadow-sm hover:scale-[1.01] cursor-pointer active:scale-[0.99]',
        details.colorStyles
      )}
    >
      {/* Left Column: Info */}
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <span className="text-[10px] font-black tracking-tight text-slate-800 dark:text-slate-100 truncate">
          {event.title}
        </span>
        <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate">
          {timeStr} {locStr}
        </span>
      </div>

      {/* Right Column: Mini Emblem Icon */}
      <EventIcon category={details.category} className="h-5 w-5 shadow-2xs" />
    </div>
  );
};
