'use client';

import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { wsManager } from '@/lib/websocket';
import { SchoolNameModal } from './SchoolNameModal';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setSchoolName } = useAuthStore();
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Client-side PKCE fallback: exchange code if present in URL
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).catch(() => {});
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url.toString());
    }

    const loadSchool = (userId: string) => {
      const stored = localStorage.getItem(`vedaai_school_${userId}`);
      if (stored) {
        setSchoolName(stored);
      } else {
        setPendingUserId(userId);
        setShowSchoolModal(true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      setLoading(false);
      if (user) {
        wsManager.connect(user.id);
        loadSchool(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        wsManager.connect(user.id);
        loadSchool(user.id);
      } else {
        wsManager.disconnect();
        setSchoolName('');
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, setSchoolName]);

  return (
    <>
      {children}
      {showSchoolModal && pendingUserId && (
        <SchoolNameModal
          userId={pendingUserId}
          onDone={() => setShowSchoolModal(false)}
        />
      )}
    </>
  );
}
