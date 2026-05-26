'use client';

import { useRouter } from 'next/navigation';
import { PenLine, FileText, HelpCircle, Brain, BarChart2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const TOOLS = [
  { icon: PenLine,     title: 'Lesson Planner',       desc: 'Create structured lesson plans aligned to curriculum in seconds.',     route: '/toolkit/lesson-planner',       live: true  },
  { icon: FileText,    title: 'Rubric Builder',        desc: 'Design clear grading rubrics for any assignment type.',                route: '/toolkit/rubric-builder',        live: true  },
  { icon: HelpCircle,  title: 'Question Generator',   desc: 'Generate questions from any topic or document instantly.',             route: '/toolkit/question-generator',    live: true  },
  { icon: Brain,       title: 'Auto Grader',           desc: 'Let AI grade student submissions with detailed feedback.',             route: null,                             live: false },
  { icon: BarChart2,   title: 'Performance Analytics', desc: 'Track student progress and identify learning gaps.',                  route: null,                             live: false },
];

export default function ToolkitPage() {
  const router = useRouter();

  return (
    <AppLayout activeTab="toolkit" title="AI Teacher's Toolkit" showFAB={false}>
      <div className="px-4 lg:px-6 pt-4 pb-24">

        <div className="flex items-start gap-3 mb-8">
          <span className="relative flex h-3 w-3 mt-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">AI Teacher&apos;s Toolkit</h1>
            <p className="text-sm text-gray-400 mt-0.5">Powerful AI tools to supercharge your teaching workflow.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(({ icon: Icon, title, desc, route, live }) => (
            <div
              key={title}
              onClick={() => live && route && router.push(route)}
              className={`bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3 transition-all ${
                live ? 'hover:shadow-md cursor-pointer hover:border-gray-200 active:scale-[0.99]' : 'opacity-60'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${live ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <Icon className={`w-5 h-5 ${live ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    live ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {live ? 'Live' : 'Coming Soon'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
              {live && (
                <span className="mt-1 text-xs font-semibold text-gray-900">Open Tool →</span>
              )}
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
