import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { GROQ_MODEL, withTimeout } from '../config/constants';
import { Group } from '../models/Group';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── List groups (with assignment counts — single aggregation pipeline) ── */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const groups = await Group.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'assignments',
          let: { gid: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$groupId', '$$gid'] } } },
            {
              $group: {
                _id: null,
                total:     { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                pending:   { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0] } },
              },
            },
          ],
          as: 'counts',
        },
      },
      {
        $addFields: {
          assignmentCount: { $ifNull: [{ $arrayElemAt: ['$counts.total',     0] }, 0] },
          completedCount:  { $ifNull: [{ $arrayElemAt: ['$counts.completed', 0] }, 0] },
          pendingCount:    { $ifNull: [{ $arrayElemAt: ['$counts.pending',   0] }, 0] },
        },
      },
      { $project: { counts: 0 } },
    ]);

    return res.json(groups);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

/* ── Create group ── */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, subject, grade, description, userId } = req.body;
    if (!name || !userId) return res.status(400).json({ error: 'name and userId required' });
    const group = await Group.create({ name, subject, grade, description, userId });
    return res.status(201).json({ ...group.toObject(), assignmentCount: 0, completedCount: 0, pendingCount: 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

/* ── Get assignments for a group ── */
router.get('/:id/assignments', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find({ groupId: req.params.id })
      .sort({ createdAt: -1 }).lean();
    return res.json(assignments);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

/* ── AI insights for a group ── */
router.post('/:id/insights', async (req: Request, res: Response) => {
  try {
    const group = await Group.findById(req.params.id).lean();
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const assignments = await Assignment.find({ groupId: req.params.id }).lean();
    const completedIds = assignments.filter(a => a.status === 'completed').map(a => a._id.toString());
    const papers = completedIds.length > 0
      ? await QuestionPaper.find({ assignmentId: { $in: completedIds } }).lean()
      : [];

    const paperSummaries = papers.map(p => ({
      subject: p.subject,
      gradeLevel: p.gradeLevel,
      totalMarks: p.totalMarks,
      duration: p.duration,
      topics: p.sections.map((s: { title: string }) => s.title).join(', '),
      questionCount: p.sections.reduce((sum: number, s: { questions: unknown[] }) => sum + s.questions.length, 0),
    }));

    const prompt = `You are an expert educational analyst. Analyze this teacher's class group and provide actionable insights.

GROUP DETAILS:
Name: ${group.name}
Subject: ${group.subject || 'Multiple subjects'}
Grade: ${group.grade || 'Not specified'}
Description: ${group.description || 'None'}

ASSIGNMENT STATS:
Total assignments: ${assignments.length}
Completed: ${completedIds.length}
Pending/In-progress: ${assignments.filter(a => a.status === 'pending' || a.status === 'processing').length}
Failed: ${assignments.filter(a => a.status === 'failed').length}

COMPLETED PAPERS:
${paperSummaries.length > 0 ? JSON.stringify(paperSummaries, null, 2) : 'No papers completed yet'}

Provide a JSON response with this exact structure:
{
  "summary": "2-3 sentence summary of the group's progress and activity",
  "topicsCovered": ["topic 1", "topic 2", "topic 3"],
  "strengths": ["strength observation 1", "strength observation 2"],
  "gaps": ["identified gap 1", "identified gap 2"],
  "recommendedNextTopics": [
    { "topic": "topic name", "reason": "why this is recommended", "difficulty": "easy|medium|hard", "estimatedMarks": 50 }
  ],
  "suggestedAssignmentTypes": ["MCQ revision", "Long answer practice"],
  "overallProgressScore": 75,
  "progressLabel": "Good Progress",
  "actionItems": ["action 1", "action 2", "action 3"]
}

Base your analysis on the actual papers completed. If no papers exist, give recommendations based on the subject and grade level.`;

    const completion = await withTimeout(groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }));

    const insights = JSON.parse(completion.choices[0].message.content || '{}');
    return res.json({ ...insights, generatedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

/* ── Delete group ── */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await Group.deleteOne({ _id: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;
