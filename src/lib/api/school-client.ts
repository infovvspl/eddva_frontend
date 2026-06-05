import { apiClient } from './client';
import type { AxiosRequestConfig } from 'axios';

/** Drop-in replacement for the school frontend's axios `api` instance.
 *  All paths are automatically prefixed with /school so school pages
 *  keep their original paths (e.g. api.get('/students')) unchanged. */
const schoolApi = {
  get:    (url: string, config?: AxiosRequestConfig) =>
    apiClient.get(`/school${url}`, config),

  post:   (url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post(`/school${url}`, data, config),

  put:    (url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put(`/school${url}`, data, config),

  patch:  (url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch(`/school${url}`, data, config),

  delete: (url: string, config?: AxiosRequestConfig) =>
    apiClient.delete(`/school${url}`, config),
};

/** Normalize list payloads from school APIs (`{ data: [] }` or bare array). */
export function unwrapSchoolList(res: { data?: unknown }): unknown[] {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object' && Array.isArray((body as { data?: unknown[] }).data)) {
    return (body as { data: unknown[] }).data;
  }
  return [];
}

export function unwrapSchoolData<T>(res: { data?: unknown }, fallback: T): T {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in (body as object) && (body as { data?: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return (body as T) ?? fallback;
}

export default schoolApi;
