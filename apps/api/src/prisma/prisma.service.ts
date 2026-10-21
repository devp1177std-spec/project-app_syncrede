import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public client: PrismaClient = new PrismaClient();

  async onModuleInit() {
    try {
      await this.client.$connect();
      this.logger.log('Prisma connected successfully to PostgreSQL');
    } catch (error) {
      this.logger.error(
        `Failed to connect to PostgreSQL at localhost:5433. Ensure local Docker containers are running ('docker compose up -d'). Error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
