/**
 * B-01 (Live Class QA, 16 Oct 2026): the schedule form sent its
 * datetime-local value with no zone and the server stored it as UTC, so a
 * class set for 10:00 PM IST showed as 3:30 AM. The form now sends the exact
 * instant.
 */
import { describe, expect, it } from 'vitest';
import { isoToLocalInput, localInputToIso } from './school-live';

describe('live class time conversion', () => {
  it('a form value becomes the exact instant it means in this browser', () => {
    const value = '2026-10-16T22:00';
    expect(localInputToIso(value)).toBe(new Date(value).toISOString());
    expect(localInputToIso(value)!.endsWith('Z')).toBe(true);
  });

  it('round-trips back to the same form value', () => {
    expect(isoToLocalInput(localInputToIso('2026-10-16T22:00'))).toBe('2026-10-16T22:00');
  });

  it('empty or invalid values give nothing', () => {
    expect(localInputToIso('')).toBeUndefined();
    expect(localInputToIso('not a date')).toBeUndefined();
    expect(isoToLocalInput(null)).toBe('');
  });
});
