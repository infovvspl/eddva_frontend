import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  className?: string;
  menuClassName?: string;
  /** When provided, onChange fires a synthetic event { target: { name, value } } for form compatibility */
  name?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  /** Additional classes for the trigger button */
  triggerClassName?: string;
}

export const CustomSelect = forwardRef<HTMLDivElement, CustomSelectProps>(({
  value,
  onChange,
  options,
  className,
  menuClassName,
  name,
  disabled,
  id,
  placeholder,
  triggerClassName,
}: CustomSelectProps, forwardedRef) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropUp, setDropUp] = useState(false);

  useImperativeHandle(forwardedRef, () => containerRef.current!);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      // If clicking inside the container, don't close (handled by button onClick)
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
      
      // If clicking inside the portal menu, don't close 
      const target = e.target as HTMLElement;
      if (target.closest(".custom-select-menu")) return;
      
      setOpen(false);
    };
    const scrollHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(".custom-select-menu")) return;
      setOpen(false);
    };
    
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    window.addEventListener("scroll", scrollHandler, true);
    
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      window.removeEventListener("scroll", scrollHandler, true);
    };
  }, []);

  const [coords, setCoords] = useState<{ left: number; width: number; top: number; bottom: number } | null>(null);

  // Auto-detect whether to drop up or down based on viewport position
  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const isDropUp = spaceBelow < 220 && rect.top > 220;
      setDropUp(isDropUp);
      setCoords({
        left: rect.left,
        width: rect.width,
        top: rect.bottom + 8,
        bottom: window.innerHeight - rect.top + 8,
      });
    } else if (!open) {
      setCoords(null);
    }
  }, [open]);

  const selectedOption = options.find((o) => String(o.value) === String(value));
  const displayLabel = selectedOption?.label || placeholder || "Select...";

  const handleSelect = (optValue: string | number) => {
    if (name) {
      // Form-compatible mode: fire synthetic event
      onChange({ target: { name, value: optValue } } as any);
    } else {
      onChange(optValue);
    }
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${open ? "z-50" : "z-10"} ${className || ""}`}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        type="button"
        id={id}
        disabled={disabled}
        className={
          triggerClassName ||
          `flex h-[50px] min-h-[50px] w-full items-center justify-between gap-2 px-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-sm font-semibold outline-none hover:bg-slate-50/80 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedOption ? "text-slate-900 dark:text-white" : "text-slate-400"
          }`
        }
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && coords && typeof document !== "undefined" && createPortal(
        <motion.div
            initial={{ opacity: 0, y: dropUp ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              left: coords?.left ?? 0,
              width: coords?.width ?? 0,
              ...(dropUp 
                ? { bottom: coords?.bottom ?? 0 } 
                : { top: coords?.top ?? 0 }),
            }}
            className={`custom-select-menu z-[9999] rounded-lg sm:rounded-xl border border-slate-200 bg-white shadow-xl overflow-auto max-h-60 py-1 ${menuClassName || ""}`}
          >
            {options.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                disabled={opt.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt.value);
                }}
                className={`w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                  String(value) === String(opt.value)
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 font-medium"
                }`}
              >
                {opt.label}
              </button>
            ))}
        </motion.div>,
        document.body
      )}
    </div>
  );
});
