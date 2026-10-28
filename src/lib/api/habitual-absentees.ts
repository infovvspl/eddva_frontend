import schoolApi, { unwrapSchoolData } from "@/lib/api/school-client";

export interface HabitualAbsentee {
  userId: string;
  name: string;
  avatar: string | null;
  rollNo: string | null;
  className: string | null;
  sectionName: string | null;
  absences: number;
  totalSessions: number;
  attendancePercentage: number;
  currentStreak: number;
}

export const habitualAbsenteesApi = {
  /** Students in the teacher's own sections absent 3+ times, or on a 3+ day absence streak, in the last `days` (default 30). */
  list: (days = 30) =>
    schoolApi
      .get(`/teacher/habitual-absentees`, { params: { days } })
      .then((res) => unwrapSchoolData<HabitualAbsentee[]>(res, [])),
};
