import React from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const KNOWN_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'light', 'purple'] as const;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[7px] min-h-[38px] font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap relative overflow-hidden border border-transparent disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500/30 [&_svg]:h-4 [&_svg]:w-4",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.28)] hover:-translate-y-px active:translate-y-0 active:duration-75",
        secondary:
          "bg-gradient-to-br from-teal-700 to-teal-500 text-white shadow-[0_10px_24px_rgba(20,184,166,0.2)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.28)] hover:-translate-y-px active:translate-y-0 active:duration-75",
        outline:
          "bg-indigo-500/[0.08] text-indigo-800 border-indigo-500/[0.22] shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.55)] hover:bg-indigo-500/[0.14] hover:border-indigo-500/[0.34] hover:text-indigo-950 hover:-translate-y-px",
        ghost:
          "bg-slate-900/[0.06] text-slate-700 hover:bg-slate-900/[0.12] hover:text-slate-900",
        danger:
          "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_14px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.28)] hover:-translate-y-px active:translate-y-0 active:duration-75",
        light:
          "bg-slate-100 text-slate-700 hover:bg-slate-200",
        purple:
          "bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-[0_4px_14px_rgba(168,85,247,0.2)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.28)] hover:-translate-y-px",
      },
      size: {
        sm: "px-3 py-[5px] text-xs",
        md: "px-4 py-2 text-[0.813rem]",
        lg: "px-6 py-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light' | 'purple' | string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const knownVariant = (KNOWN_VARIANTS as readonly string[]).includes(variant) ? (variant as typeof KNOWN_VARIANTS[number]) : 'primary';
  return (
    <button
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant: knownVariant, size }), fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : icon ? (
        <span className="flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
