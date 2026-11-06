'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreVertical,
  Flag,
  EyeOff,
} from 'lucide-react';
import type { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
  animatingHeart: boolean;
  onToggleLike: (postId: string) => void;
  onDoubleTap: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onShare: (post: Post) => void;
  onToggleFollow: (username: string) => void;
  onOpenComments: (post: Post) => void;
  onSearchTag: (tag: string) => void;
  onReport: (post: Post) => void;
  onRemove: (postId: string) => void;
}

export const PostCard = React.memo(function PostCard({
  post,
  animatingHeart,
  onToggleLike,
  onDoubleTap,
  onToggleSave,
  onShare,
  onToggleFollow,
  onOpenComments,
  onSearchTag,
  onReport,
  onRemove,
}: PostCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dismissState, setDismissState] = useState<'idle' | 'overlay' | 'removing'>('idle');

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const removeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    };
  }, []);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dismissState !== 'idle') return;
    setIsMenuOpen((prev) => !prev);
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dismissState !== 'idle') return;
    setIsMenuOpen(false);
    onReport(post);
  };

  const handleNotInterestedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dismissState !== 'idle') return;
    setIsMenuOpen(false);
    setDismissState('overlay');

    // After exactly 3 seconds, smoothly remove only that selected post from the feed
    dismissTimerRef.current = setTimeout(() => {
      setDismissState('removing');
      removeTimerRef.current = setTimeout(() => {
        onRemove(post.id);
      }, 300);
    }, 3000);
  };

  return (
    <article
      id={`post-${post.id}`}
      data-testid={`post-card-${post.id}`}
      className={`w-full bg-white relative transition-all duration-300 ease-in-out ${
        dismissState === 'removing'
          ? 'max-h-0 opacity-0 overflow-hidden py-0 my-0 scale-95 pointer-events-none'
          : 'pt-2 pb-4'
      }`}
    >
      {/* 1. Post Author Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <Link
          href={`/profile/${post.author.username}`}
          className="flex items-center gap-2.5 group"
        >
          {/* Creator circle avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 group-hover:ring-2 group-hover:ring-blue-500/30 transition-all shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Username + verified badge + location */}
          <div>
            <div className="flex items-center gap-1 leading-none">
              <span className="font-bold text-[13px] text-slate-900 group-hover:text-blue-600 transition-colors">
                {post.author.username}
              </span>
              {/* Verified blue badge checkmark */}
              {post.author.isVerified && (
                <svg
                  className="w-3.5 h-3.5 text-blue-600 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal pt-0.5">
              <span>{post.author.location}</span>
              <span>•</span>
              <span>{post.timeAgo}</span>
            </div>
          </div>
        </Link>

        {/* Header Right Actions: Follow button + Three-dot action menu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFollow(post.author.username)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition ${
              post.author.isFollowing
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {post.author.isFollowing ? 'Following' : '+ Follow'}
          </button>

          {/* Three-dot dropdown menu trigger & floating menu */}
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={handleToggleMenu}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full active:scale-95 transition-transform"
              aria-label="Post actions"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="w-5 h-5 stroke-[1.8]" />
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 origin-top-right divide-y divide-slate-100"
                role="menu"
                aria-orientation="vertical"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleReportClick}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                >
                  <Flag className="w-4 h-4 text-slate-500" />
                  <span>Report Content</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleNotInterestedClick}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                >
                  <EyeOff className="w-4 h-4 text-slate-500" />
                  <span>Not Interested in This Content</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Post Media: Full photograph */}
      <div
        className="w-full relative overflow-hidden bg-slate-100 cursor-pointer"
        onDoubleClick={() => onDoubleTap(post.id)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.mediaUrl}
          alt={post.mediaAlt}
          className="w-full h-auto max-h-[460px] object-cover block"
          loading="lazy"
        />

        {/* Double Tap Floating Heart Animation */}
        {animatingHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
            <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* 3. Post Action Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left Action Icons: Heart, Comment, Send */}
        <div className="flex items-center gap-5 text-slate-800">
          {/* Heart / Like button */}
          <button
            type="button"
            onClick={() => onToggleLike(post.id)}
            className="hover:opacity-80 active:scale-125 transition-transform"
            aria-label={post.likedByMe ? 'Unlike post' : 'Like post'}
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                post.likedByMe
                  ? 'text-red-500 fill-red-500 stroke-red-500'
                  : 'stroke-[1.8]'
              }`}
            />
          </button>

          {/* Comment button */}
          <button
            type="button"
            onClick={() => onOpenComments(post)}
            className="hover:opacity-80 active:scale-110 transition-transform"
            aria-label="Comment on post"
          >
            <MessageCircle className="w-6 h-6 stroke-[1.8]" />
          </button>

          {/* Send / Direct Share button */}
          <button
            type="button"
            onClick={() => onShare(post)}
            className="hover:opacity-80 active:scale-110 transition-transform -rotate-12"
            aria-label="Share post"
          >
            <Send className="w-6 h-6 stroke-[1.8]" />
          </button>
        </div>

        {/* Right Action: Bookmark ribbon */}
        <button
          type="button"
          onClick={() => onToggleSave(post.id)}
          className="hover:opacity-80 active:scale-110 transition-transform text-slate-800"
          aria-label={post.savedByMe ? 'Remove from saved' : 'Save post'}
        >
          <Bookmark
            className={`w-6 h-6 transition-colors ${
              post.savedByMe
                ? 'text-blue-600 fill-blue-600 stroke-blue-600'
                : 'stroke-[1.8]'
            }`}
          />
        </button>
      </div>

      {/* 4. Likes counter & Preview */}
      <div className="px-4 space-y-1">
        <p className="text-xs font-semibold text-slate-900">
          {post.likeCount.toLocaleString()} likes
          {post.likedByPreviewUser && (
            <span className="font-normal text-slate-500 ml-1">
              including <span className="font-medium text-slate-800">@{post.likedByPreviewUser}</span>
            </span>
          )}
        </p>

        {/* Caption & Tags */}
        <p className="text-xs text-slate-800 leading-relaxed">
          <Link
            href={`/profile/${post.author.username}`}
            className="font-bold text-slate-900 mr-1.5 hover:text-blue-600"
          >
            {post.author.username}
          </Link>
          {post.caption}
        </p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                onClick={() => onSearchTag(tag.replace('#', ''))}
                className="text-[11px] text-blue-600 font-medium cursor-pointer hover:underline"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* View Comments trigger */}
        {post.commentCount > 0 && (
          <button
            type="button"
            onClick={() => onOpenComments(post)}
            className="text-[11px] text-slate-400 font-medium hover:text-slate-600 pt-0.5"
          >
            View all {post.commentCount} comments
          </button>
        )}
      </div>

      {/* 5. Darkened/Black Translucent Overlay for "Not Interested in This Content" */}
      {dismissState !== 'idle' && (
        <div
          data-testid={`post-overlay-${post.id}`}
          className="absolute inset-0 z-20 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
            <EyeOff className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            Not Interested in This Content
          </h4>
          <p className="text-xs text-white/70 max-w-[220px]">
            We won&apos;t show you posts like this anymore. Removing from feed...
          </p>
        </div>
      )}
    </article>
  );
});
