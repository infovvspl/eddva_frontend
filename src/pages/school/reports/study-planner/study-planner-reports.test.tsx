import "@testing-library/jest-dom/vitest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReportOverview, StudentReport } from "@/lib/api/learning-reports";

const api = vi.hoisted(() => ({ overview: vi.fn(), student: vi.fn(), children: vi.fn() }));
vi.mock("@/lib/api/learning-reports", async (orig) => ({ ...(await orig<object>()), learningReportsApi: api }));
vi.mock("@/components/school/breadcrumbs/BreadcrumbContext", () => ({ useSetBreadcrumbLabel: vi.fn() }));

import StudyPlannerOverview from "./StudyPlannerOverview";
import StudentStudyReport from "./StudentStudyReport";
import StudyPlannerDashboardCard, { plannerSnapshot, shareLabel } from "./StudyPlannerDashboardCard";

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});

const row = (over: Partial<ReportOverview["students"][number]>) => ({
  studentId: "s1", userId: "u1", name: "Asha", rollNo: "7", className: "Class 10", sectionName: "A",
  seconds: 5400, activeDays: 4, stepsDone: 3, lastActiveDay: "2026-10-23", engagementScore: 82, engagementLevel: "high" as const,
  inactive: false, weakTopics: 2, atRiskTopics: 1, topicsStarted: 2, topicsCompleted: 1, improvement: 12, effortWithoutGain: false, ...over,
});

const overview: ReportOverview = {
  viewer: "teacher", period: "month", granularity: "day", from: "2026-09-25", to: "2026-10-24",
  filters: { classes: [{ id: "c10", name: "Class 10", sections: [{ id: "A", name: "A" }] }], subjects: [{ id: "sci", name: "Science" }] },
  totals: { students: 3, activeStudents: 2, seconds: 9000, averageSecondsPerActiveStudent: 4500, averageEngagement: 55, averageImprovement: 4.5, inactive: 1, lowEngagement: 0, effortWithoutGain: 1 },
  trend: Array.from({ length: 30 }, (_, i) => ({ period: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`, seconds: i === 29 ? 600 : 0, activeStudents: i === 29 ? 1 : 0 })),
  lists: {
    inactive: [{ studentId: "s3", userId: "u3", name: "Ravi", className: "Class 10", sectionName: "A", seconds: 0, engagementScore: 0, lastActiveDay: null, improvement: null }],
    lowEngagement: [],
    effortWithoutGain: [{ studentId: "s2", userId: "u2", name: "Meera", className: "Class 10", sectionName: "A", seconds: 3600, engagementScore: 50, lastActiveDay: "2026-10-22", improvement: -3 }],
  },
  weakTopics: [{ name: "Magnetic field lines", subjectName: "Science", weakStudents: 2, atRiskStudents: 1 }],
  students: [row({}), row({ studentId: "s2", userId: "u2", name: "Meera", improvement: -3, effortWithoutGain: true }), row({ studentId: "s3", userId: "u3", name: "Ravi", seconds: 0, inactive: true, lastActiveDay: null, improvement: null })],
};

const student: StudentReport = {
  viewer: "teacher", period: "month", granularity: "day", from: "2026-09-25", to: "2026-10-24",
  student: { studentId: "s2", userId: "u2", name: "Meera", rollNo: "9", className: "Class 10", sectionName: "A" },
  allSubjects: false,
  summary: { seconds: 3600, activeDays: 3, stepsDone: 2, engagementScore: 50, engagementLevel: "medium", inactive: false, lastActiveDay: "2026-10-22", streakDays: 2, improvement: -3, effortWithoutGain: true, topicsStarted: 1, topicsCompleted: 0 },
  trend: overview.trend,
  bySection: [{ section: "notes", seconds: 2400 }, { section: "videos", seconds: 1200 }],
  bySubject: [{ subjectId: "sci", name: "Science", seconds: 3600 }],
  subjects: [{
    subjectId: "sci", name: "Science", seconds: 3600,
    weakChapters: [{ name: "Magnetic Effects", mastery: 18 }], atRiskChapters: [],
    weakTopics: [{ name: "Magnetic field lines", chapterName: "Magnetic Effects", mastery: 18 }], atRiskTopics: [],
    focusAreas: ["Right hand thumb rule"], improvement: -3,
    paths: [{ topicName: "Magnetic field lines", chapterName: "Magnetic Effects", status: "active", round: 2, baseline: 18, latest: 15, improvement: -3, seconds: 3600, lastActivityAt: "2026-10-22T10:00:00Z" }],
  }],
};

const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);

describe("study planner overview", () => {
  beforeEach(() => api.overview.mockResolvedValue(overview));

  it("shows totals, the usage trend and the watch lists on the Overview tab", async () => {
    wrap(<StudyPlannerOverview embedded studentHref={(id) => `/school/teacher/reports/student/${id}?tab=study-planner`} />);
    expect(await screen.findByRole("heading", { name: "AI Study Planner" })).toBeInTheDocument();
    expect(screen.getByText("Your students and subjects.", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("2h 30m")).toBeInTheDocument(); // total study time
    expect(screen.getByText("Inactive (1)")).toBeInTheDocument();
    expect(screen.getByText("Time without improvement (1)")).toBeInTheDocument();
    expect(screen.getByText("Magnetic field lines")).toBeInTheDocument();
    // the full roster lives in its own tab, not here
    expect(screen.queryByRole("link", { name: "Asha" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Students \(3\)/ })).toBeInTheDocument();
  });

  it("shows every student, by time beside improvement, in a separate paginated Students tab", async () => {
    wrap(<StudyPlannerOverview studentHref={(id) => `/school/teacher/reports/student/${id}?tab=study-planner`} />);
    await screen.findByText("Study planner report");
    // Radix activates a tab on mousedown (or focus/Enter), not a bare click.
    fireEvent.mouseDown(screen.getByRole("tab", { name: /Students \(3\)/ }), { button: 0 });
    // each student opens their own page on its Study Planner tab, by user id (what the student pages use)
    const links = await screen.findAllByRole("link", { name: "Asha" });
    expect(links[0]).toHaveAttribute("href", "/school/teacher/reports/student/u1?tab=study-planner");
    expect(screen.getAllByText("−3 pts").length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "pagination" })).toBeInTheDocument(); // even on a single page
  });

  it("asks the server again when a filter or the period changes, and offers Today alongside Last 7 days", async () => {
    wrap(<StudyPlannerOverview studentHref={(id) => `/x/${id}`} />);
    await screen.findByText("Study planner report");
    fireEvent.change(screen.getByRole("combobox", { name: "Subject" }), { target: { value: "sci" } });
    await waitFor(() => expect(api.overview).toHaveBeenLastCalledWith(expect.objectContaining({ subjectId: "sci" })));
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));
    await waitFor(() => expect(api.overview).toHaveBeenLastCalledWith(expect.objectContaining({ period: "week" })));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    await waitFor(() => expect(api.overview).toHaveBeenLastCalledWith(expect.objectContaining({ period: "today" })));
  });

  it("searches the students, inside the Students tab", async () => {
    wrap(<StudyPlannerOverview studentHref={(id) => `/x/${id}`} />);
    await screen.findByText("Study planner report");
    // Radix activates a tab on mousedown (or focus/Enter), not a bare click.
    fireEvent.mouseDown(screen.getByRole("tab", { name: /Students \(3\)/ }), { button: 0 });
    fireEvent.change(await screen.findByRole("textbox", { name: "Search students" }), { target: { value: "ravi" } });
    expect(screen.getByRole("tab", { name: /Students \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Students (1)" })).toBeInTheDocument(); // the table's own title, distinct from the tab
  });

  it("does not show a redundant date range when 'Today' makes the period a single day", async () => {
    // a month's worth of data has a real from/to range...
    api.overview.mockResolvedValue({ ...overview, from: "2026-09-25", to: "2026-10-24" });
    wrap(<StudyPlannerOverview studentHref={(id) => `/x/${id}`} />);
    await screen.findByText("Study planner report");
    expect(screen.getByText(/2026-09-25 to 2026-10-24/)).toBeInTheDocument();

    // ...but a single day's from and to are the same, so the range is not repeated
    api.overview.mockResolvedValue({ ...overview, from: "2026-10-24", to: "2026-10-24" });
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    await waitFor(() => expect(api.overview).toHaveBeenLastCalledWith(expect.objectContaining({ period: "today" })));
    expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(screen.queryByText(/to 2026-10-24/)).not.toBeInTheDocument());
  });
});

describe("student study report", () => {
  beforeEach(() => api.student.mockResolvedValue(student));

  it("shows engagement, time, weak and focus areas, and each topic's time against improvement", async () => {
    wrap(<StudentStudyReport studentId="s2" backHref="/back" backLabel="Study planner report" />);
    expect(await screen.findByRole("heading", { name: "Meera" })).toBeInTheDocument();
    expect(screen.getByText("Showing the subjects you teach this student.")).toBeInTheDocument();
    expect(screen.getByText(/Putting in time \(1h 00m\) without improving much/)).toBeInTheDocument();
    expect(screen.getByText("AI notes")).toBeInTheDocument(); // time by section
    expect(screen.getAllByText("Magnetic Effects", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText("Right hand thumb rule")).toBeInTheDocument();
    expect(screen.getByText("18% → 15%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Study planner report/ })).toHaveAttribute("href", "/back");
  });

  it("asks the server again for another trend granularity", async () => {
    wrap(<StudentStudyReport studentId="s2" />);
    await screen.findByRole("heading", { name: "Meera" });
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    await waitFor(() => expect(api.student).toHaveBeenLastCalledWith("s2", expect.objectContaining({ trend: "month" })));
  });
});

describe("study planner tab inside a student page", () => {
  it("shows the report under an 'AI Study Planner' heading, without a back link or the student's name as the title", async () => {
    api.student.mockResolvedValue({ ...student, allSubjects: true });
    wrap(<StudentStudyReport studentId="u2" embedded backHref="/ignored" />);
    expect(await screen.findByRole("heading", { name: "AI Study Planner" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Meera" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Back|ignored/ })).not.toBeInTheDocument();
    expect(api.student).toHaveBeenCalledWith("u2", expect.anything()); // the page's own id (a user id works)
  });
});

describe("admin dashboard study planner card", () => {
  it("counts students who never opened the planner as not started, not as problems", () => {
    const snap = plannerSnapshot([
      row({ studentId: "a" }), // studying, high
      row({ studentId: "b", engagementLevel: "low", engagementScore: 20, seconds: 600, improvement: -1, effortWithoutGain: false }), // studying, low
      row({ studentId: "c", seconds: 0, inactive: true, lastActiveDay: "2026-09-01", topicsStarted: 1, improvement: null }), // stopped
      row({ studentId: "d", seconds: 0, inactive: true, lastActiveDay: null, topicsStarted: 0, improvement: null, engagementLevel: "low", engagementScore: 0 }), // never started
    ]);
    expect(snap).toMatchObject({ total: 4, started: 3, activeNow: 2, engagement: 51, levels: { high: 1, medium: 0, low: 1 }, measured: 2, improvement: 5.5 });
    expect(snap.attention).toEqual({ stopped: 1, lowEngagement: 1, noGain: 0, total: 2 });
  });

  it("never shows a misleading 0% when some students have started", () => {
    expect(shareLabel(1, 1231)).toBe("<1%");
    expect(shareLabel(0, 1231)).toBe("0%");
    expect(shareLabel(310, 1231)).toBe("25%");
  });

  it("shows headline tiles and charts only: no student lists, table or links", async () => {
    api.overview.mockResolvedValue({ ...overview, viewer: "admin" });
    wrap(<StudyPlannerDashboardCard />);
    expect(await screen.findByText("students have started")).toBeInTheDocument();
    for (const title of ["Adoption", "Engagement", "Improvement", "Need attention", "Weekly activity", "Most common weak topics"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(screen.getByText("Magnetic field lines")).toBeInTheDocument(); // the full topic name, not cut off
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(api.overview).toHaveBeenLastCalledWith({ period: "month", trend: "week" });
  });

  it("says so when no student has started yet, instead of empty charts", async () => {
    api.overview.mockResolvedValue({ ...overview, students: [row({ seconds: 0, inactive: true, lastActiveDay: null, topicsStarted: 0, improvement: null })] });
    wrap(<StudyPlannerDashboardCard />);
    expect(await screen.findByText(/No student has started the AI Study Planner yet/)).toBeInTheDocument();
    expect(screen.queryByText("Weekly activity")).not.toBeInTheDocument();
  });

  it("stays out of the way if the report cannot load", async () => {
    api.overview.mockRejectedValue(new Error("down"));
    const { container } = wrap(<StudyPlannerDashboardCard />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
