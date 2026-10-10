import { CustomSelect } from "@/components/ui/CustomSelect";
import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, options, error, className = '', ...props }) => {
  const { ref, onChange, value, name, disabled, id, placeholder } = props as any;

  const handleChange = (valOrEvent: any) => {
    if (!onChange) return;
    let actualVal = valOrEvent;
    if (valOrEvent && typeof valOrEvent === 'object' && valOrEvent.target !== undefined) {
      actualVal = valOrEvent.target.value;
    }
    onChange({ target: { name: name || '', value: actualVal } } as any);
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <Label className="text-[0.813rem] font-medium text-[var(--gray-700)]">{label}</Label>}
      <div
        className={cn(
          "transition-all duration-150 rounded-[var(--radius-md)] focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.08)]",
          error && "focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]",
        )}
      >
        <CustomSelect
          value={value ?? ''}
          onChange={handleChange}
          options={options}
          disabled={disabled}
          id={id}
          placeholder={placeholder}
          className="w-full"
        />
      </div>
      {error && <p className="text-[0.688rem] text-red-500">{error}</p>}
    </div>
  );
};

export default SelectField;
