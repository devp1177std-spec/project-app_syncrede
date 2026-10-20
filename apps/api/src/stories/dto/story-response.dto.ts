import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoryItemResponseDto {
  @ApiProperty({ example: 'clx123abc' })
  id: string;

  @ApiProperty({ example: 'usr_456def' })
  userId: string;

  @ApiProperty({ example: 'https://cdn.example.com/stories/story-1.jpg' })
  mediaUrl: string;

  @ApiProperty({ enum: ['IMAGE', 'VIDEO'], example: 'IMAGE' })
  mediaType: 'IMAGE' | 'VIDEO';

  @ApiProperty({ example: 5000 })
  duration: number;

  @ApiPropertyOptional({ example: 'Studio morning vibes ✨' })
  caption?: string | null;

  @ApiPropertyOptional({ example: 'Barcelona, Spain' })
  location?: string | null;

  @ApiPropertyOptional({ example: 'Visit Portfolio' })
  linkText?: string | null;

  @ApiPropertyOptional({ example: 'https://rosymendez.design' })
  linkUrl?: string | null;

  @ApiProperty({ example: 42 })
  viewCount: number;

  @ApiProperty({ example: false })
  hasViewed: boolean;

  @ApiProperty({ example: '2026-10-20T22:00:00.000Z' })
  expiresAt: string;

  @ApiProperty({ example: '2026-10-19T22:00:00.000Z' })
  createdAt: string;
}

export class UserStoryGroupResponseDto {
  @ApiProperty({ example: 'story-grp-1' })
  id: string;

  @ApiProperty({ example: 'usr_456def' })
  userId: string;

  @ApiProperty({ example: 'rosy_me' })
  username: string;

  @ApiProperty({ example: 'Rosy Mendez' })
  displayName: string;

  @ApiProperty({ example: '/images/avatars/avatar-rosy.jpg' })
  avatarUrl: string;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: '/images/stories/story-rosy.jpg' })
  image: string;

  @ApiProperty({ example: true })
  hasUnseen: boolean;

  @ApiProperty({ type: [StoryItemResponseDto] })
  stories: StoryItemResponseDto[];
}

export class StoryViewRecordResponseDto {
  @ApiProperty({ example: true })
  viewed: boolean;

  @ApiProperty({ example: 'clx123abc' })
  storyId: string;

  @ApiProperty({ example: '2026-10-19T22:05:00.000Z' })
  viewedAt: string;
}

export class StoryViewerItemDto {
  @ApiProperty({ example: 'usr_789ghi' })
  id: string;

  @ApiProperty({ example: 'alex_dev' })
  username: string;

  @ApiProperty({ example: 'Alex Rivera' })
  displayName: string;

  @ApiPropertyOptional({ example: '/images/avatars/avatar-alex.jpg' })
  avatarUrl?: string | null;

  @ApiProperty({ example: '2026-10-19T22:15:00.000Z' })
  viewedAt: string;
}
