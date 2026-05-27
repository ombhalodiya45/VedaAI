'use client';

import { useState, useRef, useEffect, KeyboardEvent, ReactNode } from 'react';
import { Sparkles, Send, RefreshCw, History, Plus, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthModal } from '@/components/ui/AuthModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useToolkitHistoryStore } from '@/store/useToolkitHistoryStore';

export interface ChatStep {
  key: string;
  question: string;
  type: 'text' | 'select' | 'number' | 'textarea';
  placeholder?: string;
  options?: string[];
  optional?: boolean;
  defaultValue?: string;
}

interface Msg { from: 'ai' | 'user'; text: string; }

interface Props {
  toolTitle: string;
  toolKey: string;
  intro: string;
  steps: ChatStep[];
  apiEndpoint: string;
  buildPayload: (answers: Record<string, string>) => object;
  getHistoryTitle: (answers: Record<string, string>) => string;
  renderResult: (data: unknown) => ReactNode;
  emptyTitle?: string;
  emptyDesc?: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ToolkitChat({
  toolTitle, toolKey, intro, steps, apiEndpoint,
  buildPayload, getHistoryTitle, renderResult, emptyTitle, emptyDesc,
}: Props) {
  const initMsgs: Msg[] = [{ from: 'ai', text: intro }, { from: 'ai', text: steps[0].question }];
  const [msgs, setMsgs] = useState<Msg[]>(initMsgs);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [val, setVal] = useState(steps[0].defaultValue ?? '');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'result'>('chat');
  const [showAuth, setShowAuth] = useState(false);

  const { user } = useAuthStore();

  const endRef = useRef<HTMLDivElement>(null);
  const { entries, add, remove } = useToolkitHistoryStore();
  const history = entries.filter(e => e.tool === toolKey);

  useEffect(() => {
    if (tab === 'new') endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading, tab]);

  const cur = steps[stepIdx];

  const send = (override?: string) => {
    const v = override !== undefined ? override : val.trim();
    if (!cur.optional && !v) return;
    const display = v || '(skipped)';
    const nextAnswers = { ...answers, [cur.key]: v };
    setAnswers(nextAnswers);
    const next: Msg[] = [...msgs, { from: 'user', text: display }];
    const ni = stepIdx + 1;
    if (ni < steps.length) {
      next.push({ from: 'ai', text: steps[ni].question });
      setStepIdx(ni);
      setVal(steps[ni].defaultValue ?? '');
    } else {
      next.push({ from: 'ai', text: 'All set! Click Generate to get your result.' });
      setDone(true);
    }
    setMsgs(next);
  };

  const generate = async () => {
    if (!user) { setShowAuth(true); return; }
    setLoading(true);
    setResult(null);
    setMobilePanel('result');
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(answers)),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      add({ tool: toolKey, title: getHistoryTitle(answers), result: data });
    } catch {
      toast.error('Generation failed. Please try again.');
      setMobilePanel('chat');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMsgs(initMsgs);
    setStepIdx(0);
    setAnswers({});
    setVal(steps[0].defaultValue ?? '');
    setDone(false);
    setLoading(false);
    setResult(null);
    setMobilePanel('chat');
  };

  const startNew = () => {
    reset();
    setTab('new');
  };

  const viewHistoryItem = (r: unknown) => {
    setResult(r);
    setMobilePanel('result');
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
    {showAuth && (
      <AuthModal
        redirectMessage="Sign in to generate AI-powered results."
        onClose={() => setShowAuth(false)}
      />
    )}
    <AppLayout activeTab="toolkit" title={toolTitle} showBack showFAB={false}>
      <div className="h-full flex flex-col overflow-hidden">

        {/* Mobile panel switcher */}
        <div className="lg:hidden flex shrink-0 bg-white border-b border-gray-100">
          <button
            onClick={() => setMobilePanel('chat')}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              mobilePanel === 'chat'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setMobilePanel('result')}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              mobilePanel === 'result'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400'
            }`}
          >
            Result{(result || loading) ? ' ●' : ''}
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">

          {/* ══ LEFT PANEL ══ */}
          <div className={`
            ${mobilePanel === 'chat' ? 'flex' : 'hidden'} lg:flex
            w-full lg:w-[400px] shrink-0 flex-col border-r border-gray-100 bg-white
          `}>

            {/* Tab header */}
            <div className="flex items-center gap-1 px-3 py-2.5 border-b border-gray-100 shrink-0">
              <button
                onClick={startNew}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'new' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
              <button
                onClick={() => setTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'history' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                History
                {history.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    tab === 'history' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {history.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── NEW: Chat messages ── */}
            {tab === 'new' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgs.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.from === 'ai' && (
                        <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] text-sm px-3.5 py-2.5 leading-relaxed ${
                        m.from === 'ai'
                          ? 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none'
                          : 'bg-gray-900 text-white rounded-2xl rounded-tr-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input area */}
                <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
                  {!done ? (
                    <div className="flex gap-2 items-end">
                      {cur.type === 'select' ? (
                        <select value={val} onChange={e => setVal(e.target.value)}
                          className="flex-1 h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:border-gray-400 transition-colors">
                          <option value="">Choose...</option>
                          {cur.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : cur.type === 'textarea' ? (
                        <textarea value={val} onChange={e => setVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                          placeholder={cur.placeholder ?? 'Type your answer…'} rows={3}
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
                      ) : (
                        <input
                          type={cur.type === 'number' ? 'number' : 'text'}
                          value={val} onChange={e => setVal(e.target.value)}
                          onKeyDown={onKey}
                          placeholder={cur.placeholder ?? 'Type your answer…'}
                          autoFocus
                          className="flex-1 h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                      )}
                      <button onClick={() => send()} disabled={!cur.optional && !val.trim()}
                        className="w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors disabled:opacity-40 shrink-0">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={generate} disabled={loading}
                      className="w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50">
                      <Sparkles className="w-4 h-4" />
                      {loading ? 'Generating…' : 'Generate'}
                    </button>
                  )}

                  {cur.optional && !done && (
                    <button onClick={() => send('')}
                      className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 text-center">
                      Skip this step →
                    </button>
                  )}

                  {(done || result !== null) && !loading && (
                    <button onClick={reset}
                      className="w-full h-9 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Start over
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── HISTORY: Past results list ── */}
            {tab === 'history' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4 py-16">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <History className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No history yet</p>
                    <p className="text-xs text-gray-400">Generated results will appear here.</p>
                    <button onClick={startNew}
                      className="mt-2 text-xs font-semibold text-gray-700 flex items-center gap-1 hover:text-gray-900">
                      <Plus className="w-3.5 h-3.5" /> Start a new generation
                    </button>
                  </div>
                ) : (
                  history.map(entry => (
                    <div
                      key={entry.id}
                      onClick={() => viewHistoryItem(entry.result)}
                      className="group w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 cursor-pointer transition-colors relative"
                    >
                      <p className="text-sm font-semibold text-gray-800 leading-snug pr-6 truncate">{entry.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        {timeAgo(entry.createdAt)}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); remove(entry.id); }}
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ══ RIGHT PANEL: Result ══ */}
          <div className={`
            ${mobilePanel === 'result' ? 'flex' : 'hidden'} lg:flex
            flex-col flex-1 overflow-y-auto bg-[#f9f9f9]
          `}>
            {loading ? (
              <ThinkingPanel />
            ) : result !== null ? (
              <div className="p-4 lg:p-6">{renderResult(result)}</div>
            ) : (
              <EmptyPanel title={emptyTitle} desc={emptyDesc} />
            )}
          </div>

        </div>
      </div>
    </AppLayout>
    </>
  );
}

/* ── Thinking animation ── */
function ThinkingPanel() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-gray-300 animate-ping opacity-40" />
        <div className="relative w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center">
          <Sparkles className="w-9 h-9 text-white animate-pulse" />
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">
          VedaAI is thinking{'.'.repeat(dots)}
        </p>
        <p className="text-sm text-gray-500 mt-1.5">Crafting the perfect result for you</p>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse"
            style={{ animationDelay: `${i * 180}ms` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Empty right panel ── */
function EmptyPanel({ title, desc }: { title?: string; desc?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
        <Sparkles className="w-8 h-8 text-gray-200" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">{title ?? 'Your result will appear here'}</p>
        <p className="text-xs text-gray-400 mt-1.5 max-w-[260px] leading-relaxed">
          {desc ?? 'Answer the questions on the left, then click Generate.'}
        </p>
      </div>
    </div>
  );
}
