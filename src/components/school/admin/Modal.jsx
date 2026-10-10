import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-6xl',
  full: 'lg:max-w-[95vw]',
};

export default function Modal({ isOpen, title, onClose, children, size = 'md' }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent
        className={cn('max-w-[95vw] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden', sizes[size])}
      >
        <DialogHeader className="shrink-0 border-b border-surface-200 p-6 text-left">
          <DialogTitle className="font-display text-lg sm:text-xl font-bold text-surface-950">{title}</DialogTitle>
        </DialogHeader>
        <div className={cn(size === 'full' ? '' : 'p-6', 'overflow-y-auto flex-1')}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
