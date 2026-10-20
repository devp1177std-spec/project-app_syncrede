import dotenv from 'dotenv';
import { redisConnection, setupWorkers } from './queues/queue.service';

dotenv.config();

async function main() {
  console.log('[Worker Service] Initializing worker background service...');

  try {
    await redisConnection.connect();
    console.log('[Worker Service] Connected to Redis successfully.');
  } catch (error) {
    console.warn('[Worker Service] Redis not connected yet. Waiting for Redis to become available...', error);
  }

  const workers = setupWorkers();
  console.log('[Worker Service] Background workers active and listening for jobs.');

  // Graceful shutdown
  async function shutdown(signal: string) {
    console.log(`[Worker Service] Received ${signal}. Shutting down gracefully...`);
    await Promise.allSettled([
      workers.videoWorker.close(),
      workers.notificationsWorker.close(),
      workers.storiesWorker.close(),
    ]);
    await redisConnection.quit();
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
