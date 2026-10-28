import schoolApi, { unwrapSchoolData } from "@/lib/api/school-client";

export type BirthdayRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface UpcomingBirthday {
  userId: string;
  name: string;
  avatar: string | null;
  role: BirthdayRole;
  dob: string;
  daysLeft: number;
  isToday: boolean;
  className: string | null;
  sectionName: string | null;
}

export const birthdaysApi = {
  upcoming: (days = 7) =>
    schoolApi
      .get(`/dashboard/birthdays`, { params: { days } })
      .then((res) => unwrapSchoolData<UpcomingBirthday[]>(res, [])),
};

const ROLE_LABEL: Record<BirthdayRole, string> = { STUDENT: "Student", TEACHER: "Teacher", ADMIN: "Admin" };

/** "Class 5 - A" for a student with a section, else just the role label. */
export function birthdaySubtitle(b: Pick<UpcomingBirthday, "role" | "className" | "sectionName">): string {
  if (b.role === "STUDENT" && b.className) {
    return b.sectionName ? `${b.className} - ${b.sectionName}` : b.className;
  }
  return ROLE_LABEL[b.role];
}
