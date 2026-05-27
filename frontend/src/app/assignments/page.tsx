'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Loader2, Download, AlertCircle, Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuestionPaperView } from '@/components/paper/QuestionPaperView';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Assignment, QuestionPaper } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ── Paper overlay ── */
function PaperSection({ paperId }: { paperId: string }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { user } = useAuthStore();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  useEffect(() => {
    fetch(`${API_URL}/api/assignments/${paperId}/paper`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: QuestionPaper) => { setPaper(data); setLoading(false); })
      .catch(() => { setFailed(true); setLoading(false); });
  }, [paperId]);

  const handleDownloadPDF = async () => {
    const el = paperRef.current;
    if (!el) return;
    toast.loading('Preparing PDF...', { id: 'pdf' });
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      // Clone into an offscreen fixed container so scroll/overflow don't affect capture
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1;';
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.width = '794px';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);
      await new Promise(r => setTimeout(r, 200));

      const fullHeight = clone.scrollHeight;

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: fullHeight,
        windowWidth: 794,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      });

      document.body.removeChild(wrapper);

      if (!canvas.width || !canvas.height) throw new Error('Empty canvas');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 10;
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const contentW = pw - margin * 2;
      const pageH = ph - margin * 2;
      const totalImgH = (canvas.height * contentW) / canvas.width;

      let yMM = 0;
      while (yMM < totalImgH) {
        if (yMM > 0) pdf.addPage();
        const sliceH = Math.min(pageH, totalImgH - yMM);
        const srcY  = (yMM / totalImgH) * canvas.height;
        const srcH  = (sliceH / totalImgH) * canvas.height;

        const slice = document.createElement('canvas');
        slice.width  = canvas.width;
        slice.height = Math.ceil(srcH);
        const ctx = slice.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, contentW, sliceH);
        yMM += pageH;
      }

      pdf.save(`${paper?.title || 'question-paper'}.pdf`);
      toast.success('PDF downloaded!', { id: 'pdf' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
  };

if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-gray-400" /></div>;
  if (failed || !paper) return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-gray-700 font-medium mb-1">Could not load the paper</p>
      <button onClick={close} className="mt-3 text-sm text-gray-500 underline">Go back</button>
    </div>
  );

  return (
    <div className="px-4 lg:px-6 py-5 space-y-4 no-print-wrapper">

      {/* Dark rounded banner card */}
      <div className="rounded-2xl text-white p-6 no-print" style={{ background: '#272727' }}>
        {/* Message */}
        <p className="text-base font-bold leading-relaxed max-w-2xl">
          Certainly, {firstName}! Here are customized Question Paper
          {paper.gradeLevel || paper.subject
            ? ` for your${paper.gradeLevel ? ` ${paper.gradeLevel}` : ''}${paper.subject ? ` ${paper.subject}` : ''} classes`
            : ''}
          {' on the NCERT chapters:'}
        </p>

        {/* Download button — white with dark text */}
        <button
          onClick={handleDownloadPDF}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download as PDF
        </button>
      </div>

      {/* Paper card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <QuestionPaperView ref={paperRef} paper={paper} />
      </div>

    </div>
  );
}

/* ── Single assignment card ── */
function AssignmentCard({ assignment, onDelete }: { assignment: Assignment; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fmt = (d: string) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const handleView = () => {
    setMenuOpen(false);
    if (assignment.status === 'completed') router.push(`/assignments?paper=${assignment._id}`);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between gap-6 hover:shadow-sm transition-shadow relative">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug truncate">{assignment.title}</h3>
          {assignment.subject && (
            <p className="text-xs text-gray-400 mt-0.5">{assignment.subject}{assignment.gradeLevel ? ` · ${assignment.gradeLevel}` : ''}</p>
          )}
        </div>
        {/* 3-dot menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-20">
                <button
                  onClick={handleView}
                  disabled={assignment.status !== 'completed'}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  View Assignment
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row — dates */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span><span className="font-medium text-gray-700">Assigned on</span> : {fmt(assignment.createdAt)}</span>
        <span><span className="font-medium text-gray-700">Due</span> : {fmt(assignment.dueDate)}</span>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Assignment"
          message="Are you sure you want to delete this assignment? This action cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => { setShowDeleteConfirm(false); onDelete(assignment._id); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

/* ── Assignments list ── */
function AssignmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paperId = searchParams.get('paper');
  const { user } = useAuthStore();
  const { assignments, setAssignments } = useAssignmentStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API_URL}/api/assignments?userId=${user.id}`)
      .then(r => r.json())
      .then((data: Assignment[]) => setAssignments(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, setAssignments]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setAssignments(assignments.filter(a => a._id !== id));
      toast.success('Assignment deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (paperId) {
    return (
      <AppLayout activeTab="assignments" title="Question Paper" showBack showFAB={false}>
        <PaperSection paperId={paperId} />
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout activeTab="assignments" title="Assignments" showFAB={false}>
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-400">Loading assignments...</p>
        </div>
      </AppLayout>
    );
  }

  const filtered = assignments.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const hasAny = assignments.length > 0;

  return (
    <AppLayout activeTab="assignments" title="Assignments" showFAB={false}>
      <div className="px-4 lg:px-6 pt-4 pb-24">

        {/* Page header + filter — only when assignments exist */}
        {hasAny && (
          <>
            <div className="flex items-start gap-3 mb-6">
              <span className="relative flex h-3 w-3 mt-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">Assignments</h1>
                <p className="text-sm text-gray-400 mt-0.5">Manage and create assignments for your classes.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
                Filter By
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Assignment"
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>
          </>
        )}

        {/* Grid / empty state */}
        {!hasAny ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <img src="/noassignmentyet.svg" alt="No assignments" className="w-64 h-64 mb-6 object-contain" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
            </p>
            <button onClick={() => router.push('/create')} className="mt-7 flex items-center gap-2 px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-black transition-colors">
              <Plus className="w-4 h-4" /> Create Your First Assignment
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-sm text-gray-500">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(a => <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} />)}
          </div>
        )}

        {/* Floating Create button — only when assignments exist */}
        {filtered.length > 0 && (
          <div className="fixed bottom-[90px] lg:bottom-6 left-1/2 -translate-x-1/2 z-20 no-print">
            <button
              onClick={() => router.push('/create')}
              className="flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-full shadow-xl hover:bg-black transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={
      <AppLayout activeTab="assignments" title="Assignments" showFAB={false}>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-gray-400" /></div>
      </AppLayout>
    }>
      <AssignmentsContent />
    </Suspense>
  );
}
