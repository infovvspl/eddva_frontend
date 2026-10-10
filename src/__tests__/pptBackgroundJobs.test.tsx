/**
 * Presentations generating in the background, as Course Content shows them.
 *
 * A teacher sends a deck to the background from PPT Studio and keeps working;
 * the AI Generate modal shows a spinner and its progress, says when it is
 * ready, and opens it in the studio.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, toast } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn().mockResolvedValue({}),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@/lib/api/school-client', () => ({ default: { get: (...a: any[]) => get(...a), post: (...a: any[]) => post(...a) } }));
vi.mock('@/lib/api/client', () => ({ extractData: (res: any) => res.data }));
vi.mock('@/context/SchoolAuthContext', () => ({ useAuth: () => ({ user: { instituteId: 'inst-1' } }) }));
vi.mock('@/lib/api-config', () => ({ getApiBaseUrl: () => '/api/v1' }));
vi.mock('@/lib/api/school-content', () => ({ schoolContent: {} }));
vi.mock('sonner', () => ({ toast }));

import {
  __resetPptJobs, dismissPptJob, pptJobIsFor, pptJobProgress, pptJobToResume, refreshPptJobs,
  usePptJobs, type PptJob,
} from '@/lib/pptJobs';
import PptJobsList from '@/components/school/teacher/PptJobsList';
import PptJobsNotifier, { pptJobOpenPath } from '@/components/school/teacher/PptJobsNotifier';
import PptStudioPage, { pptStudioJobPath } from '@/pages/school/teacher/PptStudioPage';

const PAGE = '/school/teacher/ppt-studio?topic=Respiration&topicId=t1&saveTopicId=t1';

function job(over: Partial<PptJob> = {}): PptJob {
  return {
    jobId: 'job-1', createdAt: Date.now() - 65_000, topic: 'Respiration', topicName: 'Respiration',
    chapterName: 'Life Processes', subjectName: 'Science', className: 'Class 10', style: 'image',
    pagePath: PAGE, status: 'running', stage: 'pictures', done: 4, total: 10, queuePosition: null,
    activity: 'Slide 5: painting the slide', error: null, title: null, slides: null, ...over,
  };
}

function respond(jobs: PptJob[]) {
  get.mockResolvedValue({ data: { jobs } });
}

beforeEach(() => {
  __resetPptJobs();
  get.mockReset();
  post.mockClear();
  Object.values(toast).forEach((f) => f.mockClear());
  try { localStorage.clear(); } catch { /* ignore */ }
});

afterEach(() => { vi.useRealTimers(); });

describe('the progress line', () => {
  it('says where a deck has got, in the teacher’s words', () => {
    expect(pptJobProgress(job())).toBe('Painting slides · 4 of 10');
    expect(pptJobProgress(job({ style: 'v2' }))).toBe('Adding pictures · 4 of 10');
    expect(pptJobProgress(job({ stage: 'planning' }))).toBe('Writing the slides…');
    expect(pptJobProgress(job({ status: 'queued', queuePosition: 2 }))).toBe('Waiting in line · 2 ahead');
    expect(pptJobProgress(job({ status: 'done', slides: 10 }))).toBe('Ready · 10 slides');
    expect(pptJobProgress(job({ status: 'failed', error: 'service busy' }))).toBe('service busy');
  });
});

describe('opening Presentation for a topic', () => {
  // A teacher clicked the Presentation card while that topic's deck was being
  // made, and got a fresh setup screen - as if it had to be generated again.
  const topic = { id: 't1', kind: 'topic' as const };
  const chapterPage = '/school/teacher/ppt-studio?topic=Life+Processes&chapterId=c1&chapterName=Life+Processes';

  it('goes to the deck being made for that topic', () => {
    const running = job();
    expect(pptJobToResume([running], topic)).toBe(running);
  });

  it('goes to a finished deck that has not been opened yet', () => {
    const ready = job({ status: 'done', slides: 10 });
    expect(pptJobToResume([ready], topic)).toBe(ready);
  });

  it('prefers the one still generating over an older finished one', () => {
    const ready = job({ jobId: 'old', status: 'done' });
    const running = job({ jobId: 'new' });
    expect(pptJobToResume([ready, running], topic)!.jobId).toBe('new');
  });

  it('opens a fresh setup screen when the deck in progress is for another topic', () => {
    expect(pptJobToResume([job()], { id: 't2', kind: 'topic' })).toBeNull();
    expect(pptJobToResume([job({ status: 'failed' })], topic)).toBeNull();   // failed: start again
    expect(pptJobToResume([], topic)).toBeNull();
  });

  it('tells a whole-chapter deck from a deck for one of its topics', () => {
    const chapterDeck = job({ pagePath: chapterPage });
    expect(pptJobIsFor(chapterDeck, { id: 'c1', kind: 'chapter' })).toBe(true);
    expect(pptJobIsFor(chapterDeck, topic)).toBe(false);
    // The topic deck's page also names its chapter; it is still a topic deck.
    const topicDeck = job({ pagePath: `${PAGE}&chapterId=c1` });
    expect(pptJobIsFor(topicDeck, { id: 'c1', kind: 'chapter' })).toBe(false);
    expect(pptJobIsFor(job({ pagePath: null }), topic)).toBe(false);
  });
});

describe('the AI Generate list', () => {
  const noop = () => undefined;

  it('shows a spinner, the progress and that it takes a few minutes while generating', () => {
    render(<PptJobsList jobs={[job()]} onOpen={noop} onRetry={noop} onDismiss={noop} />);
    expect(screen.getByText(/Generating presentation · Respiration/)).toBeTruthy();
    expect(screen.getByLabelText('Generating')).toBeTruthy();
    expect(screen.getByText('Painting slides · 4 of 10')).toBeTruthy();
    expect(screen.getByText(/This takes a few minutes/)).toBeTruthy();
    expect(screen.getByText('· 1 min')).toBeTruthy();
  });

  it('offers Open when ready and Try again when it failed, and both can be dismissed', () => {
    const onOpen = vi.fn();
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    render(<PptJobsList jobs={[job({ jobId: 'a', status: 'done', title: 'Respiration Deck', slides: 10 }),
                               job({ jobId: 'b', status: 'failed', error: 'service busy' })]}
                        onOpen={onOpen} onRetry={onRetry} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Open'));
    expect(onOpen.mock.calls[0][0].jobId).toBe('a');
    fireEvent.click(screen.getByText('Try again'));
    expect(onRetry.mock.calls[0][0].jobId).toBe('b');
    fireEvent.click(screen.getAllByLabelText(/Remove .* from this list/)[0]);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows nothing when there are no background decks', () => {
    const { container } = render(<PptJobsList jobs={[]} onOpen={noop} onRetry={noop} onDismiss={noop} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('the shared list', () => {
  function Probe() {
    const { jobs, generating } = usePptJobs();
    return <p>{`${jobs.length} decks, ${generating.length} generating`}</p>;
  }

  it('is fetched once for every reader, and polled faster while a deck is generating', async () => {
    vi.useFakeTimers();
    respond([job()]);
    render(<><Probe /><Probe /></>);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(get).toHaveBeenCalledTimes(1);                         // one poller for both
    expect(screen.getAllByText('1 decks, 1 generating')).toHaveLength(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(get).toHaveBeenCalledTimes(2);                         // every 5s while busy
  });

  it('a dismissed deck leaves the list at once and on the server', async () => {
    respond([job({ status: 'done' })]);
    render(<Probe />);
    await act(async () => { await refreshPptJobs(); });
    await act(async () => { await dismissPptJob('job-1'); });
    expect(screen.getByText('0 decks, 0 generating')).toBeTruthy();
    expect(post).toHaveBeenCalledWith('/ppt/jobs/job-1/dismiss');
  });

  it('stops asking when the teacher has no access to presentations', async () => {
    vi.useFakeTimers();
    get.mockRejectedValue({ response: { status: 403 } });
    render(<Probe />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('the "ready" toast, on any teacher page', () => {
  function renderNotifier() {
    return render(
      <MemoryRouter initialEntries={['/school/teacher']}>
        <Routes>
          <Route path="/school/teacher" element={<><PptJobsNotifier /><p>Dashboard</p></>} />
          <Route path="/school/teacher/ppt-studio" element={<p>Studio</p>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('says once that a deck is ready, with a way to open it', async () => {
    respond([job({ status: 'done', title: 'Respiration Deck', slides: 10 })]);
    renderNotifier();
    await act(async () => { await refreshPptJobs(); });
    await act(async () => { await refreshPptJobs(); });
    expect(toast.success).toHaveBeenCalledTimes(1);
    const [title, opts] = toast.success.mock.calls[0] as any[];
    expect(title).toBe('Presentation ready: Respiration Deck');
    act(() => opts.action.onClick());
    expect(screen.getByText('Studio')).toBeTruthy();
  });

  it('says when a deck failed, with a way to try again', async () => {
    respond([job({ status: 'failed', error: 'service busy' })]);
    renderNotifier();
    await act(async () => { await refreshPptJobs(); });
    expect(toast.error).toHaveBeenCalledWith('Presentation could not be generated: Respiration',
      expect.objectContaining({ description: 'service busy' }));
  });

  it('says nothing while a deck is still generating', async () => {
    respond([job()]);
    renderNotifier();
    await act(async () => { await refreshPptJobs(); });
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('the studio page', () => {
  it('opens a background deck on its own studio page, resuming the job', () => {
    expect(pptJobOpenPath(job())).toBe(`${PAGE}&job=job-1`);
    expect(pptStudioJobPath(`${PAGE}&job=old`, 'new')).toBe(`${PAGE}&job=new`);
    expect(pptJobOpenPath(job({ pagePath: null }))).toBe('/school/teacher/ppt-studio?job=job-1');
  });

  function renderStudio(path: string) {
    return render(
      <MemoryRouter initialEntries={['/school/teacher/course-content', path]} initialIndex={1}>
        <Routes>
          <Route path="/school/teacher/course-content" element={<p>Course Content page</p>} />
          <Route path="/school/teacher/ppt-studio" element={<PptStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('tells the studio its page and the job to resume', () => {
    renderStudio(`${PAGE}&job=job-1`);
    const src = new URL(screen.getByTitle('AI PPT Studio').getAttribute('src')!, 'http://x');
    expect(src.searchParams.get('job')).toBe('job-1');
    expect(src.searchParams.get('page')).toBe(PAGE);              // without the job
  });

  it('goes back to Course Content when the deck is sent to the background', async () => {
    renderStudio(PAGE);
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'EDVA_PPT_BACKGROUND', jobId: 'job-1', topic: 'Respiration' } }));
    });
    expect(screen.getByText('Course Content page')).toBeTruthy();
    expect(toast.info).toHaveBeenCalledWith('Generating "Respiration" in the background', expect.anything());
  });
});
