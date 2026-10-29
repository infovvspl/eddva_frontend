// Keys must match COACHING_LANGUAGES in the backend's tenant.entity.ts.
// Capped at 3 enabled languages per institute for now — see
// UpdateTenantDto.enabledLanguages (ArrayMaxSize(3)) on the backend.
export const COACHING_LANGUAGES = [
  {
    key: 'en',
    label: 'English',
    description: 'Content and notifications in English',
    icon: 'Languages',
  },
  {
    key: 'hi',
    label: 'Hindi',
    description: 'Content and notifications in Hindi',
    icon: 'Languages',
  },
  {
    key: 'or',
    label: 'Odia',
    description: 'Content and notifications in Odia',
    icon: 'Languages',
  },
];
