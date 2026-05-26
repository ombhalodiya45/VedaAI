'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ToolkitChat, ChatStep } from '../_components/ToolkitChat';
import { GRADE_LEVELS } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STEPS: ChatStep[] = [
  { key: 'subject', question: "What subject are these questions for?",                   type: 'text',   placeholder: 'e.g. Science, History, Mathematics' },
  { key: 'grade',   question: "Which grade is this for?",                                type: 'select', options: GRADE_LEVELS },
  { key: 'topic',   question: "What topic should I generate questions on?",              type: 'text',   placeholder: 'e.g. The Water Cycle, World War II' },
  { key: 'count',   question: "How many questions do you need?",                         type: 'number', placeholder: '10', defaultValue: '10' },
  { key: 'types',   question: "What types of questions? (e.g. MCQ, Short Answer, Long Answer, True/False)", type: 'text', placeholder: 'MCQ, Short Answer', defaultValue: 'MCQ, Short Answer' },
];

interface QuestionItem {
  number: number;
  type: string;
  question: string;
  options?: string[];
  answer: string;
  marks: number;
}
interface QuestionSet {
  title: string; subject: string; grade: string; topic: string; totalQuestions: number;
  questions: QuestionItem[];
}

const TYPE_COLORS: Record<string, string> = {
  'mcq':          'bg-blue-100 text-blue-700',
  'short answer': 'bg-green-100 text-green-700',
  'long answer':  'bg-purple-100 text-purple-700',
  'true/false':   'bg-amber-100 text-amber-700',
};
function typeColor(t: string) {
  return TYPE_COLORS[t.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
}

function QuestionSetResult({ qs }: { qs: QuestionSet }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">{qs.title}</h2>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          <span>{qs.subject}</span><span>·</span>
          <span>{qs.grade}</span><span>·</span>
          <span className="font-semibold text-gray-700">{qs.totalQuestions ?? qs.questions?.length} questions</span>
        </div>
        <button
          onClick={() => setShowAnswers(v => !v)}
          className="mt-3 text-xs font-semibold text-gray-700 flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          {showAnswers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showAnswers ? 'Hide answer key' : 'Show answer key'}
        </button>
      </div>

      {/* Questions */}
      {qs.questions?.map((q, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">Q{q.number ?? i + 1}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor(q.type)}`}>
                  {q.type}
                </span>
              </div>
              {q.marks && (
                <span className="text-xs text-gray-400 shrink-0">[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span>
              )}
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{q.question}</p>

            {/* MCQ options */}
            {(q.options?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5">
                {q.options!.map((opt, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="shrink-0 w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">
                      {String.fromCharCode(65 + j)}
                    </span>
                    <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Answer key */}
            {showAnswers && q.answer && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-green-600">Answer: <span className="font-normal text-gray-700">{q.answer}</span></p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function QuestionGeneratorPage() {
  return (
    <ToolkitChat
      toolTitle="Question Generator"
      toolKey="question-generator"
      intro="Hi! I'll generate questions on any topic for you. Just answer a few things."
      steps={STEPS}
      apiEndpoint={`${API_URL}/api/toolkit/questions`}
      buildPayload={a => ({
        subject: a.subject,
        grade: a.grade,
        topic: a.topic,
        count: parseInt(a.count || '10'),
        types: a.types || 'MCQ, Short Answer',
      })}
      getHistoryTitle={a => `${a.count ?? '10'} Questions — ${a.topic ?? ''} (${a.grade ?? ''})`.trim()}
      renderResult={data => <QuestionSetResult qs={data as QuestionSet} />}
      emptyTitle="Your questions will appear here"
      emptyDesc="Answer the questions to generate a custom question set on any topic."
    />
  );
}
