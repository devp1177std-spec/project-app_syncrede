'use client';

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      type = 'text',
      label,
      leftIcon,
      rightAdornment,
      error,
      helperText,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`w-full h-11 ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${
              rightAdornment ? 'pr-24' : 'pr-3.5'
            } text-sm bg-white text-slate-900 border rounded-xl placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:opacity-50 disabled:bg-slate-50 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 hover:border-slate-300'
            } ${className}`}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightAdornment}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-500 font-medium pl-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 pl-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
