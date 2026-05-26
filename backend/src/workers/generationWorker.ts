import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { connectDatabase } from '../config/database';
import { GENERATION_QUEUE } from '../config/bullmq';
import { WORKER_CONCURRENCY } from '../config/constants';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { generateQuestionPaper } from '../services/aiService';
import { notifyUser } from '../websocket/wsServer';
import { AssignmentInput } from '../types';

async function processJob(job: Job<AssignmentInput & { assignmentId: string }>) {
  const { assignmentId, userId } = job.data;

  try {
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
    notifyUser(userId, { type: 'job_processing', assignmentId, jobId: job.id, progress: 10 });

    await job.updateProgress(10);
    notifyUser(userId, { type: 'progress', assignmentId, progress: 30 });

    const paperData = await generateQuestionPaper(job.data);

    await job.updateProgress(80);
    notifyUser(userId, { type: 'progress', assignmentId, progress: 80 });

    const paper = await QuestionPaper.create({
      assignmentId,
      userId,
      ...paperData,
      generatedAt: new Date(paperData.generatedAt),
    });

    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      title:      paperData.title      || 'Assignment',
      subject:    paperData.subject    || '',
      topic:      paperData.topic      || '',
      gradeLevel: paperData.gradeLevel || '',
    });

    notifyUser(userId, {
      type: 'job_completed',
      assignmentId,
      jobId: job.id,
      data: { paperId: paper._id.toString() },
    });

    return { paperId: paper._id.toString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
    notifyUser(userId, { type: 'job_failed', assignmentId, error: message });
    throw err;
  }
}

async function startWorker() {
  await connectDatabase();

  const worker = new Worker(GENERATION_QUEUE, processJob, {
    connection: getRedisClient(),
    concurrency: WORKER_CONCURRENCY,
  });

  worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err.message));

  console.log('Generation worker started');
}

startWorker().catch(console.error);
