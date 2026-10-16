import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVerificationRequestDto {
  @ApiProperty({
    description: 'Category for verification request',
    enum: ['CREATOR', 'BUSINESS', 'PUBLIC_FIGURE', 'ORGANIZATION'],
    example: 'CREATOR',
  })
  @IsNotEmpty()
  @IsIn(['CREATOR', 'BUSINESS', 'PUBLIC_FIGURE', 'ORGANIZATION'])
  category: 'CREATOR' | 'BUSINESS' | 'PUBLIC_FIGURE' | 'ORGANIZATION';

  @ApiProperty({
    description: 'Full legal name of the entity or person',
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  legalName: string;

  @ApiProperty({
    description: 'Type of identity or organization document',
    example: 'PASSPORT',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  documentType: string;

  @ApiProperty({
    description: 'Cloudflare R2 / CDN secure URL to uploaded identification proof',
    example: 'https://cdn.example.com/verification/docs/passport-123.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  documentUrl: string;

  @ApiPropertyOptional({
    description: 'Additional context or links validating authenticity',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalInfo?: string;
}

export class ReviewVerificationDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection (if rejecting)',
    example: 'The submitted document was expired or unreadable.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
