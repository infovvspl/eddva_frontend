/**
 * The AI tutor marks facts with the id of the passage they came from, e.g.
 * [C4] (course) or [W2] (web). The planner chat does not show sources, so the
 * marks are removed: "[C4]", "[C1, W2]", "[C1][C3]".
 */
const CITATION = /[ \t]*\[(?:[CW]\d+)(?:\s*,\s*[CW]\d+)*\]/g;

export const stripCitations = (text: string) => text.replace(CITATION, "");
