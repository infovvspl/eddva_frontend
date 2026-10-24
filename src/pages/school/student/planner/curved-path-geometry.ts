import type { StepKind, StepStatus, ThreadRound } from "@/lib/api/learning-path";

/**
 * Geometry of the curved path: steps zig-zag between two columns, and each
 * later round starts below a separator. Pure, so it is unit-tested.
 */

export const PATH_WIDTH = 240;
export const LEFT_X = 48;
export const RIGHT_X = 192;
const STEP_GAP = 84;
const ROUND_GAP = 56;
const TOP = 36;

export interface PathPoint {
  stepId: string;
  kind: StepKind;
  status: StepStatus;
  round: number;
  x: number;
  y: number;
}

export interface PathGeometry {
  points: PathPoint[];
  /** One label per round after the first, placed above its first step. */
  separators: { round: number; y: number; focusConcepts: string[] }[];
  /** Segments between consecutive points; `reached` when the next step is open or done. */
  segments: { d: string; reached: boolean }[];
  height: number;
}

export function pathGeometry(rounds: ThreadRound[]): PathGeometry {
  const points: PathPoint[] = [];
  const separators: PathGeometry["separators"] = [];
  let y = TOP;
  let i = 0;
  for (const [r, round] of rounds.entries()) {
    if (r > 0) {
      separators.push({ round: round.round, y: y - STEP_GAP / 2 + ROUND_GAP / 2 - 18, focusConcepts: round.focusConcepts });
      y += ROUND_GAP;
    }
    for (const step of round.steps) {
      points.push({ stepId: step.id, kind: step.kind, status: step.status, round: round.round, x: i % 2 === 0 ? LEFT_X : RIGHT_X, y });
      y += STEP_GAP;
      i++;
    }
  }
  const segments = points.slice(1).map((p, k) => {
    const a = points[k];
    const midY = (a.y + p.y) / 2;
    return {
      d: `M ${a.x} ${a.y} C ${a.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`,
      reached: p.status === "active" || p.status === "done",
    };
  });
  return { points, separators, segments, height: points.length ? y - STEP_GAP + TOP + 28 : 0 };
}
