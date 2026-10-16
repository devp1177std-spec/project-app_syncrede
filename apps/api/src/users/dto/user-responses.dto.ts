import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRelationshipDto {
  @ApiProperty({ description: 'Whether the current viewer is following this user', example: false })
  isFollowing: boolean;

  @ApiProperty({ description: 'Whether this user is following the current viewer', example: false })
  isFollowedBy: boolean;

  @ApiProperty({ description: 'Whether the viewer is blocked by this user', example: false })
  isBlocked: boolean;

  @ApiPropertyOptional({ description: 'Whether the viewer has blocked this user', example: false })
  isBlocking?: boolean;

  @ApiPropertyOptional({ description: 'Whether the viewer has muted this user', example: false })
  isMuted?: boolean;

  @ApiProperty({ description: 'Whether the viewer has a pending follow request to this user', example: false })
  requested: boolean;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: 'cuid_u12345' })
  id: string;

  @ApiProperty({ example: 'Alex Morgan', nullable: true })
  displayName: string | null;

  @ApiProperty({ example: 'alexmorgan' })
  username: string;

  @ApiProperty({ example: 'Photographer & Visual Creator', nullable: true })
  bio: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/avatars/alex.jpg', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/covers/alex-cover.jpg', nullable: true })
  cover: string | null;

  @ApiProperty({ example: true })
  verified: boolean;

  @ApiProperty({ example: true, description: 'Real-time online presence status from Redis' })
  isOnline: boolean;

  @ApiProperty({ example: false, description: 'Whether this profile is private' })
  isPrivate: boolean;

  @ApiProperty({ example: 1420, description: 'Denormalized count of followers' })
  followerCount: number;

  @ApiProperty({ example: 380, description: 'Denormalized count of followed users' })
  followingCount: number;

  @ApiProperty({ example: 48, description: 'Denormalized count of published posts' })
  postCount: number;

  @ApiProperty({ type: () => UserRelationshipDto })
  relationship: UserRelationshipDto;
}

export class UserGridPostItemDto {
  @ApiProperty({ example: 'cuid_post123' })
  id: string;

  @ApiProperty({ example: 'https://cdn.example.com/media/thumb1.webp', nullable: true })
  thumbUrl: string | null;

  @ApiProperty({ enum: ['IMAGE', 'VIDEO', 'ALBUM'], example: 'IMAGE' })
  type: 'IMAGE' | 'VIDEO' | 'ALBUM';

  @ApiProperty({ example: 3, description: 'Total number of media files in this post' })
  mediaCount: number;

  @ApiProperty({ example: 254 })
  likeCount: number;

  @ApiProperty({ example: 18 })
  commentCount: number;

  @ApiProperty({ example: '2026-10-06T15:30:00.000Z' })
  createdAt: string;
}

export class UserGridPostsResponseDto {
  @ApiProperty({ type: () => [UserGridPostItemDto] })
  items: UserGridPostItemDto[];

  @ApiPropertyOptional({ example: 'eyJpZCI6InBvc3QxMjMiLCJjcmVhdGVkQXQiOiIyMDI2LTEwLTA2VDE1OjMwOjAwLjAwMFoifQ==' })
  nextCursor?: string;

  @ApiProperty({ example: true })
  hasMore: boolean;
}

export class FollowUserItemDto {
  @ApiProperty({ example: 'cuid_user456' })
  id: string;

  @ApiProperty({ example: 'sarah_designer' })
  username: string;

  @ApiProperty({ example: 'Sarah Connor', nullable: true })
  displayName: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/avatars/sarah.jpg', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: 'Design Lead & Art Director', nullable: true })
  bio: string | null;

  @ApiProperty({ example: false })
  verified: boolean;

  @ApiProperty({
    example: { isFollowing: true, isFollowedBy: false, requested: false },
    description: 'Viewer relationship with this user in the list (no client N+1)',
  })
  relationship: {
    isFollowing: boolean;
    isFollowedBy: boolean;
    requested: boolean;
  };
}

export class FollowListResponseDto {
  @ApiProperty({ type: () => [FollowUserItemDto] })
  items: FollowUserItemDto[];

  @ApiPropertyOptional({ example: 'eyJpZCI6InVzZXI0NTYifQ==' })
  nextCursor?: string;

  @ApiProperty({ example: true })
  hasMore: boolean;
}

export class FollowActionResultDto {
  @ApiProperty({ enum: ['FOLLOWING', 'REQUESTED', 'NONE'], example: 'FOLLOWING' })
  status: 'FOLLOWING' | 'REQUESTED' | 'NONE';

  @ApiProperty({
    example: { isFollowing: true, requested: false },
  })
  relationship: {
    isFollowing: boolean;
    requested: boolean;
  };
}

export class FollowRequestItemDto {
  @ApiProperty({ example: 'cuid_req789' })
  id: string;

  @ApiProperty({
    example: {
      id: 'cuid_user123',
      username: 'john_doe',
      displayName: 'John Doe',
      avatar: 'https://cdn.example.com/avatars/john.jpg',
      verified: false,
    },
  })
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };

  @ApiProperty({ example: '2026-10-06T15:30:00.000Z' })
  createdAt: string;
}

export class VerificationRequestResponseDto {
  @ApiProperty({ example: 'cuid_vr123' })
  id: string;

  @ApiProperty({ example: 'cuid_u12345' })
  userId: string;

  @ApiProperty({ enum: ['CREATOR', 'BUSINESS', 'PUBLIC_FIGURE', 'ORGANIZATION'], example: 'CREATOR' })
  category: string;

  @ApiProperty({ example: 'Alex Morgan' })
  legalName: string;

  @ApiProperty({ example: 'PASSPORT' })
  documentType: string;

  @ApiProperty({ example: 'https://cdn.example.com/verification/docs/passport.jpg' })
  documentUrl: string;

  @ApiPropertyOptional({ example: 'Verified Twitter handle @alexmorgan' })
  additionalInfo?: string | null;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'PENDING' })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: null, nullable: true })
  rejectionReason?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  reviewedAt?: string | null;

  @ApiProperty({ example: '2026-10-06T15:30:00.000Z' })
  createdAt: string;
}
