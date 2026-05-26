import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function getTotalMarks(questionTypes: { count: number; marksPerQuestion: number }[]): number {
  return questionTypes.reduce((sum, qt) => sum + qt.count * qt.marksPerQuestion, 0);
}
