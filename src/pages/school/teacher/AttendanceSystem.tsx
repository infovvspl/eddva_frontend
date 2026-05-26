import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Calendar, TrendingUp, Plus } from 'lucide-react';
import api from '@/lib/api/school-client';
import StatCard from '@/components/school/StatCard';
import GlassCard from '@/components/school/GlassCard';
import Button from '@/components/school/Button';
import Badge from '@/components/school/Badge';
import Tabs from '@/components/school/Tabs';
import DataTable from '@/components/school/DataTable';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import useLiveRefresh from '@/hooks/useLiveRefresh';

const AttendanceSystem: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const totalPresent = records.reduce(
  (sum: number, s: any) => sum + Number(s.present || 0),
  0
);

const totalAbsent = records.reduce(
  (sum: number, s: any) => sum + Number(s.absent || 0),
  0
);

const totalLate = records.reduce(
  (sum: number, s: any) => sum + Number(s.late || 0),
  0
);

const avgAttendance =
  records.length > 0
    ? Math.round(
        records.reduce(
          (sum: number, s: any) =>
            sum + Number(s.percentage || 0),
          0
        ) / records.length
      )
    : 0;

  const fetchRecords = async () => {
    try {
      const res = await api.get('/attendance/report');
      setRecords(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      const list = res.data?.data ?? res.data ?? [];
      const formatted = Array.isArray(list)
        ? list.map((cls: any) => ({
            value: String(cls.id),
            label: cls.class_name || cls.name || cls.section?.class?.name || cls.section?.name || `Class ${cls.id}`,
          }))
        : [];

      setClasses(formatted);
      if (!selectedClass && formatted.length > 0) {
        setSelectedClass(formatted[0].value);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      const res = await api.get(`/attendance/students/${classId}`);
      setStudents(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchClasses();
  }, []);

  useLiveRefresh(() => {
    fetchRecords();
    fetchClasses();
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass], 30000);
  const columns = [
    { key: 'studentId', title: 'Student ID' },
    { key: 'name', title: 'Student Name' },
    { key: 'class', title: 'Class', render: (v: string) => <Badge variant="purple">{v}</Badge> },
    { key: 'present', title: 'Present', render: (v: number) => <span className="attendance__present">{v}</span> },
    { key: 'absent', title: 'Absent', render: (v: number) => <span className="attendance__absent">{v}</span> },
    { key: 'late', title: 'Late', render: (v: number) => <span className="attendance__late">{v}</span> },
    { key: 'percentage', title: 'Percentage', render: (v: number) => (
      <Badge variant={v >= 90 ? 'success' : v >= 75 ? 'info' : 'warning'}>
        {v}%
      </Badge>
    )},
  ];

  const tableContent = (
    <div className="attendance__section">
      <DataTable columns={columns} data={records} />
    </div>
  );

  const reportContent = (
    <div className="attendance__section">
      <GlassCard>
        <h3 className="attendance__report-title">Monthly Attendance Report</h3>
        <div className="attendance__report-chart">
          {/* Integration logic for monthly charts would go here */}
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Realtime Analytics (Coming Soon)
          </p>
        </div>
      </GlassCard>
    </div>
  );

  const handleSaveAttendance = async () => {
    try {
      await api.post('/attendance/mark', {
        schedule_id: 11, // Placeholder
        date,
        students: students.map((student: any) => ({
          student_id: student.id,
          status: attendanceData[student.id] || 'present',
        }))
      });
      fetchRecords();
      alert('Attendance saved successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const offlineContent = (
    <div className="attendance__section">
      <GlassCard>
        <h3 className="attendance__offline-title">Offline Attendance Entry</h3>
        <p className="attendance__offline-desc">Mark attendance for students manually.</p>
        <div className="attendance__offline-form">
          <div className="attendance__offline-row">
            <SelectField
              label="Class"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                fetchStudents(e.target.value);
              }}              options={classes.length > 0 ? classes : [
                { value: '1', label: 'Class 12-A' },
                { value: '2', label: 'Class 11-B' },
              ]}
            />
            <InputField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="attendance__offline-students">
            {students.length === 0 ? (
              <p
                style={{
                  padding: '1rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Load students by selecting a class...
              </p>
            ) : (
              students.map((student: any) => (
                <div
                  key={student.id}
                  className="attendance__student-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div>
                    <strong>{student.name}</strong>
                    <p>{student.roll_number}</p>
                  </div>

                  <SelectField
                    label=""
                    value={attendanceData[student.id] || 'present'}
                    onChange={(e) =>
                      setAttendanceData({
                        ...attendanceData,
                        [student.id]: e.target.value,
                      })
                    }
                    options={[
                      { value: 'present', label: 'Present' },
                      { value: 'absent', label: 'Absent' },
                      { value: 'late', label: 'Late' },
                    ]}
                  />
                </div>
              ))
            )}
          </div>
          <Button fullWidth onClick={handleSaveAttendance}>Save Attendance</Button>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="attendance">
      <div className="attendance__stats">
        <StatCard
  title="Total Present"
  value={totalPresent}
  icon={<UserCheck size={24} />}
  gradient="var(--gradient-cool)"
/>

<StatCard
  title="Total Absent"
  value={totalAbsent}
  icon={<UserX size={24} />}
  gradient="var(--gradient-warm)"
/>

<StatCard
  title="Late Arrivals"
  value={totalLate}
  icon={<Clock size={24} />}
  gradient="var(--gradient-accent)"
/>

<StatCard
  title="Avg This Month"
  value={`${avgAttendance}%`}
  icon={<TrendingUp size={24} />}
/>
      </div>

      <Tabs
        tabs={[
          { id: 'table', label: 'Attendance Table', icon: <Calendar size={16} />, content: tableContent },
          { id: 'report', label: 'Monthly Report', icon: <TrendingUp size={16} />, content: reportContent },
          { id: 'offline', label: 'Offline Entry', icon: <Plus size={16} />, content: offlineContent },
        ]}
      />
    </div>
  );
};

export default AttendanceSystem;
