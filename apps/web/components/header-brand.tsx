'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle } from 'lucide-react';

interface HeaderBrandProps {
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: 'help' | 'step2' | React.ReactNode;
}

export function HeaderBrand({
  showBack = false,
  onBack,
  rightElement,
}: HeaderBrandProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="w-full h-12 px-5 flex items-center justify-between shrink-0">
      {/* Left Back Button */}
      <div className="w-10 flex items-center">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {/* Center Brand Logo & Text */}
      <div className="flex items-center gap-1.5 justify-center">
        {/* Brand Logo Image */}
        <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="SocialFeed Logo"
            className="w-full h-full object-contain"
          />
        </div>

        <span className="font-bold text-slate-900 tracking-tight text-base">
          SocialFeed
        </span>

        {/* MARKET pill badge */}
        <span className="text-[10px] font-extrabold uppercase tracking-wide bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-xs">
          MARKET
        </span>
      </div>

      {/* Right Element (Help icon or Step 2 of 2 pill) */}
      <div className="w-16 flex items-center justify-end">
        {rightElement === 'help' ? (
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition p-1"
            aria-label="Help and support"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        ) : rightElement === 'step2' ? (
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap border border-slate-200/60">
            Step 2 of 2
          </span>
        ) : (
          rightElement || null
        )}
      </div>
    </div>
  );
}
