import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { NOTIFICATIONS_QUEUE_TOKEN, NOTIFICATION_JOBS } from '../bullmq/bullmq.constants';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FollowRequestStatus, VerificationStatus } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let mockRedis: any;
  let mockQueue: any;
  let mockPrisma: any;

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      exists: jest.fn(),
      zrevrange: jest.fn(),
      pipeline: jest.fn().mockReturnValue({
        zadd: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      sadd: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
    };

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: NOTIFICATIONS_QUEUE_TOKEN, useValue: mockQueue },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // Mock internal prisma client
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      follow: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
      followRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      block: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      mute: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      post: {
        findMany: jest.fn(),
      },
      verificationRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((ops) => {
        if (Array.isArray(ops)) {
          return Promise.all(ops);
        }
        return ops(mockPrisma);
      }),
    };

    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // PROFILE TESTS
  // ==========================================
  describe('getProfileByUsername', () => {
    const mockTargetUser = {
      id: 'target_1',
      name: 'Jane Doe',
      username: 'janedoe',
      bio: 'Developer & Creator',
      image: 'https://cdn.example.com/avatar.jpg',
      coverImage: 'https://cdn.example.com/cover.jpg',
      isVerified: true,
      isPrivate: false,
      followerCount: 150,
      followingCount: 75,
      postCount: 12,
    };

    it('should return complete user profile with isOnline from Redis for unauthenticated viewer', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockTargetUser);
      mockRedis.get.mockResolvedValue('1728230000'); // Online

      const profile = await service.getProfileByUsername('janedoe');

      expect(profile).toEqual({
        id: 'target_1',
        displayName: 'Jane Doe',
        username: 'janedoe',
        bio: 'Developer & Creator',
        avatar: 'https://cdn.example.com/avatar.jpg',
        cover: 'https://cdn.example.com/cover.jpg',
        verified: true,
        isOnline: true,
        isPrivate: false,
        followerCount: 150,
        followingCount: 75,
        postCount: 12,
        relationship: {
          isFollowing: false,
          isFollowedBy: false,
          isBlocked: false,
          isBlocking: false,
          isMuted: false,
          requested: false,
        },
      });
      expect(mockRedis.get).toHaveBeenCalledWith('user:presence:target_1');
    });

    it('should return computed relationship flags for authenticated viewer', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockTargetUser);
      mockRedis.get.mockResolvedValue(null); // Offline
      mockPrisma.follow.findUnique
        .mockResolvedValueOnce({ id: 'f1' }) // viewer follows target
        .mockResolvedValueOnce(null); // target does not follow viewer
      mockPrisma.block.findUnique.mockResolvedValue(null);
      mockPrisma.mute.findUnique.mockResolvedValue(null);
      mockPrisma.followRequest.findFirst.mockResolvedValue(null);

      const profile = await service.getProfileByUsername('janedoe', 'viewer_123');

      expect(profile.isOnline).toBe(false);
      expect(profile.relationship).toEqual({
        isFollowing: true,
        isFollowedBy: false,
        isBlocked: false,
        isBlocking: false,
        isMuted: false,
        requested: false,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getProfileByUsername('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==========================================
  // POSTS GRID & POPULAR RANKING TESTS
  // ==========================================
  describe('getUserPosts', () => {
    const mockUser = {
      id: 'user_1',
      username: 'creator',
      isPrivate: false,
    };

    const mockPosts = [
      {
        id: 'post_1',
        authorId: 'user_1',
        type: 'IMAGE',
        likeCount: 50,
        commentCount: 5,
        shareCount: 2,
        createdAt: new Date('2026-10-06T10:00:00Z'),
        media: [
          { url: 'https://cdn.example.com/img1.jpg', thumbnailUrl: 'https://cdn.example.com/thumb1.jpg' },
        ],
      },
    ];

    it('should return latest posts with grid thumbnail and media count', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);

      const res = await service.getUserPosts('creator', { sort: 'latest', limit: 18 });

      expect(res.items).toHaveLength(1);
      expect(res.items[0]).toEqual({
        id: 'post_1',
        thumbUrl: 'https://cdn.example.com/thumb1.jpg',
        type: 'IMAGE',
        mediaCount: 1,
        likeCount: 50,
        commentCount: 5,
        createdAt: '2026-10-06T10:00:00.000Z',
      });
      expect(res.hasMore).toBe(false);
    });

    it('should throw ForbiddenException if account is private and viewer is not following', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'private_1',
        username: 'secret',
        isPrivate: true,
      });
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserPosts('secret', { sort: 'latest' }, 'stranger_1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should compute popular posts ranking on Redis cache miss and populate Redis ZSET', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockRedis.exists.mockResolvedValue(0); // Cache miss
      mockPrisma.post.findMany
        .mockResolvedValueOnce([
          {
            id: 'post_1',
            likeCount: 100,
            commentCount: 20,
            shareCount: 10,
            createdAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
          },
        ])
        .mockResolvedValueOnce(mockPosts);

      mockRedis.zrevrange.mockResolvedValue(['post_1']);

      const res = await service.getUserPosts('creator', { sort: 'popular', limit: 18 });

      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('post_1');
    });

    it('should return popular posts from Redis ZSET on cache hit', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockRedis.exists.mockResolvedValue(1); // Cache hit
      mockRedis.zrevrange.mockResolvedValue(['post_1']);
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);

      const res = await service.getUserPosts('creator', { sort: 'popular', limit: 18 });

      expect(mockRedis.zrevrange).toHaveBeenCalledWith(
        'user:user_1:popular_posts',
        0,
        18,
      );
      expect(res.items).toHaveLength(1);
    });
  });

  // ==========================================
  // FOLLOW / UNFOLLOW TESTS
  // ==========================================
  describe('followUser & unfollowUser', () => {
    it('should create follow and increment counters for public target', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'target_pub',
        username: 'public_star',
        isPrivate: false,
      });
      mockPrisma.block.findFirst.mockResolvedValue(null);
      mockPrisma.follow.findUnique.mockResolvedValue(null); // Not currently following

      const result = await service.followUser('public_star', 'actor_1');

      expect(result).toEqual({
        status: 'FOLLOWING',
        relationship: { isFollowing: true, requested: false },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        NOTIFICATION_JOBS.NEW_FOLLOWER,
        expect.objectContaining({ targetUserId: 'target_pub', followerId: 'actor_1' }),
      );
    });

    it('should create follow request with PENDING status for private target', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'target_priv',
        username: 'private_star',
        isPrivate: true,
      });
      mockPrisma.block.findFirst.mockResolvedValue(null);
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      const result = await service.followUser('private_star', 'actor_1');

      expect(result).toEqual({
        status: 'REQUESTED',
        relationship: { isFollowing: false, requested: true },
      });
      expect(mockPrisma.followRequest.upsert).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        NOTIFICATION_JOBS.FOLLOW_REQUEST,
        expect.objectContaining({ receiverId: 'target_priv', senderId: 'actor_1' }),
      );
    });

    it('should be idempotent if already following', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'target_pub',
        username: 'public_star',
        isPrivate: false,
      });
      mockPrisma.block.findFirst.mockResolvedValue(null);
      mockPrisma.follow.findUnique.mockResolvedValue({ id: 'f123' }); // Already following

      const result = await service.followUser('public_star', 'actor_1');

      expect(result).toEqual({
        status: 'FOLLOWING',
        relationship: { isFollowing: true, requested: false },
      });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should unfollow and decrement counters atomically', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'target_pub',
        username: 'public_star',
      });
      mockPrisma.follow.findUnique.mockResolvedValue({ id: 'f123' });

      const result = await service.unfollowUser('public_star', 'actor_1');

      expect(result).toEqual({
        status: 'NONE',
        relationship: { isFollowing: false, requested: false },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should accept incoming follow request and create follow', async () => {
      mockPrisma.followRequest.findUnique.mockResolvedValue({
        id: 'req_1',
        senderId: 'actor_1',
        receiverId: 'target_user',
        status: FollowRequestStatus.PENDING,
      });

      const result = await service.acceptFollowRequest('req_1', 'target_user');

      expect(result).toEqual({
        status: 'FOLLOWING',
        relationship: { isFollowing: true, requested: false },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        NOTIFICATION_JOBS.FOLLOW_ACCEPTED,
        expect.objectContaining({ recipientId: 'actor_1', actorId: 'target_user' }),
      );
    });
  });

  // ==========================================
  // BLOCK & MUTE TESTS
  // ==========================================
  describe('blockUser & muteUser', () => {
    it('should block user and sever mutual follow graph', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'bad_user',
        username: 'spammer',
      });
      mockPrisma.follow.findUnique
        .mockResolvedValueOnce({ id: 'f_actor' })
        .mockResolvedValueOnce({ id: 'f_target' });

      const result = await service.blockUser('spammer', 'actor_1');

      expect(result).toEqual({ isBlocked: true });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockRedis.sadd).toHaveBeenCalledWith('user:actor_1:blocks', 'bad_user');
    });

    it('should mute user and add to Redis set without breaking follow relations', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'annoying_user',
        username: 'loud',
      });

      const result = await service.muteUser('loud', 'actor_1');

      expect(result).toEqual({ isMuted: true });
      expect(mockPrisma.mute.upsert).toHaveBeenCalled();
      expect(mockRedis.sadd).toHaveBeenCalledWith('user:actor_1:mutes', 'annoying_user');
    });
  });

  // ==========================================
  // VERIFICATION TESTS
  // ==========================================
  describe('verification system', () => {
    it('should submit verification request if user is not verified and has no pending request', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1', isVerified: false });
      mockPrisma.verificationRequest.findFirst.mockResolvedValue(null);
      mockPrisma.verificationRequest.create.mockResolvedValue({
        id: 'vr_1',
        userId: 'user_1',
        category: 'CREATOR',
        legalName: 'Jane Doe',
        documentType: 'PASSPORT',
        documentUrl: 'https://cdn.example.com/pass.jpg',
        status: VerificationStatus.PENDING,
        createdAt: new Date(),
      });

      const res = await service.submitVerificationRequest('user_1', {
        category: 'CREATOR',
        legalName: 'Jane Doe',
        documentType: 'PASSPORT',
        documentUrl: 'https://cdn.example.com/pass.jpg',
      });

      expect(res.status).toBe('PENDING');
      expect(res.legalName).toBe('Jane Doe');
    });

    it('should throw BadRequestException if pending request already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1', isVerified: false });
      mockPrisma.verificationRequest.findFirst.mockResolvedValue({ id: 'vr_existing' });

      await expect(
        service.submitVerificationRequest('user_1', {
          category: 'CREATOR',
          legalName: 'Jane Doe',
          documentType: 'PASSPORT',
          documentUrl: 'https://cdn.example.com/pass.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve verification, set isVerified=true, and dispatch notification', async () => {
      mockPrisma.verificationRequest.findUnique.mockResolvedValue({
        id: 'vr_1',
        userId: 'user_1',
      });
      mockPrisma.verificationRequest.update.mockResolvedValue({
        id: 'vr_1',
        userId: 'user_1',
        category: 'CREATOR',
        legalName: 'Jane Doe',
        documentType: 'PASSPORT',
        documentUrl: 'https://cdn.example.com/pass.jpg',
        status: VerificationStatus.APPROVED,
        reviewedAt: new Date(),
        createdAt: new Date(),
      });

      const res = await service.adminApproveVerification('vr_1', 'admin_999');

      expect(res.status).toBe('APPROVED');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        NOTIFICATION_JOBS.VERIFICATION_APPROVED,
        expect.objectContaining({ userId: 'user_1' }),
      );
    });
  });
});
