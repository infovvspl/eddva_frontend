/**
 * A painted (image-slide) deck in the studio (public/ppt-studio).
 *
 * A teacher's painted deck opened while its pictures were still being made:
 * every slide read "Painting this slide…", the thumbnails were plain colour
 * tiles, and on a wide screen the finished slide sat in a canvas wider than
 * 16:9, with white bars either side. Now a painted deck stays on the loading
 * card until it is painted, its thumbnails are its pictures, and the canvas is
 * always the largest 16:9 box that fits.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ROOT = resolve(__dirname, '../../public/ppt-studio');
let App: any;
let API: any;
let Preview: any;
let body = '';

beforeAll(() => {
  const doc = new DOMParser().parseFromString(readFileSync(resolve(ROOT, 'index.html'), 'utf8'), 'text/html');
  doc.querySelectorAll('script').forEach((s) => s.remove());
  body = doc.body.innerHTML;
  for (const file of ['api.js', 'preview.js', 'app.js']) {
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', readFileSync(resolve(ROOT, 'js', file), 'utf8'))(window, document);
  }
  App = (window as any).App;
  API = (window as any).API;
  Preview = (window as any).SlidePreview;
});

beforeEach(() => {
  document.body.innerHTML = body;
  vi.spyOn(App, '_sleep').mockResolvedValue(undefined);
  vi.spyOn(App, 'showPreview').mockImplementation(() => undefined);
  vi.spyOn(App, 'hideLoading').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as any).presentationData;
  App.slideStyle = undefined;
});

const painting = (painted: number, total = 3) => ({
  title: 'The Human Eye',
  slides: Array.from({ length: total }, (_, i) => (i < painted
    ? { title: 'S' + (i + 1), slideImage: { url: 'http://ai/s' + (i + 1) + '.png' } }
    : { title: 'S' + (i + 1), slideImagePending: true })),
});

const designed = () => ({ title: 'Light', slides: [{ title: 'A', v2: { visual: { pending: true } } }] });

function jobs(...states: any[]) {
  const spy = vi.spyOn(API, 'getPresentationStatus');
  states.forEach((s) => spy.mockResolvedValueOnce(s));
  return spy;
}

describe('a painted deck waits on the loading card', () => {
  it('is not opened while its pictures are being painted', async () => {
    App.slideStyle = 'image';
    const done = painting(3);
    jobs({ status: 'running', stage: 'pictures', done: 0, total: 3, partial: painting(0) },
         { status: 'running', stage: 'pictures', done: 2, total: 3, partial: painting(2) },
         { status: 'done', result: { data: done } });
    const result = await App._followJob('job-1', 'dark-professional', 'executive');
    expect(App.showPreview).not.toHaveBeenCalled();
    expect((window as any).presentationData).toBeUndefined();
    expect(result).toBe(done);
  });

  it('counts the pictures on the loading card meanwhile', async () => {
    App.slideStyle = 'image';
    const status = vi.spyOn(App, 'updateLoadingStatus');
    jobs({ status: 'running', stage: 'pictures', done: 2, total: 3, partial: painting(2),
           activity: [{ key: 'paint-3', text: 'Slide 3: painting', state: 'active' }] },
         { status: 'done', result: { data: painting(3) } });
    await App._followJob('job-1', 'dark-professional', 'executive');
    expect(status).toHaveBeenCalledWith('Painting your slides…', 'Pictures ready: 2 of 3');
  });

  it('is recognised from its slides too, whatever style was picked', () => {
    expect(App._isPaintedDeck(painting(0))).toBe(true);
    expect(App._isPaintedDeck(designed())).toBe(false);
  });

  it('a designed deck still opens as soon as its text exists', async () => {
    App.slideStyle = 'v2';
    jobs({ status: 'running', stage: 'pictures', done: 0, total: 1, partial: designed() },
         { status: 'done', result: { data: designed() } });
    await App._followJob('job-1', 'dark-professional', 'executive');
    expect(App.showPreview).toHaveBeenCalledTimes(1);
  });

  it('keeps the slides already painted when the deck fails late', async () => {
    App.slideStyle = 'image';
    jobs({ status: 'running', stage: 'pictures', done: 2, total: 3, partial: painting(2) },
         { status: 'failed', error: 'provider down' });
    const result = await App._followJob('job-1', 'dark-professional', 'executive');
    expect(result._incomplete).toBe(true);
    expect(App._paintedSoFar(result)).toBe(2);
  });

  it('fails plainly when nothing was painted', async () => {
    App.slideStyle = 'image';
    jobs({ status: 'running', stage: 'pictures', done: 0, total: 3, partial: painting(0) },
         { status: 'failed', error: 'provider down' });
    await expect(App._followJob('job-1', 'dark-professional', 'executive')).rejects.toThrow('provider down');
  });

  it('names the text check while it runs, apart from the textbook check', () => {
    expect(App._headline({ activity: [{ key: 'textcheck', state: 'active' }] }))
      .toBe('Making the text the same size on every slide…');
    expect(App._headline({ activity: [{ key: 'check', state: 'active' }] }))
      .toBe('Checking the slides against your textbook…');
  });
});

describe('thumbnails', () => {
  it('show a painted slide\'s picture, without a second title over it', () => {
    Preview.renderThumbnails(painting(2).slides, 'dark-professional');
    const thumbs = document.querySelectorAll<HTMLElement>('.slide-thumb');
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0].style.backgroundImage).toContain('http://ai/s1.png');
    expect(thumbs[0].textContent).toBe('1');
    // Not painted yet: the theme tile with its title.
    expect(thumbs[2].style.backgroundImage).toBe('');
    expect(thumbs[2].textContent).toContain('S3');
  });
});

describe('the slide canvas', () => {
  const css = readFileSync(resolve(ROOT, 'css', 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('is the largest 16:9 box that fits, not full width with a height cap', () => {
    const rule = css.match(/\n\.slide-canvas \{([^}]*)\}/)![1];
    expect(rule).toContain('aspect-ratio: 16 / 9');
    expect(rule).toContain('width: min(100cqw, 100cqh * 16 / 9)');
    expect(rule).not.toMatch(/max-height/);
    expect(css.match(/\n\.slide-canvas-wrapper \{([^}]*)\}/)![1]).toContain('container-type: size');
  });
});

describe('a deck waiting for a free generator', () => {
  it('says it is waiting, with its place in line, then carries on', async () => {
    App.slideStyle = 'image';
    const status = vi.spyOn(App, 'updateLoadingStatus');
    jobs({ status: 'queued', stage: 'queued', queuePosition: 2 },
         { status: 'queued', stage: 'queued', queuePosition: 0 },
         { status: 'done', result: { data: painting(3) } });
    await App._followJob('job-1', 'dark-professional', 'executive');
    expect(status).toHaveBeenCalledWith('Waiting for a free presentation generator…',
                                        '2 presentations ahead of yours.');
    expect(status).toHaveBeenCalledWith('Waiting for a free presentation generator…', 'You are next.');
  });

  it('words a place in line plainly', () => {
    expect(App._queueText(1)).toBe('1 presentation ahead of yours.');
    expect(App._queueText(undefined)).toBe('Your presentation will start in a moment.');
  });
});
