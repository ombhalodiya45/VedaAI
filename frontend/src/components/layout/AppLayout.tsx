'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNavbar } from './MobileNavbar';
import { MobileBottomBar } from './MobileBottomBar';
import { AuthModal } from '@/components/ui/AuthModal';
import { useAuthStore } from '@/store/useAuthStore';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  title?: string;
  showBack?: boolean;
  /** Hide FAB on pages where it's not needed (e.g. create / paper view) */
  showFAB?: boolean;
}

export function AppLayout({
  children,
  activeTab = 'assignments',
  title = 'Assignment',
  showBack = false,
  showFAB = true,
}: AppLayoutProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);

  const handleCreateClick = () => {
    if (!user) setShowAuth(true);
    else router.push('/create');
  };

  return (
    <>
      {/* ── DESKTOP (lg+) ── */}
      <div
        className="hidden lg:flex h-screen p-3 gap-3 overflow-hidden"
        style={{ background: '#EBEBEB' }}
      >
        {/* Sidebar card */}
        <div className="bg-white rounded-2xl shrink-0 overflow-hidden" style={{ width: 280 }}>
          <Sidebar activeTab={activeTab} onCreateClick={handleCreateClick} />
        </div>

        {/* Right column */}
        <div className="flex flex-col flex-1 min-w-0 gap-3 overflow-hidden">
          {/* Topbar card */}
          <div className="bg-white rounded-2xl shrink-0 overflow-hidden" style={{ height: 56 }}>
            <Topbar title={title} showBack={showBack} activeTab={activeTab} />
          </div>
          {/* Content */}
          <div className="flex-1 overflow-auto rounded-2xl">
            {children}
          </div>
        </div>
      </div>

      {/* ── MOBILE (< lg) ── */}
      <div
        className="flex lg:hidden flex-col h-[100dvh] overflow-hidden"
        style={{ background: '#EBEBEB' }}
      >
        {/* Mobile top navbar */}
        <MobileNavbar />

        {/* Scrollable content — pad bottom so it clears tab bar */}
        <main className="flex-1 overflow-auto pb-28">
          {children}
        </main>

        {/* FAB — floating + button */}
        {showFAB && (
          <button
            onClick={handleCreateClick}
            className="fixed bottom-[90px] right-5 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
          >
            <Plus className="w-5 h-5" style={{ color: '#FF5623' }} strokeWidth={2.5} />
          </button>
        )}

        {/* Fixed bottom tab bar */}
        <MobileBottomBar activeTab={activeTab} />
      </div>

      {showAuth && (
        <AuthModal
          redirectMessage="Sign in to create an AI-powered question paper."
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
