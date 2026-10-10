/**
 * PPT Studio setup screen and loading card (public/ppt-studio).
 *
 * The setup screen was rebuilt to the 2026 design: a curriculum box that opens
 * to the full scope, a topic counter, one slide-count dropdown, slide-style
 * cards and theme thumbnails with filter chips. The loading card now says
 * which deck is being made and checks it against the scope the server reports
 * - a teacher had seen decks for one topic come out about another.
 *
 * The shipped markup and scripts are loaded into jsdom.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../../public/ppt-studio');
let App: any;
let markup = '';

beforeAll(() => {
  const doc = new DOMParser().parseFromString(readFileSync(resolve(ROOT, 'index.html'), 'utf8'), 'text/html');
  markup = doc.getElementById('setup-view')!.outerHTML + doc.getElementById('loading-overlay')!.outerHTML;
  for (const file of ['api.js', 'app.js']) {
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', readFileSync(resolve(ROOT, 'js', file), 'utf8'))(window, document);
  }
  App = (window as any).App;
});

beforeEach(() => {
  document.body.innerHTML = markup;
  localStorage.clear();
  App.ebookAvailable = undefined;
  App.scope = { className: 'Class 10', subjectName: 'Science', chapterName: 'Life Processes',
                topicName: 'Respiration', topicId: 't1', chapterId: 'c1' };
});

const $ = (id: string) => document.getElementById(id)!;

describe('curriculum box', () => {
  it('reads Class – Subject › Chapter › Topic and says it is curriculum aligned', () => {
    App.renderScopeBanner();
    expect($('scope-text').textContent).toBe('Class 10 – ScienceLife ProcessesRespiration');
    expect($('scope-text').querySelectorAll('span')).toHaveLength(3);
    expect($('curriculum-aligned').hidden).toBe(false);
  });

  it('opens to the full scope and what the slides will cover', () => {
    App.renderScopeBanner();
    App.initScopeToggle();
    expect($('scope-details').hidden).toBe(true);
    $('scope-banner').click();
    expect($('scope-details').hidden).toBe(false);
    expect($('scope-banner').getAttribute('aria-expanded')).toBe('true');
    expect($('scope-details').textContent).toContain('Slides will cover this topic only.');
  });

  it('warns when no class was found, and does not claim alignment', () => {
    App.scope = { subjectName: 'Science', topicName: 'Respiration' };
    App.renderScopeBanner();
    expect($('scope-banner').classList.contains('is-warn')).toBe(true);
    expect($('curriculum-aligned').hidden).toBe(true);
    expect($('scope-details').textContent).toContain('No class detected');
  });

  it('says plainly when the studio was opened without a curriculum', () => {
    App.scope = {};
    App.renderScopeBanner();
    expect($('scope-text').textContent).toContain('No curriculum selected');
    expect($('curriculum-aligned').hidden).toBe(true);
  });

  it('escapes names rather than rendering them as markup', () => {
    App.scope = { className: 'Class 10', topicName: '<img src=x onerror=alert(1)>' };
    App.renderScopeBanner();
    expect($('scope-text').querySelector('img')).toBeNull();
  });
});

describe('topic and slide count', () => {
  it('counts the topic as the teacher types, up to 200', () => {
    App.initTopicCounter();
    const input = $('topic-input') as HTMLInputElement;
    input.value = 'REFLECTION OF LIGHT';
    input.dispatchEvent(new Event('input'));
    expect($('topic-count').textContent).toBe('19/200');
    expect(input.maxLength).toBe(200);
  });

  it('offers Auto first, then 3 to 10 slides, and asks for what is chosen', () => {
    App.initSlideCountMode();
    const select = $('slide-count-select') as HTMLSelectElement;
    expect(select.options[0].textContent).toBe('Auto (Recommended)');
    expect(select.options).toHaveLength(1 + 8);          // decks are capped at 10
    expect(select.options[select.options.length - 1].value).toBe('10');
    expect(App.slideCountRequest()).toBe('auto');
    select.value = '8';
    select.dispatchEvent(new Event('change'));
    expect(App.slideCountRequest()).toBe(8);
    expect(localStorage.getItem('ppt_slide_count')).toBe('8');
  });

  it('a count in the link is clamped to what the server accepts', () => {
    App.initSlideCountMode();
    App.setSlideCount(40);
    expect(App.slideCountRequest()).toBe(10);
    App.setSlideCount(1);
    expect(App.slideCountRequest()).toBe(3);
  });
});

describe('slide style and theme filters', () => {
  it('image slides are the only style on offer for now (Designed is withdrawn)', () => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.slide-style-btn'));
    expect(cards.map((c) => c.dataset.slideStyle)).toEqual(['image']);
    expect(document.querySelector('[data-slide-style="v2"]')).toBeNull();
    expect(document.body.textContent).not.toContain('Designed (Editable)');
  });

  it('image slides are the starting choice, marked for assistive technology too', () => {
    App.initSlideStylePicker();
    const card = document.querySelector<HTMLElement>('[data-slide-style="image"]')!;
    expect(App.slideStyle).toBe('image');
    expect(card.classList.contains('selected')).toBe(true);
    expect(card.getAttribute('aria-pressed')).toBe('true');
    card.click();                                     // clicking it again changes nothing
    expect(App.slideStyle).toBe('image');
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('a Designed choice left behind by an earlier studio is ignored', () => {
    localStorage.setItem('ppt_slide_style', 'v2');
    App.initSlideStylePicker();
    expect(App.slideStyle).toBe('image');
    localStorage.removeItem('ppt_slide_style');
  });

  it('image slides offer no slide count and always ask for 10', () => {
    App.initSlideCountMode();
    App.initSlideStylePicker();
    const select = $('slide-count-select') as HTMLSelectElement;
    select.value = '6';
    expect(document.getElementById('sec-slides')!.hidden).toBe(true);
    expect(App.slideCountRequest()).toBe(10);
    expect(document.getElementById('slide-style-hint')!.textContent).toContain('Always 10 slides');
  });

  it('a filter chip narrows the themes, and All brings them back', () => {
    App.initThemeFilter();
    (document.querySelector('[data-theme-filter="minimal"]') as HTMLElement).click();
    const visible = () => Array.from(document.querySelectorAll<HTMLElement>('.theme-card'))
      .filter((c) => !c.hidden).map((c) => c.dataset.theme);
    expect(visible()).toEqual(['clean-white']);
    (document.querySelector('[data-theme-filter="all"]') as HTMLElement).click();
    expect(visible()).toHaveLength(6);
  });
});

describe('loading card: which deck is being made', () => {
  const server = (over: any = {}) => ({
    kind: 'topic', topic: 'Respiration', topicName: 'Respiration', chapterName: 'Life Processes',
    subjectName: 'Science', className: 'Class 10', ...over,
  });

  it('names the deck the moment generation starts', () => {
    App._renderLoadingScope('Respiration');
    expect($('loading-scope').hidden).toBe(false);
    expect($('loading-scope-title').textContent).toBe('Respiration');
    expect($('loading-scope-meta').textContent).toBe('Topic · Chapter: Life Processes · Class 10 · Science');
    expect($('loading-scope-check').hidden).toBe(true);
  });

  it('confirms it when the server is making the same deck', () => {
    App._renderLoadingScope('Respiration');
    App._confirmLoadingScope(server());
    expect($('loading-scope-check').hidden).toBe(false);
    expect($('loading-scope-warn').hidden).toBe(true);
  });

  it('flags a different topic, naming both', () => {
    App._renderLoadingScope('Respiration');
    App._confirmLoadingScope(server({ topicName: 'Nutrition in Plants' }));
    expect($('loading-scope').classList.contains('is-warn')).toBe(true);
    expect($('loading-scope-warn').textContent).toContain('“Nutrition in Plants”, not “Respiration”');
    expect($('loading-scope-title').textContent).toBe('Nutrition in Plants');   // what is really being made
    expect($('loading-scope-check').hidden).toBe(true);
  });

  it('flags a deck that lost its chapter on the way', () => {
    App._renderLoadingScope('Respiration');
    App._confirmLoadingScope({ kind: 'free', topic: 'Respiration' });
    expect($('loading-scope-warn').textContent).toContain('without the chapter you opened');
  });

  it('a chapter opened from a topic node is filled in by the server, not flagged', () => {
    App.scope = { className: 'Class 10', subjectName: 'Science', topicName: 'Respiration', topicId: 't1' };
    App._renderLoadingScope('Respiration');
    App._confirmLoadingScope(server());
    expect($('loading-scope-check').hidden).toBe(false);
    expect($('loading-scope-meta').textContent).toContain('Chapter: Life Processes');
  });

  it('shows an edited topic box as the focus', () => {
    App._renderLoadingScope('Anaerobic respiration in yeast');
    expect($('loading-scope-meta').textContent).toContain('Focus: “Anaerobic respiration in yeast”');
  });

  it('a whole-chapter deck says so', () => {
    App.scope = { className: 'Class 10', subjectName: 'Science', chapterName: 'Life Processes', chapterId: 'c1' };
    App._renderLoadingScope('Life Processes');
    expect($('loading-scope-title').textContent).toBe('Life Processes');
    expect($('loading-scope-meta').textContent).toBe('Whole chapter · Class 10 · Science');
  });

  it('is hidden on other loading screens, such as opening a saved deck', () => {
    App._renderLoadingScope('Respiration');
    App.showLoading('Loading presentation preview…', 'Connecting…');
    expect($('loading-scope').hidden).toBe(true);
    App.hideLoading();
  });
});
