import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Edit2, Plus, Search, Users, Eye, Calendar, ArrowUpRight, GraduationCap, CheckCircle2, UserPlus, XCircle, X, Mail, AlertTriangle, Loader2, KeyRound, FileText, Printer } from 'lucide-react';
import api from '@/lib/api/school-client';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { getResponseList, notifyDataChanged } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/school/errorHandler';
import { Skeleton, cn } from '@/components/school/admin/Skeleton';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useAuth } from '@/context/SchoolAuthContext';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { VoiceSearchButton } from "@/components/ui/VoiceSearchButton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          const escaped = s.replaceAll('"', '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  
  const records = [];
  const headerMap = {
    'name': 'name',
    'student name': 'name',
    'email': 'email',
    'password': 'password',
    'enrollment no': 'enrollmentNo',
    'enrollmentno': 'enrollmentNo',
    'enrollment number': 'enrollmentNo',
    'roll no': 'rollNo',
    'rollno': 'rollNo',
    'class': 'class',
    'section': 'section',
    'date of birth': 'dob',
    'dob': 'dob',
    'gender': 'gender',
    'blood group': 'bloodGroup',
    'bloodgroup': 'bloodGroup',
    'father name': 'fatherName',
    'fathername': 'fatherName',
    'mother name': 'motherName',
    'mothername': 'motherName',
    'parent phone': 'parentPhone',
    'parentphone': 'parentPhone',
    'parent email': 'parentEmail',
    'parentemail': 'parentEmail',
    'address': 'address',
    'city': 'city',
    'state': 'state',
    'pin code': 'pinCode',
    'pincode': 'pinCode'
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let insideQuote = false;
    let current = '';
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    const record = {};
    headers.forEach((header, idx) => {
      const apiKey = headerMap[header];
      if (apiKey) {
        record[apiKey] = values[idx] || '';
      }
    });
    records.push(record);
  }
  return records;
}

function normalizeSections(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const isPlatformSuperAdmin = isSuperAdmin && !(user?.instituteId || user?.institute_id);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState('ALL');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0, newThisMonth: 0 });

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Bulk Send Parent Credentials State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSendCredsModalOpen, setIsSendCredsModalOpen] = useState(false);
  const [resendAlreadySent, setResendAlreadySent] = useState(false);
  const [sendingCreds, setSendingCreds] = useState(false);
  const [sendCredsResult, setSendCredsResult] = useState(null);

  // Bulk Send Student Credentials State (own login, 3 channels)
  const [isSendStudentCredsModalOpen, setIsSendStudentCredsModalOpen] = useState(false);
  const [studentCredsChannel, setStudentCredsChannel] = useState('student_email');
  const [resendStudentAlreadySent, setResendStudentAlreadySent] = useState(false);
  const [sendingStudentCreds, setSendingStudentCreds] = useState(false);
  const [sendStudentCredsResult, setSendStudentCredsResult] = useState(null);

  const years = ['ALL', '2023', '2024', '2025', '2026', '2027'];

  async function fetchStudents() {
    try {
      const params = {
        page,
        limit,
        ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(selectedClassId !== 'ALL' ? { classId: selectedClassId } : {}),
        ...(selectedSectionId !== 'ALL' ? { sectionId: selectedSectionId } : {}),
      };

      const statsParams = {
        ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
        ...(selectedClassId !== 'ALL' ? { classId: selectedClassId } : {}),
        ...(selectedSectionId !== 'ALL' ? { sectionId: selectedSectionId } : {}),
      };

      const [res, statsRes] = await Promise.all([
        api.get('/students', { params }),
        api.get('/students/stats', { params: statsParams })
      ]);
      const studentList = getResponseList(res);
      setStudents(studentList);
      
      const resData = res.data;
      if (resData) {
        if (typeof resData.total === 'number') {
          setTotal(resData.total);
          setTotalPages(resData.totalPages || 1);
        } else if (resData.data && typeof resData.data.total === 'number') {
          setTotal(resData.data.total);
          setTotalPages(resData.data.totalPages || 1);
        } else {
          setTotal(studentList.length);
          setTotalPages(1);
        }
      }
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function fetchInstitutes() {
      if (!isPlatformSuperAdmin) {
        setInstitutes([]);
        return;
      }
      try {
        const res = await api.get('/institutes', { params: { perPage: 200 } });
        if (mounted) setInstitutes(getResponseList(res));
      } catch (error) {
        console.error(error);
        if (mounted) setInstitutes([]);
      }
    }

    fetchInstitutes();
    return () => {
      mounted = false;
    };
  }, [isPlatformSuperAdmin]);

  useEffect(() => {
    let mounted = true;

    async function fetchClasses() {
      if (isPlatformSuperAdmin && selectedInstituteId === 'ALL') {
        setClasses([]);
        setSelectedClassId('ALL');
        setSelectedSectionId('ALL');
        return;
      }
      try {
        const res = await api.get('/academic/classes', {
          params: isPlatformSuperAdmin ? { instituteId: selectedInstituteId } : undefined,
        });
        if (mounted) setClasses(getResponseList(res));
      } catch (error) {
        console.error(error);
        if (mounted) setClasses([]);
      }
    }

    fetchClasses();
    return () => {
      mounted = false;
    };
  }, [isPlatformSuperAdmin, selectedInstituteId]);

  useLiveRefresh(fetchStudents, [page, limit, searchQuery, selectedInstituteId, selectedClassId, selectedSectionId], 15000);

  const handleAddClick = () => {
    navigate('/school/admin/students/new');
  };

  const handleEditClick = (student) => {
    navigate(`/school/admin/students/${student.id}/edit`);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select a file to import');
      return;
    }
    setImportError('');
    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const records = parseCsv(text);
        if (records.length === 0) {
          throw new Error('The uploaded file is empty or missing data rows');
        }

        const response = await api.post('/students/bulk-import', { records });
        const result = response.data?.data ?? response.data;
        setImportResult(result);
        
        if (result.importedCount > 0) {
          toast.success(`Successfully imported ${result.importedCount} student(s)`);
          await fetchStudents();
          notifyDataChanged('students');
        }
        if (result.failedCount > 0) {
          toast.error(`Failed to import ${result.failedCount} student(s)`);
        } else {
          setIsImportModalOpen(false);
          setImportFile(null);
        }
      } catch (err) {
        console.error(err);
        setImportError(err.message || 'Failed to import records');
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
      setImporting(false);
    };
    reader.readAsText(importFile);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      ['Name', 'Email', 'Password', 'Enrollment No', 'Roll No', 'Class', 'Section', 'Date of Birth', 'Gender', 'Blood Group', 'Father Name', 'Mother Name', 'Parent Phone', 'Parent Email', 'Address', 'City', 'State', 'Pin Code'],
      ['John Doe', 'john.doe@example.com', 'password123', 'ENR001', '10', 'Class 10', 'A', '2010-05-15', 'Male', 'O+', 'Robert Doe', 'Mary Doe', '9876543210', 'parent@example.com', '123 Main St', 'Springfield', 'Illinois', '62701']
    ];
    downloadCsv('student-import-template.csv', headers);
  };

  const kpis = useMemo(() => {
    return {
      total: stats.totalStudents,
      presentToday: stats.presentToday,
      absentToday: stats.absentToday,
      newThisMonth: stats.newThisMonth,
    };
  }, [stats]);

  const selectedClass = useMemo(
    () => classes.find((cls) => String(cls.id) === String(selectedClassId)),
    [classes, selectedClassId],
  );

  const sectionOptions = useMemo(() => normalizeSections(selectedClass?.sections), [selectedClass]);

  const handleClassFilterChange = (value) => {
    setSelectedClassId(value);
    setSelectedSectionId('ALL');
    setPage(1);
  };

  const handleInstituteFilterChange = (value) => {
    setSelectedInstituteId(value);
    setSelectedClassId('ALL');
    setSelectedSectionId('ALL');
    setPage(1);
  };

  const handleSectionFilterChange = (value) => {
    setSelectedSectionId(value);
    setPage(1);
  };

  const clearStudentFilters = () => {
    setStatusFilter('ALL');
    setSelectedYear('ALL');
    setSelectedInstituteId('ALL');
    setSelectedClassId('ALL');
    setSelectedSectionId('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        if (statusFilter === 'ACTIVE') return Boolean(s.isActive);
        if (statusFilter === 'INACTIVE') return !Boolean(s.isActive);
        return true;
      })
      .filter((s) => {
        const matchesYear =
          selectedYear === 'ALL'
            ? true
            : (s.createdAt ? new Date(s.createdAt).getFullYear().toString() === selectedYear : false);
        return matchesYear;
      });
  }, [statusFilter, students, selectedYear]);

  // Selection is scoped to what's currently visible, same as StudentPromotion.jsx's
  // pattern — clear it whenever the underlying list changes so stale ids (from a
  // page/filter the admin has since left) can't ride along into a bulk send.
  useEffect(() => {
    setSelectedIds([]);
  }, [page, statusFilter, selectedYear, selectedClassId, selectedSectionId, searchQuery]);

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleAll = () => setSelectedIds(allSelected ? [] : filtered.map((s) => s.id));
  const toggleStudent = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const selectedStudents = useMemo(
    () => filtered.filter((s) => selectedIds.includes(s.id)),
    [filtered, selectedIds],
  );
  const selectedWithoutParentEmail = selectedStudents.filter((s) => !s.studentProfile?.parentEmail).length;
  const selectedAlreadySent = selectedStudents.filter((s) => s.studentProfile?.credentialsSentAt).length;

  const handleBulkSendCredentials = async () => {
    setSendingCreds(true);
    try {
      const res = await api.post('/students/bulk-send-credentials', {
        studentIds: selectedIds,
        skipAlreadySent: !resendAlreadySent,
      });
      const data = res.data?.data || res.data || {};
      setSendCredsResult(data);
      if (data.failedCount > 0) {
        toast.warning(`Sent to ${data.sentCount} parent(s) — ${data.failedCount} failed, see details below.`);
      } else {
        toast.success(
          `Sent to ${data.sentCount} parent(s)${data.skippedCount ? ` · ${data.skippedCount} already had credentials` : ''}.`
        );
      }
      setSelectedIds([]);
      await fetchStudents();
    } catch (err) {
      handleApiError(err, 'Failed to send parent credentials');
    } finally {
      setSendingCreds(false);
    }
  };

  const selectedStudentAlreadySent = selectedStudents.filter((s) => s.studentProfile?.studentCredentialsSentAt).length;
  const selectedWithoutEmail = selectedStudents.filter((s) => !s.email).length;

  const handleBulkSendStudentCredentials = async () => {
    setSendingStudentCreds(true);
    try {
      const res = await api.post('/students/bulk-send-student-credentials', {
        studentIds: selectedIds,
        channel: studentCredsChannel,
        skipAlreadySent: !resendStudentAlreadySent,
      });
      const data = res.data?.data || res.data || {};
      setSendStudentCredsResult(data);
      if (data.channel === 'slip') {
        if (data.pdfBase64) {
          const bytes = Uint8Array.from(window.atob(data.pdfBase64), (c) => c.charCodeAt(0));
          const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
          const a = document.createElement('a');
          a.href = url;
          a.download = `credential-slips-${data.sentCount}-students.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Downloaded a combined slip for ${data.sentCount} student(s).`);
        } else {
          toast.warning('No slips were generated — everyone selected was skipped.');
        }
      } else if (data.failedCount > 0) {
        toast.warning(`Sent to ${data.sentCount} student(s) — ${data.failedCount} failed, see details below.`);
      } else {
        toast.success(
          `Sent to ${data.sentCount} student(s)${data.skippedCount ? ` · ${data.skippedCount} already had credentials` : ''}.`
        );
      }
      setSelectedIds([]);
      await fetchStudents();
    } catch (err) {
      handleApiError(err, 'Failed to send student credentials');
    } finally {
      setSendingStudentCreds(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Student Name', 'Enrollment No.', 'Class/Section', 'Status'],
      ...filtered.map((s) => [
        s.name || '-',
        s.studentProfile?.enrollmentNo || '-',
        s.studentProfile?.section
          ? `${s.studentProfile.section.class?.name || '-'} / ${s.studentProfile.section.name || '-'}`
          : '-',
        s.isActive ? 'Active' : 'Inactive',
      ]),
    ];
    downloadCsv('eddva-students.csv', rows);
  };

  if (loading) {
    return (
      <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">Students</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage student profiles and enrollment.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Link
            to="/school/admin/student-promotion"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-sm sm:shadow-md transition hover:bg-slate-50 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowUpRight className="size-4 sm:size-5 text-indigo-600" />
            <span>Promotion</span>
          </Link>
          <button
            onClick={() => {
              setImportFile(null);
              setImportError('');
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-sm sm:shadow-md transition hover:bg-slate-50 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="size-4 sm:size-5 text-blue-600" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md sm:shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
          >
            <Plus className="size-4 sm:size-5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
          <p className="text-sm font-bold text-blue-900 dark:text-sky-200">
            {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-xl px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:text-sky-300 dark:hover:bg-blue-900/30"
            >
              Clear
            </button>
            <button
              onClick={() => {
                setResendAlreadySent(false);
                setSendCredsResult(null);
                setIsSendCredsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.99]"
            >
              <Mail className="h-4 w-4" />
              <span>Send Parent Credentials</span>
            </button>
            <button
              onClick={() => {
                setResendStudentAlreadySent(false);
                setSendStudentCredsResult(null);
                setIsSendStudentCredsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-[0.99]"
            >
              <KeyRound className="h-4 w-4" />
              <span>Send Student Credentials</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {[
          {
            title: 'Total Students',
            value: kpis.total,
            subtitle: 'Enrolled students',
            tone: 'from-blue-600 to-sky-500',
            iconBg: 'bg-blue-100 dark:bg-blue-500/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            Icon: GraduationCap,
          },
          {
            title: 'Present Today',
            value: kpis.presentToday,
            subtitle: 'Attendance today',
            tone: 'from-emerald-600 to-teal-500',
            iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            Icon: CheckCircle2,
          },
          {
            title: 'New This Month',
            value: kpis.newThisMonth,
            subtitle: 'Recently added',
            tone: 'from-violet-600 to-indigo-500',
            iconBg: 'bg-violet-100 dark:bg-violet-500/20',
            iconColor: 'text-violet-600 dark:text-violet-400',
            Icon: UserPlus,
          },
          {
            title: 'Absent Today',
            value: kpis.absentToday,
            subtitle: 'Absent today',
            tone: 'from-rose-600 to-orange-500',
            iconBg: 'bg-rose-100 dark:bg-rose-500/20',
            iconColor: 'text-rose-600 dark:text-rose-400',
            Icon: XCircle,
          },
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.03 * idx }}
            className="glass-premium rounded-2xl p-3 sm:p-4"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{card.title}</p>
                <p className="mt-1 sm:mt-2 font-display text-xl sm:text-3xl font-bold text-slate-950 dark:text-white">
                  {formatNumber(card.value)}
                </p>
                <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{card.subtitle}</p>
              </div>
              <div className={`flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-2xl ${card.iconBg}`}>
                <card.Icon className={`size-4 sm:size-5 ${card.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 glass-premium rounded-2xl">
        <div className="relative z-20 border-b border-[rgba(37,99,235,0.10)] bg-white/60 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40">
          {/* ── Search + all filters inline, no hide/show toggle ── */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search students…"
                className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-1.5 pl-8 pr-9 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              <VoiceSearchButton
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onResult={(transcript) => { setSearchQuery(transcript); setPage(1); }}
              />
            </div>

            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              className="w-36 shrink-0"
              triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />

            {isPlatformSuperAdmin && (
              <CustomSelect
                value={selectedInstituteId}
                onChange={handleInstituteFilterChange}
                options={[
                  { value: "ALL", label: "All schools" },
                  ...institutes.map((institute) => ({ value: institute.id, label: institute.name })),
                ]}
                className="w-40 shrink-0"
                triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              />
            )}

            <CustomSelect
              value={selectedClassId}
              onChange={handleClassFilterChange}
              options={[
                { value: "ALL", label: isPlatformSuperAdmin && selectedInstituteId === 'ALL' ? 'Select school first' : 'All classes' },
                ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
              ]}
              disabled={isPlatformSuperAdmin && selectedInstituteId === 'ALL'}
              className="w-36 shrink-0"
              triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />

            <CustomSelect
              value={selectedSectionId}
              onChange={handleSectionFilterChange}
              options={[
                { value: "ALL", label: selectedClassId === 'ALL' ? 'Select class first' : 'All sections' },
                ...sectionOptions.map((section) => ({ value: section.id, label: `Section ${section.name}` })),
              ]}
              disabled={selectedClassId === 'ALL' || (isPlatformSuperAdmin && selectedInstituteId === 'ALL')}
              className="w-36 shrink-0"
              triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />

            <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <Calendar className="size-3.5 text-slate-400" />
              <CustomSelect
                value={selectedYear}
                onChange={setSelectedYear}
                options={years.map((y) => ({ value: y, label: y }))}
                className="w-24"
                triggerClassName="flex size-full items-center justify-between gap-1 px-1.5 py-1 text-xs font-semibold text-slate-700 border-none bg-transparent"
              />
            </div>

            {(statusFilter !== 'ALL' || selectedClassId !== 'ALL' || selectedSectionId !== 'ALL' || selectedYear !== 'ALL' || (isPlatformSuperAdmin && selectedInstituteId !== 'ALL')) && (
              <button
                type="button"
                onClick={clearStudentFilters}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-rose-200/80 bg-rose-50/50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100/60 transition dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
              >
                <X className="size-3.5" />
                <span>Clear</span>
              </button>
            )}

            {/* Right Action Badges & Buttons */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-slate-50/80 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Users className="size-3.5 text-blue-500" />
                <span>{formatNumber(filtered.length)} results</span>
              </div>

              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <Download className="size-3.5 text-slate-500" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto rounded-b-2xl overflow-hidden">
          <Table className="min-w-[980px] w-full text-left text-sm">
            <TableHeader className="bg-slate-50/50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="h-auto w-10 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider sticky left-0 z-20 bg-slate-50 dark:bg-slate-850 shadow-sm text-slate-500 dark:text-slate-400">Student Name</TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enrollment No.</TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Class/Section</TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800 [&_tr]:border-b-0">
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((student) => (
                  <TableRow key={student.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                    <TableCell className="p-4 px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </TableCell>
                    <TableCell className="p-4 px-5 py-4 sticky left-0 z-20 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-4">
                        <Avatar className="size-11 shrink-0 rounded-2xl border-2 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                          <AvatarImage src={student.profileImage} alt={student.name} className="object-cover" />
                          <AvatarFallback className="rounded-2xl bg-blue-600/10 text-[13px] font-bold tracking-tight text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                            {(student.name || 'S').slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link to={`/school/admin/students/${student.id}`} className="truncate text-sm font-bold tracking-tight text-slate-900 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400 block">
                            {student.name}
                          </Link>
                          <p className="truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">{student.email || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{student.studentProfile?.enrollmentNo || '-'}</TableCell>
                    <TableCell className="p-4 px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      {student.studentProfile?.section
                        ? (student.studentProfile.section.class?.name?.toLowerCase().startsWith('class')
                            ? `${student.studentProfile.section.class.name} / ${student.studentProfile.section.name}`
                            : `Class ${student.studentProfile.section.class?.name || ''} / ${student.studentProfile.section.name}`)
                        : '-'}
                    </TableCell>
                    <TableCell className="p-4 px-5 py-4">
                      <button
                        onClick={async () => {
                          try {
                            const newActive = !student.isActive;
                            await api.put(`/students/${student.id}`, { name: student.name, isActive: newActive });
                            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isActive: newActive } : s));
                            toast.success(`Student ${newActive ? 'activated' : 'deactivated'} successfully`);
                          } catch (err) {
                            handleApiError(err, 'Failed to toggle status');
                          }
                        }}
                        className="flex items-center gap-1.5 outline-none group cursor-pointer"
                        title="Click to toggle status"
                      >
                        <div className={cn(
                          "relative w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 border",
                          student.isActive 
                            ? "bg-emerald-500 border-emerald-600" 
                            : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                        )}>
                          <div className={cn(
                            "size-3.5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                            student.isActive ? "translate-x-4" : "translate-x-0"
                          )} />
                        </div>
                        <span className={cn(
                          "text-[11px] font-bold tracking-tight",
                          student.isActive ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="p-4 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/school/admin/students/${student.id}`}
                          className="group relative flex size-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Eye className="size-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                        </Link>
                        <button
                          onClick={() => handleEditClick(student)}
                          className="group relative flex size-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="size-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Edit</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl overflow-hidden border border-t-0 border-slate-100 dark:border-slate-800">
          {filtered.length > 0 && (
            <button
              onClick={toggleAll}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold text-blue-600 dark:text-sky-400"
            >
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">
              No students found.
            </div>
          ) : (
            filtered.map((student) => (
              <div key={student.id} className="p-4 space-y-3 hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                                    <Avatar className="size-11 shrink-0 rounded-2xl border-2 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                    <AvatarImage src={student.profileImage} alt={student.name} className="object-cover" />
                    <AvatarFallback className="rounded-2xl bg-blue-600/10 text-[13px] font-bold tracking-tight text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                      {(student.name || 'S').slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Link to={`/school/admin/students/${student.id}`} className="truncate text-sm font-bold tracking-tight text-slate-900 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400 block">
                      {student.name}
                    </Link>
                    <p className="truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">{student.email || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-black">Enrollment No.</span>
                    <span className="font-bold">{student.studentProfile?.enrollmentNo || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-black">Class/Section</span>
                    <span className="font-bold">
                      {student.studentProfile?.section
                        ? `${student.studentProfile.section.class.name} / ${student.studentProfile.section.name}`
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-black">Status</span>
                    <button
                      onClick={async () => {
                        try {
                          const newActive = !student.isActive;
                          await api.put(`/students/${student.id}`, { name: student.name, isActive: newActive });
                          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isActive: newActive } : s));
                          toast.success(`Student ${newActive ? 'activated' : 'deactivated'} successfully`);
                        } catch (err) {
                          handleApiError(err, 'Failed to toggle status');
                        }
                      }}
                      className="flex items-center gap-1.5 outline-none group cursor-pointer mt-0.5"
                      title="Click to toggle status"
                    >
                      <div className={cn(
                        "relative w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 border",
                        student.isActive 
                          ? "bg-emerald-500 border-emerald-600" 
                          : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                      )}>
                        <div className={cn(
                          "size-3.5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                          student.isActive ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                      <span className={cn(
                        "text-[11px] font-bold tracking-tight",
                        student.isActive ? "text-emerald-600" : "text-slate-400"
                      )}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-50 dark:border-slate-800/40">
                  <Link
                    to={`/school/admin/students/${student.id}`}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 text-xs font-bold"
                  >
                    <Eye className="size-3.5" />
                    <span>View</span>
                  </Link>
                  <button
                    onClick={() => handleEditClick(student)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 text-xs font-bold"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
          <DataTablePagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        title="Bulk Import Students"
        onClose={() => setIsImportModalOpen(false)}
        size="lg"
      >
        <div className="space-y-6 p-1">
          <div className="rounded-xl bg-blue-50/50 dark:bg-slate-800/30 border border-blue-100 dark:border-slate-800 p-4">
            <h4 className="text-sm font-bold text-blue-900 dark:text-sky-300">Instructions:</h4>
            <ul className="mt-2 list-disc list-inside text-xs text-blue-800/80 dark:text-slate-400 space-y-1">
              <li>Download the CSV template using the button below.</li>
              <li>Provide columns: <b>Name, Email, Password</b> (Required).</li>
              <li>Optional columns: <b>Enrollment No, Roll No, Class, Section, DOB, Gender, Blood Group, Father Name, Mother Name, Parent Phone, Parent Email, Address, City, State, Pin Code</b>.</li>
              <li>Ensure the Class and Section match existing names in Academics.</li>
            </ul>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Download className="size-3.5" />
              Download CSV Template
            </button>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select CSV File</label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-colors p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 size-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-sky-400">
                    <Download className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {importFile ? importFile.name : 'Drag & drop your CSV file here, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-400">Supported format: .csv</p>
                </div>
              </div>
            </div>

            {importError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/50 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-emerald-600">Imported: {importResult.importedCount}</span>
                  <span className="text-rose-600">Failed: {importResult.failedCount}</span>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Row Failures:</h5>
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="p-2 flex justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                          <span className="font-semibold text-slate-500">Row {err.row} ({err.email}):</span>
                          <span className="text-rose-600 dark:text-rose-400 font-medium text-right">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={importing || !importFile}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importing && <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Import Students
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Bulk Send Parent Credentials Modal */}
      <Modal
        isOpen={isSendCredsModalOpen}
        title="Send Parent Credentials"
        onClose={() => { if (!sendingCreds) setIsSendCredsModalOpen(false); }}
        size="lg"
      >
        <div className="space-y-5 p-1">
          {!sendCredsResult ? (
            <>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm font-semibold text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-sky-200">
                Send login credentials to the parents of <b>{selectedIds.length}</b> selected student{selectedIds.length !== 1 ? 's' : ''}.
                Each parent gets a new temporary password by email.
              </div>

              {selectedWithoutParentEmail > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{selectedWithoutParentEmail} selected student{selectedWithoutParentEmail !== 1 ? 's have' : ' has'} no parent email on file and will be skipped.</span>
                </div>
              )}

              {selectedAlreadySent > 0 && (
                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={resendAlreadySent}
                    onChange={(e) => setResendAlreadySent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    {selectedAlreadySent} selected student{selectedAlreadySent !== 1 ? 's' : ''} already {selectedAlreadySent !== 1 ? 'have' : 'has'} credentials sent.
                    {' '}Check this to resend (generates a new password) instead of skipping them.
                  </span>
                </label>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSendCredsModalOpen(false)}
                  disabled={sendingCreds}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSendCredentials}
                  disabled={sendingCreds || selectedIds.length === 0}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingCreds ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Credentials
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{sendCredsResult.sentCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Sent</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xl font-black text-slate-600 dark:text-slate-300">{sendCredsResult.skippedCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Skipped</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
                  <p className="text-xl font-black text-rose-700 dark:text-rose-400">{sendCredsResult.failedCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500">Failed</p>
                </div>
              </div>

              {(sendCredsResult.results || []).some((r) => r.status !== 'sent') && (
                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800 p-2">
                  {(sendCredsResult.results || [])
                    .filter((r) => r.status !== 'sent')
                    .map((r) => (
                      <div
                        key={r.studentId}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900"
                      >
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {filtered.find((s) => s.id === r.studentId)?.name || r.studentId}
                        </span>
                        <span className={cn(
                          'font-bold',
                          r.status === 'failed' ? 'text-rose-600' : 'text-slate-400'
                        )}>
                          {r.status === 'skipped' && r.reason === 'already_sent' ? 'Already sent' : (r.reason || r.status)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsSendCredsModalOpen(false)}
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Done
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Bulk Send Student Credentials Modal (student's own login, 3 channels) */}
      <Modal
        isOpen={isSendStudentCredsModalOpen}
        title="Send Student Credentials"
        onClose={() => { if (!sendingStudentCreds) setIsSendStudentCredsModalOpen(false); }}
        size="lg"
      >
        <div className="space-y-5 p-1">
          {!sendStudentCredsResult ? (
            <>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm font-semibold text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200">
                Deliver login details (a fresh temporary password) for <b>{selectedIds.length}</b> selected student{selectedIds.length !== 1 ? 's' : ''}
                to their own account.
              </div>

              <div className="space-y-2">
                {[
                  { value: 'student_email', label: "Student's Email", hint: 'Emails the login details directly to the student.', Icon: Mail },
                  { value: 'parent_email', label: "Parent's Email", hint: "Emails the student's login details to the parent, to pass along.", Icon: Mail },
                  { value: 'slip', label: 'Printable Slip', hint: 'Generates one combined PDF (one page per student) to print and hand out.', Icon: Printer },
                ].map(({ value, label, hint, Icon }) => (
                  <label
                    key={value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                      studentCredsChannel === value
                        ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-950/20'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                    )}
                  >
                    <input
                      type="radio"
                      name="studentCredsChannel"
                      value={value}
                      checked={studentCredsChannel === value}
                      onChange={() => setStudentCredsChannel(value)}
                      className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
                      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              {studentCredsChannel === 'student_email' && selectedWithoutEmail > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{selectedWithoutEmail} selected student{selectedWithoutEmail !== 1 ? 's have' : ' has'} no email on file and will be skipped.</span>
                </div>
              )}

              {studentCredsChannel === 'parent_email' && selectedWithoutParentEmail > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{selectedWithoutParentEmail} selected student{selectedWithoutParentEmail !== 1 ? 's have' : ' has'} no parent email on file and will be skipped.</span>
                </div>
              )}

              {selectedStudentAlreadySent > 0 && (
                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={resendStudentAlreadySent}
                    onChange={(e) => setResendStudentAlreadySent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    {selectedStudentAlreadySent} selected student{selectedStudentAlreadySent !== 1 ? 's' : ''} already {selectedStudentAlreadySent !== 1 ? 'have' : 'has'} student credentials sent.
                    {' '}Check this to resend (generates a new password) instead of skipping them.
                  </span>
                </label>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSendStudentCredsModalOpen(false)}
                  disabled={sendingStudentCreds}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSendStudentCredentials}
                  disabled={sendingStudentCreds || selectedIds.length === 0}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {sendingStudentCreds ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {studentCredsChannel === 'slip' ? 'Generating…' : 'Sending…'}
                    </>
                  ) : (
                    <>
                      {studentCredsChannel === 'slip' ? <Printer className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      {studentCredsChannel === 'slip' ? 'Generate Slip(s)' : 'Send Credentials'}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {sendStudentCredsResult.channel === 'slip' && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>The combined PDF has been downloaded to your device.</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{sendStudentCredsResult.sentCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
                    {sendStudentCredsResult.channel === 'slip' ? 'Included' : 'Sent'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xl font-black text-slate-600 dark:text-slate-300">{sendStudentCredsResult.skippedCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Skipped</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
                  <p className="text-xl font-black text-rose-700 dark:text-rose-400">{sendStudentCredsResult.failedCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500">Failed</p>
                </div>
              </div>

              {(sendStudentCredsResult.results || []).some((r) => r.status !== 'sent') && (
                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800 p-2">
                  {(sendStudentCredsResult.results || [])
                    .filter((r) => r.status !== 'sent')
                    .map((r) => (
                      <div
                        key={r.studentId}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900"
                      >
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {filtered.find((s) => s.id === r.studentId)?.name || r.studentId}
                        </span>
                        <span className={cn(
                          'font-bold',
                          r.status === 'failed' ? 'text-rose-600' : 'text-slate-400'
                        )}>
                          {r.status === 'skipped' && r.reason === 'already_sent' ? 'Already sent' : (r.reason || r.status)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsSendStudentCredsModalOpen(false)}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
