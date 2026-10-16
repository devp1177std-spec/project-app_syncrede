import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { onboardingProfileSchema } from '@social/validation';
import {
  UserProfile,
  UsernameCheckResponse,
  UserProfileResponse,
  UserGridPostsResponse,
  FollowListResponse,
  FollowActionResult,
  FollowRequestItem,
  VerificationRequestResponse,
} from '@social/types';
import { GetUserPostsDto } from './dto/get-user-posts.dto';
import { CursorPaginationQueryDto } from './dto/cursor-pagination.dto';
import { CreateVerificationRequestDto } from './dto/verification.dto';
import {
  UserProfileResponseDto,
  UserGridPostsResponseDto,
  FollowListResponseDto,
  FollowActionResultDto,
  FollowRequestItemDto,
  VerificationRequestResponseDto,
} from './dto/user-responses.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==========================================
  // ME & STATIC ROUTES (Defined first to prevent param collision)
  // ==========================================

  @Get('check-username')
  @ApiOperation({ summary: 'Check username availability' })
  @ApiResponse({ status: 200, description: 'Username availability and suggestions' })
  @Throttle({ default: { limit: 10, ttl: 60 } })
  async checkUsername(@Query('u') u: string): Promise<UsernameCheckResponse> {
    if (!u) {
      throw new BadRequestException('Username query parameter "u" is required');
    }
    return this.usersService.checkUsername(u);
  }

  @Patch('me/profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update personal profile onboarding or bio information' })
  @ApiResponse({ status: 200, description: 'Updated user profile' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() body: unknown,
  ): Promise<UserProfile> {
    const result = onboardingProfileSchema.safeParse(body);

    if (!result.success) {
      throw new BadRequestException({
        message: result.error.errors.map((e) => e.message),
        error: 'Validation failed',
      });
    }

    const updatedUser = await this.usersService.updateProfile(user.id, result.data);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      username: updatedUser.username,
      avatarUrl: updatedUser.image,
      bio: updatedUser.bio,
      location: updatedUser.location,
      website: updatedUser.website,
      isVerified: updatedUser.isVerified,
      onboardingCompletedAt: updatedUser.onboardingCompletedAt,
      onboardingSkipped: updatedUser.onboardingSkipped,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  @Get('me/follow-requests')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get incoming pending follow requests (for private accounts)' })
  @ApiResponse({ status: 200, type: [FollowRequestItemDto] })
  async getFollowRequests(@CurrentUser() user: any): Promise<FollowRequestItem[]> {
    return this.usersService.getPendingFollowRequests(user.id);
  }

  @Post('follow-requests/:id/accept')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept incoming follow request' })
  @ApiParam({ name: 'id', description: 'Follow request ID' })
  @ApiResponse({ status: 200, type: FollowActionResultDto })
  async acceptFollowRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<FollowActionResult> {
    return this.usersService.acceptFollowRequest(id, user.id);
  }

  @Post('follow-requests/:id/reject')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject incoming follow request' })
  @ApiParam({ name: 'id', description: 'Follow request ID' })
  @ApiResponse({ status: 200, description: 'Request rejected successfully' })
  async rejectFollowRequest(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean }> {
    return this.usersService.rejectFollowRequest(id, user.id);
  }

  @Post('me/verification')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit identity verification request for verified badge' })
  @ApiResponse({ status: 201, type: VerificationRequestResponseDto })
  async submitVerification(
    @CurrentUser() user: any,
    @Body() dto: CreateVerificationRequestDto,
  ): Promise<VerificationRequestResponse> {
    return this.usersService.submitVerificationRequest(user.id, dto);
  }

  @Get('me/verification')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check status of current user verification request' })
  @ApiResponse({ status: 200, type: VerificationRequestResponseDto, nullable: true })
  async getVerificationStatus(
    @CurrentUser() user: any,
  ): Promise<VerificationRequestResponse | null> {
    return this.usersService.getVerificationStatus(user.id);
  }

  // ==========================================
  // PROFILE & GRID ENDPOINTS
  // ==========================================

  @Get(':username')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Get user profile with relationship flags, counters, and online presence',
  })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() user?: any,
  ): Promise<UserProfileResponse> {
    return this.usersService.getProfileByUsername(username, user?.id);
  }

  @Get(':username/posts')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Get grid-sized user posts with cursor pagination and popular ranking',
  })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiQuery({ name: 'sort', enum: ['latest', 'popular', 'old'], required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, example: 18 })
  @ApiResponse({ status: 200, type: UserGridPostsResponseDto })
  async getUserPosts(
    @Param('username') username: string,
    @Query() query: GetUserPostsDto,
    @CurrentUser() user?: any,
  ): Promise<UserGridPostsResponse> {
    return this.usersService.getUserPosts(username, query, user?.id);
  }

  @Get(':username/following')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Get list of users followed by target user with viewer relationship (No N+1)',
  })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: FollowListResponseDto })
  async getFollowing(
    @Param('username') username: string,
    @Query() query: CursorPaginationQueryDto,
    @CurrentUser() user?: any,
  ): Promise<FollowListResponse> {
    return this.usersService.getFollowing(username, query, user?.id);
  }

  @Get(':username/followers')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Get list of followers for target user with viewer relationship (No N+1)',
  })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: FollowListResponseDto })
  async getFollowers(
    @Param('username') username: string,
    @Query() query: CursorPaginationQueryDto,
    @CurrentUser() user?: any,
  ): Promise<FollowListResponse> {
    return this.usersService.getFollowers(username, query, user?.id);
  }

  // ==========================================
  // SOCIAL GRAPH ACTIONS (Follow, Unfollow, Block, Mute)
  // ==========================================

  @Post(':username/follow')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow user or request to follow if private (Idempotent)' })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiResponse({ status: 200, type: FollowActionResultDto })
  async followUser(
    @Param('username') username: string,
    @CurrentUser() user: any,
  ): Promise<FollowActionResult> {
    return this.usersService.followUser(username, user.id);
  }

  @Delete(':username/follow')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow user or cancel pending follow request (Idempotent)' })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiResponse({ status: 200, type: FollowActionResultDto })
  async unfollowUser(
    @Param('username') username: string,
    @CurrentUser() user: any,
  ): Promise<FollowActionResult> {
    return this.usersService.unfollowUser(username, user.id);
  }

  @Post(':username/block')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block user (cuts mutual follows and suppresses content)' })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiResponse({ status: 200, description: 'User blocked' })
  async blockUser(
    @Param('username') username: string,
    @CurrentUser() user: any,
  ): Promise<{ isBlocked: boolean }> {
    return this.usersService.blockUser(username, user.id);
  }

  @Delete(':username/block')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock user' })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiResponse({ status: 200, description: 'User unblocked' })
  async unblockUser(
    @Param('username') username: string,
    @CurrentUser() user: any,
  ): Promise<{ isBlocked: boolean }> {
    return this.usersService.unblockUser(username, user.id);
  }

  @Post(':username/mute')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mute user notifications and timeline appearances' })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiResponse({ status: 200, description: 'User muted' })
  async muteUser(
    @Param('username') username: string,
    @CurrentUser() user: any,
  ): Promise<{ isMuted: boolean }> {
    return this.usersService.muteUser(username, user.id);
  }

  @Delete(':username/mute')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unmute user' })
  @ApiParam({ name: 'username', example: 'alexmorgan' })
  @ApiResponse({ status: 200, description: 'User unmuted' })
  async unmuteUser(
    @Param('username') username: string,
    @CurrentUser() user: any,
  ): Promise<{ isMuted: boolean }> {
    return this.usersService.unmuteUser(username, user.id);
  }
}
