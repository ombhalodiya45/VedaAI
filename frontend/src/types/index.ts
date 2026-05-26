export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QuestionTypeConfig {
  type: QuestionType;
  count: number;
  marksPerQuestion: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  file?: File;
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

export interface QuestionPaper {
  _id: string;
  assignmentId: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  totalMarks: number;
  duration: string;
  sections: Section[];
  generatedAt: string;
  createdAt: string;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  userId: string;
  groupId?: string;
  jobId?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WSMessage {
  type: 'connected' | 'job_queued' | 'job_processing' | 'job_completed' | 'job_failed' | 'progress';
  assignmentId?: string;
  jobId?: string;
  data?: { paperId?: string };
  error?: string;
  progress?: number;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple Choice (MCQ)',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blanks',
};

export const GRADE_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12', 'Undergraduate', 'Postgraduate',
];

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};
