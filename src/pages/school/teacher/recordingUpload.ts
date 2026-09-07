/**
 * P0-3 (B4) — presigned-upload reuse for the recording create flow.
 *
 * Each presign mints a fresh S3 key (`...<Date.now()>-<uuid>-<name>`), and the
 * server dedupes a replayed submission on (institute_id, video_key). So if a
 * create fails and the teacher hits Save again, re-presigning would produce a
 * NEW key, defeat the server-side guard, and create a second recording — which
 * costs a second transcription and notes run.
 *
 * Holding the first result for the life of the modal session makes the retry a
 * byte-identical submission, which the server then recognises and dedupes.
 */
export type UploadedVideo = { url: string; key: string; file: File };

/**
 * Return the already-uploaded object for this exact file, or upload it once.
 * The cache is pinned to the File instance, so choosing a different file
 * correctly re-uploads rather than reusing a stale key.
 */
export async function resolveRecordingUpload(
  cached: UploadedVideo | null,
  file: File,
  upload: (f: File) => Promise<{ url: string; key: string }>,
): Promise<UploadedVideo> {
  if (cached && cached.file === file) return cached;
  const fresh = await upload(file);
  return { ...fresh, file };
}
