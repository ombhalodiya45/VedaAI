'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Download, RefreshCw, Loader2, AlertCircle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuestionPaperView } from '@/components/paper/QuestionPaperView';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { wsManager } from '@/lib/websocket';
import { QuestionPaper, Assignment } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function AssignmentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const isGenerating = searchParams.get('generating') === 'true';

  const { setCurrentPaper } = useAssignmentStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [status, setStatus] = useState<'loading' | 'generating' | 'ready' | 'failed'>(
    isGenerating ? 'generating' : 'loading'
  );
  const [progress, setProgress] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  const loadPaper = async () => {
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}/paper`);
      if (!res.ok) throw new Error();
      const data: QuestionPaper = await res.json();
      setCurrentPaper(data);
      if (isGenerating) {
        addNotification({
          assignmentId: id,
          title: 'Paper Ready!',
          message: `${data.subject || 'Your'} question paper${data.gradeLevel ? ` for ${data.gradeLevel}` : ''} is ready to view.`,
        });
        router.replace(`/assignments?paper=${id}`);
      } else {
        setPaper(data);
        setStatus('ready');
      }
    } catch {
      setStatus('failed');
    }
  };

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let done = false;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/assignments/${id}`);
        const data: Assignment = await res.json();
        if (data.status === 'completed' && !done) {
          done = true;
          if (pollInterval) clearInterval(pollInterval);
          loadPaper();
        } else if (data.status === 'failed' && !done) {
          done = true;
          if (pollInterval) clearInterval(pollInterval);
          setStatus('failed');
        } else if (!done) {
          setStatus('generating');
          setProgress(p => Math.min(p + 5, 90));
        }
      } catch {
        if (!done) setStatus('failed');
      }
    };

    checkStatus();
    pollInterval = setInterval(checkStatus, 3000);

    const unsubscribe = wsManager.subscribe((msg) => {
      if (msg.assignmentId !== id) return;
      if (msg.type === 'progress') setProgress(msg.progress || 0);
      if (msg.type === 'job_processing') { setStatus('generating'); setProgress(msg.progress || 10); }
      if (msg.type === 'job_completed' && !done) {
        done = true;
        if (pollInterval) clearInterval(pollInterval);
        setProgress(100);
        setTimeout(() => loadPaper(), 500);
      }
      if (msg.type === 'job_failed' && !done) {
        done = true;
        if (pollInterval) clearInterval(pollInterval);
        setStatus('failed');
        toast.error('Generation failed.');
      }
    });

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRegenerate = async () => {
    if (!confirm('Regenerate this question paper? The current paper will be replaced.')) return;
    setRegenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}/regenerate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setPaper(null);
      setStatus('generating');
      setProgress(0);
      toast.success('Regeneration started!');
    } catch {
      toast.error('Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!paperRef.current) return;
    toast.loading('Preparing PDF...', { id: 'pdf' });
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(paperRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${paper?.title || 'question-paper'}.pdf`);
      toast.success('PDF downloaded!', { id: 'pdf' });
    } catch {
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
  };

  /* ── Generating state ─────────────────────────────────────────── */
  if (status === 'generating' || status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
          <Sparkles className="w-8 h-8 text-gray-700 animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Question Paper</h2>
        <p className="text-gray-500 mb-8 text-sm">AI is crafting your structured assessment…</p>
        <div className="w-72">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">{progress}% complete</p>
        </div>
        <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          This usually takes 15–30 seconds
        </div>
      </div>
    );
  }

  /* ── Failed state ─────────────────────────────────────────────── */
  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Generation Failed</h2>
        <p className="text-gray-500 mb-6 text-sm">Something went wrong while generating the question paper.</p>
        <div className="flex items-center gap-3">
          <Link href="/" className="px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Go Home
          </Link>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ── Ready state ──────────────────────────────────────────────── */
  return (
    <div>
      {/* Dark banner */}
      <div className="bg-gray-900 text-white px-6 py-5 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">VedaAI</p>
            <h1 className="text-lg font-semibold">
              {paper?.subject ? `Your ${paper.subject} Question Paper is Ready` : 'Your Question Paper is Ready'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {paper?.sections.reduce((s, sec) => s + sec.questions.length, 0)} questions · {paper?.totalMarks} marks · {paper?.duration}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-4 py-2 rounded-full border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-5 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Paper */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 md:p-14">
          <QuestionPaperView ref={paperRef} paper={paper!} />
        </div>
      </div>
    </div>
  );
}

export default function AssignmentPage() {
  return (
    <AppLayout activeTab="assignments" title="Question Paper" showBack showFAB={false}>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
        </div>
      }>
        <AssignmentContent />
      </Suspense>
    </AppLayout>
  );
}
