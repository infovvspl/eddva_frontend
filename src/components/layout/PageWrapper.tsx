import React from 'react';

interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '', ...props }) => {
  return (
    <main className={`flex flex-col min-h-dscreen w-full bg-slate-50 dark:bg-slate-900 ${className}`} {...props}>
      {children}
    </main>
  );
};
