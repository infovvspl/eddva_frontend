import React from 'react';
import AdminTimetable from '@/pages/school/admin/Timetable';

/**
 * Teacher Timetable
 * 
 * Reuses the unified Institute Admin Timetable UI and component architecture.
 * Role-based restrictions (filtering by assignments, lock to teacher ID)
 * are handled internally within AdminTimetable and TimetableForm based on useAuth().role.
 */
const Timetable: React.FC = () => {
  return <AdminTimetable />;
};

export default Timetable;
