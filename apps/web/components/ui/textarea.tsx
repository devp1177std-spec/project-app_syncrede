'use client';

import React, { forwardRef } from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = '',
      label,
      error,
      charCount,
      maxChars,
      id,
      ...props
    },
    ref,
  ) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold text-slate-700"
            >
              {label}
            </label>
          )}
          {typeof charCount === 'number' && typeof maxChars === 'number' && (
            <span
              className={`text-[11px] font-medium ${
                charCount > maxChars
                  ? 'text-red-500 font-bold'
                  : charCount >= maxChars * 0.9
                  ? 'text-amber-500'
                  : 'text-slate-400'
              }`}
            >
              {charCount}/{maxChars}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full min-h-[96px] p-3 text-sm bg-white text-slate-900 border rounded-xl placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none disabled:opacity-50 disabled:bg-slate-50 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200 hover:border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium pl-0.5">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
