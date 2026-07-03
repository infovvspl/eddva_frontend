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

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
        let rosterStudents: any[] = [];

        try {
          const allRosterRes = await api.get('/students?limit=1000');
          const allRosterBody: any = allRosterRes.data || {};
          const allRoster = Array.isArray(allRosterBody.data)
            ? allRosterBody.data
            : Array.isArray(allRosterBody)
              ? allRosterBody
              : [];
          rosterStudents = allRoster.map(mapRosterStudentToReportStudent);
          setAssignedRoster(rosterStudents);
        } catch (rosterErr) {
          console.error('Unable to load assigned roster for reports', rosterErr);
          setAssignedRoster([]);
        }

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
        if (err?.response?.status === 404) {
          setError('Reports API is not available on the running backend. Restart the backend server to load the new /school/reports/class route.');
        } else {
          setError('Unable to load reports right now.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [page, limit, selectedClass, selectedSection]);

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
    
    const map = new Map<string, string>();
    const assignments = Array.isArray(reportScope?.assignments) ? reportScope.assignments : [];
    
    if (assignments.length > 0) {
      assignments.forEach((item: any) => {
        const classId = item.class_id || item.classId;
        const sectionId = item.section_id || item.sectionId;
        const sectionName = item.section_name || item.sectionName;
        if (
          sectionId &&
          sectionName &&
          (selectedClass === 'all' || String(classId) === String(selectedClass))
        ) {
          map.set(String(sectionId), sectionName);
        }
      });
    } else {
      studentPerformance.forEach((student) => {
        if (
          student.sectionId &&
          student.sectionName &&
          (selectedClass === 'all' || String(student.classId) === String(selectedClass))
        ) {
          map.set(String(student.sectionId), student.sectionName);
        }
      });
    }
    
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
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
  const weaknessMetricBySubject = useMemo(() => {
    const map = new Map<string, any>();
    weaknessData.forEach((item) => {
      const subjectName = item.topic || item.subject || item.subjectName || item.subject_name;
      const subjectId = item.subjectId || item.subject_id;
      if (subjectName) map.set(normalizeKey(subjectName), item);
      if (subjectId) map.set(String(subjectId), item);
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
    const metric = weaknessMetricBySubject.get(String(subject?.id || '')) || weaknessMetricBySubject.get(normalizeKey(subjectName)) || {};
    const scopedStudents = assignedRosterWithMetrics.filter((student: any) => {
      return String(student.classId || '') === String(classId)
        && String(student.sectionId || '') === String(sectionId);
    });
    const assignedStudents = scopedStudents.length;
    const weakByStudent = scopedStudents.filter((student: any) => {
      const weakAreas = Array.isArray(student.weakAreas) ? student.weakAreas : [];
      return weakAreas.some((area: string) => normalizeKey(area) === normalizeKey(subjectName));
    }).length;
    const metricWeakStudents = metric.weakStudents || metric.weak_students || 0;
    const atRiskStudents = weakByStudent || Math.min(Number(metricWeakStudents) || 0, assignedStudents || Number(metricWeakStudents) || 0);
    const scoredStudents = scopedStudents
      .map((student: any) => Number(student.avgScore || 0))
      .filter((score: number) => Number.isFinite(score) && score > 0);
    const metricAverage = Number(metric.avgScore || metric.avg_score || 0);
    const classAverage = scoredStudents.length
      ? Math.round(scoredStudents.reduce((sum: number, score: number) => sum + score, 0) / scoredStudents.length)
      : (Number.isFinite(metricAverage) ? metricAverage : 0);

    return { assignedStudents, atRiskStudents, classAverage };
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
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const studentColumns = [
    { key: 'name', title: 'Student' },
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
    { key: 'topSubject', title: 'Top Subject' },
    { key: 'weakSubject', title: 'Weak Subject' },
    { key: 'attendance', title: 'Attendance', render: (v: number) => <span className="reports__score">{v}%</span> },
  ];

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
          <DataTable columns={studentColumns} data={paginatedStudents} />
          
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
                />
              </div>
              
              {totalStudentPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    disabled={studentPage === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
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
                  
                  <button
                    type="button"
                    onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                    disabled={studentPage === totalStudentPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      const { assignedStudents, atRiskStudents, classAverage } = getWeaknessSubjectStats(
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
                              <span className="reports__weakness-value">{classAverage}%</span>
                            </div>
                          </div>
                          <ProgressBar value={classAverage} size="sm" color="var(--gradient-warm)" />
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
          {weeklyDays.map((item: any) => (
            <div key={item.date || item.day} className="reports__chart-bar-wrapper">
              <div className="reports__chart-bar-group">
                <div
                  className="reports__chart-bar reports__chart-bar--score"
                  style={{ height: `${item.avgScore || 0}%` }}
                />
                <div
                  className="reports__chart-bar reports__chart-bar--attendance"
                  style={{ height: `${Math.min((item.tests || 0) * 20, 100)}%` }}
                />
              </div>
              <span className="reports__chart-label">{item.day}</span>
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
            Test Count
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
                />
                <div
                  className="reports__chart-bar reports__chart-bar--attendance"
                  style={{ height: `${item.attendance}%` }}
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
      <DataTable columns={classColumns} data={classAnalytics} />
    </div>
  );

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
        <StatCard title="Class Average" value={`${summary.classAverage}%`} change="Live" changeType="positive" icon={<BarChart3 size={24} />} />
        <StatCard title="Pass Rate" value={`${summary.passRate}%`} change="Live" changeType="positive" icon={<Target size={24} />} gradient="var(--gradient-cool)" />
        <StatCard title="At-Risk Students" value={String(summary.atRiskStudents)} change="Live" changeType="negative" icon={<AlertTriangle size={24} />} gradient="var(--gradient-warm)" />
        <StatCard title="Total Students" value={String(summary.totalStudents)} icon={<Users size={24} />} gradient="var(--gradient-accent)" />
      </div>

      <Tabs
        tabs={[
          { id: 'students', label: 'Student Performance', icon: <Users size={16} />, content: studentContent },
          { id: 'weakness', label: 'Weakness Analysis', icon: <AlertTriangle size={16} />, content: weaknessContent },
          { id: 'tests', label: 'Test Analysis', icon: <ClipboardCheck size={16} />, content: testContent },
          { id: 'class', label: 'Class Analytics', icon: <LineChart size={16} />, content: classContent },
        ]}
      />
    </div>
  );
};

export default Reports;
