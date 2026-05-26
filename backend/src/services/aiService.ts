import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import { AssignmentInput, QuestionPaperData, Section, Question, QuestionType } from '../types';
import { GROQ_MODEL, withTimeout } from '../config/constants';

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq:          'Multiple Choice Questions (MCQ)',
  short_answer: 'Short Answer Questions',
  long_answer:  'Long Answer / Essay Questions',
  true_false:   'True or False Questions',
  fill_blank:   'Fill in the Blanks',
};

function buildPrompt(input: AssignmentInput): string {
  const sections = input.questionTypes
    .filter((qt) => qt.count > 0)
    .map((qt, idx) => {
      const letter = String.fromCharCode(65 + idx);
      return `Section ${letter}: ${QUESTION_TYPE_LABELS[qt.type]} — ${qt.count} questions × ${qt.marksPerQuestion} marks each`;
    })
    .join('\n');

  const totalMarks = input.questionTypes.reduce(
    (sum, qt) => sum + qt.count * qt.marksPerQuestion, 0
  );

  const hints = [
    input.schoolName  && `School/Institution: ${input.schoolName}`,
    input.subject     && `Subject: ${input.subject}`,
    input.gradeLevel  && `Class/Grade: ${input.gradeLevel}`,
  ].filter(Boolean).join('\n');

  return `You are an expert educator creating a structured question paper.

${hints ? `CONTEXT:\n${hints}\n` : ''}TEACHER'S INSTRUCTIONS:
${input.additionalInstructions || 'Create a comprehensive question paper based on the structure below.'}
${input.fileContent ? `\nREFERENCE CONTENT:\n${input.fileContent.slice(0, 3000)}` : ''}

NOTE: Use the context above to set subject, grade level, and title in the output JSON. The title should be a short academic title (e.g. "Chapter 3 – Metals and Non-Metals"). Put the school name in the "title" field prefixed if appropriate.

TOTAL MARKS: ${totalMarks}

QUESTION STRUCTURE:
${sections}

Generate a complete question paper as a JSON object with this EXACT structure (no extra text, no markdown, only raw JSON):
{
  "title": "string",
  "subject": "string",
  "topic": "string",
  "gradeLevel": "string",
  "totalMarks": number,
  "duration": "string",
  "sections": [
    {
      "id": "section_a",
      "title": "Section A",
      "instruction": "string",
      "totalMarks": number,
      "questions": [
        {
          "id": "q1",
          "text": "string",
          "type": "mcq|short_answer|long_answer|true_false|fill_blank",
          "difficulty": "easy|medium|hard",
          "marks": number,
          "options": [{"label": "A", "text": "string"}],
          "answer": "string"
        }
      ]
    }
  ]
}

RULES:
1. Vary difficulty: ~40% easy, ~40% medium, ~20% hard
2. MCQ must have exactly 4 options (A, B, C, D)
3. Include options array ONLY for MCQ questions
4. Return ONLY valid JSON — no markdown fences, no explanation`;
}

export async function generateQuestionPaper(input: AssignmentInput): Promise<QuestionPaperData> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await withTimeout(groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert educator. Always respond with valid JSON only — no markdown, no explanation, no code fences.',
      },
      {
        role: 'user',
        content: buildPrompt(input),
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  }));

  const rawText = (completion.choices[0]?.message?.content || '').trim();

  let parsed: QuestionPaperData;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response as JSON');
    parsed = JSON.parse(jsonMatch[0]);
  }

  parsed.sections = parsed.sections.map((section: Section, sIdx: number) => ({
    ...section,
    id: section.id || `section_${String.fromCharCode(97 + sIdx)}`,
    questions: section.questions.map((q: Question) => ({
      ...q,
      id: q.id || uuidv4(),
    })),
  }));

  parsed.generatedAt = new Date().toISOString();
  return parsed;
}
