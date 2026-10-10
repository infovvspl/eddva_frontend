import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hover = false, onClick }) => {
  return (
    <Card
      className={cn(
        "bg-[var(--glass-bg)] text-inherit backdrop-blur-[20px] border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--glass-shadow)] p-[18px] transition-all duration-300",
        hover && "hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/20 active:translate-y-0 active:duration-75",
        onClick ? "cursor-pointer" : "",
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </Card>
  );
};

export default GlassCard;
