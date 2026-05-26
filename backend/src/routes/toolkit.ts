import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import { GROQ_MODEL, withTimeout } from '../config/constants';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/lesson-plan', async (req: Request, res: Response) => {
  try {
    const { subject, grade, topic, duration = '45 minutes', objectives = '' } = req.body;
    if (!subject || !grade || !topic) return res.status(400).json({ error: 'subject, grade, topic required' });

    const prompt = `You are an expert curriculum designer. Create a detailed lesson plan.

Subject: ${subject}
Grade/Class: ${grade}
Topic: ${topic}
Duration: ${duration}
${objectives ? `Learning Objectives: ${objectives}` : ''}

Return a JSON object with this exact structure:
{
  "title": "lesson title",
  "subject": "${subject}",
  "grade": "${grade}",
  "topic": "${topic}",
  "duration": "${duration}",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "materials": ["material 1", "material 2"],
  "sections": [
    { "name": "Introduction", "duration": "5 min", "activity": "activity description", "teacherActions": "what teacher does", "studentActions": "what students do" },
    { "name": "Direct Instruction", "duration": "15 min", "activity": "activity description", "teacherActions": "what teacher does", "studentActions": "what students do" },
    { "name": "Guided Practice", "duration": "10 min", "activity": "activity description", "teacherActions": "what teacher does", "studentActions": "what students do" },
    { "name": "Independent Practice", "duration": "10 min", "activity": "activity description", "teacherActions": "what teacher does", "studentActions": "what students do" },
    { "name": "Closure", "duration": "5 min", "activity": "activity description", "teacherActions": "what teacher does", "studentActions": "what students do" }
  ],
  "assessment": "how to assess learning",
  "homework": "homework description",
  "notes": "any additional notes"
}`;

    const completion = await withTimeout(groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }));

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

router.post('/rubric', async (req: Request, res: Response) => {
  try {
    const { assignmentTitle, grade, totalMarks = 100, criteria = '' } = req.body;
    if (!assignmentTitle || !grade) return res.status(400).json({ error: 'assignmentTitle and grade required' });

    const prompt = `You are an expert educator. Create a detailed grading rubric.

Assignment: ${assignmentTitle}
Grade/Class: ${grade}
Total Marks: ${totalMarks}
${criteria ? `Key Criteria to include: ${criteria}` : ''}

Return a JSON object with this exact structure:
{
  "title": "rubric title",
  "assignment": "${assignmentTitle}",
  "grade": "${grade}",
  "totalMarks": ${totalMarks},
  "criteria": [
    {
      "name": "criterion name",
      "maxMarks": 25,
      "levels": [
        { "label": "Excellent", "marks": "23-25", "description": "detailed description" },
        { "label": "Good", "marks": "18-22", "description": "detailed description" },
        { "label": "Satisfactory", "marks": "13-17", "description": "detailed description" },
        { "label": "Needs Improvement", "marks": "0-12", "description": "detailed description" }
      ]
    }
  ],
  "generalNotes": "any general grading notes"
}

Create 4 criteria that add up to ${totalMarks} total marks.`;

    const completion = await withTimeout(groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }));

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

router.post('/questions', async (req: Request, res: Response) => {
  try {
    const { subject, grade, topic, count = 10, types = 'MCQ, Short Answer' } = req.body;
    if (!subject || !grade || !topic) return res.status(400).json({ error: 'subject, grade, topic required' });

    const prompt = `You are an expert teacher. Generate exactly ${count} questions for students.

Subject: ${subject}
Grade/Class: ${grade}
Topic: ${topic}
Question types to include: ${types}

Return a JSON object with this exact structure:
{
  "title": "Questions on ${topic}",
  "subject": "${subject}",
  "grade": "${grade}",
  "topic": "${topic}",
  "totalQuestions": ${count},
  "questions": [
    {
      "number": 1,
      "type": "MCQ",
      "question": "question text here",
      "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
      "answer": "A. first option",
      "marks": 1
    },
    {
      "number": 2,
      "type": "Short Answer",
      "question": "question text here",
      "options": [],
      "answer": "expected answer text",
      "marks": 2
    }
  ]
}

Rules:
- Generate exactly ${count} questions
- Distribute types as requested: ${types}
- For MCQ: always include 4 options array
- For non-MCQ: options should be empty array []
- marks: 1 for MCQ/True-False, 2-3 for Short Answer, 5+ for Long Answer
- Make questions appropriate for ${grade} level on topic: ${topic}`;

    const completion = await withTimeout(groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }));

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

export default router;
