import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Users, Target, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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

  const totalStudentPages = Math.ceil(studentPerformance.length / studentPageSize);
  
  useEffect(() => {
    if (studentPage > totalStudentPages && totalStudentPages > 0) {
      setStudentPage(1);
    }
  }, [totalStudentPages, studentPage]);

  const startIndex = (studentPage - 1) * studentPageSize;
  const endIndex = startIndex + studentPageSize;
  const paginatedStudents = studentPerformance.slice(startIndex, endIndex);

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
    {
      key: 'weakAreas', title: 'Weak Areas', render: (v: string[]) => (
        <div className="reports__tags">{v.map((a) => <Badge key={a} variant="warning">{a}</Badge>)}</div>
      )
    },
    {
      key: 'strongAreas', title: 'Strong Areas', render: (v: string[]) => (
        <div className="reports__tags">{v.map((a) => <Badge key={a} variant="success">{a}</Badge>)}</div>
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
      {!loading && !studentPerformance.length && (
        <div className="reports__empty">No students found for your assigned class or section.</div>
      )}
      <DataTable columns={studentColumns} data={paginatedStudents} />
      
      {/* Pagination controls */}
      {studentPerformance.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4 mt-4">
          <div className="text-xs font-semibold text-gray-500">
            Showing <span className="font-bold text-gray-700">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-gray-700">{Math.min(endIndex, studentPerformance.length)}</span> of{" "}
            <span className="font-bold text-gray-700">{studentPerformance.length}</span> students
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
