/**
 * Saving a painted deck to Course Content (public/ppt-studio).
 *
 * A teacher's save "took time": each painted slide went into the .pptx as a
 * 1.4 MB PNG, so a 10-slide deck was a 14.4 MB file - 6.6s to build and, on a
 * school connection, half a minute to upload - behind a button that only said
 * "Saving…" and came back after 20s whether or not the upload had finished.
 * Slides now go in as JPEGs (about 200 KB each), fetched a few at a time, and
 * the button says what is happening.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ROOT = resolve(__dirname, '../../public/ppt-studio');
let App: any;
let PPTExport: any;
let body = '';

beforeAll(() => {
  const doc = new DOMParser().parseFromString(readFileSync(resolve(ROOT, 'index.html'), 'utf8'), 'text/html');
  doc.querySelectorAll('script').forEach((s) => s.remove());
  body = doc.body.innerHTML;
  for (const file of ['api.js', 'preview.js', 'pptExport.js', 'app.js']) {
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', readFileSync(resolve(ROOT, 'js', file), 'utf8'))(window, document);
  }
  App = (window as any).App;
  PPTExport = (window as any).PPTExport;
});

beforeEach(() => {
  document.body.innerHTML = body;
  PPTExport._paintedCache.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete (window as any).presentationData;
});

const painted = (n: number) => ({
  title: 'Deck',
  slides: Array.from({ length: n }, (_, i) => ({ title: 'S' + (i + 1), slideImage: { url: 'http://ai/s' + (i + 1) + '.png' } })),
});

describe('preparing the slide pictures', () => {
  it('fetches several at a time, not one after another, and reports progress', async () => {
    let inFlight = 0;
    let most = 0;
    vi.spyOn(PPTExport, '_paintedJpeg').mockImplementation(async (url: string) => {
      inFlight += 1; most = Math.max(most, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return 'data:image/jpeg;base64,' + url;
    });
    const seen: string[] = [];
    await PPTExport._prefillBase64Images(painted(10), (d: number, t: number) => seen.push(`${d}/${t}`));
    expect(most).toBe(PPTExport.FETCH_PARALLEL);
    expect(most).toBeGreaterThan(1);
    expect(seen[0]).toBe('0/10');
    expect(seen[seen.length - 1]).toBe('10/10');
  });

  it('converts each slide once: a second save does not fetch them again', async () => {
    const jpeg = vi.spyOn(PPTExport, '_paintedJpeg').mockResolvedValue('data:image/jpeg;base64,AAAA');
    const deck = painted(3);
    await PPTExport._prefillBase64Images(deck);
    await PPTExport._prefillBase64Images(deck);
    expect(jpeg).toHaveBeenCalledTimes(3);
  });

  it('leaves the deck itself as it was generated', async () => {
    vi.spyOn(PPTExport, '_paintedJpeg').mockResolvedValue('data:image/jpeg;base64,AAAA');
    const deck = painted(2);
    await PPTExport._prefillBase64Images(deck);
    expect(deck.slides[0].slideImage).toEqual({ url: 'http://ai/s1.png' });   // no picture data added
    expect(PPTExport._paintedData(deck.slides[0].slideImage)).toBe('data:image/jpeg;base64,AAAA');
  });

  it('one slide that cannot be fetched does not stop the others', async () => {
    vi.spyOn(PPTExport, '_paintedJpeg').mockImplementation(async (url: string) => {
      if (url.includes('s2')) throw new Error('network');
      return 'data:image/jpeg;base64,OK';
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const deck = painted(3);
    await PPTExport._prefillBase64Images(deck);
    expect(PPTExport._paintedData(deck.slides[0].slideImage)).toBe('data:image/jpeg;base64,OK');
    expect(PPTExport._paintedData(deck.slides[1].slideImage)).toBeNull();
    expect(PPTExport._paintedData(deck.slides[2].slideImage)).toBe('data:image/jpeg;base64,OK');
  });

  it('puts the JPEG in the file, and the link only when there is no picture data', () => {
    PPTExport._paintedCache.set('http://ai/s1.png', 'data:image/jpeg;base64,JPEG');
    const add = vi.fn();
    const slide: any = { addImage: add };
    PPTExport._buildSlide(slide, {}, { title: 'S1', slideImage: { url: 'http://ai/s1.png' } }, {}, 'executive');
    expect(add.mock.calls[0][0]).toMatchObject({ data: 'data:image/jpeg;base64,JPEG', w: 10, h: 5.625 });
    PPTExport._buildSlide(slide, {}, { title: 'S2', slideImage: { url: 'http://ai/s2.png' } }, {}, 'executive');
    expect(add.mock.calls[1][0]).toMatchObject({ path: 'http://ai/s2.png' });
  });

  it('keeps a picture as it is when the browser cannot re-encode it', async () => {
    // jsdom has no createImageBitmap: the fallback path.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob(['png-bytes'], { type: 'image/png' }) }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const out = await PPTExport._paintedJpeg('http://ai/s1.png');
    expect(out).toMatch(/^data:image\/png;base64,/);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await PPTExport._paintedJpeg('http://ai/s1.png')).toBeNull();
    vi.unstubAllGlobals();
  });

  it('uses a quality that keeps slide text sharp', () => {
    expect(PPTExport.PAINTED_JPEG_QUALITY).toBeGreaterThanOrEqual(0.9);
  });
});

describe('the Save button', () => {
  const button = () => document.getElementById('save-edva-btn') as HTMLButtonElement;

  function embedded() {
    const parent = { postMessage: vi.fn() };
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as any);
    return parent;
  }

  it('says what it is doing, and hands the file over as bytes', async () => {
    const parent = embedded();
    (window as any).presentationData = painted(2);
    const buffer = new ArrayBuffer(8);
    const texts: string[] = [];
    vi.spyOn(PPTExport, 'exportToFile').mockImplementation(async (_d: any, onProgress: any) => {
      onProgress('images', 1, 2); texts.push(button().textContent || '');
      onProgress('file', 0, 1); texts.push(button().textContent || '');
      return { buffer, fileName: 'Deck.pptx' };
    });
    await App.handleSaveToEdva();
    expect(texts[0]).toContain('Preparing slides… 1/2');
    expect(texts[1]).toContain('Building the file…');
    expect(button().textContent).toContain('Uploading…');
    expect(button().disabled).toBe(true);
    const [message, origin, transfer] = parent.postMessage.mock.calls[0];
    expect(message).toMatchObject({ type: 'EDVA_PPT_SAVE', fileName: 'Deck.pptx', buffer });
    expect(message.base64).toBeUndefined();
    expect(origin).toBe('*');
    expect(transfer).toEqual([buffer]);
  });

  it('shows the upload percentage the page reports, then finishing', async () => {
    App.setupEventListeners();
    App._setSaveBtn('Uploading…');
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'EDVA_PPT_SAVE_PROGRESS', stage: 'uploading', percent: 42 } }));
    expect(button().textContent).toContain('Uploading… 42%');
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'EDVA_PPT_SAVE_PROGRESS', stage: 'saving', percent: 100 } }));
    expect(button().textContent).toContain('Finishing…');
    expect(button().disabled).toBe(true);
  });

  it('comes back only when the save is answered, not on any other message', () => {
    App.setupEventListeners();
    App._setSaveBtn('Uploading…');
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'SOMETHING_ELSE' } }));
    expect(button().disabled).toBe(true);
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'EDVA_PPT_SAVED' } }));
    expect(button().disabled).toBe(false);
    expect(button().textContent).toContain('Save to Course Content');
  });

  it('is not given back after 20 seconds while the upload is still running', async () => {
    vi.useFakeTimers();
    embedded();
    (window as any).presentationData = painted(1);
    vi.spyOn(PPTExport, 'exportToFile').mockResolvedValue({ buffer: new ArrayBuffer(4), fileName: 'D.pptx' });
    vi.spyOn(App, 'showToast').mockImplementation(() => undefined);
    await App.handleSaveToEdva();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(button().disabled).toBe(true);                    // a slow upload is still a save
    await vi.advanceTimersByTimeAsync(App.SAVE_WATCHDOG_MS);
    expect(button().disabled).toBe(false);                   // only if the page never answers
    expect(App.showToast).toHaveBeenCalledWith(expect.stringContaining('taking too long'), 'error');
  });

  it('comes back at once when the file cannot be prepared', async () => {
    embedded();
    (window as any).presentationData = painted(1);
    vi.spyOn(PPTExport, 'exportToFile').mockRejectedValue(new Error('No slides to export.'));
    const toast = vi.spyOn(App, 'showToast').mockImplementation(() => undefined);
    await App.handleSaveToEdva();
    expect(button().disabled).toBe(false);
    expect(toast).toHaveBeenCalledWith('Failed to prepare PPT: No slides to export.', 'error');
  });
});
