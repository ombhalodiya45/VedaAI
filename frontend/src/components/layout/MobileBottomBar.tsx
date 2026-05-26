'use client';

import { useRouter } from 'next/navigation';
import { LayoutGrid, ClipboardList, BookMarked, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'home',        label: 'Home',        icon: LayoutGrid,    href: '#'  },
  { id: 'assignments', label: 'Assignments',  icon: ClipboardList, href: '/'  },
  { id: 'library',     label: 'Library',      icon: BookMarked,    href: '#'  },
  { id: 'toolkit',     label: 'AI Toolkit',   icon: Sparkles,      href: '#'  },
];

interface MobileBottomBarProps {
  activeTab?: string;
}

export function MobileBottomBar({ activeTab = 'assignments' }: MobileBottomBarProps) {
  const router = useRouter();

  return (
    <div className="fixed bottom-[10px] left-[10px] right-[10px] z-30">
      <nav
        className="flex items-center justify-around px-2 py-3"
        style={{
          background: '#1C1C1E',
          borderRadius: 16,
        }}
      >
        {TABS.map(({ id, label, icon: Icon, href }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { if (href !== '#') router.push(href); }}
              className="flex flex-col items-center gap-1 px-4 py-1"
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.25)' }}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className="text-[11px] font-medium"
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
