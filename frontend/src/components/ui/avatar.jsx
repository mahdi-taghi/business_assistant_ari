import React from 'react';

export function Avatar({ children, className = '', ...props }) {
  return (
    <div className={`inline-flex items-center justify-center rounded-full overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AvatarImage(props) {
  return <img {...props} alt={props.alt || 'avatar'} />;
}

export function AvatarFallback({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export default Avatar;
