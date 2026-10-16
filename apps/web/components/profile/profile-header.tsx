'use client';

import React from 'react';
import { ChevronLeft, Share2, MoreVertical, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserProfileResponse } from '@social/types';

interface ProfileHeaderProps {
  profile: UserProfileResponse;
  onShare: () => void;
  onOpenMore: () => void;
}

export function ProfileHeader({
  profile,
  onShare,
  onOpenMore,
}: ProfileHeaderProps) {
  const router = useRouter();

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Cover Gradient Banner with Decorative Radiance */}
      <div className="w-full h-52 bg-gradient-to-br from-cyan-400 via-blue-600 to-blue-700 relative overflow-hidden flex flex-col justify-between px-4 pt-12 pb-4">
        {/* Subtle curved ambient highlight */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-8 right-6 w-32 h-16 bg-cyan-300/25 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/3 w-40 h-20 bg-blue-900/20 rounded-full blur-lg pointer-events-none" />

        {/* Top Navigation Row */}
        <div className="w-full flex items-center justify-between z-10">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-black/25 hover:bg-black/35 active:scale-90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xs"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Right Action Icons: Share & More */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              className="w-9 h-9 rounded-full bg-black/25 hover:bg-black/35 active:scale-90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xs"
              aria-label="Share profile"
            >
              <Share2 className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={onOpenMore}
              className="w-9 h-9 rounded-full bg-black/25 hover:bg-black/35 active:scale-90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xs"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Container (Overlapping the cover banner and white background) */}
      <div className="relative -mt-16 z-20 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={profile.displayName || profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl">
                {profile.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* Green Online Presence Dot */}
          {profile.isOnline && (
            <span
              className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs ring-1 ring-emerald-400/40"
              title="Online now"
            />
          )}
        </div>

        {/* User Identity Info */}
        <div className="mt-3 flex flex-col items-center text-center px-6">
          {/* Display Name + Verified Badge */}
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {profile.displayName || profile.username}
            </h1>
            {profile.verified && (
              <span
                className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs"
                title="Verified account"
              >
                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
              </span>
            )}
          </div>

          {/* Username Handle */}
          <p className="text-xs font-semibold text-blue-600 mt-0.5">
            @{profile.username}
          </p>

          {/* Bio Description */}
          {profile.bio && (
            <p className="text-xs text-slate-600 max-w-[280px] leading-relaxed mt-2 font-normal text-center">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
