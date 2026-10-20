import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const videoProcessingQueue = new Queue('video-processing', {
  connection: redisConnection,
});

export const notificationsQueue = new Queue('notifications', {
  connection: redisConnection,
});

export const storiesQueue = new Queue('stories', {
  connection: redisConnection,
});

export function setupWorkers() {
  const videoWorker = new Worker(
    'video-processing',
    async (job: Job) => {
      console.log(`[Worker] Processing video job ${job.id}:`, job.data);
      // FFmpeg processing will be implemented in Feature 7
      return { status: 'completed' };
    },
    { connection: redisConnection },
  );

  const notificationsWorker = new Worker(
    'notifications',
    async (job: Job) => {
      console.log(`[Worker] Notification job ${job.id} (${job.name}):`, job.data);
      switch (job.name) {
        case 'notification:new_follower':
          console.log(`[Worker] New follower notification dispatched to user ${job.data.targetUserId}`);
          break;
        case 'notification:follow_request':
          console.log(`[Worker] Follow request notification dispatched to user ${job.data.receiverId}`);
          break;
        case 'notification:follow_accepted':
          console.log(`[Worker] Follow accepted notification dispatched to user ${job.data.recipientId}`);
          break;
        case 'notification:verification_approved':
          console.log(`[Worker] Verification approved notification dispatched to user ${job.data.userId}`);
          break;
        case 'notification:verification_rejected':
          console.log(`[Worker] Verification rejected notification dispatched to user ${job.data.userId}`);
          break;
        default:
          console.log(`[Worker] Unknown notification job: ${job.name}`);
      }
      return { status: 'sent', jobName: job.name };
    },
    { connection: redisConnection },
  );

  const storiesWorker = new Worker(
    'stories',
    async (job: Job) => {
      console.log(`[Worker] Stories job ${job.id} (${job.name}):`, job.data);
      if (job.name === 'story:cleanup_expired') {
        try {
          const { prisma } = await import('@social/database');
          const result = await prisma.story.deleteMany({
            where: {
              expiresAt: { lte: new Date() },
            },
          });
          console.log(`[Worker] Cleaned up ${result.count} expired stories.`);
          return { status: 'cleaned', count: result.count };
        } catch (err) {
          console.error('[Worker] Error purging expired stories:', err);
          throw err;
        }
      }
      return { status: 'ignored' };
    },
    { connection: redisConnection },
  );

  videoWorker.on('completed', (job) => {
    console.log(`[Worker] Video job ${job.id} completed successfully`);
  });

  notificationsWorker.on('completed', (job) => {
    console.log(`[Worker] Notification job ${job.id} completed successfully`);
  });

  storiesWorker.on('completed', (job) => {
    console.log(`[Worker] Stories job ${job.id} completed successfully`);
  });

  return { videoWorker, notificationsWorker, storiesWorker };
}
