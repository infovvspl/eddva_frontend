import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UserCheck, UserX, Clock, Calendar, TrendingUp, Plus, Eye, Edit2, 
  Download, RefreshCw, CheckCircle2, AlertCircle, Sparkles, 
  Users, X, Info, ChevronRight, Filter, Search, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/context/SchoolAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import Button from '@/components/school/Button';
import Badge from '@/components/school/Badge';
import GlassCard from '@/components/school/GlassCard';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
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

const DEFAULT_PERIODS = [
  { value: 'Period 1 (08:00 - 08:45)', label: 'Period 1 (08:00 - 08:45)' },
  { value: 'Period 2 (08:45 - 09:30)', label: 'Period 2 (08:45 - 09:30)' },
  { value: 'Period 3 (09:30 - 10:15)', label: 'Period 3 (09:30 - 10:15)' },
  { value: 'Period 4 (10:15 - 11:00)', label: 'Period 4 (10:15 - 11:00)' },
  { value: 'Period 5 (11:00 - 11:45)', label: 'Period 5 (11:00 - 11:45)' },
  { value: 'Period 6 (11:45 - 12:30)', label: 'Period 6 (11:45 - 12:30)' },
  { value: 'Period 7 (12:30 - 13:15)', label: 'Period 7 (12:30 - 13:15)' },
  { value: 'Period 8 (13:15 - 14:00)', label: 'Period 8 (13:15 - 14:00)' },
];

  // Fetch periods dynamically based on timetable
  useEffect(() => {
    const fetchPeriods = async () => {
      if (!selectedClass || !selectedSection || !date) {
         setPeriods(DEFAULT_PERIODS);
         if (!editingSessionId && !selectedPeriod) setSelectedPeriod(DEFAULT_PERIODS[0].value);
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
           finalOptions = DEFAULT_PERIODS;
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
        setPeriods(DEFAULT_PERIODS);
        if (!selectedPeriod) setSelectedPeriod(DEFAULT_PERIODS[0].value);
      }
    };
    fetchPeriods();
  }, [selectedClass, selectedSection, selectedSubject, date, user, editingSessionId]);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Teacher Attendance Dashboard <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-medium">
            Manage daily roll calls, track student presence, and review logs instantly.
          </p>
        </div>
        <button 
          onClick={() => {
            fetchDashboardStats();
            if (activeTab === 'history') fetchHistory();
            toast.success('Attendance data refreshed');
          }}
          className="flex items-center gap-2 self-start md:self-auto px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Stats
        </button>
      </div>



      {/* Tabs Menu Navigation Bar */}
      <div className="tabs-navigation-bar flex gap-2 border-b border-slate-100 dark:border-slate-800 mb-6 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab('entry')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'entry'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
          }`}
        >
          <Plus className="h-4 w-4" />
          Offline Attendance Entry
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Attendance History
        </button>
      </div>

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
            {/* Header Control Form */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                <Filter className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Attendance Selector</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {/* Date Picker */}
                <div>
                  <InputField 
                    label="Attendance Date" 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    disabled={editingSessionId !== null}
                  />
                </div>

                {/* Class Selection */}
                <div>
                  <SelectField
                    label="Class"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    options={classes.map(c => ({ value: c.id, label: c.name }))}
                    disabled={editingSessionId !== null}
                  />
                </div>

                {/* Section Selection */}
                <div>
                  <SelectField
                    label="Section"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    options={sections.map(s => ({ value: s.id, label: s.name }))}
                    disabled={editingSessionId !== null}
                  />
                </div>

                {/* Period Selection */}
                <div>
                  <SelectField
                    label="Period"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    options={periods}
                  />
                </div>

                {/* Subject Selection */}
                <div>
                  <SelectField
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
                  <Badge variant="purple" className="flex items-center gap-1.5 py-1.5 px-3">
                    <Info className="h-3.5 w-3.5" /> Editing Session: Class {currentClassName} - {currentSectionName}
                  </Badge>
                )}
                <Button 
                  onClick={handleLoadStudents} 
                  loading={studentsLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold ml-auto"
                >
                  {editingSessionId ? 'Reset Changes' : 'Load Students'}
                </Button>
              </div>
            </GlassCard>

            {/* Attendance Sheet content */}
            {duplicateSessionId ? (
              <GlassCard className="p-8 border-2 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/10">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Attendance Already Submitted
                  </h3>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                    Attendance records have already been submitted for this session. Would you like to view or edit the existing records?
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button 
                      onClick={() => handleViewDetails(duplicateSessionId)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Attendance
                    </Button>
                    <Button 
                      onClick={() => {
                        handleEditSession(duplicateSessionId);
                        setDuplicateSessionId(null);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Attendance
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ) : students.length > 0 ? (
              <div className="flex flex-col gap-6">
                
                {/* Main Attendance Sheet (Full width) */}
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">Attendance Marking Sheet</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Toggle student presence status. Default is Present.</p>
                      </div>
                      
                      {/* Live Student Search */}
                      <div className="relative min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search student..."
                          value={markingSearch}
                          onChange={(e) => {
                            setMarkingSearch(e.target.value);
                            setMarkingPage(1);
                          }}
                          className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="quick-actions-bar flex flex-wrap gap-2 mb-4 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500 flex items-center mr-2">Quick Actions:</span>
                      <button 
                        onClick={() => handleMarkAll('present')}
                        className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 transition-all"
                      >
                        Mark All Present
                      </button>
                      <button 
                        onClick={() => handleMarkAll('absent')}
                        className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-rose-500/10 hover:bg-rose-50 hover:text-white text-rose-600 transition-all"
                      >
                        Mark All Absent
                      </button>
                      <button 
                        onClick={() => handleMarkAll('leave')}
                        className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-slate-500/10 hover:bg-slate-500 hover:text-white text-slate-600 transition-all"
                      >
                        Mark All Leave
                      </button>
                      <button 
                        onClick={handleResetAttendance}
                        className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 transition-all flex items-center gap-1.5 ml-auto"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            <th className="py-3 px-3 w-[100px]">Roll No</th>
                            <th className="py-3 px-3">Student Name</th>
                            <th className="py-3 px-3 text-right">Attendance Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {displayedStudents.map((s, index) => {
                              const currentStatus = attendanceData[s.id] || 'present';
                              return (
                                <motion.tr 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  key={s.id}
                                  className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                                >
                                  {/* Roll No */}
                                  <td className="py-4 px-3 text-sm font-bold text-slate-400">
                                    {s.roll_no ? String(s.roll_no).padStart(2, '0') : '--'}
                                  </td>
                                  
                                  {/* Name */}
                                  <td className="py-4 px-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {s.name}
                                    <div className="mt-1 flex items-center gap-2">
                                      <input
                                        type="text"
                                        placeholder="Add remarks..."
                                        value={remarksData[s.id] || ''}
                                        onChange={(e) => setRemarksData({ ...remarksData, [s.id]: e.target.value })}
                                        className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 text-xs text-slate-400 focus:text-slate-700 outline-none w-full max-w-[250px] transition-all py-1"
                                      />
                                    </div>
                                  </td>

                                  {/* Status Toggles */}
                                  <td className="py-4 px-3 text-right">
                                    <div className="inline-flex gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                      {/* Present Button */}
                                      <button
                                        onClick={() => setAttendanceData({ ...attendanceData, [s.id]: 'present' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                          currentStatus === 'present'
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                                        }`}
                                      >
                                        🟢 Present
                                      </button>
                                      
                                      {/* Absent Button */}
                                      <button
                                        onClick={() => setAttendanceData({ ...attendanceData, [s.id]: 'absent' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                          currentStatus === 'absent'
                                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                                        }`}
                                      >
                                        🔴 Absent
                                      </button>

                                      {/* Late Button */}
                                      <button
                                        onClick={() => setAttendanceData({ ...attendanceData, [s.id]: 'late' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                          currentStatus === 'late'
                                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                                        }`}
                                      >
                                        🟡 Late
                                      </button>

                                      {/* Leave Button */}
                                      <button
                                        onClick={() => setAttendanceData({ ...attendanceData, [s.id]: 'leave' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                          currentStatus === 'leave'
                                            ? 'bg-slate-400 dark:bg-slate-600 text-white shadow-md'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                                        }`}
                                      >
                                        ⚪ Leave
                                      </button>
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                          {displayedStudents.length === 0 && (
                            <tr>
                              <td colSpan={3} className="text-center py-8 text-slate-400 text-xs font-semibold">
                                {students.length === 0 ? 'No students loaded.' : 'No students match your search.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
                  </GlassCard>

                  {/* Live Summary Card */}
                  <GlassCard className="p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Attendance Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      {/* Circular Progress Gauge */}
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="relative h-28 w-28 flex items-center justify-center">
                          <svg className="absolute w-full h-full transform -rotate-90">
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
                          <span>🟢 Present</span>
                          <span className="font-bold text-emerald-600">{liveStats.present}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span>🟡 Late Arrivals</span>
                          <span className="font-bold text-amber-500">{liveStats.late}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span>🔴 Absent</span>
                          <span className="font-bold text-rose-500">{liveStats.absent}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span>⚪ On Leave</span>
                          <span className="font-bold text-slate-500 dark:text-slate-400">{liveStats.leave}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Save Attendance Actions */}
                  <GlassCard className="p-6 shadow-sm border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Button 
                      fullWidth 
                      onClick={() => handleSaveAttendance(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 font-bold py-3 rounded-2xl shadow-lg shadow-indigo-600/10 text-white"
                    >
                      Submit Attendance
                    </Button>
                    <Button 
                      fullWidth 
                      variant="light"
                      onClick={() => handleSaveAttendance(false)}
                      className="font-bold py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                    >
                      Save Draft
                    </Button>
                    <Button 
                      fullWidth 
                      variant="light"
                      onClick={() => {
                        setStudents([]);
                        setAttendanceData({});
                        setRemarksData({});
                        setEditingSessionId(null);
                        toast.info('Marking flow cancelled');
                      }}
                      className="font-bold py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      Cancel
                    </Button>
                    </div>
                  </GlassCard>
              </div>
            ) : (
              // Empty State before loading students
              <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
                <div className="h-28 w-28 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mb-5 border border-indigo-100 dark:border-indigo-900/30 shadow-inner">
                  <Calendar className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Load Student Attendance Sheet</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm mt-2 leading-relaxed">
                  Select a date, class, and section above, then click <strong>Load Students</strong> to populate the attendance records.
                </p>
              </GlassCard>
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
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                <Filter className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Filter History Logs</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div>
                  <InputField 
                    label="Date" 
                    type="date" 
                    value={historyFilterDate} 
                    onChange={(e) => setHistoryFilterDate(e.target.value)} 
                  />
                </div>

                {/* Class Filter */}
                <div>
                  <SelectField
                    label="Class"
                    value={historyFilterClass}
                    onChange={(e) => setHistoryFilterClass(e.target.value)}
                    options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
                  />
                </div>

                {/* Section Filter */}
                <div>
                  <SelectField
                    label="Section"
                    value={historyFilterSection}
                    onChange={(e) => setHistoryFilterSection(e.target.value)}
                    options={[{ value: '', label: 'All Sections' }, ...(selectedClass ? sections : []).map(s => ({ value: s.id, label: s.name }))]}
                  />
                </div>

                {/* Subject Filter */}
                <div>
                  <SelectField
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
                  <button 
                    onClick={() => {
                      setHistoryFilterClass('');
                      setHistoryFilterSection('');
                      setHistoryFilterSubject('');
                      setHistoryFilterDate('');
                      toast.info('History filters cleared');
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </GlassCard>

            {/* History Records Table */}
            <GlassCard className="p-6">
              {historyLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : historyRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Class</th>
                        <th className="py-3 px-2">Section</th>
                        <th className="py-3 px-2">Subject</th>
                        <th className="py-3 px-2">Present</th>
                        <th className="py-3 px-2">Absent</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRecords.map((item) => (
                        <tr key={item.sessionId} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-4 px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.date}
                            <span className="block text-[9px] text-slate-400 font-medium">{item.period}</span>
                          </td>
                          <td className="py-4 px-2 text-xs font-bold text-slate-800 dark:text-slate-200">{item.className}</td>
                          <td className="py-4 px-2 text-xs font-bold text-slate-800 dark:text-slate-200">{item.sectionName}</td>
                          <td className="py-4 px-2 text-xs font-semibold text-slate-500">{item.subjectName}</td>
                          <td className="py-4 px-2 text-xs font-bold text-emerald-600">{item.present}</td>
                          <td className="py-4 px-2 text-xs font-bold text-rose-500">{item.absent}</td>
                          <td className="py-4 px-2">
                            <Badge variant={item.finalized ? 'success' : 'warning'}>
                              {item.finalized ? 'Finalized' : 'Draft'}
                            </Badge>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <div className="flex gap-1.5 justify-end">
                              {/* View Button */}
                              <button
                                onClick={() => handleViewDetails(item.sessionId)}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-600 hover:text-indigo-600 transition-all hover:-translate-y-0.5"
                                title="View Attendance"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => handleEditSession(item.sessionId)}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-600 hover:text-amber-500 transition-all hover:-translate-y-0.5"
                                title="Edit Attendance"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              
                              {/* Export PDF Button */}
                              <button
                                onClick={() => handleExportPDF(item.sessionId, item.date, item.className, item.sectionName)}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-600 hover:text-emerald-500 transition-all hover:-translate-y-0.5"
                                title="Export PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Empty state when no sessions found */
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="h-20 w-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Info className="h-10 w-10" />
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
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewing details modal */}
      <AnimatePresence>
        {viewingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">Attendance Logs</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Session details and student statuses.</p>
                </div>
                <button 
                  onClick={() => setViewingSession(null)}
                  className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Session Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 my-4 text-xs font-semibold">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Date</span>
                  <span className="text-slate-700 dark:text-slate-350">{viewingSession.session.date}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Class & Section</span>
                  <span className="text-slate-700 dark:text-slate-350">{viewingSession.session.className} - {viewingSession.session.sectionName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Period</span>
                  <span className="text-slate-700 dark:text-slate-350 truncate block" title={viewingSession.session.period}>{viewingSession.session.period || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Subject</span>
                  <span className="text-slate-700 dark:text-slate-350">{viewingSession.session.subjectName || 'General'}</span>
                </div>
              </div>

              {/* Records List Table */}
              <div className="overflow-y-auto flex-1 pr-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      <th className="py-2.5 px-2">Roll No</th>
                      <th className="py-2.5 px-2">Student</th>
                      <th className="py-2.5 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSession.records.map((r: any) => (
                      <tr key={r.studentId} className="border-b border-slate-100 dark:border-slate-800 last:border-0 py-2.5">
                        <td className="py-2.5 px-2 text-xs font-bold text-slate-400">
                          {r.rollNo ? String(r.rollNo).padStart(2, '0') : '--'}
                        </td>
                        <td className="py-2.5 px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {r.studentName}
                          {r.remarks && (
                            <span className="block text-[10px] font-medium text-slate-400 italic mt-0.5">Remarks: {r.remarks}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            r.status.toLowerCase() === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            r.status.toLowerCase() === 'absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            r.status.toLowerCase() === 'late' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                            {r.status.toLowerCase() === 'present' ? '🟢 ' :
                             r.status.toLowerCase() === 'absent' ? '🔴 ' :
                             r.status.toLowerCase() === 'late' ? '🟡 ' : '⚪ '}
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Close Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 mt-4">
                <Button 
                  onClick={() => {
                    const { session } = viewingSession;
                    handleEditSession(session.id);
                    setViewingSession(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                >
                  Edit Records
                </Button>
                <Button 
                  variant="light" 
                  onClick={() => setViewingSession(null)}
                  className="font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceSystem;
