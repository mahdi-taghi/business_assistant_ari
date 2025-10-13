import React from 'react';
import { cn } from '@/utils';

export function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300",
        className
      )}
      {...props}
    />
  );
}

export default Label;
