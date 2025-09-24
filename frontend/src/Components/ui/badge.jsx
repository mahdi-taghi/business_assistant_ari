import React from 'react';

export function Badge({ children, className = '', ...props }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;
