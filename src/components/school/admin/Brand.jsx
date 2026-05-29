import React from 'react';
import { BrainCircuit, GraduationCap } from 'lucide-react';
import { cn } from './Skeleton';

export function EddvaLogo({ compact = false, className }) {
  return (
    <div className={cn('flex items-center', className)}>
      <img src="/logo.png" alt="Eddva Logo" className={cn("object-contain", compact ? "h-8" : "h-11")} />
    </div>
  );
}

export function InstituteLogo({ institute, size = 'md', className }) {
  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-base',
    lg: 'h-16 w-16 text-2xl',
  };

  if (institute?.logo) {
    return (
      <img
        src={institute.logo}
        alt={`${institute.name || 'Institute'} logo`}
        className={cn(sizes[size], 'rounded-lg border border-sky-100 bg-white object-cover shadow-sm', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        sizes[size],
        'grid place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-sky-400 font-bold text-white shadow-blue',
        className
      )}
    >
      {(institute?.name || 'E').charAt(0).toUpperCase()}
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    PENDING: 'border-sky-200 bg-sky-50 text-sky-700',
    SUSPENDED: 'border-red-200 bg-red-50 text-red-700',
    OPEN: 'border-red-200 bg-red-50 text-red-700',
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
