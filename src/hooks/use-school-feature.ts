import { useAuth } from '@/context/SchoolAuthContext';

export function useSchoolFeature(type: 'module' | 'ai', key: string): boolean {
  const { institute } = useAuth();
  
  if (!institute) return false;

  if (type === 'module') {
    // If modulesPermissions is missing, fail-safe to true as default for backwards compat
    // but typically we want it strictly enforced based on the object.
    const perms = institute.modulesPermissions;
    if (!perms) return true;
    return perms[key] !== false;
  }

  if (type === 'ai') {
    if (!institute.aiEnabled) return false;
    const aiFeats = institute.aiFeatures;
    if (!aiFeats) return true;
    return aiFeats[key] !== false;
  }

  return false;
}
