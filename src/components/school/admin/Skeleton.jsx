import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Skeleton({ className, ...props }) {
  return <ShadcnSkeleton className={cn("bg-surface-200/60", className)} {...props} />;
}
