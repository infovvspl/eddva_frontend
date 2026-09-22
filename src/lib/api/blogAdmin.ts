// blogAdmin.ts — blog admin panel API calls. Uses `blogAdminClient`, a
// separate axios instance from the LMS's `apiClient` — see that file's
// header comment for why. Public marketing-site reads still live in `blog.ts`.

import { blogAdminClient, blogAdminToken, extractData } from './blogAdminClient';

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';

export interface BlogSection {
  heading: string;
  body: string;
}

export interface BlogPostPayload {
  title: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  author?: string;
  coverImage?: string;
  readTime?: number;
  sections?: BlogSection[];
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

// Accepts a Blob too — the cover cropper outputs one (canvas.toBlob), and
// Blobs carry no filename of their own, so one is always supplied explicitly
// here (the backend derives the extension from it).
export function uploadBlogCoverImage(file: File | Blob) {
  const form = new FormData();
  form.append('file', file, (file as File).name || 'cover.jpg');
  return blogAdminClient
    .post('/blog-admin/posts/upload-cover', form, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }],
    })
    .then((r) => extractData<{ url: string; key: string }>(r));
}
