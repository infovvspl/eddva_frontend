import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  gradient?: string;
  className?: string;
  onClick?: () => void;
}

const CHANGE_CLASSES: Record<NonNullable<StatCardProps['changeType']>, string> = {
  positive: "text-[var(--success-600)] bg-emerald-500/[0.08]",
  negative: "text-[var(--error-600)] bg-red-500/[0.08]",
  neutral: "text-[var(--gray-600)] bg-gray-500/[0.08]",
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType = 'neutral', icon, gradient, className = '', onClick }) => {
  return (
    <Card
      className={cn(
        "bg-[var(--glass-bg)] text-inherit backdrop-blur-[20px] border-[var(--glass-border)] rounded-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-[var(--glass-shadow)] p-2.5 sm:p-[18px] flex items-start gap-2 sm:gap-3.5 transition-all duration-300 animate-in fade-in duration-350",
        "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:duration-75",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      <div
        className="h-8 w-8 sm:h-[42px] sm:w-[42px] rounded-lg sm:rounded-[var(--radius-md)] flex items-center justify-center text-white shrink-0 [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5"
        style={{ background: gradient || 'var(--gradient-primary)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.6rem] sm:text-[0.688rem] font-semibold text-[var(--gray-500)] mb-0.5 sm:mb-[2px] uppercase tracking-[0.2px] sm:tracking-[0.6px] whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </p>
        <h3 className="text-[1.15rem] sm:text-2xl font-extrabold text-[var(--gray-900)] leading-[1.15] mb-0.5 sm:mb-1 tracking-[-0.5px]">
          {value}
        </h3>
        {change && (
          <span className={cn("text-[0.58rem] sm:text-[0.688rem] font-semibold px-[5px] sm:px-[7px] py-px rounded-full inline-block", CHANGE_CLASSES[changeType])}>
            {change}
          </span>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
