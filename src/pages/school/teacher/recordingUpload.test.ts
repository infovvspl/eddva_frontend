import { describe, it, expect, vi } from 'vitest';
import { resolveRecordingUpload, type UploadedVideo } from './recordingUpload';

const mkFile = (name = 'lecture.mp4') =>
  new File([new Uint8Array([1, 2, 3])], name, { type: 'video/mp4' });

describe('P0-3 (B4) — presigned upload reuse on retry', () => {
  it('uploads once for a fresh file', async () => {
    const upload = vi.fn().mockResolvedValue({ url: 'https://cdn/a.mp4', key: 'k-1' });
    const file = mkFile();

    const got = await resolveRecordingUpload(null, file, upload);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(got).toEqual({ url: 'https://cdn/a.mp4', key: 'k-1', file });
  });

  it('a retry reuses the same {url,key} and does NOT presign again', async () => {
    const upload = vi.fn()
      .mockResolvedValueOnce({ url: 'https://cdn/a.mp4', key: 'k-1' })
      .mockResolvedValueOnce({ url: 'https://cdn/b.mp4', key: 'k-2' }); // must never be reached
    const file = mkFile();

    const first = await resolveRecordingUpload(null, file, upload);
    // the create failed; the teacher hits Save again with the same file
    const second = await resolveRecordingUpload(first, file, upload);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(second.key).toBe('k-1'); // the server can now recognise the replay
  });

  it('repeated retries never mint a new key', async () => {
    const upload = vi.fn().mockResolvedValue({ url: 'https://cdn/a.mp4', key: 'k-1' });
    const file = mkFile();

    let cur: UploadedVideo | null = null;
    for (let i = 0; i < 5; i++) cur = await resolveRecordingUpload(cur, file, upload);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(cur!.key).toBe('k-1');
  });

  it('choosing a DIFFERENT file re-uploads rather than reusing a stale key', async () => {
    const upload = vi.fn()
      .mockResolvedValueOnce({ url: 'https://cdn/a.mp4', key: 'k-1' })
      .mockResolvedValueOnce({ url: 'https://cdn/b.mp4', key: 'k-2' });
    const first = await resolveRecordingUpload(null, mkFile('one.mp4'), upload);

    const other = mkFile('two.mp4');
    const second = await resolveRecordingUpload(first, other, upload);

    expect(upload).toHaveBeenCalledTimes(2);
    expect(second.key).toBe('k-2');
    expect(second.file).toBe(other);
  });

  it('a cleared cache (modal reset) uploads afresh', async () => {
    const upload = vi.fn()
      .mockResolvedValueOnce({ url: 'https://cdn/a.mp4', key: 'k-1' })
      .mockResolvedValueOnce({ url: 'https://cdn/b.mp4', key: 'k-2' });
    const file = mkFile();

    await resolveRecordingUpload(null, file, upload);
    const afterReset = await resolveRecordingUpload(null, file, upload); // state cleared

    expect(upload).toHaveBeenCalledTimes(2);
    expect(afterReset.key).toBe('k-2');
  });

  it('propagates an upload failure and caches nothing', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('network down'));
    await expect(resolveRecordingUpload(null, mkFile(), upload)).rejects.toThrow('network down');
    expect(upload).toHaveBeenCalledTimes(1);
  });
});

/**
 * The helper alone cannot prove B4 works: the retry only reuses the key because
 * handleUploadRecording stores the result BEFORE calling create, and its catch
 * does not clear it (only resetRecordingModal(), on success, does).
 * This harness mirrors that exact ordering from ClassManagement.tsx so a
 * regression in the sequence fails here rather than in production.
 */
function makeUploadFlow(
  upload: (f: File) => Promise<{ url: string; key: string }>,
  create: (payload: { videoUrl: string; videoKey: string }) => Promise<unknown>,
) {
  let uploadedVideo: UploadedVideo | null = null;   // the component's state
  let resets = 0;
  return {
    get cached() { return uploadedVideo; },
    get resets() { return resets; },
    pickNewFile() { uploadedVideo = null; },        // file-input onChange clears it
    async submit(file: File) {
      try {
        const up = await resolveRecordingUpload(uploadedVideo, file, upload);
        uploadedVideo = up;                         // stored BEFORE create
        await create({ videoUrl: up.url, videoKey: up.key });
        uploadedVideo = null; resets++;             // resetRecordingModal() — success only
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, err };         // catch must NOT clear the cache
      }
    },
  };
}

describe('P0-3 (B4) — create-failure retry, as sequenced in ClassManagement.tsx', () => {
  it('A. the initial upload obtains and stores videoKey/videoUrl', async () => {
    const upload = vi.fn().mockResolvedValue({ url: 'https://cdn/a.mp4', key: 'k-1' });
    const create = vi.fn().mockRejectedValue(new Error('500 from create'));
    const flow = makeUploadFlow(upload, create);

    await flow.submit(mkFile());

    expect(upload).toHaveBeenCalledTimes(1);
    expect(flow.cached).toMatchObject({ url: 'https://cdn/a.mp4', key: 'k-1' });
  });

  it('B+C. a failed create then a retry reuses the SAME key and does not presign again', async () => {
    const upload = vi.fn()
      .mockResolvedValueOnce({ url: 'https://cdn/a.mp4', key: 'k-1' })
      .mockResolvedValueOnce({ url: 'https://cdn/b.mp4', key: 'k-2' }); // must never be reached
    const create = vi.fn()
      .mockRejectedValueOnce(new Error('network blip'))
      .mockResolvedValueOnce({ id: 'rec1' });
    const file = mkFile();
    const flow = makeUploadFlow(upload, create);

    const first = await flow.submit(file);
    const second = await flow.submit(file);          // teacher clicks Save again

    expect(first.ok).toBe(false);
    expect(second.ok).toBe(true);
    expect(upload).toHaveBeenCalledTimes(1);         // C — no second presign
    expect(create).toHaveBeenCalledTimes(2);
    // B — both submissions carried the identical upload identity
    expect(create.mock.calls[0][0]).toEqual(create.mock.calls[1][0]);
    expect(create.mock.calls[1][0]).toEqual({ videoUrl: 'https://cdn/a.mp4', videoKey: 'k-1' });
  });

  it('B. survives several consecutive create failures without minting a new key', async () => {
    const upload = vi.fn().mockResolvedValue({ url: 'https://cdn/a.mp4', key: 'k-1' });
    const create = vi.fn().mockRejectedValue(new Error('still failing'));
    const file = mkFile();
    const flow = makeUploadFlow(upload, create);

    for (let i = 0; i < 4; i++) await flow.submit(file);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(4);
    for (const call of create.mock.calls) expect(call[0].videoKey).toBe('k-1');
  });

  it('D. a genuinely new upload after a success presigns again and gets a new key', async () => {
    const upload = vi.fn()
      .mockResolvedValueOnce({ url: 'https://cdn/a.mp4', key: 'k-1' })
      .mockResolvedValueOnce({ url: 'https://cdn/b.mp4', key: 'k-2' });
    const create = vi.fn().mockResolvedValue({ id: 'rec' });
    const flow = makeUploadFlow(upload, create);

    await flow.submit(mkFile('one.mp4'));            // succeeds -> resets
    expect(flow.resets).toBe(1);
    expect(flow.cached).toBeNull();

    flow.pickNewFile();
    await flow.submit(mkFile('two.mp4'));

    expect(upload).toHaveBeenCalledTimes(2);         // two separate presigns
    expect(create.mock.calls[0][0].videoKey).toBe('k-1');
    expect(create.mock.calls[1][0].videoKey).toBe('k-2');
    // 11 — two genuinely separate uploads keep separate keys (the T4 property)
    expect(create.mock.calls[0][0].videoKey).not.toBe(create.mock.calls[1][0].videoKey);
  });

  it('E. a successful create clears the cache so the next upload is independent', async () => {
    const upload = vi.fn()
      .mockResolvedValueOnce({ url: 'https://cdn/a.mp4', key: 'k-1' })
      .mockResolvedValueOnce({ url: 'https://cdn/b.mp4', key: 'k-2' });
    const create = vi.fn().mockResolvedValue({ id: 'rec' });
    const flow = makeUploadFlow(upload, create);
    const file = mkFile();

    await flow.submit(file);
    expect(flow.cached).toBeNull();                  // reset ran

    await flow.submit(file);                         // same File, but cache was cleared
    expect(upload).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].videoKey).toBe('k-2');
  });

  it('E. an upload failure leaves nothing cached, so the next attempt presigns cleanly', async () => {
    const upload = vi.fn()
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce({ url: 'https://cdn/a.mp4', key: 'k-1' });
    const create = vi.fn().mockResolvedValue({ id: 'rec' });
    const file = mkFile();
    const flow = makeUploadFlow(upload, create);

    const first = await flow.submit(file);
    expect(first.ok).toBe(false);
    expect(flow.cached).toBeNull();                  // nothing half-cached
    expect(create).not.toHaveBeenCalled();           // create never attempted

    const second = await flow.submit(file);
    expect(second.ok).toBe(true);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0].videoKey).toBe('k-1');
  });
});
