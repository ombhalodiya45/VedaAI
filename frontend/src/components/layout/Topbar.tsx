'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, LayoutGrid, Bell, ChevronDown, LogOut, Trash2,
  Users, ClipboardList, Lightbulb, BookMarked, Settings,
} from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

interface TopbarProps {
  title?: string;
  showBack?: boolean;
  activeTab?: string;
}

const TAB_ICON: Record<string, React.ReactNode> = {
  home:        <LayoutGrid  className="w-4 h-4" />,
  groups:      <Users        className="w-4 h-4" />,
  assignments: <ClipboardList className="w-4 h-4" />,
  toolkit:     <Lightbulb   className="w-4 h-4" />,
  library:     <BookMarked  className="w-4 h-4" />,
  settings:    <Settings    className="w-4 h-4" />,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Topbar({ title = 'Assignment', showBack = false, activeTab = '' }: TopbarProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, markRead, markAllRead, clearAll, unreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

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

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';
  const count = unreadCount();

  return (
    <header className="flex items-center justify-between h-full px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-gray-500">
          {TAB_ICON[activeTab] ?? <LayoutGrid className="w-4 h-4" />}
          <span className="text-sm font-medium">{title}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => { setBellOpen(o => !o); setDropdownOpen(false); if (!bellOpen) markAllRead(); }}
            className="relative text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <div className="fixed right-4 top-16 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
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
                        {/* Unread dot */}
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

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(o => !o); setBellOpen(false); }}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
          >
            <Image
              src="/default_profile.svg"
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23E5E7EB'/%3E%3Ccircle cx='16' cy='12' r='6' fill='%239CA3AF'/%3E%3Cellipse cx='16' cy='29' rx='10' ry='7' fill='%239CA3AF'/%3E%3C/svg%3E";
              }}
            />
            <span className="text-sm font-medium text-gray-700">{displayName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="fixed right-4 top-16 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                {user ? (
                  <>
                    {user.email && (
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    )}
                    <button
                      onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
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
                  <p className="px-3 py-2 text-xs text-gray-400">Not signed in</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
