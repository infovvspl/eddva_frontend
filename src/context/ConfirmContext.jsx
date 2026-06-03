import React, { createContext, useContext, useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({});
  const resolveRef = useRef(null);

  const confirm = (opts) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm"
            />
            {/* Dialog modal */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-8 space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-tight">
                      {options.title || 'Are you sure?'}
                    </h3>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">
                      {options.subtitle || 'Critical Action'}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                  {options.message || 'This action cannot be undone. Do you really want to proceed?'}
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    {options.cancelLabel || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 active:scale-98 transition-all"
                  >
                    {options.confirmLabel || 'Delete'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Return a fallback browser confirm if provider is not loaded
    return async (opts) => window.confirm(opts.message || 'Are you sure?');
  }
  return context;
}
