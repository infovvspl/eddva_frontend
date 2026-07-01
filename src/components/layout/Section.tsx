import React from 'react';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'none';
}

export const Section: React.FC<SectionProps> = ({ children, className = '', spacing = 'md', ...props }) => {
  const spacingClasses = {
    none: '',
    sm: 'py-4 sm:py-6',
    md: 'py-8 sm:py-12',
    lg: 'py-12 sm:py-16 lg:py-24',
  };

  return (
    <section className={w-full  } {...props}>
      {children}
    </section>
  );
};
