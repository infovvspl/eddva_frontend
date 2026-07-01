import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as rolesApi from "@/lib/api/roles";

export const rolesKeys = {
  all: ["roles"] as const,
  detail: (id: string) => ["roles", id] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.all,
    queryFn: rolesApi.listRoles,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.createRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKeys.all }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name?: string; description?: string; permissions?: string[] }) =>
      rolesApi.updateRole(id, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: rolesKeys.all });
      qc.invalidateQueries({ queryKey: rolesKeys.detail(vars.id) });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.deleteRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKeys.all }),
  });
}
