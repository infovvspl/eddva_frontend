import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Users, Target } from 'lucide-react';
import GlassCard from '@/components/school/GlassCard';
import StatCard from '@/components/school/StatCard';
import Badge from '@/components/school/Badge';
import ProgressBar from '@/components/school/ProgressBar';
import Tabs from '@/components/school/Tabs';
import DataTable from '@/components/school/DataTable';
import api from '@/lib/api/school-client';
import './Reports.css';

const Reports: React.FC = () => {
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
  }, []);

  const studentColumns = [
    { key: 'name', title: 'Student' },
    { key: 'class', title: 'Class', render: (v: string) => <Badge variant="purple">{v}</Badge> },
    { key: 'avgScore', title: 'Avg Score', render: (v: number) => (
      <Badge variant={v >= 85 ? 'success' : v >= 70 ? 'info' : 'warning'}>{v}%</Badge>
    )},
    { key: 'trend', title: 'Trend', render: (v: string) => (
      <span className={`reports__trend reports__trend--${v}`}>
        {v === 'improving' ? <TrendingUp size={14} /> : v === 'declining' ? <TrendingDown size={14} /> : <BarChart3 size={14} />}
        {v}
      </span>
    )},
    { key: 'weakAreas', title: 'Weak Areas', render: (v: string[]) => (
      <div className="reports__tags">{v.map((a) => <Badge key={a} variant="warning">{a}</Badge>)}</div>
    )},
    { key: 'strongAreas', title: 'Strong Areas', render: (v: string[]) => (
      <div className="reports__tags">{v.map((a) => <Badge key={a} variant="success">{a}</Badge>)}</div>
    )},
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
      <DataTable columns={studentColumns} data={studentPerformance} />
    </div>
  );

  const weaknessContent = (
    <div className="reports__section">
      {!loading && !weaknessData.length && (
        <div className="reports__empty">No weakness data yet. Publish assessment results to generate this analysis.</div>
      )}
      <div className="reports__weakness-grid">
        {weaknessData.map((item) => (
          <GlassCard key={item.topic} hover className="reports__weakness-card">
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
