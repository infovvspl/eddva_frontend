import React from 'react';
import { BrainCircuit, GraduationCap } from 'lucide-react';
import { cn } from './Skeleton';
import logoUrl from '@/assets/eddva-logo.svg';
import armyLogo from '@/assets/army_public_school_logo.png';

import { getApiOrigin } from '@/lib/api-config';

export function EddvaLogo({ compact = false, className }) {
  return (
    <div className={cn('flex items-center', className)}>
      <img src={logoUrl} alt="Eddva Logo" className={cn("object-contain", compact ? "h-8" : "h-11")} />
    </div>
  );
}

export function SchoolLogo({ src, alt = 'School Logo', size = 'sidebar', className, ...props }) {
  let logoSrc = logoUrl; // Fallback default EDDVA placeholder logo

  const hasLogo = src && src !== 'null' && src !== 'undefined' && src !== '';
  if (hasLogo) {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      logoSrc = src;
    } else {
      const origin = getApiOrigin();
      const path = src.startsWith('/') ? src : `/${src}`;
      logoSrc = `${origin}${path}`;
    }
  } else {
    if (alt && (alt.toLowerCase().includes('army') || alt.toLowerCase().includes('aps'))) {
      logoSrc = armyLogo;
    } else {
      logoSrc = logoUrl;
    }
  }

  const sizeStyles = {
    sidebar: 'w-[70px] h-auto max-h-[70px]',
    navbar: 'h-[40px] w-auto max-h-[40px]',
    dashboard: 'w-[90px] h-auto max-h-[90px]',
    login: 'w-[110px] h-auto max-h-[110px]',
    report: 'w-[100px] h-auto max-h-[100px]',
    print: 'w-[120px] h-auto max-h-[120px]',
  };

  return (
    <img
      src={logoSrc}
      alt={alt}
      loading="lazy"
      className={cn(
        'object-contain object-center max-w-full block bg-transparent p-0 m-0',
        sizeStyles[size] || sizeStyles.sidebar,
        className
      )}
      {...props}
    />
  );
}

export function InstituteLogo({ institute, size = 'md', className, raw = false }) {
  const sizeMap = {
    sm: 'navbar',
    md: 'sidebar',
    lg: 'dashboard',
  };

  return (
    <SchoolLogo
      src={institute?.logo}
      alt={institute?.name}
      size={sizeMap[size] || 'sidebar'}
      className={className}
    />
  );
}

export function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    PENDING: 'border-sky-200 bg-sky-50 text-sky-700',
    SUSPENDED: 'border-red-200 bg-red-50 text-red-700',
    OPEN: 'border-red-200 bg-red-50 text-red-700',
    REOPENED: 'border-blue-200 bg-blue-50 text-blue-700',
    IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-700',
    RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CLOSED: 'border-surface-200 bg-surface-100 text-surface-700',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold', styles[status] || styles.CLOSED)}>
      {String(status || 'UNKNOWN').replace('_', ' ')}
    </span>
  );
}
