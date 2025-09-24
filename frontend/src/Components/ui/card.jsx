import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`rounded-lg p-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={`p-4 border-b ${className}`} {...props}>{children}</div>;
}

export function CardContent({ children, className = '', ...props }) {
  return <div className={`p-4 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }) {
  return <h3 className={className} {...props}>{children}</h3>;
}

export default Card;
