'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, BookOpen, Clock } from 'lucide-react';
import { ToolkitChat, ChatStep } from '../_components/ToolkitChat';
import { GRADE_LEVELS } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STEPS: ChatStep[] = [
  { key: 'subject',    question: "What subject are you planning this lesson for?",        type: 'text',     placeholder: 'e.g. Science, Mathematics, History' },
  { key: 'grade',      question: "Which grade or class is this for?",                      type: 'select',   options: GRADE_LEVELS },
  { key: 'topic',      question: "What topic will you be teaching?",                       type: 'text',     placeholder: 'e.g. Photosynthesis, Quadratic Equations' },
  { key: 'duration',   question: "How long is your class?",                                type: 'select',   options: ['30 minutes', '45 minutes', '60 minutes', '90 minutes'], defaultValue: '45 minutes' },
  { key: 'objectives', question: "Any specific learning objectives? (optional)",           type: 'textarea', placeholder: 'What should students know by the end?', optional: true },
];

interface LessonSection { name: string; duration: string; activity: string; teacherActions: string; studentActions: string; }
interface LessonPlan {
  title: string; subject: string; grade: string; topic: string; duration: string;
  objectives: string[]; materials: string[];
  sections: LessonSection[];
  assessment: string; homework: string;
}

function LessonPlanResult({ plan }: { plan: LessonPlan }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-4 max-w-2xl">

      {/* Header card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 leading-snug">{plan.title}</h2>
        <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{plan.subject}</span>
          <span>{plan.grade}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{plan.duration}</span>
        </div>
      </div>

      {/* Objectives */}
      {plan.objectives?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Learning Objectives</h3>
          <ul className="space-y-2">
            {plan.objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />{o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Materials */}
      {plan.materials?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Materials Needed</h3>
          <div className="flex flex-wrap gap-2">
            {plan.materials.map((m, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Lesson Flow */}
      {plan.sections?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lesson Flow</h3>
          </div>
          {plan.sections.map((s, i) => (
            <div key={i} className="border-b border-gray-50 last:border-0">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                  <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                  <span className="text-xs text-gray-400">· {s.duration}</span>
                </div>
                {open === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm space-y-2 bg-gray-50/70">
                  <p className="text-gray-700"><span className="font-semibold">Activity:</span> {s.activity}</p>
                  <p className="text-gray-600"><span className="font-semibold">Teacher:</span> {s.teacherActions}</p>
                  <p className="text-gray-600"><span className="font-semibold">Students:</span> {s.studentActions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assessment + Homework */}
      <div className="grid grid-cols-2 gap-4">
        {plan.assessment && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assessment</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{plan.assessment}</p>
          </div>
        )}
        {plan.homework && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Homework</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{plan.homework}</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default function LessonPlannerPage() {
  return (
    <ToolkitChat
      toolTitle="Lesson Planner"
      toolKey="lesson-planner"
      intro="Hi! I'll help you create a structured lesson plan. Just answer a few quick questions."
      steps={STEPS}
      apiEndpoint={`${API_URL}/api/toolkit/lesson-plan`}
      buildPayload={a => ({
        subject: a.subject,
        grade: a.grade,
        topic: a.topic,
        duration: a.duration || '45 minutes',
        objectives: a.objectives || '',
      })}
      getHistoryTitle={a => `${a.grade ?? ''} ${a.subject ?? ''} — ${a.topic ?? ''}`.trim()}
      renderResult={data => <LessonPlanResult plan={data as LessonPlan} />}
      emptyTitle="Your lesson plan will appear here"
      emptyDesc="Answer the questions to generate a structured, curriculum-aligned lesson plan."
    />
  );
}
