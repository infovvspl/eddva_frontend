import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Search,
  Shuffle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrapSchoolData } from '@/lib/api/school-client';
import { cn } from '@/components/school/admin/Skeleton';
import { useConfirm } from '@/context/ConfirmContext';

function formatClassSection(cls, section) {
  if (!cls || !section) return 'Select class and section';
  return `${cls.name} / ${section.name}`;
}

function studentInitial(name = '') {
  return name.trim().slice(0, 1).toUpperCase() || 'S';
}

export default function StudentPromotion() {
  const confirm = useConfirm();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceClassId, setSourceClassId] = useState('');
  const [sourceSectionId, setSourceSectionId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadOverview() {
      try {
        setLoading(true);
        const res = await api.get('/student-promotions/overview');
        const payload = unwrapSchoolData(res, { classes: [] });
        if (!cancelled) setClasses(payload.classes || []);
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || 'Failed to load promotion setup');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOverview();
    return () => { cancelled = true; };
  }, []);

  const sourceClass = useMemo(
    () => classes.find((item) => item.id === sourceClassId) || null,
    [classes, sourceClassId],
  );
  const targetClass = useMemo(
    () => classes.find((item) => item.id === targetClassId) || null,
    [classes, targetClassId],
  );
  const sourceSections = sourceClass?.sections || [];
  const targetSections = targetClass?.sections || [];
  const sourceSection = sourceSections.find((item) => item.id === sourceSectionId) || null;
  const targetSection = targetSections.find((item) => item.id === targetSectionId) || null;

  useEffect(() => {
    setSourceSectionId('');
    setStudents([]);
    setSelectedIds([]);
  }, [sourceClassId]);

  useEffect(() => {
    setTargetSectionId('');
  }, [targetClassId]);

  useEffect(() => {
    let cancelled = false;
    async function loadStudents() {
      if (!sourceSectionId) {
        setStudents([]);
        setSelectedIds([]);
        return;
      }
      try {
        setStudentsLoading(true);
        const params = new URLSearchParams();
        if (includeInactive) params.set('includeInactive', 'true');
        if (search.trim()) params.set('search', search.trim());
        const suffix = params.toString() ? `?${params.toString()}` : '';
        const res = await api.get(`/student-promotions/sections/${sourceSectionId}/students${suffix}`);
        const payload = unwrapSchoolData(res, []);
        if (!cancelled) {
          setStudents(payload);
          setSelectedIds((prev) => prev.filter((id) => payload.some((student) => student.id === id)));
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || 'Failed to load students');
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    }
    const timer = window.setTimeout(loadStudents, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sourceSectionId, includeInactive, search]);

  const allSelected = students.length > 0 && selectedIds.length === students.length;
  const canPromote = sourceSectionId && targetSectionId && sourceSectionId !== targetSectionId && selectedIds.length > 0;

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : students.map((student) => student.id));
  };

  const toggleStudent = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const refreshOverview = async () => {
    const res = await api.get('/student-promotions/overview');
    const payload = unwrapSchoolData(res, { classes: [] });
    setClasses(payload.classes || []);
  };

  const handlePromote = async () => {
    if (!canPromote) return;
    const ok = await confirm({
      title: 'Promote Students',
      subtitle: 'Confirm class movement',
      message: `Move ${selectedIds.length} student(s) from ${formatClassSection(sourceClass, sourceSection)} to ${formatClassSection(targetClass, targetSection)}?`,
      confirmLabel: 'Promote Students',
      cancelLabel: 'Review Again',
    });
    if (!ok) return;

    try {
      setPromoting(true);
      const res = await api.post('/student-promotions/promote', {
        fromSectionId: sourceSectionId,
        toSectionId: targetSectionId,
        studentIds: selectedIds,
        includeInactive,
      });
      const result = unwrapSchoolData(res, {});
      toast.success(`Promoted ${result.promotedCount || 0} student(s)`);
      if (result.skippedCount) {
        toast.warning(`${result.skippedCount} student(s) were skipped`);
      }
      setSelectedIds([]);
      await Promise.all([refreshOverview(), reloadSourceStudents()]);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to promote students');
    } finally {
      setPromoting(false);
    }
  };

  const reloadSourceStudents = async () => {
    if (!sourceSectionId) return;
    const params = new URLSearchParams();
    if (includeInactive) params.set('includeInactive', 'true');
    if (search.trim()) params.set('search', search.trim());
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/student-promotions/sections/${sourceSectionId}/students${suffix}`);
    setStudents(unwrapSchoolData(res, []));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 sm:px-4">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-blue-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-950 p-6 text-white shadow-lg sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-blue-100">
            <Shuffle className="h-3.5 w-3.5" />
            Promotion Management
          </span>
          <h1 className="mt-4 font-display text-3xl font-black">Student Promotion</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-blue-50">
            Move students from one class section to the next academic section in a controlled batch.
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Selected</p>
          <p className="mt-1 text-2xl font-black">{selectedIds.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <PromotionSelector
          title="Promote From"
          helper="Choose the current class and section."
          classes={classes}
          classId={sourceClassId}
          sectionId={sourceSectionId}
          onClassChange={setSourceClassId}
          onSectionChange={setSourceSectionId}
        />
        <div className="hidden items-center justify-center lg:flex">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
            <ArrowRight className="h-6 w-6" />
          </div>
        </div>
        <PromotionSelector
          title="Promote To"
          helper="Choose the destination class and section."
          classes={classes}
          classId={targetClassId}
          sectionId={targetSectionId}
          onClassChange={setTargetClassId}
          onSectionChange={setTargetSectionId}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Source Roster</h2>
              <p className="text-sm font-medium text-slate-500">{formatClassSection(sourceClass, sourceSection)}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(event) => setIncludeInactive(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Include inactive
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search students"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:w-64"
                />
              </div>
            </div>
          </div>

          <div className="min-h-[360px]">
            {!sourceSectionId ? (
              <EmptyRoster text="Select a source class and section to load students." />
            ) : studentsLoading ? (
              <div className="flex h-72 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : students.length === 0 ? (
              <EmptyRoster text="No students found in this source section." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          aria-label="Select all students"
                        />
                      </th>
                      <th className="px-5 py-4">Student</th>
                      <th className="px-5 py-4">Enrollment</th>
                      <th className="px-5 py-4">Roll</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {students.map((student) => {
                      const checked = selectedIds.includes(student.id);
                      return (
                        <tr
                          key={student.id}
                          className={cn('transition hover:bg-blue-50/40 dark:hover:bg-slate-800/50', checked && 'bg-blue-50/70 dark:bg-blue-950/20')}
                        >
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStudent(student.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                              aria-label={`Select ${student.name}`}
                            />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-sm font-black text-blue-700">
                                {student.photo ? <img src={student.photo} alt={student.name} className="h-full w-full object-cover" /> : studentInitial(student.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-900 dark:text-white">{student.name}</p>
                                <p className="truncate text-xs font-semibold text-slate-400">{student.email || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{student.studentProfile?.enrollmentNo || '-'}</td>
                          <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{student.studentProfile?.rollNo || '-'}</td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-black',
                              student.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
                            )}>
                              {student.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="h-fit rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Promotion Summary</h2>
          <div className="mt-4 space-y-3">
            <SummaryRow label="From" value={formatClassSection(sourceClass, sourceSection)} />
            <SummaryRow label="To" value={formatClassSection(targetClass, targetSection)} />
            <SummaryRow label="Available roster" value={`${students.length} student(s)`} />
            <SummaryRow label="Selected" value={`${selectedIds.length} student(s)`} />
          </div>

          {sourceSectionId && targetSectionId && sourceSectionId === targetSectionId && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              Source and destination cannot be the same section.
            </div>
          )}

          <button
            type="button"
            onClick={handlePromote}
            disabled={!canPromote || promoting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Promote Selected Students
          </button>
        </div>
      </div>
    </div>
  );
}

function PromotionSelector({ title, helper, classes, classId, sectionId, onClassChange, onSectionChange }) {
  const selectedClass = classes.find((item) => item.id === classId);
  const sections = selectedClass?.sections || [];

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-black text-slate-950 dark:text-white">{title}</h2>
          <p className="text-xs font-semibold text-slate-400">{helper}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Class</span>
          <select
            value={classId}
            onChange={(event) => onClassChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.activeStudents || 0})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Section</span>
          <select
            value={sectionId}
            onChange={(event) => onSectionChange(event.target.value)}
            disabled={!classId}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Select section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name} ({section.activeStudents || 0})
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function EmptyRoster({ text }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        <Users className="h-7 w-7" />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-500">{text}</p>
    </div>
  );
}
