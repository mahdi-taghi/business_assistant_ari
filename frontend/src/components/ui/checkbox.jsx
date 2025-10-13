import React from 'react';
import { cn } from '@/utils';
import { Check } from 'lucide-react';

export function Checkbox({ className, checked, onChange, ...props }) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border-2 transition-all duration-200 cursor-pointer",
          checked
            ? "bg-blue-600 border-blue-600 text-white"
            : "border-slate-300 bg-white hover:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-blue-500",
          className
        )}
        onClick={() => onChange?.({ target: { checked: !checked } })}
      >
        {checked && <Check className="h-3 w-3" />}
      </div>
    </div>
  );
}

export default Checkbox;
