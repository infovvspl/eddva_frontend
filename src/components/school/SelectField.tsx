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
        <select className="select-field__select" {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="select-field__error">{error}</p>}
    </div>
  );
};

export default SelectField;
