import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username, bearer } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';
import { REDIS_CLIENT } from '../redis/redis.constants';
import Redis from 'ioredis';
import { EnvConfig } from '@social/validation';

@Injectable()
export class AuthService {
  public readonly auth;
  private readonly logger = new Logger(AuthService.name);
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {
    this.auth = betterAuth({
      baseURL: (this.configService.get('API_URL') as string) || 'http://localhost:4000',
      basePath: '/api/auth',
      trustedOrigins: [(this.configService.get('CORS_ORIGIN') as string) || 'http://localhost:3000'],
      database: prismaAdapter(this.prisma, { provider: 'postgresql' }),
      secondaryStorage: {
        get: async (key) => {
          const val = await this.redisClient.get(key);
          return val ? JSON.parse(val) : null;
        },
        set: async (key, value, ttl) => {
          if (ttl) {
            await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
          } else {
            await this.redisClient.set(key, JSON.stringify(value));
          }
        },
        delete: async (key) => {
          await this.redisClient.del(key);
        },
        getAndDelete: async (key) => {
          const val = await this.redisClient.get(key);
          if (val) {
            await this.redisClient.del(key);
            return JSON.parse(val);
          }
          return null;
        },
        increment: async (key, amount = 1) => {
          return this.redisClient.incrby(key, amount);
        }
      },
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        google: {
          clientId: this.configService.get('GOOGLE_CLIENT_ID', '') as string,
          clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET', '') as string,
        },
        apple: {
          clientId: this.configService.get('APPLE_CLIENT_ID', '') as string,
          clientSecret: this.configService.get('APPLE_CLIENT_SECRET', '') as string,
        },
      },
      plugins: [
        username(),
        bearer(),
      ],
      user: {
        additionalFields: {
          termsAcceptedAt: { type: 'date', required: false },
          termsVersion: { type: 'string', required: false },
          bio: { type: 'string', required: false },
          location: { type: 'string', required: false },
          website: { type: 'string', required: false },
          onboardingCompletedAt: { type: 'date', required: false },
          onboardingSkipped: { type: 'boolean', required: false },
        },
      },
      databaseHooks: {
        user: {
          create: {
            before: async (user) => {
              // Custom hook to set termsAcceptedAt when creating user
              if (user.termsVersion) {
                user.termsAcceptedAt = new Date();
              }
              return { data: user };
            },
          },
        },
      },
    });
  }
}
