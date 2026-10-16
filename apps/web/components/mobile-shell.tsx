'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Wifi, Battery } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
  hideStatusBar?: boolean;
  hideHomeIndicator?: boolean;
  bgWhite?: boolean;
  statusBarWhite?: boolean;
  onClick?: () => void;
}

export function MobileShell({
  children,
  className = '',
  hideStatusBar = false,
  hideHomeIndicator = false,
  bgWhite = true,
  statusBarWhite,
  onClick,
}: MobileShellProps) {
  const pathname = usePathname();
  // Automatically use white status bar on profile screen to match gradient cover
  const isWhiteStatus = statusBarWhite ?? pathname.startsWith('/profile');

  return (
    <div
      onClick={onClick}
      className="min-h-screen w-full bg-[#121214] flex items-center justify-center sm:p-4 md:p-6 antialiased select-none"
    >
      <div
        className={`w-full max-w-[390px] min-h-screen sm:min-h-[844px] sm:h-[844px] ${
          bgWhite ? 'bg-white' : 'bg-slate-50'
        } text-slate-900 sm:rounded-[44px] sm:shadow-phone relative flex flex-col overflow-hidden sm:border sm:border-slate-800/40`}
      >
        {/* iOS Status Bar */}
        {!hideStatusBar && (
          <header
            className={`w-full h-11 px-6 flex items-center justify-between text-xs font-semibold tracking-tight select-none shrink-0 transition-colors ${
              isWhiteStatus
                ? 'text-white absolute top-0 left-0 right-0 z-40 bg-transparent'
                : 'text-slate-900 relative z-50 bg-white'
            }`}
          >
            <span>9:41</span>
            <div className={`flex items-center gap-1.5 ${isWhiteStatus ? 'text-white' : 'text-slate-900'}`}>
              {/* Cellular Signal Icon */}
              <div className="flex items-end gap-[1.5px] h-3">
                <span className={`w-[2.5px] h-1 rounded-sm ${isWhiteStatus ? 'bg-white' : 'bg-slate-900'}`} />
                <span className={`w-[2.5px] h-1.5 rounded-sm ${isWhiteStatus ? 'bg-white' : 'bg-slate-900'}`} />
                <span className={`w-[2.5px] h-2.5 rounded-sm ${isWhiteStatus ? 'bg-white' : 'bg-slate-900'}`} />
                <span className={`w-[2.5px] h-3 rounded-sm ${isWhiteStatus ? 'bg-white' : 'bg-slate-900'}`} />
              </div>
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </header>
        )}

        {/* Screen Content Container */}
        <div className={`flex-1 flex flex-col overflow-y-auto no-scrollbar ${className}`}>
          {children}
        </div>

        {/* iOS Home Indicator */}
        {!hideHomeIndicator && (
          <footer className="w-full py-2 shrink-0 flex justify-center items-center pointer-events-none bg-white">
            <div className="w-32 h-1 bg-black rounded-full" />
          </footer>
        )}
      </div>
    </div>
  );
}
