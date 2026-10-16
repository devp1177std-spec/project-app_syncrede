'use client';

import React from 'react';

interface ProfileModeToggleProps {
  isOwnProfile: boolean;
  onToggle: (own: boolean) => void;
}

export function ProfileModeToggle({
  isOwnProfile,
  onToggle,
}: ProfileModeToggleProps) {
  return (
    <div className="w-full flex justify-center py-2 px-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50 sticky top-0">
      <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-full flex items-center shadow-inner">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
            isOwnProfile
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Profile
        </button>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
            !isOwnProfile
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Others Profile
        </button>
      </div>
    </div>
  );
}
