import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchableMultiSelect({
  label,
  placeholder = 'Select options...',
  options = [],
  selectedValues = [],
  onChange,
  error
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(opt => 
      String(opt.label || opt.name || '').toLowerCase().includes(q)
    );
  }, [options, search]);

  const handleToggleOption = (val) => {
    const isSelected = selectedValues.includes(val);
    let next;
    if (isSelected) {
      next = selectedValues.filter(v => v !== val);
    } else {
      next = [...selectedValues, val];
    }
    onChange(next);
  };

  const handleRemoveOption = (e, val) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== val));
  };

  const selectedLabels = useMemo(() => {
    return options.filter(opt => selectedValues.some(v => String(v) === String(opt.value || opt.id)));
  }, [options, selectedValues]);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          {label}
        </label>
      )}

      {/* Select Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex min-h-[54px] w-full cursor-pointer items-center justify-between rounded-2xl border-2 px-4 py-2.5 transition-all duration-300
          ${isOpen ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800'}
          ${error ? 'border-red-500' : ''}
          bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl
        `}
      >
        <div className="flex flex-wrap gap-1.5 pr-4">
          {selectedLabels.length === 0 ? (
            <span className="text-sm font-semibold text-slate-400 select-none">
              {placeholder}
            </span>
          ) : (
            selectedLabels.map(opt => (
              <span
                key={opt.value || opt.id}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-sky-400"
              >
                {opt.label || opt.name}
                <button
                  type="button"
                  onClick={(e) => handleRemoveOption(e, opt.value || opt.id)}
                  className="rounded-full p-0.5 hover:bg-blue-500/20 text-blue-600 dark:text-sky-400 transition-colors"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
        />
      </div>

      {error && <p className="mt-1 ml-4 text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}

      {/* Dropdown Options List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[100] mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border-2 border-slate-100 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95 backdrop-blur-2xl p-2 shadow-2xl custom-scrollbar"
          >
            {/* Search Input inside Dropdown */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded-xl border-2 border-slate-50 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-bold outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-900 dark:bg-slate-900/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* List */}
            <div className="space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs font-bold text-slate-400">
                  No options found
                </div>
              ) : (
                filteredOptions.map(opt => {
                  const val = String(opt.value || opt.id);
                  const isSel = selectedValues.some(v => String(v) === val);
                  return (
                    <div
                      key={val}
                      onClick={() => handleToggleOption(val)}
                      className={`
                        flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all
                        ${isSel ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'}
                      `}
                    >
                      <span>{opt.label || opt.name}</span>
                      {isSel && <Check size={14} strokeWidth={3} />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
