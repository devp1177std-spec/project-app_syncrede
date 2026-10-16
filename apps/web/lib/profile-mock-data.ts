import { UserProfileResponse, UserGridPostItem } from '@social/types';

export const MOCK_OWN_PROFILE: UserProfileResponse = {
  id: 'user_own',
  displayName: 'My Profile',
  username: 'oliviamartinez',
  bio: 'Spatial architect & minimalist designer based in San Francisco. Documenting forms & light.',
  avatar: '/images/avatars/avatar-olivia.jpg',
  cover: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%)',
  verified: true,
  isOnline: true,
  isPrivate: false,
  followerCount: 48200,
  followingCount: 1120,
  postCount: 184,
  relationship: {
    isFollowing: false,
    isFollowedBy: false,
    isBlocked: false,
    isBlocking: false,
    isMuted: false,
    requested: false,
  },
};

export const MOCK_PROFILES_DATABASE: Record<string, UserProfileResponse> = {
  user_mohan: {
    id: 'user_mohan',
    displayName: 'Mohan Vit',
    username: 'mohan_vit',
    bio: 'Systems architect & distributed systems engineer. Researching automated surveillance, block diagrams & microservices.',
    avatar: null, // Renders gradient avatar with 'MV'
    cover: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 50%, #7C3AED 100%)',
    verified: true,
    isOnline: true,
    isPrivate: false,
    followerCount: 15400,
    followingCount: 320,
    postCount: 28,
    relationship: {
      isFollowing: true,
      isFollowedBy: true,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_daniel: {
    id: 'user_daniel',
    displayName: 'Daniel',
    username: 'daniel',
    bio: 'Senior product designer & UI specialist. Passionate about tactile feedback, design systems, and mobile interfaces.',
    avatar: '/images/avatars/avatar-daniel.jpg',
    cover: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
    verified: true,
    isOnline: true,
    isPrivate: false,
    followerCount: 24300,
    followingCount: 680,
    postCount: 52,
    relationship: {
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_nixtio: {
    id: 'user_nixtio',
    displayName: 'Nixtio',
    username: 'nixtio',
    bio: '3D motion design studio & digital creator. Exploring procedural animations, dark mode shaders, and loop video reels.',
    avatar: null, // Renders dark 'N' avatar
    cover: 'linear-gradient(135deg, #1E293B 0%, #0F172A 50%, #020617 100%)',
    verified: true,
    isOnline: true,
    isPrivate: false,
    followerCount: 62000,
    followingCount: 140,
    postCount: 89,
    relationship: {
      isFollowing: true,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_anna: {
    id: 'user_anna',
    displayName: 'Anna',
    username: 'anna',
    bio: 'Creative director & visual artist based in London. Documenting studio lighting, contemporary spaces, and architectural tours.',
    avatar: '/images/avatars/avatar-anna.jpg',
    cover: 'linear-gradient(135deg, #EC4899 0%, #BE185D 50%, #9D174D 100%)',
    verified: false,
    isOnline: true,
    isPrivate: false,
    followerCount: 9800,
    followingCount: 410,
    postCount: 37,
    relationship: {
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_nathan: {
    id: 'user_nathan',
    displayName: 'Nathan',
    username: 'nathan',
    bio: 'Camera operator & live demo streaming technician. Building high-frame-rate mobile workflows and gimbal configurations.',
    avatar: '/images/avatars/avatar-marcus.jpg',
    cover: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
    verified: false,
    isOnline: true,
    isPrivate: false,
    followerCount: 11200,
    followingCount: 530,
    postCount: 44,
    relationship: {
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_elena: {
    id: 'user_elena',
    displayName: 'Elena',
    username: 'elena',
    bio: 'Textile researcher & materials curator in Milan. Exploring sustainable raw linen weaves, alpaca fleece, and earth pigments.',
    avatar: '/images/avatars/avatar-elena.jpg',
    cover: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 50%, #5B21B6 100%)',
    verified: true,
    isOnline: false,
    isPrivate: false,
    followerCount: 31800,
    followingCount: 790,
    postCount: 112,
    relationship: {
      isFollowing: true,
      isFollowedBy: true,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_olivia: {
    id: 'user_olivia',
    displayName: 'Olivia Martinez',
    username: 'oliviamartinez',
    bio: 'Spatial architect & minimalist designer based in San Francisco. Documenting forms & light.',
    avatar: '/images/avatars/avatar-olivia.jpg',
    cover: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%)',
    verified: true,
    isOnline: true,
    isPrivate: false,
    followerCount: 48200,
    followingCount: 1120,
    postCount: 184,
    relationship: {
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_kenji: {
    id: 'user_kenji',
    displayName: 'Kenji Sato',
    username: 'kenji_sato',
    bio: 'Street photographer in Tokyo. Chasing cyberpunk neon reflections, night rain, and urban mood in Shinjuku.',
    avatar: '/images/avatars/avatar-kenji.jpg',
    cover: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 50%, #0E7490 100%)',
    verified: false,
    isOnline: true,
    isPrivate: false,
    followerCount: 18400,
    followingCount: 460,
    postCount: 65,
    relationship: {
      isFollowing: true,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_sarah: {
    id: 'user_sarah',
    displayName: 'Sarah Chen',
    username: 'sarahchen',
    bio: 'Product architect & community lead. Crafting modern digital commerce experiences and specialty coffee notes.',
    avatar: '/images/avatars/avatar-sarah.jpg',
    cover: 'linear-gradient(135deg, #10B981 0%, #047857 50%, #064E3B 100%)',
    verified: true,
    isOnline: true,
    isPrivate: false,
    followerCount: 12400,
    followingCount: 540,
    postCount: 62,
    relationship: {
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
  user_marcus: {
    id: 'user_marcus',
    displayName: 'Marcus Vance',
    username: 'marcus_v',
    bio: 'Minimalist design systems & mobile architectures. Hudson Yards & Manhattan skyline explorer.',
    avatar: '/images/avatars/avatar-marcus.jpg',
    cover: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%)',
    verified: false,
    isOnline: false,
    isPrivate: false,
    followerCount: 8900,
    followingCount: 310,
    postCount: 45,
    relationship: {
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  },
};

export function getMockProfile(identifier?: string, isOwn = false): UserProfileResponse {
  if (isOwn) {
    return MOCK_OWN_PROFILE;
  }

  if (!identifier) {
    return MOCK_PROFILES_DATABASE.user_olivia;
  }

  const clean = identifier.trim().toLowerCase();

  // 1. Direct key match (e.g., 'user_daniel' or 'user_mohan')
  if (MOCK_PROFILES_DATABASE[clean]) {
    return MOCK_PROFILES_DATABASE[clean];
  }

  // 2. ID match (e.g. matching profile.id)
  const byId = Object.values(MOCK_PROFILES_DATABASE).find(
    (p) => p.id.toLowerCase() === clean
  );
  if (byId) return byId;

  // 3. Username match (e.g., 'daniel', 'mohan_vit', 'mohan-vit', 'nixtio')
  const byUsername = Object.values(MOCK_PROFILES_DATABASE).find(
    (p) =>
      p.username.toLowerCase() === clean ||
      p.username.toLowerCase().replace(/_/g, '-') === clean.replace(/_/g, '-')
  );
  if (byUsername) return byUsername;

  // 4. Name match (e.g., 'Daniel', 'Mohan Vit')
  const byName = Object.values(MOCK_PROFILES_DATABASE).find(
    (p) => p.displayName?.toLowerCase() === clean
  );
  if (byName) return byName;

  // 5. Dynamically construct a personalized profile for any unseeded ID
  const readableName = identifier
    .replace(/^user_/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: identifier,
    displayName: readableName,
    username: identifier.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    bio: `Active creator & community member. Sharing moments & collaborations on SocialFeed.`,
    avatar: `/images/avatars/avatar-${identifier.replace(/^user_/, '')}.jpg`,
    cover: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%)',
    verified: false,
    isOnline: true,
    isPrivate: false,
    followerCount: 1420,
    followingCount: 380,
    postCount: 12,
    relationship: {
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    },
  };
}

export const USER_SPECIFIC_POSTS: Record<string, UserGridPostItem[]> = {
  user_mohan: [
    {
      id: 'mohan_1',
      thumbUrl: '/images/community-arch.jpg',
      type: 'ALBUM',
      mediaCount: 3,
      likeCount: 3420,
      commentCount: 94,
      createdAt: '2026-10-14T10:00:00.000Z',
    },
    {
      id: 'mohan_2',
      thumbUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
      type: 'IMAGE',
      mediaCount: 1,
      likeCount: 1850,
      commentCount: 42,
      createdAt: '2026-10-12T14:30:00.000Z',
    },
    {
      id: 'mohan_3',
      thumbUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
      type: 'IMAGE',
      mediaCount: 1,
      likeCount: 2240,
      commentCount: 68,
      createdAt: '2026-10-10T09:15:00.000Z',
    },
  ],
  user_daniel: [
    {
      id: 'dan_1',
      thumbUrl: '/images/community-ui.jpg',
      type: 'ALBUM',
      mediaCount: 4,
      likeCount: 4120,
      commentCount: 128,
      createdAt: '2026-10-14T16:00:00.000Z',
    },
    {
      id: 'dan_2',
      thumbUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600&auto=format&fit=crop',
      type: 'IMAGE',
      mediaCount: 1,
      likeCount: 2950,
      commentCount: 84,
      createdAt: '2026-10-11T12:00:00.000Z',
    },
    {
      id: 'dan_3',
      thumbUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=600&auto=format&fit=crop',
      type: 'IMAGE',
      mediaCount: 1,
      likeCount: 1720,
      commentCount: 39,
      createdAt: '2026-10-09T08:30:00.000Z',
    },
  ],
  user_nixtio: [
    {
      id: 'nix_1',
      thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
      type: 'VIDEO',
      mediaCount: 1,
      likeCount: 8940,
      commentCount: 312,
      createdAt: '2026-10-13T20:00:00.000Z',
    },
    {
      id: 'nix_2',
      thumbUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop',
      type: 'IMAGE',
      mediaCount: 1,
      likeCount: 5410,
      commentCount: 198,
      createdAt: '2026-10-11T17:15:00.000Z',
    },
  ],
  user_anna: [
    {
      id: 'anna_1',
      thumbUrl: '/images/community-photo.jpg',
      type: 'IMAGE',
      mediaCount: 1,
      likeCount: 2140,
      commentCount: 65,
      createdAt: '2026-10-13T11:00:00.000Z',
    },
    {
      id: 'anna_2',
      thumbUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      type: 'ALBUM',
      mediaCount: 3,
      likeCount: 3820,
      commentCount: 114,
      createdAt: '2026-10-08T15:45:00.000Z',
    },
  ],
  user_kenji: [
    {
      id: 'kenji_1',
      thumbUrl: '/images/post-tokyo.jpg',
      type: 'IMAGE',
      mediaCount: 1,
      likeCount: 4210,
      commentCount: 92,
      createdAt: '2026-10-15T12:00:00.000Z',
    },
    {
      id: 'kenji_2',
      thumbUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=600&auto=format&fit=crop',
      type: 'IMAGE',
      mediaCount: 1,
      likeCount: 3120,
      commentCount: 78,
      createdAt: '2026-10-10T19:00:00.000Z',
    },
  ],
};

export const MOCK_GRID_POSTS: UserGridPostItem[] = [
  {
    id: 'post_1',
    thumbUrl: '/images/post-building.png',
    type: 'ALBUM',
    mediaCount: 3,
    likeCount: 6525,
    commentCount: 148,
    createdAt: '2026-10-15T14:00:00.000Z',
  },
  {
    id: 'post_2',
    thumbUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop',
    type: 'IMAGE',
    mediaCount: 1,
    likeCount: 1420,
    commentCount: 48,
    createdAt: '2026-10-06T12:00:00.000Z',
  },
  {
    id: 'post_3',
    thumbUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop',
    type: 'IMAGE',
    mediaCount: 1,
    likeCount: 950,
    commentCount: 22,
    createdAt: '2026-10-05T15:30:00.000Z',
  },
  {
    id: 'post_4',
    thumbUrl: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=600&auto=format&fit=crop',
    type: 'VIDEO',
    mediaCount: 1,
    likeCount: 3200,
    commentCount: 114,
    createdAt: '2026-10-04T09:15:00.000Z',
  },
  {
    id: 'post_5',
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
    type: 'IMAGE',
    mediaCount: 1,
    likeCount: 1640,
    commentCount: 52,
    createdAt: '2026-10-02T11:20:00.000Z',
  },
];

export function getMockUserPosts(identifier?: string, sort = 'latest'): UserGridPostItem[] {
  if (!identifier) return [...MOCK_GRID_POSTS];

  const clean = identifier.trim().toLowerCase();

  // Check specific post collections by ID or username
  let posts: UserGridPostItem[] = [];
  if (USER_SPECIFIC_POSTS[clean]) {
    posts = [...USER_SPECIFIC_POSTS[clean]];
  } else {
    // Check if matching any profile key
    const profile = getMockProfile(identifier);
    if (USER_SPECIFIC_POSTS[profile.id]) {
      posts = [...USER_SPECIFIC_POSTS[profile.id]];
    } else {
      posts = [...MOCK_GRID_POSTS];
    }
  }

  if (sort === 'popular') {
    posts.sort((a, b) => b.likeCount - a.likeCount);
  } else if (sort === 'old') {
    posts.reverse();
  }

  return posts;
}
