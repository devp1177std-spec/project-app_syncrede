import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetUserPostsDto {
  @ApiPropertyOptional({
    description: 'Post sort order: latest, popular, or old',
    enum: ['latest', 'popular', 'old'],
    default: 'latest',
  })
  @IsOptional()
  @IsIn(['latest', 'popular', 'old'])
  sort?: 'latest' | 'popular' | 'old' = 'latest';

  @ApiPropertyOptional({
    description: 'Opaque cursor for pagination',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of posts to return (grid-sized, 1 to 50)',
    default: 18,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 18;
}
