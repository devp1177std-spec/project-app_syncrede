import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getStartupGuidance } from '../common/dependency-check';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public client: PrismaClient = new PrismaClient();

  async onModuleInit() {
    try {
      await this.client.$connect();
      this.logger.log('Prisma connected successfully to PostgreSQL');
    } catch (error: any) {
      if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
        const guidance = getStartupGuidance({
          postgresUnavailable: true,
          redisUnavailable: false,
        });
        console.error(guidance);
        process.exit(1);
      }
      this.logger.error(
        `Failed to connect to PostgreSQL at localhost:5433. Error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
