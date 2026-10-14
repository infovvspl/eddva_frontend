import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

/**
 * One-screen class → section → subject picker for the teacher module.
 *
 * Each assigned class is a card. Opening a card shows its sections as chips and, for the active
 * section, that section's subjects as tiles — one click on a subject finishes the whole choice,
 * so there are no separate Section and Subject screens.
 *
 * Same visual design as the Course Content page: white header when closed, tinted when open, a
 * stable per-class accent colour, 1 / 2 / 3 independent columns so opening a card only grows its
 * own column.
 */

export interface PickerAssignment {
  classId: string;
  className: string;
  sectionId?: string | null;
  sectionName?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
}

interface Props {
  assignments: PickerAssignment[];
  /** Called when a subject tile is clicked. Names are raw (not display-formatted). */
  onPick: (
    cls: { id: string; name: string },
    section: { id: string; name: string },
    subject: { id: string; name: string },
  ) => void;
  /** Small caption under each subject name, e.g. "Open assessments". */
  actionLabel?: string;
  /** Only classes whose name contains this (case-insensitive) are shown. */
  search?: string;
}

const natural = (a?: string | null, b?: string | null) => {
  const norm = (v?: string | null) => String(v ?? '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  return norm(a).localeCompare(norm(b), undefined, { numeric: true, sensitivity: 'base' });
};

const sectionLabel = (name?: string | null) => {
  const value = String(name || '').trim();
  if (!value) return 'Section';
  return /^(sec|section)\b/i.test(value) ? value : `Sec ${value}`;
};

/** Column count: 1 on phones, 2 from md, 3 from xl (Tailwind breakpoints). */
function useColumnCount() {
  const pick = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return 1;
    if (window.matchMedia('(min-width: 1280px)').matches) return 3;
    if (window.matchMedia('(min-width: 768px)').matches) return 2;
    return 1;
  };
  const [count, setCount] = useState(pick);
  useEffect(() => {
    const queries = [window.matchMedia('(min-width: 768px)'), window.matchMedia('(min-width: 1280px)')];
    const update = () => setCount(pick());
    queries.forEach((q) => q.addEventListener('change', update));
    return () => queries.forEach((q) => q.removeEventListener('change', update));
  }, []);
  return count;
}

// Five calm hues, picked from the class id so a class keeps its colour when the list changes.
// Full class names on purpose — Tailwind can't see classes built from template strings.
const THEMES = [
  {
    card: 'hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10 dark:hover:border-blue-500',
    header: 'bg-white hover:bg-blue-50 group-data-[state=open]:bg-blue-100/80 group-data-[state=open]:hover:bg-blue-100 dark:bg-surface-900 dark:hover:bg-blue-950/30 dark:group-data-[state=open]:bg-blue-950/40 dark:group-data-[state=open]:hover:bg-blue-950/60',
    tile: 'bg-blue-600 text-white shadow-sm shadow-blue-600/30',
    title: 'text-blue-900 dark:text-blue-50',
    sub: 'text-blue-700 dark:text-blue-300',
    chevron: 'text-blue-700 dark:text-blue-300',
  },
  {
    card: 'hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/10 dark:hover:border-indigo-500',
    header: 'bg-white hover:bg-indigo-50 group-data-[state=open]:bg-indigo-100/80 group-data-[state=open]:hover:bg-indigo-100 dark:bg-surface-900 dark:hover:bg-indigo-950/30 dark:group-data-[state=open]:bg-indigo-950/40 dark:group-data-[state=open]:hover:bg-indigo-950/60',
    tile: 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30',
    title: 'text-indigo-900 dark:text-indigo-50',
    sub: 'text-indigo-700 dark:text-indigo-300',
    chevron: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    card: 'hover:border-teal-500 hover:shadow-md hover:shadow-teal-500/10 dark:hover:border-teal-500',
    header: 'bg-white hover:bg-teal-50 group-data-[state=open]:bg-teal-100/80 group-data-[state=open]:hover:bg-teal-100 dark:bg-surface-900 dark:hover:bg-teal-950/30 dark:group-data-[state=open]:bg-teal-950/40 dark:group-data-[state=open]:hover:bg-teal-950/60',
    tile: 'bg-teal-600 text-white shadow-sm shadow-teal-600/30',
    title: 'text-teal-900 dark:text-teal-50',
    sub: 'text-teal-700 dark:text-teal-300',
    chevron: 'text-teal-700 dark:text-teal-300',
  },
  {
    card: 'hover:border-violet-500 hover:shadow-md hover:shadow-violet-500/10 dark:hover:border-violet-500',
    header: 'bg-white hover:bg-violet-50 group-data-[state=open]:bg-violet-100/80 group-data-[state=open]:hover:bg-violet-100 dark:bg-surface-900 dark:hover:bg-violet-950/30 dark:group-data-[state=open]:bg-violet-950/40 dark:group-data-[state=open]:hover:bg-violet-950/60',
    tile: 'bg-violet-600 text-white shadow-sm shadow-violet-600/30',
    title: 'text-violet-900 dark:text-violet-50',
    sub: 'text-violet-700 dark:text-violet-300',
    chevron: 'text-violet-700 dark:text-violet-300',
  },
  {
    card: 'hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/10 dark:hover:border-amber-500',
    header: 'bg-white hover:bg-amber-50 group-data-[state=open]:bg-amber-100/80 group-data-[state=open]:hover:bg-amber-100 dark:bg-surface-900 dark:hover:bg-amber-950/30 dark:group-data-[state=open]:bg-amber-950/40 dark:group-data-[state=open]:hover:bg-amber-950/60',
    tile: 'bg-amber-600 text-white shadow-sm shadow-amber-600/30',
    title: 'text-amber-900 dark:text-amber-50',
    sub: 'text-amber-700 dark:text-amber-300',
    chevron: 'text-amber-700 dark:text-amber-300',
  },
];

const themeFor = (id: string) =>
  THEMES[Array.from(String(id)).reduce((n, ch) => n + ch.charCodeAt(0), 0) % THEMES.length];

export default function ClassCardPicker({ assignments, onPick, actionLabel = 'Open', search = '' }: Props) {
  const columnCount = useColumnCount();
  const [activeSection, setActiveSection] = useState<Record<string, string>>({});

  const classes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, { id: string; name: string }>();
    assignments.forEach((a) => {
      if (a.classId && !map.has(a.classId)) map.set(a.classId, { id: a.classId, name: a.className });
    });
    return Array.from(map.values())
      .filter((c) => !q || String(c.name ?? '').toLowerCase().includes(q))
      .sort((a, b) => natural(a.name, b.name));
  }, [assignments, search]);

  const cards = classes.map((c) => {
    // Sections of this class
    const secMap = new Map<string, { id: string; name: string }>();
    assignments
      .filter((a) => a.classId === c.id && a.sectionId)
      .forEach((a) => {
        if (!secMap.has(a.sectionId as string)) secMap.set(a.sectionId as string, { id: a.sectionId as string, name: String(a.sectionName ?? '') });
      });
    const secs = Array.from(secMap.values()).sort((a, b) => natural(a.name, b.name));

    const activeSecId = activeSection[c.id] || secs[0]?.id;
    const activeSec = secs.find((s) => s.id === activeSecId) || secs[0];

    // Subjects of the active section
    const subjMap = new Map<string, { id: string; name: string }>();
    if (activeSec) {
      assignments
        .filter((a) => a.classId === c.id && a.sectionId === activeSec.id && a.subjectId)
        .forEach((a) => {
          if (!subjMap.has(a.subjectId as string)) subjMap.set(a.subjectId as string, { id: a.subjectId as string, name: String(a.subjectName ?? '') });
        });
    }
    const subjs = Array.from(subjMap.values()).sort((a, b) => natural(a.name, b.name));

    const totalSubjects = new Set(
      assignments.filter((a) => a.classId === c.id && a.subjectId).map((a) => a.subjectId),
    ).size;

    const theme = themeFor(c.id);

    return (
      <AccordionItem
        key={c.id}
        value={c.id}
        className={`group relative flex flex-col justify-start overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all duration-200 dark:border-surface-800 dark:bg-surface-900 ${theme.card}`}
      >
        <AccordionTrigger
          className={`relative w-full overflow-hidden px-4 py-3.5 text-left transition-colors duration-200 hover:no-underline sm:px-5 [&>svg]:hidden ${theme.header}`}
        >
          <div className="relative flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${theme.tile}`}>
                <GraduationCap className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className={`truncate text-lg font-bold leading-tight tracking-tight ${theme.title}`}>{c.name}</h3>
                <p className={`mt-0.5 truncate text-xs font-medium ${theme.sub}`}>
                  {secs.length} {secs.length === 1 ? 'Section' : 'Sections'} • {totalSubjects} {totalSubjects === 1 ? 'Subject' : 'Subjects'}
                </p>
              </div>
            </div>
            <ChevronDown className={`size-4 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180 ${theme.chevron}`} />
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-0 pb-0">
          {secs.length > 0 && (
            <div className="border-b border-surface-100 bg-surface-50/60 p-3 dark:border-surface-800 dark:bg-surface-900/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">Select Section</span>
                <span className="text-[11px] font-semibold text-surface-500">
                  Active: <strong className="text-surface-800 dark:text-white">{sectionLabel(activeSec?.name)}</strong>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {secs.map((sec) => {
                  const isSelected = activeSec?.id === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSection((prev) => ({ ...prev, [c.id]: sec.id }));
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? 'bg-surface-900 text-white shadow-xs ring-1 ring-surface-900 dark:bg-white dark:text-surface-900'
                          : 'border border-surface-200/80 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300'
                      }`}
                    >
                      <span>{sectionLabel(sec.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-surface-700 dark:text-surface-300">
                Assigned Courses in {activeSec ? sectionLabel(activeSec.name) : 'Section'}
              </span>
              <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[11px] font-bold text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                {subjs.length} available
              </span>
            </div>

            {subjs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/40 py-6 text-center dark:border-surface-800 dark:bg-surface-900/30">
                <BookOpen className="mb-1.5 h-6 w-6 text-surface-300 dark:text-surface-600" />
                <p className="text-xs font-semibold text-surface-500">No subjects in {activeSec ? sectionLabel(activeSec.name) : 'this section'}</p>
                <p className="text-[11px] text-surface-400">Switch section above to explore</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {subjs.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!activeSec) return;
                      onPick({ id: c.id, name: c.name }, { id: activeSec.id, name: activeSec.name }, { id: sub.id, name: sub.name });
                    }}
                    className="group/sub flex flex-col justify-between rounded-2xl border border-surface-200/80 bg-surface-50/50 p-3 text-left transition-all duration-200 hover:border-brand-400 hover:bg-brand-50/30 hover:shadow-xs dark:border-surface-800 dark:bg-surface-800/40 dark:hover:border-brand-600 dark:hover:bg-brand-950/20"
                  >
                    <div className="mb-2 flex w-full items-center justify-between">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-2xs ring-1 ring-surface-200/60 dark:bg-surface-700 dark:ring-surface-700">
                        <BookOpen className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200/60 text-surface-600 transition-transform group-hover/sub:translate-x-0.5 group-hover/sub:bg-brand-600 group-hover/sub:text-white dark:bg-surface-700 dark:text-surface-300">
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                    <span className="line-clamp-1 text-xs font-bold text-surface-900 transition-colors group-hover/sub:text-brand-600 dark:text-surface-100 dark:group-hover/sub:text-brand-400">
                      {sub.name}
                    </span>
                    <span className="text-[10px] font-medium text-surface-400">{actionLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  });

  return (
    <Accordion
      type="single"
      collapsible
      className="grid items-start gap-4"
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {/* Cards are dealt into independent columns (1, 2, 3 across, then 4, 5, 6 underneath), so
          opening one only grows its own column and never reflows the cards beside it. */}
      {Array.from({ length: columnCount }, (_, col) => (
        <div key={col} className="flex min-w-0 flex-col gap-4">
          {cards.filter((_, i) => i % columnCount === col)}
        </div>
      ))}
    </Accordion>
  );
}
