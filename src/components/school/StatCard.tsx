import React from 'react';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  gradient?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType = 'neutral', icon, gradient, className = '' }) => {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card__icon" style={{ background: gradient || 'var(--gradient-primary)' }}>
        {icon}
      </div>
      <div className="stat-card__content">
        <p className="stat-card__title">{title}</p>
        <h3 className="stat-card__value">{value}</h3>
        {change && (
          <span className={`stat-card__change stat-card__change--${changeType}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
