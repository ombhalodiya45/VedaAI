'use client';

import { useState } from 'react';
import { School } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface Props {
  userId: string;
  onDone: () => void;
}

export function SchoolNameModal({ userId, onDone }: Props) {
  const { setSchoolName } = useAuthStore();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    localStorage.setItem(`vedaai_school_${userId}`, name);
    setSchoolName(name);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <School className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to VedaAI!</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your school or college name to personalise your question papers.</p>

        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="e.g. Delhi Public School, Sector-4"
          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 mb-4"
          autoFocus
        />

        <button
          onClick={handleSave}
          disabled={!value.trim() || saving}
          className="w-full h-11 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-black transition-colors disabled:opacity-40"
        >
          Continue
        </button>

        <button
          onClick={onDone}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
