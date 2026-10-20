import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoryDto {
  @ApiProperty({
    description: 'Direct secure URL to uploaded story media (image or video)',
    example: 'https://cdn.example.com/stories/story-rosy.jpg',
  })
  @IsNotEmpty()
  @IsUrl()
  mediaUrl: string;

  @ApiPropertyOptional({
    description: 'Type of media: IMAGE or VIDEO',
    enum: ['IMAGE', 'VIDEO'],
    default: 'IMAGE',
  })
  @IsOptional()
  @IsIn(['IMAGE', 'VIDEO'])
  mediaType?: 'IMAGE' | 'VIDEO' = 'IMAGE';

  @ApiPropertyOptional({
    description: 'Story duration in milliseconds (default: 5000ms for images)',
    default: 5000,
    minimum: 1000,
    maximum: 60000,
  })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  duration?: number = 5000;

  @ApiPropertyOptional({
    description: 'Optional story text caption',
    maxLength: 300,
    example: 'Golden hour at the studio ✨',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string;

  @ApiPropertyOptional({
    description: 'Geographic location tag',
    maxLength: 100,
    example: 'Barcelona, Spain',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'Swipe-up / sticker link call-to-action text',
    maxLength: 50,
    example: 'Read More',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  linkText?: string;

  @ApiPropertyOptional({
    description: 'Destination URL for story link sticker',
    example: 'https://example.com/blog/article-1',
  })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;
}
