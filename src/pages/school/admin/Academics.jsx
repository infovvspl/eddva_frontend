import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Eye,
  Layers,
  Plus,
  Search,
  School,
  Trash2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import ClassForm from '@/components/school/admin/forms/ClassForm';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const academicYears = ['2024-2025', '2025-2026', '2026-2027'];

export default function Academics() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const navigate = useNavigate();
  const confirm = useConfirm();

  useEffect(() => {
    fetchData();
  }, [academicYear]);

  const totalSections = useMemo(
    () => classes.reduce((sum, cls) => sum + (cls.sections || []).length, 0),
    [classes],
  );

  const classesWithSections = useMemo(
    () => classes.filter((cls) => (cls.sections || []).length > 0).length,
    [classes],
  );

  const filteredClasses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return classes.filter((cls) => {
      const sections = cls.sections || [];
      const hasSections = sections.length > 0;
      const matchesSearch =
        !term ||
        cls.name?.toLowerCase().includes(term) ||
        sections.some((section) => section.name?.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'with-sections' && hasSections) ||
        (statusFilter === 'without-sections' && !hasSections);

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      const numA = parseInt(nameA.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(nameB.match(/\d+/)?.[0] || '0', 10);
      
      if (numA !== numB) {
        if (numA === 0) return -1; // non-numeric names (LKG/UKG) go first
        if (numB === 0) return 1;
        return numA - numB;
      }
      return nameA.localeCompare(nameB);
    });
  }, [classes, searchTerm, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const classRes = await api.get('/academic/classes', { params: { academicYear } });
      const classPayload = classRes.data?.data ?? classRes.data;
      setClasses(Array.isArray(classPayload) ? classPayload : []);
    } catch (error) {
      handleApiError(error, 'Failed to load academics');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = () => {
    setSelectedClass(null);
    setIsClassModalOpen(true);
  };

  const handleEditClass = (cls) => {
    setSelectedClass(cls);
    setIsClassModalOpen(true);
  };

  const handleDeleteClass = async (id) => {
    const ok = await confirm({
      title: 'Delete Class',
      message: 'Are you sure? All associated sections will be deleted.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!ok) return;

    try {
      await api.delete(`/academic/classes/${id}`);
      await fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to delete class');
    }
  };

  const handleClassSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedClass) {
        await api.put(`/academic/classes/${selectedClass.id}`, formData);
      } else {
        await api.post('/academic/classes', formData);
      }
      setIsClassModalOpen(false);
      setSelectedClass(null);
      await fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to save class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const valueOrDash = (...values) => {
    const value = values.find((item) => item !== undefined && item !== null && item !== '');
    return value ?? '-';
  };

  const sectionCount = (cls) => (cls.sections || []).length;
  const classStudents = (cls) => valueOrDash(cls.totalStudents, cls.total_students, cls.studentCount, cls.student_count);

  const openSectionsPage = (classId) => {
    navigate(`/school/admin/academics/${classId}/sections`, { state: { academicYear } });
  };

  if (loading) return <div className="p-8 dark:text-white">Loading academics...</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
            <School className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-surface-950 dark:text-white">Class & Sections</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-surface-500 dark:text-surface-400">Manage classes, sections and academic structure</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 shrink-0">Year:</span>
            <div className="flex-1">
              <CustomSelect
                onChange={setAcademicYear}
                value={academicYear}
                options={academicYears.map((year) => ({ value: year, label: year }))}
                className="w-full sm:w-40"
              />
            </div>
            <button
              onClick={handleAddClass}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
            >
              <Plus className="size-4" />
              <span>Add Class</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <SummaryCard icon={School} tone="blue" label="Total Classes" value={classes.length} helper={`Academic Year ${academicYear}`} />
        <SummaryCard icon={Layers} tone="emerald" label="Total Sections" value={totalSections} helper={`Academic Year ${academicYear}`} />
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
        <div className="flex flex-col gap-3 border-b border-surface-200 p-4 md:flex-row md:items-center md:justify-between dark:border-surface-800">
          {/* ── Mobile Filters ── */}
          <div className="flex flex-col md:hidden gap-3 w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-2.5 py-1 text-xs font-semibold text-surface-700">
                <Layers className="size-3.5 text-blue-600" />
                <span>Academics List</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition",
                  showMobileFilters
                    ? "bg-blue-600 border-blue-700 text-white"
                    : "bg-white border-surface-200 text-surface-700"
                )}
              >
                <Filter className="size-3.5" />
                <span>Filter</span>
              </button>
            </div>
            
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-surface-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search class or section..."
                className="h-10 w-full rounded-xl border border-surface-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-surface-800 dark:bg-surface-955 dark:text-white"
              />
            </div>

            {showMobileFilters && (
              <div className="flex flex-col gap-2 pt-2 border-t border-surface-100 dark:border-surface-800">
                <CustomSelect
                  onChange={setStatusFilter}
                  value={statusFilter}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "with-sections", label: "With Sections" },
                    { value: "without-sections", label: "Without Sections" },
                  ]}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* ── Desktop Filters ── */}
          <div className="hidden md:flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-surface-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search class or section..."
                  className="h-10 w-full rounded-xl border border-surface-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-72 dark:border-surface-800 dark:bg-surface-950 dark:text-white"
                />
              </div>
              <CustomSelect
                onChange={setStatusFilter}
                value={statusFilter}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "with-sections", label: "With Sections" },
                  { value: "without-sections", label: "Without Sections" },
                ]}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="w-full min-w-[900px] text-left">
            <TableHeader className="border-b border-surface-200 bg-surface-50 text-[11px] font-bold uppercase tracking-wider text-surface-600 dark:border-surface-800 dark:bg-surface-955/50 dark:text-surface-300">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="h-auto px-4 py-3 sticky left-0 z-20 bg-surface-50 dark:bg-slate-850 text-surface-600 dark:text-surface-300">Class</TableHead>
                <TableHead className="h-auto px-4 py-3 text-center text-surface-600 dark:text-surface-300">Sections</TableHead>
                <TableHead className="h-auto px-4 py-3 text-center text-surface-600 dark:text-surface-300">Students</TableHead>
                <TableHead className="h-auto px-4 py-3 text-surface-600 dark:text-surface-300">Status</TableHead>
                <TableHead className="h-auto px-4 py-3 text-center text-surface-600 dark:text-surface-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-surface-200 text-sm dark:divide-surface-800 [&_tr]:border-b-0">
              {filteredClasses.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="px-5 py-12 text-center">
                    <p className="font-bold text-surface-900 dark:text-white">No matching classes found</p>
                    <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Try selecting a different academic year or add a new class.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls) => {
                  return (
                    <TableRow key={cls.id} className="group/row bg-white align-middle transition-colors hover:bg-blue-50/50 dark:bg-surface-900 dark:hover:bg-surface-800/40">
                      <TableCell className="p-4 px-4 py-3 font-bold text-surface-950 dark:text-white sticky left-0 z-20 bg-white transition-colors group-hover/row:bg-blue-50 dark:bg-slate-900 dark:group-hover/row:bg-slate-800">{cls.name}</TableCell>
                      <TableCell className="p-4 px-4 py-3 text-center"><span className="inline-flex min-w-8 justify-center rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{sectionCount(cls)}</span></TableCell>
                      <TableCell className="p-4 px-4 py-3 text-center text-surface-700 dark:text-surface-200">{classStudents(cls)}</TableCell>
                      <TableCell className="p-4 px-4 py-3"><StatusPill /></TableCell>
                      <TableCell className="p-4 px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <IconButton title="Open sections page" onClick={() => openSectionsPage(cls.id)} icon={Eye} />
                          <IconButton title="Edit class" onClick={() => handleEditClass(cls)} icon={Edit2} />
                          <IconButton title="Delete class" onClick={() => handleDeleteClass(cls.id)} icon={Trash2} danger />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-surface-200 dark:divide-surface-800 bg-white dark:bg-surface-900">
          {filteredClasses.length === 0 ? (
            <div className="p-5 py-12 text-center text-sm">
              <p className="font-bold text-surface-900 dark:text-white">No matching classes found</p>
              <p className="mt-1 text-surface-500 dark:text-surface-400">Try selecting a different academic year or add a new class.</p>
            </div>
          ) : (
            filteredClasses.map((cls) => {
              return (
                <div key={cls.id} className="p-4 space-y-3 hover:bg-surface-50/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-surface-950 dark:text-white text-base">{cls.name}</span>
                    <StatusPill />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-surface-700 dark:text-surface-200 pt-1">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-surface-400 font-bold">Sections</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">{sectionCount(cls)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-surface-400 font-bold">Students</span>
                      <span className="font-semibold">{classStudents(cls)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-100 dark:border-surface-800/40">
                    <button
                      onClick={() => openSectionsPage(cls.id)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-surface-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 text-xs font-bold dark:bg-surface-900 dark:border-surface-800 dark:text-surface-300"
                    >
                      <Eye className="size-3.5" />
                      <span>Sections</span>
                    </button>
                    <button
                      onClick={() => handleEditClass(cls)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 text-surface-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 text-xs font-bold dark:bg-surface-900 dark:border-surface-800 dark:text-surface-300"
                    >
                      <Edit2 className="size-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-red-650 hover:border-red-400 hover:bg-red-50 hover:text-red-600 text-xs font-bold dark:bg-surface-900 dark:border-red-950/20 dark:text-red-400"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-surface-200 px-5 py-4 text-sm text-surface-600 sm:flex-row sm:items-center sm:justify-between dark:border-surface-800 dark:text-surface-300">
          <span>Showing {filteredClasses.length === 0 ? 0 : 1} to {filteredClasses.length} of {filteredClasses.length} classes</span>
          <div className="flex items-center gap-2">
            <DisabledPageButton icon={ChevronsLeft} />
            <DisabledPageButton icon={ChevronLeft} />
            <span className="grid size-9 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">1</span>
            <DisabledPageButton icon={ChevronRight} />
            <DisabledPageButton icon={ChevronsRight} />
            <CustomSelect
              value="10"
              onChange={() => {}}
              options={[{ value: "10", label: "10" }]}
              className="ml-2 h-9 rounded-lg border border-surface-200 bg-white px-3 text-sm font-semibold dark:border-surface-800 dark:bg-surface-950 dark:text-white"
            />
          </div>
        </div>
      </section>

      <Modal
        isOpen={isClassModalOpen}
        title={selectedClass ? 'Edit Class' : 'Add New Class'}
        onClose={() => setIsClassModalOpen(false)}
        size="md"
      >
        <ClassForm
          classData={selectedClass}
          onSubmit={handleClassSubmit}
          onCancel={() => setIsClassModalOpen(false)}
          isLoading={isSubmitting}
          defaultAcademicYear={academicYear}
        />
      </Modal>
    </div>
  );
}

function SummaryCard({ icon: Icon, tone, label, value, helper }) {
  const tones = {
    blue: { card: 'border-blue-100 from-white to-blue-50/80', blob: 'bg-blue-100', tile: 'from-blue-500 to-sky-500 shadow-blue-500/30' },
    emerald: { card: 'border-emerald-100 from-white to-emerald-50/80', blob: 'bg-emerald-100', tile: 'from-emerald-500 to-teal-500 shadow-emerald-500/30' },
    indigo: { card: 'border-indigo-100 from-white to-indigo-50/80', blob: 'bg-indigo-100', tile: 'from-indigo-500 to-violet-500 shadow-indigo-500/30' },
  };
  const t = tones[tone] || tones.blue;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3 transition-colors hover:border-surface-300 sm:p-5 dark:border-surface-800 dark:from-surface-900 dark:to-surface-900', t.card)}>
      <span className={cn('pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-60 dark:opacity-10', t.blob)} />
      <div className="relative flex items-center gap-3 sm:gap-4">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md sm:size-14 sm:rounded-2xl', t.tile)}>
          <Icon className="size-5 sm:size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-surface-600 dark:text-surface-300 sm:text-sm">{label}</p>
          <p className="mt-0.5 text-xl font-bold leading-none text-surface-950 dark:text-white sm:mt-1 sm:text-3xl">{value}</p>
          <p className="mt-0.5 truncate text-[10px] text-surface-500 dark:text-surface-400 sm:mt-1 sm:text-sm">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function StatusPill() {
  return (
    <Badge
      variant="secondary"
      className="rounded-full border-transparent bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
    >
      Active
    </Badge>
  );
}

function IconButton({ icon: Icon, title, onClick, danger = false }) {
  const size = 'size-8';
  const colors = danger
    ? 'border-red-100 text-red-500 hover:border-red-300 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30'
    : 'border-surface-200 text-surface-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-surface-800 dark:text-surface-300 dark:hover:bg-surface-800';

  return (
    <button
      onClick={onClick}
      className={`grid ${size} place-items-center rounded-lg border transition-colors ${colors}`}
      title={title}
    >
      <Icon className="size-4" />
    </button>
  );
}

function DisabledPageButton({ icon: Icon }) {
  return (
    <button className="grid size-9 place-items-center rounded-lg border border-surface-200 text-surface-400 dark:border-surface-800" disabled>
      <Icon className="size-4" />
    </button>
  );
}
