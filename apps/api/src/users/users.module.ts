import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsersController } from './users.controller';
import { AdminVerificationsController } from './admin-verifications.controller';
import { UsersService } from './users.service';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { NOTIFICATIONS_QUEUE } from '../bullmq/bullmq.constants';

@Module({
  imports: [
    RedisModule,
    AuthModule,
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE,
    }),
  ],
  controllers: [UsersController, AdminVerificationsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
