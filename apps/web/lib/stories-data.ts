export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration?: number; // In milliseconds, default 5000ms
  timestamp: string; // Relative time (e.g. "2h ago")
  caption?: string;
  location?: string;
  linkText?: string;
  linkUrl?: string;
}

export interface UserStoryGroup {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  image: string; // Preview image for the home feed story circle/ring
  hasUnseen?: boolean;
  stories: StoryItem[];
}

export const USER_STORIES: UserStoryGroup[] = [
  {
    id: 'story-user-1',
    username: 'rosy_me',
    displayName: 'Rosy Mendez',
    avatarUrl: '/images/avatars/avatar-rosy.jpg',
    isVerified: true,
    image: '/images/stories/story-rosy.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-rosy-1',
        mediaUrl: '/images/stories/story-rosy.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '2h ago',
        location: 'Barcelona, Spain',
        caption: 'Morning studio lighting test in Barcelona ✨',
      },
      {
        id: 'story-rosy-2',
        mediaUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop',
        mediaType: 'image',
        duration: 5000,
        timestamp: '45m ago',
        location: 'Barcelona, Spain',
        caption: 'Handcrafted oak detailing meets natural limestone and soft linen.',
      },
    ],
  },
  {
    id: 'story-user-2',
    username: 'ssm_2y',
    displayName: 'Samir Sethi',
    avatarUrl: '/images/avatars/avatar-samir.jpg',
    isVerified: false,
    image: '/images/stories/story-samir.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-samir-1',
        mediaUrl: '/images/stories/story-samir.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '3h ago',
        location: 'Tokyo, Japan',
        caption: 'Night walk through the neon alleys of Shibuya 🌙',
      },
      {
        id: 'story-samir-2',
        mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
        mediaType: 'image',
        duration: 5000,
        timestamp: '1h ago',
        location: 'Tokyo, Japan',
        caption: 'Sub-second latency achieved. All tests passing! 🚀',
      },
    ],
  },
  {
    id: 'story-user-3',
    username: 'tham28',
    displayName: 'Thomas Anderson',
    avatarUrl: '/images/avatars/avatar-thomas.jpg',
    isVerified: false,
    image: '/images/stories/story-thomas.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-thomas-1',
        mediaUrl: '/images/stories/story-thomas.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '5h ago',
        location: 'Austin, TX',
        caption: 'Pre-show soundcheck in Austin!',
      },
      {
        id: 'story-thomas-2',
        mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
        mediaType: 'image',
        duration: 5000,
        timestamp: '3h ago',
        location: 'Austin, TX',
        caption: 'Editing episode #42 on tactile micro-interactions 🎙️',
      },
      {
        id: 'story-thomas-3',
        mediaUrl: '/images/story-tham28.png',
        mediaType: 'image',
        duration: 5000,
        timestamp: '1h ago',
        location: 'Austin, TX',
        caption: 'Full design podcast drops tonight at 6 PM!',
      },
    ],
  },
  {
    id: 'story-user-4',
    username: 'clayclare',
    displayName: 'Clare Clayborne',
    avatarUrl: '/images/avatars/avatar-clare.jpg',
    isVerified: true,
    image: '/images/stories/story-clare.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-clare-1',
        mediaUrl: '/images/stories/story-clare.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '6h ago',
        location: 'Kyoto, Japan',
        caption: 'Morning studio calm in Kyoto 🍵',
      },
      {
        id: 'story-clare-2',
        mediaUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop',
        mediaType: 'image',
        duration: 5000,
        timestamp: '2h ago',
        location: 'Kyoto, Japan',
        caption: 'Fresh batch of matte stoneware vessels coming out of the gas kiln today.',
      },
    ],
  },
  {
    id: 'story-user-5',
    username: 'patyo',
    displayName: 'Patrick Morales',
    avatarUrl: '/images/avatars/avatar-patrick.jpg',
    isVerified: false,
    image: '/images/stories/story-patyo.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-patyo-1',
        mediaUrl: '/images/stories/story-patyo.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '7h ago',
        location: 'Lisbon, Portugal',
        caption: 'Overlooking the terracotta rooftops of Alfama 🇵🇹',
      },
      {
        id: 'story-patyo-2',
        mediaUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
        mediaType: 'image',
        duration: 5000,
        timestamp: '4h ago',
        location: 'Lisbon, Portugal',
        caption: 'Golden hour on the stone terrace.',
      },
      {
        id: 'story-patyo-3',
        mediaUrl: '/images/story-patyo2.png',
        mediaType: 'image',
        duration: 5000,
        timestamp: '1h ago',
        location: 'Lisbon, Portugal',
        caption: 'Sunset over the Atlantic breeze 🌅',
      },
    ],
  },
  {
    id: 'story-user-6',
    username: 'sarahchen',
    displayName: 'Sarah Chen',
    avatarUrl: '/images/avatars/avatar-sarah.jpg',
    isVerified: true,
    image: '/images/stories/story-sarah.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-sarah-1',
        mediaUrl: '/images/stories/story-sarah.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '8h ago',
        location: 'Seattle, WA',
        caption: 'Espresso cupping session at the roastery ☕',
      },
      {
        id: 'story-sarah-2',
        mediaUrl: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800',
        mediaType: 'image',
        duration: 5000,
        timestamp: '3h ago',
        location: 'Seattle, WA',
        caption: 'Single origin Ethiopian pour-over notes: jasmine florals & citrus.',
      },
    ],
  },
  {
    id: 'story-user-7',
    username: 'marcus_v',
    displayName: 'Marcus Vance',
    avatarUrl: '/images/avatars/avatar-marcus.jpg',
    isVerified: false,
    image: '/images/stories/story-marcus.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-marcus-1',
        mediaUrl: '/images/stories/story-marcus.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '9h ago',
        location: 'New York, NY',
        caption: 'Morning commute slicing through Hudson Yards.',
      },
      {
        id: 'story-marcus-2',
        mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
        mediaType: 'image',
        duration: 5000,
        timestamp: '5h ago',
        location: 'New York, NY',
        caption: 'Structural glass reflections and sheer verticality.',
      },
    ],
  },
  {
    id: 'story-user-8',
    username: 'elena_m',
    displayName: 'Elena Rostova',
    avatarUrl: '/images/avatars/avatar-elena.jpg',
    isVerified: true,
    image: '/images/stories/story-elena.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-elena-1',
        mediaUrl: '/images/stories/story-elena.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '11h ago',
        location: 'Milan, Italy',
        caption: 'Editorial texture palette research for Autumn collection.',
      },
      {
        id: 'story-elena-2',
        mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
        mediaType: 'image',
        duration: 5000,
        timestamp: '6h ago',
        location: 'Milan, Italy',
        caption: 'Heavy raw linen with natural earth-pigment dyes.',
      },
    ],
  },
  {
    id: 'story-user-9',
    username: 'alex_dev',
    displayName: 'Alex Rivera',
    avatarUrl: '/images/avatars/avatar-alex.jpg',
    isVerified: false,
    image: '/images/stories/story-alex.jpg',
    hasUnseen: true,
    stories: [
      {
        id: 'story-alex-1',
        mediaUrl: '/images/stories/story-alex.jpg',
        mediaType: 'image',
        duration: 5000,
        timestamp: '14h ago',
        location: 'Berlin, Germany',
        caption: 'Custom IoT monitor PCBs arrived from fabrication! ⚡',
      },
      {
        id: 'story-alex-2',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
        mediaType: 'image',
        duration: 5000,
        timestamp: '7h ago',
        location: 'Berlin, Germany',
        caption: 'SMD reflow solder looks clean. Ready for firmware flashing.',
      },
    ],
  },
];

/**
 * Story Service Helpers - easy to replace with API calls when backend story support lands.
 */
export function getAllStoryGroups(): UserStoryGroup[] {
  return USER_STORIES;
}

export function getStoryGroupByUsername(username: string): UserStoryGroup | undefined {
  const normalized = username.toLowerCase().trim();
  return USER_STORIES.find((u) => u.username.toLowerCase() === normalized);
}

export function getAdjacentStoryUsers(currentUsername: string): {
  prevUser?: UserStoryGroup;
  nextUser?: UserStoryGroup;
  currentIndex: number;
} {
  const normalized = currentUsername.toLowerCase().trim();
  const currentIndex = USER_STORIES.findIndex((u) => u.username.toLowerCase() === normalized);

  if (currentIndex === -1) {
    return { currentIndex: -1 };
  }

  const prevUser = currentIndex > 0 ? USER_STORIES[currentIndex - 1] : undefined;
  const nextUser = currentIndex < USER_STORIES.length - 1 ? USER_STORIES[currentIndex + 1] : undefined;

  return { prevUser, nextUser, currentIndex };
}
