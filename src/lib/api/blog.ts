// blog.ts — public marketing-site reads (via the LMS's shared `apiClient`;
// these are unauthenticated endpoints, so the LMS/blog-admin auth split
// doesn't apply here). Blog admin panel calls live in `blogAdmin.ts` instead,
// on their own separate client — see that file's header comment.

import { apiClient, extractData } from './client';

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';

export interface BlogSection {
  heading: string;
  body: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category?: string;
  excerpt?: string;
  author?: string;
  coverImage?: string;
  readTime?: number;
  sections?: BlogSection[];
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
