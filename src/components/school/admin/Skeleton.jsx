import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Skeleton({ className, ...props }) {
  return <ShadcnSkeleton className={cn("bg-slate-200/80 dark:bg-slate-800 animate-pulse", className)} {...props} />;
}
