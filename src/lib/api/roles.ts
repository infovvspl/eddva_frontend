import { apiClient, extractData } from "./client";

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt?: string;
}

export async function listRoles() {
  const res = await apiClient.get<CustomRole[]>("/admin/roles");
  return extractData<CustomRole[]>(res);
}

export async function createRole(payload: { name: string; description?: string; permissions: string[] }) {
  const res = await apiClient.post<CustomRole>("/admin/roles", payload);
  return extractData<CustomRole>(res);
}

export async function updateRole(id: string, payload: { name?: string; description?: string; permissions?: string[] }) {
  const res = await apiClient.patch<CustomRole>(`/admin/roles/${id}`, payload);
  return extractData<CustomRole>(res);
}

export async function deleteRole(id: string) {
  const res = await apiClient.delete<{ success: boolean }>(`/admin/roles/${id}`);
  return extractData<{ success: boolean }>(res);
}
