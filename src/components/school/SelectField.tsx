import { CustomSelect } from "@/components/ui/CustomSelect";
import React from 'react';
import './SelectField.css';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, options, error, className = '', ...props }) => {
  return (
    <div className={`select-field ${className}`}>
      {label && <label className="select-field__label">{label}</label>}
      <div className={`select-field__wrapper ${error ? 'select-field__wrapper--error' : ''}`}>
        <CustomSelect 
          {...(props as any)}
          onChange={(val) => props.onChange && props.onChange({ target: { name: props.name, value: val } } as any)}
          options={options} 
          className="w-full"
        />
      </div>
      {error && <p className="select-field__error">{error}</p>}
    </div>
  );
};

export default SelectField;
