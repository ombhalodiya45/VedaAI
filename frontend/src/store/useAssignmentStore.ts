import { create } from 'zustand';
import { Assignment, QuestionPaper, JobStatus } from '@/types';

interface AssignmentStore {
  assignments: Assignment[];
  currentPaper: QuestionPaper | null;
  jobStatuses: Record<string, { status: JobStatus; progress?: number; paperId?: string }>;

  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignmentStatus: (id: string, status: JobStatus) => void;
  setCurrentPaper: (paper: QuestionPaper | null) => void;
  setJobStatus: (assignmentId: string, status: JobStatus, extra?: { progress?: number; paperId?: string }) => void;
  getJobStatus: (assignmentId: string) => { status: JobStatus; progress?: number; paperId?: string } | undefined;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  currentPaper: null,
  jobStatuses: {},

  setAssignments: (assignments) => set({ assignments }),

  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),

  updateAssignmentStatus: (id, status) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, status } : a
      ),
    })),

  setCurrentPaper: (paper) => set({ currentPaper: paper }),

  setJobStatus: (assignmentId, status, extra) =>
    set((state) => ({
      jobStatuses: {
        ...state.jobStatuses,
        [assignmentId]: { status, ...extra },
      },
    })),

  getJobStatus: (assignmentId) => get().jobStatuses[assignmentId],
}));
