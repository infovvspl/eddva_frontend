import React from 'react';
import { Clock, MapPin, Video, Edit3, Trash2 } from 'lucide-react';
import { getEventDetails } from '../theme';
import { EventIcon } from './EventIcon';
import { cn } from '@/components/school/admin/Skeleton';

export const EventCard = ({ event, onViewEdit, onDelete, handleEventClick }) => {
  const details = getEventDetails(event);
  const hasTime = event.isAllDay === false || (event.startTime && !event.isAllDay);
  const timeStr = hasTime 
    ? new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div 
      onClick={(e) => handleEventClick(event, e)}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-4 shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.01] cursor-pointer group bg-white dark:bg-slate-900/60",
        details.colorStyles
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.02] rounded-bl-full pointer-events-none" />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Large Left Icon Badge */}
          <EventIcon category={details.category} className="h-10 w-10 shadow-xs shrink-0" />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black tracking-widest uppercase opacity-70">
                {details.label}
              </span>
              {event.priority === 'HIGH' && (
                <span className="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                  High
                </span>
              )}
            </div>
            <h3 className="mt-1 text-sm font-extrabold leading-snug text-slate-900 dark:text-white group-hover:underline truncate">
              {event.title}
            </h3>
            {event.description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {(onViewEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
            {onViewEdit && (
              <button 
                onClick={() => onViewEdit(event)} 
                className="rounded-lg border border-slate-200/60 bg-white dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={() => onDelete(event.id)} 
                className="rounded-lg border border-red-100 bg-white dark:bg-slate-800 p-1.5 text-red-650 dark:text-rose-455 hover:bg-red-50 dark:hover:bg-red-950/20 shadow-xs transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Row */}
      <div className="mt-3.5 pt-3.5 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 opacity-60" /> 
          {event.isAllDay 
            ? 'All Day' 
            : `${new Date(event.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}${timeStr ? ` • ${timeStr}` : ''}`
          }
        </span>
        {event.location && (
          <span className="inline-flex items-center gap-1.5 truncate max-w-[150px]">
            <MapPin className="h-3.5 w-3.5 opacity-60" /> {event.location}
          </span>
        )}
        {event.meetingPlatform && (
          <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-sky-400">
            <Video className="h-3.5 w-3.5" /> {event.meetingPlatform}
          </span>
        )}
      </div>
    </div>
  );
};
