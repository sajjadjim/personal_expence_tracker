'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCards } from '@/components/dashboard/StatCards';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { StatCardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/components/providers/AuthProvider';
import { Transaction, TransactionType } from '@/types/database';
import { Filter } from 'lucide-react';

type DateFilterOption = 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'all';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('this_month');

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');

  const getDateRange = (filter: DateFilterOption) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (filter === 'this_month') {
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
      return { start, end };
    }
    if (filter === 'last_month') {
      const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const end = new Date(year, month, 0).toISOString().split('T')[0];
      return { start, end };
    }
    if (filter === 'last_30_days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      return { start: past.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
    }
    if (filter === 'this_year') {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      return { start, end };
    }
    return { start: null, end: null };
  };

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { start, end } = getDateRange(dateFilter);
      const params = new URLSearchParams({ userId: user.uid });
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');

      const data = await res.json();
      const txList: Transaction[] = data.transactions || [];
      setTransactions(txList);

      // Calculate totals
      let incomeSum = 0;
      let expenseSum = 0;
      const categoryMap = new Map<string, { amount: number; color: string }>();

      txList.forEach((tx) => {
        const amt = Number(tx.amount);
        if (tx.type === 'income') {
          incomeSum += amt;
        } else {
          expenseSum += amt;
          const catName = tx.category?.name || 'Uncategorized';
          const catColor = tx.category?.color || '#6366f1';
          const current = categoryMap.get(catName) || { amount: 0, color: catColor };
          categoryMap.set(catName, {
            amount: current.amount + amt,
            color: catColor,
          });
        }
      });

      setTotalIncome(incomeSum);
      setTotalExpense(expenseSum);

      // Prepare category breakdown for pie chart
      const catArray = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        amount: data.amount,
        color: data.color,
      })).sort((a, b) => b.amount - a.amount);
      setCategoryBreakdown(catArray);

      // Prepare Cashflow Comparison for recent 6 months
      const monthMap = new Map<string, { income: number; expense: number }>();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        monthMap.set(key, { income: 0, expense: 0 });
      }

      // Fetch broader set for 6-month chart
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const sixMonthsStr = sixMonthsAgo.toISOString().split('T')[0];

      const trendRes = await fetch(`/api/transactions?userId=${user.uid}&startDate=${sixMonthsStr}`);
      if (trendRes.ok) {
        const trendData = await trendRes.json();
        const trendList: Transaction[] = trendData.transactions || [];
        trendList.forEach((tx) => {
          const txDate = new Date(tx.date);
          const key = `${months[txDate.getMonth()]} ${txDate.getFullYear().toString().slice(2)}`;
          if (monthMap.has(key)) {
            const current = monthMap.get(key)!;
            if (tx.type === 'income') {
              current.income += Number(tx.amount);
            } else {
              current.expense += Number(tx.amount);
            }
          }
        });
      }

      const chartList = Array.from(monthMap.entries()).map(([period, data]) => ({
        period,
        income: data.income,
        expense: data.expense,
      }));
      setComparisonData(chartList);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const openAddModal = (type: TransactionType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout
      title="Financial Dashboard"
      subtitle="Overview of your wealth, monthly spending, and savings progress"
      onRefreshData={loadDashboardData}
    >
      <div className="space-y-6">
        {/* Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pl-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>Date Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'this_year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setDateFilter(option.id as DateFilterOption)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  dateFilter === option.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <StatCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            currencySymbol={profile?.currency_symbol || '৳'}
          />
        )}

        {/* Recharts Comparison & Categories Breakdown */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <DashboardCharts
            comparisonData={comparisonData}
            categoryData={categoryBreakdown}
            currencySymbol={profile?.currency_symbol || '৳'}
          />
        )}

        {/* Recent Transactions List with Quick Actions */}
        <RecentTransactions
          transactions={transactions.slice(0, 8)}
          currencySymbol={profile?.currency_symbol || '৳'}
          dateFormat={profile?.date_format || 'DD/MM/YYYY'}
          onOpenAddExpense={() => openAddModal('expense')}
          onOpenAddIncome={() => openAddModal('income')}
        />
      </div>

      {/* Quick Add Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        defaultType={modalType}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </DashboardLayout>
  );
}
