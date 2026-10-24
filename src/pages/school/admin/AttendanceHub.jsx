// AttendanceHub — single admin "Attendance" page with tabs instead of
// separate sidebar entries: Reports (the original Attendance.jsx, read-only
// for admin) and Teacher Attendance. Student attendance is taken by the
// teacher, not admin — there is deliberately no "Mark Attendance" tab here;
// that stays on the teacher's own Attendance page, and the backend rejects a
// non-TEACHER caller on the marking endpoints regardless of what the UI
// shows. Each tab's content is only mounted while active, so switching tabs
// doesn't fire every tab's data fetch at once.
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportsTab from './Attendance';
import TeacherAttendanceTab from './TeacherAttendance';

const TABS = [
  { value: 'reports', label: 'Reports' },
  { value: 'teachers', label: 'Teacher Attendance' },
];

export default function AttendanceHub() {
  const [tab, setTab] = useState('reports');

  return (
    <div className="w-full space-y-4 font-poppins">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'reports' && <ReportsTab />}
      {tab === 'teachers' && <TeacherAttendanceTab />}
    </div>
  );
}
