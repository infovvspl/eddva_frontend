import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Loader2, HelpCircle } from 'lucide-react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// Sanitize error messages to prevent showing database/API endpoints/tokens/localhost details
export function sanitizeErrorMessage(err) {
  if (!err) return "An unexpected error occurred.";

  let msg = "";
  if (typeof err === 'string') {
    msg = err;
  } else if (err.response?.data?.message) {
    const backendMsg = err.response.data.message;
    msg = Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg;
  } else if (err.message) {
    msg = err.message;
  } else {
    try {
      msg = JSON.stringify(err);
    } catch {
      msg = "An unknown error occurred.";
    }
  }

  // Remove localhost urls or server endpoints
  msg = msg.replace(/https?:\/\/localhost(:\d+)?\b/gi, 'server');
  msg = msg.replace(/https?:\/\/[^\s/$.?#].[^\s]*/gi, 'server endpoint');

  // Database errors
  if (msg.toLowerCase().includes('sql') || msg.toLowerCase().includes('database') || msg.toLowerCase().includes('query') || msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('column') || msg.toLowerCase().includes('pg-pool') || msg.toLowerCase().includes('typeorm')) {
    return "A database error occurred. Please try again later.";
  }

  // Token / Auth errors
  if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('expired')) {
    return "Authentication failed or session expired. Please sign in again.";
  }

  // Stack traces / source files
  if (msg.includes('at ') || msg.includes('node_modules') || msg.includes('\\src\\') || msg.includes('/src/')) {
    return "An internal server error occurred. Please contact support.";
  }

  return msg;
}

const ModalContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'confirm' | 'success' | 'error' | 'loading'
  const [options, setOptions] = useState({});
  const resolveRef = useRef(null);

  // Backward-compatible confirm function
  const confirm = (opts = {}) => {
    setModalType('confirm');
    setOptions({
      title: opts.title || 'Confirm Delete',
      subtitle: opts.subtitle || 'Critical Action',
      message: opts.message || 'Are you sure you want to delete this item? This action cannot be undone.',
      cancelLabel: opts.cancelLabel || 'Cancel',
      confirmLabel: opts.confirmLabel || 'Delete',
      variant: opts.variant || 'destructive',
    });
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  // Standardized Success Modal
  const showSuccess = (typeOrOpts) => {
    setModalType('success');
    let title = 'Success';
    let message = 'Data has been saved successfully.';
    let buttonLabel = 'OK';

    if (typeof typeOrOpts === 'string') {
      switch (typeOrOpts) {
        case 'save':
          title = 'Success';
          message = 'Data has been saved successfully.';
          break;
        case 'update':
          title = 'Updated Successfully';
          message = 'Your changes have been updated successfully.';
          break;
        case 'create':
          title = 'Created Successfully';
          message = 'Record has been created successfully.';
          break;
        case 'attendance':
          title = 'Attendance Submitted';
          message = 'Attendance has been submitted successfully.';
          break;
        case 'assignment':
          title = 'Assignment Submitted';
          message = 'Your assignment has been submitted successfully.';
          break;
        case 'upload':
          title = 'Upload Completed';
          message = 'Records have been uploaded successfully.';
          break;
        default:
          message = typeOrOpts;
      }
    } else if (typeOrOpts && typeof typeOrOpts === 'object') {
      title = typeOrOpts.title || title;
      message = typeOrOpts.message || message;
      buttonLabel = typeOrOpts.confirmLabel || typeOrOpts.buttonLabel || buttonLabel;
    }

    setOptions({
      title,
      message,
      confirmLabel: buttonLabel,
    });
    setIsOpen(true);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  // Sanitized Error Modal
  const showError = (err, onTryAgain = null) => {
    setModalType('error');
    const cleanMsg = sanitizeErrorMessage(err);
    setOptions({
      title: 'Something Went Wrong',
      message: cleanMsg,
      confirmLabel: 'Try Again',
      cancelLabel: 'Close',
      onConfirm: onTryAgain,
    });
    setIsOpen(true);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  // Loading Modal (returns a control object)
  const showLoading = (msg) => {
    setModalType('loading');
    setOptions({
      message: msg || 'Please wait, processing your request...',
    });
    setIsOpen(true);
    return {
      close: hideModal,
    };
  };

  const hideModal = () => {
    setIsOpen(false);
    setModalType(null);
    setOptions({});
  };

  const handleCancel = () => {
    if (modalType === 'loading') return;
    setIsOpen(false);
    resolveRef.current?.(false);
  };

  const handleConfirm = () => {
    if (modalType === 'loading') return;
    setIsOpen(false);
    if (options.onConfirm) {
      options.onConfirm();
    }
    resolveRef.current?.(true);
  };

  // Keyboard navigation support (Enter to confirm; Escape is handled by AlertDialog itself)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (modalType === 'loading') return;

      if (e.key === 'Enter') {
        if (modalType === 'error' && !options.onConfirm) {
          handleCancel();
        } else {
          handleConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, modalType, options]);

  // Intercept window.alert to route through custom modal system
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      if (!message) return;
      const lower = String(message).toLowerCase();
      if (
        lower.includes('success') ||
        lower.includes('saved') ||
        lower.includes('updated') ||
        lower.includes('created') ||
        lower.includes('submitted') ||
        lower.includes('completed')
      ) {
        let type = 'save';
        if (lower.includes('update')) type = 'update';
        else if (lower.includes('create')) type = 'create';
        else if (lower.includes('attendance')) type = 'attendance';
        else if (lower.includes('assignment')) type = 'assignment';
        else if (lower.includes('upload') || lower.includes('completed')) type = 'upload';

        showSuccess({
          title: type === 'save' ? 'Success' :
            type === 'update' ? 'Updated Successfully' :
              type === 'create' ? 'Created Successfully' :
                type === 'attendance' ? 'Attendance Submitted' :
                  type === 'assignment' ? 'Assignment Submitted' : 'Upload Completed',
          message: String(message),
        });
      } else {
        showError(message);
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, showSuccess, showError, showLoading, hideModal }}>
      {children}
      <AlertDialogPrimitive.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
      >
        <AlertDialogPrimitive.Portal>
          <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <AlertDialogPrimitive.Content
            onEscapeKeyDown={(e) => {
              if (modalType === 'loading') e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              e.preventDefault();
              if (modalType !== 'loading') handleCancel();
            }}
            className={cn(
              "fixed left-1/2 top-1/2 z-[10000] w-full max-w-md -translate-x-1/2 -translate-y-1/2",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center text-center gap-6",
            )}
          >
          {/* Modal Header Icon */}
          <div className="flex justify-center">
            {modalType === 'success' && (
              <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={32} className="animate-scale-in" />
              </div>
            )}
            {modalType === 'error' && (
              <div className="h-16 w-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <XCircle size={32} className="animate-shake" />
              </div>
            )}
            {modalType === 'confirm' && (
              <div className={`h-16 w-16 rounded-3xl flex items-center justify-center ${options.variant === 'destructive' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                {options.variant === 'destructive' ? <AlertTriangle size={32} /> : <HelpCircle size={32} />}
              </div>
            )}
            {modalType === 'loading' && (
              <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                <Loader2 size={32} className="animate-spin" />
              </div>
            )}
          </div>

          {/* Modal Content */}
          <div className="gap-y-2 flex flex-col w-full">
            <AlertDialogTitle
              className={options.title ? "text-xl font-bold text-slate-900 dark:text-white leading-tight" : "sr-only"}
            >
              {options.title || 'Please wait'}
            </AlertDialogTitle>
            {options.subtitle && (
              <p className={`text-[10px] font-bold uppercase tracking-widest ${options.variant === 'destructive' ? 'text-rose-500' : 'text-primary'}`}>
                {options.subtitle}
              </p>
            )}
            <AlertDialogDescription className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed px-2 break-words">
              {options.message}
            </AlertDialogDescription>
          </div>

          {/* Modal Actions */}
          {modalType !== 'loading' && (
            <div className="flex gap-3 pt-2 w-full">
              {/* Confirm cancel or Error close buttons */}
              {(modalType === 'confirm' || (modalType === 'error' && options.onConfirm)) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  {options.cancelLabel || 'Cancel'}
                </button>
              )}

              {/* Primary Confirmation Action */}
              {modalType === 'confirm' && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`flex-1 py-3.5 rounded-2xl text-white font-bold text-xs shadow-lg transition-all active:scale-[0.98] ${options.variant === 'destructive'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : 'bg-primary hover:bg-primary-dark shadow-primary/20'
                    }`}
                >
                  {options.confirmLabel || 'OK'}
                </button>
              )}

              {/* Success or Error OK/Try Again Actions */}
              {(modalType === 'success' || modalType === 'error') && (
                <button
                  type="button"
                  onClick={modalType === 'error' && !options.onConfirm ? handleCancel : handleConfirm}
                  className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {options.confirmLabel || 'OK'}
                </button>
              )}
            </div>
          )}
          </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
      </AlertDialogPrimitive.Root>
    </ModalContext.Provider>
  );
}

// Custom hook to access all new modal functionalities
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ConfirmProvider");
  }
  return context;
}

// Legacy compatibility hook (so existing files calling useConfirm don't break)
export function useConfirm() {
  const context = useContext(ModalContext);
  if (!context) {
    return async (opts) => window.confirm(opts.message || 'Are you sure?');
  }
  return context.confirm;
}
