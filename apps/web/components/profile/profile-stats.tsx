'use client';

import React from 'react';

interface ProfileStatsProps {
  followerCount: number;
  followingCount: number;
  postCount: number;
}

function formatCount(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (num >= 10_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toLocaleString();
}

export function ProfileStats({
  followerCount,
  followingCount,
  postCount,
}: ProfileStatsProps) {
  return (
    <div className="w-full px-5 mt-4 flex justify-center">
      <div className="w-full max-w-[342px] bg-white rounded-2xl border border-slate-100/90 shadow-card py-3 px-4 flex items-center justify-between text-center divide-x divide-slate-100">
        {/* Followers */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[15px] font-bold text-slate-900 tracking-tight">
            {formatCount(followerCount)}
          </span>
          <span className="text-[11px] font-medium text-slate-400 mt-0.5">
            Followers
          </span>
        </div>

        {/* Following */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[15px] font-bold text-slate-900 tracking-tight">
            {formatCount(followingCount)}
          </span>
          <span className="text-[11px] font-medium text-slate-400 mt-0.5">
            Following
          </span>
        </div>

        {/* Posts */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[15px] font-bold text-slate-900 tracking-tight">
            {formatCount(postCount)}
          </span>
          <span className="text-[11px] font-medium text-slate-400 mt-0.5">
            Posts
          </span>
        </div>
      </div>
    </div>
  );
}
