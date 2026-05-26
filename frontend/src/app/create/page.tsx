'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Upload, CalendarDays, Plus, Minus, X, Mic, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthModal } from '@/components/ui/AuthModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { QuestionType } from '@/types';

interface Group { _id: string; name: string; subject: string; grade: string; }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TYPE_OPTIONS: { value: QuestionType | 'diagram' | 'numerical'; label: string }[] = [
  { value: 'mcq',          label: 'Multiple Choice Questions' },
  { value: 'short_answer', label: 'Short Questions' },
  { value: 'long_answer',  label: 'Long Answer Questions' },
  { value: 'true_false',   label: 'True / False Questions' },
  { value: 'fill_blank',   label: 'Fill in the Blanks' },
  { value: 'diagram',      label: 'Diagram / Graph-Based Questions' },
  { value: 'numerical',    label: 'Numerical Problems' },
];

interface DynamicRow { id: string; type: string; count: number; marks: number; }

const defaultRows = (): DynamicRow[] => [
  { id: '1', type: 'mcq',          count: 4, marks: 1 },
  { id: '2', type: 'short_answer', count: 3, marks: 2 },
];

function normaliseType(type: string): QuestionType {
  if (type === 'diagram')   return 'long_answer';
  if (type === 'numerical') return 'short_answer';
  return type as QuestionType;
}

export default function CreatePage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, loading, schoolName } = useAuthStore();
  const { addAssignment, setJobStatus } = useAssignmentStore();

  const [subject,    setSubject]    = useState('');
  const [grade,      setGrade]      = useState('');
  const [dueDate,    setDueDate]    = useState('');
  const [groupId,    setGroupId]    = useState('');
  const [groups,     setGroups]     = useState<Group[]>([]);
  const [rows,       setRows]       = useState<DynamicRow[]>(defaultRows);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [file,       setFile]       = useState<File | undefined>();
  const [dragging,   setDragging]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  // Fetch user's groups for the selector
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/groups?userId=${user.id}`)
      .then(r => r.json())
      .then((data: Group[]) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  const totalQuestions = rows.reduce((s, r) => s + r.count, 0);
  const totalMarks     = rows.reduce((s, r) => s + r.count * r.marks, 0);

  const addRow    = () => setRows(p => [...p, { id: Date.now().toString(), type: 'mcq', count: 3, marks: 1 }]);
  const removeRow = (id: string) => setRows(p => p.filter(r => r.id !== id));
  const updateRow = (id: string, field: keyof DynamicRow, val: string | number) =>
    setRows(p => p.map(r => r.id === id ? { ...r, [field]: val } : r));
  const stepCount = (id: string, d: number) =>
    setRows(p => p.map(r => r.id === id ? { ...r, count: Math.max(1, r.count + d) } : r));
  const stepMarks = (id: string, d: number) =>
    setRows(p => p.map(r => r.id === id ? { ...r, marks: Math.max(1, r.marks + d) } : r));

  const handleFile = (f: File) => {
    const ok = ['application/pdf','text/plain','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg','image/png'];
    if (!ok.includes(f.type))      { toast.error('Only PDF, TXT, DOC, DOCX, JPG, PNG'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('Max file size is 10 MB'); return; }
    setFile(f);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!dueDate)          e.dueDate = 'Required';
    if (rows.length === 0) e.rows    = 'Add at least one question type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const questionTypes = rows.map(r => ({
        type: normaliseType(r.type), count: r.count, marksPerQuestion: r.marks,
      }));
      const payload = { subject, grade, schoolName, dueDate, questionTypes, additionalInstructions, userId: user!.id, groupId: groupId || null };
      const formData = new FormData();
      if (file) { formData.append('file', file); formData.append('data', JSON.stringify(payload)); }
      const res = await fetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        body:    file ? formData : JSON.stringify(payload),
        headers: file ? undefined : { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        const msg = ct.includes('application/json')
          ? (await res.json()).error
          : res.status === 503 || res.status === 500
            ? 'Server error — please check your Redis/backend connection'
            : `Request failed (${res.status})`;
        throw new Error(msg || 'Failed to create assignment');
      }
      const data = await res.json();
      toast.success('Generating question paper...');
      addAssignment({
        _id: data.assignmentId,
        title: 'Generating…', subject: '', topic: '', gradeLevel: '',
        dueDate, questionTypes, additionalInstructions, userId: user!.id,
        jobId: data.jobId, status: 'pending',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      setJobStatus(data.assignmentId, 'pending');
      router.push(`/assignment/${data.assignmentId}?generating=true`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !user) {
    return (
      <AppLayout activeTab="assignments" title="Create Assignment" showFAB={false}>
        <AuthModal redirectMessage="Sign in to create a question paper." onClose={() => router.push('/')} />
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab="assignments" title="Assignment" showBack showFAB={false}>

      {/* Mobile sub-header */}
      <div className="lg:hidden flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-800">Create Assignment</span>
      </div>

      <div className="px-4 lg:px-6 pt-4 lg:pt-5 pb-8">

        {/* Page title with green live dot */}
        <div className="flex items-start gap-3 mb-4">
          <span className="relative flex h-4 w-4 mt-1 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Create Assignment</h1>
            <p className="text-sm text-gray-400 mt-0.5">Set up a new assignment for your students</p>
          </div>
        </div>

        {/* Progress bar — same max-width as form card */}
        <div className="mx-auto my-6" style={{ maxWidth: 810 }}>
          <div className="flex gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-800" />
            <div className="flex-1 h-1.5 rounded-full bg-white" />
          </div>
        </div>

        {/* ── Form card ── */}
        <div
          className="mx-auto rounded-[32px] p-6 lg:p-8"
          style={{ maxWidth: 810, background: 'rgba(255,255,255,0.5)' }}
        >
          <h2 className="text-xl font-bold text-gray-900">Assignment Details</h2>
          <p className="text-sm text-gray-400 mt-1 mb-6">Basic information about your assignment</p>

          {/* File upload */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`rounded-[24px] border-2 border-dashed bg-white flex flex-col items-center justify-center cursor-pointer transition-colors ${dragging ? 'border-gray-500' : 'border-gray-300 hover:border-gray-400'}`}
            style={{ minHeight: 202, padding: 26 }}
          >
            {file ? (
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(undefined); }}
                  className="text-gray-400 hover:text-red-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-7 h-7 text-gray-500 mb-3" />
                <p className="text-sm font-medium text-gray-800">Choose a file or drag & drop it here</p>
                <p className="text-xs text-gray-400 mt-1.5">JPEG, PNG, upto 10MB</p>
                <button type="button"
                  className="mt-4 px-5 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  Browse Files
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.txt,.doc,.docx,image/jpeg,image/png"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2 mb-6">
            Upload images of your preferred document/image
          </p>

          {/* Subject + Class */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Science"
                className="w-full h-11 rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Class / Grade</label>
              <input
                value={grade}
                onChange={e => setGrade(e.target.value)}
                placeholder="e.g. Grade 8"
                className="w-full h-11 rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Assign to Group */}
          {groups.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Assign to Group <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <select
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-transparent px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors appearance-none"
                >
                  <option value="">No group</option>
                  {groups.map(g => (
                    <option key={g._id} value={g._id}>
                      {g.name}{g.subject ? ` — ${g.subject}` : ''}{g.grade ? ` (${g.grade})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-11 rounded-xl border border-gray-200 bg-transparent px-4 pr-11 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
          </div>

          {/* Question Types */}
          <div className="mb-6">

            {/* Desktop column headers */}
            <div className="hidden lg:flex items-center mb-3">
              <span className="flex-1 text-sm font-semibold text-gray-900">Question Type</span>
              <span className="shrink-0 w-7 mr-3" />
              <span className="shrink-0 w-[100px] text-xs text-gray-500 text-center">No. of Questions</span>
              <span className="shrink-0 w-[100px] ml-4 text-xs text-gray-500 text-center">Marks</span>
            </div>

            {/* Mobile label */}
            <label className="lg:hidden block text-sm font-semibold text-gray-800 mb-3">Question Type</label>

            {errors.rows && <p className="text-xs text-red-500 mb-2">{errors.rows}</p>}

            {/* Desktop rows */}
            <div className="hidden lg:block space-y-3">
              {rows.map(row => (
                <div key={row.id} className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <select
                      value={row.type}
                      onChange={e => updateRow(row.id, 'type', e.target.value)}
                      className="w-full h-11 appearance-none pl-4 pr-9 text-sm border border-gray-200 rounded-full bg-white text-gray-800 focus:outline-none focus:border-gray-400 cursor-pointer transition-colors"
                    >
                      {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <button onClick={() => removeRow(row.id)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="shrink-0 w-[100px] h-11 bg-white border border-gray-200 rounded-full flex items-center justify-between px-3">
                    <button onClick={() => stepCount(row.id, -1)} className="text-gray-500 hover:text-gray-900 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-900">{row.count}</span>
                    <button onClick={() => stepCount(row.id, 1)} className="text-gray-500 hover:text-gray-900 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="shrink-0 w-[100px] h-11 bg-white border border-gray-200 rounded-full flex items-center justify-between px-3 ml-1">
                    <button onClick={() => stepMarks(row.id, -1)} className="text-gray-500 hover:text-gray-900 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-900">{row.marks}</span>
                    <button onClick={() => stepMarks(row.id, 1)} className="text-gray-500 hover:text-gray-900 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile rows */}
            <div className="lg:hidden space-y-3">
              {rows.map(row => (
                <div key={row.id} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={row.type}
                        onChange={e => updateRow(row.id, 'type', e.target.value)}
                        className="w-full h-11 appearance-none pl-4 pr-9 text-sm border border-gray-200 rounded-full bg-white text-gray-800 focus:outline-none"
                      >
                        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button onClick={() => removeRow(row.id)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 text-center">No. of Questions</p>
                      <div className="h-11 bg-white border border-gray-200 rounded-full flex items-center justify-between px-3">
                        <button onClick={() => stepCount(row.id, -1)} className="text-gray-500"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-sm font-semibold text-gray-900">{row.count}</span>
                        <button onClick={() => stepCount(row.id, 1)} className="text-gray-500"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 text-center">Marks</p>
                      <div className="h-11 bg-white border border-gray-200 rounded-full flex items-center justify-between px-3">
                        <button onClick={() => stepMarks(row.id, -1)} className="text-gray-500"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-sm font-semibold text-gray-900">{row.marks}</span>
                        <button onClick={() => stepMarks(row.id, 1)} className="text-gray-500"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add row */}
            <button onClick={addRow} className="flex items-center gap-2.5 mt-4">
              <span className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-semibold text-gray-800">Add Question Type</span>
            </button>

            {/* Totals */}
            <div className="mt-4 text-right space-y-0.5">
              <p className="text-sm text-gray-600">Total Questions : <span className="font-semibold text-gray-900">{totalQuestions}</span></p>
              <p className="text-sm text-gray-600">Total Marks : <span className="font-semibold text-gray-900">{totalMarks}</span></p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Additional Information <span className="text-gray-400 font-normal">(For better output)</span>
            </label>
            <div className="relative rounded-xl border-2 border-dashed border-gray-300" style={{ height: 102 }}>
              <textarea
                value={additionalInstructions}
                onChange={e => setAdditionalInstructions(e.target.value)}
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
                className="absolute inset-0 w-full h-full resize-none bg-transparent px-4 py-3 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
              <Mic className="absolute bottom-3 right-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Next button */}
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center gap-2 px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-black transition-colors disabled:opacity-60"
            >
              {submitting ? 'Generating...' : 'Next'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
