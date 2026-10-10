import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'size-5',
  md: 'size-8',
  lg: 'size-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text, fullPage = false }) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 p-8",
        fullPage && "fixed inset-0 z-[90] bg-white/85 backdrop-blur-sm",
      )}
    >
      <Loader2 className={cn("animate-spin text-[var(--primary-500)]", SIZE_CLASSES[size])} />
      {text && <p className="text-[0.813rem] font-medium text-[var(--gray-500)]">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
