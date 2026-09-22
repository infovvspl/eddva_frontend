/**
 * The Diagrams control on an unsaved test.
 *
 * The behaviour being pinned is the difference between "you cannot do this
 * yet, here is why" and silence. Hiding the button left a teacher with no way
 * to find out that saving the test first would give them diagrams.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DiagramsButton, { UNSAVED_ASSESSMENT_HINT } from './DiagramsButton';

describe('DiagramsButton', () => {
  it('1. with no assessment yet: shown, disabled, and explained', () => {
    const onOpen = vi.fn();
    render(<DiagramsButton onOpen={onOpen} />);

    const button = screen.getByRole('button', { name: /diagrams/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', UNSAVED_ASSESSMENT_HINT);
    // Visible text, not only a tooltip — tooltips do not exist on touch.
    expect(screen.getByText(UNSAVED_ASSESSMENT_HINT)).toBeInTheDocument();

    fireEvent.click(button);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('2. the explanation is exactly the sentence a teacher was promised', () => {
    render(<DiagramsButton onOpen={vi.fn()} />);
    expect(screen.getByText('Save this test first — diagrams attach to a saved paper.'))
      .toBeInTheDocument();
  });

  it('3. with a saved assessment: enabled, no hint, and it opens the panel', () => {
    const onOpen = vi.fn();
    render(<DiagramsButton assessmentId="aa11bb22-0000-4000-8000-000000000001" onOpen={onOpen} />);

    const button = screen.getByRole('button', { name: /diagrams/i });
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('title');
    expect(screen.queryByText(UNSAVED_ASSESSMENT_HINT)).toBeNull();

    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
