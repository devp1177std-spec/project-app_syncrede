'use client';

import React, { useEffect, useRef } from 'react';
import { Layers, Video, ImageOff, RefreshCw } from 'lucide-react';
import { UserGridPostItem } from '@social/types';

interface ProfilePostsGridProps {
  items: UserGridPostItem[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage: () => void;
  onRetry: () => void;
  onPostClick?: (post: UserGridPostItem) => void;
}

export function ProfilePostsGrid({
  items,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  onRetry,
  onPostClick,
}: ProfilePostsGridProps) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onFetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, onFetchNextPage]);

  // Loading State (3x3 Skeleton)
  if (isLoading && items.length === 0) {
    return (
      <div className="w-full px-5 mt-3 grid grid-cols-3 gap-2 pb-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-slate-200/70 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Error State
  if (isError && items.length === 0) {
    return (
      <div className="w-full px-5 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
          <ImageOff className="w-6 h-6 stroke-[1.75]" />
        </div>
        <p className="text-sm font-semibold text-slate-800">
          Failed to load posts
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
          There was an issue fetching the grid posts. Please try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  // Empty State
  if (items.length === 0) {
    return (
      <div className="w-full px-5 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-3 shadow-2xs">
          <Layers className="w-7 h-7 stroke-[1.5]" />
        </div>
        <p className="text-sm font-semibold text-slate-800">No posts yet</p>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
          Photos and architectural captures will appear here.
        </p>
      </div>
    );
  }

  // 3-Column Square Grid
  return (
    <div className="w-full px-5 mt-3 flex flex-col pb-6">
      <div className="grid grid-cols-3 gap-2">
        {items.map((post) => (
          <div
            key={post.id}
            onClick={() => onPostClick?.(post)}
            className="aspect-square rounded-xl overflow-hidden relative group bg-slate-100 shadow-2xs cursor-pointer select-none"
          >
            {/* Image Thumbnail */}
            {post.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.thumbUrl}
                alt="Post thumbnail"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-slate-300">
                <Layers className="w-6 h-6 stroke-[1.5]" />
              </div>
            )}

            {/* Top-Right Badge Icons (Album or Video) */}
            {post.type === 'ALBUM' && (
              <div
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-black/55 backdrop-blur-xs flex items-center justify-center text-white shadow-xs pointer-events-none"
                title="Album (multiple items)"
              >
                <Layers className="w-3 h-3 stroke-[2.2]" />
              </div>
            )}

            {post.type === 'VIDEO' && (
              <div
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-black/55 backdrop-blur-xs flex items-center justify-center text-white shadow-xs pointer-events-none"
                title="Video item"
              >
                <Video className="w-3 h-3 stroke-[2.2]" />
              </div>
            )}

            {/* Subtle Touch Feedback Overlay */}
            <div className="absolute inset-0 bg-black/0 active:bg-black/10 transition-colors pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Sentinel Element for Infinite Scroll */}
      <div ref={observerRef} className="w-full h-4 mt-2 flex justify-center items-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 py-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Loading more posts...</span>
          </div>
        )}
      </div>
    </div>
  );
}
