import { Router, Request, Response } from 'express';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { upload } from '../middleware/upload';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { getGenerationQueue } from '../config/bullmq';
import { getRedisClient } from '../config/redis';

const router = Router();

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const { subject = '', grade = '', schoolName = '', dueDate, questionTypes, additionalInstructions = '', userId, groupId } = body;

    if (!dueDate || !questionTypes || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const title = (additionalInstructions as string).slice(0, 60).trim() || subject || 'New Assignment';
    const topic = '';
    const gradeLevel = grade;

    const parsedTypes = typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;
    const hasQuestions = parsedTypes.some((qt: { count: number }) => qt.count > 0);
    if (!hasQuestions) return res.status(400).json({ error: 'At least one question type must have questions' });

    let fileContent: string | undefined;
    if (req.file) {
      const ext = req.file.originalname.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        const buffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(buffer);
        fileContent = data.text;
      } else {
        fileContent = fs.readFileSync(req.file.path, 'utf-8');
      }
    }

    const assignment = await Assignment.create({
      title, subject, topic, gradeLevel,
      dueDate: new Date(dueDate),
      questionTypes: parsedTypes,
      additionalInstructions,
      filePath: req.file?.path,
      fileContent,
      userId,
      groupId: groupId || null,
      status: 'pending',
    });

    const queue = getGenerationQueue();
    const job = await queue.add('generate', {
      assignmentId: assignment._id.toString(),
      title, subject, topic, gradeLevel, schoolName,
      dueDate,
      questionTypes: parsedTypes,
      additionalInstructions,
      fileContent,
      userId,
    });

    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });

    return res.status(201).json({
      assignmentId: assignment._id.toString(),
      jobId: job.id,
      status: 'pending',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const cacheKey = `assignments:${userId}`;
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const assignments = await Assignment.find({ userId }).sort({ createdAt: -1 }).lean();
    await redis.setex(cacheKey, 30, JSON.stringify(assignments));

    return res.json(assignments);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    return res.json(assignment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

router.get('/:id/paper', async (req: Request, res: Response) => {
  try {
    const cacheKey = `paper:${req.params.id}`;
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const paper = await QuestionPaper.findOne({ assignmentId: req.params.id }).lean();
    if (!paper) return res.status(404).json({ error: 'Question paper not found' });

    await redis.setex(cacheKey, 300, JSON.stringify(paper));
    return res.json(paper);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Clean up uploaded file from disk
    if (assignment.filePath) {
      try { fs.unlinkSync(assignment.filePath); } catch { /* already gone */ }
    }

    await Assignment.deleteOne({ _id: req.params.id });
    await QuestionPaper.deleteOne({ assignmentId: req.params.id });

    const redis = getRedisClient();
    await redis.del(`paper:${req.params.id}`);
    await redis.del(`assignments:${assignment.userId}`);

    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    await QuestionPaper.deleteOne({ assignmentId: req.params.id });
    await Assignment.findByIdAndUpdate(req.params.id, { status: 'pending' });

    const queue = getGenerationQueue();
    const job = await queue.add('generate', {
      assignmentId: assignment._id.toString(),
      title: assignment.title,
      subject: assignment.subject,
      topic: assignment.topic,
      gradeLevel: assignment.gradeLevel,
      dueDate: assignment.dueDate.toISOString(),
      questionTypes: assignment.questionTypes,
      additionalInstructions: assignment.additionalInstructions,
      fileContent: assignment.fileContent,
      userId: assignment.userId,
    });

    await Assignment.findByIdAndUpdate(req.params.id, { jobId: job.id });

    const redis = getRedisClient();
    await redis.del(`paper:${req.params.id}`);

    return res.json({ jobId: job.id, status: 'pending' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;
