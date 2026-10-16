import {
  Controller,
  Post,
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
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewVerificationDto } from './dto/verification.dto';
import { VerificationRequestResponse } from '@social/types';
import { VerificationRequestResponseDto } from './dto/user-responses.dto';

@ApiTags('admin-verifications')
@Controller('admin/verifications')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminVerificationsController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin approve verification request, granting verified badge' })
  @ApiParam({ name: 'id', description: 'Verification request ID' })
  @ApiResponse({ status: 200, type: VerificationRequestResponseDto })
  async approveVerification(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ): Promise<VerificationRequestResponse> {
    return this.usersService.adminApproveVerification(id, admin.id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin reject verification request with reason' })
  @ApiParam({ name: 'id', description: 'Verification request ID' })
  @ApiResponse({ status: 200, type: VerificationRequestResponseDto })
  async rejectVerification(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body() dto: ReviewVerificationDto,
  ): Promise<VerificationRequestResponse> {
    return this.usersService.adminRejectVerification(id, admin.id, dto);
  }
}
