'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  PiggyBank,
  BarChart3,
  Receipt,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              ExpenseTrack
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-indigo-50/40 via-white to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-6">
              <ShieldCheck className="h-4 w-4" />
              <span>Full PostgreSQL Row Level Security Powered by Supabase</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 max-w-4xl mx-auto leading-tight">
              Master Your Money with Modern Precision
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Track earnings, control category budgets, view intelligent cashflow analytics,
              and stay on top of personal savings with default Bangladeshi Taka (৳ BDT) support.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={user ? '/dashboard' : '/register'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <span>{user ? 'Go to Your Dashboard' : 'Start Tracking Free'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={user ? '/transactions' : '/login'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <span>{user ? 'View Transactions' : 'Sign in to Account'}</span>
              </Link>
            </div>

            {/* Feature Highlights Grid */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                  <Receipt className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Complete Ledger Management
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Record income and expenses with payment methods, custom tags, date selectors, and quick search.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Category Monthly Budgets
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Set limits per category. Visual progress bars alert you when you reach 80% or exceed 100%.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Reports & CSV Export
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Interactive Recharts cashflow graphs, category distributions, and one-click CSV ledger export.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        <p>© 2026 ExpenseTrack. Built with Next.js App Router, Tailwind CSS & Supabase PostgreSQL.</p>
      </footer>
    </div>
  );
}
