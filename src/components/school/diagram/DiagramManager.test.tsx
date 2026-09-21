/**
 * Teacher diagram workflow.
 *
 * Uses fireEvent rather than user-event: the latter is not a dependency of
 * this repository, and the interactions here are plain clicks and typing.
 *
 * The properties worth testing here are the ones where a wrong UI is worse
 * than no UI:
 *
 *   A FAILED SAVE MUST NOT LOOK LIKE A SAVE. If persistence fails and the
 *   screen says "saved", a teacher publishes a paper with a missing figure.
 *
 *   PREVIEW IS NOT SAVE AND SAVE IS NOT APPROVE. Each must be a separate,
 *   explicit act, and only approved diagrams reach students.
 *
 *   NO SVG IS EVER INSERTED INTO THE DOCUMENT. The renderer is careful, but
 *   the page must not depend on it staying careful: markup is served through
 *   an <img>, where script cannot run.
 *
 *   MARKER INSERTION MUST NOT DISTURB THE PAPER.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DiagramManager from './DiagramManager';
import { insertMarkerAtCursor } from './marker-insert';
import { svgToImageSrc, toDiagramError } from './diagram-api';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
vi.mock('@/lib/api/school-client', () => ({
  default: {
    get: (...a: any[]) => get(...a),
    post: (...a: any[]) => post(...a),
    put: (...a: any[]) => put(...a),
  },
}));

const ASSESSMENT = 'assess-1';

const CAPABILITIES = {
  rendererVersion: 'v1',
  kinds: ['geometry', 'bar_chart', 'template'],
  templates: [{ id: 'plant_cell', slots: [{ id: 'nucleus', defaultLabel: 'Nucleus' }] }],
  functionForms: [{ form: 'linear', coefficients: 2 }],
  opticalDevices: ['concave_mirror'],
  strokeStyles: ['solid'],
  labelPositions: ['above'],
  limits: { maxPoints: 40 },
};

const APPROVED = {
  id: 'row-1', markerKey: 'a3f91c04', marker: '[DIAGRAM: a3f91c04]',
  kind: 'geometry', spec: { kind: 'geometry', points: [], shapes: [] },
  rendererVersion: 'v1', url: 'https://media.example/a.svg', altText: 'Giant wheel',
  approved: true, approvedBy: 'u1', approvedAt: '2026-09-01T00:00:00Z',
  detached: false, createdAt: '', updatedAt: '',
};

const PENDING = {
  ...APPROVED, id: 'row-2', markerKey: 'bb22cc33', marker: '[DIAGRAM: bb22cc33]',
  altText: 'Circle with chord', approved: false, approvedBy: null, approvedAt: null,
};

const DETACHED = {
  ...APPROVED, id: 'row-3', markerKey: 'cc33dd44', marker: '[DIAGRAM: cc33dd44]',
  altText: 'Unused figure', detached: true,
};

function mockLoad(records: any[] = []) {
  get.mockImplementation(async (url: string) => {
    if (url.endsWith('/capabilities')) return { data: { data: CAPABILITIES } };
    return { data: { data: records } };
  });
}

function renderManager(onInsert = vi.fn()) {
  const onClose = vi.fn();
  render(
    <DiagramManager assessmentId={ASSESSMENT} onInsertMarker={onInsert} onClose={onClose} />,
  );
  return { onInsert, onClose };
}

/** Click and let the resulting state settle, so assertions see the result. */
async function click(el: HTMLElement) {
  await act(async () => { fireEvent.click(el); });
}

async function typeInto(el: HTMLElement, value: string) {
  await act(async () => { fireEvent.change(el, { target: { value } }); });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLoad([]);
});

// ── Loading, empty and error states ─────────────────────────────────────────

describe('loading and empty states', () => {
  it('1. shows a loading state, then the empty state', async () => {
    renderManager();
    expect(screen.getByText(/loading diagrams/i)).toBeInTheDocument();
    expect(await screen.findByText(/no diagrams on this paper yet/i)).toBeInTheDocument();
  });

  it('2. loads capabilities and offers only the kinds the backend supports', async () => {
    renderManager();
    await screen.findByText(/no diagrams on this paper yet/i);
    expect(get).toHaveBeenCalledWith(`/assessments/${ASSESSMENT}/diagrams/capabilities`);
    expect(screen.getByRole('button', { name: /^geometry$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bar chart/i })).toBeInTheDocument();
    // Nothing the backend did not advertise.
    expect(screen.queryByRole('button', { name: /ray diagram/i })).toBeNull();
  });

  it('3. surfaces a load failure with a retry', async () => {
    get.mockRejectedValue({ message: 'Network Error' });
    renderManager();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/network error/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('4. states that only approved diagrams reach the paper', async () => {
    renderManager();
    await screen.findByText(/no diagrams on this paper yet/i);
    expect(screen.getByText(/only/i)).toHaveTextContent(/approved/i);
    expect(screen.getByText(/previewing/i)).toHaveTextContent(/neither saves nor approves/i);
  });
});

// ── Listing and state badges ────────────────────────────────────────────────

describe('listing', () => {
  it('5. shows approved, unapproved and detached states distinctly', async () => {
    mockLoad([APPROVED, PENDING, DETACHED]);
    renderManager();
    // Two of the three are approved — a detached diagram keeps its approval,
    // it simply is not on the paper — so the badge legitimately appears twice.
    expect(await screen.findAllByText('Approved')).toHaveLength(2);
    expect(screen.getByText('Not approved')).toBeInTheDocument();
    expect(screen.getByText('Not on the paper')).toBeInTheDocument();
    expect(screen.getByText(/nothing was deleted/i)).toBeInTheDocument();
  });

  it('6. renders a stored diagram as an image, never as inline markup', async () => {
    mockLoad([APPROVED]);
    const { container } = render(
      <DiagramManager assessmentId={ASSESSMENT} onInsertMarker={vi.fn()} onClose={vi.fn()} />,
    );
    await screen.findByText('Approved');
    const img = screen.getByAltText('Giant wheel') as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.src).toBe('https://media.example/a.svg');
    expect(container.querySelector('svg[data-from-server]')).toBeNull();
  });

  it('7. an unrendered diagram cannot be approved', async () => {
    mockLoad([{ ...PENDING, url: null }]);
    renderManager();
    await screen.findByText('Not approved');
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeDisabled();
  });
});

// ── Preview ─────────────────────────────────────────────────────────────────

describe('preview', () => {
  it('8. does not fire any request while typing — only on Preview', async () => {
    renderManager();
    await screen.findByText(/no diagrams on this paper yet/i);
    await click(screen.getByRole('button', { name: /bar chart/i }));

    post.mockClear();
    await typeInto(screen.getByLabelText('Diagram title'), 'Marks');
    expect(post).not.toHaveBeenCalled();          // no debounce storm, no preview

    post.mockResolvedValue({
      data: { data: { svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>', width: 560, height: 420, rendererVersion: 'v1', warnings: [] } },
    });
    await click(screen.getByRole('button', { name: /^preview$/i }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe(`/assessments/${ASSESSMENT}/diagrams/preview`);
    expect(post.mock.calls[0][1]).toHaveProperty('spec');
  });

  it('9. renders the previewed SVG through an <img>, not into the DOM', async () => {
    renderManager();
    await screen.findByText(/no diagrams on this paper yet/i);
    await click(screen.getByRole('button', { name: /bar chart/i }));

    const hostile = '<svg xmlns="http://www.w3.org/2000/svg"><script>window.__pwned=1</script></svg>';
    post.mockResolvedValue({ data: { data: { svg: hostile, width: 10, height: 10, rendererVersion: 'v1', warnings: [] } } });
    await click(screen.getByRole('button', { name: /^preview$/i }));

    const img = await screen.findByAltText(/diagram preview/i);
    expect(img.tagName).toBe('IMG');
    expect((img as HTMLImageElement).src.startsWith('data:image/svg+xml')).toBe(true);
    expect(document.querySelector('script')).toBeNull();
    expect((window as any).__pwned).toBeUndefined();
  });

  it('10. shows a rejection with its stage and field paths', async () => {
    renderManager();
    await screen.findByText(/no diagrams on this paper yet/i);
    await click(screen.getByRole('button', { name: /^geometry$/i }));

    post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          success: false, stage: 'geometric',
          errors: ['shapes[1]: chord endpoint "A" does not lie on the circle centred at "O"'],
          warnings: ['shapes: 1 measurement label(s) cannot be checked'],
        },
      },
    });
    await click(screen.getByRole('button', { name: /^preview$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/the geometry does not hold/i);
    expect(alert).toHaveTextContent(/does not lie on the circle/i);
    expect(within(alert).getByText('shapes[1]')).toBeInTheDocument();
    // Warnings are shown, and shown apart from the blocking errors.
    const warn = await screen.findByText(/checked as far as possible/i);
    expect(warn).toBeInTheDocument();
    expect(alert).not.toHaveTextContent(/checked as far as possible/i);
  });

  it('11. a transport failure is not presented as a bad diagram', async () => {
    renderManager();
    await screen.findByText(/no diagrams on this paper yet/i);
    await click(screen.getByRole('button', { name: /bar chart/i }));

    post.mockRejectedValue({ message: 'Network Error' });
    await click(screen.getByRole('button', { name: /^preview$/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/something went wrong/i);
    expect(alert).not.toHaveTextContent(/the geometry does not hold/i);
  });
});

// ── Save ────────────────────────────────────────────────────────────────────

describe('save', () => {
  it('12. creates through the persistence endpoint and refreshes from the server', async () => {
    renderManager();
    await screen.findByText(/no diagrams on this paper yet/i);
    await click(screen.getByRole('button', { name: /bar chart/i }));

    post.mockResolvedValue({
      data: { data: { markerKey: 'newkey12', marker: '[DIAGRAM: newkey12]', kind: 'bar_chart', url: 'https://media.example/n.svg', width: 560, height: 420, rendererVersion: 'v1', approved: false, warnings: [] } },
    });
    mockLoad([{ ...PENDING, markerKey: 'newkey12', marker: '[DIAGRAM: newkey12]' }]);

    await click(screen.getByRole('button', { name: /save diagram/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      `/assessments/${ASSESSMENT}/diagrams`, expect.objectContaining({ spec: expect.any(Object) }),
    ));
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/saved/i));
  });

  it('13. a FAILED save produces no success state', async () => {
    renderManager();
    await screen.findByText(/no diagrams on this paper yet/i);
    await click(screen.getByRole('button', { name: /bar chart/i }));

    post.mockRejectedValue({
      response: { status: 422, data: { success: false, stage: 'storage', errors: ['spec: the rendered diagram could not be stored'] } },
    });
    await click(screen.getByRole('button', { name: /save diagram/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not be saved/i);
    const { toast } = await import('sonner');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('14. updating an existing diagram uses PUT with its marker key', async () => {
    mockLoad([PENDING]);
    renderManager();
    await screen.findByText('Not approved');
    await click(screen.getByRole('button', { name: /^edit$/i }));

    put.mockResolvedValue({
      data: { data: { markerKey: PENDING.markerKey, marker: PENDING.marker, kind: 'geometry', url: 'x', width: 1, height: 1, rendererVersion: 'v1', approved: false, specChanged: true, approvalCleared: false, warnings: [] } },
    });
    await click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(put).toHaveBeenCalledWith(
      `/assessments/${ASSESSMENT}/diagrams/${PENDING.markerKey}`, expect.objectContaining({ spec: expect.any(Object) }),
    ));
  });

  it('15. an edit that clears approval warns instead of claiming success', async () => {
    mockLoad([APPROVED]);
    renderManager();
    await screen.findByText('Approved');
    await click(screen.getByRole('button', { name: /^edit$/i }));

    put.mockResolvedValue({
      data: { data: { markerKey: APPROVED.markerKey, marker: APPROVED.marker, kind: 'geometry', url: 'x', width: 1, height: 1, rendererVersion: 'v1', approved: false, specChanged: true, approvalCleared: true, warnings: [] } },
    });
    mockLoad([{ ...APPROVED, approved: false }]);
    await click(screen.getByRole('button', { name: /save changes/i }));

    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith(
      expect.stringMatching(/approval was withdrawn/i),
    ));
  });
});

// ── Approval ────────────────────────────────────────────────────────────────

describe('approval', () => {
  it('16. approving requires an explicit action and calls the approval endpoint', async () => {
    mockLoad([PENDING]);
    renderManager();
    await screen.findByText('Not approved');

    post.mockResolvedValue({ data: { data: { markerKey: PENDING.markerKey, approved: true } } });
    mockLoad([{ ...PENDING, approved: true }]);
    await click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(
      `/assessments/${ASSESSMENT}/diagrams/${PENDING.markerKey}/approval`, { approved: true },
    ));
    expect(await screen.findByText('Approved')).toBeInTheDocument();
  });

  it('17. approval can be withdrawn', async () => {
    mockLoad([APPROVED]);
    renderManager();
    await screen.findByText('Approved');

    post.mockResolvedValue({ data: { data: { markerKey: APPROVED.markerKey, approved: false } } });
    mockLoad([{ ...APPROVED, approved: false }]);
    await click(screen.getByRole('button', { name: /withdraw approval/i }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(
      `/assessments/${ASSESSMENT}/diagrams/${APPROVED.markerKey}/approval`, { approved: false },
    ));
  });

  it('18. a failed approval does not flip the badge', async () => {
    mockLoad([PENDING]);
    renderManager();
    await screen.findByText('Not approved');

    post.mockRejectedValue({ message: 'Network Error' });
    await click(screen.getByRole('button', { name: /^approve$/i }));

    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByText('Not approved')).toBeInTheDocument();
    expect(screen.queryByText('Approved')).toBeNull();
  });
});

// ── Marker insertion ────────────────────────────────────────────────────────

describe('marker insertion', () => {
  it('19. hands the opaque marker back to the editor', async () => {
    mockLoad([APPROVED]);
    const onInsert = vi.fn();
    renderManager(onInsert);
    await screen.findByText('Approved');
    await click(screen.getByRole('button', { name: /insert marker/i }));
    expect(onInsert).toHaveBeenCalledWith('[DIAGRAM: a3f91c04]');
    // The key is opaque — never derived from a question index.
    expect(onInsert.mock.calls[0][0]).not.toMatch(/q\d|question/i);
  });

  it('20. inserts on its own line after the cursor line, preserving everything else', () => {
    const paper = '## Section D\n1. Study the wheel.\n2. Define a chord.';
    const cursor = paper.indexOf('1. Study') + 4;      // inside question 1
    const out = insertMarkerAtCursor(paper, cursor, '[DIAGRAM: a3f91c04]');
    expect(out.text).toBe('## Section D\n1. Study the wheel.\n[DIAGRAM: a3f91c04]\n2. Define a chord.');
    // Every original line survives unchanged.
    for (const line of paper.split('\n')) expect(out.text).toContain(line);
    expect(out.cursor).toBe(out.text.indexOf('[DIAGRAM: a3f91c04]') + '[DIAGRAM: a3f91c04]'.length);
  });

  it('21. handles the end of the paper, an empty paper and a stray cursor', () => {
    expect(insertMarkerAtCursor('1. Only line.', 99, '[DIAGRAM: k]').text)
      .toBe('1. Only line.\n[DIAGRAM: k]');
    expect(insertMarkerAtCursor('', 0, '[DIAGRAM: k]').text).toBe('[DIAGRAM: k]');
    expect(insertMarkerAtCursor('a\nb', -5, '[DIAGRAM: k]').text).toBe('a\n[DIAGRAM: k]\nb');
    // An empty marker is a no-op rather than a stray newline.
    expect(insertMarkerAtCursor('a\nb', 0, '   ').text).toBe('a\nb');
  });

  it('22. never rewrites markdown or collapses blank lines', () => {
    const paper = '## Section A\n\n1. **Bold** question\n\n2. Next';
    const out = insertMarkerAtCursor(paper, paper.indexOf('1.'), '[DIAGRAM: zz]');
    expect(out.text).toContain('## Section A\n\n1. **Bold** question\n[DIAGRAM: zz]\n\n2. Next');
  });
});

// ── Helpers ─────────────────────────────────────────────────────────────────

describe('api helpers', () => {
  it('23. distinguishes a rejected spec from a transport fault', () => {
    const rejected = toDiagramError({
      response: { status: 422, data: { stage: 'structural', errors: ['kind: unsupported'], warnings: [] } },
    });
    expect(rejected).toMatchObject({ rejected: true, stage: 'structural' });

    const fault = toDiagramError({ message: 'Network Error' });
    expect(fault).toMatchObject({ rejected: false, message: 'Network Error' });

    // A 500 carrying errors is still a fault, not a validation result.
    const server = toDiagramError({ response: { status: 500, data: { message: 'boom' } } });
    expect(server).toMatchObject({ rejected: false });
  });

  it('24. encodes SVG for an <img> without producing executable markup', () => {
    const src = svgToImageSrc('<svg><script>x</script></svg>');
    expect(src.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(src).not.toContain('<script>');
    expect(src).toContain('%3Cscript%3E');
  });
});
