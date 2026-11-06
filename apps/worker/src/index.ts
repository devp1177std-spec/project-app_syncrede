import dotenv from 'dotenv';
import { verifyDependencies } from './dependency-check';
import {
  redisConnection,
  setupWorkers,
  videoProcessingQueue,
  notificationsQueue,
  storiesQueue,
} from './queues/queue.service';

dotenv.config();

async function main() {
  console.log('[Worker Service] Initializing worker background service...');

  const isReady = await verifyDependencies('Worker');
  if (!isReady) {
    process.exit(1);
  }

  if (redisConnection.status === 'wait') {
    try {
      await redisConnection.connect();
    } catch (error) {
      console.error('[Worker Service] Failed to connect to Redis:', error);
      process.exit(1);
    }
  }

  const workers = setupWorkers();
  console.log('[Worker Service] Background workers active and listening for jobs.');

  // Graceful shutdown
  let isShuttingDown = false;
  async function shutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`[Worker Service] Received ${signal}. Shutting down gracefully...`);
    await Promise.allSettled([
      workers.videoWorker.close(),
      workers.notificationsWorker.close(),
      workers.storiesWorker.close(),
      videoProcessingQueue.close(),
      notificationsQueue.close(),
      storiesQueue.close(),
    ]);

    if (redisConnection.status !== 'end') {
      await redisConnection.quit();
    }
    console.log('[Worker Service] Shutdown complete.');
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[Worker Service] Error starting workers:', err);
  process.exit(1);
});
