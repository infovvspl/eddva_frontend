/**
 * The notice above a deck whose chosen style could not be made
 * (public/ppt-studio/js/app.js _showFallbackNotice).
 *
 * A teacher picked image slides; the provider timed the planner out and the
 * standard generator stood in. The deck looked like "the old PPT" and nothing
 * said why. Now the deck carries generation.fallback and the studio says so.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ROOT = resolve(__dirname, '../../public/ppt-studio');
let App: any;
let body = '';

beforeAll(() => {
  const doc = new DOMParser().parseFromString(readFileSync(resolve(ROOT, 'index.html'), 'utf8'), 'text/html');
  doc.querySelectorAll('script').forEach((s) => s.remove());
  body = doc.body.innerHTML;
  for (const file of ['api.js', 'app.js']) {
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', readFileSync(resolve(ROOT, 'js', file), 'utf8'))(window, document);
  }
  App = (window as any).App;
});

beforeEach(() => { document.body.innerHTML = body; });

const fallbackDeck = (requested = 'image') => ({
  title: 'Reflection of Light', slides: [{ title: 'A' }],
  generation: { version: 'v1', requested, fallback: true, fallbackReason: 'llm_error',
                fallbackWhy: 'the AI service was busy' },
});

describe('fallback notice', () => {
  it('says the chosen style could not be made, and why', () => {
    App._showFallbackNotice(fallbackDeck());
    const el = document.getElementById('fallback-notice')!;
    expect(el.hidden).toBe(false);
    expect(el.textContent).toContain('Image slides could not be made this time, because the AI service was busy.');
    expect(el.textContent).toContain('This deck uses the standard style.');
    // Right under the preview's top bar, where the teacher is looking.
    expect(document.querySelector('.preview-topbar')!.nextElementSibling).toBe(el);
  });

  it('names designed slides when those were asked for', () => {
    App._showFallbackNotice(fallbackDeck('v2'));
    expect(document.getElementById('fallback-notice')!.textContent).toContain('Designed slides could not be made');
  });

  it('offers to try again', () => {
    const spy = vi.spyOn(App, 'handleGenerate').mockImplementation(() => undefined);
    App._showFallbackNotice(fallbackDeck());
    (document.querySelector('.fallback-retry') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('is hidden for a deck in the chosen style, and for the next generation', () => {
    App._showFallbackNotice(fallbackDeck());
    App._showFallbackNotice({ slides: [], generation: { version: 'image' } });
    expect(document.getElementById('fallback-notice')!.hidden).toBe(true);
    App._showFallbackNotice(fallbackDeck());
    App._showFallbackNotice(null);
    expect(document.getElementById('fallback-notice')!.hidden).toBe(true);
  });

  it('a reason with markup is shown as text', () => {
    const deck = fallbackDeck();
    deck.generation.fallbackWhy = '<img src=x onerror=alert(1)>';
    App._showFallbackNotice(deck);
    expect(document.querySelector('#fallback-notice img')).toBeNull();
  });
});

describe('a deck made earlier for the same request', () => {
  const cachedDeck = () => ({
    title: 'Respiration', slides: [{ title: 'A' }],
    generation: { version: 'image', cached: true, cachedAt: 1760000000 },
  });

  it('says it came back at once, and offers a fresh one', () => {
    const spy = vi.spyOn(App, 'handleGenerate').mockImplementation(() => undefined);
    App._showCachedNotice(cachedDeck());
    const el = document.getElementById('cached-notice')!;
    expect(el.hidden).toBe(false);
    expect(el.textContent).toContain('made earlier for this topic');
    (el.querySelector('.fallback-retry') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith({ fresh: true });
    spy.mockRestore();
  });

  it('is hidden for a newly made deck', () => {
    App._showCachedNotice(cachedDeck());
    App._showCachedNotice({ slides: [], generation: { version: 'image' } });
    expect(document.getElementById('cached-notice')!.hidden).toBe(true);
  });

  it('asks the server for a fresh deck only when told to', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({ jobId: 'j' }) });
    vi.stubGlobal('fetch', fetchMock);
    (window as any).PPT_CFG = { pptUrl: (p: string) => p };
    const API = (window as any).API;
    await API.startPresentation('T', 8, 'x', 'en', {}, 'ebook', 'image', 'ocean-blue', { fresh: true });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).fresh).toBe(true);
    await API.startPresentation('T', 8, 'x', 'en', {}, 'ebook', 'image', 'ocean-blue');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).not.toHaveProperty('fresh');
    vi.unstubAllGlobals();
  });
});
