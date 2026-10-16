// Standard API Response Structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
}

// User Entity
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  isVerified: boolean;
  onboardingCompletedAt?: Date | string | null;
  onboardingSkipped?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UsernameCheckResponse {
  available: boolean;
  suggestions?: string[];
}

// Post Entity (Baseline)
export interface PostEntity {
  id: string;
  authorId: string;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Cursor Pagination Query
export interface CursorPaginationDto {
  cursor?: string;
  limit?: number;
}

// Presigned URL Response
export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresIn: number;
}

// Health Check Response
export interface HealthStatusResponse {
  status: 'ok' | 'error';
  info?: Record<string, unknown>;
  error?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

// Socket Events Definition
export enum SocketEvents {
  // Connection / Presence
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',

  // Chat
  JOIN_CONVERSATION = 'chat:join',
  LEAVE_CONVERSATION = 'chat:leave',
  SEND_MESSAGE = 'chat:send_message',
  NEW_MESSAGE = 'chat:new_message',
  TYPING_START = 'chat:typing_start',
  TYPING_STOP = 'chat:typing_stop',

  // Notifications
  NEW_NOTIFICATION = 'notification:new',
}

// User Relationship (Viewer -> Target)
export interface UserRelationship {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isBlocked: boolean;
  isBlocking?: boolean;
  isMuted?: boolean;
  requested: boolean;
}

// Complete User Profile (Single-Call Mobile Response)
export interface UserProfileResponse {
  id: string;
  displayName: string | null;
  username: string;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  verified: boolean;
  isOnline: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  relationship: UserRelationship;
}

// User Post Grid Item (Mobile 3-Column Grid)
export type PostMediaType = 'IMAGE' | 'VIDEO' | 'ALBUM';

export interface UserGridPostItem {
  id: string;
  thumbUrl: string | null;
  type: PostMediaType;
  mediaCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

// User Post Grid Response with Cursor Pagination
export interface UserGridPostsResponse {
  items: UserGridPostItem[];
  nextCursor?: string;
  hasMore: boolean;
}

// Following / Followers Tab Item
export interface FollowUserItem {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  verified: boolean;
  relationship: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    requested: boolean;
  };
}

// Follow / Followers Paginated Response
export interface FollowListResponse {
  items: FollowUserItem[];
  nextCursor?: string;
  hasMore: boolean;
}

// Follow / Unfollow Action Result
export type FollowStatus = 'FOLLOWING' | 'REQUESTED' | 'NONE';

export interface FollowActionResult {
  status: FollowStatus;
  relationship: {
    isFollowing: boolean;
    requested: boolean;
  };
}

// Incoming Follow Request Item
export interface FollowRequestItem {
  id: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };
  createdAt: string;
}

// Verification Request DTO
export type VerificationCategory = 'CREATOR' | 'BUSINESS' | 'PUBLIC_FIGURE' | 'ORGANIZATION';
export type VerificationStatusType = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationRequestResponse {
  id: string;
  userId: string;
  category: string;
  legalName: string;
  documentType: string;
  documentUrl: string;
  additionalInfo?: string | null;
  status: VerificationStatusType;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

