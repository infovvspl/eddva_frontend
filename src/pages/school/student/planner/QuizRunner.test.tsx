import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { QuizInProgress, QuizResult } from "@/lib/api/learning-path";

vi.mock("@/components/shared/MarkdownRenderer", () => ({ MarkdownRenderer: ({ content }: { content: string }) => <span>{content}</span> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const api = vi.hoisted(() => ({ saveDraft: vi.fn(), submitQuiz: vi.fn(), quiz: vi.fn() }));
vi.mock("@/lib/api/learning-path", async (orig) => {
  const real = await orig<typeof import("@/lib/api/learning-path")>();
  return { ...real, learningApi: { ...real.learningApi, ...api } };
});

import { QuizRunner } from "./QuizRunner";

const quiz: QuizInProgress = {
  instanceId: "inst-1",
  kind: "quiz",
  status: "in_progress",
  round: 1,
  topicId: "t1",
  questions: [
    { id: "q1", text: "First?", conceptTag: "A", options: [{ id: "q1o1", text: "Yes" }, { id: "q1o2", text: "No" }] },
    { id: "q2", text: "Second?", conceptTag: "B", options: [{ id: "q2o1", text: "Up" }, { id: "q2o2", text: "Down" }] },
  ],
  draftAnswers: {},
  startedAt: new Date().toISOString(),
  expiresAt: null,
  remainingSeconds: null,
};

const result: QuizResult = {
  instanceId: "inst-1",
  kind: "quiz",
  status: "submitted",
  round: 1,
  topicId: "t1",
  submittedAt: new Date().toISOString(),
  score: 1,
  total: 2,
  accuracy: 50,
  weakConcepts: [{ conceptTag: "B", correct: 0, total: 2, accuracy: 0 }],
  questions: [
    { id: "q1", text: "First?", conceptTag: "A", options: quiz.questions[0].options, yourAnswer: "q1o1", correctOptionId: "q1o1", isCorrect: true, explanation: "Because yes." },
    { id: "q2", text: "Second?", conceptTag: "B", options: quiz.questions[1].options, yourAnswer: null, correctOptionId: "q2o2", isCorrect: false, explanation: "Gravity." },
  ],
};

const renderRunner = (props: Partial<React.ComponentProps<typeof QuizRunner>> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <QuizRunner quiz={quiz} threadId="th-1" {...props} />
    </QueryClientProvider>,
  );

describe("QuizRunner", () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.values(api).forEach((f) => f.mockReset());
  });

  it("autosaves answers as the student picks them", async () => {
    api.saveDraft.mockResolvedValue({ saved: true, answered: 1, savedAt: "now" });
    renderRunner();
    fireEvent.click(screen.getByLabelText(/Yes/));
    await waitFor(() => expect(api.saveDraft).toHaveBeenCalledWith("inst-1", { q1: "q1o1" }), { timeout: 2000 });
    expect(await screen.findByText(/saved$/)).toBeInTheDocument();
  });

  it("warns about unanswered questions before submitting, then shows the graded result", async () => {
    api.saveDraft.mockResolvedValue({ saved: true, answered: 1, savedAt: "now" });
    api.submitQuiz.mockResolvedValue(result);
    renderRunner();
    fireEvent.click(screen.getByLabelText(/Yes/));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByText(/1 question unanswered/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Submit" }).at(-1)!);
    await waitFor(() => expect(api.submitQuiz).toHaveBeenCalledWith("inst-1", { q1: "q1o1" }));
    expect(await screen.findByText("50%")).toBeInTheDocument();
    expect(screen.getByText("B · 0%")).toBeInTheDocument();
    expect(screen.getByText("Gravity.")).toBeInTheDocument();
    expect(screen.getByText("Not answered")).toBeInTheDocument();
  });

  it("shows the existing result if the attempt was already graded elsewhere", async () => {
    api.submitQuiz.mockRejectedValue({ response: { data: { message: "This attempt has already been submitted" } } });
    api.quiz.mockResolvedValue(result);
    renderRunner({ quiz: { ...quiz, questions: [quiz.questions[0]] } });
    fireEvent.click(screen.getByLabelText(/Yes/));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("50%")).toBeInTheDocument();
  });

  it("offers a new quiz after a quiz, but never a second assessment attempt", () => {
    const onRetake = vi.fn();
    const { rerender } = renderRunner({ quiz: result, onRetake });
    fireEvent.click(screen.getByRole("button", { name: /Try a new quiz/ }));
    expect(onRetake).toHaveBeenCalled();
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <QuizRunner quiz={{ ...result, kind: "assessment" }} threadId="th-1" onRetake={onRetake} />
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("button", { name: /Try a new quiz/ })).toBeNull();
  });

  it("submits the saved answers when an assessment's time runs out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    api.submitQuiz.mockResolvedValue({ ...result, kind: "assessment", status: "auto_submitted" });
    renderRunner({ quiz: { ...quiz, kind: "assessment", remainingSeconds: 2, expiresAt: new Date(Date.now() + 2000).toISOString() } });
    expect(screen.getByRole("timer")).toHaveTextContent("0:02");
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await waitFor(() => expect(api.submitQuiz).toHaveBeenCalled());
    expect(await screen.findByText(/submitted when time ran out/)).toBeInTheDocument();
  });
});
