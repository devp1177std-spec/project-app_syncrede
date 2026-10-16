'use client';

import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, error, checked, id, ...props }, ref) => {
    const checkboxId = id || props.name;

    return (
      <div className="space-y-1">
        <label
          htmlFor={checkboxId}
          className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 leading-tight"
        >
          <div className="relative mt-0.5 shrink-0">
            <input
              id={checkboxId}
              ref={ref}
              type="checkbox"
              checked={checked}
              className="peer sr-only"
              {...props}
            />
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                error ? 'border-red-500' : 'border-slate-300'
              } peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600/30`}
            >
              <Check className="w-3 h-3 text-white stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>
          {label && <span className="pt-0.5">{label}</span>}
        </label>
        {error && <p className="text-xs text-red-500 font-medium pl-6">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
