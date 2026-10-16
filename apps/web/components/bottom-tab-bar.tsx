'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, ShoppingBag, User } from 'lucide-react';

function SocialCommunityIcon({ className = 'w-5 h-5', isActive = false }: { className?: string; isActive?: boolean }) {
  if (isActive) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
      >
        <circle cx="12" cy="7" r="4" />
        <path d="M12 13c-4.418 0-8 2.239-8 5v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2c0-2.761-3.582-5-8-5z" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();

  const tabs = [
    { label: 'home', href: '/', icon: Home, match: (path: string) => path === '/' },
    { label: 'social', href: '/social', icon: SocialCommunityIcon, match: (path: string) => path.startsWith('/social') },
    { label: '', href: '/create', icon: Plus, isCenter: true },
    { label: 'market', href: '/market', icon: ShoppingBag, match: (path: string) => path.startsWith('/market') },
    { label: 'profile', href: '/profile', icon: User, match: (path: string) => path === '/profile' },
  ];

  return (
    <nav className="w-full h-14 bg-white border-t border-slate-100 px-4 flex items-center justify-between shrink-0 relative z-40 select-none">
      {tabs.map((tab) => {
        if (tab.isCenter) {
          return (
            <div key="center-plus" className="flex items-center justify-center flex-1">
              <Link
                href="/create"
                className="w-10 h-10 rounded-[14px] bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all"
                aria-label="Create new post"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </Link>
            </div>
          );
        }

        const Icon = tab.icon;
        const isActive = tab.match ? tab.match(pathname) : false;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon
              className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`}
              {...(tab.label === 'social' ? { isActive } : {})}
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
