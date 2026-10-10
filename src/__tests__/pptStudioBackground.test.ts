/**
 * PPT Studio (public/ppt-studio): send a deck to the background, and resume one.
 *
 * A deck takes a few minutes. The teacher can press "Continue in background"
 * and go on working; the deck keeps generating on the server, and Course
 * Content opens it later with ?job=<id>.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const ROOT = resolve(__dirname, '../../public/ppt-studio');
let App: any;
let API: any;
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
});

beforeEach(() => {
  document.body.innerHTML = body;
  App._currentJobId = null;
  App._backgrounded = false;
  vi.spyOn(App, '_sleep').mockResolvedValue(undefined);
  vi.spyOn(App, 'showPreview').mockImplementation(() => undefined);
  vi.spyOn(API, 'dismissJob').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as any).presentationData;
});

const deck = () => ({ title: 'Respiration', slides: [{ title: 'A' }], generation: { version: 'v2' } });

describe('continue in background', () => {
  it('is offered while a deck is generating inside EDVA', () => {
    const parent = { postMessage: vi.fn() };
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as any);
    App._trackJob('job-1');
    expect(document.getElementById('loading-background')!.hidden).toBe(false);
  });

  it('is not offered when the studio is opened on its own (nowhere to go back to)', () => {
    App._trackJob('job-1');
    expect(document.getElementById('loading-background')!.hidden).toBe(true);
  });

  it('hands the deck to EDVA and stops following it here', async () => {
    const parent = { postMessage: vi.fn() };
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as any);
    (document.getElementById('topic-input') as HTMLInputElement).value = 'Respiration';
    vi.spyOn(API, 'getPresentationStatus').mockResolvedValue({ status: 'running', stage: 'planning' });
    App._trackJob('job-1');
    App.sendToBackground();
    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: 'EDVA_PPT_BACKGROUND', jobId: 'job-1', topic: 'Respiration', reason: 'teacher' }, '*');
    const result = await App._followJob('job-1', 'dark-professional', 'executive');
    expect(result).toEqual({ _backgrounded: true });
    expect(API.dismissJob).not.toHaveBeenCalled();          // still on the teacher's list
  });
});

describe('resuming a deck from Course Content', () => {
  it('opens a finished deck and takes it off the background list', async () => {
    vi.spyOn(API, 'getPresentationStatus').mockResolvedValue({ status: 'done', result: { data: deck() } });
    await App.resumeJob('job-9');
    expect(App.showPreview).toHaveBeenCalled();
    expect((window as any).presentationData.title).toBe('Respiration');
    expect(API.dismissJob).toHaveBeenCalledWith('job-9');
  });

  it('follows a deck still being made, then opens it', async () => {
    vi.spyOn(API, 'getPresentationStatus')
      .mockResolvedValueOnce({ status: 'running', stage: 'pictures', done: 3, total: 10 })
      .mockResolvedValueOnce({ status: 'done', result: { data: deck() } });
    await App.resumeJob('job-9');
    expect(App.showPreview).toHaveBeenCalled();
    expect(API.dismissJob).toHaveBeenCalledWith('job-9');
  });

  it('says so plainly when the deck can no longer be opened', async () => {
    const toast = vi.spyOn(App, 'showToast').mockImplementation(() => undefined);
    vi.spyOn(API, 'getPresentationStatus').mockResolvedValue({ status: 'failed', error: 'expired' });
    await App.resumeJob('job-9');
    expect(toast).toHaveBeenCalledWith('expired', 'error');
    expect(API.dismissJob).not.toHaveBeenCalled();
  });
});

describe('a new deck', () => {
  it('records the EDVA page it was made from, so it can be reopened there', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({ jobId: 'j' }) });
    vi.stubGlobal('fetch', fetchMock);
    const cfg = (window as any).PPT_CFG;
    const page = cfg.page;
    cfg.page = '/school/teacher/ppt-studio?topic=Respiration&topicId=t1';
    await API.startPresentation('T', 10, 'x', 'en', {}, 'ebook', 'image', 'ocean-blue');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).pagePath)
      .toBe('/school/teacher/ppt-studio?topic=Respiration&topicId=t1');
    cfg.page = page;
    vi.unstubAllGlobals();
  });
});

describe('a deck is never reported as failed because the server was briefly away', () => {
  // The studio used to say "Generation failed" after five dropped status
  // checks (about ten seconds) - a backend restart takes about ninety - and
  // "taking too long" after eight minutes, while the deck was still being made.
  function clock() {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    (App._sleep as any).mockImplementation(async (ms: number) => { now += ms; });
    return { advance: (ms: number) => { now += ms; } };
  }
  const offline = () => Object.assign(new Error('Failed to fetch'), { status: undefined });

  it('rides out an outage and carries on with the deck', async () => {
    clock();
    const status = vi.spyOn(App, 'updateLoadingStatus');
    const poll = vi.spyOn(API, 'getPresentationStatus');
    for (let i = 0; i < 12; i++) poll.mockRejectedValueOnce(offline());       // well past 5 failures
    poll.mockResolvedValueOnce({ status: 'done', result: { data: deck() } });
    const result = await App._followJob('job-1', 'dark-professional', 'executive');
    expect(result.title).toBe('Respiration');
    expect(status).toHaveBeenCalledWith('Reconnecting…', expect.stringContaining('still being made'));
  });

  it('says plainly when the deck itself is gone', async () => {
    clock();
    vi.spyOn(API, 'getPresentationStatus').mockRejectedValue(Object.assign(new Error('job not found'), { status: 404 }));
    await expect(App._followJob('job-1', 'dark-professional', 'executive'))
      .rejects.toThrow('no longer available');
  });

  it('after three minutes without contact, hands the deck to the background list', async () => {
    clock();
    const parent = { postMessage: vi.fn() };
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as any);
    vi.spyOn(API, 'getPresentationStatus').mockRejectedValue(offline());
    const result = await App._followJob('job-1', 'dark-professional', 'executive');
    expect(result).toEqual({ _backgrounded: true });
    expect(parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'EDVA_PPT_BACKGROUND', jobId: 'job-1', reason: 'offline' }), '*');
  });

  it('a slow deck goes to the background list instead of failing', async () => {
    clock();
    const parent = { postMessage: vi.fn() };
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as any);
    vi.spyOn(API, 'getPresentationStatus').mockResolvedValue({ status: 'running', stage: 'planning' });
    const result = await App._followJob('job-1', 'dark-professional', 'executive');
    expect(result).toEqual({ _backgrounded: true });
    expect(parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'EDVA_PPT_BACKGROUND', reason: 'slow' }), '*');
  });

  it('outside EDVA (nowhere to hand it to) it explains that the deck is still being made', async () => {
    clock();
    vi.spyOn(API, 'getPresentationStatus').mockRejectedValue(offline());
    await expect(App._followJob('job-1', 'dark-professional', 'executive'))
      .rejects.toThrow('still being made');
  });
});

describe('starting a deck through a network blip', () => {
  const ok = { ok: true, status: 202, json: async () => ({ jobId: 'job-1' }) };
  const start = () => API.startPresentation('T', 10, 'x', 'en', {}, 'ebook', 'image', 'ocean-blue');
  let waits: number[];

  beforeEach(() => {
    waits = API.START_RETRY_WAITS_MS;
    API.START_RETRY_WAITS_MS = [0, 0];        // no real pauses in tests
  });
  afterEach(() => { API.START_RETRY_WAITS_MS = waits; vi.unstubAllGlobals(); });

  it('tries again when the request never reached the server', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce(ok);
    vi.stubGlobal('fetch', fetchMock);
    expect(await start()).toBe('job-1');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('never starts a deck twice: a real answer or a 504 is not retried', async () => {
    for (const status of [400, 429, 500, 504]) {
      const fetchMock = vi.fn().mockResolvedValue({ ok: false, status, json: async () => ({ message: 'no ' + status }) });
      vi.stubGlobal('fetch', fetchMock);
      await expect(start()).rejects.toThrow('no ' + status);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it('says plainly when the server cannot be reached at all', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(start()).rejects.toThrow('Could not reach the server');
  });
});
