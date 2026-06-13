import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Users, Target, ChevronLeft, ChevronRight, ArrowRight, Search } from 'lucide-react';
import GlassCard from '@/components/school/GlassCard';
import StatCard from '@/components/school/StatCard';
import Badge from '@/components/school/Badge';
import ProgressBar from '@/components/school/ProgressBar';
import Tabs from '@/components/school/Tabs';
import DataTable from '@/components/school/DataTable';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import api from '@/lib/api/school-client';
import './Reports.css';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [performanceChartData, setPerformanceChartData] = useState<any[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
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
        const res = await api.get('/reports/class');
        const body: any = res.data || {};
        const reportSummary = body.summary || {};
        const analytics = Array.isArray(body.data) ? body.data : [];

        setPerformanceChartData(Array.isArray(body.performance) ? body.performance : []);
        setClassAnalytics(analytics);
        setStudentPerformance(Array.isArray(body.students) ? body.students : []);
        setWeaknessData(Array.isArray(body.weaknesses) ? body.weaknesses : []);
        setScope(body.scope || null);
        setWeeklyAnalysis({
          averageScore: Math.round(body.weeklyAnalysis?.averageScore || 0),
          passRate: Math.round(body.weeklyAnalysis?.passRate || 0),
          atRiskStudents: Math.round(body.weeklyAnalysis?.atRiskStudents || 0),
          evaluatedStudents: Math.round(body.weeklyAnalysis?.evaluatedStudents || 0),
          totalStudents: Math.round(body.weeklyAnalysis?.totalStudents || 0),
          assessments: Math.round(body.weeklyAnalysis?.assessments || 0),
          days: Array.isArray(body.weeklyAnalysis?.days) ? body.weeklyAnalysis.days : [],
        });
        setReportScope(body.scope || null);
        setSummary({
          classAverage: Math.round(reportSummary.classAverage || analytics[0]?.avgScore || 0),
          passRate: Math.round(reportSummary.passRate || analytics[0]?.passRate || 0),
          atRiskStudents: Math.round(reportSummary.atRiskStudents || 0),
          totalStudents: Math.round(reportSummary.totalStudents || body.students?.length || 0),
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
  }, [page, limit]);

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
  const paginatedStudents = studentPerformance.slice(startIndex, endIndex);
  const formatSectionName = (name?: string) => {
    const sectionName = String(name || '').trim();
    if (!sectionName) return '';
    return /^sec(?:tion)?\b/i.test(sectionName) ? sectionName : `Sec ${sectionName}`;
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
          <select
            id="class-filter"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedSection('all');
              setStudentPage(1);
            }}
            className="reports__filter-select"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="reports__filter-group">
          <label htmlFor="section-filter">Section</label>
          <select
            id="section-filter"
            value={selectedSection}
            onChange={(e) => {
              setSelectedSection(e.target.value);
              setStudentPage(1);
            }}
            className="reports__filter-select"
            disabled={selectedClass === 'all' && sections.length === 0}
          >
            <option value="all">All Sections</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
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
                <select
                  value={studentPageSize}
                  onChange={(e) => {
                    setStudentPageSize(Number(e.target.value));
                    setStudentPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700 outline-none focus:border-brand-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
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
      {!loading && !weaknessData.length && (
        <div className="reports__empty">No weakness data yet. Publish assessment results to generate this analysis.</div>
      )}
      <div className="reports__weakness-grid">
        {weaknessData.map((item) => (
          <GlassCard 
            key={item.topic} 
            hover 
            className="reports__weakness-card"
            onClick={() => navigate(`/school/teacher/reports/weakness/${item.topic}`, { state: { studentPerformance } })}
          >
            <div className="reports__weakness-header">
              <AlertTriangle size={18} className="reports__weakness-icon" />
              <h4>{item.topic}</h4>
            </div>
            <div className="reports__weakness-stats">
              <div className="reports__weakness-stat">
                <span className="reports__weakness-label">Weak Students</span>
                <span className="reports__weakness-value">{item.weakStudents || item.weak_students || 0}</span>
              </div>
              <div className="reports__weakness-stat">
                <span className="reports__weakness-label">Avg Score</span>
                <span className="reports__weakness-value reports__weakness-value--low">{item.avgScore || item.avg_score || 0}%</span>
              </div>
            </div>
            <ProgressBar value={item.avgScore || item.avg_score || 0} size="sm" color="var(--gradient-warm)" />
            <div className="reports__weakness-footer">
              <span>View struggling students</span>
              <ArrowRight size={12} />
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
    <div className="reports">
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
          { id: 'tests', label: 'Test Analysis', icon: <BarChart3 size={16} />, content: testContent },
          { id: 'class', label: 'Class Analytics', icon: <Target size={16} />, content: classContent },
        ]}
      />
    </div>
  );
};

export default Reports;
