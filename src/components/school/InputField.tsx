import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <Label className="text-[0.813rem] font-medium text-[var(--gray-700)]">{label}</Label>}
      <div
        className={cn(
          "flex items-center bg-white border-[1.5px] border-[var(--gray-200)] rounded-[var(--radius-md)] transition-all duration-150 overflow-hidden",
          "focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.08)]",
          error && "border-red-400 focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]",
        )}
      >
        {icon && <span className="pl-3 flex items-center text-[var(--gray-400)] [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
        <Input
          className="flex-1 h-auto border-0 rounded-none bg-transparent px-3 py-2 text-[0.813rem] text-[var(--gray-800)] placeholder:text-[var(--gray-400)] focus-visible:ring-0 focus-visible:ring-offset-0"
          {...props}
        />
      </div>
      {error && <p className="text-[0.688rem] text-red-500">{error}</p>}
    </div>
  );
};

export default InputField;
