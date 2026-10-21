'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/use-profile';
import { useUserPosts } from '@/hooks/use-user-posts';
import { useFollowMutation } from '@/hooks/use-follow-mutation';
import { useShareProfile } from '@/hooks/use-share-profile';
import { ProfileHeader } from './profile-header';
import { ProfileStats } from './profile-stats';
import { ProfileActions } from './profile-actions';
import { ProfileSortChips, SortOrder } from './profile-sort-chips';
import { ProfilePostsGrid } from './profile-posts-grid';
import { ProfileSkeleton } from './profile-skeleton';
import { ProfileMoreSheet } from './profile-more-sheet';
import { ProfileModeToggle } from './profile-mode-toggle';

import { useAuth } from '@/providers/auth-provider';

interface ProfileScreenProps {
  initialUsername?: string;
  initialOwnProfile?: boolean;
  showModeToggle?: boolean;
}

export function ProfileScreen({
  initialUsername = 'oliviamartinez',
  initialOwnProfile = false,
  showModeToggle = false,
}: ProfileScreenProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOwnProfile, setIsOwnProfile] = useState(initialOwnProfile);
  const [sort, setSort] = useState<SortOrder>('latest');
  const [activeTab, setActiveTab] = useState<'posts' | 'following'>('posts');
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // If viewing own profile and logged-in user has a username, query their live backend data
  const effectiveUsername = isOwnProfile && user?.username ? user.username : initialUsername;

  // Queries & Mutations
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useProfile({
    username: effectiveUsername,
    isOwnProfile,
  });

  const {
    data: postsData,
    isLoading: isPostsLoading,
    isError: isPostsError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
  } = useUserPosts({
    username: effectiveUsername,
    sort,
    limit: 18,
  });

  const followMutation = useFollowMutation({ username: effectiveUsername });
  const { share, copied } = useShareProfile();

  // Flatten posts across pages
  const posts = postsData?.pages.flatMap((page) => page.items) || [];

  if (isProfileLoading && !profile) {
    return <ProfileSkeleton />;
  }

  if (isProfileError && !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-semibold text-slate-800">
          User profile not available
        </p>
        <button
          type="button"
          onClick={() => refetchProfile()}
          className="mt-3 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const isFollowing = profile.relationship.isFollowing;

  const handleFollowToggle = () => {
    followMutation.mutate({ isFollowing });
  };

  const handleShare = () => {
    share({
      name: profile.displayName || profile.username,
      username: profile.username,
    });
  };

  const handleMessage = () => {
    router.push(`/chat/${profile.id}`);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-white select-none">
      {/* Optional Mode Toggle at top for demo inspection */}
      {showModeToggle && (
        <ProfileModeToggle
          isOwnProfile={isOwnProfile}
          onToggle={(val) => setIsOwnProfile(val)}
        />
      )}

      {/* Copy Alert Toast */}
      {copied && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-in fade-in duration-200">
          Profile link copied to clipboard!
        </div>
      )}

      {/* 1. Header with Cover, Avatar, Name & Verified Badge */}
      <ProfileHeader
        profile={profile}
        onShare={handleShare}
        onOpenMore={() => setIsMoreOpen(true)}
      />

      {/* 2. Stats Card (Followers / Following / Posts) */}
      <ProfileStats
        followerCount={profile.followerCount}
        followingCount={profile.followingCount}
        postCount={profile.postCount}
      />

      {/* 3. Action Buttons & Tabs (Own vs Others) */}
      <ProfileActions
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isFollowPending={followMutation.isPending}
        postCount={profile.postCount}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onFollowToggle={handleFollowToggle}
        onMessage={handleMessage}
      />

      {/* 4. Tab Views: My Posts vs Following */}
      {activeTab === 'posts' ? (
        <>
          {/* Sort Chips (Latest / Popular / Old) */}
          <ProfileSortChips
            sort={sort}
            onSortChange={(newSort) => setSort(newSort)}
            onOpenFilters={() => alert('Filter options')}
          />

          {/* 5. 3-Column Square Posts Grid with Badges & Infinite Scroll */}
          <ProfilePostsGrid
            items={posts}
            isLoading={isPostsLoading}
            isError={isPostsError}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={() => fetchNextPage()}
            onRetry={() => refetchPosts()}
            onPostClick={(post) => console.log('Tapped post:', post.id)}
          />
        </>
      ) : (
        /* Following Tab View */
        <div className="w-full px-5 py-8 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-400">
            Viewing users followed by @{profile.username}
          </p>
        </div>
      )}

      {/* More Options Modal Sheet */}
      <ProfileMoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        isOwnProfile={isOwnProfile}
        username={profile.username}
        onShare={handleShare}
        onCopyLink={handleShare}
        copied={copied}
        onMute={() => alert(`Muted @${profile.username}`)}
        onBlock={() => alert(`Blocked @${profile.username}`)}
        onEditProfile={() => alert('Edit profile')}
        onLogout={logout}
      />
    </div>
  );
}
