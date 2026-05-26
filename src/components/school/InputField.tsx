import React from 'react';
import './InputField.css';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className={`input-field ${className}`}>
      {label && <label className="input-field__label">{label}</label>}
      <div className={`input-field__wrapper ${error ? 'input-field__wrapper--error' : ''}`}>
        {icon && <span className="input-field__icon">{icon}</span>}
        <input className="input-field__input" {...props} />
      </div>
      {error && <p className="input-field__error">{error}</p>}
    </div>
  );
};

export default InputField;
