import AcademicCalendarPage from "@/pages/calendar/AcademicCalendarPage";

/** Institute admin — same calendar as teachers/students, with edit rights. */
export default function AdminCalendarPage() {
  return <AcademicCalendarPage canManageEvents pageTitle="Academic Calendar" />;
}
