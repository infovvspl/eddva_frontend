import React from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

export default function CalendarMobile({
  currentMonth,
  setCurrentMonth,
  selectedCategory,
  setSelectedCategory,
  events,
  loading,
  selectedInfoEvent,
  setSelectedInfoEvent,
  infoModalOpen,
  setInfoModalOpen,
  handleEventClick,
  categoryStyles,
  categoryIcons,
  categoryOptions,
}) {
  if (loading && events.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Calendar...</p>
        </div>
      </div>
    );
  }

  // Shift current month
  const handleShiftMonth = (offset) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(next);
  };

  const formattedMonth = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const catMatches = selectedCategory === 'All' || ev.category?.toUpperCase() === selectedCategory.toUpperCase();
    return catMatches;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Month Selector */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => handleShiftMonth(-1)}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Previous Month"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-black text-slate-800 dark:text-white">
          {formattedMonth}
        </span>
        <button
          onClick={() => handleShiftMonth(1)}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Next Month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Category Horizontal Filter (Scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x -mx-4 px-4">
        {categoryOptions.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all shrink-0 snap-start ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-500 border border-slate-100 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <span className="mr-1">{categoryIcons[cat] || '📅'}</span>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Agenda Stack */}
      <div className="space-y-3.5">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Events for {formattedMonth} ({filteredEvents.length})
        </h2>
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No events scheduled this month</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((ev) => {
              const style = categoryStyles[ev.category?.toUpperCase()] || 'border-slate-200 bg-slate-50 text-slate-700';
              const dateObj = ev.startTime ? new Date(ev.startTime) : null;
              const formattedDate = dateObj ? dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' }) : 'N/A';

              return (
                <div
                  key={ev.id}
                  onClick={(e) => handleEventClick(ev, e)}
                  className={`rounded-2xl border p-4 shadow-xs dark:bg-slate-900 cursor-pointer active:scale-98 transition-all bg-white border-slate-100 dark:border-slate-800`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                      {formattedDate}
                    </span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${style}`}>
                      {ev.category || 'Event'}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-black text-slate-800 dark:text-white leading-tight">
                    {ev.title}
                  </h3>

                  {ev.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {ev.description}
                    </p>
                  )}

                  {/* Location or Timing Details */}
                  {(ev.startTime || ev.location) && (
                    <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      {ev.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {ev.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Details Modal */}
      {infoModalOpen && selectedInfoEvent && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-2">{selectedInfoEvent.title}</h3>
            <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-wider">
              {selectedInfoEvent.category} · {selectedInfoEvent.startTime ? new Date(selectedInfoEvent.startTime).toLocaleDateString() : ''}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6">
              {selectedInfoEvent.description || 'No description provided.'}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setInfoModalOpen(false)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
