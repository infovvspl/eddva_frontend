import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ThreadMessage } from "@/lib/api/learning-path";

vi.mock("@/components/shared/MarkdownRenderer", () => ({ MarkdownRenderer: ({ content }: { content: string }) => <span>{content}</span> }));
const api = vi.hoisted(() => ({ saveChatQuizResult: vi.fn() }));
vi.mock("@/lib/api/learning-path", async (orig) => {
  const real = await orig<typeof import("@/lib/api/learning-path")>();
  return { ...real, learningApi: { ...real.learningApi, ...api } };
});

import { MessageList } from "./MessageList";

const msg = (id: string, kind: string, content: Record<string, unknown>, over: Partial<ThreadMessage> = {}): ThreadMessage => ({
  id, kind, content, role: "ai", stepId: null, round: 1, createdAt: "2026-10-23T10:00:00Z", ...over,
});

describe("MessageList", () => {
  it("shows the conversation and the path cards, and opens the right step", () => {
    const onOpenStep = vi.fn();
    const onOpenTopic = vi.fn();
    render(
      <MessageList
        threadId="th1"
        topicName="Discriminant"
        onOpenStep={onOpenStep}
        onOpenTopic={onOpenTopic}
        messages={[
          msg("1", "welcome", { topicName: "Discriminant", baselineMastery: 31.6 }),
          msg("2", "text", { text: "What is b² − 4ac?" }, { role: "student" }),
          msg("3", "text", { text: "It is the discriminant.", sources: [{ id: "s", url: "https://ncert.nic.in", title: "NCERT" }] }),
          msg("4", "quiz_result", { accuracy: 40, weakConcepts: [{ conceptTag: "Sign of the discriminant" }] }, { stepId: "step-quiz" }),
          msg("5", "path_extension", { round: 2, focusConcepts: ["Sign of the discriminant"], reason: "quiz" }),
          msg("6", "prerequisite_suggestion", { topicId: "t0", topicName: "Standard form" }),
          msg("7", "probe", { i: 1 }),
        ]}
      />,
    );
    expect(screen.queryByText(/before starting/)).not.toBeInTheDocument(); // the welcome sits below the curved path now
    expect(screen.getByText("What is b² − 4ac?")).toBeInTheDocument();
    expect(screen.getByText("Quiz: 40%")).toBeInTheDocument();
    expect(screen.getByText("Round 2 added below")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /See answers/ }));
    expect(onOpenStep).toHaveBeenCalledWith("step-quiz");
    fireEvent.click(screen.getByRole("button", { name: /Open it/ }));
    expect(onOpenTopic).toHaveBeenCalledWith("t0");
  });

  it("shows answers without citation marks or a sources list", () => {
    render(
      <MessageList threadId="th1" topicName="Magnetic field" onOpenStep={vi.fn()} onOpenTopic={vi.fn()}
        messages={[msg("1", "text", {
          text: "Place a compass near the wire; the needle points along the field line. [C4] Field lines never cross [C1, W2].",
          sources: [{ id: "C4", kind: "course", type: "textbook", title: "Magnetic Effects of Electric Current", label: "p. 3" }],
        })]} />,
    );
    expect(screen.getByText("Place a compass near the wire; the needle points along the field line. Field lines never cross.")).toBeInTheDocument();
    expect(screen.queryByText(/\[C4\]/)).not.toBeInTheDocument();
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
  });

  it("asks practice questions the student answers by tapping, with right or wrong and the explanation", async () => {
    api.saveChatQuizResult.mockResolvedValue({ quizResult: { answers: [1, 0], score: 1, total: 2, completedAt: "2026-10-23T10:00:00Z" } });
    const questions = [
      { question: "Where does a compass needle point near a wire?", options: ["Into the wire", "Along the field line", "Upwards"], answerIndex: 1, explanation: "It lines up with the magnetic field." },
      { question: "What do field lines never do?", options: ["Cross", "Curve"], answerIndex: 0, explanation: "Two directions at one point are impossible." },
    ];
    render(
      <MessageList threadId="th1" topicName="X" onOpenStep={vi.fn()} onOpenTopic={vi.fn()}
        messages={[msg("m1", "text", { text: "Here is a quick quiz.", quiz: { questions } })]} />,
    );
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "B) Along the field line" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("It lines up with the magnetic field.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A) Into the wire" })).toBeDisabled(); // one answer per question

    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    fireEvent.click(screen.getByRole("button", { name: "B) Curve" }));
    expect(screen.getByText("Not quite. The answer is A.")).toBeInTheDocument();
    expect(screen.getByText("Two directions at one point are impossible.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "See my score" }));
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
    expect(api.saveChatQuizResult).toHaveBeenCalledWith("th1", "m1", [1, 1]);
  });

  it("shows quiz questions, options and explanations without citation marks", () => {
    render(
      <MessageList threadId="th1" topicName="X" onOpenStep={vi.fn()} onOpenTopic={vi.fn()}
        messages={[msg("m1", "text", {
          text: "Quiz",
          quiz: { questions: [{ question: "Where does a compass needle point? [C4]", options: ["Along the field line [C2]", "Into the wire"], answerIndex: 0, explanation: "It lines up with the field. [C1, W2]" }] },
        })]} />,
    );
    expect(screen.getByText("Where does a compass needle point?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "A) Along the field line" }));
    expect(screen.getByText("It lines up with the field.")).toBeInTheDocument();
    expect(screen.queryByText(/\[C\d/)).not.toBeInTheDocument();
  });

  it("shows a saved quiz result when the chat is opened again", () => {
    render(
      <MessageList threadId="th1" topicName="X" onOpenStep={vi.fn()} onOpenTopic={vi.fn()}
        messages={[msg("m1", "text", {
          text: "Quiz",
          quiz: { questions: [{ question: "Q?", options: ["Yes", "No"], answerIndex: 0, explanation: "" }] },
          quizResult: { answers: [0], score: 1, total: 1, completedAt: "2026-10-23T10:00:00Z" },
        })]} />,
    );
    expect(screen.getByText("Quiz complete")).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("celebrates a completed topic with its improvement", () => {
    render(
      <MessageList threadId="th1" topicName="X" onOpenStep={vi.fn()} onOpenTopic={vi.fn()}
        messages={[msg("1", "path_complete", { baselineMastery: 30, latestMastery: 81.25 })]} />,
    );
    expect(screen.getByText("Topic complete!")).toBeInTheDocument();
    expect(screen.getByText(/was 30%, \+51 points/)).toBeInTheDocument();
  });
});
