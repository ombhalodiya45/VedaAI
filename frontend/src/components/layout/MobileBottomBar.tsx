'use client';

import { useRouter } from 'next/navigation';
import { LayoutGrid, ClipboardList, BookMarked, Sparkles, Users } from 'lucide-react';

const TABS = [
  { id: 'home',        label: 'Home',        icon: LayoutGrid,    href: '/'            },
  { id: 'groups',      label: 'Groups',      icon: Users,         href: '/groups'      },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList, href: '/assignments' },
  { id: 'library',     label: 'Library',     icon: BookMarked,    href: '/library'     },
  { id: 'toolkit',     label: 'Toolkit',     icon: Sparkles,      href: '/toolkit'     },
];

interface MobileBottomBarProps {
  activeTab?: string;
}

export function MobileBottomBar({ activeTab = 'home' }: MobileBottomBarProps) {
  const router = useRouter();

  return (
    <div className="fixed bottom-[10px] left-[10px] right-[10px] z-30">
      <nav
        className="flex items-center justify-around px-1 py-3"
        style={{ background: '#1C1C1E', borderRadius: 16 }}
      >
        {TABS.map(({ id, label, icon: Icon, href }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-1 flex-1 py-1"
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.25)' }}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.25)' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
