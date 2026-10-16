'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Zap,
  Wand2,
  Languages,
  Code2,
  Layers,
  Video,
  Sparkles,
  Palette,
  Film,
  Globe,
  Terminal,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Users,
  Check,
  SendHorizontal,
  Share2,
} from 'lucide-react';

interface ChatItem {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar?: string;
  isCustomAvatar?: boolean;
  avatarChar?: string;
  avatarBg?: string;
  online: boolean;
  type: 'photo' | 'video';
  unread: boolean;
  lastMessage?: string;
}

interface CommunityItem {
  id: string;
  name: string;
  image: string;
  badgeBg: string;
  badgeIconType: 'users' | 'arch' | 'award' | 'code';
  actionText: string;
  actionIconType: 'layers' | 'video' | 'sparkles' | 'guide';
  members: string;
  description: string;
}

interface BotItem {
  id: string;
  name: string;
  gradient: string;
  iconType: 'zap' | 'wand' | 'languages' | 'code';
  badgeColor: string;
  badgeDot: string;
  subtitle: string;
  subIconType: 'palette' | 'film' | 'globe' | 'terminal';
  description: string;
  samplePrompt: string;
}

interface CommentItem {
  id: string;
  user: string;
  text: string;
  timeAgo: string;
}

interface SocialPost {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
    location: string;
    timeAgo: string;
  };
  mediaUrl: string;
  mediaAlt: string;
  likeCount: number;
  likedByPreview: string;
  caption: string;
  tags: string[];
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  comments: CommentItem[];
}

const INITIAL_CHATS: ChatItem[] = [
  {
    id: 'mohan-vit',
    userId: 'user_mohan',
    username: 'mohan_vit',
    name: 'Mohan Vit',
    isCustomAvatar: true,
    avatarChar: 'MV',
    avatarBg: 'bg-gradient-to-tr from-[#3b82f6] via-[#4f46e5] to-[#7c3aed]',
    online: true,
    type: 'photo',
    unread: true,
    lastMessage: 'Smart_Vision_Surveillance_RN_Format.pdf',
  },
  {
    id: 'daniel',
    userId: 'user_daniel',
    username: 'daniel',
    name: 'Daniel',
    avatar: '/images/avatars/avatar-daniel.jpg',
    online: true,
    type: 'photo',
    unread: true,
    lastMessage: 'Sent a project mock screenshot',
  },
  {
    id: 'nixtio',
    userId: 'user_nixtio',
    username: 'nixtio',
    name: 'Nixtio',
    isCustomAvatar: true,
    avatarChar: 'N',
    avatarBg: 'bg-[#1c2438]',
    online: true,
    type: 'video',
    unread: true,
    lastMessage: 'Check out the new design reel',
  },
  {
    id: 'anna',
    userId: 'user_anna',
    username: 'anna',
    name: 'Anna',
    avatar: '/images/avatars/avatar-anna.jpg',
    online: true,
    type: 'photo',
    unread: true,
    lastMessage: 'Photos from today architectural tour',
  },
  {
    id: 'nathan',
    userId: 'user_nathan',
    username: 'nathan',
    name: 'Nathan',
    avatar: '/images/avatars/avatar-marcus.jpg',
    online: true,
    type: 'video',
    unread: true,
    lastMessage: 'Live camera demo session stream',
  },
  {
    id: 'elena',
    userId: 'user_elena',
    username: 'elena',
    name: 'Elena',
    avatar: '/images/avatars/avatar-elena.jpg',
    online: false,
    type: 'photo',
    unread: false,
    lastMessage: 'Linen texture palette exports',
  },
];

const INITIAL_COMMUNITIES: CommunityItem[] = [
  {
    id: 'comm-ui',
    name: 'UI Creators',
    image: '/images/community-ui.jpg',
    badgeBg: 'bg-purple-600',
    badgeIconType: 'users',
    actionText: 'Drops',
    actionIconType: 'layers',
    members: '28.4k members',
    description: 'Weekly design drops, UI kits, design tokens and interface prototypes.',
  },
  {
    id: 'comm-arch',
    name: 'Arch Hub',
    image: '/images/community-arch.jpg',
    badgeBg: 'bg-amber-500',
    badgeIconType: 'arch',
    actionText: 'Live demo',
    actionIconType: 'video',
    members: '16.8k members',
    description: 'Exploring contemporary organic spaces, brutalism, and sustainable habitats.',
  },
  {
    id: 'comm-photo',
    name: 'PhotoPro',
    image: '/images/community-photo.jpg',
    badgeBg: 'bg-emerald-500',
    badgeIconType: 'award',
    actionText: 'Featured',
    actionIconType: 'sparkles',
    members: '42.1k members',
    description: 'Curated gallery of high-shutter street, architecture, and analog photography.',
  },
  {
    id: 'comm-swift',
    name: 'SwiftDev',
    image: '/images/community-swift.jpg',
    badgeBg: 'bg-orange-500',
    badgeIconType: 'code',
    actionText: 'Guide',
    actionIconType: 'guide',
    members: '19.3k members',
    description: 'SwiftUI micro-interactions, gestures, and fluid spring animations.',
  },
];

const INITIAL_BOTS: BotItem[] = [
  {
    id: 'bot-ai-studio',
    name: 'AI Studio',
    gradient: 'from-[#10b981] to-[#047857]',
    iconType: 'zap',
    badgeColor: 'bg-blue-500',
    badgeDot: 'bg-white',
    subtitle: 'Prompt art',
    subIconType: 'palette',
    description: 'Generate high-fidelity photorealistic and architectural concept renders from prompts.',
    samplePrompt: 'Minimalist glass villa on cliffside with infinity pool at dusk',
  },
  {
    id: 'bot-promptgen',
    name: 'PromptGen',
    gradient: 'from-[#a855f7] to-[#6d28d9]',
    iconType: 'wand',
    badgeColor: 'bg-purple-400',
    badgeDot: 'bg-white',
    subtitle: 'Animation',
    subIconType: 'film',
    description: 'Transform still compositions into 60fps dynamic camera flythroughs and loops.',
    samplePrompt: 'Smooth orbital drone camera sweep over curved cantilever balcony',
  },
  {
    id: 'bot-translate',
    name: 'Translate',
    gradient: 'from-[#3b82f6] to-[#1d4ed8]',
    iconType: 'languages',
    badgeColor: 'bg-blue-400',
    badgeDot: 'bg-white',
    subtitle: '40+ langs',
    subIconType: 'globe',
    description: 'Instant multilingual localization for community posts and creative briefs.',
    samplePrompt: 'Translate caption into Japanese, French, and Spanish',
  },
  {
    id: 'bot-codepilot',
    name: 'CodePilot',
    gradient: 'from-[#0f172a] to-[#1e293b]',
    iconType: 'code',
    badgeColor: 'bg-cyan-400',
    badgeDot: 'bg-white',
    subtitle: 'Syntax',
    subIconType: 'terminal',
    description: 'Refactor and validate UI shaders, Tailwind layouts, and responsive components.',
    samplePrompt: 'Generate Tailwind spring animation classes for active bottom bar',
  },
];

const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    author: {
      username: 'oliviamartinez',
      displayName: 'Olivia Martinez',
      avatarUrl: '/images/avatars/avatar-olivia.jpg',
      isVerified: true,
      location: 'San Francisco',
      timeAgo: '2h ago',
    },
    mediaUrl: '/images/post-building.png',
    mediaAlt: 'Futuristic architectural curved white villa with infinity pool and panoramic valley',
    likeCount: 6525,
    likedByPreview: 'kribooo and dianafreya',
    caption: 'Architecture that breathes. Every line tells a story. ✨',
    tags: ['#architecture', '#minimalism', '#design'],
    commentCount: 148,
    likedByMe: false,
    savedByMe: false,
    comments: [
      { id: 'c1', user: 'kribooo', text: 'Incredible form and landscape integration!', timeAgo: '1h ago' },
      { id: 'c2', user: 'dianafreya', text: 'That pool edge reflection is heavenly', timeAgo: '45m ago' },
      { id: 'c3', user: 'kenji_sato', text: 'Stunning organic geometry Olivia', timeAgo: '20m ago' },
    ],
  },
  {
    id: 'post-2',
    author: {
      username: 'kenji_sato',
      displayName: 'Kenji Sato',
      avatarUrl: '/images/avatars/avatar-kenji.jpg',
      isVerified: false,
      location: 'Tokyo, Japan',
      timeAgo: '4h ago',
    },
    mediaUrl: '/images/post-tokyo.jpg',
    mediaAlt: 'Bustling Shinjuku Tokyo night street glowing with neon signs reflected on wet asphalt',
    likeCount: 4210,
    likedByPreview: 'alex_dev and 318 others',
    caption: 'Cyberpunk rains in Shinjuku. Neon reflections never sleep in this city. 🌧️⚡',
    tags: ['#tokyo', '#streetphotography', '#neon', '#night'],
    commentCount: 92,
    likedByMe: false,
    savedByMe: false,
    comments: [
      { id: 'c4', user: 'oliviamartinez', text: 'The atmosphere in Tokyo rain is unmatched', timeAgo: '3h ago' },
      { id: 'c5', user: 'sarahchen', text: 'Blade Runner vibes, gorgeous color palette!', timeAgo: '2h ago' },
      { id: 'c6', user: 'tham28', text: 'What focal length did you shoot this with?', timeAgo: '1h ago' },
    ],
  },
];

export default function SocialPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatItem[]>(INITIAL_CHATS);
  const [posts, setPosts] = useState<SocialPost[]>(INITIAL_POSTS);
  const [followingFilter, setFollowingFilter] = useState<'Following' | 'Friends' | 'Recent' | 'Trending'>('Following');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [animatingHeartPostId, setAnimatingHeartPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active modal states
  const [activeCommunity, setActiveCommunity] = useState<CommunityItem | null>(null);
  const [activeBot, setActiveBot] = useState<BotItem | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<SocialPost | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [joinedCommunities, setJoinedCommunities] = useState<Record<string, boolean>>({
    'comm-ui': true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  const unreadCount = useMemo(() => chats.filter((c) => c.unread).length, [chats]);

  const handleMarkAllRead = () => {
    setChats((prev) => prev.map((c) => ({ ...c, unread: false })));
    showToast('All chats marked as read');
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
          showToast(nextSaved ? 'Saved to collection' : 'Removed from collection');
          return {
            ...post,
            savedByMe: nextSaved,
          };
        }
        return post;
      })
    );
  };

  const handleShare = async (post: SocialPost) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/profile/${post.author.username}`);
        showToast(`Link copied for @${post.author.username}'s post`);
        return;
      } catch {
        // Fallback
      }
    }
    showToast('Link ready to share');
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !activeCommentPost) return;
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      user: 'you',
      text: commentInput.trim(),
      timeAgo: 'Just now',
    };
    const updatedPostId = activeCommentPost.id;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === updatedPostId) {
          return {
            ...p,
            commentCount: p.commentCount + 1,
            comments: [newComment, ...p.comments],
          };
        }
        return p;
      })
    );
    setActiveCommentPost((prev) =>
      prev ? { ...prev, commentCount: prev.commentCount + 1, comments: [newComment, ...prev.comments] } : null
    );
    setCommentInput('');
    showToast('Comment published');
  };

  const handleToggleCommunityJoin = (commId: string, commName: string) => {
    setJoinedCommunities((prev) => {
      const next = !prev[commId];
      showToast(next ? `Joined ${commName}` : `Left ${commName}`);
      return { ...prev, [commId]: next };
    });
  };

  // Filtered lists based on search
  const query = searchQuery.trim().toLowerCase();
  const filteredChats = chats.filter((c) => !query || c.name.toLowerCase().includes(query));
  const filteredCommunities = INITIAL_COMMUNITIES.filter(
    (c) => !query || c.name.toLowerCase().includes(query) || c.actionText.toLowerCase().includes(query)
  );
  const filteredBots = INITIAL_BOTS.filter(
    (b) => !query || b.name.toLowerCase().includes(query) || b.subtitle.toLowerCase().includes(query)
  );
  const filteredPosts = posts.filter((p) => {
    if (!query) return true;
    return (
      p.author.username.toLowerCase().includes(query) ||
      p.caption.toLowerCase().includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-white pb-6 select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg shadow-black/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar: Logo, Brand Text, User Avatar */}
      <header className="w-full h-12 px-4 flex items-center justify-between shrink-0 bg-white sticky top-0 z-30 border-b border-slate-50">
        {/* Left App Logo Icon */}
        <div className="flex items-center justify-start w-9">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="SocialFeed Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Center Brand Title */}
        <div className="flex items-center justify-center">
          <h1 className="font-bold text-[#2563eb] text-lg tracking-tight">
            SocialFeed
          </h1>
        </div>

        {/* Right User Avatar */}
        <div className="flex items-center justify-end w-9">
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full overflow-hidden border border-slate-200/80 shadow-xs active:scale-95 transition-transform"
            aria-label="View your profile"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/avatars/avatar-olivia.jpg"
              alt="My Avatar"
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
      </header>

      {/* 2. Search Bar */}
      <div className="px-4 pt-2 pb-1">
        <div className="w-full h-10 px-3.5 rounded-2xl bg-slate-100/90 border border-transparent focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/15 flex items-center gap-2.5 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats, communities, bots..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 font-normal outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => showToast('Filters: All channels active')}
              className="p-1 text-slate-400 hover:text-slate-600 transition"
              aria-label="Search filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Section: Chats */}
      <section className="pt-3 pb-1">
        {/* Section Header */}
        <div className="px-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Chats</h2>
            {unreadCount > 0 && (
              <span className="bg-[#eaf2ff] text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 active:scale-95 transition"
          >
            Mark all read
          </button>
        </div>

        {/* Horizontal Scroll Cards */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
          {filteredChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              onClick={() => {
                setChats((prev) =>
                  prev.map((c) => (c.id === chat.id ? { ...c, unread: false } : c))
                );
              }}
              className="w-[74px] shrink-0 bg-white rounded-2xl p-2 flex flex-col items-center border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              {/* Avatar with Status Dot */}
              <div className="w-11 h-11 rounded-xl relative overflow-visible flex items-center justify-center">
                {chat.isCustomAvatar ? (
                  <div
                    className={`w-11 h-11 rounded-xl ${chat.avatarBg || 'bg-[#1c2438]'} flex items-center justify-center text-white font-bold text-lg shadow-xs`}
                  >
                    {chat.avatarChar || 'N'}
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {/* Green Online Dot */}
                {chat.online && (
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white absolute -top-0.5 -right-0.5 z-10 shadow-xs" />
                )}
              </div>

              {/* Chat Name */}
              <span className="text-[11px] font-semibold text-slate-900 mt-1.5 truncate w-full text-center">
                {chat.name}
              </span>

              {/* Subtitle / Status */}
              <div className="flex items-center gap-1 justify-center mt-0.5 w-full">
                {chat.type === 'video' ? (
                  <>
                    <Video className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="text-[10px] text-blue-500 font-medium">Video</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-medium">Photo</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Section: Communities */}
      <section className="pt-2 pb-1">
        {/* Section Header */}
        <div className="px-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center gap-1">
              Communities
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 stroke-[2.2]" />
            </h2>
            <span className="text-xs text-slate-400 font-normal">12 active</span>
          </div>
          <button
            type="button"
            onClick={() => showToast('Opening Communities Directory')}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 active:scale-95 transition"
          >
            See all
          </button>
        </div>

        {/* Horizontal Scroll Cards */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
          {filteredCommunities.map((comm) => (
            <div
              key={comm.id}
              onClick={() => setActiveCommunity(comm)}
              className="w-[74px] shrink-0 bg-white rounded-2xl p-2 flex flex-col items-center border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              {/* Thumbnail with Badge */}
              <div className="w-11 h-11 rounded-xl relative overflow-visible flex items-center justify-center">
                <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comm.image}
                    alt={comm.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Small Badge at bottom-right */}
                <div
                  className={`w-4 h-4 rounded-full ${comm.badgeBg} text-white flex items-center justify-center border-2 border-white absolute -bottom-1 -right-1 shadow-xs`}
                >
                  {comm.badgeIconType === 'users' && <Users className="w-2.5 h-2.5" />}
                  {comm.badgeIconType === 'arch' && <Layers className="w-2.5 h-2.5" />}
                  {comm.badgeIconType === 'award' && <Sparkles className="w-2.5 h-2.5" />}
                  {comm.badgeIconType === 'code' && <Code2 className="w-2.5 h-2.5" />}
                </div>
              </div>

              {/* Community Name */}
              <span className="text-[11px] font-semibold text-slate-900 mt-1.5 truncate w-full text-center">
                {comm.name}
              </span>

              {/* Subtitle / Action */}
              <div className="flex items-center gap-1 justify-center mt-0.5 w-full">
                {comm.actionIconType === 'layers' && (
                  <>
                    <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-medium">{comm.actionText}</span>
                  </>
                )}
                {comm.actionIconType === 'video' && (
                  <>
                    <Video className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-medium">{comm.actionText}</span>
                  </>
                )}
                {comm.actionIconType === 'sparkles' && (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-medium">{comm.actionText}</span>
                  </>
                )}
                {comm.actionIconType === 'guide' && (
                  <>
                    <Video className="w-3 h-3 text-orange-500 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-medium">{comm.actionText}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Section: Bots */}
      <section className="pt-2 pb-2">
        {/* Section Header */}
        <div className="px-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center gap-1">
              Bots
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 stroke-[2.2]" />
            </h2>
            <span className="text-xs text-slate-400 font-normal">Smart tools</span>
          </div>
          <button
            type="button"
            onClick={() => showToast('Opening Bot Store')}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 active:scale-95 transition"
          >
            Store
          </button>
        </div>

        {/* Horizontal Scroll Cards */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
          {filteredBots.map((bot) => (
            <div
              key={bot.id}
              onClick={() => setActiveBot(bot)}
              className="w-[74px] shrink-0 bg-white rounded-2xl p-2 flex flex-col items-center border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              {/* Bot Icon Squircle with Badge */}
              <div className="w-11 h-11 rounded-2xl relative overflow-visible flex items-center justify-center">
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${bot.gradient} flex items-center justify-center text-white shadow-xs`}
                >
                  {bot.iconType === 'zap' && <Zap className="w-5 h-5 fill-white/20 stroke-white stroke-[2.2]" />}
                  {bot.iconType === 'wand' && <Wand2 className="w-5 h-5 stroke-white stroke-[2.2]" />}
                  {bot.iconType === 'languages' && <Languages className="w-5 h-5 stroke-white stroke-[2.2]" />}
                  {bot.iconType === 'code' && <Code2 className="w-5 h-5 text-cyan-300 stroke-[2.2]" />}
                </div>

                {/* Dot badge on top-right */}
                <div
                  className={`w-3 h-3 rounded-full ${bot.badgeColor} border-2 border-white absolute -top-0.5 -right-0.5 shadow-xs flex items-center justify-center`}
                >
                  <span className={`w-1 h-1 rounded-full ${bot.badgeDot}`} />
                </div>
              </div>

              {/* Bot Name */}
              <span className="text-[11px] font-semibold text-slate-900 mt-1.5 truncate w-full text-center">
                {bot.name}
              </span>

              {/* Subtitle / Category */}
              <div className="flex items-center gap-1 justify-center mt-0.5 w-full">
                {bot.subIconType === 'palette' && <Palette className="w-3 h-3 text-slate-400 shrink-0" />}
                {bot.subIconType === 'film' && <Film className="w-3 h-3 text-slate-400 shrink-0" />}
                {bot.subIconType === 'globe' && <Globe className="w-3 h-3 text-slate-400 shrink-0" />}
                {bot.subIconType === 'terminal' && <Terminal className="w-3 h-3 text-slate-400 shrink-0" />}
                <span className="text-[10px] text-slate-400 font-medium truncate">{bot.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Section: Contents from friends */}
      <section className="pt-3">
        {/* Section Header */}
        <div className="px-4 flex items-center justify-between mb-3 relative">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
              Contents from friends
            </h2>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Recent posts from your circle
            </p>
          </div>

          {/* Following Pill Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu((prev) => !prev)}
              className="bg-[#eff6ff] text-blue-600 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 border border-blue-100/80 active:scale-95 transition"
            >
              <span>{followingFilter}</span>
              <ChevronDown className="w-3 h-3 stroke-[2.5]" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                {(['Following', 'Friends', 'Recent', 'Trending'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setFollowingFilter(filter);
                      setShowFilterMenu(false);
                      showToast(`Filtered by ${filter}`);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                      followingFilter === filter
                        ? 'font-semibold text-blue-600 bg-blue-50/50'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{filter}</span>
                    {followingFilter === filter && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <article key={post.id} className="w-full">
              {/* Post Author Row */}
              <div className="px-4 flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200/80 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900">
                        {post.author.username}
                      </span>
                      {post.author.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500 stroke-white" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {post.author.location} • {post.author.timeAgo}
                    </span>
                  </div>
                </div>

                {/* More Options */}
                <button
                  type="button"
                  onClick={() => showToast(`Post options for @${post.author.username}`)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full active:scale-95 transition"
                  aria-label="Post options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Media (with double-tap animation) */}
              <div
                className="w-full relative overflow-hidden bg-slate-100 cursor-pointer"
                onDoubleClick={() => handleDoubleTap(post.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.mediaUrl}
                  alt={post.mediaAlt}
                  className="w-full object-cover aspect-[4/3] block"
                  loading="eager"
                />

                {/* Big Animated Center Heart on Double Tap */}
                {animatingHeartPostId === post.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <Heart className="w-20 h-20 text-white fill-white drop-shadow-xl animate-in zoom-in-50 fade-in duration-300" />
                  </div>
                )}
              </div>

              {/* Action Icons Row */}
              <div className="px-4 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Heart / Like */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    className="active:scale-125 transition-transform"
                    aria-label={post.likedByMe ? 'Unlike post' : 'Like post'}
                  >
                    <Heart
                      className={`w-6 h-6 transition-colors ${
                        post.likedByMe
                          ? 'fill-red-500 text-red-500 stroke-red-500'
                          : 'stroke-slate-800 text-slate-800 hover:text-red-500'
                      }`}
                    />
                  </button>

                  {/* Comment */}
                  <button
                    type="button"
                    onClick={() => setActiveCommentPost(post)}
                    className="active:scale-125 transition-transform text-slate-800 hover:text-blue-500"
                    aria-label="Comment on post"
                  >
                    <MessageCircle className="w-6 h-6 stroke-slate-800" />
                  </button>

                  {/* Share / Send */}
                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className="active:scale-125 transition-transform text-slate-800 hover:text-blue-500 -rotate-12"
                    aria-label="Share post"
                  >
                    <Send className="w-6 h-6 stroke-slate-800" />
                  </button>
                </div>

                {/* Bookmark / Save */}
                <button
                  type="button"
                  onClick={() => handleToggleSave(post.id)}
                  className="active:scale-125 transition-transform"
                  aria-label={post.savedByMe ? 'Remove from saved' : 'Save post'}
                >
                  <Bookmark
                    className={`w-6 h-6 transition-colors ${
                      post.savedByMe
                        ? 'fill-slate-900 text-slate-900 stroke-slate-900'
                        : 'stroke-slate-800 text-slate-800 hover:text-slate-600'
                    }`}
                  />
                </button>
              </div>

              {/* Likes Details */}
              <div className="px-4 pt-2">
                <span className="text-xs font-bold text-slate-900 block">
                  {post.likeCount.toLocaleString()} likes
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Liked by <strong className="font-semibold text-slate-900">{post.likedByPreview}</strong>
                </p>
              </div>

              {/* Caption & Tags */}
              <div className="px-4 pt-1">
                <p className="text-xs text-slate-800 leading-relaxed">
                  <strong className="font-semibold text-slate-900 mr-1.5">
                    {post.author.username}
                  </strong>
                  {post.caption}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {post.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Comments Link */}
              <div className="px-4 pt-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCommentPost(post)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  View all {post.commentCount} comments
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MODAL 1: Community Info Sheet */}
      {activeCommunity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[390px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col space-y-4 animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden">
                  <img
                    src={activeCommunity.image}
                    alt={activeCommunity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{activeCommunity.name}</h3>
                  <span className="text-xs text-blue-600 font-semibold">{activeCommunity.members}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveCommunity(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeCommunity.description}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleToggleCommunityJoin(activeCommunity.id, activeCommunity.name)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
                  joinedCommunities[activeCommunity.id]
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/25'
                }`}
              >
                {joinedCommunities[activeCommunity.id] ? 'Joined ✓' : 'Join Community'}
              </button>
              <button
                onClick={() => {
                  showToast('Community invite link copied');
                  setActiveCommunity(null);
                }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Bot Store & Interactive Prompt Sheet */}
      {activeBot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[390px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col space-y-4 animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeBot.gradient} flex items-center justify-center text-white shadow-md`}
                >
                  {activeBot.iconType === 'zap' && <Zap className="w-6 h-6 fill-white/20" />}
                  {activeBot.iconType === 'wand' && <Wand2 className="w-6 h-6" />}
                  {activeBot.iconType === 'languages' && <Languages className="w-6 h-6" />}
                  {activeBot.iconType === 'code' && <Code2 className="w-6 h-6 text-cyan-300" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{activeBot.name}</h3>
                  <span className="text-xs text-emerald-600 font-semibold">Active Agent • {activeBot.subtitle}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveBot(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeBot.description}
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Sample Instruction
              </span>
              <p className="text-xs font-mono text-slate-700">{activeBot.samplePrompt}</p>
            </div>

            <button
              onClick={() => {
                showToast(`Running "${activeBot.samplePrompt}" on ${activeBot.name}...`);
                setActiveBot(null);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition active:scale-98"
            >
              Run Prompt in {activeBot.name}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Comments Sheet */}
      {activeCommentPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[390px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Comments ({activeCommentPost.commentCount})
              </h3>
              <button
                onClick={() => setActiveCommentPost(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3.5 max-h-[340px]">
              {activeCommentPost.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center shrink-0 text-[10px]">
                    {c.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800">
                      <strong className="font-semibold text-slate-900 mr-1.5">{c.user}</strong>
                      {c.text}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{c.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <div className="p-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-100 text-xs px-3.5 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
