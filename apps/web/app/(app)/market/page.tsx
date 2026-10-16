'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { HeaderBrand } from '@/components/header-brand';
import { Button } from '@/components/ui/button';

export default function MarketPage() {
  return (
    <div className="flex-1 flex flex-col p-4">
      <HeaderBrand />
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Community Marketplace</h2>
        <p className="text-xs text-slate-500 max-w-[240px]">
          Buy, sell, and trade with verified local members. Safe escrow and peer-to-peer messaging.
        </p>
        <div className="pt-2 flex gap-2">
          <Button className="rounded-xl bg-blue-600 text-white text-xs h-9 px-4">
            List an Item
          </Button>
        </div>
      </div>
    </div>
  );
}
