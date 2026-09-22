/**
 * Placing a diagram marker into the question paper.
 *
 * The marker goes on its OWN LINE immediately after the line the teacher's
 * cursor is in. That rule matters for two reasons:
 *
 *   It matches what the backend parser expects. A marker on its own line
 *   after a question is how the paper's other markers already work, and it is
 *   how the parser attaches a figure to the question above it.
 *
 *   It is predictable. The teacher chooses the position by putting the cursor
 *   there; nothing guesses which question a diagram belongs to, and nothing is
 *   inserted into an arbitrary place.
 *
 * Nothing existing is altered: the function splices at a line boundary, so
 * every character of the paper — spacing, blank lines, markdown — survives
 * exactly as it was.
 */

export interface MarkerInsertion {
  text: string;
  /** Where the caret should sit afterwards: just past the inserted marker. */
  cursor: number;
}

/**
 * Insert `marker` on its own line after the line containing `cursor`.
 *
 * An out-of-range cursor is clamped rather than rejected, because a textarea
 * that has never been focused reports 0 and a teacher pressing the button
 * straight away should still get a sensible result — the marker lands after
 * the first line.
 */
export function insertMarkerAtCursor(
  text: string,
  cursor: number,
  marker: string,
): MarkerInsertion {
  const source = String(text ?? '');
  const token = String(marker ?? '').trim();
  if (!token) return { text: source, cursor };

  // An empty paper has no line to sit after, so the marker simply starts it.
  if (!source.length) return { text: token, cursor: token.length };

  const at = Math.max(0, Math.min(Number.isFinite(cursor) ? cursor : 0, source.length));
  const newlineAt = source.indexOf('\n', at);
  const lineEnd = newlineAt === -1 ? source.length : newlineAt;

  const before = source.slice(0, lineEnd);
  const after = source.slice(lineEnd);
  const insertion = `\n${token}`;

  return { text: before + insertion + after, cursor: before.length + insertion.length };
}
