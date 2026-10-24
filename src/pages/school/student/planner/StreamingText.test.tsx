import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ThreadMessage } from "@/lib/api/learning-path";

vi.mock("@/components/shared/MarkdownRenderer", () => ({ MarkdownRenderer: ({ content }: { content: string }) => <p data-testid="md">{content}</p> }));

import { MessageList } from "./MessageList";
import { REVEAL_TICK_MS, StreamingText } from "./StreamingText";

const ANSWER = "A bar magnet has a north pole and a south pole. Field lines run from north to south outside it.";
const shownText = () => screen.getByTestId("md").textContent ?? "";
/** Each reveal schedules the next once React has redrawn, so time moves one step at a time. */
const tick = (steps: number) => {
  for (let i = 0; i < steps; i++) act(() => vi.advanceTimersByTime(REVEAL_TICK_MS));
};

describe("StreamingText", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("writes the answer out word by word, then calls onDone", () => {
    const onDone = vi.fn();
    const onGrow = vi.fn();
    render(<StreamingText text={ANSWER} onGrow={onGrow} onDone={onDone} />);
    expect(shownText()).toBe("");
    tick(3);
    const partial = shownText();
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(ANSWER.length);
    expect(ANSWER.startsWith(partial)).toBe(true);
    expect(onGrow).toHaveBeenCalled();
    tick(100);
    expect(shownText()).toBe(ANSWER);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows the rest at once when clicked", () => {
    render(<StreamingText text={ANSWER} />);
    tick(1);
    fireEvent.click(screen.getByTestId("md").parentElement!);
    expect(shownText()).toBe(ANSWER);
  });

  it("finishes a long answer in about five seconds", () => {
    const long = Array.from({ length: 2000 }, (_, i) => `word${i}`).join(" ");
    render(<StreamingText text={long} />);
    tick(Math.ceil(5_100 / REVEAL_TICK_MS)); // about five seconds of steps
    expect(shownText()).toBe(long);
  });

  it("shows everything at once for people who prefer reduced motion", () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} })) as any;
    try {
      render(<StreamingText text={ANSWER} />);
      expect(shownText()).toBe(ANSWER);
    } finally {
      window.matchMedia = matchMedia;
    }
  });
});

describe("MessageList while an answer is being written", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const msg = (id: string, content: Record<string, unknown>): ThreadMessage => ({ id, kind: "text", role: "ai", stepId: null, round: 1, createdAt: "2026-10-23T10:00:00Z", content });

  it("writes out only the new answer, and shows its quiz once it has finished", () => {
    const quiz = { questions: [{ question: "Which pole?", options: ["North", "South"], answerIndex: 0, explanation: "" }] };
    const { rerender } = render(
      <MessageList threadId="th1" topicName="X" onOpenStep={vi.fn()} onOpenTopic={vi.fn()} streamingId="new"
        messages={[msg("old", { text: "An earlier answer." }), msg("new", { text: ANSWER, quiz })]} />,
    );
    expect(screen.getByText("An earlier answer.")).toBeInTheDocument(); // older messages appear at once
    expect(screen.queryByText("Which pole?")).not.toBeInTheDocument(); // the quiz waits for the intro
    rerender(
      <MessageList threadId="th1" topicName="X" onOpenStep={vi.fn()} onOpenTopic={vi.fn()} streamingId={null}
        messages={[msg("old", { text: "An earlier answer." }), msg("new", { text: ANSWER, quiz })]} />,
    );
    expect(screen.getByText("Which pole?")).toBeInTheDocument();
  });
});
