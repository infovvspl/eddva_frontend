import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fluid?: boolean;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '', fluid = false, ...props }) => {
  return (
    <div 
      className={`erp-container ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};
