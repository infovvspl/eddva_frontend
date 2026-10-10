import { useAuthStore } from '@/lib/auth-store';
import { isModuleEnabled } from '@/lib/constants/moduleFeatures';

export function useModuleAccess(moduleKey: string): boolean {
  const modulesPermissions = useAuthStore((s) => s.modulesPermissions);
  // Delegates to isModuleEnabled so new opt-in flags (e.g. competitive_exams)
  // can default to OFF instead of this hook's historical fail-open behavior.
  return isModuleEnabled(modulesPermissions, moduleKey);
}
