import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizes: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'lg:max-w-[95vw]',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className={cn('max-w-[95vw] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden', sizes[size])}
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 p-5 text-left">
          <DialogTitle className="text-lg font-bold text-slate-900">{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 p-5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
