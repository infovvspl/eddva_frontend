import { apiClient, extractData } from './client';

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

/** Public — posts shown on the marketing site's /blog and homepage teaser. */
export function getPublicBlogPosts(params: BlogListParams = {}) {
  return apiClient.get('/blog', { params }).then((r) => extractData<BlogListResponse>(r));
}

/** Public — one published post by slug, for /blog/:slug. */
export function getPublicBlogPost(slug: string) {
  return apiClient.get(`/blog/${slug}`).then((r) => extractData<BlogPost>(r));
}

/** Super-admin — list posts of any status. */
export function getBlogPosts(params: BlogListParams = {}) {
  return apiClient.get('/admin/blog', { params }).then((r) => extractData<BlogListResponse>(r));
}

/** Super-admin — a single post by id, for the edit form. */
export function getBlogPost(id: string) {
  return apiClient.get(`/admin/blog/${id}`).then((r) => extractData<BlogPost>(r));
}

/** Super-admin — create a post. */
export function createBlogPost(payload: BlogPostPayload) {
  return apiClient.post('/admin/blog', payload).then((r) => extractData<BlogPost>(r));
}

/** Super-admin — update a post (also used to publish/unpublish via `status`). */
export function updateBlogPost(id: string, patch: Partial<BlogPostPayload>) {
  return apiClient.patch(`/admin/blog/${id}`, patch).then((r) => extractData<BlogPost>(r));
}

/** Super-admin — delete a post. */
export function deleteBlogPost(id: string) {
  return apiClient.delete(`/admin/blog/${id}`).then((r) => extractData<{ message: string }>(r));
}

/** Super-admin — upload a cover image, returns the URL to store on the post. */
export function uploadBlogCoverImage(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiClient
    .post('/admin/blog/upload-cover', form, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }],
    })
    .then((r) => extractData<{ url: string; key: string }>(r));
}
