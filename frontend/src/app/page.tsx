'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Users, BookMarked, Lightbulb, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Assignment } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const QUICK_ACTIONS = [
  {
    icon: Plus,
    label: 'Create Assignment',
    desc: 'Generate an AI-powered question paper',
    href: '/create',
    bg: 'bg-gray-900',
    text: 'text-white',
    iconBg: 'bg-white/10',
  },
  {
    icon: Users,
    label: 'My Groups',
    desc: 'Manage your student groups',
    href: '/groups',
    bg: 'bg-white',
    text: 'text-gray-900',
    iconBg: 'bg-gray-100',
  },
  {
    icon: BookMarked,
    label: 'My Library',
    desc: 'Access saved resources',
    href: '/library',
    bg: 'bg-white',
    text: 'text-gray-900',
    iconBg: 'bg-gray-100',
  },
  {
    icon: Lightbulb,
    label: "AI Toolkit",
    desc: 'Explore AI teaching tools',
    href: '/toolkit',
    bg: 'bg-white',
    text: 'text-gray-900',
    iconBg: 'bg-gray-100',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { assignments, setAssignments } = useAssignmentStore();
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'Teacher';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoadingAssignments(false); return; }
    fetch(`${API_URL}/api/assignments?userId=${user.id}`)
      .then(r => r.json())
      .then((data: Assignment[]) => { setAssignments(Array.isArray(data) ? data : []); setLoadingAssignments(false); })
      .catch(() => setLoadingAssignments(false));
  }, [user, authLoading, setAssignments]);

  const completed = assignments.filter(a => a.status === 'completed').length;
  const pending   = assignments.filter(a => a.status === 'pending' || a.status === 'processing').length;
  const recent    = assignments.slice(0, 3);

  const STATS = [
    { icon: FileText,     label: 'Total Papers',      value: assignments.length, color: 'text-gray-900' },
    { icon: CheckCircle2, label: 'Completed',          value: completed,          color: 'text-green-600' },
    { icon: Clock,        label: 'In Progress',        value: pending,            color: 'text-amber-500' },
    { icon: TrendingUp,   label: 'This Month',         value: assignments.filter(a => {
        const d = new Date(a.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length, color: 'text-blue-600' },
  ];

  return (
    <AppLayout activeTab="home" title="Home" showFAB={false}>
      <div className="p-4 lg:p-6 space-y-6">

        {/* Greeting banner */}
        <div
          className="rounded-2xl p-6 lg:p-8 flex items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}
        >
          <div>
            <p className="text-sm text-gray-400 mb-1">{greeting},</p>
            <h1 className="text-2xl font-bold text-white">{firstName} 👋</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-xs">
              Ready to create something great today? Your students are waiting.
            </p>
          </div>
          <button
            onClick={() => router.push('/create')}
            className="hidden sm:flex shrink-0 items-center gap-2 px-5 py-3 bg-white text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, desc, href, bg, text, iconBg }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className={`${bg} ${text} rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 text-left hover:shadow-sm transition-all hover:-translate-y-0.5`}
              >
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className={`text-xs mt-0.5 ${bg === 'bg-gray-900' ? 'text-gray-400' : 'text-gray-400'}`}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent assignments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Papers</h2>
            <button
              onClick={() => router.push('/assignments')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              View all →
            </button>
          </div>

          {loadingAssignments ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400">Loading…</p>
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">No papers available.</p>
              {user && (
                <button
                  onClick={() => router.push('/create')}
                  className="text-sm font-semibold text-gray-700 underline"
                >
                  Create your first one
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map(a => (
                <button
                  key={a._id}
                  onClick={() => router.push(`/assignments?paper=${a._id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between gap-4 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400 truncate">{a.subject} · {a.gradeLevel}</p>
                    </div>
                  </div>
                  {a.status === 'completed' ? (
                    <span className="shrink-0 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">Ready</span>
                  ) : a.status === 'failed' ? (
                    <span className="shrink-0 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">Failed</span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Generating…</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
