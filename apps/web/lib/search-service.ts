export interface SearchUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  isVerified: boolean;
  followersCount: number;
  isFollowing: boolean;
}

export type RecentItemType = 'user' | 'query';

export interface RecentSearchItem {
  id: string;
  type: RecentItemType;
  query?: string;
  user?: SearchUser;
  timestamp: number;
}

const STORAGE_KEY = 'recentSearches';

export const MOCK_SEARCH_USERS: SearchUser[] = [
  {
    id: 'user-1',
    username: 'oliviamartinez',
    fullName: 'Olivia Martinez',
    avatarUrl: '/images/avatars/avatar-olivia.jpg',
    isVerified: true,
    followersCount: 48200,
    isFollowing: true,
  },
  {
    id: 'user-2',
    username: 'elena_m',
    fullName: 'Elena Rostova',
    avatarUrl: '/images/avatars/avatar-elena.jpg',
    isVerified: true,
    followersCount: 34200,
    isFollowing: false,
  },
  {
    id: 'user-3',
    username: 'clayclare',
    fullName: 'Clare Clayborne',
    avatarUrl: '/images/avatars/avatar-clare.jpg',
    isVerified: true,
    followersCount: 21300,
    isFollowing: true,
  },
  {
    id: 'user-4',
    username: 'ssm_2y',
    fullName: 'Samir Sethi',
    avatarUrl: '/images/avatars/avatar-samir.jpg',
    isVerified: false,
    followersCount: 18450,
    isFollowing: true,
  },
  {
    id: 'user-5',
    username: 'maya_d',
    fullName: 'Maya Patel',
    avatarUrl: '/images/avatars/avatar-rosy.jpg',
    isVerified: true,
    followersCount: 15600,
    isFollowing: false,
  },
  {
    id: 'user-6',
    username: 'patyo',
    fullName: 'Patrick Morales',
    avatarUrl: '/images/avatars/avatar-patrick.jpg',
    isVerified: false,
    followersCount: 15100,
    isFollowing: false,
  },
  {
    id: 'user-7',
    username: 'sarahchen',
    fullName: 'Sarah Chen',
    avatarUrl: '/images/avatars/avatar-sarah.jpg',
    isVerified: true,
    followersCount: 12400,
    isFollowing: true,
  },
  {
    id: 'user-8',
    username: 'marcus_v',
    fullName: 'Marcus Vance',
    avatarUrl: '/images/avatars/avatar-marcus.jpg',
    isVerified: false,
    followersCount: 11200,
    isFollowing: true,
  },
  {
    id: 'user-9',
    username: 'rosy_me',
    fullName: 'Rosy Mendez',
    avatarUrl: '/images/avatars/avatar-rosy.jpg',
    isVerified: true,
    followersCount: 9320,
    isFollowing: true,
  },
  {
    id: 'user-10',
    username: 'alex_dev',
    fullName: 'Alex Rivera',
    avatarUrl: '/images/avatars/avatar-alex.jpg',
    isVerified: false,
    followersCount: 7560,
    isFollowing: false,
  },
  {
    id: 'user-11',
    username: 'tham28',
    fullName: 'Thomas Anderson',
    avatarUrl: '/images/avatars/avatar-thomas.jpg',
    isVerified: false,
    followersCount: 6400,
    isFollowing: false,
  },
];

/**
 * Format follower numbers for clean social UI badges (e.g. 48.2k, 1.2M, 932)
 */
export function formatFollowersCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toLocaleString();
}

/**
 * Get top suggested people ranked by follower count or popularity
 */
export async function getSuggestedUsers(limit = 5): Promise<SearchUser[]> {
  // Simulate slight async network delay
  await new Promise((resolve) => setTimeout(resolve, 60));
  return [...MOCK_SEARCH_USERS]
    .sort((a, b) => b.followersCount - a.followersCount)
    .slice(0, limit);
}

/**
 * Search users by username or full name with prefix-matching ranking
 */
export async function searchUsers(
  query: string,
  limit = 6,
  signal?: AbortSignal
): Promise<SearchUser[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  // Simulate network roundtrip latency with abort signal support
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 80);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }
  });

  // Calculate score for ranking: lower number = better match
  const scored = MOCK_SEARCH_USERS.map((user) => {
    const u = user.username.toLowerCase();
    const f = user.fullName.toLowerCase();

    let score = 999;
    if (u === trimmed || f === trimmed) {
      score = 0; // Exact match
    } else if (u.startsWith(trimmed)) {
      score = 1; // Username prefix match
    } else if (f.startsWith(trimmed)) {
      score = 2; // Full name prefix match
    } else if (u.includes(trimmed)) {
      score = 3; // Username substring match
    } else if (f.includes(trimmed)) {
      score = 4; // Full name substring match
    }

    return { user, score };
  })
    .filter((item) => item.score < 999)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.user.followersCount - a.user.followersCount;
    });

  return scored.slice(0, limit).map((item) => item.user);
}

/**
 * LocalStorage Recent Searches Management
 */
export function getRecentSearches(): RecentSearchItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 5);
    }
    return [];
  } catch {
    return [];
  }
}

export function addRecentSearch(
  item:
    | { type: 'user'; user: SearchUser }
    | { type: 'query'; query: string }
): RecentSearchItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getRecentSearches();

    const newItem: RecentSearchItem = {
      id: item.type === 'user' ? `user-${item.user.id}` : `query-${item.query.trim().toLowerCase()}`,
      type: item.type,
      user: item.type === 'user' ? item.user : undefined,
      query: item.type === 'query' ? item.query.trim() : undefined,
      timestamp: Date.now(),
    };

    // De-duplicate: filter out matching item if it already exists
    const filtered = current.filter((existing) => {
      if (newItem.type === 'user' && existing.type === 'user') {
        return existing.user?.username.toLowerCase() !== newItem.user?.username.toLowerCase();
      }
      if (newItem.type === 'query' && existing.type === 'query') {
        return existing.query?.toLowerCase() !== newItem.query?.toLowerCase();
      }
      return true;
    });

    const updated = [newItem, ...filtered].slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeRecentSearch(id: string): RecentSearchItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getRecentSearches();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAllRecentSearches(): RecentSearchItem[] {
  if (typeof window === 'undefined') return [];
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch {
    return [];
  }
}
