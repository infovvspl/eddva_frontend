import { useAuthStore } from '@/lib/auth-store';

export function useModuleAccess(moduleKey: string): boolean {
  const modulesPermissions = useAuthStore((s) => s.modulesPermissions);
  // Fail open — if modulesPermissions not set, allow access
  if (!modulesPermissions || Object.keys(modulesPermissions).length === 0) return true;
  return modulesPermissions[moduleKey] !== false;
}
