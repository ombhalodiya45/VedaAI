'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bell, LogIn, LogOut, Settings, Trash2, X } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { AuthModal } from '@/components/ui/AuthModal';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function MobileNavbar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, markRead, markAllRead, clearAll, unreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const count = unreadCount();

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
  };

  const handleNotificationClick = (id: string, assignmentId: string) => {
    markRead(id);
    setBellOpen(false);
    router.push(`/assignments?paper=${assignmentId}`);
  };

  return (
    <>
    <div className="px-[10px] pt-[10px]">
      <header
        className="flex items-center justify-between bg-white px-4"
        style={{ height: 56, borderRadius: 16 }}
      >
        {/* Logo */}
        <Image
          src="/mobile_logo.svg"
          alt="VedaAI"
          width={99}
          height={28}
          priority
          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg'; }}
        />

        {/* Right actions */}
        <div className="flex items-center gap-3">

          {/* Bell with notification panel */}
          <div className="relative">
            <button
              onClick={() => {
                setBellOpen(o => !o);
                setDropdownOpen(false);
                if (!bellOpen) markAllRead();
              }}
              className="relative text-gray-500 p-1"
            >
              <Bell className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute top-0 right-0 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {bellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                <div className="fixed left-[10px] right-[10px] top-[76px] bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-900">Notifications</span>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button onClick={() => { clearAll(); }} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <Bell className="w-8 h-8 text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400">No notifications yet</p>
                        <p className="text-xs text-gray-300 mt-0.5">You'll be notified when papers are ready</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n.id, n.assignmentId)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                        >
                          <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${n.read ? 'bg-transparent' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${n.read ? 'text-gray-500' : 'text-gray-900 font-semibold'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button onClick={() => { setDropdownOpen(!dropdownOpen); setBellOpen(false); }}>
              <Image
                src="/default_profile.svg"
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23E5E7EB'/%3E%3Ccircle cx='16' cy='12' r='6' fill='%239CA3AF'/%3E%3Cellipse cx='16' cy='29' rx='10' ry='7' fill='%239CA3AF'/%3E%3C/svg%3E";
                }}
              />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                  {user ? (
                    <>
                      {user.email && (
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      )}
                      <button
                        onClick={() => { router.push('/settings'); setDropdownOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setDropdownOpen(false); setShowAuth(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </div>

    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
