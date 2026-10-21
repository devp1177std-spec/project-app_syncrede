import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import {
  StoryDto,
  UserStoryGroupDto,
  StoryViewUserDto,
} from '@social/types';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);
  public readonly prisma: PrismaClient;

  constructor(prismaService: PrismaService) {
    this.prisma = prismaService.client;
  }

  /**
   * Retrieves active stories feed for the current user (followed creators + own stories),
   * or public active stories if unauthenticated.
   */
  async getStoriesFeed(currentUserId?: string): Promise<UserStoryGroupDto[]> {
    const now = new Date();

    let targetUserIds: string[] | undefined = undefined;

    if (currentUserId) {
      // 1. Get followed creators
      const follows = await this.prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });

      // 2. Get blocked users to exclude
      const blocks = await this.prisma.block.findMany({
        where: {
          OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
        },
        select: { blockerId: true, blockedId: true },
      });

      const blockedIds = new Set(
        blocks.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId))
      );

      // Target users: followed creators + self (excluding blocked users)
      targetUserIds = [
        currentUserId,
        ...follows.map((f) => f.followingId).filter((id) => !blockedIds.has(id)),
      ];
    }

    // Query active stories (expiresAt > now)
    const stories = await this.prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        ...(targetUserIds && targetUserIds.length > 0
          ? { userId: { in: targetUserIds } }
          : { user: { isPrivate: false } }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayUsername: true,
            name: true,
            image: true,
            isVerified: true,
          },
        },
        views: {
          where: { viewerId: currentUserId || '' },
          select: { id: true },
        },
        _count: {
          select: { views: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // If followed accounts have no active stories and user is logged in,
    // fetch all unexpired public stories for discovery/preview
    let activeStories = stories;
    if (activeStories.length === 0 && currentUserId) {
      activeStories = await this.prisma.story.findMany({
        where: {
          expiresAt: { gt: now },
          user: { isPrivate: false },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayUsername: true,
              name: true,
              image: true,
              isVerified: true,
            },
          },
          views: {
            where: { viewerId: currentUserId },
            select: { id: true },
          },
          _count: {
            select: { views: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // Group stories by creator
    const groupsMap = new Map<string, UserStoryGroupDto>();

    for (const s of activeStories) {
      const u = s.user;
      const username = u.username || `user_${u.id.slice(0, 6)}`;
      const hasViewed = currentUserId ? (s.views && s.views.length > 0) : false;

      const storyDto: StoryDto = {
        id: s.id,
        userId: s.userId,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType as 'IMAGE' | 'VIDEO',
        duration: s.duration,
        caption: s.caption,
        location: s.location,
        linkText: s.linkText,
        linkUrl: s.linkUrl,
        viewCount: s._count.views,
        hasViewed: Boolean(hasViewed),
        expiresAt: s.expiresAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      };

      if (!groupsMap.has(u.id)) {
        groupsMap.set(u.id, {
          id: `story-group-${u.id}`,
          userId: u.id,
          username,
          displayName: u.displayUsername || u.name || username,
          avatarUrl: u.image || '/images/avatars/avatar-olivia.jpg',
          isVerified: u.isVerified,
          image: s.mediaUrl,
          hasUnseen: !hasViewed,
          stories: [storyDto],
        });
      } else {
        const group = groupsMap.get(u.id)!;
        group.stories.push(storyDto);
        if (!hasViewed) {
          group.hasUnseen = true;
          // Set preview image to the earliest unseen story
          group.image = s.mediaUrl;
        }
      }
    }

    const groups = Array.from(groupsMap.values());

    // Sort: user's own stories first, then unseen stories, then seen stories
    groups.sort((a, b) => {
      if (currentUserId) {
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
      }
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return 0;
    });

    return groups;
  }

  /**
   * Retrieves all unexpired stories for a specific username.
   */
  async getUserStories(
    username: string,
    currentUserId?: string
  ): Promise<UserStoryGroupDto> {
    const cleanUsername = username.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: {
        username: { equals: cleanUsername, mode: 'insensitive' },
      },
      select: {
        id: true,
        username: true,
        displayUsername: true,
        name: true,
        image: true,
        isVerified: true,
        isPrivate: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    // Check privacy if viewer is not the story owner
    if (user.isPrivate && user.id !== currentUserId) {
      let isFollowing = false;
      if (currentUserId) {
        const follow = await this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: user.id,
            },
          },
        });
        isFollowing = Boolean(follow);
      }
      if (!isFollowing) {
        throw new ForbiddenException('This account is private');
      }
    }

    const now = new Date();
    const stories = await this.prisma.story.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: now },
      },
      include: {
        views: {
          where: { viewerId: currentUserId || '' },
          select: { id: true },
        },
        _count: {
          select: { views: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const mappedStories: StoryDto[] = stories.map((s) => {
      const hasViewed = currentUserId ? (s.views && s.views.length > 0) : false;
      return {
        id: s.id,
        userId: s.userId,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType as 'IMAGE' | 'VIDEO',
        duration: s.duration,
        caption: s.caption,
        location: s.location,
        linkText: s.linkText,
        linkUrl: s.linkUrl,
        viewCount: s._count.views,
        hasViewed: Boolean(hasViewed),
        expiresAt: s.expiresAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      };
    });

    const hasUnseen = mappedStories.some((s) => !s.hasViewed);

    return {
      id: `story-group-${user.id}`,
      userId: user.id,
      username: user.username || cleanUsername,
      displayName: user.displayUsername || user.name || cleanUsername,
      avatarUrl: user.image || '/images/avatars/avatar-olivia.jpg',
      isVerified: user.isVerified,
      image: mappedStories[0]?.mediaUrl || user.image || '/images/avatars/avatar-olivia.jpg',
      hasUnseen,
      stories: mappedStories,
    };
  }

  /**
   * Creates a new story for the authenticated user with a 24-hour expiration window.
   */
  async createStory(userId: string, dto: CreateStoryDto): Promise<StoryDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Stories expire 24 hours from creation
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await this.prisma.story.create({
      data: {
        userId,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType || 'IMAGE',
        duration: dto.duration || 5000,
        caption: dto.caption,
        location: dto.location,
        linkText: dto.linkText,
        linkUrl: dto.linkUrl,
        expiresAt,
      },
      include: {
        _count: {
          select: { views: true },
        },
      },
    });

    this.logger.log(`Created story ${story.id} for user ${userId}, expires ${expiresAt.toISOString()}`);

    return {
      id: story.id,
      userId: story.userId,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType as 'IMAGE' | 'VIDEO',
      duration: story.duration,
      caption: story.caption,
      location: story.location,
      linkText: story.linkText,
      linkUrl: story.linkUrl,
      viewCount: story._count.views,
      hasViewed: true,
      expiresAt: story.expiresAt.toISOString(),
      createdAt: story.createdAt.toISOString(),
    };
  }

  /**
   * Records a view for a story by the authenticated viewer.
   */
  async recordStoryView(
    storyId: string,
    viewerId: string
  ): Promise<{ viewed: boolean; storyId: string; viewedAt: string }> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!story || story.expiresAt <= new Date()) {
      throw new NotFoundException('Story not found or expired');
    }

    const view = await this.prisma.storyView.upsert({
      where: {
        storyId_viewerId: { storyId, viewerId },
      },
      create: {
        storyId,
        viewerId,
      },
      update: {},
    });

    return {
      viewed: true,
      storyId,
      viewedAt: view.createdAt.toISOString(),
    };
  }

  /**
   * Deletes a story (must be owned by the caller, or caller is admin).
   */
  async deleteStory(
    storyId: string,
    userId: string,
    isAdmin = false
  ): Promise<{ success: boolean; deletedStoryId: string }> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, userId: true },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this story');
    }

    await this.prisma.story.delete({
      where: { id: storyId },
    });

    this.logger.log(`Deleted story ${storyId} by user ${userId}`);

    return {
      success: true,
      deletedStoryId: storyId,
    };
  }

  /**
   * Lists viewers of a specific story (only creator can view).
   */
  async getStoryViews(
    storyId: string,
    userId: string
  ): Promise<StoryViewUserDto[]> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, userId: true },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.userId !== userId) {
      throw new ForbiddenException('Only the story creator can view view receipts');
    }

    const views = await this.prisma.storyView.findMany({
      where: { storyId },
      include: {
        viewer: {
          select: {
            id: true,
            username: true,
            displayUsername: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return views.map((v) => ({
      id: v.viewer.id,
      username: v.viewer.username || `user_${v.viewer.id.slice(0, 6)}`,
      displayName: v.viewer.displayUsername || v.viewer.name || 'User',
      avatarUrl: v.viewer.image,
      viewedAt: v.createdAt.toISOString(),
    }));
  }

  /**
   * Purges expired stories from the database. Called by worker cleanup job.
   */
  async purgeExpiredStories(): Promise<{ purgedCount: number }> {
    const result = await this.prisma.story.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });

    this.logger.log(`Purged ${result.count} expired stories`);
    return { purgedCount: result.count };
  }
}
