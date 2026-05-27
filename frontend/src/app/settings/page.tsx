'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Save, LogOut, LogIn, Trash2, User, School, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { AuthModal } from '@/components/ui/AuthModal';

export default function SettingsPage() {
  const router = useRouter();
  const { user, schoolName, setSchoolName } = useAuthStore();
  const { clearAll } = useNotificationStore();

  const [schoolInput, setSchoolInput] = useState(schoolName);
  const [saving, setSaving] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => { setSchoolInput(schoolName); }, [schoolName]);

  const handleSaveSchool = () => {
    setSaving(true);
    setSchoolName(schoolInput.trim());
    if (user) localStorage.setItem(`vedaai_school_${user.id}`, schoolInput.trim());
    setTimeout(() => {
      setSaving(false);
      toast.success('School name saved');
    }, 400);
  };

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'My Account';

  return (
    <AppLayout activeTab="settings" title="Settings" showFAB={false}>
      <div className="px-4 lg:px-6 pt-4 pb-24 max-w-2xl">

        {/* Header */}
        <div className="flex items-start gap-3 mb-8">
          <span className="relative flex h-3 w-3 mt-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage your profile and preferences.</p>
          </div>
        </div>

        {/* Profile card */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <User className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Profile</h2>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Image
              src="/default_profile.svg"
              alt="Profile"
              width={56}
              height={56}
              className="rounded-full shrink-0"
            />
            <div>
              <p className="text-base font-semibold text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-400">{user?.email || '—'}</p>
              <p className="text-xs text-gray-300 mt-0.5">Signed in via Google</p>
            </div>
          </div>
        </section>

        {/* School name */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <School className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">School / Institution</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">This name appears at the top of every question paper you generate.</p>
          <div className="flex gap-3">
            <input
              value={schoolInput}
              onChange={e => setSchoolInput(e.target.value)}
              placeholder="e.g. Delhi Public School"
              className="flex-1 h-10 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
            />
            <button
              onClick={handleSaveSchool}
              disabled={saving || schoolInput.trim() === schoolName}
              className="flex items-center gap-2 px-5 h-10 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Notifications</h2>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs lg:text-sm text-gray-600">Clear all notification history</p>
            <button
              onClick={() => { clearAll(); toast.success('Notifications cleared'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl border border-gray-200 text-xs lg:text-sm font-medium text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              Clear All
            </button>
          </div>
        </section>

        {/* Sign out / Sign in */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs lg:text-sm font-semibold text-gray-800">
                {user ? 'Sign out' : 'Sign in'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user ? "You'll be returned to the login screen." : 'Sign in to access all features.'}
              </p>
            </div>
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl bg-red-500 text-white text-xs lg:text-sm font-semibold hover:bg-red-600 transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                Sign out
              </button>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl bg-gray-900 text-white text-xs lg:text-sm font-semibold hover:bg-black transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                Sign in
              </button>
            )}
          </div>
        </section>

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      </div>
    </AppLayout>
  );
}
