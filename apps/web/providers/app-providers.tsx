'use client';

import React from 'react';
import { QueryProvider } from './query-provider';
import { SocketProvider } from './socket-provider';
import { AuthProvider } from './auth-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SocketProvider>
        <AuthProvider>{children}</AuthProvider>
      </SocketProvider>
    </QueryProvider>
  );
}
