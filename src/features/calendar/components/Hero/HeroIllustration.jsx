import React from 'react';
import { cn } from '@/components/school/admin/Skeleton';

export const HeroIllustration = ({ src, side }) => {
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={cn(
        'h-[125px] md:h-[145px] object-contain select-none transition-all duration-500 max-w-full',
        'drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]'
      )}
    />
  );
};
