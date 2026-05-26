import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, label, showValue = true, size = 'md', color, className = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`progress-bar ${className}`}>
      {(label || showValue) && (
        <div className="progress-bar__header">
          {label && <span className="progress-bar__label">{label}</span>}
          {showValue && <span className="progress-bar__value">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`progress-bar__track progress-bar__track--${size}`}>
        <div
          className="progress-bar__fill"
          style={{ width: `${percentage}%`, background: color || 'var(--gradient-primary)' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
