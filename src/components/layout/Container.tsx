import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fluid?: boolean;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '', fluid = false, ...props }) => {
  return (
    <div 
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};
