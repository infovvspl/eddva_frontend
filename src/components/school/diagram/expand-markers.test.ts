/**
 * Teacher preview parity.
 *
 * The pane this feeds is labelled "Students will see this". These tests pin
 * the two halves of making that true:
 *
 *   A RAW MARKER IS NEVER SHOWN. Whatever happens — approved, pending,
 *   detached, unrendered, mistyped, or the list failed to load — the teacher
 *   reads either a figure or a sentence, never "[DIAGRAM: a3f91c04]".
 *
 *   A WITHHELD DIAGRAM IS EXPLAINED. A student simply does not get the figure;
 *   a teacher needs to know which of the four reasons applies, because each
 *   has a different fix.
 *
 * And the regression that matters most: a paper with no diagrams must come out
 * of this byte-identical.
 */
import { describe, expect, it } from 'vitest';
import type { DiagramRecord } from './diagram-api';
import { expandMarkersForPreview, markerState } from './expand-markers';

const record = (over: Partial<DiagramRecord> = {}): DiagramRecord => ({
  id: 'dia-1',
  markerKey: 'aaaa1111',
  marker: '[DIAGRAM: aaaa1111]',
  kind: 'geometry',
  spec: {},
  rendererVersion: 'v1',
  url: 'https://media.eddva.in/tenants/x/assessment-diagrams/v1/abc.svg',
  altText: 'Triangle ABC with AB marked',
  approved: true,
  approvedBy: 'tea-1',
  approvedAt: '2026-09-01T00:00:00.000Z',
  detached: false,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...over,
});

const PAPER = '1. Study the figure and find AB. [2]\n[DIAGRAM: aaaa1111]\n\n2. Define a rational number. [1]';

describe('expandMarkersForPreview', () => {
  it('1. an approved diagram becomes the same Markdown image a student receives', () => {
    const out = expandMarkersForPreview(PAPER, [record()]);
    expect(out.text).toContain(
      '![Triangle ABC with AB marked](https://media.eddva.in/tenants/x/assessment-diagrams/v1/abc.svg)',
    );
    expect(out.text).not.toContain('[DIAGRAM:');
    expect(out.markers).toEqual([{ markerKey: 'aaaa1111', state: 'shown' }]);
  });

  it('2. a paper with no markers is returned byte-identical', () => {
    const plain = '## Section A\n\n1. Define a rational number. [1]\n\n2. State Ohm\'s law. [2]';
    const out = expandMarkersForPreview(plain, [record()]);
    expect(out.text).toBe(plain);
    expect(out.markers).toEqual([]);
  });

  it('3. an unapproved diagram is explained, not drawn', () => {
    const out = expandMarkersForPreview(PAPER, [record({ approved: false })]);
    expect(out.text).not.toContain('![');
    expect(out.text).not.toContain('[DIAGRAM:');
    expect(out.text).toContain('Diagram not shown');
    expect(out.text).toContain('waiting for your approval');
    expect(out.markers[0].state).toBe('unapproved');
  });

  it('4. a detached diagram says how to put it back', () => {
    const out = expandMarkersForPreview(PAPER, [record({ detached: true })]);
    expect(out.text).not.toContain('![');
    expect(out.text).toContain('insert its marker again');
    expect(out.markers[0].state).toBe('detached');
  });

  it('5. a diagram with no rendered image is explained', () => {
    const out = expandMarkersForPreview(PAPER, [record({ url: null })]);
    expect(out.text).not.toContain('![');
    expect(out.text).toContain('no rendered image yet');
    expect(out.markers[0].state).toBe('unrendered');
  });

  it('6. an unknown marker names the key so a teacher can fix it', () => {
    const out = expandMarkersForPreview(PAPER, [record({ markerKey: 'ffff9999' })]);
    expect(out.text).not.toContain('![');
    expect(out.text).not.toContain('[DIAGRAM:');
    expect(out.text).toContain('aaaa1111');
    expect(out.text).toContain('does not match any diagram');
    expect(out.markers[0].state).toBe('unknown');
  });

  it('7. an empty or failed diagram list degrades to explanations, never raw markers', () => {
    for (const list of [[], null, undefined]) {
      const out = expandMarkersForPreview(PAPER, list as any);
      expect(out.text).not.toContain('[DIAGRAM:');
      expect(out.markers[0].state).toBe('unknown');
    }
  });

  it('8. detached outranks unapproved, and unrendered outranks both', () => {
    // A row can be several things at once; the reason shown must be the one
    // the teacher has to act on first.
    expect(markerState(record({ detached: true, approved: false }))).toBe('detached');
    expect(markerState(record({ detached: true, url: null }))).toBe('unrendered');
    expect(markerState(undefined)).toBe('unknown');
  });

  it('9. brackets in alt text cannot close the image early', () => {
    const out = expandMarkersForPreview(PAPER, [record({ altText: 'Chord [AB] of 12 cm' })]);
    expect(out.text).toContain('![Chord AB of 12 cm](https://media.eddva.in/');
  });

  it('10. alt text falls back to the kind rather than rendering an empty label', () => {
    const out = expandMarkersForPreview(PAPER, [record({ altText: '', kind: 'ray_diagram' })]);
    expect(out.text).toContain('![ray diagram](https://media.eddva.in/');
  });

  it('11. every occurrence is expanded, including repeats of one key', () => {
    const text = '1. a\n[DIAGRAM: aaaa1111]\n2. b\n[DIAGRAM: bbbb2222]\n3. c\n[DIAGRAM: aaaa1111]';
    const out = expandMarkersForPreview(text, [
      record(),
      record({ id: 'dia-2', markerKey: 'bbbb2222', altText: 'Plant cell', approved: false }),
    ]);
    expect(out.text).not.toContain('[DIAGRAM:');
    expect(out.markers.map((m) => m.state)).toEqual(['shown', 'unapproved', 'shown']);
    expect(out.text.match(/!\[Triangle ABC with AB marked\]/g)).toHaveLength(2);
  });

  it('12. repeated calls give the same answer (no shared regex state)', () => {
    const first = expandMarkersForPreview(PAPER, [record()]);
    const second = expandMarkersForPreview(PAPER, [record()]);
    const third = expandMarkersForPreview(PAPER, [record()]);
    expect(second.text).toBe(first.text);
    expect(third.text).toBe(first.text);
  });

  it('13. a marker matches its diagram whatever case it was typed in', () => {
    const out = expandMarkersForPreview('1. q\n[diagram: AAAA1111]', [record()]);
    expect(out.text).toContain('![Triangle ABC with AB marked](');
  });

  it('14. markup in alt text stays inside the alt and is never emitted as an element', () => {
    const out = expandMarkersForPreview(PAPER, [
      record({ altText: '<script>alert(1)</script>' }),
    ]);
    // It rides along as the alt of a Markdown image. AssessmentContentRenderer
    // loads no rehype-raw, so an alt is a text attribute and cannot become an
    // element — but the expansion itself must not be what introduces markup.
    expect(out.text).toContain('![<script>alert(1)</script>](https://media.eddva.in/');
    const outsideAlt = out.text.replace(/!\[[^\]]*\]/g, '![]');
    expect(outsideAlt).not.toContain('<');
  });

  it('15. an empty paper stays empty', () => {
    expect(expandMarkersForPreview('', [record()]).text).toBe('');
    expect(expandMarkersForPreview(null as any, [record()]).text).toBe('');
  });
});
