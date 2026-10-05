/**
 * AI doubt answers come in two shapes: the LLM prompts write `brief.answer` /
 * `detailed.solution`, the scientific solver writes `brief.final_answer` /
 * `detailed.explanation`. Readers must accept both, and must not render the
 * prompt template's literal "None" placeholders as content.
 */
const PLACEHOLDERS = new Set(['none', 'n/a', 'na', 'null', 'nil', '-']);

export function isAnswerPlaceholder(value: unknown): boolean {
  return typeof value === 'string' && PLACEHOLDERS.has(value.trim().toLowerCase());
}
