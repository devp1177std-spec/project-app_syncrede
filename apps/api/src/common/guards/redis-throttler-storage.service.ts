import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';

@Injectable()
export class RedisThrottlerStorageService implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorageService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = 'ratelimit:' + throttlerName + ':' + key;
    const blockKey = 'ratelimit:blocked:' + throttlerName + ':' + key;

    const isBlocked = await this.redis.get(blockKey);
    if (isBlocked) {
      const blockTtl = await this.redis.ttl(blockKey);
      return {
        totalHits: limit + 1,
        timeToExpire: blockTtl > 0 ? blockTtl : 1,
        isBlocked: true,
        timeToBlockExpire: blockTtl > 0 ? blockTtl : 1,
      };
    }

    const hits = await this.redis.incr(redisKey);
    if (hits === 1) {
      const ttlSeconds = Math.ceil(ttl / 1000);
      await this.redis.expire(redisKey, ttlSeconds);
    }

    const currentTtlSeconds = await this.redis.ttl(redisKey);
    const timeToExpire = Math.max(0, currentTtlSeconds * 1000);

    if (hits > limit && blockDuration > 0) {
      const blockSeconds = Math.ceil(blockDuration / 1000);
      await this.redis.set(blockKey, '1', 'EX', blockSeconds);
      return {
        totalHits: hits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: blockSeconds * 1000,
      };
    }

    return {
      totalHits: hits,
      timeToExpire,
      isBlocked: hits > limit,
      timeToBlockExpire: 0,
    };
  }
}
