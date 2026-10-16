import React from 'react';
import { MobileShell } from '@/components/mobile-shell';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileShell bgWhite>{children}</MobileShell>;
}
