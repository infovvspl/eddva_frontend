import React from 'react';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export const Grid: React.FC<GridProps> = ({ children, className = '', cols = 1, gap = 'md', ...props }) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6 sm:gap-8',
    lg: 'gap-8 sm:gap-12',
  };

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid w-full ${colClasses[cols]} ${gapClasses[gap]} ${className}`} {...props}>
      {children}
    </div>
  );
};
