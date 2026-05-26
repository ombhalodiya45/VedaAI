'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid, Users, ClipboardList, Lightbulb, BookMarked, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useAssignmentStore } from '@/store/useAssignmentStore';

const NAV_ITEMS = [
  { id: 'home',        label: 'Home',                icon: LayoutGrid,    href: '/' },
  { id: 'groups',      label: 'My Groups',            icon: Users,         href: '/groups' },
  { id: 'assignments', label: 'Assignments',           icon: ClipboardList, href: '/assignments' },
  { id: 'toolkit',     label: "AI Teacher's Toolkit",  icon: Lightbulb,     href: '/toolkit' },
  { id: 'library',     label: 'My Library',            icon: BookMarked,    href: '/library' },
];

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23E5E7EB'/%3E%3Ccircle cx='28' cy='22' r='10' fill='%239CA3AF'/%3E%3Cellipse cx='28' cy='50' rx='16' ry='12' fill='%239CA3AF'/%3E%3C/svg%3E";

interface SidebarProps {
  activeTab?: string;
  onCreateClick: () => void;
}

export function Sidebar({ activeTab = 'assignments', onCreateClick }: SidebarProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { assignments } = useAssignmentStore();
  const assignmentCount = assignments.length;

  const handleNav = (href: string) => {
    if (href !== '#') router.push(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-0">
        <Image src="/logo.svg" alt="VedaAI" width={136} height={40} priority />
      </div>

      {/* Create Assignment button */}
      <div className="px-5 mt-14">
        <button
          onClick={onCreateClick}
          className="w-full rounded-full py-3 px-5 flex items-center justify-center gap-2 text-white font-semibold text-sm transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(#272727, #272727) padding-box, linear-gradient(180deg, #FF7950 0%, #C0350A 100%) border-box',
            border: '4px solid transparent',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L9.5 6H14.5L10.5 9.5L12 14.5L8 11L4 14.5L5.5 9.5L1.5 6H6.5L8 1Z" fill="white"/>
            <path d="M13 1L13.75 3.25L16 4L13.75 4.75L13 7L12.25 4.75L10 4L12.25 3.25L13 1Z" fill="white" opacity="0.7"/>
          </svg>
          Create Assignment
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-14 flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(href)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                href === '#' && 'cursor-default opacity-50'
              )}
            >
              <Icon
                className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-gray-800' : 'text-gray-400')}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="flex-1">{label}</span>
              {id === 'assignments' && assignmentCount > 0 && (
                <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                  {assignmentCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-1">
        <button
          onClick={() => router.push('/settings')}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
            activeTab === 'settings'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          )}
        >
          <Settings
            className={cn('w-[18px] h-[18px] shrink-0', activeTab === 'settings' ? 'text-gray-800' : 'text-gray-400')}
            strokeWidth={activeTab === 'settings' ? 2.2 : 1.8}
          />
          Settings
        </button>

        {/* Profile card */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mt-1">
          <Image
            src="/default_profile.svg"
            alt="Profile"
            width={59}
            height={56}
            className="rounded-full shrink-0 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_AVATAR; }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'My Account'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
