import React from 'react';
import { Search, ChevronRight } from 'lucide-react';

/**
 * MobileListLayout
 * A highly premium, touch-optimized container for listing records as stacked cards on mobile.
 */
export function MobileListLayout({
  title,
  subtitle,
  actions,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  tabs,
  activeTab,
  onTabChange,
  items = [],
  renderItem,
  emptyState,
  loading,
}) {
  return (
    <div className="space-y-5 pb-24">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none">{title}</h1>
          {subtitle && <p className="text-[10px] font-semibold text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Search filter */}
      {onSearchChange && (
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-xs"
          />
        </div>
      )}

      {/* Horizontally scrollable tabs */}
      {tabs && tabs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x -mx-4 px-4">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all shrink-0 snap-start ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "bg-white text-slate-500 border border-slate-100 dark:bg-slate-900 dark:border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main content list */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center p-6">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-xs font-bold text-slate-400">Loading data...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        emptyState || (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-xs font-bold text-slate-500">No records found</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => renderItem(item, index))}
        </div>
      )}
    </div>
  );
}

/**
 * MobileDetailLayout
 * Clean vertical card stack for displaying full detail view pages on mobile.
 */
export function MobileDetailLayout({
  title,
  subtitle,
  actions,
  sections = [],
}) {
  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none">{title}</h1>
          {subtitle && <p className="text-[10px] font-semibold text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Sections Stack */}
      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3.5"
          >
            {sec.title && (
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-slate-50 dark:border-slate-800/80 pb-2">
                {sec.title}
              </h3>
            )}
            <div className="space-y-3">
              {sec.fields.map((f, fIdx) => (
                <div key={fIdx}>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">{f.label}</label>
                  <div className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-350 leading-relaxed">
                    {f.value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MobileFormLayout
 * Touch-friendly layout containing single-column inputs with sticky action buttons.
 */
export function MobileFormLayout({
  title,
  subtitle,
  onSubmit,
  submitLabel = "Save Changes",
  submitting,
  disabled,
  children,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="space-y-5 pb-28 relative"
    >
      <div>
        <h2 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-widest">{title}</h2>
        {subtitle && <p className="text-[10px] font-semibold text-slate-400 mt-1">{subtitle}</p>}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-4">
        {children}
      </div>

      {/* Sticky Bottom Save Action */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-white/95 border-t border-slate-100 p-4 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md">
        <button
          type="submit"
          disabled={disabled || submitting}
          className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black text-white hover:bg-blue-750 shadow-md shadow-blue-500/10 active:scale-98 transition disabled:opacity-40"
        >
          {submitting ? "Processing..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
