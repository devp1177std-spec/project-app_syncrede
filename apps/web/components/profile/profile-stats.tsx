'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProfileStatsProps {
  followerCount: number;
  followingCount: number;
  postCount: number;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onPostsClick?: () => void;
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

interface VerticalTabProps {
  text: string;
  onClick: () => void;
  ariaLabel: string;
  title: string;
  isActive: boolean;
}

/**
 * Vertical tab with a right-pointing chevron shape matching the design wireframe.
 * Tapping flips between the Statistics view and Bio / Details view.
 */
function VerticalTab({
  text,
  onClick,
  ariaLabel,
  title,
  isActive,
}: VerticalTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isActive}
      tabIndex={isActive ? 0 : -1}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        'relative w-[30px] h-[58px] flex items-center justify-center shrink-0 group',
        'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-l-md transition-transform',
        'hover:scale-[1.02] active:scale-95 cursor-pointer select-none',
        !isActive && 'pointer-events-none'
      )}
    >
      {/* SVG Chevron Tab pointing right into the card */}
      <svg
        viewBox="0 0 30 58"
        className="absolute inset-0 w-full h-full text-blue-50/90 group-hover:text-blue-100/90 group-active:text-blue-200 transition-colors drop-shadow-2xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 4C0 1.79086 1.79086 0 4 0H18C20.1 0 22 1.1 23 2.8L28.8 26.6C29.6 28.1 29.6 29.9 28.8 31.4L23 55.2C22 56.9 20.1 58 18 58H4C1.79086 58 0 56.2091 0 54V4Z"
          fill="currentColor"
          stroke="#BFDBFE"
          strokeWidth="1"
        />
      </svg>

      {/* Upright stacked vertical letters (e.g. B-I-O or S-T-A-T-S) */}
      <div className="relative z-10 flex flex-col items-center justify-center pr-1.5 select-none pointer-events-none">
        {text.split('').map((char, index) => (
          <span
            key={index}
            className={cn(
              'font-black leading-[1.05] tracking-wider text-blue-600 group-hover:text-blue-700 transition-colors uppercase',
              text.length > 3 ? 'text-[8px]' : 'text-[9.5px]'
            )}
          >
            {char}
          </span>
        ))}
      </div>
    </button>
  );
}

export function ProfileStats({
  followerCount,
  followingCount,
  postCount,
  bio,
  location,
  website,
  onFollowersClick,
  onFollowingClick,
  onPostsClick,
}: ProfileStatsProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const cleanBio = useMemo(() => bio?.trim() || '', [bio]);
  const hasBio = Boolean(cleanBio);
  const isLongBio = cleanBio.length > 70;

  // Clean word-boundary truncation for long bios
  const truncatedBio = useMemo(() => {
    if (!isLongBio) return cleanBio;
    const sliced = cleanBio.slice(0, 68);
    const lastSpace = sliced.lastIndexOf(' ');
    return (lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim();
  }, [cleanBio, isLongBio]);

  const cleanLocation = useMemo(() => location?.trim() || '', [location]);

  const websiteHref = useMemo(() => {
    if (!website) return '';
    const trimmed = website.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }, [website]);

  const cleanWebsite = useMemo(() => {
    if (!website) return '';
    return website.trim().replace(/^https?:\/\/(www\.)?/, '');
  }, [website]);

  const handleFlipToBio = () => {
    setIsFlipped(true);
  };

  const handleFlipToStats = () => {
    setIsFlipped(false);
    setIsBioExpanded(false);
  };

  return (
    <div className="w-full px-5 mt-4 flex justify-center select-none">
      <div className="w-full max-w-[342px] perspective-1000">
        <div
          className={cn(
            'relative w-full rounded-2xl transition-[transform,height] duration-500 transform-style-3d',
            isFlipped ? 'rotate-y-180' : 'rotate-y-0'
          )}
          style={{
            height: isBioExpanded ? '118px' : '92px',
            transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s ease',
          }}
        >
          {/* ======================================================== */}
          {/* FRONT SIDE (Statistics: Followers / Following / Posts)   */}
          {/* ======================================================== */}
          <div
            className={cn(
              'absolute inset-0 w-full h-full rounded-2xl bg-white border border-slate-100/90 shadow-card backface-hidden flex items-center overflow-hidden',
              isFlipped ? 'pointer-events-none' : 'pointer-events-auto z-10'
            )}
            aria-hidden={isFlipped}
          >
            {/* Left Vertical Tab: Bio */}
            <VerticalTab
              text="BIO"
              onClick={handleFlipToBio}
              ariaLabel="Flip to view bio, website and location"
              title="View Bio & Details"
              isActive={!isFlipped}
            />

            {/* 3 Profile Statistics Horizontally */}
            <div className="flex-1 flex items-center justify-between text-center divide-x divide-slate-100 py-1 pr-3">
              {/* Followers */}
              <div
                onClick={onFollowersClick}
                className={cn(
                  'flex-1 flex flex-col items-center select-none',
                  onFollowersClick && 'cursor-pointer hover:opacity-80 transition-opacity'
                )}
              >
                <span className="text-[15px] font-bold text-slate-900 tracking-tight">
                  {formatCount(followerCount)}
                </span>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Followers
                </span>
              </div>

              {/* Following */}
              <div
                onClick={onFollowingClick}
                className={cn(
                  'flex-1 flex flex-col items-center select-none',
                  onFollowingClick && 'cursor-pointer hover:opacity-80 transition-opacity'
                )}
              >
                <span className="text-[15px] font-bold text-slate-900 tracking-tight">
                  {formatCount(followingCount)}
                </span>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Following
                </span>
              </div>

              {/* Posts */}
              <div
                onClick={onPostsClick}
                className={cn(
                  'flex-1 flex flex-col items-center select-none',
                  onPostsClick && 'cursor-pointer hover:opacity-80 transition-opacity'
                )}
              >
                <span className="text-[15px] font-bold text-slate-900 tracking-tight">
                  {formatCount(postCount)}
                </span>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Posts
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BACK SIDE (Details: Bio, Website, Location)              */}
          {/* ======================================================== */}
          <div
            className={cn(
              'absolute inset-0 w-full h-full rounded-2xl bg-white border border-slate-100/90 shadow-card backface-hidden rotate-y-180 flex items-center overflow-hidden',
              !isFlipped ? 'pointer-events-none' : 'pointer-events-auto z-10'
            )}
            aria-hidden={!isFlipped}
          >
            {/* Left Vertical Tab: Stats */}
            <VerticalTab
              text="STATS"
              onClick={handleFlipToStats}
              ariaLabel="Flip back to profile statistics"
              title="View Stats"
              isActive={isFlipped}
            />

            {/* Content Area: Bio & Website (left) + Location (right) */}
            <div className="flex-1 min-w-0 h-full flex items-center justify-between px-3 py-2 gap-2">
              {/* Left Column: Bio & Website */}
              <div className="flex-1 min-w-0 flex flex-col justify-center pr-1">
                {/* Bio text with smart truncation and 'more' option */}
                {hasBio ? (
                  <div className="text-[11.5px] leading-snug text-slate-700">
                    {isLongBio && !isBioExpanded ? (
                      <p>
                        <span className="break-words">
                          {truncatedBio}...
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsBioExpanded(true);
                          }}
                          className="ml-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          more
                        </button>
                      </p>
                    ) : (
                      <p>
                        <span className="break-words">{cleanBio}</span>
                        {isLongBio && isBioExpanded && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsBioExpanded(false);
                            }}
                            className="ml-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                          >
                            less
                          </button>
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11.5px] text-slate-400 italic">No bio added yet</p>
                )}

                {/* Website link */}
                {cleanWebsite ? (
                  <div className="mt-1">
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline max-w-[175px] truncate transition"
                      title={websiteHref}
                    >
                      <Link2 className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">{cleanWebsite}</span>
                    </a>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-slate-400 italic inline-flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-slate-300 shrink-0" />
                    <span>No website</span>
                  </div>
                )}
              </div>

              {/* Right Column: Location pin badge + name */}
              <div className="shrink-0 flex flex-col items-center justify-center pl-2.5 border-l border-slate-100 min-w-[76px] max-w-[95px]">
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 shadow-2xs">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <span
                  className="text-[10.5px] font-medium text-slate-700 mt-1 max-w-full text-center leading-tight line-clamp-2"
                  title={cleanLocation || undefined}
                >
                  {cleanLocation ? (
                    cleanLocation
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not set</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
