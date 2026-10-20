import { Test, TestingModule } from '@nestjs/testing';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

describe('StoriesController', () => {
  let controller: StoriesController;
  let service: StoriesService;

  const mockStoriesService = {
    getStoriesFeed: jest.fn(),
    getUserStories: jest.fn(),
    createStory: jest.fn(),
    recordStoryView: jest.fn(),
    deleteStory: jest.fn(),
    getStoryViews: jest.fn(),
    purgeExpiredStories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoriesController],
      providers: [
        { provide: StoriesService, useValue: mockStoriesService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StoriesController>(StoriesController);
    service = module.get<StoriesService>(StoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStoriesFeed', () => {
    it('should return stories feed for authenticated user', async () => {
      const mockFeed = [
        {
          id: 'story-group-u1',
          userId: 'u1',
          username: 'rosy_me',
          displayName: 'Rosy Mendez',
          avatarUrl: '/images/avatars/avatar-rosy.jpg',
          isVerified: true,
          image: '/images/stories/story-rosy.jpg',
          hasUnseen: true,
          stories: [],
        },
      ];
      mockStoriesService.getStoriesFeed.mockResolvedValue(mockFeed);

      const result = await controller.getStoriesFeed({ id: 'viewer_1' });
      expect(result).toEqual(mockFeed);
      expect(mockStoriesService.getStoriesFeed).toHaveBeenCalledWith('viewer_1');
    });

    it('should return public stories feed for unauthenticated viewer', async () => {
      mockStoriesService.getStoriesFeed.mockResolvedValue([]);
      const result = await controller.getStoriesFeed(null);
      expect(result).toEqual([]);
      expect(mockStoriesService.getStoriesFeed).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getUserStories', () => {
    it('should return stories for a specific username', async () => {
      const mockUserStories = {
        id: 'story-group-u1',
        userId: 'u1',
        username: 'rosy_me',
        displayName: 'Rosy Mendez',
        avatarUrl: '/images/avatars/avatar-rosy.jpg',
        isVerified: true,
        image: '/images/stories/story-rosy.jpg',
        hasUnseen: false,
        stories: [
          {
            id: 's1',
            userId: 'u1',
            mediaUrl: '/images/stories/story-rosy.jpg',
            mediaType: 'IMAGE',
            duration: 5000,
            viewCount: 10,
            hasViewed: true,
            expiresAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
      };
      mockStoriesService.getUserStories.mockResolvedValue(mockUserStories);

      const result = await controller.getUserStories('rosy_me', { id: 'viewer_1' });
      expect(result).toEqual(mockUserStories);
      expect(mockStoriesService.getUserStories).toHaveBeenCalledWith('rosy_me', 'viewer_1');
    });
  });

  describe('createStory', () => {
    it('should create and return a story', async () => {
      const dto = {
        mediaUrl: 'https://cdn.example.com/story.jpg',
        mediaType: 'IMAGE' as const,
        caption: 'Test Story',
      };
      const mockCreated = {
        id: 's_new',
        userId: 'u1',
        mediaUrl: dto.mediaUrl,
        mediaType: 'IMAGE',
        duration: 5000,
        caption: 'Test Story',
        viewCount: 0,
        hasViewed: true,
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      mockStoriesService.createStory.mockResolvedValue(mockCreated);

      const result = await controller.createStory({ id: 'u1' }, dto);
      expect(result).toEqual(mockCreated);
      expect(mockStoriesService.createStory).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('recordView', () => {
    it('should record a story view', async () => {
      const mockResult = {
        viewed: true,
        storyId: 's1',
        viewedAt: new Date().toISOString(),
      };
      mockStoriesService.recordStoryView.mockResolvedValue(mockResult);

      const result = await controller.recordView('s1', { id: 'viewer_1' });
      expect(result).toEqual(mockResult);
      expect(mockStoriesService.recordStoryView).toHaveBeenCalledWith('s1', 'viewer_1');
    });
  });

  describe('deleteStory', () => {
    it('should delete a story', async () => {
      mockStoriesService.deleteStory.mockResolvedValue({ success: true, deletedStoryId: 's1' });

      const result = await controller.deleteStory('s1', { id: 'u1', role: 'user' });
      expect(result).toEqual({ success: true, deletedStoryId: 's1' });
      expect(mockStoriesService.deleteStory).toHaveBeenCalledWith('s1', 'u1', false);
    });

    it('should pass admin flag when caller is admin', async () => {
      mockStoriesService.deleteStory.mockResolvedValue({ success: true, deletedStoryId: 's1' });

      await controller.deleteStory('s1', { id: 'admin_1', role: 'admin' });
      expect(mockStoriesService.deleteStory).toHaveBeenCalledWith('s1', 'admin_1', true);
    });
  });

  describe('getStoryViews', () => {
    it('should return viewers list for story owner', async () => {
      const mockViews = [
        {
          id: 'v1',
          username: 'alex_dev',
          displayName: 'Alex Rivera',
          avatarUrl: '/images/avatars/avatar-alex.jpg',
          viewedAt: new Date().toISOString(),
        },
      ];
      mockStoriesService.getStoryViews.mockResolvedValue(mockViews);

      const result = await controller.getStoryViews('s1', { id: 'u1' });
      expect(result).toEqual(mockViews);
      expect(mockStoriesService.getStoryViews).toHaveBeenCalledWith('s1', 'u1');
    });
  });
});
