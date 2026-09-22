import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Users, Target, ChevronLeft, ChevronRight, ArrowRight, Search, ClipboardCheck, LineChart } from 'lucide-react';
import GlassCard from '@/components/school/GlassCard';
import StatCard from '@/components/school/StatCard';
import Badge from '@/components/school/Badge';
import ProgressBar from '@/components/school/ProgressBar';
import Tabs from '@/components/school/Tabs';
import DataTable from '@/components/school/DataTable';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import api from '@/lib/api/school-client';
import './Reports.css';
import { CustomSelect } from "@/components/ui/CustomSelect";

const truthyFlag = (value: any) => value === true || value === 'true' || value === 't' || value === 1 || value === '1';

const normalizeAssignmentRow = (row: any) => {
  const classId = row?.class_id || row?.classId || '';
  const className = row?.class_name || row?.className || '';
  const sectionId = row?.section_id || row?.sectionId || '';
  const sectionName = row?.section_name || row?.sectionName || '';
  const subjectId = row?.subject_id || row?.subjectId || '';
  const subjectName = row?.subject_name || row?.subjectName || '';
  const isClassTeacher = truthyFlag(row?.is_class_teacher || row?.isClassTeacher);

  return {
    ...row,
    class_id: classId,
    class_name: className,
    section_id: sectionId,
    section_name: sectionName,
    subject_id: subjectId,
    subject_name: subjectName,
    is_class_teacher: isClassTeacher,
    classId,
    className,
    sectionId,
    sectionName,
    subjectId,
    subjectName,
    isClassTeacher,
  };
};

const mergeAssignments = (...groups: any[][]) => {
  const map = new Map<string, any>();
  groups.flat().filter(Boolean).map(normalizeAssignmentRow).forEach((row) => {
    if (!row.class_id && !row.section_id && !row.subject_id) return;
    const key = [row.class_id, row.section_id, row.subject_id || '__all__', row.is_class_teacher ? 'ct' : 'sub'].join('|');
    map.set(key, row);
  });
  return Array.from(map.values());
};

// Bands a 0-100 score into a StatCard tone + qualitative label instead of the
// card always showing a hardcoded "positive" pill regardless of the real value.
const scoreTone = (value: number): { changeType: 'positive' | 'negative' | 'neutral'; label: string } => {
  if (value >= 70) return { changeType: 'positive', label: 'On track' };
  if (value >= 40) return { changeType: 'neutral', label: 'Needs attention' };
  return { changeType: 'negative', label: 'Below target' };
};

const mapRosterStudentToReportStudent = (student: any) => {
  const profile = student.studentProfile || {};
  const section = profile.section || {};
  const classInfo = section.class || {};
  return {
    id: student.id,
    name: student.name,
    classId: classInfo.id || student.classId || null,
    sectionId: section.id || profile.sectionId || student.sectionId || null,
    className: classInfo.name || student.className || null,
    sectionName: section.name || student.sectionName || null,
    class: [classInfo.name || student.className, section.name || student.sectionName].filter(Boolean).join(' - ') || '-',
    avgScore: 0,
    attendance: 0,
    trend: 'consistent',
    weakAreas: [],
    strongAreas: [],
    subjectScores: [],
  };
};

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [performanceChartData, setPerformanceChartData] = useState<any[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [assignedRoster, setAssignedRoster] = useState<any[]>([]);
  const [classAnalytics, setClassAnalytics] = useState<any[]>([]);
  const [weaknessData, setWeaknessData] = useState<any[]>([]);
  const [scope, setScope] = useState<any>(null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<any>({
    averageScore: 0,
    passRate: 0,
    atRiskStudents: 0,
    evaluatedStudents: 0,
    totalStudents: 0,
    assessments: 0,
    days: [],
  });
  const [reportScope, setReportScope] = useState<any>(null);
  const [summary, setSummary] = useState({
    classAverage: 0,
    passRate: 0,
    atRiskStudents: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<string>('students');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  const [classPage, setClassPage] = useState(1);
  const [classPageSize, setClassPageSize] = useState(10);
  const [classSearchQuery, setClassSearchQuery] = useState('');

  // The full class/subject roster only feeds the Weakness Analysis tab's "assigned
  // students" counts, and doesn't depend on the Student Performance class/section
  // filter — so it's fetched once here instead of on every filter change.
  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const allRosterRes = await api.get('/students?limit=1000');
        const allRosterBody: any = allRosterRes.data || {};
        const allRoster = Array.isArray(allRosterBody.data)
          ? allRosterBody.data
          : Array.isArray(allRosterBody)
            ? allRosterBody
            : [];
        setAssignedRoster(allRoster.map(mapRosterStudentToReportStudent));
      } catch (rosterErr) {
        console.error('Unable to load assigned roster for reports', rosterErr);
        setAssignedRoster([]);
      }
    };
    fetchRoster();
  }, []);

  // Changing the class/section filter should always land back on page 1 of the
  // (now different) student list, not whatever page happened to still exist.
  useEffect(() => {
    setStudentPage(1);
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams();
        if (selectedClass !== 'all') params.set('classId', selectedClass);
        if (selectedSection !== 'all') params.set('sectionId', selectedSection);
        const reportUrl = params.toString() ? `/reports/class?${params.toString()}` : '/reports/class';
        const [res, dashboardRes] = await Promise.all([
          api.get(reportUrl),
          api.get('/dashboard/stats').catch(() => null),
        ]);
        const body: any = res.data || {};
        const dashboardBody: any = dashboardRes?.data || {};
        const dashboardAssignments = dashboardBody?.data?.teacherData?.assignments || dashboardBody?.teacherData?.assignments || [];
        const reportAssignments = Array.isArray(body.scope?.assignments) ? body.scope.assignments : [];
        const mergedScope = {
          ...(body.scope || {}),
          assignments: mergeAssignments(reportAssignments, Array.isArray(dashboardAssignments) ? dashboardAssignments : []),
        };
        const reportSummary = body.summary || {};
        const analytics = Array.isArray(body.data) ? body.data : [];
        let reportStudents = Array.isArray(body.students) ? body.students : [];

        if (selectedClass !== 'all') {
          const rosterParams = new URLSearchParams();
          rosterParams.set('classId', selectedClass);
          if (selectedSection !== 'all') rosterParams.set('sectionId', selectedSection);
          rosterParams.set('limit', '500');
          try {
            const rosterRes = await api.get(`/students?${rosterParams.toString()}`);
            const rosterBody: any = rosterRes.data || {};
            const rosterStudents = Array.isArray(rosterBody.data)
              ? rosterBody.data
              : Array.isArray(rosterBody)
                ? rosterBody
                : [];
            const reportByStudentId = new Map(reportStudents.map((student: any) => [String(student.id), student]));
            reportStudents = rosterStudents.map((student: any) => ({
              ...mapRosterStudentToReportStudent(student),
              ...(reportByStudentId.get(String(student.id)) || {}),
            }));
          } catch (rosterErr) {
            console.error('Unable to load roster fallback for reports', rosterErr);
          }
        }

        setPerformanceChartData(Array.isArray(body.performance) ? body.performance : []);
        setClassAnalytics(analytics);
        setStudentPerformance(reportStudents);
        setWeaknessData(Array.isArray(body.weaknesses) ? body.weaknesses : []);
        setScope(mergedScope);
        setWeeklyAnalysis({
          averageScore: Math.round(body.weeklyAnalysis?.averageScore || 0),
          passRate: Math.round(body.weeklyAnalysis?.passRate || 0),
          atRiskStudents: Math.round(body.weeklyAnalysis?.atRiskStudents || 0),
          evaluatedStudents: Math.round(body.weeklyAnalysis?.evaluatedStudents || 0),
          totalStudents: Math.round(body.weeklyAnalysis?.totalStudents || 0),
          assessments: Math.round(body.weeklyAnalysis?.assessments || 0),
          days: Array.isArray(body.weeklyAnalysis?.days) ? body.weeklyAnalysis.days : [],
        });
        setReportScope(mergedScope);
        setSummary({
          classAverage: Math.round(reportSummary.classAverage || analytics[0]?.avgScore || 0),
          passRate: Math.round(reportSummary.passRate || analytics[0]?.passRate || 0),
          atRiskStudents: reportStudents.filter((s: any) => s.weakAreas && s.weakAreas.length > 0).length,
          totalStudents: Math.round(reportSummary.totalStudents || reportStudents.length || 0),
        });
      } catch (err: any) {
        console.error('Error fetching reports:', err);
        setError('Unable to load reports right now. Please try again in a moment.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [selectedClass, selectedSection]);

  const classes = useMemo(() => {
    const map = new Map<string, string>();
    const assignments = Array.isArray(reportScope?.assignments) ? reportScope.assignments : [];
    
    if (assignments.length > 0) {
      assignments.forEach((item: any) => {
        const classId = item.class_id || item.classId;
        const className = item.class_name || item.className;
        if (classId && className) {
          map.set(String(classId), className);
        }
      });
    } else {
      studentPerformance.forEach((student) => {
        if (student.classId && student.className) {
          map.set(String(student.classId), student.className);
        }
      });
    }
    
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [reportScope, studentPerformance]);

  const sections = useMemo(() => {
    // Keyed by section id (never ambiguous), but carries its class name too —
    // with "All Classes" selected, two different classes can each have a
    // "Section A", and without the class name they'd be two identical-looking
    // entries in the dropdown with no way to tell them apart.
    const map = new Map<string, { name: string; className: string }>();
    const assignments = Array.isArray(reportScope?.assignments) ? reportScope.assignments : [];

    if (assignments.length > 0) {
      assignments.forEach((item: any) => {
        const classId = item.class_id || item.classId;
        const className = item.class_name || item.className || '';
        const sectionId = item.section_id || item.sectionId;
        const sectionName = item.section_name || item.sectionName;
        if (
          sectionId &&
          sectionName &&
          (selectedClass === 'all' || String(classId) === String(selectedClass))
        ) {
          map.set(String(sectionId), { name: sectionName, className });
        }
      });
    } else {
      studentPerformance.forEach((student) => {
        if (
          student.sectionId &&
          student.sectionName &&
          (selectedClass === 'all' || String(student.classId) === String(selectedClass))
        ) {
          map.set(String(student.sectionId), { name: student.sectionName, className: student.className || '' });
        }
      });
    }

    return Array.from(map.entries())
      .map(([id, { name, className }]) => ({
        id,
        name: selectedClass === 'all' && className ? `${name} (${className})` : name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [reportScope, studentPerformance, selectedClass]);

  const filteredStudents = useMemo(() => {
    return studentPerformance.filter((student) => {
      const matchesClass = selectedClass === 'all' || String(student.classId) === String(selectedClass);
      const matchesSection = selectedSection === 'all' || String(student.sectionId) === String(selectedSection);
      const matchesSearch = studentSearchQuery.trim() === '' || 
        student.name?.toLowerCase().includes(studentSearchQuery.toLowerCase());
      return matchesClass && matchesSection && matchesSearch;
    });
  }, [studentPerformance, selectedClass, selectedSection, studentSearchQuery]);

  const totalStudentPages = Math.ceil(filteredStudents.length / studentPageSize);
  
  useEffect(() => {
    if (studentPage > totalStudentPages && totalStudentPages > 0) {
      setStudentPage(1);
    }
  }, [totalStudentPages, studentPage]);

  const startIndex = (studentPage - 1) * studentPageSize;
  const endIndex = startIndex + studentPageSize;
  const formatSectionName = (name?: string) => {
    const sectionName = String(name || '').trim();
    if (!sectionName) return '';
    return /^sec(?:tion)?\b/i.test(sectionName) ? sectionName : `Sec ${sectionName}`;
  };
  const normalizeKey = (value?: any) => String(value || '').trim().toLowerCase();
  const reportAssignments = useMemo(
    () => (Array.isArray(reportScope?.assignments) ? reportScope.assignments : []),
    [reportScope],
  );
  // Keyed by class+section+subject — the backend now scopes this per class/section
  // instead of returning one blended average per subject name across the
  // teacher's whole scope (which used to make e.g. every class's "Mathematics"
  // card show the exact same number).
  const weaknessMetricBySubject = useMemo(() => {
    const map = new Map<string, any>();
    weaknessData.forEach((item) => {
      const classId = item.classId || item.class_id;
      const sectionId = item.sectionId || item.section_id;
      const scopePrefix = `${classId || ''}|${sectionId || ''}|`;
      const subjectName = item.topic || item.subject || item.subjectName || item.subject_name;
      const subjectId = item.subjectId || item.subject_id;
      if (subjectName) map.set(scopePrefix + normalizeKey(subjectName), item);
      if (subjectId) map.set(scopePrefix + String(subjectId), item);
    });
    return map;
  }, [weaknessData]);
  const weaknessClassGroups = useMemo(() => {
    const classMap = new Map<string, any>();

    const ensureClass = (classId: string, className: string) => {
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          id: classId,
          name: className || 'Assigned class',
          sections: new Map<string, any>(),
        });
      }
      return classMap.get(classId);
    };

    const ensureSection = (classGroup: any, sectionId: string, sectionName: string) => {
      if (!classGroup.sections.has(sectionId)) {
        classGroup.sections.set(sectionId, {
          id: sectionId,
          name: sectionName || 'Section',
          isClassTeacher: false,
          subjects: new Map<string, any>(),
        });
      }
      return classGroup.sections.get(sectionId);
    };

    const addSubject = (sectionGroup: any, subjectId: string, subjectName: string) => {
      if (!subjectName) return;
      const key = subjectId || normalizeKey(subjectName);
      if (!sectionGroup.subjects.has(key)) {
        sectionGroup.subjects.set(key, { id: subjectId, name: subjectName });
      }
    };

    reportAssignments.forEach((row: any) => {
      const classId = String(row.class_id || row.classId || 'assigned-class');
      const className = row.class_name || row.className || 'Assigned class';
      const sectionId = String(row.section_id || row.sectionId || `${classId}-section`);
      const sectionName = row.section_name || row.sectionName || 'Section';
      const subjectId = String(row.subject_id || row.subjectId || '');
      const subjectName = row.subject_name || row.subjectName || '';
      const classGroup = ensureClass(classId, className);
      const sectionGroup = ensureSection(classGroup, sectionId, sectionName);

      if (truthyFlag(row.is_class_teacher || row.isClassTeacher)) {
        sectionGroup.isClassTeacher = true;
      }
      addSubject(sectionGroup, subjectId, subjectName);
    });

    if (!reportAssignments.length) {
      const fallbackClass = ensureClass('assigned-class', 'Assigned class');
      const fallbackSection = ensureSection(fallbackClass, 'assigned-section', 'Section');
      weaknessData.forEach((item) => addSubject(fallbackSection, '', item.topic || item.subject || 'General'));
    }

    return Array.from(classMap.values())
      .map((classGroup: any) => ({
        ...classGroup,
        sections: Array.from(classGroup.sections.values())
          .map((sectionGroup: any) => ({
            ...sectionGroup,
            subjects: Array.from(sectionGroup.subjects.values()).sort((a: any, b: any) => a.name.localeCompare(b.name)),
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name)),
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [reportAssignments, weaknessData]);
  const reportStudentById = useMemo(() => {
    return new Map(studentPerformance.map((student: any) => [String(student.id), student]));
  }, [studentPerformance]);
  const assignedRosterWithMetrics = useMemo(() => {
    const base = assignedRoster.length ? assignedRoster : studentPerformance;
    return base.map((student: any) => ({
      ...student,
      ...(reportStudentById.get(String(student.id)) || {}),
    }));
  }, [assignedRoster, studentPerformance, reportStudentById]);
  const getWeaknessSubjectStats = (classId: string, sectionId: string, subject: any) => {
    const subjectName = subject?.name || '';
    const scopePrefix = `${classId || ''}|${sectionId || ''}|`;
    const metric = weaknessMetricBySubject.get(scopePrefix + String(subject?.id || '')) || weaknessMetricBySubject.get(scopePrefix + normalizeKey(subjectName)) || {};
    const scopedStudents = assignedRosterWithMetrics.filter((student: any) => {
      return String(student.classId || '') === String(classId)
        && String(student.sectionId || '') === String(sectionId);
    });
    const assignedStudents = scopedStudents.length;
    const weakByStudent = scopedStudents.filter((student: any) => {
      const weakAreas = Array.isArray(student.weakAreas) ? student.weakAreas : [];
      return weakAreas.some((area: any) => {
        // Match by subject id first — the same subject can exist as more than
        // one row in `subjects` (e.g. legacy "Maths" vs "Mathematics"), so a
        // name-only match can miss a real weak area even though the student
        // count above (which doesn't filter by subject) is correct.
        if (area && typeof area === 'object') {
          if (subject?.id && area.subjectId) return String(area.subjectId) === String(subject.id);
          return normalizeKey(area.name) === normalizeKey(subjectName);
        }
        return normalizeKey(area) === normalizeKey(subjectName);
      });
    }).length;
    const metricWeakStudents = metric.weakStudents || metric.weak_students || 0;
    const atRiskStudents = scopedStudents.length > 0
      ? weakByStudent
      : Math.min(Number(metricWeakStudents) || 0, assignedStudents || Number(metricWeakStudents) || 0);
    // This card's own subject average — not each student's OVERALL avgScore
    // (that would show the exact same number on every subject card for a
    // given class/section). Only students who actually have a recorded score
    // in this specific subject count toward it.
    const studentSubjectScore = (student: any): number | null => {
      const list = Array.isArray(student.subjectScores) ? student.subjectScores : [];
      const match = list.find((item: any) => {
        if (subject?.id && item.subjectId) return String(item.subjectId) === String(subject.id);
        return normalizeKey(item.name) === normalizeKey(subjectName);
      });
      return match && Number.isFinite(Number(match.avg)) ? Number(match.avg) : null;
    };
    const scoredStudents = scopedStudents
      .map((student: any) => studentSubjectScore(student))
      .filter((score: number | null): score is number => score !== null);
    const metricAverage = Number(metric.avgScore || metric.avg_score || 0);
    // No scored students in this exact class/section AND no scoped backend
    // metric for it either means nobody has a graded result for this subject
    // yet — surface that as "no data" rather than a misleading 0%.
    const hasData = scoredStudents.length > 0 || Number.isFinite(metricAverage) && metric.avgScore !== undefined;
    const classAverage = scoredStudents.length
      ? Math.round(scoredStudents.reduce((sum: number, score: number) => sum + score, 0) / scoredStudents.length)
      : (Number.isFinite(metricAverage) ? metricAverage : 0);

    return { assignedStudents, atRiskStudents, classAverage, hasData };
  };
  const scopeAssignments = Array.isArray(scope?.assignments) ? scope.assignments : [];
  const scopeLabel = scopeAssignments.length
    ? scopeAssignments
        .map((item: any) => [item.class_name, formatSectionName(item.section_name)].filter(Boolean).join(' - '))
        .filter(Boolean)
        .filter((value: string, index: number, values: string[]) => values.indexOf(value) === index)
        .join(', ')
    : 'Assigned class';
  const weeklyDays = Array.isArray(weeklyAnalysis.days) ? weeklyAnalysis.days : [];
  const maxWeeklyTests = Math.max(1, ...weeklyDays.map((item) => item.tests || 0));
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const studentColumns = [
    {
      key: 'name',
      title: 'Student',
      render: (v: string, row: any) => (
        <span
          onClick={() => navigate(`/school/teacher/reports/student/${row.id}`)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer font-bold transition-all"
        >
          {v}
        </span>
      ),
    },
    { key: 'class', title: 'Class', render: (v: string) => <Badge variant="purple">{v}</Badge> },
    {
      key: 'avgScore', title: 'Avg Score', render: (v: number) => (
        <Badge variant={v >= 85 ? 'success' : v >= 70 ? 'info' : 'warning'}>{v}%</Badge>
      )
    },
    {
      key: 'trend', title: 'Trend', render: (v: string) => (
        <span className={`reports__trend reports__trend--${v}`}>
          {v === 'improving' ? <TrendingUp size={14} /> : v === 'declining' ? <TrendingDown size={14} /> : <BarChart3 size={14} />}
          {v}
        </span>
      )
    },
  ];

  const classColumns = [
    { key: 'class', title: 'Class', render: (v: string) => <Badge variant="purple">{v}</Badge> },
    { key: 'avgScore', title: 'Avg Score', render: (v: number) => <span className="reports__score">{v}%</span> },
    { key: 'passRate', title: 'Pass Rate', render: (v: number) => <Badge variant={v >= 90 ? 'success' : 'info'}>{v}%</Badge> },
    { key: 'topSubject', title: 'Top Subject', render: (v: string) => v || <span className="text-gray-400">—</span> },
    { key: 'weakSubject', title: 'Weak Subject', render: (v: string) => v || <span className="text-gray-400">—</span> },
    { key: 'attendance', title: 'Attendance', render: (v: number) => <span className="reports__score">{v}%</span> },
  ];

  const filteredClassAnalytics = useMemo(() => {
    if (!classSearchQuery.trim()) return classAnalytics;
    const q = classSearchQuery.trim().toLowerCase();
    return classAnalytics.filter((row) =>
      [row.class, row.topSubject, row.weakSubject].some((field) => String(field || '').toLowerCase().includes(q))
    );
  }, [classAnalytics, classSearchQuery]);

  const totalClassPages = Math.max(1, Math.ceil(filteredClassAnalytics.length / classPageSize));
  const paginatedClassAnalytics = filteredClassAnalytics.slice(
    (classPage - 1) * classPageSize,
    (classPage - 1) * classPageSize + classPageSize,
  );

  useEffect(() => {
    setClassPage(1);
  }, [classSearchQuery, classAnalytics]);

  const studentContent = (
    <div className="reports__section">
      <div className="reports__filters-row">
        <div className="reports__filter-group">
          <label htmlFor="class-filter">Class</label>
          <CustomSelect
            onChange={setSelectedClass}
            value={selectedClass}
            options={[
              { value: "all", label: "All Classes" },
              ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
            ]}
            id="class-filter"
            className="w-full"
            triggerClassName="flex h-full w-full items-center justify-between gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 shadow-sm"
          />
        </div>

        <div className="reports__filter-group">
          <label htmlFor="section-filter">Section</label>
          <CustomSelect
            onChange={setSelectedSection}
            value={selectedSection}
            options={[
              { value: "all", label: "All Sections" },
              ...sections.map((sec) => ({ value: sec.id, label: sec.name })),
            ]}
            id="section-filter"
            disabled={selectedClass === 'all' && sections.length === 0}
            className="w-full"
            triggerClassName="flex h-full w-full items-center justify-between gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 shadow-sm"
          />
        </div>

        <div className="reports__filter-group reports__filter-group--search">
          <label htmlFor="student-search">Search Student</label>
          <div className="reports__search-wrapper">
            <Search size={16} className="reports__search-icon" />
            <input
              id="student-search"
              type="text"
              placeholder="Search by name..."
              value={studentSearchQuery}
              onChange={(e) => {
                setStudentSearchQuery(e.target.value);
                setStudentPage(1);
              }}
              className="reports__filter-input"
            />
          </div>
        </div>
      </div>

      {!loading && !filteredStudents.length && (
        <div className="reports__empty">No students found matching the selected filters.</div>
      )}
      
      {filteredStudents.length > 0 && (
    <>
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <DataTable columns={studentColumns} data={paginatedStudents} />
      </div>
      
      {/* Pagination controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4 mt-4">
        <div className="text-xs font-semibold text-gray-500">
          Showing <span className="font-bold text-gray-700">{startIndex + 1}</span> to{" "}
          <span className="font-bold text-gray-700">{Math.min(endIndex, filteredStudents.length)}</span> of{" "}
          <span className="font-bold text-gray-700">{filteredStudents.length}</span> students
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Per page:</span>
            <CustomSelect
              onChange={setStudentPageSize}
              value={studentPageSize}
              options={[
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
              ]}
              className="w-full"
              triggerClassName="flex h-full w-full items-center justify-between gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700 shadow-sm"
            />
          </div>
          
          {totalStudentPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                disabled={studentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Desktop: Show all page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setStudentPage(page)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                      studentPage === page
                        ? "bg-brand-600 text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Mobile: Show Page X of Y text */}
              <span className="flex sm:hidden px-2 text-xs font-semibold text-gray-500">
                Page {studentPage} of {totalStudentPages}
              </span>
              
              <button
                type="button"
                onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                disabled={studentPage === totalStudentPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
      )}
    </div>
  );

  const weaknessContent = (
    <div className="reports__section">
      {!loading && !weaknessClassGroups.length && (
        <div className="reports__empty">No assigned class or subject data is available for weakness analysis.</div>
      )}
      {!loading && !reportAssignments.length && weaknessData.length > 0 && (
        <div className="reports__error">
          Couldn't match this data to your specific classes/sections — showing it grouped generically below. Refresh the page, or contact an admin if this persists.
        </div>
      )}
      <div className="reports__weakness-class-list">
        {weaknessClassGroups.map((classGroup: any) => (
          <GlassCard key={classGroup.id} className="reports__weakness-class-card">
            <div className="reports__weakness-class-header">
              <div>
                <span>Class</span>
                <h3>{classGroup.name}</h3>
              </div>
              <Badge variant="purple">{classGroup.sections.length} section{classGroup.sections.length === 1 ? '' : 's'}</Badge>
            </div>
            <div className="reports__weakness-section-grid">
              {classGroup.sections.map((sectionGroup: any) => (
                <div key={sectionGroup.id} className="reports__weakness-section-card">
                  <div className="reports__weakness-section-header">
                    <div>
                      <span>Section</span>
                      <h4>{formatSectionName(sectionGroup.name)}</h4>
                    </div>
                    <Badge variant={sectionGroup.isClassTeacher ? 'success' : 'info'}>
                      {sectionGroup.isClassTeacher ? 'Class teacher' : 'Assigned subjects'}
                    </Badge>
                  </div>
                  {!sectionGroup.subjects.length && (
                    <div className="reports__empty">No subjects are assigned for this section.</div>
                  )}
                  <div className="reports__weakness-grid reports__weakness-grid--nested">
                    {sectionGroup.subjects.map((subject: any) => {
                      const { assignedStudents, atRiskStudents, classAverage, hasData } = getWeaknessSubjectStats(
                        classGroup.id,
                        sectionGroup.id,
                        subject,
                      );

                      return (
                        <GlassCard
                          key={subject.id || subject.name}
                          hover
                          className="reports__weakness-card"
                          onClick={() => navigate(`/school/teacher/reports/weakness/${encodeURIComponent(subject.name)}`, {
                            state: {
                              studentPerformance,
                              classId: classGroup.id,
                              sectionId: sectionGroup.id,
                              subjectId: subject.id,
                              subjectName: subject.name,
                            },
                          })}
                        >
                          <div className="reports__weakness-header">
                            <AlertTriangle size={18} className="reports__weakness-icon" />
                            <h4>{subject.name}</h4>
                          </div>
                          <div className="reports__weakness-stats">
                            <div className="reports__weakness-stat">
                              <span className="reports__weakness-label">Assigned Students</span>
                              <span className="reports__weakness-value">{assignedStudents}</span>
                            </div>
                            <div className="reports__weakness-stat">
                              <span className="reports__weakness-label">At Risk</span>
                              <span className="reports__weakness-value reports__weakness-value--low">{atRiskStudents}</span>
                            </div>
                            <div className="reports__weakness-stat">
                              <span className="reports__weakness-label">Class Average</span>
                              <span className="reports__weakness-value">{hasData ? `${classAverage}%` : 'No data yet'}</span>
                            </div>
                          </div>
                          <ProgressBar value={hasData ? classAverage : 0} size="sm" color="var(--gradient-warm)" />
                          <div className="reports__weakness-footer">
                            <span>View struggling students</span>
                            <ArrowRight size={12} />
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const testContent = (
    <div className="reports__section">
      <div className="reports__weekly-stats">
        <GlassCard className="reports__weekly-card">
          <span className="reports__weekly-label">Weekly Average</span>
          <strong>{weeklyAnalysis.averageScore}%</strong>
        </GlassCard>
        <GlassCard className="reports__weekly-card">
          <span className="reports__weekly-label">Weekly Pass Rate</span>
          <strong>{weeklyAnalysis.passRate}%</strong>
        </GlassCard>
        <GlassCard className="reports__weekly-card">
          <span className="reports__weekly-label">Weekly At-Risk</span>
          <strong>{weeklyAnalysis.atRiskStudents}</strong>
        </GlassCard>
        <GlassCard className="reports__weekly-card">
          <span className="reports__weekly-label">Tests This Week</span>
          <strong>{weeklyAnalysis.assessments}</strong>
        </GlassCard>
      </div>
      <GlassCard>
        <h3 className="reports__chart-title">Weekly Performance</h3>
        {!loading && !weeklyDays.some((item: any) => item.avgScore > 0) && (
          <div className="reports__empty">No weekly test performance is available yet.</div>
        )}
        <div className="reports__chart">
          {weeklyDays.map((item: any) => {
            // Test count has no natural 0-100 ceiling like a score does, so it's
            // scaled against the week's own busiest day rather than a fixed
            // guess — a day with 8 tests no longer looks identical to a day with 5.
            const testCount = item.tests || 0;
            const pctOfMax = maxWeeklyTests > 0 ? Math.round((testCount / maxWeeklyTests) * 100) : 0;
            return (
              <div key={item.date || item.day} className="reports__chart-bar-wrapper">
                <div className="reports__chart-bar-group">
                  <div
                    className="reports__chart-bar reports__chart-bar--score"
                    style={{ height: `${item.avgScore || 0}%` }}
                    title={`${item.day}: ${Math.round(item.avgScore || 0)}% avg score`}
                  />
                  <div
                    className="reports__chart-bar reports__chart-bar--attendance"
                    style={{ height: `${pctOfMax}%` }}
                    title={`${item.day}: ${testCount} test${testCount === 1 ? '' : 's'}`}
                  />
                </div>
                <span className="reports__chart-label">{item.day}</span>
              </div>
            );
          })}
        </div>
        <div className="reports__chart-legend">
          <span className="reports__legend-item">
            <span className="reports__legend-dot reports__legend-dot--score" />
            Avg Score
          </span>
          <span className="reports__legend-item">
            <span className="reports__legend-dot reports__legend-dot--attendance" />
            Test Count (relative to busiest day — hover a bar for the exact number)
          </span>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="reports__chart-title">Performance Over Time</h3>
        {!loading && !performanceChartData.length && (
          <div className="reports__empty">No test performance history is available yet.</div>
        )}
        <div className="reports__chart">
          {performanceChartData.map((item) => (
            <div key={item.month} className="reports__chart-bar-wrapper">
              <div className="reports__chart-bar-group">
                <div
                  className="reports__chart-bar reports__chart-bar--score"
                  style={{ height: `${item.avgScore}%` }}
                  title={`${item.month}: ${Math.round(item.avgScore || 0)}% avg score`}
                />
                <div
                  className="reports__chart-bar reports__chart-bar--attendance"
                  style={{ height: `${item.attendance}%` }}
                  title={`${item.month}: ${Math.round(item.attendance || 0)}% attendance`}
                />
              </div>
              <span className="reports__chart-label">{item.month}</span>
            </div>
          ))}
        </div>
        <div className="reports__chart-legend">
          <span className="reports__legend-item">
            <span className="reports__legend-dot reports__legend-dot--score" />
            Avg Score
          </span>
          <span className="reports__legend-item">
            <span className="reports__legend-dot reports__legend-dot--attendance" />
            Attendance
          </span>
        </div>
      </GlassCard>
    </div>
  );

  const classContent = (
    <div className="reports__section">
      {!loading && !classAnalytics.length && (
        <div className="reports__empty">No class analytics available yet.</div>
      )}
      {classAnalytics.length > 0 && (
        <div className="reports__filters-row">
          <div className="reports__filter-group reports__filter-group--search">
            <label htmlFor="class-analytics-search">Search Class</label>
            <div className="reports__search-wrapper">
              <Search size={16} className="reports__search-icon" />
              <input
                id="class-analytics-search"
                type="text"
                placeholder="Search by class or subject..."
                value={classSearchQuery}
                onChange={(e) => setClassSearchQuery(e.target.value)}
                className="reports__filter-input"
              />
            </div>
          </div>
        </div>
      )}
      {classAnalytics.length > 0 && !filteredClassAnalytics.length && (
        <div className="reports__empty">No classes match that search.</div>
      )}
      {filteredClassAnalytics.length > 0 && (
        <>
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <DataTable columns={classColumns} data={paginatedClassAnalytics} />
          </div>
          <DataTablePagination
            page={classPage}
            limit={classPageSize}
            total={filteredClassAnalytics.length}
            totalPages={totalClassPages}
            onPageChange={setClassPage}
            onLimitChange={(val) => { setClassPageSize(val); setClassPage(1); }}
          />
        </>
      )}
    </div>
  );

  const classAverageTone = scoreTone(summary.classAverage);
  const passRateTone = scoreTone(summary.passRate);
  const atRiskPct = summary.totalStudents > 0 ? Math.round((summary.atRiskStudents / summary.totalStudents) * 100) : 0;
  const atRiskTone: { changeType: 'positive' | 'negative' | 'neutral'; label: string } =
    summary.atRiskStudents === 0
      ? { changeType: 'positive', label: 'None flagged' }
      : atRiskPct >= 25
        ? { changeType: 'negative', label: `${atRiskPct}% of class` }
        : { changeType: 'neutral', label: `${atRiskPct}% of class` };

  return (
    <div className="reports font-poppins">
      {error && <div className="reports__error">{error}</div>}
      {loading && <div className="reports__empty">Loading reports...</div>}
      {scope?.isClassTeacherScope && (
        <div className="reports__scope">
          <div>
            <span>Class Teacher View</span>
            <strong>{scopeLabel}</strong>
          </div>
          <Badge variant="success">All subjects</Badge>
        </div>
      )}
      <div className="reports__stats">
        <StatCard title="Class Average" value={`${summary.classAverage}%`} change={classAverageTone.label} changeType={classAverageTone.changeType} icon={<BarChart3 size={24} />} />
        <StatCard title="Pass Rate" value={`${summary.passRate}%`} change={passRateTone.label} changeType={passRateTone.changeType} icon={<Target size={24} />} gradient="var(--gradient-cool)" />
        <StatCard title="At-Risk Students" value={String(summary.atRiskStudents)} change={atRiskTone.label} changeType={atRiskTone.changeType} icon={<AlertTriangle size={24} />} gradient="var(--gradient-warm)" />
        <StatCard title="Total Students" value={String(summary.totalStudents)} icon={<Users size={24} />} gradient="var(--gradient-accent)" />
      </div>

      {/* Tab selection on mobile, Tabs on desktop */}
      {isMobile ? (
        <div className="block sm:hidden">
          <CustomSelect
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            options={[
              { value: 'students', label: 'Student Performance' },
              { value: 'weakness', label: 'Weakness Analysis' },
              { value: 'tests', label: 'Test Analysis' },
              { value: 'class', label: 'Class Analytics' },
            ]}
            className="w-full mb-4"
            triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700 shadow-sm"
          />
          <div className="mt-2">
            {activeTab === 'students' && studentContent}
            {activeTab === 'weakness' && weaknessContent}
            {activeTab === 'tests' && testContent}
            {activeTab === 'class' && classContent}
          </div>
        </div>
      ) : (
        <div className="hidden sm:block">
          <Tabs
            activeTabId={activeTab}
            onChange={(val) => setActiveTab(val)}
            tabs={[
              { id: 'students', label: 'Student Performance', icon: <Users size={16} />, content: studentContent },
              { id: 'weakness', label: 'Weakness Analysis', icon: <AlertTriangle size={16} />, content: weaknessContent },
              { id: 'tests', label: 'Test Analysis', icon: <ClipboardCheck size={16} />, content: testContent },
              { id: 'class', label: 'Class Analytics', icon: <LineChart size={16} />, content: classContent },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default Reports;
