// Blog images are staged in the browser and only uploaded when the post is
// saved, so choosing, replacing or removing an image never leaves unused
// objects in storage. Staged images are referenced by blob: URLs.
import { uploadBlogCoverImage } from '@/lib/api/blogAdmin';

const staged = new Map<string, File | Blob>();

/** Holds the image locally and returns a blob: URL usable as an <img> src. */
export function stageBlogImage(file: File | Blob): string {
  const url = URL.createObjectURL(file);
  staged.set(url, file);
  return url;
}

export const isStagedImage = (url: string) => staged.has(url);

/** Uploads every staged image still referenced in `text` and swaps in its hosted URL. */
export async function uploadStagedImages(text: string, uploaded: Map<string, string>): Promise<string> {
  let result = text;
  for (const blobUrl of staged.keys()) {
    if (!result.includes(blobUrl)) continue;
    let hosted = uploaded.get(blobUrl);
    if (!hosted) {
      hosted = (await uploadBlogCoverImage(staged.get(blobUrl)!)).url;
      uploaded.set(blobUrl, hosted);
    }
    result = result.split(blobUrl).join(hosted);
  }
  return result;
}

/** Drops staged images (call after a successful save or when the form is discarded). */
export function clearStagedImages() {
  staged.forEach((_, url) => URL.revokeObjectURL(url));
  staged.clear();
}
