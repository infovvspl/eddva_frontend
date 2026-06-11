import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Users, GraduationCap, Search } from 'lucide-react';
import GlassCard from '@/components/school/GlassCard';
import StatCard from '@/components/school/StatCard';
import Badge from '@/components/school/Badge';
import DataTable from '@/components/school/DataTable';
import api from '@/lib/api/school-client';
import './WeaknessDetails.css';

const WeaknessDetails: React.FC = () => {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [studentPerformance, setStudentPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract navigation state if passed
  const stateData = location.state as { studentPerformance?: any[] } | null;

  useEffect(() => {
    const loadData = async () => {
      if (stateData?.studentPerformance) {
        setStudentPerformance(stateData.studentPerformance);
        setLoading(false);
      } else {
        try {
          setLoading(true);
          setError('');
          const res = await api.get('/reports/class');
          const body: any = res.data || {};
          setStudentPerformance(Array.isArray(body.students) ? body.students : []);
        } catch (err: any) {
          console.error('Error fetching reports for weakness analysis:', err);
          setError('Unable to load weakness details right now.');
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [stateData]);

  // Filter students who are weak in this subject (topic)
  const weakStudents = studentPerformance.filter((student) => {
    const areas = Array.isArray(student.weakAreas) ? student.weakAreas : [];
    return areas.some((area: string) => area.toLowerCase() === topic?.toLowerCase());
  });

  // Filter based on search query
  const filteredWeakStudents = weakStudents.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClassStudents = studentPerformance.length || 1;
  const weakCount = weakStudents.length;
  const percentageAtRisk = Math.round((weakCount / totalClassStudents) * 100);

  const columns = [
    { 
      key: 'name', 
      title: 'Student Name', 
      render: (v: string) => <span className="weakness-details__student-name">{v}</span> 
    },
    { 
      key: 'class', 
      title: 'Class', 
      render: (v: string) => <Badge variant="purple">{v}</Badge> 
    },
    {
      key: 'avgScore', 
      title: 'Overall Average', 
      render: (v: number) => (
        <Badge variant={v >= 85 ? 'success' : v >= 70 ? 'info' : v >= 40 ? 'warning' : 'danger'}>
          {v}%
        </Badge>
      )
    },
    { 
      key: 'attendance', 
      title: 'Attendance', 
      render: (v: number) => <span className="weakness-details__score">{v}%</span> 
    },
    {
      key: 'trend', 
      title: 'Trend', 
      render: (v: string) => (
        <span className={`weakness-details__trend weakness-details__trend--${v}`}>
          {v}
        </span>
      )
    },
    {
      key: 'strongAreas', 
      title: 'Strong Areas', 
      render: (v: string[]) => (
        <div className="weakness-details__tags">
          {Array.isArray(v) && v.length > 0 ? (
            v.map((a) => <Badge key={a} variant="success">{a}</Badge>)
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="weakness-details">
      {/* Header with Back button */}
      <div className="weakness-details__header">
        <button 
          onClick={() => navigate('/school/teacher/reports')} 
          className="weakness-details__back-btn"
        >
          <ChevronLeft size={18} />
          Back to Reports
        </button>
        <div className="weakness-details__title-group">
          <h1>{topic} Analysis</h1>
          <p>Detailed breakdown of students requiring support in {topic}.</p>
        </div>
      </div>

      {error && <div className="weakness-details__error">{error}</div>}

      {loading ? (
        <div className="weakness-details__loading">Analyzing records...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="weakness-details__stats">
            <StatCard 
              title="At-Risk Students" 
              value={String(weakCount)} 
              change={`${percentageAtRisk}% of class`}
              changeType="negative"
              icon={<AlertTriangle size={24} />} 
              gradient="var(--gradient-warm)"
            />
            <StatCard 
              title="Class Average" 
              value={`${Math.round(studentPerformance.reduce((acc, curr) => acc + (curr.avgScore || 0), 0) / totalClassStudents)}%`}
              change="Overall" 
              changeType="info"
              icon={<GraduationCap size={24} />} 
            />
            <StatCard 
              title="Assigned Students" 
              value={String(studentPerformance.length)} 
              change="Total Class" 
              changeType="positive"
              icon={<Users size={24} />} 
              gradient="var(--gradient-accent)"
            />
          </div>

          <div className="weakness-details__content">
            {/* Weak Students Table */}
            <div className="weakness-details__main">
              <GlassCard className="weakness-details__table-card">
                <div className="weakness-details__table-header">
                  <div className="weakness-details__table-title">
                    <h3>Struggling Students</h3>
                    <p>Listed students scored below 60% average in {topic}.</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="weakness-details__search-box">
                    <Search size={16} className="weakness-details__search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search students..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="weakness-details__search-input"
                    />
                  </div>
                </div>

                {filteredWeakStudents.length > 0 ? (
                  <div className="weakness-details__table-wrapper">
                    <DataTable columns={columns} data={filteredWeakStudents} />
                  </div>
                ) : (
                  <div className="weakness-details__empty">
                    {searchQuery ? 'No matching students found.' : `Great news! No students are currently flagged as weak in ${topic}.`}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeaknessDetails;
