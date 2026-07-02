import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export function CustomSelect({
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
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dropUp, setDropUp] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-detect whether to drop up or down based on viewport position
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 220 && rect.top > 220);
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
    <div ref={ref} className={`relative ${className || ""}`}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        type="button"
        id={id}
        disabled={disabled}
        className={
          triggerClassName ||
          `flex h-full w-full items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none hover:bg-slate-50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedOption ? "text-slate-700" : "text-slate-400"
          }`
        }
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: dropUp ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropUp ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 right-0 z-50 ${
              dropUp ? "bottom-full mb-2" : "top-full mt-2"
            } rounded-xl border border-slate-200 bg-white shadow-xl overflow-auto max-h-60 py-1 ${menuClassName || ""}`}
          >
            {options.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                  String(value) === String(opt.value)
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 font-medium"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
