// AttendanceHub — single admin "Attendance" page with tabs instead of
// separate sidebar entries: Reports (the original Attendance.jsx, read-only
// for admin) and Teacher Attendance. Student attendance is taken by the
// teacher, not admin — there is deliberately no "Mark Attendance" tab here;
// that stays on the teacher's own Attendance page, and the backend rejects a
// non-TEACHER caller on the marking endpoints regardless of what the UI
// shows. Each tab's content is only mounted while active, so switching tabs
// doesn't fire every tab's data fetch at once.
import React, { useState } from 'react';
import { BarChart3, UserCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportsTab from './Attendance';
import TeacherAttendanceTab from './TeacherAttendance';

const TABS = [
  { value: 'reports', label: 'Reports', icon: BarChart3 },
  { value: 'teachers', label: 'Teacher Attendance', icon: UserCheck },
];

export default function AttendanceHub() {
  const [tab, setTab] = useState('reports');

  return (
    <div className="w-full space-y-4 font-poppins">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto gap-2 bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-bold text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 data-[state=active]:border-blue-700 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:ring-2 data-[state=active]:ring-blue-200 data-[state=active]:hover:bg-gradient-to-br"
            >
              <t.icon size={16} />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'reports' && <ReportsTab />}
      {tab === 'teachers' && <TeacherAttendanceTab />}
    </div>
  );
}
