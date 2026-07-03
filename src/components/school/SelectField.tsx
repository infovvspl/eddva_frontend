import { CustomSelect } from "@/components/ui/CustomSelect";
import React from 'react';
import './SelectField.css';

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
    <div className={`select-field ${className}`}>
      {label && <label className="select-field__label">{label}</label>}
      <div className={`select-field__wrapper ${error ? 'select-field__wrapper--error' : ''}`}>
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
      {error && <p className="select-field__error">{error}</p>}
    </div>
  );
};

export default SelectField;
