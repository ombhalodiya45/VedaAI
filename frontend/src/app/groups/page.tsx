'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Search, Trash2, BookOpen, GraduationCap, X,
  Loader2, Sparkles, ChevronRight, ClipboardList, CheckCircle2,
  Clock, AlertCircle, TrendingUp, Lightbulb, Target, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/store/useAuthStore';
import { GRADE_LEVELS, Assignment } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Group {
  _id: string;
  name: string;
  subject: string;
  grade: string;
  description: string;
  createdAt: string;
  assignmentCount: number;
  completedCount: number;
  pendingCount: number;
}

interface Insight {
  summary: string;
  topicsCovered: string[];
  strengths: string[];
  gaps: string[];
  recommendedNextTopics: { topic: string; reason: string; difficulty: string; estimatedMarks: number }[];
  suggestedAssignmentTypes: string[];
  overallProgressScore: number;
  progressLabel: string;
  actionItems: string[];
  generatedAt: string;
}

/* ── Create Group Modal ── */
function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Group name is required');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, grade, description, userId: user!.id }),
      });
      if (!res.ok) throw new Error();
      onCreated(await res.json());
      toast.success('Group created!');
    } catch { toast.error('Failed to create group'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Create New Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Group Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Class 9A – Science"
              className="w-full h-10 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics"
                className="w-full h-10 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Grade</label>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:border-gray-400 transition-colors">
                <option value="">Select</option>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes about this group" rows={2}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-10 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Group Detail Modal ── */
function GroupDetailModal({ group, onClose, onDelete }: { group: Group; onClose: () => void; onDelete: () => void }) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/groups/${group._id}/assignments`)
      .then(r => r.json())
      .then((data: Assignment[]) => setAssignments(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingAssignments(false));
  }, [group._id]);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    try {
      const res = await fetch(`${API_URL}/api/groups/${group._id}/insights`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setInsight(await res.json());
    } catch { toast.error('Failed to generate insights'); }
    finally { setLoadingInsight(false); }
  };

  const fmt = (d: string) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    if (status === 'failed')    return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  };

  const difficultyColor = (d: string) => {
    if (d === 'easy')   return 'bg-green-100 text-green-700';
    if (d === 'hard')   return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{group.name}</h3>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                {group.subject && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{group.subject}</span>}
                {group.grade   && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{group.grade}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDeleteConfirm(true)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: group.assignmentCount, color: 'bg-gray-50', text: 'text-gray-800' },
              { label: 'Completed', value: group.completedCount, color: 'bg-green-50', text: 'text-green-700' },
              { label: 'Pending', value: group.pendingCount, color: 'bg-amber-50', text: 'text-amber-700' },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {group.description && (
            <p className="text-sm text-gray-500 italic">{group.description}</p>
          )}

          {/* AI Insights */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> AI Group Insights
              </h4>
              {!insight && (
                <button onClick={fetchInsight} disabled={loadingInsight}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50">
                  {loadingInsight ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {loadingInsight ? 'Analysing…' : 'Generate Insights'}
                </button>
              )}
              {insight && (
                <button onClick={fetchInsight} disabled={loadingInsight}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  {loadingInsight ? <Loader2 className="w-3 h-3 animate-spin" /> : '↺'} Refresh
                </button>
              )}
            </div>

            {!insight && !loadingInsight && (
              <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                <Sparkles className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Click "Generate Insights" to get AI-powered analysis of this group's progress, topics covered, gaps, and what to teach next.</p>
              </div>
            )}

            {loadingInsight && (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <p className="text-sm text-gray-400">AI is analysing your group's assignments and papers…</p>
              </div>
            )}

            {insight && !loadingInsight && (
              <div className="space-y-4">
                {/* Score */}
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                  <div className="text-center shrink-0">
                    <p className={`text-3xl font-bold ${scoreColor(insight.overallProgressScore)}`}>{insight.overallProgressScore}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">/ 100</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{insight.progressLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{insight.summary}</p>
                  </div>
                </div>

                {/* Topics covered */}
                {insight.topicsCovered?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Topics Covered
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {insight.topicsCovered.map((t, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps */}
                {insight.gaps?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Identified Gaps
                    </p>
                    <ul className="space-y-1">
                      {insight.gaps.map((g, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5 shrink-0">•</span>{g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended next topics */}
                {insight.recommendedNextTopics?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-500" /> Recommended Next Topics
                    </p>
                    <div className="space-y-2">
                      {insight.recommendedNextTopics.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 bg-blue-50 rounded-xl p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-gray-800">{t.topic}</p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${difficultyColor(t.difficulty)}`}>{t.difficulty}</span>
                              <span className="text-[10px] text-gray-400">{t.estimatedMarks} marks</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{t.reason}</p>
                          </div>
                          <button onClick={() => { onClose(); router.push('/create'); }}
                            className="shrink-0 text-blue-600 hover:text-blue-800">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action items */}
                {insight.actionItems?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Action Items
                    </p>
                    <ul className="space-y-1.5">
                      {insight.actionItems.map((a, i) => (
                        <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                          <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assignments list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-400" /> Assignments
              </h4>
              <button onClick={() => { onClose(); router.push('/create'); }}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add new
              </button>
            </div>

            {loadingAssignments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                <p className="text-sm text-gray-400">No assignments yet for this group.</p>
                <button onClick={() => { onClose(); router.push('/create'); }}
                  className="mt-3 text-xs font-semibold text-gray-700 underline">
                  Create one now
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map(a => (
                  <button
                    key={a._id}
                    onClick={() => { if (a.status === 'completed') { onClose(); router.push(`/assignments?paper=${a._id}`); } }}
                    disabled={a.status !== 'completed'}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors disabled:cursor-default text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {statusIcon(a.status)}
                      <p className="text-sm text-gray-800 truncate">{a.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-400">{fmt(a.createdAt)}</span>
                      {a.status === 'completed' && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suggested assignment types */}
          {(insight?.suggestedAssignmentTypes?.length ?? 0) > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Suggested Practice
              </p>
              <div className="flex flex-wrap gap-2">
                {insight?.suggestedAssignmentTypes?.map((t, i) => (
                  <span key={i} className="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Group"
          message={`Delete "${group.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

/* ── Group Card ── */
function GroupCard({ group, onClick }: { group: Group; onClick: () => void }) {
  const completionPct = group.assignmentCount > 0
    ? Math.round((group.completedCount / group.assignmentCount) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-md hover:border-gray-200 transition-all text-left w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-gray-500" />
        </div>
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mt-1">
          View details <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 text-[15px]">{group.name}</h3>
        {group.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{group.description}</p>
        )}
      </div>

      {/* Subject / Grade tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {group.subject && (
          <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <BookOpen className="w-3 h-3" />{group.subject}
          </span>
        )}
        {group.grade && (
          <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <GraduationCap className="w-3 h-3" />{group.grade}
          </span>
        )}
      </div>

      {/* Stats + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{group.assignmentCount} assignment{group.assignmentCount !== 1 ? 's' : ''}</span>
          <span className="font-semibold text-gray-700">{completionPct}% done</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-800 transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />{group.completedCount} completed</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" />{group.pendingCount} pending</span>
        </div>
      </div>
    </button>
  );
}

/* ── Main Page ── */
export default function GroupsPage() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API_URL}/api/groups?userId=${user.id}`)
      .then(r => r.json())
      .then((data: Group[]) => setGroups(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/groups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setGroups(g => g.filter(x => x._id !== id));
      setSelectedGroup(null);
      toast.success('Group deleted');
    } catch { toast.error('Failed to delete'); }
    setDeleteId(null);
  };

  const filtered = groups.filter(g =>
    !search ||
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout activeTab="groups" title="My Groups" showFAB={false}>
      <div className="px-4 lg:px-6 pt-4 pb-24">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-400">Loading groups…</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No groups yet</h3>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Create class groups to organise your assignments. Once you have groups, AI can analyse each group's progress and suggest what to teach next.
            </p>
            <button onClick={() => setShowCreate(true)}
              className="mt-7 flex items-center gap-2 px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-black transition-colors">
              <Plus className="w-4 h-4" /> Create Your First Group
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-6">
              <span className="relative flex h-3 w-3 mt-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">My Groups</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {groups.length} group{groups.length !== 1 ? 's' : ''} · Click any card for AI insights
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…"
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
              </div>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 h-10 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors shrink-0">
                <Plus className="w-4 h-4" /> New Group
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-base font-semibold text-gray-800">No results found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(g => (
                  <GroupCard key={g._id} group={g} onClick={() => setSelectedGroup(g)} />
                ))}
              </div>
            )}

            <div className="fixed bottom-[90px] lg:bottom-6 left-1/2 -translate-x-1/2 z-20">
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-full shadow-xl hover:bg-black transition-colors">
                <Plus className="w-4 h-4" /> New Group
              </button>
            </div>
          </>
        )}

        {showCreate && (
          <CreateGroupModal
            onClose={() => setShowCreate(false)}
            onCreated={g => { setGroups(prev => [g, ...prev]); setShowCreate(false); }}
          />
        )}

        {selectedGroup && (
          <GroupDetailModal
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
            onDelete={() => {
              setDeleteId(selectedGroup._id);
              setSelectedGroup(null);
            }}
          />
        )}

        {deleteId && (
          <ConfirmModal
            title="Delete Group"
            message="Are you sure you want to delete this group? This cannot be undone."
            confirmLabel="Delete"
            danger
            onConfirm={() => handleDelete(deleteId)}
            onCancel={() => setDeleteId(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
