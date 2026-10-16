'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileShell } from '@/components/mobile-shell';
import { useAuth } from '@/providers/auth-provider';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isOnboarded) {
        router.push('/create-profile');
      } else {
        router.push('/');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isOnboarded, isLoading, router]);

  const handleTapToContinue = () => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!isOnboarded) {
      router.push('/create-profile');
    } else {
      router.push('/');
    }
  };

  return (
    <MobileShell bgWhite className="cursor-pointer" onClick={handleTapToContinue}>
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Subtle Geometric Background Mandala / Concentric Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <svg className="w-[420px] h-[420px]" viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="190" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="150" stroke="#0284c7" strokeWidth="0.75" />
            <circle cx="200" cy="200" r="110" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="3 3" />
            <circle cx="200" cy="200" r="70" stroke="#0284c7" strokeWidth="0.5" />
            <path d="M200 10 L200 390 M10 200 L390 200" stroke="#0284c7" strokeWidth="0.5" opacity="0.4" />
          </svg>
        </div>

        {/* Central Logo Squircle with Gradient & Glowing Shadow */}
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
          <div className="relative mb-8">
            {/* Glow Aura */}
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 rounded-[36px] blur-xl opacity-30 animate-pulse" />

            {/* Elevated Squircle */}
            <div className="relative w-28 h-28 bg-white rounded-[32px] p-5 shadow-2xl border border-slate-100 flex items-center justify-center">
              {/* Interlocking Shield Knot Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="Brand Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>

          {/* Typography */}
          <h1 className="text-2xl font-black tracking-[0.25em] text-slate-900 uppercase">
            SYNCREDE
          </h1>

          <p className="text-[10px] font-bold tracking-[0.22em] text-slate-400 uppercase mt-2">
            UNIFIED TRUST &amp; IDENTITY
          </p>

          {/* Vibrant Gradient Bar */}
          <div className="h-[2.5px] w-28 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600 rounded-full mt-4" />
        </div>
      </div>
    </MobileShell>
  );
}
