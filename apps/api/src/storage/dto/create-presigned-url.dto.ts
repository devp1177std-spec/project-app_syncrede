import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class CreatePresignedUrlDto {
  @ApiProperty({
    description: 'Name of the file including extension',
    example: 'avatar-123.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiPropertyOptional({
    description: 'File size in bytes (max 100MB)',
    example: 1048576,
  })
  @IsOptional()
  @IsPositive()
  @Max(100 * 1024 * 1024)
  fileSize?: number;
}
