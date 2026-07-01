import React from 'react';

interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '', ...props }) => {
  return (
    <main className={lex flex-col min-h-screen w-full bg-slate-50 dark:bg-slate-900 } {...props}>
      {children}
    </main>
  );
};
