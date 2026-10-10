/**
 * PPT Studio theme picker (public/ppt-studio: index.html, js/app.js, js/api.js).
 *
 * "Choose a Theme" used to colour only the older generator's decks; designed
 * (V2) and painted decks ignored it. Now the pick travels with the request as
 * `deckTheme`, "Match the subject" is the default, and Presentation Style -
 * which designed and painted decks never used - is hidden for them.
 *
 * The shipped markup and scripts are loaded into jsdom, so the thing under
 * test is what the page loads.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ROOT = resolve(__dirname, '../../public/ppt-studio');
const NAMED = ['dark-professional', 'ocean-blue', 'warm-sunset', 'forest-green',
  'royal-purple', 'clean-white'];
let App: any;
let API: any;
let setupMarkup = '';

function load(file: string) {
  const code = readFileSync(resolve(ROOT, 'js', file), 'utf8');
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', code)(window, document);
}

beforeAll(() => {
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  setupMarkup = doc.getElementById('setup-view')!.outerHTML;
  load('api.js');
  load('app.js');
  App = (window as any).App;
  API = (window as any).API;
});

beforeEach(() => {
  document.body.innerHTML = setupMarkup;
  localStorage.clear();
});

const cards = () => Array.from(document.querySelectorAll<HTMLElement>('.theme-card'));
const card = (key: string) => document.querySelector<HTMLElement>(`.theme-card[data-theme="${key}"]`)!;

describe('theme cards', () => {
  it('offers the six named themes, as the design shows them', () => {
    expect(cards().map((c) => c.dataset.theme)).toEqual(NAMED);
  });

  it('defaults to Dark Professional, the selected card in the design', () => {
    App.initThemePicker();
    expect(App.selectedDeckTheme()).toBe('dark-professional');
    expect(card('dark-professional').getAttribute('aria-pressed')).toBe('true');
    expect(cards().filter((c) => c.classList.contains('selected'))).toHaveLength(1);
  });

  it('every named card is a theme the older generator can also draw', () => {
    expect(Object.keys((window as any).THEMES).sort()).toEqual([...NAMED].sort());
  });
});

describe('picking a theme', () => {
  it('selects exactly one card and remembers it', () => {
    App.initThemePicker();
    card('ocean-blue').click();
    expect(App.selectedDeckTheme()).toBe('ocean-blue');
    expect(card('ocean-blue').getAttribute('aria-pressed')).toBe('true');
    expect(card('dark-professional').getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('ppt_deck_theme')).toBe('ocean-blue');

    document.body.innerHTML = setupMarkup;           // a later visit
    App.initThemePicker();
    expect(App.selectedDeckTheme()).toBe('ocean-blue');
  });

  it('works from the keyboard', () => {
    App.initThemePicker();
    card('royal-purple').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(App.selectedDeckTheme()).toBe('royal-purple');
  });

  it('ignores a remembered value that is no longer a card', () => {
    localStorage.setItem('ppt_deck_theme', 'neon');
    App.initThemePicker();
    expect(App.selectedDeckTheme()).toBe('dark-professional');
  });
});

describe('the older generator', () => {
  it('draws a subject-coloured deck in Clean White and a named theme as itself', () => {
    expect(App.v1ThemeFor('subject')).toBe('clean-white');
    expect(App.v1ThemeFor('')).toBe('clean-white');
    expect(App.v1ThemeFor('neon')).toBe('clean-white');
    for (const key of NAMED) expect(App.v1ThemeFor(key)).toBe(key);
  });
});

describe('Presentation Style', () => {
  it('is hidden for designed and painted decks', () => {
    for (const style of ['v2', 'image']) {
      App.slideStyle = style;
      App._syncPresentationStyle();
      expect(document.getElementById('sec-style')!.hidden).toBe(true);
    }
  });

  it('stays for the older generator', () => {
    App.slideStyle = 'v1';
    App._syncPresentationStyle();
    expect(document.getElementById('sec-style')!.hidden).toBe(false);
  });

  it('is hidden from the first paint, since the studio offers only those two', () => {
    App.initSlideStylePicker();
    expect(document.getElementById('sec-style')!.hidden).toBe(true);
  });
});

describe('the request', () => {
  async function bodyOf(call: () => Promise<any>) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 202, json: async () => ({ success: true, jobId: 'j', data: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await call();
    vi.unstubAllGlobals();
    return JSON.parse(fetchMock.mock.calls[0][1].body);
  }

  it('carries the picked theme on both routes', async () => {
    const start = await bodyOf(() => API.startPresentation('T', 'auto', 'forest-green', 'English',
      null, 'ebook', 'v2', 'forest-green'));
    expect(start.deckTheme).toBe('forest-green');
    const once = await bodyOf(() => API.generatePresentation('T', 'auto', 'forest-green', 'English',
      null, 'ebook', 'image', 'forest-green'));
    expect(once.deckTheme).toBe('forest-green');
  });

  it('sends no theme for "Match the subject"', async () => {
    for (const deckTheme of ['subject', undefined, '']) {
      const body = await bodyOf(() => API.startPresentation('T', 'auto', 'clean-white', 'English',
        null, 'ebook', 'v2', deckTheme));
      expect(body).not.toHaveProperty('deckTheme');
      expect(body.theme).toBe('clean-white');
    }
  });
});
