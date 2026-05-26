export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QuestionTypeConfig {
  type: QuestionType;
  count: number;
  marksPerQuestion: number;
}

export interface AssignmentInput {
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  schoolName?: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  fileContent?: string;
  userId: string;
}

export interface MCQOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: MCQOption[];
  answer?: string;
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  totalMarks: number;
  questions: Question[];
}

export interface QuestionPaperData {
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  totalMarks: number;
  duration: string;
  sections: Section[];
  generatedAt: string;
}

export interface WSMessage {
  type: 'job_queued' | 'job_processing' | 'job_completed' | 'job_failed' | 'progress';
  assignmentId: string;
  jobId?: string;
  data?: unknown;
  error?: string;
  progress?: number;
}
