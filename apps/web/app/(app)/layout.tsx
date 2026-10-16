import React from 'react';
import { MobileShell } from '@/components/mobile-shell';
import { BottomTabBar } from '@/components/bottom-tab-bar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileShell bgWhite className="pb-0 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar min-h-0">
        {children}
      </div>
      <BottomTabBar />
    </MobileShell>
  );
}
