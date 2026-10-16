'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export type SortOrder = 'latest' | 'popular' | 'old';

interface ProfileSortChipsProps {
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  onOpenFilters?: () => void;
}

export function ProfileSortChips({
  sort,
  onSortChange,
  onOpenFilters,
}: ProfileSortChipsProps) {
  const options: { label: string; value: SortOrder }[] = [
    { label: 'Latest', value: 'latest' },
    { label: 'Popular', value: 'popular' },
    { label: 'Old', value: 'old' },
  ];

  return (
    <div className="w-full px-5 mt-3 flex items-center justify-between">
      {/* Sort Pills */}
      <div className="flex items-center gap-2">
        {options.map((opt) => {
          const isSelected = sort === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSortChange(opt.value)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all active:scale-95 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Filter Icon Button */}
      <button
        type="button"
        onClick={onOpenFilters}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-colors"
        aria-label="Filter options"
      >
        <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
      </button>
    </div>
  );
}
