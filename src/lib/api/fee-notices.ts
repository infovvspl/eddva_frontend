import schoolApi, { unwrapSchoolData } from "@/lib/api/school-client";

export interface FeeNoticeEntry {
  userId: string;
  name: string;
  avatar: string | null;
  className: string | null;
  sectionName: string | null;
  title: string;
  amount: number;
  amountPaid: number;
  paidDate?: string;
  dueDate?: string;
  daysLeft?: number;
}

export interface FeeNotices {
  recentDeposits: FeeNoticeEntry[];
  upcomingDues: FeeNoticeEntry[];
}

const EMPTY: FeeNotices = { recentDeposits: [], upcomingDues: [] };

export const feeNoticesApi = {
  /** Institute-wide fee deposits made, and fees coming due, in the last/next `days` (default 7). Admin-only. */
  list: (days = 7) =>
    schoolApi
      .get(`/dashboard/fee-notices`, { params: { days } })
      .then((res) => unwrapSchoolData<FeeNotices>(res, EMPTY)),
};
