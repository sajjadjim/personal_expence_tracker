'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { useAuth } from '@/components/providers/AuthProvider';
import { Database, ExternalLink } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onRefreshData?: () => void;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  onRefreshData,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { isConfigured } = useAuth();

  const handleTransactionSuccess = () => {
    if (onRefreshData) {
      onRefreshData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar (Desktop and Mobile) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenAddTransaction={() => setAddModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Missing Supabase configuration banner */}
          {!isConfigured && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 shrink-0">
                  <Database className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-amber-900">
                    Connect your Supabase Project
                  </h3>
                  <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                    To record transactions and save your financial data securely in PostgreSQL, configure your Supabase project in <code className="rounded bg-amber-200/60 px-1.5 py-0.5 font-mono text-xs text-amber-950 font-bold">.env.local</code>.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
                    >
                      <span>Supabase Dashboard</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span className="text-xs text-amber-700">
                      Run the SQL script from <code className="font-mono font-bold">supabase/schema.sql</code> in the Supabase SQL editor.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <TransactionFormModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}
