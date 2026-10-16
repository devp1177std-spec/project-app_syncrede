import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { PrismaClient, PostType, MediaType, FollowRequestStatus, VerificationStatus } from '@prisma/client';
import { OnboardingProfileInput } from '@social/validation';
import {
  UsernameCheckResponse,
  UserProfileResponse,
  UserRelationship,
  UserGridPostsResponse,
  UserGridPostItem,
  FollowListResponse,
  FollowUserItem,
  FollowActionResult,
  FollowRequestItem,
  VerificationRequestResponse,
} from '@social/types';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { NOTIFICATIONS_QUEUE_TOKEN, NOTIFICATION_JOBS } from '../bullmq/bullmq.constants';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { GetUserPostsDto } from './dto/get-user-posts.dto';
import { CursorPaginationQueryDto } from './dto/cursor-pagination.dto';
import { CreateVerificationRequestDto, ReviewVerificationDto } from './dto/verification.dto';

const RESERVED_USERNAMES = new Set(['admin', 'root', 'support', 'help', 'billing', 'api', 'system']);

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  public readonly prisma: PrismaClient;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @Optional() @Inject(NOTIFICATIONS_QUEUE_TOKEN) private readonly notificationsQueue?: Queue,
  ) {
    this.prisma = new PrismaClient();
  }

  // ==========================================
  // PROFILE ENDPOINTS
  // ==========================================

  async getProfileByUsername(username: string, viewerId?: string): Promise<UserProfileResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { id: username },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    // Check Redis presence key: user:presence:${userId}
    const presenceKey = `user:presence:${user.id}`;
    const presenceVal = await this.redisClient.get(presenceKey);
    const isOnline = !!presenceVal;

    let relationship: UserRelationship = {
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      isBlocking: false,
      isMuted: false,
      requested: false,
    };

    if (viewerId && viewerId !== user.id) {
      const [followingRel, followedByRel, blockedRel, blockingRel, mutedRel, pendingRequest] =
        await Promise.all([
          this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
          }),
          this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: user.id, followingId: viewerId } },
          }),
          this.prisma.block.findUnique({
            where: { blockerId_blockedId: { blockerId: user.id, blockedId: viewerId } },
          }),
          this.prisma.block.findUnique({
            where: { blockerId_blockedId: { blockerId: viewerId, blockedId: user.id } },
          }),
          this.prisma.mute.findUnique({
            where: { muterId_mutedId: { muterId: viewerId, mutedId: user.id } },
          }),
          this.prisma.followRequest.findFirst({
            where: {
              senderId: viewerId,
              receiverId: user.id,
              status: FollowRequestStatus.PENDING,
            },
          }),
        ]);

      relationship = {
        isFollowing: !!followingRel,
        isFollowedBy: !!followedByRel,
        isBlocked: !!blockedRel,
        isBlocking: !!blockingRel,
        isMuted: !!mutedRel,
        requested: !!pendingRequest,
      };
    }

    return {
      id: user.id,
      displayName: user.name,
      username: user.username || username,
      bio: user.bio,
      avatar: user.image,
      cover: user.coverImage,
      verified: user.isVerified,
      isOnline,
      isPrivate: user.isPrivate,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      postCount: user.postCount,
      relationship,
    };
  }

  // ==========================================
  // POSTS GRID WITH REDIS-CACHED POPULAR RANKING
  // ==========================================

  async getUserPosts(
    username: string,
    query: GetUserPostsDto,
    viewerId?: string,
  ): Promise<UserGridPostsResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { id: username },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    // Private account check: non-followers cannot view posts
    if (user.isPrivate && viewerId !== user.id) {
      let isFollowing = false;
      if (viewerId) {
        const follow = await this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        });
        isFollowing = !!follow;
      }
      if (!isFollowing) {
        throw new ForbiddenException('This account is private. Follow to view posts.');
      }
    }

    const limit = Math.min(query.limit || 18, 50);
    const sort = query.sort || 'latest';

    if (sort === 'popular') {
      return this.getPopularUserPosts(user.id, limit, query.cursor);
    }

    // Standard cursor pagination for 'latest' and 'old'
    let cursorObj: { id: string; createdAt: string } | null = null;
    if (query.cursor) {
      try {
        cursorObj = JSON.parse(Buffer.from(query.cursor, 'base64').toString('utf-8'));
      } catch {
        cursorObj = null;
      }
    }

    const isLatest = sort === 'latest';
    const whereClause: any = {
      authorId: user.id,
    };

    if (cursorObj) {
      const cursorDate = new Date(cursorObj.createdAt);
      if (isLatest) {
        whereClause.OR = [
          { createdAt: { lt: cursorDate } },
          { createdAt: cursorDate, id: { lt: cursorObj.id } },
        ];
      } else {
        whereClause.OR = [
          { createdAt: { gt: cursorDate } },
          { createdAt: cursorDate, id: { gt: cursorObj.id } },
        ];
      }
    }

    const posts = await this.prisma.post.findMany({
      where: whereClause,
      take: limit + 1,
      orderBy: isLatest
        ? [{ createdAt: 'desc' }, { id: 'desc' }]
        : [{ createdAt: 'asc' }, { id: 'asc' }],
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const hasMore = posts.length > limit;
    const itemsToReturn = hasMore ? posts.slice(0, limit) : posts;

    const items: UserGridPostItem[] = itemsToReturn.map((post) => {
      const firstMedia = post.media[0];
      return {
        id: post.id,
        thumbUrl: firstMedia ? firstMedia.thumbnailUrl || firstMedia.url : null,
        type: post.type as any,
        mediaCount: post.media.length,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt.toISOString(),
      };
    });

    let nextCursor: string | undefined = undefined;
    if (hasMore && itemsToReturn.length > 0) {
      const lastItem = itemsToReturn[itemsToReturn.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }),
      ).toString('base64');
    }

    return { items, nextCursor, hasMore };
  }

  /**
   * Popular posts ranking with Redis Sorted Set (ZSET) cache
   * Engagement formula: (likes * 2 + comments * 3 + shares * 4) / ((age_in_hours + 2) ^ 1.5)
   */
  private async getPopularUserPosts(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<UserGridPostsResponse> {
    const redisKey = `user:${userId}:popular_posts`;
    const exists = await this.redisClient.exists(redisKey);

    if (!exists) {
      // Cache miss: compute popular ranking for user's posts over last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const allPosts = await this.prisma.post.findMany({
        where: {
          authorId: userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          likeCount: true,
          commentCount: true,
          shareCount: true,
          createdAt: true,
        },
      });

      if (allPosts.length > 0) {
        const pipeline = this.redisClient.pipeline();
        const nowMs = Date.now();

        for (const post of allPosts) {
          const ageHours = Math.max(0, (nowMs - post.createdAt.getTime()) / (1000 * 60 * 60));
          const score =
            (post.likeCount * 2 + post.commentCount * 3 + post.shareCount * 4) /
            Math.pow(ageHours + 2, 1.5);

          pipeline.zadd(redisKey, score, post.id);
        }

        pipeline.expire(redisKey, 900); // 15 minutes TTL
        await pipeline.exec();
      }
    }

    // Calculate offset from cursor
    let offset = 0;
    if (cursor) {
      try {
        const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        offset = Number(parsed.offset) || 0;
      } catch {
        offset = 0;
      }
    }

    // Retrieve post IDs ranked by descending engagement score
    const postIds = await this.redisClient.zrevrange(redisKey, offset, offset + limit);

    if (!postIds || postIds.length === 0) {
      // If no cached or window posts, fallback to latest posts directly
      const fallbackPosts = await this.prisma.post.findMany({
        where: { authorId: userId },
        take: limit + 1,
        orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
        include: { media: { orderBy: { order: 'asc' } } },
      });

      const hasMore = fallbackPosts.length > limit;
      const itemsToReturn = hasMore ? fallbackPosts.slice(0, limit) : fallbackPosts;
      return {
        items: itemsToReturn.map((post) => ({
          id: post.id,
          thumbUrl: post.media[0] ? post.media[0].thumbnailUrl || post.media[0].url : null,
          type: post.type as any,
          mediaCount: post.media.length,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          createdAt: post.createdAt.toISOString(),
        })),
        nextCursor: undefined,
        hasMore,
      };
    }

    const hasMore = postIds.length > limit;
    const idsToFetch = hasMore ? postIds.slice(0, limit) : postIds;

    const posts = await this.prisma.post.findMany({
      where: { id: { in: idsToFetch } },
      include: { media: { orderBy: { order: 'asc' } } },
    });

    // Preserve score order
    const postsMap = new Map(posts.map((p) => [p.id, p]));
    const orderedPosts = idsToFetch
      .map((id) => postsMap.get(id))
      .filter((p): p is (typeof posts)[0] => !!p);

    const items: UserGridPostItem[] = orderedPosts.map((post) => ({
      id: post.id,
      thumbUrl: post.media[0] ? post.media[0].thumbnailUrl || post.media[0].url : null,
      type: post.type as any,
      mediaCount: post.media.length,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
    }));

    let nextCursor: string | undefined = undefined;
    if (hasMore) {
      nextCursor = Buffer.from(JSON.stringify({ offset: offset + limit })).toString('base64');
    }

    return { items, nextCursor, hasMore };
  }

  // ==========================================
  // FOLLOWING & FOLLOWERS TABS (NO N+1)
  // ==========================================

  async getFollowing(
    username: string,
    query: CursorPaginationQueryDto,
    viewerId?: string,
  ): Promise<FollowListResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { id: username },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    // Privacy guard
    if (user.isPrivate && viewerId !== user.id) {
      const follow = viewerId
        ? await this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
          })
        : null;
      if (!follow) {
        throw new ForbiddenException('This account is private. Follow to view following.');
      }
    }

    const limit = Math.min(query.limit || 20, 50);

    const follows = await this.prisma.follow.findMany({
      where: { followerId: user.id },
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: { following: true },
    });

    const hasMore = follows.length > limit;
    const itemsToReturn = hasMore ? follows.slice(0, limit) : follows;
    const targetUserIds = itemsToReturn.map((f) => f.following.id);

    // Resolve viewer relationships in a single batch (no client N+1)
    let viewerFollowingSet = new Set<string>();
    let viewerFollowedBySet = new Set<string>();
    let viewerRequestedSet = new Set<string>();

    if (viewerId && targetUserIds.length > 0) {
      const [followingList, followedByList, requestList] = await Promise.all([
        this.prisma.follow.findMany({
          where: { followerId: viewerId, followingId: { in: targetUserIds } },
          select: { followingId: true },
        }),
        this.prisma.follow.findMany({
          where: { followerId: { in: targetUserIds }, followingId: viewerId },
          select: { followerId: true },
        }),
        this.prisma.followRequest.findMany({
          where: {
            senderId: viewerId,
            receiverId: { in: targetUserIds },
            status: FollowRequestStatus.PENDING,
          },
          select: { receiverId: true },
        }),
      ]);

      viewerFollowingSet = new Set(followingList.map((f) => f.followingId));
      viewerFollowedBySet = new Set(followedByList.map((f) => f.followerId));
      viewerRequestedSet = new Set(requestList.map((r) => r.receiverId));
    }

    const items: FollowUserItem[] = itemsToReturn.map((f) => {
      const u = f.following;
      return {
        id: u.id,
        username: u.username || '',
        displayName: u.name,
        avatar: u.image,
        bio: u.bio,
        verified: u.isVerified,
        relationship: {
          isFollowing: viewerFollowingSet.has(u.id),
          isFollowedBy: viewerFollowedBySet.has(u.id),
          requested: viewerRequestedSet.has(u.id),
        },
      };
    });

    let nextCursor: string | undefined = undefined;
    if (hasMore && itemsToReturn.length > 0) {
      nextCursor = itemsToReturn[itemsToReturn.length - 1].id;
    }

    return { items, nextCursor, hasMore };
  }

  async getFollowers(
    username: string,
    query: CursorPaginationQueryDto,
    viewerId?: string,
  ): Promise<FollowListResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { id: username },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    if (user.isPrivate && viewerId !== user.id) {
      const follow = viewerId
        ? await this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
          })
        : null;
      if (!follow) {
        throw new ForbiddenException('This account is private. Follow to view followers.');
      }
    }

    const limit = Math.min(query.limit || 20, 50);

    const follows = await this.prisma.follow.findMany({
      where: { followingId: user.id },
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: { follower: true },
    });

    const hasMore = follows.length > limit;
    const itemsToReturn = hasMore ? follows.slice(0, limit) : follows;
    const followerIds = itemsToReturn.map((f) => f.follower.id);

    let viewerFollowingSet = new Set<string>();
    let viewerFollowedBySet = new Set<string>();
    let viewerRequestedSet = new Set<string>();

    if (viewerId && followerIds.length > 0) {
      const [followingList, followedByList, requestList] = await Promise.all([
        this.prisma.follow.findMany({
          where: { followerId: viewerId, followingId: { in: followerIds } },
          select: { followingId: true },
        }),
        this.prisma.follow.findMany({
          where: { followerId: { in: followerIds }, followingId: viewerId },
          select: { followerId: true },
        }),
        this.prisma.followRequest.findMany({
          where: {
            senderId: viewerId,
            receiverId: { in: followerIds },
            status: FollowRequestStatus.PENDING,
          },
          select: { receiverId: true },
        }),
      ]);

      viewerFollowingSet = new Set(followingList.map((f) => f.followingId));
      viewerFollowedBySet = new Set(followedByList.map((f) => f.followerId));
      viewerRequestedSet = new Set(requestList.map((r) => r.receiverId));
    }

    const items: FollowUserItem[] = itemsToReturn.map((f) => {
      const u = f.follower;
      return {
        id: u.id,
        username: u.username || '',
        displayName: u.name,
        avatar: u.image,
        bio: u.bio,
        verified: u.isVerified,
        relationship: {
          isFollowing: viewerFollowingSet.has(u.id),
          isFollowedBy: viewerFollowedBySet.has(u.id),
          requested: viewerRequestedSet.has(u.id),
        },
      };
    });

    let nextCursor: string | undefined = undefined;
    if (hasMore && itemsToReturn.length > 0) {
      nextCursor = itemsToReturn[itemsToReturn.length - 1].id;
    }

    return { items, nextCursor, hasMore };
  }

  // ==========================================
  // FOLLOW / UNFOLLOW WITH PRIVATE FLOW & COUNTERS
  // ==========================================

  async followUser(targetUsername: string, actorId: string): Promise<FollowActionResult> {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: targetUsername, mode: 'insensitive' } },
          { id: targetUsername },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User @${targetUsername} not found`);
    }

    if (targetUser.id === actorId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check block relationship
    const isBlocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: targetUser.id, blockedId: actorId },
          { blockerId: actorId, blockedId: targetUser.id },
        ],
      },
    });

    if (isBlocked) {
      throw new BadRequestException('Cannot follow this user');
    }

    // Check existing follow (Idempotent write)
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: actorId,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return {
        status: 'FOLLOWING',
        relationship: { isFollowing: true, requested: false },
      };
    }

    // Private account flow: Create FollowRequest
    if (targetUser.isPrivate) {
      await this.prisma.followRequest.upsert({
        where: {
          senderId_receiverId: {
            senderId: actorId,
            receiverId: targetUser.id,
          },
        },
        create: {
          senderId: actorId,
          receiverId: targetUser.id,
          status: FollowRequestStatus.PENDING,
        },
        update: {
          status: FollowRequestStatus.PENDING,
        },
      });

      // Dispatch BullMQ notification job
      if (this.notificationsQueue) {
        await this.notificationsQueue.add(NOTIFICATION_JOBS.FOLLOW_REQUEST, {
          receiverId: targetUser.id,
          senderId: actorId,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        status: 'REQUESTED',
        relationship: { isFollowing: false, requested: true },
      };
    }

    // Public account flow: Transactional follow creation + denormalized counter increments
    await this.prisma.$transaction([
      this.prisma.follow.create({
        data: {
          followerId: actorId,
          followingId: targetUser.id,
        },
      }),
      this.prisma.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: actorId },
        data: { followingCount: { increment: 1 } },
      }),
    ]);

    // Dispatch BullMQ notification job
    if (this.notificationsQueue) {
      await this.notificationsQueue.add(NOTIFICATION_JOBS.NEW_FOLLOWER, {
        targetUserId: targetUser.id,
        followerId: actorId,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'FOLLOWING',
      relationship: { isFollowing: true, requested: false },
    };
  }

  async unfollowUser(targetUsername: string, actorId: string): Promise<FollowActionResult> {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: targetUsername, mode: 'insensitive' } },
          { id: targetUsername },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User @${targetUsername} not found`);
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: actorId,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      // Transactional delete + atomic counter decrements
      await this.prisma.$transaction([
        this.prisma.follow.delete({
          where: { id: existingFollow.id },
        }),
        this.prisma.user.update({
          where: { id: targetUser.id },
          data: { followerCount: { decrement: 1 } },
        }),
        this.prisma.user.update({
          where: { id: actorId },
          data: { followingCount: { decrement: 1 } },
        }),
      ]);
    }

    // Also remove any pending follow request
    await this.prisma.followRequest.deleteMany({
      where: {
        senderId: actorId,
        receiverId: targetUser.id,
      },
    });

    return {
      status: 'NONE',
      relationship: { isFollowing: false, requested: false },
    };
  }

  async getPendingFollowRequests(userId: string): Promise<FollowRequestItem[]> {
    const requests = await this.prisma.followRequest.findMany({
      where: {
        receiverId: userId,
        status: FollowRequestStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            isVerified: true,
          },
        },
      },
    });

    return requests.map((req) => ({
      id: req.id,
      sender: {
        id: req.sender.id,
        username: req.sender.username || '',
        displayName: req.sender.name,
        avatar: req.sender.image,
        verified: req.sender.isVerified,
      },
      createdAt: req.createdAt.toISOString(),
    }));
  }

  async acceptFollowRequest(requestId: string, recipientId: string): Promise<FollowActionResult> {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== recipientId) {
      throw new NotFoundException('Follow request not found');
    }

    if (request.status !== FollowRequestStatus.PENDING) {
      return {
        status: 'FOLLOWING',
        relationship: { isFollowing: true, requested: false },
      };
    }

    // Transaction: Accept request, create follow, increment counters
    await this.prisma.$transaction([
      this.prisma.followRequest.update({
        where: { id: requestId },
        data: { status: FollowRequestStatus.ACCEPTED },
      }),
      this.prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: request.senderId,
            followingId: recipientId,
          },
        },
        create: {
          followerId: request.senderId,
          followingId: recipientId,
        },
        update: {},
      }),
      this.prisma.user.update({
        where: { id: recipientId },
        data: { followerCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: request.senderId },
        data: { followingCount: { increment: 1 } },
      }),
    ]);

    // Dispatch BullMQ notification job
    if (this.notificationsQueue) {
      await this.notificationsQueue.add(NOTIFICATION_JOBS.FOLLOW_ACCEPTED, {
        recipientId: request.senderId,
        actorId: recipientId,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'FOLLOWING',
      relationship: { isFollowing: true, requested: false },
    };
  }

  async rejectFollowRequest(requestId: string, recipientId: string): Promise<{ success: boolean }> {
    const request = await this.prisma.followRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== recipientId) {
      throw new NotFoundException('Follow request not found');
    }

    await this.prisma.followRequest.update({
      where: { id: requestId },
      data: { status: FollowRequestStatus.REJECTED },
    });

    return { success: true };
  }

  // ==========================================
  // BLOCK & MUTE
  // ==========================================

  async blockUser(targetUsername: string, actorId: string): Promise<{ isBlocked: boolean }> {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: targetUsername, mode: 'insensitive' } },
          { id: targetUsername },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User @${targetUsername} not found`);
    }

    if (targetUser.id === actorId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Cut mutual follow relationships and adjust counters
    const [actorFollowsTarget, targetFollowsActor] = await Promise.all([
      this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: actorId, followingId: targetUser.id } },
      }),
      this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: targetUser.id, followingId: actorId } },
      }),
    ]);

    const txOps: any[] = [
      this.prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: actorId, blockedId: targetUser.id } },
        create: { blockerId: actorId, blockedId: targetUser.id },
        update: {},
      }),
      this.prisma.followRequest.deleteMany({
        where: {
          OR: [
            { senderId: actorId, receiverId: targetUser.id },
            { senderId: targetUser.id, receiverId: actorId },
          ],
        },
      }),
    ];

    if (actorFollowsTarget) {
      txOps.push(this.prisma.follow.delete({ where: { id: actorFollowsTarget.id } }));
      txOps.push(
        this.prisma.user.update({
          where: { id: targetUser.id },
          data: { followerCount: { decrement: 1 } },
        }),
      );
      txOps.push(
        this.prisma.user.update({
          where: { id: actorId },
          data: { followingCount: { decrement: 1 } },
        }),
      );
    }

    if (targetFollowsActor) {
      txOps.push(this.prisma.follow.delete({ where: { id: targetFollowsActor.id } }));
      txOps.push(
        this.prisma.user.update({
          where: { id: actorId },
          data: { followerCount: { decrement: 1 } },
        }),
      );
      txOps.push(
        this.prisma.user.update({
          where: { id: targetUser.id },
          data: { followingCount: { decrement: 1 } },
        }),
      );
    }

    await this.prisma.$transaction(txOps);

    // Cache blocked ID in Redis set
    await this.redisClient.sadd(`user:${actorId}:blocks`, targetUser.id);

    return { isBlocked: true };
  }

  async unblockUser(targetUsername: string, actorId: string): Promise<{ isBlocked: boolean }> {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: targetUsername, mode: 'insensitive' } },
          { id: targetUsername },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User @${targetUsername} not found`);
    }

    await this.prisma.block.deleteMany({
      where: { blockerId: actorId, blockedId: targetUser.id },
    });

    await this.redisClient.srem(`user:${actorId}:blocks`, targetUser.id);

    return { isBlocked: false };
  }

  async muteUser(targetUsername: string, actorId: string): Promise<{ isMuted: boolean }> {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: targetUsername, mode: 'insensitive' } },
          { id: targetUsername },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User @${targetUsername} not found`);
    }

    if (targetUser.id === actorId) {
      throw new BadRequestException('Cannot mute yourself');
    }

    await this.prisma.mute.upsert({
      where: { muterId_mutedId: { muterId: actorId, mutedId: targetUser.id } },
      create: { muterId: actorId, mutedId: targetUser.id },
      update: {},
    });

    await this.redisClient.sadd(`user:${actorId}:mutes`, targetUser.id);

    return { isMuted: true };
  }

  async unmuteUser(targetUsername: string, actorId: string): Promise<{ isMuted: boolean }> {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: targetUsername, mode: 'insensitive' } },
          { id: targetUsername },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User @${targetUsername} not found`);
    }

    await this.prisma.mute.deleteMany({
      where: { muterId: actorId, mutedId: targetUser.id },
    });

    await this.redisClient.srem(`user:${actorId}:mutes`, targetUser.id);

    return { isMuted: false };
  }

  // ==========================================
  // VERIFICATION SYSTEM
  // ==========================================

  async submitVerificationRequest(
    userId: string,
    data: CreateVerificationRequestDto,
  ): Promise<VerificationRequestResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    // Check for existing pending request
    const existing = await this.prisma.verificationRequest.findFirst({
      where: { userId, status: VerificationStatus.PENDING },
    });

    if (existing) {
      throw new BadRequestException('A verification request is already under review');
    }

    const request = await this.prisma.verificationRequest.create({
      data: {
        userId,
        category: data.category,
        legalName: data.legalName,
        documentType: data.documentType,
        documentUrl: data.documentUrl,
        additionalInfo: data.additionalInfo,
        status: VerificationStatus.PENDING,
      },
    });

    return {
      id: request.id,
      userId: request.userId,
      category: request.category,
      legalName: request.legalName,
      documentType: request.documentType,
      documentUrl: request.documentUrl,
      additionalInfo: request.additionalInfo,
      status: request.status as any,
      rejectionReason: request.rejectionReason,
      reviewedAt: request.reviewedAt ? request.reviewedAt.toISOString() : null,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async getVerificationStatus(userId: string): Promise<VerificationRequestResponse | null> {
    const request = await this.prisma.verificationRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!request) {
      return null;
    }

    return {
      id: request.id,
      userId: request.userId,
      category: request.category,
      legalName: request.legalName,
      documentType: request.documentType,
      documentUrl: request.documentUrl,
      additionalInfo: request.additionalInfo,
      status: request.status as any,
      rejectionReason: request.rejectionReason,
      reviewedAt: request.reviewedAt ? request.reviewedAt.toISOString() : null,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async adminApproveVerification(
    requestId: string,
    adminId: string,
  ): Promise<VerificationRequestResponse> {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    const [updatedReq] = await this.prisma.$transaction([
      this.prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: VerificationStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: request.userId },
        data: { isVerified: true },
      }),
    ]);

    if (this.notificationsQueue) {
      await this.notificationsQueue.add(NOTIFICATION_JOBS.VERIFICATION_APPROVED, {
        userId: request.userId,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      id: updatedReq.id,
      userId: updatedReq.userId,
      category: updatedReq.category,
      legalName: updatedReq.legalName,
      documentType: updatedReq.documentType,
      documentUrl: updatedReq.documentUrl,
      additionalInfo: updatedReq.additionalInfo,
      status: updatedReq.status as any,
      rejectionReason: updatedReq.rejectionReason,
      reviewedAt: updatedReq.reviewedAt ? updatedReq.reviewedAt.toISOString() : null,
      createdAt: updatedReq.createdAt.toISOString(),
    };
  }

  async adminRejectVerification(
    requestId: string,
    adminId: string,
    dto: ReviewVerificationDto,
  ): Promise<VerificationRequestResponse> {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    const updatedReq = await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: VerificationStatus.REJECTED,
        rejectionReason: dto.reason || 'Verification requirements not satisfied',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    if (this.notificationsQueue) {
      await this.notificationsQueue.add(NOTIFICATION_JOBS.VERIFICATION_REJECTED, {
        userId: request.userId,
        reason: dto.reason,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      id: updatedReq.id,
      userId: updatedReq.userId,
      category: updatedReq.category,
      legalName: updatedReq.legalName,
      documentType: updatedReq.documentType,
      documentUrl: updatedReq.documentUrl,
      additionalInfo: updatedReq.additionalInfo,
      status: updatedReq.status as any,
      rejectionReason: updatedReq.rejectionReason,
      reviewedAt: updatedReq.reviewedAt ? updatedReq.reviewedAt.toISOString() : null,
      createdAt: updatedReq.createdAt.toISOString(),
    };
  }

  // ==========================================
  // EXISTING PROFILE UPDATE & CHECK USERNAME
  // ==========================================

  async updateProfile(userId: string, data: OnboardingProfileInput) {
    const updateData: any = {
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.avatarUrl !== undefined && { image: data.avatarUrl }),
    };

    if (data.username) {
      if (RESERVED_USERNAMES.has(data.username.toLowerCase())) {
        throw new BadRequestException('Username is reserved');
      }

      const existing = await this.prisma.user.findFirst({
        where: {
          username: {
            equals: data.username,
            mode: 'insensitive',
          },
          NOT: { id: userId },
        },
      });

      if (existing) {
        throw new BadRequestException('Username is already taken');
      }

      updateData.username = data.username;
    }

    if (data.skip) {
      updateData.onboardingSkipped = true;
    } else {
      updateData.onboardingCompletedAt = new Date();
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async checkUsername(username: string): Promise<UsernameCheckResponse> {
    if (!username || username.length < 3) {
      return { available: false };
    }

    const lowerUsername = username.toLowerCase();
    const cacheKey = `username_check:${lowerUsername}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let available = true;
    const suggestions: string[] = [];

    if (RESERVED_USERNAMES.has(lowerUsername)) {
      available = false;
    } else {
      const existing = await this.prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        available = false;
      }
    }

    if (!available) {
      const randomSuffixes = [
        Math.floor(Math.random() * 100).toString(),
        Math.floor(Math.random() * 1000).toString(),
        '_official',
        '_app',
      ];

      for (const suffix of randomSuffixes) {
        const suggestion = `${lowerUsername}${suffix}`;
        if (!RESERVED_USERNAMES.has(suggestion)) {
          const exists = await this.prisma.user.findFirst({
            where: { username: { equals: suggestion, mode: 'insensitive' } },
          });
          if (!exists) {
            suggestions.push(suggestion);
          }
        }
      }
    }

    const result: UsernameCheckResponse = {
      available,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    await this.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300);

    return result;
  }
}
