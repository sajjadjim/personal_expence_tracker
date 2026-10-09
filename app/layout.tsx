import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ExpenseTrack — Personal Expense & Wealth Tracker',
  description:
    'A production-grade personal financial dashboard for tracking income, expenses, monthly budgets, and savings reports.',
  keywords: ['expense tracker', 'budget planner', 'personal finance', 'Next.js', 'Supabase'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full bg-slate-50 text-slate-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
