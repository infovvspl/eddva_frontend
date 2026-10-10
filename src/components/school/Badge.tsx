import React from 'react';
import { cn } from '@/lib/utils';
import { Badge as ShadcnBadge } from '@/components/ui/badge';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: "bg-[var(--gray-100)] text-[var(--gray-600)]",
  success: "bg-emerald-500/[0.08] text-[var(--success-600)]",
  warning: "bg-amber-500/[0.08] text-[var(--warning-500)]",
  error: "bg-red-500/[0.08] text-[var(--error-600)]",
  info: "bg-blue-500/[0.08] text-blue-600",
  purple: "bg-violet-600/[0.08] text-[var(--primary-600)]",
};

const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  return (
    <ShadcnBadge
      variant="outline"
      className={cn(
        "rounded-full border-transparent px-2 py-0.5 text-[0.688rem] font-semibold tracking-wide leading-normal",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </ShadcnBadge>
  );
};

export default Badge;
