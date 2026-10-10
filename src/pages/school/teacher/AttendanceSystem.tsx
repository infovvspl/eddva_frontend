import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserCheck, UserX, Clock, Calendar, TrendingUp, Plus, Eye, Edit2,
  Download, RefreshCw, CheckCircle2, AlertCircle, Sparkles,
  Users, X, Info, ChevronRight, Filter, Search, RotateCcw, Circle, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/SchoolAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/school/LoadingSpinner';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { exportToPDF } from '@/lib/school/pdfExport';
import './AttendanceSystem.css';

interface Student {
  id: string;
  name: string;
  email: string;
  roll_no: string;
}

interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  leaveToday: number;
  attendancePercentage: number;
  classesMarkedToday: number;
}

// Labelled date/text field on the shadcn Input.
const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <Label className="text-[0.813rem] font-medium text-slate-700 dark:text-slate-300">{label}</Label>}
    <Input className={className} {...props} />
  </div>
);

// Labelled shadcn Select. An empty-string value (the "All …" option) is mapped to a sentinel,
// and onChange keeps the `{ target: { value } }` shape the call sites already use.
const NONE_VALUE = '__none__';
const FormSelect: React.FC<{
  label?: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}> = ({ label, value, onChange, options, disabled }) => (
  <div className="flex flex-col gap-1.5">
    {label && <Label className="text-[0.813rem] font-medium text-slate-700 dark:text-slate-300">{label}</Label>}
    <Select
      value={value === '' || value == null ? NONE_VALUE : String(value)}
      onValueChange={(v) => onChange({ target: { value: v === NONE_VALUE ? '' : v } })}
      disabled={disabled}
    >
      <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={`${o.value}`} value={o.value === '' ? NONE_VALUE : String(o.value)}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', dot: 'fill-emerald-500 text-emerald-500', on: 'data-[state=on]:bg-emerald-500' },
  { value: 'absent', label: 'Absent', dot: 'fill-rose-500 text-rose-500', on: 'data-[state=on]:bg-rose-500' },
  { value: 'late', label: 'Late', dot: 'fill-amber-500 text-amber-500', on: 'data-[state=on]:bg-amber-500' },
  { value: 'leave', label: 'Leave', dot: 'fill-slate-400 text-slate-400', on: 'data-[state=on]:bg-slate-400 dark:data-[state=on]:bg-slate-600' },
];

type StatusValue = 'present' | 'absent' | 'late' | 'leave';
const StatusToggle: React.FC<{ value: string; onChange: (v: StatusValue) => void; compact?: boolean }> = ({ value, onChange, compact }) => (
  <ToggleGroup
    type="single"
    value={value}
    onValueChange={(v) => { if (v) onChange(v as StatusValue); }}
    className={compact
      ? 'grid w-full grid-cols-2 gap-1.5 min-[380px]:grid-cols-4'
      : 'inline-flex gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-950'}
  >
    {STATUS_OPTIONS.map((o) => (
      <ToggleGroupItem
        key={o.value}
        value={o.value}
        aria-label={o.label}
        className={cn(
          'h-auto gap-1 font-black text-slate-600 data-[state=on]:text-white data-[state=on]:shadow-sm dark:text-slate-400',
          '[&[data-state=on]_svg]:fill-white [&[data-state=on]_svg]:text-white',
          compact
            ? 'justify-center rounded-lg border border-slate-100 bg-slate-50 py-2 text-[10px] dark:border-slate-800/80 dark:bg-slate-950'
            : 'rounded-xl px-4 py-2 text-xs',
          o.on,
        )}
      >
        <Circle className={cn('size-2', o.dot)} /> {o.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);

const STATUS_PILL: Record<string, string> = {
  present: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  absent: 'border-rose-100 bg-rose-50 text-rose-600',
  late: 'border-amber-100 bg-amber-50 text-amber-600',
};
const STATUS_DOT: Record<string, string> = {
  present: 'fill-emerald-500 text-emerald-500',
  absent: 'fill-rose-500 text-rose-500',
  late: 'fill-amber-500 text-amber-500',
};

const AttendanceSystem: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Today's Stats
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    leaveToday: 0,
    attendancePercentage: 0,
    classesMarkedToday: 0
  });

  // Dropdown Options
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  // The institute's own configured periods (Admin Settings → Period Management) —
  // used as the fallback period list instead of a fixed guess, so a school with a
  // different period count/duration still sees its real periods, not made-up ones.
  const [institutePeriods, setInstitutePeriods] = useState<{ value: string; label: string }[]>([]);

  // Selected values for Marking Attendance
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedSubjectRef = useRef(selectedSubject);
  const selectedPeriodRef = useRef(selectedPeriod);

  useEffect(() => { selectedSubjectRef.current = selectedSubject; }, [selectedSubject]);
  useEffect(() => { selectedPeriodRef.current = selectedPeriod; }, [selectedPeriod]);

  // Editing Session Info
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [duplicateSessionId, setDuplicateSessionId] = useState<string | null>(null);

  // Loaded Students and their statuses
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'late' | 'leave'>>({});
  const [remarksData, setRemarksData] = useState<Record<string, string>>({});
  const [studentSearch, setStudentSearch] = useState('');
  const [markingSearch, setMarkingSearch] = useState('');

  // Marking Sheet Pagination (client-side — all students loaded at once)
  const [markingPage, setMarkingPage] = useState(1);
  const [markingLimit, setMarkingLimit] = useState(10);
  // markingTotal / markingTotalPages derived from students.length below

  // History Page
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyFilterClass, setHistoryFilterClass] = useState('');
  const [historyFilterSection, setHistoryFilterSection] = useState('');
  const [historyFilterSubject, setHistoryFilterSubject] = useState('');
  const [historyFilterDate, setHistoryFilterDate] = useState('');

  // History Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // View Modal State
  const [viewingSession, setViewingSession] = useState<any>(null);

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/attendance/dashboard-stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  // Fetch Classes
  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      const list = res.data?.data ?? res.data ?? [];
      if (Array.isArray(list)) {
        setClasses(list);
        if (list.length > 0) {
          setSelectedClass(list[0].id);
          // Auto populate sections
          if (list[0].sections && list[0].sections.length > 0) {
            setSections(list[0].sections);
            setSelectedSection(list[0].sections[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update sections when class selection changes
  useEffect(() => {
    if (selectedClass) {
      const cls = classes.find(c => c.id === selectedClass);
      if (cls && cls.sections) {
        setSections(cls.sections);
        if (cls.sections.length > 0) {
          setSelectedSection(cls.sections[0].id);
        } else {
          setSections([]);
          setSelectedSection('');
        }
      }
    }
  }, [selectedClass, classes]);

  // Fetch subjects dynamically based on assignments
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass || !selectedSection) return;
      try {
        let list: any[] = [];
        let assignedOnly = false;

        // 1. Try fetching teacher assignments for this section
        try {
          const res = await api.get(`/academic/sections/${selectedSection}/teaching-map`);
          const rawAssignments = res.data?.data?.rawAssignments || [];
          const myAssignments = rawAssignments.filter((a: any) =>
            (a.teacherEmail && user?.email && a.teacherEmail.toLowerCase() === user.email.toLowerCase()) ||
            (a.teacherUserId && user?.id && a.teacherUserId === user.id)
          );

          const isClassTeacher = myAssignments.some((a: any) => a.isClassTeacher);
          const assignedSubjects = myAssignments
            .filter((a: any) => a.subjectId)
            .map((a: any) => ({
              id: a.subjectId,
              name: a.subjectName
            }));

          if (assignedSubjects.length > 0) {
            list = assignedSubjects;
            assignedOnly = true;
          } else if (isClassTeacher) {
            assignedOnly = false;
          }
        } catch (e) {
          // ignore
        }

        // 2. Fallback to all section subjects if no specific teacher subject mapping is present
        if (!assignedOnly || list.length === 0) {
          try {
            const subRes = await api.get('/subjects', {
              params: { classId: selectedClass, sectionId: selectedSection, limit: 1000 }
            });
            const allSubs = subRes.data?.data ?? subRes.data ?? [];
            if (Array.isArray(allSubs)) {
              allSubs.forEach((s: any) => {
                if (s.id && !list.some(existing => existing.id === s.id)) {
                  list.push({ id: s.id, name: s.name });
                }
              });
            }
          } catch (e) {
            console.error('Failed to fetch class subjects:', e);
          }
        }

        const uniqueList = list.filter((v, i, a) => v.id && v.id !== 'all' && a.findIndex(t => (t.id === v.id)) === i);

        if (editingSessionId && selectedSubjectRef.current && selectedSubjectRef.current !== 'all') {
            const exists = uniqueList.find(s => s.id === selectedSubjectRef.current);
            if (!exists) {
                uniqueList.push({ id: selectedSubjectRef.current, name: 'Historical Subject' });
            }
        }

        setSubjects(uniqueList);

        if (!editingSessionId) {
          if (uniqueList.length > 0) {
            setSelectedSubject(uniqueList[0].id);
          } else {
            setSelectedSubject('all');
          }
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    fetchSubjects();
  }, [selectedClass, selectedSection, user, editingSessionId]);

  // The institute's real period configuration, used whenever there's no specific
  // timetable slot to derive periods from (see fetchPeriods below).
  useEffect(() => {
    const fetchInstitutePeriods = async () => {
      try {
        const res = await api.get('/academic/periods');
        const list = res.data?.data || [];
        const options = list
          .slice()
          // Breaks/assembly/etc. aren't real class periods — exclude them so a
          // teacher can't accidentally mark attendance against "Lunch Break".
          .filter((p: any) => !p.periodType || p.periodType === 'Academic')
          .sort((a: any, b: any) => Number(a.sequenceNo || 0) - Number(b.sequenceNo || 0))
          .map((p: any) => {
            const value = `Period ${p.sequenceNo} (${p.startTime} - ${p.endTime})`;
            const label = p.periodName ? `${p.periodName} (${p.startTime} - ${p.endTime})` : value;
            return { value, label };
          });
        setInstitutePeriods(options);
      } catch (err) {
        console.error('Failed to fetch institute periods:', err);
      }
    };
    fetchInstitutePeriods();
  }, []);

  // Fetch periods dynamically based on timetable
  useEffect(() => {
    const fetchPeriods = async () => {
      if (!selectedClass || !selectedSection || !date) {
         setPeriods(institutePeriods);
         if (!editingSessionId && !selectedPeriod && institutePeriods.length > 0) setSelectedPeriod(institutePeriods[0].value);
         return;
      }
      try {
        const d = new Date(date);
        const dayIndex = d.getDay();
        const currentDayOfWeek = dayIndex === 0 ? 7 : dayIndex;

        // 1. Try querying teacher's specific assigned timetable slots
        const teacherParams: any = {
            teacherUserId: user?.id,
            sectionId: selectedSection,
            dayOfWeek: currentDayOfWeek,
            limit: 1000
        };
        if (selectedSubject && selectedSubject !== 'all') {
            teacherParams.subjectId = selectedSubject;
        }

        let res = await api.get('/timetables', { params: teacherParams });
        let list = res.data?.data || [];

        // 2. If no specific teacher slot found, search section timetable slots
        if (list.length === 0) {
           const sectionParams: any = {
               sectionId: selectedSection,
               dayOfWeek: currentDayOfWeek,
               limit: 1000
           };
           if (selectedSubject && selectedSubject !== 'all') {
               sectionParams.subjectId = selectedSubject;
           }
           const secRes = await api.get('/timetables', { params: sectionParams });
           list = secRes.data?.data || [];
        }

        const timetableOptions = list.map((slot: any) => {
           const baseValue = `Period ${slot.periodNumber || 1} (${slot.startTime} - ${slot.endTime})`;
           const baseLabel = slot.subject_name
               ? `${baseValue} - ${slot.subject_name}`
               : baseValue;
           return { value: baseValue, label: baseLabel };
        });

        let finalOptions = timetableOptions;
        if (finalOptions.length === 0) {
           finalOptions = institutePeriods;
        }

        const uniquePeriodOptions = Array.from(new Map(finalOptions.map((item: any) => [item.value, item])).values());

        if (editingSessionId && selectedPeriodRef.current) {
           const exists = uniquePeriodOptions.find((p: any) => p.value === selectedPeriodRef.current);
           if (!exists) {
              uniquePeriodOptions.push({ value: selectedPeriodRef.current, label: selectedPeriodRef.current });
           }
        }

        setPeriods(uniquePeriodOptions);

        if (!editingSessionId) {
           if (uniquePeriodOptions.length > 0 && (!selectedPeriod || !uniquePeriodOptions.some(p => p.value === selectedPeriod))) {
              setSelectedPeriod(uniquePeriodOptions[0].value);
           }
        }
      } catch (err) {
        console.error('Failed to fetch periods:', err);
        setPeriods(institutePeriods);
        if (!selectedPeriod && institutePeriods.length > 0) setSelectedPeriod(institutePeriods[0].value);
      }
    };
    fetchPeriods();
  }, [selectedClass, selectedSection, selectedSubject, date, user, editingSessionId, institutePeriods]);

  // Fetch History Records
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const params: any = {};
      if (historyFilterClass) params.classId = historyFilterClass;
      if (historyFilterSection) params.sectionId = historyFilterSection;
      if (historyFilterSubject) params.subjectId = historyFilterSubject;
      if (historyFilterDate) params.date = historyFilterDate;
      params.page = page;
      params.limit = limit;

      const res = await api.get('/attendance/history', { params });
      if (res.data?.success) {
        setHistoryRecords(res.data.data);
        if (typeof res.data.total !== 'undefined') {
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      toast.error('Failed to load history log');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyFilterClass, historyFilterSection, historyFilterSubject, historyFilterDate, page, limit]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyFilterClass, historyFilterSection, historyFilterSubject, historyFilterDate, page, limit]);

  const [isMarkingStarted, setIsMarkingStarted] = useState(false);

  useEffect(() => {
    if (isMarkingStarted) {
      // Only reload from server when search changes (client-side pagination doesn't need server call)
      loadStudentsPage();
    }
  }, [markingSearch]);

  useEffect(() => {
    if (editingSessionId) return;

    setStudents([]);
    setAttendanceData({});
    setRemarksData({});
    setIsMarkingStarted(false);
  }, [
    date,
    selectedClass,
    selectedSection,
    selectedSubject,
    selectedPeriod
  ]);

  const loadStudentsPage = async (checkSession = false) => {
    setStudentsLoading(true);
    try {
      if (checkSession && !editingSessionId) {
        const checkRes = await api.get('/attendance/session/check', {
          params: {
            classId: selectedClass,
            sectionId: selectedSection,
            subjectId: selectedSubject || null,
            period: selectedPeriod || null,
            date: date
          }
        });
        if (checkRes.data?.data?.exists) {
          setDuplicateSessionId(checkRes.data.data.sessionId);
          toast.warning('Attendance already submitted for this session.');
          setStudentsLoading(false);
          return false;
        }
      }

      // Fetch ALL students at once (no server-side pagination)
      // We paginate the display client-side so attendanceData always has every student
      const res = await api.get('/attendance/students', {
        params: {
          classId: selectedClass,
          sectionId: selectedSection,
          page: 1,
          limit: 2000,  // fetch all — a class won't have more than 2000 students
          search: markingSearch
        }
      });

      if (res.data?.success) {
        const list: Student[] = res.data.data;
        setStudents(list);
        setMarkingPage(1); // reset to first display page

        // Preserve existing attendance marks for students already in state
        setAttendanceData(prev => {
          const updated: Record<string, 'present' | 'absent' | 'late' | 'leave'> = {};
          list.forEach((s: Student) => {
            updated[s.id] = prev[s.id] ?? 'present';
          });
          return updated;
        });
        setRemarksData(prev => {
          const updated: Record<string, string> = {};
          list.forEach((s: Student) => {
            updated[s.id] = prev[s.id] ?? '';
          });
          return updated;
        });
        return true;
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('Failed to fetch students from class');
      return false;
    } finally {
      setStudentsLoading(false);
    }
  };

  // Load Students handler
  const handleLoadStudents = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error('Please select both Class and Section');
      return;
    }
    setDuplicateSessionId(null);
    setMarkingPage(1);
    const success = await loadStudentsPage(true);
    if (success) {
      setIsMarkingStarted(true);
      toast.success('Ready to mark attendance');
    }
  };

  // Client-side display pagination derived values
  const markingTotal = students.length;
  const markingTotalPages = Math.ceil(markingTotal / markingLimit) || 1;
  // Client-side search filter — instantly filters without a network round-trip
  const filteredStudents = useMemo(() => {
    if (!markingSearch.trim()) return students;
    const q = markingSearch.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      String(s.roll_no || '').toLowerCase().includes(q)
    );
  }, [students, markingSearch]);
  const displayedStudents = useMemo(() => {
    const start = (markingPage - 1) * markingLimit;
    return filteredStudents.slice(start, start + markingLimit);
  }, [filteredStudents, markingPage, markingLimit]);

  // Quick Attendance Actions — mark ALL students across all pages
  const handleMarkAll = (status: 'present' | 'absent' | 'leave') => {
    if (students.length === 0) return;
    const updated = { ...attendanceData };
    students.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceData(updated);
    toast.success(`Marked all ${students.length} students as ${status.toUpperCase()}`);
  };

  const handleResetAttendance = () => {
    if (students.length === 0) return;
    const updated: Record<string, 'present' | 'absent' | 'late' | 'leave'> = {};
    students.forEach(s => { updated[s.id] = 'present'; });
    setAttendanceData(updated);
    setRemarksData({});
    toast.info('Attendance sheet reset to default');
  };

  // Live Summary Stats — counts ALL students, not just current page
  const liveStats = useMemo(() => {
    const total = students.length;
    let present = 0, absent = 0, late = 0, leave = 0;
    students.forEach(s => {
      const status = attendanceData[s.id] || 'present';
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else if (status === 'leave') leave++;
    });
    const attendanceRate = total > 0
      ? Math.round(((present + late) / total) * 1000) / 10
      : 0;
    return { total, present, absent, late, leave, attendanceRate };
  }, [students, attendanceData]);

  // Submit / Draft Save Attendance handler
  const handleSaveAttendance = async (finalized: boolean) => {
    if (Object.keys(attendanceData).length === 0) {
      toast.error('No students loaded to mark attendance for');
      return;
    }
    try {
      const payload = {
        sessionId: editingSessionId,
        classId: selectedClass,
        sectionId: selectedSection,
        subjectId: selectedSubject === 'all' ? null : (selectedSubject || null),
        period: selectedPeriod || null,
        date,
        finalized,
        students: Object.keys(attendanceData).map(studentId => ({
          student_id: studentId,
          status: attendanceData[studentId] || 'present',
          remarks: remarksData[studentId] || null
        }))
      };

      console.log(`Submitting attendance for ${payload.students.length} students`, payload);

      const res = await api.post('/attendance/session', payload);
      if (res.data?.success) {
        const newSessionId = res.data.sessionId || res.data.data?.sessionId;
        toast.success(finalized ? `Attendance submitted for ${payload.students.length} students!` : 'Draft saved successfully!');
        // Reset marking state
        setStudents([]);
        setAttendanceData({});
        setRemarksData({});
        setEditingSessionId(null);
        setIsMarkingStarted(false);
        // Show "Already Submitted" banner if finalized
        if (finalized && newSessionId) {
          setDuplicateSessionId(newSessionId);
        }
        // Refresh dashboard metrics & history
        fetchDashboardStats();
        if (activeTab === 'history') {
          fetchHistory();
        }
      }
    } catch (err: any) {
      console.error('Failed to submit attendance:', err);
      if (err.response?.status === 409) {
        toast.warning('Attendance has already been submitted for this session.');
        const dupId = err.response.data?.sessionId || err.response.data?.message?.sessionId;
        if (dupId) {
          setDuplicateSessionId(dupId);
          setStudents([]);
          setIsMarkingStarted(false);
        }
      } else {
        toast.error('Failed to save attendance record');
      }
    }
  };

  // Edit session handler
  const handleEditSession = async (sessionId: string) => {
    try {
      const res = await api.get(`/attendance/session/${sessionId}`);
      if (res.data?.success) {
        const { session, records } = res.data.data;
        setEditingSessionId(sessionId);
        setSelectedClass(session.class_id);
        setSelectedSection(session.section_id);
        setSelectedSubject(session.subject_id || '');
        setSelectedPeriod(session.period || '');
        setDate(session.date);

        // Map records
        const mappedStudents = records.map((r: any) => ({
          id: r.studentId,
          name: r.studentName,
          email: '',
          roll_no: r.rollNo || ''
        }));

        const mappedStatus: Record<string, 'present' | 'absent' | 'late' | 'leave'> = {};
        const mappedRemarks: Record<string, string> = {};

        records.forEach((r: any) => {
          mappedStatus[r.studentId] = r.status.toLowerCase() as any;
          mappedRemarks[r.studentId] = r.remarks || '';
        });

        setStudents(mappedStudents);
        setAttendanceData(mappedStatus);
        setRemarksData(mappedRemarks);

        setActiveTab('entry');
        toast.success('Session loaded into editor');
      }
    } catch (err) {
      console.error('Failed to load session for editing:', err);
      toast.error('Failed to load session details');
    }
  };

  // Export PDF Handler
  const handleExportPDF = async (sessionId: string, dateStr: string, className: string, secName: string) => {
    try {
      const res = await api.get(`/attendance/session/${sessionId}`);
      if (res.data?.success) {
        const { session, records } = res.data.data;

        // Create a temporary element in document body to capture PDF
        const printContainer = document.createElement('div');
        printContainer.id = 'pdf-capture-element';
        printContainer.className = 'pdf-print-wrapper bg-white text-slate-800 p-8';
        printContainer.style.width = '800px';
        printContainer.style.position = 'fixed';
        printContainer.style.left = '-9999px';
        printContainer.style.top = '-9999px';
        printContainer.style.zIndex = '-9999';

        printContainer.innerHTML = `
          <div style="border-bottom: 2px solid #2563EB; padding-bottom: 15px; margin-bottom: 25px;">
            <h1 style="color: #2563EB; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">EDDVA School Attendance Report</h1>
            <p style="color: #64748B; margin: 5px 0 0 0; font-size: 13px; font-weight: 600;">Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; font-size: 14px; background: #F8FAFC; padding: 15px; border-radius: 12px; border: 1px solid #E2E8F0;">
            <div><strong>Date:</strong> ${session.date}</div>
            <div><strong>Class & Section:</strong> Class ${className} - ${secName}</div>
            <div><strong>Period:</strong> ${session.period || 'N/A'}</div>
            <div><strong>Subject:</strong> ${session.subjectName || 'General'}</div>
          </div>
          <h3 style="color: #1E293B; margin-bottom: 15px; font-size: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px;">Student Attendance List</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead>
              <tr style="background: #EEF2F6; border-bottom: 2px solid #CBD5E1;">
                <th style="padding: 10px; font-weight: 700; width: 80px;">Roll No</th>
                <th style="padding: 10px; font-weight: 700;">Student Name</th>
                <th style="padding: 10px; font-weight: 700; width: 120px;">Attendance Status</th>
                <th style="padding: 10px; font-weight: 700;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${records.map((r: any) => `
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 10px;">${r.rollNo || '-'}</td>
                  <td style="padding: 10px; font-weight: 600;">${r.studentName}</td>
                  <td style="padding: 10px;">
                    <span style="font-weight: 800; color: ${
                      r.status.toLowerCase() === 'present' ? '#16A34A' :
                      r.status.toLowerCase() === 'absent' ? '#DC2626' :
                      r.status.toLowerCase() === 'late' ? '#D97706' : '#475569'
                    };">${r.status.toUpperCase()}</span>
                  </td>
                  <td style="padding: 10px; color: #64748B; font-style: italic;">${r.remarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        document.body.appendChild(printContainer);

        await exportToPDF('pdf-capture-element', `Attendance_${className.replace(/\s+/g, '_')}_${secName}_${dateStr}.pdf`);
        toast.success('PDF report exported successfully!');

        document.body.removeChild(printContainer);
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
      toast.error('Failed to export PDF');
    }
  };

  // View Details Handler
  const handleViewDetails = async (sessionId: string) => {
    try {
      const res = await api.get(`/attendance/session/${sessionId}`);
      if (res.data?.success) {
        setViewingSession(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
      toast.error('Failed to load details');
    }
  };


  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Find class and section names for editing summary
  const currentClassName = classes.find(c => c.id === selectedClass)?.name || '';
  const currentSectionName = sections.find(s => s.id === selectedSection)?.name || '';

  return (
    <div className="attendance-page">
      {/* Title Header */}
      <div className="attendance-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Teacher Attendance Dashboard <Sparkles className="size-5 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium">
            Manage daily roll calls, track student presence, and review logs instantly.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchDashboardStats();
            if (activeTab === 'history') fetchHistory();
            toast.success('Attendance data refreshed');
          }}
          className="self-start gap-2 rounded-xl text-xs font-bold md:self-auto"
        >
          <RefreshCw className="size-3.5" />
          Refresh Stats
        </Button>
      </div>

      {/* Tabs Menu Navigation Bar */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'entry' | 'history')} className="mb-6">
        <TabsList className="tabs-navigation-bar h-auto w-full max-w-md gap-2 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <TabsTrigger
            value="entry"
            className="flex-1 gap-2 rounded-xl px-2 py-2.5 text-xs font-bold text-slate-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:text-slate-400 sm:px-4"
          >
            <Plus className="size-4 shrink-0" />
            <span className="truncate"><span className="hidden sm:inline">Offline </span>Attendance Entry</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex-1 gap-2 rounded-xl px-2 py-2.5 text-xs font-bold text-slate-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:text-slate-400 sm:px-4"
          >
            <Calendar className="size-4 shrink-0" />
            <span className="truncate">Attendance History</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Tab Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'entry' ? (
          <motion.div
            key="entry"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Z-index controls for select dropdown layering */}
            {/* Header Control Form */}
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-6 attendance-filters-card">
              <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                <Filter className="size-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Attendance Selector</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {/* Date Picker */}
                <div>
                  <FormInput
                    label="Attendance Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={editingSessionId !== null}
                  />
                </div>

                {/* Class Selection */}
                <div>
                  <FormSelect
                    label="Class"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    options={classes.map(c => ({ value: c.id, label: c.name }))}
                    disabled={editingSessionId !== null}
                  />
                </div>

                {/* Section Selection */}
                <div>
                  <FormSelect
                    label="Section"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    options={sections.map(s => ({ value: s.id, label: s.name }))}
                    disabled={editingSessionId !== null}
                  />
                </div>

                {/* Period Selection */}
                <div>
                  <FormSelect
                    label="Period"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    options={periods}
                  />
                </div>

                {/* Subject Selection */}
                <div>
                  <FormSelect
                    label="Subject (Optional)"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Subjects (General)' },
                      ...subjects.map(s => ({ value: s.id, label: s.name }))
                    ]}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
                {editingSessionId && (
                  <Badge variant="outline" className="flex items-center gap-1.5 border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300">
                    <Info className="size-3.5" /> Editing Session: Class {currentClassName} - {currentSectionName}
                  </Badge>
                )}
                <Button
                  onClick={handleLoadStudents}
                  disabled={studentsLoading}
                  className="ml-auto gap-2 bg-indigo-600 font-bold hover:bg-indigo-700"
                >
                  {studentsLoading && <Loader2 className="size-4 animate-spin" />}
                  {editingSessionId ? 'Reset Changes' : 'Load Students'}
                </Button>
              </div>
            </Card>

            {/* Attendance Sheet content */}
            {duplicateSessionId ? (
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-8 border-2 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/10 attendance-results-card">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="size-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="size-8 text-amber-600 dark:text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Attendance Already Submitted
                  </h3>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                    Attendance records have already been submitted for this session. Would you like to view or edit the existing records?
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(duplicateSessionId)}
                      className="bg-white font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Eye className="size-4 mr-2" />
                      View Attendance
                    </Button>
                    <Button
                      onClick={() => {
                        handleEditSession(duplicateSessionId);
                        setDuplicateSessionId(null);
                      }}
                      className="bg-indigo-600 font-bold hover:bg-indigo-700"
                    >
                      <Edit2 className="size-4 mr-2" />
                      Edit Attendance
                    </Button>
                  </div>
                </div>
              </Card>
            ) : students.length > 0 ? (
              <div className="flex flex-col gap-6">

                {/* Main Attendance Sheet (Full width) */}
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-6 attendance-results-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">Attendance Marking Sheet</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Toggle student presence status. Default is Present.</p>
                      </div>

                      {/* Live Student Search */}
                      <div className="relative w-full sm:w-auto sm:min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Search student..."
                          value={markingSearch}
                          onChange={(e) => {
                            setMarkingSearch(e.target.value);
                            setMarkingPage(1);
                          }}
                          className="h-9 w-full rounded-xl bg-slate-50 pl-9 pr-4 text-xs dark:bg-slate-950"
                        />
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="quick-actions-bar mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                      <span className="mr-2 flex items-center text-xs font-bold text-slate-500">Quick Actions:</span>
                      <Button variant="ghost" size="sm" onClick={() => handleMarkAll('present')}
                        className="h-auto rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black text-emerald-600 hover:bg-emerald-500 hover:text-white">
                        Mark All Present
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleMarkAll('absent')}
                        className="h-auto rounded-lg bg-rose-500/10 px-3 py-1.5 text-[10px] font-black text-rose-600 hover:bg-rose-500 hover:text-white">
                        Mark All Absent
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleMarkAll('leave')}
                        className="h-auto rounded-lg bg-slate-500/10 px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-500 hover:text-white">
                        Mark All Leave
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleResetAttendance}
                        className="ml-auto h-auto gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[10px] font-black text-amber-600 hover:bg-amber-500 hover:text-white">
                        <RotateCcw className="size-3" />
                        Reset
                      </Button>
                    </div>

                    {/* Desktop / tablet table */}
                    <div className="hidden overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 md:block">
                      <Table>
                        <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
                          <TableRow>
                            <TableHead className="w-[100px] px-3 py-3 text-[10px] font-bold uppercase tracking-wider">Roll No</TableHead>
                            <TableHead className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider">Student Name</TableHead>
                            <TableHead className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Attendance Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedStudents.map((s) => {
                            const currentStatus = attendanceData[s.id] || 'present';
                            return (
                              <TableRow key={s.id}>
                                <TableCell className="px-3 py-4 text-sm font-bold text-slate-400">
                                  {s.roll_no ? String(s.roll_no).padStart(2, '0') : '--'}
                                </TableCell>
                                <TableCell className="px-3 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                  {s.name}
                                  <Input
                                    type="text"
                                    placeholder="Add remarks..."
                                    value={remarksData[s.id] || ''}
                                    onChange={(e) => setRemarksData({ ...remarksData, [s.id]: e.target.value })}
                                    className="mt-1 h-7 w-full max-w-[250px] rounded-none border-0 border-b border-transparent bg-transparent px-0 py-1 text-xs font-normal text-slate-400 shadow-none hover:border-slate-200 focus-visible:border-indigo-500 focus-visible:text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0"
                                  />
                                </TableCell>
                                <TableCell className="px-3 py-4 text-right">
                                  <StatusToggle
                                    value={currentStatus}
                                    onChange={(st) => setAttendanceData({ ...attendanceData, [s.id]: st })}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {displayedStudents.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="py-8 text-center text-xs font-semibold text-slate-400">
                                {students.length === 0 ? 'No students loaded.' : 'No students match your search.'}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile: one card per student */}
                    <div className="block space-y-3 md:hidden">
                      {displayedStudents.map((s) => {
                        const currentStatus = attendanceData[s.id] || 'present';
                        return (
                          <Card key={s.id} className="space-y-3 rounded-xl border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="secondary" className="rounded bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:bg-slate-50 dark:bg-slate-950">
                                Roll #{s.roll_no ? String(s.roll_no).padStart(2, '0') : '--'}
                              </Badge>
                              <span className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-200">{s.name}</span>
                            </div>

                            <StatusToggle
                              compact
                              value={currentStatus}
                              onChange={(st) => setAttendanceData({ ...attendanceData, [s.id]: st })}
                            />

                            <Input
                              type="text"
                              placeholder="Add remarks..."
                              value={remarksData[s.id] || ''}
                              onChange={(e) => setRemarksData({ ...remarksData, [s.id]: e.target.value })}
                              className="h-9 w-full rounded-lg bg-slate-50/50 text-xs dark:bg-slate-950/40"
                            />
                          </Card>
                        );
                      })}
                      {displayedStudents.length === 0 && (
                        <div className="py-8 text-center text-xs font-semibold text-slate-400">
                          {students.length === 0 ? 'No students loaded.' : 'No students match your search.'}
                        </div>
                      )}
                    </div>

                    {students.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <DataTablePagination
                          page={markingPage}
                          limit={markingLimit}
                          total={filteredStudents.length}
                          totalPages={Math.ceil(filteredStudents.length / markingLimit) || 1}
                          onPageChange={setMarkingPage}
                          onLimitChange={(l) => { setMarkingLimit(l); setMarkingPage(1); }}
                        />
                      </div>
                    )}
                  </Card>

                  {/* Live Summary Card */}
                  <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <TrendingUp className="size-4.5 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Attendance Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      {/* Circular Progress Gauge */}
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="relative size-28 flex items-center justify-center">
                          <svg className="absolute size-full transform -rotate-90">
                            <circle
                              cx="56" cy="56" r="46"
                              className="stroke-slate-100 dark:stroke-slate-800"
                              strokeWidth="8" fill="none"
                            />
                            <circle
                              cx="56" cy="56" r="46"
                              className="stroke-indigo-600 transition-all duration-500 ease-out"
                              strokeWidth="8" fill="none"
                              strokeDasharray={`${2 * Math.PI * 46}`}
                              strokeDashoffset={`${2 * Math.PI * 46 * (1 - liveStats.attendanceRate / 100)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="text-center">
                            <span className="text-2xl font-black text-slate-800 dark:text-white">{liveStats.attendanceRate}%</span>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Rate</p>
                          </div>
                        </div>
                      </div>

                      {/* Info Breakdown List */}
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span>Total Students</span>
                          <span className="font-bold text-slate-800 dark:text-white">{liveStats.total}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1"><Circle className="size-2 fill-emerald-500 text-emerald-500" /> Present</span>
                          <span className="font-bold text-emerald-600">{liveStats.present}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1"><Circle className="size-2 fill-amber-500 text-amber-500" /> Late Arrivals</span>
                          <span className="font-bold text-amber-500">{liveStats.late}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1"><Circle className="size-2 fill-rose-500 text-rose-500" /> Absent</span>
                          <span className="font-bold text-rose-500">{liveStats.absent}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1"><Circle className="size-2 fill-slate-400 text-slate-400" /> On Leave</span>
                          <span className="font-bold text-slate-500 dark:text-slate-400">{liveStats.leave}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Save Attendance Actions */}
                  <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <Button
                      size="lg"
                      onClick={() => handleSaveAttendance(true)}
                      className="w-full rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-700"
                    >
                      Submit Attendance
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleSaveAttendance(false)}
                      className="w-full rounded-2xl bg-white font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
                      Save Draft
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={() => {
                        setStudents([]);
                        setAttendanceData({});
                        setRemarksData({});
                        setEditingSessionId(null);
                        toast.info('Marking flow cancelled');
                      }}
                      className="w-full rounded-2xl font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                    >
                      Cancel
                    </Button>
                    </div>
                  </Card>
              </div>
            ) : (
              // Empty State before loading students
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-12 text-center flex flex-col items-center justify-center">
                <div className="size-28 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mb-5 border border-indigo-100 dark:border-indigo-900/30 shadow-inner">
                  <Calendar className="size-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Load Student Attendance Sheet</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm mt-2 leading-relaxed">
                  Select a date, class, and section above, then click <strong>Load Students</strong> to populate the attendance records.
                </p>
              </Card>
            )}
          </motion.div>
        ) : (
          /* History Page Panel */
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Filters Row */}
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-5 attendance-filters-card">
              <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                <Filter className="size-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Filter History Logs</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div>
                  <FormInput
                    label="Date"
                    type="date"
                    value={historyFilterDate}
                    onChange={(e) => setHistoryFilterDate(e.target.value)}
                  />
                </div>

                {/* Class Filter */}
                <div>
                  <FormSelect
                    label="Class"
                    value={historyFilterClass}
                    onChange={(e) => setHistoryFilterClass(e.target.value)}
                    options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
                  />
                </div>

                {/* Section Filter */}
                <div>
                  <FormSelect
                    label="Section"
                    value={historyFilterSection}
                    onChange={(e) => setHistoryFilterSection(e.target.value)}
                    options={[{ value: '', label: 'All Sections' }, ...(selectedClass ? sections : []).map(s => ({ value: s.id, label: s.name }))]}
                  />
                </div>

                {/* Subject Filter */}
                <div>
                  <FormSelect
                    label="Subject"
                    value={historyFilterSubject}
                    onChange={(e) => setHistoryFilterSubject(e.target.value)}
                    options={[{ value: '', label: 'All Subjects' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]}
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(historyFilterClass || historyFilterSection || historyFilterSubject || historyFilterDate) && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHistoryFilterClass('');
                      setHistoryFilterSection('');
                      setHistoryFilterSubject('');
                      setHistoryFilterDate('');
                      toast.info('History filters cleared');
                    }}
                    className="h-auto px-2 py-1 text-xs font-bold text-rose-500 hover:bg-transparent hover:text-rose-600"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </Card>

            {/* History Records Table */}
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-6 attendance-results-card">
              {historyLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : historyRecords.length > 0 ? (
                <>
                  {/* Mobile: one card per session */}
                  <div className="space-y-3 md:hidden">
                    {historyRecords.map((item) => (
                      <Card key={item.sessionId} className="space-y-3 rounded-xl border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.date}</p>
                            <p className="text-[10px] font-medium text-slate-400">{item.period}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={item.finalized
                              ? 'border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400'}
                          >
                            {item.finalized ? 'Finalized' : 'Draft'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.className} - {item.sectionName}</span>
                          <span className="text-right font-semibold text-slate-500">{item.subjectName}</span>
                          <span className="font-bold text-emerald-600">Present: {item.present}</span>
                          <span className="text-right font-bold text-rose-500">Absent: {item.absent}</span>
                        </div>
                        <div className="flex justify-end gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                          <Button variant="outline" size="icon" title="View Attendance" onClick={() => handleViewDetails(item.sessionId)} className="size-9 rounded-xl text-slate-600 hover:text-indigo-600">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="outline" size="icon" title="Edit Attendance" onClick={() => handleEditSession(item.sessionId)} className="size-9 rounded-xl text-slate-600 hover:text-amber-500">
                            <Edit2 className="size-4" />
                          </Button>
                          <Button variant="outline" size="icon" title="Export PDF" onClick={() => handleExportPDF(item.sessionId, item.date, item.className, item.sectionName)} className="size-9 rounded-xl text-slate-600 hover:text-emerald-500">
                            <Download className="size-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Tablet / desktop table */}
                  <div className="hidden overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 md:block">
                    <Table>
                      <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
                        <TableRow>
                          <TableHead className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider">Date</TableHead>
                          <TableHead className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider">Class</TableHead>
                          <TableHead className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider">Section</TableHead>
                          <TableHead className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider">Subject</TableHead>
                          <TableHead className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider">Present</TableHead>
                          <TableHead className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider">Absent</TableHead>
                          <TableHead className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                          <TableHead className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyRecords.map((item) => (
                          <TableRow key={item.sessionId}>
                            <TableCell className="px-2 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                              {item.date}
                              <span className="block text-[9px] font-medium text-slate-400">{item.period}</span>
                            </TableCell>
                            <TableCell className="px-2 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{item.className}</TableCell>
                            <TableCell className="px-2 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{item.sectionName}</TableCell>
                            <TableCell className="px-2 py-4 text-xs font-semibold text-slate-500">{item.subjectName}</TableCell>
                            <TableCell className="px-2 py-4 text-xs font-bold text-emerald-600">{item.present}</TableCell>
                            <TableCell className="px-2 py-4 text-xs font-bold text-rose-500">{item.absent}</TableCell>
                            <TableCell className="px-2 py-4">
                              <Badge
                                variant="outline"
                                className={item.finalized
                                  ? 'border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : 'border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400'}
                              >
                                {item.finalized ? 'Finalized' : 'Draft'}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button variant="outline" size="icon" title="View Attendance" onClick={() => handleViewDetails(item.sessionId)} className="size-9 rounded-xl text-slate-600 hover:text-indigo-600">
                                  <Eye className="size-4" />
                                </Button>
                                <Button variant="outline" size="icon" title="Edit Attendance" onClick={() => handleEditSession(item.sessionId)} className="size-9 rounded-xl text-slate-600 hover:text-amber-500">
                                  <Edit2 className="size-4" />
                                </Button>
                                <Button variant="outline" size="icon" title="Export PDF" onClick={() => handleExportPDF(item.sessionId, item.date, item.className, item.sectionName)} className="size-9 rounded-xl text-slate-600 hover:text-emerald-500">
                                  <Download className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                /* Empty state when no sessions found */
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="size-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Info className="size-10" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No attendance sessions found</h3>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                    No sessions match the selected filters, or no attendance has been marked yet for this class and section.
                  </p>
                </div>
              )}

              {historyRecords.length > 0 && !historyLoading && (
                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <DataTablePagination
                    page={page}
                    limit={limit}
                    total={total}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                  />
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewing details modal */}
      <Dialog open={!!viewingSession} onOpenChange={(open) => { if (!open) setViewingSession(null); }}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 rounded-3xl border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:rounded-3xl sm:p-6">
          {viewingSession && (
            <>
              {/* Modal Header */}
              <DialogHeader className="border-b border-slate-100 pb-4 text-left dark:border-slate-800">
                <DialogTitle className="text-base font-bold leading-normal tracking-normal text-slate-800 dark:text-white">Attendance Logs</DialogTitle>
                <DialogDescription className="text-xs text-slate-400">Session details and student statuses.</DialogDescription>
              </DialogHeader>

              {/* Session Meta */}
              <div className="my-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900/40 sm:grid-cols-4">
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Date</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewingSession.session.date}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Class & Section</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewingSession.session.className} - {viewingSession.session.sectionName}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Period</span>
                  <span className="block truncate text-slate-700 dark:text-slate-300" title={viewingSession.session.period}>{viewingSession.session.period || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Subject</span>
                  <span className="text-slate-700 dark:text-slate-300">{viewingSession.session.subjectName || 'General'}</span>
                </div>
              </div>

              {/* Records List Table */}
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">Roll No</TableHead>
                      <TableHead className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider">Student</TableHead>
                      <TableHead className="px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingSession.records.map((r: any) => {
                      const st = String(r.status).toLowerCase();
                      return (
                        <TableRow key={r.studentId}>
                          <TableCell className="px-2 py-2.5 text-xs font-bold text-slate-400">
                            {r.rollNo ? String(r.rollNo).padStart(2, '0') : '--'}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            {r.studentName}
                            {r.remarks && (
                              <span className="mt-0.5 block text-[10px] font-medium italic text-slate-400">Remarks: {r.remarks}</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-right">
                            <Badge
                              variant="outline"
                              className={cn(
                                'gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase',
                                STATUS_PILL[st] ?? 'border-slate-100 bg-slate-50 text-slate-600',
                              )}
                            >
                              <Circle className={cn('size-2', STATUS_DOT[st] ?? 'fill-slate-400 text-slate-400')} />
                              {r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Close Footer */}
              <DialogFooter className="mt-4 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:space-x-0">
                <Button
                  variant="outline"
                  onClick={() => setViewingSession(null)}
                  className="font-bold"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const { session } = viewingSession;
                    handleEditSession(session.id);
                    setViewingSession(null);
                  }}
                  className="bg-indigo-600 font-bold hover:bg-indigo-700"
                >
                  Edit Records
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceSystem;
