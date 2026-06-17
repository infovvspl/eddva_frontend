import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, title, onClose, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-[95vw] sm:max-w-md',
    md: 'max-w-[95vw] sm:max-w-lg',
    lg: 'max-w-[95vw] sm:max-w-2xl',
    xl: 'max-w-[95vw] sm:max-w-4xl',
    '2xl': 'max-w-[95vw] sm:max-w-6xl',
    'full': 'max-w-[95vw] lg:max-w-[95vw]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-surface-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`w-full ${sizes[size]} max-h-[90vh] flex flex-col rounded-lg border border-surface-200 bg-white shadow-2xl overflow-hidden`}>
              <div className="flex items-center justify-between shrink-0 border-b border-surface-200 p-6">
                <h2 className="font-display text-xl font-bold text-surface-950">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className={`${size === 'full' ? '' : 'p-6'} overflow-y-auto flex-1`}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
