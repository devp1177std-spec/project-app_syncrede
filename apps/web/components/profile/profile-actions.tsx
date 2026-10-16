'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ProfileActionsProps {
  isOwnProfile: boolean;
  isFollowing: boolean;
  isFollowPending?: boolean;
  postCount: number;
  activeTab: 'posts' | 'following';
  onTabChange: (tab: 'posts' | 'following') => void;
  onFollowToggle: () => void;
  onMessage: () => void;
}

export function ProfileActions({
  isOwnProfile,
  isFollowing,
  isFollowPending = false,
  postCount,
  activeTab,
  onTabChange,
  onFollowToggle,
  onMessage,
}: ProfileActionsProps) {
  return (
    <div className="w-full px-5 mt-4 flex flex-col items-center">
      {/* "Others" Mode: Follow & Message Action Buttons */}
      {!isOwnProfile && (
        <div className="w-full max-w-[342px] flex items-center gap-3 mb-4">
          {/* Follow Button with Optimistic State */}
          <Button
            type="button"
            onClick={onFollowToggle}
            disabled={isFollowPending}
            className={`flex-1 h-10 rounded-full text-xs font-semibold tracking-wide transition-all shadow-xs ${
              isFollowing
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-98'
            }`}
          >
            {isFollowPending ? (
              <span className="animate-pulse">Updating...</span>
            ) : isFollowing ? (
              'Following'
            ) : (
              'Follow'
            )}
          </Button>

          {/* Message Button */}
          <Button
            type="button"
            onClick={onMessage}
            variant="outline"
            className="flex-1 h-10 rounded-full text-xs font-semibold tracking-wide bg-slate-100/90 hover:bg-slate-200 text-slate-800 border-slate-200/60 transition-all active:scale-98 shadow-xs"
          >
            Message
          </Button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="w-full max-w-[342px] border-b border-slate-100 flex items-center justify-start gap-8">
        {/* "My Posts" Tab */}
        <button
          type="button"
          onClick={() => onTabChange('posts')}
          className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === 'posts'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 font-medium hover:text-slate-600'
          }`}
        >
          <span>My Posts</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
              activeTab === 'posts'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {postCount}
          </span>
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* "Following" Tab (Highlighted on Own profile as shown in mockup) */}
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => onTabChange('following')}
            className={`pb-2.5 text-xs transition-all relative flex items-center gap-1.5 ${
              activeTab === 'following'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <span>Following</span>
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
