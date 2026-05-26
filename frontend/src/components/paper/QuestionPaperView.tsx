'use client';

import { forwardRef } from 'react';
import { QuestionPaper, Question } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

interface Props {
  paper: QuestionPaper;
}

export const QuestionPaperView = forwardRef<HTMLDivElement, Props>(({ paper }, ref) => {
  const schoolName = useAuthStore((s) => s.schoolName);

  return (
    <div ref={ref} className="bg-white text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>

      {/* ── Header ── */}
      <div className="text-center mb-5">
        <h1 className="text-2xl font-bold tracking-wide">
          {schoolName || 'School / Institution'}
        </h1>
        {paper.subject && (
          <p className="text-base font-semibold mt-1">Subject: {paper.subject}</p>
        )}
        {paper.gradeLevel && (
          <p className="text-base font-semibold">Class: {paper.gradeLevel}</p>
        )}
      </div>

      {/* ── Time / Marks row ── */}
      <div className="flex justify-between text-sm font-medium mb-4">
        <span>Time Allowed: {paper.duration}</span>
        <span>Maximum Marks: {paper.totalMarks}</span>
      </div>

      {/* ── Single instruction line ── */}
      <p className="text-sm font-bold mb-5">
        All questions are compulsory unless stated otherwise.
      </p>

      {/* ── Student info ── */}
      <div className="mb-8 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold shrink-0">Name:</span>
          <span className="border-b border-gray-800 inline-block" style={{ width: 260 }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold shrink-0">Roll Number:</span>
          <span className="border-b border-gray-800 inline-block" style={{ width: 140 }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold shrink-0">Class:</span>
          <span className="text-sm">{paper.gradeLevel || ''}</span>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="space-y-8">
        {paper.sections.map((sec, sIdx) => {
          const globalOffset = paper.sections
            .slice(0, sIdx)
            .reduce((sum, s) => sum + s.questions.length, 0);

          return (
            <div key={sec.id}>
              {/* Section heading */}
              <div className="text-center mb-3">
                <p className="text-base font-bold">{sec.title}</p>
              </div>

              {/* Section instruction */}
              {sec.instruction && (
                <div className="mb-3">
                  <p className="text-sm italic text-gray-700">{sec.instruction}</p>
                </div>
              )}

              {/* Questions */}
              <div className="space-y-5">
                {sec.questions.map((q: Question, qIdx: number) => (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    number={globalOffset + qIdx + 1}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="mt-10 pt-4 border-t border-gray-300 text-center text-sm font-bold">
        End of Question Paper
      </div>
    </div>
  );
});

QuestionPaperView.displayName = 'QuestionPaperView';

function QuestionItem({ question, number }: { question: Question; number: number }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="shrink-0 font-semibold" style={{ minWidth: '1.6rem' }}>{number}.</span>
      <div className="flex-1">
        {/* Question + marks */}
        <div className="flex items-start justify-between gap-4">
          <p className="leading-relaxed flex-1">{question.text}</p>
          <span className="shrink-0 text-gray-700 font-medium">[{question.marks} Marks]</span>
        </div>

        {/* MCQ options */}
        {question.type === 'mcq' && question.options && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2">
            {question.options.map((opt) => (
              <p key={opt.label}>({opt.label}) {opt.text}</p>
            ))}
          </div>
        )}

        {/* True/False */}
        {question.type === 'true_false' && (
          <p className="mt-1 text-gray-700">(True / False)</p>
        )}

        {/* Answer lines — short / fill */}
        {(question.type === 'short_answer' || question.type === 'fill_blank') && (
          <div className="mt-3 space-y-3">
            {[1, 2].map(i => <div key={i} className="border-b border-gray-400" style={{ height: '1.4rem' }} />)}
          </div>
        )}

        {/* Answer lines — long */}
        {question.type === 'long_answer' && (
          <div className="mt-3 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="border-b border-gray-400" style={{ height: '1.4rem' }} />)}
          </div>
        )}
      </div>
    </div>
  );
}
