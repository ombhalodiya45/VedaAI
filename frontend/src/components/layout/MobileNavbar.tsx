'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Bell, Menu, LogOut } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export function MobileNavbar() {
  const { user } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
  };

  return (
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
          onError={(e) => {
            /* fallback to desktop logo if mobile one missing */
            (e.target as HTMLImageElement).src = '/logo.svg';
          }}
        />

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Bell */}
          <button className="relative text-gray-500">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Avatar */}
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)}>
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
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-20">
                  {user?.email && (
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button className="text-gray-500">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
    </div>
  );
}
