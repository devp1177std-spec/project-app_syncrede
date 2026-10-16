import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    updateProfile: jest.fn(),
    checkUsername: jest.fn(),
    getProfileByUsername: jest.fn(),
    getUserPosts: jest.fn(),
    getFollowing: jest.fn(),
    getFollowers: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    getPendingFollowRequests: jest.fn(),
    acceptFollowRequest: jest.fn(),
    rejectFollowRequest: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    muteUser: jest.fn(),
    unmuteUser: jest.fn(),
    submitVerificationRequest: jest.fn(),
    getVerificationStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ==========================================
  // PROFILE ENDPOINT
  // ==========================================
  describe('getProfile', () => {
    it('should call getProfileByUsername with username and viewer ID', async () => {
      const mockProfile = {
        id: 'u1',
        displayName: 'John',
        username: 'john_doe',
        bio: 'Hello',
        avatar: null,
        cover: null,
        verified: true,
        isOnline: true,
        isPrivate: false,
        followerCount: 10,
        followingCount: 5,
        postCount: 2,
        relationship: {
          isFollowing: false,
          isFollowedBy: false,
          isBlocked: false,
          requested: false,
        },
      };

      mockUsersService.getProfileByUsername.mockResolvedValue(mockProfile);

      const result = await controller.getProfile('john_doe', { id: 'viewer_1' });
      expect(result).toEqual(mockProfile);
      expect(mockUsersService.getProfileByUsername).toHaveBeenCalledWith('john_doe', 'viewer_1');
    });
  });

  // ==========================================
  // POSTS GRID ENDPOINT
  // ==========================================
  describe('getUserPosts', () => {
    it('should call getUserPosts with query params and viewer ID', async () => {
      const mockPostsResponse = {
        items: [
          {
            id: 'p1',
            thumbUrl: 'https://cdn.example.com/p1.jpg',
            type: 'IMAGE',
            mediaCount: 1,
            likeCount: 5,
            commentCount: 2,
            createdAt: '2026-10-06T12:00:00Z',
          },
        ],
        hasMore: false,
      };

      mockUsersService.getUserPosts.mockResolvedValue(mockPostsResponse);

      const result = await controller.getUserPosts(
        'john_doe',
        { sort: 'popular', limit: 18 },
        { id: 'viewer_1' },
      );

      expect(result).toEqual(mockPostsResponse);
      expect(mockUsersService.getUserPosts).toHaveBeenCalledWith(
        'john_doe',
        { sort: 'popular', limit: 18 },
        'viewer_1',
      );
    });
  });

  // ==========================================
  // FOLLOWING & FOLLOWERS
  // ==========================================
  describe('getFollowing & getFollowers', () => {
    it('should call getFollowing on service', async () => {
      const mockFollowing = {
        items: [],
        hasMore: false,
      };
      mockUsersService.getFollowing.mockResolvedValue(mockFollowing);

      const result = await controller.getFollowing('john_doe', { limit: 20 }, { id: 'v1' });
      expect(result).toEqual(mockFollowing);
      expect(mockUsersService.getFollowing).toHaveBeenCalledWith('john_doe', { limit: 20 }, 'v1');
    });

    it('should call getFollowers on service', async () => {
      const mockFollowers = {
        items: [],
        hasMore: false,
      };
      mockUsersService.getFollowers.mockResolvedValue(mockFollowers);

      const result = await controller.getFollowers('john_doe', { limit: 20 }, { id: 'v1' });
      expect(result).toEqual(mockFollowers);
      expect(mockUsersService.getFollowers).toHaveBeenCalledWith('john_doe', { limit: 20 }, 'v1');
    });
  });

  // ==========================================
  // FOLLOW & UNFOLLOW
  // ==========================================
  describe('followUser & unfollowUser', () => {
    it('should call followUser on service', async () => {
      const mockFollowResult = {
        status: 'FOLLOWING',
        relationship: { isFollowing: true, requested: false },
      };
      mockUsersService.followUser.mockResolvedValue(mockFollowResult);

      const result = await controller.followUser('alex', { id: 'user_1' });
      expect(result).toEqual(mockFollowResult);
      expect(mockUsersService.followUser).toHaveBeenCalledWith('alex', 'user_1');
    });

    it('should call unfollowUser on service', async () => {
      const mockUnfollowResult = {
        status: 'NONE',
        relationship: { isFollowing: false, requested: false },
      };
      mockUsersService.unfollowUser.mockResolvedValue(mockUnfollowResult);

      const result = await controller.unfollowUser('alex', { id: 'user_1' });
      expect(result).toEqual(mockUnfollowResult);
      expect(mockUsersService.unfollowUser).toHaveBeenCalledWith('alex', 'user_1');
    });
  });

  // ==========================================
  // FOLLOW REQUESTS
  // ==========================================
  describe('follow requests', () => {
    it('should accept follow request', async () => {
      mockUsersService.acceptFollowRequest.mockResolvedValue({
        status: 'FOLLOWING',
        relationship: { isFollowing: true, requested: false },
      });

      const res = await controller.acceptFollowRequest('req_1', { id: 'receiver_1' });
      expect(res.status).toBe('FOLLOWING');
      expect(mockUsersService.acceptFollowRequest).toHaveBeenCalledWith('req_1', 'receiver_1');
    });

    it('should reject follow request', async () => {
      mockUsersService.rejectFollowRequest.mockResolvedValue({ success: true });

      const res = await controller.rejectFollowRequest('req_1', { id: 'receiver_1' });
      expect(res.success).toBe(true);
      expect(mockUsersService.rejectFollowRequest).toHaveBeenCalledWith('req_1', 'receiver_1');
    });
  });

  // ==========================================
  // BLOCK & MUTE
  // ==========================================
  describe('block and mute', () => {
    it('should block user', async () => {
      mockUsersService.blockUser.mockResolvedValue({ isBlocked: true });

      const res = await controller.blockUser('bad_guy', { id: 'me' });
      expect(res).toEqual({ isBlocked: true });
      expect(mockUsersService.blockUser).toHaveBeenCalledWith('bad_guy', 'me');
    });

    it('should unblock user', async () => {
      mockUsersService.unblockUser.mockResolvedValue({ isBlocked: false });

      const res = await controller.unblockUser('bad_guy', { id: 'me' });
      expect(res).toEqual({ isBlocked: false });
      expect(mockUsersService.unblockUser).toHaveBeenCalledWith('bad_guy', 'me');
    });

    it('should mute user', async () => {
      mockUsersService.muteUser.mockResolvedValue({ isMuted: true });

      const res = await controller.muteUser('loud_guy', { id: 'me' });
      expect(res).toEqual({ isMuted: true });
      expect(mockUsersService.muteUser).toHaveBeenCalledWith('loud_guy', 'me');
    });

    it('should unmute user', async () => {
      mockUsersService.unmuteUser.mockResolvedValue({ isMuted: false });

      const res = await controller.unmuteUser('loud_guy', { id: 'me' });
      expect(res).toEqual({ isMuted: false });
      expect(mockUsersService.unmuteUser).toHaveBeenCalledWith('loud_guy', 'me');
    });
  });

  // ==========================================
  // VERIFICATION
  // ==========================================
  describe('verification', () => {
    it('should submit verification request', async () => {
      const mockReq = {
        id: 'vr_1',
        userId: 'me',
        category: 'CREATOR',
        legalName: 'Jane Doe',
        documentType: 'PASSPORT',
        documentUrl: 'https://cdn.example.com/doc.jpg',
        status: 'PENDING',
        createdAt: '2026-10-06T12:00:00Z',
      };
      mockUsersService.submitVerificationRequest.mockResolvedValue(mockReq);

      const res = await controller.submitVerification(
        { id: 'me' },
        {
          category: 'CREATOR',
          legalName: 'Jane Doe',
          documentType: 'PASSPORT',
          documentUrl: 'https://cdn.example.com/doc.jpg',
        },
      );

      expect(res).toEqual(mockReq);
    });

    it('should get verification status', async () => {
      mockUsersService.getVerificationStatus.mockResolvedValue(null);

      const res = await controller.getVerificationStatus({ id: 'me' });
      expect(res).toBeNull();
    });
  });

  // ==========================================
  // PROFILE UPDATE & CHECK USERNAME
  // ==========================================
  describe('updateProfile', () => {
    it('should update profile and return formatted response', async () => {
      const mockUser = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        username: 'test_user',
        isVerified: false,
        onboardingCompletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.updateProfile.mockResolvedValue(mockUser);

      const result = await controller.updateProfile(
        { id: '1' },
        { username: 'test_user', bio: 'Hello world' },
      );

      expect(result).toEqual(
        expect.objectContaining({ id: '1', username: 'test_user' }),
      );
    });

    it('should throw BadRequestException if validation fails', async () => {
      await expect(
        controller.updateProfile({ id: '1' }, { username: 'a' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkUsername', () => {
    it('should call checkUsername on service', async () => {
      mockUsersService.checkUsername.mockResolvedValue({ available: true });
      const result = await controller.checkUsername('valid_name');
      expect(result).toEqual({ available: true });
    });

    it('should throw BadRequestException if u parameter is missing', async () => {
      await expect(controller.checkUsername('')).rejects.toThrow(BadRequestException);
    });
  });
});
