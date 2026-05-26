import { Schema, model, Document } from 'mongoose';
import { QuestionTypeConfig, JobStatus } from '../types';

export interface IAssignment extends Document {
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  dueDate: Date;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  filePath?: string;
  fileContent?: string;
  userId: string;
  groupId?: string;
  jobId?: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeConfigSchema = new Schema({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 0 },
  marksPerQuestion: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: false, trim: true, default: 'New Assignment' },
    subject: { type: String, required: false, trim: true, default: '' },
    topic: { type: String, required: false, trim: true, default: '' },
    gradeLevel: { type: String, required: false, default: '' },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeConfigSchema], required: true },
    additionalInstructions: { type: String },
    filePath: { type: String },
    fileContent: { type: String },
    userId:  { type: String, required: true, index: true },
    groupId: { type: String, default: null, index: true },
    jobId:   { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
AssignmentSchema.index({ userId: 1, createdAt: -1 });
AssignmentSchema.index({ userId: 1, status: 1 });

export const Assignment = model<IAssignment>('Assignment', AssignmentSchema);
