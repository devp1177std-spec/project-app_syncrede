import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisClient');
        const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          lazyConnect: false,
          enableReadyCheck: true,
          retryStrategy(times) {
            return Math.min(times * 500, 5000);
          },
        });
        client.on('connect', () => {
          logger.log('Connected to Redis successfully.');
        });
        client.on('ready', () => {
          logger.log('Redis client is ready.');
        });
        client.on('reconnecting', (delay: number) => {
          logger.warn(`Redis client reconnecting in ${delay}ms...`);
        });
        client.on('close', () => {
          logger.warn('Redis connection closed.');
        });
        client.on('error', (err) => {
          logger.warn(`Redis connection error: ${err.message}`);
        });
        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
