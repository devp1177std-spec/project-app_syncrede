import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { BullMqModule } from './bullmq/bullmq.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RedisThrottlerStorageService } from './common/guards/redis-throttler-storage.service';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const logLevel = configService.get<string>('LOG_LEVEL', 'info');
        return {
          pinoHttp: {
            level: logLevel,
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                  },
                },
            customProps: (req) => ({
              requestId: req.headers['x-request-id'],
            }),
            autoLogging: true,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule, RedisModule],
      inject: [ConfigService, 'REDIS_CLIENT'],
      useFactory: (configService: ConfigService, redis: any) => {
        const ttl = (configService.get<number>('THROTTLE_TTL') || 60) * 1000;
        const limit = configService.get<number>('THROTTLE_LIMIT') || 100;
        const storage = new RedisThrottlerStorageService(redis);
        return {
          throttlers: [
            {
              name: 'default',
              ttl,
              limit,
            },
          ],
          storage,
        };
      },
    }),
    PrismaModule,
    RedisModule,
    BullMqModule,
    StorageModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
