'use client';

import { ToolkitChat, ChatStep } from '../_components/ToolkitChat';
import { GRADE_LEVELS } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STEPS: ChatStep[] = [
  { key: 'assignmentTitle', question: "What's the title of this assignment?",                        type: 'text',     placeholder: 'e.g. Chapter 3 Essay, Science Project' },
  { key: 'grade',           question: "Which grade is this for?",                                     type: 'select',   options: GRADE_LEVELS },
  { key: 'totalMarks',      question: "What's the total marks for this assignment?",                  type: 'number',   placeholder: '100', defaultValue: '100' },
  { key: 'criteria',        question: "What key criteria should I assess? (optional)",                type: 'textarea', placeholder: 'e.g. Content accuracy, Writing style, Creativity', optional: true },
];

interface RubricLevel { label: string; marks: string; description: string; }
interface RubricCriterion { name: string; maxMarks: number; levels: RubricLevel[]; }
interface Rubric {
  title: string; assignment: string; grade: string; totalMarks: number; generalNotes: string;
  criteria: RubricCriterion[];
}

const LEVEL_STYLES = [
  { bg: 'bg-green-50  border-green-200',  text: 'text-green-700'  },
  { bg: 'bg-blue-50   border-blue-200',   text: 'text-blue-700'   },
  { bg: 'bg-amber-50  border-amber-200',  text: 'text-amber-700'  },
  { bg: 'bg-red-50    border-red-200',    text: 'text-red-700'    },
];

function RubricResult({ rubric }: { rubric: Rubric }) {
  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">{rubric.title}</h2>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          <span>{rubric.assignment}</span>
          <span>·</span>
          <span>{rubric.grade}</span>
          <span>·</span>
          <span className="font-semibold text-gray-700">{rubric.totalMarks} marks</span>
        </div>
      </div>

      {/* Criteria */}
      {rubric.criteria?.map((c, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">{c.name}</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{c.maxMarks} marks</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
            {c.levels?.map((l, j) => {
              const s = LEVEL_STYLES[j] || LEVEL_STYLES[3];
              return (
                <div key={j} className={`rounded-xl border p-3 ${s.bg}`}>
                  <p className={`text-xs font-bold mb-1 ${s.text}`}>{l.label}</p>
                  <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{l.marks} marks</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{l.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* General notes */}
      {rubric.generalNotes && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">General Notes</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{rubric.generalNotes}</p>
        </div>
      )}
    </div>
  );
}

export default function RubricBuilderPage() {
  return (
    <ToolkitChat
      toolTitle="Rubric Builder"
      toolKey="rubric-builder"
      intro="Hi! I'll help you build a detailed grading rubric. A few quick questions first."
      steps={STEPS}
      apiEndpoint={`${API_URL}/api/toolkit/rubric`}
      buildPayload={a => ({
        assignmentTitle: a.assignmentTitle,
        grade: a.grade,
        totalMarks: parseInt(a.totalMarks || '100'),
        criteria: a.criteria || '',
      })}
      getHistoryTitle={a => `${a.assignmentTitle ?? 'Rubric'} — ${a.grade ?? ''}`.trim()}
      renderResult={data => <RubricResult rubric={data as Rubric} />}
      emptyTitle="Your rubric will appear here"
      emptyDesc="Answer the questions to generate a clear, detailed grading rubric."
    />
  );
}
