/**
 * The control that opens the Diagrams panel.
 *
 * A diagram is stored against an assessment, so there is nothing to attach one
 * to until the test has been saved and has an id. This used to be handled by
 * not rendering the button at all, which answered the wrong question: a
 * teacher creating a new test saw no Diagrams control and no reason for its
 * absence, and had no way to discover that saving first would produce one.
 *
 * So it is always rendered, and disabled with the reason stated when there is
 * no assessment yet. The sentence is shown as text rather than only as a
 * tooltip, because a tooltip is invisible on a touch screen — which is where a
 * good share of this panel's use happens.
 */
import React from 'react';
import { Shapes } from 'lucide-react';
import Button from '@/components/school/Button';
import { Button as ToolbarButton } from '@/components/ui/button';
import { EDITOR_TOOLBAR_BUTTON } from '@/components/school/editorToolbarStyles';

export const UNSAVED_ASSESSMENT_HINT = 'Save this test first — diagrams attach to a saved paper.';

export default function DiagramsButton({
  assessmentId,
  onOpen,
  compact = false,
}: {
  /** Present only once the assessment exists. */
  assessmentId?: string;
  onOpen: () => void;
  /** Keeps the reason visible (touch screens have no tooltip) but inside the
   *  button's own label, so it fits on one toolbar line. */
  compact?: boolean;
}) {
  const disabled = !assessmentId;
  if (compact) {
    // Same look as the other toolbar buttons beside it.
    return (
      <ToolbarButton
        type="button"
        variant="outline"
        size="sm"
        className={EDITOR_TOOLBAR_BUTTON}
        disabled={disabled}
        title={disabled ? UNSAVED_ASSESSMENT_HINT : undefined}
        onClick={onOpen}
      >
        <Shapes size={14} className="text-violet-600" />
        {disabled ? 'Diagrams · save first' : 'Diagrams'}
      </ToolbarButton>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 font-bold"
        icon={<Shapes size={14} />}
        disabled={disabled}
        title={disabled ? UNSAVED_ASSESSMENT_HINT : undefined}
        onClick={onOpen}
      >
        Diagrams
      </Button>
      {disabled ? (
        <span className="text-[11px] font-semibold text-gray-500">{UNSAVED_ASSESSMENT_HINT}</span>
      ) : null}
    </div>
  );
}
