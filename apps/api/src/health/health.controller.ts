import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { ApiResponse } from '@social/types';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'System health check (PostgreSQL, Redis, Storage)' })
  async getHealth(): Promise<ApiResponse<unknown>> {
    const result = await this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.client.$queryRawUnsafe('SELECT 1');
          return { database: { status: 'up' } };
        } catch (error) {
          return { database: { status: 'down', message: (error as Error).message } };
        }
      },
      async (): Promise<HealthIndicatorResult> => {
        const isRedisUp = await this.redis.ping();
        return { redis: { status: isRedisUp ? 'up' : 'down' } };
      },
      async (): Promise<HealthIndicatorResult> => {
        const isStorageUp = await this.storage.checkHealth();
        return { storage: { status: isStorageUp ? 'up' : 'down' } };
      },
    ]);

    return {
      success: result.status === 'ok',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
