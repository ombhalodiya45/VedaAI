'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookMarked, Search, FileText, Loader2, ExternalLink } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { Assignment } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const SUBJECTS = ['All', 'Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Sanskrit', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'];

export default function LibraryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [papers, setPapers] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API_URL}/api/assignments?userId=${user.id}`)
      .then(r => r.json())
      .then((data: Assignment[]) => {
        const completed = Array.isArray(data) ? data.filter(a => a.status === 'completed') : [];
        setPapers(completed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const fmt = (d: string) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const filtered = papers.filter(p => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subject?.toLowerCase().includes(search.toLowerCase()) ||
      p.gradeLevel?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subject === 'All' || p.subject?.toLowerCase() === subject.toLowerCase();
    return matchSearch && matchSubject;
  });

  // Unique subjects from actual data for pills
  const availableSubjects = ['All', ...Array.from(new Set(papers.map(p => p.subject).filter(Boolean)))];
  const subjectPills = availableSubjects.length > 1 ? availableSubjects : SUBJECTS.slice(0, 6);

  return (
    <AppLayout activeTab="library" title="My Library" showFAB={false}>
      <div className="px-4 lg:px-6 pt-4 pb-24">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-400">Loading library…</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
              <BookMarked className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Your library is empty</h3>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              All your completed question papers will appear here. Create your first assignment to get started.
            </p>
            <button
              onClick={() => router.push('/create')}
              className="mt-7 flex items-center gap-2 px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-black transition-colors"
            >
              Create Assignment
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 mb-6">
              <span className="relative flex h-3 w-3 mt-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">My Library</h1>
                <p className="text-sm text-gray-400 mt-0.5">{papers.length} completed paper{papers.length !== 1 ? 's' : ''} saved.</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, subject or grade…"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* Subject pills */}
            <div className="flex gap-2 flex-wrap mb-6">
              {subjectPills.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    subject === s
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-base font-semibold text-gray-800">No papers found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search or filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => (
                  <button
                    key={p._id}
                    onClick={() => router.push(`/assignments?paper=${p._id}`)}
                    className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md hover:border-gray-200 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-900 transition-colors">
                        <FileText className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2">{p.title}</h3>
                      {(p.subject || p.gradeLevel) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {p.subject}{p.subject && p.gradeLevel ? ' · ' : ''}{p.gradeLevel}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 border-t border-gray-50 pt-3">
                      Generated on {fmt(p.createdAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
