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
      className="group flex w-full items-center justify-between gap-1 text-left cursor-pointer transition hover:opacity-80 py-0.5 px-0.5"
    >
      {/* Left Column: Info (High-contrast white text on dark event gradients) */}
      <div className="min-w-0 flex-1 flex flex-col gap-0">
        <span className="text-[10px] font-black tracking-tight text-white dark:text-white truncate leading-tight filter drop-shadow-xs">
          {event.title}
        </span>
        <span className="text-[8.5px] font-bold text-white/85 dark:text-white/85 truncate leading-tight">
          {timeStr}
        </span>
      </div>

      {/* Right Column: Emblem Icon (Super-Enlarged for High-Impact Visibility) */}
      <EventIcon category={details.category} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 filter drop-shadow-md transition-transform group-hover:scale-110" />
    </div>
  );
};
