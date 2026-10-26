import { describe, expect, it } from "vitest";
import type { ThreadRound } from "@/lib/api/learning-path";
import { LEFT_X, pathGeometry, RIGHT_X } from "./curved-path-geometry";

const round = (n: number, statuses: string[], focus: string[] = []): ThreadRound => ({
  round: n,
  focusConcepts: focus,
  steps: (["videos", "notes", "quiz", "assessment"] as const).map((kind, i) => ({
    id: `r${n}-${kind}`,
    kind,
    status: statuses[i] as any,
    refId: null,
    completedAt: null,
    watchedCount: 0,
  })),
});

describe("pathGeometry", () => {
  it("zig-zags the steps between the two columns, top to bottom", () => {
    const g = pathGeometry([round(1, ["done", "active", "locked", "locked"])]);
    expect(g.points.map((p) => p.x)).toEqual([LEFT_X, RIGHT_X, LEFT_X, RIGHT_X]);
    expect(g.points.every((p, i) => i === 0 || p.y > g.points[i - 1].y)).toBe(true);
  });

  it("draws a curve between each pair of steps, lit up to the open step", () => {
    const g = pathGeometry([round(1, ["done", "active", "locked", "locked"])]);
    expect(g.segments).toHaveLength(3);
    expect(g.segments.map((s) => s.reached)).toEqual([true, false, false]);
    expect(g.segments[0].d).toMatch(/^M \d+ \d+ C /);
  });

  it("adds a labelled separator above each later round, keeping the path continuous", () => {
    const g = pathGeometry([round(1, ["done", "done", "done", "skipped"]), round(2, ["active", "active", "locked", "locked"], ["Discriminant"])]);
    expect(g.points).toHaveLength(8);
    expect(g.segments).toHaveLength(7);
    expect(g.separators).toEqual([expect.objectContaining({ round: 2, focusConcepts: ["Discriminant"] })]);
    const firstOfRound2 = g.points.find((p) => p.stepId === "r2-videos")!;
    const lastOfRound1 = g.points.find((p) => p.stepId === "r1-assessment")!;
    expect(g.separators[0].y).toBeGreaterThan(lastOfRound1.y);
    expect(g.separators[0].y).toBeLessThan(firstOfRound2.y);
  });

  it("is empty without rounds", () => {
    expect(pathGeometry([])).toEqual({ points: [], separators: [], segments: [], height: 0 });
  });
});
