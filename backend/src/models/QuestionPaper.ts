import { Schema, model, Document } from 'mongoose';
import { Section } from '../types';

export interface IQuestionPaper extends Document {
  assignmentId: string;
  userId: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  totalMarks: number;
  duration: string;
  sections: Section[];
  generatedAt: Date;
  createdAt: Date;
}

const MCQOptionSchema = new Schema({
  label: String,
  text: String,
});

const QuestionSchema = new Schema({
  id: String,
  text: { type: String, required: true },
  type: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  options: [MCQOptionSchema],
  answer: String,
});

const SectionSchema = new Schema({
  id: String,
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  questions: [QuestionSchema],
});

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    duration: { type: String, required: true },
    sections: [SectionSchema],
    generatedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const QuestionPaper = model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
