'use client';

import React from 'react';

export function ProfileSkeleton() {
  return (
    <div className="w-full flex flex-col items-center animate-pulse">
      {/* Cover Skeleton */}
      <div className="w-full h-52 bg-slate-200/80 relative" />

      {/* Avatar Skeleton */}
      <div className="relative -mt-16 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-300 shadow-md" />

        {/* Identity Skeleton */}
        <div className="mt-3 flex flex-col items-center gap-1.5 w-48">
          <div className="h-5 w-32 bg-slate-200 rounded-md" />
          <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
          <div className="h-3 w-44 bg-slate-200 rounded-md mt-1" />
          <div className="h-3 w-36 bg-slate-200 rounded-md" />
        </div>
      </div>

      {/* Stats Card Skeleton */}
      <div className="w-full px-5 mt-4 flex justify-center">
        <div className="w-full max-w-[342px] bg-slate-100 rounded-2xl h-16 border border-slate-200/50" />
      </div>

      {/* Tabs / Chips Skeleton */}
      <div className="w-full px-5 mt-4 flex justify-between items-center max-w-[342px]">
        <div className="h-7 w-20 bg-slate-200 rounded-full" />
        <div className="h-7 w-20 bg-slate-100 rounded-full" />
        <div className="h-7 w-20 bg-slate-100 rounded-full" />
      </div>

      {/* Grid Skeleton */}
      <div className="w-full px-5 mt-4 grid grid-cols-3 gap-2 pb-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-slate-200/70"
          />
        ))}
      </div>
    </div>
  );
}
