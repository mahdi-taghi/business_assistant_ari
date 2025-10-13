import React from 'react';
import { cn } from '@/utils';
import { useTheme } from '@/context/ThemeContext';

export function Input({ className, type, ...props }) {
  const { isDark } = useTheme();
  
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        isDark 
          ? "border-slate-800 bg-slate-950 placeholder:text-slate-400 focus-visible:ring-slate-300 ring-offset-slate-950 text-slate-100"
          : "border-slate-300 bg-white placeholder:text-slate-500 focus-visible:ring-slate-950 text-slate-900",
        className
      )}
      {...props}
    />
  );
}

export default Input;
