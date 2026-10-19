'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Share2,
  AlertCircle,
  Home,
  Check,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  USER_STORIES,
  UserStoryGroup,
  StoryItem,
  getStoryGroupByUsername,
} from '@/lib/stories-data';

interface StoryViewerProps {
  initialUsername?: string;
  initialStoryId?: string;
  onClose?: () => void;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  leftPercent: number;
}

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '😍'];

export function StoryViewer({
  initialUsername,
  initialStoryId,
  onClose,
}: StoryViewerProps) {
  const router = useRouter();

  // Find initial user index
  const initialIndex = initialUsername
    ? USER_STORIES.findIndex(
        (u) => u.username.toLowerCase() === initialUsername.toLowerCase().trim()
      )
    : 0;

  // Track if user was explicitly not found
  const isInvalidUser = initialUsername && initialIndex === -1;

  // Active state
  const [currentUserIndex, setCurrentUserIndex] = useState(
    initialIndex !== -1 ? initialIndex : 0
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(() => {
    if (initialStoryId && initialIndex !== -1) {
      const userGroup = USER_STORIES[initialIndex];
      const storyIdx = userGroup.stories.findIndex((s) => s.id === initialStoryId);
      return storyIdx !== -1 ? storyIdx : 0;
    }
    return 0;
  });

  const [progress, setProgress] = useState(0); // 0 to 100
  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Refs for timers & touch
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserGroup: UserStoryGroup | undefined = USER_STORIES[currentUserIndex];
  const currentStory: StoryItem | undefined = currentUserGroup?.stories[currentStoryIndex];
  const storyDuration = currentStory?.duration || 5000;
  const isCurrentLiked = currentStory ? !!likedStories[currentStory.id] : false;

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  const handleClose = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (onClose) {
      onClose();
    } else {
      router.push('/');
    }
  }, [onClose, router]);

  // Advance to next story / next user
  const handleNextStory = useCallback(() => {
    if (!currentUserGroup) return;

    if (currentStoryIndex < currentUserGroup.stories.length - 1) {
      // Advance to next story in current user group
      setCurrentStoryIndex((prev) => prev + 1);
      setProgress(0);
      progressRef.current = 0;
      setMediaLoading(true);
      setMediaError(false);
    } else {
      // Current user's stories are finished
      if (currentUserIndex < USER_STORIES.length - 1) {
        // Go to next user's first story
        const nextUser = USER_STORIES[currentUserIndex + 1];
        setCurrentUserIndex((prev) => prev + 1);
        setCurrentStoryIndex(0);
        setProgress(0);
        progressRef.current = 0;
        setMediaLoading(true);
        setMediaError(false);
        // Update URL to match new user
        window.history.replaceState(null, '', `/stories/${nextUser.username}`);
      } else {
        // Finished all stories from all users -> return to feed
        handleClose();
      }
    }
  }, [currentUserGroup, currentStoryIndex, currentUserIndex, handleClose]);

  // Navigate to previous story / previous user
  const handlePrevStory = useCallback(() => {
    // If user has watched more than 20% of the current story, restart it from 0%
    if (progressRef.current > 20) {
      setProgress(0);
      progressRef.current = 0;
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
      return;
    }

    if (currentStoryIndex > 0) {
      // Go to previous story for this user
      setCurrentStoryIndex((prev) => prev - 1);
      setProgress(0);
      progressRef.current = 0;
      setMediaLoading(true);
      setMediaError(false);
    } else {
      // On first story of current user -> go to previous user's last story
      if (currentUserIndex > 0) {
        const prevUser = USER_STORIES[currentUserIndex - 1];
        setCurrentUserIndex((prev) => prev - 1);
        setCurrentStoryIndex(prevUser.stories.length - 1);
        setProgress(0);
        progressRef.current = 0;
        setMediaLoading(true);
        setMediaError(false);
        window.history.replaceState(null, '', `/stories/${prevUser.username}`);
      } else {
        // At the very first story of the first user -> restart it
        setProgress(0);
        progressRef.current = 0;
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }
    }
  }, [currentStoryIndex, currentUserIndex]);

  // Direct next/prev user buttons (desktop side chevrons / gestures)
  const handleNextUser = useCallback(() => {
    if (currentUserIndex < USER_STORIES.length - 1) {
      const nextUser = USER_STORIES[currentUserIndex + 1];
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
      progressRef.current = 0;
      setMediaLoading(true);
      setMediaError(false);
      window.history.replaceState(null, '', `/stories/${nextUser.username}`);
    } else {
      handleClose();
    }
  }, [currentUserIndex, handleClose]);

  const handlePrevUser = useCallback(() => {
    if (currentUserIndex > 0) {
      const prevUser = USER_STORIES[currentUserIndex - 1];
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentStoryIndex(0);
      setProgress(0);
      progressRef.current = 0;
      setMediaLoading(true);
      setMediaError(false);
      window.history.replaceState(null, '', `/stories/${prevUser.username}`);
    }
  }, [currentUserIndex]);

  // Main story progress timer animation loop
  useEffect(() => {
    if (isInvalidUser || !currentStory) return;

    // Reset timestamp when paused state changes
    lastTimeRef.current = null;

    if (isPaused || mediaLoading) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const updateProgress = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Increment progress percentage based on duration
      const increment = (deltaTime / storyDuration) * 100;
      progressRef.current = Math.min(100, progressRef.current + increment);
      setProgress(progressRef.current);

      if (progressRef.current >= 100) {
        handleNextStory();
      } else {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPaused, mediaLoading, currentStory, storyDuration, handleNextStory, isInvalidUser]);

  // Keyboard controls: Escape (close), ArrowLeft (prev), ArrowRight (next), Space (pause/resume)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in the reply input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStory();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStory();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleNextStory, handlePrevStory]);

  // Video play/pause synchronization
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPaused || mediaLoading) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, mediaLoading]);

  // Pointer down (start press & hold)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore clicks on header/footer buttons or interactive inputs
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };

    // If held for > 200ms, pause the story and hide UI chrome (Instagram style)
    holdTimeoutRef.current = setTimeout(() => {
      setIsHolding(true);
      setIsPaused(true);
    }, 200);
  };

  // Pointer up (release press, detect tap vs hold vs swipe)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (isHolding) {
      setIsHolding(false);
      setIsPaused(false);
      pointerStartRef.current = null;
      return;
    }

    if (!pointerStartRef.current) return;

    const startX = pointerStartRef.current.x;
    const startY = pointerStartRef.current.y;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const deltaTime = Date.now() - pointerStartRef.current.time;
    pointerStartRef.current = null;

    // Check for swipe gestures
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absY > 75 && absY > absX && deltaY > 0) {
      // Swipe down -> Close story viewer
      handleClose();
      return;
    }

    if (absX > 60 && absX > absY) {
      if (deltaX < 0) {
        // Swipe left -> Next user
        handleNextUser();
      } else {
        // Swipe right -> Previous user
        handlePrevUser();
      }
      return;
    }

    // It was a quick tap (< 300ms, minimal movement)
    if (deltaTime < 300 && Math.hypot(deltaX, deltaY) < 20) {
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickXPercent = (e.clientX - containerRect.left) / containerRect.width;

      if (clickXPercent < 0.35) {
        // Left side tap (< 35%) -> Previous story
        handlePrevStory();
      } else {
        // Right side tap (>= 35%) -> Next story
        handleNextStory();
      }
    }
  };

  const handlePointerCancel = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (isHolding) {
      setIsHolding(false);
      setIsPaused(false);
    }
    pointerStartRef.current = null;
  };

  // Like current story
  const handleToggleLike = () => {
    if (!currentStory) return;
    const nextState = !isCurrentLiked;
    setLikedStories((prev) => ({
      ...prev,
      [currentStory.id]: nextState,
    }));

    if (nextState) {
      // Trigger floating heart reaction
      triggerReaction('❤️');
      showToast('Liked story');
    }
  };

  // Trigger floating emoji reaction
  const triggerReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      leftPercent: 50 + (Math.random() * 30 - 15),
    };
    setFloatingReactions((prev) => [...prev, newReaction]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 1800);
  };

  // Submit reply message
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUserGroup) return;

    showToast(`Reply sent to @${currentUserGroup.username}`);
    setReplyText('');
    setIsPaused(false);
  };

  // Share story link
  const handleShareStory = async () => {
    if (!currentUserGroup) return;
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/stories/${currentUserGroup.username}`
      : '';

    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast(`Link to @${currentUserGroup.username}'s story copied!`);
    } else {
      showToast('Share link ready');
    }
  };

  // If username does not exist
  if (isInvalidUser || !currentUserGroup || !currentStory) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 text-blue-400">
          <AlertCircle className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2 text-center">
          Story Unavailable
        </h2>
        <p className="text-sm text-slate-400 max-w-xs text-center mb-6 leading-relaxed">
          {initialUsername
            ? `The story from @${initialUsername} has expired or does not exist.`
            : 'No active stories available right now.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          {USER_STORIES.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCurrentUserIndex(0);
                setCurrentStoryIndex(0);
                setProgress(0);
                progressRef.current = 0;
                setMediaLoading(true);
                router.replace(`/stories/${USER_STORIES[0].username}`);
              }}
              className="w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white shadow-lg shadow-blue-600/30 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              View Available Stories
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-medium text-sm text-slate-200 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home Feed
          </button>
        </div>
      </div>
    );
  }

  const prevUser = currentUserIndex > 0 ? USER_STORIES[currentUserIndex - 1] : undefined;
  const nextUser = currentUserIndex < USER_STORIES.length - 1 ? USER_STORIES[currentUserIndex + 1] : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-[#060608] flex items-center justify-center overflow-hidden select-none">
      {/* Dynamic Ambient Background Blur (Desktop Glow) */}
      <div
        className="hidden md:block absolute inset-0 pointer-events-none opacity-25 filter blur-3xl scale-125 transition-all duration-700"
        style={{
          backgroundImage: `url(${currentStory.mediaUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-slate-700/60 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Navigation: Previous User Card / Chevron */}
      {prevUser && (
        <button
          type="button"
          onClick={handlePrevUser}
          className="hidden md:flex flex-col items-center gap-2 absolute left-6 lg:left-12 z-30 group p-3 rounded-2xl hover:bg-white/5 active:scale-95 transition"
          aria-label={`View @${prevUser.username}'s stories`}
        >
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/60 p-0.5 group-hover:border-blue-400 group-hover:scale-105 transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prevUser.avatarUrl}
              alt={prevUser.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="flex items-center gap-1 text-slate-400 group-hover:text-white text-xs font-medium">
            <ChevronLeft className="w-4 h-4" />
            <span>@{prevUser.username}</span>
          </div>
        </button>
      )}

      {/* Desktop Navigation: Next User Card / Chevron */}
      {nextUser && (
        <button
          type="button"
          onClick={handleNextUser}
          className="hidden md:flex flex-col items-center gap-2 absolute right-6 lg:right-12 z-30 group p-3 rounded-2xl hover:bg-white/5 active:scale-95 transition"
          aria-label={`View @${nextUser.username}'s stories`}
        >
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/60 p-0.5 group-hover:border-blue-400 group-hover:scale-105 transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nextUser.avatarUrl}
              alt={nextUser.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="flex items-center gap-1 text-slate-400 group-hover:text-white text-xs font-medium">
            <span>@{nextUser.username}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      )}

      {/* Main Story Container: Full-screen on mobile, centered mobile-aspect on desktop */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="w-full h-full sm:h-[92vh] sm:max-h-[860px] sm:max-w-[420px] bg-black sm:rounded-[36px] overflow-hidden relative flex flex-col justify-between shadow-2xl sm:border sm:border-slate-800/80 cursor-pointer"
      >
        {/* Visual Story Media (Image or Video) */}
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
          {/* Ambient subtle image back-glow within container */}
          {currentStory.mediaType === 'image' && (
            <div
              className="absolute inset-0 opacity-30 filter blur-xl scale-110 pointer-events-none"
              style={{
                backgroundImage: `url(${currentStory.mediaUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            />
          )}

          {currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              muted={isMuted}
              onLoadedData={() => {
                setMediaLoading(false);
                setMediaError(false);
              }}
              onError={() => {
                setMediaLoading(false);
                setMediaError(true);
              }}
              className="w-full h-full object-cover relative z-10"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt={currentStory.caption || `@${currentUserGroup.username}'s story`}
              onLoad={() => {
                setMediaLoading(false);
                setMediaError(false);
              }}
              onError={() => {
                setMediaLoading(false);
                setMediaError(true);
              }}
              className="w-full h-full object-cover relative z-10 animate-in fade-in duration-200"
            />
          )}

          {/* Loading Spinner */}
          {mediaLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
          )}

          {/* Fallback for Broken Media */}
          {mediaError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-slate-500 mb-2" />
              <p className="text-xs font-medium">Failed to load media</p>
            </div>
          )}

          {/* Dark Gradients for Readability */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none z-10" />
        </div>

        {/* Floating Heart / Emoji Burst Layer */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              style={{ left: `${r.leftPercent}%` }}
              className="absolute bottom-20 text-3xl animate-float-up"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* 1. Top Section: Segmented Progress Bars & Story Header */}
        <div
          className={`relative z-20 p-3 pt-3 sm:pt-4 flex flex-col gap-2.5 transition-opacity duration-200 ${
            isHolding ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Segmented Progress Bars */}
          <div className="w-full flex items-center gap-1.5 px-1">
            {currentUserGroup.stories.map((story, idx) => {
              let fillPercent = 0;
              if (idx < currentStoryIndex) {
                fillPercent = 100;
              } else if (idx === currentStoryIndex) {
                fillPercent = progress;
              }

              return (
                <div
                  key={story.id}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-xs"
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Story Author Header */}
          <div className="flex items-center justify-between px-1">
            {/* Left: Avatar + Username + Time + Location */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href={`/profile/${currentUserGroup.username}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-full ring-2 ring-blue-500 overflow-hidden shrink-0 hover:scale-105 active:scale-95 transition"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUserGroup.avatarUrl}
                  alt={currentUserGroup.displayName}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <Link
                    href={`/profile/${currentUserGroup.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-white text-xs font-bold hover:underline truncate"
                  >
                    {currentUserGroup.username}
                  </Link>

                  {currentUserGroup.isVerified && (
                    <svg
                      className="w-3.5 h-3.5 text-blue-500 shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z" />
                    </svg>
                  )}

                  <span className="text-white/60 text-[11px] font-normal shrink-0">
                    • {currentStory.timestamp}
                  </span>
                </div>

                {currentStory.location && (
                  <div className="flex items-center gap-1 text-[10px] text-white/80 font-normal mt-0.5 truncate">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{currentStory.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Controls (Play/Pause, Sound, Close) */}
            <div className="flex items-center gap-1 shrink-0 text-white">
              {/* Play / Pause Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((prev) => !prev);
                }}
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 transition text-white/90 hover:text-white"
                aria-label={isPaused ? 'Resume story' : 'Pause story'}
              >
                {isPaused ? (
                  <Play className="w-4 h-4 fill-white" />
                ) : (
                  <Pause className="w-4 h-4 fill-white" />
                )}
              </button>

              {/* Mute / Unmute for Video */}
              {currentStory.mediaType === 'video' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((prev) => !prev);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 transition text-white/90 hover:text-white"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Close Button (X) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 transition text-white"
                aria-label="Close story viewer (Escape)"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Middle Tap Guide Indicators (Desktop Subtle Chevrons) */}
        <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-start pl-2 pointer-events-none z-10 opacity-0 sm:group-hover:opacity-40 transition-opacity">
          <ChevronLeft className="w-6 h-6 text-white drop-shadow" />
        </div>
        <div className="absolute inset-y-0 right-0 w-16 flex items-center justify-end pr-2 pointer-events-none z-10 opacity-0 sm:group-hover:opacity-40 transition-opacity">
          <ChevronRight className="w-6 h-6 text-white drop-shadow" />
        </div>

        {/* 3. Bottom Section: Story Caption, Interactive Reply & Reactions */}
        <div
          className={`relative z-20 p-3 pb-4 sm:pb-5 flex flex-col gap-2.5 transition-opacity duration-200 ${
            isHolding ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Story Caption (if provided) */}
          {currentStory.caption && (
            <div className="px-2 py-1.5 rounded-xl bg-black/40 backdrop-blur-md text-white text-xs leading-relaxed max-w-full">
              <p className="line-clamp-3">{currentStory.caption}</p>
            </div>
          )}

          {/* Quick Reaction Emojis Row */}
          <div className="flex items-center justify-between px-1 gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerReaction(emoji);
                  showToast(`Sent ${emoji} to @${currentUserGroup.username}`);
                }}
                className="text-xl p-1 hover:scale-125 active:scale-95 transition-transform"
                aria-label={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Interactive Bottom Bar: Message Input, Like, Share */}
          <div className="flex items-center gap-2 px-1">
            <form
              onSubmit={handleSendReply}
              className="flex-1 flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white/20 border border-white/20 rounded-full px-3.5 py-1.5 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={replyText}
                onFocus={() => setIsPaused(true)}
                onBlur={() => {
                  if (!replyText.trim()) {
                    setIsPaused(false);
                  }
                }}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${currentUserGroup.username}...`}
                className="flex-1 bg-transparent text-white text-xs placeholder:text-white/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:hover:text-blue-400 active:scale-90 transition p-1"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </form>

            {/* Like Heart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-125 transition shrink-0"
              aria-label={isCurrentLiked ? 'Unlike story' : 'Like story'}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isCurrentLiked
                    ? 'text-red-500 fill-red-500 stroke-red-500'
                    : 'stroke-[2]'
                }`}
              />
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShareStory();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white active:scale-110 transition shrink-0"
              aria-label="Share story"
            >
              <Share2 className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
