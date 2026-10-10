import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Users, Target, ChevronLeft, ChevronRight, ArrowRight, Search, ClipboardCheck, LineChart } from 'lucide-react';
import StatCard from '@/components/school/StatCard';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/school/DataTable';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import api from '@/lib/api/school-client';
import './Reports.css';

const TONE_BADGE: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-700',
  info: 'bg-blue-500/10 text-blue-700',
  warning: 'bg-amber-500/10 text-amber-700',
  error: 'bg-red-500/10 text-red-700',
  purple: 'bg-violet-500/10 text-violet-700',
};

function ToneBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', TONE_BADGE[tone] ?? TONE_BADGE.purple)}>
      {children}
    </Badge>
  );
}

// shadcn Select with the simple (value, onChange(val), options) shape used on this page.
function SimpleSelect({
  id,
  value,
  onChange,
  options,
  disabled,
  triggerClassName,
}: {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  triggerClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn('w-full', triggerClassName)}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
    { key: 'class', title: 'Class', render: (v: string) => <ToneBadge tone="purple">{v}</ToneBadge> },
    {
      key: 'avgScore', title: 'Avg Score', render: (v: number) => (
        <ToneBadge tone={v >= 85 ? 'success' : v >= 70 ? 'info' : 'warning'}>{v}%</ToneBadge>
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
    { key: 'class', title: 'Class', render: (v: string) => <ToneBadge tone="purple">{v}</ToneBadge> },
    { key: 'avgScore', title: 'Avg Score', render: (v: number) => <span className="reports__score">{v}%</span> },
    { key: 'passRate', title: 'Pass Rate', render: (v: number) => <ToneBadge tone={v >= 90 ? 'success' : 'info'}>{v}%</ToneBadge> },
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
          <Label htmlFor="class-filter">Class</Label>
          <SimpleSelect
            onChange={setSelectedClass}
            value={selectedClass}
            options={[
              { value: "all", label: "All Classes" },
              ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
            ]}
            id="class-filter"
            triggerClassName="h-auto rounded-lg border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm sm:px-4 sm:py-2.5 sm:text-sm"
          />
        </div>

        <div className="reports__filter-group">
          <Label htmlFor="section-filter">Section</Label>
          <SimpleSelect
            onChange={setSelectedSection}
            value={selectedSection}
            options={[
              { value: "all", label: "All Sections" },
              ...sections.map((sec) => ({ value: sec.id, label: sec.name })),
            ]}
            id="section-filter"
            disabled={selectedClass === 'all' && sections.length === 0}
            triggerClassName="h-auto rounded-lg border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm sm:px-4 sm:py-2.5 sm:text-sm"
          />
        </div>

        <div className="reports__filter-group reports__filter-group--search">
          <Label htmlFor="student-search">Search Student</Label>
          <div className="reports__search-wrapper">
            <Search size={16} className="reports__search-icon" />
            <Input
              id="student-search"
              type="text"
              placeholder="Search by name..."
              value={studentSearchQuery}
              onChange={(e) => {
                setStudentSearchQuery(e.target.value);
                setStudentPage(1);
              }}
              className="reports__filter-input h-auto"
            />
          </div>
        </div>
      </div>

      {!loading && !filteredStudents.length && (
        <Card className="reports__empty rounded-xl border-dashed shadow-none">No students found matching the selected filters.</Card>
      )}

      {filteredStudents.length > 0 && (
    <>
      {/* Mobile: one card per student */}
      <div className="space-y-3 md:hidden">
        {paginatedStudents.map((row: any) => (
          <Card key={row.id} className="space-y-2.5 rounded-xl border-slate-200 p-4 shadow-none">
            <div className="flex items-start justify-between gap-2">
              <span
                onClick={() => navigate(`/school/teacher/reports/student/${row.id}`)}
                className="min-w-0 cursor-pointer truncate font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                {row.name}
              </span>
              <ToneBadge tone={row.avgScore >= 85 ? 'success' : row.avgScore >= 70 ? 'info' : 'warning'}>{row.avgScore}%</ToneBadge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ToneBadge tone="purple">{row.class}</ToneBadge>
              <span className={`reports__trend reports__trend--${row.trend}`}>
                {row.trend === 'improving' ? <TrendingUp size={14} /> : row.trend === 'declining' ? <TrendingDown size={14} /> : <BarChart3 size={14} />}
                {row.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Tablet / desktop table */}
      <div className="hidden w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 md:block">
        <DataTable columns={studentColumns} data={paginatedStudents} />
      </div>

      {/* Pagination controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
        <div className="text-xs font-semibold text-gray-500">
          Showing <span className="font-bold text-gray-700">{startIndex + 1}</span> to{" "}
          <span className="font-bold text-gray-700">{Math.min(endIndex, filteredStudents.length)}</span> of{" "}
          <span className="font-bold text-gray-700">{filteredStudents.length}</span> students
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Per page:</span>
            <div className="w-[76px]">
              <SimpleSelect
                onChange={(v) => setStudentPageSize(Number(v))}
                value={String(studentPageSize)}
                options={[
                  { value: '5', label: '5' },
                  { value: '10', label: '10' },
                  { value: '20', label: '20' },
                  { value: '50', label: '50' },
                ]}
                triggerClassName="h-8 rounded-lg border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm"
              />
            </div>
          </div>

          {totalStudentPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                disabled={studentPage === 1}
                className="size-8 shrink-0 rounded-lg"
              >
                <ChevronLeft size={16} />
              </Button>

              {/* Desktop: show all page numbers */}
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    type="button"
                    variant={studentPage === page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setStudentPage(page)}
                    className="size-8 rounded-lg text-xs font-black"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              {/* Mobile: Page X of Y */}
              <span className="flex px-2 text-xs font-semibold text-gray-500 sm:hidden">
                Page {studentPage} of {totalStudentPages}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                disabled={studentPage === totalStudentPages}
                className="size-8 shrink-0 rounded-lg"
              >
                <ChevronRight size={16} />
              </Button>
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
        <Card className="reports__empty rounded-xl border-dashed shadow-none">No assigned class or subject data is available for weakness analysis.</Card>
      )}
      {!loading && !reportAssignments.length && weaknessData.length > 0 && (
        <Alert className="reports__error rounded-xl border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700">
          Couldn't match this data to your specific classes/sections — showing it grouped generically below. Refresh the page, or contact an admin if this persists.
        </Alert>
      )}
      <div className="reports__weakness-class-list">
        {weaknessClassGroups.map((classGroup: any) => (
          <Card key={classGroup.id} className="reports__weakness-class-card rounded-2xl border-slate-200 bg-white p-[18px] shadow-sm">
            <div className="reports__weakness-class-header">
              <div>
                <span>Class</span>
                <h3>{classGroup.name}</h3>
              </div>
              <ToneBadge tone="purple">{classGroup.sections.length} section{classGroup.sections.length === 1 ? '' : 's'}</ToneBadge>
            </div>
            <div className="reports__weakness-section-grid">
              {classGroup.sections.map((sectionGroup: any) => (
                <div key={sectionGroup.id} className="reports__weakness-section-card">
                  <div className="reports__weakness-section-header">
                    <div>
                      <span>Section</span>
                      <h4>{formatSectionName(sectionGroup.name)}</h4>
                    </div>
                    <ToneBadge tone={sectionGroup.isClassTeacher ? 'success' : 'info'}>
                      {sectionGroup.isClassTeacher ? 'Class teacher' : 'Assigned subjects'}
                    </ToneBadge>
                  </div>
                  {!sectionGroup.subjects.length && (
                    <Card className="reports__empty rounded-xl border-dashed shadow-none">No subjects are assigned for this section.</Card>
                  )}
                  <div className="reports__weakness-grid reports__weakness-grid--nested">
                    {sectionGroup.subjects.map((subject: any) => {
                      const { assignedStudents, atRiskStudents, classAverage, hasData } = getWeaknessSubjectStats(
                        classGroup.id,
                        sectionGroup.id,
                        subject,
                      );

                      return (
                        <Card
                          key={subject.id || subject.name}
                          role="button"
                          tabIndex={0}
                          className="reports__weakness-card cursor-pointer rounded-xl border-slate-200 bg-white p-[18px] shadow-none transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).click();
                            }
                          }}
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
                          <Progress value={hasData ? classAverage : 0} className="h-1.5 bg-slate-100" indicatorClassName="bg-gradient-to-r from-amber-400 to-orange-500" />
                          <div className="reports__weakness-footer">
                            <span>View struggling students</span>
                            <ArrowRight size={12} />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const testContent = (
    <div className="reports__section">
      <div className="reports__weekly-stats">
        <Card className="reports__weekly-card rounded-2xl border-slate-200 bg-white p-[18px] shadow-sm">
          <span className="reports__weekly-label">Weekly Average</span>
          <strong>{weeklyAnalysis.averageScore}%</strong>
        </Card>
        <Card className="reports__weekly-card rounded-2xl border-slate-200 bg-white p-[18px] shadow-sm">
          <span className="reports__weekly-label">Weekly Pass Rate</span>
          <strong>{weeklyAnalysis.passRate}%</strong>
        </Card>
        <Card className="reports__weekly-card rounded-2xl border-slate-200 bg-white p-[18px] shadow-sm">
          <span className="reports__weekly-label">Weekly At-Risk</span>
          <strong>{weeklyAnalysis.atRiskStudents}</strong>
        </Card>
        <Card className="reports__weekly-card rounded-2xl border-slate-200 bg-white p-[18px] shadow-sm">
          <span className="reports__weekly-label">Tests This Week</span>
          <strong>{weeklyAnalysis.assessments}</strong>
        </Card>
      </div>
      <Card className="rounded-2xl border-slate-200 bg-white p-[18px] shadow-sm">
        <h3 className="reports__chart-title">Weekly Performance</h3>
        {!loading && !weeklyDays.some((item: any) => item.avgScore > 0) && (
          <Card className="reports__empty rounded-xl border-dashed shadow-none">No weekly test performance is available yet.</Card>
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
      </Card>
      <Card className="rounded-2xl border-slate-200 bg-white p-[18px] shadow-sm">
        <h3 className="reports__chart-title">Performance Over Time</h3>
        {!loading && !performanceChartData.length && (
          <Card className="reports__empty rounded-xl border-dashed shadow-none">No test performance history is available yet.</Card>
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
      </Card>
    </div>
  );

  const classContent = (
    <div className="reports__section">
      {!loading && !classAnalytics.length && (
        <Card className="reports__empty rounded-xl border-dashed shadow-none">No class analytics available yet.</Card>
      )}
      {classAnalytics.length > 0 && (
        <div className="reports__filters-row">
          <div className="reports__filter-group reports__filter-group--search">
            <Label htmlFor="class-analytics-search">Search Class</Label>
            <div className="reports__search-wrapper">
              <Search size={16} className="reports__search-icon" />
              <Input
                id="class-analytics-search"
                type="text"
                placeholder="Search by class or subject..."
                value={classSearchQuery}
                onChange={(e) => setClassSearchQuery(e.target.value)}
                className="reports__filter-input h-auto"
              />
            </div>
          </div>
        </div>
      )}
      {classAnalytics.length > 0 && !filteredClassAnalytics.length && (
        <Card className="reports__empty rounded-xl border-dashed shadow-none">No classes match that search.</Card>
      )}
      {filteredClassAnalytics.length > 0 && (
        <>
          {/* Mobile: one card per class */}
          <div className="space-y-3 md:hidden">
            {paginatedClassAnalytics.map((row: any, i: number) => (
              <Card key={row.class || i} className="space-y-2.5 rounded-xl border-slate-200 p-4 shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <ToneBadge tone="purple">{row.class}</ToneBadge>
                  <ToneBadge tone={row.passRate >= 90 ? 'success' : 'info'}>Pass {row.passRate}%</ToneBadge>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-semibold text-slate-500">
                  <span>Avg score: <b className="text-slate-800">{row.avgScore}%</b></span>
                  <span>Attendance: <b className="text-slate-800">{row.attendance}%</b></span>
                  <span>Top: <b className="text-slate-800">{row.topSubject || '—'}</b></span>
                  <span>Weak: <b className="text-slate-800">{row.weakSubject || '—'}</b></span>
                </div>
              </Card>
            ))}
          </div>

          {/* Tablet / desktop table */}
          <div className="hidden w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 md:block">
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
      {error && <Alert className="reports__error rounded-xl border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700">{error}</Alert>}
      {loading && (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}
      {scope?.isClassTeacherScope && (
        <Card className="reports__scope rounded-xl border-slate-200 shadow-none">
          <div>
            <span>Class Teacher View</span>
            <strong>{scopeLabel}</strong>
          </div>
          <ToneBadge tone="success">All subjects</ToneBadge>
        </Card>
      )}
      <div className="reports__stats">
        <StatCard title="Class Average" value={`${summary.classAverage}%`} change={classAverageTone.label} changeType={classAverageTone.changeType} icon={<BarChart3 size={24} />} />
        <StatCard title="Pass Rate" value={`${summary.passRate}%`} change={passRateTone.label} changeType={passRateTone.changeType} icon={<Target size={24} />} gradient="var(--gradient-cool)" />
        <StatCard title="At-Risk Students" value={String(summary.atRiskStudents)} change={atRiskTone.label} changeType={atRiskTone.changeType} icon={<AlertTriangle size={24} />} gradient="var(--gradient-warm)" />
        <StatCard title="Total Students" value={String(summary.totalStudents)} icon={<Users size={24} />} gradient="var(--gradient-accent)" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-sm">
          {[
            { id: 'students', label: 'Student Performance', icon: <Users size={16} /> },
            { id: 'weakness', label: 'Weakness Analysis', icon: <AlertTriangle size={16} /> },
            { id: 'tests', label: 'Test Analysis', icon: <ClipboardCheck size={16} /> },
            { id: 'class', label: 'Class Analytics', icon: <LineChart size={16} /> },
          ].map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="shrink-0 gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm sm:text-sm"
            >
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mt-4">
        {activeTab === 'students' && studentContent}
        {activeTab === 'weakness' && weaknessContent}
        {activeTab === 'tests' && testContent}
        {activeTab === 'class' && classContent}
      </div>
    </div>
  );
};

export default Reports;
