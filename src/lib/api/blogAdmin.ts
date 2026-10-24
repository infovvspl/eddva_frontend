// blogAdmin.ts — blog admin panel API calls. Uses `blogAdminClient`, a
// separate axios instance from the LMS's `apiClient` — see that file's
// header comment for why. Public marketing-site reads still live in `blog.ts`.

import { blogAdminClient, blogAdminToken, extractData } from './blogAdminClient';

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';

export interface BlogDocumentSettings {
  pageSize?: 'A4' | 'LETTER';
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  header?: string;
  footer?: string;
  showPageNumbers?: boolean;
  showTotalPages?: boolean;
  fontFamily?: string;
  fontSize?: number;
}

export interface BlogReference {
  id: string;
  kind: 'footnote' | 'endnote';
  text: string;
}

export interface BlogSection {
  heading: string;
  body: string;
  contentJson?: Record<string, unknown>;
  references?: BlogReference[];
}

export interface BlogPostPayload {
  title: string;
  locale?: 'en' | 'hi';
  translationGroup?: string | null;
  slug?: string;
  category?: string;
  excerpt?: string;
  author?: string;
  coverImage?: string;
  readTime?: number;
  sections?: BlogSection[];
  documentSettings?: BlogDocumentSettings;
  status?: BlogPostStatus;
}

export interface BlogPost extends BlogPostPayload {
  id: string;
  slug: string;
  status: BlogPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  items: BlogPost[];
  total: number;
  page: number;
  limit: number;
}

export interface BlogListParams {
  locale?: 'en' | 'hi';
  category?: string;
  status?: BlogPostStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BlogAdmin {
  id: string;
  username: string;
  name: string | null;
}

// ── Auth ─────────────────────────────────────────────────────────────────

export async function loginBlogAdmin(username: string, password: string) {
  const res = await blogAdminClient.post('/blog-admin/auth/login', { username, password });
  const { token, admin } = extractData<{ token: string; admin: BlogAdmin }>(res);
  blogAdminToken.set(token);
  return admin;
}

export function logoutBlogAdmin() {
  blogAdminToken.clear();
}

export function getCurrentBlogAdmin() {
  return blogAdminClient.get('/blog-admin/auth/me').then((r) => extractData<BlogAdmin>(r));
}

export function changeBlogAdminPassword(currentPassword: string, newPassword: string) {
  return blogAdminClient
    .post('/blog-admin/auth/change-password', { currentPassword, newPassword })
    .then((r) => extractData<{ message: string }>(r));
}

// ── Posts ────────────────────────────────────────────────────────────────

export function getBlogPosts(params: BlogListParams = {}) {
  return blogAdminClient.get('/blog-admin/posts', { params }).then((r) => extractData<BlogListResponse>(r));
}

export function getBlogPost(id: string) {
  return blogAdminClient.get(`/blog-admin/posts/${id}`).then((r) => extractData<BlogPost>(r));
}

export function createBlogPost(payload: BlogPostPayload) {
  return blogAdminClient.post('/blog-admin/posts', payload).then((r) => extractData<BlogPost>(r));
}

export function updateBlogPost(id: string, patch: Partial<BlogPostPayload>) {
  return blogAdminClient.patch(`/blog-admin/posts/${id}`, patch).then((r) => extractData<BlogPost>(r));
}

export function deleteBlogPost(id: string) {
  return blogAdminClient.delete(`/blog-admin/posts/${id}`).then((r) => extractData<{ message: string }>(r));
}

const WEBP_QUALITY = 0.82;
const WEBP_MAX_DIMENSION = 2400;
// Animated / vector formats would lose information in a canvas re-encode.
const SKIP_WEBP_TYPES = new Set(['image/gif', 'image/svg+xml', 'image/webp']);

async function toWebp(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, WEBP_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
  if (!blob || blob.type !== 'image/webp') throw new Error('webp encode unsupported');
  return blob;
}

// Short content hash (first 12 hex chars of SHA-256) so the stored name is
// unguessable and identical images share a name.
async function contentHash(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest)).slice(0, 6).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Every blog image upload (cover, editor toolbar, imported Word images) goes
// through here: raster images are re-encoded to WebP and named by content hash.
// Falls back to the original file if conversion isn't possible.
// Accepts a Blob too — the cover cropper outputs one (canvas.toBlob), and
// Blobs carry no filename of their own, so one is always supplied explicitly
// here (the backend derives the extension from it).
export async function uploadBlogCoverImage(file: File | Blob) {
  const form = new FormData();
  let body: File | Blob = file;
  let filename: string | undefined;
  if (!SKIP_WEBP_TYPES.has(file.type)) {
    try {
      const webp = await toWebp(file);
      body = webp;
      filename = `${await contentHash(webp)}.webp`;
    } catch (error) {
      console.warn('WebP conversion failed; uploading original image', error);
    }
  }
  const mime = body.type || 'image/jpeg';
  const extension = mime.split('/')[1] || 'jpg';
  form.append('file', body, filename || (file as File).name || `blog-image.${extension}`);
  return blogAdminClient
    .post('/blog-admin/posts/upload-cover', form, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }],
    })
    .then((r) => extractData<{ url: string; key: string }>(r));
}
