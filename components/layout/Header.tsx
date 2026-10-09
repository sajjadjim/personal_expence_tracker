'use client';

import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onOpenAddTransaction?: () => void;
}

export function Header({
  title,
  subtitle,
  onOpenMobileMenu,
  onOpenAddTransaction,
}: HeaderProps) {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Currency Indicator & Quick Action */}
      <div className="flex items-center gap-3">
        {/* Currency Pill */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
          <span>{profile?.currency_symbol || '৳'}</span>
          <span>{profile?.currency_code || 'BDT'}</span>
        </div>

        {/* Quick Add Button */}
        {onOpenAddTransaction && (
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Transaction</span>
          </button>
        )}
      </div>
    </header>
  );
}
