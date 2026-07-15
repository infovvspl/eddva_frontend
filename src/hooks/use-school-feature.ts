import { useAuth } from '@/context/SchoolAuthContext';
import { AI_FEATURES } from '@/lib/constants/aiFeatures';

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
    const featConfig = AI_FEATURES.find(f => f.key === key);
    const defaultOn = featConfig ? featConfig.defaultEnabled : true;
    if (!aiFeats) return defaultOn;
    
    const val = aiFeats[key];
    return val === undefined ? defaultOn : val !== false;
  }

  return false;
}
