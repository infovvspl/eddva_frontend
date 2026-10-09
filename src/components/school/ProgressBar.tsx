import React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, label, showValue = true, size = 'md', color, className = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-medium text-[var(--gray-600)]">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-[var(--gray-700)]">{Math.round(percentage)}%</span>}
        </div>
      )}
      <ProgressPrimitive.Root
        className={cn("relative w-full overflow-hidden rounded-full bg-[var(--gray-100)]", SIZE_CLASSES[size])}
      >
        <ProgressPrimitive.Indicator
          className="h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: `${percentage}%`, background: color || 'var(--gradient-primary)' }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
};

export default ProgressBar;
