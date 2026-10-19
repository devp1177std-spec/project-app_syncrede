'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Search,
  MoreHorizontal,
  X,
  Sparkles,
} from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { USER_STORIES } from '@/lib/stories-data';

interface CommentItem {
  id: string;
  user: string;
  text: string;
  timeAgo: string;
}

interface Post {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
    location: string;
    isFollowing: boolean;
  };
  mediaUrl: string;
  mediaAlt: string;
  caption: string;
  tags?: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  timeAgo: string;
  likedByPreviewUser?: string;
  comments: CommentItem[];
}

const STORIES = USER_STORIES;

const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    author: {
      username: 'oliviamartinez',
      displayName: 'Olivia Martinez',
      avatarUrl: '/images/avatars/avatar-olivia.jpg',
      isVerified: true,
      location: 'San Francisco',
      isFollowing: true,
    },
    mediaUrl: '/images/post-building.png',
    mediaAlt: 'Futuristic architectural curved facade by Olivia Martinez',
    caption: 'Spatial geometry and morning daylight at the cultural pavilion. Exploring minimal curves in concrete and insulated glass.',
    tags: ['#architecture', '#minimalism', '#design'],
    likeCount: 1420,
    commentCount: 48,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '1h ago',
    likedByPreviewUser: 'rosy_me',
    comments: [
      { id: 'c1', user: 'marcus_v', text: 'Incredible fluid geometry!', timeAgo: '45m ago' },
      { id: 'c2', user: 'sarahchen', text: 'Zaha vibes, breathtaking structure ✨', timeAgo: '30m ago' },
      { id: 'c3', user: 'clayclare', text: 'The light reflection is surreal', timeAgo: '10m ago' },
    ],
  },
  {
    id: 'post-2',
    author: {
      username: 'rosy_me',
      displayName: 'Rosy Mendez',
      avatarUrl: '/images/avatars/avatar-rosy.jpg',
      isVerified: true,
      location: 'Barcelona, Spain',
      isFollowing: true,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop',
    mediaAlt: 'Minimalist Scandinavian interior with oak wood and natural sunlight',
    caption: 'Morning warmth in the studio. Handcrafted oak detailing meets natural limestone and soft linen textures.',
    tags: ['#interior', '#studio', '#nordic'],
    likeCount: 932,
    commentCount: 34,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '2h ago',
    likedByPreviewUser: 'oliviamartinez',
    comments: [
      { id: 'c4', user: 'elena_m', text: 'That natural lighting is perfection', timeAgo: '1h ago' },
      { id: 'c5', user: 'patyo', text: 'Love the oak chair joinery!', timeAgo: '40m ago' },
    ],
  },
  {
    id: 'post-3',
    author: {
      username: 'ssm_2y',
      displayName: 'Samir Sethi',
      avatarUrl: '/images/avatars/avatar-samir.jpg',
      isVerified: false,
      location: 'Tokyo, Japan',
      isFollowing: true,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    mediaAlt: 'Futuristic multi-monitor coding setup in Tokyo',
    caption: 'Late night refactor finished. All test suites green, sub-second latency, and custom mechanical switches clicking away.',
    tags: ['#devlife', '#tokyo', '#workspace'],
    likeCount: 1845,
    commentCount: 62,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '3h ago',
    likedByPreviewUser: 'alex_dev',
    comments: [
      { id: 'c6', user: 'tham28', text: 'What monitor arm are you using?', timeAgo: '2h ago' },
      { id: 'c7', user: 'marcus_v', text: 'Cyberpunk setup goals 🔥', timeAgo: '1h ago' },
    ],
  },
  {
    id: 'post-4',
    author: {
      username: 'clayclare',
      displayName: 'Clare Clayborne',
      avatarUrl: '/images/avatars/avatar-clare.jpg',
      isVerified: true,
      location: 'Kyoto, Japan',
      isFollowing: true,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop',
    mediaAlt: 'Handmade ceramic vessels and stoneware pottery',
    caption: 'Fresh batch of terracotta and matte white stoneware coming out of the gas kiln today. Each vessel carries unique wood-ash glaze marks.',
    tags: ['#ceramics', '#craftsmanship', '#kyoto'],
    likeCount: 2130,
    commentCount: 89,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '4h ago',
    likedByPreviewUser: 'oliviamartinez',
    comments: [
      { id: 'c8', user: 'rosy_me', text: 'Can I reserve the tall textured vase?!', timeAgo: '3h ago' },
      { id: 'c9', user: 'sarahchen', text: 'Incredible glaze textures Clare', timeAgo: '2h ago' },
    ],
  },
  {
    id: 'post-5',
    author: {
      username: 'tham28',
      displayName: 'Thomas Anderson',
      avatarUrl: '/images/avatars/avatar-thomas.jpg',
      isVerified: false,
      location: 'Austin, TX',
      isFollowing: false,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
    mediaAlt: 'Minimalist creative workspace with laptop and notebook',
    caption: 'New podcast episode is live! We sat down with mobile UI designers to unpack micro-interactions and tactile feedback in modern apps.',
    tags: ['#podcast', '#design', '#creators'],
    likeCount: 640,
    commentCount: 28,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '5h ago',
    likedByPreviewUser: 'ssm_2y',
    comments: [
      { id: 'c10', user: 'alex_dev', text: 'Listening right now, great points on haptic cues!', timeAgo: '4h ago' },
    ],
  },
  {
    id: 'post-6',
    author: {
      username: 'patyo',
      displayName: 'Patrick Morales',
      avatarUrl: '/images/avatars/avatar-patrick.jpg',
      isVerified: false,
      location: 'Lisbon, Portugal',
      isFollowing: false,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
    mediaAlt: 'Sun-drenched patio terrace with olive trees and stone walls',
    caption: 'Golden hour on the terrace overlooking Alfama. Olive trees, warm limestone, and gentle Atlantic breeze.',
    tags: ['#lisbon', '#terrace', '#architecture'],
    likeCount: 1510,
    commentCount: 41,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '6h ago',
    likedByPreviewUser: 'rosy_me',
    comments: [
      { id: 'c11', user: 'oliviamartinez', text: 'Lisbon light hits different', timeAgo: '5h ago' },
      { id: 'c12', user: 'marcus_v', text: 'Dream outdoor living space', timeAgo: '4h ago' },
    ],
  },
  {
    id: 'post-7',
    author: {
      username: 'sarahchen',
      displayName: 'Sarah Chen',
      avatarUrl: '/images/avatars/avatar-sarah.jpg',
      isVerified: true,
      location: 'Seattle, WA',
      isFollowing: true,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800',
    mediaAlt: 'Artisanal specialty coffee latte art at local cafe',
    caption: 'Single-origin Ethiopian pour-over tasting at the roastery. Jasmine florals and crisp citrus brightness ☕',
    tags: ['#coffee', '#specialtycoffee', '#seattle'],
    likeCount: 874,
    commentCount: 23,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '7h ago',
    likedByPreviewUser: 'marcus_v',
    comments: [
      { id: 'c13', user: 'clayclare', text: 'Which roast did you take home?', timeAgo: '6h ago' },
    ],
  },
  {
    id: 'post-8',
    author: {
      username: 'marcus_v',
      displayName: 'Marcus Vance',
      avatarUrl: '/images/avatars/avatar-marcus.jpg',
      isVerified: false,
      location: 'New York, NY',
      isFollowing: true,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    mediaAlt: 'Looking up at towering modern glass skyscraper in Manhattan',
    caption: 'Slicing through morning fog at Hudson Yards. The sheer verticality of structural glass never ceases to amaze.',
    tags: ['#nyc', '#skyline', '#architecture'],
    likeCount: 1120,
    commentCount: 39,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '9h ago',
    likedByPreviewUser: 'oliviamartinez',
    comments: [
      { id: 'c14', user: 'rosy_me', text: 'The reflection angle here is immaculate', timeAgo: '8h ago' },
    ],
  },
  {
    id: 'post-9',
    author: {
      username: 'elena_m',
      displayName: 'Elena Rostova',
      avatarUrl: '/images/avatars/avatar-elena.jpg',
      isVerified: true,
      location: 'Milan, Italy',
      isFollowing: false,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
    mediaAlt: 'Editorial fashion textures and neutral tones',
    caption: 'Autumn collection fabric research. Heavy raw linen, brushed alpaca wool, and earth-pigment dyes.',
    tags: ['#milan', '#textiledesign', '#fashion'],
    likeCount: 3420,
    commentCount: 112,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '11h ago',
    likedByPreviewUser: 'clayclare',
    comments: [
      { id: 'c15', user: 'sarahchen', text: 'Sensational texture palette!', timeAgo: '10h ago' },
    ],
  },
  {
    id: 'post-10',
    author: {
      username: 'alex_dev',
      displayName: 'Alex Rivera',
      avatarUrl: '/images/avatars/avatar-alex.jpg',
      isVerified: false,
      location: 'Berlin, Germany',
      isFollowing: false,
    },
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
    mediaAlt: 'Macro close-up of emerald green circuit board and microchips',
    caption: 'First batch of custom IoT environmental monitor PCBs arrived from fabrication. Ready for SMD solder reflow tonight.',
    tags: ['#hardware', '#iot', '#berlin'],
    likeCount: 756,
    commentCount: 19,
    likedByMe: false,
    savedByMe: false,
    timeAgo: '14h ago',
    likedByPreviewUser: 'ssm_2y',
    comments: [
      { id: 'c16', user: 'ssm_2y', text: 'Clean silkscreen and traces Alex!', timeAgo: '12h ago' },
    ],
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [animatingHeartPostId, setAnimatingHeartPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextLiked = !post.likedByMe;
          const nextCount = nextLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);
          return {
            ...post,
            likedByMe: nextLiked,
            likeCount: nextCount,
          };
        }
        return post;
      })
    );
  };

  const handleDoubleTap = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextLiked = true;
          const nextCount = post.likedByMe ? post.likeCount : post.likeCount + 1;
          return {
            ...post,
            likedByMe: nextLiked,
            likeCount: nextCount,
          };
        }
        return post;
      })
    );
    setAnimatingHeartPostId(postId);
    setTimeout(() => setAnimatingHeartPostId(null), 900);
  };

  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextSaved = !post.savedByMe;
          showToast(nextSaved ? 'Saved to bookmarks' : 'Removed from bookmarks');
          return {
            ...post,
            savedByMe: nextSaved,
          };
        }
        return post;
      })
    );
  };

  const handleShare = async (post: Post) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/profile/${post.author.username}` : '';
    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url || window.location.href);
      showToast(`Link for @${post.author.username}'s post copied`);
    } else {
      showToast('Share link ready');
    }
  };

  const handleToggleFollow = (username: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.author.username === username) {
          const nextFollowing = !post.author.isFollowing;
          showToast(nextFollowing ? `Followed @${username}` : `Unfollowed @${username}`);
          return {
            ...post,
            author: {
              ...post.author,
              isFollowing: nextFollowing,
            },
          };
        }
        return post;
      })
    );
  };

  const handleOpenComments = (post: Post) => {
    setActiveCommentPost(post);
    setCommentInput('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeCommentPost) return;

    const newComment: CommentItem = {
      id: Date.now().toString(),
      user: 'you',
      text: commentInput.trim(),
      timeAgo: 'Just now',
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === activeCommentPost.id) {
          const updatedComments = [...post.comments, newComment];
          const updatedPost = {
            ...post,
            comments: updatedComments,
            commentCount: post.commentCount + 1,
          };
          setActiveCommentPost(updatedPost);
          return updatedPost;
        }
        return post;
      })
    );

    setCommentInput('');
    showToast('Comment posted');
  };

  // Filter posts based on active tab and search query
  const displayedPosts = posts.filter((post) => {
    if (activeTab === 'following' && !post.author.isFollowing) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAuthor = post.author.username.toLowerCase().includes(q) || post.author.displayName.toLowerCase().includes(q);
      const matchLocation = post.author.location.toLowerCase().includes(q);
      const matchCaption = post.caption.toLowerCase().includes(q);
      const matchTags = post.tags?.some((t) => t.toLowerCase().includes(q));
      return matchAuthor || matchLocation || matchCaption || matchTags;
    }
    return true;
  });

  const filteredStories = searchQuery
    ? STORIES.filter((s) => s.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : STORIES;

  return (
    <div className="flex-1 flex flex-col bg-white select-none relative pb-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {toastMessage}
        </div>
      )}

      {/* 1. Top Header Bar */}
      <header className="w-full h-12 px-4 flex items-center justify-between bg-white shrink-0 sticky top-0 z-30">
        {/* Left: Brand Knot circular emblem */}
        <button
          type="button"
          onClick={() => showToast('SocialFeed v1.0')}
          className="w-9 h-9 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shadow-xs overflow-hidden active:scale-95 transition-transform"
          aria-label="Feed brand menu"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="SocialFeed Brand"
            className="w-8 h-8 object-contain"
          />
        </button>

        {/* Center: SocialFeed brand title */}
        <h1 className="text-[19px] font-bold text-blue-600 tracking-tight text-center">
          SocialFeed
        </h1>

        {/* Right: User avatar with blue ring */}
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full ring-2 ring-blue-500 overflow-hidden active:scale-95 transition-transform shrink-0"
          aria-label="Go to profile"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/avatars/avatar-olivia.jpg"
            alt="Olivia Martinez"
            className="w-full h-full object-cover"
          />
        </Link>
      </header>

      {/* 2. Search Bar with Smart Dropdown */}
      <div className="px-4 pt-1 pb-3 shrink-0">
        <SearchBar
          placeholder="Search feed, creators, and tags..."
          onSearchSubmit={(q) => setSearchQuery(q)}
        />
        {searchQuery && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Filtering feed for &quot;<strong className="text-slate-800">{searchQuery}</strong>&quot;</span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-blue-600 font-semibold hover:underline"
            >
              Show all
            </button>
          </div>
        )}
      </div>

      {/* 3. Stories Row */}
      <div className="px-4 pb-2 flex items-start gap-2.5 overflow-x-auto no-scrollbar shrink-0">
        {filteredStories.map((story) => (
          <Link
            key={story.id}
            href={`/stories/${story.username}`}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            aria-label={`View @${story.username}'s story`}
          >
            <div className="w-[42px] h-[54px] rounded-[13px] border-2 border-blue-500 overflow-hidden shadow-xs group-hover:scale-105 group-active:scale-95 transition-transform shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={story.image}
                alt={story.username}
                className="w-full h-full object-cover block"
              />
            </div>
            <span className="text-[10px] text-slate-500 tracking-tight font-normal truncate max-w-[46px] text-center">
              {story.username}
            </span>
          </Link>
        ))}
      </div>

      {/* 4. Section Tabs: "For you" / "Following" */}
      <div className="px-4 py-2 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('for-you')}
          className={`text-[17px] font-bold transition-colors ${
            activeTab === 'for-you'
              ? 'text-slate-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          For you
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('following')}
          className={`text-xs font-medium transition-colors ${
            activeTab === 'following'
              ? 'text-blue-600 font-bold'
              : 'text-blue-500 hover:text-blue-600'
          }`}
        >
          Following
        </button>
      </div>

      {/* 5. Main Feed Posts (10 Unique Creators) */}
      <div className="flex-1 flex flex-col divide-y divide-slate-100">
        {displayedPosts.length > 0 ? (
          displayedPosts.map((post) => (
            <article key={post.id} className="w-full pt-2 pb-4 bg-white">
              {/* Post Author Header */}
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

                {/* More options menu / Follow button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(post.author.username)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition ${
                      post.author.isFollowing
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    {post.author.isFollowing ? 'Following' : '+ Follow'}
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast(`Options for @${post.author.username}`)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full active:scale-95 transition-transform"
                    aria-label="Post actions"
                  >
                    <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
                  </button>
                </div>
              </div>

              {/* Post Media: Full photograph */}
              <div
                className="w-full relative overflow-hidden bg-slate-100 cursor-pointer"
                onDoubleClick={() => handleDoubleTap(post.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.mediaUrl}
                  alt={post.mediaAlt}
                  className="w-full h-auto max-h-[460px] object-cover block"
                  loading="lazy"
                />

                {/* Double Tap Floating Heart Animation */}
                {animatingHeartPostId === post.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
                    <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
                  </div>
                )}
              </div>

              {/* Post Action Bar */}
              <div className="px-4 py-3 flex items-center justify-between">
                {/* Left 3 Action Icons: Heart, Comment, Send */}
                <div className="flex items-center gap-5 text-slate-800">
                  {/* Heart / Like button */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
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
                    onClick={() => handleOpenComments(post)}
                    className="hover:opacity-80 active:scale-110 transition-transform"
                    aria-label="Comment on post"
                  >
                    <MessageCircle className="w-6 h-6 stroke-[1.8]" />
                  </button>

                  {/* Send / Direct Share button */}
                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className="hover:opacity-80 active:scale-110 transition-transform -rotate-12"
                    aria-label="Share post"
                  >
                    <Send className="w-6 h-6 stroke-[1.8]" />
                  </button>
                </div>

                {/* Right Action: Bookmark ribbon */}
                <button
                  type="button"
                  onClick={() => handleToggleSave(post.id)}
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

              {/* Likes counter & Preview */}
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
                        onClick={() => setSearchQuery(tag.replace('#', ''))}
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
                    onClick={() => handleOpenComments(post)}
                    className="text-[11px] text-slate-400 font-medium hover:text-slate-600 pt-0.5"
                  >
                    View all {post.commentCount} comments
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          /* Empty Search / Following Tab State */
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeTab === 'following' ? 'No Following Posts Yet' : 'No Results Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-[220px]">
              {activeTab === 'following'
                ? 'Follow more creators from "For you" to see their updates here.'
                : `We couldn't find any posts matching "${searchQuery}".`}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('for-you');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline pt-2"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Feed Footer */}
        {displayedPosts.length > 0 && (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>You&apos;ve viewed all {displayedPosts.length} posts!</span>
          </div>
        )}
      </div>

      {/* Interactive Comments Drawer */}
      {activeCommentPost && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setActiveCommentPost(null)}
        >
          <div
            className="w-full bg-white rounded-t-3xl max-h-[75%] flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Comments</h4>
                <p className="text-[11px] text-slate-400">
                  Post by @{activeCommentPost.author.username}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommentPost(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-64 no-scrollbar">
              {activeCommentPost.comments.map((c) => (
                <div key={c.id} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 mr-1.5">
                      @{c.user}
                    </span>
                    <span className="text-[10px] text-slate-400">{c.timeAgo}</span>
                  </div>
                  <p className="text-slate-600">{c.text}</p>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddComment}
              className="pt-2 border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="text-xs font-semibold text-blue-600 px-3 py-2 disabled:opacity-50"
                disabled={!commentInput.trim()}
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
