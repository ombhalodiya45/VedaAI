import { Queue, QueueOptions } from 'bullmq';
import { getRedisClient } from './redis';

export const GENERATION_QUEUE = 'question-generation';

let generationQueue: Queue | null = null;

export function getGenerationQueue(): Queue {
  if (!generationQueue) {
    const connection = getRedisClient();
    generationQueue = new Queue(GENERATION_QUEUE, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    } as QueueOptions);
  }
  return generationQueue;
}
