import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateStoryDto } from './dto/create-story.dto';
import {
  StoryItemResponseDto,
  UserStoryGroupResponseDto,
  StoryViewRecordResponseDto,
  StoryViewerItemDto,
} from './dto/story-response.dto';
import {
  StoryDto,
  UserStoryGroupDto,
  StoryViewUserDto,
} from '@social/types';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get('feed')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get active stories feed for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active story groups sorted by unseen status',
    type: [UserStoryGroupResponseDto],
  })
  async getStoriesFeed(
    @CurrentUser() user: any
  ): Promise<UserStoryGroupDto[]> {
    return this.storiesService.getStoriesFeed(user?.id);
  }

  @Get('user/:username')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Get unexpired stories for a specific username' })
  @ApiParam({ name: 'username', description: 'Creator username', example: 'rosy_me' })
  @ApiResponse({
    status: 200,
    description: 'Active user story collection',
    type: UserStoryGroupResponseDto,
  })
  async getUserStories(
    @Param('username') username: string,
    @CurrentUser() user: any
  ): Promise<UserStoryGroupDto> {
    return this.storiesService.getUserStories(username, user?.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create and publish a new story' })
  @ApiResponse({
    status: 201,
    description: 'Story created successfully (expires in 24 hours)',
    type: StoryItemResponseDto,
  })
  async createStory(
    @CurrentUser() user: any,
    @Body() dto: CreateStoryDto
  ): Promise<StoryDto> {
    return this.storiesService.createStory(user.id, dto);
  }

  @Post(':id/view')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a view on a story' })
  @ApiParam({ name: 'id', description: 'Story ID' })
  @ApiResponse({
    status: 200,
    description: 'Story view recorded',
    type: StoryViewRecordResponseDto,
  })
  async recordView(
    @Param('id') storyId: string,
    @CurrentUser() user: any
  ): Promise<{ viewed: boolean; storyId: string; viewedAt: string }> {
    return this.storiesService.recordStoryView(storyId, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a story by ID' })
  @ApiParam({ name: 'id', description: 'Story ID' })
  @ApiResponse({
    status: 200,
    description: 'Story deleted successfully',
  })
  async deleteStory(
    @Param('id') storyId: string,
    @CurrentUser() user: any
  ): Promise<{ success: boolean; deletedStoryId: string }> {
    const isAdmin = user.role === 'admin';
    return this.storiesService.deleteStory(storyId, user.id, isAdmin);
  }

  @Get(':id/views')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get viewers for a story (creator only)' })
  @ApiParam({ name: 'id', description: 'Story ID' })
  @ApiResponse({
    status: 200,
    description: 'List of users who viewed this story',
    type: [StoryViewerItemDto],
  })
  async getStoryViews(
    @Param('id') storyId: string,
    @CurrentUser() user: any
  ): Promise<StoryViewUserDto[]> {
    return this.storiesService.getStoryViews(storyId, user.id);
  }
}
