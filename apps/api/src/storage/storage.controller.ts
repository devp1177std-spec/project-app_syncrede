import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse, PresignedUrlResponse } from '@social/types';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a presigned S3/R2 upload URL' })
  @SwaggerResponse({
    status: 200,
    description: 'Returns presigned upload URL and file key metadata',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async generatePresignedUploadUrl(
    @Body() dto: CreatePresignedUrlDto,
  ): Promise<ApiResponse<PresignedUrlResponse>> {
    const result = await this.storageService.createPresignedUploadUrl(
      dto.filename,
      dto.contentType,
    );

    return {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
