import "@testing-library/jest-dom/vitest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { LearningHome, ThreadView } from "@/lib/api/learning-path";

vi.mock("@/components/shared/MarkdownRenderer", () => ({ MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/hooks/use-activity-tracker", () => ({ useActivityTracker: vi.fn() }));
const api = vi.hoisted(() => ({
  home: vi.fn(),
  threads: vi.fn(),
  myEngagement: vi.fn(),
  openThread: vi.fn(),
  thread: vi.fn(),
  openStep: vi.fn(),
  stepProgress: vi.fn(),
  postMessage: vi.fn(),
  saveNotes: vi.fn(),
}));
vi.mock("@/lib/api/learning-path", async (orig) => {
  const real = await orig<typeof import("@/lib/api/learning-path")>();
  return { ...real, learningApi: { ...real.learningApi, ...api } };
});

import PlannerHome from "./PlannerHome";
import PlannerShell from "./PlannerShell";
import RoadmapPage from "./RoadmapPage";
import ThreadPage from "./ThreadPage";

beforeAll(() => {
  // reactflow measures the canvas.
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  (globalThis as any).DOMMatrixReadOnly = class {
    m22 = 1;
    constructor() {}
  };
  Element.prototype.scrollTo = function () {} as any;
  Element.prototype.scrollIntoView = function () {} as any;
});

const home: LearningHome = {
  summary: { weakTopics: 2, atRiskTopics: 1, weakChapters: 1, atRiskChapters: 0, studyMinutes: 125, detectedFrom: { assessment: 4, game: 8 }, updatedAt: null },
  roadmapsPending: false,
  mindMap: [
    {
      subjectId: "s1", name: "Science", weakChapters: 1, atRiskChapters: 0, hiddenChapters: 5,
      chapters: [{
        chapterId: "c1", name: "Magnetic Effects", status: "weak", mastery: 18, estMinutes: 65, expanded: true, roadmapState: "ready",
        topics: [{
          topicId: "t1", name: "Magnetic field lines", order: 1, status: "weak", mastery: 18, estMinutes: 65, roadmapState: "ready", thread: null, children: [],
          subtopics: [{ name: "Bar magnet field", order: 1, status: "not_assessed", accuracy: null, answered: 0 }],
        }],
      }, {
        chapterId: "c2", name: "Light", status: "ok", mastery: 74, estMinutes: 20, expanded: false, roadmapState: null,
        topics: [{
          topicId: "t5", name: "Refraction", order: null, status: "weak", mastery: 30, estMinutes: 20, roadmapState: "ready", thread: null, children: [],
          subtopics: [{ name: "Snell's law", order: 1, status: "weak", accuracy: 20, answered: 5 }],
        }],
      }],
    },
  ],
};

const thread: ThreadView = {
  thread: {
    id: "th1", scope: "topic", status: "active", origin: "mind_map", parentThreadId: null, topicId: "t1", topicName: "Magnetic field lines",
    chapterId: "c1", chapterName: "Magnetic Effects", subjectId: "s1", subjectName: "Science", round: 1, currentStepId: "st-notes",
    baselineMastery: 18, latestMastery: null, lastActivityAt: "2026-10-23T10:00:00Z", weakConcepts: [],
  },
  rounds: [{
    round: 1, focusConcepts: [],
    steps: [
      { id: "st-videos", kind: "videos", status: "done", refId: null, completedAt: null, watchedCount: 1 },
      { id: "st-notes", kind: "notes", status: "active", refId: null, completedAt: null, watchedCount: 0 },
      { id: "st-quiz", kind: "quiz", status: "locked", refId: null, completedAt: null, watchedCount: 0 },
      { id: "st-assessment", kind: "assessment", status: "locked", refId: null, completedAt: null, watchedCount: 0 },
    ],
  }],
  messages: [
    { id: "m1", role: "ai", kind: "welcome", stepId: null, round: 1, content: { topicName: "Magnetic field lines", baselineMastery: 18 }, createdAt: "2026-10-23T10:00:00Z" },
    { id: "m2", role: "ai", kind: "notes_card", stepId: "st-notes", round: 1, content: { sessionId: "n1", focusConcepts: [] }, createdAt: "2026-10-23T10:01:00Z" },
  ],
  nextCursor: null,
  resume: { stepId: "st-notes", kind: "notes", refId: null },
  assessmentInProgress: false,
};

function wrap(ui: React.ReactNode, path = "/school/student/planner") {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/school/student/planner" element={ui} />
          <Route path="/school/student/planner/chapter/:chapterId" element={<RoadmapPage kind="chapter" />} />
          <Route path="/school/student/planner/topic/:topicId" element={<RoadmapPage kind="topic" />} />
          <Route path="/school/student/planner/t/:threadId" element={<ThreadPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PlannerHome", () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    api.home.mockResolvedValue(home);
    api.threads.mockResolvedValue([]);
    api.myEngagement.mockResolvedValue({ todaySeconds: 600, weekSeconds: 5400, byDay: [], bySubject: [], bySection: [], streakDays: 3 });
    try { localStorage.removeItem("planner-roadmap-view"); } catch { /* ignore */ }
  });

  it("shows what was found weak, the study time, and — once its subject is opened — the weak chapter and topic headings", async () => {
    const { container } = wrap(<PlannerHome />);
    expect(await screen.findByText("Your learning roadmap")).toBeInTheDocument();
    expect(screen.getByText(/4 assessments, 8 games/)).toBeInTheDocument();
    expect(screen.getByText("2h 05m")).toBeInTheDocument();
    expect(screen.getByText(/3-day streak/)).toBeInTheDocument();
    // Collapsed by default: the subject shows, its weak chapters/topics do not yet.
    await screen.findByText("Science");
    expect(screen.queryByText("Magnetic Effects")).not.toBeInTheDocument();
    const subjectNode = Array.from(container.querySelectorAll<HTMLElement>(".react-flow__node")).find((n) => n.textContent?.includes("Science"))!;
    fireEvent.click(subjectNode);
    expect(await screen.findByText("Magnetic Effects")).toBeInTheDocument(); // weak chapter
    expect(screen.getByText("Refraction")).toBeInTheDocument(); // weak topic of a chapter that is fine
    expect(screen.queryByText(/Magnetic field lines/)).not.toBeInTheDocument(); // the chapter's topics wait for its page
    expect(screen.queryByText("Bar magnet field")).not.toBeInTheDocument();
  });

  it("lets the student click a subject to open its branches, then a mind-map node to open its roadmap", async () => {
    const { container } = wrap(<PlannerHome />);
    await screen.findByText("Science");
    const nodesBefore = Array.from(container.querySelectorAll<HTMLElement>(".react-flow__node"));
    expect(nodesBefore.length).toBeGreaterThan(0);
    // React Flow turns clicks off (pointer-events: none) on a node unless the flow handles clicks.
    nodesBefore.forEach((n) => expect(n.style.pointerEvents).not.toBe("none"));
    const subjectNode = nodesBefore.find((n) => n.textContent?.includes("Science"))!;
    fireEvent.click(subjectNode);
    expect(await screen.findByText("Magnetic Effects")).toBeInTheDocument();
    const chapterNode = Array.from(container.querySelectorAll<HTMLElement>(".react-flow__node")).find((n) => n.textContent?.includes("Magnetic Effects"))!;
    fireEvent.click(chapterNode);
    expect(await screen.findByRole("heading", { name: "Magnetic Effects" })).toBeInTheDocument();
    expect(screen.getByText(/Chapter roadmap/)).toBeInTheDocument();
  });

  it("opens a weak chapter's roadmap, then a topic's learning path", async () => {
    api.openThread.mockResolvedValue(thread);
    api.thread.mockResolvedValue(thread);
    wrap(<PlannerHome />);
    fireEvent.click(await screen.findByRole("button", { name: "List" }));
    fireEvent.click(screen.getByRole("link", { name: /Magnetic Effects/ }));
    expect(await screen.findByRole("heading", { name: "Magnetic Effects" })).toBeInTheDocument();
    expect(screen.getByText(/Chapter roadmap/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bar magnet field" })).toBeInTheDocument(); // subtopics show
    fireEvent.click(screen.getByRole("button", { name: /Magnetic field lines/ }));
    await waitFor(() => expect(api.openThread).toHaveBeenCalledWith({ topicId: "t1", focusSubtopic: undefined }));
    expect((await screen.findAllByText("Your path for Magnetic field lines"))[0]).toBeInTheDocument();
  });

  it("opens a weak topic's own roadmap of subtopics", async () => {
    api.openThread.mockResolvedValue(thread);
    api.thread.mockResolvedValue(thread);
    wrap(<div />, "/school/student/planner/topic/t5");
    expect(await screen.findByRole("heading", { name: "Refraction" })).toBeInTheDocument();
    expect(screen.getByText(/Science · Light · Topic roadmap/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "List" }));
    fireEvent.click(screen.getByRole("button", { name: "Snell's law" }));
    await waitFor(() => expect(api.openThread).toHaveBeenCalledWith({ topicId: "t5", focusSubtopic: "Snell's law" }));
  });

  it("says so when a roadmap is no longer on the list", async () => {
    wrap(<div />, "/school/student/planner/chapter/c2"); // fine chapter: no chapter roadmap
    expect(await screen.findByText("This chapter is no longer on your roadmap")).toBeInTheDocument();
  });

  it("says so when nothing is weak", async () => {
    api.home.mockResolvedValue({ ...home, mindMap: [{ ...home.mindMap[0], chapters: [] }] });
    wrap(<PlannerHome />);
    expect(await screen.findByText("Nothing weak right now")).toBeInTheDocument();
  });
});

describe("ThreadPage", () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    api.thread.mockResolvedValue(thread);
    api.threads.mockResolvedValue([]);
    api.home.mockResolvedValue(home);
  });

  it("links back to the chapter's roadmap", async () => {
    wrap(<div />, "/school/student/planner/t/th1");
    await waitFor(() => expect(screen.getByRole("link", { name: /Back to roadmap/ })).toHaveAttribute("href", "/school/student/planner/chapter/c1"));
  });

  it("shows the path and the chat, opens the notes and finishes them", async () => {
    api.openStep.mockResolvedValue({
      stepId: "st-notes", kind: "notes",
      notes: {
        sessionId: "n1", topicId: "t1", threadId: "th1", round: 1, focusConcepts: [], lessonMarkdown: "## Core idea\nField lines run north to south.",
        keyConcepts: [], formulas: [], practiceQuestions: [], commonMistakes: [], highlights: [], inlineComments: [], lastAnchor: null, timeSpentSeconds: 0,
      },
    });
    api.stepProgress.mockResolvedValue({ stepId: "st-notes", status: "done", unlocked: "st-quiz" });
    wrap(<div />, "/school/student/planner/t/th1");

    expect(await screen.findByRole("heading", { name: "Magnetic field lines" })).toBeInTheDocument();
    // the welcome sits below the curved path, with the score before starting
    expect(screen.getAllByText("Your path for Magnetic field lines")[0].closest("aside")).not.toBeNull();
    expect(screen.getAllByText(/Your score here before starting/)[0]).toHaveTextContent("18%");
    expect(screen.getAllByRole("button", { name: /Quiz · locked/ })[0]).toBeDisabled();

    expect(screen.queryByText("Your AI notes are ready")).not.toBeInTheDocument(); // the notes card is no longer shown
    fireEvent.click(screen.getAllByRole("button", { name: /AI notes · open/ })[0]); // opened from the curved path
    expect(await screen.findByText(/Field lines run north to south/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /I've finished these notes/ }));
    await waitFor(() => expect(api.stepProgress).toHaveBeenCalledWith("th1", "st-notes", { notesDone: true }));
  });

  it("turns a step blue once it has been opened, such as a video that was started", async () => {
    const steps = thread.rounds[0].steps.map((st) => (st.kind === "videos" ? { ...st, status: "active" as const, opened: true } : st));
    api.thread.mockResolvedValue({ ...thread, rounds: [{ ...thread.rounds[0], steps }] });
    wrap(<div />, "/school/student/planner/t/th1");
    expect((await screen.findAllByRole("button", { name: "Videos · in progress" }))[0]).toBeInTheDocument();
  });

  it("shows the path first when opened from a subtopic, instead of jumping into the notes", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[{ pathname: "/school/student/planner/t/th1", state: { focusSubtopic: "Bar magnet field" } }]}>
          <Routes><Route path="/school/student/planner/t/:threadId" element={<ThreadPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect((await screen.findAllByText("Your path for Magnetic field lines"))[0]).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 50));
    expect(api.openStep).not.toHaveBeenCalled();
  });

  it("pauses the chat while an assessment is open", async () => {
    api.thread.mockResolvedValue({ ...thread, assessmentInProgress: true });
    wrap(<div />, "/school/student/planner/t/th1");
    expect(await screen.findByText(/Chat is paused while your assessment is open/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled();
  });
});

describe("PlannerShell", () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    api.threads.mockResolvedValue([]);
    api.home.mockResolvedValue(home);
  });

  const shell = (path: string) =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/school/student/planner" element={<PlannerShell />}>
              <Route index element={<p>home page</p>} />
              <Route path="t/:threadId" element={<ThreadPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("shows the list of chats beside the roadmap", async () => {
    shell("/school/student/planner");
    expect(await screen.findByText("home page")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /My roadmap/ }).length).toBeGreaterThan(0);
  });

  it("shows a topic's curved path on its own, without the sidebar", async () => {
    api.thread.mockResolvedValue(thread);
    shell("/school/student/planner/t/th1");
    expect((await screen.findAllByText("Your path for Magnetic field lines"))[0]).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /My roadmap/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open your chats/ })).not.toBeInTheDocument();
  });

  it("keeps the sidebar for the general AI Tutor chat", async () => {
    api.thread.mockResolvedValue({ ...thread, thread: { ...thread.thread, scope: "general", topicId: null, topicName: null }, rounds: [], messages: [] });
    shell("/school/student/planner/t/th1");
    expect(await screen.findByRole("heading", { name: "AI Tutor" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /My roadmap/ }).length).toBeGreaterThan(0);
  });
});
