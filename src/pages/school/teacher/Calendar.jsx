import AcademicCalendar from '@/pages/school/admin/AcademicCalendar';

export default function TeacherCalendar() {
  return (
    <AcademicCalendar
      calendarLabel="Teacher Calendar"
      calendarDescription="Month, week, day and agenda planning for classes, academic events, exams, holidays and live sessions."
      quickTitle="Class Calendar + Live Sessions"
      quickDescription="Plan classroom events, attach meeting links, assign subjects, and keep the teacher workspace synced with the institute academic calendar."
      quickActionLabel="Schedule Class Event"
    />
  );
}
